// Rauchtest: startet das Spiel headless und prueft Tastatur, Maus und iPad-Touch.
// Aufruf: node tests/smoke.js   (benoetigt das npm-Paket "playwright")
const { chromium, devices } = require("playwright");
const path = require("path");
const url = "file://" + path.resolve(__dirname, "..", "index.html");
let failed = 0;
const check = (name, ok, info) => { console.log((ok ? "OK   " : "FAIL ") + name + (info ? " " + JSON.stringify(info) : "")); if (!ok) failed++; };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const watch = p => { p.on("pageerror", e => errors.push(e.message)); p.on("console", m => m.type() === "error" && errors.push(m.text())); };

  // Desktop: Tastatur
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  watch(page);
  await page.goto(url);
  check("Menue beim Start", await page.evaluate(() => __game.state) === "menu");
  await page.keyboard.press("Space");
  check("Leertaste startet das Spiel", await page.evaluate(() => __game.state) === "play");
  const x0 = await page.evaluate(() => __game.ship.x);
  await page.keyboard.down("ArrowLeft"); await page.waitForTimeout(400); await page.keyboard.up("ArrowLeft");
  const x1 = await page.evaluate(() => __game.ship.x);
  check("Pfeiltaste links bewegt das Schiff", x1 < x0 - 50, { x0, x1 });
  await page.keyboard.down("Space"); await page.waitForTimeout(600);
  check("Leertaste schiesst", await page.evaluate(() => __game.bullets.length) > 0);
  await page.keyboard.up("Space");
  await page.keyboard.press("KeyP");
  check("P pausiert", await page.evaluate(() => __game.state) === "pause");
  await page.keyboard.press("KeyP");

  // Power-ups
  await page.evaluate(() => { __game.dropPowerup("triple", __game.ship.x, __game.ship.y - 5); });
  await page.waitForTimeout(150);
  check("Dreifachschuss wird eingesammelt", await page.evaluate(() => __game.power.triple) > 5);
  await page.evaluate(() => { __game.bullets.length = 0; });
  await page.keyboard.down("Space"); await page.waitForTimeout(60);
  const volley = await page.evaluate(() => __game.bullets.length);
  await page.keyboard.up("Space");
  check("Dreifachschuss feuert 5 Schuesse pro Salve", volley >= 5 && volley % 5 === 0, { volley });
  await page.evaluate(() => { __game.dropPowerup("shield", __game.ship.x, __game.ship.y - 5); });
  await page.waitForTimeout(150);
  check("Schutzschild wird eingesammelt", await page.evaluate(() => __game.power.shield) === true);
  const lives0 = await page.evaluate(() => { __game.ship.invuln = 0; __game.rocks.length = 0; __game.spawnRock(1, __game.ship.x, __game.ship.y); return __game.lives; });
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => ({ lives: __game.lives, shield: __game.power.shield }));
  check("Schild faengt einen Treffer ab", after.lives === lives0 && after.shield === false, after);
  // Extra-Leben: erst ein Leben verlieren, dann mit dem Herz zurueckholen
  await page.evaluate(() => { __game.power.shield = false; __game.ship.invuln = 0; __game.rocks.length = 0; __game.spawnRock(1, __game.ship.x, __game.ship.y); });
  await page.waitForTimeout(100);
  const lv1 = await page.evaluate(() => __game.lives);
  await page.evaluate(() => { __game.dropPowerup("life", __game.ship.x, __game.ship.y - 5); });
  await page.waitForTimeout(150);
  const lv2 = await page.evaluate(() => __game.lives);
  check("Herz-Power-up gibt ein Leben zurueck", lv1 < 3 && lv2 === lv1 + 1, { lv1, lv2 });

  // Kometen und Space-Wurm
  await page.evaluate(() => { __game.rocks.length = 0; __game.ship.invuln = 5; const c = __game.spawnComet(__game.ship.x, true, __game.ship.y - 150); c.vx = 0; c.vy = 0; });
  await page.keyboard.down("Space");
  await page.waitForFunction(() => __game.worm !== null, null, { timeout: 3000 }).catch(() => {});
  await page.keyboard.up("Space");
  check("Wurm-Komet setzt einen Wurm frei", await page.evaluate(() => __game.worm !== null));
  await page.evaluate(() => { __game.rocks.length = 0; __game.ship.invuln = 0; __game.power.shield = false; });
  await page.waitForFunction(() => __game.worm && __game.worm.state === "grab", null, { timeout: 15000 }).catch(() => {});
  const wState = await page.evaluate(() => __game.worm && __game.worm.state);
  check("Wurm faengt das Schiff ein", wState === "grab", { wState });
  const livesBefore = await page.evaluate(() => __game.lives);
  await page.keyboard.down("Space");
  await page.waitForFunction(() => __game.worm === null, null, { timeout: 4500 }).catch(() => {});
  await page.keyboard.up("Space");
  const livesAfter = await page.evaluate(() => __game.lives);
  check("Wurm besiegt: befreit und ein Extra-Leben (bis maximal 4)", await page.evaluate(() => __game.worm === null) && livesAfter === Math.min(4, livesBefore + 1), { livesBefore, livesAfter });
  // Ring-Asteroiden: durch das Loch schiessen gibt Bonus, daneben wird der Schuss geblockt
  await page.evaluate(() => { __game.rocks.length = 0; __game.ship.invuln = 5; __game.bullets.length = 0; __game.hoops.length = 0; window.__h = __game.spawnHoop(__game.ship.x + 30, __game.ship.y - 200); window.__h.vx = 0; window.__h.vy = 0; });
  await page.keyboard.down("Space"); await page.waitForTimeout(700); await page.keyboard.up("Space");
  const blocked = await page.evaluate(() => ({ done: window.__h.done, bullets: __game.bullets.filter(b => Math.abs(b.x - window.__h.x) < 50 && b.y < window.__h.y).length }));
  check("Schuss daneben wird vom Ring geblockt (kein Bonus)", blocked.done === false && blocked.bullets === 0, blocked);
  await page.evaluate(() => { __game.hoops.length = 0; __game.bullets.length = 0; window.__h = __game.spawnHoop(__game.ship.x, __game.ship.y - 200); window.__h.vx = 0; window.__h.vy = 0; });
  const scoreBefore = await page.evaluate(() => __game.score);
  await page.keyboard.down("Space"); await page.waitForTimeout(700); await page.keyboard.up("Space");
  const through = await page.evaluate(() => ({ done: window.__h.done, score: __game.score }));
  check("Durchschuss durch das Loch gibt 250 Bonuspunkte", through.done === true && through.score >= scoreBefore + 250, { scoreBefore, ...through });

  await page.keyboard.press("KeyM");
  check("M schaltet den Ton aus", await page.evaluate(() => __game.muted) === true);
  await page.keyboard.press("KeyM");

  // Desktop: Maus
  await page.mouse.move(300, 300); await page.mouse.move(500, 400); await page.waitForTimeout(600);
  const sp = await page.evaluate(() => __game.ship);
  check("Schiff folgt der Maus", Math.abs(sp.x - 500 / 1.2) < 30 && Math.abs(sp.y - 400 / 1.2) < 30, { x: sp.x, y: sp.y });
  await page.mouse.down(); await page.waitForTimeout(500);
  check("Mausklick schiesst", await page.evaluate(() => __game.bullets.length) > 0);
  await page.mouse.up();

  // iPad: Touch, quer und hochkant
  for (const vp of [{ width: 1180, height: 820 }, { width: 820, height: 1180 }]) {
    const ctx = await browser.newContext({ ...devices["iPad (gen 7)"], viewport: vp, hasTouch: true });
    const t = await ctx.newPage(); watch(t);
    await t.goto(url);
    await t.touchscreen.tap(vp.width / 2, vp.height / 2);
    check(`Tippen startet das Spiel (${vp.width}x${vp.height})`, await t.evaluate(() => __game.state) === "play");
    const cdp = await ctx.newCDPSession(t);
    const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await touch("touchStart", vp.width / 2, vp.height * 0.8);
    await touch("touchMove", vp.width * 0.25, vp.height * 0.7);
    await t.waitForTimeout(700);
    const g = await t.evaluate(() => ({ x: __game.ship.x, W: __game.W, bullets: __game.bullets.length }));
    check(`Schiff folgt dem Finger (${vp.width}x${vp.height})`, g.x < g.W * 0.4, g);
    check("Touch schiesst automatisch", g.bullets > 0);
    await touch("touchEnd");
    await ctx.close();
  }

  check("Keine Konsolenfehler", errors.length === 0, errors);
  await browser.close();
  process.exit(failed ? 1 : 0);
})();

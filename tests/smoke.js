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

# Star Destroyer

Asteroiden-Shooter im Browser, gebaut von Vater und Sohn. Weiche Asteroiden aus oder schiesse sie kaputt.

Das Spiel besteht aus einer einzigen Datei (`index.html`) und laeuft ohne Installation.

## Steuerung

| Geraet | Bewegen | Schiessen | Pause |
|---|---|---|---|
| iPad / Touch | Finger ziehen | automatisch | pausiert beim Verlassen der Seite |
| Maus | Maus bewegen | Klick halten | P |
| Tastatur | Pfeile oder WASD | Leertaste | P |
| Gamepad | Stick / Steuerkreuz | A (oder andere Taste) | Start |

## Power-ups und Ton

- **3-Fach-Schuss** (gruen): 10 Sekunden lang feuert das Schiff fuenf statt zwei Schuesse.
- **Schutzschild** (blau): faengt einen Treffer ab.
- **Herz** (rot): gibt ein verlorenes Leben zurueck (maximal 3).
- Manche zerstoerten Asteroiden lassen Power-ups fallen, einfach einsammeln.

## Kometen und Space-Wurm

- Kometen mit langem Schweif sind schnell und geben mehr Punkte.
- Aus gruen leuchtenden Kometen schluepft ein **Space-Wurm**, der das Schiff verfolgt. Beruehrt er es, ist es gefangen: Jetzt schnell schiessen, bis der Wurm besiegt ist, sonst kostet es ein Leben. Ein Schutzschild wehrt den Wurm einmal ab.
- Die durchsichtigen Asteroiden im Hintergrund sind nur Deko: Man kann einfach durch sie hindurchfliegen.
- Alle Sounds werden vom Browser selbst erzeugt. Ton an/aus mit **M** oder dem Lautsprecher-Symbol oben rechts. Auf dem iPad startet der Ton nach dem ersten Tippen, und der Stummschalter am iPad schaltet ihn ebenfalls stumm.

## Lokal testen

Datei `index.html` im Browser oeffnen, oder `python3 -m http.server` starten und `http://localhost:8000` aufrufen.

## Online (GitHub Pages)

Jeder Push auf `main` veroeffentlicht das Spiel automatisch. In den Repo-Einstellungen unter Settings > Pages muss als Source "GitHub Actions" gewaehlt sein.

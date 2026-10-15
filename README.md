# Operation Tidebreaker

Play it in the browser at [https://brianpenny54321-cell.github.io/Epic-FPS-Historical-Eras/](https://brianpenny54321-cell.github.io/Epic-FPS-Historical-Eras/). That address serves this `tidebreaker-rebuild` branch. `main` is not this build and is not modified by this work.

Original procedural geometry and generated stills. No ripped aircraft meshes, audio, or UI from Ace Combat, Modern Warfare, or any other commercial game. Those titles are presentation direction only: arcade flight, locks, radar, a dense HUD, and short mission cards.

## Hangar

Pick an airframe before a jet sortie. Names are the real airframes; the meshes are original planform studies, not licensed models.

| Id | Airframe | Role |
| --- | --- | --- |
| a10 | A-10C Thunderbolt II | Jet (default) |
| f22 | F-22 Raptor | Jet |
| f35 | F-35 Lightning II | Jet |
| b2 | B-2 Spirit | Jet |
| apache | AH-64 Apache | Helicopter |
| mh6 | MH-6 Little Bird | Helicopter |
| ac130 | AC-130 Super Hercules | Gunship orbit |

Older ids `strike`, `lance`, and `dart` still resolve to the A-10C, F-35, and F-22.

## Sorties

1. **First Light** — A-10C (or any jet) over a fictionalized Kharg gulf. Sink the raiders and the fuel farm.
2. **Angel Lift** — AH-64. Set down, walk to the downed pilot, and hoist them back to the landing zone.
3. **Iron Gate** — Strait defense. Splash inbound cruise missiles before they reach the carrier. Deck guns are already firing.
4. **Skimmer** — Sink the fast craft. Stay low.
5. **Black Keel** — Submarine. Torpedo a fictional raider capital and its escorts. Not a real-world strike package.
6. **Harbor Light** — AC-130 side cannon in orbit. A fictional regime-security unit is pushing harbor civilians. Do not hit the civilians.

Sorties 2–6 open on a still card. Skip or start from that card.

## Controls

Chase camera. A banks or yaws **left**. D banks or yaws **right**.

- Jet: W / S pitch, A / D bank, Q / E rudder, arrows throttle, Space afterburner, Shift or X airbrake, T next target, F cannon, R fox-2, C cockpit
- Helicopter: Space climb, Shift descend, R dismount / hoist (not a missile)
- On foot: WASD, mouse look, R hoist
- Gunship: auto orbit, A / D slew aim, W / S range, F side cannon
- Submarine: A / D turn, W rise, S dive, R torpedo
- Phone: left stick flies, right pad looks, AB, BRK, GUN, FOX-2

If the graphics device drops the WebGL context, the page keeps the canvas and rebuilds the program when the browser restores it.

## Run locally

Node.js 20+. From this folder:

```bash
npm test
npm run dev
```

Then open the local page the script prints.

## Build

`npm run build` writes the static site to `dist/`.

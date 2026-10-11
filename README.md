# Operation Tidebreaker

Playable browser combat-flight prototype on the `tidebreaker-rebuild` branch. `main` is unchanged and is not the flight build.

You fly an original TB-10 strike jet (A-10-style planform: straight wing, twin engines, twin tails, nose cannon) over a fictionalized Kharg island gulf. Sink the raider ships and the fuel farm. Procedural geometry only — no licensed aircraft meshes, audio, or UI from other games.

**Controls**

- W / S — pull up / nose down
- A / D — bank left / bank right (the bank turns the jet)
- Q / E — rudder
- Mouse — fine aim after clicking the view
- Space — afterburner (hold; fuel bar drains, then recovers)
- Shift or X — airbrake
- Arrow keys — throttle
- T — next target
- F or click — cannon
- R — fox-2 missile once the lock ring closes
- C — cockpit / chase
- Phone: left stick flies, right pad yaws, AB, BRK, GUN, and FOX-2

Pick TB-10 Strike, TB-4 Lance, or TB-7 Dart on the briefing screen before launch.

## Run locally

Node.js 20+. From this folder:

```bash
npm test
npm run dev
```

Then open the local page the script prints.

## Build

`npm run build` writes the static site to `dist/`. GitHub Pages deploys only from `main` (not this branch).

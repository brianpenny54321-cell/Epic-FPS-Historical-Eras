# Project Instructions — Epic FPS Historical Eras

## Purpose
This repository is the source of truth for the public Epic FPS: Historical Eras browser game. The immediate priority is Operation Tidebreaker: establish a reliable, visually credible, playable proof of concept before expanding into other historical eras or launch polish.

## Standing user working preference
The user is a layperson/nontechnical requester. When the user describes a goal in ordinary language, proactively translate it into the most effective technical task internally.

- Infer the underlying objective, constraints, acceptance criteria, dependencies, and best implementation approach.
- Optimize for maximum performance and useful work with minimum unnecessary tokens.
- Do not require the user to learn technical prompting.
- Address the underlying problem, not merely a workaround.
- Ask for clarification only when genuinely necessary to avoid an incorrect or destructive result.
- Prefer execution over lengthy explanations.
- Preserve the user's stated constraints even when translating their request into technical language.

## Execution standard
For substantive changes:
1. Inspect the current repository/code and existing behavior first.
2. Make the smallest robust change that solves the underlying problem.
3. Run relevant tests, lint, and build checks.
4. Debug failures rather than stopping at the first error.
5. Re-run validation after fixes.
6. Deploy when appropriate.
7. Verify deployment using available evidence.
8. Never claim a device, browser, workflow, deployment, or feature was verified unless it was actually verified.
9. Preserve working functionality while fixing another issue.
10. Report concrete blockers honestly rather than guessing.

## Current development priority
### Operation Tidebreaker comes first
Do not divert substantial effort into additional historical eras, secondary features, or launch polish until Tidebreaker is a validated playable proof of concept.

Priority order:
1. Reliable startup/load.
2. Responsive touch controls on mobile, especially Chrome on iPhone.
3. Actual playable flight/combat loop.
4. Correct 6DOF flight behavior.
5. Credible visuals, aircraft, theater, HUD, and UI.
6. Debug/test/deploy/verify repeatedly.
7. Only after the proof of concept is viable: expand content, additional eras, and broader launch work.

Historical FPS/game assets and files that may be needed later should be preserved rather than deleted or unnecessarily rewritten.

## Tidebreaker target
The intended proof of concept includes:
- True 6DOF aircraft flight: pitch, roll, yaw, coordinated turns, 3D velocity vector, stable altitude behavior.
- 6DOF chase/cockpit camera and useful flight HUD, including pitch ladder/artificial horizon, airspeed and altitude.
- Mobile air-combat controls suitable for touch.
- A Gulf theater with runway, ocean, island, industrial/naval targets, and clouds.
- A recognizable detailed A-10-style attack aircraft with cockpit, wings/pylons, twin engines, tail, and GAU-8-style cannon representation.
- A functional combat loop rather than a static visual mockup.

These are goals and acceptance criteria; implementation may change if a better technical approach produces a more reliable playable result.

## Deployment
- Public repository: brianpenny54321-cell/Epic-FPS-Historical-Eras
- Public GitHub Pages site: https://brianpenny54321-cell.github.io/Epic-FPS-Historical-Eras/
- GitHub Pages is the intended public deployment unless explicitly changed.
- Prefer relative/static-host-safe asset paths.
- Deployment status must be distinguished from code being committed: a commit alone is not proof that GitHub Pages successfully deployed it.
- If the available GitHub interface does not expose a required workflow/deployment result, do not fabricate one. Use the best available evidence and clearly state the limitation.

## Repository safety
- Do not modify the user's separate private First-Video-Game repository.
- Preserve existing project history.
- Avoid destructive rewrites of working code unless necessary.
- Do not delete historical assets merely because they are not part of the current Tidebreaker proof of concept.

## Mobile-first acceptance
Chrome on iPhone is a primary test target.

A successful build must:
- render something meaningful rather than a blank/black screen;
- provide visible startup diagnostics if initialization fails;
- respond to touch;
- transition from startup into an interactive game state;
- maintain usable controls and UI on a phone-sized viewport.

If actual iPhone/Chrome testing is unavailable, say so explicitly and distinguish automated/static validation from real-device verification.

## Communication
The user prefers concise, action-oriented progress updates. Avoid making the user repeatedly restate technical requirements already captured here. When a request is ambiguous, infer the most reasonable implementation consistent with these instructions and existing code, unless the ambiguity could cause a destructive or materially different result.

## Definition of done for the current phase
Operation Tidebreaker is not considered successful merely because:
- code compiles,
- tests pass,
- a GitHub Actions workflow succeeds, or
- a GitHub Pages URL exists.

It must also be a credible, interactive, playable proof of concept with the intended imagery, graphics, UI, and a working gameplay loop. Automated validation and deployment evidence should be accompanied by actual runtime verification whenever that capability is available.

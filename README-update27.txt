UPDATE 27 (WITH MOBILE UI REGRESSION FIX) — Three 3D Cartoon Games + Mobile HUD Fix
(not deployed, not pushed — copy these files into the repo root yourself)

FILES INCLUDED IN THIS ARCHIVE
  MODIFIED  MedicalSimulator.css           Fixed mobile HUD flex wrapping, 2-row mobile topbar, full-width
                                           stage title, unclipped objective/station chips, RTL thumb controls,
                                           and non-overlapping proximity prompt & viewport sizing
  MODIFIED  MedicalSimulator.tsx           Added visualViewport & orientationchange resize listeners + hid
                                           top controls hint when proximity prompt is active
  NEW/FIXED Cartoon3DGameShell.css         Fixed .c3d-fictional-ribbon & .c3d-inventory-bar wrapping on mobile
  NEW/FIXED Cartoon3DGameShell.tsx         Added visualViewport & orientationchange resize listeners + hid
                                           top controls hint when proximity prompt is active
  NEW       cartoon3DSceneBuilder.ts       3D WebGL scene builder for Lab, ER, and Multi-Room Escape Lab
  NEW       bacteriaLabData.ts             Game 1 (Bacteria Lab 3D): 4 missions, microscope & AST puzzles (AR/EN)
  NEW       BacteriaLab.tsx                Route component for /bacteria-lab
  NEW       emergencyShiftData.ts          Game 2 (Emergency Shift 3D): 4 ER scenarios, triage & allergy workflows (AR/EN)
  NEW       EmergencyShift.tsx             Route component for /emergency-shift
  NEW       escapeTheLabData.ts            Game 3 (Escape the Lab 3D): 4 stages across 3 connected rooms + hints (AR/EN)
  NEW       EscapeTheLab.tsx               Route component for /escape-the-lab
  MODIFIED  simulatorProgressCloud.ts      Extended with backward-compatible gameId parameter ('medicalSimulator' default)
  MODIFIED  useSimulatorProgressSync.ts    Extended with optional gameId parameter ('medicalSimulator' default)
  MODIFIED  GameCenter.tsx                 Added 3 new 3D game cards alongside Medical Life Simulator & Bacteria Hunter
  MODIFIED  GameCenter.css                 Added visual banner gradients for lab3d, er3d, and escape3d cards
  MODIFIED  App.tsx                        Added lazy-loaded routes: /bacteria-lab, /emergency-shift, /escape-the-lab

ROOT CAUSES OF THE MOBILE UI REGRESSION & HOW THEY WERE FIXED
  1. Narrow vertical pill wrapping on Arabic titles/ribbons:
     - Root Cause: `.ms-immersive .ms-topbar`, `.ms-topbar-left`, and `.ms-title-block` forced `flex-wrap: nowrap`
       on a single horizontal row alongside 5 toolbar buttons and the Exit button. On mobile widths (360px–412px),
       `.ms-topbar-actions` (~210px) + `.ms-exit-btn` (~80px) left only ~50–60px for `.ms-title-block`, squeezing
       `.ms-scenario-pill` and `.c3d-fictional-ribbon` into a narrow vertical column with `border-radius: 999px`.
     - Fix: Used a responsive 2-row header on mobile (`<= 680px`) via `display: contents` on `.ms-topbar-left` so
       Row 1 holds the Exit button + Action toolbar buttons on opposite edges (matching Bacteria Hunter's `.bh-gamebar`),
       while Row 2 gives `.ms-title-block` and `.ms-scenario-pill` 100% full width (`white-space: normal; border-radius: 8px`).
       Also hid the redundant secondary `.c3d-fictional-ribbon` inside `.ms-topbar` on screens `< 1180px`.

  2. Overlapping / clipped Objective, Clues, Keycards, and 3D Viewport overlays:
     - Root Cause: `.ms-immersive .ms-objective-bar` forced `flex-wrap: nowrap; max-height: 4.6em; overflow: auto` with
       `.ms-objective-chips { max-width: 55% }`, squeezing the objective text against the chips. Meanwhile, `.ms-session-bar`
       remained visible inside the `100dvh` container, and `.ms-controls-hint-banner`, `.ms-proximity-prompt`, and
       `.ms-hud-controls` were all absolutely positioned inside the shortened `.ms-viewport` simultaneously.
     - Fix: Stacked `.ms-objective-bar` vertically (`flex-direction: column`) so objective text gets 100% full width above
       wrapped, unclipped station clue chips and keycard chips; hid `.ms-session-bar` during `.ms-immersive` full-screen play
       (matching Bacteria Hunter); suppressed `.ms-controls-hint-banner` whenever `.ms-proximity-prompt` is active; and
       positioned `.ms-proximity-prompt` cleanly above `.ms-hud-controls` in portrait and at `top: 8px` in landscape.

  3. 3D Canvas / Viewport Resize & Orientation Handling:
     - Added `window.orientationchange` (with post-rotation re-measure) and `window.visualViewport` resize listeners
       alongside `ResizeObserver` in both `MedicalSimulator.tsx` and `Cartoon3DGameShell.tsx`, matching `BacteriaHunter.tsx`.

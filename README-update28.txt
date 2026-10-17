=============================================================================
ANTIBIOTIC AWARENESS — UPDATE 28 (MASTER PROMPT IMPLEMENTATION)
Nurse Academy 3D (10 Scenarios) + Medical Mystery 3D (10 Cases) + Mobile UI Fix
=============================================================================

1. INCLUDED FILES IN THIS ARCHIVE (FLAT REPOSITORY STRUCTURE)
-------------------------------------------------------------
Drop these files directly into the root of your repository:

A) New Nurse Academy 3D Game (/nurse-academy):
   - NurseAcademy.tsx          (Route component for /nurse-academy)
   - nurseAcademyData.ts       (10 playable 3D nursing scenarios, AR/EN dialogues & checklists)

B) New Medical Mystery 3D Game (/medical-mystery):
   - MedicalMystery.tsx        (Route component for /medical-mystery)
   - medicalMysteryData.ts     (10 distinct playable 3D investigation cases, clue chains & reveals)

C) Upgraded Shared 3D Engine, Animation, Evidence Journal & Cloud Sync:
   - cartoon3DSceneBuilder.ts  (Added 'nurse_academy' & 'medical_mystery' 3D world presets,
                               7 new 3D interactive stations, smooth lerpAngle turning,
                               NPC conversational/reaction gestures, 3D floating particles,
                               and ResizeObserver aspect-ratio safety)
   - Cartoon3DGameShell.tsx    (Added Interactive Evidence Journal 📓 modal, Nursing Safety
                               Checklists, clue-chain prerequisite enforcement, skippable
                               cinematic camera fly-in, WebAudio sound effects + mute toggle,
                               and prefers-reduced-motion support)
   - Cartoon3DGameShell.css    (Responsive mobile/tablet/desktop RTL & LTR layout fixes +
                               styles for Evidence Journal, Nursing Checklists & Cinematic Banner)
   - simulatorProgressCloud.ts (Added 'nurseAcademy' & 'medicalMystery' cloud game IDs with
                               safe union merge per UID and guest localStorage fallback)

D) Mobile UI Regression Fixes & Preserved Games:
   - MedicalSimulator.tsx      (ResponsiveResizeObserver & preserved 10 levels + 5 scenarios)
   - MedicalSimulator.css      (Mobile HUD flex-wrap, title pill fix, non-overlapping panels)
   - BacteriaLab.tsx & bacteriaLabData.ts
   - EmergencyShift.tsx & emergencyShiftData.ts
   - EscapeTheLab.tsx & escapeTheLabData.ts

E) Game Center & Routing Integration:
   - GameCenter.tsx            (Added Nurse Academy 3D & Medical Mystery 3D cards + 3D SVG art)
   - GameCenter.css            (Added .nurse3d and .mystery3d visual banner themes)
   - App.tsx                   (Added lazy-loaded /nurse-academy and /medical-mystery routes)
   - firestore.rules           (Verified existing user-isolated rule covers all gameProgress docs)

2. FIREBASE / FIRESTORE NOTES
-----------------------------
No manual changes in Firebase Console are needed!
Your existing `firestore.rules` already includes:
  match /users/{uid} {
    allow read, write: if isSignedIn() && request.auth.uid == uid;
    match /{subcollection=**} {
      allow read, write: if isSignedIn() && request.auth.uid == uid;
    }
  }
This automatically secures:
  - users/{uid}/gameProgress/nurseAcademy
  - users/{uid}/gameProgress/medicalMystery
alongside your existing games.

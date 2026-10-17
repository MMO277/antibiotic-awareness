UPDATE 27 — Three New Independent 3D Cartoon Games (Bacteria Lab, Emergency Shift, Escape the Lab)
(not deployed, not pushed — copy these files into the repo root yourself)

FILES INCLUDED IN THIS UPDATE
  NEW       cartoon3DSceneBuilder.ts       3D WebGL scene builder for Lab, ER, and Multi-Room Escape Lab
  NEW       Cartoon3DGameShell.tsx         Reusable 3D game shell, HUD, Microscope/AST/Triage widgets, Cloud Gate
  NEW       Cartoon3DGameShell.css         Scoped styles for Microscope mini-game, AST table, Triage card, Inventory
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

NEW ROUTES & STABLE GAME IDs
  1. Bacteria Lab 3D      -> Route: /#/bacteria-lab      | Firestore gameId: bacteriaLab
  2. Emergency Shift 3D   -> Route: /#/emergency-shift   | Firestore gameId: emergencyShift
  3. Escape the Lab 3D    -> Route: /#/escape-the-lab    | Firestore gameId: escapeTheLab
  (Existing /#/medical-simulator and /#/game routes and their saved progress are 100% untouched.)

DATABASE / FIRESTORE & SECURITY RULES
  Documents (created automatically on first completed mission when signed in):
    - users/{uid}/gameProgress/medicalSimulator   (existing)
    - users/{uid}/gameProgress/bacteriaLab        (new)
    - users/{uid}/gameProgress/emergencyShift     (new)
    - users/{uid}/gameProgress/escapeTheLab       (new)
  Fields:
    schemaVersion(1), gameId, completedIds[], earnedBadgeIds[], lastPlayedId|null, updatedAt(serverTimestamp)
  Firestore Rules:
    NO CHANGE NEEDED in firestore.rules! The existing owner-only rule:
      match /users/{uid} {
        allow read, write: if isSignedIn() && request.auth.uid == uid;
        match /{subcollection=**} {
          allow read, write: if isSignedIn() && request.auth.uid == uid;
        }
      }
    already covers all documents inside users/{uid}/gameProgress/{gameId} and enforces strict per-user isolation.
  Manual Firebase Console steps:
    None required (no composite index needed, no new collection rules needed as long as firestore.rules is deployed).

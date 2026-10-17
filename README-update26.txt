UPDATE 26 — Cloud-saved Medical Life Simulator progress + immersive full screen
(not deployed, not pushed — copy these files into the repo root yourself)

FILES
  NEW       simulatorProgressModel.ts      pure normalize / union-merge logic (no Firebase)
  NEW       simulatorProgressCloud.ts      Firestore read + transactional merge-write, per-account cache
  NEW       useSimulatorProgressSync.ts    debounced / retrying save hook
  MODIFIED  MedicalSimulator.tsx           progress gate (loading state), cloud save, immersive layout
  MODIFIED  MedicalSimulator.css           true full-screen layout, compact HUD, safe areas, landscape
  MODIFIED  useGamingMode.ts               additive only: enter({native:false}), toggleNative, nativeSupported
                                           (Bacteria Hunter calls are unchanged and keep working)

DATABASE / FIRESTORE
  Document : users/{uid}/gameProgress/medicalSimulator   (created automatically on first save)
  Fields   : schemaVersion(1), completedIds[], earnedBadgeIds[], lastPlayedId|null, updatedAt(server time)
  Rules    : NO CHANGE NEEDED. The existing rule
               match /users/{uid} { match /{subcollection=**} { allow read, write: if request.auth.uid == uid } }
             already limits this path to its owner. firestore.rules is intentionally NOT included.
  Manual   : none (no index, no console step). Make sure the rules deployed in Firebase match the repo's.

MANUAL TEST PLAN
  1 Sign in on device A, open Medical Simulator, finish Level 1 (Level 2 unlocks).
  2 Firebase console > Firestore > users > <uid> > gameProgress > medicalSimulator: completedIds has Level 1.
  3 Reload; Level 2 still unlocked, no "locked" flash (a "Loading your progress..." screen shows first).
  4 Sign in with the same account on device B: same progress.
  5 Sign in with a different account: separate progress.
  6 Guest mode: progress is local only (cloud chip shows the disk icon); no Firestore doc is written.
  7 Sign in after guest play: a banner offers to merge device progress (Merge / No thanks).
  8 Mobile: game fills the screen; tap the scene once for native fullscreen, or use the full-screen button;
    Exit (X) always visible; rotate to landscape; check joystick / Interact button / dialogue buttons.
  9 Bacteria Hunter (/game): start a run, fullscreen + exit still work.

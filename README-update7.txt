Update 7 (4 files) - upload ALL of them to the repo root (same place as App.tsx).
Needs updates 1 to 6 already applied.

NEW file
1. assistantReplies.ts  -> the assistant's ready-made replies (Arabic + English)

REPLACED files
2. assistantLogic.ts    -> smarter assistant brain
3. Assistant.tsx        -> chat page that shows the new reply types
4. Layout.tsx           -> the short "educational only" sentence now shows on the HOME page only

WHAT CHANGED IN THE ASSISTANT
- Each question gets its own answer: only the sentences that answer the question are shown, with the topic name in the first line.
- If you name a medicine (Arabic, English or brand), it answers from that medicine page and picks the part you asked about:
  uses, side effects, interactions, pregnancy, contraindications, how it works, patient tips.
- Questions that need a doctor (dose, which antibiotic, stop/start, child, pregnancy, symptoms) each get their own reply, not one reply for all.
- Greetings, thanks and "what can you do" get their own replies.
- If nothing matches, it suggests related topics instead of one fixed sentence.
- Understands more everyday Egyptian words and spelling variants (for example اموكسيسيللين).
- Still answers only from the site content. No doses, no diagnosis, no invented facts.

FIREBASE / DATABASE
- NO change. Do not touch the Rules. Nothing is written to or deleted from the database.

ORDER
1. Upload the 4 files on GitHub (replace the old ones), commit, wait for the green build.
2. Open the site, press refresh (on the phone: close the tab and open the link again).
3. Check: home page shows the sentence; open Medicines or Assistant: the sentence is not there.

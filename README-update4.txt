Update 4 (11 files) - upload ALL of them to the repo root (same place as App.tsx).
Needs updates 1, 2 and 3 already applied.

NEW files
1. Assistant.tsx      -> the learning assistant page (/assistant)
2. assistantLogic.ts  -> assistant brain: safety checks + search inside site content
3. researchStats.ts   -> percentage calculation for the survey

REPLACED files
4. Research.tsx       -> survey now asks name + age (random code removed)
5. ResearchTab.tsx    -> admin tab: know / partial / don't-know %, by age, per question, table, CSV
6. App.tsx, 7. Layout.tsx -> new /assistant page + menu item
8. i18n.tsx           -> new Arabic/English texts (consent text now says name + age are saved)
9. Methodology.tsx    -> privacy + assistant text corrected to match reality
10. styles.css        -> styles for chat and percentage bars
11. firestore.rules   -> survey now accepts name + age

ORDER
1. Upload the 11 files on GitHub, commit, wait for the green build.
2. Firebase > Firestore > Rules: paste firestore.rules, press Publish.
   (Without this step the survey cannot save, because the old rules reject name/age.)
3. Sign in to /admin > Research tab: tick "Enable survey" and write the ethics approval reference.

NOTES
- The assistant needs no keys, no server and costs nothing. It answers only from site content.
- Names/ages are readable by admins only (rules). Old responses (with random code) still show.

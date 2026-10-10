UPDATE 5: the remaining medicines (2 files)
Upload BOTH files to the repo root (same place as App.tsx). They replace seedData.ts and add seedMore.ts.

WHAT CHANGED
- The 7 medicines that had only a name + class are now complete (all 13 fields, Arabic + English):
  azithromycin, doxycycline, cephalexin, cefuroxime, ceftriaxone, metronidazole, nitrofurantoin.
- 3 new medicines were added so more drug-class categories have data:
  ciprofloxacin (Fluoroquinolone), clindamycin (Lincosamide), co-trimoxazole (Sulfonamide).
- Result: 12 medicines, 12 drug-class categories, every category has data.
- Every record: one official source (MedlinePlus page, read 2026-10-10) with its link, saved as DRAFT.

AFTER THE BUILD IS GREEN
1. Open /admin, sign in, Medicines tab.
2. Press "تحميل القائمة الأولية (مسودات)" (Load starter list). The message says how many drafts were created/upgraded.
   - The 7 bare records are upgraded; the 3 new ones are created.
   - A record someone already edited is never overwritten.
3. The records appear to visitors with an "unreviewed" warning only if the admin tick-box
   "show source-based records..." is on. They are NOT approved.

FOR THE SUPERVISORS (before pressing Approve)
- Check the text against the official drug label (DailyMed or your national authority).
- Add milligram strengths, age limits and dosing from the official label (the source pages do not give them).
- Add local (Egyptian) brands, manufacturers and barcodes only from an official local source.
- Fill "review date" and "reviewer name". Approval is blocked until they are filled.
- Take extra care with ciprofloxacin, clindamycin and metronidazole: their source pages start with an IMPORTANT WARNING.
- The Arabic is an AI translation and needs a language check too.

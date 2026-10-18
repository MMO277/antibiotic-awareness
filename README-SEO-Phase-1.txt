SEO Phase 1 - Antibiotic Awareness
===================================

STATUS: NOT BUILD-TESTED.
npm install / npm run build could not run in the environment where these
files were prepared (no network access). The build, the full TypeScript check,
the preview, and the contents of dist/index.html have NOT been verified.
Only the following were checked: JSON-LD is valid JSON, the HTML tags are
balanced, there are no duplicate meta tags, and the title expression compiles
under strict TypeScript in an isolated file.

FILES IN THIS PACKAGE (complete files, not diffs)
-------------------------------------------------
1. index.html   -> goes in the project ROOT (next to package.json)
2. i18n.tsx     -> goes in the project ROOT (next to main.tsx)

WHAT CHANGED
------------
i18n.tsx (1 line replaced by 5):
  - document.title used to become the app name in ONE language after JS ran.
  - It is now bilingual, matching the static <title> in index.html:
      Arabic UI : "الوعي بالمضادات الحيوية | Antibiotic Awareness"
      English UI: "Antibiotic Awareness | الوعي بالمضادات الحيوية"
  - appName itself is unchanged (it is used in the UI). lang/dir switching
    logic is unchanged.

index.html (19 lines added, nothing removed):
  - twitter:title, twitter:description, twitter:image added
    (same text and image as the existing Open Graph tags).
  - A minimal WebSite JSON-LD block: name, url, inLanguage. No organization,
    author, reviewer or medical claims.
  - A short <noscript> after <div id="root"> (outside it), in Arabic and
    English, with a link to https://mmo277.github.io/antibiotic-awareness/

NOT CHANGED
-----------
Firebase, router (HashRouter), medicine data, vite.config.ts, package.json,
the deploy workflow, sitemap.xml, robots.txt, and every other file.

HOW TO APPLY (safely)
---------------------
1. Back up the project first:
   - Copy the whole project folder somewhere else, or at minimum copy the two
     originals:  index.html -> index.html.orig   i18n.tsx -> i18n.tsx.orig
2. Work on a separate branch, never on main:
     git checkout -b seo-phase-1
3. Copy the two files from this package over the ones in the project root.
4. Review the change:
     git diff
   Expect only index.html (+19) and i18n.tsx (+4/-1). Anything else = stop.
5. Test locally BEFORE committing:
     npm install
     npm run build
     npx tsc --noEmit
     npm run preview
   Then check:
   a. dist/index.html: icon links (favicon.svg, favicon-48.png,
      favicon-192.png, apple-touch-icon.png) must resolve under
      /antibiotic-awareness/. If any still starts with "/" alone
      (href="/favicon.svg"), report it before going further.
   b. Open the site, switch Arabic/English: the tab title, lang, and
      RTL/LTR direction must change correctly.
   c. Open /#/medicines, /#/articles, login, and the admin page.
6. Only if everything passes: commit on seo-phase-1. Merge/deploy is YOUR
   decision; deploying happens by pushing to main (GitHub Actions).

HOW TO ROLL BACK
----------------
  - Restore the .orig copies, or:  git checkout main -- index.html i18n.tsx
  - Or simply delete the seo-phase-1 branch without merging.

NOTES
-----
- Nothing here guarantees indexing or any ranking in Google.
- Do not start Phase 2 until the checks in step 5 pass.

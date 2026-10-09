# Antibiotic Awareness – الوعي بالمضادات الحيوية

Educational website for a nursing graduation project. React + TypeScript + Firebase (Authentication + Firestore). Arabic (RTL) and English.

**This site is educational only.** It does not diagnose, prescribe, or calculate personal doses.

## How the medical-safety design works (read this first)

* **No medicine data is invented.** The starter list (amoxicillin … nitrofurantoin) contains only the generic name and the broad drug class, saved as **Draft / Unverified**. There are no doses, uses, brands, barcodes, or sources until a person enters them from official references.
* **The public sees ONLY records with status "Approved".** Draft and Pending Review records are hidden by the Firestore rules (not just by the screen).
* **Approval is blocked** unless every field is filled in Arabic and English, at least one https source exists, a review date and reviewer name are filled in, and every "verified" brand has a source URL.
* **Roles:** `editor` (can save Draft/Pending Review), `reviewer` (can also Approve/Archive), `admin` (everything, plus users, research settings, delete).
* The site cannot check that a reviewer is really a clinician. **Your supervisor or a pharmacist/physician must review each record before it is approved.**
* Articles and quiz questions are general, non-product education and are labelled "pending review". Have your supervisor review them too.
* Because everything starts as Draft, **the public Medicines page will be empty until you approve records.** That is intentional.

## Setup, step by step

You need: Node.js 20 or newer (https://nodejs.org) and a Google account.

### 1. Install
Open a terminal in this folder and run:
```
npm install
```

### 2. Create the Firebase project (free "Spark" plan)
1. Go to https://console.firebase.google.com and click **Add project**.
2. Name it (for example `antibiotic-awareness`). You can turn Google Analytics off.
3. Wait until it is created, then click **Continue**.

### 3. Add your web app and keys
1. On the project page click the **`</>`** (Web) icon, give the app a name, click **Register app**. Do NOT tick Hosting yet.
2. Firebase shows a `firebaseConfig` block. Copy this file: `.env.example` → `.env.local`.
3. Fill each value of `.env.local` from that block (`apiKey` → `VITE_FIREBASE_API_KEY`, and so on).
4. `.env.local` is already in `.gitignore`. Never upload it to GitHub.

> Firebase web keys identify your project; they are not passwords. Your real protection is the **Firestore rules** (step 6) and only creating admin users yourself.

### 4. Turn on sign-in
Firebase Console → **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save**.

### 5. Create the database
Firebase Console → **Build → Firestore Database → Create database**. Choose a location near you, choose **Production mode**, click **Create**.

### 6. Publish the security rules
1. Firestore Database → **Rules** tab.
2. Delete everything there and paste the full content of `firestore.rules` from this project.
3. Click **Publish**.

### 7. Create the first admin
1. Authentication → **Users → Add user**. Enter your email and a strong password.
2. Copy the **User UID** shown in the table.
3. Firestore Database → **Start collection** → Collection ID: `roles`.
4. Document ID: paste the UID. Add a field: name `role`, type `string`, value `admin`. Save.

(Other staff: create their user in Authentication, then add them in the dashboard **Users** tab with the role `editor` or `reviewer`.)

### 8. Run it
```
npm run dev
```
Open the address shown (usually http://localhost:5173). Go to **Admin**, sign in.

### 9. Load the starter list and review
1. In **Admin → Medicines**, click **Load starter list (drafts)**.
2. Click **Edit** on a medicine. Fill each field in Arabic and English **from an official source**. Add the source title and the exact page URL. Starting points: MedlinePlus, DailyMed, EMA, CDC, and your national drug authority.
3. Set the status to **Pending review**, and save.
4. A reviewer (a different person, ideally a pharmacist or physician) checks it against the sources, fills in **Last reviewed** and **Reviewed by**, and sets **Approved**.

### 10. QR codes and barcodes
* Every medicine page shows a QR code with **Download PNG** and **Print**.
* The QR contains the page link of the website **where you generated it**. Generate the codes you will print from the **deployed** site (step 11), not from `localhost`.
* Barcode scanning works only for brands marked **Verified** (with a source URL) inside **approved** records. Otherwise the app says no verified product matched.
* The camera works only on `https://` sites (or localhost).

### 11. Deploy (free Firebase Hosting)
```
npm install -g firebase-tools
firebase login
firebase use --add        (choose your project)
npm run deploy
```
Firebase shows your live address (`https://YOUR-PROJECT.web.app`).
The app uses hash links (`/#/medicine/...`), so it also works on any static host.

### 12. Optional research survey (pre-test / post-test)
* Keep it **off** until your university and ethics committee approve it.
* Then: Admin → **Research** → tick **Enable survey**, type the approval reference, **Save**.
* It collects no name, email, or identifiers; only a random code (to pair pre and post), the answers, the language, and a time. The questions are the quiz questions in `src/data/quiz.ts`; replace them with your approved instrument.
* **Export CSV** gives you the data with scores.

## Cost
Everything here runs on the free Firebase **Spark** plan (Authentication with email/password, Firestore with daily free quotas, and Hosting with free storage and transfer). Nothing in this project needs the paid Blaze plan. Check the current limits at https://firebase.google.com/pricing . A graduation project is far below them.

## Project map
* `firestore.rules` – security rules and roles
* `src/types.ts` – data model (medicine fields, brands, sources, status)
* `src/lib/medicines.ts` – database functions and the approval checks
* `src/lib/search.ts` – Arabic-friendly search
* `src/pages/` – public pages; `src/pages/admin/` – dashboard and editor
* `src/data/` – starter list, articles, quiz

## Limitations
* Search runs in the browser over approved records (fine for hundreds of records, not for tens of thousands).
* Anyone with the admin password and a role can change data. Use strong passwords; consider enabling multi-factor sign-in in Firebase.
* This code was written without running `npm install` in the build environment. If `npm run build` shows a type error, copy the message and fix or ask for help.

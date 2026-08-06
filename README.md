# Health Tracker

A private, personal calorie/macro/weight tracker. Next.js (App Router) + Firebase Auth/Firestore + USDA FoodData Central for food search.

## Features
- Profile & goals: DOB/age, sex, height, activity level, goal type. Auto-calculates BMR/TDEE (Mifflin-St Jeor) and suggests a daily calorie + macro target.
- Food diary: search the USDA food database, save foods to your personal library, log them by meal (breakfast/lunch/dinner/snack) with adjustable serving quantity.
- Daily weight log.
- Dashboard: today's calories remaining, macro progress, today's weight, logging streak.
- Calendar: browse any past day, color-coded by whether you hit your calorie goal.
- Progress charts: weight trend with moving average and kg/week rate of change, calorie trend vs goal, macro totals over a selected range.

## One-time setup

### 1. Firebase project
1. Create a project at https://console.firebase.google.com.
2. **Build > Authentication > Get started > Sign-in method** → enable **Email/Password**.
3. **Build > Authentication > Users** → add your one user (your email + a password).
4. **Build > Firestore Database > Create database** → start in production mode.
5. In Firestore Rules, paste the contents of [`firestore.rules`](firestore.rules) in this repo and publish.
6. **Project settings > General > Your apps** → add a Web app → copy the config values.

### 2. USDA FoodData Central API key
Get a free key at https://api.data.gov/signup/ (the shared `DEMO_KEY` works for light testing but is heavily rate-limited).

### 3. Environment variables
Copy `.env.local.example` to `.env.local` (already created with placeholders) and fill in your real values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
USDA_FDC_API_KEY=
```

`.env.local` is gitignored — never commit real keys.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000, sign in with the account you created in Firebase Auth, then go to **Settings** to set up your profile and goals.

## Deploying to Vercel
1. Push this repo to GitHub (private repo recommended, since this is personal data).
2. Import it in Vercel, add the same environment variables from `.env.local` in the Vercel project settings.
3. Deploy. Firebase Auth + Firestore work the same in production as they do locally.

## Data model
All data lives under `users/{your-uid}/...` in Firestore: `profile` (on the user doc), `weightLogs/{date}`, `foods/{foodId}` (your personal library), `foodLogs/{logId}`. Firestore security rules restrict all reads/writes to your own authenticated UID.

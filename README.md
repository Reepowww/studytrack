# StudyTrack (prototype)

A lightweight React + Vite dashboard for tracking study habits and academic performance, built on mock data for 6 students.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

The login page supports existing demo profiles and Supabase Auth when configured. Demo profiles remain local test fixtures; Supabase accounts authenticate remotely, while StudyTrack academic records continue to be stored only in this browser.

## Structure
- `src/data/students.js` — mock data + shared calculations
- `src/data/studentData.js` — account-scoped localStorage settings, subject helpers, academic periods, and onboarding state
- `src/pages/` — Dashboard, Study Habits, Academic Performance, personal Analytics, Recommendations, About
- `src/components/` — Sidebar, StatCard, first-use onboarding

## Notes
- Charts via Recharts.
- Demo login remains local and uses the existing six sample profiles; it is not real authentication. The login UI does not display demo credentials, but the existing credentials can still be entered manually.
- Supabase Auth is configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in a local `.env` file. Copy `.env.example` to `.env` and fill in your project values. `.env` is ignored by Git; do not put a Supabase secret/service-role key in a Vite environment variable.
- For GitHub Pages builds, add repository Actions variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; the deployment workflow passes them to Vite at build time. The publishable key is intended for browser use, but service-role/secret keys must never be used here.
- Sign Up and non-demo Login use Supabase Auth only when both environment variables are configured. If email confirmation is enabled in Supabase, users must confirm their address before a session is created. Allow the app URL (including its GitHub Pages path) in Supabase Auth's redirect URL settings.
- Supabase Auth stores authentication state using the SDK. StudyTrack subjects, grades, targets, periods, and study sessions are still device-local; there is no student database query, cloud save, or migration in this phase. Each authenticated user gets a separate local profile on that browser.
- Subjects, editable grades, previous grades, study sessions, academic calendar selection, period grades, and targets are stored in this browser per demo profile. Existing sample records are used as the starting point and are not reset when custom subjects are added.
- Target grades are optional, accept values from 0 to 100 inclusive, and are never inferred from current grades. Missing or invalid saved targets remain unset; use “Clear target” to intentionally remove a saved optional target.
- Subject lists use `studytrack:subjects:<student-id>`. Record snapshots use `studytrack:records:<student-id>`. Calendar and period grades use `studytrack:term:<student-id>` and `studytrack:period-grades:<student-id>`. Onboarding progress uses separate per-student keys. Existing `studytrack:targets:<student-id>` and reminder-plan keys remain in use.
- Renaming a subject updates its saved grades, targets, period grades, sessions, and study-focus plans. Deleting a subject with related records requires confirmation and removes those related records only after confirmation. Failed study-focus saves keep the pending change available for retry.
- Dual Semester stores separate Prelim, Midterm, and Finals entries for each semester. Trimester stores three distinct trimester entries. Period grades are not weighted or combined; changing calendars only changes visible fields and keeps prior period values under their original IDs.
- Reminder previews are simulations. This checkout contains no server-side email-test endpoint or provider configuration, so no real email is sent.
- The first-use wizard is shown for an empty student workspace, can be skipped, and can be replayed from Academic Performance. Existing demo profiles with records continue directly to the app.
- GitHub Actions builds and deploys to GitHub Pages on pushes to `main` or `master`; the Vite base path is derived from the repository name.
- All causal-sounding language avoided per project requirements — insights are framed as "observed patterns" in the sample.

## Checks

```bash
npm test
npm run build
```

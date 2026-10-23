# StudyTrack (prototype)

A lightweight React + Vite dashboard for tracking study habits and academic performance, built on mock data for 6 students.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

The login page supports existing demo profiles and Supabase Auth when configured. Demo profiles remain local test fixtures. Authenticated accounts use Supabase for account identity, subjects, grade records, targets, academic periods, and study sessions; timer state, focus plans, onboarding progress, and some habit summaries remain browser-local.

## Structure
- `src/data/students.js` — mock data + shared calculations
- `src/data/studentData.js` — account-scoped localStorage settings, subject helpers, academic periods, and onboarding state
- `src/pages/` — Dashboard, Study Habits, Academic Performance, personal Analytics, Recommendations, Account, About
- `src/components/` — Sidebar, StatCard, first-use onboarding

## Notes
- Charts via Recharts.
- Demo login remains local and uses the existing six sample profiles; it is not real authentication. The login UI does not display demo credentials, but the existing credentials can still be entered manually.
- Supabase Auth is configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in a local `.env` file. Copy `.env.example` to `.env` and fill in your project values. `.env` is ignored by Git; do not put a Supabase secret/service-role key in a Vite environment variable.
- For GitHub Pages builds, add repository Actions variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; the deployment workflow passes them to Vite at build time. The publishable key is intended for browser use, but service-role/secret keys must never be used here.
- Sign Up and non-demo Login use Supabase Auth only when both environment variables are configured. If email confirmation is enabled in Supabase, users must confirm their address before a session is created. Allow the app URL (including its GitHub Pages path) in Supabase Auth's redirect URL settings.
- Supabase Auth stores authentication state using the SDK. Authenticated accounts can update their display name, request a verified email change, change their password, and request password-reset email from Account. Configure the app URL (including its GitHub Pages path) in Supabase Auth's redirect URL settings for confirmation and recovery links. Demo profiles cannot change account credentials.
- Demo-profile subjects and records are stored in this browser. For signed-in Supabase accounts, subjects are stored in `subjects`, overall current/previous grades and targets in `grades`, per-period grades in `period_grades`, study sessions in `study_sessions`, and the selected calendar in `profiles.term_structure`. Planner-wide settings use `grade_planner_preferences`; per-subject units and period weights use `grade_planner_subject_settings`, related to `subjects`. These are separate related tables keyed to the account and, for grades, the subject; the app does not put all records in one table. Existing sample records are used as the starting point for demo profiles and are not reset when custom subjects are added.
- The Study Habits timer saves its in-progress state in this browser, counts only while running, and pauses when leaving or reloading the page. Stopping the timer saves a session to the current browser profile.
- Recommendations summarizes study frequency and hours from valid sessions in the last 7 days, and calculates average focus and most-used method from saved sessions with those values. It uses existing profile-level values only as a fallback when there are no session records.
- Target grades are optional, accept values from 0 to 100 inclusive, and are never inferred from current grades. Missing or invalid saved targets remain unset; use “Clear target” to intentionally remove a saved optional target.
- Subject lists use `studytrack:subjects:<student-id>`. Record snapshots use `studytrack:records:<student-id>`. Calendar and period grades use `studytrack:term:<student-id>` and `studytrack:period-grades:<student-id>`. Onboarding progress uses separate per-student keys. Existing `studytrack:targets:<student-id>` and reminder-plan keys remain in use.
- Renaming a subject updates its saved grades, targets, period grades, sessions, and study-focus plans. Deleting a subject with related records requires confirmation and removes those related records only after confirmation. Failed study-focus saves keep the pending change available for retry.
- Academic Performance supports two-semester or three-term calendars with either Prelim/Midterm/Finals or Midterm/Finals periods. The old single-grade trimester layout remains available for existing records. Period grades are entered manually and changing calendars keeps prior records under their original IDs.
- The optional grade planner uses editable per-subject period weights, a passing target, and course units to estimate the weighted term grade, average needed across remaining periods, and unit-weighted GWA. Users can instead enter their GWA manually. For signed-in accounts, planner settings sync to Supabase; demo-profile planner settings remain in this browser. For a representative calculated GWA, users should add every subject for the term and fill in all period grades and course units; the app leaves the calculated result blank when any tracked subject is incomplete. Estimates do not overwrite grades and should be checked against school rules.
- Before deploying planner cloud sync, apply `supabase/migrations/20261024000100_grade_planner_settings.sql` to the Supabase project (for example, run it in the Supabase SQL Editor). The migration creates the planner tables and account-scoped row-level security policies.
- Reminder previews are simulations. This checkout contains no server-side email-test endpoint or provider configuration, so no real email is sent.
- The first-use wizard is shown for an empty student workspace, can be skipped, and can be replayed from Academic Performance. Existing demo profiles with records continue directly to the app.
- GitHub Actions builds and deploys to GitHub Pages on pushes to `main` or `master`; the Vite base path is derived from the repository name.
- All causal-sounding language avoided per project requirements — insights are framed as "observed patterns" in the sample.

## Checks

```bash
npm test
npm run build
```

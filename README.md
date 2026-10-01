# StudyTrack (prototype)

A lightweight React + Vite dashboard for tracking study habits and academic performance, built on mock data for 6 students.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

Login screen: use "Demo Login" (no real auth).

## Structure
- `src/data/students.js` — all mock data + helper calculations (swap for API/database calls later)
- `src/pages/` — Dashboard, Study Habits, Academic Performance, personal Analytics, Recommendations, About
- `src/components/` — Sidebar, StatCard

## Notes
- Charts via Recharts.
- Study session logging on the Study Habits page updates local state (not persisted).
- Subject targets are stored in browser local storage per demo profile.
- GitHub Actions builds and deploys to GitHub Pages on pushes to `main` or `master`; the Vite base path is derived from the repository name.
- All causal-sounding language avoided per project requirements — insights are framed as "observed patterns" in the sample.

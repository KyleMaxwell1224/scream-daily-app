# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start local dev server (Vite, HMR)
npm run build      # production build → dist/
npm run lint       # ESLint
npm run preview    # serve the dist/ build locally
node scripts/seedQuestions.js   # seed Act 1 + Act 4 questions into Supabase
```

No test suite exists yet.

## Stack

React 19 + Vite, React Router v7, Zustand v5, Supabase JS v2. Deployed on Vercel (auto-deploy from `main`). No SSR — pure SPA, all routing is client-side.

## Architecture

### State — `src/store/useGameStore.js`
Single Zustand store with `persist` middleware (localStorage key `scream-daily-v1`). Two categories of state:

- **Daily state** — resets each new day via `checkNewDay()` (called on every app mount in `App.jsx`). Defined in the `DAILY_RESET` constant: `completedActs`, `xpEarned`, `act2CurrentQuestion`, `act2Answers`, `act2Selections`, `todayQuestions`, `actResults`, `ritualBanked`.
- **Long-term state** — survives across days: `userXP`, `streak`, `daysPlayed`, `lastPlayedDate`, `lastCompletedDate`, `username`, `favoriteSlasher`.

XP split: `userXP` = all previous days only. Components compute `displayXP = userXP + sum(xpEarned)` — never store the sum. `checkNewDay()` folds `xpEarned` into `userXP` on rollover. `completeAct()` atomically banks streak/daysPlayed when all 4 acts are done (`ritualBanked = true`).

`session` (Supabase auth) is excluded from persistence via `partialize`.

### Supabase sync — `src/utils/syncStats.js`
`pushStats(session)` upserts `user_stats` with current totals. `pullStats(session)` syncs down when remote XP exceeds local; always syncs `username`/`favorite_slasher` down regardless of XP comparison. Called from `App.jsx` on mount and on `ritualBanked`, and from `Profile.jsx` on auth state change.

### Daily question rotation — Supabase RPC
`getTodaysQuestions()` in `src/utils/questions.js` calls `supabase.rpc('get_todays_questions')`. The RPC selects LRU questions (ordered by `used_on ASC NULLS FIRST`) per act and marks them with `used_on = current_date`. It is **idempotent** — if today's questions are already marked, it returns them without re-selecting. Returns `{ act1, act2, act3, act4 }`.

### Act flow
Home → `/act/1` → `/act/2` → `/act/3` → `/act/4` → `/results`. Each act page reads from `todayQuestions` in the store. If that slice is empty (e.g. deep-link), the act page calls `getTodaysQuestions()` and sets all four acts in the store. Act completion calls `completeAct(actNum, xp)` which triggers stats banking when all four are done.

### Answer grading
- **Act 1 & 4** (open text): `gradeAnswer()` in `src/utils/questions.js` — exact match, substring match, then Levenshtein distance (≤2 = close/60xp, ≤4 = partial/20xp). Accepts `accepted_variants[]` from the question row.
- **Act 2** (multiple choice, 5 questions): answers stored in `act2Answers` (bool[]) and `act2Selections` (string[]) — both indexed by question position.
- **Act 3** (multiple choice, 1 question): result stored in `actResults.act3`.

`actResults` persists per-act snapshots so completed acts remain visible after refresh.

### Supabase schema (key tables)
- `questions` — `id, act (1–4), question, correct_answer, accepted_variants (text[]), options (text[]), explanation, image_url, used_on (date), decade, authored_by, subgenre`
- `user_stats` — `user_id (FK auth.users), user_xp, streak, days_played, last_completed_date, username (unique), favorite_slasher, updated_at`

RLS on `user_stats`: write restricted to own row; SELECT is public (for leaderboard).

### Navigation
Two components render the same tab list: `BottomNav.jsx` (mobile) and `Header.jsx` (desktop `sd-desktop-nav`). Both must be kept in sync when adding/removing tabs.

### Styling
All styles in `src/index.css` using CSS custom properties (`--sd-*`). No CSS modules or Tailwind. The `.sd-wrap` class is the full-page column container used by every page. Fonts loaded from Google Fonts: Creepster (display), Special Elite (body/labels), Teko (stats/numbers).

### Seeding questions
`scripts/seedQuestions.js` requires `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (service role — bypasses RLS), and `TMDB_TOKEN` in `.env`. It reads `.env` manually without dotenv. Act 1 rows need `image_url` (TMDB backdrop); Act 4 rows are open-answer with `options: []`.

### Environment variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY   # seed script only, never exposed to browser
TMDB_TOKEN             # seed script only
```

# CLAUDE.md

Orientation for AI agents (and humans) working in this repo.

## Repo layout

This repo contains three deployable pieces:

- **`/` (root)** — the **current live app**. Plain HTML/CSS/JS (`index.html`, `styles.css`, `js/`, `assets/`). This is what users see in production today.
- **`/app`** — the **new app**, migrated to React + TypeScript + Vite (see `app/package.json`). Will eventually replace the root app.
- **`/api`** — backend service (Bun + Elysia + firebase-admin). Watches the Firestore DB and sends Slack notifications. That is its only job — it does not serve the frontend.

## Deployment

All three auto-deploy on push to `main`:

- **Root app → Firebase Hosting.** Configured by `firebase.json` (`"public": "."`) and `.firebaserc`.
- **React app (`/app`) → Railway.**
- **API (`/api`) → Railway.**

There is no manual deploy step. Push to `main` = ship.

## Migration status

We are mid-migration from the root HTML app to the React app in `/app`. The root app is still the source of truth for live users; the React app is being built up to feature parity. Eventually the React app will become the live app and the root files will be retired.

When making changes:
- Bug fixes / live-user changes → usually go to the root HTML app.
- New work that should survive the migration → consider doing it in `/app`.
- If unsure which app a request targets, ask.

## API scope

The `/api` service is intentionally narrow: watch the DB, post to Slack. It is not a general backend for the frontend — both apps talk to Firebase directly for data.

## React app structure (`/app/src`)

Quests are organized as **chapters**. Each chapter is a self-contained themed app (its own UI, components, styles, assets) that shares the data layer.

- `landing/` — landing page with the animated book that flips pages and lands on the current chapter. Routes to chapters via URL hash (`#chapter-1`, `#chapter-2`).
- `AppRouter.tsx` — tiny hash router. Renders `Landing` by default, lazy-loads chapters on navigation (so each chapter's CSS only loads when its route is active).
- `shared/lib/` — generic data layer used by every chapter. `createQuestApi({ questId, defaultRunners, ... })` returns the Firestore CRUD + subscription functions. Also: `selectors`, `types` (Runner/Run/SyncState), `utils`, `firebaseConfig`, `admin`.
- `chapter_1/` — current/live chapter (LOTR theme). `lib/firebase.ts` is a thin wrapper that calls `createQuestApi` with this chapter's QUEST_ID and theme defaults; the rest of `lib/` re-exports from `shared/`. UI lives in `components/`, `games/`, `hooks/`, `store/`.
- `chapter_2/` — skeleton for the next chapter. Same `lib/` shape. Theme + UI TBD.
- `app/public/chapter_N/assets/` — static assets for each chapter (referenced as `/chapter_N/assets/...`).

To add a new chapter: copy `chapter_2/` as a template, set its `QUEST_ID` and theme data in `lib/data.ts`, build the UI in `components/`, then add an entry to `landing/chapters.ts` and a lazy import in `AppRouter.tsx`.

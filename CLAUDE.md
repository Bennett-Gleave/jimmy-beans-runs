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

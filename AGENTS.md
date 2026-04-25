# AGENTS.md

Orientation for AI agents (and humans) working in this repo.

## Repo layout

Three deployable pieces:

- **`/` (root)** — the **current live app**. Plain HTML/CSS/JS
  (`index.html`, `styles.css`, `js/`, `assets/`). This is what users see in
  production today.
- **`/astro`** — the **new frontend**, Astro + vanilla JS + Three.js. Talks
  to the new chapter-based Firestore schema. Will eventually replace the
  root app.
- **`/api`** — backend service (Bun + Elysia + firebase-admin). Watches
  Firestore and sends Slack notifications. That is its only job — it does
  not serve the frontend.

> The earlier React port at `/app` has been retired in favor of `/astro`.

## Deployment

All three auto-deploy on push to `main`:

- **Root app → Firebase Hosting.** Configured by `firebase.json`
  (`"public": "."`) and `.firebaserc`.
- **Astro app (`/astro`) → Railway.**
- **API (`/api`) → Railway.**

There is no manual deploy step. Push to `main` = ship.

## Migration status

We are mid-migration from the root HTML app to the Astro app in `/astro`.
The root app is still the source of truth for live users; the Astro app is
being built up to feature parity. Eventually it will become the live app and
the root files will be retired.

When making changes:

- Bug fixes / live-user changes → usually go to the root HTML app.
- New work that should survive the migration → put it in `/astro`.
- If unsure which app a request targets, ask.

## Firestore schema (canonical)

The Astro app uses the chapter-based schema. The root app still uses the
older `quests/...` paths and is gradually being migrated.

```
chapters/{chapterId}                       — chapter doc
chapters/{chapterId}/participants/{userId} — chapter membership
chapters/{chapterId}/characters/{key}      — per-chapter character roster
chapters/{chapterId}/runs/{runId}          — run entries
users/{userId}                             — global user docs
```

## API scope

The `/api` service is intentionally narrow: watch the DB, post to Slack. It
is not a general backend for the frontend — both apps talk to Firebase
directly for data.

## Astro app structure (`/astro/src`)

```
pages/
  index.astro          — landing page; Three.js book with corner-peel page-turn
  chapter-1.astro      — fully ported LOTR fellowship quest
  chapter-2.astro      — Star Wars stub (DB-wired, UI TBD)
  admin.astro          — admin panel: sidebar of users + chapters,
                         click a chapter for its participants and characters

scripts/
  lib/
    firebaseConfig.js  — Firebase config (PUBLIC_FIREBASE_* env vars + fallbacks)
    chapterApi.js      — createChapterApi({ chapterId, ... }) — Firestore CRUD
                         + subscriptions on the new schema
    admin.js           — chapters / users / characters / participants /
                         storage helpers used by /admin
  chapter_1/           — chapter-1 client logic. data.js sets CHAPTER_ID,
                         CHARACTER_OPTIONS, SIDE_QUESTS, etc.
                         firebase.js is a shim over chapterApi.js so that
                         the existing render/ui/state modules work unchanged.
  chapter_2/           — same shape; minimal stub renderer
  admin/main.js        — admin panel UI (sidebar nav, chapter detail view,
                         dialogs for creating/editing)
  landing/
    book.js            — Three.js book class with vertex-curl page turn
                         (cylindrical fold along a moving fold line)
    main.js            — wires the book to live chapter data

styles/
  chapter_1.css        — ported from the root styles.css
  chapter_2.css        — neutral dark stub
  admin.css            — admin panel theme

public/chapter_N/assets/  — static assets per chapter
```

### Adding a chapter

1. Create the chapter doc in `/admin` (or directly via Firestore). Set id,
   title, order, status, etc.
2. Copy `astro/src/scripts/chapter_2/` to a new folder; change `CHAPTER_ID`.
3. Copy `astro/src/pages/chapter-2.astro` to a new page; update its imports.
4. Drop assets into `astro/public/chapter_N/assets/`.
5. The landing page picks up new chapters from Firestore automatically — no
   wiring needed.

### Per-chapter cover image

The landing-page book uses each chapter's first character with an `imageUrl`
as that chapter's cover. Upload one in `/admin` → chapter → Characters.

## Root app structure (`/`)

Original HTML app. Reads/writes the older `quests/april-quest/runners` path.
Treat as legacy — bug-fix only unless explicitly asked.

```
index.html              — entire app shell
styles.css              — full stylesheet
app.mjs                 — entry; wires Firebase + render + UI
js/
  data.js               — character options, default runners, side quests
  firebase.js           — Firestore CRUD on the legacy schema
  state.js              — in-memory state
  render.js             — DOM rendering
  ui.js                 — UI bindings, modals
  three-games.js        — minigames
  utils.js
assets/                  — runner photos
```

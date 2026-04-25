# Jimmy-Bean Runs

Shared mile-tracking quests. Pick a character, log runs, watch the fellowship
move toward a goal together. Backed by Firebase Firestore so every runner sees
the same ledger live.

## Repo layout

Three deployables live in this repo:

| Path     | What it is                                                                | Stack                                  | Hosting          |
|----------|---------------------------------------------------------------------------|----------------------------------------|------------------|
| `/`      | Original live app                                                         | Plain HTML / CSS / ES modules          | Firebase Hosting |
| `/astro` | New frontend (in progress; will replace the root app)                     | Astro + vanilla JS + Three.js          | Railway          |
| `/api`   | Slack notification service. Watches Firestore, posts to Slack on changes. | Bun + Elysia + firebase-admin          | Railway          |

All three auto-deploy on push to `main`. There is no manual deploy step.

## Quick start

```bash
# Root HTML app
python3 -m http.server 8000     # then open http://localhost:8000

# Astro app
cd astro
bun install
bun run dev                      # http://localhost:4321

# API
cd api
bun install
bun run dev
```

## Astro app (`/astro`)

The Astro app is the future of the frontend. It has:

- **Landing page** — Three.js single-page book with a corner-peel page-turn
  animation. Pulls chapters live from Firestore and lets you flip between them
  by drag/swipe, arrow keys, or buttons.
- **`/chapter-1`** — fully ported LOTR fellowship quest (mirrors the root app's
  feature set, on the new schema).
- **`/chapter-2`** — Star Wars stub. DB-wired, UI/theme to be built.
- **`/admin`** — sidebar navigation. Click a chapter to manage its
  participants and characters; "Users" tab manages the global users
  collection. Image upload goes to Firebase Storage.

### Adding a chapter

1. Create the chapter doc in the admin panel (`/admin` → New chapter).
2. Copy `astro/src/scripts/chapter_2/` and `astro/src/pages/chapter-2.astro`
   to a new chapter folder; update `CHAPTER_ID` in `data.js`.
3. Drop assets into `astro/public/chapter_N/assets/`.
4. Build out the chapter's UI (use `chapter-1.astro` as the reference for
   feature scope; chapter-2 is a stub).

### Environment

Firebase config can come from `PUBLIC_FIREBASE_*` env vars
(`PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_PROJECT_ID`, etc). Sensible
fallbacks for the prod Firebase project are baked in for local dev.

## Firestore schema (current — chapter-based)

```
chapters/{chapterId}                       — chapter doc (title, status, dates, …)
chapters/{chapterId}/participants/{userId} — chapter membership + character + goal
chapters/{chapterId}/characters/{key}      — chapter's character roster
chapters/{chapterId}/runs/{runId}          — run entries
users/{userId}                             — global user docs (displayName)
```

The root HTML app still uses the older `quests/{questId}/runners` path. The
Astro app reads/writes the new `chapters/...` paths. Both apps point at the
same Firestore project; they don't share data.

### Firestore rules

For the two-person prototype, open rules let everything through:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Tighten before letting strangers loose on it.

## API service (`/api`)

Narrow on purpose: subscribes to Firestore changes and posts Slack messages.
It is **not** a general backend for the frontend. Both frontends talk to
Firebase directly for data.

## Migration status

The root HTML app is still the live app. The Astro app is being built up to
feature parity. Bug fixes for live users → root. New work that should survive
the migration → Astro.

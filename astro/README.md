# Jimmy-Bean Runs — Astro

Astro port of the original root HTML app. Same content, but uses the new
Firestore chapter/participant schema (the one the React app introduced) so each
chapter is a separate page that talks to its own subcollection.

## Layout

```
astro/
  src/
    pages/
      index.astro          → landing (links to chapters)
      chapter-1.astro      → /chapter-1 — the LOTR fellowship quest
    scripts/
      lib/                 → shared client modules
        firebaseConfig.js
        chapterApi.js      → Firestore CRUD + subscription, new schema
      chapter_1/           → chapter-1 client logic
        data.js            → CHAPTER_ID, CHARACTER_OPTIONS, SIDE_QUESTS, ...
        state.js           → in-memory store
        utils.js
        render.js
        ui.js
        three-games.js
        main.js            → entrypoint (replaces app.mjs)
    styles/
      chapter_1.css        → ported from root styles.css
  public/
    chapter_1/assets/      → images for chapter 1
```

## Run

```
bun install
bun run dev
```

## Adding a chapter

Copy `src/pages/chapter-1.astro` and `src/scripts/chapter_1/` to a new
chapter folder, change `CHAPTER_ID` in its `data.js`, and link to it from
`src/pages/index.astro`.

import { subscribeToChapters, subscribeToCharacters } from "../lib/admin.js";
import { Book } from "./book.js";

const stage = document.getElementById("bookStage");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const openBtn = document.getElementById("openChapter");
const dotsEl = document.getElementById("pageDots");
const adminLink = document.getElementById("adminLink");

const book = new Book(stage);

let chapters = []; // hydrated chapters with cover image
const chapterCovers = new Map(); // chapterId -> imageUrl

book.onChange((chapter, index, total) => {
  prevBtn.disabled = index <= 0;
  nextBtn.disabled = index >= total - 1;
  openBtn.disabled = !chapter;
  if (chapter) openBtn.dataset.href = `/${chapter.id}`;
  renderDots(index, total);
});

prevBtn.addEventListener("click", () => book.prev());
nextBtn.addEventListener("click", () => book.next());
openBtn.addEventListener("click", () => {
  const href = openBtn.dataset.href;
  if (href) window.location.href = href;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") book.next();
  else if (e.key === "ArrowLeft") book.prev();
  else if (e.key === "Enter") openBtn.click();
});

function renderDots(currentIndex, total) {
  dotsEl.innerHTML = "";
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement("button");
    dot.className = "page-dot" + (i === currentIndex ? " is-active" : "");
    dot.setAttribute("aria-label", `Go to chapter ${i + 1}`);
    dot.addEventListener("click", () => book.goTo(i));
    dotsEl.appendChild(dot);
  }
}

// Listen to chapter docs.
subscribeToChapters(
  (incoming) => {
    chapters = incoming.map((c) => ({
      ...c,
      imageUrl: chapterCovers.get(c.id),
    }));
    pushChapters();

    // Subscribe to characters for each chapter so we can pick a cover image.
    incoming.forEach((c) => {
      subscribeToCharacters(c.id, (chars) => {
        const cover = chars.find((x) => x.imageUrl)?.imageUrl;
        if (cover) {
          chapterCovers.set(c.id, cover);
          chapters = chapters.map((ch) => (ch.id === c.id ? { ...ch, imageUrl: cover } : ch));
          pushChapters();
        }
      });
    });
  },
  (err) => {
    console.error(err);
  },
);

function pushChapters() {
  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) {
    book.setChapters([
      {
        id: "loading",
        title: "Loading…",
        description: "Fetching chapters from the ledger.",
      },
    ]);
    return;
  }
  // Land on the active chapter if there is one, otherwise the latest.
  const activeIdx = sorted.findIndex((c) => c.status === "active");
  const startIdx = activeIdx >= 0 ? activeIdx : sorted.length - 1;
  book.setChapters(sorted);
  book.goTo(startIdx, { animate: false });
}

// Reveal admin link on hover/long-press of the corner — but for now just leave it always present.
if (adminLink) adminLink.hidden = false;

import { useState } from "react";
import "./landing.css";
import { Book } from "./Book";
import { CHAPTERS, currentChapter, type ChapterMeta } from "./chapters";

function navigate(route: string) {
  window.location.hash = route;
}

export default function Landing() {
  const [selected, setSelected] = useState<ChapterMeta>(currentChapter());
  const [skip, setSkip] = useState(false);

  return (
    <div className="landing-shell">
      <button type="button" className="landing-skip" onClick={() => setSkip(true)}>
        Skip
      </button>
      <h1 className="landing-title">Jimmy &amp; Bean Runs</h1>
      <Book chapter={selected} onOpen={() => navigate(selected.route)} skip={skip} />
      <div className="chapter-list">
        {CHAPTERS.map((chapter) => (
          <button
            key={chapter.route}
            type="button"
            className={`chapter-chip ${chapter.route === selected.route ? "is-current" : ""}`}
            disabled={!chapter.available}
            onClick={() => setSelected(chapter)}
          >
            Ch. {chapter.number} — {chapter.title}
          </button>
        ))}
      </div>
    </div>
  );
}

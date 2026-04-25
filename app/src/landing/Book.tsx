import { useEffect, useState } from "react";
import type { ChapterMeta } from "./chapters";

const ANIMATION_MS = 3100;

type BookProps = {
  chapter: ChapterMeta;
  onOpen: () => void;
  skip?: boolean;
};

export function Book({ chapter, onOpen, skip = false }: BookProps) {
  const [settled, setSettled] = useState(skip);

  useEffect(() => {
    if (skip) {
      setSettled(true);
      return;
    }
    const timer = window.setTimeout(() => setSettled(true), ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [skip]);

  return (
    <div className="book-scene" aria-live="polite">
      <div className="book">
        <div className="book-cover book-cover-left">The Book of Runs</div>
        <div className="book-page book-page-static-left" />
        <div className="book-page book-page-static-right" />

        {!skip && <div className="book-cover book-cover-front">The Book of Runs</div>}
        {!skip && <div className="book-page book-page-flip flip-1" />}
        {!skip && <div className="book-page book-page-flip flip-2" />}
        {!skip && <div className="book-page book-page-flip flip-3" />}

        <div
          className="book-page book-page-final"
          style={skip ? { opacity: 1, animation: "none" } : undefined}
        >
          <p className="chapter-number">Chapter {chapter.number}</p>
          <h2 className="chapter-title">{chapter.title}</h2>
          <p className="chapter-subtitle">{chapter.subtitle}</p>
          {settled && chapter.available && (
            <button type="button" className="chapter-open-btn" onClick={onOpen}>
              Open Chapter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

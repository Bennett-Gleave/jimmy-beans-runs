import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { Chapter, ChapterDoc, ChapterStatus } from "./types";

const CHAPTERS_PATH = "chapters";

function chaptersCollection() {
  return collection(getDb(), CHAPTERS_PATH);
}

function chapterDocRef(id: string) {
  return doc(getDb(), CHAPTERS_PATH, id);
}

function hydrate(id: string, data: ChapterDoc): Chapter {
  return {
    id,
    title: data.title || "Untitled Chapter",
    themeKey: data.themeKey || id,
    order: Number(data.order) || 0,
    month: Number(data.month) || 0,
    year: Number(data.year) || 0,
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    defaultGoalMiles: Number(data.defaultGoalMiles) || 0,
    status: (data.status as ChapterStatus) || "upcoming",
    createdAtMs: Number(data.createdAtMs) || 0,
  };
}

export function subscribeToChapters(
  cb: (chapters: Chapter[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    chaptersCollection(),
    (snapshot) => {
      const chapters = snapshot.docs
        .map((d) => hydrate(d.id, d.data() as ChapterDoc))
        .sort((a, b) => a.order - b.order);
      cb(chapters);
    },
    (error) => {
      console.error(error);
      onError?.(error);
    },
  );
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const snap = await getDoc(chapterDocRef(id));
  if (!snap.exists()) return null;
  return hydrate(snap.id, snap.data() as ChapterDoc);
}

export type EnsureChapterInput = {
  id: string;
  title: string;
  themeKey: string;
  order: number;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  defaultGoalMiles: number;
  status?: ChapterStatus;
};

export async function ensureChapter(input: EnsureChapterInput): Promise<void> {
  const ref = chapterDocRef(input.id);
  const existing = await getDoc(ref);
  const payload: ChapterDoc = {
    title: input.title,
    themeKey: input.themeKey,
    order: input.order,
    month: input.month,
    year: input.year,
    startDate: input.startDate,
    endDate: input.endDate,
    defaultGoalMiles: input.defaultGoalMiles,
    status: input.status || "upcoming",
    createdAtMs: existing.exists()
      ? Number((existing.data() as ChapterDoc).createdAtMs) || Date.now()
      : Date.now(),
  };
  await setDoc(ref, payload, { merge: true });
}

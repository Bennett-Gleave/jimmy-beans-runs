export type ChapterMeta = {
  number: number;
  title: string;
  subtitle: string;
  route: string;
  available: boolean;
};

export const CHAPTERS: ChapterMeta[] = [
  {
    number: 1,
    title: "Fellowship of the Run",
    subtitle: "April Quest",
    route: "chapter-1",
    available: true,
  },
  {
    number: 2,
    title: "Coming Soon",
    subtitle: "Theme TBD",
    route: "chapter-2",
    available: false,
  },
];

export const CURRENT_CHAPTER_ROUTE = "chapter-1";

export function chapterByRoute(route: string): ChapterMeta | undefined {
  return CHAPTERS.find((chapter) => chapter.route === route);
}

export function currentChapter(): ChapterMeta {
  return chapterByRoute(CURRENT_CHAPTER_ROUTE) ?? CHAPTERS[0];
}

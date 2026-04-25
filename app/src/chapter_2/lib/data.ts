import type { PlayableQuestMeta, SideQuest } from "./types";

export const CHAPTER_ID = "chapter-2";
export const DEFAULT_RUNNER_GOAL = 30;
export const DEFAULT_CHARACTER_KEY = "placeholder";

export const CHARACTER_OPTIONS = [
  { key: "placeholder", label: "Placeholder", flavor: "Theme TBD.", accent: "warm" },
] as const;

export const DEFAULT_PARTICIPANTS = [] as const;

export const CUSTOM_RUNNER_IMAGES: Record<string, string> = {};

export const CUSTOM_CHARACTER_IMAGES: Record<string, string> = {};

export const SIDE_QUESTS: readonly SideQuest[] = [];

export const PLAYABLE_SIDE_QUESTS: Record<string, PlayableQuestMeta> = {};

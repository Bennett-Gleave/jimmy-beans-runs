import type { CHARACTER_OPTIONS } from "./data";

export type {
  Run,
  Runner,
  RunDoc,
  RunnerDoc,
  SyncState,
  SyncStatus,
} from "../../shared/lib/types";

export type CharacterKey = (typeof CHARACTER_OPTIONS)[number]["key"];

export type CharacterAccent = "warm";

export type Character = {
  key: string;
  label: string;
  flavor: string;
  accent: CharacterAccent;
};

export type SideQuest = {
  title: string;
  description: string;
};

export type PlayableQuestMeta = {
  title: string;
  description: string;
};

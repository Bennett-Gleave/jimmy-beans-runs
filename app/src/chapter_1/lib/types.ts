import type { CHARACTER_OPTIONS } from "./data";

export type {
  Chapter,
  ChapterDoc,
  ChapterRunDoc,
  ChapterStatus,
  ParticipantDoc,
  Run,
  Runner,
  RunDoc,
  RunnerDoc,
  SyncState,
  SyncStatus,
  User,
  UserDoc,
} from "../../shared/lib/types";

export type CharacterKey = (typeof CHARACTER_OPTIONS)[number]["key"];

export type CharacterAccent =
  | "warm"
  | "green"
  | "steel"
  | "bark"
  | "leaf"
  | "mist"
  | "sun"
  | "rose"
  | "ember"
  | "swamp";

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

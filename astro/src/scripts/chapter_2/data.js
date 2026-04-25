// Chapter 2 — Star Wars (stub). Coworker will flesh out the theme/UI.
// Database paths used: chapters/chapter-2/participants, chapters/chapter-2/runs.

export const CHAPTER_ID = "chapter-2";
export const DEFAULT_RUNNER_GOAL = 30;
export const DEFAULT_CHARACTER_KEY = "rebel";

// TODO(coworker): replace with full Star Wars roster + flavor.
export const CHARACTER_OPTIONS = [
  { key: "rebel", label: "Rebel Pilot", flavor: "Generic Rebel Alliance pilot. Theme TBD.", accent: "steel" },
  { key: "jedi", label: "Jedi", flavor: "Force-sensitive runner. Stub.", accent: "leaf" },
  { key: "sith", label: "Sith", flavor: "Dark side cadence. Stub.", accent: "ember" },
];

// Default seeds — only used the very first time the chapter is opened
// against an empty DB. The user said data is already populated, so this is
// effectively a no-op safety net.
export const DEFAULT_PARTICIPANTS = [];

// Maps from any pre-migration short ids to current userIds, if needed later.
export const LEGACY_PARTICIPANT_ID_MAP = {};

export const CUSTOM_RUNNER_IMAGES = {};
export const CUSTOM_CHARACTER_IMAGES = {};

// TODO(coworker): fill in Star Wars side quests (Tatooine, Hoth, Death Star, ...).
export const SIDE_QUESTS = [];

export const PLAYABLE_SIDE_QUESTS = {};

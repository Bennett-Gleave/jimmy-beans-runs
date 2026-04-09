export const QUEST_ID = "april-quest";
export const DEFAULT_RUNNER_GOAL = 30;
export const MILESTONE_STEP = 5;

export const CHARACTER_OPTIONS = [
  { key: "sam", label: "Samwise", flavor: "Second breakfast loyalist. Keeps the whole squad moving.", accent: "warm" },
  { key: "frodo", label: "Frodo", flavor: "Quiet grit. Carries the burden and still gets the miles in.", accent: "green" },
  { key: "aragorn", label: "Aragorn", flavor: "Strider miles. Ranger pace. Zero fear of elevation.", accent: "steel" },
  { key: "gimli", label: "Gimli", flavor: "Short stride, huge engine, absolutely thrives on stubborn climbs.", accent: "bark" },
  { key: "legolas", label: "Legolas", flavor: "Light feet, elite cadence, suspiciously fresh after long runs.", accent: "leaf" },
  { key: "gandalf", label: "Gandalf", flavor: "Shows up late, drops a huge effort, vanishes mysteriously.", accent: "mist" },
  { key: "eowyn", label: "Eowyn", flavor: "Unbothered by doubt. Absolutely dusts the Witch-king split.", accent: "rose" },
  { key: "merry", label: "Merry", flavor: "Underrated pace merchant. Quietly stacks consistent miles.", accent: "warm" },
  { key: "pippin", label: "Pippin", flavor: "Chaotic training plan, but somehow still gets it done.", accent: "sun" },
  { key: "sauron", label: "Sauron", flavor: "Big eye on the leaderboard. Dramatic and impossible to ignore.", accent: "ember" },
  { key: "tom-bombadil", label: "Tom Bombadil", flavor: "Chaotic woodland energy. Runs for the vibes alone.", accent: "sun" },
  { key: "treebeard", label: "Treebeard", flavor: "Slow to start, impossible to stop once moving.", accent: "bark" },
  { key: "gollum", label: "Gollum", flavor: "Questionable form. Exceptional obsession with the finish.", accent: "swamp" },
  { key: "balrog", label: "Balrog", flavor: "Hot pace, dramatic entrances, absolutely no chill.", accent: "ember" },
];

export const DEFAULT_RUNNERS = [
  { id: "runner-sam", name: "Hipster Sam", characterKey: "sam", goalMiles: 30, createdAtMs: 1 },
  { id: "runner-frodo", name: "Frodo Bean", characterKey: "frodo", goalMiles: 30, createdAtMs: 2 },
];

export const CUSTOM_RUNNER_IMAGES = {
  "runner-sam": "./assets/hipster_sam.jpg",
  "frodo bean": "./assets/frodo_bean.JPG",
  breezy: "./assets/breezy.JPG",
  "con bombadil": "./assets/con_bombadil.JPG",
  drewid: "./assets/drewid.JPG",
  "tanner the treacherous": "./assets/tanner_the_treacherous.JPG",
  mason: "./assets/mason.JPG",
};

export const CUSTOM_CHARACTER_IMAGES = {
  gollum: "./assets/mason.JPG",
};

export const MISSION_COPY = [
  { title: "Leave the Shire", description: "Breakfast complete. The quest is officially on." },
  { title: "Bree Bound", description: "Pints avoided. The road is already looking stronger." },
  { title: "Rivendell Rally", description: "Council approved. Mileage diplomacy succeeds." },
  { title: "Moria Miles", description: "Dark patch crossed. Legs still moving." },
  { title: "Lothlorien Lift", description: "Recovery glow. Form looks elven." },
  { title: "Rohan Run Club", description: "Open-country miles. Turnover is sharp." },
  { title: "Gondor Calls", description: "The beacon is lit. No excuses now." },
  { title: "Morgul March", description: "Hostile road. Discipline wins." },
  { title: "Cirith Ungol", description: "Climbing section. Grit over comfort." },
  { title: "Gorgoroth Grind", description: "Ash in the air. Finish line ahead." },
];

export const CELEBRATION_MESSAGES = [
  "Even the White City would cheer a run like that.",
  "The road to Mordor shortens with every bold stride.",
  "A noble effort. The fellowship grows stronger by your feet.",
  "Not all who wander are lost, but this run was clearly on purpose.",
  "These miles would earn a respectful nod from Aragorn himself.",
  "One does not simply log miles that strong without glory.",
];

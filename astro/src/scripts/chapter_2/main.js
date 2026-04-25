import { createChapterApi } from "../lib/chapterApi.js";
import { hasFirebaseConfig } from "../lib/firebaseConfig.js";
import {
  CHAPTER_ID,
  DEFAULT_PARTICIPANTS,
  DEFAULT_RUNNER_GOAL,
  DEFAULT_CHARACTER_KEY,
  LEGACY_PARTICIPANT_ID_MAP,
  CHARACTER_OPTIONS,
} from "./data.js";

const api = createChapterApi({
  chapterId: CHAPTER_ID,
  defaultParticipants: DEFAULT_PARTICIPANTS,
  defaultParticipantGoal: DEFAULT_RUNNER_GOAL,
  defaultCharacterKey: DEFAULT_CHARACTER_KEY,
  legacyParticipantIdMap: LEGACY_PARTICIPANT_ID_MAP,
  connectedMessage: "Live sync active.",
});

const state = { runners: [], runs: [] };

const els = {
  syncBanner: document.getElementById("syncBanner"),
  totalMiles: document.getElementById("totalMiles"),
  goalMiles: document.getElementById("goalMiles"),
  runnerGrid: document.getElementById("runnerGrid"),
  runnerCount: document.getElementById("runnerCount"),
  runCount: document.getElementById("runCount"),
};

function fmt(miles) {
  return Number(miles || 0).toFixed(1);
}

function totalMilesForRunner(id) {
  return state.runs.filter((r) => r.runnerId === id).reduce((s, r) => s + r.miles, 0);
}

function characterFor(key) {
  return CHARACTER_OPTIONS.find((c) => c.key === key) || CHARACTER_OPTIONS[0];
}

function render() {
  const runners = [...state.runners].sort((a, b) => a.createdAtMs - b.createdAtMs);
  const totalMiles = state.runs.reduce((s, r) => s + r.miles, 0);
  const goalMiles = runners.reduce((s, r) => s + r.goalMiles, 0);

  els.totalMiles.textContent = fmt(totalMiles);
  els.goalMiles.textContent = fmt(goalMiles);
  els.runnerCount.textContent = String(runners.length);
  els.runCount.textContent = String(state.runs.length);

  els.runnerGrid.innerHTML = "";
  if (runners.length === 0) {
    const empty = document.createElement("article");
    empty.className = "stub-card stub-empty";
    empty.innerHTML = `
      <p class="stub-eyebrow">No participants yet</p>
      <p>This chapter is wired up to <code>chapters/${CHAPTER_ID}/participants</code> but nothing has been written yet.</p>
    `;
    els.runnerGrid.appendChild(empty);
    return;
  }

  runners.forEach((runner) => {
    const character = characterFor(runner.characterKey);
    const miles = totalMilesForRunner(runner.id);
    const card = document.createElement("article");
    card.className = "stub-card";
    const avatar = runner.imageUrl
      ? `<div class="stub-avatar" style="background-image:url('${runner.imageUrl}')"></div>`
      : `<div class="stub-avatar stub-avatar-placeholder">${character.label[0] || "?"}</div>`;
    card.innerHTML = `
      ${avatar}
      <div class="stub-body">
        <p class="stub-eyebrow">${character.label}</p>
        <h3>${runner.name}</h3>
        <p class="stub-miles">${fmt(miles)} / ${runner.goalMiles} mi</p>
      </div>
    `;
    els.runnerGrid.appendChild(card);
  });
}

function setSyncState(message, status) {
  if (!els.syncBanner) return;
  els.syncBanner.textContent = message;
  els.syncBanner.dataset.status = status || "idle";
}

async function init() {
  render();

  if (!hasFirebaseConfig()) {
    setSyncState("Firebase config missing.", "error");
    return;
  }

  api.subscribeToChapter({
    onRunners: (runners) => {
      state.runners = runners;
      render();
    },
    onRuns: (runs) => {
      state.runs = runs;
      render();
    },
    onSyncState: setSyncState,
  });

  try {
    await api.ensureDefaultParticipants();
  } catch (error) {
    console.error(error);
    setSyncState("Could not bootstrap default participants.", "error");
  }
}

init();

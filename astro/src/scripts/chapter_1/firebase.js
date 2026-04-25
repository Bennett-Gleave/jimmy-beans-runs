// Thin shim that matches the original `js/firebase.js` call signatures
// (which all take `db` as the first argument) but routes everything through
// the new chapter-based API.
import { createChapterApi } from "../lib/chapterApi.js";
import { CHAPTER_ID, DEFAULT_PARTICIPANTS, DEFAULT_RUNNER_GOAL, LEGACY_PARTICIPANT_ID_MAP } from "./data.js";

const api = createChapterApi({
  chapterId: CHAPTER_ID,
  defaultParticipants: DEFAULT_PARTICIPANTS,
  defaultParticipantGoal: DEFAULT_RUNNER_GOAL,
  defaultCharacterKey: "sam",
  legacyParticipantIdMap: LEGACY_PARTICIPANT_ID_MAP,
  connectedMessage: "Live sync active. The fellowship ledger is shared.",
});

export function ensureDefaultRunners(_db) {
  return api.ensureDefaultParticipants();
}

export function addRunner(_db, runner) {
  return api.addRunner({
    name: runner.name,
    characterKey: runner.characterKey,
    goalMiles: runner.goalMiles,
  });
}

export function updateRunner(_db, runner) {
  return api.updateRunner({
    id: runner.id,
    name: runner.name,
    characterKey: runner.characterKey,
    goalMiles: runner.goalMiles,
  });
}

export function addRun(_db, runnerId, miles, runDate) {
  return api.addRun(runnerId, miles, runDate);
}

export function deleteRun(_db, runId) {
  return api.deleteRun(runId);
}

export function resetQuest(_db) {
  return api.resetChapter();
}

// Subscribes to Firestore and pushes data into `state` on every snapshot.
// Mirrors the shape of the original subscribeToQuest in js/firebase.js.
export function subscribeToQuest(_db, { onUpdate, onSyncState }, state) {
  return api.subscribeToChapter({
    onRunners: (runners) => {
      state.runners = runners;
      onUpdate();
    },
    onRuns: (runs) => {
      state.runs = runs;
      onUpdate();
    },
    onSyncState,
  });
}

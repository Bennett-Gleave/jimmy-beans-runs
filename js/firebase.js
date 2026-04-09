import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { QUEST_ID, DEFAULT_RUNNER_GOAL, DEFAULT_RUNNERS } from "./data.js";
import { state } from "./state.js";
import { todayIsoDate } from "./utils.js";

export function runnersCollection(db) {
  return collection(db, "quests", QUEST_ID, "runners");
}

export function runsCollection(db) {
  return collection(db, "quests", QUEST_ID, "runs");
}

export async function ensureDefaultRunners(db) {
  const snapshot = await getDocs(runnersCollection(db));
  if (!snapshot.empty) {
    return;
  }

  await Promise.all(
    DEFAULT_RUNNERS.map((runner) =>
      setDoc(doc(db, "quests", QUEST_ID, "runners", runner.id), {
        name: runner.name,
        characterKey: runner.characterKey,
        goalMiles: runner.goalMiles,
        createdAtMs: runner.createdAtMs,
      }),
    ),
  );
}

export async function addRunner(db, runner) {
  await addDoc(runnersCollection(db), {
    name: runner.name,
    characterKey: runner.characterKey,
    goalMiles: runner.goalMiles,
    createdAtMs: Date.now(),
  });
}

export async function updateRunner(db, runner) {
  await updateDoc(doc(db, "quests", QUEST_ID, "runners", runner.id), {
    name: runner.name,
    characterKey: runner.characterKey,
    goalMiles: runner.goalMiles,
  });
}

export async function addRun(db, runnerId, miles, runDate) {
  await addDoc(runsCollection(db), {
    runnerId,
    miles,
    runDate,
    createdAtMs: Date.now(),
  });
}

export async function deleteRun(db, runId) {
  await deleteDoc(doc(db, "quests", QUEST_ID, "runs", runId));
}

export async function resetQuest(db) {
  const snapshot = await getDocs(runsCollection(db));
  await Promise.all(snapshot.docs.map((runDoc) => deleteDoc(runDoc.ref)));
}

export function subscribeToQuest(db, { onUpdate, onSyncState }) {
  onSnapshot(
    runnersCollection(db),
    (snapshot) => {
      state.runners = snapshot.docs.map((runnerDoc) => {
        const data = runnerDoc.data();
        return {
          id: runnerDoc.id,
          name: data.name || "Unnamed Runner",
          characterKey: data.characterKey || "sam",
          goalMiles: Number(data.goalMiles) || DEFAULT_RUNNER_GOAL,
          createdAtMs: Number(data.createdAtMs) || Date.now(),
        };
      });

      onUpdate();
      onSyncState("Live sync active. The fellowship ledger is shared.", "connected");
    },
    (error) => {
      console.error(error);
      onSyncState("Runner sync failed. Check Firestore rules.", "error");
    },
  );

  onSnapshot(
    runsCollection(db),
    (snapshot) => {
      state.runs = snapshot.docs.map((runDoc) => {
        const data = runDoc.data();
        let runnerId = data.runnerId;

        if (!runnerId && data.runner === "sam") {
          runnerId = "runner-sam";
        }

        if (!runnerId && data.runner === "frodo") {
          runnerId = "runner-frodo";
        }

        return {
          id: runDoc.id,
          runnerId,
          miles: Number(data.miles) || 0,
          runDate: data.runDate || data.createdAtIso?.slice(0, 10) || todayIsoDate(),
          createdAtMs: Number(data.createdAtMs) || Date.now(),
        };
      });

      onUpdate();
      onSyncState("Live sync active. The fellowship ledger is shared.", "connected");
    },
    (error) => {
      console.error(error);
      onSyncState("Run sync failed. Check Firestore rules.", "error");
    },
  );
}

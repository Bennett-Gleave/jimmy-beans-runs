import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { FIREBASE_CONFIG } from "./firebaseConfig";
import type { Run, Runner, RunDoc, RunnerDoc, SyncState } from "./types";
import { todayIsoDate } from "./utils";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
  }
  if (!db) {
    db = getFirestore(app);
  }
  return db;
}

export type DefaultRunner = {
  id: string;
  name: string;
  characterKey: string;
  goalMiles: number;
  createdAtMs: number;
};

export type QuestApiConfig = {
  questId: string;
  defaultRunners: readonly DefaultRunner[];
  defaultRunnerGoal: number;
  defaultCharacterKey: string;
  legacyRunnerIdMap?: Record<string, string>;
  connectedMessage?: string;
};

export type QuestSubscription = {
  onRunners: (runners: Runner[]) => void;
  onRuns: (runs: Run[]) => void;
  onSyncState: (sync: SyncState) => void;
};

export type QuestApi = {
  ensureDefaultRunners: () => Promise<void>;
  addRunner: (runner: { name: string; characterKey: string; goalMiles: number }) => Promise<void>;
  updateRunner: (runner: {
    id: string;
    name: string;
    characterKey: string;
    goalMiles: number;
  }) => Promise<void>;
  addRun: (runnerId: string, miles: number, runDate: string) => Promise<void>;
  deleteRun: (runId: string) => Promise<void>;
  resetQuest: () => Promise<void>;
  subscribeToQuest: (sub: QuestSubscription) => () => void;
};

export function createQuestApi(config: QuestApiConfig): QuestApi {
  const {
    questId,
    defaultRunners,
    defaultRunnerGoal,
    defaultCharacterKey,
    legacyRunnerIdMap,
    connectedMessage = "Live sync active.",
  } = config;

  const runnersCollection = () => collection(getDb(), "quests", questId, "runners");
  const runsCollection = () => collection(getDb(), "quests", questId, "runs");

  return {
    async ensureDefaultRunners() {
      const snapshot = await getDocs(runnersCollection());
      if (!snapshot.empty) return;

      await Promise.all(
        defaultRunners.map((runner) =>
          setDoc(doc(getDb(), "quests", questId, "runners", runner.id), {
            name: runner.name,
            characterKey: runner.characterKey,
            goalMiles: runner.goalMiles,
            createdAtMs: runner.createdAtMs,
          }),
        ),
      );
    },

    async addRunner(runner) {
      await addDoc(runnersCollection(), {
        name: runner.name,
        characterKey: runner.characterKey,
        goalMiles: runner.goalMiles,
        createdAtMs: Date.now(),
      });
    },

    async updateRunner(runner) {
      await updateDoc(doc(getDb(), "quests", questId, "runners", runner.id), {
        name: runner.name,
        characterKey: runner.characterKey,
        goalMiles: runner.goalMiles,
      });
    },

    async addRun(runnerId, miles, runDate) {
      await addDoc(runsCollection(), {
        runnerId,
        miles,
        runDate,
        createdAtMs: Date.now(),
      });
    },

    async deleteRun(runId) {
      await deleteDoc(doc(getDb(), "quests", questId, "runs", runId));
    },

    async resetQuest() {
      const snapshot = await getDocs(runsCollection());
      await Promise.all(snapshot.docs.map((runDoc) => deleteDoc(runDoc.ref)));
    },

    subscribeToQuest({ onRunners, onRuns, onSyncState }) {
      const unsubscribeRunners = onSnapshot(
        runnersCollection(),
        (snapshot) => {
          const runners: Runner[] = snapshot.docs.map((runnerDoc) => {
            const data = runnerDoc.data() as RunnerDoc;
            return {
              id: runnerDoc.id,
              name: data.name || "Unnamed Runner",
              characterKey: data.characterKey || defaultCharacterKey,
              goalMiles: Number(data.goalMiles) || defaultRunnerGoal,
              createdAtMs: Number(data.createdAtMs) || Date.now(),
            };
          });
          onRunners(runners);
          onSyncState({ message: connectedMessage, status: "connected" });
        },
        (error) => {
          console.error(error);
          onSyncState({
            message: "Runner sync failed. Check Firestore rules.",
            status: "error",
          });
        },
      );

      const unsubscribeRuns = onSnapshot(
        runsCollection(),
        (snapshot) => {
          const runs: Run[] = snapshot.docs.map((runDoc) => {
            const data = runDoc.data() as RunDoc;
            let runnerId = data.runnerId;
            if (!runnerId && data.runner && legacyRunnerIdMap?.[data.runner]) {
              runnerId = legacyRunnerIdMap[data.runner];
            }
            return {
              id: runDoc.id,
              runnerId: runnerId || "",
              miles: Number(data.miles) || 0,
              runDate: data.runDate || data.createdAtIso?.slice(0, 10) || todayIsoDate(),
              createdAtMs: Number(data.createdAtMs) || Date.now(),
            };
          });
          onRuns(runs);
          onSyncState({ message: connectedMessage, status: "connected" });
        },
        (error) => {
          console.error(error);
          onSyncState({
            message: "Run sync failed. Check Firestore rules.",
            status: "error",
          });
        },
      );

      return () => {
        unsubscribeRunners();
        unsubscribeRuns();
      };
    },
  };
}

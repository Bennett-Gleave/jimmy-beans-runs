import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { FIREBASE_CONFIG } from "./firebaseConfig.js";

let _app = null;
let _db = null;

export function getDb() {
  if (!_app) _app = initializeApp(FIREBASE_CONFIG);
  if (!_db) _db = getFirestore(_app);
  return _db;
}

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateUserId(displayName) {
  const slug = slugify(displayName) || "anon";
  return `user-${slug}-${Date.now()}`;
}

async function upsertUser(userId, displayName) {
  const ref = doc(getDb(), "users", userId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const current = existing.data();
    if (current.displayName !== displayName) {
      await updateDoc(ref, { displayName });
    }
    return;
  }
  await setDoc(ref, {
    displayName,
    createdAtMs: Date.now(),
  });
}

/**
 * Build a chapter API bound to a chapter id.
 * Schema: chapters/{chapterId}/participants/{userId}, chapters/{chapterId}/runs/{runId}, users/{userId}
 *
 * Each "Runner" returned from subscribeToChapter is normalized to the same
 * shape the rest of the client app uses: { id, name, characterKey, goalMiles, createdAtMs, imageUrl? }
 */
export function createChapterApi(config) {
  const {
    chapterId,
    defaultParticipants = [],
    defaultParticipantGoal = 30,
    defaultCharacterKey = "sam",
    legacyParticipantIdMap = {},
    connectedMessage = "Live sync active.",
  } = config;

  const participantsCol = () => collection(getDb(), "chapters", chapterId, "participants");
  const runsCol = () => collection(getDb(), "chapters", chapterId, "runs");
  const participantDoc = (userId) => doc(getDb(), "chapters", chapterId, "participants", userId);
  const runDoc = (runId) => doc(getDb(), "chapters", chapterId, "runs", runId);

  return {
    async ensureDefaultParticipants() {
      const snapshot = await getDocs(participantsCol());
      if (!snapshot.empty) return;

      await Promise.all(
        defaultParticipants.map(async (p) => {
          await upsertUser(p.userId, p.displayName);
          await setDoc(participantDoc(p.userId), {
            userId: p.userId,
            displayName: p.displayName,
            characterKey: p.characterKey,
            goalMiles: p.goalMiles,
            createdAtMs: p.createdAtMs,
          });
        }),
      );
    },

    async addRunner(input) {
      const userId = input.userId || generateUserId(input.name);
      await upsertUser(userId, input.name);
      const payload = {
        userId,
        displayName: input.name,
        characterKey: input.characterKey,
        goalMiles: input.goalMiles,
        createdAtMs: Date.now(),
      };
      if (input.imageUrl) payload.imageUrl = input.imageUrl;
      await setDoc(participantDoc(userId), payload);
    },

    async updateRunner(input) {
      await upsertUser(input.id, input.name);
      const payload = {
        displayName: input.name,
        characterKey: input.characterKey,
        goalMiles: input.goalMiles,
      };
      if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl;
      await updateDoc(participantDoc(input.id), payload);
    },

    async deleteRunner(userId) {
      await deleteDoc(participantDoc(userId));
    },

    async addRun(userIdOrEntry, miles, runDate) {
      if (typeof userIdOrEntry === "object" && userIdOrEntry !== null) {
        const entry = userIdOrEntry;
        await addDoc(runsCol(), {
          userId: entry.userId,
          runnerId: entry.userId,
          miles: Number(entry.miles) || 0,
          points: Number(entry.points) || 0,
          durationMinutes: Number(entry.durationMinutes) || 0,
          activityType: entry.activityType || "running",
          notes: entry.notes || "",
          runDate: entry.runDate || todayIsoDate(),
          createdAtMs: Date.now(),
        });
        return;
      }

      await addDoc(runsCol(), {
        userId: userIdOrEntry,
        runnerId: userIdOrEntry,
        miles,
        runDate,
        createdAtMs: Date.now(),
      });
    },

    async deleteRun(runId) {
      await deleteDoc(runDoc(runId));
    },

    async resetChapter() {
      const snapshot = await getDocs(runsCol());
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    },

    subscribeToChapter({ onRunners, onRuns, onSyncState }) {
      const unsubP = onSnapshot(
        participantsCol(),
        (snapshot) => {
          const runners = snapshot.docs.map((d) => {
            const data = d.data();
            const runner = {
              id: d.id,
              name: data.displayName || "Unnamed Runner",
              characterKey: data.characterKey || defaultCharacterKey,
              goalMiles: Number(data.goalMiles) || defaultParticipantGoal,
              createdAtMs: Number(data.createdAtMs) || Date.now(),
            };
            if (data.imageUrl) runner.imageUrl = data.imageUrl;
            return runner;
          });
          onRunners(runners);
          onSyncState(connectedMessage, "connected");
        },
        (error) => {
          console.error(error);
          onSyncState("Participant sync failed. Check Firestore rules.", "error");
        },
      );

      const unsubR = onSnapshot(
        runsCol(),
        (snapshot) => {
          const runs = snapshot.docs.map((d) => {
            const data = d.data();
            let runnerId = data.userId || data.runnerId || "";
            if (!runnerId && data.runner && legacyParticipantIdMap[data.runner]) {
              runnerId = legacyParticipantIdMap[data.runner];
            }
            return {
              id: d.id,
              runnerId,
              miles: Number(data.miles) || 0,
              points: Number(data.points) || 0,
              durationMinutes: Number(data.durationMinutes) || 0,
              activityType: data.activityType || "running",
              notes: data.notes || "",
              runDate: data.runDate || data.createdAtIso?.slice(0, 10) || todayIsoDate(),
              createdAtMs: Number(data.createdAtMs) || Date.now(),
            };
          });
          onRuns(runs);
          onSyncState(connectedMessage, "connected");
        },
        (error) => {
          console.error(error);
          onSyncState("Run sync failed. Check Firestore rules.", "error");
        },
      );

      return () => {
        unsubP();
        unsubR();
      };
    },
  };
}

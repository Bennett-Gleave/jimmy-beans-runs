import {
  createChapterApi,
  type ChapterSubscription,
} from "../../shared/lib/firebase";
import { CHAPTER_ID, DEFAULT_PARTICIPANTS, DEFAULT_RUNNER_GOAL } from "./data";

const api = createChapterApi({
  chapterId: CHAPTER_ID,
  defaultParticipants: DEFAULT_PARTICIPANTS,
  defaultParticipantGoal: DEFAULT_RUNNER_GOAL,
  defaultCharacterKey: "sam",
  legacyParticipantIdMap: { sam: "user-hipster-sam", frodo: "user-frodo-bean" },
  connectedMessage: "Live sync active. The fellowship ledger is shared.",
});

export const ensureDefaultRunners = api.ensureDefaultParticipants;
export const addRun = api.addRun;
export const deleteRun = api.deleteRun;
export const resetQuest = api.resetChapter;

export function addRunner(input: {
  name: string;
  characterKey: string;
  goalMiles: number;
}): Promise<void> {
  return api.addParticipant({
    displayName: input.name,
    characterKey: input.characterKey,
    goalMiles: input.goalMiles,
  });
}

export function updateRunner(input: {
  id: string;
  name: string;
  characterKey: string;
  goalMiles: number;
}): Promise<void> {
  return api.updateParticipant({
    userId: input.id,
    displayName: input.name,
    characterKey: input.characterKey,
    goalMiles: input.goalMiles,
  });
}

export function subscribeToQuest(sub: {
  onRunners: ChapterSubscription["onParticipants"];
  onRuns: ChapterSubscription["onRuns"];
  onSyncState: ChapterSubscription["onSyncState"];
}): () => void {
  return api.subscribeToChapter({
    onParticipants: sub.onRunners,
    onRuns: sub.onRuns,
    onSyncState: sub.onSyncState,
  });
}

export { getDb } from "../../shared/lib/firebase";

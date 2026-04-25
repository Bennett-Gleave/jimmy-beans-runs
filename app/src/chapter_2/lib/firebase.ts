import { createQuestApi } from "../../shared/lib/firebase";
import { DEFAULT_CHARACTER_KEY, DEFAULT_RUNNERS, DEFAULT_RUNNER_GOAL, QUEST_ID } from "./data";

const api = createQuestApi({
  questId: QUEST_ID,
  defaultRunners: DEFAULT_RUNNERS,
  defaultRunnerGoal: DEFAULT_RUNNER_GOAL,
  defaultCharacterKey: DEFAULT_CHARACTER_KEY,
});

export const ensureDefaultRunners = api.ensureDefaultRunners;
export const addRunner = api.addRunner;
export const updateRunner = api.updateRunner;
export const addRun = api.addRun;
export const deleteRun = api.deleteRun;
export const resetQuest = api.resetQuest;
export const subscribeToQuest = api.subscribeToQuest;
export { getDb } from "../../shared/lib/firebase";

export const state = {
  runners: [],
  runs: [],
};

export function runnerRuns(runnerId) {
  return state.runs.filter((run) => run.runnerId === runnerId);
}

export function totalMilesForRunner(runnerId) {
  return runnerRuns(runnerId).reduce((sum, run) => sum + run.miles, 0);
}

export function totalGoalMiles() {
  return state.runners.reduce((sum, runner) => sum + runner.goalMiles, 0);
}

export function combinedMiles() {
  return state.runs.reduce((sum, run) => sum + run.miles, 0);
}

export function runnerById(runnerId) {
  return state.runners.find((runner) => runner.id === runnerId) || null;
}

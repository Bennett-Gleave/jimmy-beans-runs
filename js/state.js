export const state = {
  runners: [],
  runs: [],
  devMode: false,
};

const DEV_MODE_STORAGE_KEY = "jimmy-bean-runs-dev-mode";

export function loadDevMode() {
  try {
    state.devMode = window.localStorage.getItem(DEV_MODE_STORAGE_KEY) === "true";
  } catch {
    state.devMode = false;
  }
}

export function setDevMode(enabled) {
  state.devMode = Boolean(enabled);
  try {
    window.localStorage.setItem(DEV_MODE_STORAGE_KEY, String(state.devMode));
  } catch {
    // ignore storage failures
  }
}

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

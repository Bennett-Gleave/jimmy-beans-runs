import { getDb } from "../lib/chapterApi.js";
import { hasFirebaseConfig as configReady } from "../lib/firebaseConfig.js";
import { state, loadDevMode } from "./state.js";
import { subscribeToQuest, ensureDefaultRunners } from "./firebase.js";
import { render } from "./render.js";
import { populateCharacterOptions, bindUi, setSyncState, syncEndingSequence } from "./ui.js";

async function init() {
  loadDevMode();
  populateCharacterOptions();
  render();

  if (!configReady()) {
    const setupPanel = document.getElementById("setupPanel");
    if (setupPanel) setupPanel.hidden = false;
    setSyncState("Firebase config missing. Set PUBLIC_FIREBASE_* env vars.", "error");
    return;
  }

  const db = getDb();
  bindUi(db);
  syncEndingSequence();

  subscribeToQuest(
    db,
    {
      onUpdate: () => {
        render();
        syncEndingSequence();
      },
      onSyncState: setSyncState,
    },
    state,
  );

  try {
    await ensureDefaultRunners(db);
  } catch (error) {
    console.error(error);
    setSyncState("Could not bootstrap default runners. Check Firestore rules.", "error");
  }
}

init();

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";
import { render } from "./js/render.js";
import { subscribeToQuest, ensureDefaultRunners } from "./js/firebase.js";
import { populateCharacterOptions, bindUi, setSyncState, hasFirebaseConfig } from "./js/ui.js";

async function init() {
  populateCharacterOptions();
  render();

  if (!hasFirebaseConfig(FIREBASE_CONFIG)) {
    document.getElementById("setupPanel").hidden = false;
    setSyncState("Firebase config missing. Fill in firebase-config.js.", "error");
    return;
  }

  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);

  bindUi(db);
  subscribeToQuest(db, { onUpdate: render, onSyncState: setSyncState });

  try {
    await ensureDefaultRunners(db);
  } catch (error) {
    console.error(error);
    setSyncState("Could not bootstrap default runners. Check Firestore rules.", "error");
  }
}

init();

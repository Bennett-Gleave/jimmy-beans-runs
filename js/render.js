import { state, runnerRuns, totalMilesForRunner, totalGoalMiles, combinedMiles } from "./state.js";
import { characterFor, customImageForRunner, formatMiles, parseDateLabel, todayIsoDate } from "./utils.js";
import { MISSION_COPY, MILESTONE_STEP } from "./data.js";

const elements = {
  totalMiles: document.getElementById("totalMiles"),
  goalMiles: document.getElementById("goalMiles"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  ringToken: document.getElementById("ringToken"),
  ringText: document.getElementById("ringText"),
  missions: document.getElementById("missions"),
  runnerGrid: document.getElementById("runnerGrid"),
  runnerCardTemplate: document.getElementById("runnerCardTemplate"),
  logItemTemplate: document.getElementById("logItemTemplate"),
};

function runnerNarration(runner) {
  const goal = Math.max(runner.goalMiles, 1);
  const progress = totalMilesForRunner(runner.id) / goal;

  if (progress >= 1) return "Goal cleared. Officially returning from Mordor.";
  if (progress >= 0.75) return "Final stretch. Lava glow in sight.";
  if (progress >= 0.4) return "Mid-quest form. Fellowship pace is healthy.";
  if (progress > 0) return "Early miles are on the board.";
  return "Fresh quest. No miles logged yet.";
}

function ringNarration(progressRatio, goal) {
  if (goal <= 0) return "The ring waits for the fellowship to form.";
  if (progressRatio >= 1) return "The ring is gone. Mount Doom claims another jewelry victim.";
  if (progressRatio >= 0.8) return "The lava glow is visible. Final push to the crater.";
  if (progressRatio >= 0.6) return "Mordor is near. The road looks hostile but runnable.";
  if (progressRatio >= 0.4) return "Past Rivendell. The fellowship pace is holding.";
  if (progressRatio >= 0.2) return "Beyond the Shire. Bree is in sight.";
  return "The ring has barely left the Shire.";
}

function buildMissionSteps(goalMiles) {
  if (goalMiles <= 0) {
    return [];
  }

  const steps = [];
  let miles = MILESTONE_STEP;
  let index = 0;

  while (miles < goalMiles) {
    const copy = MISSION_COPY[index % MISSION_COPY.length];
    steps.push({
      miles,
      title: copy.title,
      description: copy.description,
    });
    miles += MILESTONE_STEP;
    index += 1;
  }

  steps.push({
    miles: goalMiles,
    title: "Mount Doom",
    description: "Quest complete. The fellowship reached the fire.",
  });

  return steps;
}

export function renderRunnerCards() {
  elements.runnerGrid.innerHTML = "";

  if (state.runners.length === 0) {
    const emptyCard = document.createElement("article");
    emptyCard.className = "character-card empty-card";
    emptyCard.innerHTML = `
      <p class="eyebrow">No Runners Yet</p>
      <h2>Start the fellowship</h2>
      <p class="supporting">Add a runner, pick a character, and set the first monthly goal.</p>
    `;
    elements.runnerGrid.appendChild(emptyCard);
    return;
  }

  const orderedRunners = [...state.runners].sort((a, b) => a.createdAtMs - b.createdAtMs);

  orderedRunners.forEach((runner, index) => {
    const character = characterFor(runner.characterKey);
    const miles = totalMilesForRunner(runner.id);
    const entries = runnerRuns(runner.id)
      .slice()
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
    const card = elements.runnerCardTemplate.content.firstElementChild.cloneNode(true);
    const sprite = card.querySelector(".sprite");
    const roleLabel = card.querySelector(".runner-role");
    const nameLabel = card.querySelector(".runner-name");
    const flavorLabel = card.querySelector(".runner-flavor");
    const mileValue = card.querySelector(".runner-mile-value");
    const goalValue = card.querySelector(".runner-goal-value");
    const entryCount = card.querySelector(".runner-entry-count");
    const form = card.querySelector(".mile-form");
    const runDateInput = form.elements.runDate;
    const log = card.querySelector(".run-log");
    const editRunnerButton = card.querySelector(".edit-runner-button");

    card.dataset.character = character.accent;
    card.dataset.runnerId = runner.id;
    const customImage = customImageForRunner(runner);
    if (customImage) {
      sprite.classList.add("sprite-photo");
      sprite.style.backgroundImage = `url("${customImage}")`;
    } else {
      sprite.classList.add(`sprite-${character.key}`);
    }
    roleLabel.textContent = `Runner ${index + 1} · ${character.label}`;
    nameLabel.textContent = runner.name;
    flavorLabel.textContent = character.flavor;
    mileValue.textContent = formatMiles(miles);
    goalValue.textContent = String(runner.goalMiles);
    entryCount.textContent = String(entries.length);
    form.dataset.runnerId = runner.id;
    runDateInput.value = todayIsoDate();
    editRunnerButton.dataset.runnerId = runner.id;

    const summaryItem = document.createElement("li");
    summaryItem.className = "log-item summary-item";
    summaryItem.innerHTML = `<span class="log-miles">Quest Mood</span><span class="log-date">${runnerNarration(runner)}</span>`;
    log.appendChild(summaryItem);

    entries.forEach((entry) => {
      const item = elements.logItemTemplate.content.firstElementChild.cloneNode(true);
      item.querySelector(".log-miles").textContent = `${formatMiles(entry.miles)} mi`;
      item.querySelector(".log-date").textContent = parseDateLabel(entry.runDate);
      const deleteButton = item.querySelector(".delete-run-button");
      deleteButton.dataset.runId = entry.id;
      deleteButton.textContent = "X";
      log.appendChild(item);
    });

    elements.runnerGrid.appendChild(card);
  });
}

export function renderProgress() {
  const totalMiles = combinedMiles();
  const goalMiles = totalGoalMiles();
  const progressRatio = goalMiles > 0 ? Math.min(totalMiles / goalMiles, 1) : 0;
  const remaining = Math.max(goalMiles - totalMiles, 0);
  const xPosition = 8 + progressRatio * 72;
  const yLift = Math.min(progressRatio * 10, 7);

  elements.totalMiles.textContent = formatMiles(totalMiles);
  elements.goalMiles.textContent = formatMiles(goalMiles);
  elements.progressFill.style.width = `${progressRatio * 100}%`;
  elements.ringToken.style.left = `${xPosition}%`;
  elements.ringToken.style.bottom = `${16 + yLift}px`;
  elements.ringToken.style.transform = progressRatio >= 1 ? "scale(1.15) rotate(12deg)" : "none";
  elements.ringText.textContent = ringNarration(progressRatio, goalMiles);

  if (goalMiles <= 0) {
    elements.progressText.textContent = "Recruit runners to begin the quest.";
  } else if (remaining > 0) {
    elements.progressText.textContent = `${formatMiles(remaining)} miles to Mount Doom`;
  } else {
    elements.progressText.textContent = "Quest complete. The fellowship reached Mount Doom.";
  }
}

export function renderMissions() {
  const steps = buildMissionSteps(totalGoalMiles());
  const totalMiles = combinedMiles();

  elements.missions.innerHTML = "";

  if (steps.length === 0) {
    const empty = document.createElement("article");
    empty.className = "mission-card unlocked";
    empty.innerHTML = "<h3>Waiting On The Fellowship</h3><p>Add a runner to generate the quest path.</p>";
    elements.missions.appendChild(empty);
    return;
  }

  steps.forEach((step) => {
    const card = document.createElement("article");
    card.className = "mission-card";

    if (totalMiles >= step.miles) {
      card.classList.add("unlocked");
    }

    const title = document.createElement("h3");
    title.textContent = `${formatMiles(step.miles)} Miles`;

    const body = document.createElement("p");
    body.textContent = totalMiles >= step.miles
      ? `${step.title}: ${step.description}`
      : `Locked until mile ${formatMiles(step.miles)}.`;

    card.append(title, body);
    elements.missions.appendChild(card);
  });
}

export function render() {
  renderRunnerCards();
  renderProgress();
  renderMissions();
}

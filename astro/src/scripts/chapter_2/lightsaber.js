const cursor = document.createElement("div");
cursor.className = "lightsaber-cursor";
cursor.innerHTML = `
  <span class="ls-blade"></span>
  <span class="ls-hilt"></span>
`;
document.body.appendChild(cursor);
document.body.classList.add("has-lightsaber");

const sideToggle = document.getElementById("sideToggle");
if (sideToggle) {
  const sideLabel = sideToggle.querySelector(".side-toggle-label");
  const setSide = (dark) => {
    document.body.classList.toggle("is-dark-side", dark);
    sideToggle.setAttribute("aria-pressed", dark ? "true" : "false");
    if (sideLabel) sideLabel.textContent = dark ? "Dark Side" : "Light Side";
  };
  sideToggle.addEventListener("click", () => {
    setSide(!document.body.classList.contains("is-dark-side"));
  });
}

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let lastSampleX = mouseX;
let lastSampleTime = performance.now();
let smoothedVel = 0;
let tilt = 0;
let lastDirection = 0;
let visible = false;

const MAX_TILT = 32;
const TILT_GAIN = 0.12;
const VEL_SMOOTHING = 0.35;
const ENTER_THRESHOLD = 12;

function onMove(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
  if (!visible) {
    visible = true;
    cursor.classList.add("is-active");
  }
}

function onLeave() {
  visible = false;
  cursor.classList.remove("is-active");
}

document.addEventListener("mousemove", onMove, { passive: true });
document.addEventListener("mouseleave", onLeave);
document.addEventListener("mouseenter", () => {
  visible = true;
  cursor.classList.add("is-active");
});

let audioCtx = null;
let swooshBuffer = null;
let swooshLoadStarted = false;
const SWOOSH_URL = "/chapter_2/assets/lightsaber-whoosh.mp3";

function getAudio() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

async function loadSwooshBuffer() {
  if (swooshLoadStarted) return;
  swooshLoadStarted = true;
  const ctx = getAudio();
  if (!ctx) return;
  try {
    const res = await fetch(SWOOSH_URL);
    const arrayBuf = await res.arrayBuffer();
    swooshBuffer = await ctx.decodeAudioData(arrayBuf);
  } catch (err) {
    console.error("lightsaber: failed to load swoosh audio", err);
  }
}

function unlockAudio() {
  getAudio();
  loadSwooshBuffer();
}
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

function playSwoosh(intensity = 1) {
  const ctx = getAudio();
  if (!ctx || !swooshBuffer) {
    if (ctx && !swooshLoadStarted) loadSwooshBuffer();
    return;
  }
  const now = ctx.currentTime;
  const isDark = document.body.classList.contains("is-dark-side");

  const source = ctx.createBufferSource();
  source.buffer = swooshBuffer;
  source.playbackRate.value = (isDark ? 0.88 : 1.0) * (0.96 + Math.random() * 0.08);

  const gain = ctx.createGain();
  gain.gain.value = Math.min(0.35, 0.15 + intensity * 0.2);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
}

function tick(time) {
  const dt = Math.max(1, time - lastSampleTime);
  if (dt > 16) {
    const instantaneousVel = (mouseX - lastSampleX) / (dt / 16);
    smoothedVel += (instantaneousVel - smoothedVel) * VEL_SMOOTHING;
    lastSampleX = mouseX;
    lastSampleTime = time;
  }

  const targetTilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, smoothedVel * 1.6));
  tilt += (targetTilt - tilt) * TILT_GAIN;

  cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) rotate(${tilt.toFixed(2)}deg)`;

  let nextDirection = lastDirection;
  if (tilt > ENTER_THRESHOLD) nextDirection = 1;
  else if (tilt < -ENTER_THRESHOLD) nextDirection = -1;

  if (nextDirection !== 0 && nextDirection !== lastDirection) {
    const intensity = Math.min(1, Math.abs(smoothedVel) / 26);
    playSwoosh(intensity);
    lastDirection = nextDirection;
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

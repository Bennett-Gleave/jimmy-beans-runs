import * as THREE from "three";

// Single-page children's-book layout. The flip is a corner peel: a fold line
// sweeps diagonally across the page and the lifted region rolls along a
// cylinder. Vertex positions are updated each frame on the CPU.
const PAGE_WIDTH = 3.0;
const PAGE_HEIGHT = 4.2;
const FLIP_DURATION_MS = 1100;
const TEXTURE_WIDTH = 1100;
const TEXTURE_HEIGHT = Math.round(TEXTURE_WIDTH * (PAGE_HEIGHT / PAGE_WIDTH));
const SEG_W = 36;
const SEG_H = 28;

// ----------------------------------------------------------------------
// Page texture (children's book look). Unchanged from prior version.
// ----------------------------------------------------------------------
function buildPageTexture(chapter) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = TEXTURE_WIDTH;
    canvas.height = TEXTURE_HEIGHT;
    const ctx = canvas.getContext("2d");

    function commit() {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      resolve(tex);
    }

    drawPage(ctx, chapter);

    if (chapter?.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        drawPage(ctx, chapter, img);
        commit();
      };
      img.onerror = () => commit();
      img.src = chapter.imageUrl;
    } else {
      commit();
    }
  });
}

function drawPage(ctx, chapter, image) {
  const W = TEXTURE_WIDTH;
  const H = TEXTURE_HEIGHT;

  const paper = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W);
  paper.addColorStop(0, "#fdf6e1");
  paper.addColorStop(1, "#e6d3a4");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(120, 90, 50, 0.05)";
  for (let i = 0; i < 320; i += 1) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.6 + 0.4;
    ctx.fillRect(x, y, r, r);
  }

  const inset = 50;
  ctx.strokeStyle = "#7a4f24";
  ctx.lineWidth = 4;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(inset + 14, inset + 14, W - (inset + 14) * 2, H - (inset + 14) * 2);
  drawCornerFlourishes(ctx, inset + 14, inset + 14, W - (inset + 14) * 2, H - (inset + 14) * 2);

  if (!chapter) return;

  const padX = inset + 38;
  const padY = inset + 56;
  const imageW = W - padX * 2;
  const imageH = Math.round(H * 0.46);
  const imageX = padX;
  const imageY = padY;

  ctx.save();
  ctx.fillStyle = "#1d1106";
  ctx.fillRect(imageX - 8, imageY - 8, imageW + 16, imageH + 16);
  ctx.beginPath();
  ctx.rect(imageX, imageY, imageW, imageH);
  ctx.clip();

  if (image) {
    const ratio = image.width / image.height;
    const boxRatio = imageW / imageH;
    let dw, dh, dx, dy;
    if (ratio > boxRatio) {
      dh = imageH; dw = imageH * ratio;
      dx = imageX - (dw - imageW) / 2; dy = imageY;
    } else {
      dw = imageW; dh = imageW / ratio;
      dx = imageX; dy = imageY - (dh - imageH) / 2;
    }
    ctx.drawImage(image, dx, dy, dw, dh);
  } else {
    const grad = ctx.createLinearGradient(imageX, imageY, imageX + imageW, imageY + imageH);
    grad.addColorStop(0, "#5b3a18");
    grad.addColorStop(1, "#a06d36");
    ctx.fillStyle = grad;
    ctx.fillRect(imageX, imageY, imageW, imageH);
    ctx.fillStyle = "rgba(255, 232, 188, 0.92)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold 240px "Georgia", "Times New Roman", serif`;
    ctx.fillText((chapter.title?.[0] || "?").toUpperCase(), imageX + imageW / 2, imageY + imageH / 2);
  }
  ctx.restore();

  ctx.save();
  const innerShadow = ctx.createLinearGradient(imageX, imageY, imageX, imageY + 20);
  innerShadow.addColorStop(0, "rgba(0,0,0,0.3)");
  innerShadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = innerShadow;
  ctx.fillRect(imageX, imageY, imageW, 20);
  ctx.restore();

  const textTop = imageY + imageH + 70;
  ctx.textBaseline = "top";

  ctx.fillStyle = "#8c6a3b";
  ctx.textAlign = "center";
  ctx.font = `600 26px "Georgia", serif`;
  ctx.fillText((chapter.eyebrow || "Chapter").toUpperCase().split("").join(" "), W / 2, textTop);

  const dashY = textTop + 38;
  ctx.strokeStyle = "#a07d4a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, dashY); ctx.lineTo(W / 2 - 14, dashY);
  ctx.moveTo(W / 2 + 14, dashY); ctx.lineTo(W / 2 + 60, dashY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, dashY, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#a07d4a";
  ctx.fill();

  ctx.fillStyle = "#2a1707";
  ctx.font = `bold italic 70px "Georgia", "Times New Roman", serif`;
  wrapText(ctx, chapter.title || "Untitled", W / 2, dashY + 28, W - 240, 76, 2);

  ctx.fillStyle = "#4a341c";
  ctx.font = `300 32px "Georgia", serif`;
  const descY = dashY + 28 + 76 * 2 + 24;
  wrapText(ctx, chapter.description || defaultDescription(chapter), W / 2, descY, W - 260, 42, 4);

  ctx.fillStyle = "#7a4f24";
  ctx.font = `italic 28px "Georgia", serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`— ${chapter.id || ""} —`, W / 2, H - inset - 28);
}

function drawCornerFlourishes(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = "#7a4f24";
  ctx.lineWidth = 1.5;
  const len = 22;
  [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * 6, cy + dy * 6);
    ctx.quadraticCurveTo(cx + dx * 12, cy + dy * 6, cx + dx * len, cy + dy * len);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + dx * 8, cy + dy * 8, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = "#7a4f24";
    ctx.fill();
  });
  ctx.restore();
}

function defaultDescription(chapter) {
  if (chapter.month && chapter.year) {
    return `A run quest set in ${monthName(chapter.month)} ${chapter.year}.`;
  }
  return "Open this chapter to log miles with the fellowship.";
}

function monthName(m) {
  return new Date(2000, (Number(m) || 1) - 1, 1).toLocaleString("en-US", { month: "long" });
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) current = test;
    else { if (current) lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length > 0) {
    visible[visible.length - 1] = visible[visible.length - 1].replace(/\s*\S+$/, "") + "…";
  }
  visible.forEach((line, i) => ctx.fillText(line, cx, y + i * lineHeight));
}

// ----------------------------------------------------------------------
// Custom shader so one mesh shows different textures front vs. back.
// ----------------------------------------------------------------------
const PAGE_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalWorld;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vNormalWorld = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const PAGE_FRAG = /* glsl */ `
uniform sampler2D texFront;
uniform sampler2D texBack;
uniform float lightStrength;
varying vec2 vUv;
varying vec3 vNormalWorld;
void main() {
  vec3 n = normalize(vNormalWorld);
  vec4 col;
  if (gl_FrontFacing) {
    col = texture2D(texFront, vUv);
  } else {
    col = texture2D(texBack, vec2(1.0 - vUv.x, vUv.y));
  }
  // Soft directional shading from a fixed light direction.
  vec3 lightDir = normalize(vec3(0.4, 0.7, 0.6));
  float facing = abs(dot(n, lightDir));
  float shade = mix(0.78, 1.0, smoothstep(0.0, 1.0, facing));
  // Subtle ambient occlusion in the curl crease (where normal points sideways)
  float crease = pow(1.0 - abs(n.z), 1.4);
  shade *= mix(1.0, 0.78, crease * 0.5);
  gl_FragColor = vec4(col.rgb * shade, col.a);
}
`;

function makePageMaterial(texFront, texBack) {
  return new THREE.ShaderMaterial({
    uniforms: {
      texFront: { value: texFront || null },
      texBack: { value: texBack || null },
      lightStrength: { value: 1 },
    },
    vertexShader: PAGE_VERT,
    fragmentShader: PAGE_FRAG,
    side: THREE.DoubleSide,
    transparent: false,
  });
}

// ----------------------------------------------------------------------
// Corner-curl deformer. Mutates geometry vertex positions in-place.
//
// Geometry is in local plane space:
//   x ∈ [-W/2, W/2], y ∈ [-H/2, H/2], z = 0 when flat.
// The page is anchored on the LEFT edge (x = -W/2). The user "grabs" the
// bottom-right corner; as progress p goes 0 → 1 the grabbed corner moves
// along a gentle arc to the bottom-left, with the lift creating a smooth
// cylindrical curl from a moving fold line.
// ----------------------------------------------------------------------
function applyCurl(geometry, original, p) {
  const W = PAGE_WIDTH;
  const H = PAGE_HEIGHT;
  const C0x = W / 2;
  const C0y = -H / 2;

  // Lifted-corner path: bottom-right → far past bottom-left so that at p=1
  // the entire page is past the fold line and lies flat on the back side.
  // The corner also lifts in y mid-flip for a curved, peeling path.
  const ep = Math.min(Math.max(p, 0), 1);
  const C1x = C0x - 4 * W * ep;
  const C1y = C0y + Math.sin(Math.PI * ep) * 0.9;

  const dx = C1x - C0x;
  const dy = C1y - C0y;
  const axisLen = Math.sqrt(dx * dx + dy * dy);

  const positions = geometry.attributes.position;

  if (axisLen < 0.0005) {
    positions.array.set(original);
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return;
  }

  const ax = dx / axisLen;
  const ay = dy / axisLen;
  // Perpendicular in plane (rotate 90° CCW).
  const px = -ay;
  const py = ax;

  const halfAxis = axisLen / 2;
  // Cylinder radius — small enough that even the leftmost vertex passes
  // 180° at p=1, so the page truly turns over instead of folding partway.
  const R = Math.max(halfAxis * 0.22, 0.18);
  const PI = Math.PI;

  for (let i = 0; i < positions.count; i += 1) {
    const oi = i * 3;
    const ox = original[oi];
    const oy = original[oi + 1];

    // Position relative to C0, in axis/perp coords.
    const rx = ox - C0x;
    const ry = oy - C0y;
    const u = rx * ax + ry * ay; // along axis (toward C1)
    const v = rx * px + ry * py; // perpendicular

    // Distance "ahead of fold" toward C0 (positive = needs to be rolled).
    const d = halfAxis - u;

    let nu = u;
    let nz = 0;

    if (d > 0) {
      const arc = d;
      const theta = arc / R;
      if (theta <= PI) {
        nu = halfAxis - R * Math.sin(theta);
        nz = R * (1 - Math.cos(theta));
      } else {
        // Past 180° — page settles flat on the back side, descending from
        // the top of the cylinder back down to ~z=0 over the next stretch.
        const overshoot = arc - PI * R;
        nu = halfAxis + overshoot;
        const settle = Math.min(overshoot / Math.max(R * 1.5, 0.001), 1);
        nz = 2 * R * (1 - settle) + 0.004;
      }
    }

    const nx = C0x + nu * ax + v * px;
    const ny = C0y + nu * ay + v * py;

    positions.setXYZ(i, nx, ny, nz);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

// Smooth S-curve easing.
function easeFlip(t) {
  return (1 - Math.cos(Math.PI * t)) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ----------------------------------------------------------------------
// Book
// ----------------------------------------------------------------------
export class Book {
  constructor(container) {
    this.container = container;
    this.chapters = [];
    this.index = 0;
    this.flipping = null;
    this.opening = null;
    this.opened = false;
    this.dragProgress = 0;
    this.dragging = false;
    this._dragPrepared = null;

    const w = Math.max(container.clientWidth, 400);
    const h = Math.max(container.clientHeight, 400);

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = this.renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.touchAction = "pan-y";
    container.appendChild(canvas);
    this.canvas = canvas;

    this.scene.add(new THREE.AmbientLight(0xfff2dc, 1.0));

    this.bookGroup = new THREE.Group();
    this.bookGroup.rotation.x = -0.05;
    this.scene.add(this.bookGroup);

    // Hardcover (subtle, since we want focus on the page).
    const coverGeo = new THREE.BoxGeometry(PAGE_WIDTH + 0.18, PAGE_HEIGHT + 0.18, 0.16);
    const coverMat = new THREE.MeshBasicMaterial({ color: 0x4a2812 });
    this.cover = new THREE.Mesh(coverGeo, coverMat);
    this.cover.position.z = -0.13;
    this.bookGroup.add(this.cover);

    // Page-stack edges (suggest more pages remain).
    const stackGeo = new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, 0.02);
    const stackMat = new THREE.MeshBasicMaterial({ color: 0xf4e8c8 });
    for (let i = 1; i <= 3; i += 1) {
      const slab = new THREE.Mesh(stackGeo, stackMat);
      slab.position.z = -0.005 - i * 0.012;
      slab.position.x = i * 0.005;
      this.bookGroup.add(slab);
    }

    // Static page (bottom layer — what's revealed when the corner peels).
    this.staticPage = this.makeStaticPage();
    this.staticPage.position.set(0, 0, 0.001);
    this.bookGroup.add(this.staticPage);

    // Curling page (top layer; vertex-deformed during flip).
    this.curlPage = this.makeCurlPage();
    this.curlPage.position.set(0, 0, 0.0025);
    this.curlPage.visible = false;
    this.bookGroup.add(this.curlPage);

    // Closed pose.
    this.bookGroup.scale.setScalar(0.86);
    this.bookGroup.rotation.y = -0.4;
    this.bookGroup.position.y = -0.1;

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
    this._resizeObserver = new ResizeObserver(() => this.handleResize());
    this._resizeObserver.observe(container);
    requestAnimationFrame(() => this.handleResize());

    this.tick = this.tick.bind(this);
    this.startMs = performance.now();
    requestAnimationFrame(this.tick);

    this.bindPointer();

    // Show a blank decorated page immediately so we never flash "Loading…"
    // while waiting for chapter data to arrive.
    buildPageTexture(null).then((tex) => {
      if (this.staticPage.material.uniforms.texFront.value) return;
      this.staticPage.material.uniforms.texFront.value = tex;
      this.staticPage.material.uniforms.texBack.value = tex;
    });
  }

  makeStaticPage() {
    const geo = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, 1, 1);
    const mat = makePageMaterial();
    return new THREE.Mesh(geo, mat);
  }

  makeCurlPage() {
    const geo = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, SEG_W, SEG_H);
    geo.userData.original = new Float32Array(geo.attributes.position.array);
    const mat = makePageMaterial();
    return new THREE.Mesh(geo, mat);
  }

  resetCurlGeometry() {
    const geo = this.curlPage.geometry;
    geo.attributes.position.array.set(geo.userData.original);
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  async setChapters(chapters) {
    this.chapters = chapters;
    if (!chapters.length) return;
    if (this.index >= chapters.length) this.index = chapters.length - 1;
    if (this.index < 0) this.index = 0;
    await this.applyStaticPage();
    if (!this.opened) this.openBook();
  }

  async goTo(index, { animate = true } = {}) {
    if (this.flipping) return;
    if (index < 0 || index >= this.chapters.length) return;
    if (index === this.index) return;
    if (!animate) {
      this.index = index;
      await this.applyStaticPage();
      return;
    }

    const direction = index > this.index ? 1 : -1;
    const curr = this.chapters[this.index];
    const next = this.chapters[index];

    const [currTex, nextTex] = await Promise.all([
      buildPageTexture(curr),
      buildPageTexture(next),
    ]);

    if (direction === 1) {
      // Forward: the static page underneath shows the NEW chapter, the curling
      // page on top shows the CURRENT chapter and peels from the right corner.
      this.staticPage.material.uniforms.texFront.value = nextTex;
      this.staticPage.material.uniforms.texBack.value = nextTex;
      this.curlPage.material.uniforms.texFront.value = currTex;
      this.curlPage.material.uniforms.texBack.value = nextTex; // visible underside
    } else {
      // Backward: the static page (underneath) shows the PREVIOUS chapter; the
      // curling page peels in reverse, starting fully curled at the left.
      this.staticPage.material.uniforms.texFront.value = next; // sentinel; replaced below
      this.staticPage.material.uniforms.texFront.value = nextTex;
      this.staticPage.material.uniforms.texBack.value = nextTex;
      this.curlPage.material.uniforms.texFront.value = nextTex;
      this.curlPage.material.uniforms.texBack.value = currTex;
    }

    this.curlPage.visible = true;
    this.flipping = {
      startMs: performance.now(),
      direction,
      targetIndex: index,
    };
  }

  next() {
    this.goTo(Math.min(this.index + 1, this.chapters.length - 1));
  }

  prev() {
    this.goTo(Math.max(this.index - 1, 0));
  }

  async applyStaticPage() {
    const cur = this.chapters[this.index];
    const tex = await buildPageTexture(cur);
    this.staticPage.material.uniforms.texFront.value = tex;
    this.staticPage.material.uniforms.texBack.value = tex;
    this.curlPage.visible = false;
    this.resetCurlGeometry();
    this.notifyChange();
  }

  openBook() {
    this.opening = { startMs: performance.now() };
  }

  onChange(cb) {
    this._onChange = cb;
  }

  notifyChange() {
    this._onChange?.(this.chapters[this.index] ?? null, this.index, this.chapters.length);
  }

  // ---- pointer / drag --------------------------------------------------

  bindPointer() {
    const el = this.canvas;
    let active = false;
    let startX = 0;

    const onDown = (e) => {
      if (this.flipping) return;
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      active = true;
      startX = x;
      this.dragging = true;
    };
    const onMove = (e) => {
      if (!active || this.flipping) return;
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const dx = (x - startX) / el.clientWidth;
      this.dragProgress = Math.max(-1, Math.min(1, dx * -1.6));
    };
    const onUp = () => {
      if (!active) return;
      active = false;
      this.dragging = false;
      const threshold = 0.35;
      if (this.dragProgress > threshold) this.prev();
      else if (this.dragProgress < -threshold) this.next();
      this.dragProgress = 0;
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
  }

  // ---- per-frame -------------------------------------------------------

  tick(now) {
    requestAnimationFrame(this.tick);

    if (this.opening) {
      const t = Math.min((now - this.opening.startMs) / 1500, 1);
      const e = easeOutCubic(t);
      this.bookGroup.scale.setScalar(0.86 + (1 - 0.86) * e);
      this.bookGroup.rotation.y = -0.4 + 0.4 * e;
      this.bookGroup.position.y = -0.1 + 0.1 * e;
      if (t >= 1) {
        this.opening = null;
        this.opened = true;
      }
    }

    if (!this.opening && !this.flipping && !this.dragging) {
      const t = (now - this.startMs) / 1000;
      this.bookGroup.rotation.z = Math.sin(t * 0.45) * 0.012;
      this.bookGroup.position.y = Math.sin(t * 0.6) * 0.03;
    }

    if (this.flipping) {
      const { startMs, direction, targetIndex } = this.flipping;
      const t = Math.min((now - startMs) / FLIP_DURATION_MS, 1);
      const e = easeFlip(t);
      const p = direction === 1 ? e : 1 - e;
      applyCurl(this.curlPage.geometry, this.curlPage.geometry.userData.original, p);

      if (t >= 1) {
        this.flipping = null;
        this.index = targetIndex;
        this.applyStaticPage();
      }
    } else if (this.dragging && Math.abs(this.dragProgress) > 0.02 && !this.opening) {
      const dragForward = this.dragProgress < 0;
      const targetIdx = dragForward ? this.index + 1 : this.index - 1;
      if (targetIdx >= 0 && targetIdx < this.chapters.length) {
        const dragMag = Math.min(Math.abs(this.dragProgress), 1);
        if (
          !this._dragPrepared ||
          this._dragPrepared.from !== this.index ||
          this._dragPrepared.dir !== (dragForward ? 1 : -1)
        ) {
          this._dragPrepared = {
            from: this.index,
            dir: dragForward ? 1 : -1,
            ready: false,
          };
          Promise.all([
            buildPageTexture(this.chapters[this.index]),
            buildPageTexture(this.chapters[targetIdx]),
          ]).then(([cur, nxt]) => {
            if (dragForward) {
              this.staticPage.material.uniforms.texFront.value = nxt;
              this.staticPage.material.uniforms.texBack.value = nxt;
              this.curlPage.material.uniforms.texFront.value = cur;
              this.curlPage.material.uniforms.texBack.value = nxt;
            } else {
              this.staticPage.material.uniforms.texFront.value = nxt;
              this.staticPage.material.uniforms.texBack.value = nxt;
              this.curlPage.material.uniforms.texFront.value = nxt;
              this.curlPage.material.uniforms.texBack.value = cur;
            }
            this.curlPage.visible = true;
            this._dragPrepared.ready = true;
          });
        }
        if (this._dragPrepared?.ready) {
          const p = dragForward ? dragMag : 1 - dragMag;
          applyCurl(this.curlPage.geometry, this.curlPage.geometry.userData.original, p);
        }
      }
    } else if (!this.dragging && this._dragPrepared) {
      // Reset after drag without commit.
      this._dragPrepared = null;
      this.applyStaticPage();
    }

    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    const portrait = w / h < 0.8;
    this.camera.position.z = portrait ? 6.4 : 8;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
    this._resizeObserver?.disconnect();
    this.renderer.dispose();
    this.container.innerHTML = "";
  }
}

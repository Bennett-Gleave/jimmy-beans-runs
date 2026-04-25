import {
  subscribeToChapters,
  ensureChapter,
  subscribeToUsers,
  ensureUser,
  updateUser,
  deleteUser,
  subscribeToCharacters,
  ensureCharacter,
  deleteCharacter,
  subscribeToParticipants,
  saveParticipant,
  deleteParticipant,
  uploadImage,
} from "../lib/admin.js";

// ---- live state --------------------------------------------------------

const state = {
  chapters: [],
  users: [],
  charactersByChapter: {},
  participantsByChapter: {},
  route: { name: "users", chapterId: null }, // "users" | "chapter"
};

const characterUnsubs = new Map();
const participantUnsubs = new Map();

init();

function init() {
  bindStaticUi();
  parseRoute();

  subscribeToChapters((chapters) => {
    state.chapters = chapters;
    renderSidebar();
    chapters.forEach((c) => {
      if (!characterUnsubs.has(c.id)) {
        characterUnsubs.set(
          c.id,
          subscribeToCharacters(c.id, (chars) => {
            state.charactersByChapter[c.id] = chars;
            renderSidebar();
            if (state.route.name === "chapter" && state.route.chapterId === c.id) {
              renderChapterView();
            }
          }),
        );
      }
      if (!participantUnsubs.has(c.id)) {
        participantUnsubs.set(
          c.id,
          subscribeToParticipants(c.id, (ps) => {
            state.participantsByChapter[c.id] = ps;
            renderSidebar();
            if (state.route.name === "chapter" && state.route.chapterId === c.id) {
              renderChapterView();
            }
          }),
        );
      }
    });
    renderRoute();
  });

  subscribeToUsers((users) => {
    state.users = users.sort((a, b) => a.displayName.localeCompare(b.displayName));
    renderUsers();
    refreshParticipantUserSelect();
  });

  window.addEventListener("hashchange", () => {
    parseRoute();
    renderRoute();
  });
}

// ---- routing -----------------------------------------------------------

function parseRoute() {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash.startsWith("chapter/")) {
    state.route = { name: "chapter", chapterId: hash.slice("chapter/".length) };
  } else if (hash === "users" || hash === "") {
    state.route = { name: "users", chapterId: null };
  } else {
    state.route = { name: "users", chapterId: null };
  }
}

function navigate(hash) {
  if (window.location.hash !== `#${hash}`) {
    window.location.hash = hash;
  } else {
    parseRoute();
    renderRoute();
  }
}

function renderRoute() {
  const usersView = document.getElementById("view-users");
  const chapterView = document.getElementById("view-chapter");
  const emptyView = document.getElementById("view-empty");
  usersView.hidden = true;
  chapterView.hidden = true;
  emptyView.hidden = true;

  if (state.route.name === "users") {
    usersView.hidden = false;
  } else if (state.route.name === "chapter") {
    const chapter = state.chapters.find((c) => c.id === state.route.chapterId);
    if (!chapter) {
      // Chapter not loaded yet (or doesn't exist) — show empty view as fallback.
      emptyView.hidden = false;
    } else {
      chapterView.hidden = false;
      renderChapterView();
    }
  }
  renderSidebar();
}

// ---- sidebar -----------------------------------------------------------

function renderSidebar() {
  // Highlight Users link
  document.querySelectorAll(".admin-sidebar .tab-button").forEach((btn) => {
    if (btn.dataset.route === "users") {
      btn.classList.toggle("is-active", state.route.name === "users");
    }
  });

  const nav = document.getElementById("chaptersNav");
  nav.innerHTML = "";
  state.chapters.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "tab-button";
    btn.dataset.chapterId = c.id;
    if (state.route.name === "chapter" && state.route.chapterId === c.id) {
      btn.classList.add("is-active");
    }
    const partCount = (state.participantsByChapter[c.id] || []).length;
    btn.innerHTML = `
      <span>${escapeHtml(c.title)}</span>
      <span class="badge">${partCount}</span>
    `;
    btn.addEventListener("click", () => navigate(`chapter/${c.id}`));
    nav.appendChild(btn);
  });

  if (state.chapters.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.style.padding = "8px 12px";
    empty.style.fontSize = "13px";
    empty.textContent = "No chapters yet.";
    nav.appendChild(empty);
  }
}

// ---- users view --------------------------------------------------------

function renderUsers() {
  const list = document.getElementById("usersList");
  if (!list) return;
  list.innerHTML = "";
  if (state.users.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No users yet.";
    list.replaceWith(empty);
    empty.id = "usersList";
    return;
  }
  state.users.forEach((user) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <div class="avatar">${escapeHtml((user.displayName[0] || "?").toUpperCase())}</div>
      <div>
        <div><strong>${escapeHtml(user.displayName)}</strong></div>
        <div class="row-meta">${escapeHtml(user.id)}</div>
      </div>
      <div class="row-actions">
        <button data-edit-user="${escapeAttr(user.id)}">Rename</button>
        <button class="danger" data-delete-user="${escapeAttr(user.id)}">Delete</button>
      </div>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-edit-user]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const user = state.users.find((u) => u.id === btn.dataset.editUser);
      openUserDialog(user);
    });
  });
  list.querySelectorAll("[data-delete-user]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.deleteUser;
      if (!confirm(`Delete user ${id}? They will remain in any chapters they participate in.`)) return;
      await deleteUser(id);
    });
  });
}

// ---- chapter detail view -----------------------------------------------

function renderChapterView() {
  const chapter = state.chapters.find((c) => c.id === state.route.chapterId);
  if (!chapter) return;
  document.getElementById("chapterCrumb").textContent = chapter.id;
  document.getElementById("chapterTitle").textContent = chapter.title;
  const meta = `${chapter.status} · goal ${chapter.defaultGoalMiles} mi · ${chapter.startDate || "?"} → ${chapter.endDate || "?"}`;
  document.getElementById("chapterMeta").textContent = meta;
  renderParticipants();
  renderCharacters();
}

function renderParticipants() {
  const chapterId = state.route.chapterId;
  if (!chapterId) return;
  let list = document.getElementById("participantsList");
  if (!list) return;
  // Replace empty placeholder back with a list if needed.
  if (list.classList.contains("empty")) {
    const fresh = document.createElement("div");
    fresh.id = "participantsList";
    fresh.className = "list is-table";
    list.replaceWith(fresh);
    list = fresh;
  }
  list.className = "list is-table";
  list.innerHTML = "";
  const ps = state.participantsByChapter[chapterId] || [];
  if (ps.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.id = "participantsList";
    empty.textContent = "No participants in this chapter yet.";
    list.replaceWith(empty);
    return;
  }

  const head = document.createElement("div");
  head.className = "list-head";
  head.innerHTML = `
    <span></span>
    <span>Name</span>
    <span>Character</span>
    <span class="col-num">Goal</span>
    <span></span>
  `;
  list.appendChild(head);

  ps.forEach((p) => {
    const row = document.createElement("div");
    row.className = "list-row";
    const bg = p.imageUrl ? `style="background-image:url('${escapeAttr(p.imageUrl)}')"` : "";
    row.innerHTML = `
      <div class="avatar" ${bg}>${p.imageUrl ? "" : escapeHtml((p.name[0] || "?").toUpperCase())}</div>
      <div class="truncate"><strong>${escapeHtml(p.name)}</strong> <span class="muted">${escapeHtml(p.id)}</span></div>
      <div class="truncate muted">${escapeHtml(p.characterKey)}</div>
      <div class="col-num">${p.goalMiles} mi</div>
      <div class="row-actions">
        <button data-edit-participant="${escapeAttr(p.id)}">Edit</button>
        <button class="danger" data-delete-participant="${escapeAttr(p.id)}">×</button>
      </div>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-edit-participant]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = (state.participantsByChapter[chapterId] || []).find((x) => x.id === btn.dataset.editParticipant);
      openParticipantDialog(p);
    });
  });
  list.querySelectorAll("[data-delete-participant]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.deleteParticipant;
      if (!confirm(`Remove participant ${id} from this chapter?`)) return;
      await deleteParticipant(chapterId, id);
    });
  });
}

function renderCharacters() {
  const chapterId = state.route.chapterId;
  if (!chapterId) return;
  let list = document.getElementById("charactersList");
  if (!list) return;
  if (list.classList.contains("empty")) {
    const fresh = document.createElement("div");
    fresh.id = "charactersList";
    fresh.className = "list";
    list.replaceWith(fresh);
    list = fresh;
  }
  list.innerHTML = "";
  const chars = state.charactersByChapter[chapterId] || [];
  if (chars.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.id = "charactersList";
    empty.textContent = "No characters in this chapter yet.";
    list.replaceWith(empty);
    return;
  }
  chars.forEach((c) => {
    const row = document.createElement("div");
    row.className = "list-row";
    const bg = c.imageUrl ? `style="background-image:url('${escapeAttr(c.imageUrl)}')"` : "";
    row.innerHTML = `
      <div class="avatar" ${bg}>${c.imageUrl ? "" : escapeHtml((c.label[0] || "?").toUpperCase())}</div>
      <div>
        <div><strong>${escapeHtml(c.label)}</strong> <span class="muted">${escapeHtml(c.key)}</span></div>
        <div class="row-meta">${escapeHtml(c.flavor || "")} · accent: ${escapeHtml(c.accent)}</div>
      </div>
      <div class="row-actions">
        <button data-edit-character="${escapeAttr(c.key)}">Edit</button>
        <button class="danger" data-delete-character="${escapeAttr(c.key)}">Delete</button>
      </div>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-edit-character]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = (state.charactersByChapter[chapterId] || []).find((x) => x.key === btn.dataset.editCharacter);
      openCharacterDialog(c);
    });
  });
  list.querySelectorAll("[data-delete-character]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.deleteCharacter;
      if (!confirm(`Delete character ${key}?`)) return;
      await deleteCharacter(chapterId, key);
    });
  });
}

// ---- dialogs -----------------------------------------------------------

function openChapterDialog(chapter) {
  const dialog = document.getElementById("chapterDialog");
  const form = document.getElementById("chapterForm");
  document.getElementById("chapterDialogTitle").textContent = chapter ? `Edit ${chapter.id}` : "New chapter";
  form.reset();
  if (chapter) {
    Object.entries(chapter).forEach(([k, v]) => {
      if (form.elements[k]) form.elements[k].value = v;
    });
    form.elements.id.disabled = true;
  } else {
    form.elements.id.disabled = false;
  }
  hideError("chapterFormError");
  dialog.showModal();
}

function openUserDialog(user) {
  const dialog = document.getElementById("userDialog");
  const form = document.getElementById("userForm");
  document.getElementById("userDialogTitle").textContent = user ? `Edit ${user.id}` : "New user";
  form.reset();
  if (user) {
    form.elements.id.value = user.id;
    form.elements.id.disabled = true;
    form.elements.displayName.value = user.displayName;
  } else {
    form.elements.id.disabled = false;
  }
  hideError("userFormError");
  dialog.showModal();
}

function openCharacterDialog(character) {
  const dialog = document.getElementById("characterDialog");
  const form = document.getElementById("characterForm");
  document.getElementById("characterDialogTitle").textContent = character
    ? `Edit ${character.key}`
    : "New character";
  form.reset();
  document.getElementById("characterImageInput").value = "";
  if (character) {
    form.elements.key.value = character.key;
    form.elements.key.disabled = true;
    form.elements.label.value = character.label;
    form.elements.flavor.value = character.flavor || "";
    form.elements.accent.value = character.accent || "warm";
    document.getElementById("characterImageUrl").value = character.imageUrl || "";
    setAvatarPreview("characterAvatar", character.imageUrl);
  } else {
    form.elements.key.disabled = false;
    document.getElementById("characterImageUrl").value = "";
    setAvatarPreview("characterAvatar", null);
  }
  hideError("characterFormError");
  dialog.showModal();
}

function openParticipantDialog(participant) {
  const dialog = document.getElementById("participantDialog");
  const form = document.getElementById("participantForm");
  document.getElementById("participantDialogTitle").textContent = participant
    ? `Edit ${participant.id}`
    : "Add participant";
  form.reset();
  document.getElementById("participantImageInput").value = "";

  refreshParticipantUserSelect();
  refreshParticipantCharacterSelect();

  if (participant) {
    form.elements.userId.value = participant.id;
    form.elements.userId.disabled = true;
    form.elements.displayName.value = participant.name;
    form.elements.characterKey.value = participant.characterKey;
    form.elements.goalMiles.value = participant.goalMiles;
    document.getElementById("participantImageUrl").value = participant.imageUrl || "";
    setAvatarPreview("participantAvatar", participant.imageUrl);
  } else {
    form.elements.userId.disabled = false;
    document.getElementById("participantImageUrl").value = "";
    setAvatarPreview("participantAvatar", null);
  }
  hideError("participantFormError");
  dialog.showModal();
}

function refreshParticipantUserSelect() {
  const sel = document.getElementById("participantUserSelect");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = "";
  state.users.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.displayName} (${u.id})`;
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

function refreshParticipantCharacterSelect() {
  const sel = document.getElementById("participantCharacterSelect");
  if (!sel) return;
  const chapterId = state.route.chapterId;
  const chars = (chapterId && state.charactersByChapter[chapterId]) || [];
  sel.innerHTML = "";
  chars.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.key;
    opt.textContent = `${c.label} (${c.key})`;
    sel.appendChild(opt);
  });
}

// ---- bindings ----------------------------------------------------------

function bindStaticUi() {
  document.querySelectorAll(".admin-sidebar .tab-button").forEach((btn) => {
    if (btn.dataset.route === "users") {
      btn.addEventListener("click", () => navigate("users"));
    }
  });

  document.getElementById("newChapterBtn").addEventListener("click", () => openChapterDialog(null));
  document.getElementById("newUserBtn").addEventListener("click", () => openUserDialog(null));
  document.getElementById("newCharacterBtn").addEventListener("click", () => {
    if (!state.route.chapterId) return;
    openCharacterDialog(null);
  });
  document.getElementById("newParticipantBtn").addEventListener("click", () => {
    if (!state.route.chapterId) return;
    openParticipantDialog(null);
  });
  document.getElementById("editChapterBtn").addEventListener("click", () => {
    const chapter = state.chapters.find((c) => c.id === state.route.chapterId);
    if (chapter) openChapterDialog(chapter);
  });

  document.querySelectorAll("dialog.modal [data-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog").close());
  });

  // Chapter form submit
  document.getElementById("chapterForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    try {
      const id = f.elements.id.value.trim();
      await ensureChapter({
        id,
        title: f.elements.title.value.trim(),
        themeKey: f.elements.themeKey.value.trim() || id,
        order: Number(f.elements.order.value) || 0,
        month: Number(f.elements.month.value) || 0,
        year: Number(f.elements.year.value) || 0,
        startDate: f.elements.startDate.value,
        endDate: f.elements.endDate.value,
        defaultGoalMiles: Number(f.elements.defaultGoalMiles.value) || 30,
        status: f.elements.status.value,
      });
      f.closest("dialog").close();
      // Jump to the newly created chapter.
      if (!f.elements.id.disabled) navigate(`chapter/${id}`);
    } catch (err) {
      showError("chapterFormError", err);
    }
  });

  // User form submit
  document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    try {
      const id = f.elements.id.value.trim();
      const displayName = f.elements.displayName.value.trim();
      if (f.elements.id.disabled) {
        await updateUser({ id, displayName });
      } else {
        await ensureUser({ id, displayName });
      }
      f.closest("dialog").close();
    } catch (err) {
      showError("userFormError", err);
    }
  });

  // Character form
  const characterImageInput = document.getElementById("characterImageInput");
  characterImageInput.addEventListener("change", async () => {
    const file = characterImageInput.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(`characters/${state.route.chapterId || "unknown"}`, file);
      document.getElementById("characterImageUrl").value = url;
      setAvatarPreview("characterAvatar", url);
    } catch (err) {
      showError("characterFormError", err);
    }
  });

  document.getElementById("characterForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    try {
      const chapterId = state.route.chapterId;
      if (!chapterId) throw new Error("Open a chapter first.");
      await ensureCharacter({
        chapterId,
        key: f.elements.key.value.trim(),
        label: f.elements.label.value.trim(),
        flavor: f.elements.flavor.value.trim(),
        accent: f.elements.accent.value,
        imageUrl: document.getElementById("characterImageUrl").value || undefined,
      });
      f.closest("dialog").close();
    } catch (err) {
      showError("characterFormError", err);
    }
  });

  // Participant form
  const participantImageInput = document.getElementById("participantImageInput");
  participantImageInput.addEventListener("change", async () => {
    const file = participantImageInput.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(`participants/${state.route.chapterId || "unknown"}`, file);
      document.getElementById("participantImageUrl").value = url;
      setAvatarPreview("participantAvatar", url);
    } catch (err) {
      showError("participantFormError", err);
    }
  });

  document.getElementById("participantForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    try {
      const chapterId = state.route.chapterId;
      if (!chapterId) throw new Error("Open a chapter first.");
      await saveParticipant({
        chapterId,
        userId: f.elements.userId.value.trim(),
        displayName: f.elements.displayName.value.trim(),
        characterKey: f.elements.characterKey.value,
        goalMiles: Number(f.elements.goalMiles.value) || 30,
        imageUrl: document.getElementById("participantImageUrl").value || undefined,
      });
      f.closest("dialog").close();
    } catch (err) {
      showError("participantFormError", err);
    }
  });
}

// ---- helpers -----------------------------------------------------------

function setAvatarPreview(elementId, url) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (url) {
    el.style.backgroundImage = `url('${url}')`;
    el.textContent = "";
  } else {
    el.style.backgroundImage = "";
    el.textContent = "img";
  }
}

function showError(id, err) {
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = false;
  el.textContent = err?.message || String(err);
  console.error(err);
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

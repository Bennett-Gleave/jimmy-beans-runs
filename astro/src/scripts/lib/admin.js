// Admin data layer — chapters / users / characters / image upload.
// Mirrors the React app's shared/lib admin helpers, against the same Firestore
// paths so both apps see the same data.
import { getApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getDb } from "./chapterApi.js";

// ---- chapters ----------------------------------------------------------

const CHAPTERS_PATH = "chapters";

function chaptersCol() {
  return collection(getDb(), CHAPTERS_PATH);
}

function chapterRef(id) {
  return doc(getDb(), CHAPTERS_PATH, id);
}

function hydrateChapter(id, data) {
  return {
    id,
    title: data.title || "Untitled Chapter",
    themeKey: data.themeKey || id,
    order: Number(data.order) || 0,
    month: Number(data.month) || 0,
    year: Number(data.year) || 0,
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    defaultGoalMiles: Number(data.defaultGoalMiles) || 0,
    status: data.status || "upcoming",
    createdAtMs: Number(data.createdAtMs) || 0,
  };
}

export function subscribeToChapters(cb, onError) {
  return onSnapshot(
    chaptersCol(),
    (snap) => {
      const chapters = snap.docs
        .map((d) => hydrateChapter(d.id, d.data()))
        .sort((a, b) => a.order - b.order);
      cb(chapters);
    },
    (err) => {
      console.error(err);
      onError?.(err);
    },
  );
}

export async function ensureChapter(input) {
  const ref = chapterRef(input.id);
  const existing = await getDoc(ref);
  const payload = {
    title: input.title,
    themeKey: input.themeKey,
    order: input.order,
    month: input.month,
    year: input.year,
    startDate: input.startDate,
    endDate: input.endDate,
    defaultGoalMiles: input.defaultGoalMiles,
    status: input.status || "upcoming",
    createdAtMs: existing.exists()
      ? Number(existing.data().createdAtMs) || Date.now()
      : Date.now(),
  };
  await setDoc(ref, payload, { merge: true });
}

// ---- users -------------------------------------------------------------

const USERS_PATH = "users";

function usersCol() {
  return collection(getDb(), USERS_PATH);
}

function userRef(id) {
  return doc(getDb(), USERS_PATH, id);
}

export function subscribeToUsers(cb, onError) {
  return onSnapshot(
    usersCol(),
    (snap) => {
      const users = snap.docs.map((d) => ({
        id: d.id,
        displayName: d.data().displayName || "Unnamed Runner",
        createdAtMs: Number(d.data().createdAtMs) || 0,
      }));
      cb(users);
    },
    (err) => {
      console.error(err);
      onError?.(err);
    },
  );
}

export async function ensureUser({ id, displayName }) {
  const ref = userRef(id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    if (existing.data().displayName !== displayName) {
      await updateDoc(ref, { displayName });
    }
    return;
  }
  await setDoc(ref, { displayName, createdAtMs: Date.now() });
}

export async function updateUser({ id, displayName }) {
  await updateDoc(userRef(id), { displayName });
}

export async function deleteUser(id) {
  await deleteDoc(userRef(id));
}

// ---- characters (per chapter) ------------------------------------------

function charactersCol(chapterId) {
  return collection(getDb(), "chapters", chapterId, "characters");
}

function characterRef(chapterId, key) {
  return doc(getDb(), "chapters", chapterId, "characters", key);
}

export function subscribeToCharacters(chapterId, cb, onError) {
  return onSnapshot(
    charactersCol(chapterId),
    (snap) => {
      const characters = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            key: d.id,
            label: data.label || d.id,
            flavor: data.flavor || "",
            accent: data.accent || "warm",
            imageUrl: data.imageUrl,
            createdAtMs: Number(data.createdAtMs) || 0,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      cb(characters);
    },
    (err) => {
      console.error(err);
      onError?.(err);
    },
  );
}

export async function ensureCharacter({ chapterId, key, label, flavor, accent, imageUrl }) {
  const payload = {
    label,
    flavor,
    accent,
    createdAtMs: Date.now(),
  };
  if (imageUrl) payload.imageUrl = imageUrl;
  await setDoc(characterRef(chapterId, key), payload, { merge: true });
}

export async function deleteCharacter(chapterId, key) {
  await deleteDoc(characterRef(chapterId, key));
}

// ---- participants (per chapter) ----------------------------------------
// (Read via chapterApi, but the admin needs direct write access to userId-keyed
// docs without seeding defaults.)

function participantsCol(chapterId) {
  return collection(getDb(), "chapters", chapterId, "participants");
}

function participantRef(chapterId, userId) {
  return doc(getDb(), "chapters", chapterId, "participants", userId);
}

export function subscribeToParticipants(chapterId, cb, onError) {
  return onSnapshot(
    participantsCol(chapterId),
    (snap) => {
      const participants = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.displayName || "Unnamed Runner",
          characterKey: data.characterKey || "",
          goalMiles: Number(data.goalMiles) || 0,
          imageUrl: data.imageUrl,
          createdAtMs: Number(data.createdAtMs) || 0,
        };
      });
      cb(participants);
    },
    (err) => {
      console.error(err);
      onError?.(err);
    },
  );
}

export async function saveParticipant({ chapterId, userId, displayName, characterKey, goalMiles, imageUrl }) {
  // Make sure the user exists first.
  await ensureUser({ id: userId, displayName });
  const payload = {
    userId,
    displayName,
    characterKey,
    goalMiles,
    createdAtMs: Date.now(),
  };
  if (imageUrl) payload.imageUrl = imageUrl;
  await setDoc(participantRef(chapterId, userId), payload, { merge: true });
}

export async function deleteParticipant(chapterId, userId) {
  await deleteDoc(participantRef(chapterId, userId));
}

// ---- image upload ------------------------------------------------------

let _storage = null;
function getStorageInstance() {
  getDb();
  if (!_storage) _storage = getStorage(getApp());
  return _storage;
}

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadImage(pathPrefix, file) {
  const stamp = Date.now();
  const objectRef = ref(getStorageInstance(), `${pathPrefix}/${stamp}-${safeFilename(file.name)}`);
  const snap = await uploadBytes(objectRef, file, { contentType: file.type });
  return await getDownloadURL(snap.ref);
}

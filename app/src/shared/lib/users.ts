import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { User, UserDoc } from "./types";

const USERS_PATH = "users";

function usersCollection() {
  return collection(getDb(), USERS_PATH);
}

function userDocRef(id: string) {
  return doc(getDb(), USERS_PATH, id);
}

function hydrate(id: string, data: UserDoc): User {
  return {
    id,
    displayName: data.displayName || "Unnamed Runner",
    createdAtMs: Number(data.createdAtMs) || 0,
  };
}

export function subscribeToUsers(
  cb: (users: User[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    usersCollection(),
    (snapshot) => {
      const users = snapshot.docs.map((d) =>
        hydrate(d.id, d.data() as UserDoc),
      );
      cb(users);
    },
    (error) => {
      console.error(error);
      onError?.(error);
    },
  );
}

export async function ensureUser(input: {
  id: string;
  displayName: string;
}): Promise<void> {
  const ref = userDocRef(input.id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const current = existing.data() as UserDoc;
    if (current.displayName === input.displayName) return;
    await updateDoc(ref, { displayName: input.displayName });
    return;
  }
  await setDoc(ref, {
    displayName: input.displayName,
    createdAtMs: Date.now(),
  } satisfies UserDoc);
}

export async function updateUser(input: {
  id: string;
  displayName: string;
}): Promise<void> {
  await updateDoc(userDocRef(input.id), { displayName: input.displayName });
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(userDocRef(id));
}

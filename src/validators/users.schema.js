import { getDb } from "../services/firestore.service.js";
import { z } from "zod";

export async function getOrCreateUser(uid, email) {
  const db = getDb();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();

  if (snap.exists) {
    return { id: uid, ...snap.data() };
  }

  const now = new Date().toISOString();

  const doc = {
    email: email || null,
    name: null,
    createdAt: now,
    role: "user",
  };

  await ref.set(doc, { merge: false });

  return { id: uid, ...doc };
}

export async function updateUserName(uid, name) {
  const db = getDb();
  const ref = db.collection("users").doc(uid);

  const snap = await ref.get();
  if (!snap.exists) {
    // kalau belum ada doc (harusnya jarang), buat minimal
    await ref.set(
      { createdAt: new Date().toISOString(), role: "user" },
      { merge: true }
    );
  }

  const updatedAt = new Date().toISOString();
  await ref.set({ name, updatedAt }, { merge: true });

  const latest = await ref.get();
  return { id: uid, ...latest.data() };
}

export const updateMeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "name wajib diisi")
      .max(80, "name maksimal 80 karakter"),
  })
  .strict();
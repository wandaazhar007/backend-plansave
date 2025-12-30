import { getDb } from "./firestore.service.js";

export async function adminListUsers({ limit, cursor }) {
  const db = getDb();

  let query = db.collection("users").orderBy("createdAt", "desc").limit(limit + 1);

  if (cursor) {
    const cursorSnap = await db.collection("users").doc(cursor).get();
    if (!cursorSnap.exists) {
      return { items: [], nextCursor: null, cursorInvalid: true };
    }
    query = query.startAfter(cursorSnap);
  }

  const snap = await query.get();
  const docs = snap.docs;

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  const items = pageDocs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      email: data.email ?? null,
      name: data.name ?? null,
      createdAt: data.createdAt ?? null,
      role: data.role ?? "user",
    };
  });

  const nextCursor = hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1].id : null;

  return { items, nextCursor, cursorInvalid: false };
}

export async function adminGetUserByUid(uid) {
  const db = getDb();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();

  if (!snap.exists) return null;

  const data = snap.data() || {};
  return {
    id: uid,
    email: data.email ?? null,
    name: data.name ?? null,
    createdAt: data.createdAt ?? null,
    role: data.role ?? "user",
  };
}

export async function adminMirrorUserRole(uid, role) {
  const db = getDb();
  const ref = db.collection("users").doc(uid);

  const now = new Date().toISOString();
  await ref.set({ role, updatedAt: now }, { merge: true });
}
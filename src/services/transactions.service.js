import { getDb } from "./firestore.service.js";

const COLLECTION = "transactions";

export async function createTransaction(uid, payload) {
  const db = getDb();
  const now = new Date().toISOString();

  const doc = {
    userId: uid,
    type: payload.type,
    amountCents: payload.amountCents,
    currency: payload.currency || "USD",
    category: payload.category,
    isDialysisRelated: Boolean(payload.isDialysisRelated),
    date: payload.date, // YYYY-MM-DD
    note: payload.note ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTION).add(doc);
  const snap = await ref.get();

  return { id: snap.id, ...snap.data() };
}

export async function getTransactionById(uid, id) {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== uid) return "FORBIDDEN";

  return { id: snap.id, ...data };
}

export async function updateTransaction(uid, id, patch) {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== uid) return "FORBIDDEN";

  const updatedAt = new Date().toISOString();
  await ref.set({ ...patch, updatedAt }, { merge: true });

  const latest = await ref.get();
  return { id: latest.id, ...latest.data() };
}

export async function deleteTransaction(uid, id) {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== uid) return "FORBIDDEN";

  await ref.delete();
  return true;
}

export async function listTransactions(uid, { from, to, type, category, dialysis, limit, cursor }) {
  const db = getDb();

  // Firestore: untuk filter tanggal, kita asumsikan date disimpan string YYYY-MM-DD,
  // sehingga range lexicographic aman.
  let query = db.collection(COLLECTION).where("userId", "==", uid);

  if (type) query = query.where("type", "==", type);
  if (category) query = query.where("category", "==", category);
  if (dialysis !== undefined) query = query.where("isDialysisRelated", "==", dialysis);

  if (from) query = query.where("date", ">=", from);
  if (to) query = query.where("date", "<=", to);

  // orderBy wajib konsisten dengan range filters
  query = query.orderBy("date", "desc").orderBy("createdAt", "desc").limit(limit + 1);

  if (cursor) {
    const cursorSnap = await db.collection(COLLECTION).doc(cursor).get();
    if (!cursorSnap.exists) {
      return { items: [], nextCursor: null, cursorInvalid: true };
    }
    query = query.startAfter(cursorSnap);
  }

  const snap = await query.get();
  const docs = snap.docs;

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  const items = pageDocs.map((d) => ({ id: d.id, ...d.data() }));

  const nextCursor = hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1].id : null;

  return { items, nextCursor, cursorInvalid: false };
}
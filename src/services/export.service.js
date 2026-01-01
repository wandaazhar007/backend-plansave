import { getDb } from "./firestore.service.js";
import admin from "firebase-admin";
import { initFirebaseAdmin } from "../config/firebaseAdmin.js";

const TX_COLLECTION = "transactions";

function normalizeTx(doc) {
  const t = doc.data() || {};
  return {
    id: doc.id,
    userId: t.userId ?? null,
    type: t.type ?? null,
    amountCents: t.amountCents ?? 0,
    currency: t.currency ?? "USD",
    category: t.category ?? null,
    isDialysisRelated: Boolean(t.isDialysisRelated),
    date: t.date ?? null,
    note: t.note ?? null,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  };
}

export async function* iterateTransactionsByDateRange(uid, { from, to, batchSize }) {
  const db = getDb();

  // pastikan admin initialized untuk FieldPath.documentId()
  initFirebaseAdmin();

  const docId = admin.firestore.FieldPath.documentId();

  let lastSnap = null;

  while (true) {
    let q = db
      .collection(TX_COLLECTION)
      .where("userId", "==", uid)
      .where("date", ">=", from)
      .where("date", "<=", to)
      .orderBy("date", "asc")
      .orderBy(docId, "asc")
      .limit(batchSize);

    if (lastSnap) {
      q = q.startAfter(lastSnap);
    }

    const snap = await q.get();
    if (snap.empty) break;

    for (const d of snap.docs) {
      yield normalizeTx(d);
    }

    lastSnap = snap.docs[snap.docs.length - 1];

    // kalau jumlah doc < batchSize, berarti selesai
    if (snap.docs.length < batchSize) break;
  }
}
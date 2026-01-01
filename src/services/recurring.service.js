import { getDb } from "./firestore.service.js";
import { addDaysISO, addMonthsISO, todayISO } from "../utils/date.js";

const COLLECTION = "recurringTransactions";

export function computeNextRunDate(currentRunDate, schedule, intervalDays) {
  if (schedule === "weekly") return addDaysISO(currentRunDate, 7);
  if (schedule === "monthly") return addMonthsISO(currentRunDate, 1);
  // custom
  return addDaysISO(currentRunDate, Number(intervalDays || 1));
}

export async function createRecurring(uid, payload) {
  const db = getDb();
  const now = new Date().toISOString();

  const doc = {
    userId: uid,
    template: {
      type: payload.template.type,
      amountCents: payload.template.amountCents,
      category: payload.template.category,
      isDialysisRelated: Boolean(payload.template.isDialysisRelated),
      note: payload.template.note ?? null,
    },
    schedule: payload.schedule,
    intervalDays: payload.schedule === "custom" ? Number(payload.intervalDays) : null,
    startDate: payload.startDate,
    nextRunDate: payload.nextRunDate || payload.startDate,
    active: Boolean(payload.active),
    createdAt: now,
    updatedAt: now,
    lastRunAt: null,
  };

  const ref = await db.collection(COLLECTION).add(doc);
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function listRecurring(uid) {
  const db = getDb();
  const snap = await db
    .collection(COLLECTION)
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getRecurringById(uid, id) {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== uid) return "FORBIDDEN";
  return { id: snap.id, ...data };
}

export async function updateRecurring(uid, id, patch) {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== uid) return "FORBIDDEN";

  const updatedAt = new Date().toISOString();

  const next = { ...patch, updatedAt };

  // normalisasi intervalDays
  if (patch.schedule && patch.schedule !== "custom") {
    next.intervalDays = null;
  }

  // kalau user update startDate tapi tidak set nextRunDate, default nextRunDate=startDate (aman)
  if (patch.startDate && !patch.nextRunDate) {
    next.nextRunDate = patch.startDate;
  }

  await ref.set(next, { merge: true });

  const latest = await ref.get();
  return { id: latest.id, ...latest.data() };
}

export async function pauseRecurring(uid, id) {
  return updateRecurring(uid, id, { active: false });
}

export async function resumeRecurring(uid, id) {
  // default aman: kalau nextRunDate sudah lewat, set ke hari ini
  const existing = await getRecurringById(uid, id);
  if (existing === "FORBIDDEN") return "FORBIDDEN";
  if (!existing) return null;

  const today = todayISO();
  const nextRunDate = String(existing.nextRunDate || today);
  const patched = { active: true };

  if (nextRunDate < today) {
    patched.nextRunDate = today;
  }

  return updateRecurring(uid, id, patched);
}
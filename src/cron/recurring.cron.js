import cron from "node-cron";
import { getDb } from "../services/firestore.service.js";
import { computeNextRunDate } from "../services/recurring.service.js";
import { checkBudgetAndCreateAlerts } from "../services/alerts.service.js";
import { todayISO, toMonth } from "../utils/date.js";

const RECURRING = "recurringTransactions";
const TX = "transactions";

function txDocId(recurringId, runDate) {
  return `${recurringId}_${runDate}`;
}

/**
 * Jalankan processing recurring untuk "hari ini" (UTC).
 * Idempotent: transaksi docId deterministik, set merge.
 */
export async function processRecurringDue({ runDate = todayISO() } = {}) {
  const db = getDb();

  // Ambil semua recurring aktif yang due <= runDate
  // Firestore mungkin minta index: (active == true, nextRunDate <= date)
  const snap = await db
    .collection(RECURRING)
    .where("active", "==", true)
    .where("nextRunDate", "<=", runDate)
    .get();

  let generated = 0;
  let updatedRecurring = 0;
  let alertsCreated = 0;

  for (const doc of snap.docs) {
    const r = doc.data() || {};
    const recurringId = doc.id;
    const uid = r.userId;

    // safety
    if (!uid || !r.template || !r.nextRunDate) continue;

    // Generate hanya untuk nextRunDate yang due.
    // Kalau nextRunDate jauh di masa lalu, kita tetap generate 1 saja per run agar tidak “backfill” liar.
    const dueDate = String(r.nextRunDate);

    if (dueDate > runDate) continue;

    // 1) Create transaction idempotent
    const newTxId = txDocId(recurringId, dueDate);
    const txRef = db.collection(TX).doc(newTxId);

    const now = new Date().toISOString();
    await txRef.set(
      {
        userId: uid,
        type: r.template.type,
        amountCents: Number(r.template.amountCents || 0),
        currency: "USD", // ASSUMPTION default
        category: r.template.category,
        isDialysisRelated: Boolean(r.template.isDialysisRelated),
        date: dueDate,
        note: r.template.note ?? null,
        source: { kind: "recurring", recurringId },
        createdAt: now,
        updatedAt: now,
      },
      { merge: false }
    );
    generated += 1;

    // 2) Update nextRunDate (move forward)
    const nextDate = computeNextRunDate(
      dueDate,
      r.schedule,
      r.intervalDays
    );

    await db.collection(RECURRING).doc(recurringId).set(
      {
        nextRunDate: nextDate,
        lastRunAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    updatedRecurring += 1;

    // 3) Check budget + create alerts for that month
    const res = await checkBudgetAndCreateAlerts(uid, dueDate);
    alertsCreated += (res.created || []).length;
  }

  return { runDate, generated, updatedRecurring, alertsCreated };
}

export function startRecurringCron({ schedule, timezone } = {}) {
  const cronSchedule = schedule || process.env.CRON_SCHEDULE || "5 2 * * *";
  const cronTimezone = timezone || process.env.CRON_TIMEZONE || "UTC";

  const task = cron.schedule(
    cronSchedule,
    async () => {
      try {
        const result = await processRecurringDue({ runDate: todayISO() });
        // jangan log token/sensitif
        console.log("[CRON] recurring processed:", result);
      } catch (err) {
        console.error("[CRON] recurring failed:", err?.message || err);
      }
    },
    { timezone: cronTimezone }
  );

  task.start();
  return task;
}
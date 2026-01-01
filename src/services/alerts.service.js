import { getDb } from "./firestore.service.js";
import { slugify, toMonth, getMonthRange } from "../utils/date.js";
import { getBudget } from "./budgets.service.js";

const ALERTS = "alerts";
const TX = "transactions";

function alertIdOverall(uid, month) {
  return `${uid}_${month}_overall`;
}

function alertIdCategory(uid, month, category) {
  return `${uid}_${month}_category_${slugify(category)}`;
}

export async function listAlerts(uid, monthOptional) {
  const db = getDb();

  let q = db.collection(ALERTS).where("userId", "==", uid).orderBy("triggeredAt", "desc");

  if (monthOptional) {
    q = q.where("month", "==", monthOptional);
  }

  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function ackAlert(uid, alertId) {
  const db = getDb();
  const ref = db.collection(ALERTS).doc(alertId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== uid) return "FORBIDDEN";

  await ref.set({ acknowledgedAt: new Date().toISOString() }, { merge: true });
  const latest = await ref.get();
  return { id: latest.id, ...latest.data() };
}

/**
 * Check budget status untuk bulan txDate, dan buat alert jika melewati limit.
 * Idempotent: docId alert deterministik.
 */
export async function checkBudgetAndCreateAlerts(uid, txDate) {
  const month = toMonth(txDate);

  const budget = await getBudget(uid, month);
  const budgetExists = budget && budget !== "FORBIDDEN";
  if (!budgetExists) return { created: [] };

  const { from, to } = getMonthRange(month);
  const db = getDb();

  // Hitung expense total + per category pada bulan itu
  const snap = await db
    .collection(TX)
    .where("userId", "==", uid)
    .where("type", "==", "expense")
    .where("date", ">=", from)
    .where("date", "<=", to)
    .get();

  let totalExpenseCents = 0;
  const perCat = new Map();

  for (const doc of snap.docs) {
    const t = doc.data() || {};
    const amount = Number(t.amountCents || 0);
    totalExpenseCents += amount;

    const cat = String(t.category || "Uncategorized");
    perCat.set(cat, (perCat.get(cat) || 0) + amount);
  }

  const created = [];
  const now = new Date().toISOString();

  // Overall alert
  const overallLimit = Number(budget.overallLimitCents || 0);
  if (overallLimit > 0 && totalExpenseCents > overallLimit) {
    const id = alertIdOverall(uid, month);
    const ref = db.collection(ALERTS).doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      const message = "You’re over your overall budget for this month. Let’s get back on track.";
      await ref.set({
        userId: uid,
        month,
        triggeredAt: now,
        type: "overall",
        message,
        createdAt: now,
        updatedAt: now,
        acknowledgedAt: null,
      });
      created.push(id);
    }
  }

  // Category alerts
  const limits = budget.categoryLimits || [];
  for (const cl of limits) {
    const cat = cl.category;
    const limit = Number(cl.limitCents || 0);
    if (!cat || limit <= 0) continue;

    const spent = perCat.get(cat) || 0;
    if (spent > limit) {
      const id = alertIdCategory(uid, month, cat);
      const ref = db.collection(ALERTS).doc(id);
      const existing = await ref.get();

      if (!existing.exists) {
        const message = `You’re over budget in ${cat}. Small steps—let’s adjust and keep going.`;
        await ref.set({
          userId: uid,
          month,
          triggeredAt: now,
          type: "category",
          message,
          meta: { category: cat, limitCents: limit, spentCents: spent },
          createdAt: now,
          updatedAt: now,
          acknowledgedAt: null,
        });
        created.push(id);
      }
    }
  }

  return { created };
}
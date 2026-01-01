import { getDb } from "./firestore.service.js";
import { budgetDocId, getMonthRange } from "../utils/date.js";

const COLLECTION = "budgets";
const TX_COLLECTION = "transactions";

export async function upsertBudget(uid, month, payload) {
  const db = getDb();

  const id = budgetDocId(uid, month);
  const ref = db.collection(COLLECTION).doc(id);

  const now = new Date().toISOString();

  const doc = {
    userId: uid,
    month,
    overallLimitCents: payload.overallLimitCents,
    categoryLimits: payload.categoryLimits ?? [],
    updatedAt: now,
  };

  // kalau baru dibuat, set createdAt juga
  const snap = await ref.get();
  if (!snap.exists) {
    doc.createdAt = now;
  }

  await ref.set(doc, { merge: true });

  const latest = await ref.get();
  return { id: latest.id, ...latest.data() };
}

export async function getBudget(uid, month) {
  const db = getDb();
  const id = budgetDocId(uid, month);
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || data.userId !== uid) return "FORBIDDEN"; // safety
  return { id: snap.id, ...data };
}

/**
 * Hitung status budget bulan tertentu:
 * - spending (income/expense/dialysis)
 * - remaining overall + per category (kalau budget ada)
 */
export async function getBudgetStatus(uid, month) {
  const db = getDb();
  const { from, to } = getMonthRange(month);

  // Ambil budget (boleh null)
  const budget = await getBudget(uid, month);
  const budgetExists = budget && budget !== "FORBIDDEN";

  // Ambil transaksi dalam range bulan (income + expense)
  // Catatan: Firestore bisa minta composite index untuk kombinasi filter/orderBy.
  // Kita gunakan pola orderBy mirip list transactions.
  let q = db
    .collection(TX_COLLECTION)
    .where("userId", "==", uid)
    .where("date", ">=", from)
    .where("date", "<=", to)
    .orderBy("date", "desc")
    .orderBy("createdAt", "desc");

  const snap = await q.get();

  let totalIncomeCents = 0;
  let totalExpenseCents = 0;
  let dialysisExpenseCents = 0;

  const expenseByCategory = new Map(); // category -> expenseCents

  for (const doc of snap.docs) {
    const t = doc.data() || {};
    const amount = Number(t.amountCents || 0);

    if (t.type === "income") {
      totalIncomeCents += amount;
      continue;
    }

    if (t.type === "expense") {
      totalExpenseCents += amount;

      const cat = String(t.category || "Uncategorized");
      expenseByCategory.set(cat, (expenseByCategory.get(cat) || 0) + amount);

      if (t.isDialysisRelated === true) {
        dialysisExpenseCents += amount;
      }
    }
  }

  const expensesPerCategory = Array.from(expenseByCategory.entries()).map(
    ([category, spentCents]) => ({ category, spentCents })
  );

  // Kalau budget tidak ada, tetap kembalikan spending supaya UI bisa empty-state.
  if (!budgetExists) {
    return {
      month,
      range: { from, to },
      budgetSet: false,
      budget: null,
      spending: {
        totalIncomeCents,
        totalExpenseCents,
        dialysisExpenseCents,
        expensesPerCategory,
      },
      remaining: null,
    };
  }

  // Hitung remaining overall & per category
  const overallLimitCents = Number(budget.overallLimitCents || 0);
  const overallRemainingCents = overallLimitCents - totalExpenseCents;

  const categoryRemaining = (budget.categoryLimits || []).map((cl) => {
    const spent = expenseByCategory.get(cl.category) || 0;
    return {
      category: cl.category,
      limitCents: Number(cl.limitCents || 0),
      spentCents: spent,
      remainingCents: Number(cl.limitCents || 0) - spent,
    };
  });

  return {
    month,
    range: { from, to },
    budgetSet: true,
    budget: {
      id: budget.id,
      userId: budget.userId,
      month: budget.month,
      overallLimitCents: budget.overallLimitCents,
      categoryLimits: budget.categoryLimits,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    },
    spending: {
      totalIncomeCents,
      totalExpenseCents,
      dialysisExpenseCents,
      expensesPerCategory,
    },
    remaining: {
      overallLimitCents,
      overallRemainingCents,
      categoryRemaining,
    },
  };
}
import { getDb } from "./firestore.service.js";
import { getMonthRange, getRecentMonths, getCurrentMonth } from "../utils/date.js";
import { getBudget } from "./budgets.service.js";

const TX_COLLECTION = "transactions";

export async function getMonthlyAnalytics(uid, month) {
  const db = getDb();
  const { from, to } = getMonthRange(month);

  // Ambil semua transaksi user di bulan tsb
  // (tanpa orderBy agar index lebih sederhana)
  let q = db
    .collection(TX_COLLECTION)
    .where("userId", "==", uid)
    .where("date", ">=", from)
    .where("date", "<=", to);

  const snap = await q.get();

  let totalIncomeCents = 0;
  let totalExpenseCents = 0;
  let dialysisExpenseCents = 0;

  const expenseByCategory = new Map(); // category -> cents

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

  // Budget remaining (overall + per category) jika budget ada
  const budget = await getBudget(uid, month);
  const budgetExists = budget && budget !== "FORBIDDEN";

  let budgetRemaining = null;

  if (budgetExists) {
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

    budgetRemaining = {
      overallLimitCents,
      overallRemainingCents,
      categoryRemaining,
    };
  }

  return {
    month,
    range: { from, to },
    spending: {
      totalIncomeCents,
      totalExpenseCents,
      dialysisExpenseCents,
      expensesPerCategory,
    },
    budget: budgetExists
      ? {
        id: budget.id,
        userId: budget.userId,
        month: budget.month,
        overallLimitCents: budget.overallLimitCents,
        categoryLimits: budget.categoryLimits,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      }
      : null,
    budgetRemaining,
  };
}

export async function getExpenseTrend(uid, monthsCount) {
  const db = getDb();

  const endMonth = getCurrentMonth();
  const months = getRecentMonths(monthsCount, endMonth); // oldest -> newest

  const first = months[0];
  const last = months[months.length - 1];

  const firstRange = getMonthRange(first);
  const lastRange = getMonthRange(last);

  // Query expenses dari earliest->latest, lalu bucket per bulan
  // (tanpa orderBy agar index lebih sederhana)
  let q = db
    .collection(TX_COLLECTION)
    .where("userId", "==", uid)
    .where("type", "==", "expense")
    .where("date", ">=", firstRange.from)
    .where("date", "<=", lastRange.to);

  const snap = await q.get();

  const monthSet = new Set(months);
  const totals = new Map();
  for (const m of months) totals.set(m, 0);

  for (const doc of snap.docs) {
    const t = doc.data() || {};
    const date = String(t.date || "");
    const m = date.slice(0, 7);
    if (!monthSet.has(m)) continue;

    const amount = Number(t.amountCents || 0);
    totals.set(m, (totals.get(m) || 0) + amount);
  }

  const points = months.map((m) => ({
    month: m,
    totalExpenseCents: totals.get(m) || 0,
  }));

  return {
    months: monthsCount,
    range: { from: firstRange.from, to: lastRange.to },
    points,
  };
}
import { ok, fail } from "../utils/apiResponse.js";
import { budgetMonthParamSchema, upsertBudgetSchema } from "../validators/budgets.schema.js";
import { getBudget, getBudgetStatus, upsertBudget } from "../services/budgets.service.js";

export async function upsert(req, res, next) {
  try {
    const p = budgetMonthParamSchema.safeParse(req.params);
    if (!p.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", p.error.flatten());
    }

    const b = upsertBudgetSchema.safeParse(req.body);
    if (!b.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", b.error.flatten());
    }

    const uid = req.auth.uid;
    const month = p.data.month;

    const saved = await upsertBudget(uid, month, b.data);
    return ok(res, saved);
  } catch (err) {
    return next(err);
  }
}

export async function getByMonth(req, res, next) {
  try {
    const p = budgetMonthParamSchema.safeParse(req.params);
    if (!p.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", p.error.flatten());
    }

    const uid = req.auth.uid;
    const month = p.data.month;

    const budget = await getBudget(uid, month);

    if (budget === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!budget) {
      return fail(res, 404, "NOT_FOUND", "Budget belum diset untuk bulan ini.");
    }

    return ok(res, budget);
  } catch (err) {
    return next(err);
  }
}

export async function status(req, res, next) {
  try {
    const p = budgetMonthParamSchema.safeParse(req.params);
    if (!p.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", p.error.flatten());
    }

    const uid = req.auth.uid;
    const month = p.data.month;

    const result = await getBudgetStatus(uid, month);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}
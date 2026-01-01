import { ok, fail } from "../utils/apiResponse.js";
import { monthlyAnalyticsQuerySchema, trendAnalyticsQuerySchema } from "../validators/analytics.schema.js";
import { getExpenseTrend, getMonthlyAnalytics } from "../services/analytics.service.js";

export async function monthly(req, res, next) {
  try {
    const parsed = monthlyAnalyticsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await getMonthlyAnalytics(uid, parsed.data.month);

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function trend(req, res, next) {
  try {
    const parsed = trendAnalyticsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await getExpenseTrend(uid, parsed.data.months);

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}
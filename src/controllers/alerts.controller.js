import { ok, fail } from "../utils/apiResponse.js";
import { ackAlertSchema, listAlertsQuerySchema } from "../validators/alerts.schema.js";
import { ackAlert, listAlerts } from "../services/alerts.service.js";

export async function list(req, res, next) {
  try {
    const parsed = listAlertsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const items = await listAlerts(uid, parsed.data.month);

    return ok(res, items);
  } catch (err) {
    return next(err);
  }
}

export async function ack(req, res, next) {
  try {
    const parsed = ackAlertSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await ackAlert(uid, parsed.data.alertId);

    if (result === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!result) {
      return fail(res, 404, "NOT_FOUND", "Alert tidak ditemukan.");
    }

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}
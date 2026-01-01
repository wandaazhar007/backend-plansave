import { ok, created, fail } from "../utils/apiResponse.js";
import {
  createRecurringSchema,
  updateRecurringSchema,
  recurringIdParamSchema,
} from "../validators/recurring.schema.js";
import {
  createRecurring,
  listRecurring,
  getRecurringById,
  updateRecurring,
  pauseRecurring,
  resumeRecurring,
} from "../services/recurring.service.js";

export async function create(req, res, next) {
  try {
    const parsed = createRecurringSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const item = await createRecurring(uid, parsed.data);

    return created(res, item);
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const uid = req.auth.uid;
    const items = await listRecurring(uid);
    return ok(res, items);
  } catch (err) {
    return next(err);
  }
}

export async function update(req, res, next) {
  try {
    const p = recurringIdParamSchema.safeParse(req.params);
    if (!p.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", p.error.flatten());
    }

    const b = updateRecurringSchema.safeParse(req.body);
    if (!b.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", b.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await updateRecurring(uid, p.data.id, b.data);

    if (result === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!result) {
      return fail(res, 404, "NOT_FOUND", "RecurringTransaction tidak ditemukan.");
    }

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function pause(req, res, next) {
  try {
    const p = recurringIdParamSchema.safeParse(req.params);
    if (!p.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", p.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await pauseRecurring(uid, p.data.id);

    if (result === "FORBIDDEN") return fail(res, 403, "FORBIDDEN", "Akses ditolak.");
    if (!result) return fail(res, 404, "NOT_FOUND", "RecurringTransaction tidak ditemukan.");

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function resume(req, res, next) {
  try {
    const p = recurringIdParamSchema.safeParse(req.params);
    if (!p.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", p.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await resumeRecurring(uid, p.data.id);

    if (result === "FORBIDDEN") return fail(res, 403, "FORBIDDEN", "Akses ditolak.");
    if (!result) return fail(res, 404, "NOT_FOUND", "RecurringTransaction tidak ditemukan.");

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}
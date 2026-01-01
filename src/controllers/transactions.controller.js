import { ok, created, fail } from "../utils/apiResponse.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionIdParamSchema,
  listTransactionsQuerySchema,
} from "../validators/transactions.schema.js";
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  updateTransaction,
} from "../services/transactions.service.js";

export async function create(req, res, next) {
  try {
    const parsed = createTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const tx = await createTransaction(uid, parsed.data);

    return created(res, tx);
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const parsed = listTransactionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await listTransactions(uid, parsed.data);

    if (result.cursorInvalid) {
      return fail(res, 422, "VALIDATION_ERROR", "Cursor tidak valid.", {
        cursor: "Cursor tidak ditemukan.",
      });
    }

    return ok(res, result.items, { nextCursor: result.nextCursor, limit: parsed.data.limit });
  } catch (err) {
    return next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const parsed = transactionIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await getTransactionById(uid, parsed.data.id);

    if (result === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!result) {
      return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
    }

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function updateById(req, res, next) {
  try {
    const parsedParams = transactionIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsedParams.error.flatten());
    }

    const parsedBody = updateTransactionSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsedBody.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await updateTransaction(uid, parsedParams.data.id, parsedBody.data);

    if (result === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!result) {
      return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
    }

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function removeById(req, res, next) {
  try {
    const parsed = transactionIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const result = await deleteTransaction(uid, parsed.data.id);

    if (result === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!result) {
      return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
    }

    return ok(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
}
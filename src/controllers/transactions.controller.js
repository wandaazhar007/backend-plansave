// import { ok, created, fail } from "../utils/apiResponse.js";
// import {
//   createTransactionSchema,
//   updateTransactionSchema,
//   transactionIdParamSchema,
//   listTransactionsQuerySchema,
// } from "../validators/transactions.schema.js";
// import {
//   createTransaction,
//   deleteTransaction,
//   getTransactionById,
//   listTransactions,
//   updateTransaction,
// } from "../services/transactions.service.js";

// export async function create(req, res, next) {
//   try {
//     const parsed = createTransactionSchema.safeParse(req.body);
//     if (!parsed.success) {
//       return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
//     }

//     const uid = req.auth.uid;
//     const tx = await createTransaction(uid, parsed.data);

//     return created(res, tx);
//   } catch (err) {
//     return next(err);
//   }
// }

// export async function list(req, res, next) {
//   try {
//     const parsed = listTransactionsQuerySchema.safeParse(req.query);
//     if (!parsed.success) {
//       return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
//     }

//     const uid = req.auth.uid;
//     const result = await listTransactions(uid, parsed.data);

//     if (result.cursorInvalid) {
//       return fail(res, 422, "VALIDATION_ERROR", "Cursor tidak valid.", {
//         cursor: "Cursor tidak ditemukan.",
//       });
//     }

//     return ok(res, result.items, { nextCursor: result.nextCursor, limit: parsed.data.limit });
//   } catch (err) {
//     return next(err);
//   }
// }

// export async function getById(req, res, next) {
//   try {
//     const parsed = transactionIdParamSchema.safeParse(req.params);
//     if (!parsed.success) {
//       return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
//     }

//     const uid = req.auth.uid;
//     const result = await getTransactionById(uid, parsed.data.id);

//     if (result === "FORBIDDEN") {
//       return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
//     }
//     if (!result) {
//       return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
//     }

//     return ok(res, result);
//   } catch (err) {
//     return next(err);
//   }
// }

// export async function updateById(req, res, next) {
//   try {
//     const parsedParams = transactionIdParamSchema.safeParse(req.params);
//     if (!parsedParams.success) {
//       return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsedParams.error.flatten());
//     }

//     const parsedBody = updateTransactionSchema.safeParse(req.body);
//     if (!parsedBody.success) {
//       return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsedBody.error.flatten());
//     }

//     const uid = req.auth.uid;
//     const result = await updateTransaction(uid, parsedParams.data.id, parsedBody.data);

//     if (result === "FORBIDDEN") {
//       return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
//     }
//     if (!result) {
//       return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
//     }

//     return ok(res, result);
//   } catch (err) {
//     return next(err);
//   }
// }

// export async function removeById(req, res, next) {
//   try {
//     const parsed = transactionIdParamSchema.safeParse(req.params);
//     if (!parsed.success) {
//       return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
//     }

//     const uid = req.auth.uid;
//     const result = await deleteTransaction(uid, parsed.data.id);

//     if (result === "FORBIDDEN") {
//       return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
//     }
//     if (!result) {
//       return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
//     }

//     return ok(res, { deleted: true });
//   } catch (err) {
//     return next(err);
//   }
// }




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
import { checkBudgetAndCreateAlerts } from "../services/alerts.service.js";

async function triggerRealTimeAlerts(uid, datesToCheck) {
  // Jalankan sequential (simple & aman), dan jangan gagalkan CRUD jika alert gagal
  for (const dt of datesToCheck) {
    if (!dt) continue;
    try {
      await checkBudgetAndCreateAlerts(uid, dt);
    } catch (err) {
      console.warn("[ALERTS] real-time check failed:", err?.message || err);
    }
  }
}

export async function create(req, res, next) {
  try {
    const parsed = createTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const uid = req.auth.uid;
    const tx = await createTransaction(uid, parsed.data);

    // Real-time alerts: hanya untuk expense
    if (tx?.type === "expense") {
      await triggerRealTimeAlerts(uid, [tx.date]);
    }

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

    // Ambil transaksi lama untuk menentukan bulan yang perlu dicek ulang
    const before = await getTransactionById(uid, parsedParams.data.id);
    if (before === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!before) {
      return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
    }

    const result = await updateTransaction(uid, parsedParams.data.id, parsedBody.data);

    if (result === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!result) {
      return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
    }

    // Real-time alerts:
    // - cek bulan transaksi lama kalau sebelumnya expense
    // - cek bulan transaksi baru kalau sekarang expense
    const datesToCheck = [];
    if (before.type === "expense") datesToCheck.push(before.date);
    if (result.type === "expense") datesToCheck.push(result.date);

    // dedupe
    const unique = [...new Set(datesToCheck.filter(Boolean))];
    if (unique.length > 0) {
      await triggerRealTimeAlerts(uid, unique);
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

    // Ambil transaksi dulu (untuk tahu bulan yang perlu dicek)
    const before = await getTransactionById(uid, parsed.data.id);
    if (before === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!before) {
      return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
    }

    const result = await deleteTransaction(uid, parsed.data.id);

    if (result === "FORBIDDEN") {
      return fail(res, 403, "FORBIDDEN", "Tidak boleh mengakses resource user lain.");
    }
    if (!result) {
      return fail(res, 404, "NOT_FOUND", "Transaction tidak ditemukan.");
    }

    // Setelah delete, cek ulang budget bulan itu jika yang dihapus expense
    if (before.type === "expense") {
      await triggerRealTimeAlerts(uid, [before.date]);
    }

    return ok(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
}
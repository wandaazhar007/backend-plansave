// import { ok, fail } from "../utils/apiResponse.js";
// import { listUsersQuerySchema, userUidParamSchema } from "../validators/admin.schema.js";
// import { adminGetUserByUid, adminListUsers } from "../services/admin.service.js";

// export async function listUsers(req, res, next) {
//   try {
//     const parsed = listUsersQuerySchema.safeParse(req.query);
//     if (!parsed.success) {
//       return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
//     }

//     const { limit, cursor } = parsed.data;

//     const result = await adminListUsers({ limit, cursor });

//     if (result.cursorInvalid) {
//       return fail(res, 422, "VALIDATION_ERROR", "Cursor tidak valid.", {
//         cursor: "Cursor tidak ditemukan.",
//       });
//     }

//     return ok(
//       res,
//       result.items,
//       {
//         nextCursor: result.nextCursor,
//         limit,
//       }
//     );
//   } catch (err) {
//     return next(err);
//   }
// }

// export async function getUserDetail(req, res, next) {
//   try {
//     const parsed = userUidParamSchema.safeParse(req.params);
//     if (!parsed.success) {
//       return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
//     }

//     const { uid } = parsed.data;

//     const user = await adminGetUserByUid(uid);
//     if (!user) {
//       return fail(res, 404, "NOT_FOUND", "User tidak ditemukan.");
//     }

//     return ok(res, user);
//   } catch (err) {
//     return next(err);
//   }
// }





import { ok, fail } from "../utils/apiResponse.js";
import {
  listUsersQuerySchema,
  userUidParamSchema,
  banUserBodySchema,
  unbanUserBodySchema,
} from "../validators/admin.schema.js";
import {
  adminGetUserByUid,
  adminListUsers,
  adminBanUser,
  adminUnbanUser,
} from "../services/admin.service.js";

export async function listUsers(req, res, next) {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const { limit, cursor } = parsed.data;

    const result = await adminListUsers({ limit, cursor });

    if (result.cursorInvalid) {
      return fail(res, 422, "VALIDATION_ERROR", "Cursor tidak valid.", {
        cursor: "Cursor tidak ditemukan.",
      });
    }

    return ok(res, result.items, {
      nextCursor: result.nextCursor,
      limit,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getUserDetail(req, res, next) {
  try {
    const parsed = userUidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const { uid } = parsed.data;

    const user = await adminGetUserByUid(uid);
    if (!user) {
      return fail(res, 404, "NOT_FOUND", "User tidak ditemukan.");
    }

    return ok(res, user);
  } catch (err) {
    return next(err);
  }
}

// ================================
// Ban / Unban (NEW)
// ================================

export async function banUser(req, res, next) {
  try {
    const p = userUidParamSchema.safeParse(req.params);
    if (!p.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", p.error.flatten());
    }

    const b = banUserBodySchema.safeParse(req.body ?? {});
    if (!b.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", b.error.flatten());
    }

    const result = await adminBanUser(p.data.uid, b.data);

    if (!result) {
      // kemungkinan: doc user belum ada, tapi Firebase Auth ada (kita sudah buat doc via merge)
      // kalau tetap null, treat not found
      return fail(res, 404, "NOT_FOUND", "User tidak ditemukan.");
    }

    return ok(res, result);
  } catch (err) {
    if (err?.code === "auth/user-not-found") {
      return fail(res, 404, "NOT_FOUND", "User tidak ditemukan.");
    }
    return next(err);
  }
}

export async function unbanUser(req, res, next) {
  try {
    const p = userUidParamSchema.safeParse(req.params);
    if (!p.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", p.error.flatten());
    }

    const b = unbanUserBodySchema.safeParse(req.body ?? {});
    if (!b.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", b.error.flatten());
    }

    const result = await adminUnbanUser(p.data.uid, b.data);

    if (!result) {
      return fail(res, 404, "NOT_FOUND", "User tidak ditemukan.");
    }

    return ok(res, result);
  } catch (err) {
    if (err?.code === "auth/user-not-found") {
      return fail(res, 404, "NOT_FOUND", "User tidak ditemukan.");
    }
    return next(err);
  }
}
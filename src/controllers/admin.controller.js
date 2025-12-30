import { ok, fail } from "../utils/apiResponse.js";
import { listUsersQuerySchema, userUidParamSchema } from "../validators/admin.schema.js";
import { adminGetUserByUid, adminListUsers } from "../services/admin.service.js";

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

    return ok(
      res,
      result.items,
      {
        nextCursor: result.nextCursor,
        limit,
      }
    );
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
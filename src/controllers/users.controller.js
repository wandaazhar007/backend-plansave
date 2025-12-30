import { ok, fail } from "../utils/apiResponse.js";
import { getOrCreateUser, updateUserName } from "../services/users.service.js";
import { updateMeSchema } from "../validators/users.schema.js";

export async function getMe(req, res, next) {
  try {
    const { uid, email } = req.auth;

    const user = await getOrCreateUser(uid, email);

    // output konsisten sesuai entity
    return ok(res, {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      createdAt: user.createdAt,
      role: user.role,
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const { uid } = req.auth;
    const { name } = parsed.data;

    const user = await updateUserName(uid, name);

    return ok(res, {
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      createdAt: user.createdAt,
      role: user.role ?? "user",
    });
  } catch (err) {
    return next(err);
  }
}
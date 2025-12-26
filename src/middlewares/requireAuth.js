import { admin } from "../config/firebaseAdmin.js";
import { ApiError } from "../utils/errors.js";
import { env } from "../config/env.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "Missing Authorization token.");
    }

    const decoded = await admin
      .auth()
      .verifyIdToken(token, env.VERIFY_ID_TOKEN_REVOKED);

    req.auth = {
      uid: decoded.uid,
      email: decoded.email || null
    };

    return next();
  } catch (err) {
    return next(new ApiError(401, "UNAUTHORIZED", "Invalid or expired token."));
  }
}
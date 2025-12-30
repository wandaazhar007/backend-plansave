import { initFirebaseAdmin } from "../config/firebaseAdmin.js";
import { fail } from "../utils/apiResponse.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return fail(res, 401, "UNAUTHORIZED", "Authorization token diperlukan.");
    }

    const admin = initFirebaseAdmin();

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      return fail(res, 401, "UNAUTHORIZED", "Token tidak valid atau sudah expired.");
    }

    req.auth = {
      uid: decoded.uid,
      email: decoded.email || null,
      claims: decoded,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}
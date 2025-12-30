import { fail } from "../utils/apiResponse.js";
import { getDb } from "../services/firestore.service.js";

export async function requireAdmin(req, res, next) {
  try {
    // requireAuth harus jalan dulu
    const claims = req?.auth?.claims || {};
    const uid = req?.auth?.uid;

    // Prioritas: custom claims
    if (claims.admin === true) return next();

    // Fallback: cek role di Firestore users/{uid}
    if (!uid) {
      return fail(res, 401, "UNAUTHORIZED", "Authorization token diperlukan.");
    }

    const db = getDb();
    const snap = await db.collection("users").doc(uid).get();
    const role = snap.exists ? snap.data()?.role : null;

    if (role === "admin") return next();

    return fail(res, 403, "FORBIDDEN", "Akses admin diperlukan.");
  } catch (err) {
    return next(err);
  }
}
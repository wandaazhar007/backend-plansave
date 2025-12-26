import { Router } from "express";
import { z } from "zod";
import { admin } from "../config/firebaseAdmin.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { ApiError } from "../utils/errors.js";

const router = Router();

const USERS_COLLECTION = "users";

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req.auth;

    const snap = await admin.firestore().collection(USERS_COLLECTION).doc(uid).get();

    return res.json({
      success: true,
      data: snap.exists ? { id: snap.id, ...snap.data() } : null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
// Purpose: ensure user doc exists + update lastLoginAt
router.post("/login", requireAuth, async (req, res, next) => {
  try {
    const { uid, email } = req.auth;

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new ApiError(401, "UNAUTHORIZED", "Missing Authorization token.");

    const decoded = await admin.auth().verifyIdToken(token, false);
    const provider = decoded?.firebase?.sign_in_provider || "unknown";

    const ref = admin.firestore().collection(USERS_COLLECTION).doc(uid);
    const snap = await ref.get();
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (!snap.exists) {
      await ref.set(
        {
          uid,
          email: email || decoded.email || null,
          name: decoded.name || null,
          photoUrl: decoded.picture || null,
          provider,
          currency: null,
          timezone: null,
          isOnboarded: false,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
        },
        { merge: true }
      );
    } else {
      await ref.set(
        {
          provider,
          updatedAt: now,
          lastLoginAt: now,
        },
        { merge: true }
      );
    }

    const finalSnap = await ref.get();

    return res.json({
      success: true,
      data: { id: finalSnap.id, ...finalSnap.data() },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
// Purpose: onboarding profile fields (name/currency/timezone)
router.post("/register", requireAuth, async (req, res, next) => {
  try {
    const bodySchema = z.object({
      name: z.string().trim().min(2).max(60),
      currency: z.string().trim().min(3).max(10).optional().nullable(),
      timezone: z.string().trim().min(3).max(64).optional().nullable(),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(422, "VALIDATION_ERROR", "Invalid payload.");
    }

    const { uid, email } = req.auth;
    const { name, currency, timezone } = parsed.data;

    const ref = admin.firestore().collection(USERS_COLLECTION).doc(uid);
    const snap = await ref.get();

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Jangan overwrite createdAt kalau sudah ada
    const createdAt = snap.exists ? snap.data()?.createdAt ?? null : now;

    await ref.set(
      {
        uid,
        email: email || null,
        name,
        currency: currency ?? null,
        timezone: timezone ?? null,
        isOnboarded: true,
        createdAt: createdAt ?? now,
        updatedAt: now,
      },
      { merge: true }
    );

    const finalSnap = await ref.get();

    return res.json({
      success: true,
      data: { id: finalSnap.id, ...finalSnap.data() },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
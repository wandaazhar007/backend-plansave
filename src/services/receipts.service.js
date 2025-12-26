import crypto from "crypto";
import path from "path";

import { admin } from "../config/firebaseAdmin.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";

function safeExt(filename) {
  const ext = path.extname(filename || "").toLowerCase();
  // allow common image extensions only (MVP)
  const allowed = [".png", ".jpg", ".jpeg", ".webp", ".heic"];
  return allowed.includes(ext) ? ext : "";
}

export async function uploadReceiptToStorage({
  uid,
  originalname,
  mimetype,
  buffer,
  size
}) {
  if (!uid) throw new ApiError(401, "UNAUTHORIZED", "Unauthorized.");
  if (!buffer || size <= 0) throw new ApiError(422, "VALIDATION_ERROR", "Invalid file.");

  // Basic mime allowlist (privacy + safety)
  const allowedMimes = ["image/png", "image/jpeg", "image/webp", "image/heic"];
  if (!allowedMimes.includes(mimetype)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Only image uploads are allowed.");
  }

  const id = crypto.randomUUID();
  const ext = safeExt(originalname) || ".jpg";
  const objectPath = `receipts/${uid}/${id}${ext}`;

  const bucket = admin.storage().bucket();
  const file = bucket.file(objectPath);

  await file.save(buffer, {
    resumable: false,
    contentType: mimetype,
    metadata: {
      metadata: {
        uid,
        originalname: originalname || "",
        uploadedAt: new Date().toISOString()
      }
    }
  });

  // Keep private; use signed URL (time-limited)
  const expiresMs = env.RECEIPT_SIGNED_URL_TTL_MINUTES * 60 * 1000;
  const expiresAt = Date.now() + expiresMs;

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: expiresAt
  });

  return {
    path: objectPath,
    contentType: mimetype,
    size,
    signedUrl,
    signedUrlExpiresAt: new Date(expiresAt).toISOString()
  };
}
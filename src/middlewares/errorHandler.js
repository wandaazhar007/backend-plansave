import { fail } from "../utils/apiResponse.js";

export function notFoundHandler(req, res) {
  return fail(res, 404, "NOT_FOUND", "Endpoint tidak ditemukan.");
}

export function errorHandler(err, req, res, next) {
  if (err?.message === "CORS_NOT_ALLOWED") {
    return fail(res, 403, "FORBIDDEN", "Origin tidak diizinkan oleh CORS.");
  }

  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    console.error("[ERROR]", {
      message: err?.message,
      stack: err?.stack,
      requestId: req?.requestId,
    });
  } else {
    console.error("[ERROR]", {
      message: err?.message,
      requestId: req?.requestId,
    });
  }

  return fail(res, 500, "INTERNAL_ERROR", "Terjadi kesalahan pada server.");
}
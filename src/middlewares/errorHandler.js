import { ApiError } from "../utils/errors.js";

export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;

  const status = isApiError ? err.status : 500;
  const code = isApiError ? err.code : "INTERNAL_ERROR";

  // Calm + clear messaging; no sensitive details leaked (privacy-first)
  const message =
    isApiError ? err.message : "Something went wrong. Please try again.";

  // Optional: log error safely (pino-http already exists)
  req.log?.error(
    {
      code,
      status,
      path: req.path,
      method: req.method
    },
    "request_error"
  );

  res.status(status).json({
    success: false,
    error: { code, message }
  });
}
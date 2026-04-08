export function buildCorsOptions(env) {
  const raw = String(env.CORS_ALLOWLIST || "").trim();

  // Default allowlist utk dev kalau env belum diisi
  const defaults =
    env.NODE_ENV === "production"
      ? ["https://app.plansave.com"]
      : ["http://localhost:5173", "http://127.0.0.1:5173"];

  const allowlist = new Set(
    (raw ? raw.split(",") : defaults)
      .map((s) => s.trim())
      .filter(Boolean)
  );

  return {
    origin(origin, callback) {
      // Allow non-browser clients (curl, Postman)
      if (!origin) return callback(null, true);

      if (allowlist.has(origin)) return callback(null, true);

      return callback(new Error("CORS_NOT_ALLOWED"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    optionsSuccessStatus: 204,
  };
}
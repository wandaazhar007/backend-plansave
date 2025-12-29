export function buildCorsOptions(env) {
  const allowlist = new Set(
    String(env.CORS_ALLOWLIST || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  return {
    origin(origin, callback) {
      // Allow non-browser clients (curl, Postman) yang biasanya tidak kirim Origin
      if (!origin) return callback(null, true);

      if (allowlist.has(origin)) return callback(null, true);

      return callback(new Error("CORS_NOT_ALLOWED"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
  };
}
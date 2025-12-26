export function buildCorsOptions(env) {
  const allowList = (env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    origin(origin, cb) {
      // Allow non-browser clients (like Postman / server-to-server)
      if (!origin) return cb(null, true);

      if (allowList.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400
  };
}
// src/app.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";

import apiV1Router from "./routes/index.js";
import { env } from "./config/env.js";
import { buildCorsOptions } from "./config/cors.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();

// Trust proxy penting kalau nanti deploy di balik Nginx (rate limit & IP)
app.set("trust proxy", 1);

// Request id (untuk tracing log)
app.use((req, res, next) => {
  const reqId = req.headers["x-request-id"] || randomUUID();
  res.setHeader("x-request-id", String(reqId));
  req.requestId = String(reqId);
  next();
});

// Logging basic (hindari log Authorization header)
morgan.token("reqId", (req) => req.requestId);
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms rid=:reqId", {
    skip: () => env.NODE_ENV === "test",
  })
);

// Security headers
app.use(helmet());

// ✅ CORS allowlist (single source of truth)
// IMPORTANT:
// - kalau env.CORS_ALLOWLIST kosong, di local dev akan selalu kena CORS_NOT_ALLOWED.
// - jadi kita kasih default aman utk dev & production app domain.
const resolvedEnv = {
  ...env,
  CORS_ALLOWLIST:
    (env.CORS_ALLOWLIST && String(env.CORS_ALLOWLIST).trim()) ||
    "http://localhost:5173,https://app.plansave.com",
};

const corsOptions = buildCorsOptions(resolvedEnv);

// CORS middleware
app.use(cors(corsOptions));

// ✅ Preflight (OPTIONS) handler
// Jangan pakai "*" (bisa error di path-to-regexp). Pakai regex agar kompatibel.
app.options(/.*/, cors(corsOptions));

// Body parsing (masih aman untuk Step 1)
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

// Rate limiting global
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Terlalu banyak request. Coba lagi sebentar.",
      },
    },
  })
);

// Mount API v1
app.use("/api/v1", apiV1Router);

// 404 handler
app.use(notFoundHandler);

// Global error handler (format konsisten)
app.use(errorHandler);

export default app;
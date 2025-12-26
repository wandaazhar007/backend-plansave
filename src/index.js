import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { buildCorsOptions } from "./config/cors.js";
import { buildRateLimiter } from "./config/rateLimit.js";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import { securityHeaders } from "./config/securityHeaders.js";

import routes from "./routes/index.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

async function main() {
  // Init Firebase Admin early (fail fast)
  initFirebaseAdmin();

  const app = express();

  // Security-first defaults (API)
  app.disable("x-powered-by");
  app.use(helmet(securityHeaders));
  app.use(cors(buildCorsOptions(env)));
  app.use(buildRateLimiter(env));

  // Logging (do not log sensitive payloads)
  app.use(
    pinoHttp({
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.password",
          "req.body.idToken",
        ],
        remove: true,
      },
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // ✅ Add /api prefix for ALL routes
  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`PlanSave API running on http://localhost:${env.PORT}/api/health`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err?.message || err);
  process.exit(1);
});
import { createServer } from "node:http";
import app from "./src/app.js";
import { env } from "./src/config/env.js";

const server = createServer(app);

server.listen(env.PORT, () => {
  // Jangan print env sensitif
  console.log(`[PlanSave API] listening on http://localhost:${env.PORT}`);
});

process.on("SIGTERM", () => {
  console.log("[PlanSave API] SIGTERM received, shutting down...");
  server.close(() => process.exit(0));
});
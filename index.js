import { createServer } from "node:http";
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { startRecurringCron } from "./src/cron/recurring.cron.js";

const server = createServer(app);
const port = process.env.PORT || 5014;

server.listen(port, () => {
  console.log(`[SERVER] running on port ${port}`);

  if (String(process.env.ENABLE_CRON).toLowerCase() === "true") {
    startRecurringCron();
    console.log("[CRON] recurring cron enabled");
  } else {
    console.log("[CRON] recurring cron disabled (set ENABLE_CRON=true to enable)");
  }
});

process.on("SIGTERM", () => {
  console.log("[PlanSave API] SIGTERM received, shutting down...");
  server.close(() => process.exit(0));
});
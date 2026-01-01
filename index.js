import { createServer } from "node:http";
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { startRecurringCron } from "./src/cron/recurring.cron.js";

const server = createServer(app);

// server.listen(env.PORT, () => {
//   // Jangan print env sensitif
//   console.log(`[PlanSave API] listening on http://localhost:${env.PORT}`);
// });


const port = process.env.PORT || 5014;

app.listen(port, () => {
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
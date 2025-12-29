import { Router } from "express";
import { ok } from "../utils/apiResponse.js";

const router = Router();

router.get("/", (req, res) => {
  return ok(res, {
    status: "ok",
    service: "plansave-api",
    version: "v1",
    time: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import * as analyticsController from "../controllers/analytics.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/analytics/monthly", analyticsController.monthly);
router.get("/analytics/trend", analyticsController.trend);

export default router;
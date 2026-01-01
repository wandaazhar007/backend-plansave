import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import * as alertsController from "../controllers/alerts.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/alerts", alertsController.list);
router.post("/alerts/ack", alertsController.ack); // optional tapi kita implement

export default router;
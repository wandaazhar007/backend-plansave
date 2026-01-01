import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import * as budgetsController from "../controllers/budgets.controller.js";

const router = Router();

router.use(requireAuth);

router.put("/budgets/:month", budgetsController.upsert);
router.get("/budgets/:month", budgetsController.getByMonth);
router.get("/budgets/:month/status", budgetsController.status);

export default router;
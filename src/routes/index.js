import { Router } from "express";
import healthRoutes from "./health.routes.js";
import usersRoutes from "./users.routes.js";
import adminRoutes from "./admin.routes.js";
import transactionsRoutes from "./transactions.routes.js";
import budgetsRoutes from "./budgets.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import exportRoutes from "./export.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/", usersRoutes);
router.use("/", transactionsRoutes);
router.use("/", budgetsRoutes);
router.use("/", analyticsRoutes);
router.use("/", exportRoutes);

router.use("/admin", adminRoutes);

export default router;
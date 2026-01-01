import { Router } from "express";
import healthRoutes from "./health.routes.js";
import usersRoutes from "./users.routes.js";
import adminRoutes from "./admin.routes.js";
import transactionsRoutes from "./transactions.routes.js";
import budgetsRoutes from "./budgets.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/", usersRoutes);
router.use("/", transactionsRoutes);
router.use("/", budgetsRoutes);

router.use("/admin", adminRoutes);

export default router;
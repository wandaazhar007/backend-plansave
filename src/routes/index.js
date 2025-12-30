import { Router } from "express";
import healthRoutes from "./health.routes.js";
import usersRoutes from "./users.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/", usersRoutes);

// Admin namespace
router.use("/admin", adminRoutes);

export default router;
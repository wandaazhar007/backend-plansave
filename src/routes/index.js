import { Router } from "express";

import healthRoutes from "./health.routes.js";
import uploadsRoutes from "./uploads.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/uploads", uploadsRoutes);
router.use("/auth", authRoutes);

export default router;
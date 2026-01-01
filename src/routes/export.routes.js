import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middlewares/requireAuth.js";
import { exportTransactions } from "../controllers/export.controller.js";

const router = Router();

router.use(requireAuth);

// Export lebih berat -> rate limit lebih ketat
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // ASSUMPTION: 30 req / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Terlalu banyak request. Coba lagi sebentar.",
    },
  },
});

router.get("/export/transactions", exportLimiter, exportTransactions);

export default router;
import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../middlewares/requireAuth.js";
import { uploadReceipt } from "../controllers/uploads.controller.js";

const router = Router();

// Store in memory; we will push to Firebase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 } // 6MB
});

router.post(
  "/receipts",
  requireAuth,
  upload.single("file"),
  uploadReceipt
);

export default router;
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { getUserDetail, listUsers } from "../controllers/admin.controller.js";

const router = Router();

// Wajib auth + admin
router.use(requireAuth);
router.use(requireAdmin);

// Admin endpoints
router.get("/users", listUsers);
router.get("/users/:uid", getUserDetail);

export default router;
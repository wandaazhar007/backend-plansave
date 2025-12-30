import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { getMe, updateMe } from "../controllers/users.controller.js";

const router = Router();

// Semua endpoint di file ini wajib auth
router.use(requireAuth);

router.get("/me", getMe);
router.put("/me", updateMe);

export default router;
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import * as recurringController from "../controllers/recurring.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/recurring", recurringController.create);
router.get("/recurring", recurringController.list);
router.put("/recurring/:id", recurringController.update);
router.post("/recurring/:id/pause", recurringController.pause);
router.post("/recurring/:id/resume", recurringController.resume);

export default router;
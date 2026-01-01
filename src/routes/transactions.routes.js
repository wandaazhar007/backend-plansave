import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import * as txController from "../controllers/transactions.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/transactions", txController.create);
router.get("/transactions", txController.list);
router.get("/transactions/:id", txController.getById);
router.put("/transactions/:id", txController.updateById);
router.delete("/transactions/:id", txController.removeById);

export default router;
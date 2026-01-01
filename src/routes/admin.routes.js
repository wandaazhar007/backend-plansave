// import { Router } from "express";
// import { requireAuth } from "../middlewares/requireAuth.js";
// import { requireAdmin } from "../middlewares/requireAdmin.js";
// import { getUserDetail, listUsers } from "../controllers/admin.controller.js";

// const router = Router();

// // Wajib auth + admin
// router.use(requireAuth);
// router.use(requireAdmin);

// // Admin endpoints
// router.get("/users", listUsers);
// router.get("/users/:uid", getUserDetail);

// export default router;




import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  getUserDetail,
  listUsers,
  banUser,
  unbanUser,
} from "../controllers/admin.controller.js";

const router = Router();

// Wajib auth + admin
router.use(requireAuth);
router.use(requireAdmin);

// Admin endpoints
router.get("/users", listUsers);
router.get("/users/:uid", getUserDetail);

// Ban / Unban (optional scope -> sekarang kita implement)
router.post("/users/:uid/ban", banUser);
router.post("/users/:uid/unban", unbanUser);

export default router;
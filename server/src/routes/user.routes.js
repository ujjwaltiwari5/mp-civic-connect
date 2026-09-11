import { Router } from "express";
import { getUsers, updateUserRole } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.get("/", protect, authorize("admin"), getUsers);
router.patch("/:id/role", protect, authorize("admin"), updateUserRole);

export default router;
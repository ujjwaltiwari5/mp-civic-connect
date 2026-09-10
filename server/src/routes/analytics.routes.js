import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  getOverview,
  getByCategory,
  getByDepartment,
  getResolutionTime,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/overview", protect, authorize("admin", "department_user"), getOverview);
router.get("/by-category", protect, authorize("admin", "department_user"), getByCategory);
router.get("/by-department", protect, authorize("admin"), getByDepartment);
router.get("/resolution-time", protect, authorize("admin", "department_user"), getResolutionTime);

export default router;
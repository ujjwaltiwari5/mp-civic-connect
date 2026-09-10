import { Router } from "express";
import { getDepartments, createDepartment, updateDepartment, getDepartmentUsers } from "../controllers/department.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.get("/", getDepartments);
router.get("/:id/users", protect, authorize("admin"), getDepartmentUsers);
router.post("/", protect, authorize("admin"), createDepartment);
router.patch("/:id", protect, authorize("admin"), updateDepartment);

export default router;
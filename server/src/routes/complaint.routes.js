import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  assignDepartment,
  getAssignedComplaints,
  updateComplaintStatus,
} from "../controllers/complaint.controller.js";

const router = express.Router();

router.post("/", protect, upload.array("images", 5), createComplaint);
router.get("/mine", protect, getMyComplaints);
router.get("/assigned", protect, authorize("department_user"), getAssignedComplaints);
router.get("/", protect, authorize("admin"), getAllComplaints);
router.get("/:id", protect, getComplaintById);
router.patch("/:id/assign", protect, authorize("admin"), assignDepartment);
router.patch(
  "/:id/status",
  protect,
  authorize("department_user", "admin"),
  upload.array("evidenceImages", 3),
  updateComplaintStatus
);

export default router;
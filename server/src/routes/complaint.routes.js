import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
} from "../controllers/complaint.controller.js";

const router = express.Router();

router.post("/", protect, upload.array("images", 5), createComplaint);
router.get("/mine", protect, getMyComplaints);
router.get("/", protect, authorize("admin"), getAllComplaints);
router.get("/:id", protect, getComplaintById);

export default router;
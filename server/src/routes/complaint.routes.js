import express from "express";
import { protect } from "../middleware/auth.middleware.js"; // jo naam Phase 1 me diya tha wahi use karo
import { createComplaint, getMyComplaints } from "../controllers/complaint.controller.js";

const router = express.Router();

router.post("/", protect, createComplaint);
router.get("/mine", protect, getMyComplaints);

export default router;
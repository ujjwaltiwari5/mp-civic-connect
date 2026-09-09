import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { getWards, createWard, updateWard } from "../controllers/ward.controller.js";

const router = express.Router();

router.get("/", getWards);
router.post("/", protect, authorize("admin"), createWard);
router.patch("/:id", protect, authorize("admin"), updateWard);

export default router;
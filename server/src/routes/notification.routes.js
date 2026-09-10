import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getMyNotifications, markNotificationRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationRead);

export default router;
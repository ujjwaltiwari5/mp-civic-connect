import express from "express";
import { getTehsilBoundary } from "../controllers/tehsil.controller.js";

const router = express.Router();

router.get("/:id/boundary", getTehsilBoundary);

export default router;
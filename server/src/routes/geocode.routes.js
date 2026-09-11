import express from "express";
import { getPlaceCenter } from "../controllers/geocode.controller.js";

const router = express.Router();

router.get("/center", getPlaceCenter);

export default router;
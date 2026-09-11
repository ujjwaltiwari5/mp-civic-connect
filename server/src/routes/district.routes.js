import express from "express";
import { getDistricts, getTehsilsByDistrict } from "../controllers/district.controller.js";

const router = express.Router();

router.get("/", getDistricts);
router.get("/:districtId/tehsils", getTehsilsByDistrict);

export default router;
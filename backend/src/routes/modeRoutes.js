import express from "express";
import { getModeSettings, updateModeSettings } from "../controllers/modeController.js";

const router = express.Router();

router.get("/:sessionId", getModeSettings);
router.post("/", updateModeSettings);

export default router;

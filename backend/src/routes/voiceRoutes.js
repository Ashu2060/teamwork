import express from "express";
import { synthesizeVoice } from "../controllers/voiceController.js";

const router = express.Router();

router.post("/", synthesizeVoice);

export default router;

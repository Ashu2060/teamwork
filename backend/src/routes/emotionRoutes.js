import express from "express";
import { detectEmotion } from "../controllers/emotionController.js";

const router = express.Router();

router.post("/", detectEmotion);

export default router;

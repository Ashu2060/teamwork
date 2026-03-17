import express from "express";
import { getSessionHistory, sendChatMessage } from "../controllers/chatController.js";

const router = express.Router();

router.get("/:sessionId", getSessionHistory);
router.post("/", sendChatMessage);

export default router;

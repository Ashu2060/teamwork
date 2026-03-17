import { analyzeEmotionFrame, emotionServiceEnabled } from "../services/emotionService.js";

export const detectEmotion = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "image is required" });
    }

    if (!emotionServiceEnabled()) {
      return res.status(503).json({
        message: "DeepFace emotion service is not configured yet."
      });
    }

    const result = await analyzeEmotionFrame(image);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

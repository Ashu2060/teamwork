import { synthesizeSpeech, voiceFeatureEnabled } from "../services/voiceService.js";

export const synthesizeVoice = async (req, res, next) => {
  try {
    const { text, mode } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "text is required" });
    }

    if (!voiceFeatureEnabled()) {
      return res.status(503).json({
        message: "Custom voice is not configured yet. Add Piper settings to backend/.env."
      });
    }

    const audioBuffer = await synthesizeSpeech({
      text: text.trim(),
      mode
    });

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(audioBuffer);
  } catch (error) {
    next(error);
  }
};

const EMOTION_PRIORITY = ["angry", "sad", "happy", "neutral"];

export const mapFaceExpressionToEmotion = (expressions = {}) => {
  const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
  const [topEmotion, confidence] = sorted[0] || ["neutral", 0];

  if (!topEmotion || confidence < 0.35) {
    return "neutral";
  }

  if (topEmotion === "fearful") {
    return "stressed";
  }

  if (topEmotion === "surprised" && confidence > 0.55) {
    return "happy";
  }

  if (["disgusted"].includes(topEmotion)) {
    return "angry";
  }

  if (EMOTION_PRIORITY.includes(topEmotion)) {
    return topEmotion;
  }

  const stressScore =
    (expressions.fearful || 0) +
    (expressions.sad || 0) * 0.6 +
    (expressions.angry || 0) * 0.6;

  if (stressScore > 0.9) {
    return "stressed";
  }

  return "neutral";
};

const EMOTION_PRIORITY = ["angry", "sad", "happy", "neutral"];

const mapRawLabel = (label) => {
  if (label === "fearful") {
    return "stressed";
  }

  if (label === "surprised") {
    return "happy";
  }

  if (label === "disgusted") {
    return "angry";
  }

  return label;
};

export const analyzeExpressions = (expressions = {}) => {
  const happy = Number(expressions.happy || 0);
  const sad = Number(expressions.sad || 0);
  const angry = Number(expressions.angry || 0);
  const fearful = Number(expressions.fearful || 0);
  const surprised = Number(expressions.surprised || 0);
  const disgusted = Number(expressions.disgusted || 0);
  const neutral = Number(expressions.neutral || 0);
  const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
  const [topEmotion, confidence] = sorted[0] || ["neutral", 0];
  const breakdown = sorted.slice(0, 4).map(([label, value]) => ({
    label: mapRawLabel(label),
    value: Number(value || 0)
  }));

  const stressScore = fearful + sad * 0.7 + angry * 0.45;

  if (happy >= 0.16 || surprised >= 0.22) {
    return {
      emotion: "happy",
      confidence: Math.max(happy, surprised),
      breakdown
    };
  }

  if (sad >= 0.18) {
    return {
      emotion: "sad",
      confidence: sad,
      breakdown
    };
  }

  if (angry >= 0.16 || disgusted >= 0.16) {
    return {
      emotion: "angry",
      confidence: Math.max(angry, disgusted),
      breakdown
    };
  }

  if (stressScore >= 0.24) {
    return {
      emotion: "stressed",
      confidence: stressScore,
      breakdown
    };
  }

  if (!topEmotion || confidence < 0.22) {
    return {
      emotion: "neutral",
      confidence: Number(confidence || 0),
      breakdown
    };
  }

  if (topEmotion === "fearful") {
    return {
      emotion: "stressed",
      confidence: Number(confidence || 0),
      breakdown
    };
  }

  if (topEmotion === "surprised" && confidence > 0.4) {
    return {
      emotion: "happy",
      confidence: Number(confidence || 0),
      breakdown
    };
  }

  if (["disgusted"].includes(topEmotion)) {
    return {
      emotion: "angry",
      confidence: Number(confidence || 0),
      breakdown
    };
  }

  if (EMOTION_PRIORITY.includes(topEmotion)) {
    return {
      emotion: topEmotion,
      confidence: Number(confidence || 0),
      breakdown
    };
  }

  if (stressScore > 0.9) {
    return {
      emotion: "stressed",
      confidence: Number(confidence || 0),
      breakdown
    };
  }

  return {
    emotion: neutral >= 0.25 ? "neutral" : mapRawLabel(topEmotion),
    confidence: Number(confidence || 0),
    breakdown
  };
};

export const mapFaceExpressionToEmotion = (expressions = {}) => analyzeExpressions(expressions).emotion;

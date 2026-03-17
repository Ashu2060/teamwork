export const emotionServiceEnabled = () => Boolean(process.env.EMOTION_SERVICE_URL);

export const analyzeEmotionFrame = async (image) => {
  const response = await fetch(process.env.EMOTION_SERVICE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ image })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Emotion service failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

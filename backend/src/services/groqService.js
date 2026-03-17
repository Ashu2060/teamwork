import Groq from "groq-sdk";
import { emotionToneMap, getModePrompt } from "../utils/modeConfig.js";

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in environment variables");
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
};

export const buildGroqMessages = ({ recentMessages, emotion, selectedMode }) => {
  const systemPrompt = getModePrompt(selectedMode, emotion);

  return [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "system",
      content: `Detected emotion: ${emotion}. Tone guidance: ${emotionToneMap[emotion] || emotionToneMap.neutral}`
    },
    ...recentMessages.map((message) => ({
      role: message.role,
      content: message.content
    }))
  ];
};

export const generateAssistantReply = async (messages) => {
  const groqClient = getGroqClient();

  const response = await groqClient.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.85,
    max_tokens: 700,
    messages
  });

  return response.choices?.[0]?.message?.content?.trim() || "I am here with you. Tell me more.";
};

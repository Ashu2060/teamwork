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

const parseVoicePayload = (rawContent) => {
  const content = rawContent?.trim();

  if (!content) {
    return null;
  }

  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    const parsed = JSON.parse(cleaned);
    const reply = parsed?.reply?.trim();
    const voiceText = parsed?.voiceText?.trim();

    if (!reply) {
      return null;
    }

    return {
      reply,
      voiceText: voiceText || reply
    };
  } catch {
    return null;
  }
};

export const prepareTextForHindiVoice = async (text) => {
  const input = text?.trim();

  if (!input) {
    return "";
  }

  const groqClient = getGroqClient();
  const response = await groqClient.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You convert user-facing assistant text into natural spoken Hindi in Devanagari script for Indian TTS. Preserve meaning and tone exactly. Do not summarize. Do not add or remove ideas. Keep unavoidable names and English product words as-is. Return only the converted spoken text."
      },
      {
        role: "user",
        content: input
      }
    ]
  });

  return response.choices?.[0]?.message?.content?.trim() || input;
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
    {
      role: "system",
      content:
        "Important language rule: reply in natural Roman Hindi by default. Sound like a real person texting, not like a translated chatbot. Keep the wording simple, warm, and natural."
    },
    {
      role: "system",
      content:
        "Structure rule: write one coherent reply with connected sentences. Do not produce broken, choppy, or repetitive lines. Usually give one empathetic opening, one helpful follow-through, and at most one question near the end. Never ask two short questions in a row."
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
    temperature: 0.55,
    max_tokens: 360,
    messages: [
      ...messages,
      {
        role: "system",
        content:
          "Return a valid JSON object only. Keys: reply, voiceText. reply must be natural Roman Hindi for chat display. voiceText must be the same meaning in natural Devanagari Hindi for speech. Do not add markdown, code fences, or extra keys."
      }
    ]
  });

  const rawContent = response.choices?.[0]?.message?.content?.trim();
  const parsed = parseVoicePayload(rawContent);

  if (parsed) {
    return parsed;
  }

  const fallbackReply = rawContent || "I am here with you. Tell me more.";
  return {
    reply: fallbackReply,
    voiceText: fallbackReply
  };
};

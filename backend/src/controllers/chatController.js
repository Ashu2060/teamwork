import ChatSession from "../models/ChatSession.js";
import UserPreference from "../models/UserPreference.js";
import { ensureMemoryState, saveMemoryState } from "../services/memoryStore.js";
import { buildGroqMessages, generateAssistantReply } from "../services/groqService.js";
import { determineEffectiveMode, supportedModes } from "../utils/modeConfig.js";
import mongoose from "mongoose";

const isDatabaseAvailable = () => mongoose.connection.readyState === 1;

const ensureSession = async (sessionId) => {
  if (!isDatabaseAvailable()) {
    return ensureMemoryState(sessionId);
  }

  const [session, preference] = await Promise.all([
    ChatSession.findOne({ sessionId }),
    UserPreference.findOne({ sessionId })
  ]);

  if (session && preference) {
    return { session, preference };
  }

  const createdPreference =
    preference ||
    (await UserPreference.create({
      sessionId,
      selectedMode: "therapist",
      autoModeEnabled: true
    }));

  const createdSession =
    session ||
    (await ChatSession.create({
      sessionId,
      selectedMode: createdPreference.selectedMode,
      autoModeEnabled: createdPreference.autoModeEnabled,
      messages: []
    }));

  return { session: createdSession, preference: createdPreference };
};

export const getSessionHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { session, preference } = await ensureSession(sessionId);

    res.json({
      sessionId,
      selectedMode: preference.selectedMode,
      autoModeEnabled: preference.autoModeEnabled,
      messages: session.messages
    });
  } catch (error) {
    next(error);
  }
};

export const sendChatMessage = async (req, res, next) => {
  try {
    const { sessionId, message, emotion = "neutral", selectedMode, autoModeEnabled } = req.body;

    if (!sessionId || !message?.trim()) {
      return res.status(400).json({ message: "sessionId and message are required" });
    }

    const { session, preference } = await ensureSession(sessionId);

    const normalizedMode = supportedModes.includes(selectedMode) ? selectedMode : preference.selectedMode;
    const effectiveAutoMode =
      typeof autoModeEnabled === "boolean" ? autoModeEnabled : preference.autoModeEnabled;
    const effectiveMode = determineEffectiveMode({
      selectedMode: normalizedMode,
      emotion,
      autoModeEnabled: effectiveAutoMode
    });

    const userMessage = {
      role: "user",
      content: message.trim(),
      emotion,
      mode: effectiveMode,
      createdAt: new Date()
    };

    const recentMessages = [...session.messages, userMessage].slice(-10);
    const groqMessages = buildGroqMessages({
      recentMessages,
      emotion,
      selectedMode: effectiveMode
    });

    const assistantPayload = await generateAssistantReply(groqMessages);
    const assistantText = assistantPayload.reply;

    const assistantMessage = {
      role: "assistant",
      content: assistantText,
      emotion,
      mode: effectiveMode,
      createdAt: new Date()
    };

    session.messages = [...session.messages, userMessage, assistantMessage].slice(-20);
    session.selectedMode = normalizedMode;
    session.autoModeEnabled = effectiveAutoMode;

    preference.selectedMode = normalizedMode;
    preference.autoModeEnabled = effectiveAutoMode;

    if (isDatabaseAvailable()) {
      await Promise.all([session.save(), preference.save()]);
    } else {
      saveMemoryState({ session, preference });
    }

    res.status(200).json({
      reply: assistantText,
      voiceText: assistantPayload.voiceText,
      selectedMode: normalizedMode,
      effectiveMode,
      autoModeEnabled: effectiveAutoMode,
      emotion,
      messages: session.messages
    });
  } catch (error) {
    next(error);
  }
};

import ChatSession from "../models/ChatSession.js";
import UserPreference from "../models/UserPreference.js";
import { ensureMemoryState, saveMemoryState } from "../services/memoryStore.js";
import { supportedModes } from "../utils/modeConfig.js";
import mongoose from "mongoose";

const isDatabaseAvailable = () => mongoose.connection.readyState === 1;

const ensurePreference = async (sessionId) => {
  if (!isDatabaseAvailable()) {
    const { preference } = ensureMemoryState(sessionId);
    return preference;
  }

  const [preference, session] = await Promise.all([
    UserPreference.findOne({ sessionId }),
    ChatSession.findOne({ sessionId })
  ]);

  const storedPreference =
    preference ||
    (await UserPreference.create({
      sessionId,
      selectedMode: "therapist",
      autoModeEnabled: true
    }));

  if (!session) {
    await ChatSession.create({
      sessionId,
      selectedMode: storedPreference.selectedMode,
      autoModeEnabled: storedPreference.autoModeEnabled,
      messages: []
    });
  }

  return storedPreference;
};

export const getModeSettings = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const preference = await ensurePreference(sessionId);
    res.json(preference);
  } catch (error) {
    next(error);
  }
};

export const updateModeSettings = async (req, res, next) => {
  try {
    const { sessionId, selectedMode, autoModeEnabled, theme, voiceEnabled } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    if (selectedMode && !supportedModes.includes(selectedMode)) {
      return res.status(400).json({ message: "Unsupported mode selected" });
    }

    const preference = await ensurePreference(sessionId);

    if (selectedMode) {
      preference.selectedMode = selectedMode;
      if (isDatabaseAvailable()) {
        await ChatSession.updateOne({ sessionId }, { selectedMode });
      }
    }

    if (typeof autoModeEnabled === "boolean") {
      preference.autoModeEnabled = autoModeEnabled;
      if (isDatabaseAvailable()) {
        await ChatSession.updateOne({ sessionId }, { autoModeEnabled });
      }
    }

    if (theme) {
      preference.theme = theme;
    }

    if (typeof voiceEnabled === "boolean") {
      preference.voiceEnabled = voiceEnabled;
    }

    if (isDatabaseAvailable()) {
      await preference.save();
    } else {
      const { session } = ensureMemoryState(sessionId);

      if (selectedMode) {
        session.selectedMode = selectedMode;
      }

      if (typeof autoModeEnabled === "boolean") {
        session.autoModeEnabled = autoModeEnabled;
      }

      saveMemoryState({ session, preference });
    }

    res.json(preference);
  } catch (error) {
    next(error);
  }
};

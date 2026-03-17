import mongoose from "mongoose";

const userPreferenceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    selectedMode: {
      type: String,
      default: "therapist"
    },
    autoModeEnabled: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ["dark", "light"],
      default: "dark"
    },
    voiceEnabled: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("UserPreference", userPreferenceSchema);

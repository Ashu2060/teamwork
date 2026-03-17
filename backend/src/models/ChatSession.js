import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    emotion: {
      type: String,
      default: "neutral"
    },
    mode: {
      type: String,
      default: "therapist"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
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
    messages: {
      type: [messageSchema],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("ChatSession", chatSessionSchema);

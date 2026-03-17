export const MODES = [
  { id: "life-coach", label: "Life Coach", emoji: "🚀" },
  { id: "therapist", label: "Therapist", emoji: "🫶" },
  { id: "friendly-buddy", label: "Friendly Buddy", emoji: "😄" },
  { id: "girlfriend", label: "Girlfriend Mode", emoji: "💖" },
  { id: "flirty-girlfriend", label: "Flirty GF", emoji: "😉" }
];

export const EMOTION_META = {
  happy: { label: "Happy", emoji: "😊" },
  sad: { label: "Sad", emoji: "😔" },
  angry: { label: "Angry", emoji: "😠" },
  neutral: { label: "Neutral", emoji: "😌" },
  stressed: { label: "Stressed", emoji: "😵" }
};

export const MODE_VOICE_MAP = {
  "life-coach": { pitch: 1.05, rate: 1.02 },
  therapist: { pitch: 0.95, rate: 0.92 },
  "friendly-buddy": { pitch: 1.1, rate: 1.08 },
  girlfriend: { pitch: 1.15, rate: 0.96 },
  "flirty-girlfriend": { pitch: 1.2, rate: 1.0 }
};

export const EMOTION_MODE_MAP = {
  sad: "therapist",
  angry: "therapist",
  stressed: "life-coach",
  happy: "friendly-buddy",
  neutral: "therapist"
};

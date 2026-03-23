export const MODES = [
  { id: "life-coach", label: "Life Coach", emoji: "🚀", hint: "Goal-oriented and motivating" },
  { id: "therapist", label: "Therapist", emoji: "🫶", hint: "Calm, soothing, stress relief" },
  { id: "friendly-buddy", label: "Friendly Buddy", emoji: "😄", hint: "Casual, light, friendly" },
  { id: "girlfriend", label: "Girlfriend Mode", emoji: "💖", hint: "Soft, caring, feminine" },
  { id: "flirty-girlfriend", label: "Flirty GF", emoji: "😉", hint: "Playful and romantic" }
];

export const EMOTION_META = {
  happy: { label: "Happy", emoji: "😊" },
  sad: { label: "Sad", emoji: "😔" },
  angry: { label: "Angry", emoji: "😠" },
  neutral: { label: "Neutral", emoji: "😌" },
  stressed: { label: "Stressed", emoji: "😵" }
};

export const MODE_VOICE_MAP = {
  "life-coach": { pitch: 1.08, rate: 0.98, lang: "hi-IN", preferFemale: true },
  therapist: { pitch: 1.04, rate: 0.88, lang: "hi-IN", preferFemale: true },
  "friendly-buddy": { pitch: 1.12, rate: 0.98, lang: "hi-IN", preferFemale: true },
  girlfriend: { pitch: 1.16, rate: 0.9, lang: "hi-IN", preferFemale: true },
  "flirty-girlfriend": { pitch: 1.18, rate: 0.94, lang: "hi-IN", preferFemale: true }
};

export const EMOTION_MODE_MAP = {
  sad: "therapist",
  angry: "therapist",
  stressed: "therapist",
  happy: "friendly-buddy",
  neutral: "therapist"
};

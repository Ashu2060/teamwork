import { MODE_VOICE_MAP } from "./constants";

export const getSpeechRecognition = () => {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const speakText = ({ text, mode, enabled }) => {
  if (!enabled || !("speechSynthesis" in window) || !text) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voiceStyle = MODE_VOICE_MAP[mode] || MODE_VOICE_MAP.therapist;
  utterance.pitch = voiceStyle.pitch;
  utterance.rate = voiceStyle.rate;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const englishVoice =
    voices.find((voice) => voice.lang?.toLowerCase().includes("en-in")) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ||
    voices[0];

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

import { MODE_VOICE_MAP } from "./constants";

let currentAudio = null;
let currentSpeechRunId = 0;

export const getSpeechRecognition = () => {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const stopVoicePlayback = () => {
  currentSpeechRunId += 1;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};

const femaleHint = /(female|woman|zira|heera|priya|veena|susan|hazel|samantha|aria|natasha)/i;

const splitTextIntoChunks = (text) => {
  if (!text) {
    return [];
  }

  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((chunk) => {
      if (chunk.length <= 180) {
        return [chunk];
      }

      const words = chunk.split(" ");
      const chunks = [];
      let current = "";

      words.forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (next.length > 180) {
          chunks.push(current);
          current = word;
        } else {
          current = next;
        }
      });

      if (current) {
        chunks.push(current);
      }

      return chunks;
    });
};

const pickBestVoice = (voices, voiceStyle, text) => {
  const hasHindiScript = /[\u0900-\u097F]/.test(text || "");
  const langPriority = hasHindiScript
    ? ["hi-in", "hi", "en-in", "en"]
    : [voiceStyle.lang?.toLowerCase(), "en-in", "hi-in", "en", "hi"];
  const matchingVoices = voices.filter((voice) =>
    langPriority.some((lang) => lang && voice.lang?.toLowerCase().includes(lang))
  );

  return (
    matchingVoices.find((voice) => voiceStyle.preferFemale && femaleHint.test(voice.name)) ||
    matchingVoices[0] ||
    voices.find((voice) => femaleHint.test(voice.name)) ||
    voices[0]
  );
};

export const speakText = ({ text, mode, enabled, onStart, onEnd }) => {
  if (!enabled || !("speechSynthesis" in window) || !text) {
    return;
  }

  stopVoicePlayback();
  const voiceStyle = MODE_VOICE_MAP[mode] || MODE_VOICE_MAP.therapist;
  const voices = window.speechSynthesis.getVoices();
  const runId = currentSpeechRunId;
  onStart?.();

  const chunks = splitTextIntoChunks(text);
  const speakChunk = (index) => {
    if (runId !== currentSpeechRunId) {
      return;
    }

    if (index >= chunks.length) {
      onEnd?.();
      return;
    }

    const chunk = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunk);
    const preferredVoice = pickBestVoice(voices, voiceStyle, chunk);

    utterance.pitch = voiceStyle.pitch;
    utterance.rate = voiceStyle.rate;
    utterance.volume = 1;
    utterance.lang = /[\u0900-\u097F]/.test(chunk) ? "hi-IN" : voiceStyle.lang || "en-IN";

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang || utterance.lang;
    }

    utterance.onend = () => speakChunk(index + 1);
    utterance.onerror = () => {
      if (index >= chunks.length - 1) {
        onEnd?.();
        return;
      }

      speakChunk(index + 1);
    };
    window.speechSynthesis.speak(utterance);
  };

  speakChunk(0);
};

export const playCustomVoice = async ({ apiBaseUrl, text, mode, enabled, onStart, onEnd }) => {
  if (!enabled || !text) {
    return false;
  }

  try {
    stopVoicePlayback();
    const response = await fetch(`${apiBaseUrl}/voice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, mode })
    });

    if (!response.ok) {
      return false;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    onStart?.();

    audio.onended = () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      URL.revokeObjectURL(audioUrl);
      onEnd?.();
    };

    audio.onerror = () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      URL.revokeObjectURL(audioUrl);
      onEnd?.();
    };

    await audio.play();
    return true;
  } catch (error) {
    currentAudio = null;
    onEnd?.();
    return false;
  }
};

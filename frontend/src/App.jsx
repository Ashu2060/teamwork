import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import Composer from "./components/Composer";
import EmotionPanel from "./components/EmotionPanel";
import { EMOTION_MODE_MAP } from "./lib/constants";
import { createSessionId } from "./lib/session";
import { mapFaceExpressionToEmotion } from "./lib/emotion";
import { getSpeechRecognition, speakText } from "./lib/speech";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

const sessionId = createSessionId();

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedMode, setSelectedMode] = useState("therapist");
  const [effectiveMode, setEffectiveMode] = useState("therapist");
  const [autoModeEnabled, setAutoModeEnabled] = useState(true);
  const [emotion, setEmotion] = useState("neutral");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("mm_theme") || "dark");
  const [voiceEnabled, setVoiceEnabled] = useState(
    localStorage.getItem("mm_voice_enabled") !== "false"
  );
  const [listening, setListening] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [webcamActive, setWebcamActive] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const emotionIntervalRef = useRef(null);
  const faceApiRef = useRef(null);

  const cameraModelUrl = useMemo(
    () =>
      import.meta.env.VITE_FACE_API_MODEL_URL ||
      "https://justadudewhohacks.github.io/face-api.js/models",
    []
  );

  const displayMode = autoModeEnabled ? EMOTION_MODE_MAP[emotion] || selectedMode : selectedMode;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mm_theme", theme);
  }, [theme]);

  useEffect(() => {
    setEffectiveMode(displayMode);
  }, [displayMode]);

  useEffect(() => {
    localStorage.setItem("mm_voice_enabled", String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    const loadApp = async () => {
      try {
        await Promise.all([loadModels(), fetchHistory()]);
      } catch (error) {
        setPermissionError("App setup could not fully initialize. Check your backend connection and model URL.");
      }
    };

    loadApp();
    setupSpeechRecognition();

    return () => {
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const loadModels = async () => {
    const faceapi = await import("face-api.js");
    faceApiRef.current = faceapi;

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(cameraModelUrl),
      faceapi.nets.faceExpressionNet.loadFromUri(cameraModelUrl)
    ]);
    setModelsReady(true);
  };

  const fetchHistory = async () => {
    const [chatResponse, modeResponse] = await Promise.all([
      api.get(`/chat/${sessionId}`),
      api.get(`/mode/${sessionId}`)
    ]);

    setMessages(chatResponse.data.messages || []);
    setSelectedMode(modeResponse.data.selectedMode || "therapist");
    setEffectiveMode(modeResponse.data.selectedMode || "therapist");
    setAutoModeEnabled(modeResponse.data.autoModeEnabled ?? true);
    setTheme(modeResponse.data.theme || localStorage.getItem("mm_theme") || "dark");
    setVoiceEnabled(modeResponse.data.voiceEnabled ?? true);
  };

  const persistSettings = async (updates) => {
    await api.post("/mode", {
      sessionId,
      selectedMode,
      autoModeEnabled,
      theme,
      voiceEnabled,
      ...updates
    });
  };

  const setupSpeechRecognition = () => {
    const Recognition = getSpeechRecognition();

    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");
      setInput(transcript);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  };

  const startCamera = async () => {
    try {
      setPermissionError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamActive(true);
      beginEmotionTracking();
    } catch (error) {
      setPermissionError("Camera access was denied. Please allow webcam access in your browser.");
    }
  };

  const beginEmotionTracking = () => {
    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current);
    }

    emotionIntervalRef.current = setInterval(async () => {
      const faceapi = faceApiRef.current;

      if (!videoRef.current || !modelsReady || !faceapi) {
        return;
      }

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detection?.expressions) {
        setEmotion(mapFaceExpressionToEmotion(detection.expressions));
      }
    }, 2500);
  };

  const handleModeChange = async (mode) => {
    setSelectedMode(mode);
    if (!autoModeEnabled) {
      setEffectiveMode(mode);
    }
    await persistSettings({ selectedMode: mode });
  };

  const handleAutoModeToggle = async () => {
    const nextValue = !autoModeEnabled;
    setAutoModeEnabled(nextValue);
    await persistSettings({ autoModeEnabled: nextValue });
  };

  const handleThemeToggle = async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    await persistSettings({ theme: nextTheme });
  };

  const handleVoiceToggle = async () => {
    const nextVoiceState = !voiceEnabled;
    setVoiceEnabled(nextVoiceState);
    await persistSettings({ voiceEnabled: nextVoiceState });
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      setPermissionError("Speech recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    recognitionRef.current.start();
    setListening(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = input.trim();

    if (!message) {
      return;
    }

    const optimisticMessage = {
      role: "user",
      content: message,
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [...current, optimisticMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat", {
        sessionId,
        message,
        emotion,
        selectedMode,
        autoModeEnabled
      });

      setMessages(response.data.messages || []);
      setEffectiveMode(response.data.effectiveMode || displayMode);
      speakText({
        text: response.data.reply,
        mode: response.data.effectiveMode || displayMode,
        enabled: voiceEnabled
      });
    } catch (error) {
      const fallbackMessage = {
        role: "assistant",
        content:
          error.response?.data?.message ||
          "Something went wrong while contacting the AI. Please check your backend and API key.",
        createdAt: new Date().toISOString()
      };
      setMessages((current) => [...current, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="background-orb background-orb-one" />
      <div className="background-orb background-orb-two" />

      <section className="dashboard">
        <ChatHeader
          selectedMode={selectedMode}
          effectiveMode={effectiveMode}
          autoModeEnabled={autoModeEnabled}
          onModeChange={handleModeChange}
          onAutoModeToggle={handleAutoModeToggle}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          voiceEnabled={voiceEnabled}
          onVoiceToggle={handleVoiceToggle}
        />

        <div className="content-grid">
          <div className="chat-column">
            <ChatWindow messages={messages} loading={loading} />
            <Composer
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              onToggleListening={handleToggleListening}
              listening={listening}
              disabled={loading}
            />
          </div>

          <EmotionPanel
            emotion={emotion}
            webcamActive={webcamActive}
            permissionError={permissionError}
            videoRef={videoRef}
            onStartCamera={startCamera}
            detectedMode={displayMode}
          />
        </div>
      </section>
    </main>
  );
};

export default App;

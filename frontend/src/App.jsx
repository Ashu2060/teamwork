import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import Composer from "./components/Composer";
import EmotionPanel from "./components/EmotionPanel";
import { EMOTION_MODE_MAP } from "./lib/constants";
import { createSessionId } from "./lib/session";
import { getSpeechRecognition, playCustomVoice, speakText, stopVoicePlayback } from "./lib/speech";

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
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [webcamActive, setWebcamActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [expressionScores, setExpressionScores] = useState([]);
  const [rawExpressionScores, setRawExpressionScores] = useState([]);
  const [faceStatus, setFaceStatus] = useState("Waiting for face");
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const emotionIntervalRef = useRef(null);
  const faceApiRef = useRef(null);
  const emotionRequestInFlightRef = useRef(false);

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
      stopVoicePlayback();
    };
  }, []);

  useEffect(() => {
    const attachStreamToVideo = async () => {
      if (!webcamActive || !videoRef.current || !streamRef.current) {
        return;
      }

      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }

      videoRef.current.onloadedmetadata = async () => {
        try {
          await videoRef.current?.play();
          setVideoReady(true);
          beginEmotionTracking();
        } catch (error) {
          setPermissionError("Camera started, but video preview could not play automatically.");
        }
      };
    };

    attachStreamToVideo();
  }, [webcamActive]);

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
    recognition.lang = "hi-IN";
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
      setVideoReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });

      streamRef.current = stream;
      setWebcamActive(true);
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

      if (!videoRef.current || !modelsReady || !faceapi || !videoReady) {
        return;
      }

      const videoElement = videoRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const detection = await faceapi
        .detectSingleFace(
          videoElement,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.35
          })
        )
        .withFaceExpressions();

      if (detection) {
        setFaceDetected(true);
        setFaceStatus("Face detected");

        if (overlayCanvas && videoElement) {
          const displaySize = {
            width: videoElement.videoWidth || videoElement.clientWidth || 0,
            height: videoElement.videoHeight || videoElement.clientHeight || 0
          };

          if (displaySize.width && displaySize.height) {
            faceapi.matchDimensions(overlayCanvas, displaySize);
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            const context = overlayCanvas.getContext("2d");

            if (context) {
              context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            }

            faceapi.draw.drawDetections(overlayCanvas, resizedDetection);
          }
        }

        if (!emotionRequestInFlightRef.current) {
          emotionRequestInFlightRef.current = true;
          const snapshot = captureVideoFrame(videoElement);

          if (snapshot) {
            try {
              const response = await api.post("/emotion", { image: snapshot });
              setEmotion(response.data.emotion || "neutral");
              setEmotionConfidence(response.data.confidence || 0);
              setExpressionScores(response.data.breakdown || []);
              setRawExpressionScores(response.data.rawBreakdown || []);
            } catch (error) {
              setFaceStatus("Face detected, emotion service unavailable");
            } finally {
              emotionRequestInFlightRef.current = false;
            }
          } else {
            emotionRequestInFlightRef.current = false;
          }
        }
      } else {
        setFaceDetected(false);
        setFaceStatus("Searching face...");
        setEmotion("neutral");
        setEmotionConfidence(0);
        setExpressionScores([]);
        setRawExpressionScores([]);

        if (overlayCanvas) {
          const context = overlayCanvas.getContext("2d");
          if (context) {
            context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          }
        }
      }
    }, 900);
  };

  const handleRecalibrateEmotion = () => {
    setEmotion("neutral");
    setEmotionConfidence(0);
    setExpressionScores([]);
    setRawExpressionScores([]);
    setFaceStatus(faceDetected ? "Face detected" : "Waiting for face");
  };

  const captureVideoFrame = (videoElement) => {
    if (!videoElement?.videoWidth || !videoElement?.videoHeight) {
      return null;
    }

    const canvas = document.createElement("canvas");
    const width = 512;
    const height = Math.round((videoElement.videoHeight / videoElement.videoWidth) * width);

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(videoElement, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.9);
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
    if (!nextVoiceState) {
      stopVoicePlayback();
      setSpeaking(false);
    }
    await persistSettings({ voiceEnabled: nextVoiceState });
  };

  const handleStopSpeaking = () => {
    stopVoicePlayback();
    setSpeaking(false);
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

    handleStopSpeaking();

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
      const replyText = response.data.reply;
      const voiceText = response.data.voiceText || replyText;
      const replyMode = response.data.effectiveMode || displayMode;
      const customVoicePlayed = await playCustomVoice({
        apiBaseUrl: api.defaults.baseURL,
        text: voiceText,
        mode: replyMode,
        enabled: voiceEnabled,
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false)
      });

      if (!customVoicePlayed) {
        speakText({
          text: voiceText,
          mode: replyMode,
          enabled: voiceEnabled,
          onStart: () => setSpeaking(true),
          onEnd: () => setSpeaking(false)
        });
      }
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
              onStopSpeaking={handleStopSpeaking}
              listening={listening}
              speaking={speaking}
              disabled={loading}
            />
          </div>

          <EmotionPanel
            emotion={emotion}
            emotionConfidence={emotionConfidence}
            expressionScores={expressionScores}
            rawExpressionScores={rawExpressionScores}
            webcamActive={webcamActive}
            videoReady={videoReady}
            faceDetected={faceDetected}
            faceStatus={faceStatus}
            modelsReady={modelsReady}
            permissionError={permissionError}
            videoRef={videoRef}
            overlayCanvasRef={overlayCanvasRef}
            onStartCamera={startCamera}
            onRecalibrateEmotion={handleRecalibrateEmotion}
            detectedMode={displayMode}
          />
        </div>
      </section>
    </main>
  );
};

export default App;

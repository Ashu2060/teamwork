import { EMOTION_META } from "../lib/constants";

const EmotionPanel = ({
  emotion,
  webcamActive,
  permissionError,
  videoRef,
  onStartCamera,
  detectedMode
}) => {
  const emotionData = EMOTION_META[emotion] || EMOTION_META.neutral;

  return (
    <section className="emotion-panel glass-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Emotion Sensing</p>
          <h2>Live camera preview</h2>
        </div>
        <span className="emotion-chip">
          {emotionData.emoji} {emotionData.label}
        </span>
      </div>

      <div className="video-shell">
        {webcamActive ? <video autoPlay muted playsInline ref={videoRef} /> : <div className="video-placeholder">Camera is off</div>}
      </div>

      <div className="emotion-info">
        <p>AI tone right now: <strong>{detectedMode.replaceAll("-", " ")}</strong></p>
        <p className="subtle-text">
          Webcam frames never leave your browser. The backend only receives the emotion label.
        </p>
        {permissionError ? <p className="error-text">{permissionError}</p> : null}
      </div>

      {!webcamActive ? (
        <button className="secondary-button" onClick={onStartCamera} type="button">
          Enable Camera
        </button>
      ) : null}
    </section>
  );
};

export default EmotionPanel;

import { EMOTION_META } from "../lib/constants";

const EmotionPanel = ({
  emotion,
  emotionConfidence,
  expressionScores,
  rawExpressionScores,
  webcamActive,
  videoReady,
  faceDetected,
  faceStatus,
  modelsReady,
  permissionError,
  videoRef,
  overlayCanvasRef,
  onStartCamera,
  onRecalibrateEmotion,
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
        <span className={`emotion-chip emotion-chip-${emotion}`}>
          {emotionData.emoji} {emotionData.label}
        </span>
      </div>

      <div className="video-shell">
        {webcamActive ? (
          <>
            <video autoPlay muted playsInline ref={videoRef} />
            <canvas className="video-overlay-canvas" ref={overlayCanvasRef} />
            <div className="video-overlay-badge">You</div>
            <div className={`video-overlay-status ${faceDetected ? "detected" : "searching"}`}>
              {faceStatus}
            </div>
          </>
        ) : (
          <div className="video-placeholder">Camera is off</div>
        )}
      </div>

      <div className="emotion-info">
        <div className="emotion-live-card">
          <span className="emotion-live-emoji">{emotionData.emoji}</span>
          <div>
            <p className="emotion-live-title">Current mood detected</p>
            <p className="emotion-live-value">{emotionData.label}</p>
          </div>
        </div>
        <p>AI tone right now: <strong>{detectedMode.replaceAll("-", " ")}</strong></p>
        <p>Detection confidence: <strong>{Math.round((emotionConfidence || 0) * 100)}%</strong></p>
        <p className="subtle-text">
          Webcam frames never leave your browser. The backend only receives the emotion label, not the video.
        </p>
        <p className="subtle-text">
          Camera: <strong>{webcamActive ? (videoReady ? "Live" : "Starting") : "Off"}</strong> | Models: <strong>{modelsReady ? "Ready" : "Loading"}</strong>
        </p>
        <p className="subtle-text">
          Face tracking: <strong>{faceDetected ? "Detected" : "Not detected yet"}</strong>
        </p>
        <p className="subtle-text">
          Best results: face center me rakho, light seedhi ho, aur expression 1-2 second hold karo.
        </p>
        {permissionError ? <p className="error-text">{permissionError}</p> : null}
      </div>

      {expressionScores?.length ? (
        <div className="emotion-score-list">
          <p className="subtle-text">Live expression breakdown</p>
          {expressionScores.map((item) => (
            <div className="emotion-score-row" key={item.label}>
              <span>{item.label}</span>
              <div className="emotion-score-bar">
                <div className="emotion-score-fill" style={{ width: `${Math.round(item.value * 100)}%` }} />
              </div>
              <strong>{Math.round(item.value * 100)}%</strong>
            </div>
          ))}
        </div>
      ) : null}

      {rawExpressionScores?.length ? (
        <div className="emotion-score-list raw-score-list">
          <p className="subtle-text">DeepFace raw scores</p>
          {rawExpressionScores.map((item) => (
            <div className="emotion-score-row" key={`raw-${item.label}`}>
              <span>{item.label}</span>
              <div className="emotion-score-bar">
                <div className="emotion-score-fill raw-score-fill" style={{ width: `${Math.round(item.value * 100)}%` }} />
              </div>
              <strong>{Math.round(item.value * 100)}%</strong>
            </div>
          ))}
        </div>
      ) : null}

      {!webcamActive ? (
        <button className="secondary-button" onClick={onStartCamera} type="button">
          {modelsReady ? "Enable Camera" : "Loading Models..."}
        </button>
      ) : !videoReady ? (
        <button className="secondary-button" disabled type="button">
          Starting Camera...
        </button>
      ) : (
        <button className="secondary-button" onClick={onRecalibrateEmotion} type="button">
          Recalibrate Emotion
        </button>
      )}
    </section>
  );
};

export default EmotionPanel;

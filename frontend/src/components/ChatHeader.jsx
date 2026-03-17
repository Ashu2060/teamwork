import { MODES } from "../lib/constants";

const ChatHeader = ({
  selectedMode,
  effectiveMode,
  autoModeEnabled,
  onModeChange,
  onAutoModeToggle,
  theme,
  onThemeToggle,
  voiceEnabled,
  onVoiceToggle
}) => {
  return (
    <header className="chat-header glass-card">
      <div>
        <p className="eyebrow">MoodMate AI</p>
        <h1>Emotion-aware mental wellness companion</h1>
        <p className="subtle-text">
          Manual mode is always available, and auto mode can adapt the tone from your live emotion signal.
        </p>
      </div>

      <div className="header-actions">
        <button className="toggle-chip" onClick={onThemeToggle} type="button">
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button className="toggle-chip" onClick={onVoiceToggle} type="button">
          Voice: {voiceEnabled ? "On" : "Off"}
        </button>
        <button className="toggle-chip" onClick={onAutoModeToggle} type="button">
          Auto mode: {autoModeEnabled ? "On" : "Off"}
        </button>
      </div>

      <div className="mode-row">
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isActive = effectiveMode === mode.id;

          return (
            <button
              key={mode.id}
              className={`mode-button ${isSelected ? "selected" : ""} ${isActive ? "active" : ""}`}
              onClick={() => onModeChange(mode.id)}
              type="button"
            >
              <span>{mode.emoji}</span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default ChatHeader;

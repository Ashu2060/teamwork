const Composer = ({
  input,
  onInputChange,
  onSubmit,
  onToggleListening,
  listening,
  disabled
}) => {
  return (
    <form className="composer glass-card" onSubmit={onSubmit}>
      <textarea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Share what’s on your mind..."
        rows={1}
      />
      <div className="composer-actions">
        <button className={`mic-button ${listening ? "listening" : ""}`} onClick={onToggleListening} type="button">
          {listening ? "Stop Mic" : "Mic"}
        </button>
        <button className="send-button" disabled={disabled || !input.trim()} type="submit">
          Send
        </button>
      </div>
    </form>
  );
};

export default Composer;

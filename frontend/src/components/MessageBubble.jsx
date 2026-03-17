const formatTime = (value) =>
  new Date(value || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

const MessageBubble = ({ message }) => {
  return (
    <article className={`message-bubble ${message.role === "user" ? "user" : "assistant"}`}>
      <div className="message-meta">
        <span>{message.role === "user" ? "You" : "MoodMate"}</span>
        <span>{formatTime(message.createdAt)}</span>
      </div>
      <p>{message.content}</p>
      {message.mode && message.role === "assistant" ? (
        <span className="message-tag">{message.mode.replaceAll("-", " ")}</span>
      ) : null}
    </article>
  );
};

export default MessageBubble;

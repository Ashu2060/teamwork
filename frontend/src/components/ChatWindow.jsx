import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({ messages, loading }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <section className="chat-window glass-card" ref={containerRef}>
      {messages.length === 0 ? (
        <div className="empty-state">
          <h2>Start talking about how you feel</h2>
          <p>
            Your webcam emotion analysis stays in the browser. Only your text message, selected mode, and emotion
            label are shared with the backend.
          </p>
        </div>
      ) : (
        messages.map((message, index) => <MessageBubble key={`${message.role}-${index}`} message={message} />)
      )}

      {loading ? (
        <div className="typing-indicator">
          <span />
          <span />
          <span />
        </div>
      ) : null}
    </section>
  );
};

export default ChatWindow;

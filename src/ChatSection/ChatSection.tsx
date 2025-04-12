import React, { useState, useRef, useEffect } from "react";
import "./ChatSection.scss";

interface ChatSectionProps {
  onBack: () => void;
}

interface GameMeta {
  game_name: string;
  metadata: any;
}

interface Message {
  text: string;
  type: "user" | "assistant";
  rawgData?: GameMeta[];
}

const ChatSection: React.FC<ChatSectionProps> = ({ onBack }) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { text: query, type: "user" }]);
    const userQuery = query;
    setQuery("");

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          text: data.response,
          type: "assistant",
          rawgData: Array.isArray(data.rawg_data) ? data.rawg_data : [],
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error communicating with server.", type: "assistant" },
      ]);
    }
  };

  return (
    <div className="chat-section">
      {/* Header / Back button */}
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          ← 
        </button>
        <h2>Chat with the Game Assistant</h2>
      </div>

      {/* Messages container */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.type}`}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {msg.rawgData && msg.rawgData.length > 0 ? (
              <div className="game-grid">
                {msg.rawgData.map((game, idx) => {
                  const meta = game.metadata || {};
                  return (
                    <div
                      className="game-card"
                      key={idx}
                      style={{
                        animationDelay: `${idx * 0.1}s`, // 👈 stagger delay: 0.1s per card
                      }}
                    >
                      <img
                        src={meta.background_image}
                        alt={meta.name}
                        className="game-image"
                      />
                      <div className="game-name">{meta.name}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>{msg.text}</>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area pinned at the bottom */}
      <div className="chat-input">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // Prevent newline
              handleSend(); // Trigger send
            }
          }}
        />
        <button className="send-btn" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatSection;

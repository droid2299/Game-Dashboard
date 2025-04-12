import React, { useState, useRef, useEffect } from "react";
import "./ChatSection.scss";

interface ChatSectionProps {
  onBack: () => void;
}

interface Message {
  text: string;
  type: "user" | "assistant";
}

const ChatSection: React.FC<ChatSectionProps> = ({ onBack }) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    // Add the user's message to the chat
    setMessages((prev) => [...prev, { text: query, type: "user" }]);
    const userQuery = query;
    setQuery("");

    try {
      // Send request to server
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      const data = await res.json();

      // Add the assistant's response
      setMessages((prev) => [
        ...prev,
        { text: data.response, type: "assistant" },
      ]);
    } catch (error) {
      console.error("Error:", error);
      // Fallback error message
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
          ← Back
        </button>
        <h2>Chat with the Game Assistant</h2>
      </div>

      {/* Messages container */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.type}`}
            style={{ whiteSpace: "pre-wrap" }} // Preserve newlines and formatting
          >
            {msg.text}
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
        />
        <button className="send-btn" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatSection;

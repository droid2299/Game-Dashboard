import React, { useState } from "react";
import "./ApiKeySetup.scss";

interface ApiKeySetupProps {
  onApiKeySaved: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySaved }) => {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError("API key cannot be empty");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/setup", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `api_key=${encodeURIComponent(apiKey.trim())}`,
      });

      if (res.redirected || res.ok) {
        onApiKeySaved();
      } else {
        setError("Failed to save API key.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="api-key-setup">
      <h2>Enter your RAWG API Key</h2>
      <input
        type="text"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="RAWG API Key"
      />
      <button onClick={handleSave}>Save</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ApiKeySetup;

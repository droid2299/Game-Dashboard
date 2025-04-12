import React, { useState, useEffect } from "react";
import "./GridSection.scss";
import { GameCard } from "../GameCard/GameCard";

interface SuggestedGame {
  game_name: string;
  metadata: {
    background_image?: string;
    name?: string;
    // Additional metadata fields can be added here.
  };
}

interface GridSectionProps {
  // Optional onBack prop if you’d like to navigate back
  onBack?: () => void;
}

const GridSection: React.FC<GridSectionProps> = ({ onBack }) => {
  const [suggestedGames, setSuggestedGames] = useState<SuggestedGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Send a pre-defined query to your chat API endpoint that returns RAWG suggestions.
    const fetchSuggestedGames = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Change the query as appropriate.
          body: JSON.stringify({ query: "Suggest games similar to GTA 5" }),
        });
        const data = await res.json();
        console.log("API Response (GridSection):", data);
        if (data.rawg_data && Array.isArray(data.rawg_data)) {
          setSuggestedGames(data.rawg_data);
        }
      } catch (error) {
        console.error("Error fetching suggested games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedGames();
  }, []);

  return (
    <div className="grid-section">
      <h2>Suggested Games</h2>
      {loading && <p>Loading suggested games...</p>}
      {!loading && suggestedGames.length === 0 && (
        <p>No suggested games available.</p>
      )}
      {suggestedGames.length > 0 && (
        <div className="suggested-games-grid">
          {suggestedGames.map((game, idx) => (
            <GameCard
              key={idx}
              logo={game.metadata.background_image || ""}
              name={game.metadata.name || game.game_name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GridSection;

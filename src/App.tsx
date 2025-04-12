import './App.scss';
import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { CrossFader } from 'react-cross-fader';
import { GameCardsList } from "./GameCardsList/GameCardsList";
import { ACTIVE_CARD_SIZE, CARD_SIZE } from "./constants";
import { usePrevious } from "./hooks/use-previous";
import LoadingScreen from "./LoadingScreen/LoadingScreen";
import TopBar from "./TopBar/TopBar";
import SettingsPage from "./SettingsPage/SettingsPage";
import ChatSection from "./ChatSection/ChatSection";
import ApiKeySetup from './APIKeySetup/APIKeySetup';

type Screenshot = { id: number; image: string; };

type Game = {
  name: string;
  file: string;
  logo: string;
  bg: string;
  released?: string;
  rating?: number;
  description?: string;
  screenshots?: Screenshot[];
};

const navigateSound = new Howl({ src: ['/sounds/menu.mp3'], volume: 0.3 });
const loadSound = new Howl({ src: ['/sounds/home_menu_load.mp3'], volume: 0.3 });
const backgroundMusic = new Howl({ src: ['/sounds/background.mp3'], loop: true, volume: 0.2 });

function App() {
  const [active, setActive] = useState(0);
  const [games, setGames] = useState<Game[] | null>(null);
  const [bgImage, setBgImage] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [apiKeySet, setApiKeySet] = useState<boolean | null>(null);

  const playContainerRef = useRef<HTMLDivElement>(null);
  const prevActive = usePrevious(active);

  const checkApiKey = async () => {
    try {
      const res = await fetch("http://localhost:3000/check-key");
      const data = await res.json();
      setApiKeySet(data.present);
    } catch (err) {
      setApiKeySet(false);
    }
  };

  useEffect(() => {
    checkApiKey();
   }, []);

  // Step 2: Fetch games only after API key is confirmed
  useEffect(() => {
    if (apiKeySet !== true) return;

    loadSound.play();
    backgroundMusic.play();

    fetch('http://localhost:3000/api/games')
      .then((res) => res.json())
      .then((data) => setGames(data))
      .catch((err) => {
        console.error("Failed to fetch games:", err);
        setGames([]);
      });
  }, [apiKeySet]);

  // Step 3: Background image updates with active game
  useEffect(() => {
    if (!games || games.length === 0) return;
    const game = games[active];
    if (game.screenshots && game.screenshots.length > 0) {
      const randomIndex = Math.floor(Math.random() * game.screenshots.length);
      setBgImage(game.screenshots[randomIndex].image);
    } else {
      setBgImage(game.bg);
    }
  }, [active, games]);

  // Step 4: Arrow key navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!games || games.length === 0) return;
      if (event.key === 'ArrowRight') {
        setActive(prev => {
          const next = Math.min(prev + 1, games.length - 1);
          if (next !== prev) navigateSound.play();
          return next;
        });
      } else if (event.key === 'ArrowLeft') {
        setActive(prev => {
          const next = Math.max(prev - 1, 0);
          if (next !== prev) navigateSound.play();
          return next;
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [games]);

  const navigate = (index: number) => {
    if (index === active) return;
    navigateSound.play();
    setActive(index);
  };

  const handleSettingsClick = () => setShowSettings(true);
  const handleChatClick = () => setShowChat(true);
  const handleBack = () => {
    setShowSettings(false);
    setShowChat(false);
  };

  // 1. Loading while checking API key
  if (apiKeySet === null || (apiKeySet === true && games === null)) return <LoadingScreen />;

  // API key not set
  if (!apiKeySet) {
    return (
      <ApiKeySetup
        onApiKeySaved={() => {
          checkApiKey(); // 🔁 recheck after saving
        }}
      />
    );
 }

  // Settings page
  if (showSettings) return <SettingsPage onBack={handleBack} />;

  // Chat page
  if (showChat) return <ChatSection onBack={handleBack} />;

  // No games
  if (games!.length === 0) {
    return (
      <div className="ps5-container no-games">
        <CrossFader className="game-bg-container">
          <div
            key="no-games-bg"
            className="game-bg"
            style={{
              backgroundImage: `url("/images/empty-library.jpg")`,
              filter: 'blur(8px) brightness(0.5)',
            }}
          />
        </CrossFader>

        <div className="no-games-message">
          <h1>No Games Found</h1>
          <p>Looks like your library is empty.</p>
          <button className="play-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  

  const currentGame = games![active];
  const description = currentGame.description || 'No description available.';
  const sentences = description.split(/(?<=[.!?])\s+/);
  const displayDescription =
    sentences.length > 3 ? sentences.slice(0, 3).join(' ') + ' ...' : description;

  return (
    <div
      className="ps5-container"
      style={{
        ['--active-card-size']: `${ACTIVE_CARD_SIZE}px`,
        ['--card-size']: `${CARD_SIZE}px`,
      } as Record<string, string>}
    >
      {/* Top bar now receives both settings and chat click handlers */}
      <TopBar onSettingsClick={handleSettingsClick} onChatClick={handleChatClick} />

      <CrossFader destroyOnFadeOutComplete={false} className="game-bg-container">
        <div
          key={bgImage}
          className="game-bg"
          style={{ backgroundImage: `url("${bgImage}")` }}
        />
      </CrossFader>

      <div className="games-list-container" style={{ marginTop: '120px' }}>
        <GameCardsList
          games={games!.map(({ logo, name }) => ({ logo, name }))}
          activeIndex={active}
          onActiveIndexChange={navigate}
        />
      </div>

      <CrossFader className="play-container" ref={playContainerRef}>
        <h1 style={{ fontWeight: 'bold' }}>{currentGame.name}</h1>
        <p className="description">{displayDescription}</p>
        <button className="play-btn">Download</button>
      </CrossFader>
    </div>
  );
}

export default App;

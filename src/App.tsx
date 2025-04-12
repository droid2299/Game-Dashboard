import './App.scss';
import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { CrossFader } from 'react-cross-fader';
import { GameCardsList } from "./GameCardsList/GameCardsList";
import { ACTIVE_CARD_SIZE, CARD_SIZE, CARDS_OFFSET_X } from "./constants";
import { usePrevious } from "./hooks/use-previous";
import LoadingScreen from "./LoadingScreen/LoadingScreen";
import TopBar from "./TopBar/TopBar"; 
import SettingsPage from "./SettingsPage/SettingsPage";
import ChatSection from "./ChatSection/ChatSection";  // New chat UI component

type Screenshot = {
  id: number;
  image: string;
};

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

const navigateSound = new Howl({
  src: ['/sounds/menu.mp3'],
  volume: 0.3,
});

const loadSound = new Howl({
  src: ['/sounds/home_menu_load.mp3'],
  volume: 0.3,
});

const backgroundMusic = new Howl({
  src: ['/sounds/background.mp3'],
  loop: true,
  volume: 0.2,
});

function App() {
  const [active, setActive] = useState(0);
  const [games, setGames] = useState<Game[] | null>(null);
  const [bgImage, setBgImage] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);  // New state for chat UI

  const playContainerRef = useRef<HTMLDivElement>(null);
  const prevActive = usePrevious(active);

  useEffect(() => {
    loadSound.play();
    backgroundMusic.play();

    fetch('http://127.0.0.1:3000/api/games')
      .then(response => response.json())
      .then(data => setGames(data))
      .catch(err => {
        console.error("Error fetching games:", err);
        setGames([]);
      });
  }, []);

  // Update background image when active card changes.
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

  // Listen for arrow key events to navigate the cards.
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

  function handleSettingsClick() {
    setShowSettings(true);
  }

  function handleChatClick() {
    setShowChat(true);
  }

  function handleBack() {
    // You could decide which screen to go back to, or reset both.
    setShowSettings(false);
    setShowChat(false);
  }

  // Render Loading, Settings, or Chat screens if needed.
  if (games === null) {
    return <LoadingScreen />;
  }

  if (showSettings) {
    return <SettingsPage onBack={handleBack} />;
  }

  if (showChat) {
    return <ChatSection onBack={handleBack} />;
  }

  if (games.length === 0) {
    return <div>No games found.</div>;
  }

  const currentGame = games[active];
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
          games={games.map(({ logo, name }) => ({ logo, name }))}
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

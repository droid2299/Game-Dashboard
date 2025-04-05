import React, { useEffect, useState } from 'react';
import './TopBar.scss';

function formatTime(date: Date) {
  // e.g. "12:05" using 24-hour or 12-hour clock
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const TopBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(formatTime(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 1000); // update every second

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="top-bar">
      <img src="/search-icon.svg" alt="Search" className="icon" />
      <img src="/settings-icon.svg" alt="Settings" className="icon" />
      <img src="/chat-icon.svg" alt="Chat" className="icon" />
      <div className="time">{currentTime}</div>
    </div>
  );
};

export default TopBar;

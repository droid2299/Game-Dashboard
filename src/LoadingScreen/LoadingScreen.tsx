import React from 'react';
import './LoadingScreen.scss';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <h2>Loading Games...</h2>
    </div>
  );
};

export default LoadingScreen;

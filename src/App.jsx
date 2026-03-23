import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initGame = async () => {
      try {
        // Simulate loading progress
        setLoadingProgress(10);
        
        // Create game engine
        const engine = new GameEngine(canvasRef.current);
        engineRef.current = engine;
        
        setLoadingProgress(30);
        
        // Initialize engine
        await engine.initialize();
        
        setLoadingProgress(100);
        
        // Hide loading screen after a short delay
        setTimeout(() => {
          setLoading(false);
        }, 500);
        
      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError(err.message || 'Failed to load game');
        setLoading(false);
      }
    };

    initGame();

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="App">
      {loading && (
        <div className="loading-screen">
          <div className="loading-content">
            <h1 className="loading-title">
              <span className="star">⭐</span>
              Gwen's Galaxy Pro
              <span className="star">⭐</span>
            </h1>
            <div className="loading-subtitle">Educational Space Adventure</div>
            
            <div className="loading-progress-container">
              <div className="loading-progress-bar" style={{ width: `${loadingProgress}%` }}></div>
            </div>
            
            <div className="loading-tip">
              {loadingProgress < 30 && "🚀 Preparing spaceship..."}
              {loadingProgress >= 30 && loadingProgress < 60 && "✨ Loading stellar content..."}
              {loadingProgress >= 60 && loadingProgress < 90 && "🎮 Initializing game controls..."}
              {loadingProgress >= 90 && "🌟 Almost ready for adventure!"}
            </div>
            
            <div className="loading-spinner">
              <div className="planet planet1"></div>
              <div className="planet planet2"></div>
              <div className="planet planet3"></div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-screen">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        className="game-canvas"
        touch-action="none"
      />
      
      <div className="game-overlay">
        <div className="top-bar">
          <div className="game-logo">Gwen's Galaxy</div>
          <div className="game-controls">
            <button className="control-btn" title="Home (ESC)" onClick={() => {
              if (engineRef.current) {
                engineRef.current.loadMainMenu();
              }
            }}>
              🏠
            </button>
            <button className="control-btn" title="Sound (M)" onClick={() => {
              if (engineRef.current) {
                engineRef.current.toggleMusic();
              }
            }}>
              🔊
            </button>
            <button className="control-btn" title="Fullscreen" onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}>
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
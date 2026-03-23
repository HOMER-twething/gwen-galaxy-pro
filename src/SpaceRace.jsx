import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from 'babylonjs';

export function SpaceRace({ onExit, onScore }) {
  const canvasRef = useRef(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const shipRef = useRef(null);
  const asteroidsRef = useRef([]);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine and scene
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;
    
    // Space background
    scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.1, 1);
    
    // Camera
    const camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 10, -20), scene);
    camera.setTarget(new BABYLON.Vector3(0, 0, 5));
    
    // Light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    
    // Player ship
    const ship = BABYLON.MeshBuilder.CreateBox("ship", {
      height: 1,
      width: 2,
      depth: 3
    }, scene);
    ship.position = new BABYLON.Vector3(0, 0, 0);
    const shipMat = new BABYLON.StandardMaterial("shipMat", scene);
    shipMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
    shipMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
    ship.material = shipMat;
    shipRef.current = ship;
    
    // Stars background
    for (let i = 0; i < 100; i++) {
      const star = BABYLON.MeshBuilder.CreateSphere(`star${i}`, {diameter: 0.05}, scene);
      star.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        Math.random() * 50 + 10
      );
      const starMat = new BABYLON.StandardMaterial(`starMat${i}`, scene);
      starMat.emissiveColor = new BABYLON.Color3(1, 1, 0.9);
      star.material = starMat;
    }
    
    // Create asteroids
    const createAsteroid = () => {
      const asteroid = BABYLON.MeshBuilder.CreateSphere("asteroid", {
        diameter: 2,
        segments: 8
      }, scene);
      
      asteroid.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        40
      );
      
      const asteroidMat = new BABYLON.StandardMaterial("asteroidMat", scene);
      asteroidMat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2);
      asteroid.material = asteroidMat;
      
      asteroidsRef.current.push(asteroid);
      
      return asteroid;
    };
    
    // Game loop
    let frameCount = 0;
    let score = 0;
    let isGameOver = false;
    
    scene.registerBeforeRender(() => {
      if (isGameOver) return;
      
      frameCount++;
      
      // Create new asteroid every 60 frames
      if (frameCount % 60 === 0) {
        createAsteroid();
      }
      
      // Move asteroids
      asteroidsRef.current = asteroidsRef.current.filter(asteroid => {
        if (!asteroid.isDisposed()) {
          asteroid.position.z -= 0.3;
          asteroid.rotation.x += 0.02;
          asteroid.rotation.y += 0.01;
          
          // Check collision with ship
          if (shipRef.current && asteroid.intersectsMesh(shipRef.current, false)) {
            isGameOver = true;
            setGameOver(true);
            if (onScore) onScore(score);
            return false;
          }
          
          // Remove asteroids that passed
          if (asteroid.position.z < -10) {
            score += 10;
            setGameScore(score);
            asteroid.dispose();
            return false;
          }
          
          return true;
        }
        return false;
      });
    });
    
    // Keyboard controls
    const handleKeyDown = (e) => {
      if (!shipRef.current || isGameOver) return;
      
      switch(e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          if (shipRef.current.position.x > -8) {
            shipRef.current.position.x -= 1;
          }
          break;
        case 'arrowright':
        case 'd':
          if (shipRef.current.position.x < 8) {
            shipRef.current.position.x += 1;
          }
          break;
        case 'arrowup':
        case 'w':
          if (shipRef.current.position.y < 6) {
            shipRef.current.position.y += 1;
          }
          break;
        case 'arrowdown':
        case 's':
          if (shipRef.current.position.y > -6) {
            shipRef.current.position.y -= 1;
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Voice controls
    const setupVoiceControls = () => {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const command = last[0].transcript.toLowerCase();
        
        if (!shipRef.current || isGameOver) return;
        
        if (command.includes('left')) {
          if (shipRef.current.position.x > -8) {
            shipRef.current.position.x -= 2;
          }
        } else if (command.includes('right')) {
          if (shipRef.current.position.x < 8) {
            shipRef.current.position.x += 2;
          }
        } else if (command.includes('up')) {
          if (shipRef.current.position.y < 6) {
            shipRef.current.position.y += 2;
          }
        } else if (command.includes('down')) {
          if (shipRef.current.position.y > -6) {
            shipRef.current.position.y -= 2;
          }
        }
      };
      
      recognition.start();
      
      return () => {
        recognition.stop();
      };
    };
    
    const voiceCleanup = setupVoiceControls();
    
    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (voiceCleanup) voiceCleanup();
      asteroidsRef.current.forEach(asteroid => {
        if (!asteroid.isDisposed()) {
          asteroid.dispose();
        }
      });
      scene.dispose();
      engine.dispose();
    };
  }, []);

  const handleRestart = () => {
    setGameOver(false);
    setGameScore(0);
    // Reset ship position
    if (shipRef.current) {
      shipRef.current.position = new BABYLON.Vector3(0, 0, 0);
    }
    // Clear asteroids
    asteroidsRef.current.forEach(asteroid => {
      if (!asteroid.isDisposed()) {
        asteroid.dispose();
      }
    });
    asteroidsRef.current = [];
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Score Display */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        Score: {gameScore} 🚀
      </div>
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        color: 'white',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'right',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        <div>Use Arrow Keys or WASD</div>
        <div>Or say: "Up", "Down", "Left", "Right"</div>
      </div>
      
      {/* Game Over Screen */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>Game Over!</h2>
          <p style={{ fontSize: '24px', marginBottom: '30px' }}>
            Final Score: {gameScore} 🌟
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button
              onClick={handleRestart}
              style={{
                padding: '15px 30px',
                fontSize: '20px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              Play Again
            </button>
            <button
              onClick={onExit}
              style={{
                padding: '15px 30px',
                fontSize: '20px',
                background: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              Exit to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
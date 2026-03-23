import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from 'babylonjs';
import { SpaceRace } from './SpaceRace';
import { ParentDashboard } from './ParentDashboard';

export function SimpleApp() {
  const canvasRef = useRef(null);
  const [scene, setScene] = useState(null);
  const [currentMode, setCurrentMode] = useState('menu');
  const [score, setScore] = useState(0);
  const [voiceReady, setVoiceReady] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [mathProblem, setMathProblem] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showSpaceRace, setShowSpaceRace] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedMic, setSelectedMic] = useState('Default');
  const [micDevices, setMicDevices] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [lettersFound, setLettersFound] = useState([]);
  const [targetLetters, setTargetLetters] = useState([]);

  // Word lists for spelling
  const easyWords = ['CAT', 'DOG', 'SUN', 'MOM', 'DAD', 'BEE', 'CUP', 'HAT', 'BIG', 'RED'];
  const mediumWords = ['STAR', 'MOON', 'TREE', 'BIRD', 'FISH', 'BOOK', 'PLAY', 'JUMP', 'LOVE', 'BLUE'];

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Babylon engine
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    
    // Set background color to space-like
    scene.clearColor = new BABYLON.Color4(0.05, 0.02, 0.15, 1);
    
    // Camera
    const camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    
    // Lights
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    
    // Add a directional light for better shading
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, 1), scene);
    dirLight.intensity = 0.5;
    
    // Ground with space texture feel
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 30, height: 30}, scene);
    ground.material = new BABYLON.StandardMaterial("groundMat", scene);
    ground.material.diffuseColor = new BABYLON.Color3(0.1, 0.05, 0.2);
    ground.material.specularColor = new BABYLON.Color3(0.3, 0.2, 0.4);
    
    // Stella the mascot - improved version
    const stella = BABYLON.MeshBuilder.CreateSphere("stella", {diameter: 2, segments: 32}, scene);
    stella.position.y = 2;
    const stellaMat = new BABYLON.StandardMaterial("stellaMat", scene);
    stellaMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0.8);
    stellaMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.2);
    stellaMat.specularColor = new BABYLON.Color3(1, 1, 1);
    stella.material = stellaMat;
    
    // Add some stars in the background
    for (let i = 0; i < 50; i++) {
      const star = BABYLON.MeshBuilder.CreateSphere(`star${i}`, {diameter: 0.1}, scene);
      star.position.x = (Math.random() - 0.5) * 40;
      star.position.y = Math.random() * 15 + 5;
      star.position.z = (Math.random() - 0.5) * 40;
      const starMat = new BABYLON.StandardMaterial(`starMat${i}`, scene);
      starMat.emissiveColor = new BABYLON.Color3(1, 1, 0.8);
      star.material = starMat;
    }
    
    // Animate Stella and scene
    scene.registerBeforeRender(() => {
      stella.rotation.y += 0.01;
      stella.position.y = 2 + Math.sin(Date.now() * 0.001) * 0.5;
      
      // Gentle camera movement
      camera.position.x = Math.sin(Date.now() * 0.0002) * 2;
    });
    
    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });
    
    // Resize handler
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);
    
    setScene(scene);
    
    // Check voice support and get microphones
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceReady(true);
      
      // Get microphone devices
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const mics = devices.filter(device => device.kind === 'audioinput');
        setMicDevices(mics);
        if (mics.length > 0) {
          setSelectedMic(mics[0].label || 'Microphone 1');
        }
      }).catch(err => {
        console.error('Error getting microphones:', err);
        setSelectedMic('No microphone access');
      });
      
      // Request microphone permission
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log('Microphone access granted');
          stream.getTracks().forEach(track => track.stop()); // Stop the stream after getting permission
        })
        .catch(err => {
          console.error('Microphone permission denied:', err);
          setVoiceReady(false);
          setSelectedMic('Permission denied');
        });
    } else {
      setSelectedMic('Not supported');
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // Text to speech helper
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  // Save stats to localStorage
  const updateStats = (type, value = 1) => {
    const stats = JSON.parse(localStorage.getItem('gwenGalaxyStats') || '{}');
    
    if (!stats.totalScore) stats.totalScore = 0;
    if (!stats.gamesPlayed) stats.gamesPlayed = 0;
    if (!stats.wordsSpelled) stats.wordsSpelled = 0;
    if (!stats.mathProblems) stats.mathProblems = 0;
    if (!stats.spaceRaceHighScore) stats.spaceRaceHighScore = 0;
    
    switch (type) {
      case 'score':
        stats.totalScore += value;
        break;
      case 'game':
        stats.gamesPlayed += 1;
        break;
      case 'word':
        stats.wordsSpelled += 1;
        break;
      case 'math':
        stats.mathProblems += 1;
        break;
      case 'spaceRace':
        if (value > stats.spaceRaceHighScore) {
          stats.spaceRaceHighScore = value;
        }
        break;
    }
    
    stats.lastPlayed = new Date().toISOString();
    localStorage.setItem('gwenGalaxyStats', JSON.stringify(stats));
  };

  // Show feedback message
  const showFeedback = (message, isSuccess = true) => {
    setFeedback(message);
    if (isSuccess) {
      speak(message);
    }
    setTimeout(() => setFeedback(''), 3000);
  };

  // Start spelling mode
  const startSpelling = (difficulty = 'easy') => {
    const words = difficulty === 'easy' ? easyWords : mediumWords;
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
    setCurrentMode('spelling');
    
    speak(`Let's spell the word: ${word}. ${word.split('').join(' ')}`);
    
    if (voiceReady) {
      setTimeout(() => {
        setIsListening(true);
        listenForSpelling(word);
      }, 3000);
    }
  };

  // Voice recognition for spelling - SUPER FORGIVING for kids!
  const listenForSpelling = (word) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    // Set up target letters
    const letters = word.split('');
    setTargetLetters(letters);
    setLettersFound([]);
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;
    
    recognition.onstart = () => {
      console.log('Voice recognition started for word:', word);
      setIsListening(true);
      showFeedback(`Say each letter: ${letters.join(' - ')}`, false);
    };
    
    recognition.onresult = (event) => {
      // Process all results to find letters
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        // Clean and process the transcript
        let heard = transcript.toUpperCase();
        
        // Convert common phonetic interpretations to letters
        heard = heard
          .replace(/\bBEE\b/gi, 'B')
          .replace(/\bSEE\b/gi, 'C')
          .replace(/\bDEE\b/gi, 'D')
          .replace(/\bEE\b/gi, 'E')
          .replace(/\bEF\b/gi, 'F')
          .replace(/\bGEE\b/gi, 'G')
          .replace(/\bAITCH\b/gi, 'H')
          .replace(/\bEYE\b/gi, 'I')
          .replace(/\bJAY\b/gi, 'J')
          .replace(/\bKAY\b/gi, 'K')
          .replace(/\bEL\b/gi, 'L')
          .replace(/\bEM\b/gi, 'M')
          .replace(/\bEN\b/gi, 'N')
          .replace(/\bOH\b/gi, 'O')
          .replace(/\bPEE\b/gi, 'P')
          .replace(/\bCUE\b/gi, 'Q')
          .replace(/\bQUEUE\b/gi, 'Q')
          .replace(/\bAR\b/gi, 'R')
          .replace(/\bARE\b/gi, 'R')
          .replace(/\bESS\b/gi, 'S')
          .replace(/\bTEE\b/gi, 'T')
          .replace(/\bYOU\b/gi, 'U')
          .replace(/\bVEE\b/gi, 'V')
          .replace(/\bDOUBLE YOU\b/gi, 'W')
          .replace(/\bDOUBLEYOU\b/gi, 'W')
          .replace(/\bEX\b/gi, 'X')
          .replace(/\bWHY\b/gi, 'Y')
          .replace(/\bZEE\b/gi, 'Z')
          .replace(/\bZED\b/gi, 'Z')
          .replace(/\bAY\b/gi, 'A')
          .replace(/\bEH\b/gi, 'A')
          .replace(/[^A-Z]/g, ' ')  // Remove non-letters
          .replace(/\s+/g, '');      // Remove spaces
        
        // Check each character in what we heard
        for (let char of heard) {
          const currentIndex = lettersFound.length;
          if (currentIndex < letters.length && char === letters[currentIndex]) {
            // Found the next letter!
            const newLettersFound = [...lettersFound, char];
            setLettersFound(newLettersFound);
            
            // Give immediate positive feedback
            speak(`Good! ${char}!`);
            
            // Check if word is complete
            if (newLettersFound.length === letters.length) {
              // SUCCESS!
              recognition.stop();
              setIsListening(false);
              setScore(s => s + 10);
              updateStats('score', 10);
              updateStats('word');
              updateStats('game');
              showFeedback(`🎉 AMAZING! You spelled ${word}! 🌟`, true);
              speak(`Fantastic! You spelled ${word}! You're so smart!`);
              setTimeout(() => {
                setCurrentMode('menu');
                setLettersFound([]);
                setTargetLetters([]);
              }, 4000);
              return;
            }
            
            // Update display to show progress
            const remaining = letters.slice(newLettersFound.length).join(' - ');
            if (remaining) {
              showFeedback(`Great! Now say: ${remaining}`, false);
            }
            
            break; // Move to next transcript
          } else if (currentIndex < letters.length && char !== letters[currentIndex]) {
            // Wrong letter - but be encouraging!
            if (event.results[i].isFinal) {
              speak(`I heard ${char}. We need ${letters[currentIndex]}`);
              showFeedback(`Try ${letters[currentIndex]} next!`, false);
            }
          }
        }
        
        // Also check if they said the whole word at once
        if (heard === word) {
          // They said the whole word correctly!
          recognition.stop();
          setIsListening(false);
          setLettersFound(letters);
          setScore(s => s + 10);
          updateStats('score', 10);
          updateStats('word');
          updateStats('game');
          showFeedback(`🎉 PERFECT! You said ${word}! 🌟`, true);
          speak(`Perfect! You said ${word} all at once! Amazing!`);
          setTimeout(() => {
            setCurrentMode('menu');
            setLettersFound([]);
            setTargetLetters([]);
          }, 4000);
          return;
        }
      }
    };
    
    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // No speech is OK for kids - just keep listening
        return;
      }
      
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setIsListening(false);
        setVoiceReady(false);
        setSelectedMic('Permission denied');
        showFeedback('Microphone permission denied. Use the Type button instead.', false);
      }
    };
    
    recognition.onend = () => {
      // Auto-restart if we're still in spelling mode and haven't completed
      if (currentMode === 'spelling' && lettersFound.length < letters.length && voiceReady) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Auto-restart failed:', e);
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
      showFeedback('Failed to start voice recognition. Try typing!', false);
    }
  };
  
  // Stop listening function
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      showFeedback('Stopped listening', false);
    }
  };

  // Start math mode
  const startMath = (difficulty = 'easy') => {
    let num1, num2, operation, answer;
    
    if (difficulty === 'easy') {
      num1 = Math.floor(Math.random() * 5) + 1;
      num2 = Math.floor(Math.random() * 5) + 1;
      operation = Math.random() > 0.5 ? '+' : '-';
      
      if (operation === '-' && num2 > num1) {
        [num1, num2] = [num2, num1]; // Ensure positive result
      }
    } else {
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
      
      if (operation === '-' && num2 > num1) {
        [num1, num2] = [num2, num1];
      }
    }
    
    switch (operation) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }
    
    const problem = { num1, num2, operation, answer };
    setMathProblem(problem);
    setCurrentMode('math');
    
    const operationWord = operation === '+' ? 'plus' : operation === '-' ? 'minus' : 'times';
    speak(`What is ${num1} ${operationWord} ${num2}?`);
  };

  // Check math answer
  const checkMathAnswer = (userAnswer) => {
    if (parseInt(userAnswer) === mathProblem.answer) {
      setScore(s => s + 15);
      updateStats('score', 15);
      updateStats('math');
      updateStats('game');
      showFeedback(`🎉 Correct! ${mathProblem.num1} ${mathProblem.operation} ${mathProblem.num2} = ${mathProblem.answer}`);
      setTimeout(() => setCurrentMode('menu'), 3000);
    } else {
      showFeedback(`Try again! Think about it...`, false);
    }
  };

  // Manual spelling input (fallback for no voice)
  const handleManualSpelling = () => {
    const answer = prompt(`Spell the word: ${currentWord}`);
    if (answer && answer.toUpperCase() === currentWord) {
      setScore(s => s + 10);
      updateStats('score', 10);
      updateStats('word');
      updateStats('game');
      showFeedback(`🌟 Great job! You spelled ${currentWord}!`);
      setTimeout(() => setCurrentMode('menu'), 3000);
    } else {
      showFeedback(`Try again! The word is ${currentWord}`, false);
    }
  };

  // Handle space race score
  const handleSpaceRaceScore = (raceScore) => {
    setScore(s => s + raceScore);
    updateStats('score', raceScore);
    updateStats('spaceRace', raceScore);
    updateStats('game');
    showFeedback(`🚀 Great flying! You earned ${raceScore} points!`);
  };

  // Show Space Race game
  if (showSpaceRace) {
    return (
      <SpaceRace 
        onExit={() => setShowSpaceRace(false)}
        onScore={handleSpaceRaceScore}
      />
    );
  }

  // Show Parent Dashboard
  if (showDashboard) {
    return <ParentDashboard onClose={() => setShowDashboard(false)} />;
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      
      {/* UI Overlay - Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        pointerEvents: 'none'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          🌟 Gwen's Galaxy Pro
        </h1>
        <div style={{ marginTop: '10px', fontSize: '1.2rem' }}>
          Score: {score} ⭐ | Voice: {voiceReady ? '✅ Ready' : '❌ Use Buttons'}
        </div>
        <button
          onClick={() => setShowDashboard(true)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            cursor: 'pointer',
            pointerEvents: 'all'
          }}
        >
          📊 Parent Dashboard
        </button>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '30px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderRadius: '20px',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 0 30px rgba(100, 200, 255, 0.5)',
          zIndex: 1000
        }}>
          {feedback}
        </div>
      )}

      {/* Game Content */}
      {currentMode === 'menu' && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '30px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7))',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center'
        }}>
          <div style={{ color: 'white', fontSize: '20px', marginBottom: '10px' }}>
            Choose Your Adventure!
          </div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => startSpelling('easy')}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔤 Easy Spelling
            </button>
            
            <button 
              onClick={() => startSpelling('medium')}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔤 Hard Spelling
            </button>
            
            <button 
              onClick={() => startMath('easy')}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              ➕ Easy Math
            </button>

            <button 
              onClick={() => startMath('hard')}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                background: 'linear-gradient(135deg, #fa709a, #fee140)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(250, 112, 154, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              ✖️ Hard Math
            </button>

            <button 
              onClick={() => setShowSpaceRace(true)}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
                color: '#333',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(168, 237, 234, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🚀 Space Race
            </button>
          </div>
        </div>
      )}

      {/* Spelling Mode */}
      {currentMode === 'spelling' && (
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '30px',
          background: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'white', fontSize: '28px' }}>
            Spell: {currentWord}
          </h2>
          <div style={{ fontSize: '40px', margin: '20px 0' }}>
            {currentWord.split('').map((letter, i) => (
              <span key={i} style={{ 
                margin: '0 8px', 
                padding: '10px 15px',
                borderRadius: '10px',
                background: i < lettersFound.length ? 'linear-gradient(135deg, #4facfe, #00f2fe)' : 'rgba(255,255,255,0.1)',
                color: i < lettersFound.length ? 'white' : '#4facfe',
                fontSize: '36px',
                fontWeight: 'bold',
                display: 'inline-block',
                minWidth: '50px',
                transform: i < lettersFound.length ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s ease',
                boxShadow: i < lettersFound.length ? '0 4px 15px rgba(79, 172, 254, 0.6)' : 'none'
              }}>
                {letter}
              </span>
            ))}
          </div>
          
          {/* Progress indicator */}
          <div style={{ color: '#aaa', fontSize: '18px', margin: '15px 0' }}>
            {lettersFound.length > 0 && (
              <div style={{ color: '#4facfe' }}>
                ✅ You've said: {lettersFound.join(' ')}
              </div>
            )}
            {lettersFound.length < targetLetters.length && isListening && (
              <div style={{ color: '#ffa500', marginTop: '10px' }}>
                🎤 Say the letter: {targetLetters[lettersFound.length]}
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {voiceReady && !isListening && (
              <button 
                onClick={() => listenForSpelling(currentWord)}
                style={{
                  padding: '15px 30px',
                  fontSize: '18px',
                  background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                🎤 Try Again
              </button>
            )}
            {!voiceReady && (
              <button 
                onClick={handleManualSpelling}
                style={{
                  padding: '15px 30px',
                  fontSize: '18px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Type Answer
              </button>
            )}
            <button 
              onClick={() => {
                setCurrentMode('menu');
                setLettersFound([]);
                setTargetLetters([]);
                if (recognitionRef.current && isListening) {
                  recognitionRef.current.stop();
                }
              }}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                background: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Microphone Status - Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '10px',
        fontSize: '14px',
        border: isListening ? '2px solid #4facfe' : '1px solid rgba(255, 255, 255, 0.2)',
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
          🎤 Microphone Status
        </div>
        <div style={{ fontSize: '12px' }}>
          Device: {selectedMic}
        </div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          Status: {isListening ? '🔴 Listening...' : voiceReady ? '✅ Ready' : '❌ Not Available'}
        </div>
        {isListening && (
          <button
            onClick={stopListening}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              fontSize: '12px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Stop Listening
          </button>
        )}
      </div>

      {/* Math Mode */}
      {currentMode === 'math' && mathProblem && (
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '30px',
          background: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'white', fontSize: '36px' }}>
            {mathProblem.num1} {mathProblem.operation} {mathProblem.num2} = ?
          </h2>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {[...Array(4)].map((_, i) => {
              const options = [
                mathProblem.answer,
                mathProblem.answer + Math.floor(Math.random() * 3) + 1,
                Math.max(0, mathProblem.answer - Math.floor(Math.random() * 3) - 1),
                mathProblem.answer + Math.floor(Math.random() * 5) - 2
              ].sort(() => Math.random() - 0.5);
              
              return options.map((option, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => checkMathAnswer(option)}
                  style={{
                    padding: '20px 30px',
                    fontSize: '24px',
                    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    minWidth: '80px'
                  }}
                >
                  {option}
                </button>
              ));
            }).slice(0, 4)}
          </div>
          <button 
            onClick={() => setCurrentMode('menu')}
            style={{
              marginTop: '20px',
              padding: '15px 30px',
              fontSize: '18px',
              background: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
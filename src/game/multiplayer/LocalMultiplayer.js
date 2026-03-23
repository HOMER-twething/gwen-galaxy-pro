import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Button, Control } from '@babylonjs/gui';

export class LocalMultiplayer {
  constructor(scene, engine, onComplete) {
    this.scene = scene;
    this.engine = engine;
    this.onComplete = onComplete;
    this.gui = null;
    
    this.players = [
      { id: 1, name: 'Player 1', score: 0, position: { x: -5, y: 0 }, color: new BABYLON.Color3(1, 0, 0), ship: null },
      { id: 2, name: 'Player 2', score: 0, position: { x: 5, y: 0 }, color: new BABYLON.Color3(0, 0, 1), ship: null }
    ];
    
    this.raceMode = 'spelling'; // spelling, math, or mixed
    this.currentChallenge = null;
    this.gameActive = false;
    this.winner = null;
    this.timeLimit = 120;
    this.timeRemaining = 120;
    
    this.splitScreenCameras = [];
  }

  async init() {
    this.setupSplitScreen();
    this.createRaceTrack();
    this.createPlayerShips();
    this.createGUI();
    this.startRace();
  }

  setupSplitScreen() {
    // Clear existing cameras
    while (this.scene.activeCameras.length > 0) {
      this.scene.activeCameras.pop();
    }
    
    // Player 1 camera (left side)
    const camera1 = new BABYLON.UniversalCamera('camera1', new BABYLON.Vector3(-5, 5, -10), this.scene);
    camera1.setTarget(new BABYLON.Vector3(-5, 0, 0));
    camera1.viewport = new BABYLON.Viewport(0, 0, 0.5, 1);
    
    // Player 2 camera (right side)
    const camera2 = new BABYLON.UniversalCamera('camera2', new BABYLON.Vector3(5, 5, -10), this.scene);
    camera2.setTarget(new BABYLON.Vector3(5, 0, 0));
    camera2.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1);
    
    this.splitScreenCameras = [camera1, camera2];
    this.scene.activeCameras = this.splitScreenCameras;
  }

  createRaceTrack() {
    // Create race track/path
    const trackLength = 50;
    const trackWidth = 12;
    
    // Track ground
    const track = BABYLON.MeshBuilder.CreateGround('track', {
      width: trackWidth,
      height: trackLength
    }, this.scene);
    track.position.z = trackLength / 2;
    
    const trackMat = new BABYLON.StandardMaterial('trackMat', this.scene);
    trackMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    trackMat.specularColor = new BABYLON.Color3(0, 0, 0);
    track.material = trackMat;
    
    // Lane divider
    const divider = BABYLON.MeshBuilder.CreateBox('divider', {
      width: 0.2,
      height: 0.5,
      depth: trackLength
    }, this.scene);
    divider.position.z = trackLength / 2;
    divider.position.y = 0.25;
    
    const dividerMat = new BABYLON.StandardMaterial('dividerMat', this.scene);
    dividerMat.emissiveColor = new BABYLON.Color3(1, 1, 0);
    divider.material = dividerMat;
    
    // Checkpoints
    this.checkpoints = [];
    for (let i = 1; i <= 5; i++) {
      const checkpoint = BABYLON.MeshBuilder.CreateTorus('checkpoint', {
        diameter: trackWidth,
        thickness: 0.5,
        tessellation: 16
      }, this.scene);
      
      checkpoint.position.z = (trackLength / 5) * i;
      checkpoint.rotation.x = Math.PI / 2;
      
      const checkpointMat = new BABYLON.StandardMaterial(`checkpointMat${i}`, this.scene);
      checkpointMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
      checkpointMat.alpha = 0.3;
      checkpoint.material = checkpointMat;
      
      this.checkpoints.push({ mesh: checkpoint, reached: [false, false] });
    }
    
    // Finish line
    const finishLine = BABYLON.MeshBuilder.CreateBox('finishLine', {
      width: trackWidth,
      height: 5,
      depth: 0.2
    }, this.scene);
    finishLine.position.z = trackLength;
    finishLine.position.y = 2.5;
    
    const finishMat = new BABYLON.StandardMaterial('finishMat', this.scene);
    finishMat.emissiveColor = new BABYLON.Color3(1, 0, 1);
    finishMat.alpha = 0.5;
    finishLine.material = finishMat;
    
    this.finishLine = finishLine;
  }

  createPlayerShips() {
    this.players.forEach((player, index) => {
      // Create ship
      const ship = BABYLON.MeshBuilder.CreateBox(`ship${player.id}`, { size: 1 }, this.scene);
      ship.position.x = player.position.x;
      ship.position.y = 0.5;
      ship.position.z = 0;
      
      const shipMat = new BABYLON.StandardMaterial(`shipMat${player.id}`, this.scene);
      shipMat.diffuseColor = player.color;
      shipMat.emissiveColor = player.color.scale(0.5);
      ship.material = shipMat;
      
      player.ship = ship;
      
      // Add player label
      const label = BABYLON.MeshBuilder.CreatePlane(`label${player.id}`, { size: 2 }, this.scene);
      label.parent = ship;
      label.position.y = 1.5;
      label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      
      const advancedTexture = AdvancedDynamicTexture.CreateForMesh(label);
      const text = new TextBlock();
      text.text = player.name;
      text.color = 'white';
      text.fontSize = 40;
      text.fontWeight = 'bold';
      advancedTexture.addControl(text);
      
      // Engine particles
      const particleSystem = new BABYLON.ParticleSystem(`particles${player.id}`, 50, this.scene);
      particleSystem.particleTexture = new BABYLON.Texture('/textures/flare.png', this.scene);
      particleSystem.emitter = ship;
      particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.5);
      particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, -0.2, -0.5);
      particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
      particleSystem.color2 = new BABYLON.Color4(1, 0, 0, 1);
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.3;
      particleSystem.minLifeTime = 0.1;
      particleSystem.maxLifeTime = 0.3;
      particleSystem.emitRate = 20;
      particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
      particleSystem.gravity = new BABYLON.Vector3(0, 0, -5);
      particleSystem.minEmitPower = 1;
      particleSystem.maxEmitPower = 2;
      particleSystem.start();
      
      player.particles = particleSystem;
    });
  }

  createGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Player 1 HUD (left side)
    const p1Panel = new Rectangle();
    p1Panel.width = '200px';
    p1Panel.height = '100px';
    p1Panel.cornerRadius = 10;
    p1Panel.color = 'red';
    p1Panel.thickness = 2;
    p1Panel.background = 'rgba(0,0,0,0.7)';
    p1Panel.left = '-35%';
    p1Panel.top = '-40%';
    p1Panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    p1Panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(p1Panel);
    
    const p1Score = new TextBlock();
    p1Score.text = `Player 1\nScore: 0`;
    p1Score.color = 'white';
    p1Score.fontSize = 20;
    p1Panel.addControl(p1Score);
    this.p1Score = p1Score;
    
    // Player 2 HUD (right side)
    const p2Panel = new Rectangle();
    p2Panel.width = '200px';
    p2Panel.height = '100px';
    p2Panel.cornerRadius = 10;
    p2Panel.color = 'blue';
    p2Panel.thickness = 2;
    p2Panel.background = 'rgba(0,0,0,0.7)';
    p2Panel.left = '35%';
    p2Panel.top = '-40%';
    p2Panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    p2Panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(p2Panel);
    
    const p2Score = new TextBlock();
    p2Score.text = `Player 2\nScore: 0`;
    p2Score.color = 'white';
    p2Score.fontSize = 20;
    p2Panel.addControl(p2Score);
    this.p2Score = p2Score;
    
    // Center divider line
    const dividerLine = new Rectangle();
    dividerLine.width = '2px';
    dividerLine.height = '100%';
    dividerLine.color = 'white';
    dividerLine.thickness = 0;
    dividerLine.background = 'white';
    this.gui.addControl(dividerLine);
    
    // Challenge display (center top)
    const challengePanel = new Rectangle();
    challengePanel.width = '400px';
    challengePanel.height = '80px';
    challengePanel.cornerRadius = 10;
    challengePanel.color = 'yellow';
    challengePanel.thickness = 2;
    challengePanel.background = 'rgba(0,0,0,0.8)';
    challengePanel.top = '-45%';
    challengePanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(challengePanel);
    
    const challengeText = new TextBlock();
    challengeText.text = 'Get Ready!';
    challengeText.color = 'yellow';
    challengeText.fontSize = 24;
    challengePanel.addControl(challengeText);
    this.challengeText = challengeText;
    
    // Time display
    const timeText = new TextBlock();
    timeText.text = `Time: ${this.timeRemaining}`;
    timeText.color = 'white';
    timeText.fontSize = 20;
    timeText.top = '-35%';
    timeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(timeText);
    this.timeText = timeText;
    
    // Player 1 answer area (left bottom)
    const p1AnswerPanel = new Rectangle();
    p1AnswerPanel.width = '250px';
    p1AnswerPanel.height = '60px';
    p1AnswerPanel.cornerRadius = 10;
    p1AnswerPanel.color = 'red';
    p1AnswerPanel.thickness = 2;
    p1AnswerPanel.background = 'rgba(0,0,0,0.7)';
    p1AnswerPanel.left = '-25%';
    p1AnswerPanel.top = '40%';
    p1AnswerPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    p1AnswerPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(p1AnswerPanel);
    
    const p1Answer = new TextBlock();
    p1Answer.text = 'Press A/B/C/D';
    p1Answer.color = 'white';
    p1Answer.fontSize = 18;
    p1AnswerPanel.addControl(p1Answer);
    this.p1Answer = p1Answer;
    
    // Player 2 answer area (right bottom)
    const p2AnswerPanel = new Rectangle();
    p2AnswerPanel.width = '250px';
    p2AnswerPanel.height = '60px';
    p2AnswerPanel.cornerRadius = 10;
    p2AnswerPanel.color = 'blue';
    p2AnswerPanel.thickness = 2;
    p2AnswerPanel.background = 'rgba(0,0,0,0.7)';
    p2AnswerPanel.left = '25%';
    p2AnswerPanel.top = '40%';
    p2AnswerPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    p2AnswerPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(p2AnswerPanel);
    
    const p2Answer = new TextBlock();
    p2Answer.text = 'Press ←↑→↓';
    p2Answer.color = 'white';
    p2Answer.fontSize = 18;
    p2AnswerPanel.addControl(p2Answer);
    this.p2Answer = p2Answer;
  }

  setupControls() {
    // Keyboard controls for both players
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);
    
    // Player 1 controls (WASD or ABCD for answers)
    const p1Keys = {
      'a': () => this.handleAnswer(1, 'A'),
      'b': () => this.handleAnswer(1, 'B'),
      'c': () => this.handleAnswer(1, 'C'),
      'd': () => this.handleAnswer(1, 'D'),
      '1': () => this.handleAnswer(1, '1'),
      '2': () => this.handleAnswer(1, '2'),
      '3': () => this.handleAnswer(1, '3'),
      '4': () => this.handleAnswer(1, '4')
    };
    
    // Player 2 controls (Arrow keys or numpad)
    const p2Keys = {
      'ArrowLeft': () => this.handleAnswer(2, 'A'),
      'ArrowUp': () => this.handleAnswer(2, 'B'),
      'ArrowRight': () => this.handleAnswer(2, 'C'),
      'ArrowDown': () => this.handleAnswer(2, 'D'),
      '7': () => this.handleAnswer(2, '1'),
      '8': () => this.handleAnswer(2, '2'),
      '9': () => this.handleAnswer(2, '3'),
      '0': () => this.handleAnswer(2, '4')
    };
    
    document.addEventListener('keydown', (event) => {
      if (!this.gameActive) return;
      
      const key = event.key.toLowerCase();
      if (p1Keys[key]) p1Keys[key]();
      if (p2Keys[event.key]) p2Keys[event.key]();
    });
  }

  generateChallenge() {
    const challenges = [];
    
    if (this.raceMode === 'spelling' || this.raceMode === 'mixed') {
      const words = ['STAR', 'MOON', 'SPACE', 'ROCKET', 'PLANET'];
      const word = words[Math.floor(Math.random() * words.length)];
      const missingIndex = Math.floor(Math.random() * word.length);
      const missing = word[missingIndex];
      const display = word.split('');
      display[missingIndex] = '_';
      
      challenges.push({
        type: 'spelling',
        question: `Fill in: ${display.join('')}`,
        options: this.generateOptions(missing, ['A', 'E', 'I', 'O', 'U', 'R', 'S', 'T']),
        answer: missing
      });
    }
    
    if (this.raceMode === 'math' || this.raceMode === 'mixed') {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const answer = a + b;
      
      challenges.push({
        type: 'math',
        question: `${a} + ${b} = ?`,
        options: this.generateOptions(answer.toString(), 
          Array.from({length: 20}, (_, i) => (i + 1).toString())),
        answer: answer.toString()
      });
    }
    
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  generateOptions(correct, pool) {
    const options = [correct];
    const filtered = pool.filter(p => p !== correct);
    
    while (options.length < 4 && filtered.length > 0) {
      const index = Math.floor(Math.random() * filtered.length);
      options.push(filtered[index]);
      filtered.splice(index, 1);
    }
    
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
  }

  showChallenge() {
    this.currentChallenge = this.generateChallenge();
    
    this.challengeText.text = this.currentChallenge.question;
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    const optionDisplay = this.currentChallenge.options.map((opt, i) => 
      `${optionLetters[i]}: ${opt}`
    ).join('  ');
    
    this.p1Answer.text = `P1: ${optionDisplay}`;
    this.p2Answer.text = `P2: ←↑→↓ = ABCD`;
  }

  handleAnswer(playerId, answer) {
    if (!this.currentChallenge || !this.gameActive) return;
    
    const player = this.players[playerId - 1];
    const optionIndex = ['A', 'B', 'C', 'D'].indexOf(answer);
    
    if (optionIndex === -1) return;
    
    const selectedAnswer = this.currentChallenge.options[optionIndex];
    const correct = selectedAnswer === this.currentChallenge.answer;
    
    if (correct) {
      player.score += 100;
      this.movePlayerForward(player);
      this.showCorrectFeedback(playerId);
    } else {
      this.showIncorrectFeedback(playerId);
    }
    
    this.updateScores();
    
    // Generate new challenge after brief delay
    setTimeout(() => {
      this.showChallenge();
    }, 1000);
  }

  movePlayerForward(player) {
    const moveDistance = 10; // Move 10 units forward
    const targetZ = player.ship.position.z + moveDistance;
    
    // Animate movement
    const animationFrames = 30;
    const step = moveDistance / animationFrames;
    let frame = 0;
    
    const moveAnimation = setInterval(() => {
      if (frame < animationFrames) {
        player.ship.position.z += step;
        frame++;
        
        // Update camera to follow
        const camera = this.splitScreenCameras[player.id - 1];
        camera.position.z += step;
        
        // Check checkpoint crossing
        this.checkCheckpoints(player);
        
        // Check finish line
        if (player.ship.position.z >= this.finishLine.position.z && !this.winner) {
          this.winner = player;
          this.endRace();
        }
      } else {
        clearInterval(moveAnimation);
      }
    }, 20);
  }

  checkCheckpoints(player) {
    this.checkpoints.forEach((checkpoint, index) => {
      if (!checkpoint.reached[player.id - 1] && 
          player.ship.position.z >= checkpoint.mesh.position.z) {
        checkpoint.reached[player.id - 1] = true;
        
        // Visual feedback
        this.createCheckpointEffect(checkpoint.mesh.position, player.color);
        
        // Bonus points
        player.score += 50;
      }
    });
  }

  createCheckpointEffect(position, color) {
    const particleSystem = new BABYLON.ParticleSystem('checkpoint', 100, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture('/textures/flare.png', this.scene);
    particleSystem.emitter = position.clone();
    particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 1, 1, 1);
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.8;
    particleSystem.emitRate = 100;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, 5, 0);
    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 5;
    
    particleSystem.start();
    
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => {
        particleSystem.dispose();
      }, 1000);
    }, 200);
  }

  showCorrectFeedback(playerId) {
    const panel = playerId === 1 ? this.p1Answer.parent : this.p2Answer.parent;
    const originalBg = panel.background;
    panel.background = 'rgba(0,255,0,0.5)';
    
    setTimeout(() => {
      panel.background = originalBg;
    }, 300);
  }

  showIncorrectFeedback(playerId) {
    const panel = playerId === 1 ? this.p1Answer.parent : this.p2Answer.parent;
    const originalBg = panel.background;
    panel.background = 'rgba(255,0,0,0.5)';
    
    setTimeout(() => {
      panel.background = originalBg;
    }, 300);
  }

  updateScores() {
    this.p1Score.text = `Player 1\nScore: ${this.players[0].score}`;
    this.p2Score.text = `Player 2\nScore: ${this.players[1].score}`;
  }

  startRace() {
    this.gameActive = true;
    this.setupControls();
    
    // Countdown
    let countdown = 3;
    this.challengeText.text = `Starting in ${countdown}...`;
    
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.challengeText.text = `Starting in ${countdown}...`;
      } else {
        this.challengeText.text = 'GO!';
        clearInterval(countdownInterval);
        
        setTimeout(() => {
          this.showChallenge();
        }, 500);
      }
    }, 1000);
    
    // Game timer
    const timerInterval = setInterval(() => {
      if (this.gameActive) {
        this.timeRemaining--;
        this.timeText.text = `Time: ${this.timeRemaining}`;
        
        if (this.timeRemaining <= 0) {
          clearInterval(timerInterval);
          this.endRace();
        }
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  endRace() {
    this.gameActive = false;
    
    // Determine winner if not already set
    if (!this.winner) {
      this.winner = this.players[0].score > this.players[1].score ? 
        this.players[0] : this.players[1];
      
      if (this.players[0].score === this.players[1].score) {
        this.winner = null; // Tie
      }
    }
    
    // Show results
    const resultPanel = new Rectangle();
    resultPanel.width = '500px';
    resultPanel.height = '300px';
    resultPanel.cornerRadius = 20;
    resultPanel.color = 'gold';
    resultPanel.thickness = 3;
    resultPanel.background = 'rgba(0,0,0,0.9)';
    this.gui.addControl(resultPanel);
    
    const resultText = new TextBlock();
    if (this.winner) {
      resultText.text = `🏆 ${this.winner.name} WINS! 🏆\n\n` +
        `Player 1: ${this.players[0].score} points\n` +
        `Player 2: ${this.players[1].score} points`;
    } else {
      resultText.text = `🤝 IT'S A TIE! 🤝\n\n` +
        `Both players: ${this.players[0].score} points`;
    }
    resultText.color = 'white';
    resultText.fontSize = 24;
    resultText.textWrapping = true;
    resultPanel.addControl(resultText);
    
    // Play Again button
    const playAgainBtn = Button.CreateSimpleButton('playAgain', 'Play Again');
    playAgainBtn.width = '150px';
    playAgainBtn.height = '40px';
    playAgainBtn.color = 'white';
    playAgainBtn.background = 'green';
    playAgainBtn.top = '80px';
    playAgainBtn.onPointerClickObservable.add(() => {
      this.resetRace();
    });
    resultPanel.addControl(playAgainBtn);
    
    // Main Menu button
    const menuBtn = Button.CreateSimpleButton('menu', 'Main Menu');
    menuBtn.width = '150px';
    menuBtn.height = '40px';
    menuBtn.color = 'white';
    menuBtn.background = 'blue';
    menuBtn.top = '130px';
    menuBtn.onPointerClickObservable.add(() => {
      if (this.onComplete) {
        this.onComplete({
          winner: this.winner ? this.winner.name : 'Tie',
          scores: this.players.map(p => ({ name: p.name, score: p.score }))
        });
      }
    });
    resultPanel.addControl(menuBtn);
  }

  resetRace() {
    // Reset player positions and scores
    this.players.forEach(player => {
      player.score = 0;
      player.ship.position.z = 0;
    });
    
    // Reset checkpoints
    this.checkpoints.forEach(checkpoint => {
      checkpoint.reached = [false, false];
    });
    
    // Reset cameras
    this.splitScreenCameras[0].position.z = -10;
    this.splitScreenCameras[1].position.z = -10;
    
    // Reset game state
    this.winner = null;
    this.timeRemaining = this.timeLimit;
    
    // Clear GUI and recreate
    this.gui.dispose();
    this.createGUI();
    
    // Start new race
    this.startRace();
  }

  dispose() {
    this.gameActive = false;
    
    if (this.gui) {
      this.gui.dispose();
    }
    
    this.players.forEach(player => {
      if (player.ship) player.ship.dispose();
      if (player.particles) player.particles.dispose();
    });
    
    this.checkpoints.forEach(checkpoint => {
      if (checkpoint.mesh) checkpoint.mesh.dispose();
    });
    
    if (this.finishLine) this.finishLine.dispose();
    
    // Reset to single camera
    this.scene.activeCameras = [];
  }
}
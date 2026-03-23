import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Button, Control } from '@babylonjs/gui';

export class SpaceRace {
  constructor(scene, engine, onComplete) {
    this.scene = scene;
    this.engine = engine;
    this.onComplete = onComplete;
    this.gui = null;
    this.ship = null;
    this.obstacles = [];
    this.letters = [];
    this.targetWord = '';
    this.collectedLetters = '';
    this.timeLimit = 60;
    this.timeRemaining = 60;
    this.score = 0;
    this.voiceCommands = ['up', 'down', 'left', 'right', 'boost'];
    this.shipPosition = { x: 0, y: 0, z: 0 };
    this.gameActive = false;
    this.velocity = { x: 0, y: 0 };
    this.recognition = null;
  }

  async init() {
    this.createShip();
    this.createGUI();
    this.setupVoiceControl();
    this.selectTargetWord();
    this.startGame();
  }

  createShip() {
    // Create player ship
    this.ship = BABYLON.MeshBuilder.CreateBox('ship', { size: 1 }, this.scene);
    this.ship.position = new BABYLON.Vector3(0, 0, 0);
    
    const shipMat = new BABYLON.StandardMaterial('shipMat', this.scene);
    shipMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
    shipMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.5);
    this.ship.material = shipMat;

    // Add ship trail effect
    const trail = new BABYLON.TrailMesh('trail', this.ship, this.scene, 0.5, 30, true);
    const trailMat = new BABYLON.StandardMaterial('trailMat', this.scene);
    trailMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.8);
    trailMat.alpha = 0.5;
    trail.material = trailMat;
  }

  createGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Time display
    const timeText = new TextBlock();
    timeText.text = `Time: ${this.timeRemaining}s`;
    timeText.color = 'white';
    timeText.fontSize = 24;
    timeText.top = '-45%';
    timeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(timeText);
    this.timeText = timeText;

    // Target word display
    const targetText = new TextBlock();
    targetText.text = `Spell: ${this.targetWord}`;
    targetText.color = 'yellow';
    targetText.fontSize = 30;
    targetText.top = '-40%';
    targetText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(targetText);
    this.targetText = targetText;

    // Collected letters display
    const collectedText = new TextBlock();
    collectedText.text = `Collected: ${this.collectedLetters}`;
    collectedText.color = 'lime';
    collectedText.fontSize = 26;
    collectedText.top = '-35%';
    collectedText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(collectedText);
    this.collectedText = collectedText;

    // Voice command indicator
    const voiceIndicator = new Rectangle();
    voiceIndicator.width = '200px';
    voiceIndicator.height = '40px';
    voiceIndicator.cornerRadius = 20;
    voiceIndicator.color = 'white';
    voiceIndicator.thickness = 2;
    voiceIndicator.background = 'rgba(0,0,0,0.5)';
    voiceIndicator.top = '40%';
    voiceIndicator.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
    const voiceText = new TextBlock();
    voiceText.text = 'Say: Up, Down, Left, Right';
    voiceText.color = 'white';
    voiceText.fontSize = 16;
    voiceIndicator.addControl(voiceText);
    this.gui.addControl(voiceIndicator);
    this.voiceIndicator = voiceIndicator;
    this.voiceText = voiceText;
  }

  setupVoiceControl() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase().trim();
        this.handleVoiceCommand(command);
      };

      this.recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        // Restart recognition on error
        if (this.gameActive) {
          setTimeout(() => {
            this.recognition.start();
          }, 1000);
        }
      };

      this.recognition.start();
    }
  }

  handleVoiceCommand(command) {
    if (!this.gameActive) return;

    // Visual feedback for command recognition
    this.voiceIndicator.background = 'rgba(0,255,0,0.3)';
    this.voiceText.text = `Heard: ${command}`;
    
    setTimeout(() => {
      this.voiceIndicator.background = 'rgba(0,0,0,0.5)';
      this.voiceText.text = 'Say: Up, Down, Left, Right';
    }, 500);

    // Apply movement based on command
    if (command.includes('up')) {
      this.velocity.y = 0.3;
    } else if (command.includes('down')) {
      this.velocity.y = -0.3;
    } else if (command.includes('left')) {
      this.velocity.x = -0.3;
    } else if (command.includes('right')) {
      this.velocity.x = 0.3;
    } else if (command.includes('stop')) {
      this.velocity.x = 0;
      this.velocity.y = 0;
    } else if (command.includes('boost')) {
      this.velocity.x *= 1.5;
      this.velocity.y *= 1.5;
    }
  }

  selectTargetWord() {
    const words = ['STAR', 'MOON', 'PLANET', 'ROCKET', 'SPACE', 'ORBIT', 'COMET', 'GALAXY'];
    this.targetWord = words[Math.floor(Math.random() * words.length)];
    this.targetText.text = `Spell: ${this.targetWord}`;
  }

  createLetter(letter, position) {
    const letterMesh = BABYLON.MeshBuilder.CreateBox(`letter_${letter}`, { size: 0.8 }, this.scene);
    letterMesh.position = position;
    
    const letterMat = new BABYLON.StandardMaterial(`letterMat_${letter}`, this.scene);
    letterMat.diffuseColor = new BABYLON.Color3(1, 1, 0);
    letterMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
    letterMesh.material = letterMat;

    // Add letter text
    const plane = BABYLON.MeshBuilder.CreatePlane(`letterPlane_${letter}`, { size: 0.6 }, this.scene);
    plane.position = position.clone();
    plane.position.z -= 0.5;
    plane.parent = letterMesh;

    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
    const text = new TextBlock();
    text.text = letter;
    text.color = 'black';
    text.fontSize = 200;
    text.fontWeight = 'bold';
    advancedTexture.addControl(text);

    this.letters.push({ mesh: letterMesh, letter: letter, collected: false });
    
    // Add floating animation
    this.scene.registerBeforeRender(() => {
      if (!letterMesh.isDisposed()) {
        letterMesh.position.y = position.y + Math.sin(Date.now() * 0.001) * 0.2;
        letterMesh.rotation.y += 0.02;
      }
    });
  }

  createObstacle(position) {
    const obstacle = BABYLON.MeshBuilder.CreateSphere('obstacle', { diameter: 1.5 }, this.scene);
    obstacle.position = position;
    
    const obstacleMat = new BABYLON.StandardMaterial('obstacleMat', this.scene);
    obstacleMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
    obstacleMat.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
    obstacle.material = obstacleMat;

    this.obstacles.push(obstacle);
    
    // Add rotation animation
    this.scene.registerBeforeRender(() => {
      if (!obstacle.isDisposed()) {
        obstacle.rotation.x += 0.01;
        obstacle.rotation.y += 0.01;
      }
    });
  }

  startGame() {
    this.gameActive = true;
    this.timeRemaining = this.timeLimit;
    this.collectedLetters = '';
    this.score = 0;

    // Create letters for the target word
    const letterPositions = this.generateLetterPath();
    for (let i = 0; i < this.targetWord.length; i++) {
      this.createLetter(this.targetWord[i], letterPositions[i]);
    }

    // Create obstacles
    for (let i = 0; i < 10; i++) {
      const position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        Math.random() * 30 + 5
      );
      this.createObstacle(position);
    }

    // Start game timer
    const timerInterval = setInterval(() => {
      if (this.gameActive) {
        this.timeRemaining--;
        this.timeText.text = `Time: ${this.timeRemaining}s`;

        if (this.timeRemaining <= 0) {
          clearInterval(timerInterval);
          this.endGame(false);
        }
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);

    // Game loop
    this.scene.registerBeforeRender(() => {
      if (!this.gameActive) return;

      // Update ship position
      this.ship.position.x += this.velocity.x;
      this.ship.position.y += this.velocity.y;

      // Apply friction
      this.velocity.x *= 0.95;
      this.velocity.y *= 0.95;

      // Keep ship in bounds
      this.ship.position.x = Math.max(-10, Math.min(10, this.ship.position.x));
      this.ship.position.y = Math.max(-7, Math.min(7, this.ship.position.y));

      // Move camera with ship
      this.scene.activeCamera.position.x = this.ship.position.x;
      this.scene.activeCamera.position.y = this.ship.position.y + 2;

      // Check letter collection
      this.checkLetterCollection();

      // Check obstacle collision
      this.checkObstacleCollision();

      // Move obstacles and letters towards player
      this.moveWorldObjects();
    });
  }

  generateLetterPath() {
    const positions = [];
    const spacing = 5;
    
    for (let i = 0; i < this.targetWord.length; i++) {
      positions.push(new BABYLON.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (i + 1) * spacing + 10
      ));
    }
    
    return positions;
  }

  checkLetterCollection() {
    const nextLetterIndex = this.collectedLetters.length;
    if (nextLetterIndex >= this.targetWord.length) return;

    this.letters.forEach((letterObj) => {
      if (!letterObj.collected && letterObj.letter === this.targetWord[nextLetterIndex]) {
        const distance = BABYLON.Vector3.Distance(this.ship.position, letterObj.mesh.position);
        
        if (distance < 1.5) {
          // Collect the letter
          letterObj.collected = true;
          this.collectedLetters += letterObj.letter;
          this.collectedText.text = `Collected: ${this.collectedLetters}`;
          
          // Play collection effect
          this.playCollectionEffect(letterObj.mesh.position);
          
          // Remove letter
          letterObj.mesh.dispose();
          
          // Check if word is complete
          if (this.collectedLetters === this.targetWord) {
            this.endGame(true);
          }

          // Add score
          this.score += 100;
        }
      }
    });
  }

  checkObstacleCollision() {
    this.obstacles.forEach((obstacle) => {
      const distance = BABYLON.Vector3.Distance(this.ship.position, obstacle.position);
      
      if (distance < 1.2) {
        // Hit obstacle - shake effect
        this.scene.activeCamera.position.x += (Math.random() - 0.5) * 0.5;
        this.scene.activeCamera.position.y += (Math.random() - 0.5) * 0.5;
        
        // Reduce time
        this.timeRemaining = Math.max(0, this.timeRemaining - 5);
        this.timeText.text = `Time: ${this.timeRemaining}s`;
        
        // Push ship back
        this.velocity.x = -this.velocity.x * 2;
        this.velocity.y = -this.velocity.y * 2;
        
        // Flash red
        this.ship.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
        setTimeout(() => {
          this.ship.material.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.5);
        }, 200);
      }
    });
  }

  moveWorldObjects() {
    // Move obstacles and letters towards player (creates forward motion illusion)
    [...this.obstacles, ...this.letters.filter(l => !l.collected).map(l => l.mesh)].forEach((obj) => {
      if (obj && !obj.isDisposed()) {
        obj.position.z -= 0.1;
        
        // Respawn objects that go behind player
        if (obj.position.z < -5) {
          obj.position.z = 40;
          obj.position.x = (Math.random() - 0.5) * 20;
          obj.position.y = (Math.random() - 0.5) * 15;
        }
      }
    });
  }

  playCollectionEffect(position) {
    // Create particle system for collection
    const particleSystem = new BABYLON.ParticleSystem('particles', 100, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture('/textures/flare.png', this.scene);
    particleSystem.emitter = position;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
    particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1;
    particleSystem.emitRate = 100;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.01;
    
    particleSystem.start();
    
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => {
        particleSystem.dispose();
      }, 2000);
    }, 200);
  }

  endGame(success) {
    this.gameActive = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }

    // Clear game objects
    this.obstacles.forEach(o => o.dispose());
    this.letters.forEach(l => l.mesh.dispose());

    // Show results
    const resultRect = new Rectangle();
    resultRect.width = '400px';
    resultRect.height = '300px';
    resultRect.cornerRadius = 20;
    resultRect.color = 'white';
    resultRect.thickness = 2;
    resultRect.background = success ? 'rgba(0,255,0,0.8)' : 'rgba(255,0,0,0.8)';
    this.gui.addControl(resultRect);

    const resultText = new TextBlock();
    resultText.text = success ? 
      `🎉 AMAZING! 🎉\nYou spelled ${this.targetWord}!\nScore: ${this.score}` : 
      `Time's Up!\nYou collected: ${this.collectedLetters}\nTry Again!`;
    resultText.color = 'white';
    resultText.fontSize = 30;
    resultText.textWrapping = true;
    resultRect.addControl(resultText);

    // Continue button
    const continueBtn = Button.CreateSimpleButton('continue', 'Continue');
    continueBtn.width = '150px';
    continueBtn.height = '40px';
    continueBtn.color = 'white';
    continueBtn.background = 'blue';
    continueBtn.top = '100px';
    continueBtn.onPointerClickObservable.add(() => {
      if (this.onComplete) {
        this.onComplete({ success, score: this.score });
      }
    });
    resultRect.addControl(continueBtn);
  }

  dispose() {
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.gui) {
      this.gui.dispose();
    }
    this.obstacles.forEach(o => o.dispose());
    this.letters.forEach(l => l.mesh.dispose());
    if (this.ship) {
      this.ship.dispose();
    }
  }
}
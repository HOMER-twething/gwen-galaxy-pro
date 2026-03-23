import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Button, Control, InputText } from '@babylonjs/gui';

export class PlanetDefense {
  constructor(scene, engine, onComplete) {
    this.scene = scene;
    this.engine = engine;
    this.onComplete = onComplete;
    this.gui = null;
    this.planet = null;
    this.asteroids = [];
    this.lasers = [];
    this.score = 0;
    this.lives = 5;
    this.wave = 1;
    this.streak = 0;
    this.powerUps = [];
    this.gameActive = false;
    this.asteroidSpeed = 0.05;
    this.spawnInterval = 3000;
    this.difficulty = 1;
    this.answerInput = null;
    this.currentProblem = null;
    this.recognition = null;
  }

  async init() {
    this.createPlanet();
    this.createGUI();
    this.setupControls();
    this.startGame();
  }

  createPlanet() {
    // Create the planet to defend
    this.planet = BABYLON.MeshBuilder.CreateSphere('planet', { diameter: 3 }, this.scene);
    this.planet.position = new BABYLON.Vector3(0, 0, 0);
    
    const planetMat = new BABYLON.StandardMaterial('planetMat', this.scene);
    planetMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
    planetMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
    planetMat.specularColor = new BABYLON.Color3(0, 0, 0);
    this.planet.material = planetMat;

    // Add atmosphere glow
    const atmosphere = BABYLON.MeshBuilder.CreateSphere('atmosphere', { diameter: 3.5 }, this.scene);
    atmosphere.parent = this.planet;
    
    const atmosphereMat = new BABYLON.StandardMaterial('atmosphereMat', this.scene);
    atmosphereMat.diffuseColor = new BABYLON.Color3(0.5, 0.7, 1);
    atmosphereMat.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.8);
    atmosphereMat.alpha = 0.3;
    atmosphere.material = atmosphereMat;

    // Add defense ring
    const ring = BABYLON.MeshBuilder.CreateTorus('ring', { diameter: 5, thickness: 0.1 }, this.scene);
    ring.parent = this.planet;
    ring.rotation.x = Math.PI / 2;
    
    const ringMat = new BABYLON.StandardMaterial('ringMat', this.scene);
    ringMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
    ring.material = ringMat;

    // Animate planet rotation
    this.scene.registerBeforeRender(() => {
      if (this.planet && !this.planet.isDisposed()) {
        this.planet.rotation.y += 0.001;
      }
    });
  }

  createGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Score and lives display
    const statsPanel = new Rectangle();
    statsPanel.width = '300px';
    statsPanel.height = '100px';
    statsPanel.cornerRadius = 10;
    statsPanel.color = 'white';
    statsPanel.thickness = 2;
    statsPanel.background = 'rgba(0,0,0,0.7)';
    statsPanel.top = '-40%';
    statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(statsPanel);

    const scoreText = new TextBlock();
    scoreText.text = `Score: ${this.score}`;
    scoreText.color = 'yellow';
    scoreText.fontSize = 20;
    scoreText.top = '-20px';
    statsPanel.addControl(scoreText);
    this.scoreText = scoreText;

    const livesText = new TextBlock();
    livesText.text = `Lives: ${'❤️'.repeat(this.lives)}`;
    livesText.color = 'red';
    livesText.fontSize = 20;
    livesText.top = '0px';
    statsPanel.addControl(livesText);
    this.livesText = livesText;

    const waveText = new TextBlock();
    waveText.text = `Wave: ${this.wave}`;
    waveText.color = 'white';
    waveText.fontSize = 20;
    waveText.top = '20px';
    statsPanel.addControl(waveText);
    this.waveText = waveText;

    // Streak indicator
    const streakText = new TextBlock();
    streakText.text = '';
    streakText.color = 'orange';
    streakText.fontSize = 24;
    streakText.top = '30%';
    streakText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(streakText);
    this.streakText = streakText;

    // Answer input
    const answerPanel = new Rectangle();
    answerPanel.width = '250px';
    answerPanel.height = '60px';
    answerPanel.cornerRadius = 10;
    answerPanel.color = 'lime';
    answerPanel.thickness = 2;
    answerPanel.background = 'rgba(0,0,0,0.8)';
    answerPanel.top = '40%';
    answerPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(answerPanel);

    const answerInput = new InputText();
    answerInput.width = '200px';
    answerInput.height = '40px';
    answerInput.color = 'white';
    answerInput.background = 'transparent';
    answerInput.placeholderText = 'Type answer...';
    answerInput.fontSize = 24;
    answerInput.focusedBackground = 'rgba(0,255,0,0.2)';
    answerInput.onTextSubmitObservable.add((text) => {
      this.checkAnswer(text);
      answerInput.text = '';
    });
    answerPanel.addControl(answerInput);
    this.answerInput = answerInput;

    // Voice input button
    const voiceBtn = Button.CreateSimpleButton('voice', '🎤 Voice');
    voiceBtn.width = '100px';
    voiceBtn.height = '40px';
    voiceBtn.color = 'white';
    voiceBtn.background = 'purple';
    voiceBtn.top = '45%';
    voiceBtn.left = '150px';
    voiceBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    voiceBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    voiceBtn.onPointerClickObservable.add(() => {
      this.startVoiceRecognition();
    });
    this.gui.addControl(voiceBtn);
    this.voiceBtn = voiceBtn;
  }

  setupControls() {
    // Setup voice recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const answer = event.results[0][0].transcript.trim();
        // Extract numbers from speech
        const numbers = answer.match(/\d+/);
        if (numbers) {
          this.answerInput.text = numbers[0];
          this.checkAnswer(numbers[0]);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        this.voiceBtn.background = 'purple';
      };

      this.recognition.onend = () => {
        this.voiceBtn.background = 'purple';
      };
    }

    // Keyboard shortcuts
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);
    
    // Number keys for quick answer
    for (let i = 0; i <= 9; i++) {
      this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        (evt) => {
          if (evt.sourceEvent.key === i.toString()) {
            this.answerInput.text += i.toString();
          }
        }
      ));
    }

    // Enter to submit
    this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger,
      (evt) => {
        if (evt.sourceEvent.key === 'Enter' && this.answerInput.text) {
          this.checkAnswer(this.answerInput.text);
          this.answerInput.text = '';
        }
      }
    ));
  }

  startVoiceRecognition() {
    if (this.recognition) {
      this.voiceBtn.background = 'red';
      this.recognition.start();
    }
  }

  generateMathProblem() {
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let a, b, answer;

    switch(operation) {
      case '+':
        a = Math.floor(Math.random() * (10 * this.difficulty)) + 1;
        b = Math.floor(Math.random() * (10 * this.difficulty)) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * (10 * this.difficulty)) + 5;
        b = Math.floor(Math.random() * Math.min(a, 10)) + 1;
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * (5 * Math.min(this.difficulty, 2))) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a * b;
        break;
    }

    return {
      text: `${a} ${operation} ${b}`,
      answer: answer.toString()
    };
  }

  createAsteroid() {
    const problem = this.generateMathProblem();
    
    // Create asteroid mesh
    const asteroid = BABYLON.MeshBuilder.CreateSphere('asteroid', { diameter: 1.5 }, this.scene);
    
    // Random spawn position in a circle around planet
    const angle = Math.random() * Math.PI * 2;
    const distance = 15;
    asteroid.position = new BABYLON.Vector3(
      Math.cos(angle) * distance,
      (Math.random() - 0.5) * 5,
      Math.sin(angle) * distance
    );
    
    // Asteroid material
    const asteroidMat = new BABYLON.StandardMaterial('asteroidMat', this.scene);
    asteroidMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.2);
    asteroidMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.05);
    asteroid.material = asteroidMat;

    // Create text display for problem
    const plane = BABYLON.MeshBuilder.CreatePlane('textPlane', { size: 1.2 }, this.scene);
    plane.parent = asteroid;
    plane.position.z = -0.8;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
    const text = new TextBlock();
    text.text = problem.text;
    text.color = 'white';
    text.fontSize = 40;
    text.fontWeight = 'bold';
    text.outlineWidth = 2;
    text.outlineColor = 'black';
    advancedTexture.addControl(text);

    // Add to asteroids array
    const asteroidObj = {
      mesh: asteroid,
      problem: problem,
      speed: this.asteroidSpeed * (1 + this.wave * 0.1),
      textPlane: plane,
      destroyed: false
    };
    this.asteroids.push(asteroidObj);

    // Animate asteroid
    this.scene.registerBeforeRender(() => {
      if (asteroidObj.destroyed || !asteroid.isDisposed()) {
        // Move towards planet
        const direction = this.planet.position.subtract(asteroid.position).normalize();
        asteroid.position.addInPlace(direction.scale(asteroidObj.speed));
        
        // Rotate asteroid
        asteroid.rotation.x += 0.01;
        asteroid.rotation.y += 0.02;
        
        // Check collision with planet
        const distance = BABYLON.Vector3.Distance(asteroid.position, this.planet.position);
        if (distance < 2 && !asteroidObj.destroyed) {
          this.asteroidHitPlanet(asteroidObj);
        }
      }
    });
  }

  checkAnswer(answer) {
    if (!this.currentProblem || !answer) return;

    const isCorrect = answer.trim() === this.currentProblem.answer;
    
    if (isCorrect) {
      // Find and destroy the asteroid
      const asteroid = this.asteroids.find(a => 
        a.problem.answer === this.currentProblem.answer && !a.destroyed
      );
      
      if (asteroid) {
        this.destroyAsteroid(asteroid, true);
        this.score += 100 * this.difficulty;
        this.streak++;
        
        // Check for power-up
        if (this.streak >= 3) {
          this.activatePowerUp();
        }
        
        this.updateDisplay();
        this.currentProblem = null;
      }
    } else {
      // Wrong answer feedback
      this.streak = 0;
      this.answerInput.background = 'red';
      setTimeout(() => {
        this.answerInput.background = 'transparent';
      }, 300);
    }
  }

  destroyAsteroid(asteroidObj, byPlayer = false) {
    if (asteroidObj.destroyed) return;
    
    asteroidObj.destroyed = true;
    
    if (byPlayer) {
      // Create explosion effect
      this.createExplosion(asteroidObj.mesh.position);
      
      // Create laser visual
      this.createLaserBeam(this.planet.position, asteroidObj.mesh.position);
    }
    
    // Remove asteroid
    setTimeout(() => {
      if (asteroidObj.mesh) asteroidObj.mesh.dispose();
      if (asteroidObj.textPlane) asteroidObj.textPlane.dispose();
      
      const index = this.asteroids.indexOf(asteroidObj);
      if (index > -1) {
        this.asteroids.splice(index, 1);
      }
    }, 100);
  }

  createLaserBeam(start, end) {
    const laser = BABYLON.MeshBuilder.CreateCylinder('laser', {
      height: BABYLON.Vector3.Distance(start, end),
      diameter: 0.1
    }, this.scene);
    
    laser.position = BABYLON.Vector3.Lerp(start, end, 0.5);
    laser.lookAt(end);
    laser.rotation.x += Math.PI / 2;
    
    const laserMat = new BABYLON.StandardMaterial('laserMat', this.scene);
    laserMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
    laser.material = laserMat;
    
    // Fade out laser
    let alpha = 1;
    const fadeInterval = setInterval(() => {
      alpha -= 0.1;
      if (alpha <= 0) {
        laser.dispose();
        clearInterval(fadeInterval);
      } else {
        laserMat.emissiveColor = new BABYLON.Color3(0, alpha, 0);
      }
    }, 20);
  }

  createExplosion(position) {
    const particleSystem = new BABYLON.ParticleSystem('explosion', 50, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture('/textures/flare.png', this.scene);
    particleSystem.emitter = position;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
    particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0, 0, 1);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    particleSystem.minSize = 0.3;
    particleSystem.maxSize = 1;
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.5;
    particleSystem.emitRate = 100;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.01;
    
    particleSystem.start();
    
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => {
        particleSystem.dispose();
      }, 1000);
    }, 100);
  }

  asteroidHitPlanet(asteroidObj) {
    if (asteroidObj.destroyed) return;
    
    asteroidObj.destroyed = true;
    this.lives--;
    this.streak = 0;
    
    // Flash planet red
    this.planet.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
    setTimeout(() => {
      this.planet.material.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
    }, 300);
    
    // Screen shake
    const camera = this.scene.activeCamera;
    const originalPos = camera.position.clone();
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        camera.position.x = originalPos.x + (Math.random() - 0.5) * 0.5;
        camera.position.y = originalPos.y + (Math.random() - 0.5) * 0.5;
      }, i * 30);
    }
    setTimeout(() => {
      camera.position = originalPos;
    }, 300);
    
    // Remove asteroid
    if (asteroidObj.mesh) asteroidObj.mesh.dispose();
    if (asteroidObj.textPlane) asteroidObj.textPlane.dispose();
    
    const index = this.asteroids.indexOf(asteroidObj);
    if (index > -1) {
      this.asteroids.splice(index, 1);
    }
    
    this.updateDisplay();
    
    if (this.lives <= 0) {
      this.endGame();
    }
  }

  activatePowerUp() {
    this.streakText.text = `🔥 STREAK: ${this.streak}! 🔥`;
    
    // Power-up effects based on streak
    if (this.streak === 3) {
      // Slow down asteroids
      this.asteroids.forEach(a => {
        a.speed *= 0.7;
      });
      this.showPowerUpMessage('SLOW TIME!');
    } else if (this.streak === 5) {
      // Destroy nearest asteroid
      if (this.asteroids.length > 0) {
        const nearest = this.asteroids.reduce((prev, curr) => {
          const prevDist = BABYLON.Vector3.Distance(prev.mesh.position, this.planet.position);
          const currDist = BABYLON.Vector3.Distance(curr.mesh.position, this.planet.position);
          return currDist < prevDist ? curr : prev;
        });
        this.destroyAsteroid(nearest, true);
        this.showPowerUpMessage('AUTO DESTROY!');
      }
    } else if (this.streak === 10) {
      // Clear all asteroids
      this.asteroids.forEach(a => this.destroyAsteroid(a, true));
      this.showPowerUpMessage('MEGA BLAST!');
    }
    
    // Clear streak text after 2 seconds
    setTimeout(() => {
      this.streakText.text = '';
    }, 2000);
  }

  showPowerUpMessage(message) {
    const powerText = new TextBlock();
    powerText.text = message;
    powerText.color = 'gold';
    powerText.fontSize = 40;
    powerText.fontWeight = 'bold';
    powerText.outlineWidth = 3;
    powerText.outlineColor = 'orange';
    this.gui.addControl(powerText);
    
    // Animate message
    let scale = 1;
    const animInterval = setInterval(() => {
      scale += 0.1;
      powerText.fontSize = 40 * scale;
      powerText.alpha -= 0.02;
      
      if (powerText.alpha <= 0) {
        this.gui.removeControl(powerText);
        clearInterval(animInterval);
      }
    }, 20);
  }

  updateDisplay() {
    this.scoreText.text = `Score: ${this.score}`;
    this.livesText.text = `Lives: ${'❤️'.repeat(Math.max(0, this.lives))}`;
    this.waveText.text = `Wave: ${this.wave}`;
  }

  startGame() {
    this.gameActive = true;
    this.score = 0;
    this.lives = 5;
    this.wave = 1;
    this.streak = 0;
    this.difficulty = 1;
    
    this.updateDisplay();
    
    // Start spawning asteroids
    this.spawnAsteroids();
    
    // Increase difficulty over time
    setInterval(() => {
      if (this.gameActive) {
        this.wave++;
        this.difficulty = 1 + (this.wave - 1) * 0.2;
        this.spawnInterval = Math.max(1000, 3000 - this.wave * 200);
        this.asteroidSpeed = 0.05 * (1 + this.wave * 0.1);
        this.updateDisplay();
        
        // Show wave message
        this.showPowerUpMessage(`WAVE ${this.wave}!`);
      }
    }, 30000); // New wave every 30 seconds
  }

  spawnAsteroids() {
    const spawnLoop = () => {
      if (this.gameActive) {
        this.createAsteroid();
        
        // Set current problem to closest asteroid
        if (this.asteroids.length > 0 && !this.currentProblem) {
          const closest = this.asteroids.reduce((prev, curr) => {
            const prevDist = BABYLON.Vector3.Distance(prev.mesh.position, this.planet.position);
            const currDist = BABYLON.Vector3.Distance(curr.mesh.position, this.planet.position);
            return currDist < prevDist ? curr : prev;
          });
          this.currentProblem = closest.problem;
        }
        
        setTimeout(spawnLoop, this.spawnInterval);
      }
    };
    
    setTimeout(spawnLoop, 2000); // Start after 2 seconds
  }

  endGame() {
    this.gameActive = false;
    
    // Clear all asteroids
    this.asteroids.forEach(a => {
      if (a.mesh) a.mesh.dispose();
      if (a.textPlane) a.textPlane.dispose();
    });
    this.asteroids = [];
    
    // Show game over screen
    const gameOverRect = new Rectangle();
    gameOverRect.width = '400px';
    gameOverRect.height = '300px';
    gameOverRect.cornerRadius = 20;
    gameOverRect.color = 'white';
    gameOverRect.thickness = 2;
    gameOverRect.background = 'rgba(0,0,0,0.9)';
    this.gui.addControl(gameOverRect);
    
    const gameOverText = new TextBlock();
    gameOverText.text = `GAME OVER\n\nFinal Score: ${this.score}\nWaves Survived: ${this.wave}`;
    gameOverText.color = 'white';
    gameOverText.fontSize = 30;
    gameOverText.textWrapping = true;
    gameOverRect.addControl(gameOverText);
    
    // Continue button
    const continueBtn = Button.CreateSimpleButton('continue', 'Continue');
    continueBtn.width = '150px';
    continueBtn.height = '40px';
    continueBtn.color = 'white';
    continueBtn.background = 'blue';
    continueBtn.top = '100px';
    continueBtn.onPointerClickObservable.add(() => {
      if (this.onComplete) {
        this.onComplete({ score: this.score, wave: this.wave });
      }
    });
    gameOverRect.addControl(continueBtn);
  }

  dispose() {
    this.gameActive = false;
    if (this.gui) {
      this.gui.dispose();
    }
    if (this.planet) {
      this.planet.dispose();
    }
    this.asteroids.forEach(a => {
      if (a.mesh) a.mesh.dispose();
      if (a.textPlane) a.textPlane.dispose();
    });
  }
}
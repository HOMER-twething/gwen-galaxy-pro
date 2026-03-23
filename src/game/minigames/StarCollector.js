import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Control } from '@babylonjs/gui';

export class StarCollector {
  constructor(scene, engine, onComplete) {
    this.scene = scene;
    this.engine = engine;
    this.onComplete = onComplete;
    this.gui = null;
    this.stars = [];
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timeLimit = 90;
    this.timeRemaining = 90;
    this.gameActive = false;
    this.recognition = null;
    this.categories = ['colors', 'numbers', 'letters'];
    this.currentCategory = 'colors';
    this.performance = 0;
    this.backgrounds = [];
    this.currentBackground = null;
  }

  async init() {
    this.createBackgrounds();
    this.createGUI();
    this.setupVoiceRecognition();
    this.startGame();
  }

  createBackgrounds() {
    // Create multiple skybox backgrounds for different performance levels
    const backgrounds = [
      { name: 'space', color: new BABYLON.Color3(0, 0, 0.1) }, // Default
      { name: 'nebula', color: new BABYLON.Color3(0.1, 0, 0.2) }, // Good
      { name: 'aurora', color: new BABYLON.Color3(0, 0.2, 0.3) }, // Great
      { name: 'galaxy', color: new BABYLON.Color3(0.2, 0.1, 0.3) } // Amazing
    ];

    backgrounds.forEach((bg, index) => {
      const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 100.0 }, this.scene);
      skybox.infiniteDistance = true;
      
      const skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.scene);
      skyboxMat.backFaceCulling = false;
      skyboxMat.diffuseColor = bg.color;
      skyboxMat.specularColor = new BABYLON.Color3(0, 0, 0);
      skyboxMat.emissiveColor = bg.color;
      skybox.material = skyboxMat;
      skybox.isVisible = index === 0;
      
      this.backgrounds.push(skybox);
    });
    
    this.currentBackground = this.backgrounds[0];
  }

  changeBackground(level) {
    // Change background based on performance
    this.backgrounds.forEach((bg, index) => {
      bg.isVisible = index === level;
    });
    this.currentBackground = this.backgrounds[level];
    
    // Add transition effect
    const transitionPlane = BABYLON.MeshBuilder.CreatePlane('transition', { size: 200 }, this.scene);
    transitionPlane.position.z = -50;
    const transitionMat = new BABYLON.StandardMaterial('transitionMat', this.scene);
    transitionMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    transitionMat.alpha = 0;
    transitionPlane.material = transitionMat;
    
    // Fade in and out
    let alpha = 0;
    const fadeIn = setInterval(() => {
      alpha += 0.05;
      transitionMat.alpha = alpha;
      if (alpha >= 0.5) {
        clearInterval(fadeIn);
        const fadeOut = setInterval(() => {
          alpha -= 0.05;
          transitionMat.alpha = alpha;
          if (alpha <= 0) {
            transitionPlane.dispose();
            clearInterval(fadeOut);
          }
        }, 20);
      }
    }, 20);
  }

  createGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Main stats panel
    const statsPanel = new Rectangle();
    statsPanel.width = '350px';
    statsPanel.height = '150px';
    statsPanel.cornerRadius = 15;
    statsPanel.color = 'white';
    statsPanel.thickness = 2;
    statsPanel.background = 'rgba(0,0,0,0.7)';
    statsPanel.top = '-40%';
    statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(statsPanel);

    // Score
    const scoreText = new TextBlock();
    scoreText.text = `Score: ${this.score}`;
    scoreText.color = 'yellow';
    scoreText.fontSize = 24;
    scoreText.top = '-40px';
    statsPanel.addControl(scoreText);
    this.scoreText = scoreText;

    // Time
    const timeText = new TextBlock();
    timeText.text = `Time: ${this.timeRemaining}s`;
    timeText.color = 'white';
    timeText.fontSize = 20;
    timeText.top = '-10px';
    statsPanel.addControl(timeText);
    this.timeText = timeText;

    // Combo
    const comboText = new TextBlock();
    comboText.text = `Combo: x${this.combo}`;
    comboText.color = 'orange';
    comboText.fontSize = 22;
    comboText.top = '15px';
    statsPanel.addControl(comboText);
    this.comboText = comboText;

    // Category
    const categoryText = new TextBlock();
    categoryText.text = `Say: ${this.currentCategory.toUpperCase()}`;
    categoryText.color = 'lime';
    categoryText.fontSize = 20;
    categoryText.top = '40px';
    statsPanel.addControl(categoryText);
    this.categoryText = categoryText;

    // Voice indicator
    const voiceIndicator = new Rectangle();
    voiceIndicator.width = '250px';
    voiceIndicator.height = '50px';
    voiceIndicator.cornerRadius = 25;
    voiceIndicator.color = 'white';
    voiceIndicator.thickness = 2;
    voiceIndicator.background = 'rgba(0,0,0,0.5)';
    voiceIndicator.top = '35%';
    voiceIndicator.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(voiceIndicator);

    const voiceText = new TextBlock();
    voiceText.text = '🎤 Listening...';
    voiceText.color = 'white';
    voiceText.fontSize = 18;
    voiceIndicator.addControl(voiceText);
    this.voiceText = voiceText;
    this.voiceIndicator = voiceIndicator;

    // Performance indicator
    const perfText = new TextBlock();
    perfText.text = '';
    perfText.color = 'gold';
    perfText.fontSize = 30;
    perfText.fontWeight = 'bold';
    perfText.top = '25%';
    perfText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(perfText);
    this.perfText = perfText;
  }

  setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          
          if (event.results[i].isFinal) {
            this.processVoiceCommand(transcript);
          } else {
            // Show interim results
            this.voiceText.text = `🎤 ${transcript}`;
            this.voiceIndicator.background = 'rgba(0,255,0,0.2)';
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        this.voiceText.text = '🎤 Error - retrying...';
        
        // Restart recognition
        if (this.gameActive) {
          setTimeout(() => {
            this.recognition.start();
            this.voiceText.text = '🎤 Listening...';
          }, 1000);
        }
      };

      this.recognition.onend = () => {
        if (this.gameActive) {
          this.recognition.start();
        }
      };

      this.recognition.start();
    }
  }

  processVoiceCommand(command) {
    if (!this.gameActive) return;

    // Visual feedback
    this.voiceIndicator.background = 'rgba(0,255,0,0.5)';
    setTimeout(() => {
      this.voiceIndicator.background = 'rgba(0,0,0,0.5)';
    }, 200);

    // Check for matches based on current category
    let matched = false;
    
    this.stars.forEach(star => {
      if (!star.collected && this.checkMatch(command, star.value)) {
        this.collectStar(star);
        matched = true;
      }
    });

    if (matched) {
      this.voiceText.text = `✅ ${command}!`;
    } else {
      this.voiceText.text = `❌ ${command}`;
      this.combo = 0;
      this.updateCombo();
    }

    setTimeout(() => {
      this.voiceText.text = '🎤 Listening...';
    }, 1000);
  }

  checkMatch(command, value) {
    const normalizedCommand = command.toLowerCase().trim();
    const normalizedValue = value.toLowerCase().trim();
    
    // Direct match
    if (normalizedCommand.includes(normalizedValue)) {
      return true;
    }
    
    // Number word to digit conversion
    const numberWords = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'ten': '10'
    };
    
    for (const [word, digit] of Object.entries(numberWords)) {
      if (normalizedCommand.includes(word) && normalizedValue === digit) {
        return true;
      }
    }
    
    return false;
  }

  createStar(category, value, position) {
    const star = BABYLON.MeshBuilder.CreateCylinder('star', { 
      height: 0.1, 
      diameterTop: 2, 
      diameterBottom: 2, 
      tessellation: 5 
    }, this.scene);
    
    star.position = position;
    star.rotation.x = Math.PI / 2;
    
    // Color based on category
    const starMat = new BABYLON.StandardMaterial('starMat', this.scene);
    if (category === 'colors') {
      // Set actual color for color category
      const colorMap = {
        'red': new BABYLON.Color3(1, 0, 0),
        'blue': new BABYLON.Color3(0, 0, 1),
        'green': new BABYLON.Color3(0, 1, 0),
        'yellow': new BABYLON.Color3(1, 1, 0),
        'purple': new BABYLON.Color3(0.5, 0, 0.5),
        'orange': new BABYLON.Color3(1, 0.5, 0),
        'pink': new BABYLON.Color3(1, 0.5, 0.5),
        'white': new BABYLON.Color3(1, 1, 1)
      };
      starMat.diffuseColor = colorMap[value] || new BABYLON.Color3(1, 1, 1);
      starMat.emissiveColor = starMat.diffuseColor.scale(0.5);
    } else if (category === 'numbers') {
      starMat.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
      starMat.emissiveColor = new BABYLON.Color3(0, 0.2, 0.5);
    } else {
      starMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
      starMat.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0);
    }
    star.material = starMat;

    // Add text label
    const plane = BABYLON.MeshBuilder.CreatePlane('labelPlane', { size: 1.5 }, this.scene);
    plane.position = position.clone();
    plane.position.z -= 0.5;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
    const text = new TextBlock();
    text.text = value.toUpperCase();
    text.color = 'white';
    text.fontSize = 60;
    text.fontWeight = 'bold';
    text.outlineWidth = 3;
    text.outlineColor = 'black';
    advancedTexture.addControl(text);

    const starObj = {
      mesh: star,
      label: plane,
      category: category,
      value: value,
      collected: false,
      originalY: position.y
    };
    
    this.stars.push(starObj);

    // Animate star
    this.scene.registerBeforeRender(() => {
      if (!star.isDisposed() && !starObj.collected) {
        star.rotation.z += 0.02;
        star.position.y = starObj.originalY + Math.sin(Date.now() * 0.001 + position.x) * 0.3;
      }
    });
  }

  spawnStars() {
    // Clear existing stars
    this.stars.forEach(star => {
      if (star.mesh) star.mesh.dispose();
      if (star.label) star.label.dispose();
    });
    this.stars = [];

    // Choose random category
    this.currentCategory = this.categories[Math.floor(Math.random() * this.categories.length)];
    this.categoryText.text = `Say: ${this.currentCategory.toUpperCase()}`;

    let values = [];
    if (this.currentCategory === 'colors') {
      values = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    } else if (this.currentCategory === 'numbers') {
      values = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    } else {
      values = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    }

    // Spawn 4-6 stars
    const numStars = Math.floor(Math.random() * 3) + 4;
    const selectedValues = [];
    
    for (let i = 0; i < numStars; i++) {
      const value = values[Math.floor(Math.random() * values.length)];
      selectedValues.push(value);
      
      const angle = (i / numStars) * Math.PI * 2;
      const radius = 5 + Math.random() * 3;
      const position = new BABYLON.Vector3(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 4,
        Math.sin(angle) * radius
      );
      
      this.createStar(this.currentCategory, value, position);
    }
  }

  collectStar(star) {
    if (star.collected) return;
    
    star.collected = true;
    this.combo++;
    this.score += 100 * Math.min(this.combo, 5);
    
    // Visual collection effect
    const collectEffect = () => {
      const particleSystem = new BABYLON.ParticleSystem('collect', 50, this.scene);
      particleSystem.particleTexture = new BABYLON.Texture('/textures/flare.png', this.scene);
      particleSystem.emitter = star.mesh.position.clone();
      particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
      particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
      particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1);
      particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.5;
      particleSystem.minLifeTime = 0.3;
      particleSystem.maxLifeTime = 0.8;
      particleSystem.emitRate = 100;
      particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
      particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);
      particleSystem.minEmitPower = 1;
      particleSystem.maxEmitPower = 3;
      
      particleSystem.start();
      
      setTimeout(() => {
        particleSystem.stop();
        setTimeout(() => {
          particleSystem.dispose();
        }, 1000);
      }, 100);
    };
    
    collectEffect();
    
    // Animate star disappearing
    const shrinkInterval = setInterval(() => {
      if (star.mesh.scaling.x > 0) {
        star.mesh.scaling.x -= 0.1;
        star.mesh.scaling.y -= 0.1;
        star.mesh.scaling.z -= 0.1;
        star.mesh.rotation.z += 0.5;
      } else {
        clearInterval(shrinkInterval);
        star.mesh.dispose();
        star.label.dispose();
      }
    }, 20);
    
    this.updateDisplay();
    this.updateCombo();
    
    // Check if all stars collected
    const remainingStars = this.stars.filter(s => !s.collected);
    if (remainingStars.length === 0) {
      this.showBonus();
      setTimeout(() => {
        this.spawnStars();
      }, 1500);
    }
  }

  updateCombo() {
    this.comboText.text = `Combo: x${this.combo}`;
    
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    // Update performance and background
    if (this.combo >= 10) {
      this.performance = 3;
      this.perfText.text = '🌟 AMAZING! 🌟';
      this.changeBackground(3);
    } else if (this.combo >= 5) {
      this.performance = 2;
      this.perfText.text = '✨ GREAT! ✨';
      this.changeBackground(2);
    } else if (this.combo >= 3) {
      this.performance = 1;
      this.perfText.text = '⭐ GOOD! ⭐';
      this.changeBackground(1);
    } else {
      this.performance = 0;
      this.perfText.text = '';
      if (this.combo === 0) {
        this.changeBackground(0);
      }
    }
    
    // Clear performance text after delay
    if (this.combo > 0) {
      setTimeout(() => {
        this.perfText.text = '';
      }, 2000);
    }
  }

  showBonus() {
    const bonusText = new TextBlock();
    bonusText.text = `BONUS! +${500 * Math.min(this.combo, 10)}`;
    bonusText.color = 'gold';
    bonusText.fontSize = 40;
    bonusText.fontWeight = 'bold';
    bonusText.outlineWidth = 3;
    bonusText.outlineColor = 'orange';
    this.gui.addControl(bonusText);
    
    this.score += 500 * Math.min(this.combo, 10);
    this.updateDisplay();
    
    // Animate bonus text
    let yPos = 0;
    const moveInterval = setInterval(() => {
      yPos -= 5;
      bonusText.top = `${yPos}px`;
      bonusText.alpha -= 0.02;
      
      if (bonusText.alpha <= 0) {
        this.gui.removeControl(bonusText);
        clearInterval(moveInterval);
      }
    }, 20);
  }

  updateDisplay() {
    this.scoreText.text = `Score: ${this.score}`;
    this.timeText.text = `Time: ${this.timeRemaining}s`;
  }

  startGame() {
    this.gameActive = true;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timeRemaining = this.timeLimit;
    this.performance = 0;
    
    this.updateDisplay();
    this.spawnStars();
    
    // Game timer
    const timerInterval = setInterval(() => {
      if (this.gameActive) {
        this.timeRemaining--;
        this.updateDisplay();
        
        if (this.timeRemaining <= 0) {
          clearInterval(timerInterval);
          this.endGame();
        } else if (this.timeRemaining === 10) {
          // Warning for last 10 seconds
          this.timeText.color = 'red';
        }
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);
    
    // Spawn new stars periodically if all collected
    setInterval(() => {
      if (this.gameActive && this.stars.every(s => s.collected)) {
        this.spawnStars();
      }
    }, 2000);
  }

  endGame() {
    this.gameActive = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }
    
    // Clear stars
    this.stars.forEach(star => {
      if (star.mesh) star.mesh.dispose();
      if (star.label) star.label.dispose();
    });
    
    // Calculate grade
    let grade = 'Good Try!';
    if (this.score > 5000) grade = 'AMAZING!';
    else if (this.score > 3000) grade = 'EXCELLENT!';
    else if (this.score > 1500) grade = 'GREAT!';
    
    // Show results
    const resultRect = new Rectangle();
    resultRect.width = '400px';
    resultRect.height = '350px';
    resultRect.cornerRadius = 20;
    resultRect.color = 'white';
    resultRect.thickness = 2;
    resultRect.background = 'rgba(0,0,0,0.9)';
    this.gui.addControl(resultRect);
    
    const resultText = new TextBlock();
    resultText.text = `🌟 ${grade} 🌟\n\nFinal Score: ${this.score}\nMax Combo: ${this.maxCombo}\n\nGreat voice control!`;
    resultText.color = 'white';
    resultText.fontSize = 26;
    resultText.textWrapping = true;
    resultText.lineSpacing = '5px';
    resultRect.addControl(resultText);
    
    // Continue button
    const continueBtn = BABYLON.GUI.Button.CreateSimpleButton('continue', 'Continue');
    continueBtn.width = '150px';
    continueBtn.height = '40px';
    continueBtn.color = 'white';
    continueBtn.background = 'blue';
    continueBtn.top = '120px';
    continueBtn.onPointerClickObservable.add(() => {
      if (this.onComplete) {
        this.onComplete({ score: this.score, maxCombo: this.maxCombo });
      }
    });
    resultRect.addControl(continueBtn);
  }

  dispose() {
    this.gameActive = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }
    
    if (this.gui) {
      this.gui.dispose();
    }
    
    this.stars.forEach(star => {
      if (star.mesh) star.mesh.dispose();
      if (star.label) star.label.dispose();
    });
    
    this.backgrounds.forEach(bg => {
      if (bg) bg.dispose();
    });
  }
}
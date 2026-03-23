import * as BABYLON from '@babylonjs/core';
import { getRandomWords } from '../../data/words';

export class SpellingScene {
  constructor(engine, voiceController) {
    this.engine = engine;
    this.voiceController = voiceController;
    this.scene = null;
    this.camera = null;
    this.currentWord = null;
    this.currentLetterIndex = 0;
    this.score = 0;
    this.level = 1;
    this.words = [];
    this.wordIndex = 0;
    this.stella = null;
    this.letterBoxes = [];
    this.xp = 0;
  }

  async createScene() {
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.05, 0.02, 0.15, 1);

    // Camera
    this.camera = new BABYLON.UniversalCamera("spellingCam", new BABYLON.Vector3(0, 2, -10), this.scene);
    this.camera.setTarget(new BABYLON.Vector3(0, 0, 0));

    // Lighting
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.8;
    light.diffuse = new BABYLON.Color3(0.8, 0.8, 1);

    const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 5, 0), this.scene);
    pointLight.diffuse = new BABYLON.Color3(1, 0.8, 1);
    pointLight.intensity = 0.5;

    // Create space station background
    this.createSpaceStation();

    // Create Stella the Space Cat
    this.createStella();

    // Create UI elements
    this.createUI();

    // Load words for current level
    this.words = getRandomWords(this.level, 10);
    this.nextWord();

    // Setup voice recognition for spelling
    this.setupVoiceRecognition();

    return this.scene;
  }

  createSpaceStation() {
    // Floor
    const floor = BABYLON.MeshBuilder.CreateBox("floor", {width: 20, height: 0.5, depth: 20}, this.scene);
    floor.position.y = -2;
    const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    floorMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.4);
    floor.material = floorMat;

    // Windows showing space
    for (let i = 0; i < 3; i++) {
      const window = BABYLON.MeshBuilder.CreateCylinder(`window${i}`, {height: 0.1, diameter: 3}, this.scene);
      window.rotation.x = Math.PI / 2;
      window.position.x = (i - 1) * 6;
      window.position.z = 5;
      window.position.y = 2;
      
      const windowMat = new BABYLON.StandardMaterial(`windowMat${i}`, this.scene);
      windowMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3);
      windowMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2);
      windowMat.alpha = 0.7;
      window.material = windowMat;
    }

    // Control panels
    for (let i = 0; i < 2; i++) {
      const panel = BABYLON.MeshBuilder.CreateBox(`panel${i}`, {width: 2, height: 3, depth: 0.3}, this.scene);
      panel.position.x = i === 0 ? -8 : 8;
      panel.position.z = 4;
      panel.position.y = 0;
      
      const panelMat = new BABYLON.StandardMaterial(`panelMat${i}`, this.scene);
      panelMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4);
      panelMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);
      panel.material = panelMat;

      // Add blinking lights
      for (let j = 0; j < 5; j++) {
        const light = BABYLON.MeshBuilder.CreateSphere(`light${i}_${j}`, {diameter: 0.1}, this.scene);
        light.parent = panel;
        light.position.y = -1 + j * 0.5;
        light.position.z = -0.2;
        
        const lightMat = new BABYLON.StandardMaterial(`lightMat${i}_${j}`, this.scene);
        lightMat.emissiveColor = new BABYLON.Color3(
          Math.random(), 
          Math.random(), 
          Math.random()
        );
        light.material = lightMat;

        // Blink animation
        this.scene.registerBeforeRender(() => {
          lightMat.emissiveColor.r = Math.sin(Date.now() * 0.001 * (j + 1)) * 0.5 + 0.5;
        });
      }
    }
  }

  createStella() {
    // Create Stella as an animated sphere character (placeholder for 3D model)
    this.stella = BABYLON.MeshBuilder.CreateSphere("stella", {diameter: 2}, this.scene);
    this.stella.position = new BABYLON.Vector3(-3, 0, 0);
    
    const stellaMat = new BABYLON.StandardMaterial("stellaMat", this.scene);
    stellaMat.diffuseColor = new BABYLON.Color3(0.7, 0.5, 0.8);
    stellaMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.3);
    stellaMat.specularColor = new BABYLON.Color3(0.8, 0.6, 0.9);
    this.stella.material = stellaMat;

    // Add cat ears
    const ear1 = BABYLON.MeshBuilder.CreateCylinder("ear1", {height: 0.8, diameterTop: 0, diameterBottom: 0.5}, this.scene);
    ear1.parent = this.stella;
    ear1.position = new BABYLON.Vector3(-0.4, 0.8, 0);
    ear1.material = stellaMat;

    const ear2 = BABYLON.MeshBuilder.CreateCylinder("ear2", {height: 0.8, diameterTop: 0, diameterBottom: 0.5}, this.scene);
    ear2.parent = this.stella;
    ear2.position = new BABYLON.Vector3(0.4, 0.8, 0);
    ear2.material = stellaMat;

    // Add eyes
    const eye1 = BABYLON.MeshBuilder.CreateSphere("eye1", {diameter: 0.3}, this.scene);
    eye1.parent = this.stella;
    eye1.position = new BABYLON.Vector3(-0.3, 0.2, -0.8);
    const eyeMat = new BABYLON.StandardMaterial("eyeMat", this.scene);
    eyeMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    eye1.material = eyeMat;

    const eye2 = BABYLON.MeshBuilder.CreateSphere("eye2", {diameter: 0.3}, this.scene);
    eye2.parent = this.stella;
    eye2.position = new BABYLON.Vector3(0.3, 0.2, -0.8);
    eye2.material = eyeMat;

    // Idle animation
    this.scene.registerBeforeRender(() => {
      this.stella.position.y = Math.sin(Date.now() * 0.002) * 0.2;
      this.stella.rotation.y += 0.002;
    });
  }

  createUI() {
    // Create word display area
    this.wordDisplay = BABYLON.MeshBuilder.CreatePlane("wordDisplay", {width: 8, height: 2}, this.scene);
    this.wordDisplay.position = new BABYLON.Vector3(0, 3, 3);
    
    const wordTexture = new BABYLON.DynamicTexture("wordTexture", {width: 512, height: 128}, this.scene);
    this.wordTexture = wordTexture;
    const wordMat = new BABYLON.StandardMaterial("wordMat", this.scene);
    wordMat.diffuseTexture = wordTexture;
    wordMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    wordMat.disableLighting = true;
    this.wordDisplay.material = wordMat;

    // Score display
    this.scoreDisplay = BABYLON.MeshBuilder.CreatePlane("scoreDisplay", {width: 4, height: 1}, this.scene);
    this.scoreDisplay.position = new BABYLON.Vector3(6, 4, 2);
    
    const scoreTexture = new BABYLON.DynamicTexture("scoreTexture", {width: 256, height: 64}, this.scene);
    this.scoreTexture = scoreTexture;
    const scoreMat = new BABYLON.StandardMaterial("scoreMat", this.scene);
    scoreMat.diffuseTexture = scoreTexture;
    scoreMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    scoreMat.disableLighting = true;
    this.scoreDisplay.material = scoreMat;

    this.updateScore();
  }

  nextWord() {
    if (this.wordIndex >= this.words.length) {
      this.levelComplete();
      return;
    }

    this.currentWord = this.words[this.wordIndex];
    this.currentLetterIndex = 0;
    this.wordIndex++;

    // Clear old letter boxes
    this.letterBoxes.forEach(box => box.dispose());
    this.letterBoxes = [];

    // Create letter boxes for the word
    const word = this.currentWord.word.toUpperCase();
    for (let i = 0; i < word.length; i++) {
      const box = BABYLON.MeshBuilder.CreateBox(`letter${i}`, {width: 1, height: 1, depth: 0.3}, this.scene);
      box.position = new BABYLON.Vector3(-word.length/2 + i + 0.5, 0, 0);
      
      const mat = new BABYLON.StandardMaterial(`letterMat${i}`, this.scene);
      mat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.5);
      mat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
      box.material = mat;

      // Add letter text
      const textPlane = BABYLON.MeshBuilder.CreatePlane(`letterText${i}`, {width: 0.8, height: 0.8}, this.scene);
      textPlane.parent = box;
      textPlane.position.z = -0.16;
      
      const textTexture = new BABYLON.DynamicTexture(`letterTexture${i}`, {width: 64, height: 64}, this.scene);
      const textMat = new BABYLON.StandardMaterial(`letterTextMat${i}`, this.scene);
      textMat.diffuseTexture = textTexture;
      textMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      textMat.disableLighting = true;
      textPlane.material = textMat;

      const ctx = textTexture.getContext();
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(word[i], 32, 48);
      textTexture.update();

      this.letterBoxes.push({box, mat, letter: word[i], revealed: false, textTexture});
    }

    // Update display
    this.updateWordDisplay();
    
    // Speak the word
    this.speakInstruction();
  }

  updateWordDisplay() {
    const ctx = this.wordTexture.getContext();
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(`Spell: ${this.currentWord.word}`, 256, 64);
    ctx.font = "24px Arial";
    ctx.fillStyle = "#aaaaff";
    ctx.fillText(this.currentWord.sentence, 256, 100);
    this.wordTexture.update();
  }

  updateScore() {
    const ctx = this.scoreTexture.getContext();
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "gold";
    ctx.textAlign = "center";
    ctx.fillText(`Score: ${this.score}`, 128, 32);
    ctx.font = "20px Arial";
    ctx.fillText(`Level ${this.level} | XP: ${this.xp}`, 128, 56);
    this.scoreTexture.update();
  }

  speakInstruction() {
    if (this.voiceController.tts) {
      const message = `Spell the word: ${this.currentWord.word}. ${this.currentWord.sentence}`;
      this.voiceController.speak(message);
    }
  }

  setupVoiceRecognition() {
    this.voiceController.onResult = (transcript) => {
      const spoken = transcript.toUpperCase().replace(/\s+/g, '');
      
      // Check if it's a single letter
      if (spoken.length === 1) {
        this.checkLetter(spoken);
      } else {
        // Check for letter spelling (e.g., "SEE" for "C")
        const letterMap = {
          'A': ['A', 'AY', 'EH'],
          'B': ['B', 'BE', 'BEE'],
          'C': ['C', 'SEE', 'SEA'],
          'D': ['D', 'DEE', 'DEA'],
          'E': ['E', 'EE', 'EA'],
          'F': ['F', 'EF', 'EFF'],
          'G': ['G', 'GEE', 'JEE'],
          'H': ['H', 'AITCH', 'ACHE'],
          'I': ['I', 'EYE', 'AYE'],
          'J': ['J', 'JAY', 'JAE'],
          'K': ['K', 'KAY', 'CAY'],
          'L': ['L', 'EL', 'ELL'],
          'M': ['M', 'EM', 'EMM'],
          'N': ['N', 'EN', 'ENN'],
          'O': ['O', 'OH', 'OWE'],
          'P': ['P', 'PEE', 'PEA'],
          'Q': ['Q', 'CUE', 'QUEUE'],
          'R': ['R', 'AR', 'ARE'],
          'S': ['S', 'ES', 'ESS'],
          'T': ['T', 'TEE', 'TEA'],
          'U': ['U', 'YOU', 'YEW'],
          'V': ['V', 'VEE', 'VE'],
          'W': ['W', 'DOUBLEYOU', 'DOUBLE YOU'],
          'X': ['X', 'EX', 'EKS'],
          'Y': ['Y', 'WHY', 'WYE'],
          'Z': ['Z', 'ZEE', 'ZED']
        };

        for (const [letter, variations] of Object.entries(letterMap)) {
          if (variations.includes(spoken)) {
            this.checkLetter(letter);
            break;
          }
        }
      }
    };

    // Start continuous recognition
    this.voiceController.startContinuous();
  }

  checkLetter(letter) {
    const expectedLetter = this.currentWord.word.toUpperCase()[this.currentLetterIndex];
    
    if (letter === expectedLetter) {
      // Correct letter!
      this.letterBoxes[this.currentLetterIndex].mat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 0.2);
      this.letterBoxes[this.currentLetterIndex].revealed = true;
      
      // Celebration effect
      this.createCelebrationParticles(this.letterBoxes[this.currentLetterIndex].box.position);
      
      // Play success sound
      this.playSuccessSound();
      
      this.currentLetterIndex++;
      this.score += 10;
      this.xp += 5;
      this.updateScore();

      if (this.currentLetterIndex >= this.currentWord.word.length) {
        // Word complete!
        setTimeout(() => {
          this.wordComplete();
        }, 1000);
      }
    } else {
      // Wrong letter
      this.letterBoxes[this.currentLetterIndex].mat.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0.2);
      setTimeout(() => {
        this.letterBoxes[this.currentLetterIndex].mat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
      }, 500);
      
      // Screen shake
      this.screenShake();
      
      // Play error sound
      this.playErrorSound();
    }
  }

  wordComplete() {
    // Big celebration!
    this.score += 50;
    this.xp += 25;
    this.updateScore();
    
    if (this.voiceController.tts) {
      this.voiceController.speak("Excellent! You spelled " + this.currentWord.word + " correctly!");
    }
    
    // Save progress
    this.saveProgress();
    
    // Next word after delay
    setTimeout(() => {
      this.nextWord();
    }, 2000);
  }

  levelComplete() {
    // Level complete celebration
    if (this.voiceController.tts) {
      this.voiceController.speak("Amazing! You completed level " + this.level + "! You earned " + this.xp + " experience points!");
    }
    
    // Save progress and advance level
    this.level++;
    this.saveProgress();
    
    // Could transition to next level or back to menu
  }

  createCelebrationParticles(position) {
    const particleSystem = new BABYLON.ParticleSystem("celebration", 100, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADVJREFUeNpi/P//PwMDAwMj42AGLiBkgQimgQgQg3ARIKaECCCDKSCCSWATE4hoRhYABBgAWXkI7qorXVEAAAAASUVORK5CYII=", this.scene);
    
    particleSystem.emitter = position.clone();
    particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
    
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;
    
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1;
    
    particleSystem.emitRate = 100;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    
    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 3, 1);
    
    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 5;
    
    particleSystem.start();
    
    // Stop after a short time
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 2000);
    }, 200);
  }

  screenShake() {
    const originalPos = this.camera.position.clone();
    let shakeTime = 0;
    const shakeAnimation = this.scene.registerBeforeRender(() => {
      shakeTime += 0.1;
      if (shakeTime < 1) {
        this.camera.position.x = originalPos.x + (Math.random() - 0.5) * 0.2;
        this.camera.position.y = originalPos.y + (Math.random() - 0.5) * 0.2;
      } else {
        this.camera.position = originalPos;
        this.scene.unregisterBeforeRender(shakeAnimation);
      }
    });
  }

  playSuccessSound() {
    // Use Web Audio API to create a success chime
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  playErrorSound() {
    // Use Web Audio API to create an error buzz
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }

  saveProgress() {
    const progress = {
      level: this.level,
      score: this.score,
      xp: this.xp,
      wordsCompleted: this.wordIndex,
      lastPlayed: new Date().toISOString()
    };
    localStorage.setItem('gwenGalaxy_spelling', JSON.stringify(progress));
  }

  loadProgress() {
    const saved = localStorage.getItem('gwenGalaxy_spelling');
    if (saved) {
      const progress = JSON.parse(saved);
      this.level = progress.level || 1;
      this.score = progress.score || 0;
      this.xp = progress.xp || 0;
    }
  }

  dispose() {
    if (this.voiceController) {
      this.voiceController.stop();
    }
    if (this.scene) {
      this.scene.dispose();
    }
  }
}
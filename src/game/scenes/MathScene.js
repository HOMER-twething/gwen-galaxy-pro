import * as BABYLON from '@babylonjs/core';
import { getRandomProblems, getProblemText, validateMathAnswer } from '../../data/math';

export class MathScene {
  constructor(engine, voiceController) {
    this.engine = engine;
    this.voiceController = voiceController;
    this.scene = null;
    this.camera = null;
    this.currentProblem = null;
    this.problemType = 'addition'; // addition, subtraction, counting, patterns
    this.level = 1;
    this.score = 0;
    this.xp = 0;
    this.problems = [];
    this.problemIndex = 0;
    this.objectMeshes = [];
  }

  async createScene() {
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.05, 0.15, 1);

    // Camera
    this.camera = new BABYLON.UniversalCamera("mathCam", new BABYLON.Vector3(0, 5, -15), this.scene);
    this.camera.setTarget(new BABYLON.Vector3(0, 0, 0));

    // Lighting
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.9;
    light.diffuse = new BABYLON.Color3(0.9, 0.9, 1);

    // Create math arena
    this.createMathArena();

    // Create UI
    this.createUI();

    // Load problems
    this.loadProblems();

    // Setup voice recognition
    this.setupVoiceRecognition();

    return this.scene;
  }

  createMathArena() {
    // Create platform
    const platform = BABYLON.MeshBuilder.CreateCylinder("platform", {diameter: 20, height: 0.5}, this.scene);
    platform.position.y = -2;
    const platformMat = new BABYLON.StandardMaterial("platformMat", this.scene);
    platformMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.5);
    platformMat.specularColor = new BABYLON.Color3(0.4, 0.3, 0.6);
    platform.material = platformMat;

    // Add grid pattern
    const gridTexture = new BABYLON.DynamicTexture("grid", {width: 512, height: 512}, this.scene);
    const ctx = gridTexture.getContext();
    ctx.strokeStyle = "#4444aa";
    ctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    gridTexture.update();
    platformMat.diffuseTexture = gridTexture;

    // Create floating number decorations
    for (let i = 0; i < 10; i++) {
      const num = BABYLON.MeshBuilder.CreatePlane(`num${i}`, {width: 1, height: 1}, this.scene);
      num.position = new BABYLON.Vector3(
        Math.random() * 20 - 10,
        Math.random() * 5 + 3,
        Math.random() * 10 - 5
      );
      
      const numTexture = new BABYLON.DynamicTexture(`numTex${i}`, {width: 64, height: 64}, this.scene);
      const numCtx = numTexture.getContext();
      numCtx.font = "bold 48px Arial";
      numCtx.fillStyle = "#aaaaff";
      numCtx.textAlign = "center";
      numCtx.fillText(String(i), 32, 48);
      numTexture.update();

      const numMat = new BABYLON.StandardMaterial(`numMat${i}`, this.scene);
      numMat.diffuseTexture = numTexture;
      numMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.5);
      numMat.disableLighting = true;
      numMat.backFaceCulling = false;
      num.material = numMat;

      // Float animation
      this.scene.registerBeforeRender(() => {
        num.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
        num.rotation.y += 0.01;
      });
    }
  }

  createUI() {
    // Problem display
    this.problemDisplay = BABYLON.MeshBuilder.CreatePlane("problemDisplay", {width: 10, height: 3}, this.scene);
    this.problemDisplay.position = new BABYLON.Vector3(0, 5, 5);
    
    const problemTexture = new BABYLON.DynamicTexture("problemTexture", {width: 1024, height: 256}, this.scene);
    this.problemTexture = problemTexture;
    const problemMat = new BABYLON.StandardMaterial("problemMat", this.scene);
    problemMat.diffuseTexture = problemTexture;
    problemMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    problemMat.disableLighting = true;
    this.problemDisplay.material = problemMat;

    // Score display
    this.scoreDisplay = BABYLON.MeshBuilder.CreatePlane("scoreDisplay", {width: 4, height: 1.5}, this.scene);
    this.scoreDisplay.position = new BABYLON.Vector3(7, 6, 4);
    
    const scoreTexture = new BABYLON.DynamicTexture("scoreTexture", {width: 256, height: 96}, this.scene);
    this.scoreTexture = scoreTexture;
    const scoreMat = new BABYLON.StandardMaterial("scoreMat", this.scene);
    scoreMat.diffuseTexture = scoreTexture;
    scoreMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    scoreMat.disableLighting = true;
    this.scoreDisplay.material = scoreMat;

    this.updateScore();
  }

  loadProblems() {
    this.problems = getRandomProblems(this.problemType, this.level, 10);
    this.problemIndex = 0;
    this.nextProblem();
  }

  nextProblem() {
    if (this.problemIndex >= this.problems.length) {
      this.levelComplete();
      return;
    }

    // Clear old objects
    this.objectMeshes.forEach(mesh => mesh.dispose());
    this.objectMeshes = [];

    this.currentProblem = this.problems[this.problemIndex];
    this.problemIndex++;

    // Display the problem
    this.displayProblem();

    // Create visual aids
    this.createVisualAids();

    // Speak the problem
    this.speakProblem();
  }

  displayProblem() {
    const ctx = this.problemTexture.getContext();
    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    let problemText = "";
    switch(this.problemType) {
      case 'addition':
        problemText = `${this.currentProblem.num1} + ${this.currentProblem.num2} = ?`;
        break;
      case 'subtraction':
        problemText = `${this.currentProblem.num1} - ${this.currentProblem.num2} = ?`;
        break;
      case 'counting':
        problemText = this.currentProblem.question;
        break;
      case 'patterns':
        problemText = this.currentProblem.pattern.join(', ') + ', ?';
        break;
    }

    ctx.fillText(problemText, 512, 100);
    
    if (this.currentProblem.visual) {
      ctx.font = "48px Arial";
      ctx.fillText(this.currentProblem.visual, 512, 180);
    }
    
    this.problemTexture.update();
  }

  createVisualAids() {
    if (this.problemType === 'counting') {
      // Create objects to count
      const count = this.currentProblem.count;
      const objectEmoji = this.currentProblem.objects;
      
      for (let i = 0; i < count; i++) {
        const obj = BABYLON.MeshBuilder.CreateSphere(`countObj${i}`, {diameter: 0.8}, this.scene);
        obj.position = new BABYLON.Vector3(
          -count/2 + i * 1.2 + 0.5,
          0,
          0
        );
        
        const mat = new BABYLON.StandardMaterial(`countMat${i}`, this.scene);
        mat.diffuseColor = new BABYLON.Color3(
          0.5 + Math.random() * 0.5,
          0.5 + Math.random() * 0.5,
          0.5 + Math.random() * 0.5
        );
        mat.emissiveColor = mat.diffuseColor.scale(0.3);
        obj.material = mat;
        
        this.objectMeshes.push(obj);

        // Bounce animation
        this.scene.registerBeforeRender(() => {
          obj.position.y = Math.abs(Math.sin(Date.now() * 0.003 + i * 0.5)) * 0.5;
        });
      }
    } else if (this.problemType === 'addition') {
      // Create two groups of objects
      const group1 = this.currentProblem.num1;
      const group2 = this.currentProblem.num2;
      
      // Group 1 (left side)
      for (let i = 0; i < group1; i++) {
        const obj = BABYLON.MeshBuilder.CreateBox(`add1_${i}`, {size: 0.7}, this.scene);
        obj.position = new BABYLON.Vector3(
          -5 + (i % 5) * 0.9,
          Math.floor(i / 5) * 0.9,
          0
        );
        
        const mat = new BABYLON.StandardMaterial(`add1Mat${i}`, this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.3, 0.6, 1);
        mat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
        obj.material = mat;
        
        this.objectMeshes.push(obj);
      }
      
      // Plus sign
      const plus = BABYLON.MeshBuilder.CreatePlane("plus", {width: 1, height: 1}, this.scene);
      plus.position = new BABYLON.Vector3(0, 0, 0);
      const plusTex = new BABYLON.DynamicTexture("plusTex", {width: 64, height: 64}, this.scene);
      const plusCtx = plusTex.getContext();
      plusCtx.font = "bold 48px Arial";
      plusCtx.fillStyle = "yellow";
      plusCtx.textAlign = "center";
      plusCtx.fillText("+", 32, 48);
      plusTex.update();
      const plusMat = new BABYLON.StandardMaterial("plusMat", this.scene);
      plusMat.diffuseTexture = plusTex;
      plusMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      plusMat.disableLighting = true;
      plus.material = plusMat;
      this.objectMeshes.push(plus);
      
      // Group 2 (right side)
      for (let i = 0; i < group2; i++) {
        const obj = BABYLON.MeshBuilder.CreateBox(`add2_${i}`, {size: 0.7}, this.scene);
        obj.position = new BABYLON.Vector3(
          2 + (i % 5) * 0.9,
          Math.floor(i / 5) * 0.9,
          0
        );
        
        const mat = new BABYLON.StandardMaterial(`add2Mat${i}`, this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0.6, 0.3);
        mat.emissiveColor = new BABYLON.Color3(0.4, 0.2, 0.1);
        obj.material = mat;
        
        this.objectMeshes.push(obj);
      }
    } else if (this.problemType === 'subtraction') {
      // Create objects and show some being removed
      const total = this.currentProblem.num1;
      const toRemove = this.currentProblem.num2;
      
      for (let i = 0; i < total; i++) {
        const obj = BABYLON.MeshBuilder.CreateSphere(`subObj${i}`, {diameter: 0.7}, this.scene);
        obj.position = new BABYLON.Vector3(
          -total/2 + i * 1 + 0.5,
          0,
          0
        );
        
        const mat = new BABYLON.StandardMaterial(`subMat${i}`, this.scene);
        
        if (i < toRemove) {
          // Objects to be removed (red and fading)
          mat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
          mat.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);
          mat.alpha = 0.5;
          
          // Fade animation
          this.scene.registerBeforeRender(() => {
            obj.position.y -= 0.002;
            mat.alpha = Math.max(0.1, mat.alpha - 0.001);
          });
        } else {
          // Remaining objects (green)
          mat.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2);
          mat.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.1);
        }
        
        obj.material = mat;
        this.objectMeshes.push(obj);
      }
    }
  }

  speakProblem() {
    if (this.voiceController.tts) {
      const text = getProblemText(this.currentProblem, this.problemType);
      this.voiceController.speak(text);
    }
  }

  setupVoiceRecognition() {
    this.voiceController.onResult = (transcript) => {
      const answer = this.currentProblem.answer;
      
      if (validateMathAnswer(transcript, answer)) {
        this.correctAnswer();
      } else {
        this.incorrectAnswer();
      }
    };

    this.voiceController.startContinuous();
  }

  correctAnswer() {
    // Success!
    this.score += 25;
    this.xp += 15;
    this.updateScore();

    // Visual celebration
    this.createCelebration();

    // Sound effect
    this.playSuccessSound();

    // Speak encouragement
    if (this.voiceController.tts) {
      const messages = [
        "Correct! Great job!",
        "Yes! You got it!",
        "Excellent work!",
        "Perfect! Keep going!",
        "Amazing! You're a math star!"
      ];
      this.voiceController.speak(messages[Math.floor(Math.random() * messages.length)]);
    }

    // Save progress
    this.saveProgress();

    // Next problem after delay
    setTimeout(() => {
      this.nextProblem();
    }, 2500);
  }

  incorrectAnswer() {
    // Wrong answer
    this.screenShake();
    this.playErrorSound();

    // Speak hint
    if (this.voiceController.tts) {
      this.voiceController.speak("Try again! " + getProblemText(this.currentProblem, this.problemType));
    }
  }

  createCelebration() {
    // Create fireworks effect
    const particleSystem = new BABYLON.ParticleSystem("celebration", 500, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADVJREFUeNpi/P//PwMDAwMj42AGLiBkgQimgQgQg3ARIKaECCCDKSCCSWATE4hoRhYABBgAWXkI7qorXVEAAAAASUVORK5CYII=", this.scene);
    
    particleSystem.emitter = new BABYLON.Vector3(0, 2, 0);
    particleSystem.minEmitBox = new BABYLON.Vector3(-2, 0, -2);
    particleSystem.maxEmitBox = new BABYLON.Vector3(2, 0, 2);
    
    particleSystem.color1 = new BABYLON.Color4(1, 0, 0, 1);
    particleSystem.color2 = new BABYLON.Color4(0, 1, 0, 1);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 1, 0);
    
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;
    
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 2;
    
    particleSystem.emitRate = 200;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    
    particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);
    
    particleSystem.direction1 = new BABYLON.Vector3(-3, 8, -3);
    particleSystem.direction2 = new BABYLON.Vector3(3, 10, 3);
    
    particleSystem.minEmitPower = 3;
    particleSystem.maxEmitPower = 7;
    
    particleSystem.start();
    
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 3000);
    }, 500);
  }

  screenShake() {
    const originalPos = this.camera.position.clone();
    let shakeTime = 0;
    const shakeAnimation = this.scene.registerBeforeRender(() => {
      shakeTime += 0.05;
      if (shakeTime < 1) {
        this.camera.position.x = originalPos.x + (Math.random() - 0.5) * 0.3;
        this.camera.position.y = originalPos.y + (Math.random() - 0.5) * 0.3;
      } else {
        this.camera.position = originalPos;
        this.scene.unregisterBeforeRender(shakeAnimation);
      }
    });
  }

  playSuccessSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
    
    notes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.5);
      
      oscillator.start(audioContext.currentTime + i * 0.1);
      oscillator.stop(audioContext.currentTime + i * 0.1 + 0.5);
    });
  }

  playErrorSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }

  updateScore() {
    const ctx = this.scoreTexture.getContext();
    ctx.clearRect(0, 0, 256, 96);
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "gold";
    ctx.textAlign = "center";
    ctx.fillText(`Score: ${this.score}`, 128, 35);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#aaffaa";
    ctx.fillText(`Level ${this.level}`, 128, 60);
    ctx.fillText(`XP: ${this.xp}`, 128, 85);
    this.scoreTexture.update();
  }

  levelComplete() {
    if (this.voiceController.tts) {
      this.voiceController.speak(`Wonderful! You completed level ${this.level} math! You're becoming a math wizard!`);
    }
    
    this.level++;
    this.saveProgress();
    
    // Could transition to next level or return to menu
  }

  saveProgress() {
    const progress = {
      level: this.level,
      score: this.score,
      xp: this.xp,
      problemType: this.problemType,
      lastPlayed: new Date().toISOString()
    };
    localStorage.setItem('gwenGalaxy_math', JSON.stringify(progress));
  }

  loadProgress() {
    const saved = localStorage.getItem('gwenGalaxy_math');
    if (saved) {
      const progress = JSON.parse(saved);
      this.level = progress.level || 1;
      this.score = progress.score || 0;
      this.xp = progress.xp || 0;
      this.problemType = progress.problemType || 'addition';
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

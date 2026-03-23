import * as BABYLON from '@babylonjs/core';

export class StoryScene {
  constructor(engine, voiceController) {
    this.engine = engine;
    this.voiceController = voiceController;
    this.scene = null;
    this.camera = null;
    this.stella = null;
    this.storyChapter = 1;
    this.storyText = '';
    this.isNarrating = false;
  }

  async createScene() {
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0.1, 1);

    // Camera
    this.camera = new BABYLON.UniversalCamera("storyCam", new BABYLON.Vector3(0, 3, -8), this.scene);
    this.camera.setTarget(new BABYLON.Vector3(0, 1, 0));

    // Cinematic lighting
    const light1 = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), this.scene);
    light1.intensity = 0.4;
    light1.diffuse = new BABYLON.Color3(0.5, 0.5, 0.7);
    
    const spotLight = new BABYLON.SpotLight("spot", 
      new BABYLON.Vector3(0, 10, -5), 
      new BABYLON.Vector3(0, -1, 0.5), 
      Math.PI / 3, 2, this.scene);
    spotLight.diffuse = new BABYLON.Color3(1, 0.9, 0.8);
    spotLight.intensity = 0.8;

    // Create story environment
    this.createStoryEnvironment();

    // Create Stella
    this.createStella();

    // Create story UI
    this.createStoryUI();

    // Start story
    this.startStory();

    return this.scene;
  }

  createStoryEnvironment() {
    // Create a magical space library setting
    
    // Floor with starry pattern
    const floor = BABYLON.MeshBuilder.CreateGround("floor", {width: 30, height: 30}, this.scene);
    const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.2);
    floorMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    
    // Add stars to floor texture
    const floorTexture = new BABYLON.DynamicTexture("floorTex", {width: 512, height: 512}, this.scene);
    const ctx = floorTexture.getContext();
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, 512, 512);
    
    // Draw random stars
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    floorTexture.update();
    floorMat.diffuseTexture = floorTexture;
    floor.material = floorMat;

    // Floating books
    for (let i = 0; i < 10; i++) {
      const book = BABYLON.MeshBuilder.CreateBox(`book${i}`, {width: 0.3, height: 0.5, depth: 0.7}, this.scene);
      book.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 15,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 10
      );
      book.rotation = new BABYLON.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      const bookMat = new BABYLON.StandardMaterial(`bookMat${i}`, this.scene);
      bookMat.diffuseColor = new BABYLON.Color3(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.2,
        Math.random() * 0.5 + 0.3
      );
      bookMat.emissiveColor = bookMat.diffuseColor.scale(0.2);
      book.material = bookMat;

      // Float animation
      this.scene.registerBeforeRender(() => {
        book.position.y += Math.sin(Date.now() * 0.001 + i) * 0.005;
        book.rotation.y += 0.003;
      });
    }

    // Crystal formations
    for (let i = 0; i < 5; i++) {
      const crystal = BABYLON.MeshBuilder.CreateCylinder(`crystal${i}`, 
        {height: 2 + Math.random() * 2, diameterTop: 0, diameterBottom: 0.5 + Math.random() * 0.5}, 
        this.scene);
      crystal.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 20,
        1,
        (Math.random() - 0.5) * 15
      );
      
      const crystalMat = new BABYLON.StandardMaterial(`crystalMat${i}`, this.scene);
      crystalMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.8);
      crystalMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.5);
      crystalMat.specularColor = new BABYLON.Color3(1, 0.8, 1);
      crystalMat.alpha = 0.8;
      crystal.material = crystalMat;

      // Glow animation
      this.scene.registerBeforeRender(() => {
        crystalMat.emissiveColor.r = 0.3 + Math.sin(Date.now() * 0.002 + i) * 0.2;
      });
    }

    // Magical particles
    const particleSystem = new BABYLON.ParticleSystem("magic", 1000, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADVJREFUeNpi/P//PwMDAwMj42AGLiBkgQimgQgQg3ARIKaECCCDKSCCSWATE4hoRhYABBgAWXkI7qorXVEAAAAASUVORK5CYII=", this.scene);
    
    particleSystem.emitter = new BABYLON.Vector3(0, 5, 0);
    particleSystem.minEmitBox = new BABYLON.Vector3(-10, -2, -10);
    particleSystem.maxEmitBox = new BABYLON.Vector3(10, 2, 10);
    
    particleSystem.color1 = new BABYLON.Color4(0.7, 0.3, 1, 1);
    particleSystem.color2 = new BABYLON.Color4(0.3, 0.5, 1, 1);
    
    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;
    
    particleSystem.minLifeTime = 3;
    particleSystem.maxLifeTime = 8;
    
    particleSystem.emitRate = 50;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    
    particleSystem.gravity = new BABYLON.Vector3(0, -0.05, 0);
    
    particleSystem.direction1 = new BABYLON.Vector3(-0.2, 1, -0.2);
    particleSystem.direction2 = new BABYLON.Vector3(0.2, 1, 0.2);
    
    particleSystem.minEmitPower = 0.1;
    particleSystem.maxEmitPower = 0.3;
    
    particleSystem.start();
  }

  createStella() {
    // Create Stella with more detail for story mode
    this.stella = BABYLON.MeshBuilder.CreateSphere("stella", {diameter: 2.5}, this.scene);
    this.stella.position = new BABYLON.Vector3(0, 1.5, 0);
    
    const stellaMat = new BABYLON.StandardMaterial("stellaMat", this.scene);
    stellaMat.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.9);
    stellaMat.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.4);
    stellaMat.specularColor = new BABYLON.Color3(0.9, 0.7, 1);
    this.stella.material = stellaMat;

    // Cat features
    const ear1 = BABYLON.MeshBuilder.CreateCylinder("ear1", {height: 1, diameterTop: 0, diameterBottom: 0.6}, this.scene);
    ear1.parent = this.stella;
    ear1.position = new BABYLON.Vector3(-0.5, 1, 0);
    ear1.material = stellaMat;

    const ear2 = BABYLON.MeshBuilder.CreateCylinder("ear2", {height: 1, diameterTop: 0, diameterBottom: 0.6}, this.scene);
    ear2.parent = this.stella;
    ear2.position = new BABYLON.Vector3(0.5, 1, 0);
    ear2.material = stellaMat;

    // Eyes with glow
    const eyeMat = new BABYLON.StandardMaterial("eyeMat", this.scene);
    eyeMat.emissiveColor = new BABYLON.Color3(0.5, 0.8, 1);
    
    const eye1 = BABYLON.MeshBuilder.CreateSphere("eye1", {diameter: 0.4}, this.scene);
    eye1.parent = this.stella;
    eye1.position = new BABYLON.Vector3(-0.35, 0.3, -1);
    eye1.material = eyeMat;

    const eye2 = BABYLON.MeshBuilder.CreateSphere("eye2", {diameter: 0.4}, this.scene);
    eye2.parent = this.stella;
    eye2.position = new BABYLON.Vector3(0.35, 0.3, -1);
    eye2.material = eyeMat;

    // Magical collar
    const collar = BABYLON.MeshBuilder.CreateTorus("collar", {diameter: 2.6, thickness: 0.1}, this.scene);
    collar.parent = this.stella;
    collar.position.y = -0.5;
    const collarMat = new BABYLON.StandardMaterial("collarMat", this.scene);
    collarMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.2);
    collarMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.1);
    collar.material = collarMat;

    // Tail
    const tail = BABYLON.MeshBuilder.CreateCylinder("tail", {height: 2, diameterTop: 0.1, diameterBottom: 0.4}, this.scene);
    tail.parent = this.stella;
    tail.position = new BABYLON.Vector3(0, -0.5, 1);
    tail.rotation.z = -Math.PI / 4;
    tail.material = stellaMat;

    // Story animation
    this.animateStella();
  }

  animateStella() {
    // Gentle floating and rotation
    this.scene.registerBeforeRender(() => {
      this.stella.position.y = 1.5 + Math.sin(Date.now() * 0.001) * 0.3;
      this.stella.rotation.y += 0.003;
      
      // Eye glow pulse
      const eyeMat = this.scene.getMaterialByName("eyeMat");
      if (eyeMat) {
        eyeMat.emissiveColor.b = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
      }
    });
  }

  createStoryUI() {
    // Story text display
    this.storyPanel = BABYLON.MeshBuilder.CreatePlane("storyPanel", {width: 12, height: 3}, this.scene);
    this.storyPanel.position = new BABYLON.Vector3(0, -1, 5);
    
    const storyTexture = new BABYLON.DynamicTexture("storyTexture", {width: 1024, height: 256}, this.scene);
    this.storyTexture = storyTexture;
    const storyMat = new BABYLON.StandardMaterial("storyMat", this.scene);
    storyMat.diffuseTexture = storyTexture;
    storyMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    storyMat.disableLighting = true;
    storyMat.alpha = 0.9;
    this.storyPanel.material = storyMat;

    // Chapter display
    this.chapterDisplay = BABYLON.MeshBuilder.CreatePlane("chapterDisplay", {width: 6, height: 1}, this.scene);
    this.chapterDisplay.position = new BABYLON.Vector3(0, 4, 3);
    
    const chapterTexture = new BABYLON.DynamicTexture("chapterTexture", {width: 512, height: 128}, this.scene);
    this.chapterTexture = chapterTexture;
    const chapterMat = new BABYLON.StandardMaterial("chapterMat", this.scene);
    chapterMat.diffuseTexture = chapterTexture;
    chapterMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    chapterMat.disableLighting = true;
    this.chapterDisplay.material = chapterMat;
  }

  startStory() {
    this.loadChapter(this.storyChapter);
  }

  loadChapter(chapter) {
    const stories = {
      1: {
        title: "The Lost Star",
        text: "Hello, young explorer! I'm Stella, the Space Cat. I need your help! A precious star from our galaxy has gone missing. We must travel through the cosmos to find it. Are you ready for an amazing adventure?",
        action: "Say 'Yes' to begin our journey!"
      },
      2: {
        title: "The Crystal Caves",
        text: "We've arrived at the Crystal Caves of Neptune! The star's trail leads here. These caves are full of mathematical puzzles. Each crystal holds a number secret. Can you help me solve them?",
        action: "Say 'Explore' to enter the caves!"
      },
      3: {
        title: "The Word Nebula",
        text: "Amazing! We've discovered the Word Nebula! Here, letters float like stardust, forming magical words. The star left a message for us, but it's scrambled! We need to spell words correctly to decode it.",
        action: "Say 'Decode' to start!"
      },
      4: {
        title: "The Asteroid Belt Challenge",
        text: "We're getting closer! But oh no - an asteroid belt blocks our path! We need to count the safe asteroids and calculate the best route through. Your math skills will guide us to safety!",
        action: "Say 'Navigate' to plot our course!"
      },
      5: {
        title: "The Star's Secret",
        text: "We found it! The lost star was hiding because it felt dim compared to others. But you've shown that every star - just like every student - shines in their own special way. Thank you for this adventure, my friend!",
        action: "Say 'Celebrate' to complete our journey!"
      }
    };

    const currentStory = stories[chapter] || stories[1];
    this.currentChapter = currentStory;

    // Update chapter display
    const ctx = this.chapterTexture.getContext();
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "gold";
    ctx.textAlign = "center";
    ctx.fillText(`Chapter ${chapter}: ${currentStory.title}`, 256, 80);
    this.chapterTexture.update();

    // Update story text
    this.updateStoryText(currentStory.text);

    // Narrate the story
    this.narrateStory(currentStory);
  }

  updateStoryText(text) {
    const ctx = this.storyTexture.getContext();
    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = "24px Arial";
    ctx.fillStyle = "white";
    
    // Word wrap
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > 900 && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    // Draw lines
    lines.forEach((line, i) => {
      ctx.fillText(line, 50, 40 + i * 30);
    });

    this.storyTexture.update();
  }

  narrateStory(story) {
    if (this.voiceController.tts && !this.isNarrating) {
      this.isNarrating = true;
      const fullNarration = story.text + " " + story.action;
      this.voiceController.speak(fullNarration);
      
      // Setup voice commands
      this.setupVoiceCommands();
      
      setTimeout(() => {
        this.isNarrating = false;
      }, 5000);
    }
  }

  setupVoiceCommands() {
    if (this.voiceController) {
      this.voiceController.onResult = (transcript) => {
        const command = transcript.toLowerCase();
        
        if (command.includes('yes') || command.includes('explore') || 
            command.includes('decode') || command.includes('navigate') || 
            command.includes('celebrate') || command.includes('next')) {
          this.nextChapter();
        } else if (command.includes('repeat')) {
          this.narrateStory(this.currentChapter);
        } else if (command.includes('back') || command.includes('previous')) {
          this.previousChapter();
        }
      };

      this.voiceController.startContinuous();
    }
  }

  nextChapter() {
    if (this.storyChapter < 5) {
      this.storyChapter++;
      this.loadChapter(this.storyChapter);
      
      // Save progress
      this.saveProgress();
      
      // Visual transition
      this.createTransition();
    } else {
      // Story complete
      this.storyComplete();
    }
  }

  previousChapter() {
    if (this.storyChapter > 1) {
      this.storyChapter--;
      this.loadChapter(this.storyChapter);
    }
  }

  createTransition() {
    // Sparkle effect for chapter transition
    const particleSystem = new BABYLON.ParticleSystem("transition", 200, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADVJREFUeNpi/P//PwMDAwMj42AGLiBkgQimgQgQg3ARIKaECCCDKSCCSWATE4hoRhYABBgAWXkI7qorXVEAAAAASUVORK5CYII=", this.scene);
    
    particleSystem.emitter = this.stella.position.clone();
    particleSystem.color1 = new BABYLON.Color4(1, 0.8, 1, 1);
    particleSystem.color2 = new BABYLON.Color4(0.8, 0.6, 1, 1);
    
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;
    
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 2;
    
    particleSystem.emitRate = 100;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-2, 2, -2);
    particleSystem.direction2 = new BABYLON.Vector3(2, 4, 2);
    
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    
    particleSystem.start();
    
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 2000);
    }, 500);
  }

  storyComplete() {
    if (this.voiceController.tts) {
      this.voiceController.speak("Congratulations! You've completed Stella's adventure! You're a true Space Explorer now! Come back soon for more adventures!");
    }
    
    // Big celebration
    this.createCelebration();
    
    // Save completion
    this.saveProgress();
  }

  createCelebration() {
    // Multiple particle systems for big celebration
    for (let i = 0; i < 3; i++) {
      const particleSystem = new BABYLON.ParticleSystem(`celebrate${i}`, 300, this.scene);
      particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVRlYWR5ccllPAAAADVJREFUeNpi/P//PwMDAwMj42AGLiBkgQimgQgQg3ARIKaECCCDKSCCSWATE4hoRhYABBgAWXkI7qorXVEAAAAASUVORK5CYII=", this.scene);
      
      particleSystem.emitter = new BABYLON.Vector3((i - 1) * 5, 3, 0);
      
      particleSystem.color1 = new BABYLON.Color4(Math.random(), Math.random(), Math.random(), 1);
      particleSystem.color2 = new BABYLON.Color4(Math.random(), Math.random(), Math.random(), 1);
      
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.5;
      
      particleSystem.minLifeTime = 2;
      particleSystem.maxLifeTime = 4;
      
      particleSystem.emitRate = 100;
      particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
      
      particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);
      particleSystem.direction1 = new BABYLON.Vector3(-2, 5, -2);
      particleSystem.direction2 = new BABYLON.Vector3(2, 10, 2);
      
      particleSystem.minEmitPower = 3;
      particleSystem.maxEmitPower = 8;
      
      particleSystem.start();
      
      setTimeout(() => {
        particleSystem.stop();
        setTimeout(() => particleSystem.dispose(), 5000);
      }, 2000);
    }
  }

  saveProgress() {
    const progress = {
      chapter: this.storyChapter,
      completed: this.storyChapter === 5,
      lastPlayed: new Date().toISOString()
    };
    localStorage.setItem('gwenGalaxy_story', JSON.stringify(progress));
  }

  loadProgress() {
    const saved = localStorage.getItem('gwenGalaxy_story');
    if (saved) {
      const progress = JSON.parse(saved);
      this.storyChapter = progress.chapter || 1;
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

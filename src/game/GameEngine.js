import * as BABYLON from '@babylonjs/core';
import { MainMenu } from './scenes/MainMenu';
import { SpellingScene } from './scenes/SpellingScene';
import { MathScene } from './scenes/MathScene';
import { StoryScene } from './scenes/StoryScene';
import { AchievementScene } from './scenes/AchievementScene';
import { VoiceController } from './voice/VoiceController';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = null;
    this.currentScene = null;
    this.currentSceneInstance = null;
    this.voiceController = null;
    this.gameState = this.loadGameState();
  }

  async initialize() {
    // Create Babylon.js engine
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });

    // Handle resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    // Initialize voice controller
    this.voiceController = new VoiceController();
    await this.voiceController.init();

    // Load main menu
    await this.loadMainMenu();

    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.currentScene) {
        this.currentScene.render();
      }
    });

    // Handle keyboard input
    this.setupInputHandlers();

    return true;
  }

  setupInputHandlers() {
    window.addEventListener('keydown', (evt) => {
      // Handle menu navigation
      if (this.currentSceneInstance instanceof MainMenu) {
        switch(evt.key) {
          case 'ArrowUp':
            this.currentSceneInstance.navigateUp();
            break;
          case 'ArrowDown':
            this.currentSceneInstance.navigateDown();
            break;
          case 'Enter':
            this.currentSceneInstance.selectOption();
            break;
        }
      }
      
      // Global controls
      switch(evt.key) {
        case 'Escape':
          if (!(this.currentSceneInstance instanceof MainMenu)) {
            this.loadMainMenu();
          }
          break;
        case 'p':
        case 'P':
          this.togglePause();
          break;
        case 'm':
        case 'M':
          this.toggleMusic();
          break;
      }
    });
  }

  async loadMainMenu() {
    this.disposeCurrentScene();
    
    const menu = new MainMenu(this.engine);
    menu.onMenuSelect = (option) => {
      this.handleMenuSelection(option);
    };
    
    this.currentScene = await menu.createScene();
    this.currentSceneInstance = menu;
  }

  handleMenuSelection(option) {
    switch(option) {
      case 'Start Game':
        this.showGameModeSelection();
        break;
      case 'Parent Dashboard':
        this.loadParentDashboard();
        break;
      case 'Achievements':
        this.loadAchievements();
        break;
      case 'Settings':
        this.loadSettings();
        break;
    }
  }

  showGameModeSelection() {
    // Create a simple mode selection overlay
    const modes = ['Spelling Adventure', 'Math Quest', 'Story Time'];
    
    // For now, we'll directly load spelling scene
    // In a full implementation, this would show a mode selection UI
    this.loadSpellingScene();
  }

  async loadSpellingScene() {
    this.disposeCurrentScene();
    
    const spelling = new SpellingScene(this.engine, this.voiceController);
    this.currentScene = await spelling.createScene();
    this.currentSceneInstance = spelling;
  }

  async loadMathScene() {
    this.disposeCurrentScene();
    
    const math = new MathScene(this.engine, this.voiceController);
    this.currentScene = await math.createScene();
    this.currentSceneInstance = math;
  }

  async loadStoryScene() {
    this.disposeCurrentScene();
    
    const story = new StoryScene(this.engine, this.voiceController);
    this.currentScene = await story.createScene();
    this.currentSceneInstance = story;
  }

  async loadAchievements() {
    this.disposeCurrentScene();
    
    const achievements = new AchievementScene(this.engine);
    this.currentScene = await achievements.createScene();
    this.currentSceneInstance = achievements;
  }

  loadParentDashboard() {
    // Create parent dashboard UI
    this.disposeCurrentScene();
    
    // Create a simple dashboard scene
    const scene = new BABYLON.Scene(this.engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1);
    
    const camera = new BABYLON.UniversalCamera("dashCam", new BABYLON.Vector3(0, 0, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    
    // Dashboard title
    const titlePlane = BABYLON.MeshBuilder.CreatePlane("title", {width: 10, height: 2}, scene);
    titlePlane.position.y = 3;
    
    const titleTexture = new BABYLON.DynamicTexture("titleTex", {width: 1024, height: 256}, scene);
    const ctx = titleTexture.getContext();
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Parent Dashboard", 512, 150);
    titleTexture.update();
    
    const titleMat = new BABYLON.StandardMaterial("titleMat", scene);
    titleMat.diffuseTexture = titleTexture;
    titleMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    titleMat.disableLighting = true;
    titlePlane.material = titleMat;
    
    // Stats
    const stats = this.getPlayerStats();
    const statsPlane = BABYLON.MeshBuilder.CreatePlane("stats", {width: 12, height: 6}, scene);
    
    const statsTexture = new BABYLON.DynamicTexture("statsTex", {width: 1024, height: 512}, scene);
    const statsCtx = statsTexture.getContext();
    statsCtx.font = "32px Arial";
    statsCtx.fillStyle = "#aaffaa";
    
    let y = 50;
    for (const [key, value] of Object.entries(stats)) {
      statsCtx.fillText(`${key}: ${value}`, 100, y);
      y += 50;
    }
    
    statsTexture.update();
    
    const statsMat = new BABYLON.StandardMaterial("statsMat", scene);
    statsMat.diffuseTexture = statsTexture;
    statsMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    statsMat.disableLighting = true;
    statsPlane.material = statsMat;
    
    this.currentScene = scene;
  }

  loadSettings() {
    // Settings would go here
    console.log("Settings not yet implemented");
  }

  getPlayerStats() {
    const stats = {
      "Total Play Time": this.gameState.totalPlayTime || "0 minutes",
      "Words Mastered": this.gameState.wordsMastered || 0,
      "Math Problems Solved": this.gameState.mathSolved || 0,
      "Current Level": this.gameState.level || 1,
      "Total XP": this.gameState.totalXP || 0,
      "Achievements Unlocked": this.gameState.achievementsCount || 0,
      "Daily Streak": this.gameState.dailyStreak || 0
    };
    return stats;
  }

  disposeCurrentScene() {
    if (this.currentSceneInstance && this.currentSceneInstance.dispose) {
      this.currentSceneInstance.dispose();
    }
    if (this.currentScene) {
      this.currentScene.dispose();
    }
    this.currentScene = null;
    this.currentSceneInstance = null;
  }

  togglePause() {
    if (this.engine.isPointerLock) {
      document.exitPointerLock();
    }
    // Pause logic would go here
  }

  toggleMusic() {
    // Music toggle would go here
    this.gameState.musicEnabled = !this.gameState.musicEnabled;
    this.saveGameState();
  }

  loadGameState() {
    const saved = localStorage.getItem('gwenGalaxy_gameState');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      level: 1,
      totalXP: 0,
      wordsMastered: 0,
      mathSolved: 0,
      totalPlayTime: 0,
      achievementsCount: 0,
      dailyStreak: 0,
      musicEnabled: true,
      soundEnabled: true,
      lastPlayed: new Date().toISOString()
    };
  }

  saveGameState() {
    localStorage.setItem('gwenGalaxy_gameState', JSON.stringify(this.gameState));
  }

  dispose() {
    this.disposeCurrentScene();
    
    if (this.voiceController) {
      this.voiceController.dispose();
    }
    
    if (this.engine) {
      this.engine.dispose();
    }
  }
}
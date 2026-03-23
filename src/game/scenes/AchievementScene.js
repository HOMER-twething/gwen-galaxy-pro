import * as BABYLON from '@babylonjs/core';

export class AchievementScene {
  constructor(engine) {
    this.engine = engine;
    this.scene = null;
    this.camera = null;
    this.achievements = [];
    this.trophies = [];
  }

  async createScene() {
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.05, 0.02, 0.1, 1);

    // Camera
    this.camera = new BABYLON.ArcRotateCamera("achievementCam", 
      Math.PI / 2, Math.PI / 3, 15, 
      BABYLON.Vector3.Zero(), this.scene);
    this.camera.attachControl();

    // Lighting
    const light1 = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), this.scene);
    light1.intensity = 0.6;
    light1.diffuse = new BABYLON.Color3(0.8, 0.8, 1);

    // Spotlight for trophies
    const spotLight = new BABYLON.SpotLight("spot",
      new BABYLON.Vector3(0, 10, 0),
      new BABYLON.Vector3(0, -1, 0),
      Math.PI / 2, 2, this.scene);
    spotLight.diffuse = new BABYLON.Color3(1, 0.9, 0.7);
    spotLight.intensity = 1;

    // Create trophy room
    this.createTrophyRoom();

    // Load achievements
    this.loadAchievements();

    // Display trophies
    this.displayTrophies();

    // Create UI
    this.createUI();

    return this.scene;
  }

  createTrophyRoom() {
    // Floor
    const floor = BABYLON.MeshBuilder.CreateGround("floor", {width: 30, height: 30}, this.scene);
    const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.2, 0.15, 0.3);
    floorMat.specularColor = new BABYLON.Color3(0.3, 0.2, 0.4);
    
    // Marble texture
    const marbleTexture = new BABYLON.DynamicTexture("marble", {width: 512, height: 512}, this.scene);
    const ctx = marbleTexture.getContext();
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#2a1a3e');
    gradient.addColorStop(0.5, '#3d2554');
    gradient.addColorStop(1, '#2a1a3e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    marbleTexture.update();
    floorMat.diffuseTexture = marbleTexture;
    floor.material = floorMat;

    // Walls
    const wallHeight = 10;
    const wallThickness = 0.5;
    
    // Back wall
    const backWall = BABYLON.MeshBuilder.CreateBox("backWall", 
      {width: 30, height: wallHeight, depth: wallThickness}, this.scene);
    backWall.position.z = 15;
    backWall.position.y = wallHeight / 2;
    
    const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.15, 0.1, 0.25);
    wallMat.specularColor = new BABYLON.Color3(0.2, 0.15, 0.3);
    backWall.material = wallMat;

    // Side walls
    const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", 
      {width: wallThickness, height: wallHeight, depth: 30}, this.scene);
    leftWall.position.x = -15;
    leftWall.position.y = wallHeight / 2;
    leftWall.material = wallMat;

    const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", 
      {width: wallThickness, height: wallHeight, depth: 30}, this.scene);
    rightWall.position.x = 15;
    rightWall.position.y = wallHeight / 2;
    rightWall.material = wallMat;

    // Display shelves
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        const shelf = BABYLON.MeshBuilder.CreateBox(`shelf_${i}_${j}`, 
          {width: 4, height: 0.2, depth: 1}, this.scene);
        shelf.position.x = (j - 2) * 5;
        shelf.position.y = 2 + i * 2.5;
        shelf.position.z = 12;
        
        const shelfMat = new BABYLON.StandardMaterial(`shelfMat_${i}_${j}`, this.scene);
        shelfMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        shelfMat.specularColor = new BABYLON.Color3(0.5, 0.4, 0.3);
        shelf.material = shelfMat;
      }
    }

    // Pillars
    for (let i = 0; i < 4; i++) {
      const pillar = BABYLON.MeshBuilder.CreateCylinder(`pillar${i}`, 
        {height: wallHeight, diameter: 1}, this.scene);
      pillar.position.x = i < 2 ? -12 : 12;
      pillar.position.z = i % 2 === 0 ? -12 : 12;
      pillar.position.y = wallHeight / 2;
      
      const pillarMat = new BABYLON.StandardMaterial(`pillarMat${i}`, this.scene);
      pillarMat.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.4);
      pillarMat.specularColor = new BABYLON.Color3(0.4, 0.35, 0.5);
      pillar.material = pillarMat;
    }

    // Ceiling with stars
    const ceiling = BABYLON.MeshBuilder.CreateGround("ceiling", {width: 30, height: 30}, this.scene);
    ceiling.position.y = wallHeight;
    ceiling.rotation.x = Math.PI;
    
    const ceilingMat = new BABYLON.StandardMaterial("ceilingMat", this.scene);
    const ceilingTexture = new BABYLON.DynamicTexture("stars", {width: 512, height: 512}, this.scene);
    const ceilCtx = ceilingTexture.getContext();
    ceilCtx.fillStyle = "#0a0520";
    ceilCtx.fillRect(0, 0, 512, 512);
    
    // Add stars
    for (let i = 0; i < 200; i++) {
      ceilCtx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
      ceilCtx.beginPath();
      ceilCtx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 2, 0, Math.PI * 2);
      ceilCtx.fill();
    }
    ceilingTexture.update();
    ceilingMat.diffuseTexture = ceilingTexture;
    ceilingMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.2);
    ceiling.material = ceilingMat;
  }

  loadAchievements() {
    // Define all achievements
    this.achievementList = [
      // Spelling achievements
      { id: 'first_word', name: 'First Word', description: 'Spell your first word correctly', icon: '📝', unlocked: false, xp: 10 },
      { id: 'spelling_streak_5', name: 'Spelling Streak', description: 'Spell 5 words in a row', icon: '🔥', unlocked: false, xp: 25 },
      { id: 'spelling_master', name: 'Spelling Master', description: 'Complete all spelling levels', icon: '🏆', unlocked: false, xp: 100 },
      { id: 'perfect_spelling', name: 'Perfect Speller', description: 'Spell 10 words without mistakes', icon: '⭐', unlocked: false, xp: 50 },
      { id: 'speed_speller', name: 'Speed Speller', description: 'Spell a word in under 5 seconds', icon: '⚡', unlocked: false, xp: 30 },
      
      // Math achievements
      { id: 'first_sum', name: 'First Sum', description: 'Solve your first addition problem', icon: '➕', unlocked: false, xp: 10 },
      { id: 'math_streak_5', name: 'Math Streak', description: 'Solve 5 problems in a row', icon: '🔢', unlocked: false, xp: 25 },
      { id: 'counting_star', name: 'Counting Star', description: 'Count to 20 correctly', icon: '🌟', unlocked: false, xp: 20 },
      { id: 'subtraction_hero', name: 'Subtraction Hero', description: 'Master subtraction problems', icon: '➖', unlocked: false, xp: 30 },
      { id: 'pattern_finder', name: 'Pattern Finder', description: 'Complete all pattern challenges', icon: '🔄', unlocked: false, xp: 40 },
      
      // Story achievements
      { id: 'story_listener', name: 'Story Listener', description: 'Complete your first story chapter', icon: '📖', unlocked: false, xp: 15 },
      { id: 'adventure_complete', name: 'Adventure Complete', description: 'Finish Stella\'s adventure', icon: '🚀', unlocked: false, xp: 75 },
      { id: 'voice_commander', name: 'Voice Commander', description: 'Use voice commands 50 times', icon: '🎤', unlocked: false, xp: 35 },
      
      // Progress achievements
      { id: 'daily_player', name: 'Daily Player', description: 'Play 7 days in a row', icon: '📅', unlocked: false, xp: 50 },
      { id: 'xp_collector_100', name: 'XP Collector', description: 'Earn 100 XP total', icon: '💎', unlocked: false, xp: 25 },
      { id: 'xp_collector_500', name: 'XP Master', description: 'Earn 500 XP total', icon: '💰', unlocked: false, xp: 50 },
      { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '🌠', unlocked: false, xp: 40 },
      { id: 'level_10', name: 'Galaxy Explorer', description: 'Reach level 10', icon: '🌌', unlocked: false, xp: 100 },
      
      // Special achievements
      { id: 'early_bird', name: 'Early Bird', description: 'Play before 8 AM', icon: '🌅', unlocked: false, xp: 20 },
      { id: 'night_owl', name: 'Night Owl', description: 'Play after 8 PM', icon: '🦉', unlocked: false, xp: 20 },
      { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Play on Saturday and Sunday', icon: '⚔️', unlocked: false, xp: 30 },
      { id: 'perfect_day', name: 'Perfect Day', description: 'Complete all activities in one day', icon: '🌞', unlocked: false, xp: 60 },
      { id: 'comeback_kid', name: 'Comeback Kid', description: 'Return after a week away', icon: '🔄', unlocked: false, xp: 25 },
      { id: 'super_learner', name: 'Super Learner', description: 'Unlock 25 achievements', icon: '🎓', unlocked: false, xp: 150 }
    ];

    // Load unlocked achievements from localStorage
    const saved = localStorage.getItem('gwenGalaxy_achievements');
    if (saved) {
      const unlockedIds = JSON.parse(saved);
      this.achievementList.forEach(achievement => {
        if (unlockedIds.includes(achievement.id)) {
          achievement.unlocked = true;
        }
      });
    }

    this.achievements = this.achievementList;
  }

  displayTrophies() {
    let trophyIndex = 0;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        if (trophyIndex < this.achievements.length) {
          const achievement = this.achievements[trophyIndex];
          const position = new BABYLON.Vector3(
            (j - 2) * 5,
            2.5 + i * 2.5,
            11
          );
          
          this.createTrophy(achievement, position, trophyIndex);
          trophyIndex++;
        }
      }
    }
  }

  createTrophy(achievement, position, index) {
    // Trophy base
    const base = BABYLON.MeshBuilder.CreateCylinder(`base${index}`, 
      {height: 0.3, diameter: 1}, this.scene);
    base.position = position.clone();
    base.position.y -= 0.5;
    
    const baseMat = new BABYLON.StandardMaterial(`baseMat${index}`, this.scene);
    
    if (achievement.unlocked) {
      // Gold for unlocked
      baseMat.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.2);
      baseMat.emissiveColor = new BABYLON.Color3(0.4, 0.3, 0.1);
      baseMat.specularColor = new BABYLON.Color3(1, 0.8, 0.4);
    } else {
      // Gray for locked
      baseMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
      baseMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      baseMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    }
    base.material = baseMat;

    // Trophy cup or icon
    let trophy;
    if (achievement.unlocked) {
      // Create a cup shape
      trophy = BABYLON.MeshBuilder.CreateLathe(`trophy${index}`, {
        shape: [
          new BABYLON.Vector3(0, 0, 0),
          new BABYLON.Vector3(0.3, 0, 0),
          new BABYLON.Vector3(0.35, 0.2, 0),
          new BABYLON.Vector3(0.3, 0.5, 0),
          new BABYLON.Vector3(0.4, 0.6, 0),
          new BABYLON.Vector3(0.4, 0.7, 0),
          new BABYLON.Vector3(0.2, 0.8, 0),
          new BABYLON.Vector3(0, 0.8, 0)
        ],
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      }, this.scene);
      
      trophy.position = position.clone();
      trophy.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
      
      const trophyMat = new BABYLON.StandardMaterial(`trophyMat${index}`, this.scene);
      trophyMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.3);
      trophyMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.15);
      trophyMat.specularColor = new BABYLON.Color3(1, 0.9, 0.5);
      trophy.material = trophyMat;

      // Rotation animation for unlocked trophies
      this.scene.registerBeforeRender(() => {
        trophy.rotation.y += 0.01;
      });
    } else {
      // Lock icon for locked achievements
      trophy = BABYLON.MeshBuilder.CreateBox(`lock${index}`, {size: 0.6}, this.scene);
      trophy.position = position.clone();
      
      const lockMat = new BABYLON.StandardMaterial(`lockMat${index}`, this.scene);
      lockMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
      lockMat.emissiveColor = new BABYLON.Color3(0.15, 0.15, 0.15);
      trophy.material = lockMat;
    }

    // Name plate
    const namePlate = BABYLON.MeshBuilder.CreatePlane(`name${index}`, {width: 2, height: 0.5}, this.scene);
    namePlate.position = position.clone();
    namePlate.position.y -= 1;
    namePlate.position.z -= 0.5;
    
    const nameTexture = new BABYLON.DynamicTexture(`nameTex${index}`, {width: 256, height: 64}, this.scene);
    const ctx = nameTexture.getContext();
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = achievement.unlocked ? "gold" : "#666";
    ctx.textAlign = "center";
    ctx.fillText(achievement.name, 128, 35);
    ctx.font = "14px Arial";
    ctx.fillStyle = achievement.unlocked ? "white" : "#444";
    ctx.fillText(achievement.icon + " " + achievement.xp + " XP", 128, 55);
    nameTexture.update();
    
    const nameMat = new BABYLON.StandardMaterial(`nameMat${index}`, this.scene);
    nameMat.diffuseTexture = nameTexture;
    nameMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    nameMat.disableLighting = true;
    namePlate.material = nameMat;

    // Store trophy reference
    this.trophies.push({
      base, trophy, namePlate, achievement
    });
  }

  createUI() {
    // Stats panel
    const statsPanel = BABYLON.MeshBuilder.CreatePlane("stats", {width: 8, height: 3}, this.scene);
    statsPanel.position = new BABYLON.Vector3(0, 8, 0);
    
    const statsTexture = new BABYLON.DynamicTexture("statsTex", {width: 512, height: 192}, this.scene);
    this.updateStats(statsTexture);
    
    const statsMat = new BABYLON.StandardMaterial("statsMat", this.scene);
    statsMat.diffuseTexture = statsTexture;
    statsMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    statsMat.disableLighting = true;
    statsMat.backFaceCulling = false;
    statsPanel.material = statsMat;
  }

  updateStats(texture) {
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 512, 192);
    
    const unlocked = this.achievements.filter(a => a.unlocked).length;
    const total = this.achievements.length;
    const totalXP = this.achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
    
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "gold";
    ctx.textAlign = "center";
    ctx.fillText("🏆 ACHIEVEMENT HALL 🏆", 256, 50);
    
    ctx.font = "32px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(`Unlocked: ${unlocked}/${total}`, 256, 100);
    
    ctx.fillStyle = "#aaffaa";
    ctx.fillText(`Total XP: ${totalXP}`, 256, 140);
    
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffaaff";
    ctx.fillText("Keep learning to unlock more!", 256, 175);
    
    texture.update();
  }

  checkAchievement(id) {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.saveAchievements();
      this.showAchievementNotification(achievement);
      return true;
    }
    return false;
  }

  showAchievementNotification(achievement) {
    // Create notification popup
    const notification = BABYLON.MeshBuilder.CreatePlane("notification", {width: 6, height: 2}, this.scene);
    notification.position = new BABYLON.Vector3(0, 5, -5);
    
    const notifTexture = new BABYLON.DynamicTexture("notifTex", {width: 512, height: 192}, this.scene);
    const ctx = notifTexture.getContext();
    
    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, 512, 192);
    
    // Border
    ctx.strokeStyle = "gold";
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 502, 182);
    
    // Text
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "gold";
    ctx.textAlign = "center";
    ctx.fillText("🎉 ACHIEVEMENT UNLOCKED! 🎉", 256, 60);
    
    ctx.font = "28px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(achievement.icon + " " + achievement.name, 256, 110);
    
    ctx.font = "20px Arial";
    ctx.fillStyle = "#aaffaa";
    ctx.fillText(achievement.description, 256, 140);
    
    ctx.fillStyle = "gold";
    ctx.fillText("+" + achievement.xp + " XP", 256, 170);
    
    notifTexture.update();
    
    const notifMat = new BABYLON.StandardMaterial("notifMat", this.scene);
    notifMat.diffuseTexture = notifTexture;
    notifMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    notifMat.disableLighting = true;
    notification.material = notifMat;

    // Animate and remove
    let animTime = 0;
    const animation = this.scene.registerBeforeRender(() => {
      animTime += 0.02;
      notification.position.y = 5 + Math.sin(animTime * 3) * 0.1;
      
      if (animTime > 3) {
        notification.material.alpha = Math.max(0, 1 - (animTime - 3));
        if (animTime > 4) {
          notification.dispose();
          this.scene.unregisterBeforeRender(animation);
        }
      }
    });
  }

  saveAchievements() {
    const unlockedIds = this.achievements.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('gwenGalaxy_achievements', JSON.stringify(unlockedIds));
  }

  dispose() {
    if (this.scene) {
      this.scene.dispose();
    }
  }
}

import * as BABYLON from '@babylonjs/core';
import { BloomEffect } from 'babylonjs/PostProcesses/bloomEffect';

export class MainMenu {
  constructor(engine) {
    this.engine = engine;
    this.scene = null;
    this.camera = null;
    this.gui = null;
    this.selectedOption = 0;
    this.menuOptions = ['Start Game', 'Parent Dashboard', 'Achievements', 'Settings'];
    this.onMenuSelect = null;
  }

  async createScene() {
    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.05, 1);

    // Camera
    this.camera = new BABYLON.UniversalCamera("menuCamera", new BABYLON.Vector3(0, 0, -10), this.scene);
    this.camera.setTarget(BABYLON.Vector3.Zero());

    // Lighting
    const light1 = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), this.scene);
    light1.intensity = 0.5;
    light1.diffuse = new BABYLON.Color3(0.5, 0.5, 0.8);

    const light2 = new BABYLON.PointLight("point", new BABYLON.Vector3(5, 5, -5), this.scene);
    light2.diffuse = new BABYLON.Color3(1, 0.5, 0.8);
    light2.intensity = 0.8;

    // Bloom effect for magical feel
    const bloom = new BloomEffect(this.scene, 1.5, 0.5, 1, this.camera);

    // Create animated background elements
    this.createSpaceBackground();
    
    // Create 3D menu title
    this.createTitle();
    
    // Create menu options
    this.createMenuOptions();

    // Create floating particles
    this.createParticles();

    // Animate camera
    this.animateCamera();

    return this.scene;
  }

  createSpaceBackground() {
    // Create starfield
    const starCount = 500;
    const stars = new BABYLON.PointsCloudSystem("stars", 1, this.scene);
    
    stars.addPoints(starCount, (particle, i) => {
      particle.position.x = (Math.random() - 0.5) * 100;
      particle.position.y = (Math.random() - 0.5) * 100;
      particle.position.z = (Math.random() - 0.5) * 100;
      particle.color = new BABYLON.Color4(1, 1, 1, Math.random());
    });

    const starMat = new BABYLON.StandardMaterial("starMat", this.scene);
    starMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    starMat.pointsCloud = true;
    starMat.pointSize = 2;

    stars.buildMeshAsync().then(mesh => {
      mesh.material = starMat;
      
      // Slowly rotate starfield
      this.scene.registerBeforeRender(() => {
        mesh.rotation.y += 0.0002;
      });
    });

    // Create planets
    const planet1 = BABYLON.MeshBuilder.CreateSphere("planet1", {diameter: 3}, this.scene);
    planet1.position = new BABYLON.Vector3(8, 3, 5);
    const planet1Mat = new BABYLON.StandardMaterial("planet1Mat", this.scene);
    planet1Mat.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.3);
    planet1Mat.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.05);
    planet1.material = planet1Mat;

    const planet2 = BABYLON.MeshBuilder.CreateSphere("planet2", {diameter: 2}, this.scene);
    planet2.position = new BABYLON.Vector3(-7, -2, 8);
    const planet2Mat = new BABYLON.StandardMaterial("planet2Mat", this.scene);
    planet2Mat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.8);
    planet2Mat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
    planet2.material = planet2Mat;

    // Add rings to planet2
    const ring = BABYLON.MeshBuilder.CreateTorus("ring", {diameter: 4, thickness: 0.1}, this.scene);
    ring.parent = planet2;
    ring.rotation.x = Math.PI / 3;
    const ringMat = new BABYLON.StandardMaterial("ringMat", this.scene);
    ringMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.9);
    ringMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    ring.material = ringMat;

    // Animate planets
    this.scene.registerBeforeRender(() => {
      planet1.rotation.y += 0.005;
      planet2.rotation.y += 0.003;
      ring.rotation.z += 0.002;
    });
  }

  createTitle() {
    // Create 3D text mesh for title (using planes with dynamic texture as fallback)
    const titlePlane = BABYLON.MeshBuilder.CreatePlane("titlePlane", {width: 10, height: 3}, this.scene);
    titlePlane.position.y = 3;
    
    const titleTexture = new BABYLON.DynamicTexture("titleTexture", {width: 1024, height: 256}, this.scene);
    const titleMat = new BABYLON.StandardMaterial("titleMat", this.scene);
    titleMat.diffuseTexture = titleTexture;
    titleMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    titleMat.backFaceCulling = false;
    titleMat.disableLighting = true;
    titlePlane.material = titleMat;

    const ctx = titleTexture.getContext();
    ctx.font = "bold 120px Orbitron, Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.shadowColor = "#ff00ff";
    ctx.shadowBlur = 20;
    ctx.fillText("GWEN'S GALAXY", 512, 150);
    ctx.font = "60px Orbitron, Arial";
    ctx.fillStyle = "#ffaaff";
    ctx.fillText("✨ PRO EDITION ✨", 512, 220);
    titleTexture.update();

    // Floating animation
    this.scene.registerBeforeRender(() => {
      titlePlane.position.y = 3 + Math.sin(Date.now() * 0.001) * 0.2;
    });
  }

  createMenuOptions() {
    const options = [];
    
    this.menuOptions.forEach((text, i) => {
      const option = BABYLON.MeshBuilder.CreateBox(`option${i}`, {width: 6, height: 1, depth: 0.3}, this.scene);
      option.position.y = 0.5 - i * 1.5;
      option.position.z = 2;
      
      const mat = new BABYLON.StandardMaterial(`optionMat${i}`, this.scene);
      mat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.4);
      mat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
      mat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.5);
      option.material = mat;

      // Add text
      const textPlane = BABYLON.MeshBuilder.CreatePlane(`textPlane${i}`, {width: 5, height: 0.8}, this.scene);
      textPlane.parent = option;
      textPlane.position.z = -0.16;
      
      const textTexture = new BABYLON.DynamicTexture(`textTexture${i}`, {width: 512, height: 128}, this.scene);
      const textMat = new BABYLON.StandardMaterial(`textMat${i}`, this.scene);
      textMat.diffuseTexture = textTexture;
      textMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      textMat.disableLighting = true;
      textMat.backFaceCulling = false;
      textPlane.material = textMat;

      const ctx = textTexture.getContext();
      ctx.font = "bold 50px Orbitron, Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(text, 256, 80);
      textTexture.update();

      options.push({box: option, mat: mat, textPlane: textPlane});
    });

    this.menuBoxes = options;
    this.updateMenuHighlight();
  }

  updateMenuHighlight() {
    this.menuBoxes.forEach((item, i) => {
      if (i === this.selectedOption) {
        item.mat.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0.8);
        item.box.scaling = new BABYLON.Vector3(1.1, 1.1, 1.1);
      } else {
        item.mat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
        item.box.scaling = new BABYLON.Vector3(1, 1, 1);
      }
    });
  }

  createParticles() {
    const particleSystem = new BABYLON.ParticleSystem("particles", 2000, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADVJREFUeNpi/P//PwMDAwMj42AGLiBkgQimgQgQg3ARIKaECCCDKSCCSWATE4hoRhYABBgAWXkI7qorXVEAAAAASUVORK5CYII=", this.scene);

    particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
    particleSystem.minEmitBox = new BABYLON.Vector3(-10, -10, -10);
    particleSystem.maxEmitBox = new BABYLON.Vector3(10, 10, 10);

    particleSystem.color1 = new BABYLON.Color4(1, 0.5, 1, 1);
    particleSystem.color2 = new BABYLON.Color4(0.5, 0.5, 1, 1);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    particleSystem.minLifeTime = 5;
    particleSystem.maxLifeTime = 10;

    particleSystem.emitRate = 100;

    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);

    particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0, 0);
    particleSystem.direction2 = new BABYLON.Vector3(0.5, 0, 0);

    particleSystem.minEmitPower = 0.2;
    particleSystem.maxEmitPower = 0.5;

    particleSystem.start();
  }

  animateCamera() {
    let time = 0;
    this.scene.registerBeforeRender(() => {
      time += 0.01;
      this.camera.position.x = Math.sin(time * 0.2) * 2;
      this.camera.position.y = Math.cos(time * 0.15) * 1;
    });
  }

  navigateUp() {
    this.selectedOption = Math.max(0, this.selectedOption - 1);
    this.updateMenuHighlight();
  }

  navigateDown() {
    this.selectedOption = Math.min(this.menuOptions.length - 1, this.selectedOption + 1);
    this.updateMenuHighlight();
  }

  selectOption() {
    if (this.onMenuSelect) {
      this.onMenuSelect(this.menuOptions[this.selectedOption]);
    }
  }

  dispose() {
    if (this.scene) {
      this.scene.dispose();
    }
  }
}

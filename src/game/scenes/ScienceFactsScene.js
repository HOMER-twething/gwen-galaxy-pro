import * as BABYLON from 'babylonjs/Legacy/legacy';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Button, Control, Image } from '@babylonjs/gui';

export class ScienceFactsScene {
  constructor(scene, engine, onComplete) {
    this.scene = scene;
    this.engine = engine;
    this.onComplete = onComplete;
    this.gui = null;
    
    this.planets = [
      {
        name: 'Mercury',
        size: 0.4,
        distance: 3,
        color: new BABYLON.Color3(0.7, 0.7, 0.7),
        facts: [
          'Closest planet to the Sun',
          'No atmosphere or moons',
          'Days are longer than years!',
          'Temperature: -290°F to 800°F'
        ],
        emoji: '☿️'
      },
      {
        name: 'Venus',
        size: 0.9,
        distance: 4.5,
        color: new BABYLON.Color3(1, 0.8, 0.3),
        facts: [
          'Hottest planet in our solar system',
          'Thick toxic atmosphere',
          'Rotates backwards',
          'Called Earth\'s twin'
        ],
        emoji: '♀️'
      },
      {
        name: 'Earth',
        size: 1,
        distance: 6,
        color: new BABYLON.Color3(0.2, 0.5, 1),
        facts: [
          'Only planet with known life',
          '71% covered in water',
          'One natural moon',
          'Perfect distance from Sun'
        ],
        emoji: '🌍'
      },
      {
        name: 'Mars',
        size: 0.5,
        distance: 7.5,
        color: new BABYLON.Color3(1, 0.3, 0.1),
        facts: [
          'Called the Red Planet',
          'Has two small moons',
          'Evidence of ancient rivers',
          'Olympus Mons - largest volcano'
        ],
        emoji: '♂️'
      },
      {
        name: 'Jupiter',
        size: 2.5,
        distance: 11,
        color: new BABYLON.Color3(0.8, 0.6, 0.4),
        facts: [
          'Largest planet',
          'Has 79 known moons',
          'Great Red Spot storm',
          'Made of gas'
        ],
        emoji: '♃'
      },
      {
        name: 'Saturn',
        size: 2,
        distance: 14,
        color: new BABYLON.Color3(0.9, 0.8, 0.6),
        facts: [
          'Famous for its rings',
          'Less dense than water',
          '82 known moons',
          'Made mostly of hydrogen'
        ],
        emoji: '♄'
      },
      {
        name: 'Uranus',
        size: 1.5,
        distance: 17,
        color: new BABYLON.Color3(0.4, 0.7, 0.8),
        facts: [
          'Tilted on its side',
          'Has faint rings',
          '27 known moons',
          'Coldest planetary atmosphere'
        ],
        emoji: '♅'
      },
      {
        name: 'Neptune',
        size: 1.4,
        distance: 20,
        color: new BABYLON.Color3(0.2, 0.3, 0.8),
        facts: [
          'Windiest planet',
          'Deep blue color',
          '14 known moons',
          'Takes 165 years to orbit Sun'
        ],
        emoji: '♆'
      }
    ];
    
    this.sun = {
      name: 'Sun',
      size: 4,
      color: new BABYLON.Color3(1, 1, 0),
      facts: [
        'A medium-sized star',
        '1 million Earths could fit inside',
        'Surface temperature: 10,000°F',
        'Made of hydrogen and helium'
      ],
      emoji: '☀️'
    };
    
    this.currentPlanet = null;
    this.planetMeshes = [];
    this.quizMode = false;
    this.quizScore = 0;
    this.questionsAnswered = 0;
  }

  async init() {
    this.createSolarSystem();
    this.createGUI();
    this.startExploration();
  }

  createSolarSystem() {
    // Create Sun
    const sun = BABYLON.MeshBuilder.CreateSphere('sun', {
      diameter: this.sun.size
    }, this.scene);
    sun.position = BABYLON.Vector3.Zero();
    
    const sunMat = new BABYLON.StandardMaterial('sunMat', this.scene);
    sunMat.diffuseColor = this.sun.color;
    sunMat.emissiveColor = this.sun.color.scale(0.8);
    sun.material = sunMat;
    
    // Add sun glow
    const sunGlow = BABYLON.MeshBuilder.CreateSphere('sunGlow', {
      diameter: this.sun.size * 1.5
    }, this.scene);
    sunGlow.parent = sun;
    
    const glowMat = new BABYLON.StandardMaterial('glowMat', this.scene);
    glowMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
    glowMat.alpha = 0.3;
    sunGlow.material = glowMat;
    
    this.sunMesh = sun;
    
    // Create planets
    this.planets.forEach((planetData, index) => {
      const planet = BABYLON.MeshBuilder.CreateSphere(planetData.name, {
        diameter: planetData.size
      }, this.scene);
      
      // Position in orbit
      const angle = (index / 8) * Math.PI * 2;
      planet.position = new BABYLON.Vector3(
        Math.cos(angle) * planetData.distance,
        0,
        Math.sin(angle) * planetData.distance
      );
      
      const planetMat = new BABYLON.StandardMaterial(`${planetData.name}Mat`, this.scene);
      planetMat.diffuseColor = planetData.color;
      planetMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      planet.material = planetMat;
      
      // Add rings to Saturn
      if (planetData.name === 'Saturn') {
        const rings = BABYLON.MeshBuilder.CreateTorus('rings', {
          diameter: planetData.size * 2.5,
          thickness: 0.2,
          tessellation: 64
        }, this.scene);
        rings.parent = planet;
        rings.rotation.x = Math.PI / 2;
        
        const ringMat = new BABYLON.StandardMaterial('ringMat', this.scene);
        ringMat.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.5);
        ringMat.alpha = 0.7;
        rings.material = ringMat;
      }
      
      // Store mesh reference
      planetData.mesh = planet;
      this.planetMeshes.push(planet);
      
      // Add orbit line
      const orbitPoints = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        orbitPoints.push(new BABYLON.Vector3(
          Math.cos(a) * planetData.distance,
          0,
          Math.sin(a) * planetData.distance
        ));
      }
      
      const orbit = BABYLON.MeshBuilder.CreateLines(`orbit${planetData.name}`, {
        points: orbitPoints
      }, this.scene);
      orbit.color = new BABYLON.Color3(0.3, 0.3, 0.3);
      orbit.alpha = 0.3;
      
      // Add click action
      planet.actionManager = new BABYLON.ActionManager(this.scene);
      planet.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => {
          this.selectPlanet(planetData);
        }
      ));
    });
    
    // Add click action to sun
    this.sunMesh.actionManager = new BABYLON.ActionManager(this.scene);
    this.sunMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPickTrigger,
      () => {
        this.selectSun();
      }
    ));
    
    // Animate planets
    this.scene.registerBeforeRender(() => {
      this.planets.forEach((planet, index) => {
        if (planet.mesh && !planet.mesh.isDisposed()) {
          // Rotate planet
          planet.mesh.rotation.y += 0.01;
          
          // Orbit around sun
          const speed = 0.001 * (8 - index); // Inner planets orbit faster
          const time = Date.now() * speed;
          planet.mesh.position.x = Math.cos(time) * planet.distance;
          planet.mesh.position.z = Math.sin(time) * planet.distance;
        }
      });
      
      // Rotate sun
      if (this.sunMesh && !this.sunMesh.isDisposed()) {
        this.sunMesh.rotation.y += 0.005;
      }
    });
    
    // Set camera
    this.scene.activeCamera.position = new BABYLON.Vector3(15, 20, -25);
    this.scene.activeCamera.setTarget(BABYLON.Vector3.Zero());
  }

  createGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Title
    const title = new TextBlock();
    title.text = '🌌 Explore Our Solar System! 🌌';
    title.fontSize = 30;
    title.fontWeight = 'bold';
    title.color = 'white';
    title.outlineWidth = 2;
    title.outlineColor = 'darkblue';
    title.top = '-43%';
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(title);
    
    // Info panel
    const infoPanel = new Rectangle();
    infoPanel.width = '400px';
    infoPanel.height = '300px';
    infoPanel.cornerRadius = 15;
    infoPanel.color = 'white';
    infoPanel.thickness = 2;
    infoPanel.background = 'rgba(0,0,0,0.8)';
    infoPanel.left = '-30%';
    infoPanel.top = '10%';
    infoPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    infoPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    infoPanel.isVisible = false;
    this.gui.addControl(infoPanel);
    this.infoPanel = infoPanel;
    
    const planetName = new TextBlock();
    planetName.text = '';
    planetName.fontSize = 28;
    planetName.fontWeight = 'bold';
    planetName.color = 'yellow';
    planetName.top = '-120px';
    infoPanel.addControl(planetName);
    this.planetName = planetName;
    
    const planetFacts = new TextBlock();
    planetFacts.text = '';
    planetFacts.fontSize = 18;
    planetFacts.color = 'white';
    planetFacts.textWrapping = true;
    planetFacts.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    planetFacts.paddingLeft = '20px';
    planetFacts.paddingRight = '20px';
    planetFacts.top = '20px';
    infoPanel.addControl(planetFacts);
    this.planetFacts = planetFacts;
    
    // Controls
    const controlPanel = new Rectangle();
    controlPanel.width = '300px';
    controlPanel.height = '150px';
    controlPanel.cornerRadius = 10;
    controlPanel.color = 'lime';
    controlPanel.thickness = 2;
    controlPanel.background = 'rgba(0,50,0,0.8)';
    controlPanel.left = '35%';
    controlPanel.top = '35%';
    controlPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    controlPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(controlPanel);
    
    const instructionText = new TextBlock();
    instructionText.text = 'Click on any planet or the Sun\nto learn amazing facts!';
    instructionText.fontSize = 16;
    instructionText.color = 'white';
    instructionText.top = '-30px';
    controlPanel.addControl(instructionText);
    
    const quizBtn = Button.CreateSimpleButton('quiz', '🎯 Start Quiz');
    quizBtn.width = '120px';
    quizBtn.height = '40px';
    quizBtn.fontSize = 16;
    quizBtn.color = 'white';
    quizBtn.background = 'green';
    quizBtn.top = '30px';
    quizBtn.onPointerClickObservable.add(() => {
      this.startQuiz();
    });
    controlPanel.addControl(quizBtn);
    this.quizBtn = quizBtn;
    
    // Quiz panel
    this.createQuizPanel();
  }

  createQuizPanel() {
    const quizPanel = new Rectangle();
    quizPanel.width = '500px';
    quizPanel.height = '350px';
    quizPanel.cornerRadius = 15;
    quizPanel.color = 'gold';
    quizPanel.thickness = 3;
    quizPanel.background = 'rgba(0,0,50,0.9)';
    quizPanel.isVisible = false;
    this.gui.addControl(quizPanel);
    this.quizPanel = quizPanel;
    
    const quizTitle = new TextBlock();
    quizTitle.text = '🚀 Solar System Quiz! 🚀';
    quizTitle.fontSize = 24;
    quizTitle.fontWeight = 'bold';
    quizTitle.color = 'yellow';
    quizTitle.top = '-140px';
    quizPanel.addControl(quizTitle);
    
    const quizQuestion = new TextBlock();
    quizQuestion.text = '';
    quizQuestion.fontSize = 20;
    quizQuestion.color = 'white';
    quizQuestion.textWrapping = true;
    quizQuestion.top = '-60px';
    quizPanel.addControl(quizQuestion);
    this.quizQuestion = quizQuestion;
    
    // Answer buttons
    this.quizButtons = [];
    for (let i = 0; i < 4; i++) {
      const btn = Button.CreateSimpleButton(`quiz${i}`, '');
      btn.width = '200px';
      btn.height = '35px';
      btn.fontSize = 16;
      btn.color = 'white';
      btn.background = 'blue';
      btn.top = `${20 + i * 45}px`;
      btn.onPointerClickObservable.add(() => {
        this.checkAnswer(i);
      });
      quizPanel.addControl(btn);
      this.quizButtons.push(btn);
    }
    
    const quizScore = new TextBlock();
    quizScore.text = 'Score: 0/0';
    quizScore.fontSize = 18;
    quizScore.color = 'lime';
    quizScore.top = '150px';
    quizPanel.addControl(quizScore);
    this.quizScoreText = quizScore;
  }

  selectPlanet(planetData) {
    this.currentPlanet = planetData;
    this.showPlanetInfo(planetData);
    
    // Focus camera on planet
    const camera = this.scene.activeCamera;
    const targetPosition = planetData.mesh.position.clone();
    targetPosition.y += 5;
    targetPosition.z -= 10;
    
    // Smooth camera movement
    const startPos = camera.position.clone();
    let t = 0;
    const cameraMove = setInterval(() => {
      t += 0.05;
      if (t >= 1) {
        camera.position = targetPosition;
        clearInterval(cameraMove);
      } else {
        camera.position = BABYLON.Vector3.Lerp(startPos, targetPosition, t);
      }
      camera.setTarget(planetData.mesh.position);
    }, 20);
  }

  selectSun() {
    this.showPlanetInfo(this.sun);
    
    // Focus camera on sun
    const camera = this.scene.activeCamera;
    const targetPosition = new BABYLON.Vector3(10, 10, -15);
    
    // Smooth camera movement
    const startPos = camera.position.clone();
    let t = 0;
    const cameraMove = setInterval(() => {
      t += 0.05;
      if (t >= 1) {
        camera.position = targetPosition;
        clearInterval(cameraMove);
      } else {
        camera.position = BABYLON.Vector3.Lerp(startPos, targetPosition, t);
      }
      camera.setTarget(BABYLON.Vector3.Zero());
    }, 20);
  }

  showPlanetInfo(celestialBody) {
    this.infoPanel.isVisible = true;
    this.planetName.text = `${celestialBody.emoji} ${celestialBody.name}`;
    this.planetFacts.text = celestialBody.facts.map((fact, i) => `${i + 1}. ${fact}`).join('\n\n');
    
    // Pulse effect on info panel
    let scale = 1;
    let growing = true;
    const pulseInterval = setInterval(() => {
      if (growing) {
        scale += 0.01;
        if (scale >= 1.05) growing = false;
      } else {
        scale -= 0.01;
        if (scale <= 1) {
          clearInterval(pulseInterval);
        }
      }
      this.infoPanel.scaleX = scale;
      this.infoPanel.scaleY = scale;
    }, 20);
  }

  startQuiz() {
    this.quizMode = true;
    this.quizScore = 0;
    this.questionsAnswered = 0;
    this.quizPanel.isVisible = true;
    this.infoPanel.isVisible = false;
    
    this.generateQuizQuestion();
  }

  generateQuizQuestion() {
    const questions = [
      {
        question: 'Which planet is closest to the Sun?',
        answers: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correct: 0
      },
      {
        question: 'Which is the largest planet?',
        answers: ['Earth', 'Saturn', 'Jupiter', 'Neptune'],
        correct: 2
      },
      {
        question: 'Which planet is known as the Red Planet?',
        answers: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
        correct: 1
      },
      {
        question: 'Which planet has the most famous rings?',
        answers: ['Jupiter', 'Uranus', 'Neptune', 'Saturn'],
        correct: 3
      },
      {
        question: 'How many moons does Earth have?',
        answers: ['None', 'One', 'Two', 'Three'],
        correct: 1
      },
      {
        question: 'Which planet is tilted on its side?',
        answers: ['Mars', 'Venus', 'Uranus', 'Neptune'],
        correct: 2
      },
      {
        question: 'Which is the hottest planet?',
        answers: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
        correct: 1
      },
      {
        question: 'What is the Sun made of?',
        answers: ['Rock', 'Water', 'Hydrogen and Helium', 'Iron'],
        correct: 2
      }
    ];
    
    const question = questions[Math.floor(Math.random() * questions.length)];
    this.currentQuestion = question;
    
    this.quizQuestion.text = question.question;
    question.answers.forEach((answer, i) => {
      this.quizButtons[i].textBlock.text = answer;
      this.quizButtons[i].background = 'blue';
      this.quizButtons[i].isEnabled = true;
    });
  }

  checkAnswer(answerIndex) {
    this.questionsAnswered++;
    
    // Disable buttons
    this.quizButtons.forEach(btn => btn.isEnabled = false);
    
    if (answerIndex === this.currentQuestion.correct) {
      this.quizScore++;
      this.quizButtons[answerIndex].background = 'green';
      this.showQuizFeedback('Correct! 🌟');
    } else {
      this.quizButtons[answerIndex].background = 'red';
      this.quizButtons[this.currentQuestion.correct].background = 'green';
      this.showQuizFeedback('Keep learning! 📚');
    }
    
    this.quizScoreText.text = `Score: ${this.quizScore}/${this.questionsAnswered}`;
    
    // Next question or end quiz
    setTimeout(() => {
      if (this.questionsAnswered < 5) {
        this.generateQuizQuestion();
      } else {
        this.endQuiz();
      }
    }, 2000);
  }

  showQuizFeedback(message) {
    const feedback = new TextBlock();
    feedback.text = message;
    feedback.fontSize = 24;
    feedback.fontWeight = 'bold';
    feedback.color = 'lime';
    feedback.top = '250px';
    this.quizPanel.addControl(feedback);
    
    setTimeout(() => {
      this.quizPanel.removeControl(feedback);
    }, 1500);
  }

  endQuiz() {
    this.quizPanel.isVisible = false;
    
    // Show results
    const resultsPanel = new Rectangle();
    resultsPanel.width = '400px';
    resultsPanel.height = '300px';
    resultsPanel.cornerRadius = 20;
    resultsPanel.color = 'gold';
    resultsPanel.thickness = 3;
    resultsPanel.background = 'rgba(0,0,0,0.9)';
    this.gui.addControl(resultsPanel);
    
    const grade = this.quizScore >= 4 ? 'Amazing!' : this.quizScore >= 2 ? 'Good job!' : 'Keep exploring!';
    const emoji = this.quizScore >= 4 ? '🏆' : this.quizScore >= 2 ? '⭐' : '🚀';
    
    const resultsText = new TextBlock();
    resultsText.text = 
      `${emoji} ${grade} ${emoji}\n\n` +
      `Score: ${this.quizScore}/5\n\n` +
      `You're becoming a\nspace expert!`;
    resultsText.fontSize = 24;
    resultsText.color = 'white';
    resultsText.textWrapping = true;
    resultsText.lineSpacing = '5px';
    resultsPanel.addControl(resultsText);
    
    const continueBtn = Button.CreateSimpleButton('continue', 'Continue');
    continueBtn.width = '150px';
    continueBtn.height = '40px';
    continueBtn.fontSize = 16;
    continueBtn.color = 'white';
    continueBtn.background = 'blue';
    continueBtn.top = '120px';
    continueBtn.onPointerClickObservable.add(() => {
      if (this.onComplete) {
        this.onComplete({ score: this.quizScore, total: 5 });
      }
    });
    resultsPanel.addControl(continueBtn);
  }

  startExploration() {
    // Initial animation
    const camera = this.scene.activeCamera;
    const startPos = new BABYLON.Vector3(30, 40, -50);
    const endPos = new BABYLON.Vector3(15, 20, -25);
    camera.position = startPos;
    
    let t = 0;
    const introAnimation = setInterval(() => {
      t += 0.02;
      if (t >= 1) {
        camera.position = endPos;
        clearInterval(introAnimation);
      } else {
        camera.position = BABYLON.Vector3.Lerp(startPos, endPos, t);
      }
      camera.setTarget(BABYLON.Vector3.Zero());
    }, 20);
  }

  dispose() {
    if (this.gui) {
      this.gui.dispose();
    }
    
    this.planetMeshes.forEach(mesh => {
      if (mesh) mesh.dispose();
    });
    
    if (this.sunMesh) {
      this.sunMesh.dispose();
    }
  }
}

import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Button, Control, Image } from '@babylonjs/gui';

export class FamilyMode {
  constructor(scene, engine, onComplete) {
    this.scene = scene;
    this.engine = engine;
    this.onComplete = onComplete;
    this.gui = null;
    
    this.currentPlayer = 'child'; // 'child' or 'parent'
    this.players = {
      child: { 
        name: 'Child', 
        score: 0, 
        icon: '👶',
        difficulty: 1,
        correctAnswers: 0,
        attempts: 0
      },
      parent: { 
        name: 'Parent', 
        score: 0, 
        icon: '👨',
        difficulty: 1.5,
        correctAnswers: 0,
        attempts: 0
      }
    };
    
    this.turnNumber = 0;
    this.maxTurns = 10; // 5 turns each
    this.currentChallenge = null;
    this.gameActive = false;
    this.turnTimer = 30; // 30 seconds per turn
    this.timeRemaining = 30;
    this.celebrationMessages = [
      'Amazing!', 'Fantastic!', 'Brilliant!', 'Wonderful!', 
      'Excellent!', 'Superb!', 'Outstanding!', 'Incredible!'
    ];
  }

  async init() {
    this.createGameEnvironment();
    this.createGUI();
    this.startGame();
  }

  createGameEnvironment() {
    // Create shared game board
    const board = BABYLON.MeshBuilder.CreateGround('board', {
      width: 15,
      height: 15
    }, this.scene);
    
    const boardMat = new BABYLON.StandardMaterial('boardMat', this.scene);
    boardMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.4);
    boardMat.specularColor = new BABYLON.Color3(0, 0, 0);
    board.material = boardMat;
    
    // Create player avatars
    this.createAvatar('child', new BABYLON.Vector3(-3, 1, 0), new BABYLON.Color3(0.5, 0.8, 1));
    this.createAvatar('parent', new BABYLON.Vector3(3, 1, 0), new BABYLON.Color3(1, 0.5, 0.5));
    
    // Create progress path
    this.createProgressPath();
    
    // Set up camera
    this.scene.activeCamera.position = new BABYLON.Vector3(0, 10, -15);
    this.scene.activeCamera.setTarget(BABYLON.Vector3.Zero());
  }

  createAvatar(player, position, color) {
    const avatar = BABYLON.MeshBuilder.CreateSphere(`avatar_${player}`, {
      diameter: 1.5
    }, this.scene);
    
    avatar.position = position;
    
    const avatarMat = new BABYLON.StandardMaterial(`avatarMat_${player}`, this.scene);
    avatarMat.diffuseColor = color;
    avatarMat.emissiveColor = color.scale(0.3);
    avatar.material = avatarMat;
    
    // Add floating animation
    this.scene.registerBeforeRender(() => {
      if (!avatar.isDisposed()) {
        avatar.position.y = position.y + Math.sin(Date.now() * 0.001) * 0.2;
        avatar.rotation.y += 0.01;
      }
    });
    
    this.players[player].avatar = avatar;
  }

  createProgressPath() {
    this.progressSteps = [];
    const stepCount = 10;
    
    for (let i = 0; i <= stepCount; i++) {
      const step = BABYLON.MeshBuilder.CreateCylinder(`step${i}`, {
        diameter: 1,
        height: 0.1
      }, this.scene);
      
      const angle = (i / stepCount) * Math.PI * 2;
      step.position = new BABYLON.Vector3(
        Math.cos(angle) * 5,
        0,
        Math.sin(angle) * 5
      );
      
      const stepMat = new BABYLON.StandardMaterial(`stepMat${i}`, this.scene);
      stepMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      stepMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      step.material = stepMat;
      
      this.progressSteps.push(step);
    }
  }

  createGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Turn indicator
    const turnPanel = new Rectangle();
    turnPanel.width = '400px';
    turnPanel.height = '100px';
    turnPanel.cornerRadius = 15;
    turnPanel.color = 'white';
    turnPanel.thickness = 3;
    turnPanel.background = 'rgba(0,0,0,0.8)';
    turnPanel.top = '-42%';
    turnPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(turnPanel);
    
    const turnText = new TextBlock();
    turnText.text = `${this.players[this.currentPlayer].icon} ${this.players[this.currentPlayer].name}'s Turn`;
    turnText.color = 'white';
    turnText.fontSize = 28;
    turnText.top = '-15px';
    turnPanel.addControl(turnText);
    this.turnText = turnText;
    
    const turnProgressText = new TextBlock();
    turnProgressText.text = `Turn ${this.turnNumber + 1} of ${this.maxTurns}`;
    turnProgressText.color = 'yellow';
    turnProgressText.fontSize = 18;
    turnProgressText.top = '20px';
    turnPanel.addControl(turnProgressText);
    this.turnProgressText = turnProgressText;
    
    // Timer
    const timerText = new TextBlock();
    timerText.text = `⏰ ${this.timeRemaining}s`;
    timerText.color = 'white';
    timerText.fontSize = 20;
    timerText.top = '-32%';
    timerText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(timerText);
    this.timerText = timerText;
    
    // Score panels
    this.createScorePanel('child', '-40%');
    this.createScorePanel('parent', '40%');
    
    // Challenge display
    const challengePanel = new Rectangle();
    challengePanel.width = '500px';
    challengePanel.height = '200px';
    challengePanel.cornerRadius = 15;
    challengePanel.color = 'gold';
    challengePanel.thickness = 2;
    challengePanel.background = 'rgba(0,0,0,0.9)';
    challengePanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(challengePanel);
    
    const challengeText = new TextBlock();
    challengeText.text = 'Get Ready!';
    challengeText.color = 'white';
    challengeText.fontSize = 24;
    challengeText.textWrapping = true;
    challengeText.top = '-30px';
    challengePanel.addControl(challengeText);
    this.challengeText = challengeText;
    
    // Answer buttons
    const answerGrid = new Rectangle();
    answerGrid.width = '400px';
    answerGrid.height = '80px';
    answerGrid.top = '50px';
    challengePanel.addControl(answerGrid);
    
    this.answerButtons = [];
    for (let i = 0; i < 4; i++) {
      const btn = Button.CreateSimpleButton(`answer${i}`, '');
      btn.width = '90px';
      btn.height = '40px';
      btn.color = 'white';
      btn.background = 'blue';
      btn.left = `${(i - 1.5) * 100}px`;
      btn.onPointerClickObservable.add(() => {
        this.handleAnswer(i);
      });
      answerGrid.addControl(btn);
      this.answerButtons.push(btn);
    }
    
    // Encouragement display
    const encouragementText = new TextBlock();
    encouragementText.text = '';
    encouragementText.color = 'lime';
    encouragementText.fontSize = 32;
    encouragementText.fontWeight = 'bold';
    encouragementText.top = '30%';
    encouragementText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(encouragementText);
    this.encouragementText = encouragementText;
  }

  createScorePanel(player, horizontalPosition) {
    const panel = new Rectangle();
    panel.width = '150px';
    panel.height = '120px';
    panel.cornerRadius = 10;
    panel.color = player === 'child' ? 'cyan' : 'orange';
    panel.thickness = 2;
    panel.background = 'rgba(0,0,0,0.7)';
    panel.left = horizontalPosition;
    panel.top = '35%';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(panel);
    
    const icon = new TextBlock();
    icon.text = this.players[player].icon;
    icon.fontSize = 30;
    icon.top = '-30px';
    panel.addControl(icon);
    
    const nameText = new TextBlock();
    nameText.text = this.players[player].name;
    nameText.color = 'white';
    nameText.fontSize = 18;
    nameText.top = '0px';
    panel.addControl(nameText);
    
    const scoreText = new TextBlock();
    scoreText.text = `Score: 0`;
    scoreText.color = 'yellow';
    scoreText.fontSize = 20;
    scoreText.fontWeight = 'bold';
    scoreText.top = '25px';
    panel.addControl(scoreText);
    
    this.players[player].scoreText = scoreText;
    this.players[player].panel = panel;
  }

  generateChallenge() {
    const player = this.players[this.currentPlayer];
    const difficulty = player.difficulty;
    
    // Adjust challenge based on player and difficulty
    const challengeTypes = ['math', 'spelling', 'pattern', 'memory'];
    const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    
    let challenge = null;
    
    switch(type) {
      case 'math':
        challenge = this.generateMathChallenge(difficulty);
        break;
      case 'spelling':
        challenge = this.generateSpellingChallenge(difficulty);
        break;
      case 'pattern':
        challenge = this.generatePatternChallenge(difficulty);
        break;
      case 'memory':
        challenge = this.generateMemoryChallenge(difficulty);
        break;
    }
    
    return challenge;
  }

  generateMathChallenge(difficulty) {
    const maxNum = Math.floor(10 * difficulty);
    const a = Math.floor(Math.random() * maxNum) + 1;
    const b = Math.floor(Math.random() * maxNum) + 1;
    
    const operations = difficulty > 1.2 ? ['+', '-', '×'] : ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let answer;
    let question;
    
    switch(operation) {
      case '+':
        answer = a + b;
        question = `${a} + ${b} = ?`;
        break;
      case '-':
        answer = Math.max(a, b) - Math.min(a, b);
        question = `${Math.max(a, b)} - ${Math.min(a, b)} = ?`;
        break;
      case '×':
        const smallA = Math.min(5, a);
        const smallB = Math.min(5, b);
        answer = smallA * smallB;
        question = `${smallA} × ${smallB} = ?`;
        break;
    }
    
    const options = [answer];
    while (options.length < 4) {
      const wrong = answer + Math.floor(Math.random() * 10) - 5;
      if (wrong !== answer && wrong > 0 && !options.includes(wrong)) {
        options.push(wrong);
      }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    
    return {
      type: 'math',
      question: question,
      options: options.map(o => o.toString()),
      answer: answer.toString(),
      points: Math.floor(100 * difficulty)
    };
  }

  generateSpellingChallenge(difficulty) {
    const words = difficulty > 1.2 ? 
      ['GALAXY', 'ASTEROID', 'UNIVERSE', 'TELESCOPE', 'ASTRONAUT'] :
      ['STAR', 'MOON', 'SUN', 'SPACE', 'ROCKET'];
    
    const word = words[Math.floor(Math.random() * words.length)];
    const missingCount = Math.floor(difficulty);
    
    const indices = [];
    while (indices.length < missingCount) {
      const index = Math.floor(Math.random() * word.length);
      if (!indices.includes(index)) {
        indices.push(index);
      }
    }
    
    const display = word.split('');
    const missing = indices[0]; // For simplicity, ask for first missing
    const correctLetter = word[missing];
    display[missing] = '_';
    
    const question = `Fill in the blank: ${display.join('')}`;
    
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const options = [correctLetter];
    
    while (options.length < 4) {
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      if (!options.includes(randomLetter)) {
        options.push(randomLetter);
      }
    }
    
    options.sort(() => Math.random() - 0.5);
    
    return {
      type: 'spelling',
      question: question,
      options: options,
      answer: correctLetter,
      points: Math.floor(80 * difficulty)
    };
  }

  generatePatternChallenge(difficulty) {
    const shapes = ['🟦', '🟥', '🟩', '🟨'];
    const patternLength = Math.floor(3 + difficulty);
    
    const pattern = [];
    const rule = Math.random() < 0.5 ? 'repeat' : 'sequence';
    
    if (rule === 'repeat') {
      const base = [];
      for (let i = 0; i < 2; i++) {
        base.push(shapes[Math.floor(Math.random() * shapes.length)]);
      }
      
      for (let i = 0; i < patternLength - 1; i++) {
        pattern.push(base[i % base.length]);
      }
      
      const answer = base[(patternLength - 1) % base.length];
      const question = `What comes next? ${pattern.join(' ')} ?`;
      
      const options = [answer];
      while (options.length < 4) {
        const wrong = shapes[Math.floor(Math.random() * shapes.length)];
        if (!options.includes(wrong)) {
          options.push(wrong);
        }
      }
      
      options.sort(() => Math.random() - 0.5);
      
      return {
        type: 'pattern',
        question: question,
        options: options,
        answer: answer,
        points: Math.floor(120 * difficulty)
      };
    }
    
    return this.generateMathChallenge(difficulty); // Fallback
  }

  generateMemoryChallenge(difficulty) {
    const items = ['🚀', '🌟', '🌙', '☄️', '🛸', '🪐', '🌍', '🌌'];
    const sequenceLength = Math.floor(2 + difficulty);
    
    const sequence = [];
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push(items[Math.floor(Math.random() * items.length)]);
    }
    
    const question = `Remember: ${sequence.join(' ')}\nWhich was FIRST?`;
    
    const answer = sequence[0];
    const options = [answer];
    
    while (options.length < 4) {
      const wrong = items[Math.floor(Math.random() * items.length)];
      if (!options.includes(wrong)) {
        options.push(wrong);
      }
    }
    
    options.sort(() => Math.random() - 0.5);
    
    return {
      type: 'memory',
      question: question,
      options: options,
      answer: answer,
      points: Math.floor(150 * difficulty)
    };
  }

  showChallenge() {
    this.currentChallenge = this.generateChallenge();
    
    this.challengeText.text = this.currentChallenge.question;
    
    // Update answer buttons
    this.answerButtons.forEach((btn, i) => {
      btn.textBlock.text = this.currentChallenge.options[i];
      btn.isEnabled = true;
      btn.background = 'blue';
    });
    
    // Highlight current player's panel
    this.players.child.panel.thickness = this.currentPlayer === 'child' ? 4 : 2;
    this.players.parent.panel.thickness = this.currentPlayer === 'parent' ? 4 : 2;
  }

  handleAnswer(optionIndex) {
    if (!this.currentChallenge || !this.gameActive) return;
    
    const selectedAnswer = this.currentChallenge.options[optionIndex];
    const correct = selectedAnswer === this.currentChallenge.answer;
    const player = this.players[this.currentPlayer];
    
    player.attempts++;
    
    if (correct) {
      player.correctAnswers++;
      player.score += this.currentChallenge.points;
      this.showCorrectFeedback(optionIndex);
      this.celebrateSuccess();
    } else {
      this.showIncorrectFeedback(optionIndex);
      this.showCorrectAnswer();
    }
    
    this.updateScores();
    
    // Disable buttons briefly
    this.answerButtons.forEach(btn => btn.isEnabled = false);
    
    // Next turn after delay
    setTimeout(() => {
      this.nextTurn();
    }, 2000);
  }

  showCorrectFeedback(optionIndex) {
    this.answerButtons[optionIndex].background = 'green';
    
    // Play success animation on avatar
    const avatar = this.players[this.currentPlayer].avatar;
    const originalY = avatar.position.y;
    
    const jumpAnimation = () => {
      let frame = 0;
      const jumpInterval = setInterval(() => {
        frame++;
        if (frame <= 10) {
          avatar.position.y += 0.2;
        } else if (frame <= 20) {
          avatar.position.y -= 0.2;
        } else {
          avatar.position.y = originalY;
          clearInterval(jumpInterval);
        }
      }, 20);
    };
    
    jumpAnimation();
  }

  showIncorrectFeedback(optionIndex) {
    this.answerButtons[optionIndex].background = 'red';
  }

  showCorrectAnswer() {
    const correctIndex = this.currentChallenge.options.indexOf(this.currentChallenge.answer);
    this.answerButtons[correctIndex].background = 'green';
  }

  celebrateSuccess() {
    const message = this.celebrationMessages[
      Math.floor(Math.random() * this.celebrationMessages.length)
    ];
    
    this.encouragementText.text = `${message} 🎉`;
    this.encouragementText.alpha = 1;
    
    // Fade out animation
    let alpha = 1;
    const fadeInterval = setInterval(() => {
      alpha -= 0.02;
      this.encouragementText.alpha = alpha;
      if (alpha <= 0) {
        this.encouragementText.text = '';
        clearInterval(fadeInterval);
      }
    }, 20);
    
    // Move progress marker
    this.moveProgressMarker();
  }

  moveProgressMarker() {
    const player = this.players[this.currentPlayer];
    const progressIndex = Math.floor((player.score / 1000) * this.progressSteps.length);
    
    if (progressIndex < this.progressSteps.length) {
      const targetStep = this.progressSteps[Math.min(progressIndex, this.progressSteps.length - 1)];
      targetStep.material.emissiveColor = this.currentPlayer === 'child' ? 
        new BABYLON.Color3(0, 0.5, 1) : new BABYLON.Color3(1, 0.5, 0);
    }
  }

  updateScores() {
    this.players.child.scoreText.text = `Score: ${this.players.child.score}`;
    this.players.parent.scoreText.text = `Score: ${this.players.parent.score}`;
  }

  nextTurn() {
    this.turnNumber++;
    
    if (this.turnNumber >= this.maxTurns) {
      this.endGame();
      return;
    }
    
    // Switch player
    this.currentPlayer = this.currentPlayer === 'child' ? 'parent' : 'child';
    
    // Update UI
    this.turnText.text = `${this.players[this.currentPlayer].icon} ${this.players[this.currentPlayer].name}'s Turn`;
    this.turnProgressText.text = `Turn ${this.turnNumber + 1} of ${this.maxTurns}`;
    
    // Reset timer
    this.timeRemaining = this.turnTimer;
    
    // Show new challenge
    this.showChallenge();
  }

  startGame() {
    this.gameActive = true;
    this.turnNumber = 0;
    this.currentPlayer = 'child';
    
    // Reset scores
    Object.values(this.players).forEach(player => {
      player.score = 0;
      player.correctAnswers = 0;
      player.attempts = 0;
    });
    
    this.updateScores();
    this.showChallenge();
    
    // Start timer
    const timerInterval = setInterval(() => {
      if (this.gameActive) {
        this.timeRemaining--;
        this.timerText.text = `⏰ ${this.timeRemaining}s`;
        
        if (this.timeRemaining <= 5) {
          this.timerText.color = 'red';
        } else {
          this.timerText.color = 'white';
        }
        
        if (this.timeRemaining <= 0) {
          // Time's up - auto skip
          this.nextTurn();
          this.timeRemaining = this.turnTimer;
        }
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  endGame() {
    this.gameActive = false;
    
    const winner = this.players.child.score > this.players.parent.score ? 
      this.players.child : this.players.parent;
    
    const tie = this.players.child.score === this.players.parent.score;
    
    // Calculate accuracy
    const childAccuracy = this.players.child.attempts > 0 ? 
      (this.players.child.correctAnswers / this.players.child.attempts * 100).toFixed(1) : 0;
    const parentAccuracy = this.players.parent.attempts > 0 ? 
      (this.players.parent.correctAnswers / this.players.parent.attempts * 100).toFixed(1) : 0;
    
    // Show results
    const resultPanel = new Rectangle();
    resultPanel.width = '500px';
    resultPanel.height = '400px';
    resultPanel.cornerRadius = 20;
    resultPanel.color = 'gold';
    resultPanel.thickness = 3;
    resultPanel.background = 'rgba(0,0,0,0.95)';
    this.gui.addControl(resultPanel);
    
    const titleText = new TextBlock();
    titleText.text = tie ? '🤝 Great Teamwork! 🤝' : `🏆 ${winner.icon} ${winner.name} Wins! 🏆`;
    titleText.color = 'gold';
    titleText.fontSize = 28;
    titleText.fontWeight = 'bold';
    titleText.top = '-140px';
    resultPanel.addControl(titleText);
    
    const statsText = new TextBlock();
    statsText.text = 
      `${this.players.child.icon} Child\n` +
      `Score: ${this.players.child.score} | Accuracy: ${childAccuracy}%\n\n` +
      `${this.players.parent.icon} Parent\n` +
      `Score: ${this.players.parent.score} | Accuracy: ${parentAccuracy}%`;
    statsText.color = 'white';
    statsText.fontSize = 20;
    statsText.textWrapping = true;
    statsText.lineSpacing = '5px';
    statsText.top = '-20px';
    resultPanel.addControl(statsText);
    
    // Play Again button
    const playAgainBtn = Button.CreateSimpleButton('playAgain', 'Play Again');
    playAgainBtn.width = '150px';
    playAgainBtn.height = '40px';
    playAgainBtn.color = 'white';
    playAgainBtn.background = 'green';
    playAgainBtn.top = '100px';
    playAgainBtn.onPointerClickObservable.add(() => {
      this.resetGame();
    });
    resultPanel.addControl(playAgainBtn);
    
    // Main Menu button
    const menuBtn = Button.CreateSimpleButton('menu', 'Main Menu');
    menuBtn.width = '150px';
    menuBtn.height = '40px';
    menuBtn.color = 'white';
    menuBtn.background = 'blue';
    menuBtn.top = '150px';
    menuBtn.onPointerClickObservable.add(() => {
      if (this.onComplete) {
        this.onComplete({
          winner: tie ? 'Tie' : winner.name,
          scores: {
            child: this.players.child.score,
            parent: this.players.parent.score
          },
          accuracy: {
            child: childAccuracy,
            parent: parentAccuracy
          }
        });
      }
    });
    resultPanel.addControl(menuBtn);
  }

  resetGame() {
    // Clear GUI and recreate
    this.gui.dispose();
    this.createGUI();
    
    // Reset progress steps
    this.progressSteps.forEach(step => {
      step.material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    });
    
    // Start new game
    this.startGame();
  }

  dispose() {
    this.gameActive = false;
    
    if (this.gui) {
      this.gui.dispose();
    }
    
    Object.values(this.players).forEach(player => {
      if (player.avatar) player.avatar.dispose();
    });
    
    this.progressSteps.forEach(step => {
      if (step) step.dispose();
    });
  }
}

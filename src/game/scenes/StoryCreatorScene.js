import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { AdvancedDynamicTexture, TextBlock, Rectangle, Button, Control, ScrollViewer } from '@babylonjs/gui';

export class StoryCreatorScene {
  constructor(scene, engine, onComplete) {
    this.scene = scene;
    this.engine = engine;
    this.onComplete = onComplete;
    this.gui = null;
    
    this.storyPages = [];
    this.currentPage = 0;
    this.stamps = [
      { emoji: '🚀', name: 'Rocket' },
      { emoji: '👽', name: 'Alien' },
      { emoji: '🌟', name: 'Star' },
      { emoji: '🌙', name: 'Moon' },
      { emoji: '🪐', name: 'Planet' },
      { emoji: '☄️', name: 'Comet' },
      { emoji: '🛸', name: 'UFO' },
      { emoji: '👨‍🚀', name: 'Astronaut' },
      { emoji: '🌍', name: 'Earth' },
      { emoji: '🌌', name: 'Galaxy' },
      { emoji: '🔭', name: 'Telescope' },
      { emoji: '🛰️', name: 'Satellite' }
    ];
    
    this.currentStamps = [];
    this.recording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordedAudios = [];
  }

  async init() {
    this.createStoryEnvironment();
    this.createGUI();
    await this.setupAudioRecording();
  }

  createStoryEnvironment() {
    // Create story book background
    const book = BABYLON.MeshBuilder.CreateGround('book', {
      width: 20,
      height: 15
    }, this.scene);
    
    const bookMat = new BABYLON.StandardMaterial('bookMat', this.scene);
    bookMat.diffuseColor = new BABYLON.Color3(0.95, 0.9, 0.8);
    bookMat.specularColor = new BABYLON.Color3(0, 0, 0);
    book.material = bookMat;
    
    // Create 3D stamp objects
    this.stampMeshes = [];
    this.stamps.forEach((stamp, index) => {
      const stampPlane = BABYLON.MeshBuilder.CreatePlane(`stamp${index}`, {
        size: 2
      }, this.scene);
      
      stampPlane.position = new BABYLON.Vector3(
        (index % 6 - 2.5) * 3,
        2,
        Math.floor(index / 6) * 3
      );
      
      stampPlane.isVisible = false;
      stampPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      
      this.stampMeshes.push(stampPlane);
    });
    
    // Set up camera
    this.scene.activeCamera.position = new BABYLON.Vector3(0, 15, -20);
    this.scene.activeCamera.setTarget(BABYLON.Vector3.Zero());
  }

  createGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Main container
    const container = new Rectangle();
    container.width = '90%';
    container.height = '90%';
    container.cornerRadius = 20;
    container.color = 'white';
    container.thickness = 3;
    container.background = 'rgba(255,255,255,0.95)';
    this.gui.addControl(container);
    
    // Title
    const title = new TextBlock();
    title.text = '📖 Create Your Space Story! 📖';
    title.fontSize = 30;
    title.fontWeight = 'bold';
    title.color = 'darkblue';
    title.top = '-42%';
    container.addControl(title);
    
    // Story canvas area
    const storyCanvas = new Rectangle();
    storyCanvas.width = '70%';
    storyCanvas.height = '50%';
    storyCanvas.cornerRadius = 10;
    storyCanvas.color = 'gray';
    storyCanvas.thickness = 2;
    storyCanvas.background = 'white';
    storyCanvas.top = '-5%';
    container.addControl(storyCanvas);
    this.storyCanvas = storyCanvas;
    
    // Page text
    const pageText = new TextBlock();
    pageText.text = '';
    pageText.fontSize = 20;
    pageText.color = 'black';
    pageText.textWrapping = true;
    pageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    pageText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    pageText.paddingLeft = '20px';
    pageText.paddingRight = '20px';
    pageText.paddingTop = '20px';
    pageText.top = '-40%';
    storyCanvas.addControl(pageText);
    this.pageText = pageText;
    
    // Stamps display
    const stampsDisplay = new Rectangle();
    stampsDisplay.width = '60%';
    stampsDisplay.height = '30%';
    stampsDisplay.top = '15%';
    stampsDisplay.background = 'transparent';
    storyCanvas.addControl(stampsDisplay);
    this.stampsDisplay = stampsDisplay;
    
    // Stamp selector
    this.createStampSelector(container);
    
    // Recording controls
    this.createRecordingControls(container);
    
    // Page navigation
    this.createPageNavigation(container);
    
    // Action buttons
    this.createActionButtons(container);
  }

  createStampSelector(parent) {
    const stampPanel = new Rectangle();
    stampPanel.width = '80%';
    stampPanel.height = '80px';
    stampPanel.top = '30%';
    stampPanel.cornerRadius = 10;
    stampPanel.color = 'purple';
    stampPanel.thickness = 2;
    stampPanel.background = 'rgba(200,200,255,0.3)';
    parent.addControl(stampPanel);
    
    const stampLabel = new TextBlock();
    stampLabel.text = 'Choose stamps for your story:';
    stampLabel.fontSize = 16;
    stampLabel.color = 'darkblue';
    stampLabel.top = '-25px';
    stampPanel.addControl(stampLabel);
    
    const stampScroll = new ScrollViewer();
    stampScroll.width = '95%';
    stampScroll.height = '50px';
    stampScroll.top = '10px';
    stampScroll.barColor = 'purple';
    stampScroll.barBackground = 'lightgray';
    stampPanel.addControl(stampScroll);
    
    const stampGrid = new Rectangle();
    stampGrid.width = `${this.stamps.length * 60}px`;
    stampGrid.height = '40px';
    stampGrid.background = 'transparent';
    stampScroll.addControl(stampGrid);
    
    this.stamps.forEach((stamp, index) => {
      const stampBtn = Button.CreateSimpleButton(`stamp${index}`, stamp.emoji);
      stampBtn.width = '50px';
      stampBtn.height = '40px';
      stampBtn.fontSize = 24;
      stampBtn.background = 'white';
      stampBtn.color = 'purple';
      stampBtn.thickness = 1;
      stampBtn.left = `${index * 60 - (this.stamps.length * 30) + 25}px`;
      stampBtn.onPointerClickObservable.add(() => {
        this.addStampToStory(stamp);
      });
      stampGrid.addControl(stampBtn);
    });
  }

  createRecordingControls(parent) {
    const recordPanel = new Rectangle();
    recordPanel.width = '300px';
    recordPanel.height = '60px';
    recordPanel.top = '38%';
    recordPanel.cornerRadius = 30;
    recordPanel.color = 'red';
    recordPanel.thickness = 2;
    recordPanel.background = 'rgba(255,200,200,0.3)';
    parent.addControl(recordPanel);
    
    const recordBtn = Button.CreateSimpleButton('record', '🎤 Record Story');
    recordBtn.width = '140px';
    recordBtn.height = '40px';
    recordBtn.fontSize = 16;
    recordBtn.color = 'white';
    recordBtn.background = 'red';
    recordBtn.left = '-70px';
    recordBtn.onPointerClickObservable.add(() => {
      this.toggleRecording();
    });
    recordPanel.addControl(recordBtn);
    this.recordBtn = recordBtn;
    
    const playBtn = Button.CreateSimpleButton('play', '▶️ Play');
    playBtn.width = '100px';
    playBtn.height = '40px';
    playBtn.fontSize = 16;
    playBtn.color = 'white';
    playBtn.background = 'green';
    playBtn.left = '50px';
    playBtn.isEnabled = false;
    playBtn.onPointerClickObservable.add(() => {
      this.playRecording();
    });
    recordPanel.addControl(playBtn);
    this.playBtn = playBtn;
  }

  createPageNavigation(parent) {
    const navPanel = new Rectangle();
    navPanel.width = '400px';
    navPanel.height = '50px';
    navPanel.top = '44%';
    navPanel.background = 'transparent';
    parent.addControl(navPanel);
    
    const prevBtn = Button.CreateSimpleButton('prev', '← Previous');
    prevBtn.width = '100px';
    prevBtn.height = '40px';
    prevBtn.fontSize = 16;
    prevBtn.color = 'white';
    prevBtn.background = 'blue';
    prevBtn.left = '-100px';
    prevBtn.isEnabled = false;
    prevBtn.onPointerClickObservable.add(() => {
      this.previousPage();
    });
    navPanel.addControl(prevBtn);
    this.prevBtn = prevBtn;
    
    const pageIndicator = new TextBlock();
    pageIndicator.text = 'Page 1';
    pageIndicator.fontSize = 18;
    pageIndicator.color = 'darkblue';
    pageIndicator.fontWeight = 'bold';
    navPanel.addControl(pageIndicator);
    this.pageIndicator = pageIndicator;
    
    const nextBtn = Button.CreateSimpleButton('next', 'Next →');
    nextBtn.width = '100px';
    nextBtn.height = '40px';
    nextBtn.fontSize = 16;
    nextBtn.color = 'white';
    nextBtn.background = 'blue';
    nextBtn.left = '100px';
    nextBtn.onPointerClickObservable.add(() => {
      this.nextPage();
    });
    navPanel.addControl(nextBtn);
    this.nextBtn = nextBtn;
  }

  createActionButtons(parent) {
    const actionPanel = new Rectangle();
    actionPanel.width = '500px';
    actionPanel.height = '50px';
    actionPanel.bottom = '-43%';
    actionPanel.background = 'transparent';
    actionPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    parent.addControl(actionPanel);
    
    const clearBtn = Button.CreateSimpleButton('clear', 'Clear Page');
    clearBtn.width = '100px';
    clearBtn.height = '40px';
    clearBtn.fontSize = 16;
    clearBtn.color = 'white';
    clearBtn.background = 'orange';
    clearBtn.left = '-150px';
    clearBtn.onPointerClickObservable.add(() => {
      this.clearCurrentPage();
    });
    actionPanel.addControl(clearBtn);
    
    const saveBtn = Button.CreateSimpleButton('save', 'Save Story');
    saveBtn.width = '100px';
    saveBtn.height = '40px';
    saveBtn.fontSize = 16;
    saveBtn.color = 'white';
    saveBtn.background = 'green';
    saveBtn.onPointerClickObservable.add(() => {
      this.saveStory();
    });
    actionPanel.addControl(saveBtn);
    
    const finishBtn = Button.CreateSimpleButton('finish', 'Finish');
    finishBtn.width = '100px';
    finishBtn.height = '40px';
    finishBtn.fontSize = 16;
    finishBtn.color = 'white';
    finishBtn.background = 'purple';
    finishBtn.left = '150px';
    finishBtn.onPointerClickObservable.add(() => {
      this.finishStory();
    });
    actionPanel.addControl(finishBtn);
  }

  async setupAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Store recording for current page
        if (!this.storyPages[this.currentPage]) {
          this.storyPages[this.currentPage] = { text: '', stamps: [], audio: null };
        }
        this.storyPages[this.currentPage].audio = audioUrl;
        
        this.audioChunks = [];
        this.playBtn.isEnabled = true;
        
        // Show success message
        this.showMessage('Recording saved! 🎉');
      };
    } catch (error) {
      console.error('Error setting up audio recording:', error);
      this.recordBtn.isEnabled = false;
      this.recordBtn.textBlock.text = 'No Microphone';
    }
  }

  toggleRecording() {
    if (!this.mediaRecorder) return;
    
    if (this.recording) {
      // Stop recording
      this.mediaRecorder.stop();
      this.recording = false;
      this.recordBtn.textBlock.text = '🎤 Record Story';
      this.recordBtn.background = 'red';
    } else {
      // Start recording
      this.audioChunks = [];
      this.mediaRecorder.start();
      this.recording = true;
      this.recordBtn.textBlock.text = '⏹️ Stop';
      this.recordBtn.background = 'darkred';
      
      // Visual feedback
      let pulseInterval = setInterval(() => {
        if (this.recording) {
          this.recordBtn.alpha = this.recordBtn.alpha === 1 ? 0.7 : 1;
        } else {
          this.recordBtn.alpha = 1;
          clearInterval(pulseInterval);
        }
      }, 500);
    }
  }

  playRecording() {
    const page = this.storyPages[this.currentPage];
    if (page && page.audio) {
      const audio = new Audio(page.audio);
      audio.play();
      
      // Visual feedback
      this.playBtn.background = 'darkgreen';
      audio.onended = () => {
        this.playBtn.background = 'green';
      };
    }
  }

  addStampToStory(stamp) {
    // Initialize page if needed
    if (!this.storyPages[this.currentPage]) {
      this.storyPages[this.currentPage] = { text: '', stamps: [], audio: null };
    }
    
    const page = this.storyPages[this.currentPage];
    
    // Add stamp to page (max 6 stamps)
    if (page.stamps.length < 6) {
      page.stamps.push(stamp);
      this.updateStoryDisplay();
      
      // Animate stamp appearance
      const stampText = new TextBlock();
      stampText.text = stamp.emoji;
      stampText.fontSize = 40;
      stampText.left = `${(page.stamps.length - 1) * 80 - 200}px`;
      
      // Animation
      stampText.alpha = 0;
      this.stampsDisplay.addControl(stampText);
      
      let alpha = 0;
      const fadeIn = setInterval(() => {
        alpha += 0.1;
        stampText.alpha = alpha;
        if (alpha >= 1) {
          clearInterval(fadeIn);
        }
      }, 20);
      
      // Show stamp name
      this.showMessage(`Added ${stamp.name} to your story!`);
    } else {
      this.showMessage('Page is full! Go to next page.');
    }
  }

  updateStoryDisplay() {
    const page = this.storyPages[this.currentPage];
    if (!page) return;
    
    // Clear stamps display
    this.stampsDisplay.children.forEach(child => {
      this.stampsDisplay.removeControl(child);
    });
    
    // Redraw stamps
    page.stamps.forEach((stamp, index) => {
      const stampText = new TextBlock();
      stampText.text = stamp.emoji;
      stampText.fontSize = 40;
      stampText.left = `${index * 80 - 200}px`;
      this.stampsDisplay.addControl(stampText);
    });
    
    // Update text if any
    this.pageText.text = page.text || 'Tell your story here...';
  }

  clearCurrentPage() {
    if (!this.storyPages[this.currentPage]) {
      this.storyPages[this.currentPage] = { text: '', stamps: [], audio: null };
    }
    
    this.storyPages[this.currentPage] = { text: '', stamps: [], audio: null };
    this.updateStoryDisplay();
    this.playBtn.isEnabled = false;
    this.showMessage('Page cleared!');
  }

  nextPage() {
    // Save current page
    if (!this.storyPages[this.currentPage]) {
      this.storyPages[this.currentPage] = { text: '', stamps: [], audio: null };
    }
    
    this.currentPage++;
    if (this.currentPage >= 10) {
      this.currentPage = 9; // Max 10 pages
      this.showMessage('This is the last page!');
      return;
    }
    
    this.updatePageDisplay();
  }

  previousPage() {
    this.currentPage = Math.max(0, this.currentPage - 1);
    this.updatePageDisplay();
  }

  updatePageDisplay() {
    this.pageIndicator.text = `Page ${this.currentPage + 1}`;
    this.prevBtn.isEnabled = this.currentPage > 0;
    this.nextBtn.isEnabled = this.currentPage < 9;
    
    this.updateStoryDisplay();
    
    // Update play button state
    const page = this.storyPages[this.currentPage];
    this.playBtn.isEnabled = page && page.audio !== null;
  }

  showMessage(message) {
    const messageText = new TextBlock();
    messageText.text = message;
    messageText.fontSize = 20;
    messageText.color = 'green';
    messageText.fontWeight = 'bold';
    messageText.top = '20%';
    this.gui.addControl(messageText);
    
    // Fade out and remove
    setTimeout(() => {
      let alpha = 1;
      const fadeOut = setInterval(() => {
        alpha -= 0.05;
        messageText.alpha = alpha;
        if (alpha <= 0) {
          this.gui.removeControl(messageText);
          clearInterval(fadeOut);
        }
      }, 20);
    }, 2000);
  }

  saveStory() {
    // Save to localStorage
    const storyData = {
      pages: this.storyPages,
      createdAt: new Date().toISOString(),
      title: `Space Story ${new Date().toLocaleDateString()}`
    };
    
    const savedStories = JSON.parse(localStorage.getItem('savedStories') || '[]');
    savedStories.push(storyData);
    
    // Keep only last 10 stories
    if (savedStories.length > 10) {
      savedStories.shift();
    }
    
    localStorage.setItem('savedStories', JSON.stringify(savedStories));
    this.showMessage('Story saved! 📚');
  }

  finishStory() {
    // Calculate stats
    const totalPages = this.storyPages.filter(p => p && (p.stamps.length > 0 || p.audio)).length;
    const totalStamps = this.storyPages.reduce((sum, page) => {
      return sum + (page ? page.stamps.length : 0);
    }, 0);
    const totalRecordings = this.storyPages.filter(p => p && p.audio).length;
    
    // Show completion screen
    const completePanel = new Rectangle();
    completePanel.width = '500px';
    completePanel.height = '400px';
    completePanel.cornerRadius = 20;
    completePanel.color = 'gold';
    completePanel.thickness = 3;
    completePanel.background = 'rgba(255,255,255,0.95)';
    this.gui.addControl(completePanel);
    
    const completeText = new TextBlock();
    completeText.text = 
      `🌟 Amazing Story! 🌟\n\n` +
      `You created:\n` +
      `📄 ${totalPages} pages\n` +
      `✨ ${totalStamps} stamps\n` +
      `🎤 ${totalRecordings} recordings\n\n` +
      `Great creativity!`;
    completeText.fontSize = 24;
    completeText.color = 'darkblue';
    completeText.textWrapping = true;
    completeText.lineSpacing = '5px';
    completePanel.addControl(completeText);
    
    const continueBtn = Button.CreateSimpleButton('continue', 'Continue');
    continueBtn.width = '150px';
    continueBtn.height = '40px';
    continueBtn.fontSize = 16;
    continueBtn.color = 'white';
    continueBtn.background = 'blue';
    continueBtn.top = '150px';
    continueBtn.onPointerClickObservable.add(() => {
      if (this.onComplete) {
        this.onComplete({
          pages: totalPages,
          stamps: totalStamps,
          recordings: totalRecordings
        });
      }
    });
    completePanel.addControl(continueBtn);
  }

  dispose() {
    if (this.gui) {
      this.gui.dispose();
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    // Clean up audio URLs
    this.storyPages.forEach(page => {
      if (page && page.audio) {
        URL.revokeObjectURL(page.audio);
      }
    });
    
    this.stampMeshes.forEach(mesh => {
      if (mesh) mesh.dispose();
    });
  }
}
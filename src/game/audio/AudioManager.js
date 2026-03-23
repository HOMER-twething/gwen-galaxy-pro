import { Howl, Howler } from 'howler';

export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.music = null;
    this.currentMusicKey = null;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.voiceVolume = 1.0;
    this.isMuted = false;
    this.letterSounds = new Map();
    this.musicalMode = false;
    this.dynamicMusicSpeed = 1.0;
    
    this.init();
  }

  init() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('audioSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.musicVolume = settings.musicVolume || 0.5;
      this.sfxVolume = settings.sfxVolume || 0.7;
      this.voiceVolume = settings.voiceVolume || 1.0;
      this.musicalMode = settings.musicalMode || false;
    }
    
    // Initialize Howler global settings
    Howler.volume(1.0);
    
    // Initialize letter sounds (musical notes)
    this.initializeLetterSounds();
    
    // Load core sound effects
    this.loadCoreSounds();
  }

  initializeLetterSounds() {
    // Map letters to musical notes (C major scale and beyond)
    const noteFrequencies = {
      'A': 261.63, // C4
      'B': 293.66, // D4
      'C': 329.63, // E4
      'D': 349.23, // F4
      'E': 392.00, // G4
      'F': 440.00, // A4
      'G': 493.88, // B4
      'H': 523.25, // C5
      'I': 587.33, // D5
      'J': 659.25, // E5
      'K': 698.46, // F5
      'L': 783.99, // G5
      'M': 880.00, // A5
      'N': 987.77, // B5
      'O': 1046.50, // C6
      'P': 1174.66, // D6
      'Q': 1318.51, // E6
      'R': 1396.91, // F6
      'S': 1567.98, // G6
      'T': 1760.00, // A6
      'U': 1975.53, // B6
      'V': 2093.00, // C7
      'W': 2349.32, // D7
      'X': 2637.02, // E7
      'Y': 2793.83, // F7
      'Z': 3135.96  // G7
    };
    
    // Create oscillator-based sounds for each letter
    Object.entries(noteFrequencies).forEach(([letter, frequency]) => {
      this.letterSounds.set(letter, {
        frequency,
        duration: 300,
        waveform: 'sine'
      });
    });
  }

  loadCoreSounds() {
    // Success sounds
    this.loadSound('success1', '/sounds/success1.mp3', 'sfx');
    this.loadSound('success2', '/sounds/success2.mp3', 'sfx');
    this.loadSound('success3', '/sounds/success3.mp3', 'sfx');
    
    // Error sounds
    this.loadSound('error', '/sounds/error.mp3', 'sfx');
    this.loadSound('wrong', '/sounds/wrong.mp3', 'sfx');
    
    // UI sounds
    this.loadSound('click', '/sounds/click.mp3', 'sfx');
    this.loadSound('hover', '/sounds/hover.mp3', 'sfx');
    this.loadSound('swoosh', '/sounds/swoosh.mp3', 'sfx');
    
    // Game sounds
    this.loadSound('collect', '/sounds/collect.mp3', 'sfx');
    this.loadSound('powerup', '/sounds/powerup.mp3', 'sfx');
    this.loadSound('explosion', '/sounds/explosion.mp3', 'sfx');
    this.loadSound('laser', '/sounds/laser.mp3', 'sfx');
    this.loadSound('jump', '/sounds/jump.mp3', 'sfx');
    
    // Achievement sounds
    this.loadSound('achievement', '/sounds/achievement.mp3', 'sfx');
    this.loadSound('levelup', '/sounds/levelup.mp3', 'sfx');
    this.loadSound('bonus', '/sounds/bonus.mp3', 'sfx');
    
    // Ambient/Music
    this.loadSound('menuMusic', '/music/menu.mp3', 'music');
    this.loadSound('gameMusic', '/music/game.mp3', 'music');
    this.loadSound('victoryMusic', '/music/victory.mp3', 'music');
    this.loadSound('spaceAmbient', '/music/space-ambient.mp3', 'music');
  }

  loadSound(key, url, category = 'sfx') {
    // Create fallback for missing audio files
    try {
      const sound = new Howl({
        src: [url],
        volume: category === 'music' ? this.musicVolume : this.sfxVolume,
        loop: category === 'music',
        onloaderror: () => {
          console.warn(`Failed to load sound: ${key}`);
          // Create synthetic fallback sound
          this.createSyntheticSound(key, category);
        }
      });
      
      this.sounds.set(key, { howl: sound, category });
    } catch (error) {
      console.warn(`Error loading sound ${key}:`, error);
      this.createSyntheticSound(key, category);
    }
  }

  createSyntheticSound(key, category) {
    // Create Web Audio API fallback for missing sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const syntheticSound = {
      play: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different patterns for different sound types
        if (key.includes('success')) {
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        } else if (key.includes('error') || key.includes('wrong')) {
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        } else {
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        }
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      },
      stop: () => {},
      volume: (v) => {},
      rate: (r) => {}
    };
    
    this.sounds.set(key, { howl: syntheticSound, category, synthetic: true });
  }

  playSound(key, options = {}) {
    if (this.isMuted) return;
    
    const sound = this.sounds.get(key);
    if (!sound) {
      console.warn(`Sound not found: ${key}`);
      return;
    }
    
    if (sound.synthetic) {
      sound.howl.play();
      return;
    }
    
    const { volume, rate, loop } = options;
    
    if (volume !== undefined) {
      sound.howl.volume(volume * (sound.category === 'music' ? this.musicVolume : this.sfxVolume));
    }
    
    if (rate !== undefined) {
      sound.howl.rate(rate);
    }
    
    if (loop !== undefined) {
      sound.howl.loop(loop);
    }
    
    const id = sound.howl.play();
    return id;
  }

  stopSound(key) {
    const sound = this.sounds.get(key);
    if (sound && !sound.synthetic) {
      sound.howl.stop();
    }
  }

  playMusic(key, fadeIn = true) {
    // Stop current music
    if (this.currentMusicKey) {
      this.stopMusic(true);
    }
    
    const music = this.sounds.get(key);
    if (!music || music.category !== 'music') {
      console.warn(`Music not found: ${key}`);
      return;
    }
    
    this.currentMusicKey = key;
    this.music = music.howl;
    
    if (fadeIn && !music.synthetic) {
      this.music.volume(0);
      this.music.play();
      this.music.fade(0, this.musicVolume, 1000);
    } else {
      this.music.volume(this.musicVolume);
      this.music.play();
    }
  }

  stopMusic(fadeOut = true) {
    if (!this.music) return;
    
    if (fadeOut && !this.sounds.get(this.currentMusicKey)?.synthetic) {
      this.music.fade(this.musicVolume, 0, 1000);
      setTimeout(() => {
        this.music.stop();
        this.music = null;
        this.currentMusicKey = null;
      }, 1000);
    } else {
      this.music.stop();
      this.music = null;
      this.currentMusicKey = null;
    }
  }

  setMusicSpeed(speed) {
    this.dynamicMusicSpeed = speed;
    if (this.music && !this.sounds.get(this.currentMusicKey)?.synthetic) {
      this.music.rate(speed);
    }
  }

  playLetterSound(letter) {
    if (!this.musicalMode) return;
    
    const letterData = this.letterSounds.get(letter.toUpperCase());
    if (!letterData) return;
    
    // Create oscillator for letter
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = letterData.waveform;
    oscillator.frequency.setValueAtTime(letterData.frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + letterData.duration / 1000);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + letterData.duration / 1000);
  }

  playSpellingSequence(word) {
    if (!this.musicalMode) return;
    
    const letters = word.toUpperCase().split('');
    letters.forEach((letter, index) => {
      setTimeout(() => {
        this.playLetterSound(letter);
      }, index * 200);
    });
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume(this.musicVolume);
    }
    this.saveSettings();
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  setVoiceVolume(volume) {
    this.voiceVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    Howler.mute(this.isMuted);
    return this.isMuted;
  }

  toggleMusicalMode() {
    this.musicalMode = !this.musicalMode;
    this.saveSettings();
    return this.musicalMode;
  }

  saveSettings() {
    const settings = {
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      voiceVolume: this.voiceVolume,
      musicalMode: this.musicalMode
    };
    localStorage.setItem('audioSettings', JSON.stringify(settings));
  }

  playRandomSuccess() {
    const successSounds = ['success1', 'success2', 'success3'];
    const randomSound = successSounds[Math.floor(Math.random() * successSounds.length)];
    this.playSound(randomSound);
  }

  playUISound(action) {
    const uiSounds = {
      hover: 'hover',
      click: 'click',
      open: 'swoosh',
      close: 'swoosh',
      error: 'error',
      success: 'success1'
    };
    
    const soundKey = uiSounds[action];
    if (soundKey) {
      this.playSound(soundKey, { volume: 0.5 });
    }
  }

  createDynamicMusic(tempo, intensity) {
    // Create procedural music based on game state
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const createBeat = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.frequency.setValueAtTime(60 + intensity * 20, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    // Create beat pattern
    const beatInterval = (60 / tempo) * 1000;
    return setInterval(createBeat, beatInterval);
  }

  dispose() {
    // Clean up all sounds
    this.sounds.forEach((sound, key) => {
      if (!sound.synthetic) {
        sound.howl.unload();
      }
    });
    
    this.sounds.clear();
    this.letterSounds.clear();
    
    if (this.music) {
      this.music.stop();
      this.music = null;
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
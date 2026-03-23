// Game Configuration
export const config = {
  // Game Settings
  game: {
    title: "Gwen's Galaxy Pro",
    version: "1.0.0",
    targetFPS: 60,
    defaultVolume: 0.7,
    autoSave: true,
    saveInterval: 30000, // 30 seconds
  },

  // Voice Recognition Settings
  voice: {
    enabled: true,
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    confidenceThreshold: 0.7,
    timeout: 5000, // 5 seconds
  },

  // Difficulty Settings
  difficulty: {
    adaptive: true,
    startingLevel: 1,
    maxLevel: 5,
    
    // Time limits (in seconds)
    spelling: {
      easy: 30,
      medium: 20,
      hard: 15,
    },
    math: {
      easy: 20,
      medium: 15,
      hard: 10,
    },
  },

  // Progression Settings
  progression: {
    xpPerCorrectAnswer: 10,
    xpPerPerfectRound: 50,
    xpPerAchievement: 25,
    coinsPerLevel: 50,
    
    // XP needed per level
    levelRequirements: [
      0,    // Level 1
      100,  // Level 2
      250,  // Level 3
      500,  // Level 4
      800,  // Level 5
      1200, // Level 6
      1700, // Level 7
      2300, // Level 8
      3000, // Level 9
      4000, // Level 10
    ],
  },

  // Parent Controls
  parentalControls: {
    requirePinForSettings: false,
    pin: '1234',
    
    // Time limits (in minutes)
    dailyLimit: 60,
    sessionLimit: 30,
    
    // Content filters
    enabledModes: ['spelling', 'math', 'story', 'creative'],
    maxDifficulty: 5,
  },

  // Graphics Settings
  graphics: {
    quality: 'auto', // 'low', 'medium', 'high', 'auto'
    particles: true,
    shadows: true,
    antialiasing: true,
    bloom: true,
    
    // Performance thresholds
    lowFPSThreshold: 30,
    targetFPS: 60,
  },

  // Audio Settings
  audio: {
    masterVolume: 0.7,
    musicVolume: 0.5,
    effectsVolume: 0.8,
    voiceVolume: 1.0,
    
    // Audio files would be referenced here
    music: {
      menu: 'menu-theme',
      game: 'game-theme',
      victory: 'victory-fanfare',
    },
    
    effects: {
      correct: 'success-chime',
      incorrect: 'error-buzz',
      levelUp: 'level-up',
      achievement: 'achievement-unlock',
    },
  },

  // API Endpoints (if using backend)
  api: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://api.gwensgalaxy.com' 
      : 'http://localhost:3001',
    endpoints: {
      progress: '/api/progress',
      achievements: '/api/achievements',
      leaderboard: '/api/leaderboard',
    },
  },

  // Feature Flags
  features: {
    multiplayer: false,
    cloudSave: false,
    leaderboards: false,
    socialSharing: true,
    analytics: false,
  },

  // Debug Settings
  debug: {
    enabled: process.env.NODE_ENV !== 'production',
    showFPS: true,
    showStats: false,
    skipIntro: false,
    unlockAll: false,
  },
};

export default config;
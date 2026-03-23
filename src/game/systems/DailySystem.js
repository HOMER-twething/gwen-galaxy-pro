export class DailySystem {
  constructor() {
    this.challenges = [
      { id: 'spell5', name: 'Spell 5 Words', type: 'spelling', target: 5, coins: 10 },
      { id: 'math10', name: 'Solve 10 Math Problems', type: 'math', target: 10, coins: 15 },
      { id: 'streak3', name: 'Get a 3x Combo', type: 'combo', target: 3, coins: 20 },
      { id: 'score1000', name: 'Score 1000 Points', type: 'score', target: 1000, coins: 25 },
      { id: 'perfect', name: 'Perfect Round (No Mistakes)', type: 'perfect', target: 1, coins: 30 },
      { id: 'minigame', name: 'Play 3 Mini-Games', type: 'minigame', target: 3, coins: 35 },
      { id: 'voice10', name: '10 Voice Commands', type: 'voice', target: 10, coins: 20 },
      { id: 'fast5', name: 'Answer 5 in Under 3 Seconds', type: 'speed', target: 5, coins: 40 },
      { id: 'explore', name: 'Explore 3 Planets', type: 'explore', target: 3, coins: 25 },
      { id: 'master', name: 'Master Level Challenge', type: 'master', target: 1, coins: 50 }
    ];
    
    this.currentChallenge = null;
    this.progress = 0;
    this.completedToday = false;
    this.lastResetDate = null;
    this.totalCoins = 0;
    this.streakDays = 0;
    this.notificationsEnabled = false;
    this.lastNotificationTime = null;
    
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.checkDailyReset();
    
    if (this.notificationsEnabled) {
      this.scheduleNotification();
    }
  }

  loadFromStorage() {
    const savedData = localStorage.getItem('dailySystem');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.lastResetDate = data.lastResetDate;
      this.totalCoins = data.totalCoins || 0;
      this.streakDays = data.streakDays || 0;
      this.completedToday = data.completedToday || false;
      this.currentChallenge = data.currentChallenge;
      this.progress = data.progress || 0;
      this.notificationsEnabled = data.notificationsEnabled || false;
      this.lastNotificationTime = data.lastNotificationTime;
    } else {
      this.selectNewChallenge();
      this.save();
    }
  }

  save() {
    const data = {
      lastResetDate: this.lastResetDate,
      totalCoins: this.totalCoins,
      streakDays: this.streakDays,
      completedToday: this.completedToday,
      currentChallenge: this.currentChallenge,
      progress: this.progress,
      notificationsEnabled: this.notificationsEnabled,
      lastNotificationTime: this.lastNotificationTime
    };
    localStorage.setItem('dailySystem', JSON.stringify(data));
  }

  checkDailyReset() {
    const now = new Date();
    const today = now.toDateString();
    
    if (this.lastResetDate !== today) {
      // It's a new day!
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if streak continues
      if (this.lastResetDate === yesterday.toDateString() && this.completedToday) {
        this.streakDays++;
      } else if (this.lastResetDate !== yesterday.toDateString()) {
        // Streak broken
        this.streakDays = 0;
      }
      
      // Reset for new day
      this.lastResetDate = today;
      this.completedToday = false;
      this.progress = 0;
      this.selectNewChallenge();
      this.save();
      
      return true; // New day detected
    }
    
    return false; // Same day
  }

  selectNewChallenge() {
    // Select challenge based on difficulty progression
    const difficultyLevel = Math.min(Math.floor(this.streakDays / 3), 3);
    const availableChallenges = this.challenges.filter((c, index) => {
      const minLevel = Math.floor(index / 3);
      const maxLevel = minLevel + 1;
      return difficultyLevel >= minLevel && difficultyLevel <= maxLevel;
    });
    
    const randomIndex = Math.floor(Math.random() * availableChallenges.length);
    this.currentChallenge = availableChallenges[randomIndex];
    this.progress = 0;
  }

  getCurrentChallenge() {
    this.checkDailyReset();
    return {
      challenge: this.currentChallenge,
      progress: this.progress,
      completed: this.completedToday,
      streakDays: this.streakDays,
      totalCoins: this.totalCoins
    };
  }

  updateProgress(type, amount = 1) {
    if (this.completedToday || !this.currentChallenge) return;
    
    if (this.currentChallenge.type === type) {
      this.progress = Math.min(this.progress + amount, this.currentChallenge.target);
      
      if (this.progress >= this.currentChallenge.target) {
        this.completeChallenge();
      }
      
      this.save();
      return true;
    }
    
    return false;
  }

  completeChallenge() {
    if (this.completedToday) return;
    
    this.completedToday = true;
    const coinsEarned = this.currentChallenge.coins;
    
    // Bonus coins for streaks
    let bonusCoins = 0;
    if (this.streakDays >= 7) bonusCoins = 20;
    else if (this.streakDays >= 3) bonusCoins = 10;
    else if (this.streakDays >= 1) bonusCoins = 5;
    
    this.totalCoins += coinsEarned + bonusCoins;
    this.save();
    
    return {
      coins: coinsEarned,
      bonus: bonusCoins,
      total: this.totalCoins,
      streak: this.streakDays + 1
    };
  }

  spendCoins(amount) {
    if (this.totalCoins >= amount) {
      this.totalCoins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  getCoins() {
    return this.totalCoins;
  }

  addCoins(amount) {
    this.totalCoins += amount;
    this.save();
    return this.totalCoins;
  }

  enableNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.notificationsEnabled = true;
          this.save();
          this.scheduleNotification();
        }
      });
    }
  }

  scheduleNotification() {
    if (!this.notificationsEnabled) return;
    
    const now = new Date();
    const hour = now.getHours();
    
    // Check if it's 9 AM and we haven't sent today's notification
    if (hour === 9 && !this.completedToday) {
      const today = now.toDateString();
      
      if (this.lastNotificationTime !== today) {
        this.sendNotification();
        this.lastNotificationTime = today;
        this.save();
      }
    }
    
    // Check again in an hour
    setTimeout(() => this.scheduleNotification(), 3600000);
  }

  sendNotification() {
    if (!this.notificationsEnabled || !this.currentChallenge) return;
    
    const notification = new Notification("Daily Challenge Available! 🌟", {
      body: `Today's challenge: ${this.currentChallenge.name}\nReward: ${this.currentChallenge.coins} Galaxy Coins!`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'daily-challenge'
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  getStreakBonus() {
    if (this.streakDays >= 30) return { multiplier: 2.0, title: 'LEGENDARY!' };
    if (this.streakDays >= 14) return { multiplier: 1.5, title: 'AMAZING!' };
    if (this.streakDays >= 7) return { multiplier: 1.3, title: 'FANTASTIC!' };
    if (this.streakDays >= 3) return { multiplier: 1.2, title: 'GREAT!' };
    if (this.streakDays >= 1) return { multiplier: 1.1, title: 'GOOD!' };
    return { multiplier: 1.0, title: '' };
  }

  getChallengeHistory() {
    const history = localStorage.getItem('challengeHistory');
    return history ? JSON.parse(history) : [];
  }

  saveChallengeToHistory(challenge, completed) {
    const history = this.getChallengeHistory();
    history.push({
      date: new Date().toISOString(),
      challenge: challenge.name,
      completed: completed,
      coins: completed ? challenge.coins : 0
    });
    
    // Keep only last 30 days
    if (history.length > 30) {
      history.shift();
    }
    
    localStorage.setItem('challengeHistory', JSON.stringify(history));
  }

  getStatistics() {
    const history = this.getChallengeHistory();
    const completed = history.filter(h => h.completed).length;
    const total = history.length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const totalEarned = history.reduce((sum, h) => sum + h.coins, 0);
    
    return {
      streakDays: this.streakDays,
      totalCoins: this.totalCoins,
      challengesCompleted: completed,
      challengesTotal: total,
      completionRate: completionRate.toFixed(1),
      averageCoinsPerDay: total > 0 ? (totalEarned / total).toFixed(1) : 0,
      currentLevel: Math.floor(this.totalCoins / 100) + 1
    };
  }
}
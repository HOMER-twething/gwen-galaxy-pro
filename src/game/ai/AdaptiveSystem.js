export class AdaptiveSystem {
  constructor() {
    this.performanceHistory = [];
    this.maxHistorySize = 100;
    this.difficultyMultiplier = 1.0;
    this.lastAdjustmentTime = Date.now();
    this.adjustmentInterval = 60000; // Adjust every minute
    
    // Learning profiles for different skills
    this.skillProfiles = {
      letters: { attempts: [], accuracy: 0, avgTime: 0 },
      numbers: { attempts: [], accuracy: 0, avgTime: 0 },
      spelling: { attempts: [], accuracy: 0, avgTime: 0 },
      math: { attempts: [], accuracy: 0, avgTime: 0 },
      voice: { attempts: [], accuracy: 0, avgTime: 0 },
      memory: { attempts: [], accuracy: 0, avgTime: 0 }
    };
    
    // Individual letter/number tracking
    this.characterStats = {};
    
    // Session stats
    this.sessionStats = {
      startTime: Date.now(),
      totalAttempts: 0,
      correctAttempts: 0,
      longestStreak: 0,
      currentStreak: 0,
      focusScore: 100
    };
    
    this.loadFromStorage();
  }

  loadFromStorage() {
    const savedData = localStorage.getItem('adaptiveSystem');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.performanceHistory = data.performanceHistory || [];
      this.skillProfiles = data.skillProfiles || this.skillProfiles;
      this.characterStats = data.characterStats || {};
      this.difficultyMultiplier = data.difficultyMultiplier || 1.0;
    }
  }

  save() {
    const data = {
      performanceHistory: this.performanceHistory.slice(-50), // Keep last 50
      skillProfiles: this.skillProfiles,
      characterStats: this.characterStats,
      difficultyMultiplier: this.difficultyMultiplier
    };
    localStorage.setItem('adaptiveSystem', JSON.stringify(data));
  }

  trackPerformance(category, item, correct, timeToAnswer, context = {}) {
    const now = Date.now();
    
    // Create performance record
    const performance = {
      timestamp: now,
      category: category,
      item: item,
      correct: correct,
      timeToAnswer: timeToAnswer,
      difficulty: this.difficultyMultiplier,
      context: context
    };
    
    // Add to history
    this.performanceHistory.push(performance);
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
    
    // Update session stats
    this.sessionStats.totalAttempts++;
    if (correct) {
      this.sessionStats.correctAttempts++;
      this.sessionStats.currentStreak++;
      this.sessionStats.longestStreak = Math.max(
        this.sessionStats.longestStreak,
        this.sessionStats.currentStreak
      );
    } else {
      this.sessionStats.currentStreak = 0;
    }
    
    // Update skill profile
    if (this.skillProfiles[category]) {
      const profile = this.skillProfiles[category];
      profile.attempts.push({ correct, time: timeToAnswer });
      
      // Keep only recent attempts
      if (profile.attempts.length > 20) {
        profile.attempts.shift();
      }
      
      // Calculate accuracy and average time
      const recent = profile.attempts.slice(-10);
      profile.accuracy = recent.filter(a => a.correct).length / recent.length;
      profile.avgTime = recent.reduce((sum, a) => sum + a.time, 0) / recent.length;
    }
    
    // Update character-specific stats (for letters/numbers)
    if (category === 'letters' || category === 'numbers') {
      if (!this.characterStats[item]) {
        this.characterStats[item] = {
          attempts: 0,
          correct: 0,
          totalTime: 0,
          lastSeen: now,
          difficulty: 0
        };
      }
      
      const stats = this.characterStats[item];
      stats.attempts++;
      if (correct) stats.correct++;
      stats.totalTime += timeToAnswer;
      stats.lastSeen = now;
      
      // Calculate difficulty score for this character
      const accuracy = stats.correct / stats.attempts;
      const avgTime = stats.totalTime / stats.attempts;
      stats.difficulty = this.calculateItemDifficulty(accuracy, avgTime);
    }
    
    // Update focus score (attention tracking)
    this.updateFocusScore(correct, timeToAnswer);
    
    // Check if we should adjust difficulty
    if (now - this.lastAdjustmentTime > this.adjustmentInterval) {
      this.adjustDifficulty();
      this.lastAdjustmentTime = now;
    }
    
    this.save();
    
    // Return recommended next action
    return this.getRecommendation(category);
  }

  calculateItemDifficulty(accuracy, avgTime) {
    // Lower accuracy = higher difficulty
    const accuracyScore = 1 - accuracy;
    
    // Normalize time (assume 3 seconds is average)
    const timeScore = Math.min(avgTime / 3000, 2) - 1;
    
    // Combine scores
    return (accuracyScore * 0.7 + timeScore * 0.3);
  }

  updateFocusScore(correct, timeToAnswer) {
    // Focus degrades over time and with mistakes
    const timePenalty = Math.min(timeToAnswer / 10000, 1) * 5;
    const mistakePenalty = correct ? 0 : 10;
    
    this.sessionStats.focusScore = Math.max(
      0,
      Math.min(100, this.sessionStats.focusScore - timePenalty - mistakePenalty + (correct ? 5 : 0))
    );
    
    // If focus is low, recommend a break
    if (this.sessionStats.focusScore < 30) {
      return 'break_recommended';
    }
    
    return null;
  }

  adjustDifficulty() {
    const recentPerformance = this.performanceHistory.slice(-20);
    if (recentPerformance.length < 5) return; // Not enough data
    
    const accuracy = recentPerformance.filter(p => p.correct).length / recentPerformance.length;
    const avgTime = recentPerformance.reduce((sum, p) => sum + p.timeToAnswer, 0) / recentPerformance.length;
    
    const previousMultiplier = this.difficultyMultiplier;
    
    // Adjust based on accuracy
    if (accuracy > 0.85 && avgTime < 2000) {
      // Too easy - increase difficulty
      this.difficultyMultiplier = Math.min(2.0, this.difficultyMultiplier * 1.1);
    } else if (accuracy > 0.75) {
      // Just right - small increase
      this.difficultyMultiplier = Math.min(2.0, this.difficultyMultiplier * 1.05);
    } else if (accuracy < 0.5) {
      // Too hard - decrease difficulty
      this.difficultyMultiplier = Math.max(0.5, this.difficultyMultiplier * 0.9);
    } else if (accuracy < 0.65) {
      // Slightly too hard
      this.difficultyMultiplier = Math.max(0.5, this.difficultyMultiplier * 0.95);
    }
    
    // Check for frustration patterns
    const recentMistakes = recentPerformance.slice(-5).filter(p => !p.correct).length;
    if (recentMistakes >= 4) {
      // Multiple recent mistakes - reduce difficulty more
      this.difficultyMultiplier = Math.max(0.5, this.difficultyMultiplier * 0.85);
    }
    
    // Check for boredom patterns (too fast, too accurate)
    if (accuracy === 1 && avgTime < 1500) {
      // Perfect and fast - bigger difficulty jump
      this.difficultyMultiplier = Math.min(2.0, this.difficultyMultiplier * 1.2);
    }
    
    // Round to 2 decimal places
    this.difficultyMultiplier = Math.round(this.difficultyMultiplier * 100) / 100;
    
    return {
      previous: previousMultiplier,
      current: this.difficultyMultiplier,
      reason: this.getDifficultyChangeReason(accuracy, avgTime)
    };
  }

  getDifficultyChangeReason(accuracy, avgTime) {
    if (accuracy > 0.85 && avgTime < 2000) return 'mastery_detected';
    if (accuracy > 0.75) return 'good_performance';
    if (accuracy < 0.5) return 'struggling_detected';
    if (accuracy < 0.65) return 'needs_practice';
    return 'maintaining_level';
  }

  getDifficultyMultiplier() {
    return this.difficultyMultiplier;
  }

  getWeakAreas() {
    const weakAreas = [];
    
    // Check skill profiles
    Object.entries(this.skillProfiles).forEach(([skill, profile]) => {
      if (profile.attempts.length >= 5 && profile.accuracy < 0.7) {
        weakAreas.push({
          type: 'skill',
          name: skill,
          accuracy: (profile.accuracy * 100).toFixed(1),
          avgTime: (profile.avgTime / 1000).toFixed(1),
          recommendation: this.getSkillRecommendation(skill, profile)
        });
      }
    });
    
    // Check individual characters
    Object.entries(this.characterStats).forEach(([char, stats]) => {
      if (stats.attempts >= 3) {
        const accuracy = stats.correct / stats.attempts;
        if (accuracy < 0.6) {
          weakAreas.push({
            type: 'character',
            name: char,
            accuracy: (accuracy * 100).toFixed(1),
            avgTime: ((stats.totalTime / stats.attempts) / 1000).toFixed(1),
            recommendation: `Practice ${char} more - try tracing it!`
          });
        }
      }
    });
    
    // Sort by accuracy (weakest first)
    weakAreas.sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
    
    return weakAreas.slice(0, 5); // Return top 5 weak areas
  }

  getSkillRecommendation(skill, profile) {
    const recommendations = {
      letters: 'Try the Letter Tracing activity',
      numbers: 'Practice counting with visual aids',
      spelling: 'Start with shorter words',
      math: 'Review basic operations',
      voice: 'Practice speaking clearly and slowly',
      memory: 'Try memory games with fewer items'
    };
    
    return recommendations[skill] || 'Keep practicing!';
  }

  getRecommendation(lastCategory) {
    // Check for break need
    if (this.sessionStats.focusScore < 30) {
      return {
        type: 'break',
        message: 'Time for a quick break! Come back refreshed.',
        duration: 5
      };
    }
    
    // Check for weak areas to practice
    const weakAreas = this.getWeakAreas();
    if (weakAreas.length > 0 && Math.random() < 0.3) {
      const weakest = weakAreas[0];
      return {
        type: 'practice',
        category: weakest.type === 'skill' ? weakest.name : 'letters',
        target: weakest.name,
        message: `Let's practice ${weakest.name}!`
      };
    }
    
    // Check for variety
    const recentCategories = this.performanceHistory.slice(-10).map(p => p.category);
    const sameCategoryCount = recentCategories.filter(c => c === lastCategory).length;
    
    if (sameCategoryCount >= 7) {
      // Too much of the same - suggest variety
      const otherCategories = Object.keys(this.skillProfiles).filter(c => c !== lastCategory);
      const suggestion = otherCategories[Math.floor(Math.random() * otherCategories.length)];
      
      return {
        type: 'variety',
        category: suggestion,
        message: `Try something different - how about ${suggestion}?`
      };
    }
    
    // Check for challenge opportunity
    if (this.sessionStats.currentStreak >= 5) {
      return {
        type: 'challenge',
        message: 'Great streak! Ready for a harder challenge?',
        difficulty: Math.min(2.0, this.difficultyMultiplier * 1.2)
      };
    }
    
    // Default - continue current path
    return {
      type: 'continue',
      message: 'Keep going! You\'re doing great!'
    };
  }

  getSessionReport() {
    const duration = (Date.now() - this.sessionStats.startTime) / 1000 / 60; // in minutes
    const accuracy = this.sessionStats.totalAttempts > 0 ? 
      (this.sessionStats.correctAttempts / this.sessionStats.totalAttempts * 100).toFixed(1) : 0;
    
    return {
      duration: duration.toFixed(1),
      totalAttempts: this.sessionStats.totalAttempts,
      accuracy: accuracy,
      longestStreak: this.sessionStats.longestStreak,
      focusScore: this.sessionStats.focusScore.toFixed(0),
      difficultyLevel: this.getDifficultyLevel(),
      weakAreas: this.getWeakAreas(),
      strongAreas: this.getStrongAreas()
    };
  }

  getDifficultyLevel() {
    if (this.difficultyMultiplier >= 1.8) return 'Expert';
    if (this.difficultyMultiplier >= 1.5) return 'Advanced';
    if (this.difficultyMultiplier >= 1.2) return 'Intermediate';
    if (this.difficultyMultiplier >= 0.8) return 'Normal';
    return 'Easy';
  }

  getStrongAreas() {
    const strongAreas = [];
    
    Object.entries(this.skillProfiles).forEach(([skill, profile]) => {
      if (profile.attempts.length >= 5 && profile.accuracy >= 0.85) {
        strongAreas.push({
          name: skill,
          accuracy: (profile.accuracy * 100).toFixed(1),
          avgTime: (profile.avgTime / 1000).toFixed(1)
        });
      }
    });
    
    return strongAreas;
  }

  resetSession() {
    this.sessionStats = {
      startTime: Date.now(),
      totalAttempts: 0,
      correctAttempts: 0,
      longestStreak: 0,
      currentStreak: 0,
      focusScore: 100
    };
  }

  exportLearningData() {
    return {
      performanceHistory: this.performanceHistory,
      skillProfiles: this.skillProfiles,
      characterStats: this.characterStats,
      difficultyMultiplier: this.difficultyMultiplier,
      sessionReport: this.getSessionReport()
    };
  }

  importLearningData(data) {
    if (data.performanceHistory) this.performanceHistory = data.performanceHistory;
    if (data.skillProfiles) this.skillProfiles = data.skillProfiles;
    if (data.characterStats) this.characterStats = data.characterStats;
    if (data.difficultyMultiplier) this.difficultyMultiplier = data.difficultyMultiplier;
    this.save();
  }
}
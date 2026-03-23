import React, { useState, useEffect } from 'react';

export function ParentDashboard({ onClose }) {
  const [stats, setStats] = useState({
    totalScore: 0,
    gamesPlayed: 0,
    wordsSpelled: 0,
    mathProblems: 0,
    spaceRaceHighScore: 0,
    lastPlayed: null
  });

  useEffect(() => {
    // Load stats from localStorage
    const loadStats = () => {
      const saved = localStorage.getItem('gwenGalaxyStats');
      if (saved) {
        setStats(JSON.parse(saved));
      }
    };
    
    loadStats();
    
    // Update stats every second (in case game is updating them)
    const interval = setInterval(loadStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearStats = () => {
    if (window.confirm('Are you sure you want to clear all progress?')) {
      localStorage.removeItem('gwenGalaxyStats');
      setStats({
        totalScore: 0,
        gamesPlayed: 0,
        wordsSpelled: 0,
        mathProblems: 0,
        spaceRaceHighScore: 0,
        lastPlayed: null
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '20px',
        padding: '40px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '36px', margin: 0 }}>📊 Parent Dashboard</h1>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            ✖ Close
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <StatCard title="Total Score" value={stats.totalScore} icon="⭐" />
          <StatCard title="Games Played" value={stats.gamesPlayed} icon="🎮" />
          <StatCard title="Words Spelled" value={stats.wordsSpelled} icon="🔤" />
          <StatCard title="Math Problems" value={stats.mathProblems} icon="🔢" />
          <StatCard title="Space Race High" value={stats.spaceRaceHighScore} icon="🚀" />
          <StatCard 
            title="Last Played" 
            value={stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleDateString() : 'Never'} 
            icon="📅" 
          />
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>💡 Progress Insights</h2>
          <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
            <li>Average score per game: {stats.gamesPlayed ? Math.round(stats.totalScore / stats.gamesPlayed) : 0}</li>
            <li>Favorite activity: {getFavoriteActivity(stats)}</li>
            <li>Learning streak: {getStreak(stats)} days</li>
            <li>Achievement level: {getLevel(stats.totalScore)}</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={clearStats}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              background: 'rgba(255, 100, 100, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear All Progress
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '15px',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '36px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{value}</div>
      <div style={{ fontSize: '14px', opacity: 0.8 }}>{title}</div>
    </div>
  );
}

function getFavoriteActivity(stats) {
  const activities = [
    { name: 'Spelling', count: stats.wordsSpelled },
    { name: 'Math', count: stats.mathProblems },
    { name: 'Space Race', count: stats.spaceRaceHighScore > 0 ? 1 : 0 }
  ];
  
  const favorite = activities.reduce((max, activity) => 
    activity.count > max.count ? activity : max
  , { name: 'None yet', count: 0 });
  
  return favorite.name;
}

function getStreak(stats) {
  if (!stats.lastPlayed) return 0;
  const daysSince = Math.floor((Date.now() - new Date(stats.lastPlayed)) / (1000 * 60 * 60 * 24));
  return daysSince === 0 ? 1 : 0;
}

function getLevel(score) {
  if (score < 100) return '🌱 Beginner';
  if (score < 500) return '⭐ Star Student';
  if (score < 1000) return '🚀 Space Explorer';
  if (score < 2000) return '🏆 Galaxy Champion';
  return '👑 Universe Master';
}
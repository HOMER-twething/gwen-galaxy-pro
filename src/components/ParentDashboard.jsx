import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ParentDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [learningData, setLearningData] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [screenTimeSettings, setScreenTimeSettings] = useState({
    dailyLimit: 60,
    breakReminder: 20,
    enabled: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load from localStorage
    const adaptiveData = JSON.parse(localStorage.getItem('adaptiveSystem') || '{}');
    const dailyData = JSON.parse(localStorage.getItem('dailySystem') || '{}');
    const challengeHistory = JSON.parse(localStorage.getItem('challengeHistory') || '[]');
    
    // Process data for charts
    const processedData = processLearningData(adaptiveData, challengeHistory);
    setLearningData(processedData);
    
    // Generate weekly report
    const report = generateWeeklyReport(adaptiveData, dailyData, challengeHistory);
    setWeeklyReport(report);
    
    // Load voice recordings
    loadRecordings();
    
    // Load screen time settings
    const savedSettings = JSON.parse(localStorage.getItem('screenTimeSettings') || '{}');
    setScreenTimeSettings({ ...screenTimeSettings, ...savedSettings });
  };

  const processLearningData = (adaptiveData, history) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      
      const dayData = history.filter(h => 
        new Date(h.date).toLocaleDateString() === dateStr
      );
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        attempts: dayData.length,
        accuracy: dayData.length > 0 ? 
          (dayData.filter(d => d.completed).length / dayData.length * 100).toFixed(0) : 0,
        time: Math.floor(Math.random() * 60) + 20 // Simulated time in minutes
      });
    }
    
    // Skills breakdown
    const skills = adaptiveData.skillProfiles || {};
    const skillData = Object.entries(skills).map(([skill, data]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      accuracy: ((data.accuracy || 0) * 100).toFixed(0),
      attempts: data.attempts ? data.attempts.length : 0
    }));
    
    // Weak areas
    const weakAreas = [];
    if (adaptiveData.characterStats) {
      Object.entries(adaptiveData.characterStats).forEach(([char, stats]) => {
        const accuracy = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
        if (accuracy < 0.7) {
          weakAreas.push({
            item: char,
            accuracy: (accuracy * 100).toFixed(0),
            suggestion: `Practice ${char} with tracing exercises`
          });
        }
      });
    }
    
    return {
      weeklyProgress: last7Days,
      skillBreakdown: skillData,
      weakAreas: weakAreas.slice(0, 5)
    };
  };

  const generateWeeklyReport = (adaptiveData, dailyData, history) => {
    const thisWeek = history.filter(h => {
      const date = new Date(h.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });
    
    const lastWeek = history.filter(h => {
      const date = new Date(h.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return date < weekAgo && date >= twoWeeksAgo;
    });
    
    return {
      totalSessions: thisWeek.length,
      totalTime: thisWeek.length * 25, // Estimated minutes
      accuracy: thisWeek.length > 0 ?
        (thisWeek.filter(h => h.completed).length / thisWeek.length * 100).toFixed(0) : 0,
      improvement: ((thisWeek.length - lastWeek.length) / Math.max(lastWeek.length, 1) * 100).toFixed(0),
      streakDays: dailyData.streakDays || 0,
      totalCoins: dailyData.totalCoins || 0,
      achievements: [
        'Completed 5 spelling challenges',
        'Mastered letter "A"',
        'Achieved 3-day streak'
      ],
      recommendations: [
        'Focus on numbers 6-10',
        'Try the new Story Creator mode',
        'Practice lowercase letters'
      ]
    };
  };

  const loadRecordings = () => {
    // Load voice recordings from IndexedDB (simulated)
    const mockRecordings = [
      { date: new Date().toISOString(), letter: 'A', duration: '2s', quality: 'Good' },
      { date: new Date().toISOString(), letter: 'B', duration: '3s', quality: 'Needs work' },
      { date: new Date().toISOString(), word: 'STAR', duration: '5s', quality: 'Excellent' }
    ];
    setRecordings(mockRecordings);
  };

  const exportReport = () => {
    if (!weeklyReport) return;
    
    const reportText = `
Weekly Learning Report
======================
Date: ${new Date().toLocaleDateString()}

Summary:
- Total Sessions: ${weeklyReport.totalSessions}
- Total Time: ${weeklyReport.totalTime} minutes
- Average Accuracy: ${weeklyReport.accuracy}%
- Streak Days: ${weeklyReport.streakDays}
- Galaxy Coins: ${weeklyReport.totalCoins}

Achievements This Week:
${weeklyReport.achievements.map(a => `- ${a}`).join('\n')}

Recommendations:
${weeklyReport.recommendations.map(r => `- ${r}`).join('\n')}

Keep up the great work!
    `;
    
    // Create mailto link
    const subject = encodeURIComponent('Weekly Learning Report - Gwen\'s Galaxy Pro');
    const body = encodeURIComponent(reportText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const saveScreenTimeSettings = (newSettings) => {
    setScreenTimeSettings(newSettings);
    localStorage.setItem('screenTimeSettings', JSON.stringify(newSettings));
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="parent-dashboard">
      <div className="dashboard-header">
        <h1>👨‍👩‍👧 Parent Dashboard</h1>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'progress' ? 'active' : ''}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
        <button 
          className={activeTab === 'recordings' ? 'active' : ''}
          onClick={() => setActiveTab('recordings')}
        >
          Voice Recordings
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button 
          className={activeTab === 'activities' ? 'active' : ''}
          onClick={() => setActiveTab('activities')}
        >
          Offline Activities
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && weeklyReport && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>This Week</h3>
                <div className="stat-value">{weeklyReport.totalSessions}</div>
                <div className="stat-label">Sessions</div>
              </div>
              <div className="stat-card">
                <h3>Time Spent</h3>
                <div className="stat-value">{weeklyReport.totalTime}</div>
                <div className="stat-label">Minutes</div>
              </div>
              <div className="stat-card">
                <h3>Accuracy</h3>
                <div className="stat-value">{weeklyReport.accuracy}%</div>
                <div className="stat-label">Average</div>
              </div>
              <div className="stat-card">
                <h3>Streak</h3>
                <div className="stat-value">{weeklyReport.streakDays}</div>
                <div className="stat-label">Days</div>
              </div>
            </div>

            <div className="achievements-section">
              <h3>🏆 Recent Achievements</h3>
              <ul>
                {weeklyReport.achievements.map((achievement, i) => (
                  <li key={i}>✨ {achievement}</li>
                ))}
              </ul>
            </div>

            <div className="recommendations-section">
              <h3>💡 Recommendations</h3>
              <ul>
                {weeklyReport.recommendations.map((rec, i) => (
                  <li key={i}>→ {rec}</li>
                ))}
              </ul>
            </div>

            <button onClick={exportReport} className="export-btn">
              📧 Email Weekly Report
            </button>
          </div>
        )}

        {activeTab === 'progress' && learningData && (
          <div className="progress-tab">
            <div className="chart-section">
              <h3>Weekly Progress</h3>
              <div className="chart-container">
                <Line 
                  data={{
                    labels: learningData.weeklyProgress.map(d => d.date),
                    datasets: [{
                      label: 'Accuracy %',
                      data: learningData.weeklyProgress.map(d => d.accuracy),
                      borderColor: 'rgb(75, 192, 192)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      tension: 0.4
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            <div className="chart-section">
              <h3>Skills Breakdown</h3>
              <div className="chart-container">
                <Bar 
                  data={{
                    labels: learningData.skillBreakdown.map(s => s.skill),
                    datasets: [{
                      label: 'Accuracy %',
                      data: learningData.skillBreakdown.map(s => s.accuracy),
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                      ]
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {learningData.weakAreas.length > 0 && (
              <div className="weak-areas-section">
                <h3>Areas for Improvement</h3>
                <ul>
                  {learningData.weakAreas.map((area, i) => (
                    <li key={i}>
                      <strong>{area.item}</strong> - {area.accuracy}% accuracy
                      <br />
                      <small>{area.suggestion}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recordings' && (
          <div className="recordings-tab">
            <h3>🎤 Voice Practice Recordings</h3>
            <div className="recordings-list">
              {recordings.map((rec, i) => (
                <div key={i} className="recording-item">
                  <div className="recording-info">
                    <span className="recording-date">
                      {new Date(rec.date).toLocaleDateString()}
                    </span>
                    <span className="recording-content">
                      {rec.letter ? `Letter: ${rec.letter}` : `Word: ${rec.word}`}
                    </span>
                    <span className="recording-quality quality-${rec.quality.toLowerCase().replace(' ', '-')}">
                      {rec.quality}
                    </span>
                  </div>
                  <button className="play-btn">▶️ Play</button>
                </div>
              ))}
            </div>
            <p className="note">
              Voice recordings are stored locally for privacy. 
              You can review your child's pronunciation practice here.
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h3>⚙️ Screen Time Controls</h3>
            <div className="setting-item">
              <label>
                Daily Time Limit (minutes):
                <input 
                  type="number" 
                  value={screenTimeSettings.dailyLimit}
                  onChange={(e) => saveScreenTimeSettings({
                    ...screenTimeSettings,
                    dailyLimit: parseInt(e.target.value)
                  })}
                  min="10"
                  max="180"
                />
              </label>
            </div>
            <div className="setting-item">
              <label>
                Break Reminder (minutes):
                <input 
                  type="number" 
                  value={screenTimeSettings.breakReminder}
                  onChange={(e) => saveScreenTimeSettings({
                    ...screenTimeSettings,
                    breakReminder: parseInt(e.target.value)
                  })}
                  min="5"
                  max="60"
                />
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  checked={screenTimeSettings.enabled}
                  onChange={(e) => saveScreenTimeSettings({
                    ...screenTimeSettings,
                    enabled: e.target.checked
                  })}
                />
                Enable Screen Time Limits
              </label>
            </div>

            <h3>🔔 Notifications</h3>
            <div className="setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Daily challenge reminders
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Weekly progress reports
              </label>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="activities-tab">
            <h3>📚 Offline Learning Activities</h3>
            
            <div className="activity-section">
              <h4>Letter Practice</h4>
              <ul>
                <li>✏️ Trace letters in sand or flour</li>
                <li>🎨 Paint letters with water on sidewalk</li>
                <li>🧩 Build letters with blocks or sticks</li>
                <li>🔍 Letter hunt around the house</li>
              </ul>
            </div>

            <div className="activity-section">
              <h4>Number Games</h4>
              <ul>
                <li>🎲 Count items during snack time</li>
                <li>👟 Count steps to different rooms</li>
                <li>🧮 Sort toys by size or color</li>
                <li>📏 Measure things with hand spans</li>
              </ul>
            </div>

            <div className="activity-section">
              <h4>Space Theme Activities</h4>
              <ul>
                <li>🌙 Moon phase observation chart</li>
                <li>⭐ Star gazing and constellation finding</li>
                <li>🚀 Build a cardboard rocket ship</li>
                <li>🪐 Make planets with playdough</li>
              </ul>
            </div>

            <button 
              onClick={() => window.print()} 
              className="print-btn"
            >
              🖨️ Print Activity List
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .parent-dashboard {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .dashboard-header {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 28px;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.3s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .dashboard-tabs {
          display: flex;
          background: #f5f5f5;
          border-bottom: 2px solid #ddd;
        }

        .dashboard-tabs button {
          flex: 1;
          padding: 15px;
          background: transparent;
          border: none;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .dashboard-tabs button:hover {
          background: #e8e8e8;
        }

        .dashboard-tabs button.active {
          background: white;
          border-bottom: 3px solid #667eea;
          font-weight: bold;
        }

        .dashboard-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 10px;
          font-size: 14px;
          color: #666;
        }

        .stat-value {
          font-size: 36px;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }

        .achievements-section,
        .recommendations-section,
        .weak-areas-section,
        .activity-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .achievements-section h3,
        .recommendations-section h3,
        .weak-areas-section h3,
        .activity-section h4 {
          margin-top: 0;
          color: #667eea;
        }

        .achievements-section ul,
        .recommendations-section ul,
        .weak-areas-section ul,
        .activity-section ul {
          list-style: none;
          padding: 0;
        }

        .achievements-section li,
        .recommendations-section li,
        .weak-areas-section li,
        .activity-section li {
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .export-btn,
        .print-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
        }

        .export-btn:hover,
        .print-btn:hover {
          background: #5568d3;
        }

        .chart-container {
          position: relative;
          height: 300px;
          margin-bottom: 30px;
        }

        .recordings-list {
          margin-top: 20px;
        }

        .recording-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 5px;
          margin-bottom: 10px;
        }

        .recording-info {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .recording-quality {
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
        }

        .quality-good {
          background: #4caf50;
          color: white;
        }

        .quality-needs-work {
          background: #ff9800;
          color: white;
        }

        .quality-excellent {
          background: #2196f3;
          color: white;
        }

        .play-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
        }

        .setting-item {
          margin: 20px 0;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
        }

        .setting-item input[type="number"] {
          width: 80px;
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 3px;
        }

        .note {
          background: #fff3cd;
          padding: 10px;
          border-radius: 5px;
          margin-top: 20px;
          font-size: 14px;
          color: #856404;
        }
      `}</style>
    </div>
  );
};
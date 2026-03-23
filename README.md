# 🌟 Gwen's Galaxy Pro - Educational Space Adventure 🚀

An immersive 3D educational game for children ages 3-6, featuring voice-interactive learning in a magical space setting.

![Gwen's Galaxy Pro](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Platform](https://img.shields.io/badge/Platform-Web-orange)

## ✨ Features

### 🎮 Game Modes
- **Spelling Adventure**: Voice-driven spelling practice with 100+ sight words
- **Math Quest**: Interactive addition, subtraction, counting, and patterns
- **Story Time**: Narrative adventures with Stella the Space Cat
- **Achievement Hall**: 50+ achievements to unlock

### 🎯 Key Features
- **Voice Recognition**: Hands-free gameplay using Web Speech API
- **3D Graphics**: Stunning space environments powered by Babylon.js
- **Adaptive Learning**: Difficulty adjusts to child's skill level
- **Progress Tracking**: 30-day learning calendar with XP system
- **Parent Dashboard**: Monitor progress and set limits
- **Offline Support**: Works without internet after first load

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern browser (Chrome/Edge recommended for voice features)
- Microphone for voice input

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gwen-galaxy-pro.git
cd gwen-galaxy-pro
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open in browser:
```
http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

## 🎯 How to Play

### Voice Commands
- **Spelling Mode**: Say letters one by one (e.g., "C", "A", "T")
- **Math Mode**: Say numbers (e.g., "Five", "Ten")
- **Story Mode**: Say action words (e.g., "Yes", "Explore", "Next")

### Keyboard Controls
- **Arrow Keys**: Navigate menus
- **Enter**: Select option
- **ESC**: Return to main menu
- **P**: Pause game
- **M**: Toggle music

## 🏆 Achievement System

Unlock achievements by:
- Spelling words correctly
- Solving math problems
- Completing story chapters
- Daily play streaks
- Reaching XP milestones

## 📱 Progressive Web App

Install as app on any device:
1. Open game in Chrome/Edge
2. Click "Install" in address bar
3. Add to home screen

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **3D Engine**: Babylon.js 6
- **Voice**: Web Speech API
- **Audio**: Web Audio API
- **Styling**: CSS3 with animations
- **Storage**: LocalStorage for progress

## 📊 Parent Dashboard

Access parent controls to:
- View learning statistics
- Set daily time limits
- Track skill progression
- Review completed activities
- Export progress reports

## 🎨 Educational Content

### Spelling Curriculum
- **Level 1**: 3-letter sight words
- **Level 2**: 4-letter common words
- **Level 3**: 5-letter vocabulary
- **Level 4**: 6-letter challenges
- **Level 5**: 7-8 letter mastery

### Math Curriculum
- Counting objects (1-20)
- Addition (up to 20)
- Subtraction (up to 20)
- Number patterns
- Visual problem solving

## 🔧 Configuration

Edit `src/config.js` to customize:
- Difficulty settings
- Voice recognition sensitivity
- Time limits
- Achievement thresholds
- Content packs

## 📝 Development

### Project Structure
```
gwen-galaxy-pro/
├── src/
│   ├── game/
│   │   ├── scenes/       # Game scenes
│   │   ├── voice/        # Voice controller
│   │   └── GameEngine.js # Core engine
│   ├── data/             # Word/math content
│   ├── App.jsx          # React app
│   └── main.jsx         # Entry point
├── public/              # Static assets
└── package.json
```

### Add New Words/Problems
Edit files in `src/data/`:
- `words.js` - Spelling content
- `math.js` - Math problems

### Create Custom Scenes
Extend base scene class:
```javascript
import { BaseScene } from './BaseScene';

export class MyScene extends BaseScene {
  async createScene() {
    // Your scene code
  }
}
```

## 🐛 Troubleshooting

### Voice Recognition Not Working
- Ensure microphone permissions granted
- Use Chrome or Edge browser
- Check microphone is not muted
- Try speaking clearly and slowly

### Performance Issues
- Close other browser tabs
- Disable extensions
- Lower graphics quality in settings
- Update graphics drivers

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - see LICENSE file

## 🙏 Credits

- 3D Engine: Babylon.js team
- Font: Google Fonts (Orbitron)
- Icons: Unicode emoji
- Voice API: W3C Web Speech

## 📧 Support

For issues or questions:
- GitHub Issues: [Report Bug](https://github.com/yourusername/gwen-galaxy-pro/issues)
- Email: support@gwensgalaxy.com
- Discord: [Join Community](https://discord.gg/gwensgalaxy)

## 🚀 Deployment

### GitHub Pages

1. Update `vite.config.js`:
```javascript
export default {
  base: '/gwen-galaxy-pro/',
  // ... other config
}
```

2. Deploy:
```bash
npm run build
npm run deploy
```

### Netlify/Vercel

Simply connect repository and deploy automatically.

---

**Made with ❤️ for young learners everywhere**

🌟 Star us on GitHub if you enjoy the game!
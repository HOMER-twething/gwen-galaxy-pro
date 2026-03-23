export class ColorblindMode {
  constructor() {
    this.modes = {
      normal: {
        name: 'Normal Vision',
        filter: null
      },
      protanopia: {
        name: 'Protanopia (Red-Blind)',
        filter: 'url(#protanopia-filter)'
      },
      deuteranopia: {
        name: 'Deuteranopia (Green-Blind)',
        filter: 'url(#deuteranopia-filter)'
      },
      tritanopia: {
        name: 'Tritanopia (Blue-Blind)',
        filter: 'url(#tritanopia-filter)'
      },
      achromatopsia: {
        name: 'Achromatopsia (Complete)',
        filter: 'url(#achromatopsia-filter)'
      }
    };
    
    this.currentMode = 'normal';
    this.patterns = new Map();
    this.highContrast = false;
    
    this.init();
  }

  init() {
    // Load saved preference
    const saved = localStorage.getItem('colorblindMode');
    if (saved && this.modes[saved]) {
      this.currentMode = saved;
    }
    
    // Create SVG filters
    this.createFilters();
    
    // Apply saved mode
    if (this.currentMode !== 'normal') {
      this.applyMode(this.currentMode);
    }
  }

  createFilters() {
    // Create SVG element for filters
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = 0;
    svg.style.height = 0;
    svg.innerHTML = `
      <defs>
        <!-- Protanopia (Red-Blind) -->
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0.000, 0, 0
            0.558, 0.442, 0.000, 0, 0
            0.000, 0.242, 0.758, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>
        
        <!-- Deuteranopia (Green-Blind) -->
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0.000, 0, 0
            0.700, 0.300, 0.000, 0, 0
            0.000, 0.300, 0.700, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>
        
        <!-- Tritanopia (Blue-Blind) -->
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.950, 0.050, 0.000, 0, 0
            0.000, 0.433, 0.567, 0, 0
            0.000, 0.475, 0.525, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>
        
        <!-- Achromatopsia (Complete Color Blindness) -->
        <filter id="achromatopsia-filter">
          <feColorMatrix type="matrix" values="
            0.299, 0.587, 0.114, 0, 0
            0.299, 0.587, 0.114, 0, 0
            0.299, 0.587, 0.114, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>
        
        <!-- High Contrast -->
        <filter id="high-contrast-filter">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 .5 .5 .5 1 1 1 1"/>
            <feFuncG type="discrete" tableValues="0 .5 .5 .5 1 1 1 1"/>
            <feFuncB type="discrete" tableValues="0 .5 .5 .5 1 1 1 1"/>
          </feComponentTransfer>
        </filter>
      </defs>
    `;
    
    document.body.appendChild(svg);
  }

  applyMode(mode) {
    if (!this.modes[mode]) return;
    
    this.currentMode = mode;
    const filter = this.modes[mode].filter;
    
    // Apply filter to canvas and all game elements
    const canvas = document.querySelector('canvas');
    const gameContainer = document.querySelector('#game-container') || document.body;
    
    if (filter) {
      if (canvas) canvas.style.filter = filter;
      gameContainer.style.filter = filter;
    } else {
      if (canvas) canvas.style.filter = 'none';
      gameContainer.style.filter = 'none';
    }
    
    // Save preference
    localStorage.setItem('colorblindMode', mode);
    
    // Dispatch event for game to update colors/patterns
    window.dispatchEvent(new CustomEvent('colorblindModeChanged', { 
      detail: { mode, requiresPatterns: mode !== 'normal' } 
    }));
  }

  toggleHighContrast() {
    this.highContrast = !this.highContrast;
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      if (this.highContrast) {
        canvas.style.filter = (canvas.style.filter || '') + ' contrast(1.5) brightness(1.1)';
      } else {
        canvas.style.filter = canvas.style.filter?.replace(/contrast\([^)]*\)\s*brightness\([^)]*\)/, '');
      }
    }
    
    localStorage.setItem('highContrast', this.highContrast);
    return this.highContrast;
  }

  getAccessibleColor(originalColor, colorType) {
    // Convert colors to be more distinguishable
    const colorMap = {
      normal: originalColor,
      protanopia: this.adjustForProtanopia(originalColor),
      deuteranopia: this.adjustForDeuteranopia(originalColor),
      tritanopia: this.adjustForTritanopia(originalColor),
      achromatopsia: this.adjustForAchromatopsia(originalColor)
    };
    
    return colorMap[this.currentMode] || originalColor;
  }

  adjustForProtanopia(color) {
    // Adjust reds to be more distinguishable
    if (typeof color === 'object' && color.r !== undefined) {
      return {
        r: color.r * 0.567 + color.g * 0.433,
        g: color.r * 0.558 + color.g * 0.442,
        b: color.b * 0.758 + color.g * 0.242
      };
    }
    return color;
  }

  adjustForDeuteranopia(color) {
    // Adjust greens to be more distinguishable
    if (typeof color === 'object' && color.r !== undefined) {
      return {
        r: color.r * 0.625 + color.g * 0.375,
        g: color.r * 0.7 + color.g * 0.3,
        b: color.b * 0.7 + color.g * 0.3
      };
    }
    return color;
  }

  adjustForTritanopia(color) {
    // Adjust blues to be more distinguishable
    if (typeof color === 'object' && color.r !== undefined) {
      return {
        r: color.r * 0.95 + color.g * 0.05,
        g: color.g * 0.433 + color.b * 0.567,
        b: color.g * 0.475 + color.b * 0.525
      };
    }
    return color;
  }

  adjustForAchromatopsia(color) {
    // Convert to grayscale
    if (typeof color === 'object' && color.r !== undefined) {
      const gray = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
      return { r: gray, g: gray, b: gray };
    }
    return color;
  }

  getPattern(colorName) {
    // Return patterns for colorblind users
    const patterns = {
      red: '///',
      green: '\\\\\\',
      blue: '|||',
      yellow: '---',
      purple: '+++',
      orange: 'xxx',
      pink: '...',
      white: '   ',
      black: '###'
    };
    
    if (this.currentMode === 'normal') {
      return null;
    }
    
    return patterns[colorName] || null;
  }

  createPatternTexture(babylonScene, colorName) {
    // Create pattern textures for 3D objects
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = this.getColorHex(colorName);
    ctx.fillRect(0, 0, 256, 256);
    
    // Pattern overlay
    ctx.strokeStyle = this.currentMode === 'achromatopsia' ? '#000' : '#fff';
    ctx.lineWidth = 4;
    
    const pattern = this.getPattern(colorName);
    if (pattern) {
      switch(pattern) {
        case '///':
          for (let i = 0; i < 256; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 256, 256);
            ctx.stroke();
          }
          break;
        case '\\\\\\':
          for (let i = 0; i < 256; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 256);
            ctx.lineTo(i + 256, 0);
            ctx.stroke();
          }
          break;
        case '|||':
          for (let i = 0; i < 256; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.stroke();
          }
          break;
        case '---':
          for (let i = 0; i < 256; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
            ctx.stroke();
          }
          break;
        case '+++':
          for (let i = 0; i < 256; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i + 15, 0);
            ctx.lineTo(i + 15, 256);
            ctx.stroke();
            ctx.moveTo(0, i + 15);
            ctx.lineTo(256, i + 15);
            ctx.stroke();
          }
          break;
        case 'xxx':
          for (let i = 0; i < 256; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 30, 30);
            ctx.stroke();
            ctx.moveTo(0, i);
            ctx.lineTo(30, i + 30);
            ctx.stroke();
          }
          break;
        case '...':
          for (let x = 10; x < 256; x += 30) {
            for (let y = 10; y < 256; y += 30) {
              ctx.beginPath();
              ctx.arc(x, y, 5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
      }
    }
    
    return new BABYLON.Texture.LoadFromDataString(
      `pattern_${colorName}`,
      canvas.toDataURL(),
      babylonScene
    );
  }

  getColorHex(colorName) {
    const colors = {
      red: '#FF0000',
      green: '#00FF00',
      blue: '#0000FF',
      yellow: '#FFFF00',
      purple: '#800080',
      orange: '#FFA500',
      pink: '#FFC0CB',
      white: '#FFFFFF',
      black: '#000000'
    };
    
    return colors[colorName] || '#808080';
  }

  addIconIndicators(element, meaning) {
    // Add icons/symbols for colorblind users
    if (this.currentMode === 'normal') return element;
    
    const indicators = {
      correct: '✓',
      incorrect: '✗',
      warning: '⚠',
      info: 'ℹ',
      star: '★',
      heart: '♥',
      diamond: '♦',
      circle: '●',
      square: '■',
      triangle: '▲'
    };
    
    if (indicators[meaning]) {
      const span = document.createElement('span');
      span.style.marginLeft = '5px';
      span.style.fontSize = '1.2em';
      span.textContent = indicators[meaning];
      element.appendChild(span);
    }
    
    return element;
  }

  getContrastRatio(color1, color2) {
    // Calculate contrast ratio for accessibility
    const getLuminance = (color) => {
      const rgb = [color.r, color.g, color.b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  ensureContrast(foreground, background, minRatio = 4.5) {
    const ratio = this.getContrastRatio(foreground, background);
    
    if (ratio < minRatio) {
      // Adjust foreground to meet contrast requirements
      const adjust = ratio < 3 ? 0.8 : 0.5;
      
      return {
        r: foreground.r > 0.5 ? Math.min(1, foreground.r + adjust) : Math.max(0, foreground.r - adjust),
        g: foreground.g > 0.5 ? Math.min(1, foreground.g + adjust) : Math.max(0, foreground.g - adjust),
        b: foreground.b > 0.5 ? Math.min(1, foreground.b + adjust) : Math.max(0, foreground.b - adjust)
      };
    }
    
    return foreground;
  }

  getCurrentMode() {
    return this.currentMode;
  }

  getModes() {
    return Object.keys(this.modes);
  }

  reset() {
    this.applyMode('normal');
    this.highContrast = false;
    localStorage.removeItem('colorblindMode');
    localStorage.removeItem('highContrast');
  }
}

// Export singleton instance
export const colorblindMode = new ColorblindMode();

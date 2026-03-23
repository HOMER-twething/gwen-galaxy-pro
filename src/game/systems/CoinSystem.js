export class CoinSystem {
  constructor() {
    this.shopItems = [
      // Character Customization
      { id: 'suit_red', name: 'Red Space Suit', category: 'suits', price: 50, icon: '🔴' },
      { id: 'suit_blue', name: 'Blue Space Suit', category: 'suits', price: 50, icon: '🔵' },
      { id: 'suit_gold', name: 'Golden Space Suit', category: 'suits', price: 200, icon: '⭐' },
      { id: 'suit_rainbow', name: 'Rainbow Space Suit', category: 'suits', price: 300, icon: '🌈' },
      { id: 'helmet_bubble', name: 'Bubble Helmet', category: 'helmets', price: 75, icon: '🫧' },
      { id: 'helmet_star', name: 'Star Helmet', category: 'helmets', price: 100, icon: '✨' },
      { id: 'boots_rocket', name: 'Rocket Boots', category: 'boots', price: 150, icon: '🚀' },
      
      // Pets
      { id: 'pet_robot', name: 'Robot Companion', category: 'pets', price: 100, icon: '🤖' },
      { id: 'pet_alien', name: 'Friendly Alien', category: 'pets', price: 150, icon: '👽' },
      { id: 'pet_star', name: 'Star Sprite', category: 'pets', price: 200, icon: '🌟' },
      { id: 'pet_comet', name: 'Comet Tail', category: 'pets', price: 250, icon: '☄️' },
      { id: 'pet_moon', name: 'Moon Buddy', category: 'pets', price: 175, icon: '🌙' },
      
      // Power-ups
      { id: 'powerup_2x', name: '2x Score (1 Day)', category: 'powerups', price: 100, icon: '2️⃣' },
      { id: 'powerup_hint', name: '5 Hints', category: 'powerups', price: 30, icon: '💡' },
      { id: 'powerup_time', name: 'Extra Time (+30s)', category: 'powerups', price: 50, icon: '⏰' },
      { id: 'powerup_shield', name: 'Mistake Shield (3 uses)', category: 'powerups', price: 75, icon: '🛡️' },
      
      // Backgrounds
      { id: 'bg_mars', name: 'Mars Background', category: 'backgrounds', price: 80, icon: '🔴' },
      { id: 'bg_jupiter', name: 'Jupiter Background', category: 'backgrounds', price: 100, icon: '🟠' },
      { id: 'bg_nebula', name: 'Nebula Background', category: 'backgrounds', price: 150, icon: '🌌' },
      { id: 'bg_earth', name: 'Earth View', category: 'backgrounds', price: 120, icon: '🌍' },
      
      // Special Effects
      { id: 'fx_sparkles', name: 'Sparkle Trail', category: 'effects', price: 60, icon: '✨' },
      { id: 'fx_rainbow', name: 'Rainbow Trail', category: 'effects', price: 80, icon: '🌈' },
      { id: 'fx_fire', name: 'Fire Trail', category: 'effects', price: 100, icon: '🔥' },
      
      // Voices
      { id: 'voice_robot', name: 'Robot Voice Pack', category: 'voices', price: 70, icon: '🎤' },
      { id: 'voice_pirate', name: 'Space Pirate Voice', category: 'voices', price: 90, icon: '🏴‍☠️' },
      
      // Achievements
      { id: 'title_explorer', name: 'Explorer Title', category: 'titles', price: 50, icon: '🔭' },
      { id: 'title_master', name: 'Master Title', category: 'titles', price: 200, icon: '👑' },
      { id: 'title_legend', name: 'Legend Title', category: 'titles', price: 500, icon: '🏆' }
    ];
    
    this.purchasedItems = [];
    this.equippedItems = {};
    this.activeBoosts = [];
    
    this.loadFromStorage();
  }

  loadFromStorage() {
    const savedData = localStorage.getItem('coinSystem');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.purchasedItems = data.purchasedItems || [];
      this.equippedItems = data.equippedItems || {};
      this.activeBoosts = data.activeBoosts || [];
      
      // Clean up expired boosts
      this.cleanExpiredBoosts();
    }
  }

  save() {
    const data = {
      purchasedItems: this.purchasedItems,
      equippedItems: this.equippedItems,
      activeBoosts: this.activeBoosts
    };
    localStorage.setItem('coinSystem', JSON.stringify(data));
  }

  getShopItems(category = null) {
    let items = this.shopItems;
    
    if (category) {
      items = items.filter(item => item.category === category);
    }
    
    // Mark purchased items
    return items.map(item => ({
      ...item,
      purchased: this.purchasedItems.includes(item.id),
      equipped: this.equippedItems[item.category] === item.id
    }));
  }

  purchaseItem(itemId, coins) {
    const item = this.shopItems.find(i => i.id === itemId);
    
    if (!item) {
      return { success: false, message: 'Item not found' };
    }
    
    if (this.purchasedItems.includes(itemId)) {
      return { success: false, message: 'Already purchased' };
    }
    
    if (coins < item.price) {
      return { success: false, message: `Need ${item.price - coins} more coins` };
    }
    
    // Special handling for consumables
    if (item.category === 'powerups') {
      this.activatePowerUp(item);
    } else {
      this.purchasedItems.push(itemId);
      
      // Auto-equip if first item in category
      if (!this.equippedItems[item.category]) {
        this.equipItem(itemId);
      }
    }
    
    this.save();
    
    return { 
      success: true, 
      message: `Purchased ${item.name}!`,
      coinsSpent: item.price
    };
  }

  equipItem(itemId) {
    const item = this.shopItems.find(i => i.id === itemId);
    
    if (!item) {
      return { success: false, message: 'Item not found' };
    }
    
    if (!this.purchasedItems.includes(itemId) && item.category !== 'powerups') {
      return { success: false, message: 'Not purchased yet' };
    }
    
    this.equippedItems[item.category] = itemId;
    this.save();
    
    return { success: true, message: `Equipped ${item.name}!` };
  }

  unequipItem(category) {
    delete this.equippedItems[category];
    this.save();
    return { success: true, message: 'Item unequipped' };
  }

  getEquippedItems() {
    const equipped = {};
    
    Object.entries(this.equippedItems).forEach(([category, itemId]) => {
      const item = this.shopItems.find(i => i.id === itemId);
      if (item) {
        equipped[category] = item;
      }
    });
    
    return equipped;
  }

  activatePowerUp(item) {
    const now = Date.now();
    
    switch(item.id) {
      case 'powerup_2x':
        this.activeBoosts.push({
          type: 'score_multiplier',
          value: 2,
          expires: now + (24 * 60 * 60 * 1000) // 24 hours
        });
        break;
        
      case 'powerup_hint':
        const existingHints = this.activeBoosts.find(b => b.type === 'hints');
        if (existingHints) {
          existingHints.value += 5;
        } else {
          this.activeBoosts.push({
            type: 'hints',
            value: 5,
            expires: null // No expiry, consumed on use
          });
        }
        break;
        
      case 'powerup_time':
        this.activeBoosts.push({
          type: 'extra_time',
          value: 30,
          expires: now + (60 * 60 * 1000) // 1 hour
        });
        break;
        
      case 'powerup_shield':
        this.activeBoosts.push({
          type: 'mistake_shield',
          value: 3,
          expires: null // Consumed on use
        });
        break;
    }
    
    this.cleanExpiredBoosts();
    this.save();
  }

  cleanExpiredBoosts() {
    const now = Date.now();
    this.activeBoosts = this.activeBoosts.filter(boost => {
      if (boost.expires === null) return true; // Keep consumables
      return boost.expires > now;
    });
  }

  getActiveBoosts() {
    this.cleanExpiredBoosts();
    return this.activeBoosts;
  }

  consumeBoost(type) {
    const boostIndex = this.activeBoosts.findIndex(b => b.type === type && b.value > 0);
    
    if (boostIndex !== -1) {
      const boost = this.activeBoosts[boostIndex];
      
      if (boost.expires === null) { // Consumable
        boost.value--;
        if (boost.value <= 0) {
          this.activeBoosts.splice(boostIndex, 1);
        }
      }
      
      this.save();
      return true;
    }
    
    return false;
  }

  getScoreMultiplier() {
    this.cleanExpiredBoosts();
    const multiplierBoost = this.activeBoosts.find(b => b.type === 'score_multiplier');
    return multiplierBoost ? multiplierBoost.value : 1;
  }

  hasHints() {
    const hintBoost = this.activeBoosts.find(b => b.type === 'hints');
    return hintBoost ? hintBoost.value : 0;
  }

  useHint() {
    return this.consumeBoost('hints');
  }

  hasMistakeShield() {
    const shieldBoost = this.activeBoosts.find(b => b.type === 'mistake_shield');
    return shieldBoost ? shieldBoost.value : 0;
  }

  useMistakeShield() {
    return this.consumeBoost('mistake_shield');
  }

  getExtraTime() {
    this.cleanExpiredBoosts();
    const timeBoost = this.activeBoosts.find(b => b.type === 'extra_time');
    return timeBoost ? timeBoost.value : 0;
  }

  getUnlockedContent() {
    return {
      suits: this.purchasedItems.filter(id => this.shopItems.find(i => i.id === id && i.category === 'suits')),
      pets: this.purchasedItems.filter(id => this.shopItems.find(i => i.id === id && i.category === 'pets')),
      backgrounds: this.purchasedItems.filter(id => this.shopItems.find(i => i.id === id && i.category === 'backgrounds')),
      effects: this.purchasedItems.filter(id => this.shopItems.find(i => i.id === id && i.category === 'effects')),
      voices: this.purchasedItems.filter(id => this.shopItems.find(i => i.id === id && i.category === 'voices')),
      titles: this.purchasedItems.filter(id => this.shopItems.find(i => i.id === id && i.category === 'titles'))
    };
  }

  getTotalSpent() {
    return this.purchasedItems.reduce((total, itemId) => {
      const item = this.shopItems.find(i => i.id === itemId);
      return total + (item ? item.price : 0);
    }, 0);
  }

  getCollectionProgress() {
    const totalItems = this.shopItems.filter(i => i.category !== 'powerups').length;
    const collectedItems = this.purchasedItems.filter(id => {
      const item = this.shopItems.find(i => i.id === id);
      return item && item.category !== 'powerups';
    }).length;
    
    return {
      collected: collectedItems,
      total: totalItems,
      percentage: ((collectedItems / totalItems) * 100).toFixed(1)
    };
  }
}
// Sight words organized by level and difficulty
export const sightWords = {
  level1: {
    title: "Beginner Stars",
    description: "3-letter words",
    words: [
      { word: "cat", sentence: "The cat is soft." },
      { word: "dog", sentence: "My dog runs fast." },
      { word: "sun", sentence: "The sun is bright." },
      { word: "hat", sentence: "I wear a hat." },
      { word: "bat", sentence: "The bat can fly." },
      { word: "rat", sentence: "The rat is small." },
      { word: "mat", sentence: "Sit on the mat." },
      { word: "sat", sentence: "I sat down." },
      { word: "fat", sentence: "The cat is fat." },
      { word: "pat", sentence: "Pat the dog." },
      { word: "run", sentence: "I can run fast." },
      { word: "fun", sentence: "We have fun." },
      { word: "big", sentence: "The dog is big." },
      { word: "pig", sentence: "The pig is pink." },
      { word: "dig", sentence: "Dogs dig holes." },
      { word: "wig", sentence: "She has a wig." },
      { word: "bed", sentence: "Go to bed." },
      { word: "red", sentence: "The ball is red." },
      { word: "led", sentence: "She led the way." },
      { word: "fed", sentence: "I fed the cat." }
    ]
  },
  level2: {
    title: "Space Explorers",
    description: "4-letter words",
    words: [
      { word: "fish", sentence: "The fish swims fast." },
      { word: "bird", sentence: "The bird can sing." },
      { word: "tree", sentence: "The tree is tall." },
      { word: "moon", sentence: "The moon is bright." },
      { word: "star", sentence: "I see a star." },
      { word: "book", sentence: "Read this book." },
      { word: "look", sentence: "Look at me!" },
      { word: "cook", sentence: "Mom can cook." },
      { word: "took", sentence: "I took the ball." },
      { word: "good", sentence: "That is good!" },
      { word: "wood", sentence: "The table is wood." },
      { word: "food", sentence: "I like food." },
      { word: "jump", sentence: "I can jump high." },
      { word: "bump", sentence: "I hit a bump." },
      { word: "pump", sentence: "Use the pump." },
      { word: "dump", sentence: "Don't dump that!" },
      { word: "play", sentence: "Let's play together." },
      { word: "stay", sentence: "Please stay here." },
      { word: "clay", sentence: "Make with clay." },
      { word: "gray", sentence: "The sky is gray." }
    ]
  },
  level3: {
    title: "Asteroid Masters",
    description: "5-letter words",
    words: [
      { word: "house", sentence: "I live in a house." },
      { word: "mouse", sentence: "The mouse is quick." },
      { word: "train", sentence: "The train goes fast." },
      { word: "plane", sentence: "The plane flies high." },
      { word: "brain", sentence: "Use your brain!" },
      { word: "chain", sentence: "The dog has a chain." },
      { word: "grain", sentence: "Bread has grain." },
      { word: "stain", sentence: "I got a stain." },
      { word: "water", sentence: "Drink some water." },
      { word: "later", sentence: "See you later!" },
      { word: "paper", sentence: "Write on paper." },
      { word: "maker", sentence: "She is a maker." },
      { word: "happy", sentence: "I am happy today." },
      { word: "puppy", sentence: "The puppy is cute." },
      { word: "sunny", sentence: "It is sunny outside." },
      { word: "funny", sentence: "That is funny!" },
      { word: "green", sentence: "The grass is green." },
      { word: "clean", sentence: "Keep it clean." },
      { word: "queen", sentence: "She is the queen." },
      { word: "dream", sentence: "I had a dream." }
    ]
  },
  level4: {
    title: "Galaxy Champions",
    description: "6-letter words",
    words: [
      { word: "planet", sentence: "Earth is a planet." },
      { word: "rocket", sentence: "The rocket flies up." },
      { word: "garden", sentence: "Plant a garden." },
      { word: "sister", sentence: "My sister is nice." },
      { word: "mother", sentence: "I love my mother." },
      { word: "father", sentence: "My father is tall." },
      { word: "winter", sentence: "Winter is cold." },
      { word: "summer", sentence: "Summer is hot." },
      { word: "spring", sentence: "Flowers bloom in spring." },
      { word: "butter", sentence: "Put butter on bread." },
      { word: "letter", sentence: "Write a letter." },
      { word: "better", sentence: "This is better." },
      { word: "kitten", sentence: "The kitten plays." },
      { word: "mitten", sentence: "Wear your mitten." },
      { word: "button", sentence: "Push the button." },
      { word: "cotton", sentence: "Cotton is soft." },
      { word: "purple", sentence: "I like purple." },
      { word: "yellow", sentence: "The sun is yellow." },
      { word: "orange", sentence: "Eat an orange." },
      { word: "silver", sentence: "The coin is silver." }
    ]
  },
  level5: {
    title: "Universe Masters",
    description: "7-8 letter words",
    words: [
      { word: "rainbow", sentence: "I see a rainbow!" },
      { word: "sunshine", sentence: "I love sunshine." },
      { word: "birthday", sentence: "Happy birthday!" },
      { word: "airplane", sentence: "The airplane is big." },
      { word: "elephant", sentence: "The elephant is huge." },
      { word: "butterfly", sentence: "The butterfly is pretty." },
      { word: "computer", sentence: "Use the computer." },
      { word: "dinosaur", sentence: "Dinosaurs are extinct." },
      { word: "sandwich", sentence: "I eat a sandwich." },
      { word: "triangle", sentence: "A triangle has three sides." },
      { word: "rectangle", sentence: "Draw a rectangle." },
      { word: "astronaut", sentence: "The astronaut explores space." },
      { word: "telescope", sentence: "Look through the telescope." },
      { word: "adventure", sentence: "Let's have an adventure!" },
      { word: "important", sentence: "This is important." },
      { word: "beautiful", sentence: "You are beautiful." },
      { word: "wonderful", sentence: "That's wonderful!" },
      { word: "chocolate", sentence: "I love chocolate." },
      { word: "celebrate", sentence: "Let's celebrate!" },
      { word: "together", sentence: "We work together." }
    ]
  }
};

// Helper function to get random words for practice
export const getRandomWords = (level, count = 10) => {
  const levelWords = sightWords[`level${level}`]?.words || sightWords.level1.words;
  const shuffled = [...levelWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Get all words for a specific level
export const getWordsForLevel = (level) => {
  return sightWords[`level${level}`] || sightWords.level1;
};

// Calculate total words learned
export const getTotalWordsLearned = (completedWords) => {
  return completedWords.length;
};

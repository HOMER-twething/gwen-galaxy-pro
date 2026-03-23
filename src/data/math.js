// Math problems organized by type and difficulty
export const mathProblems = {
  counting: {
    level1: {
      title: "Count the Stars",
      description: "Count objects up to 10",
      problems: [
        { objects: "⭐", count: 3, answer: 3, question: "How many stars?" },
        { objects: "🌙", count: 5, answer: 5, question: "How many moons?" },
        { objects: "🚀", count: 2, answer: 2, question: "How many rockets?" },
        { objects: "👽", count: 4, answer: 4, question: "How many aliens?" },
        { objects: "🪐", count: 6, answer: 6, question: "How many planets?" },
        { objects: "☄️", count: 7, answer: 7, question: "How many comets?" },
        { objects: "🛸", count: 8, answer: 8, question: "How many UFOs?" },
        { objects: "🌟", count: 9, answer: 9, question: "How many sparkles?" },
        { objects: "🌍", count: 1, answer: 1, question: "How many Earths?" },
        { objects: "🛰️", count: 10, answer: 10, question: "How many satellites?" }
      ]
    },
    level2: {
      title: "Count the Galaxy",
      description: "Count objects up to 20",
      problems: [
        { objects: "⭐", count: 12, answer: 12, question: "How many stars?" },
        { objects: "🌙", count: 15, answer: 15, question: "How many moons?" },
        { objects: "🚀", count: 11, answer: 11, question: "How many rockets?" },
        { objects: "👽", count: 14, answer: 14, question: "How many aliens?" },
        { objects: "🪐", count: 16, answer: 16, question: "How many planets?" },
        { objects: "☄️", count: 17, answer: 17, question: "How many comets?" },
        { objects: "🛸", count: 18, answer: 18, question: "How many UFOs?" },
        { objects: "🌟", count: 19, answer: 19, question: "How many sparkles?" },
        { objects: "🌍", count: 13, answer: 13, question: "How many Earths?" },
        { objects: "🛰️", count: 20, answer: 20, question: "How many satellites?" }
      ]
    }
  },
  addition: {
    level1: {
      title: "Space Addition",
      description: "Add numbers up to 10",
      problems: [
        { num1: 1, num2: 1, answer: 2, visual: "🚀 + 🚀 = ?" },
        { num1: 2, num2: 1, answer: 3, visual: "⭐⭐ + ⭐ = ?" },
        { num1: 2, num2: 2, answer: 4, visual: "🌙🌙 + 🌙🌙 = ?" },
        { num1: 3, num2: 1, answer: 4, visual: "🪐🪐🪐 + 🪐 = ?" },
        { num1: 3, num2: 2, answer: 5, visual: "👽👽👽 + 👽👽 = ?" },
        { num1: 4, num2: 1, answer: 5, visual: "⭐⭐⭐⭐ + ⭐ = ?" },
        { num1: 3, num2: 3, answer: 6, visual: "🚀🚀🚀 + 🚀🚀🚀 = ?" },
        { num1: 4, num2: 2, answer: 6, visual: "🌙🌙🌙🌙 + 🌙🌙 = ?" },
        { num1: 5, num2: 2, answer: 7, visual: "⭐⭐⭐⭐⭐ + ⭐⭐ = ?" },
        { num1: 4, num2: 4, answer: 8, visual: "🪐🪐🪐🪐 + 🪐🪐🪐🪐 = ?" },
        { num1: 5, num2: 3, answer: 8, visual: "👽👽👽👽👽 + 👽👽👽 = ?" },
        { num1: 6, num2: 2, answer: 8, visual: "🚀🚀🚀🚀🚀🚀 + 🚀🚀 = ?" },
        { num1: 5, num2: 4, answer: 9, visual: "⭐⭐⭐⭐⭐ + ⭐⭐⭐⭐ = ?" },
        { num1: 6, num2: 3, answer: 9, visual: "🌙🌙🌙🌙🌙🌙 + 🌙🌙🌙 = ?" },
        { num1: 5, num2: 5, answer: 10, visual: "🪐🪐🪐🪐🪐 + 🪐🪐🪐🪐🪐 = ?" }
      ]
    },
    level2: {
      title: "Galaxy Addition",
      description: "Add numbers up to 20",
      problems: [
        { num1: 6, num2: 5, answer: 11 },
        { num1: 7, num2: 4, answer: 11 },
        { num1: 6, num2: 6, answer: 12 },
        { num1: 8, num2: 4, answer: 12 },
        { num1: 7, num2: 6, answer: 13 },
        { num1: 9, num2: 4, answer: 13 },
        { num1: 8, num2: 6, answer: 14 },
        { num1: 7, num2: 7, answer: 14 },
        { num1: 9, num2: 6, answer: 15 },
        { num1: 8, num2: 7, answer: 15 },
        { num1: 8, num2: 8, answer: 16 },
        { num1: 9, num2: 7, answer: 16 },
        { num1: 9, num2: 8, answer: 17 },
        { num1: 9, num2: 9, answer: 18 },
        { num1: 10, num2: 9, answer: 19 },
        { num1: 10, num2: 10, answer: 20 }
      ]
    }
  },
  subtraction: {
    level1: {
      title: "Space Subtraction",
      description: "Subtract numbers up to 10",
      problems: [
        { num1: 2, num2: 1, answer: 1, visual: "🚀🚀 - 🚀 = ?" },
        { num1: 3, num2: 1, answer: 2, visual: "⭐⭐⭐ - ⭐ = ?" },
        { num1: 3, num2: 2, answer: 1, visual: "🌙🌙🌙 - 🌙🌙 = ?" },
        { num1: 4, num2: 1, answer: 3, visual: "🪐🪐🪐🪐 - 🪐 = ?" },
        { num1: 4, num2: 2, answer: 2, visual: "👽👽👽👽 - 👽👽 = ?" },
        { num1: 5, num2: 1, answer: 4, visual: "⭐⭐⭐⭐⭐ - ⭐ = ?" },
        { num1: 5, num2: 2, answer: 3, visual: "🚀🚀🚀🚀🚀 - 🚀🚀 = ?" },
        { num1: 5, num2: 3, answer: 2, visual: "🌙🌙🌙🌙🌙 - 🌙🌙🌙 = ?" },
        { num1: 6, num2: 2, answer: 4, visual: "⭐⭐⭐⭐⭐⭐ - ⭐⭐ = ?" },
        { num1: 6, num2: 3, answer: 3, visual: "🪐🪐🪐🪐🪐🪐 - 🪐🪐🪐 = ?" },
        { num1: 7, num2: 3, answer: 4, visual: "👽👽👽👽👽👽👽 - 👽👽👽 = ?" },
        { num1: 8, num2: 4, answer: 4, visual: "🚀🚀🚀🚀🚀🚀🚀🚀 - 🚀🚀🚀🚀 = ?" },
        { num1: 9, num2: 5, answer: 4, visual: "⭐⭐⭐⭐⭐⭐⭐⭐⭐ - ⭐⭐⭐⭐⭐ = ?" },
        { num1: 10, num2: 5, answer: 5, visual: "🌙🌙🌙🌙🌙🌙🌙🌙🌙🌙 - 🌙🌙🌙🌙🌙 = ?" }
      ]
    },
    level2: {
      title: "Galaxy Subtraction",
      description: "Subtract numbers up to 20",
      problems: [
        { num1: 11, num2: 5, answer: 6 },
        { num1: 12, num2: 4, answer: 8 },
        { num1: 13, num2: 6, answer: 7 },
        { num1: 14, num2: 7, answer: 7 },
        { num1: 15, num2: 5, answer: 10 },
        { num1: 15, num2: 8, answer: 7 },
        { num1: 16, num2: 7, answer: 9 },
        { num1: 17, num2: 8, answer: 9 },
        { num1: 18, num2: 9, answer: 9 },
        { num1: 19, num2: 9, answer: 10 },
        { num1: 20, num2: 10, answer: 10 },
        { num1: 20, num2: 8, answer: 12 },
        { num1: 20, num2: 7, answer: 13 },
        { num1: 20, num2: 6, answer: 14 },
        { num1: 20, num2: 5, answer: 15 }
      ]
    }
  },
  patterns: {
    level1: {
      title: "Number Patterns",
      description: "Complete the pattern",
      problems: [
        { pattern: [1, 2, 3, 4], answer: 5, question: "What comes next?" },
        { pattern: [2, 4, 6, 8], answer: 10, question: "What comes next?" },
        { pattern: [5, 10, 15, 20], answer: 25, question: "What comes next?" },
        { pattern: [1, 3, 5, 7], answer: 9, question: "What comes next?" },
        { pattern: [10, 9, 8, 7], answer: 6, question: "What comes next?" },
        { pattern: [2, 2, 2, 2], answer: 2, question: "What comes next?" },
        { pattern: [1, 1, 2, 2], answer: 3, question: "What comes next?" },
        { pattern: [10, 20, 30, 40], answer: 50, question: "What comes next?" },
        { pattern: [3, 6, 9, 12], answer: 15, question: "What comes next?" },
        { pattern: [20, 18, 16, 14], answer: 12, question: "What comes next?" }
      ]
    }
  }
};

// Helper function to get random problems
export const getRandomProblems = (type, level, count = 10) => {
  const problems = mathProblems[type]?.[`level${level}`]?.problems || [];
  const shuffled = [...problems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Generate problem text for voice output
export const getProblemText = (problem, type) => {
  switch(type) {
    case 'counting':
      return problem.question;
    case 'addition':
      return `What is ${problem.num1} plus ${problem.num2}?`;
    case 'subtraction':
      return `What is ${problem.num1} minus ${problem.num2}?`;
    case 'patterns':
      return `The pattern is: ${problem.pattern.join(', ')}. ${problem.question}`;
    default:
      return "Solve this problem";
  }
};

// Validate spoken answer
export const validateMathAnswer = (spokenAnswer, correctAnswer) => {
  // Handle number words
  const numberWords = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'twenty-one': 21, 'twenty one': 21, 'twenty-five': 25, 'twenty five': 25,
    'thirty': 30, 'forty': 40, 'fifty': 50
  };

  const spoken = spokenAnswer.toLowerCase().trim();
  
  // Try to parse as number first
  const numericAnswer = parseInt(spoken);
  if (!isNaN(numericAnswer)) {
    return numericAnswer === correctAnswer;
  }

  // Try to match word form
  if (numberWords[spoken] !== undefined) {
    return numberWords[spoken] === correctAnswer;
  }

  return false;
};
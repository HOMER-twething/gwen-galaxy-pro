// Enhanced Voice Controller with recording and phoneme analysis
export class VoiceController {
  constructor(options = {}) {
    this.options = options
    this.recognition = null
    this.isListening = false
    this.continuous = options.continuous || false
    this.interimResults = options.interimResults || true
    this.maxAlternatives = options.maxAlternatives || 3
    this.language = options.language || 'en-US'
    this.confidenceThreshold = options.confidenceThreshold || 0.5
    this.retryCount = 0
    this.maxRetries = 3
    this.fallbackMode = false
    this.onResult = options.onResult || (() => {})
    this.onError = options.onError || (() => {})
    this.onStart = options.onStart || (() => {})
    this.onEnd = options.onEnd || (() => {})
    
    // Enhanced features
    this.recordings = []
    this.phonemeAnalysis = true
    this.pronunciationGuides = {}
    
    this.initialize()
  }

  initialize() {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported. Using fallback mode.')
      this.fallbackMode = true
      return
    }

    try {
      this.recognition = new SpeechRecognition()
      this.setupRecognition()
      this.initPronunciationGuides()
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      this.fallbackMode = true
    }
  }

  setupRecognition() {
    if (!this.recognition) return

    // Configure recognition settings
    this.recognition.continuous = this.continuous
    this.recognition.interimResults = this.interimResults
    this.recognition.maxAlternatives = this.maxAlternatives
    this.recognition.lang = this.language

    // Handle recognition results
    this.recognition.onresult = (event) => {
      const results = event.results
      const final = results[results.length - 1]
      
      if (final.isFinal) {
        const transcript = final[0].transcript
        const confidence = final[0].confidence || 0.9
        
        // Store recording
        if (this.options.storeRecordings) {
          this.storeRecording(transcript, confidence)
        }
        
        // Analyze pronunciation
        if (this.phonemeAnalysis) {
          this.analyzePronunciation(transcript)
        }
        
        this.onResult({
          transcript: transcript.trim(),
          confidence,
          alternatives: this.getAlternatives(final),
          pronunciation: this.getPhonemeAnalysis(transcript)
        })
      }
    }

    // Handle errors
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      
      if (event.error === 'network') {
        this.handleNetworkError()
      } else if (event.error === 'no-speech') {
        this.handleNoSpeechError()
      } else {
        this.onError(event.error)
      }
    }

    // Handle start/end events
    this.recognition.onstart = () => {
      this.isListening = true
      this.onStart()
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.onEnd()
    }
  }

  initPronunciationGuides() {
    // Common pronunciation patterns
    this.pronunciationGuides = {
      'C': { sound: 'kuh', tips: 'Hard C like in Cat' },
      'G': { sound: 'guh', tips: 'Hard G like in Go' },
      'TH': { sound: 'th', tips: 'Tongue between teeth' },
      'SH': { sound: 'sh', tips: 'Like telling someone to be quiet' },
      'CH': { sound: 'ch', tips: 'Like in Cheese' }
    }
  }

  analyzePronunciation(transcript) {
    // Simple phoneme analysis
    const phonemes = []
    for (let char of transcript.toUpperCase()) {
      if (this.pronunciationGuides[char]) {
        phonemes.push(this.pronunciationGuides[char])
      }
    }
    return phonemes
  }

  getPhonemeAnalysis(transcript) {
    const analysis = {
      phonemes: [],
      difficulty: this.calculateDifficulty(transcript),
      tips: []
    }
    
    // Check for common problem areas
    if (transcript.includes('th')) {
      analysis.tips.push('Remember: tongue between teeth for TH')
    }
    if (transcript.includes('r') && transcript.includes('w')) {
      analysis.tips.push('R and W difference: R uses tongue, W uses lips')
    }
    
    return analysis
  }

  calculateDifficulty(word) {
    // Simple difficulty scoring
    let score = word.length
    if (word.includes('th')) score += 2
    if (word.includes('ch')) score += 2
    if (word.includes('sh')) score += 2
    return Math.min(score / 3, 10)
  }

  async storeRecording(transcript, confidence) {
    const recording = {
      transcript,
      confidence,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    }
    
    this.recordings.push(recording)
    
    // Store in IndexedDB for parent review
    if (window.indexedDB) {
      try {
        const db = await this.openDB()
        const tx = db.transaction(['recordings'], 'readwrite')
        await tx.objectStore('recordings').add(recording)
      } catch (error) {
        console.error('Failed to store recording:', error)
      }
    }
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GwenGalaxyDB', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' })
        }
      }
    })
  }

  getAlternatives(result) {
    const alternatives = []
    for (let i = 0; i < Math.min(result.length, this.maxAlternatives); i++) {
      alternatives.push({
        transcript: result[i].transcript,
        confidence: result[i].confidence || 0
      })
    }
    return alternatives
  }

  handleNetworkError() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      console.log(`Retrying speech recognition (${this.retryCount}/${this.maxRetries})...`)
      setTimeout(() => this.start(), 1000)
    } else {
      this.fallbackMode = true
      this.onError('Network error - falling back to button input')
    }
  }

  handleNoSpeechError() {
    // Silently restart for continuous listening
    if (this.continuous && this.isListening) {
      setTimeout(() => this.start(), 100)
    }
  }

  start() {
    if (this.fallbackMode) {
      console.warn('Voice recognition not available - use fallback input')
      return
    }

    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start()
        this.retryCount = 0
      } catch (error) {
        console.error('Failed to start recognition:', error)
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort()
    }
  }

  // Spelling-specific methods
  listenForSpelling(targetWord, onLetterCallback) {
    const letters = targetWord.toUpperCase().split('')
    let currentIndex = 0
    
    this.onResult = (result) => {
      const heard = result.transcript.toUpperCase().replace(/\s/g, '')
      
      for (let char of heard) {
        if (currentIndex < letters.length && char === letters[currentIndex]) {
          onLetterCallback({
            letter: char,
            index: currentIndex,
            correct: true
          })
          currentIndex++
          
          if (currentIndex === letters.length) {
            // Word completed!
            this.stop()
            onLetterCallback({
              complete: true,
              word: targetWord
            })
          }
        } else {
          // Wrong letter
          onLetterCallback({
            letter: char,
            expected: letters[currentIndex],
            correct: false
          })
        }
      }
    }
    
    this.start()
  }

  // Math-specific methods
  listenForNumber(expectedAnswer, onAnswerCallback) {
    this.onResult = (result) => {
      const heard = result.transcript.toLowerCase().trim()
      
      // Convert words to numbers
      const numberWords = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
        'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
        'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
        'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
        'eighteen': 18, 'nineteen': 19, 'twenty': 20
      }
      
      let answer = parseInt(heard)
      if (isNaN(answer) && numberWords[heard] !== undefined) {
        answer = numberWords[heard]
      }
      
      if (!isNaN(answer)) {
        const correct = answer === expectedAnswer
        onAnswerCallback({
          answer,
          expected: expectedAnswer,
          correct,
          confidence: result.confidence
        })
        
        if (correct) {
          this.stop()
        }
      }
    }
    
    this.start()
  }

  // Voice command methods
  listenForCommand(validCommands, onCommandCallback) {
    this.onResult = (result) => {
      const heard = result.transcript.toLowerCase().trim()
      
      for (let command of validCommands) {
        if (heard.includes(command.toLowerCase())) {
          onCommandCallback({
            command,
            transcript: heard,
            confidence: result.confidence
          })
          break
        }
      }
    }
    
    this.continuous = true
    this.start()
  }

  // Parent review methods
  async getRecordings(limit = 50) {
    try {
      const db = await this.openDB()
      const tx = db.transaction(['recordings'], 'readonly')
      const store = tx.objectStore('recordings')
      const recordings = []
      
      const request = store.openCursor()
      
      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor && recordings.length < limit) {
            recordings.push(cursor.value)
            cursor.continue()
          } else {
            resolve(recordings.sort((a, b) => b.timestamp - a.timestamp))
          }
        }
      })
    } catch (error) {
      console.error('Failed to get recordings:', error)
      return this.recordings
    }
  }

  clearRecordings() {
    this.recordings = []
    
    if (window.indexedDB) {
      this.openDB().then(db => {
        const tx = db.transaction(['recordings'], 'readwrite')
        tx.objectStore('recordings').clear()
      }).catch(console.error)
    }
  }

  // Cleanup
  destroy() {
    this.stop()
    this.recognition = null
    this.recordings = []
  }
}

// Default instance for easy use
export const voiceController = new VoiceController()

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
      const lastResult = results[results.length - 1]
      
      if (lastResult.isFinal) {
        // Process final results
        const alternatives = []
        for (let i = 0; i < lastResult.length; i++) {
          alternatives.push({
            transcript: lastResult[i].transcript.trim().toLowerCase(),
            confidence: lastResult[i].confidence || 0.9
          })
        }
        
        // Get best result above confidence threshold
        const bestResult = alternatives.find(alt => alt.confidence >= this.confidenceThreshold)
        
        if (bestResult) {
          this.handleSuccess(bestResult.transcript, bestResult.confidence)
        } else {
          this.handleLowConfidence(alternatives[0]?.transcript || '')
        }
      } else {
        // Handle interim results for real-time feedback
        const interim = lastResult[0].transcript.trim().toLowerCase()
        if (this.options.onInterim) {
          this.options.onInterim(interim)
        }
      }
    }

    // Handle recognition start
    this.recognition.onstart = () => {
      this.isListening = true
      this.retryCount = 0
      this.onStart()
    }

    // Handle recognition end
    this.recognition.onend = () => {
      this.isListening = false
      this.onEnd()
      
      // Auto-restart if continuous mode
      if (this.continuous && !this.fallbackMode) {
        setTimeout(() => this.start(), 100)
      }
    }

    // Handle errors
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      
      switch (event.error) {
        case 'not-allowed':
          this.handlePermissionError()
          break
        case 'network':
          this.handleNetworkError()
          break
        case 'no-speech':
          this.handleNoSpeech()
          break
        case 'aborted':
          // User aborted, no action needed
          break
        default:
          this.handleGenericError(event.error)
      }
    }

    // Handle no match
    this.recognition.onnomatch = () => {
      this.handleNoMatch()
    }
  }

  start() {
    if (this.fallbackMode) {
      this.startFallbackMode()
      return
    }

    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start()
      } catch (error) {
        if (error.name === 'InvalidStateError') {
          // Already started, ignore
        } else {
          console.error('Failed to start recognition:', error)
          this.onError(error)
        }
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort()
      this.isListening = false
    }
  }

  startFallbackMode() {
    // Activate button-based input fallback
    if (this.options.onFallbackActivate) {
      this.options.onFallbackActivate()
    }
  }

  handleSuccess(transcript, confidence) {
    this.retryCount = 0
    this.onResult(transcript, confidence)
  }

  handleLowConfidence(transcript) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      if (this.options.onRetry) {
        this.options.onRetry(this.retryCount, transcript)
      }
    } else {
      // Max retries reached, accept the result
      this.onResult(transcript, 0.4)
    }
  }

  handlePermissionError() {
    this.fallbackMode = true
    this.onError({
      type: 'permission',
      message: 'Microphone permission denied. Please enable microphone access.'
    })
  }

  handleNetworkError() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      setTimeout(() => this.start(), 1000 * this.retryCount)
    } else {
      this.fallbackMode = true
      this.onError({
        type: 'network',
        message: 'Network error. Voice recognition unavailable.'
      })
    }
  }

  handleNoSpeech() {
    if (this.options.onSilence) {
      this.options.onSilence()
    }
  }

  handleNoMatch() {
    if (this.options.onNoMatch) {
      this.options.onNoMatch()
    }
  }

  handleGenericError(error) {
    this.onError({
      type: 'generic',
      message: error
    })
  }

  setLanguage(language) {
    this.language = language
    if (this.recognition) {
      this.recognition.lang = language
    }
  }

  // Utility method for spelling mode (letter-by-letter recognition)
  enableSpellingMode() {
    this.continuous = false
    this.interimResults = false
    if (this.recognition) {
      this.recognition.continuous = false
      this.recognition.interimResults = false
    }
  }

  // Utility method for continuous listening (story mode, creative mode)
  enableContinuousMode() {
    this.continuous = true
    this.interimResults = true
    if (this.recognition) {
      this.recognition.continuous = true
      this.recognition.interimResults = true
    }
  }

  dispose() {
    this.stop()
    this.recognition = null
  }

  // Static method to check browser support
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  // Static method to request microphone permission
  static async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }
}
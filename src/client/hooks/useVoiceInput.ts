/**
 * useVoiceInput Hook
 * Provides voice input functionality using Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceStatus, SpeechRecognitionConfig } from '@shared/types/query';

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  status: VoiceStatus;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceInput(config?: Partial<SpeechRecognitionConfig>): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<VoiceStatus>(VoiceStatus.IDLE);
  
  const recognitionRef = useRef<any>(null);
  
  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // Default configuration
  const defaultConfig: SpeechRecognitionConfig = {
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
    ...config
  };

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.lang = defaultConfig.language;
    recognition.continuous = defaultConfig.continuous;
    recognition.interimResults = defaultConfig.interimResults;
    recognition.maxAlternatives = defaultConfig.maxAlternatives;

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setStatus(VoiceStatus.LISTENING);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setStatus(VoiceStatus.PROCESSING);
      
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcriptPart;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcriptPart;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        setConfidence(maxConfidence);
        setStatus(VoiceStatus.COMPLETED);
      } else {
        setTranscript(interimTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status !== VoiceStatus.ERROR) {
        setStatus(VoiceStatus.COMPLETED);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error);
      setStatus(VoiceStatus.ERROR);
      setIsListening(false);
      
      // Handle specific errors
      switch (event.error) {
        case 'no-speech':
          setError('No speech was detected. Please try again.');
          break;
        case 'audio-capture':
          setError('Audio capture failed. Please check your microphone.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access.');
          break;
        case 'network':
          setError('Network error occurred during speech recognition.');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [isSupported, defaultConfig.language, defaultConfig.continuous, 
      defaultConfig.interimResults, defaultConfig.maxAlternatives, status]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition is not available');
      return;
    }

    try {
      setTranscript('');
      setConfidence(0);
      setError(null);
      recognitionRef.current.start();
    } catch (error) {
      setError('Failed to start speech recognition');
      setStatus(VoiceStatus.ERROR);
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
    setStatus(VoiceStatus.IDLE);
  }, []);

  return {
    isListening,
    isSupported: !!isSupported,
    transcript,
    confidence,
    error,
    status,
    startListening,
    stopListening,
    resetTranscript
  };
}

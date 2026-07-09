import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechLog {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: string;
}

export function useVoiceAssistant(
  onRouteCommand: (scenario: 'outdoor_home' | 'indoor_office' | 'avoid_stairs' | 'safest') => void,
  onSOSCommand: () => void
) {
  const [isListening, setIsListening] = useState(false);
  const [speechLogs, setSpeechLogs] = useState<SpeechLog[]>([]);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Read a text block aloud, cancelling any active speech queue to keep it real-time
  const speak = useCallback((text: string, rate: number = 1.0, volume: number = 1.0) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current speech to keep guidance real-time
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.volume = volume;
      
      // Select an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
      
      setSpeechLogs(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          text,
          sender: 'system',
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 49) // Keep last 50
      ]);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setSpeechLogs(prev => [
          {
            id: Math.random().toString(36).substr(2, 9),
            text,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
        
        processCommand(text);
      };

      rec.onerror = (e: any) => {
        console.error('Speech Recognition Error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      setRecognitionActive(true);
    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }
  }, [onRouteCommand, onSOSCommand]);

  const processCommand = (text: string) => {
    const query = text.toLowerCase().trim();
    if (query.includes('home') || query.includes('guide me home')) {
      speak('Starting outdoor navigation guide to Home. Walking path established.');
      onRouteCommand('outdoor_home');
    } else if (query.includes('entrance') || query.includes('find nearest entrance') || query.includes('office')) {
      speak('Finding nearest office entrance. Calibrating indoor beacon sensors.');
      onRouteCommand('indoor_office');
    } else if (query.includes('avoid stairs') || query.includes('stairs')) {
      speak('Re-routing path to avoid stairs. Standard ramp navigation selected.');
      onRouteCommand('avoid_stairs');
    } else if (query.includes('safe') || query.includes('safest')) {
      speak('Recalculating safest path. Priority set to low-traffic sidewalks.');
      onRouteCommand('safest');
    } else if (query.includes('emergency') || query.includes('assistance') || query.includes('sos')) {
      speak('Emergency voice command detected. Initiating immediate SOS broadcast.');
      onSOSCommand();
    } else {
      speak(`Command "${text}" not recognized. Please try "Guide me home", "Find nearest entrance", or "Avoid stairs".`);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    speechLogs,
    speak,
    startListening,
    stopListening,
    recognitionAvailable: recognitionActive
  };
}

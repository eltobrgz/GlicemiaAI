'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// Define the shape of the SpeechRecognition API for TypeScript to avoid errors with window properties
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // API não suportada, não faça nada e não registre erro.
      // O hook hasRecognitionSupport cuidará de informar a UI.
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Erro no reconhecimento de voz: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      // This is called automatically when speech recognition stops.
      // We set isListening to false here to ensure state consistency.
      if (isListening) {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition as ISpeechRecognition;

    // Cleanup on unmount
    return () => {
      if(recognitionRef.current){
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        console.error("Could not start recognition:", e);
        setError("Não foi possível iniciar o reconhecimento de voz. Tente novamente.");
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    hasRecognitionSupport: !!recognitionRef.current,
  };
}

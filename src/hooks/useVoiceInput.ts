import { useState, useRef, useCallback } from 'react';

// Web Speech API types
interface SpeechRecognitionEventCustom extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListCustom;
}

interface SpeechRecognitionResultListCustom {
  readonly length: number;
  item(index: number): SpeechRecognitionResultCustom;
  [index: number]: SpeechRecognitionResultCustom;
}

interface SpeechRecognitionResultCustom {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternativeCustom;
  [index: number]: SpeechRecognitionAlternativeCustom;
}

interface SpeechRecognitionAlternativeCustom {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionEventCustom) => void) | null;
  onerror: ((this: SpeechRecognitionInterface, ev: Event & { error: string }) => void) | null;
  onend: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInterface;
}

// Get the SpeechRecognition constructor
const getSpeechRecognition = (): SpeechRecognitionConstructor | undefined => {
  if (typeof window === 'undefined') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
};

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  language?: string;
}

export function useVoiceInput({ onTranscript, language = 'en-US' }: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);

  // Language code mapping
  const getLanguageCode = (lang: string) => {
    const codes: Record<string, string> = {
      en: 'en-US',
      ru: 'ru-RU',
      kk: 'kk-KZ',
    };
    return codes[lang] || lang;
  };

  const startRecording = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getLanguageCode(language);

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEventCustom) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onTranscript]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSupported,
    transcript,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}

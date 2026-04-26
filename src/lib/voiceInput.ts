declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }

  interface SpeechRecognitionInstance {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
  }

  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
  }
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    ('SpeechRecognition' in window ? window.SpeechRecognition : undefined) ??
    ('webkitSpeechRecognition' in window ? window.webkitSpeechRecognition : undefined)
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getCtor() !== undefined;
}

/** Starts voice recognition. Returns a stop/abort function. */
export function startVoiceRecognition(
  onResult: (text: string) => void,
  onError: (error: string) => void,
): () => void {
  const Ctor = getCtor();
  if (!Ctor) {
    onError('not-supported');
    return () => {};
  }

  const r = new Ctor();
  r.lang = 'en-US';
  r.interimResults = false;
  r.maxAlternatives = 1;

  r.onresult = (e: SpeechRecognitionEvent) => {
    const transcript = e.results[0][0].transcript.trim();
    onResult(transcript);
  };

  r.onerror = (e: SpeechRecognitionErrorEvent) => {
    // 'aborted' fires when we call r.abort() ourselves — ignore it silently
    if (e.error !== 'aborted' && e.error !== 'no-speech') {
      onError(e.error);
    }
  };

  r.start();
  return () => { r.abort(); };
}

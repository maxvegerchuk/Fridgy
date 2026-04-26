type SpeechRecognitionCtor = new () => SpeechRecognition;

function getCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor };
  return (
    ('SpeechRecognition' in window ? (window.SpeechRecognition as SpeechRecognitionCtor) : undefined) ??
    w.webkitSpeechRecognition
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

  r.addEventListener('result', (e) => {
    const transcript = e.results[0][0].transcript.trim();
    onResult(transcript);
  });

  r.addEventListener('error', (e) => {
    // 'aborted' fires when we call r.abort() ourselves — ignore it silently
    if (e.error !== 'aborted' && e.error !== 'no-speech') {
      onError(e.error);
    }
  });

  r.start();
  return () => { r.abort(); };
}

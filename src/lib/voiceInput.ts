export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}

/** Starts voice recognition. Returns a stop/abort function. */
export function startVoiceRecognition(
  onResult: (text: string) => void,
  onError: (error: string) => void,
): () => void {
  if (typeof window === 'undefined') {
    onError('not-supported');
    return () => {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) {
    onError('not-supported');
    return () => {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = new SpeechRecognitionAPI();
  r.lang = 'en-US';
  r.interimResults = false;
  r.maxAlternatives = 1;

  r.onresult = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const transcript = e.results[0][0].transcript.trim();
    onResult(transcript);
  };

  r.onerror = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // 'aborted' fires when we call r.abort() ourselves — ignore it silently
    if (e.error !== 'aborted' && e.error !== 'no-speech') {
      onError(e.error);
    }
  };

  r.start();
  return () => { r.abort(); };
}

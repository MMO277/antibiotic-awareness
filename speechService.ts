export interface SpeechState {
  supported: boolean;
  hasVoice: boolean;
  playing: boolean;
  paused: boolean;
  rate: number;
  currentParagraphIndex: number;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([]);
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // Chrome loads voices asynchronously
    const handler = () => {
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(voices);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Fallback timeout in case voiceschanged never fires
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

export function findVoiceForLang(voices: SpeechSynthesisVoice[], lang: 'ar' | 'en'): SpeechSynthesisVoice | null {
  if (lang === 'ar') {
    // Prefer Egyptian or Saudi Arabic, then any Arabic
    const eg = voices.find((v) => v.lang === 'ar-EG' || v.lang === 'ar_EG');
    if (eg) return eg;
    const sa = voices.find((v) => v.lang === 'ar-SA' || v.lang === 'ar_SA');
    if (sa) return sa;
    const anyAr = voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
    if (anyAr) return anyAr;
    return null;
  } else {
    const us = voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US');
    if (us) return us;
    const gb = voices.find((v) => v.lang === 'en-GB' || v.lang === 'en_GB');
    if (gb) return gb;
    const anyEn = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (anyEn) return anyEn;
    return null;
  }
}

export class SpeechPlayer {
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  public onStateChange?: (state: { playing: boolean; paused: boolean }) => void;
  public onParagraphStart?: (index: number) => void;
  public onFinished?: () => void;
  public onError?: (err: any) => void;

  constructor() {
    if (isSpeechSupported()) {
      getVoices().then((v) => {
        this.voices = v;
      });
    }
  }

  public stop(): void {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.cancel();
    this.utterance = null;
    this.onStateChange?.({ playing: false, paused: false });
  }

  public pause(): void {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.pause();
    this.onStateChange?.({ playing: false, paused: true });
  }

  public resume(): void {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.resume();
    this.onStateChange?.({ playing: true, paused: false });
  }

  public async speakText(
    text: string,
    lang: 'ar' | 'en',
    rate = 1.0,
    onEnd?: () => void
  ): Promise<boolean> {
    if (!isSpeechSupported() || !text.trim()) return false;
    this.stop();

    if (this.voices.length === 0) {
      this.voices = await getVoices();
    }

    const voice = findVoiceForLang(this.voices, lang);
    const u = new SpeechSynthesisUtterance(text);
    this.utterance = u;
    u.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    u.rate = rate;
    if (voice) {
      u.voice = voice;
    }

    u.onstart = () => {
      this.onStateChange?.({ playing: true, paused: false });
    };

    u.onend = () => {
      this.onStateChange?.({ playing: false, paused: false });
      onEnd?.();
    };

    u.onerror = (e) => {
      // Ignore canceled errors caused by user clicking stop
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('SpeechSynthesis error:', e);
        this.onError?.(e);
      }
      this.onStateChange?.({ playing: false, paused: false });
    };

    window.speechSynthesis.speak(u);
    return true;
  }
}

const sharedPlayer = new SpeechPlayer();

export function speakText(
  text: string,
  lang: 'ar' | 'en',
  rate = 1.0,
  onEnd?: () => void
): Promise<boolean> {
  return sharedPlayer.speakText(text, lang, rate, onEnd);
}

export function stopSpeech(): void {
  sharedPlayer.stop();
}

// Audio synthesis and pronunciation manager using Web Audio API and Dict Voice

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private preloadedAudios = new Map<string, HTMLAudioElement>();

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Preload next upcoming words to eliminate audio network lag
  preloadWords(words: string[], accent: 'us' | 'uk' = 'us'): void {
    if (typeof window === 'undefined') return;
    const type = accent === 'uk' ? '1' : '2';

    // Limit cache size to 60 elements
    if (this.preloadedAudios.size > 60) {
      this.preloadedAudios.clear();
    }

    words.slice(0, 5).forEach((w) => {
      const cleanWord = w.trim().toLowerCase();
      if (!cleanWord) return;
      const key = `${cleanWord}_${type}`;
      if (!this.preloadedAudios.has(key)) {
        try {
          const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=${type}`;
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = audioUrl;
          this.preloadedAudios.set(key, audio);
        } catch {
          // Ignore preloading issues
        }
      }
    });
  }

  // Play mechanical key click sound
  playKeyClick() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Mechanical switch click simulation
      const baseFreq = 800 + Math.random() * 400;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // AudioContext might be blocked before first user interaction
    }
  }

  // Play wrong keystroke buzz
  playErrorSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Ignore
    }
  }

  // Play word completed celebration ding
  playSuccessSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      // Two harmonic chime notes
      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.36);
      });
    } catch {
      // Ignore
    }
  }

  // Play word pronunciation: accent 'us' or 'uk', with optional playback rate and repeat count
  async playPronunciation(
    word: string,
    accent: 'us' | 'uk' = 'us',
    options?: { rate?: number; repeat?: 1 | 2 }
  ): Promise<void> {
    const playOnce = (): Promise<void> => {
      return new Promise((resolve) => {
        const cleanWord = word.trim().toLowerCase();
        if (!cleanWord) {
          resolve();
          return;
        }

        // Stop previous audio
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
        }

        // Dict voice URL: type 1 = UK (英音), type 2 = US (美音)
        const type = accent === 'uk' ? '1' : '2';
        const key = `${cleanWord}_${type}`;
        const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=${type}`;

        const audio = this.preloadedAudios.get(key) || new Audio(audioUrl);
        // Reset playback position if reused
        audio.currentTime = 0;
        if (options?.rate) {
          audio.playbackRate = options.rate;
        }
        this.currentAudio = audio;

        let fallbackTriggered = false;

        const fallbackToWebSpeech = () => {
          if (fallbackTriggered) return;
          fallbackTriggered = true;
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleanWord);
            utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
            utterance.rate = (options?.rate || 1.0) * 0.9;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
          } else {
            resolve();
          }
        };

        const timer = setTimeout(() => {
          // If audio doesn't start or load in 1.2s, use speech synthesis fallback
          fallbackToWebSpeech();
        }, 1200);

        audio.onplay = () => {
          clearTimeout(timer);
        };

        audio.onended = () => {
          clearTimeout(timer);
          resolve();
        };

        audio.onerror = () => {
          clearTimeout(timer);
          fallbackToWebSpeech();
        };

        audio.play().catch(() => {
          clearTimeout(timer);
          fallbackToWebSpeech();
        });
      });
    };

    // First playback
    await playOnce();

    // If repeat is requested, wait 220ms and play second time
    if (options?.repeat === 2) {
      await new Promise((r) => setTimeout(r, 220));
      await playOnce();
    }
  }
}

export const soundManager = new SoundManager();

// Synthesized Web Audio API feedback (zero external audio files needed)
class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playDice() {
    this.tone(240, 0.06, 'triangle', 0.06, 0);
    this.tone(310, 0.06, 'triangle', 0.06, 0.07);
    this.tone(390, 0.08, 'triangle', 0.07, 0.14);
  }

  playStep() {
    this.tone(520, 0.045, 'sine', 0.04, 0);
  }

  playPayday() {
    this.tone(523.25, 0.12, 'sine', 0.08, 0);
    this.tone(659.25, 0.12, 'sine', 0.08, 0.09);
    this.tone(783.99, 0.22, 'sine', 0.09, 0.18);
  }

  playDeal() {
    this.tone(440, 0.1, 'triangle', 0.07, 0);
    this.tone(554.37, 0.16, 'triangle', 0.08, 0.09);
  }

  playWarning() {
    this.tone(260, 0.14, 'sawtooth', 0.04, 0);
    this.tone(195, 0.22, 'sawtooth', 0.04, 0.12);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this.tone(n, 0.26, 'triangle', 0.09, i * 0.11));
  }
}

export const sound = new SoundEngine();

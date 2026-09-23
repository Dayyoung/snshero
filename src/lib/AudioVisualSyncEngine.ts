/**
 * AudioVisualSyncEngine.ts - SCR-07-19
 * 오디오-비주얼 타임스탬프 동기화 60fps 파이프라인 엔진
 */

export class AudioVisualSyncEngine {
  private static audioCtx: AudioContext | null = null;

  public static syncTickHapticSound(timestamp: number) {
    if (typeof window === 'undefined') return;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.audioCtx) {
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
      } catch {
        // ignore audio failure
      }
    }
  }
}

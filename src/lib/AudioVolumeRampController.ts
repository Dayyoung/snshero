/**
 * AudioVolumeRampController.ts - SCR-12-25
 * Web Audio API의 GainNode.linearRampToValueAtTime을 사용하여
 * 볼륨 변경 시 오디오 버퍼 재초기화 없이 지직거림(글리치)과 55ms UI 프리징을 100% 방지하는 램프 컨트롤러.
 * 150ms 디바운스 적용으로 로컬스토리지 I/O 부하 제거.
 */

export class AudioVolumeRampController {
  private static audioCtx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static bgmGain: GainNode | null = null;
  private static sfxGain: GainNode | null = null;
  private static debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private static initAudio(): void {
    if (this.audioCtx) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.bgmGain = this.audioCtx.createGain();
        this.sfxGain = this.audioCtx.createGain();

        this.bgmGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.audioCtx.destination);
      }
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  static setBgmVolume(volume: number): void {
    this.initAudio();
    const clamped = Math.max(0, Math.min(1, volume));

    if (this.audioCtx && this.bgmGain) {
      const currTime = this.audioCtx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(currTime);
      this.bgmGain.gain.linearRampToValueAtTime(clamped, currTime + 0.05);
    }

    this.debounceSave('hero_bgm_volume', clamped);
  }

  static setSfxVolume(volume: number): void {
    this.initAudio();
    const clamped = Math.max(0, Math.min(1, volume));

    if (this.audioCtx && this.sfxGain) {
      const currTime = this.audioCtx.currentTime;
      this.sfxGain.gain.cancelScheduledValues(currTime);
      this.sfxGain.gain.linearRampToValueAtTime(clamped, currTime + 0.05);
    }

    this.debounceSave('hero_sfx_volume', clamped);
  }

  private static debounceSave(key: string, value: number): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      try {
        localStorage.setItem(key, String(value));
      } catch {
        // quota exceeded fallback
      }
    }, 150);
  }
}

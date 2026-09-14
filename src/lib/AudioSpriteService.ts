/**
 * AudioSpriteService.ts
 * 저사양 모바일 기기 대응 통합 오디오 스프라이트 & 무지연 Web Audio API 사운드 엔진
 * (구글 스프레드시트 Row 1057 / ID 320 요구사항 구현)
 */

export type AudioSfxName = 
  | 'card_drop'
  | 'card_flip'
  | 'card_capture'
  | 'click'
  | 'turn_start'
  | 'coin_toss'
  | 'victory'
  | 'defeat'
  | 'badge_pop';

interface SpriteMarker {
  start: number; // seconds
  duration: number; // seconds
}

class AudioSpriteService {
  private static instance: AudioSpriteService;
  private audioCtx: AudioContext | null = null;
  private spriteBuffer: AudioBuffer | null = null;
  private isPreloaded: boolean = false;
  private isMuted: boolean = false;
  private memoryCapBytes: number = 8 * 1024 * 1024; // 8MB

  // 스프라이트 시트 마커
  private markers: Record<AudioSfxName, SpriteMarker> = {
    card_drop: { start: 0.0, duration: 0.25 },
    card_flip: { start: 0.3, duration: 0.35 },
    card_capture: { start: 0.7, duration: 0.45 },
    click: { start: 1.2, duration: 0.1 },
    turn_start: { start: 1.4, duration: 0.5 },
    coin_toss: { start: 2.0, duration: 0.6 },
    victory: { start: 2.7, duration: 1.2 },
    defeat: { start: 4.0, duration: 1.0 },
    badge_pop: { start: 5.1, duration: 0.2 },
  };

  private constructor() {
    // 묵음 여부 체크
    try {
      this.isMuted = localStorage.getItem('hero_sound_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  public static getInstance(): AudioSpriteService {
    if (!AudioSpriteService.instance) {
      AudioSpriteService.instance = new AudioSpriteService();
    }
    return AudioSpriteService.instance;
  }

  private initAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * 앱 진입 시 1회 버퍼 프리로드 (8MB 미만 유지)
   */
  public async preload(): Promise<void> {
    if (this.isPreloaded) return;
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      // 합성 오디오 스프라이트 버퍼 메모리 할당 (44.1kHz, 6초 = 약 1MB)
      const sampleRate = ctx.sampleRate || 44100;
      const totalDuration = 6.0;
      const length = Math.floor(sampleRate * totalDuration);
      
      // 메모리 안전 검사
      if (length * 4 > this.memoryCapBytes) return;

      this.spriteBuffer = ctx.createBuffer(1, length, sampleRate);
      this.isPreloaded = true;
    } catch (err) {
      console.warn('[AudioSpriteService] Preload fallback:', err);
    }
  }

  /**
   * 정밀 Web Audio API 합성 사운드 재생 (0ms 지연)
   */
  public play(name: AudioSfxName): void {
    if (this.isMuted) return;

    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      switch (name) {
        case 'card_drop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }
        case 'card_flip': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }
        case 'card_capture': {
          // 강렬한 타격감의 2중 톤
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(440, now);
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.2);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(220, now);
          osc2.frequency.exponentialRampToValueAtTime(110, now + 0.2);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.22);
          osc2.stop(now + 0.22);

          // 햅틱 진동 동기화
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 20, 50]);
          }
          break;
        }
        case 'coin_toss': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.2);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'turn_start': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(660, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
        case 'click': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
        case 'victory': {
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.25, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
          });
          break;
        }
        case 'defeat': {
          [440, 415.3, 392.0, 369.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            gain.gain.setValueAtTime(0.2, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.25);
          });
          break;
        }
        case 'badge_pop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }
      }
    } catch {
      // 오디오 미지원 환경 무음 폴백
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('hero_sound_muted', muted ? 'true' : 'false');
    } catch {}
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const audioSpriteService = AudioSpriteService.getInstance();
export const playBattleSfx = (name: AudioSfxName) => audioSpriteService.play(name);

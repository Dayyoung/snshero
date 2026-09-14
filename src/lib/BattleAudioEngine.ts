/**
 * BattleAudioEngine.ts
 * 대전 사운드 전용 동적 오디오 엔진
 * - ID 345: 연쇄 뒤집기 콤보 시 재생 피치 점진적 상승 (+100 cents, 최대 +400 cents)
 * - ID 381: 연속 뒤집기(Double Flip, Mega Turn, Comeback) 아나운서 피드백
 * - ID 341: 턴 임박 (<=5초) 심장박동 펄스 SFX
 * - ID 395: 오디오 인스턴스 최대 동시 4개 풀링 제한
 */

class BattleAudioEngine {
  private static instance: BattleAudioEngine;
  private audioCtx: AudioContext | null = null;
  private activeSources: AudioNode[] = [];
  private readonly maxSimultaneous = 4;
  private comboStep = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // Lazy init audio context on first user gesture
  }

  public static getInstance(): BattleAudioEngine {
    if (!BattleAudioEngine.instance) {
      BattleAudioEngine.instance = new BattleAudioEngine();
    }
    return BattleAudioEngine.instance;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
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

  private trackSource(node: AudioNode) {
    this.activeSources.push(node);
    if (this.activeSources.length > this.maxSimultaneous) {
      const oldest = this.activeSources.shift();
      try {
        if (oldest && 'stop' in oldest && typeof (oldest as AudioScheduledSourceNode).stop === 'function') {
          (oldest as AudioScheduledSourceNode).stop();
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * ID 345: 연쇄 뒤집기 발생 시 피치 상승 사운드 (+100 cents per cascade, max +400 cents)
   */
  public playCascadeFlipSound(chainIndex: number = 0): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.comboStep = Math.min(chainIndex, 4);
    const baseFreq = 440; // A4
    // 100 cents = 2^(1/12)
    const pitchMultiplier = Math.pow(2, (this.comboStep * 100) / 1200);
    const freq = baseFreq * pitchMultiplier;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(osc);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  /**
   * ID 381: 연속 캡처 아나운서 음성/효과음
   * @param count 캡처한 카드 수
   * @param isComeback 역전 여부
   */
  public playAnnouncerStinger(count: number, isComeback: boolean = false): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    let text = 'DOUBLE FLIP!';
    let baseFreq = 523.25; // C5
    if (isComeback) {
      text = 'COMEBACK!';
      baseFreq = 659.25; // E5
    } else if (count >= 3) {
      text = 'MEGA TURN!';
      baseFreq = 783.99; // G5
    }

    // Web Speech API가 지원되는 경우 음성 피드백
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.3;
        utterance.pitch = 1.2;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      } catch {
        // fallback to audio synth
      }
    }

    // 하모닉 아르페지오 신스 사운드
    const chords = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    chords.forEach((chordFreq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.05;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(chordFreq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.trackSource(osc);
      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }

  /**
   * ID 341: 턴 제한시간 임박 (<=5초) 긴박한 심장박동 사운드 시작
   */
  public startHeartbeatTick(): void {
    if (this.heartbeatInterval) return;

    const tick = () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.trackSource(osc);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    };

    tick();
    this.heartbeatInterval = setInterval(tick, 800);
  }

  /**
   * 심장박동 사운드 정지
   */
  public stopHeartbeatTick(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * ID 404: 오디오 컨텍스트 suspended 복구
   */
  public resumeAudioContext(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }
}

export const battleAudio = BattleAudioEngine.getInstance();

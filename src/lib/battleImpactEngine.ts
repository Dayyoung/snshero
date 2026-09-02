/**
 * battleImpactEngine.ts
 * 전투 타격감 극대화를 위한 다이내믹 카드 임팩트 셰이크 & 콤보 팡파레 사운드 엔진
 * (구글 스프레드시트 Row 740 / ID 577 요구사항 구현)
 */

class BattleImpactEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * 카드 배치 시 묵직한 타격음 (Bass Kick + Sub-thump)
   */
  public playCardImpact(power: number = 5) {
    if (this.isMuted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const freq = Math.max(60, 180 - power * 8);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // AudioContext failure gracefully ignored
    }
  }

  /**
   * 카드 캡처 뒤집기 시 스냅 효과음 (High Snap + Harmonic Whoosh)
   */
  public playCardFlip(isCapture: boolean = true) {
    if (this.isMuted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = isCapture ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isCapture ? 420 : 320, now);
      osc.frequency.exponentialRampToValueAtTime(isCapture ? 880 : 520, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  /**
   * 연쇄 콤보 팡파레 (Double Flip! Multi Domination!)
   */
  public playComboFanfare(comboCount: number = 2) {
    if (this.isMuted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const baseFreqs = [440, 554.37, 659.25, 880]; // A4 Major arpeggio
      const notes = Math.min(comboCount + 1, 4);

      notes && Array.from({ length: notes }).forEach((_, i) => {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime + i * 0.08;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreqs[i % baseFreqs.length], now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch {
      // ignore
    }
  }

  /**
   * 방향성 마이크로 스크린 셰이크 트리거 (CSS 애니메이션 클래스 주입)
   */
  public triggerScreenShake(
    intensity: 'light' | 'medium' | 'heavy' = 'medium',
    targetElement?: HTMLElement | null
  ) {
    if (typeof window === 'undefined') return;

    const el = targetElement || document.body;
    const keyframes =
      intensity === 'heavy'
        ? [
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-4px, 3px) rotate(-1deg)' },
            { transform: 'translate(4px, -3px) rotate(1deg)' },
            { transform: 'translate(-3px, -2px)' },
            { transform: 'translate(2px, 2px)' },
            { transform: 'translate(0, 0)' },
          ]
        : intensity === 'medium'
        ? [
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-2px, 2px)' },
            { transform: 'translate(2px, -2px)' },
            { transform: 'translate(-1px, 1px)' },
            { transform: 'translate(0, 0)' },
          ]
        : [
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-1px, 1px)' },
            { transform: 'translate(1px, -1px)' },
            { transform: 'translate(0, 0)' },
          ];

    const duration = intensity === 'heavy' ? 260 : intensity === 'medium' ? 180 : 120;
    try {
      el.animate(keyframes, { duration, easing: 'ease-out' });
    } catch {
      // Web Animations API fallback
    }
  }

  /**
   * 파티클 버스트 커스텀 이벤트 디스패치
   */
  public triggerParticleBurst(x: number, y: number, color: string = '#f59e0b') {
    if (typeof window === 'undefined') return;
    const event = new CustomEvent('snshero-card-particle-burst', {
      detail: { x, y, color },
    });
    window.dispatchEvent(event);
  }
}

export const battleImpactEngine = new BattleImpactEngine();

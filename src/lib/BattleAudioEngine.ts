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

  /**
   * ID 497: 라스트 스탠드 심장박동 & 로우패스 긴장감 필터
   */
  public playLastStandHeartbeat(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.15);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(osc);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  }

  /**
   * ID 502: 트리플 플립 버스트 오케스트라 브라스 신스
   */
  public playTripleFlipBurst(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (화려한 메이저 코드)
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.04;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.trackSource(osc);
      osc.start(startTime);
      osc.stop(startTime + 0.48);
    });
  }

  /**
   * ID 507, 532, 542: 연쇄 도미노 가속 사운드 피치 상승 (+0.15 도-미-솔 하모니)
   */
  public playCascadeFlipHarmonic(chainIndex: number = 0): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // 도, 미, 솔, 도, 레, 미 스케일로 점진적 상승
    const notes = [261.63, 329.63, 392.0, 523.25, 587.33, 659.25, 783.99];
    const targetFreq = notes[Math.min(chainIndex, notes.length - 1)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(targetFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.25, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(osc);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  /**
   * ID 522: 카운터 반격(Riposte) 슬래시 SFX
   */
  public playRiposteCounterSlash(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(osc);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  /**
   * ID 547: 에이스 카드 파벌 오라 버스트 사운드
   */
  public playAceCardAura(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(osc);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  }

  /**
   * ID 557: 9턴 클러치 역전승 피니셔 황금 글래스 파쇄음 SFX
   */
  public playClutchFinisherGlassBreak(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // 고주파 노이즈 시뮬레이션
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(noise);
    noise.start();
    noise.stop(ctx.currentTime + 0.32);
  }

  /**
   * ID 562: 스탯차 +3 이상 캡처 시 서브우퍼 베이스 충격음
   */
  public playSubwooferImpact(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(osc);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  }

  /**
   * ID 567: 반격 발동 청록색 일렉트릭 링 천둥 SFX
   */
  public playElectricThunderShock(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(osc);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  }

  /**
   * ID 572: 7칸 이상 장악 'DOMINATION!' 팡파레 SFX
   */
  public playDominationFanfare(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E
    fanfare.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.08;

      osc.type = 'square';
      osc.frequency.setValueAtTime(f, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.trackSource(osc);
      osc.start(startTime);
      osc.stop(startTime + 0.32);
    });
  }

  /**
   * ID 582: 도미노 반격 시안 라이트닝 버스트 SFX
   */
  public playCyanLightningBurst(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(720, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    this.trackSource(osc);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }
}

export const battleAudio = BattleAudioEngine.getInstance();


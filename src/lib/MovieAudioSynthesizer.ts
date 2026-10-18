/**
 * MovieAudioSynthesizer.ts
 * Procedural Web Audio API sound generator & SpeechSynthesis voiceover engine
 * for SNSHero Cinematic Movie Player.
 */

export type MovieBgmTheme =
  | 'arctic-blizzard'
  | 'battle-march'
  | 'arcane-mystery'
  | 'triumph-fanfare'
  | 'dark-ominous'
  | 'sorrow-lament';

export type MovieSfxType =
  | 'sword-strike'
  | 'magic-cast'
  | 'thunder-impact'
  | 'shield-block'
  | 'whoosh'
  | 'victory-chime';

export class MovieAudioSynthesizer {
  private static instance: MovieAudioSynthesizer | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private bgmVolume: number = 0.55;
  private sfxVolume: number = 0.75;

  private currentTheme: MovieBgmTheme | null = null;
  private currentEpisodeId: number | null = null;
  private bgmNodes: {
    oscillators: OscillatorNode[];
    sources: AudioBufferSourceNode[];
    intervals: number[];
  } = {
    oscillators: [],
    sources: [],
    intervals: [],
  };

  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechVoices: SpeechSynthesisVoice[] = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        this.speechVoices = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.speechVoices = window.speechSynthesis.getVoices();
        };
      } catch {
        // Safe fallback
      }
    }
  }

  public static getInstance(): MovieAudioSynthesizer {
    if (!MovieAudioSynthesizer.instance) {
      MovieAudioSynthesizer.instance = new MovieAudioSynthesizer();
    }
    return MovieAudioSynthesizer.instance;
  }

  /**
   * Initializes or resumes Web Audio Context upon user interaction
   */
  public async initAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return false;

        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.bgmGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
        this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);

        this.bgmGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      return true;
    } catch (err) {
      console.warn('[MovieAudioSynthesizer] AudioContext init prevented:', err);
      return false;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1.0, this.ctx.currentTime);
    }
    if (muted) {
      this.stopNarration();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(bgmVol: number, sfxVol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, bgmVol));
    this.sfxVolume = Math.max(0, Math.min(1, sfxVol));

    if (this.ctx && this.bgmGain && this.sfxGain) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  /**
   * Continuous Episode BGM Lifecycle
   */
  public async startEpisodeBgm(episodeId: number, theme?: MovieBgmTheme): Promise<void> {
    const targetTheme: MovieBgmTheme = theme || 'arcane-mystery';
    if (
      this.currentEpisodeId === episodeId &&
      this.currentTheme === targetTheme &&
      this.bgmNodes.oscillators.length > 0
    ) {
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }
    this.currentEpisodeId = episodeId;
    await this.startBgm(targetTheme);
  }

  public stopEpisodeBgm(fadeTime: number = 0.5): void {
    this.currentEpisodeId = null;
    this.stopBgm(fadeTime);
  }

  /**
   * Procedural BGM Engine
   */
  public async startBgm(theme: MovieBgmTheme): Promise<void> {
    if (this.currentTheme === theme && this.bgmNodes.oscillators.length > 0) {
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }
    await this.initAudio();
    if (!this.ctx || !this.bgmGain) return;

    this.stopBgm(0.6);
    this.currentTheme = theme;

    switch (theme) {
      case 'arctic-blizzard':
        this.playArcticBlizzard();
        break;
      case 'battle-march':
        this.playBattleMarch();
        break;
      case 'arcane-mystery':
        this.playArcaneMystery();
        break;
      case 'triumph-fanfare':
        this.playTriumphFanfare();
        break;
      case 'dark-ominous':
        this.playDarkOminous();
        break;
      case 'sorrow-lament':
      default:
        this.playSorrowLament();
        break;
    }
  }

  public stopBgm(fadeTime: number = 0.5): void {
    if (!this.ctx || !this.bgmGain) return;

    // Clear active timers
    this.bgmNodes.intervals.forEach((timer) => window.clearInterval(timer));
    this.bgmNodes.intervals = [];

    // Fade out and stop oscillators
    const now = this.ctx.currentTime;
    for (const osc of this.bgmNodes.oscillators) {
      try {
        osc.stop(now + fadeTime);
      } catch {
        // safe ignore
      }
    }
    for (const src of this.bgmNodes.sources) {
      try {
        src.stop(now + fadeTime);
      } catch {
        // safe ignore
      }
    }

    this.bgmNodes.oscillators = [];
    this.bgmNodes.sources = [];
    this.currentTheme = null;
  }

  // --- PROCEDURAL BGM THEMES ---

  private playArcticBlizzard(): void {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;

    // 1. Low icy drone (55Hz + 110Hz sine)
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(55, now);
    droneGain.gain.setValueAtTime(0.01, now);
    droneGain.gain.linearRampToValueAtTime(0.25, now + 1.5);

    drone.connect(droneGain);
    droneGain.connect(this.bgmGain);
    drone.start(now);
    this.bgmNodes.oscillators.push(drone);

    // 2. White noise howling wind filter
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const windNoise = this.ctx.createBufferSource();
    windNoise.buffer = noiseBuffer;
    windNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, now);
    windFilter.Q.setValueAtTime(3.0, now);

    // Modulate wind filter cutoff with LFO
    const windLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    windLfo.frequency.setValueAtTime(0.18, now); // slow breath
    lfoGain.gain.setValueAtTime(260, now);
    windLfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    windLfo.start(now);
    this.bgmNodes.oscillators.push(windLfo);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.01, now);
    windGain.gain.linearRampToValueAtTime(0.18, now + 2.0);

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.bgmGain);
    windNoise.start(now);
    this.bgmNodes.sources.push(windNoise);

    // 3. Periodic crystalline chime arpeggio
    const chimeFreqs = [880, 1046.5, 1318.5, 1567.98, 1760];
    const chimeTimer = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];

      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, t);

      chimeGain.gain.setValueAtTime(0.001, t);
      chimeGain.gain.linearRampToValueAtTime(0.08, t + 0.05);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.bgmGain);
      chimeOsc.start(t);
      chimeOsc.stop(t + 2.5);
    }, 2800);

    this.bgmNodes.intervals.push(chimeTimer);
  }

  private playBattleMarch(): void {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;

    // Low relentless war drone (D2, 73.4Hz)
    const warDrone = this.ctx.createOscillator();
    const warGain = this.ctx.createGain();
    warDrone.type = 'sawtooth';
    warDrone.frequency.setValueAtTime(73.4, now);

    const warFilter = this.ctx.createBiquadFilter();
    warFilter.type = 'lowpass';
    warFilter.frequency.setValueAtTime(260, now);

    warGain.gain.setValueAtTime(0.01, now);
    warGain.gain.linearRampToValueAtTime(0.22, now + 1.0);

    warDrone.connect(warFilter);
    warFilter.connect(warGain);
    warGain.connect(this.bgmGain);
    warDrone.start(now);
    this.bgmNodes.oscillators.push(warDrone);

    // Rhythmic bass pulse + snare click on beat
    let step = 0;
    const chords = [73.4, 82.4, 98.0, 65.4]; // D, E, G, C
    const marchTimer = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const root = chords[Math.floor(step / 4) % chords.length];

      // Bass punch
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(root, t);
      bassGain.gain.setValueAtTime(0.24, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      bassOsc.connect(bassGain);
      bassGain.connect(this.bgmGain);
      bassOsc.start(t);
      bassOsc.stop(t + 0.38);

      // War snare / percussion hit on 2 and 4
      if (step % 2 === 1) {
        const snareNoise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        snareNoise.buffer = buf;

        const snareFilter = this.ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.setValueAtTime(1200, t);

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(0.12, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.bgmGain);
        snareNoise.start(t);
      }

      step++;
    }, 550);

    this.bgmNodes.intervals.push(marchTimer);
  }

  private playArcaneMystery(): void {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;

    // Harmonic minor triad pad (A2, C3, E3, B3)
    const freqs = [110, 130.81, 164.81, 246.94];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 2.0);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      this.bgmNodes.oscillators.push(osc);
    });

    // Slow celestial resonant filter sweep
    const shimmerTimer = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      const notes = [440, 523.25, 659.25, 783.99, 987.77];
      bell.type = 'sine';
      bell.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], t);

      bellGain.gain.setValueAtTime(0.001, t);
      bellGain.gain.linearRampToValueAtTime(0.06, t + 0.1);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);

      bell.connect(bellGain);
      bellGain.connect(this.bgmGain);
      bell.start(t);
      bell.stop(t + 3.0);
    }, 2400);

    this.bgmNodes.intervals.push(shimmerTimer);
  }

  private playTriumphFanfare(): void {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;

    // Majestic brass foundation (C3, G3, C4)
    const brassFreqs = [130.81, 196.0, 261.63];
    brassFreqs.forEach((freq) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(580, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      this.bgmNodes.oscillators.push(osc);
    });

    // Regal melodic interval bursts
    const fanfareMelody = [261.63, 329.63, 392.0, 523.25, 392.0, 523.25];
    let noteIdx = 0;
    const fanfareTimer = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const freq = fanfareMelody[noteIdx % fanfareMelody.length];

      const horn = this.ctx.createOscillator();
      const hornGain = this.ctx.createGain();
      horn.type = 'triangle';
      horn.frequency.setValueAtTime(freq, t);

      hornGain.gain.setValueAtTime(0.01, t);
      hornGain.gain.linearRampToValueAtTime(0.15, t + 0.15);
      hornGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      horn.connect(hornGain);
      hornGain.connect(this.bgmGain);
      horn.start(t);
      horn.stop(t + 1.5);

      noteIdx++;
    }, 1800);

    this.bgmNodes.intervals.push(fanfareTimer);
  }

  private playDarkOminous(): void {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;

    // Sub-bass dread drone (38Hz sine + 76Hz tritone)
    const drone1 = this.ctx.createOscillator();
    const drone2 = this.ctx.createOscillator();
    const darkGain = this.ctx.createGain();

    drone1.type = 'sine';
    drone1.frequency.setValueAtTime(38.89, now); // Eb1

    drone2.type = 'sawtooth';
    drone2.frequency.setValueAtTime(55.0, now); // A1 tritone friction

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(180, now);

    darkGain.gain.setValueAtTime(0.01, now);
    darkGain.gain.linearRampToValueAtTime(0.28, now + 1.5);

    drone1.connect(darkGain);
    drone2.connect(lowpass);
    lowpass.connect(darkGain);
    darkGain.connect(this.bgmGain);

    drone1.start(now);
    drone2.start(now);
    this.bgmNodes.oscillators.push(drone1, drone2);

    // Deep ominous heartbeat pulse
    const beatTimer = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;

      // Heartbeat 1 (Lub)
      const osc1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      osc1.frequency.setValueAtTime(58, t);
      osc1.frequency.exponentialRampToValueAtTime(32, t + 0.18);
      g1.gain.setValueAtTime(0.25, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc1.connect(g1);
      g1.connect(this.bgmGain);
      osc1.start(t);
      osc1.stop(t + 0.22);

      // Heartbeat 2 (Dub)
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.frequency.setValueAtTime(50, t + 0.28);
      osc2.frequency.exponentialRampToValueAtTime(28, t + 0.46);
      g2.gain.setValueAtTime(0.18, t + 0.28);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
      osc2.connect(g2);
      g2.connect(this.bgmGain);
      osc2.start(t + 0.28);
      osc2.stop(t + 0.5);
    }, 2500);

    this.bgmNodes.intervals.push(beatTimer);
  }

  private playSorrowLament(): void {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;

    // Minor lament chords (Dm: 146.83, 174.61, 220.0)
    const freqs = [146.83, 174.61, 220.0];
    freqs.forEach((freq) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 1.8);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      this.bgmNodes.oscillators.push(osc);
    });

    // Slow mournful flute-like top voice
    const notes = [293.66, 329.63, 349.23, 392.0, 440.0];
    let idx = 0;
    const fluteTimer = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const f = notes[idx % notes.length];

      const flute = this.ctx.createOscillator();
      const fGain = this.ctx.createGain();
      flute.type = 'sine';
      flute.frequency.setValueAtTime(f, t);

      fGain.gain.setValueAtTime(0.001, t);
      fGain.gain.linearRampToValueAtTime(0.09, t + 0.4);
      fGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

      flute.connect(fGain);
      fGain.connect(this.bgmGain);
      flute.start(t);
      flute.stop(t + 2.3);

      idx++;
    }, 2800);

    this.bgmNodes.intervals.push(fluteTimer);
  }

  // --- PROCEDURAL SFX TRIGGERS ---

  public async playSfx(type: MovieSfxType): Promise<void> {
    if (this.isMuted) return;
    await this.initAudio();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'sword-strike': {
        // High transient friction noise + metallic blade pitch drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'magic-cast': {
        // Upward shimmering sine sweep + crystalline harmonics
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(1900, now + 0.35);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.42);
        break;
      }

      case 'thunder-impact': {
        // Sub-bass drop + explosive noise crack
        const bass = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(140, now);
        bass.frequency.exponentialRampToValueAtTime(25, now + 0.6);

        bGain.gain.setValueAtTime(0.5, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        bass.connect(bGain);
        bGain.connect(this.sfxGain);
        bass.start(now);
        bass.stop(now + 0.7);
        break;
      }

      case 'shield-block': {
        // Heavy metallic deflection thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'whoosh': {
        // Smooth scene transition wind swoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'victory-chime': {
        // Ascending major fanfare
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          if (!this.ctx || !this.sfxGain) return;
          const t = now + idx * 0.1;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.55);
        });
        break;
      }
    }
  }

  // --- SPEECHSYNTHESIS VOICEOVER NARRATION ---

  public speakEnglishNarration(text: string, onEnd?: () => void): void {
    this.speakNarration(text, 'en', onEnd);
  }

  public speakNarration(
    text: string,
    language: 'ko' | 'en' | 'ja' = 'en',
    onEnd?: () => void
  ): void {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.stopNarration();

      // Fix race condition in speech synthesis engines
      window.setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        const langMap: Record<string, string> = {
          ko: 'ko-KR',
          en: 'en-US',
          ja: 'ja-JP',
        };
        utterance.lang = langMap[language] || 'en-US';
        utterance.rate = 1.02;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Lazy voice reload if empty
        if (this.speechVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            this.speechVoices = window.speechSynthesis.getVoices();
          } catch {
            // ignore
          }
        }

        // Prioritized voice selection
        if (this.speechVoices.length > 0) {
          if (language === 'en') {
            const preferredVoices = [
              'Google US English', 'Samantha', 'Daniel', 'Alex',
              'Karen', 'Victoria', 'Fred', 'en-US', 'en-GB'
            ];
            const matched =
              this.speechVoices.find((v) => preferredVoices.some((p) => v.name.includes(p))) ||
              this.speechVoices.find((v) => v.lang === 'en-US') ||
              this.speechVoices.find((v) => v.lang === 'en-GB') ||
              this.speechVoices.find((v) => v.lang.startsWith('en'));
            if (matched) utterance.voice = matched;
          } else {
            const prefix = utterance.lang.slice(0, 2);
            const matched = this.speechVoices.find((v) => v.lang.startsWith(prefix));
            if (matched) utterance.voice = matched;
          }
        }

        utterance.onend = () => {
          this.currentUtterance = null;
          if (onEnd) onEnd();
        };
        utterance.onerror = () => {
          this.currentUtterance = null;
          if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
      }, 30);
    } catch (err) {
      console.warn('[MovieAudioSynthesizer] SpeechSynthesis error:', err);
      if (onEnd) onEnd();
    }
  }

  public stopNarration(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // safe fallback
      }
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  public stopAll(): void {
    this.currentEpisodeId = null;
    this.stopBgm(0.3);
    this.stopNarration();
  }

  public dispose(): void {
    this.stopAll();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
    }
    this.ctx = null;
    MovieAudioSynthesizer.instance = null;
  }
}

export const movieAudio = MovieAudioSynthesizer.getInstance();

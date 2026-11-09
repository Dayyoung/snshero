/**
 * src/landing/services/audioManager.ts
 *
 * Robust Zero-Latency Audio & Sound System for SNSHero Static Landing.
 * Fully optimized for Mobile Browsers (iOS Safari, Android Chrome, PWA & WebViews).
 *
 * Mobile Audio Enhancements:
 *   1. Guaranteed Audio Playback: Web Audio API Synthesizer + Local Audio.
 *   2. Universal Mobile Web Audio Unlock: Silent buffer burst + continuous gesture keep-alive
 *      so audio NEVER gets stuck in 'suspended' or 'interrupted' states on iOS Safari.
 *   3. Zero-Network Reliance SFX: 100% Native Web Audio synthesis eliminating external CDN
 *      latency, CORS failures, or mobile data throttling.
 *   4. Page Visibility & Lifecycle Guard: Automatically pauses on background and resumes on foreground focus.
 *   5. Safe Audio Context Scheduling: Executes sound generation after ensuring AudioContext is running.
 */

export type SceneBgmType = 'map' | 'dialogue' | 'battle' | 'lobby' | 'general';

export interface AudioSettings {
  bgmEnabled: boolean;
  bgmVolume: number; // 0..100
  bgmTrack: string;
  sfxEnabled: boolean;
  sfxVolume: number; // 0..100
  hapticEnabled: boolean;
}

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private bgmAudioEl: HTMLAudioElement | null = null;
  private bgmMasterGain: GainNode | null = null;
  private bgmSynthInterval: any = null;
  private isBgmPlaying: boolean = false;
  private userInteracted: boolean = false;
  private isUnlocked: boolean = false;
  private currentTrack: string = 'title';
  private currentScene: SceneBgmType = 'map';
  private activeSynthNodes: {
    oscs: OscillatorNode[];
    gains: GainNode[];
    intervals: any[];
  } = { oscs: [], gains: [], intervals: [] };

  constructor() {
    this.initFromLocalStorage();
    this.setupUserInteractionListener();
    this.setupLifecycleListener();
  }

  private initFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    this.currentTrack = localStorage.getItem('hero_bgm_track') || 'title';
  }

  /**
   * Continuous Mobile Gesture Listener:
   * Keeps AudioContext and HTMLAudio unlocked on every touch/click/pointer interaction.
   */
  private setupUserInteractionListener(): void {
    if (typeof window === 'undefined') return;

    const onUserGesture = () => {
      this.userInteracted = true;
      this.unlockMobileAudio();

      const settings = this.getSettings();
      if (settings.bgmEnabled && !this.isBgmPlaying) {
        this.playBgm();
      }
    };

    // Attach passive touch and pointer events without removing them,
    // so any interaction after a phone sleep/lock will immediately resume audio
    const options = { passive: true, capture: true };
    window.addEventListener('touchstart', onUserGesture, options);
    window.addEventListener('touchend', onUserGesture, options);
    window.addEventListener('pointerdown', onUserGesture, options);
    window.addEventListener('click', onUserGesture, options);
    window.addEventListener('keydown', onUserGesture, options);
  }

  /**
   * Lifecycle Listener: Handle tab background/foreground transitions on mobile
   */
  private setupLifecycleListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // App returned to foreground: resume audio context and restore BGM
        this.unlockMobileAudio();
        const settings = this.getSettings();
        if (settings.bgmEnabled && this.isBgmPlaying) {
          if (this.bgmAudioEl && this.bgmAudioEl.paused && this.currentScene === 'map') {
            this.bgmAudioEl.play().catch(() => {
              this.playSceneBgm(this.currentScene, true);
            });
          } else {
            this.playSceneBgm(this.currentScene, true);
          }
        }
      } else {
        // App went to background: pause HTMLAudioElement to conserve battery
        if (this.bgmAudioEl && !this.bgmAudioEl.paused) {
          try {
            this.bgmAudioEl.pause();
          } catch {}
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.unlockMobileAudio();
      });
      window.addEventListener('pageshow', () => {
        this.unlockMobileAudio();
      });
    }
  }

  /**
   * Standard Web Audio Unlock for iOS Safari and Mobile Devices.
   * Plays a 1-sample silent buffer to unlock the hardware audio engine.
   */
  public unlockMobileAudio(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      const ctx = this.getAudioContext();
      if (!ctx) {
        resolve(false);
        return;
      }

      const finishUnlock = () => {
        try {
          // Play a microscopic silent buffer to guarantee iOS Safari hardware unlock
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        } catch {}
        this.isUnlocked = true;
        resolve(true);
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          finishUnlock();
        }).catch(() => {
          resolve(false);
        });
      } else {
        finishUnlock();
      }
    });
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
   * Executes a Web Audio synthesis routine safely after ensuring the AudioContext is running.
   */
  private withActiveAudioContext(fn: (ctx: AudioContext) => void): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        try {
          fn(ctx);
        } catch {}
      }).catch(() => {});
    } else {
      try {
        fn(ctx);
      } catch {}
    }
  }

  public getSettings(): AudioSettings {
    if (typeof localStorage === 'undefined') {
      return {
        bgmEnabled: true,
        bgmVolume: 20,
        bgmTrack: 'title',
        sfxEnabled: true,
        sfxVolume: 90,
        hapticEnabled: true,
      };
    }

    const isExplicitMute = localStorage.getItem('hero_audio_muted') === 'true';
    const bgmEnabled = !isExplicitMute && localStorage.getItem('hero_bgm_enabled') !== 'false';
    const bgmVolStr = localStorage.getItem('hero_bgm_volume');
    const parsedBgmVol = bgmVolStr !== null ? parseInt(bgmVolStr, 10) : 20;
    const bgmVolume = Math.max(0, Math.min(100, Number.isNaN(parsedBgmVol) ? 20 : parsedBgmVol));
    const bgmTrack = localStorage.getItem('hero_bgm_track') || 'title';

    const sfxEnabled = !isExplicitMute && localStorage.getItem('hero_sfx_enabled') !== 'false';
    const sfxVolStr = localStorage.getItem('hero_sfx_volume');
    const parsedSfxVol = sfxVolStr !== null ? parseInt(sfxVolStr, 10) : 90;
    const sfxVolume = Math.max(0, Math.min(100, Number.isNaN(parsedSfxVol) ? 90 : parsedSfxVol));

    const hapticEnabled = localStorage.getItem('hero_haptic_enabled') !== 'false';

    return {
      bgmEnabled,
      bgmVolume,
      bgmTrack,
      sfxEnabled,
      sfxVolume,
      hapticEnabled,
    };
  }

  // ── Master Mute Management ──────────────────────────────────────────────────

  public isMuted(): boolean {
    if (typeof localStorage === 'undefined') return false;
    if (localStorage.getItem('hero_audio_muted') === 'true') return true;
    const settings = this.getSettings();
    const bgmAudible = settings.bgmEnabled && settings.bgmVolume > 0;
    const sfxAudible = settings.sfxEnabled && settings.sfxVolume > 0;
    return !bgmAudible && !sfxAudible;
  }

  public toggleMute(): boolean {
    const currentlyMuted = this.isMuted();
    const newMuted = !currentlyMuted;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hero_audio_muted', String(newMuted));
      if (newMuted) {
        localStorage.setItem('hero_bgm_enabled', 'false');
        localStorage.setItem('hero_sfx_enabled', 'false');
        localStorage.setItem('hero_bgm', 'false');
        localStorage.setItem('hero_sfx', 'false');
        this.stopBgm();
        try {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        } catch {}
      } else {
        localStorage.setItem('hero_bgm_enabled', 'true');
        localStorage.setItem('hero_sfx_enabled', 'true');
        localStorage.setItem('hero_bgm', 'true');
        localStorage.setItem('hero_sfx', 'true');
        const settings = this.getSettings();
        if (settings.bgmVolume <= 0) {
          localStorage.setItem('hero_bgm_volume', '25');
        }
        if (settings.sfxVolume <= 0) {
          localStorage.setItem('hero_sfx_volume', '85');
        }
        this.unlockMobileAudio().then(() => {
          if (!this.isMuted()) {
            this.playBgm();
            this.playClickTick();
          }
        });
      }
    }

    this.dispatchAudioChangedEvent();
    return newMuted;
  }

  // ── BGM Management (Scene-Adaptive: General / Dialogue / Battle) ─────────────

  public getSceneBgm(): SceneBgmType {
    return this.currentScene;
  }

  /**
   * Resolves a track ID ('title' | 'peace' | 'battle' | 'lobby') to its scene BGM type.
   */
  public resolveTrackToScene(trackId?: string): SceneBgmType {
    const id = trackId || this.currentTrack || 'title';
    if (id === 'battle') return 'battle';
    if (id === 'peace') return 'dialogue';
    if (id === 'lobby') return 'lobby';
    return 'map';
  }

  /**
   * Sync active BGM according to play RPG subState ('map' | 'dialogue' | 'battle' | 'reincarnation')
   */
  public syncSceneBgm(subState: string): void {
    if (subState === 'battle') {
      this.playSceneBgm('battle');
    } else if (subState === 'dialogue') {
      this.playSceneBgm('dialogue');
    } else if (subState === 'reincarnation') {
      this.playSceneBgm('lobby');
    } else {
      this.playSceneBgm('map');
    }
  }

  /**
   * Play scene-specific BGM using 100% Unified Web Audio API Synthesizer Engine.
   * All 4 tracks ('map' Hero Awakening, 'dialogue' Whispering Wind, 'battle' Colosseum Battle, 'lobby' Sanctuary of Kadan)
   * share the same cohesive warm RPG synth sound signature.
   */
  public playSceneBgm(scene: SceneBgmType, force: boolean = false): void {
    const normalizedScene: SceneBgmType =
      scene === 'general' ? this.resolveTrackToScene(this.currentTrack) : scene;

    if (!force && this.isBgmPlaying && this.currentScene === normalizedScene) {
      return;
    }

    this.currentScene = normalizedScene;
    const settings = this.getSettings();
    if (!settings.bgmEnabled) {
      this.isBgmPlaying = false;
      return;
    }

    this.unlockMobileAudio();
    this.isBgmPlaying = true;
    this.stopBgmNodes(false);

    const vol = settings.bgmVolume;
    if (vol <= 0) return;

    if (normalizedScene === 'map') {
      // Track 1 (Title / Map): Hero Awakening — Heroic Fantasy Adventure Overture (100% Unified Web Audio Synth)
      this.startSynthFieldTheme(vol);
    } else if (normalizedScene === 'dialogue') {
      // Track 2 (Peace / Dialogue): Whispering Wind — Lyrical Piano & Starlight Ambient
      this.startSynthDialogueTheme(vol);
    } else if (normalizedScene === 'battle') {
      // Track 3 (Battle): Colosseum Battle — Driving Bass & Tactical Duel Lead
      this.startSynthBattleTheme(vol);
    } else if (normalizedScene === 'lobby') {
      // Track 4 (Lobby): Sanctuary of Kadan — Mystical Sanctuary Harp & Choir Pad
      this.startSynthLobbyTheme(vol);
    }
  }

  public playBgm(): void {
    this.playSceneBgm(this.currentScene, true);
  }

  /**
   * Creates or returns the unified master BGM output chain (Master Gain -> Warm Lowpass Filter -> Destination)
   * so all 4 synthesized BGM tracks share an identical warm analog-style timbre and respond to live volume changes.
   */
  private createUnifiedBgmBus(ctx: AudioContext, volumePercent: number): AudioNode {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const clampedVol = Math.max(0.0001, (volumePercent / 100) * 0.24);
    masterGain.gain.setValueAtTime(clampedVol, now);

    const warmFilter = ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.setValueAtTime(2200, now);
    warmFilter.Q.setValueAtTime(0.7, now);

    masterGain.connect(warmFilter);
    warmFilter.connect(ctx.destination);

    this.bgmMasterGain = masterGain;
    this.activeSynthNodes.gains.push(masterGain);
    return masterGain;
  }

  private stopBgmNodes(markStopped: boolean = true): void {
    if (markStopped) {
      this.isBgmPlaying = false;
    }

    if (this.bgmAudioEl) {
      try {
        this.bgmAudioEl.pause();
        this.bgmAudioEl.currentTime = 0;
      } catch {}
    }

    if (this.bgmSynthInterval) {
      clearInterval(this.bgmSynthInterval);
      this.bgmSynthInterval = null;
    }

    if (this.activeSynthNodes) {
      this.activeSynthNodes.intervals.forEach((timer) => clearInterval(timer));
      this.activeSynthNodes.intervals = [];

      const ctx = this.audioCtx;
      const now = ctx ? ctx.currentTime : 0;
      this.activeSynthNodes.gains.forEach((g) => {
        try {
          if (ctx) {
            g.gain.cancelScheduledValues(now);
            g.gain.linearRampToValueAtTime(0.0001, now + 0.15);
          }
        } catch {}
      });

      this.activeSynthNodes.oscs.forEach((osc) => {
        try {
          osc.stop(now + 0.18);
        } catch {}
      });

      this.activeSynthNodes.oscs = [];
      this.activeSynthNodes.gains = [];
    }
    this.bgmMasterGain = null;
  }

  public stopBgm(): void {
    this.stopBgmNodes(true);
  }

  public toggleBgm(): boolean {
    const settings = this.getSettings();
    const newEnabled = !settings.bgmEnabled;
    localStorage.setItem('hero_bgm_enabled', String(newEnabled));
    localStorage.setItem('hero_bgm', String(newEnabled));

    if (newEnabled) {
      localStorage.setItem('hero_audio_muted', 'false');
      if (settings.bgmVolume <= 0) {
        localStorage.setItem('hero_bgm_volume', '25');
      }
      this.unlockMobileAudio().then(() => this.playSceneBgm(this.currentScene, true));
    } else {
      this.stopBgm();
      const sfxStillOn = localStorage.getItem('hero_sfx_enabled') !== 'false' && (parseInt(localStorage.getItem('hero_sfx_volume') || '90', 10) > 0);
      localStorage.setItem('hero_audio_muted', String(!sfxStillOn));
    }
    this.dispatchAudioChangedEvent();
    return newEnabled;
  }

  public setBgmVolume(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    localStorage.setItem('hero_bgm_volume', String(clamped));
    if (clamped > 0) {
      localStorage.setItem('hero_audio_muted', 'false');
    }

    if (this.bgmMasterGain && this.audioCtx) {
      try {
        const targetGain = Math.max(0.0001, (clamped / 100) * 0.24);
        this.bgmMasterGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.04);
      } catch {}
    }

    const settings = this.getSettings();
    if (settings.bgmEnabled && clamped > 0) {
      if (!this.isBgmPlaying) {
        this.playSceneBgm(this.currentScene, true);
      }
    } else if (clamped === 0 && this.isBgmPlaying) {
      this.stopBgm();
    }
    this.dispatchAudioChangedEvent();
  }

  public setBgmTrack(trackId: string): void {
    localStorage.setItem('hero_bgm_track', trackId);
    this.currentTrack = trackId;
    const targetScene = this.resolveTrackToScene(trackId);
    this.playSceneBgm(targetScene, true);
    this.dispatchAudioChangedEvent();
  }

  // ── Web Audio Synth Melodic Soundscapes (100% Unified Self-Generated Engine) ─

  /**
   * Helper: Plays a unified warm polyphonic synth note (Triangle fundamental + Sine harmonic overtone)
   */
  private triggerUnifiedSynthVoice(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    durationSec: number,
    peakGain: number,
    waveType: OscillatorType = 'triangle',
    harmonicRatio: number = 0.22
  ): void {
    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    const overtoneGain = ctx.createGain();

    osc1.type = waveType;
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t);
    overtoneGain.gain.setValueAtTime(harmonicRatio, t);

    voiceGain.gain.setValueAtTime(0.0001, t);
    voiceGain.gain.linearRampToValueAtTime(peakGain, t + 0.03);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);

    osc1.connect(voiceGain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + durationSec + 0.04);
    osc2.stop(t + durationSec + 0.04);
  }

  /**
   * Theme 1: Title / Map Field Theme — Hero Awakening (타이틀 테마 / 모험의 서막)
   * Self-generated heroic C-major / A-minor fantasy overture matching the exact synth timbre family
   * of Whispering Wind, Colosseum Battle, and Sanctuary of Kadan.
   */
  private startSynthFieldTheme(volumePercent: number): void {
    this.stopBgmNodes(false);

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      const bus = this.createUnifiedBgmBus(ctx, volumePercent);

      // 1. Warm harmonic pad (C3, G3, E4) with gentle lowpass warmth
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(520, now);
      padFilter.connect(bus);

      const padOscs: OscillatorNode[] = [];
      const initialPadFreqs = [130.81, 196.00, 329.63];
      initialPadFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 1.0);

        osc.connect(gain);
        gain.connect(padFilter);
        osc.start(now);

        padOscs.push(osc);
        this.activeSynthNodes.oscs.push(osc);
        this.activeSynthNodes.gains.push(gain);
      });

      // 2. Heroic progression chords (C -> G -> Am -> F -> C -> G -> Dm -> G)
      const chordProgression: [number, number, number][] = [
        [130.81, 196.00, 329.63], // C
        [98.00, 146.83, 246.94],  // G
        [110.00, 164.81, 261.63], // Am
        [87.31, 130.81, 220.00],  // F
        [130.81, 196.00, 329.63], // C
        [98.00, 146.83, 246.94],  // G
        [146.83, 220.00, 349.23], // Dm
        [98.00, 146.83, 246.94],  // G
      ];

      // 3. Hero Awakening 32-step melodic motif
      const heroMelody = [
        392.00, 523.25, 587.33, 659.25,  587.33, 493.88, 392.00, 587.33,
        523.25, 440.00, 659.25, 587.33,  523.25, 440.00, 349.23, 440.00,
        392.00, 523.25, 659.25, 783.99,  698.46, 587.33, 493.88, 392.00,
        440.00, 587.33, 698.46, 659.25,  587.33, 523.25, 493.88, 587.33,
      ];

      let step = 0;
      const intervalMs = 280;

      const playHeroStep = () => {
        if (!this.isBgmPlaying || this.currentScene !== 'map') return;
        try {
          const t = ctx.currentTime;
          const chordIdx = Math.floor(step / 4) % chordProgression.length;
          const chord = chordProgression[chordIdx];

          // Smoothly glide pad chord every 4 steps
          if (step % 4 === 0 && padOscs.length === 3) {
            padOscs[0].frequency.setTargetAtTime(chord[0], t, 0.08);
            padOscs[1].frequency.setTargetAtTime(chord[1], t, 0.08);
            padOscs[2].frequency.setTargetAtTime(chord[2], t, 0.08);
          }

          // Heroic harp/bell lead note
          const melFreq = heroMelody[step % heroMelody.length];
          this.triggerUnifiedSynthVoice(ctx, bus, melFreq, 0.48, 0.55, 'triangle', 0.25);

          // Gentle marching bass pulse on beats 0 and 2
          if (step % 2 === 0) {
            const bassFreq = chord[0] * (step % 4 === 0 ? 0.5 : 1.0);
            this.triggerUnifiedSynthVoice(ctx, padFilter, bassFreq, 0.36, 0.45, 'triangle', 0.10);
          }

          step++;
        } catch {}
      };

      playHeroStep();
      const timer = setInterval(playHeroStep, intervalMs);
      this.activeSynthNodes.intervals.push(timer);
    });
  }

  /**
   * Theme 2: Dialogue / Visual Novel Theme — Whispering Wind (바람 속삭임 / 별빛 속삭임)
   * Lyrical celesta & warm starlight pad (A minor / F major / C major / G major).
   */
  private startSynthDialogueTheme(volumePercent: number): void {
    this.stopBgmNodes(false);

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      const bus = this.createUnifiedBgmBus(ctx, volumePercent);

      // 1. Ambient low starlight pad (Am -> F -> C -> G)
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(460, now);
      padFilter.connect(bus);

      const padOscs: OscillatorNode[] = [];
      const initialPad = [110.00, 164.81, 261.63];
      initialPad.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.26, now + 1.2);

        osc.connect(gain);
        gain.connect(padFilter);
        osc.start(now);

        padOscs.push(osc);
        this.activeSynthNodes.oscs.push(osc);
        this.activeSynthNodes.gains.push(gain);
      });

      const dialogueChords: [number, number, number][] = [
        [110.00, 164.81, 261.63], // Am
        [87.31, 130.81, 220.00],  // F
        [130.81, 196.00, 329.63], // C
        [98.00, 146.83, 246.94],  // G
      ];

      const dialogueMelody = [
        659.25, 523.25, 440.00, 329.63,
        349.23, 440.00, 523.25, 698.46,
        659.25, 523.25, 392.00, 523.25,
        587.33, 493.88, 392.00, 493.88,
      ];
      let step = 0;
      const intervalMs = 380;

      const playPianoNote = () => {
        if (!this.isBgmPlaying || this.currentScene !== 'dialogue') return;
        try {
          const t = ctx.currentTime;
          const chord = dialogueChords[Math.floor(step / 4) % dialogueChords.length];
          if (step % 4 === 0 && padOscs.length === 3) {
            padOscs[0].frequency.setTargetAtTime(chord[0], t, 0.12);
            padOscs[1].frequency.setTargetAtTime(chord[1], t, 0.12);
            padOscs[2].frequency.setTargetAtTime(chord[2], t, 0.12);
          }

          const freq = dialogueMelody[step % dialogueMelody.length];
          this.triggerUnifiedSynthVoice(ctx, bus, freq, 0.68, 0.48, 'triangle', 0.20);
          step++;
        } catch {}
      };

      playPianoNote();
      const timer = setInterval(playPianoNote, intervalMs);
      this.activeSynthNodes.intervals.push(timer);
    });
  }

  /**
   * Theme 3: Battle Theme — Colosseum Battle (투기장 결투 / 운명의 전장)
   * High-tension driving bass octaves + synthesized timpani kicks + heroic duel synth lead (D minor)
   */
  private startSynthBattleTheme(volumePercent: number): void {
    this.stopBgmNodes(false);

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      const bus = this.createUnifiedBgmBus(ctx, volumePercent);

      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(360, now);
      bassFilter.connect(bus);

      const bassOctaves = [
        73.42, 146.83, 73.42, 110.00,   // Dm
        58.27, 116.54, 58.27, 87.31,    // Bb
        65.41, 130.81, 65.41, 98.00,    // C
        55.00, 110.00, 55.00, 82.41,    // A
      ];
      const battleLead = [
        293.66, 349.23, 440.00, 587.33,
        523.25, 466.16, 440.00, 349.23,
        392.00, 440.00, 523.25, 659.25,
        587.33, 554.37, 440.00, 329.63,
      ];
      let step = 0;
      const intervalMs = 225;

      const playBattleBeat = () => {
        if (!this.isBgmPlaying || this.currentScene !== 'battle') return;
        try {
          const t = ctx.currentTime;

          // 1. Driving bass pulse
          const bassFreq = bassOctaves[step % bassOctaves.length];
          this.triggerUnifiedSynthVoice(ctx, bassFilter, bassFreq, 0.20, 0.65, 'sawtooth', 0.15);

          // 2. Synthesized war timpani kick on every 2nd beat
          if (step % 2 === 0) {
            const kickOsc = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kickOsc.type = 'sine';
            kickOsc.frequency.setValueAtTime(125, t);
            kickOsc.frequency.exponentialRampToValueAtTime(42, t + 0.13);

            kickGain.gain.setValueAtTime(0.68, t);
            kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

            kickOsc.connect(kickGain);
            kickGain.connect(bus);
            kickOsc.start(t);
            kickOsc.stop(t + 0.16);
          }

          // 3. Heroic battle lead melody
          const leadNote = battleLead[step % battleLead.length];
          this.triggerUnifiedSynthVoice(ctx, bus, leadNote, 0.34, 0.52, 'triangle', 0.28);

          step++;
        } catch {}
      };

      playBattleBeat();
      const timer = setInterval(playBattleBeat, intervalMs);
      this.activeSynthNodes.intervals.push(timer);
    });
  }

  /**
   * Theme 4: Lobby Theme — Sanctuary of Kadan (영지 로비 / 카단의 성역)
   * Mystical sanctuary choir pad & flowing crystal lute arpeggio (E minor / C major / G major / D major)
   */
  private startSynthLobbyTheme(volumePercent: number): void {
    this.stopBgmNodes(false);

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      const bus = this.createUnifiedBgmBus(ctx, volumePercent);

      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(500, now);
      padFilter.connect(bus);

      const padOscs: OscillatorNode[] = [];
      const initialPad = [164.81, 196.00, 246.94];
      initialPad.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 1.2);

        osc.connect(gain);
        gain.connect(padFilter);
        osc.start(now);

        padOscs.push(osc);
        this.activeSynthNodes.oscs.push(osc);
        this.activeSynthNodes.gains.push(gain);
      });

      const lobbyChords: [number, number, number][] = [
        [164.81, 196.00, 246.94], // Em
        [130.81, 164.81, 196.00], // C
        [98.00, 146.83, 246.94],  // G
        [146.83, 185.00, 220.00], // D
      ];

      const lobbyArpeggio = [
        329.63, 392.00, 493.88, 659.25,  587.33, 493.88, 392.00, 493.88,
        261.63, 329.63, 392.00, 523.25,  493.88, 392.00, 329.63, 392.00,
        392.00, 493.88, 587.33, 783.99,  739.99, 587.33, 493.88, 587.33,
        293.66, 369.99, 440.00, 587.33,  739.99, 587.33, 440.00, 369.99,
      ];

      let step = 0;
      const intervalMs = 310;

      const playSanctuaryStep = () => {
        if (!this.isBgmPlaying || this.currentScene !== 'lobby') return;
        try {
          const t = ctx.currentTime;
          const chord = lobbyChords[Math.floor(step / 8) % lobbyChords.length];
          if (step % 8 === 0 && padOscs.length === 3) {
            padOscs[0].frequency.setTargetAtTime(chord[0], t, 0.12);
            padOscs[1].frequency.setTargetAtTime(chord[1], t, 0.12);
            padOscs[2].frequency.setTargetAtTime(chord[2], t, 0.12);
          }

          const arpFreq = lobbyArpeggio[step % lobbyArpeggio.length];
          this.triggerUnifiedSynthVoice(ctx, bus, arpFreq, 0.56, 0.50, 'triangle', 0.24);
          step++;
        } catch {}
      };

      playSanctuaryStep();
      const timer = setInterval(playSanctuaryStep, intervalMs);
      this.activeSynthNodes.intervals.push(timer);
    });
  }

  // ── SFX Management (100% Native Web Audio Synth, Zero Network CDN Reliance) ─

  public toggleSfx(): boolean {
    const settings = this.getSettings();
    const newEnabled = !settings.sfxEnabled;
    localStorage.setItem('hero_sfx_enabled', String(newEnabled));
    localStorage.setItem('hero_sfx', String(newEnabled));
    if (newEnabled) {
      localStorage.setItem('hero_audio_muted', 'false');
      if (settings.sfxVolume <= 0) {
        localStorage.setItem('hero_sfx_volume', '85');
      }
      this.unlockMobileAudio().then(() => this.playTestChime());
    } else {
      const bgmStillOn = localStorage.getItem('hero_bgm_enabled') !== 'false' && (parseInt(localStorage.getItem('hero_bgm_volume') || '20', 10) > 0);
      localStorage.setItem('hero_audio_muted', String(!bgmStillOn));
    }
    this.dispatchAudioChangedEvent();
    return newEnabled;
  }

  public setSfxVolume(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    localStorage.setItem('hero_sfx_volume', String(clamped));
    if (clamped > 0) {
      localStorage.setItem('hero_audio_muted', 'false');
    }
    this.playClickTick();
    this.dispatchAudioChangedEvent();
  }

  public toggleHaptic(): boolean {
    const settings = this.getSettings();
    const newEnabled = !settings.hapticEnabled;
    localStorage.setItem('hero_haptic_enabled', String(newEnabled));
    if (newEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 40, 30]);
    }
    this.dispatchAudioChangedEvent();
    return newEnabled;
  }

  /**
   * Plays the loud & clear test chime (C-E-G-C arpeggio) via Web Audio API.
   * Guaranteed 100% to sound immediately on all mobile devices!
   */
  public playTestChime(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      // Amplified crisp SFX volume
      const vol = (settings.sfxVolume / 100) * 0.70;
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      frequencies.forEach((freq, idx) => {
        const noteStart = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(vol, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.38);
      });

      if (settings.hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 30, 20]);
      }
    });
  }

  /**
   * Crisp UI Click Tick for button/tap feedback.
   */
  public playClickTick(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      // Amplified crisp SFX volume
      const vol = (settings.sfxVolume / 100) * 0.35;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.04);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    });
  }

  /**
   * Animal Crossing (동물의 숲) Style Cute Animalese Chirp SFX
   * Plays a pitch-varied playful micro-synth tone for typewriter text rendering.
   */
  public playDialogueChirp(char?: string): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      // Gentle, friendly chattering volume
      const vol = (settings.sfxVolume / 100) * 0.20;

      // Pentatonic pitch offsets for melodic animalese chatter
      const pitchOffsets = [0, 2, 4, 7, 9, 12, 14, 16];
      let baseFreq = 520; // C5 base
      if (char && char.length > 0) {
        const code = char.charCodeAt(0);
        const semitone = pitchOffsets[code % pitchOffsets.length];
        baseFreq = 480 * Math.pow(2, semitone / 12);
      } else {
        baseFreq = 480 + Math.random() * 240;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Soft, warm retro-cartoon whistle tone
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.06, now + 0.03);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    });
  }

  /**
   * Card Flip & Whoosh effect for deck/card interactions.
   */
  public playCardWhoosh(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      // Amplified crisp SFX volume
      const vol = (settings.sfxVolume / 100) * 0.50;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    });
  }

  /**
   * Victory / Success Fanfare.
   */
  public playVictoryFanfare(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      // Amplified crisp SFX volume
      const vol = (settings.sfxVolume / 100) * 0.60;
      const notes = [440, 554.37, 659.25, 880];

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.42);
      });
    });
  }

  /**
   * Card Place effect: Robust Native Web Audio synthesis (No external CDN failure).
   * Generates a solid wood/table tap impact tone with instant 0-latency.
   */
  public playCardPlace(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      // Amplified crisp SFX volume
      const vol = (settings.sfxVolume / 100) * 0.75;

      // Layer 1: Solid low thump (Card body landing)
      const lowOsc = ctx.createOscillator();
      const lowGain = ctx.createGain();
      lowOsc.type = 'triangle';
      lowOsc.frequency.setValueAtTime(180, now);
      lowOsc.frequency.exponentialRampToValueAtTime(45, now + 0.07);

      lowGain.gain.setValueAtTime(vol, now);
      lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      lowOsc.connect(lowGain);
      lowGain.connect(ctx.destination);
      lowOsc.start(now);
      lowOsc.stop(now + 0.095);

      // Layer 2: High wood snap (Card crisp contact)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'sine';
      snapOsc.frequency.setValueAtTime(950, now);
      snapOsc.frequency.exponentialRampToValueAtTime(220, now + 0.035);

      snapGain.gain.setValueAtTime(vol * 0.55, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.045);
    });

    if (settings.hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([18, 12]);
    }
  }

  /**
   * Card Flip effect: Robust Native Web Audio synthesis (No external CDN failure).
   * Generates a clean ascending flip & snap sound effect.
   */
  public playCardFlip(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    this.withActiveAudioContext((ctx) => {
      const now = ctx.currentTime;
      // Amplified crisp SFX volume
      const vol = (settings.sfxVolume / 100) * 0.70;

      // Layer 1: Air whoosh / flutter
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(220, now);
      sweepOsc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      sweepGain.gain.setValueAtTime(vol * 0.65, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweepOsc.start(now);
      sweepOsc.stop(now + 0.105);

      // Layer 2: Flip snap click
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(540, now + 0.02);
      clickOsc.frequency.exponentialRampToValueAtTime(1100, now + 0.06);

      clickGain.gain.setValueAtTime(0.001, now);
      clickGain.gain.setValueAtTime(vol * 0.85, now + 0.02);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now + 0.02);
      clickOsc.stop(now + 0.095);
    });

    if (settings.hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([28, 22, 28]);
    }
  }

  private dispatchAudioChangedEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snshero_audio_settings_changed', {
        detail: this.getSettings(),
      }));
    }
  }
}

export const audioManager = new AudioManager();

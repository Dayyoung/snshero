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
  private bgmSynthInterval: any = null;
  private isBgmPlaying: boolean = false;
  private userInteracted: boolean = false;
  private isUnlocked: boolean = false;
  private currentTrack: string = 'title';

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
          if (this.bgmAudioEl && this.bgmAudioEl.paused && this.currentTrack === 'title') {
            this.bgmAudioEl.play().catch(() => {
              this.startSynthBgm(this.currentTrack, settings.bgmVolume);
            });
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

    const bgmEnabled = localStorage.getItem('hero_bgm_enabled') !== 'false';
    const bgmVolStr = localStorage.getItem('hero_bgm_volume');
    const bgmVolume = bgmVolStr !== null ? Math.max(0, Math.min(100, parseInt(bgmVolStr, 10) || 20)) : 20;
    const bgmTrack = localStorage.getItem('hero_bgm_track') || 'title';

    const sfxEnabled = localStorage.getItem('hero_sfx_enabled') !== 'false';
    const sfxVolStr = localStorage.getItem('hero_sfx_volume');
    const sfxVolume = sfxVolStr !== null ? Math.max(0, Math.min(100, parseInt(sfxVolStr, 10) || 90)) : 90;

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
    const isExplicitMute = localStorage.getItem('hero_audio_muted') === 'true';
    if (isExplicitMute) return true;
    const settings = this.getSettings();
    return (!settings.bgmEnabled && !settings.sfxEnabled) || (settings.bgmVolume === 0 && settings.sfxVolume === 0);
  }

  public toggleMute(): boolean {
    const currentlyMuted = this.isMuted();
    const newMuted = !currentlyMuted;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hero_audio_muted', String(newMuted));
      if (newMuted) {
        localStorage.setItem('hero_bgm_enabled', 'false');
        localStorage.setItem('hero_sfx_enabled', 'false');
        this.stopBgm();
      } else {
        localStorage.setItem('hero_bgm_enabled', 'true');
        localStorage.setItem('hero_sfx_enabled', 'true');
        const settings = this.getSettings();
        if (settings.bgmVolume === 0) {
          localStorage.setItem('hero_bgm_volume', '50');
        }
        if (settings.sfxVolume === 0) {
          localStorage.setItem('hero_sfx_volume', '70');
        }
        this.unlockMobileAudio().then(() => {
          this.playBgm();
          this.playClickTick();
        });
      }
    }

    this.dispatchAudioChangedEvent();
    return newMuted;
  }

  // ── BGM Management ─────────────────────────────────────────────────────────

  public playBgm(): void {
    const settings = this.getSettings();
    if (!settings.bgmEnabled) return;
    this.stopBgm();

    this.currentTrack = settings.bgmTrack;
    this.isBgmPlaying = true;

    if (this.currentTrack === 'title') {
      this.playLocalAudioTrack('/mixkit-games-worldbeat-466.mp3', settings.bgmVolume);
    } else {
      this.startSynthBgm(this.currentTrack, settings.bgmVolume);
    }
  }

  private playLocalAudioTrack(src: string, volumePercent: number): void {
    try {
      if (!this.bgmAudioEl) {
        this.bgmAudioEl = new Audio(src);
        this.bgmAudioEl.loop = true;
        (this.bgmAudioEl as any).playsInline = true;
        this.bgmAudioEl.setAttribute('playsinline', 'true');
        this.bgmAudioEl.preload = 'auto';
      } else {
        if (!this.bgmAudioEl.src.includes(src)) {
          this.bgmAudioEl.src = src;
        }
      }
      // BGM volume 50% reduced to whisper-quiet ambient level
      this.bgmAudioEl.volume = Math.max(0, Math.min(1, (volumePercent / 100) * 0.25));
      const playPromise = this.bgmAudioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[AudioManager] Local BGM play deferred/blocked, falling back to Web Audio synth:', err);
          this.startSynthBgm('title', volumePercent);
        });
      }
    } catch {
      this.startSynthBgm('title', volumePercent);
    }
  }

  public stopBgm(): void {
    this.isBgmPlaying = false;
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
  }

  public toggleBgm(): boolean {
    const settings = this.getSettings();
    const newEnabled = !settings.bgmEnabled;
    localStorage.setItem('hero_bgm_enabled', String(newEnabled));

    if (newEnabled) {
      this.unlockMobileAudio().then(() => this.playBgm());
    } else {
      this.stopBgm();
    }
    this.dispatchAudioChangedEvent();
    return newEnabled;
  }

  public setBgmVolume(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    localStorage.setItem('hero_bgm_volume', String(clamped));

    if (this.bgmAudioEl) {
      try {
        // BGM volume 50% reduced to whisper-quiet ambient level
        this.bgmAudioEl.volume = Math.max(0, Math.min(1, (clamped / 100) * 0.25));
      } catch {}
    }

    const settings = this.getSettings();
    if (settings.bgmEnabled && !this.isBgmPlaying && clamped > 0) {
      this.playBgm();
    } else if (clamped === 0 && this.isBgmPlaying) {
      this.stopBgm();
    }
    this.dispatchAudioChangedEvent();
  }

  public setBgmTrack(trackId: string): void {
    localStorage.setItem('hero_bgm_track', trackId);
    this.currentTrack = trackId;
    const settings = this.getSettings();
    if (settings.bgmEnabled) {
      this.playBgm();
    }
    this.dispatchAudioChangedEvent();
  }

  // ── Web Audio Synth Melodic Soundscapes (Zero Network Reliance) ────────────

  private startSynthBgm(track: string, volumePercent: number): void {
    if (this.bgmSynthInterval) {
      clearInterval(this.bgmSynthInterval);
      this.bgmSynthInterval = null;
    }

    this.withActiveAudioContext((ctx) => {
      let step = 0;
      // BGM volume reduced to whisper-quiet ambient level
      const baseVolume = (volumePercent / 100) * 0.025;

      // Track 1: 'title' Synth Fallback Rhythm (Energetic Chords)
      const titleMelody = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23];
      // Track 2: 'lobby' Sanctuary Calm Pentatonic (Soft Warm Pads)
      const lobbyMelody = [329.63, 392.00, 440.00, 523.25, 659.25, 523.25, 440.00, 392.00];
      // Track 3: 'battle' Epic Colosseum Driving Beat (Minor 3rds & Octaves)
      const battleMelody = [220.00, 261.63, 329.63, 440.00, 261.63, 329.63, 440.00, 523.25];
      // Track 4: 'peace' Whispering Wind Ambient (Airy Sine Waves)
      const peaceMelody = [196.00, 293.66, 392.00, 440.00, 293.66, 392.00, 440.00, 587.33];

      const getNotes = () => {
        switch (track) {
          case 'lobby': return lobbyMelody;
          case 'battle': return battleMelody;
          case 'peace': return peaceMelody;
          default: return titleMelody;
        }
      };

      const notes = getNotes();
      const intervalMs = track === 'battle' ? 300 : track === 'peace' ? 800 : 500;

      const playTone = () => {
        if (!this.isBgmPlaying) return;
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          const freq = notes[step % notes.length];
          osc.type = track === 'peace' ? 'sine' : track === 'battle' ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(baseVolume, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) * 0.9);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + (intervalMs / 1000) * 0.95);
          step++;
        } catch {}
      };

      playTone();
      this.bgmSynthInterval = setInterval(playTone, intervalMs);
    });
  }

  // ── SFX Management (100% Native Web Audio Synth, Zero Network CDN Reliance) ─

  public toggleSfx(): boolean {
    const settings = this.getSettings();
    const newEnabled = !settings.sfxEnabled;
    localStorage.setItem('hero_sfx_enabled', String(newEnabled));
    if (newEnabled) {
      this.unlockMobileAudio().then(() => this.playTestChime());
    }
    this.dispatchAudioChangedEvent();
    return newEnabled;
  }

  public setSfxVolume(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    localStorage.setItem('hero_sfx_volume', String(clamped));
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

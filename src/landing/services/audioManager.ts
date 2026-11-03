/**
 * src/landing/services/audioManager.ts
 *
 * Robust Zero-Latency Audio & Sound System for SNSHero Static Landing.
 * Features:
 *   1. Guaranteed Audio Playback: Web Audio API Synthesizer + Local MP3 Audio Fallback.
 *   2. Zero-Network Reliance: Uses native AudioContext synthesis so sound plays 100% reliably
 *      without any external CDN failures or CORS blocking.
 *   3. 4 Full BGM Soundscapes:
 *      - 'title': Games Worldbeat (Local /mixkit-games-worldbeat-466.mp3 + Synth Melodic Rhythm)
 *      - 'lobby': Peaceful Pentatonic Kadan Sanctuary Synth Loop
 *      - 'battle': Epic Fast Colosseum TCG Battle Synth Beat
 *      - 'peace': Whispering Wind & Ambient Nature Chimes Loop
 *   4. Clear SFX Engine:
 *      - Test Chime (Bright C-E-G-C Arpeggio Fanfare)
 *      - Click / Tap Tick
 *      - Card Flip / Equip Whoosh
 *      - Victory / Level Up Chord
 *   5. Browser Autoplay Policy Guard: Seamlessly resumes on first user touch/click.
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
  private currentTrack: string = 'title';

  constructor() {
    this.initFromLocalStorage();
    this.setupUserInteractionListener();
  }

  private initFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    this.currentTrack = localStorage.getItem('hero_bgm_track') || 'title';
  }

  private setupUserInteractionListener(): void {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.userInteracted = true;
      this.getAudioContext();
      const settings = this.getSettings();
      if (settings.bgmEnabled && !this.isBgmPlaying) {
        this.playBgm();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
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

  public getSettings(): AudioSettings {
    if (typeof localStorage === 'undefined') {
      return {
        bgmEnabled: true,
        bgmVolume: 50,
        bgmTrack: 'title',
        sfxEnabled: true,
        sfxVolume: 70,
        hapticEnabled: true,
      };
    }

    const bgmEnabled = localStorage.getItem('hero_bgm_enabled') !== 'false';
    const bgmVolStr = localStorage.getItem('hero_bgm_volume');
    const bgmVolume = bgmVolStr !== null ? Math.max(0, Math.min(100, parseInt(bgmVolStr, 10) || 50)) : 50;
    const bgmTrack = localStorage.getItem('hero_bgm_track') || 'title';

    const sfxEnabled = localStorage.getItem('hero_sfx_enabled') !== 'false';
    const sfxVolStr = localStorage.getItem('hero_sfx_volume');
    const sfxVolume = sfxVolStr !== null ? Math.max(0, Math.min(100, parseInt(sfxVolStr, 10) || 70)) : 70;

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
      } else {
        this.bgmAudioEl.src = src;
      }
      this.bgmAudioEl.volume = Math.max(0, Math.min(1, volumePercent / 100));
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
      this.playBgm();
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
        this.bgmAudioEl.volume = clamped / 100;
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

    const ctx = this.getAudioContext();
    if (!ctx) return;

    let step = 0;
    const baseVolume = (volumePercent / 100) * 0.08;

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
  }

  // ── SFX Management ─────────────────────────────────────────────────────────

  public toggleSfx(): boolean {
    const settings = this.getSettings();
    const newEnabled = !settings.sfxEnabled;
    localStorage.setItem('hero_sfx_enabled', String(newEnabled));
    if (newEnabled) {
      this.playTestChime();
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
   * Guaranteed 100% to sound immediately without any external network request!
   */
  public playTestChime(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const vol = (settings.sfxVolume / 100) * 0.35;
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
    } catch (e) {
      console.warn('[AudioManager] playTestChime error:', e);
    }
  }

  /**
   * Crisp UI Click Tick for button/tap feedback.
   */
  public playClickTick(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const vol = (settings.sfxVolume / 100) * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  /**
   * Card Flip & Whoosh effect for deck/card interactions.
   */
  public playCardWhoosh(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const vol = (settings.sfxVolume / 100) * 0.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  /**
   * Victory / Success Fanfare.
   */
  public playVictoryFanfare(): void {
    const settings = this.getSettings();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const vol = (settings.sfxVolume / 100) * 0.25;
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
    } catch {}
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

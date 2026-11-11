import { CLASSIC_HEROES, HeroClass } from './types';

const SETTINGS_KEY = 'hero_hs_settings';
const CALM_BGM_MIGRATION_KEY = 'hero_hs_calm_bgm_15_v1';

export interface AudioSettings {
  bgmVolume: number;
  sfxVolume: number;
  voVolume: number;
  muted: boolean;
  vibrateEnabled: boolean;
}

export type AttackVibrationKind =
  | 'LIGHT_HIT'
  | 'NORMAL_ATTACK'
  | 'HERO_HIT'
  | 'HEAVY_ATTACK'
  | 'HERO_FINISHER';

export interface VibrationSupportInfo {
  isAndroid: boolean;
  webVibrationApi: boolean;
  supportedOnDevice: boolean;
}

const DEFAULT_AUDIO: AudioSettings = {
  bgmVolume: 0.15,
  sfxVolume: 0.72,
  voVolume: 0.88,
  muted: false,
  vibrateEnabled: true,
};

const VIBRATION_SPECS: Record<
  AttackVibrationKind,
  { strength: number; pattern: number | number[]; durationMs: number }
> = {
  LIGHT_HIT: { strength: 1, pattern: 26, durationMs: 32 },
  NORMAL_ATTACK: { strength: 2, pattern: 42, durationMs: 52 },
  HERO_HIT: { strength: 3, pattern: [36, 22, 48], durationMs: 115 },
  HEAVY_ATTACK: { strength: 4, pattern: [52, 28, 78], durationMs: 170 },
  HERO_FINISHER: { strength: 5, pattern: [65, 35, 95, 40, 125], durationMs: 375 },
};

class SnsHeroCardAudioEngine {
  private settings: AudioSettings = DEFAULT_AUDIO;
  private currentBgm: HTMLAudioElement | null = null;
  private currentBgmKey: string | null = null;
  private currentVo: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private activeVibrateUntil = 0;
  private activeVibrateStrength = 0;

  constructor() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        this.settings = { ...DEFAULT_AUDIO, ...JSON.parse(raw) };
      }
      if (!localStorage.getItem(CALM_BGM_MIGRATION_KEY)) {
        this.settings.bgmVolume = 0.15;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
        localStorage.setItem(CALM_BGM_MIGRATION_KEY, '1');
      }
    } catch {
      // ignore storage errors
    }

    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlocked = true;
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.currentBgm && !this.settings.muted && this.currentBgm.paused) {
          this.currentBgm.play().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  getVibrationSupportInfo(): VibrationSupportInfo {
    if (typeof navigator === 'undefined') {
      return { isAndroid: false, webVibrationApi: false, supportedOnDevice: false };
    }
    const ua = navigator.userAgent || '';
    const uaPlatform =
      (
        navigator as Navigator & {
          userAgentData?: { platform?: string };
        }
      ).userAgentData?.platform?.toLowerCase() || '';
    // Covers Android Chrome/Samsung Internet/WebView + Android Chrome "Request Desktop Site" (Linux + multi-touch)
    const isAndroid =
      /Android/i.test(ua) ||
      uaPlatform === 'android' ||
      (/Linux/i.test(ua) && (navigator.maxTouchPoints || 0) > 0);
    const webVibrationApi = typeof navigator.vibrate === 'function';
    return {
      isAndroid,
      webVibrationApi,
      supportedOnDevice: isAndroid && webVibrationApi,
    };
  }

  updateSettings(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore
    }
    if (patch.vibrateEnabled === false) {
      this.activeVibrateUntil = 0;
      this.activeVibrateStrength = 0;
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(0);
        }
      } catch {
        // ignore
      }
    }
    if (this.currentBgm) {
      this.currentBgm.volume = this.settings.muted ? 0 : this.settings.bgmVolume;
      if (this.settings.muted) {
        this.currentBgm.pause();
      } else if (this.unlocked && this.currentBgm.paused) {
        this.currentBgm.play().catch(() => {});
      }
    }
    if (this.currentVo && this.settings.muted) {
      this.currentVo.pause();
    }
  }

  private hasStickyUserActivation(): boolean {
    if (typeof navigator === 'undefined') return false;
    const navWithActivation = navigator as Navigator & {
      userActivation?: { hasBeenActive: boolean };
    };
    if (navWithActivation.userActivation) {
      return Boolean(navWithActivation.userActivation.hasBeenActive);
    }
    return this.unlocked;
  }

  /**
   * Android Web Vibration API (navigator.vibrate) attack haptic feedback
   * - Active only when `vibrateEnabled` is true in Settings and running on an Android browser supporting Web Vibration.
   * - Priority arbiter prevents weak secondary damage ticks from interrupting a heavier attack rumble.
   */
  vibrateAttack(kind: AttackVibrationKind): boolean {
    if (!this.settings.vibrateEnabled) return false;
    const support = this.getVibrationSupportInfo();
    if (!support.supportedOnDevice) return false;
    if (!this.hasStickyUserActivation()) return false;

    const spec = VIBRATION_SPECS[kind];
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now < this.activeVibrateUntil && spec.strength <= this.activeVibrateStrength) {
      return false;
    }

    try {
      const ok = navigator.vibrate(spec.pattern);
      if (ok) {
        this.activeVibrateStrength = spec.strength;
        this.activeVibrateUntil = now + spec.durationMs;
      }
      return ok;
    } catch {
      return false;
    }
  }

  previewVibration(): boolean {
    if (!this.settings.vibrateEnabled) return false;
    const support = this.getVibrationSupportInfo();
    if (!support.supportedOnDevice || !this.hasStickyUserActivation()) return false;
    try {
      return navigator.vibrate(28);
    } catch {
      return false;
    }
  }

  private getAudioCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playBgm(track: 'tavern_hub' | 'collection' | 'mulligan' | 'duel_1' | 'duel_2') {
    if (this.currentBgmKey === track && this.currentBgm) {
      if (!this.settings.muted && this.currentBgm.paused) {
        this.currentBgm.play().catch(() => {});
      }
      return;
    }
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.src = '';
      this.currentBgm = null;
    }
    this.currentBgmKey = track;
    const audio = new Audio(`/hs-assets/snshero-audio/bgm/${track}.mp3?v=calm1`);
    audio.loop = track !== 'mulligan';
    audio.volume = this.settings.muted ? 0 : this.settings.bgmVolume;
    this.currentBgm = audio;
    if (!this.settings.muted) {
      audio.play().catch(() => {});
    }
  }

  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm = null;
      this.currentBgmKey = null;
    }
  }

  playSfx(
    name:
      | 'box_open'
      | 'box_close'
      | 'box_disk_flip'
      | 'box_hover'
      | 'box_press'
      | 'box_tray_in'
      | 'box_tray_out'
      | 'ui_hover'
      | 'ui_click'
      | 'cm_select_hero'
      | 'cm_remove_card'
      | 'attack'
      | 'big_attack'
      | 'card_hover'
      | 'card_place'
      | 'card_flip'
      | 'crowd'
      | 'end_turn'
      | 'hero_power'
      | 'menu_press'
      | 'menu_select'
      | 'open_menu'
      | 'pack_open'
      | 'pack_rare'
      | 'pack_epic'
      | 'pack_legendary'
      | 'player_turn'
      | 'purchase'
      | 'victory'
      | 'whoosh',
    volumeScale = 1,
  ) {
    if (this.settings.muted || this.settings.sfxVolume <= 0) return;
    try {
      const a = new Audio(`/hs-assets/snshero-audio/sfx/${name}.mp3`);
      a.volume = Math.min(1, this.settings.sfxVolume * volumeScale);
      a.play().catch(() => {});
    } catch {
      // ignore
    }
  }

  /** Procedural WebAudio elemental & mechanical accents layered with foley SFX */
  playProceduralVfxSound(
    kind:
      | 'MANA_GAIN'
      | 'FIRE'
      | 'FROST'
      | 'LIGHTNING'
      | 'HOLY'
      | 'SHADOW'
      | 'DIVINE_BREAK'
      | 'SECRET_TRIGGER'
      | 'SILENCE'
      | 'ROPE_TICK'
      | 'ARMOR'
      | 'FATIGUE',
  ) {
    if (this.settings.muted || this.settings.sfxVolume <= 0) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = this.settings.sfxVolume * 0.35;
    master.connect(ctx.destination);

    const tone = (
      freqStart: number,
      freqEnd: number,
      dur: number,
      type: OscillatorType = 'sine',
      delay = 0,
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + delay + dur);
      g.gain.setValueAtTime(0.001, now + delay);
      g.gain.linearRampToValueAtTime(0.6, now + delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    };

    switch (kind) {
      case 'MANA_GAIN':
        tone(660, 1046, 0.22, 'triangle');
        tone(880, 1318, 0.25, 'sine', 0.05);
        break;
      case 'FIRE':
        tone(240, 55, 0.45, 'sawtooth');
        tone(420, 90, 0.32, 'triangle', 0.04);
        break;
      case 'FROST':
        tone(1400, 2400, 0.18, 'sine');
        tone(1900, 920, 0.28, 'triangle', 0.07);
        break;
      case 'LIGHTNING':
        tone(950, 110, 0.24, 'sawtooth');
        tone(1600, 220, 0.18, 'square', 0.05);
        break;
      case 'HOLY':
        tone(523.25, 783.99, 0.45, 'sine');
        tone(659.25, 1046.5, 0.5, 'triangle', 0.06);
        break;
      case 'SHADOW':
        tone(180, 65, 0.5, 'sawtooth');
        tone(270, 95, 0.45, 'sine', 0.04);
        break;
      case 'DIVINE_BREAK':
        tone(1800, 620, 0.24, 'triangle');
        tone(2400, 880, 0.2, 'sine', 0.04);
        break;
      case 'SECRET_TRIGGER':
        tone(440, 880, 0.25, 'triangle');
        tone(660, 1320, 0.35, 'sine', 0.12);
        break;
      case 'SILENCE':
        tone(720, 210, 0.34, 'sine');
        break;
      case 'ROPE_TICK':
        tone(310, 180, 0.08, 'triangle');
        break;
      case 'ARMOR':
        tone(320, 480, 0.16, 'triangle');
        break;
      case 'FATIGUE':
        tone(150, 52, 0.55, 'sawtooth');
        break;
    }
  }

  playVoFile(voKey: string): Promise<void> {
    if (this.settings.muted || this.settings.voVolume <= 0) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        if (this.currentVo) {
          this.currentVo.pause();
        }
        const a = new Audio(`/hs-assets/snshero-audio/vo/${voKey}.mp3`);
        a.volume = this.settings.voVolume;
        this.currentVo = a;
        a.onended = () => resolve();
        a.onerror = () => resolve();
        a.play().catch(() => resolve());
      } catch {
        resolve();
      }
    });
  }

  playInnkeeper(
    line:
      | 'welcome'
      | 'mulligan'
      | 'coin'
      | 'collection'
      | 'rare'
      | 'epic'
      | 'legendary'
      | 'golden_legendary',
  ) {
    if (
      line === 'rare' ||
      line === 'epic' ||
      line === 'legendary' ||
      line === 'golden_legendary'
    ) {
      this.playVoFile(`announcer_${line}`);
    } else {
      this.playVoFile(`innkeeper_${line}`);
    }
  }

  playHeroVo(
    heroClass: HeroClass,
    kind:
      | 'greetings'
      | 'well_played'
      | 'thanks'
      | 'wow'
      | 'oops'
      | 'threaten'
      | 'start'
      | 'concede'
      | 'attack'
      | 'error_mana'
      | 'error_attacked'
      | 'error_taunt'
      | 'time',
  ) {
    const heroVo = CLASSIC_HEROES[heroClass].voKey;
    this.playVoFile(`hero_${heroVo}_${kind}`);
  }

  async playMatchupAnnouncement(playerClass: HeroClass, opponentClass: HeroClass) {
    if (this.settings.muted) return;
    const pVo = CLASSIC_HEROES[playerClass].voKey;
    const oVo = CLASSIC_HEROES[opponentClass].voKey;
    await this.playVoFile(`announcer_${pVo}`);
    await this.playVoFile('announcer_versus');
    await this.playVoFile(`announcer_${oVo}`);
  }
}

export const hsAudio = new SnsHeroCardAudioEngine();

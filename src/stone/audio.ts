import { CLASSIC_HEROES, HeroClass } from './types';

const SETTINGS_KEY = 'stone_hs_settings';

export interface AudioSettings {
  bgmVolume: number;
  sfxVolume: number;
  voVolume: number;
  muted: boolean;
  vibrateEnabled: boolean;
}

export interface VibrationSupportInfo {
  isAndroid: boolean;
  webVibrationApi: boolean;
  supportedOnDevice: boolean;
}

export interface DamageVibrationSpec {
  tier: 'MICRO' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'COLOSSAL' | 'FINISHER';
  strength: number;
  pattern: number | number[];
  durationMs: number;
}

export function computeDamageVibrationSpec(
  rawDamage: number,
  isFinisher = false,
): DamageVibrationSpec {
  const dmg = Math.max(1, Math.round(rawDamage || 1));
  if (isFinisher) {
    return {
      tier: 'FINISHER',
      strength: 120,
      pattern: [85, 28, 120, 28, 165],
      durationMs: 435,
    };
  }
  if (dmg <= 2) {
    const ms = 12 + dmg * 6;
    return { tier: 'MICRO', strength: dmg, pattern: ms, durationMs: ms + 10 };
  }
  if (dmg <= 4) {
    const ms = 10 + dmg * 8;
    return { tier: 'LIGHT', strength: dmg, pattern: ms, durationMs: ms + 12 };
  }
  if (dmg <= 7) {
    const p1 = Math.round(26 + dmg * 3.2);
    const p2 = Math.round(36 + dmg * 4.2);
    return { tier: 'MEDIUM', strength: dmg, pattern: [p1, 22, p2], durationMs: p1 + 22 + p2 + 12 };
  }
  if (dmg <= 11) {
    const p1 = Math.round(38 + dmg * 2.8);
    const p2 = Math.round(54 + dmg * 3.8);
    return { tier: 'HEAVY', strength: dmg, pattern: [p1, 24, p2], durationMs: p1 + 24 + p2 + 14 };
  }
  const capped = Math.min(28, dmg);
  const p1 = Math.min(96, Math.round(52 + capped * 1.6));
  const p2 = Math.min(132, Math.round(70 + capped * 2.1));
  const p3 = Math.min(168, Math.round(90 + capped * 2.6));
  return {
    tier: 'COLOSSAL',
    strength: Math.min(110, dmg),
    pattern: [p1, 26, p2, 26, p3],
    durationMs: p1 + 26 + p2 + 26 + p3 + 16,
  };
}

const DEFAULT_AUDIO: AudioSettings = {
  bgmVolume: 0.36,
  sfxVolume: 0.72,
  voVolume: 0.92,
  muted: false,
  vibrateEnabled: true,
};

class HearthstoneAudioEngine {
  private settings: AudioSettings = DEFAULT_AUDIO;
  private currentBgm: HTMLAudioElement | null = null;
  private currentBgmKey: string | null = null;
  private currentVo: HTMLAudioElement | null = null;
  private currentVoResolve: (() => void) | null = null;
  private activeSfx = new Set<HTMLAudioElement>();
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private isWindowActive = true;
  private activeVibrateUntil = 0;
  private activeVibrateStrength = 0;

  constructor() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        this.settings = { ...DEFAULT_AUDIO, ...JSON.parse(raw) };
      }
    } catch {
      // ignore storage errors
    }

    if (typeof window !== 'undefined') {
      this.isWindowActive =
        (typeof document === 'undefined' || !document.hidden) &&
        (typeof document.hasFocus !== 'function' || document.hasFocus());

      const unlock = () => {
        this.unlocked = true;
        if (!this.checkWindowActive()) return;
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.currentBgm && !this.settings.muted && this.currentBgm.paused) {
          this.currentBgm.play().catch(() => {});
        }
      };

      const onVisibilityChange = () => {
        if (typeof document !== 'undefined' && document.hidden) {
          this.suspendForFocusLoss();
        } else if (typeof document.hasFocus !== 'function' || document.hasFocus()) {
          this.resumeForFocusGain();
        }
      };

      const onBlur = () => this.suspendForFocusLoss();
      const onFocus = () => this.resumeForFocusGain();

      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
      window.addEventListener('blur', onBlur);
      window.addEventListener('focus', onFocus);
      window.addEventListener('pagehide', onBlur);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibilityChange);
      }
    }
  }

  private checkWindowActive(): boolean {
    if (typeof document !== 'undefined') {
      if (document.hidden) {
        this.isWindowActive = false;
        return false;
      }
      if (typeof document.hasFocus === 'function' && !document.hasFocus()) {
        this.isWindowActive = false;
        return false;
      }
    }
    return this.isWindowActive;
  }

  private suspendForFocusLoss() {
    this.isWindowActive = false;
    if (this.currentBgm && !this.currentBgm.paused) {
      this.currentBgm.pause();
    }
    if (this.activeSfx.size > 0) {
      for (const sfx of this.activeSfx) {
        try {
          sfx.pause();
          sfx.src = '';
        } catch {
          // ignore
        }
      }
      this.activeSfx.clear();
    }
    if (this.currentVo) {
      try {
        this.currentVo.pause();
        this.currentVo.src = '';
      } catch {
        // ignore
      }
      this.currentVo = null;
      const done = this.currentVoResolve;
      this.currentVoResolve = null;
      done?.();
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
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

  private resumeForFocusGain() {
    if (typeof document !== 'undefined') {
      if (document.hidden) return;
      if (typeof document.hasFocus === 'function' && !document.hasFocus()) return;
    }
    this.isWindowActive = true;
    if (this.settings.muted) return;
    if (this.unlocked && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (
      this.currentBgm &&
      this.settings.bgmVolume > 0 &&
      this.currentBgm.paused &&
      (this.currentBgm.loop || !this.currentBgm.ended)
    ) {
      this.currentBgm.volume = this.settings.bgmVolume;
      this.currentBgm.play().catch(() => {});
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
    const isAndroid = /Android/i.test(ua);
    const webVibrationApi = typeof navigator.vibrate === 'function';
    return { isAndroid, webVibrationApi, supportedOnDevice: isAndroid && webVibrationApi };
  }

  private hasStickyUserActivation(): boolean {
    if (typeof navigator === 'undefined') return this.unlocked;
    const userAct = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } })
      .userActivation;
    return Boolean(userAct?.hasBeenActive || this.unlocked);
  }

  vibrateByDamage(damage: number, opts?: { isFinisher?: boolean }): boolean {
    if (!this.checkWindowActive() || !this.settings.vibrateEnabled) return false;
    const support = this.getVibrationSupportInfo();
    if (!support.supportedOnDevice || !this.hasStickyUserActivation()) return false;

    const spec = computeDamageVibrationSpec(damage, Boolean(opts?.isFinisher));
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
    if (!this.checkWindowActive() || !this.settings.vibrateEnabled) return false;
    const support = this.getVibrationSupportInfo();
    if (!support.supportedOnDevice || !this.hasStickyUserActivation()) return false;
    try {
      return navigator.vibrate(28);
    } catch {
      return false;
    }
  }

  updateSettings(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore
    }
    if (this.currentBgm) {
      this.currentBgm.volume = this.settings.muted ? 0 : this.settings.bgmVolume;
      if (this.settings.muted || !this.checkWindowActive()) {
        this.currentBgm.pause();
      } else if (this.unlocked && this.currentBgm.paused) {
        this.currentBgm.play().catch(() => {});
      }
    }
  }

  private getAudioCtx(): AudioContext | null {
    if (typeof window === 'undefined' || !this.checkWindowActive()) return null;
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
      if (!this.settings.muted && this.unlocked && this.checkWindowActive() && this.currentBgm.paused) {
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
    const audio = new Audio(`/stone-assets/audio/bgm/${track}.mp3`);
    audio.loop = track !== 'mulligan';
    audio.volume = this.settings.muted ? 0 : this.settings.bgmVolume;
    this.currentBgm = audio;
    if (!this.settings.muted && this.checkWindowActive()) {
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
    if (!this.checkWindowActive() || this.settings.muted || this.settings.sfxVolume <= 0) return;
    try {
      const a = new Audio(`/stone-assets/audio/sfx/${name}.mp3`);
      a.volume = Math.min(1, this.settings.sfxVolume * volumeScale);
      this.activeSfx.add(a);
      const cleanup = () => this.activeSfx.delete(a);
      a.onended = cleanup;
      a.onerror = cleanup;
      a.play().catch(cleanup);
    } catch {
      // ignore
    }
  }

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
      | 'FATIGUE'
      | 'LEGENDARY_FANFARE',
  ) {
    if (!this.checkWindowActive() || this.settings.muted || this.settings.sfxVolume <= 0) return;
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
      case 'LEGENDARY_FANFARE':
        tone(523.25, 523.25, 0.28, 'triangle', 0);
        tone(659.25, 659.25, 0.28, 'triangle', 0.09);
        tone(783.99, 783.99, 0.35, 'triangle', 0.18);
        tone(1046.5, 1046.5, 0.65, 'sine', 0.26);
        break;
    }
  }

  playVoFile(voKey: string): Promise<void> {
    if (!this.checkWindowActive() || this.settings.muted || this.settings.voVolume <= 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      try {
        if (this.currentVo) {
          try {
            this.currentVo.pause();
            this.currentVo.src = '';
          } catch {
            // ignore
          }
          const prevDone = this.currentVoResolve;
          this.currentVoResolve = null;
          prevDone?.();
        }
        const a = new Audio(`/stone-assets/audio/vo/${voKey}.mp3`);
        a.volume = this.settings.voVolume;
        this.currentVo = a;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          if (this.currentVo === a) {
            this.currentVo = null;
            this.currentVoResolve = null;
          }
          resolve();
        };
        this.currentVoResolve = finish;
        a.onended = finish;
        a.onerror = finish;
        a.play().catch(finish);
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
      | 'golden_common'
      | 'golden_rare'
      | 'golden_epic'
      | 'golden_legendary',
  ) {
    if (line === 'golden_common' || line === 'golden_rare') {
      this.playVoFile('announcer_rare');
    } else if (line === 'golden_epic') {
      this.playVoFile('announcer_epic');
    } else if (line === 'rare' || line === 'epic' || line === 'legendary' || line === 'golden_legendary') {
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
    if (!this.checkWindowActive() || this.settings.muted) return;
    const pVo = CLASSIC_HEROES[playerClass].voKey;
    const oVo = CLASSIC_HEROES[opponentClass].voKey;
    await this.playVoFile(`announcer_${pVo}`);
    await this.playVoFile('announcer_versus');
    await this.playVoFile(`announcer_${oVo}`);
  }
}

export const hsAudio = new HearthstoneAudioEngine();

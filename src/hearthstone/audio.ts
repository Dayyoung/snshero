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

export interface DamageVibrationSpec {
  tier: 'MICRO' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'COLOSSAL' | 'FINISHER';
  strength: number;
  pattern: number | number[];
  durationMs: number;
}

/**
 * 카드가 주고받는 데미지(dealt + counterReceived 또는 주문 피해량)에 비례한 6단계 정밀 햅틱 진동 스펙 계산
 */
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
    // 1~2 데미지: 짧고 가벼운 미세 톡 진동 (18ms ~ 24ms)
    const ms = 12 + dmg * 6;
    return {
      tier: 'MICRO',
      strength: dmg,
      pattern: ms,
      durationMs: ms + 10,
    };
  }
  if (dmg <= 4) {
    // 3~4 데미지: 선명한 단타 진동 (34ms ~ 42ms)
    const ms = 10 + dmg * 8;
    return {
      tier: 'LIGHT',
      strength: dmg,
      pattern: ms,
      durationMs: ms + 12,
    };
  }
  if (dmg <= 7) {
    // 5~7 데미지: 2단 중타 충돌 진동
    const p1 = Math.round(26 + dmg * 3.2);
    const p2 = Math.round(36 + dmg * 4.2);
    return {
      tier: 'MEDIUM',
      strength: dmg,
      pattern: [p1, 22, p2],
      durationMs: p1 + 22 + p2 + 12,
    };
  }
  if (dmg <= 11) {
    // 8~11 데미지: 묵직한 2단 강타 충돌 진동
    const p1 = Math.round(38 + dmg * 2.8);
    const p2 = Math.round(54 + dmg * 3.8);
    return {
      tier: 'HEAVY',
      strength: dmg,
      pattern: [p1, 24, p2],
      durationMs: p1 + 24 + p2 + 14,
    };
  }
  // 12+ 데미지 (거대 전설 하수인 또는 스토리모드 배수 격돌): 3단 대격돌 파열 진동
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

const KIND_TO_DAMAGE: Record<AttackVibrationKind, { dmg: number; finisher?: boolean }> = {
  LIGHT_HIT: { dmg: 2 },
  NORMAL_ATTACK: { dmg: 4 },
  HERO_HIT: { dmg: 6 },
  HEAVY_ATTACK: { dmg: 9 },
  HERO_FINISHER: { dmg: 20, finisher: true },
};

class SnsHeroCardAudioEngine {
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
      if (!localStorage.getItem(CALM_BGM_MIGRATION_KEY)) {
        this.settings.bgmVolume = 0.15;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
        localStorage.setItem(CALM_BGM_MIGRATION_KEY, '1');
      }
    } catch {
      // ignore storage errors
    }

    if (typeof window !== 'undefined') {
      if (typeof document !== 'undefined') {
        this.isWindowActive =
          !document.hidden &&
          (typeof document.hasFocus !== 'function' || document.hasFocus());
      }

      const handleBlur = () => {
        this.suspendForFocusLoss();
      };

      const handleFocus = () => {
        this.resumeForFocusGain();
      };

      const handleVisibilityChange = () => {
        if (typeof document === 'undefined') return;
        if (document.hidden) {
          this.suspendForFocusLoss();
        } else if (typeof document.hasFocus !== 'function' || document.hasFocus()) {
          this.resumeForFocusGain();
        }
      };

      const unlock = () => {
        this.unlocked = true;
        if (typeof document === 'undefined' || !document.hidden) {
          this.resumeForFocusGain();
        }
      };

      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('pagehide', handleBlur);
      window.addEventListener('pageshow', handleFocus);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }

      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
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
    if (typeof document !== 'undefined' && document.hidden) return;
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
      if (this.settings.muted || !this.isWindowActive) {
        this.currentBgm.pause();
      } else if (
        this.unlocked &&
        this.settings.bgmVolume > 0 &&
        this.currentBgm.paused &&
        (this.currentBgm.loop || !this.currentBgm.ended)
      ) {
        this.currentBgm.play().catch(() => {});
      }
    }
    if (this.settings.muted) {
      if (this.currentVo) {
        this.currentVo.pause();
        this.currentVo = null;
        const done = this.currentVoResolve;
        this.currentVoResolve = null;
        done?.();
      }
      if (this.activeSfx.size > 0) {
        for (const sfx of this.activeSfx) {
          sfx.pause();
        }
        this.activeSfx.clear();
      }
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
   * 카드가 주고받는 실제 데미지(공격 피해 + 반격 피해, 또는 주문 피해량)에 비례한 안드로이드 웹 진동 실행
   * - 환경설정 `vibrateEnabled`가 켜져 있고 안드로이드 Web Vibration 지원 기기일 때 작동
   * - 우선순위 중재기(Priority Arbiter): 더 강한 충돌 진동 도중 약한 보조 틱이 진동을 덮어쓰지 않도록 보호
   */
  vibrateByDamage(damage: number, opts?: { isFinisher?: boolean }): boolean {
    if (!this.isWindowActive || !this.settings.vibrateEnabled) return false;
    const support = this.getVibrationSupportInfo();
    if (!support.supportedOnDevice) return false;
    if (!this.hasStickyUserActivation()) return false;

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

  vibrateAttack(kind: AttackVibrationKind): boolean {
    const mapped = KIND_TO_DAMAGE[kind];
    return this.vibrateByDamage(mapped.dmg, { isFinisher: mapped.finisher });
  }

  previewVibration(): boolean {
    if (!this.isWindowActive || !this.settings.vibrateEnabled) return false;
    const support = this.getVibrationSupportInfo();
    if (!support.supportedOnDevice || !this.hasStickyUserActivation()) return false;
    try {
      return navigator.vibrate(28);
    } catch {
      return false;
    }
  }

  private getAudioCtx(): AudioContext | null {
    if (typeof window === 'undefined' || !this.isWindowActive) return null;
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
      if (
        this.isWindowActive &&
        !this.settings.muted &&
        this.settings.bgmVolume > 0 &&
        this.currentBgm.paused &&
        (this.currentBgm.loop || !this.currentBgm.ended)
      ) {
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
    if (this.isWindowActive && !this.settings.muted && this.settings.bgmVolume > 0) {
      audio.play().catch(() => {});
    }
  }

  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.src = '';
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
    if (!this.isWindowActive || this.settings.muted || this.settings.sfxVolume <= 0) return;
    try {
      const a = new Audio(`/hs-assets/snshero-audio/sfx/${name}.mp3`);
      a.volume = Math.min(1, this.settings.sfxVolume * volumeScale);
      this.activeSfx.add(a);
      const cleanup = () => {
        this.activeSfx.delete(a);
      };
      a.onended = cleanup;
      a.onerror = cleanup;
      a.play().catch(cleanup);
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
      | 'FATIGUE'
      | 'LEGENDARY_FANFARE',
  ) {
    if (!this.isWindowActive || this.settings.muted || this.settings.sfxVolume <= 0) return;
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
        // Majestic Heroic Brass + Celestial Triad Stinger for Legendary Entrance
        tone(293.66, 293.66, 0.68, 'sawtooth', 0);
        tone(440.0, 440.0, 0.72, 'triangle', 0.04);
        tone(587.33, 587.33, 0.78, 'triangle', 0.09);
        tone(739.99, 739.99, 0.82, 'sine', 0.14);
        tone(880.0, 1174.66, 0.85, 'sine', 0.18);
        break;
    }
  }

  playVoFile(voKey: string): Promise<void> {
    if (!this.isWindowActive || this.settings.muted || this.settings.voVolume <= 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      try {
        if (this.currentVo) {
          this.currentVo.pause();
          this.currentVo = null;
          const prevResolve = this.currentVoResolve;
          this.currentVoResolve = null;
          prevResolve?.();
        }
        const a = new Audio(`/hs-assets/snshero-audio/vo/${voKey}.mp3`);
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
    if (
      line === 'rare' ||
      line === 'epic' ||
      line === 'legendary' ||
      line === 'golden_common' ||
      line === 'golden_rare' ||
      line === 'golden_epic' ||
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
    if (!this.isWindowActive || this.settings.muted) return;
    const pVo = CLASSIC_HEROES[playerClass].voKey;
    const oVo = CLASSIC_HEROES[opponentClass].voKey;
    await this.playVoFile(`announcer_${pVo}`);
    if (!this.isWindowActive) return;
    await this.playVoFile('announcer_versus');
    if (!this.isWindowActive) return;
    await this.playVoFile(`announcer_${oVo}`);
  }
}

export const hsAudio = new SnsHeroCardAudioEngine();

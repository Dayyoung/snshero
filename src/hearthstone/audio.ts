import { HeroClass } from './types';

const SETTINGS_KEY = 'hero_hs_settings';

export interface AudioSettings {
  bgmVolume: number;
  sfxVolume: number;
  voVolume: number;
  muted: boolean;
}

const DEFAULT_AUDIO: AudioSettings = {
  bgmVolume: 0.36,
  sfxVolume: 0.72,
  voVolume: 0.85,
  muted: false,
};

const BGM_URL_MAP: Record<'tavern_hub' | 'collection' | 'mulligan' | 'duel_1' | 'duel_2', string> = {
  tavern_hub: '/bgm/sanctuary-lobby.mp3',
  collection: '/bgm/whispering-wind.mp3',
  mulligan: '/bgm/hero-awakening.mp3',
  duel_1: '/bgm/colosseum-battle.mp3',
  duel_2: '/bgm/colosseum-battle.mp3',
};

class SnsHeroCardAudioEngine {
  private settings: AudioSettings = DEFAULT_AUDIO;
  private currentBgm: HTMLAudioElement | null = null;
  private currentBgmKey: string | null = null;
  private ctx: AudioContext | null = null;
  private unlocked = false;

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
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
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
      if (this.settings.muted) {
        this.currentBgm.pause();
      } else if (this.unlocked && this.currentBgm.paused) {
        this.currentBgm.play().catch(() => {});
      }
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
    const url = BGM_URL_MAP[track];
    if (this.currentBgmKey === url && this.currentBgm) {
      if (!this.settings.muted && this.unlocked && this.currentBgm.paused) {
        this.currentBgm.play().catch(() => {});
      }
      return;
    }
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.src = '';
      this.currentBgm = null;
    }
    this.currentBgmKey = url;
    const audio = new Audio(url);
    audio.loop = track !== 'mulligan';
    audio.volume = this.settings.muted ? 0 : this.settings.bgmVolume;
    this.currentBgm = audio;
    if (!this.settings.muted && this.unlocked) {
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

  private synthNotes(
    notes: Array<{ f1: number; f2: number; dur: number; type?: OscillatorType; delay?: number }>,
    volumeScale = 1,
  ) {
    if (this.settings.muted || this.settings.sfxVolume <= 0) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = Math.min(0.65, this.settings.sfxVolume * 0.34 * volumeScale);
    master.connect(ctx.destination);

    for (const n of notes) {
      const delay = n.delay || 0;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = n.type || 'triangle';
      osc.frequency.setValueAtTime(Math.max(24, n.f1), now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, n.f2), now + delay + n.dur);
      g.gain.setValueAtTime(0.001, now + delay);
      g.gain.linearRampToValueAtTime(0.55, now + delay + Math.min(0.025, n.dur * 0.25));
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + n.dur);
      osc.connect(g);
      g.connect(master);
      osc.start(now + delay);
      osc.stop(now + delay + n.dur + 0.02);
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
    switch (name) {
      case 'box_hover':
      case 'ui_hover':
      case 'card_hover':
        this.synthNotes([{ f1: 680, f2: 860, dur: 0.055, type: 'sine' }], volumeScale * 0.5);
        break;
      case 'box_press':
      case 'ui_click':
      case 'menu_press':
      case 'menu_select':
      case 'open_menu':
        this.synthNotes(
          [
            { f1: 420, f2: 640, dur: 0.09, type: 'triangle' },
            { f1: 840, f2: 1120, dur: 0.07, type: 'sine', delay: 0.02 },
          ],
          volumeScale * 0.75,
        );
        break;
      case 'box_open':
      case 'box_disk_flip':
      case 'box_tray_in':
      case 'cm_select_hero':
        this.synthNotes(
          [
            { f1: 280, f2: 560, dur: 0.22, type: 'triangle' },
            { f1: 560, f2: 880, dur: 0.24, type: 'sine', delay: 0.06 },
          ],
          volumeScale,
        );
        break;
      case 'box_close':
      case 'box_tray_out':
      case 'cm_remove_card':
        this.synthNotes([{ f1: 540, f2: 240, dur: 0.16, type: 'triangle' }], volumeScale * 0.8);
        break;
      case 'card_flip':
      case 'whoosh':
        this.synthNotes(
          [
            { f1: 320, f2: 960, dur: 0.14, type: 'sine' },
            { f1: 640, f2: 1280, dur: 0.12, type: 'triangle', delay: 0.03 },
          ],
          volumeScale * 0.9,
        );
        break;
      case 'card_place':
        this.synthNotes(
          [
            { f1: 220, f2: 92, dur: 0.16, type: 'triangle' },
            { f1: 520, f2: 780, dur: 0.12, type: 'sine', delay: 0.02 },
          ],
          volumeScale,
        );
        break;
      case 'attack':
        this.synthNotes(
          [
            { f1: 240, f2: 64, dur: 0.22, type: 'sawtooth' },
            { f1: 460, f2: 120, dur: 0.15, type: 'triangle', delay: 0.02 },
          ],
          volumeScale,
        );
        break;
      case 'big_attack':
        this.synthNotes(
          [
            { f1: 180, f2: 42, dur: 0.36, type: 'sawtooth' },
            { f1: 360, f2: 78, dur: 0.28, type: 'square', delay: 0.03 },
          ],
          volumeScale * 1.15,
        );
        break;
      case 'end_turn':
      case 'player_turn':
        this.synthNotes(
          [
            { f1: 523.25, f2: 659.25, dur: 0.16, type: 'triangle' },
            { f1: 659.25, f2: 783.99, dur: 0.22, type: 'sine', delay: 0.08 },
          ],
          volumeScale,
        );
        break;
      case 'hero_power':
        this.synthNotes(
          [
            { f1: 392, f2: 784, dur: 0.24, type: 'triangle' },
            { f1: 587.33, f2: 1174.66, dur: 0.26, type: 'sine', delay: 0.05 },
          ],
          volumeScale,
        );
        break;
      case 'pack_open':
      case 'purchase':
        this.synthNotes(
          [
            { f1: 330, f2: 660, dur: 0.22, type: 'triangle' },
            { f1: 494, f2: 988, dur: 0.28, type: 'sine', delay: 0.08 },
            { f1: 659, f2: 1318, dur: 0.34, type: 'sine', delay: 0.16 },
          ],
          volumeScale,
        );
        break;
      case 'pack_rare':
        this.synthNotes(
          [
            { f1: 523.25, f2: 783.99, dur: 0.24, type: 'sine' },
            { f1: 783.99, f2: 1046.5, dur: 0.28, type: 'triangle', delay: 0.09 },
          ],
          volumeScale,
        );
        break;
      case 'pack_epic':
        this.synthNotes(
          [
            { f1: 440, f2: 659.25, dur: 0.24, type: 'triangle' },
            { f1: 659.25, f2: 880, dur: 0.26, type: 'sine', delay: 0.08 },
            { f1: 880, f2: 1318.5, dur: 0.34, type: 'sine', delay: 0.16 },
          ],
          volumeScale,
        );
        break;
      case 'pack_legendary':
      case 'victory':
      case 'crowd':
        this.synthNotes(
          [
            { f1: 523.25, f2: 523.25, dur: 0.18, type: 'triangle' },
            { f1: 659.25, f2: 659.25, dur: 0.18, type: 'triangle', delay: 0.1 },
            { f1: 783.99, f2: 783.99, dur: 0.22, type: 'triangle', delay: 0.2 },
            { f1: 1046.5, f2: 1318.5, dur: 0.52, type: 'sine', delay: 0.3 },
          ],
          volumeScale * 1.1,
        );
        break;
    }
  }

  /** Procedural WebAudio elemental & mechanical accents */
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
    switch (kind) {
      case 'MANA_GAIN':
        this.synthNotes([
          { f1: 660, f2: 1046, dur: 0.22, type: 'triangle' },
          { f1: 880, f2: 1318, dur: 0.25, type: 'sine', delay: 0.05 },
        ]);
        break;
      case 'FIRE':
        this.synthNotes([
          { f1: 240, f2: 55, dur: 0.45, type: 'sawtooth' },
          { f1: 420, f2: 90, dur: 0.32, type: 'triangle', delay: 0.04 },
        ]);
        break;
      case 'FROST':
        this.synthNotes([
          { f1: 1400, f2: 2400, dur: 0.18, type: 'sine' },
          { f1: 1900, f2: 920, dur: 0.28, type: 'triangle', delay: 0.07 },
        ]);
        break;
      case 'LIGHTNING':
        this.synthNotes([
          { f1: 950, f2: 110, dur: 0.24, type: 'sawtooth' },
          { f1: 1600, f2: 220, dur: 0.18, type: 'square', delay: 0.05 },
        ]);
        break;
      case 'HOLY':
        this.synthNotes([
          { f1: 523.25, f2: 783.99, dur: 0.45, type: 'sine' },
          { f1: 659.25, f2: 1046.5, dur: 0.5, type: 'triangle', delay: 0.06 },
        ]);
        break;
      case 'SHADOW':
        this.synthNotes([
          { f1: 180, f2: 65, dur: 0.5, type: 'sawtooth' },
          { f1: 270, f2: 95, dur: 0.45, type: 'sine', delay: 0.04 },
        ]);
        break;
      case 'DIVINE_BREAK':
        this.synthNotes([
          { f1: 1800, f2: 620, dur: 0.24, type: 'triangle' },
          { f1: 2400, f2: 880, dur: 0.2, type: 'sine', delay: 0.04 },
        ]);
        break;
      case 'SECRET_TRIGGER':
        this.synthNotes([
          { f1: 440, f2: 880, dur: 0.25, type: 'triangle' },
          { f1: 660, f2: 1320, dur: 0.35, type: 'sine', delay: 0.12 },
        ]);
        break;
      case 'SILENCE':
        this.synthNotes([{ f1: 720, f2: 210, dur: 0.34, type: 'sine' }]);
        break;
      case 'ROPE_TICK':
        this.synthNotes([{ f1: 310, f2: 180, dur: 0.08, type: 'triangle' }]);
        break;
      case 'ARMOR':
        this.synthNotes([{ f1: 320, f2: 480, dur: 0.16, type: 'triangle' }]);
        break;
      case 'FATIGUE':
        this.synthNotes([{ f1: 150, f2: 52, dur: 0.55, type: 'sawtooth' }]);
        break;
    }
  }

  playInnkeeper(
    line: 'welcome' | 'mulligan' | 'coin' | 'collection' | 'rare' | 'epic' | 'legendary' | 'golden_legendary',
  ) {
    if (this.settings.muted || this.settings.voVolume <= 0) return;
    if (line === 'legendary' || line === 'golden_legendary') {
      this.playSfx('pack_legendary', this.settings.voVolume);
    } else if (line === 'epic') {
      this.playSfx('pack_epic', this.settings.voVolume);
    } else if (line === 'rare') {
      this.playSfx('pack_rare', this.settings.voVolume);
    } else {
      this.synthNotes(
        [
          { f1: 440, f2: 554.37, dur: 0.14, type: 'sine' },
          { f1: 659.25, f2: 880, dur: 0.2, type: 'triangle', delay: 0.08 },
        ],
        this.settings.voVolume * 0.65,
      );
    }
  }

  playHeroVo(
    _heroClass: HeroClass,
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
    if (this.settings.muted || this.settings.voVolume <= 0) return;
    if (kind.startsWith('error_')) {
      this.synthNotes([{ f1: 240, f2: 150, dur: 0.16, type: 'sawtooth' }], 0.65);
    } else {
      this.synthNotes(
        [
          { f1: 493.88, f2: 659.25, dur: 0.12, type: 'triangle' },
          { f1: 659.25, f2: 783.99, dur: 0.16, type: 'sine', delay: 0.06 },
        ],
        0.55,
      );
    }
  }

  async playMatchupAnnouncement(_playerClass: HeroClass, _opponentClass: HeroClass) {
    if (this.settings.muted || this.settings.voVolume <= 0) return;
    this.synthNotes(
      [
        { f1: 392, f2: 523.25, dur: 0.22, type: 'triangle' },
        { f1: 523.25, f2: 659.25, dur: 0.22, type: 'triangle', delay: 0.14 },
        { f1: 783.99, f2: 1046.5, dur: 0.38, type: 'sine', delay: 0.28 },
      ],
      0.85,
    );
  }
}

export const hsAudio = new SnsHeroCardAudioEngine();

// Sound effects helper
const SFX_URLS: Record<string, string> = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  flip: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  equip: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  reward: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
  open: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'
};

// ID 604 (Item 9): Page Visibility Audio Lifecycle Management
const activeAudioList: HTMLAudioElement[] = [];

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      activeAudioList.forEach((audio) => {
        try {
          audio.pause();
        } catch {}
      });
      activeAudioList.length = 0;
    }
  });
}

export const isSfxMutedGlobal = (): boolean => {
  try {
    if (typeof window === 'undefined') return true;

    // 1. hero_sfx_muted 체크
    if (localStorage.getItem('hero_sfx_muted') === 'true') return true;

    // 2. hero_sound_muted 체크
    if (localStorage.getItem('hero_sound_muted') === 'true') return true;

    // 3. hero_sfx 체크 ('false'이면 음소거)
    if (localStorage.getItem('hero_sfx') === 'false') return true;

    // 4. hero_sfx_volume 체크 (0이면 음소거)
    const sfxVol = localStorage.getItem('hero_sfx_volume');
    if (sfxVol !== null && parseFloat(sfxVol) === 0) return true;

    // 5. snshero_audio_settings 종합 객체 체크
    const combined = localStorage.getItem('snshero_audio_settings');
    if (combined) {
      const parsed = JSON.parse(combined);
      if (parsed.sfxEnabled === false || parsed.sfxVolume === 0) return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const setGlobalSfxMuted = (muted: boolean) => {
  try {
    localStorage.setItem('hero_sfx_muted', muted ? 'true' : 'false');
    localStorage.setItem('hero_sound_muted', muted ? 'true' : 'false');
    localStorage.setItem('hero_sfx', muted ? 'false' : 'true');
    window.dispatchEvent(new CustomEvent('snshero_audio_settings_changed', {
      detail: { isMuted: muted }
    }));
  } catch {}
};

export const playSfx = (type: keyof typeof SFX_URLS | string) => {
  try {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (isSfxMutedGlobal()) return;

    const url = SFX_URLS[type] || type;
    const audio = new Audio(url);
    audio.volume = 0.45;
    activeAudioList.push(audio);
    audio.onended = () => {
      const idx = activeAudioList.indexOf(audio);
      if (idx !== -1) activeAudioList.splice(idx, 1);
    };
    audio.play().catch(() => {
      // Ignored for autoplay policy
    });
  } catch {
    // Audio context safely caught
  }
};

// SCR-01-03: Zero-latency Web Audio API Faction SFX Engine
let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

export const playFactionSfx = (factionOrElement: string = 'fire') => {
  try {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (isSfxMutedGlobal()) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const key = factionOrElement.toLowerCase();

    if (key.includes('fire') || key.includes('불') || key.includes('red')) {
      // Fire / Flame Burst: Low thump into rising sizzling flare
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (key.includes('water') || key.includes('물') || key.includes('blue')) {
      // Water / Ocean Drop: Smooth sine frequency drop & ripple
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (key.includes('wind') || key.includes('바람') || key.includes('green')) {
      // Wind / Gale: Airy pitch sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.32);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (key.includes('light') || key.includes('빛') || key.includes('elec') || key.includes('전기')) {
      // Electric / Lightning: Bright resonant chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      // Earth / Mecha / Default: Heavy impact thump
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  } catch {}
};


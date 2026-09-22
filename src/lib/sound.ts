/**
 * Global Sound & SFX management
 */
let isMuted = false;

try {
  const saved = localStorage.getItem('hero_sfx_muted');
  if (saved !== null) {
    isMuted = saved === 'true';
  }
} catch {
  // Ignore localStorage access issues
}

export function isSfxMutedGlobal(): boolean {
  return isMuted;
}

export function setGlobalSfxMuted(muted: boolean): void {
  isMuted = muted;
  try {
    localStorage.setItem('hero_sfx_muted', String(muted));
  } catch {
    // Ignore localStorage access issues
  }
}

const audioCache = new Map<string, HTMLAudioElement>();

export function playSfx(urlOrName: string = 'click'): void {
  if (isMuted || typeof window === 'undefined') return;

  try {
    let url = urlOrName;
    if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
      switch (urlOrName) {
        case 'click':
        case 'tap':
          url = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
          break;
        case 'success':
        case 'win':
        case 'victory':
          url = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';
          break;
        case 'flip':
          url = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';
          break;
        case 'magicAttack':
        case 'attack':
          url = 'https://assets.mixkit.co/active_storage/sfx/2068/2068-preview.mp3';
          break;
        default:
          url = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
      }
    }

    let audio = audioCache.get(url);
    if (!audio) {
      audio = new Audio(url);
      audio.volume = 0.5;
      audioCache.set(url, audio);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Audio playback errors safely silenced
    });
  } catch {
    // Audio errors safely silenced
  }
}

export default {
  isSfxMutedGlobal,
  setGlobalSfxMuted,
  playSfx
};

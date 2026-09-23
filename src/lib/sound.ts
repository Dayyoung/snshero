let globalSfxMuted = false;

try {
  if (typeof window !== 'undefined') {
    globalSfxMuted = localStorage.getItem('hero_sfx_muted') === 'true';
  }
} catch {}

export function isSfxMutedGlobal(): boolean {
  return globalSfxMuted;
}

export function setGlobalSfxMuted(muted: boolean): void {
  globalSfxMuted = muted;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hero_sfx_muted', String(muted));
    }
  } catch {}
}

export function playSfx(soundNameOrUrl: string, volume: number = 0.5): void {
  if (globalSfxMuted || typeof window === 'undefined') return;
  try {
    let url = soundNameOrUrl;
    if (!url.startsWith('http') && !url.startsWith('/')) {
      url = `https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3`;
    }
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
  } catch {}
}

export default { playSfx, isSfxMutedGlobal, setGlobalSfxMuted };

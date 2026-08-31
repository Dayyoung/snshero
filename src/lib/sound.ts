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

export const playSfx = (type: keyof typeof SFX_URLS | string) => {
  try {
    const isMuted = localStorage.getItem('hero_sfx_muted') === 'true';
    if (isMuted) return;

    const url = SFX_URLS[type] || type;
    const audio = new Audio(url);
    audio.volume = 0.45;
    audio.play().catch(() => {
      // Ignored for autoplay policy
    });
  } catch {
    // Audio context safely caught
  }
};

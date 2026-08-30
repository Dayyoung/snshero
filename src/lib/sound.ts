// Sound effects helper and global audio controller
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

/**
 * 전역 효과음 활성화 여부 확인
 * hero_sfx ('true'/'false'), hero_sfx_muted ('true'/'false'), snshero_audio_settings 동시 검증
 */
export const isSfxEnabled = (): boolean => {
  try {
    // 1. snshero_audio_settings 복합 설정 검증
    const audioSettings = localStorage.getItem('snshero_audio_settings');
    if (audioSettings) {
      const parsed = JSON.parse(audioSettings);
      if (parsed.sfxEnabled === false) return false;
      if (typeof parsed.sfxVolume === 'number' && parsed.sfxVolume <= 0) return false;
    }

    // 2. hero_sfx 단독 키 검증
    const heroSfx = localStorage.getItem('hero_sfx');
    if (heroSfx === 'false') return false;

    // 3. hero_sfx_muted 검증
    const isMuted = localStorage.getItem('hero_sfx_muted');
    if (isMuted === 'true') return false;

    // 4. 볼륨 0 검증
    const sfxVol = localStorage.getItem('hero_sfx_volume');
    if (sfxVol !== null && parseFloat(sfxVol) <= 0) return false;

    return true;
  } catch {
    return true;
  }
};

/**
 * 전역 효과음 볼륨 조회 (0.0 ~ 1.0)
 */
export const getSfxVolume = (): number => {
  try {
    const audioSettings = localStorage.getItem('snshero_audio_settings');
    if (audioSettings) {
      const parsed = JSON.parse(audioSettings);
      if (typeof parsed.sfxVolume === 'number') {
        return Math.max(0, Math.min(1, parsed.sfxVolume));
      }
    }
    const saved = localStorage.getItem('hero_sfx_volume');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) return Math.max(0, Math.min(1, parsed));
    }
  } catch {}
  return 0.4;
};

/**
 * 안전한 효과음 재생 함수 (설정에서 효과음이 꺼져있거나 볼륨이 0이면 절대 재생되지 않음)
 */
export const playSfx = (type: keyof typeof SFX_URLS | string) => {
  try {
    if (!isSfxEnabled()) return;

    const volume = getSfxVolume();
    if (volume <= 0) return;

    const url = SFX_URLS[type] || type;
    if (!url) return;

    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {
      // Ignored for autoplay policy or interruptions
    });
  } catch {
    // Audio context safely caught
  }
};

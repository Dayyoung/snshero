import { useState, useEffect, useCallback } from 'react';

/**
 * ID 340, 344, 395: 오디오 생명주기 관리, 자동 resume, 'M' 키 음소거 단축키 및 메모리 안전 해제 훅
 */
export function useAudioLifecycleGuard() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_sfx_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [masterVolume, setMasterVolume] = useState<number>(() => {
    try {
      const v = localStorage.getItem('hero_master_volume');
      return v ? parseFloat(v) : 0.8;
    } catch {
      return 0.8;
    }
  });

  // 음소거 토글
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hero_sfx_muted', next ? 'true' : 'false');
        window.dispatchEvent(new CustomEvent('snshero_audio_settings_changed', {
          detail: { isMuted: next, masterVolume }
        }));
      } catch {
        // ignore
      }
      return next;
    });
  }, [masterVolume]);

  // 볼륨 변경
  const changeVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setMasterVolume(clamped);
    try {
      localStorage.setItem('hero_master_volume', clamped.toString());
      window.dispatchEvent(new CustomEvent('snshero_audio_settings_changed', {
        detail: { isMuted, masterVolume: clamped }
      }));
    } catch {
      // ignore
    }
  }, [isMuted]);

  useEffect(() => {
    // 1. 사용자 첫 클릭/터치/키다운 시 AudioContext 잠금 해제 (ID 344)
    const handleFirstInteraction = () => {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    // 2. 단축키 'M' / 'm' 음소거 토글 (ID 395)
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // 3. 브라우저 탭 백그라운드 전환 시 오디오 리소스 일시정지 및 복구 (ID 340)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.dispatchEvent(new Event('snshero_audio_pause_bgm'));
      } else {
        window.dispatchEvent(new Event('snshero_audio_resume_bgm'));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [toggleMute]);

  return {
    isMuted,
    masterVolume,
    toggleMute,
    changeVolume,
  };
}

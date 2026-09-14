/**
 * useBattleScreenGuard.ts
 * 모바일 배틀 세션 전용 화면/제스처 가드 훅
 * - ID 384: Screen Wake Lock API (화면 꺼짐 방지)
 * - ID 374: Pull-to-refresh 차단 (overscroll-behavior-y: none)
 * - ID 394: 멀티터치 핀치 줌 방지 (touches.length > 1)
 * - ID 404: 화면 복귀 및 제스처 시 suspended 오디오 컨텍스트 자동 resume
 */

import { useEffect, useRef } from 'react';
import { battleAudio } from '../lib/BattleAudioEngine';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
}

export const useBattleScreenGuard = (isActive: boolean = true) => {
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // 1. ID 384: Wake Lock 획득 시도
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && typeof (navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinelLike> } }).wakeLock?.request === 'function') {
          wakeLockRef.current = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinelLike> } }).wakeLock.request('screen');
        }
      } catch {
        // WakeLock unsupported or denied
      }
    };
    requestWakeLock();

    // 2. ID 374: pull-to-refresh 방지
    const originalBodyOverscroll = document.body.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = 'none';

    // 3. ID 394: 멀티터치 핀치 줌 방지
    const handleTouchStart = (e: TouchEvent) => {
      battleAudio.resumeAudioContext();
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 4. ID 404 & 백그라운드 복귀 처리
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        battleAudio.resumeAudioContext();
        requestWakeLock();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', () => battleAudio.resumeAudioContext());

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      document.body.style.overscrollBehaviorY = originalBodyOverscroll;
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);
};

/**
 * useLowSpecGuard.ts
 * 저사양 모드(lowSpecMode) 가드 훅
 * - CSS 클래스 토글 (low-spec-mode)
 * - 불필요한 고사양 애니메이션/파티클 렌더링 억제
 */
import { useEffect } from 'react';

export const useLowSpecGuard = (lowSpecMode: boolean = false): void => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (lowSpecMode) {
      document.documentElement.classList.add('low-spec-mode');
    } else {
      document.documentElement.classList.remove('low-spec-mode');
    }

    return () => {
      document.documentElement.classList.remove('low-spec-mode');
    };
  }, [lowSpecMode]);
};

export default useLowSpecGuard;

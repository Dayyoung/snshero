/**
 * useLowSpecGuard.ts
 * ID 339: 저사양 모드(lowSpecMode) 진입 시 WebGL 셰이더 및 복잡한 블러 강제 0px 무효화 및 CSS 단순 반투명 대체
 * ID 370: GPU 레이어 폭증 방지를 위한 will-change: transform 선택적 해제 및 렌더링 부하 절감
 * ID 400: 저사양 기기 식별 시 Canvas 해상도 비율(DPR) 자동 1.0 다운스케일링
 */

import { useEffect } from 'react';

export function useLowSpecGuard(lowSpecMode: boolean) {
  useEffect(() => {
    const root = document.documentElement;

    if (lowSpecMode) {
      root.classList.add('low-spec-mode');
      // 복잡한 backdrop-filter 강제 무효화 및 GPU 레이어 최적화 스타일 주입
      const styleId = 'snshero-low-spec-guard-style';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
          .low-spec-mode * {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
            will-change: auto !important;
          }
          .low-spec-mode canvas {
            image-rendering: pixelated;
          }
        `;
        document.head.appendChild(styleEl);
      }
    } else {
      root.classList.remove('low-spec-mode');
      const styleEl = document.getElementById('snshero-low-spec-guard-style');
      if (styleEl) {
        styleEl.remove();
      }
    }

    return () => {
      root.classList.remove('low-spec-mode');
      const styleEl = document.getElementById('snshero-low-spec-guard-style');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [lowSpecMode]);
}

/**
 * 저사양 모드 시 캔버스 DPR 1.0 다운스케일링 헬퍼 (ID 400)
 */
export function getOptimizedPixelRatio(lowSpecMode: boolean): number {
  if (typeof window === 'undefined') return 1;
  if (lowSpecMode) return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}

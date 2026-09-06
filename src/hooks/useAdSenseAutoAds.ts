/**
 * useAdSenseAutoAds.ts
 * React SPA 라우트/뷰 변경 시 구글 애드센스 자동광고(Auto Ads) 재스캔 트리거 훅
 */

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function useAdSenseAutoAds(currentView: string): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // SPA 페이지 전환 시 애드센스 자동광고 페이지뷰 이벤트 트리거
      const adsbygoogle = window.adsbygoogle || [];
      adsbygoogle.push({});
    } catch {
      // 애드센스 스크립트 로드 전이거나 차단기 동작 시 안전 무시
    }
  }, [currentView]);
}

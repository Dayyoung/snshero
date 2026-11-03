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

export function removeAllAdSenseElements(): void {
  if (typeof document === 'undefined') return;
  try {
    const selectors = [
      '.adsbygoogle',
      'ins.adsbygoogle',
      '.adsense-container',
      '.google-auto-placed',
      'iframe[id*="google_ads"]',
      'iframe[name*="google_ads"]',
      'iframe[id*="aswift"]',
      'iframe[name*="aswift"]',
      'div[id*="google_ads"]',
      '#aswift_0_host',
      '#aswift_1_host',
      '#aswift_2_host',
    ];
    document.querySelectorAll(selectors.join(',')).forEach((el) => {
      try {
        el.remove();
      } catch {
        (el as HTMLElement).style.display = 'none';
      }
    });
  } catch {
    // safe catch
  }
}

export function removeAutoPlacedAds(): void {
  if (typeof document === 'undefined') return;
  try {
    const autoSelectors = [
      '.google-auto-placed',
      '.adsbygoogle-noab-wrap',
      'ins.adsbygoogle[data-anchor-status]',
      'div[id*="aswift"][style*="position: fixed"]',
      'iframe[name*="google_ads_top_frame"]',
      'iframe[name*="google_ads_bottom_frame"]',
    ];
    document.querySelectorAll(autoSelectors.join(',')).forEach((el) => {
      // 수동 지정된 광고 컨테이너(.adsense-container) 내부의 요소는 보호
      if (el.closest('.adsense-container')) return;
      try {
        el.remove();
      } catch {
        (el as HTMLElement).style.display = 'none';
      }
    });

    // 구글 애드센스가 body에 추가한 상단 패딩/마진 리셋
    if (document.body && (document.body.style.paddingTop || document.body.style.marginTop)) {
      document.body.style.paddingTop = '0px';
      document.body.style.marginTop = '0px';
    }
  } catch {
    // safe catch
  }
}

export function useAdSenseAutoAds(currentView: string, isAdRemoved = false): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isRemoved = isAdRemoved || localStorage.getItem('hero_ad_removed') === 'true';
    if (isRemoved) {
      // 광고 제거 유저: 자동광고 스캔 중단 및 기존 주입 광고 DOM 즉시 청소
      removeAllAdSenseElements();
      return;
    }

    // 모든 화면에서 지정된 수동 배너(.adsense-container) 외의 구글 자동 침범 요소/여백 제거
    removeAutoPlacedAds();
    const timer = setTimeout(removeAutoPlacedAds, 600);
    return () => clearTimeout(timer);
  }, [currentView, isAdRemoved]);
}


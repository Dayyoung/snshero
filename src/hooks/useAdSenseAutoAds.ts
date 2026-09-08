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

export function useAdSenseAutoAds(currentView: string, isAdRemoved = false): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isRemoved = isAdRemoved || localStorage.getItem('hero_ad_removed') === 'true';
    if (isRemoved) {
      // 광고 제거 유저: 자동광고 스캔 중단 및 기존 주입 광고 DOM 즉시 청소
      removeAllAdSenseElements();
      return;
    }

    try {
      // SPA 페이지 전환 시 애드센스 자동광고 페이지뷰 이벤트 트리거
      const adsbygoogle = window.adsbygoogle || [];
      adsbygoogle.push({});
    } catch {
      // 애드센스 스크립트 로드 전이거나 차단기 동작 시 안전 무시
    }
  }, [currentView, isAdRemoved]);
}


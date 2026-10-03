/**
 * SNSHeroGameBannerCard.tsx
 * 기존 노골적인 광고 대신 카드 공략, 공식 웹툰, 영화/애니, 인터랙티브 웹소설, 미니게임 등
 * 다양한 SNSHero 핵심 컨텐츠를 자연스럽게 간접 소개하는 네이티브 쇼케이스 카드로 전면 개편
 */

import React from 'react';
import { SNSHeroNativeAdCard } from './SNSHeroNativeAdCard';

interface SNSHeroGameBannerCardProps {
  isDark: boolean;
  isKo?: boolean;
  adIndex?: number;
  onGoToGame: () => void;
  onNavigateView?: (view: string) => void;
}

export const SNSHeroGameBannerCard: React.FC<SNSHeroGameBannerCardProps> = ({
  isDark,
  isKo = true,
  adIndex = 0,
  onGoToGame,
  onNavigateView,
}) => {
  const handleNavigate = (view: string) => {
    if (onNavigateView) {
      onNavigateView(view);
    } else {
      onGoToGame();
    }
  };

  return (
    <SNSHeroNativeAdCard
      isDark={isDark}
      isKo={isKo}
      adIndex={adIndex}
      onNavigateView={handleNavigate}
    />
  );
};

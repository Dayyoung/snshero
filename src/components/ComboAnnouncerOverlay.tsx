/**
 * ComboAnnouncerOverlay.tsx
 * 연속 콤보 / 캡처 시 화면 진동 및 아케이드 콤보 어나운서 배너 오버레이
 * (구글 스프레드시트 Row 824 / ID 553 요구사항 구현)
 */

import React, { useEffect } from 'react';
import { triggerHaptic } from '../lib/haptic';

interface ComboAnnouncerOverlayProps {
  comboCount: number;
  bonusPoints?: number;
  customTitle?: string;
  onFinished?: () => void;
}

export const ComboAnnouncerOverlay: React.FC<ComboAnnouncerOverlayProps> = ({
  comboCount,
  bonusPoints,
  customTitle,
  onFinished,
}) => {
  useEffect(() => {
    if (comboCount >= 2) {
      triggerHaptic('heavy');
    }
    const timer = setTimeout(() => {
      onFinished?.();
    }, 1200);
    return () => clearTimeout(timer);
  }, [comboCount, onFinished]);

  if (comboCount < 2) return null;

  let tierColor = 'text-cyan-400 border-cyan-500 bg-cyan-950/80';
  let bannerText = customTitle || `${comboCount}x COMBO FLIP!`;

  if (comboCount >= 6) {
    tierColor = 'text-rose-400 border-rose-500 bg-rose-950/90 animate-bounce';
    bannerText = customTitle || `💥 ULTRA CASCADE ${comboCount}x!`;
  } else if (comboCount >= 4) {
    tierColor = 'text-amber-400 border-amber-500 bg-amber-950/85';
    bannerText = customTitle || `⚡ MEGA BURST ${comboCount}x!`;
  }

  return (
    <div className="fixed inset-x-0 top-16 z-50 flex flex-col items-center justify-center pointer-events-none select-none font-mono animate-in fade-in zoom-in duration-200">
      <div
        className={`px-4 py-2 border border-solid shadow-2xl backdrop-blur-md rounded-none text-center ${tierColor}`}
      >
        <div className="text-sm font-black uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
          {bannerText}
        </div>
        {bonusPoints && bonusPoints > 0 && (
          <div className="text-[11px] font-bold text-white/90 mt-0.5">
            +{bonusPoints} SNS BONUS
          </div>
        )}
      </div>
    </div>
  );
};

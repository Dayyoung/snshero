/**
 * BlindBoxListingCard.tsx - SCR-05-15
 * 황금 블라인드 매물 상자 (랜덤 SSR 게릴라 출현) & 황금 수수료 세이프 박스 배너
 */

import React from 'react';
import { Gift, Sparkles, Key, Lock, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BlindBoxListingCardProps {
  onOpenBlindBox: () => void;
  onUnlockSafeBox: () => void;
  savedFeeSns?: number;
  language?: string;
}

export const BlindBoxListingCard: React.FC<BlindBoxListingCardProps> = ({
  onOpenBlindBox,
  onUnlockSafeBox,
  savedFeeSns = 180,
  language = 'ko',
}) => {
  return (
    <div className="w-full space-y-3 font-mono select-none my-3">
      {/* 황금 블라인드 매물 상자 */}
      <div className="relative overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-purple-900/30 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/30 rounded-lg text-amber-300 border border-amber-400/40">
              <Gift size={24} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-300">
                  {language === 'ko' ? '🎁 황금 블라인드 매물 상자' : '🎁 Golden Blind Listing Box'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-rose-500 text-white font-black rounded-full animate-pulse">
                  HOT
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                {language === 'ko'
                  ? '랜덤 전설/SSR 카드가 봉인된 미확인 긴급 매물!'
                  : 'Sealed listing with random SSR/Legendary card!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onOpenBlindBox();
            }}
            className="h-10 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs rounded-lg active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
          >
            {language === 'ko' ? '150 SNS 개봉' : 'Open 150 SNS'}
          </button>
        </div>
      </div>

      {/* 수수료 세이프 박스 캐시백 배너 */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-indigo-500/50 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-indigo-400" />
          <div>
            <span className="text-slate-300 font-bold block">
              {language === 'ko' ? '황금 수수료 세이프 박스' : 'Fee Safe Box'}
            </span>
            <span className="text-[10px] text-emerald-400">
              {language === 'ko' ? `누적 적립 수수료: ${savedFeeSns} SNS (50% 반환)` : `Accrued: ${savedFeeSns} SNS`}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onUnlockSafeBox();
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] rounded flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
        >
          <Lock size={12} />
          <span>{language === 'ko' ? '열쇠로 즉시 인출' : 'Unlock Now'}</span>
        </button>
      </div>
    </div>
  );
};

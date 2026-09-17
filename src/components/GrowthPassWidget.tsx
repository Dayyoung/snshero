import React, { useState, useEffect } from 'react';
import { Award, Sparkles, Check, Lock, ChevronRight, X } from 'lucide-react';
import { Language } from '../types';

interface GrowthPassWidgetProps {
  language: Language;
  onNavigateShop?: () => void;
  playSfx?: (url: string) => void;
}

export const GrowthPassWidget: React.FC<GrowthPassWidgetProps> = ({
  language,
  onNavigateShop,
  playSfx,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [claimedDays, setClaimedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('hero_growth_pass_claimed_days');
      return saved ? JSON.parse(saved) : [1];
    } catch {
      return [1];
    }
  });
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_growth_pass_premium') === 'true';
    } catch {
      return false;
    }
  });

  const isKo = language === 'ko';
  const currentDay = Math.min(7, claimedDays.length + 1);
  const hasUnclaimed = claimedDays.length < 7;

  const handleClaim = (day: number) => {
    if (claimedDays.includes(day)) return;
    const next = [...claimedDays, day];
    setClaimedDays(next);
    localStorage.setItem('hero_growth_pass_claimed_days', JSON.stringify(next));

    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    // SNS 보상 지급
    const bonus = isPremium ? 400 : 200;
    const cur = parseInt(localStorage.getItem('hero_sns') || '500', 10);
    localStorage.setItem('hero_sns', String(cur + bonus));
    window.dispatchEvent(new Event('hero_sns_updated'));
  };

  const handleBuyPremium = () => {
    setIsPremium(true);
    localStorage.setItem('hero_growth_pass_premium', 'true');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  return (
    <>
      {/* 로비 노출형 위젯 카드 */}
      <div className="w-full bg-[#ffffff] border border-[#201d1d]/15 p-3.5 font-mono shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Award size={18} className="text-indigo-600" />
              {hasUnclaimed && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-[#201d1d] flex items-center gap-1.5">
                <span>{isKo ? '7일 신규 영웅 성장 패스' : '7-Day Hero Growth Pass'}</span>
                {isPremium && (
                  <span className="px-1 py-0.2 bg-purple-600 text-white text-[9px] font-bold rounded-xs">
                    PREMIUM
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[#201d1d]/60">
                {isKo ? `진행도: ${claimedDays.length}/7일 완주 • 일일 배틀 승리 시 언락` : `Progress: ${claimedDays.length}/7 Days`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="px-2.5 py-1 text-xs font-bold bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isKo ? '패스 열기' : 'View Pass'}</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* 패스 상세 모달 */}
      {isOpenModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/80 backdrop-blur-xs font-mono select-none">
          <div className="relative w-full max-w-md bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/30 rounded-none shadow-2xl p-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2.5 mb-3">
              <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-indigo-600" />
                <span>{isKo ? '[7일 신규 영웅 성장 배틀패스]' : '[7-DAY HERO GROWTH PASS]'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* 프리미엄 업그레이드 배너 */}
            {!isPremium && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xs mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-purple-900 flex items-center gap-1">
                    <Sparkles size={13} className="text-purple-600" />
                    <span>{isKo ? '프리미엄 패스 업그레이드' : 'Premium Pass Upgrade'}</span>
                  </div>
                  <div className="text-[10px] text-purple-700">
                    {isKo ? '보상 2배 + SSR 선택권 즉시 증정 (1,200원)' : '2x Rewards + SSR Selector ($0.99)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBuyPremium}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-xs cursor-pointer shadow-xs"
                >
                  {isKo ? '1,200원 구매' : 'Buy $0.99'}
                </button>
              </div>
            )}

            {/* 7일간의 보상 트랙 */}
            <div className="space-y-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isClaimed = claimedDays.includes(day);
                const canClaim = day <= currentDay && !isClaimed;

                return (
                  <div
                    key={day}
                    className={`p-2.5 border rounded-xs flex items-center justify-between text-xs ${
                      isClaimed
                        ? 'bg-stone-100 border-stone-300 text-stone-500'
                        : canClaim
                        ? 'bg-white border-[#201d1d] shadow-xs'
                        : 'bg-stone-50 border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[11px] min-w-[36px]">Day {day}</span>
                      <span className="font-semibold">
                        {day === 7
                          ? (isKo ? '👑 SSR 확정 카드팩' : '👑 SSR Guaranteed Pack')
                          : (isKo ? `+${day * 50} SNS 코인 & 룬 재료` : `+${day * 50} SNS & Runes`)}
                      </span>
                    </div>

                    <div>
                      {isClaimed ? (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check size={12} /> {isKo ? '수령됨' : 'Claimed'}
                        </span>
                      ) : canClaim ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(day)}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xs cursor-pointer animate-pulse"
                        >
                          {isKo ? '수령' : 'Claim'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                          <Lock size={10} /> {isKo ? '잠김' : 'Locked'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-2 border-t border-[#201d1d]/10">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-xs cursor-pointer hover:bg-stone-800"
              >
                {isKo ? '닫기' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

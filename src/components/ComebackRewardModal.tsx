import React, { useState } from 'react';
import { X, Sparkles, Gift, Zap, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface ComebackRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onClaimFree: (retroCoins: number) => void;
  onBuyPackage: () => void;
  playSfx?: (url: string) => void;
}

export const ComebackRewardModal: React.FC<ComebackRewardModalProps> = ({
  isOpen,
  onClose,
  language,
  onClaimFree,
  onBuyPackage,
  playSfx,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimed, setClaimed] = useState(false);

  if (!isOpen) return null;

  const isKo = language === 'ko';

  const handleClaimFree = () => {
    if (isProcessing || claimed) return;
    setIsProcessing(true);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    onClaimFree(1500); // 7일간 미수령 출석 기본 소급 코인
    setClaimed(true);
    setIsProcessing(false);
  };

  const handleBuy = () => {
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    onBuyPackage();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/30 rounded-none shadow-2xl p-5 text-left overflow-hidden">
        {/* 상단 뱃지 & 닫기 */}
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2 mb-3">
          <div className="inline-block px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold uppercase tracking-wider">
            {isKo ? '[ 웰컴백 스페셜 케어 ]' : '[ WELCOME BACK SPECIAL ]'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 타이틀 */}
        <div className="mb-4">
          <h3 className="text-sm font-black tracking-tight text-[#201d1d]">
            {isKo ? '오랜만에 돌아오신 지휘관님을 환영합니다!' : 'Welcome Back, Commander!'}
          </h3>
          <p className="text-[11px] text-[#201d1d]/60 mt-1 leading-relaxed">
            {isKo
              ? '미접속 기간(3일 이상) 동안 놓친 지난 7일간의 출석 및 일일 미션 보상을 전액 소급 지원합니다.'
              : 'Retroactively claim missed 7-day attendance & mission rewards during your absence.'}
          </p>
        </div>

        {/* 무료 소급 보상 카드 */}
        <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-sm mb-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
            <span className="flex items-center gap-1.5">
              <Gift size={13} className="text-amber-700" />
              <span>{isKo ? '미수령 소급 정산 지원금' : 'Retroactive Compensation'}</span>
            </span>
            <span className="text-amber-800">+1,500 SNS</span>
          </div>
          <button
            type="button"
            onClick={handleClaimFree}
            disabled={claimed}
            className={`w-full py-1.5 text-xs font-bold rounded-xs cursor-pointer transition-colors ${
              claimed
                ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
            }`}
          >
            {claimed
              ? (isKo ? '[ 수령 완료 ]' : '[ CLAIMED ]')
              : (isKo ? '[ 무료 소급 보상 즉시 받기 ]' : '[ CLAIM RETRO REWARDS ]')}
          </button>
        </div>

        {/* 1,000원 컴백 웰컴백 패키지 */}
        <div className="p-3.5 bg-[#201d1d]/5 border border-[#201d1d]/20 rounded-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-900">
              <Sparkles size={14} className="text-purple-600" />
              <span>{isKo ? '컴백 한정 웰컴백 패키지' : 'Comeback Deluxe Bundle'}</span>
            </div>
            <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-xs">
              80% OFF
            </span>
          </div>

          <div className="text-[11px] text-[#201d1d]/75 space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>{isKo ? '복귀자 전용 SSR 카드 즉시 선택권 x1' : 'Returnee SSR Selector Card x1'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>{isKo ? '미수령 재화 100% 전액 복구 (+5,000 SNS)' : '100% Missed Rewards Full Recovery (+5,000 SNS)'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>{isKo ? '당일 한정 50% 할인 가챠 쿠폰 증정' : 'Today 50% Off Gacha Coupon'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBuy}
            className="w-full py-2 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            <span>{isKo ? '1,000원 즉시 구매 (100 SNS)' : 'Buy Now ($0.99 / 100 SNS)'}</span>
          </button>
        </div>

        {/* 푸터 닫기 */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-[#201d1d]/50 hover:text-[#201d1d] underline cursor-pointer"
          >
            {isKo ? '다음에 하기' : 'Maybe Later'}
          </button>
        </div>
      </div>
    </div>
  );
};

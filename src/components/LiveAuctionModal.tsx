import React, { useState, useEffect } from 'react';
import { X, Gavel, Sparkles, Clock, Flame, ArrowRight, ShieldCheck } from 'lucide-react';
import { CardData, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { getCardSpriteStyle } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';

interface LiveAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentSns: number;
  onBidSuccess: (bidAmount: number) => void;
  onEmergencyRecharge: () => void;
  playSfx?: (url: string) => void;
}

export const LiveAuctionModal: React.FC<LiveAuctionModalProps> = ({
  isOpen,
  onClose,
  language,
  currentSns,
  onBidSuccess,
  onEmergencyRecharge,
  playSfx,
}) => {
  const [currentBid, setCurrentBid] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('hero_auction_current_bid')) || 1200;
    } catch {
      return 1200;
    }
  });
  const [timeLeftSec, setTimeLeftSec] = useState<number>(360); // 6분 잔여

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isKo = language === 'ko';
  const auctionCard = CARD_DATABASE[101]; // 신화급 카드 #101
  const spriteStyle = getCardSpriteStyle(101);

  const minNextBid = currentBid + 100;
  const canAfford = currentSns >= minNextBid;

  const handleBid = () => {
    if (!canAfford) {
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('victory');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    const nextBid = minNextBid;
    setCurrentBid(nextBid);
    localStorage.setItem('hero_auction_current_bid', String(nextBid));

    // 종료 1분 미만일 때 1분 자동 연장 (Anti-Snipe)
    if (timeLeftSec < 60) {
      setTimeLeftSec(120);
    }

    onBidSuccess(nextBid);
  };

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border-2 border-amber-600 rounded-none shadow-2xl p-5 text-left overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-900">
            <Gavel size={14} />
            <span>{isKo ? '[24H 실시간 라이브 옥션]' : '[24H LIVE AUCTION]'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 옥션 대상 카드 */}
        <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-sm mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xs border-2 border-amber-600 shrink-0 shadow-sm"
              style={spriteStyle}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-amber-700 font-bold uppercase">MYTHIC CARD #101</div>
              <div className="text-xs font-black text-[#201d1d] truncate">
                {isKo ? auctionCard?.title : auctionCard?.title_en}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-1">
                <Clock size={11} />
                <span>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
                {timeLeftSec < 60 && (
                  <span className="text-[9px] bg-rose-600 text-white px-1 py-0.2 rounded-xs animate-pulse">
                    연장됨
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 현재 최고 입찰가 */}
        <div className="p-3 bg-[#201d1d]/5 border border-[#201d1d]/15 rounded-xs space-y-1 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-[#201d1d]/60 font-bold">{isKo ? '현재 최고 입찰가:' : 'Current Bid:'}</span>
            <span className="text-amber-800 font-black">{currentBid.toLocaleString()} SNS</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#201d1d]/60 font-bold">{isKo ? '다음 최소 입찰가:' : 'Min Next Bid:'}</span>
            <span className="text-indigo-700 font-black">{minNextBid.toLocaleString()} SNS</span>
          </div>
          <div className="flex justify-between text-[11px] pt-1 border-t border-[#201d1d]/10">
            <span className="text-[#201d1d]/60">{isKo ? '내 보유 SNS:' : 'My Balance:'}</span>
            <span className={canAfford ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
              {currentSns.toLocaleString()} SNS
            </span>
          </div>
        </div>

        {/* 입찰 또는 긴급 코인 충전 */}
        <div className="space-y-2">
          {canAfford ? (
            <button
              type="button"
              onClick={handleBid}
              className="w-full min-h-[44px] py-2.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              <span>{isKo ? `[ ${minNextBid.toLocaleString()} SNS 즉시 입찰하기 ]` : `[ Place Bid (${minNextBid} SNS) ]`}</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] text-rose-600 text-center font-bold">
                {isKo ? '보유 코인이 부족하여 입찰할 수 없습니다.' : 'Insufficient SNS balance.'}
              </div>
              <button
                type="button"
                onClick={() => {
                  onEmergencyRecharge();
                  onClose();
                }}
                className="w-full min-h-[44px] py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{isKo ? '[ 긴급 코인 보충 팩 구매 (1,000원 = 1,200 SNS) ]' : '[ Emergency Coin Pack ($0.99) ]'}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-[11px] text-[#201d1d]/50 hover:text-[#201d1d] py-1 cursor-pointer"
          >
            {isKo ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

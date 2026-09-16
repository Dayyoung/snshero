import React, { useState } from 'react';
import { X, Sparkles, Zap, Shield, Gift, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';
import { useSns } from '../contexts/SnsContext';
import { CARD_DATABASE } from '../cardDatabase';

interface StarterPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onPurchased?: () => void;
}

export const StarterPackModal: React.FC<StarterPackModalProps> = ({
  isOpen,
  onClose,
  language,
  onPurchased,
}) => {
  const { addSns } = useSns();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (isProcessing || isSuccess) return;
    setIsProcessing(true);
    triggerHaptic('heavy');
    playSfx('click');

    // Simulate fast 1-click payment verification
    setTimeout(() => {
      // 1. Grant 3,000 SNS Coin
      addSns(3000, 'starter_pack_1000won', 'earned');

      // 2. Grant SSR Epic Hero Card to inventory
      try {
        const savedCardsRaw = localStorage.getItem('hero_user_cards_v1');
        let currentCards = savedCardsRaw ? JSON.parse(savedCardsRaw) : [];
        const ssrCard = CARD_DATABASE[51] || CARD_DATABASE[101] || CARD_DATABASE[1];
        if (ssrCard && !currentCards.some((c: any) => c.imageIndex === 51)) {
          currentCards.unshift({
            id: `ssr-starter-${Date.now()}`,
            title_dis: ssrCard.title_dis || '용맹의 기사단장',
            title_en: ssrCard.title_en || 'Grand Paladin',
            stats: ssrCard.stats || [9, 8, 9, 8],
            imageIndex: ssrCard.id || 51,
            rarity: 'SSR',
            level: 1,
            owner: 'user',
            obtainedAt: new Date().toISOString()
          });
          localStorage.setItem('hero_user_cards_v1', JSON.stringify(currentCards));
        }
      } catch (err) {
        console.error('Failed to grant starter card:', err);
      }

      // 3. Mark starter pack as purchased
      localStorage.setItem('hero_starter_pack_purchased', 'true');
      window.dispatchEvent(new Event('hero_starter_pack_purchased_event'));

      setIsProcessing(false);
      setIsSuccess(true);
      playSfx('reward');
      triggerHaptic('heavy');

      if (onPurchased) {
        onPurchased();
      }
    }, 900);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#fdfcfc] border border-[rgba(15,0,0,0.2)] rounded-none shadow-2xl overflow-hidden font-mono text-[#201d1d]"
        >
          {/* Top Hairline & Tag */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />

          {/* Close button */}
          <button
            onClick={() => {
              playSfx('click');
              onClose();
            }}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-[rgba(15,0,0,0.15)] bg-white text-slate-600 hover:bg-slate-100 hover:text-black rounded-sm transition cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Header Title */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black tracking-wider border border-rose-200 uppercase">
                <Sparkles size={11} className="text-rose-600" />
                {language === 'ko' ? '[첫 충전 한정 93% 특가]' : '[FIRST PURCHASE 93% OFF]'}
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                {language === 'ko' ? '1,000원 스타터 패키지' : '₩1,000 Starter Package'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ko'
                  ? '신규 영웅 사령관을 위한 파격 혜택! 첫 결제 1회 한정으로 최강 전력을 보장합니다.'
                  : 'Massive early-game advantage! 1-time exclusive offer for new commanders.'}
              </p>
            </div>

            {/* Package Contents Showcase */}
            <div className="grid grid-cols-1 gap-2.5 bg-slate-50 border border-[rgba(15,0,0,0.08)] p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black shadow-xs shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900">
                    {language === 'ko' ? '👑 SSR 최고 등급 확정 소환권 1장' : '👑 Guaranteed SSR Hero Card'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'ko' ? '전투력 90+ 정예 카드 즉시 지급' : 'Instant 90+ Combat Power Epic Hero'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black shadow-xs shrink-0">
                  <Gift size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900">
                    {language === 'ko' ? '💎 3,000 SNS 코인' : '💎 3,000 SNS Coins'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'ko' ? '상점 10연속 카드팩 즉시 소환 가능' : 'Enough for 10x Card Summon Packs'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black shadow-xs shrink-0">
                  <Zap size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900">
                    {language === 'ko' ? '⚡ AP 완충 에너지 물약 5개' : '⚡ AP Energy Potions x5'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'ko' ? '스태미나 걱정 없는 무한 배틀 가능' : 'Non-stop arena battles guaranteed'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white font-black shadow-xs shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900">
                    {language === 'ko' ? '🛡️ 대군략가 골든 카드 슬리브' : '🛡️ Grand Strategist Sleeve'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'ko' ? '한정판 황금 프레임 스킨 해금' : 'Exclusive gold foil deck cosmetic'}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200">
              <div>
                <span className="text-[10px] text-slate-400 line-through mr-1">₩15,000</span>
                <span className="text-base font-black text-rose-600">₩1,000</span>
                <span className="text-[10px] ml-1.5 px-1 bg-rose-600 text-white font-bold">[93% OFF]</span>
              </div>
              <div className="text-[10px] font-bold text-amber-900">
                {language === 'ko' ? '계정당 1회 한정' : '1 per Account'}
              </div>
            </div>

            {/* Action CTA */}
            {isSuccess ? (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-center rounded-sm">
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800">
                    <Check size={16} className="text-emerald-600" />
                    {language === 'ko' ? '구매 및 보상 수령 완료!' : 'Payment & Rewards Completed!'}
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {language === 'ko'
                      ? '3,000 SNS 및 SSR 영웅 카드가 덱/인벤토리에 지급되었습니다.'
                      : '3,000 SNS & SSR Hero Card added to your deck inventory.'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full h-11 bg-[#201d1d] hover:bg-slate-800 text-white font-black text-xs rounded-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {language === 'ko' ? '[ 로비로 돌아가기 ]' : '[ Return to Lobby ]'}
                </button>
              </div>
            ) : (
              <button
                disabled={isProcessing}
                onClick={handlePurchase}
                className="w-full h-12 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:brightness-110 active:scale-98 text-white font-black text-sm rounded-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ko' ? '안전 결제 처리 중...' : 'Processing Secure 1-Click...'}
                  </span>
                ) : (
                  <>
                    <span>{language === 'ko' ? '1,000원으로 즉시 획득하기' : 'Claim Now for ₩1,000'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}

            <div className="text-[10px] text-slate-400 text-center">
              {language === 'ko'
                ? '* 즉시 100% 로컬스토리지에 영구 보존되며 원클릭 시뮬레이션 결제로 진행됩니다.'
                : '* Permanently saved to LocalStorage with instantaneous 1-click fulfillment.'}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

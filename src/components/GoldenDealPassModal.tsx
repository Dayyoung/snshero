import React, { useState } from 'react';
import { Bell, Flame, Sparkles, Check, X, ShieldCheck, Zap, CreditCard } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { playSfx } from '../lib/sound';
import type { Language } from '../types';

interface GoldenDealPassModalProps {
  language: Language;
  onSubscribe: () => void;
  onClose: () => void;
}

export const GoldenDealPassModal: React.FC<GoldenDealPassModalProps> = ({
  language,
  onSubscribe,
  onClose,
}) => {
  const isKo = language === 'ko';
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuy = () => {
    setIsProcessing(true);
    triggerHaptic('heavy');
    setTimeout(() => {
      setIsSubscribed(true);
      playSfx('reward');
      onSubscribe();
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[10080] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-sm bg-[#161313] border-2 border-amber-400 rounded-2xl p-5 text-white font-mono shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-xs bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <Flame size={11} />
            VIP PASS
          </span>
          <span className="text-xs font-black text-amber-300">
            {isKo ? '황금 특가 급매 알림 구독 패스' : 'GOLDEN DEAL ALERT PASS'}
          </span>
        </div>

        <div className="p-3.5 bg-gradient-to-b from-amber-950/30 to-slate-900 border border-amber-500/40 rounded-xl space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
              <Bell size={24} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                {isKo ? '급매 매물 실시간 즉시 포착' : 'Realtime Fire-Sale Alerts'}
              </h4>
              <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                {isKo
                  ? '시장 적정가 대비 30% 이상 저렴한 헐값 매물 등록 시 1초 만에 알림!'
                  : 'Instant push notification when items are listed 30%+ below fair price!'}
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-white/5 rounded-lg space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              <span>{isKo ? '거래소 수수료 50% 영구 감면' : '50% Market Fee Discount'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>{isKo ? '1-Tap 원클릭 흥정 자동 승인권' : '1-Tap Instant Bargain Pass'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {isKo ? '월간 정기 구독 (언제든 해지 가능)' : 'Monthly Pass (Cancel anytime)'}
            </span>
            <span className="text-sm font-black text-amber-300">
              ₩1,900 / {isKo ? '월' : 'mo'}
            </span>
          </div>
        </div>

        {isSubscribed ? (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-center flex items-center justify-center gap-2">
            <Check size={18} className="text-emerald-400" />
            <span className="text-xs font-black">
              {isKo ? '구독 활성화 완료! 특가 알림이 시작됩니다.' : 'Subscribed! Alerts Active.'}
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleBuy}
            className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
          >
            <CreditCard size={15} />
            <span>{isKo ? '₩1,900 구독 시작하기' : 'Subscribe for ₩1,900'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, X, Check, Zap, Percent, CreditCard, Flame } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { playSfx } from '../lib/sound';
import type { Language } from '../types';

interface VipTraderPassModalProps {
  language: Language;
  onSubscribe: () => void;
  onClose: () => void;
}

export const VipTraderPassModal: React.FC<VipTraderPassModalProps> = ({
  language,
  onSubscribe,
  onClose,
}) => {
  const isKo = language === 'ko';
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBuy = () => {
    setIsProcessing(true);
    triggerHaptic('heavy');
    setTimeout(() => {
      setIsSuccess(true);
      playSfx('reward');
      onSubscribe();
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[10080] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-sm bg-[#161313] border-2 border-indigo-500 rounded-2xl p-5 text-white font-mono shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
          <span className="px-2 py-0.5 rounded-xs bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <Percent size={11} />
            TRADER VIP
          </span>
          <span className="text-xs font-black text-indigo-300">
            {isKo ? 'VIP 트레이더 패스 & 스탑로스 보험' : 'VIP TRADER PASS'}
          </span>
        </div>

        <div className="p-3.5 bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-xl space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-300 shrink-0">
              <ShieldCheck size={26} className="text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                {isKo ? '매도 수수료 50% 영구 감면' : '50% Trading Fee Cut'}
              </h4>
              <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                {isKo
                  ? '모든 가상 코인/주식 매도 시 거래 수수료를 즉시 절반으로 줄여줍니다.'
                  : 'Instantly cuts trading fees by 50% on all token sales.'}
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-white/5 rounded-lg space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-amber-400" />
              <span>{isKo ? '폭락 방어: 자동 손절 스탑로스(Stop-Loss) 무료' : 'Free Auto Stop-Loss Crash Protection'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame size={12} className="text-rose-400" />
              <span>{isKo ? '실시간 30FPS WebGL 차트 고속 프리셋' : 'Real-time 30FPS High Speed Chart'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {isKo ? '월간 멤버십 (언제든 취소 가능)' : 'Monthly Pass (Cancel anytime)'}
            </span>
            <span className="text-sm font-black text-indigo-300">
              ₩1,500 / {isKo ? '월' : 'mo'}
            </span>
          </div>
        </div>

        {isSuccess ? (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-center flex items-center justify-center gap-2">
            <Check size={18} className="text-emerald-400" />
            <span className="text-xs font-black">
              {isKo ? 'VIP 패스 가입 완료! 혜택이 적용됩니다.' : 'VIP Pass Activated!'}
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleBuy}
            className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
          >
            <CreditCard size={15} />
            <span>{isKo ? '₩1,500 VIP 트레이더 시작하기' : 'Subscribe for ₩1,500'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Rocket, ShieldCheck, Sparkles, X, Check, Zap, CreditCard, Flame } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { playSfx } from '../lib/sound';
import type { Language } from '../types';

interface PredictionBoosterModalProps {
  language: Language;
  onApplyBooster: (type: 'multiplier' | 'insurance') => void;
  onClose: () => void;
}

export const PredictionBoosterModal: React.FC<PredictionBoosterModalProps> = ({
  language,
  onApplyBooster,
  onClose,
}) => {
  const isKo = language === 'ko';
  const [successType, setSuccessType] = useState<'multiplier' | 'insurance' | null>(null);

  const handleBuy = (type: 'multiplier' | 'insurance') => {
    triggerHaptic('heavy');
    setSuccessType(type);
    playSfx('reward');
    onApplyBooster(type);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[10080] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-sm bg-[#151212] border-2 border-amber-400 rounded-2xl p-5 text-white font-mono shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
            PREDICTION BOOST
          </span>
          <span className="text-xs font-black text-amber-300">
            {isKo ? '승부 예측 부스터 & 보험' : 'BETTING BOOSTER & INSURANCE'}
          </span>
        </div>

        <div className="space-y-3">
          {/* 1.5x Multiplier Ticket */}
          <div className="p-3 bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket size={18} className="text-amber-400" />
                <span className="text-xs font-black text-white">
                  {isKo ? '배당률 1.5배 부스터 티켓' : '1.5x Odds Multiplier'}
                </span>
              </div>
              <span className="text-xs font-black text-amber-300">₩500</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              {isKo ? '적중 시 최종 수령 당첨금을 1.5배로 추가 뻥튀기 지급합니다.' : 'Boosts your final win payout by 1.5x upon victory.'}
            </p>
            <button
              type="button"
              onClick={() => handleBuy('multiplier')}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
            >
              {isKo ? '1.5배 부스터 적용 (₩500)' : 'Apply 1.5x Booster (₩500)'}
            </button>
          </div>

          {/* 50% Payback Insurance */}
          <div className="p-3 bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-400" />
                <span className="text-xs font-black text-white">
                  {isKo ? '50% 원금 안심 페이백 보험' : '50% Payback Insurance'}
                </span>
              </div>
              <span className="text-xs font-black text-blue-300">₩300</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              {isKo ? '예측 실패 시 베팅한 SNS 포인트의 50%를 즉시 금고로 환급합니다.' : 'Refunds 50% of your bet points if prediction fails.'}
            </p>
            <button
              type="button"
              onClick={() => handleBuy('insurance')}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-black text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
            >
              {isKo ? '안심 보험 가입 (₩300)' : 'Apply Insurance (₩300)'}
            </button>
          </div>
        </div>

        {successType && (
          <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-center text-xs font-black flex items-center justify-center gap-1.5 animate-in zoom-in-95">
            <Check size={16} />
            <span>{isKo ? '부스터가 현재 베팅에 성공적으로 적용되었습니다!' : 'Booster successfully applied!'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

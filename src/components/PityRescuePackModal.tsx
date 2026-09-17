import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldAlert, Timer, X, Check, Zap, Flame, CreditCard } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { playSfx } from '../lib/sound';
import { cn } from '../lib/utils';
import type { Language } from '../types';

interface PityRescuePackModalProps {
  language: Language;
  pityCount: number;
  maxPity: number;
  onPurchase: () => void;
  onClose: () => void;
}

export const PityRescuePackModal: React.FC<PityRescuePackModalProps> = ({
  language,
  pityCount,
  maxPity = 30,
  onPurchase,
  onClose,
}) => {
  const isKo = language === 'ko';
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour countdown
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pityPercent = Math.min(100, Math.round((pityCount / maxPity) * 100));

  const handleBuy = () => {
    setIsProcessing(true);
    triggerHaptic('heavy');
    setTimeout(() => {
      setIsPurchased(true);
      playSfx('reward');
      onPurchase();
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[10080] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-sm bg-[#161313] border-2 border-amber-400 rounded-2xl p-5 text-white font-mono shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-xs bg-red-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
            <Flame size={11} />
            TIME DEAL
          </span>
          <span className="text-xs font-black text-amber-300">
            {isKo ? '천장 구제 타임어택 패키지' : 'PITY RESCUE TIME DEAL'}
          </span>
        </div>

        {/* Pity Progress Visualization */}
        <div className="p-3 bg-slate-900 border border-white/10 rounded-xl space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldAlert size={14} className="text-amber-400" />
              {isKo ? '현재 천장 게이지' : 'Current Pity Gauge'}
            </span>
            <span className="text-amber-300 font-black">
              {pityCount} / {maxPity} ({pityPercent}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-300"
              style={{ width: `${pityPercent}%` }}
            />
          </div>

          <p className="text-[10px] text-amber-200/90 leading-snug">
            {isKo
              ? `🔥 천장 달성까지 단 ${Math.max(1, maxPity - pityCount)}회! 지금 5연차 패키지로 즉시 확정 소환하세요.`
              : `🔥 Only ${Math.max(1, maxPity - pityCount)} draws left until pity! Guarantee your SSR with this 5x pack.`}
          </p>
        </div>

        {/* Product Box */}
        <div className="p-3.5 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-black text-white">
              {isKo ? '천장 보장 5연차 스페셜 팩' : 'Pity Guaranteed 5x Pack'}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
              <Timer size={12} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <ul className="text-[11px] text-slate-300 space-y-1">
            <li className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400 shrink-0" />
              <span>{isKo ? 'SSR 확정 소환권 1장 포함' : 'Includes 1 Guaranteed SSR Ticket'}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Zap size={13} className="text-yellow-400 shrink-0" />
              <span>{isKo ? '소환석 500개 + 천장 마일리지 즉시 적립' : '500 Summon Stones + Instant Pity'}</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 line-through">₩12,000</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-black">-79%</span>
              <span className="text-base font-black text-amber-300">₩2,500</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isPurchased ? (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-center flex items-center justify-center gap-2">
            <Check size={18} className="text-emerald-400" />
            <span className="text-xs font-black">
              {isKo ? '천장 보장 패키지 지급 완료!' : 'Rescue Pack Claimed!'}
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
            <span>{isKo ? '₩2,500 1-Tap 즉시 결제' : '₩2,500 1-Tap Purchase'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

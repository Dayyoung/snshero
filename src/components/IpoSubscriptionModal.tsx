/**
 * IpoSubscriptionModal.tsx - SCR-06-15
 * 신규 캐릭터 'IPO 청약 페스티벌' 공모 모달 및 골든 청약 프리미엄 팩
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, TrendingUp, Award, X, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface IpoSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSns: number;
  onSubscribe: (shares: number, isPremium: boolean) => void;
  language?: string;
}

export const IpoSubscriptionModal: React.FC<IpoSubscriptionModalProps> = ({
  isOpen,
  onClose,
  userSns,
  onSubscribe,
  language = 'ko',
}) => {
  const [shares, setShares] = useState(10);
  const [isPremium, setIsPremium] = useState(false);

  if (!isOpen) return null;

  const ipoPrice = 120; // 공모가 120 SNS
  const totalCost = shares * ipoPrice;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-400 rounded-2xl p-5 text-white shadow-2xl relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-400/40">
              <Sparkles size={20} />
            </span>
            <div>
              <span className="text-[10px] text-amber-400 font-bold block">3일 한정 신규 상장 공모</span>
              <h2 className="text-sm font-black text-amber-300 uppercase">
                🎉 {language === 'ko' ? 'IPO 청약 페스티벌' : 'IPO Festival'}
              </h2>
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 my-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">공모 종목</span>
              <span className="font-bold text-white">#042 성검의 계승자 아르카</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">확정 공모가</span>
              <span className="font-black text-emerald-400">120 SNS / 주</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">현재 청약 경쟁률</span>
              <span className="font-bold text-rose-400">42.8 : 1</span>
            </div>
          </div>

          {/* 청약 수량 선택 */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">청약 신청 수량</span>
              <span className="font-black text-amber-400">{shares}주 ({totalCost} SNS)</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 20, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setShares(num)}
                  className={`py-1.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                    shares === num
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {num}주
                </button>
              ))}
            </div>
          </div>

          {/* 골든 IPO 프리미엄 팩 토글 */}
          <div
            onClick={() => setIsPremium(!isPremium)}
            className={`p-3 rounded-xl border-2 transition-all cursor-pointer mb-4 ${
              isPremium
                ? 'bg-amber-500/20 border-amber-400 shadow-md'
                : 'bg-slate-800/60 border-slate-700 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <div>
                  <span className="text-xs font-black text-amber-300 block">
                    {language === 'ko' ? '골든 IPO 프리미엄 배정권' : 'Golden IPO Pass'}
                  </span>
                  <span className="text-[10px] text-slate-300">경쟁률 5배 우대 & 100% 최소 1주 배정</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPremium}
                onChange={() => {}}
                className="w-4 h-4 accent-amber-400 pointer-events-none"
              />
            </div>
          </div>

          {/* 청약 실행 버튼 */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onSubscribe(shares, isPremium);
              onClose();
            }}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <TrendingUp size={16} />
            <span>
              {language === 'ko'
                ? `${totalCost} SNS로 청약 신청 완료 (48px)`
                : `Subscribe for ${totalCost} SNS`}
            </span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

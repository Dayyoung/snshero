/**
 * WeeklyRivalClashModal.tsx - SCR-11-27
 * 중위권 유저 대상 '주간 라이벌 매칭(Rival Clash)' 시스템: 점수가 유사한 3명을 주간 라이벌로 지정하여
 * 추격 승리 시 명예 포인트 및 연승 칭호 보상 지급, 라이벌 격파 성공 시 전용 '라이벌 격파 패키지(2,200원)' 기간 한정 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Swords, Trophy, Sparkles, Zap, X, Check, Target } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface RivalTarget {
  id: string;
  name: string;
  ratingScore: number;
  isDefeated: boolean;
  rewardHonorPoints: number;
}

interface WeeklyRivalClashModalProps {
  isOpen: boolean;
  onClose: () => void;
  rivals: RivalTarget[];
  onChallengeRival: (rivalId: string) => void;
  onBuyRivalDefeatPackage: () => void;
}

export const WeeklyRivalClashModal: React.FC<WeeklyRivalClashModalProps> = ({
  isOpen,
  onClose,
  rivals,
  onChallengeRival,
  onBuyRivalDefeatPackage,
}) => {
  const [hasBoughtPackage, setHasBoughtPackage] = useState(() => {
    return localStorage.getItem('hero_rival_defeat_pack') === 'purchased';
  });

  const defeatedCount = rivals.filter((r) => r.isDefeated).length;

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('medium');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_rival_defeat_pack', 'purchased');
    setHasBoughtPackage(true);
    onBuyRivalDefeatPackage();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-rose-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Swords size={16} />
            <span>[ 주간 라이벌 매칭 (RIVAL CLASH) ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black text-amber-400">
                주간 라이벌 격파 현황: {defeatedCount} / {rivals.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              비슷한 실력의 라이벌을 격파하고 명예 포인트와 한정 칭호를 쟁취하세요.
            </p>
          </div>

          {/* 3 Rival Cards */}
          <div className="w-full space-y-2">
            {rivals.map((rival) => (
              <div
                key={rival.id}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-left"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">{rival.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {rival.ratingScore} MMR
                    </span>
                  </div>
                  <span className="text-[9px] text-amber-400 block mt-0.5">
                    격파 보상: 명예 포인트 +{rival.rewardHonorPoints}P
                  </span>
                </div>

                {rival.isDefeated ? (
                  <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Check size={12} /> 격파완료
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('heavy');
                      onChallengeRival(rival.id);
                    }}
                    className="h-8 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl active:scale-95 cursor-pointer shadow"
                  >
                    도전하기
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Rival Defeat Package (2,200 KRW / 220 SNS) */}
          <div className="w-full p-3 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <Trophy size={13} /> 라이벌 격파 패키지
              </span>
              <span className="text-[9px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30">
                격파 특별 할인
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              명예 코인 1,000개 + 연승 칭호 [절대자] + 프리미엄 팩 티켓 2장 (2,200원 / 220 SNS)
            </p>
            <div className="flex justify-end pt-1">
              {hasBoughtPackage ? (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <Check size={14} /> 구매 완료
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleBuy}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-lg active:scale-95 cursor-pointer shadow"
                >
                  구매하기
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};

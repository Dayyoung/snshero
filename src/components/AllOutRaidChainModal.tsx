/**
 * AllOutRaidChainModal.tsx - SCR-09-27
 * 보스 그로기 타임 동안 동시 협공으로 콤보 배율을 5배까지 증폭하는 '길드 합체 총공격(All-Out Raid Chain)' 피버 시스템,
 * 토벌 시 전원 공유 '길드 승리 전리품 상자' 및 토벌 기념 '기여도 더블 부스터 팩(3,300원)' 기간 한정 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, Trophy, Sparkles, Gift, Zap, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface AllOutRaidChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  comboCount: number;
  currentMultiplier: number;
  isDefeated: boolean;
  onAllOutTap: () => void;
  onClaimVictoryChest: () => void;
  onBuyContributionBooster: () => void;
}

export const AllOutRaidChainModal: React.FC<AllOutRaidChainModalProps> = ({
  isOpen,
  onClose,
  comboCount,
  currentMultiplier,
  isDefeated,
  onAllOutTap,
  onClaimVictoryChest,
  onBuyContributionBooster,
}) => {
  const [hasBoughtBooster, setHasBoughtBooster] = useState(() => {
    return localStorage.getItem('hero_guild_contribution_booster') === 'active';
  });
  const [chestClaimed, setChestClaimed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('heavy');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTap = () => {
    triggerHaptic('heavy');
    onAllOutTap();
  };

  const handleClaim = () => {
    triggerHaptic('heavy');
    setChestClaimed(true);
    onClaimVictoryChest();
  };

  const handleBuyBooster = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_guild_contribution_booster', 'active');
    setHasBoughtBooster(true);
    onBuyContributionBooster();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Flame size={16} />
            <span>
              {isDefeated ? '[ 보스 토벌 완료: 길드 승리 전리품 ]' : '[ 길드 합체 총공격 (ALL-OUT CHAIN) ]'}
            </span>
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
          {!isDefeated ? (
            /* All-Out Fever Tapping State */
            <>
              <div className="text-4xl animate-bounce">⚡💥⚡</div>
              <div>
                <h3 className="text-sm font-black text-white">그로기 피버: 길드원 연타 협공!</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  버튼을 빠르게 연타하여 콤보 배율을 <strong className="text-amber-400">최대 5.0x</strong>까지 높이세요!
                </p>
              </div>

              {/* Multiplier Display */}
              <div className="w-full bg-slate-900 border border-amber-500/60 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-[10px] text-slate-400">현재 합체 콤보</span>
                <span className="text-3xl font-black text-amber-400 my-0.5">{comboCount} COMBO</span>
                <span className="text-xs font-black text-cyan-400">
                  대미지 배율: x{currentMultiplier.toFixed(1)}배 증폭
                </span>
              </div>

              {/* Big Tap Button (52px) */}
              <button
                type="button"
                onClick={handleTap}
                className="h-13 w-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-90 shadow-xl"
              >
                <Zap size={20} />
                <span>합체 연타 공격! (ALL-OUT SMASH)</span>
              </button>
            </>
          ) : (
            /* Victory Boss Defeated State */
            <>
              <div className="text-4xl animate-pulse">🎁👑</div>
              <div>
                <h3 className="text-sm font-black text-white">길드 레이드 보스 토벌 성공!</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  길드원 모두에게 길드 승리 전리품 상자가 지급됩니다.
                </p>
              </div>

              {/* Claim Chest Button */}
              {chestClaimed ? (
                <div className="w-full p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                  <Check size={16} />
                  <span>전리품 상자 수령 완료 (+300 골드, 마나석 10개)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg"
                >
                  <Gift size={16} />
                  <span>전리품 상자 열기 (OPEN CHEST)</span>
                </button>
              )}

              {/* Contribution Double Booster Pack (3,300 KRW / 330 SNS) */}
              <div className="w-full p-3 bg-slate-900 border border-amber-500/40 rounded-xl text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <Trophy size={14} /> 기여도 더블 부스터 팩
                  </span>
                  <span className="text-[9px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30">
                    토벌 기념 한정
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  다음 레이드 기여도 점수 2배 적립 및 길드 코인 500개 즉시 지급 (3,300원 / 330 SNS)
                </p>
                <div className="flex justify-end pt-1">
                  {hasBoughtBooster ? (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check size={14} /> 활성화됨
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBuyBooster}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-lg active:scale-95 cursor-pointer shadow"
                    >
                      구매하기
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

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

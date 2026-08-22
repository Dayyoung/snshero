import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, Coins, CheckCircle, RotateCcw, ArrowRight, Grid, Shield, Zap, Flame } from 'lucide-react';
import { RewardReceipt } from '../lib/standardizedRewardGateway';

interface VictoryRewardModalProps {
  receipt: RewardReceipt;
  language: string;
  onPlayAgain: () => void;
  onExit: () => void;
  onNextMission?: () => void;
}

export const VictoryRewardModal: React.FC<VictoryRewardModalProps> = ({
  receipt,
  language,
  onPlayAgain,
  onExit,
  onNextMission
}) => {
  const isKo = language === 'ko';
  const [animatedSns, setAnimatedSns] = useState<number>(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState<boolean>(false);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1800; // 1.8 seconds count-up

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeProgress * receipt.totalSns);
      setAnimatedSns(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setIsAnimationComplete(true);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [receipt.totalSns]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#201d1d]/85 flex items-center justify-center p-4 font-mono select-none backdrop-blur-xs">
      <div className="bg-[#fdfcfc] text-[#201d1d] border-2 border-[#201d1d] w-full max-w-md p-5 flex flex-col justify-between shadow-2xl relative">
        {/* Top Header Banner */}
        <div className="text-center border-b border-[#201d1d]/20 pb-3">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-600/30 px-2.5 py-1 text-xs font-bold text-amber-900 mb-2">
            <Trophy size={14} className="text-amber-700 fill-amber-500" />
            <span>{isKo ? '★ MISSION COMPLETED ★' : '★ MISSION COMPLETED ★'}</span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
            {receipt.gameTitle}
          </h2>
          <p className="text-[11px] text-[#201d1d]/70">
            {isKo ? '100% 확정 SNS 포인트 즉시 정산 완료' : '100% Guaranteed SNS Points Settled'}
          </p>
        </div>

        {/* Big Animated Reward Display */}
        <div className="my-4 p-4 bg-[#201d1d]/5 border-2 border-[#201d1d] text-center relative overflow-hidden">
          <div className="text-xs font-bold text-[#201d1d]/70 uppercase tracking-wider mb-1">
            {isKo ? '최종 지급된 SNS 포인트' : 'TOTAL SETTLED SNS POINTS'}
          </div>
          <div className="text-3xl sm:text-4xl font-black text-amber-900 flex items-center justify-center gap-2">
            <Coins size={30} className="text-amber-600" />
            <span>+{animatedSns.toLocaleString()} SNS</span>
          </div>

          <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-500/15 border border-emerald-600/30 px-2 py-0.5">
            <CheckCircle size={12} className="text-emerald-700" />
            <span>
              {isKo ? '유저 지갑 즉시 입금 완료 (Wallet Deposited)' : 'Instant Wallet Deposit Confirmed'}
            </span>
          </div>
        </div>

        {/* Itemized Settlement Breakdown */}
        <div className="space-y-1.5 bg-[#fdfcfc] border border-[#201d1d]/20 p-3 text-[11px] mb-4">
          <div className="text-[11px] font-bold text-[#201d1d] border-b border-[#201d1d]/15 pb-1 flex justify-between">
            <span>{isKo ? '정산 세부 항목' : 'Settlement Breakdown'}</span>
            <span className="text-[#201d1d]/60 text-[10px]">~50P/MIN STANDARD</span>
          </div>

          <div className="flex justify-between text-[#201d1d]/80 pt-1">
            <span>{isKo ? '• 플레이 시간 기본 보상' : '• Base Duration Reward'}</span>
            <span className="font-bold">+{receipt.baseReward} SNS</span>
          </div>

          {receipt.scoreBonus > 0 && (
            <div className="flex justify-between text-[#201d1d]/80">
              <span>{isKo ? '• 스코어 달성 보너스' : '• Score Achievement Bonus'}</span>
              <span className="font-bold text-amber-800">+{receipt.scoreBonus} SNS</span>
            </div>
          )}

          {receipt.timeBonus > 0 && (
            <div className="flex justify-between text-[#201d1d]/80">
              <span>{isKo ? '• 스피드런 / 타임 보너스' : '• Speedrun Time Bonus'}</span>
              <span className="font-bold text-emerald-800">+{receipt.timeBonus} SNS</span>
            </div>
          )}

          {receipt.perfectBonus > 0 && (
            <div className="flex justify-between text-[#201d1d]/80">
              <span>{isKo ? '• 퍼펙트 / 콤보 보너스' : '• Perfect / Combo Bonus'}</span>
              <span className="font-bold text-purple-800">+{receipt.perfectBonus} SNS</span>
            </div>
          )}

          {receipt.skillMultiplier > 1.0 && (
            <div className="flex justify-between text-[#201d1d]/80">
              <span>{isKo ? '• 난이도 배율 (Difficulty)' : '• Difficulty Multiplier'}</span>
              <span className="font-bold">{receipt.skillMultiplier}x</span>
            </div>
          )}

          <div className="border-t border-[#201d1d]/20 pt-1.5 mt-1 flex justify-between font-bold text-[#201d1d]">
            <span>{isKo ? '현재 총 보유 잔액 (New Balance)' : 'Wallet Total Balance'}</span>
            <span className="text-amber-950">{receipt.newBalance.toLocaleString()} SNS</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {onNextMission && (
            <button
              type="button"
              onClick={onNextMission}
              className="w-full py-2.5 px-4 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{isKo ? '다음 미션 도전하기' : 'Next Mission'}</span>
              <ArrowRight size={14} />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPlayAgain}
              className="py-2.5 px-3 border-2 border-[#201d1d] text-[#201d1d] hover:bg-[#201d1d]/10 text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>{isKo ? '다시 도전' : 'Play Again'}</span>
            </button>

            <button
              type="button"
              onClick={onExit}
              className="py-2.5 px-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Grid size={13} />
              <span>{isKo ? '미션 로비로' : 'Mission Lobby'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

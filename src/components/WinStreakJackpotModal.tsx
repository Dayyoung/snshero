import React, { useState } from 'react';
import { X, Trophy, Sparkles, Shield, Flame, RotateCw } from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface WinStreakJackpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  streakCount: number;
  mode: 'jackpot' | 'shield_rescue';
  onSpinJackpot?: (reward: string) => void;
  onBuyShield?: () => void;
  playSfx?: (url: string) => void;
}

export const WinStreakJackpotModal: React.FC<WinStreakJackpotModalProps> = ({
  isOpen,
  onClose,
  language,
  streakCount,
  mode,
  onSpinJackpot,
  onBuyShield,
  playSfx,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const isKo = language === 'ko';

  const rewards = [
    { label: '+500 SNS 코인', en: '+500 SNS Coins', color: 'text-amber-600' },
    { label: 'SSR 카드 소환권 x1', en: 'SSR Summon Ticket x1', color: 'text-purple-600' },
    { label: '연승 쉴드 티켓 x2', en: 'Streak Shield x2', color: 'text-blue-600' },
    { label: '+1,000 SNS 잭팟', en: '+1,000 SNS Jackpot', color: 'text-rose-600' },
  ];

  const handleSpin = () => {
    if (isSpinning || spinResult) return;
    setIsSpinning(true);
    triggerHaptic('medium');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setTimeout(() => {
      const chosen = rewards[Math.floor(Math.random() * rewards.length)];
      setSpinResult(isKo ? chosen.label : chosen.en);
      setIsSpinning(false);
      triggerHaptic('victory');
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      onSpinJackpot?.(chosen.label);
    }, 1500);
  };

  const handleRescue = () => {
    triggerHaptic('victory');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    onBuyShield?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/30 rounded-none shadow-2xl p-5 text-center overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            {mode === 'jackpot' ? (
              <>
                <Flame size={14} className="text-amber-500 fill-amber-500" />
                <span>{isKo ? `[ ${streakCount}연승 잭팟 룰렛 ]` : `[ ${streakCount} WIN STREAK JACKPOT ]`}</span>
              </>
            ) : (
              <>
                <Shield size={14} className="text-rose-500" />
                <span>{isKo ? '[ 연승 보호 긴급 쉴드 ]' : '[ STREAK RESCUE SHIELD ]'}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {mode === 'jackpot' ? (
          <div className="py-4 space-y-4">
            <div className="text-sm font-black text-amber-700">
              {isKo ? `🔥 축하합니다! ${streakCount}연승 신기록 달성!` : `🔥 Amazing! ${streakCount} Streak Milestone!`}
            </div>
            <p className="text-[11px] text-[#201d1d]/60">
              {isKo
                ? '황금 잭팟 럭키 룰렛을 무료로 돌리고 특별 보상을 획득하세요.'
                : 'Spin the Lucky Wheel for free to win exclusive bonus rewards.'}
            </p>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-sm min-h-[90px] flex items-center justify-center">
              {spinResult ? (
                <div className="space-y-1 animate-fadeIn">
                  <div className="text-xs font-bold text-[#201d1d]/60">{isKo ? '당첨 보상' : 'You Won'}</div>
                  <div className="text-base font-black text-purple-700">{spinResult}</div>
                </div>
              ) : isSpinning ? (
                <div className="flex flex-col items-center gap-2">
                  <RotateCw size={24} className="text-amber-600 animate-spin" />
                  <span className="text-xs font-bold text-amber-900 animate-pulse">
                    {isKo ? '룰렛 회전 중...' : 'Spinning...'}
                  </span>
                </div>
              ) : (
                <div className="text-xs font-bold text-[#201d1d]/70">
                  {isKo ? '준비 완료! 아래 버튼을 탭하세요.' : 'Ready! Tap button to spin.'}
                </div>
              )}
            </div>

            {spinResult ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-xs cursor-pointer"
              >
                {isKo ? '[ 보상 수령 및 확인 ]' : '[ Claim & Close ]'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xs cursor-pointer shadow-xs active:scale-[0.99] transition-all"
              >
                {isKo ? '[ 무료 잭팟 룰렛 돌리기 ]' : '[ SPIN LUCKY WHEEL ]'}
              </button>
            )}
          </div>
        ) : (
          /* 연승 종료 위기 시 구제 모달 */
          <div className="py-3 space-y-3">
            <div className="text-sm font-black text-rose-700">
              {isKo ? `아쉽게 패배했습니다! (${streakCount}연승 종료 위기)` : `Defeat! Your ${streakCount}-streak is at risk!`}
            </div>
            <p className="text-[11px] text-[#201d1d]/60 leading-relaxed">
              {isKo
                ? '지금 연승 쉴드 티켓을 사용하면 연승 기록이 보존되고 즉시 무료 재대결이 가능합니다.'
                : 'Use a Streak Shield Ticket now to preserve your streak and retry immediately.'}
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1 text-rose-900">
                  <Shield size={13} />
                  <span>{isKo ? '연승 쉴드 구제 패키지' : 'Streak Shield Rescue'}</span>
                </span>
                <span className="text-rose-700">500원 (50 SNS)</span>
              </div>
              <p className="text-[10px] text-rose-800 text-left">
                {isKo
                  ? '• 현재 연승 기록 완전 보존\n• 다음 판 전 속성 +1 영약 버프 포함'
                  : '• Streak preserved\n• Next match all stats +1 buff'}
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={handleRescue}
                className="w-full py-2.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-xs cursor-pointer shadow-xs"
              >
                {isKo ? '[ 연승 보존하고 즉시 부활 (500원) ]' : '[ Preserve Streak ($0.49) ]'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 text-stone-500 hover:text-stone-800 text-[11px] cursor-pointer"
              >
                {isKo ? '연승 초기화하고 퇴장' : 'Reset Streak & Exit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

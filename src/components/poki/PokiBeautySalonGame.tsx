import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiBeautySalonGameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  cardId?: number;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

export const PokiBeautySalonGame: React.FC<PokiBeautySalonGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [cleansed, setCleansed] = useState(false);
  const [lipstick, setLipstick] = useState(false);
  const [earring, setEarring] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const applyStep = (step: 'clean' | 'lip' | 'ear') => {
    if (step === 'clean') setCleansed(true);
    if (step === 'lip') setLipstick(true);
    if (step === 'ear') setEarring(true);

    if (playSfx) playSfx('/sfx/sparkle.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    const c = (step === 'clean' || cleansed) && (step === 'lip' || lipstick) && (step === 'ear' || earring);
    if (c) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokibeautysalon',
        gameTitle: isKo ? '뷰티 살롱 메이크오버' : 'Beauty Salon',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  const stepsDone = (cleansed ? 1 : 0) + (lipstick ? 1 : 0) + (earring ? 1 : 0);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '뷰티 살롱 메이크오버' : 'Beauty Salon'}
        currentScore={stepsDone}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`💄 Makeover: ${stepsDone}/3`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        {/* Model Avatar */}
        <div className="w-48 h-48 rounded-full bg-pink-950 border-4 border-pink-400 flex items-center justify-center text-7xl shadow-2xl relative">
          {cleansed ? '✨' : '🫧'}
          {lipstick && <span className="absolute bottom-6 text-3xl">💄</span>}
          {earring && <span className="absolute right-4 top-16 text-2xl">💎</span>}
        </div>

        {/* 3 Step Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            disabled={cleansed}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              cleansed ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => applyStep('clean')}
          >
            <span>1. 페이셜 딥 클렌징</span>
            <span>{cleansed ? '✅ 완료' : '진행 🧼'}</span>
          </button>
          <button
            disabled={lipstick}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              lipstick ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => applyStep('lip')}
          >
            <span>2. 로즈 립스틱 도포</span>
            <span>{lipstick ? '✅ 완료' : '진행 💄'}</span>
          </button>
          <button
            disabled={earring}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              earring ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => applyStep('ear')}
          >
            <span>3. 다이아 귀걸이 착용</span>
            <span>{earring ? '✅ 완료' : '진행 💎'}</span>
          </button>
        </div>
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardReceipt}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiBeautySalonGame;

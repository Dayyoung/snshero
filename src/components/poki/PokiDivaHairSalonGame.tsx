import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiDivaHairSalonGameProps {
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

export const PokiDivaHairSalonGame: React.FC<PokiDivaHairSalonGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [cutDone, setCutDone] = useState(false);
  const [washDone, setWashDone] = useState(false);
  const [dyeDone, setDyeDone] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const applyAction = (type: 'cut' | 'wash' | 'dye') => {
    if (type === 'cut') setCutDone(true);
    if (type === 'wash') setWashDone(true);
    if (type === 'dye') setDyeDone(true);

    if (playSfx) playSfx('/sfx/sparkle.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    const c = (type === 'cut' || cutDone) && (type === 'wash' || washDone) && (type === 'dye' || dyeDone);
    if (c) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokidivahairsalon',
        gameTitle: isKo ? '디바 헤어 살롱' : 'Diva Hair Salon',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  const stepsDone = (cutDone ? 1 : 0) + (washDone ? 1 : 0) + (dyeDone ? 1 : 0);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '디바 헤어 살롱' : 'Diva Hair Salon'}
        currentScore={stepsDone}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`✂️ Salon: ${stepsDone}/3`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        <div className="w-48 h-48 rounded-full bg-violet-950 border-4 border-violet-400 flex items-center justify-center text-7xl shadow-2xl relative">
          <span>👩</span>
          {dyeDone && <span className="absolute top-2 text-3xl">🎀</span>}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            disabled={cutDone}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              cutDone ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => applyAction('cut')}
          >
            <span>1. 정밀 가위 컷트</span>
            <span>{cutDone ? '✅ 완료' : '진행 ✂️'}</span>
          </button>
          <button
            disabled={washDone}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              washDone ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => applyAction('wash')}
          >
            <span>2. 아로마 샴푸 버블</span>
            <span>{washDone ? '✅ 완료' : '진행 🫧'}</span>
          </button>
          <button
            disabled={dyeDone}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              dyeDone ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => applyAction('dye')}
          >
            <span>3. 로열 바이올렛 염색</span>
            <span>{dyeDone ? '✅ 완료' : '진행 🎨'}</span>
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

export default PokiDivaHairSalonGame;

import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiScaryTeacher3DGameProps {
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

export const PokiScaryTeacher3DGame: React.FC<PokiScaryTeacher3DGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [tackPrank, setTackPrank] = useState(false);
  const [saucePrank, setSaucePrank] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const doPrank = (type: 'tack' | 'sauce') => {
    if (type === 'tack') setTackPrank(true);
    if (type === 'sauce') setSaucePrank(true);

    if (playSfx) playSfx('/sfx/laugh.mp3');
    if (navigator.vibrate) navigator.vibrate([30, 30]);

    const c = (type === 'tack' || tackPrank) && (type === 'sauce' || saucePrank);
    if (c) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokiscaryteacher3d',
        gameTitle: isKo ? '무서운 선생님 3D: 트릭 탈출' : 'Scary Teacher 3D',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  const prankCount = (tackPrank ? 1 : 0) + (saucePrank ? 1 : 0);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '무서운 선생님 3D: 트릭 탈출' : 'Scary Teacher 3D'}
        currentScore={prankCount}
        targetScore={2}
        onBack={handleExit}
        stageInfo={`🎭 Pranks: ${prankCount}/2`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        <div className="w-48 h-48 rounded-full bg-red-950 border-4 border-red-500 flex items-center justify-center text-7xl shadow-2xl relative">
          <span>👩‍🏫</span>
          {tackPrank && <span className="absolute bottom-2 text-3xl">📌</span>}
          {saucePrank && <span className="absolute top-2 text-3xl">🌶️</span>}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button
            disabled={tackPrank}
            className={`w-full p-5 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              tackPrank ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => doPrank('tack')}
          >
            <span>1. 소파에 압정 놓기</span>
            <span>{tackPrank ? '✅ 성공!' : '실행 📌'}</span>
          </button>
          <button
            disabled={saucePrank}
            className={`w-full p-5 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              saucePrank ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => doPrank('sauce')}
          >
            <span>2. 수프에 핫소스 붓기</span>
            <span>{saucePrank ? '✅ 성공!' : '실행 🌶️'}</span>
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

export default PokiScaryTeacher3DGame;

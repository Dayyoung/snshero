import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiSchoolCleaningGameProps {
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

export const PokiSchoolCleaningGame: React.FC<PokiSchoolCleaningGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [boardClean, setBoardClean] = useState(false);
  const [trashClean, setTrashClean] = useState(false);
  const [deskClean, setDeskClean] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const cleanStep = (type: 'board' | 'trash' | 'desk') => {
    if (type === 'board') setBoardClean(true);
    if (type === 'trash') setTrashClean(true);
    if (type === 'desk') setDeskClean(true);

    if (playSfx) playSfx('/sfx/sparkle.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    const c = (type === 'board' || boardClean) && (type === 'trash' || trashClean) && (type === 'desk' || deskClean);
    if (c) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokischoolcleaning',
        gameTitle: isKo ? '스쿨 클리닝' : 'School Cleaning',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  const doneCount = (boardClean ? 1 : 0) + (trashClean ? 1 : 0) + (deskClean ? 1 : 0);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '스쿨 클리닝' : 'School Cleaning'}
        currentScore={doneCount}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`🧹 Cleaned: ${doneCount}/3`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        <div className="w-52 h-64 rounded-3xl bg-emerald-950 border-4 border-emerald-400 flex flex-col items-center justify-center text-7xl shadow-2xl relative">
          <span>🏫</span>
          {boardClean && <span className="absolute top-2 text-3xl">✨</span>}
          {trashClean && <span className="absolute bottom-4 text-3xl">🗑️</span>}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            disabled={boardClean}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              boardClean ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => cleanStep('board')}
          >
            <span>1. 칠판 지우개로 닦기</span>
            <span>{boardClean ? '✅ 완료' : '닦기 🧼'}</span>
          </button>
          <button
            disabled={trashClean}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              trashClean ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => cleanStep('trash')}
          >
            <span>2. 바닥 쓰레기 줍기</span>
            <span>{trashClean ? '✅ 완료' : '줍기 🗑️'}</span>
          </button>
          <button
            disabled={deskClean}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              deskClean ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => cleanStep('desk')}
          >
            <span>3. 책상과 의자 줄 맞추기</span>
            <span>{deskClean ? '✅ 완료' : '정리 🪑'}</span>
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

export default PokiSchoolCleaningGame;

import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiDogsLifeGameProps {
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

export const PokiDogsLifeGame: React.FC<PokiDogsLifeGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [walks, setWalks] = useState(false);
  const [bone, setBone] = useState(false);
  const [ball, setBall] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const doAction = (type: 'walk' | 'bone' | 'ball') => {
    if (type === 'walk') setWalks(true);
    if (type === 'bone') setBone(true);
    if (type === 'ball') setBall(true);

    if (playSfx) playSfx('/sfx/bark.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    const c = (type === 'walk' || walks) && (type === 'bone' || bone) && (type === 'ball' || ball);
    if (c) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokidogslife',
        gameTitle: isKo ? '도그 라이프 어드벤처' : 'Dog Life',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  const tasksDone = (walks ? 1 : 0) + (bone ? 1 : 0) + (ball ? 1 : 0);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '도그 라이프 어드벤처' : 'Dog Life'}
        currentScore={tasksDone}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`🐶 Happy Tasks: ${tasksDone}/3`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        <div className="w-48 h-48 rounded-full bg-amber-950 border-4 border-amber-400 flex items-center justify-center text-7xl shadow-2xl relative">
          <span>🐶</span>
          {bone && <span className="absolute bottom-2 text-3xl">🦴</span>}
          {ball && <span className="absolute top-2 text-3xl">🎾</span>}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            disabled={walks}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              walks ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => doAction('walk')}
          >
            <span>1. 공원 산책하기</span>
            <span>{walks ? '✅ 완료' : '진행 🌳'}</span>
          </button>
          <button
            disabled={bone}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              bone ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => doAction('bone')}
          >
            <span>2. 뼈다귀 간식 먹기</span>
            <span>{bone ? '✅ 완료' : '진행 🦴'}</span>
          </button>
          <button
            disabled={ball}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              ball ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => doAction('ball')}
          >
            <span>3. 테니스공 물어오기</span>
            <span>{ball ? '✅ 완료' : '진행 🎾'}</span>
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

export default PokiDogsLifeGame;

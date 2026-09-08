import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiFashionLegendsGameProps {
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

export const PokiFashionLegendsGame: React.FC<PokiFashionLegendsGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [poses, setPoses] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const strikePose = useCallback(() => {
    const next = poses + 1;
    setPoses(next);
    if (playSfx) playSfx('/sfx/sparkle.mp3');
    if (navigator.vibrate) navigator.vibrate(25);

    if (next >= 4) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokifashionlegends',
        gameTitle: isKo ? '패션 레전드: 캣워크' : 'Fashion Legends',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  }, [isKo, onReward, playSfx, poses]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '패션 레전드: 캣워크' : 'Fashion Legends'}
        currentScore={poses}
        targetScore={4}
        onBack={handleExit}
        stageInfo={`👠 Catwalk Poses: ${poses}/4`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-8">
        <div className="w-56 h-64 rounded-3xl bg-purple-950 border-4 border-purple-400 flex flex-col items-center justify-center text-7xl shadow-2xl">
          {poses === 0 ? '🚶‍♀️' : poses === 1 ? '💃' : poses === 2 ? '👡' : '👑'}
        </div>

        <button
          className="w-full h-20 bg-purple-600 active:bg-purple-500 border-2 border-purple-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={strikePose}
        >
          {isKo ? '캣워크 포즈 취하기! 🌟' : 'STRIKE A POSE! 🌟'}
        </button>
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

export default PokiFashionLegendsGame;

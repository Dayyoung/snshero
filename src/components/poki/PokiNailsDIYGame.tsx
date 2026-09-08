import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiNailsDIYGameProps {
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

export const PokiNailsDIYGame: React.FC<PokiNailsDIYGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [paintedNails, setPaintedNails] = useState([false, false, false, false, false]);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const paintNail = (idx: number) => {
    if (paintedNails[idx]) return;
    const next = [...paintedNails];
    next[idx] = true;
    setPaintedNails(next);

    if (playSfx) playSfx('/sfx/sparkle.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    if (next.every(Boolean)) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokinailsdiy',
        gameTitle: isKo ? '네일 DIY: 살롱 아트' : 'Nails DIY',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  const count = paintedNails.filter(Boolean).length;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '네일 DIY: 살롱 아트' : 'Nails DIY'}
        currentScore={count}
        targetScore={5}
        onBack={handleExit}
        stageInfo={`💅 Painted: ${count}/5`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-8">
        {/* Hand with 5 Fingernails */}
        <div className="flex justify-center items-end gap-3 h-64 bg-slate-900 border-2 border-slate-700 p-6 rounded-3xl w-full">
          {paintedNails.map((painted, idx) => (
            <div
              key={idx}
              className={`w-12 rounded-t-full flex flex-col items-center justify-start pt-2 cursor-pointer transition-all ${
                painted ? 'bg-pink-500 scale-105 shadow-lg border-2 border-white' : 'bg-slate-700 active:scale-95'
              }`}
              style={{ height: `${120 + (idx === 2 ? 35 : idx === 1 || idx === 3 ? 20 : 0)}px` }}
              onClick={() => paintNail(idx)}
            >
              <span className="text-xs">{painted ? '✨' : '💅'}</span>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-pink-300">
          {isKo ? '각 손톱을 차례로 탭하여 눈부신 네일 아트를 완성하세요!' : 'Tap each fingernail to paint and complete nail art!'}
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

export default PokiNailsDIYGame;

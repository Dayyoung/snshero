import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiAnycolorGameProps {
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

export const PokiAnycolorGame: React.FC<PokiAnycolorGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [sections, setSections] = useState(Array(6).fill('#1e293b'));
  const [selectedColor, setSelectedColor] = useState('#ec4899');
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const palette = ['#ec4899', '#38bdf8', '#facc15', '#a855f7', '#22c55e'];

  const colorSection = (idx: number) => {
    const next = [...sections];
    next[idx] = selectedColor;
    setSections(next);

    if (playSfx) playSfx('/sfx/paint.mp3');
    if (navigator.vibrate) navigator.vibrate(15);

    if (next.every(c => c !== '#1e293b')) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokianycolor',
        gameTitle: isKo ? '애니컬러: 팝 아트' : 'Anycolor: Pop Art',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  const filledCount = sections.filter(c => c !== '#1e293b').length;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '애니컬러: 팝 아트' : 'Anycolor'}
        currentScore={filledCount}
        targetScore={6}
        onBack={handleExit}
        stageInfo={`🎨 Filled: ${filledCount}/6`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        {/* Pop Art Geometric Canvas */}
        <div className="grid grid-cols-3 gap-3 bg-slate-900 border-2 border-slate-700 p-6 rounded-3xl w-full aspect-square">
          {sections.map((color, idx) => (
            <button
              key={idx}
              className="rounded-2xl border-2 border-slate-600 transition-all active:scale-95 shadow-md flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: color }}
              onClick={() => colorSection(idx)}
            >
              {color === '#1e293b' ? `${idx + 1}` : '✨'}
            </button>
          ))}
        </div>

        {/* Color Palette */}
        <div className="flex justify-center gap-3">
          {palette.map((c, idx) => (
            <button
              key={idx}
              className={`w-12 h-12 rounded-full border-2 transition-all ${
                selectedColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setSelectedColor(c)}
            />
          ))}
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

export default PokiAnycolorGame;

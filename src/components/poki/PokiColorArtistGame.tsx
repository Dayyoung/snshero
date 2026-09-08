import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiColorArtistGameProps {
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

export const PokiColorArtistGame: React.FC<PokiColorArtistGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [pixels, setPixels] = useState(Array(16).fill('#1e293b'));
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [coloredCount, setColoredCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#a855f7'];

  const paintPixel = (idx: number) => {
    const next = [...pixels];
    next[idx] = selectedColor;
    setPixels(next);

    const filled = next.filter(c => c !== '#1e293b').length;
    setColoredCount(filled);

    if (playSfx) playSfx('/sfx/paint.mp3');
    if (navigator.vibrate) navigator.vibrate(15);

    if (filled >= 16) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokicolorartist',
        gameTitle: isKo ? '컬러 아티스트: 픽셀 페인트' : 'Color Artist',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '컬러 아티스트: 픽셀 페인트' : 'Color Artist'}
        currentScore={coloredCount}
        targetScore={16}
        onBack={handleExit}
        stageInfo={`🎨 Pixels: ${coloredCount}/16`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        {/* 4x4 Pixel Canvas */}
        <div className="grid grid-cols-4 gap-2 bg-slate-900 border-2 border-slate-700 p-4 rounded-3xl w-full aspect-square">
          {pixels.map((color, idx) => (
            <button
              key={idx}
              className="rounded-xl border border-slate-600 transition-all active:scale-95 shadow-inner"
              style={{ backgroundColor: color }}
              onClick={() => paintPixel(idx)}
            />
          ))}
        </div>

        {/* Color Palette */}
        <div className="flex justify-center gap-3">
          {colors.map((c, idx) => (
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

export default PokiColorArtistGame;

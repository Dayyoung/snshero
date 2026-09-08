import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiGoodsMasterGameProps {
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

export const PokiGoodsMasterGame: React.FC<PokiGoodsMasterGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [items, setItems] = useState([
    { id: 1, type: '🍎', matched: false },
    { id: 2, type: '🍎', matched: false },
    { id: 3, type: '🍎', matched: false },
    { id: 4, type: '🥤', matched: false },
    { id: 5, type: '🥤', matched: false },
    { id: 6, type: '🥤', matched: false },
    { id: 7, type: '🍫', matched: false },
    { id: 8, type: '🍫', matched: false },
    { id: 9, type: '🍫', matched: false },
  ]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [clearedSets, setClearedSets] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const tapItem = (id: number) => {
    if (selectedIds.includes(id) || gameWon) return;

    const nextSelected = [...selectedIds, id];
    setSelectedIds(nextSelected);

    if (playSfx) playSfx('/sfx/tap.mp3');
    if (navigator.vibrate) navigator.vibrate(15);

    if (nextSelected.length === 3) {
      const selectedItems = items.filter(it => nextSelected.includes(it.id));
      const allSame = selectedItems.every(it => it.type === selectedItems[0].type);

      if (allSame) {
        // Clear 3 items
        const nextItems = items.map(it => nextSelected.includes(it.id) ? { ...it, matched: true } : it);
        setItems(nextItems);
        const nextCleared = clearedSets + 1;
        setClearedSets(nextCleared);
        setSelectedIds([]);
        if (playSfx) playSfx('/sfx/match.mp3');
        if (navigator.vibrate) navigator.vibrate([20, 20]);

        if (nextCleared >= 3) {
          setGameWon(true);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokigoodsmaster',
            gameTitle: isKo ? '굿즈 마스터 3D' : 'Goods Master',
            durationSeconds: 30,
            score: 1000,
            maxTargetScore: 1000,
            isVictory: true
          });
          setRewardReceipt(receipt);
          if (onReward) onReward(receipt.totalSns);
        }
      } else {
        setTimeout(() => setSelectedIds([]), 300);
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '굿즈 마스터' : 'Goods Master'}
        currentScore={clearedSets}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`🛒 Matched: ${clearedSets}/3 Sets`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        {/* Goods Shelf 3x3 */}
        <div className="grid grid-cols-3 gap-3 bg-slate-900 border-2 border-slate-700 p-4 rounded-3xl w-full">
          {items.map(it => {
            const isSelected = selectedIds.includes(it.id);

            return (
              <button
                key={it.id}
                disabled={it.matched}
                className={`h-24 rounded-2xl border-2 font-bold text-4xl flex items-center justify-center transition-all ${
                  it.matched
                    ? 'opacity-0 pointer-events-none'
                    : isSelected
                    ? 'bg-amber-600 border-amber-300 scale-105 shadow-xl'
                    : 'bg-slate-800 border-slate-600 active:scale-95 shadow-md'
                }`}
                onClick={() => tapItem(it.id)}
              >
                {it.type}
              </button>
            );
          })}
        </div>

        <div className="text-center text-xs text-amber-200">
          {isKo ? '동일한 상품 3개를 연속으로 탭하여 선반을 모두 비우세요!' : 'Tap 3 matching items to clear the shelf!'}
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

export default PokiGoodsMasterGame;

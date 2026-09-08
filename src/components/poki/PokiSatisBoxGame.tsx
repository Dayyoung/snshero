import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiSatisBoxGameProps {
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

interface Pencil {
  id: number;
  color: string;
  targetSlot: number;
  currentSlot: number;
}

export const PokiSatisBoxGame: React.FC<PokiSatisBoxGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [pencils, setPencils] = useState<Pencil[]>([
    { id: 1, color: '#ef4444', targetSlot: 0, currentSlot: 2 },
    { id: 2, color: '#f59e0b', targetSlot: 1, currentSlot: 0 },
    { id: 3, color: '#22c55e', targetSlot: 2, currentSlot: 3 },
    { id: 4, color: '#3b82f6', targetSlot: 3, currentSlot: 1 },
  ]);

  const [selectedPencilId, setSelectedPencilId] = useState<number | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const swapSlots = (targetSlot: number) => {
    if (selectedPencilId === null) return;
    const pList = [...pencils];
    const src = pList.find(p => p.id === selectedPencilId);
    const dest = pList.find(p => p.currentSlot === targetSlot);

    if (src && dest) {
      const temp = src.currentSlot;
      src.currentSlot = dest.currentSlot;
      dest.currentSlot = temp;
      setPencils(pList);
      setSelectedPencilId(null);

      if (playSfx) playSfx('/sfx/snap.mp3');
      if (navigator.vibrate) navigator.vibrate(20);

      const allCorrect = pList.every(p => p.currentSlot === p.targetSlot);
      if (allCorrect) {
        setGameWon(true);
        const receipt = calculateAndDepositMissionReward({
          gameId: 'pokisatisbox',
          gameTitle: isKo ? '새티스박스 정리 퍼즐' : 'SatisBox Mini Games',
          durationSeconds: 30,
          score: 1000,
          maxTargetScore: 1000,
          isVictory: true
        });
        setRewardReceipt(receipt);
        if (onReward) onReward(receipt.totalSns);
      }
    }
  };

  const correctCount = pencils.filter(p => p.currentSlot === p.targetSlot).length;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '새티스박스 정리 퍼즐' : 'SatisBox'}
        currentScore={correctCount}
        targetScore={4}
        onBack={handleExit}
        stageInfo={`✏️ Perfect: ${correctCount}/4`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        <div className="bg-slate-900 border-2 border-slate-700 p-6 rounded-3xl w-full shadow-2xl flex justify-around">
          {[0, 1, 2, 3].map(slot => {
            const p = pencils.find(it => it.currentSlot === slot);
            const isSelected = p?.id === selectedPencilId;

            return (
              <div
                key={slot}
                className={`w-14 h-64 rounded-2xl border-2 flex flex-col items-center justify-end pb-4 transition-all cursor-pointer ${
                  isSelected ? 'border-amber-400 bg-slate-800 scale-105 shadow-xl' : 'border-slate-700 bg-slate-950'
                }`}
                onClick={() => {
                  if (selectedPencilId === null && p) {
                    setSelectedPencilId(p.id);
                  } else {
                    swapSlots(slot);
                  }
                }}
              >
                {p && (
                  <div
                    className="w-8 rounded-full shadow-lg"
                    style={{
                      height: `${120 + p.targetSlot * 25}px`,
                      backgroundColor: p.color
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-slate-400">
          {isKo ? '연필을 탭하여 선택 후 다른 슬롯을 탭해 무지개 색상 순서(빨-주-초-파)로 정렬하세요!' : 'Tap to swap pencils in rainbow order (Red-Orange-Green-Blue)!'}
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

export default PokiSatisBoxGame;

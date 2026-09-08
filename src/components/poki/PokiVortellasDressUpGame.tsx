import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiVortellasDressUpGameProps {
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

export const PokiVortellasDressUpGame: React.FC<PokiVortellasDressUpGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [dress, setDress] = useState(false);
  const [cape, setCape] = useState(false);
  const [crown, setCrown] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const togglePart = (type: 'dress' | 'cape' | 'crown') => {
    if (type === 'dress') setDress(true);
    if (type === 'cape') setCape(true);
    if (type === 'crown') setCrown(true);

    if (playSfx) playSfx('/sfx/snap.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    const c = (type === 'dress' || dress) && (type === 'cape' || cape) && (type === 'crown' || crown);
    if (c) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokivortellasdressup',
        gameTitle: isKo ? '보르텔라 고딕 드레스업' : 'Vortella Gothic',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    }
  };

  const doneCount = (dress ? 1 : 0) + (cape ? 1 : 0) + (crown ? 1 : 0);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '보르텔라 고딕 드레스업' : 'Vortella Gothic'}
        currentScore={doneCount}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`🖤 Gothic: ${doneCount}/3`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        <div className="w-52 h-64 rounded-3xl bg-neutral-900 border-4 border-rose-600 flex flex-col items-center justify-center text-7xl shadow-2xl relative">
          <span>🧛‍♀️</span>
          {crown && <span className="absolute top-2 text-3xl">👑</span>}
          {cape && <span className="absolute bottom-4 text-3xl">🦇</span>}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            disabled={dress}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              dress ? 'bg-rose-950/60 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => togglePart('dress')}
          >
            <span>1. 블랙 레이스 가운</span>
            <span>{dress ? '✅ 착용' : '입히기 👗'}</span>
          </button>
          <button
            disabled={cape}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              cape ? 'bg-rose-950/60 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => togglePart('cape')}
          >
            <span>2. 박쥐 날개 망토</span>
            <span>{cape ? '✅ 착용' : '입히기 🦇'}</span>
          </button>
          <button
            disabled={crown}
            className={`w-full p-4 rounded-2xl border-2 font-bold text-base flex items-center justify-between transition-all ${
              crown ? 'bg-rose-950/60 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-600 active:scale-95'
            }`}
            onClick={() => togglePart('crown')}
          >
            <span>3. 루비 티아라</span>
            <span>{crown ? '✅ 착용' : '착용 👑'}</span>
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

export default PokiVortellasDressUpGame;

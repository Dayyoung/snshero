import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiSnapStyleDressUpGameProps {
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

export const PokiSnapStyleDressUpGame: React.FC<PokiSnapStyleDressUpGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [topIdx, setTopIdx] = useState(0);
  const [botIdx, setBotIdx] = useState(0);
  const [snapped, setSnapped] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const tops = ['👚 핑크 크롭탑', '🧥 시크 레더자켓', '👕 스트릿 후디'];
  const bottoms = ['👖 데님 와이드팬츠', '👗 플리츠 스커트', '🩳 조거 팬츠'];

  const takePhoto = useCallback(() => {
    setSnapped(true);
    setGameWon(true);
    if (playSfx) playSfx('/sfx/camera.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokisnapstyledressup',
      gameTitle: isKo ? '스냅스타일 드레스업' : 'SnapStyle Dress Up',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [isKo, onReward, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '스냅스타일 드레스업' : 'SnapStyle'}
        currentScore={snapped ? 1 : 0}
        targetScore={1}
        onBack={handleExit}
        stageInfo={`📸 Snap: ${snapped ? '1/1' : '0/1'}`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        {/* Photo Viewfinder */}
        <div className="w-56 h-72 rounded-3xl bg-slate-900 border-4 border-pink-400 flex flex-col items-center justify-center text-6xl shadow-2xl relative">
          <span>💃</span>
          <div className="text-sm font-bold text-pink-300 mt-4 flex flex-col items-center">
            <span>{tops[topIdx]}</span>
            <span>{bottoms[botIdx]}</span>
          </div>
          {snapped && <div className="absolute inset-0 bg-white/40 animate-ping rounded-3xl" />}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            className="p-3 bg-slate-800 active:bg-pink-700 border border-slate-600 rounded-xl text-xs font-bold flex justify-between"
            onClick={() => setTopIdx((topIdx + 1) % tops.length)}
          >
            <span>상의 변경</span>
            <span className="text-pink-300">{tops[topIdx]}</span>
          </button>
          <button
            className="p-3 bg-slate-800 active:bg-pink-700 border border-slate-600 rounded-xl text-xs font-bold flex justify-between"
            onClick={() => setBotIdx((botIdx + 1) % bottoms.length)}
          >
            <span>하의 변경</span>
            <span className="text-pink-300">{bottoms[botIdx]}</span>
          </button>
        </div>

        <button
          className="w-full h-18 bg-pink-600 active:bg-pink-500 border-2 border-pink-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={takePhoto}
        >
          📸 SNAP PHOTO!
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

export default PokiSnapStyleDressUpGame;

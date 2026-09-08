import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiSuperDressGameProps {
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

export const PokiSuperDressGame: React.FC<PokiSuperDressGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [dressIdx, setDressIdx] = useState(0);
  const [shoeIdx, setShoeIdx] = useState(0);
  const [accIdx, setAccIdx] = useState(0);
  const [score, setScore] = useState(60);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const dresses = ['👗 핑크 드레스', '✨ 골드 가운', '🖤 시크 블랙'];
  const shoes = ['👠 하이힐', '👢 가죽 부츠', '👟 스니커즈'];
  const accessories = ['👑 티아라', '🕶️ 선글라스', '👜 명품 백'];

  const judgeFashion = useCallback(() => {
    const total = 100;
    setScore(total);
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokisuperdress',
      gameTitle: isKo ? '슈퍼 드레스 패션쇼' : 'Super Dress',
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
        gameTitle={isKo ? '슈퍼 드레스 패션쇼' : 'Super Dress'}
        currentScore={score}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`👗 Fashion Score: ${score}/100`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full gap-6">
        {/* Runway Stage */}
        <div className="w-52 h-64 rounded-3xl bg-purple-950/60 border-2 border-purple-400 flex flex-col items-center justify-center text-6xl shadow-2xl relative">
          <span>💃</span>
          <div className="text-sm font-bold text-pink-300 mt-4 flex flex-col items-center">
            <span>{dresses[dressIdx]}</span>
            <span>{shoes[shoeIdx]}</span>
            <span>{accessories[accIdx]}</span>
          </div>
        </div>

        {/* Customization Selectors */}
        <div className="flex flex-col gap-3 w-full">
          <button
            className="p-3 bg-slate-800 active:bg-purple-700 border border-slate-600 rounded-xl text-xs font-bold flex justify-between"
            onClick={() => setDressIdx((dressIdx + 1) % dresses.length)}
          >
            <span>의상 변경</span>
            <span className="text-purple-300">{dresses[dressIdx]}</span>
          </button>
          <button
            className="p-3 bg-slate-800 active:bg-purple-700 border border-slate-600 rounded-xl text-xs font-bold flex justify-between"
            onClick={() => setShoeIdx((shoeIdx + 1) % shoes.length)}
          >
            <span>신발 변경</span>
            <span className="text-purple-300">{shoes[shoeIdx]}</span>
          </button>
          <button
            className="p-3 bg-slate-800 active:bg-purple-700 border border-slate-600 rounded-xl text-xs font-bold flex justify-between"
            onClick={() => setAccIdx((accIdx + 1) % accessories.length)}
          >
            <span>악세서리</span>
            <span className="text-purple-300">{accessories[accIdx]}</span>
          </button>
        </div>

        <button
          className="w-full h-16 bg-pink-600 active:bg-pink-500 border-2 border-pink-400 text-white font-bold text-lg rounded-2xl shadow-xl active:scale-95"
          onClick={judgeFashion}
        >
          {isKo ? '런웨이 출전 & 심사 받기!' : 'ENTER RUNWAY!'}
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

export default PokiSuperDressGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPetnestGameProps {
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

interface Pet {
  id: number;
  name: string;
  type: 'dog' | 'cat' | 'bunny';
  happiness: number;
}

export const PokiPetnestGame: React.FC<PokiPetnestGameProps> = ({
  onBack,
  onExit,
  onClose,
  deck = [],
  cardId,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 43;

  const [totalHappiness, setTotalHappiness] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    pets: [
      { id: 1, name: '댕댕이', type: 'dog', happiness: 20 },
      { id: 2, name: '냥냥이', type: 'cat', happiness: 30 },
      { id: 3, name: '토끼', type: 'bunny', happiness: 10 },
    ] as Pet[],
    activePetIdx: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokipetnest',
      gameTitle: isKo ? '펫네스트 동물 보호소' : 'Petnest.io',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const petAction = useCallback((type: 'feed' | 'pet' | 'wash') => {
    const s = gameState.current;
    const pet = s.pets[s.activePetIdx];
    pet.happiness = Math.min(100, pet.happiness + 25);

    const sum = Math.floor(s.pets.reduce((acc, p) => acc + p.happiness, 0) / 3);
    setTotalHappiness(sum);

    if (playSfx) playSfx('/sfx/heart.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    if (sum >= 95) {
      handleVictory();
    }
  }, [handleVictory, playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const s = gameState.current;
      const pet = s.pets[s.activePetIdx];

      // Pet Play Room
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, 110, canvas.width - 60, 360);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 110, canvas.width - 60, 360);

      // Pet Avatar
      const cx = canvas.width / 2;
      ctx.font = '64px monospace';
      ctx.textAlign = 'center';
      const icon = pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐰';
      ctx.fillText(icon, cx, 260);

      // Pet Happiness Bar
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 80, 310, 160, 14);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(cx - 80, 310, (pet.happiness / 100) * 160, 14);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`Happiness: ${pet.happiness}%`, cx, 345);

      ctx.textAlign = 'left';

      // Caretaker Card Sprite
      drawCardSprite(ctx, effectiveCardId, 50, 130, 48, 48);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '펫네스트 동물 보호소' : 'Petnest.io'}
        currentScore={totalHappiness}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`💖 Total: ${totalHappiness}%`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Pet Switch Tabs */}
      <div className="absolute top-20 inset-x-6 flex justify-center gap-3 z-20">
        {['🐶 댕댕이', '🐱 냥냥이', '🐰 토끼'].map((name, idx) => (
          <button
            key={idx}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              gameState.current.activePetIdx === idx ? 'bg-pink-600 border-white text-white' : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
            onClick={() => { gameState.current.activePetIdx = idx; }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Care Buttons */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center gap-3 z-20">
        <button
          className="flex-1 h-18 bg-amber-600 active:bg-amber-500 border border-amber-400 rounded-2xl text-white font-bold text-sm active:scale-95 shadow-lg"
          onClick={() => petAction('feed')}
        >
          🍖 사료 주기
        </button>
        <button
          className="flex-1 h-18 bg-pink-600 active:bg-pink-500 border border-pink-400 rounded-2xl text-white font-bold text-sm active:scale-95 shadow-lg"
          onClick={() => petAction('pet')}
        >
          💖 쓰다듬기
        </button>
        <button
          className="flex-1 h-18 bg-cyan-600 active:bg-cyan-500 border border-cyan-400 rounded-2xl text-white font-bold text-sm active:scale-95 shadow-lg"
          onClick={() => petAction('wash')}
        >
          🛁 목욕하기
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

export default PokiPetnestGame;

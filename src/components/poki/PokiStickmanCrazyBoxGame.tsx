import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanCrazyBoxGameProps {
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

export const PokiStickmanCrazyBoxGame: React.FC<PokiStickmanCrazyBoxGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 89;

  const [hits, setHits] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    totalHits: 0,
    targetHp: 100,
    punchAnim: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistickmancrazybox',
      gameTitle: isKo ? '스틱맨 크레이지 박스' : 'Stickman Crazy Box',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const punch = useCallback(() => {
    const s = gameState.current;
    s.punchAnim = 0.2;
    s.totalHits += 10;
    setHits(s.totalHits);

    if (playSfx) playSfx('/sfx/punch.mp3');
    if (navigator.vibrate) navigator.vibrate(25);

    if (s.totalHits >= 100) {
      handleVictory();
    }
  }, [handleVictory, playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon && s.punchAnim > 0) s.punchAnim -= dt;

      // Render Boxing Ring
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = 400;

      // Punching Bag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(cx + 40, cy - 80, 50, 100, 16);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Boxer Card Sprite
      drawCardSprite(ctx, effectiveCardId, cx - 60, cy - 60, 60, 60);

      // Glove
      if (s.punchAnim > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx + 40, cy - 20, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '스틱맨 크레이지 박스' : 'Crazy Box'}
        currentScore={hits}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`🥊 Power: ${hits}%`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Punch Action Button */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center z-20">
        <button
          className="w-full max-w-sm h-22 bg-rose-600 active:bg-rose-500 border-2 border-rose-400 text-white font-bold text-3xl rounded-3xl shadow-xl active:scale-95 transition-transform"
          onClick={punch}
        >
          CRAZY PUNCH! 🥊
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

export default PokiStickmanCrazyBoxGame;

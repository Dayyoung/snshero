import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCarnadoStuntGameProps {
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

export const PokiCarnadoStuntGame: React.FC<PokiCarnadoStuntGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 69;

  const [stunts, setStunts] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 60,
    py: 450,
    vx: 0,
    vy: 0,
    rotation: 0,
    isBoosting: false,
    stuntTotal: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicarnadostunt',
      gameTitle: isKo ? '카나도 스턴트 카' : 'Carnado Stunt Car',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const launchStunt = useCallback(() => {
    const s = gameState.current;
    s.vx = 280;
    s.vy = -380;
    if (playSfx) playSfx('/sfx/nitro.mp3');
    if (navigator.vibrate) navigator.vibrate([40, 40]);
  }, [playSfx]);

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

      if (!gameWon) {
        if (s.vx > 0) {
          s.vy += 500 * dt; // Gravity
          s.px += s.vx * dt;
          s.py += s.vy * dt;
          s.rotation += 6 * dt;

          if (s.py >= 450) {
            s.py = 450;
            s.vx = 0;
            s.vy = 0;
            s.rotation = 0;
            s.px = 60;
            s.stuntTotal++;
            setStunts(s.stuntTotal);
            if (navigator.vibrate) navigator.vibrate(30);

            if (s.stuntTotal >= 3) {
              handleVictory();
            }
          }
        }
      }

      // Render Stunt Track
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stunt Ramp
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(80, 470);
      ctx.lineTo(200, 360);
      ctx.lineTo(200, 470);
      ctx.closePath();
      ctx.fill();

      // Floor
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 470, canvas.width, canvas.height - 470);

      // Stunt Car
      ctx.save();
      ctx.translate(s.px, s.py);
      ctx.rotate(s.rotation);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(-25, -12, 50, 24, 6);
      ctx.fill();

      // Card Driver Sprite
      drawCardSprite(ctx, effectiveCardId, -16, -16, 32, 32);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '카나도 스턴트 카' : 'Carnado Stunt'}
        currentScore={stunts}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`🌪️ Stunts: ${stunts}/3`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Launch Button */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center z-20">
        <button
          className="w-full max-w-sm h-20 bg-amber-600 active:bg-amber-500 border-2 border-amber-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={launchStunt}
        >
          {isKo ? '스턴트 부스트 발사! 🚀' : 'NITRO STUNT! 🚀'}
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

export default PokiCarnadoStuntGame;

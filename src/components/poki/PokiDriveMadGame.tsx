import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDriveMadGameProps {
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

export const PokiDriveMadGame: React.FC<PokiDriveMadGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 35;

  const [dist, setDist] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 100,
    py: 380,
    vx: 0,
    vy: 0,
    angle: 0,
    wheelAngle: 0,
    isGas: false,
    isRev: false,
    cameraX: 0,
    finishX: 1800
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokidrivemad',
      gameTitle: isKo ? 'Drive Mad (드라이브 매드)' : 'Drive Mad',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const getBridgeY = (x: number) => {
    if (x > 400 && x < 700) {
      // Step hill
      return 360 - Math.sin((x - 400) * 0.01) * 50;
    }
    if (x > 900 && x < 1300) {
      // Bumpy blocks
      return 400 + Math.sin(x * 0.05) * 20;
    }
    return 400;
  };

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
        // Controls
        if (s.isGas) {
          s.vx = Math.min(260, s.vx + 350 * dt);
          s.wheelAngle += 8 * dt;
        } else if (s.isRev) {
          s.vx = Math.max(-150, s.vx - 350 * dt);
          s.wheelAngle -= 8 * dt;
        } else {
          s.vx *= 0.95;
        }

        s.px += s.vx * dt;
        setDist(Math.floor(s.px));

        const by = getBridgeY(s.px);
        s.py = by - 25;

        // Bridge slope angle
        const byNext = getBridgeY(s.px + 25);
        s.angle = Math.atan2(byNext - by, 25);

        s.cameraX += (s.px - canvas.width * 0.3 - s.cameraX) * 0.1;

        if (s.px >= s.finishX) {
          handleVictory();
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-s.cameraX, 0);

      // Bridge Blocks
      ctx.fillStyle = '#b45309';
      for (let x = 0; x < s.finishX + 400; x += 30) {
        const y = getBridgeY(x);
        ctx.fillRect(x, y, 28, 40);
      }

      // Finish Goal
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(s.finishX, 220, 20, 200);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('FINISH', s.finishX - 25, 200);

      // Monster Truck
      ctx.save();
      ctx.translate(s.px, s.py);
      ctx.rotate(s.angle);

      // Truck Body
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-30, -20, 60, 20);

      // Giant Wheels
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-22, 10, 16, 0, Math.PI * 2);
      ctx.arc(22, 10, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Driver Card Sprite
      drawCardSprite(ctx, effectiveCardId, -16, -42, 32, 32);

      ctx.restore();

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
        gameTitle={isKo ? 'Drive Mad (드라이브 매드)' : 'Drive Mad'}
        currentScore={dist}
        targetScore={1800}
        onBack={handleExit}
        stageInfo={`${dist}m / 1800m`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Touch Pedals */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20 pointer-events-none">
        <button
          className="pointer-events-auto flex-1 h-20 bg-slate-800/80 active:bg-blue-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-xl flex items-center justify-center backdrop-blur-md active:scale-95"
          onTouchStart={() => { gameState.current.isRev = true; }}
          onTouchEnd={() => { gameState.current.isRev = false; }}
          onMouseDown={() => { gameState.current.isRev = true; }}
          onMouseUp={() => { gameState.current.isRev = false; }}
        >
          ◀ REV
        </button>
        <button
          className="pointer-events-auto flex-1 h-20 bg-blue-600/80 active:bg-blue-500 text-white rounded-2xl border-2 border-blue-400 font-bold text-xl flex items-center justify-center backdrop-blur-md active:scale-95"
          onTouchStart={() => { gameState.current.isGas = true; }}
          onTouchEnd={() => { gameState.current.isGas = false; }}
          onMouseDown={() => { gameState.current.isGas = true; }}
          onMouseUp={() => { gameState.current.isGas = false; }}
        >
          GAS ▶
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

export default PokiDriveMadGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiGoingUpRooftopGameProps {
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

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PokiGoingUpRooftopGame: React.FC<PokiGoingUpRooftopGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 76;

  const [height, setHeight] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 480,
    vx: 0,
    vy: 0,
    isGrounded: false,
    inputLeft: false,
    inputRight: false,
    cameraY: 0,
    maxH: 0,
    platforms: [
      { x: 30, y: 510, w: 340, h: 20 },
      { x: 80, y: 410, w: 120, h: 16 },
      { x: 200, y: 310, w: 120, h: 16 },
      { x: 60, y: 210, w: 120, h: 16 },
      { x: 180, y: 110, w: 120, h: 16 },
      { x: 100, y: 0, w: 200, h: 20 }, // Helipad goal
    ] as Platform[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokigoinguprooftop',
      gameTitle: isKo ? '고잉 업! 루프탑 파쿠르' : 'Going Up! Rooftop',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const jump = useCallback(() => {
    const s = gameState.current;
    if (s.isGrounded) {
      s.vy = -14.5;
      s.isGrounded = false;
      if (playSfx) playSfx('/sfx/jump.mp3');
      if (navigator.vibrate) navigator.vibrate(20);
    }
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
        if (s.inputLeft) s.vx = -190;
        else if (s.inputRight) s.vx = 190;
        else s.vx *= 0.8;

        s.vy += 32 * 20 * dt;
        s.px += s.vx * dt;
        s.py += s.vy * dt;

        s.isGrounded = false;
        for (const p of s.platforms) {
          if (s.vy > 0 && s.px >= p.x - 15 && s.px <= p.x + p.w + 15 && s.py >= p.y - 5 && s.py <= p.y + 16) {
            s.py = p.y;
            s.vy = 0;
            s.isGrounded = true;
          }
        }

        const climbed = Math.max(0, Math.floor(510 - s.py));
        if (climbed > s.maxH) {
          s.maxH = climbed;
          setHeight(climbed);
        }

        s.cameraY += (canvas.height * 0.65 - s.py - s.cameraY) * 0.1;

        if (s.py <= 10) {
          handleVictory();
        }
      }

      // Render Rooftop City
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(0, s.cameraY);

      // Platforms
      for (const p of s.platforms) {
        ctx.fillStyle = p.y === 0 ? '#eab308' : '#334155';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 4);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (p.y === 0) {
          ctx.fillStyle = '#000';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('HELIPAD GOAL', p.x + 40, p.y + 15);
        }
      }

      // Parkour Runner Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 20, s.py - 40, 40, 40);

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
        gameTitle={isKo ? '고잉 업! 루프탑 파쿠르' : 'Going Up! Parkour'}
        currentScore={height}
        targetScore={510}
        onBack={handleExit}
        stageInfo={`🏢 Height: ${height}m / 510m`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* D-Pad Controls */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-4 z-20 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button
            className="w-20 h-20 bg-slate-800/80 active:bg-blue-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
            onTouchStart={() => { gameState.current.inputLeft = true; }}
            onTouchEnd={() => { gameState.current.inputLeft = false; }}
            onMouseDown={() => { gameState.current.inputLeft = true; }}
            onMouseUp={() => { gameState.current.inputLeft = false; }}
          >
            ◀
          </button>
          <button
            className="w-20 h-20 bg-slate-800/80 active:bg-blue-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
            onTouchStart={() => { gameState.current.inputRight = true; }}
            onTouchEnd={() => { gameState.current.inputRight = false; }}
            onMouseDown={() => { gameState.current.inputRight = true; }}
            onMouseUp={() => { gameState.current.inputRight = false; }}
          >
            ▶
          </button>
        </div>
        <button
          className="pointer-events-auto w-24 h-20 bg-blue-600 active:bg-blue-500 text-white rounded-2xl border-2 border-blue-400 font-bold text-xl flex items-center justify-center backdrop-blur-md"
          onClick={jump}
        >
          JUMP
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

export default PokiGoingUpRooftopGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCuboyAdventureGameProps {
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

interface Gem {
  x: number;
  y: number;
  collected: boolean;
}

export const PokiCuboyAdventureGame: React.FC<PokiCuboyAdventureGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 44;

  const [gems, setGems] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 60,
    py: 450,
    vx: 0,
    vy: 0,
    isGrounded: false,
    inputLeft: false,
    inputRight: false,
    gemsList: [
      { x: 140, y: 350, collected: false },
      { x: 260, y: 270, collected: false },
      { x: 120, y: 190, collected: false },
      { x: 300, y: 130, collected: false },
    ] as Gem[],
    platforms: [
      { x: 20, y: 500, w: 360, h: 20 },
      { x: 100, y: 390, w: 100, h: 16 },
      { x: 220, y: 310, w: 100, h: 16 },
      { x: 80, y: 230, w: 100, h: 16 },
      { x: 240, y: 170, w: 100, h: 16 },
    ]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicuboyadventure',
      gameTitle: isKo ? '큐보이 어드벤처' : 'Cuboy Adventure',
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
      s.vy = -14;
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
        if (s.inputLeft) s.vx = -180;
        else if (s.inputRight) s.vx = 180;
        else s.vx = 0;

        s.vy += 32 * 20 * dt; // Gravity
        s.px += s.vx * dt;
        s.py += s.vy * dt;

        // Platform collisions
        s.isGrounded = false;
        for (const p of s.platforms) {
          if (s.vy > 0 && s.px >= p.x - 15 && s.px <= p.x + p.w + 15 && s.py >= p.y - 5 && s.py <= p.y + 16) {
            s.py = p.y;
            s.vy = 0;
            s.isGrounded = true;
          }
        }

        // Collect gems
        for (const g of s.gemsList) {
          if (!g.collected && Math.hypot(s.px - g.x, s.py - g.y) < 25) {
            g.collected = true;
            const count = s.gemsList.filter(it => it.collected).length;
            setGems(count);
            if (playSfx) playSfx('/sfx/coin.mp3');
            if (navigator.vibrate) navigator.vibrate(20);

            if (count >= s.gemsList.length) {
              handleVictory();
            }
          }
        }
      }

      // Render Retro Platformer
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Platforms
      ctx.fillStyle = '#38bdf8';
      for (const p of s.platforms) {
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 4);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Gems
      for (const g of s.gemsList) {
        if (!g.collected) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(g.x, g.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Cuboy Card Character
      drawCardSprite(ctx, effectiveCardId, s.px - 20, s.py - 40, 40, 40);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '큐보이 어드벤처' : 'Cuboy Adventure'}
        currentScore={gems}
        targetScore={4}
        onBack={handleExit}
        stageInfo={`💎 ${gems}/4 Gems`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Touch D-Pad */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-4 z-20 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button
            className="w-20 h-20 bg-slate-800/80 active:bg-blue-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md active:scale-95"
            onTouchStart={() => { gameState.current.inputLeft = true; }}
            onTouchEnd={() => { gameState.current.inputLeft = false; }}
            onMouseDown={() => { gameState.current.inputLeft = true; }}
            onMouseUp={() => { gameState.current.inputLeft = false; }}
          >
            ◀
          </button>
          <button
            className="w-20 h-20 bg-slate-800/80 active:bg-blue-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md active:scale-95"
            onTouchStart={() => { gameState.current.inputRight = true; }}
            onTouchEnd={() => { gameState.current.inputRight = false; }}
            onMouseDown={() => { gameState.current.inputRight = true; }}
            onMouseUp={() => { gameState.current.inputRight = false; }}
          >
            ▶
          </button>
        </div>
        <button
          className="pointer-events-auto w-24 h-20 bg-cyan-600 active:bg-cyan-500 text-white rounded-2xl border-2 border-cyan-400 font-bold text-xl flex items-center justify-center backdrop-blur-md active:scale-95"
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

export default PokiCuboyAdventureGame;

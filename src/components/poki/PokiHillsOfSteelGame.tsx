import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHillsOfSteelGameProps {
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

interface EnemyTank {
  x: number;
  hp: number;
}

export const PokiHillsOfSteelGame: React.FC<PokiHillsOfSteelGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 66;

  const [kills, setKills] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 80,
    vx: 0,
    isLeft: false,
    isRight: false,
    bullet: null as { x: number; y: number; vx: number; vy: number } | null,
    enemies: [
      { x: 260, hp: 2 },
      { x: 340, hp: 2 }
    ] as EnemyTank[],
    totalKills: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokihillsofsteel',
      gameTitle: isKo ? '힐스 오브 스틸' : 'Hills of Steel',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const fire = useCallback(() => {
    const s = gameState.current;
    if (s.bullet) return;

    s.bullet = {
      x: s.px + 20,
      y: 430,
      vx: 450,
      vy: -150
    };
    if (playSfx) playSfx('/sfx/tank_fire.mp3');
    if (navigator.vibrate) navigator.vibrate(25);
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
        if (s.isLeft) s.vx = -140;
        else if (s.isRight) s.vx = 140;
        else s.vx = 0;

        s.px = Math.max(40, Math.min(canvas.width - 150, s.px + s.vx * dt));

        // Bullet flight
        if (s.bullet) {
          s.bullet.vy += 300 * dt;
          s.bullet.x += s.bullet.vx * dt;
          s.bullet.y += s.bullet.vy * dt;

          for (let i = s.enemies.length - 1; i >= 0; i--) {
            const e = s.enemies[i];
            if (Math.hypot(s.bullet.x - e.x, s.bullet.y - 450) < 35) {
              e.hp--;
              s.bullet = null;
              if (e.hp <= 0) {
                s.enemies.splice(i, 1);
                s.totalKills++;
                setKills(s.totalKills);
                if (s.totalKills >= 2) {
                  handleVictory();
                }
              }
              break;
            }
          }

          if (s.bullet && (s.bullet.y > 480 || s.bullet.x > canvas.width)) {
            s.bullet = null;
          }
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Steel Hills Ground
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 460, canvas.width, canvas.height - 460);

      // Player Tank
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(s.px - 25, 440, 50, 20);
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(s.px, 440);
      ctx.lineTo(s.px + 30, 425);
      ctx.stroke();

      // Enemy Tanks
      for (const e of s.enemies) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x - 25, 440, 50, 20);
      }

      // Bullet
      if (s.bullet) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(s.bullet.x, s.bullet.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tank Commander Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 18, 400, 36, 36);

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
        gameTitle={isKo ? '힐스 오브 스틸' : 'Hills of Steel'}
        currentScore={kills}
        targetScore={2}
        onBack={handleExit}
        stageInfo={`💥 Kills: ${kills}/2`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Touch Controls */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-4 z-20 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button
            className="w-20 h-20 bg-slate-800/80 active:bg-emerald-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
            onTouchStart={() => { gameState.current.isLeft = true; }}
            onTouchEnd={() => { gameState.current.isLeft = false; }}
            onMouseDown={() => { gameState.current.isLeft = true; }}
            onMouseUp={() => { gameState.current.isLeft = false; }}
          >
            ◀
          </button>
          <button
            className="w-20 h-20 bg-slate-800/80 active:bg-emerald-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
            onTouchStart={() => { gameState.current.isRight = true; }}
            onTouchEnd={() => { gameState.current.isRight = false; }}
            onMouseDown={() => { gameState.current.isRight = true; }}
            onMouseUp={() => { gameState.current.isRight = false; }}
          >
            ▶
          </button>
        </div>
        <button
          className="pointer-events-auto flex-1 max-w-[140px] h-20 bg-red-600 active:bg-red-500 text-white rounded-2xl border-2 border-red-400 font-bold text-xl flex items-center justify-center backdrop-blur-md"
          onClick={fire}
        >
          FIRE!
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

export default PokiHillsOfSteelGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTankStarsGameProps {
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

export const PokiTankStarsGame: React.FC<PokiTankStarsGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 60;

  const [enemyHp, setEnemyHp] = useState(100);
  const [angleDeg, setAngleDeg] = useState(45);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    angle: 45,
    power: 550,
    bullet: null as { x: number; y: number; vx: number; vy: number } | null,
    tankX: 70,
    tankY: 460,
    enemyX: 310,
    enemyY: 460,
    enemyHp: 100
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokitankstars',
      gameTitle: isKo ? '탱크 스타즈' : 'Tank Stars',
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

    const rad = (s.angle * Math.PI) / 180;
    s.bullet = {
      x: s.tankX + 20,
      y: s.tankY - 15,
      vx: Math.cos(rad) * s.power,
      vy: -Math.sin(rad) * s.power
    };
    if (playSfx) playSfx('/sfx/tank_fire.mp3');
    if (navigator.vibrate) navigator.vibrate(30);
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
        if (s.bullet) {
          s.bullet.vy += 450 * dt; // Gravity
          s.bullet.x += s.bullet.vx * dt;
          s.bullet.y += s.bullet.vy * dt;

          // Check hit enemy tank
          if (Math.hypot(s.bullet.x - s.enemyX, s.bullet.y - s.enemyY) < 35) {
            s.enemyHp = Math.max(0, s.enemyHp - 50);
            setEnemyHp(s.enemyHp);
            s.bullet = null;
            if (playSfx) playSfx('/sfx/explosion.mp3');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            if (s.enemyHp <= 0) {
              handleVictory();
            }
          }

          if (s.bullet && s.bullet.y > 480) {
            s.bullet = null;
          }
        }
      }

      // Render Battlefield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Hills
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 480, canvas.width, canvas.height - 480);

      // Player Tank
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(s.tankX - 25, s.tankY - 10, 50, 20);

      // Cannon Barrel
      const rad = (s.angle * Math.PI) / 180;
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(s.tankX, s.tankY - 10);
      ctx.lineTo(s.tankX + Math.cos(rad) * 35, s.tankY - 10 - Math.sin(rad) * 35);
      ctx.stroke();

      // Enemy Tank
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.enemyX - 25, s.enemyY - 10, 50, 20);

      // Enemy HP
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(s.enemyX - 30, s.enemyY - 30, 60, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.enemyX - 30, s.enemyY - 30, (s.enemyHp / 100) * 60, 6);

      // Bullet
      if (s.bullet) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(s.bullet.x, s.bullet.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tank Commander Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.tankX - 18, s.tankY - 45, 36, 36);

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
        gameTitle={isKo ? '탱크 스타즈' : 'Tank Stars'}
        currentScore={100 - enemyHp}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`🎯 Enemy Tank: ${enemyHp}% | Angle: ${angleDeg}°`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Angle Slider & Fire Button */}
      <div className="absolute bottom-6 inset-x-6 flex flex-col gap-3 z-20">
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700 p-3 rounded-2xl backdrop-blur-md">
          <span className="text-xs font-bold text-slate-300">ANGLE:</span>
          <input
            type="range"
            min="10"
            max="80"
            value={angleDeg}
            onChange={e => {
              const val = Number(e.target.value);
              setAngleDeg(val);
              gameState.current.angle = val;
            }}
            className="flex-1 accent-blue-500"
          />
          <span className="text-xs font-bold text-blue-400">{angleDeg}°</span>
        </div>

        <button
          className="w-full h-18 bg-red-600 active:bg-red-500 border-2 border-red-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={fire}
        >
          FIRE! 🚀
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

export default PokiTankStarsGame;

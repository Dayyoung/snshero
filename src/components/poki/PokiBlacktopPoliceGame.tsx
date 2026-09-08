import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlacktopPoliceGameProps {
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

export const PokiBlacktopPoliceGame: React.FC<PokiBlacktopPoliceGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 41;

  const [enemyHp, setEnemyHp] = useState(100);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 480,
    targetX: 200,
    enemyX: 200,
    enemyY: 220,
    enemyHp: 100,
    sirenFlash: 0,
    speed: 280
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiblacktoppolice',
      gameTitle: isKo ? '블랙탑 경찰 추격전' : 'Blacktop Police Chase',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const ramEnemy = useCallback(() => {
    const s = gameState.current;
    if (Math.abs(s.px - s.enemyX) < 40) {
      s.enemyHp = Math.max(0, s.enemyHp - 25);
      setEnemyHp(s.enemyHp);
      if (playSfx) playSfx('/sfx/crash.mp3');
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

      if (s.enemyHp <= 0) {
        handleVictory();
      }
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

      if (!gameWon) {
        s.sirenFlash += dt * 8;

        // Player steer
        s.px += (s.targetX - s.px) * 12 * dt;

        // Enemy AI sway
        s.enemyX = canvas.width / 2 + Math.sin(now * 0.003) * 80;
      }

      // Render Highway
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Asphalt
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 0, canvas.width - 80, canvas.height);

      // Moving road stripes
      ctx.fillStyle = '#facc15';
      const offset = (now * 0.4) % 40;
      for (let y = -offset; y < canvas.height; y += 40) {
        ctx.fillRect(canvas.width / 2 - 4, y, 8, 20);
      }

      // Enemy Robber Car
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(s.enemyX - 25, s.enemyY - 45, 50, 90, 8);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(s.enemyX - 20, s.enemyY - 30, 40, 20);

      // Robber HP bar
      ctx.fillStyle = '#334155';
      ctx.fillRect(s.enemyX - 30, s.enemyY - 65, 60, 8);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.enemyX - 30, s.enemyY - 65, (s.enemyHp / 100) * 60, 8);

      // Police Car
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(s.px - 25, s.py - 45, 50, 90, 8);
      ctx.fill();
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(s.px - 25, s.py - 10, 50, 30);

      // Siren lights
      const isRed = Math.floor(s.sirenFlash) % 2 === 0;
      ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(s.px - 10, s.py - 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isRed ? '#3b82f6' : '#ef4444';
      ctx.beginPath();
      ctx.arc(s.px + 10, s.py - 5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Police Driver Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 18, s.py - 30, 36, 36);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.targetX = e.clientX - rect.left;
    };

    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.buttons > 0) onPointer(e);
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }, [effectiveCardId, gameWon]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '블랙탑 경찰 추격전' : 'Police Chase'}
        currentScore={100 - enemyHp}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`🚨 Robber HP: ${enemyHp}%`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Ram Action Button */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center z-20">
        <button
          className="w-full max-w-sm h-20 bg-blue-600 active:bg-blue-500 border-2 border-blue-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={ramEnemy}
        >
          {isKo ? '충돌 타격! (RAM BUMPER)' : 'RAM BUMPER!'}
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

export default PokiBlacktopPoliceGame;

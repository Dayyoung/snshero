import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSwordMastersGameProps {
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

interface SlimeFoe {
  x: number;
  y: number;
  hp: number;
}

export const PokiSwordMastersGame: React.FC<PokiSwordMastersGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 63;

  const [kills, setKills] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 450,
    targetX: 200,
    targetY: 450,
    slashAngle: 0,
    slimes: [] as SlimeFoe[],
    totalKills: 0,
    isSlashing: false
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiswordmasters',
      gameTitle: isKo ? '소드 마스터즈' : 'Sword Masters',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const slash = useCallback(() => {
    const s = gameState.current;
    s.isSlashing = true;
    s.slashAngle += Math.PI * 2;

    // Check hit nearby slimes
    for (let i = s.slimes.length - 1; i >= 0; i--) {
      const sl = s.slimes[i];
      if (Math.hypot(s.px - sl.x, s.py - sl.y) < 80) {
        sl.hp--;
        if (sl.hp <= 0) {
          s.slimes.splice(i, 1);
          s.totalKills++;
          setKills(s.totalKills);
          if (playSfx) playSfx('/sfx/slash.mp3');
          if (navigator.vibrate) navigator.vibrate(25);
          if (s.totalKills >= 15) {
            handleVictory();
          }
        }
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
        // Move
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * 180 * dt;
          s.py += (dy / dist) * 180 * dt;
        }

        // Spawn slimes
        if (s.slimes.length < 6 && Math.random() < 0.04) {
          s.slimes.push({
            x: 40 + Math.random() * (canvas.width - 80),
            y: 80 + Math.random() * 240,
            hp: 1
          });
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Slimes
      for (const sl of s.slimes) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(sl.x, sl.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sword Orbit
      ctx.save();
      ctx.translate(s.px, s.py);
      ctx.rotate(s.slashAngle);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(55, 0);
      ctx.stroke();
      ctx.restore();

      // Sword Master Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.targetX = e.clientX - rect.left;
      gameState.current.targetY = e.clientY - rect.top;
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
        gameTitle={isKo ? '소드 마스터즈' : 'Sword Masters'}
        currentScore={kills}
        targetScore={15}
        onBack={handleExit}
        stageInfo={`⚔️ Slimes: ${kills}/15`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Slash Action Button */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center z-20">
        <button
          className="w-full max-w-sm h-20 bg-blue-600 active:bg-blue-500 border-2 border-blue-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={slash}
        >
          {isKo ? '검기 회전 베기! ⚔️' : 'SWORD SLASH! ⚔️'}
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

export default PokiSwordMastersGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPlanetDestructionGameProps {
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

export const PokiPlanetDestructionGame: React.FC<PokiPlanetDestructionGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 53;

  const [planetHp, setPlanetHp] = useState(100);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    hp: 100,
    lasers: [] as { x: number; y: number; alpha: number }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiplanetdestruction',
      gameTitle: isKo ? '행성 파괴 시뮬레이터' : 'Planet Destruction',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const blastLaser = useCallback((tx: number, ty: number) => {
    const s = gameState.current;
    s.hp = Math.max(0, s.hp - 8);
    setPlanetHp(s.hp);
    s.lasers.push({ x: tx, y: ty, alpha: 1.0 });

    if (playSfx) playSfx('/sfx/laser.mp3');
    if (navigator.vibrate) navigator.vibrate(25);

    if (s.hp <= 0) {
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

      // Render Deep Space
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137) % canvas.width;
        const sy = (i * 219) % canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Planet in Center
      const cx = canvas.width / 2;
      const cy = 340;
      const r = 85;

      ctx.fillStyle = s.hp > 30 ? '#0ea5e9' : '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Continents / Cracks
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(cx - 20, cy - 20, 30, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy + 20, 25, 0, Math.PI * 2);
      ctx.fill();

      // Lasers
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        const l = s.lasers[i];
        ctx.save();
        ctx.globalAlpha = l.alpha;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 80);
        ctx.lineTo(l.x, l.y);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(l.x, l.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        l.alpha -= dt * 4;
        if (l.alpha <= 0) s.lasers.splice(i, 1);
      }

      // Space Cruiser Card Sprite
      drawCardSprite(ctx, effectiveCardId, canvas.width / 2 - 25, 60, 50, 50);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      blastLaser(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [blastLaser, effectiveCardId]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '행성 파괴 시뮬레이터' : 'Planet Destruction'}
        currentScore={100 - planetHp}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`🪐 Planet HP: ${planetHp}%`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-6 inset-x-6 text-center z-20 pointer-events-none">
        <span className="inline-block bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-8 rounded-full text-base backdrop-blur-md animate-pulse">
          {isKo ? '행성을 터치하여 궤도 궤멸 레이저를 발사하세요!' : 'TAP PLANET TO FIRE ORBITAL LASERS!'}
        </span>
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

export default PokiPlanetDestructionGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCarCircleGameProps {
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

export const PokiCarCircleGame: React.FC<PokiCarCircleGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 93;

  const [score, setScore] = useState(0);
  const targetScore = 15;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    angle: 0,
    speed: 0.025,
    laps: 0,
    otherCars: [
      { angle: Math.PI, speed: 0.018, color: '#f59e0b' },
      { angle: Math.PI * 0.5, speed: 0.02, color: '#3b82f6' }
    ]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicarcircle',
      gameTitle: isKo ? '카 서클' : 'Car Circle',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Keyboard support: Space / ArrowUp for PC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        gameState.current.speed = 0.055;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        gameState.current.speed = 0.025;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.15, 54, 54);

      const cx = w / 2;
      const cy = h * 0.52;
      const radius = Math.min(w, h) * 0.32;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 42;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.setLineDash([12, 12]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      const s = gameState.current;
      const prevAngle = s.angle;
      s.angle += s.speed;
      if (prevAngle < Math.PI * 2 && s.angle >= Math.PI * 2) {
        s.angle -= Math.PI * 2;
        setScore((prev) => {
          const next = prev + 1;
          if (next >= targetScore) handleVictory();
          return next;
        });
        if (navigator.vibrate) navigator.vibrate(20);
      }

      const px = cx + Math.cos(s.angle) * radius;
      const py = cy + Math.sin(s.angle) * radius;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(s.angle + Math.PI / 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, -22, 24, 44);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-8, -12, 16, 12);
      ctx.restore();

      s.otherCars.forEach((oc) => {
        oc.angle += oc.speed;
        const ox = cx + Math.cos(oc.angle) * radius;
        const oy = cy + Math.sin(oc.angle) * radius;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(oc.angle + Math.PI / 2);
        ctx.fillStyle = oc.color;
        ctx.fillRect(-10, -20, 20, 40);
        ctx.restore();
      });

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스 클릭 / 스페이스바 / 터치: 부스트 가속!' : 'Mouse Click / Space / Touch: boost speed!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [effectiveCardId, handleVictory, isKo]);

  const handleStart = () => {
    gameState.current.speed = 0.055;
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleEnd = () => {
    gameState.current.speed = 0.025;
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '카 서클' : 'Car Circle'}
        subtitle="ROUNDABOUT TIMING RUSH"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '클릭 또는 터치로 가속하세요!' : 'Click or touch to boost!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-pointer"
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
      />

      {gameWon && rewardReceipt && (
        <VictoryRewardModal
          isOpen={true}
          isVictory={true}
          score={score}
          targetScore={targetScore}
          rewardAmount={rewardReceipt.totalSns}
          onClose={handleExit}
        />
      )}
    </div>
  );
};

export default PokiCarCircleGame;

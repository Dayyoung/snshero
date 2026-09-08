import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSliceMasterGameProps {
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

interface SliceTarget {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  name: string;
  sliced: boolean;
}

export const PokiSliceMasterGame: React.FC<PokiSliceMasterGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 31;

  const [slices, setSlices] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    knifeX: 80,
    knifeY: 350,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
    isStuck: false,
    cameraX: 0,
    targets: [] as SliceTarget[],
    finishX: 2000
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokislicemaster',
      gameTitle: isKo ? 'Slice Master (슬라이스 마스터)' : 'Slice Master',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const flipKnife = useCallback(() => {
    const s = gameState.current;
    s.isStuck = false;
    s.vx = 220;
    s.vy = -340;
    s.angularVel = 8;
    if (playSfx) playSfx('/sfx/flip.mp3');
    if (navigator.vibrate) navigator.vibrate(20);
  }, [playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate targets along path
    const tList: SliceTarget[] = [];
    const fruits = [
      { color: '#f59e0b', name: 'ORANGE' },
      { color: '#22c55e', name: 'MELON' },
      { color: '#ef4444', name: 'APPLE' },
      { color: '#eab308', name: 'LEMON' }
    ];
    for (let x = 250; x < 1900; x += 140 + Math.random() * 40) {
      const f = fruits[Math.floor(Math.random() * fruits.length)];
      tList.push({
        x,
        y: 420,
        w: 40,
        h: 40,
        color: f.color,
        name: f.name,
        sliced: false
      });
    }
    gameState.current.targets = tList;

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
        if (!s.isStuck) {
          s.vy += 650 * dt; // Gravity
          s.knifeX += s.vx * dt;
          s.knifeY += s.vy * dt;
          s.angle += s.angularVel * dt;

          // Check targets slice
          for (const t of s.targets) {
            if (!t.sliced && Math.hypot(s.knifeX - t.x, s.knifeY - t.y) < 35) {
              t.sliced = true;
              const count = s.targets.filter(it => it.sliced).length;
              setSlices(count);
              if (playSfx) playSfx('/sfx/slice.mp3');
              if (navigator.vibrate) navigator.vibrate(25);
            }
          }

          // Floor stick
          if (s.knifeY > 440) {
            s.knifeY = 440;
            s.vx = 0;
            s.vy = 0;
            s.angularVel = 0;
            s.isStuck = true;
            s.angle = 0.3; // stuck in wood
          }
        }

        // Camera follow
        s.cameraX += (s.knifeX - canvas.width * 0.25 - s.cameraX) * 0.1;

        if (s.knifeX >= s.finishX) {
          handleVictory();
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-s.cameraX, 0);

      // Floor Wood
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 440, s.finishX + 500, canvas.height - 440);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 440);
      ctx.lineTo(s.finishX + 500, 440);
      ctx.stroke();

      // Targets
      for (const t of s.targets) {
        if (t.sliced) {
          // Half pieces
          ctx.fillStyle = t.color;
          ctx.fillRect(t.x - 20, t.y + 10, 18, 25);
          ctx.fillRect(t.x + 4, t.y + 10, 18, 25);
        } else {
          ctx.fillStyle = t.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Finish Line
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(s.finishX, 200, 20, 240);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('FINISH', s.finishX - 25, 180);

      // Knife
      ctx.save();
      ctx.translate(s.knifeX, s.knifeY);
      ctx.rotate(s.angle);
      // Blade
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.lineTo(12, 0);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      // Handle
      ctx.fillStyle = '#475569';
      ctx.fillRect(-6, 0, 12, 25);
      ctx.restore();

      // Companion Card Sprite following knife
      drawCardSprite(ctx, effectiveCardId, s.knifeX - 45, s.knifeY - 70, 36, 36);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onClick={flipKnife}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Slice Master (슬라이스 마스터)' : 'Slice Master'}
        currentScore={slices}
        targetScore={10}
        onBack={handleExit}
        stageInfo={`🔪 ${slices} Slices`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-6 inset-x-6 text-center z-20 pointer-events-none">
        <span className="inline-block bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-8 rounded-full text-base backdrop-blur-md animate-pulse">
          {isKo ? '화면을 탭하여 칼을 회전 점프시키세요!' : 'TAP TO FLIP & SLICE!'}
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

export default PokiSliceMasterGame;

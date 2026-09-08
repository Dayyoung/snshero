import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiKawaiiFruits3DGameProps {
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

export const PokiKawaiiFruits3DGame: React.FC<PokiKawaiiFruits3DGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 102;

  const [score, setScore] = useState(0);
  const targetScore = 15;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    fruits: [] as { x: number; y: number; vx: number; vy: number; emoji: string; sliced: boolean }[],
    sliceTrail: [] as { x: number; y: number }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokikawaiifruits3d',
      gameTitle: isKo ? '카와이 프루츠 3D' : 'Kawaii Fruits 3D',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initFruits = useCallback((w: number, h: number) => {
    const emojis = ['🍓', '🍊', '🍇', '🍉', '🍍', '🍑'];
    const fruits = [];
    for (let i = 0; i < 5; i++) {
      fruits.push({
        x: Math.random() * (w - 100) + 50,
        y: h + i * 90,
        vx: Math.random() * 4 - 2,
        vy: -(Math.random() * 5 + 9),
        emoji: emojis[i % emojis.length],
        sliced: false
      });
    }
    gameState.current.fruits = fruits;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initFruits(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, w, h);

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      const s = gameState.current;

      s.fruits.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.22;

        if (!f.sliced) {
          ctx.font = '34px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(f.emoji, f.x, f.y);
        }

        if (f.y > h + 50) {
          f.y = h;
          f.vy = -(Math.random() * 5 + 9);
          f.vx = Math.random() * 4 - 2;
          f.sliced = false;
        }
      });

      if (s.sliceTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.sliceTrail[0].x, s.sliceTrail[0].y);
        for (let i = 1; i < s.sliceTrail.length; i++) {
          ctx.lineTo(s.sliceTrail[i].x, s.sliceTrail[i].y);
        }
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      ctx.fillStyle = '#fca5a5';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스 이동 / 스와이프로 튀어오르는 과일을 슬라이스하세요!' : 'Move mouse or swipe to slice kawaii jumping fruits!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, initFruits, isKo]);

  const handlePointer = (clientX: number, clientY: number) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = clientX - rect.left;
    const ty = clientY - rect.top;

    const s = gameState.current;
    s.sliceTrail.push({ x: tx, y: ty });
    if (s.sliceTrail.length > 8) s.sliceTrail.shift();

    s.fruits.forEach((f) => {
      if (!f.sliced && Math.hypot(tx - f.x, ty - f.y) < 38) {
        f.sliced = true;
        if (navigator.vibrate) navigator.vibrate(25);
        setScore((prev) => {
          const next = prev + 1;
          if (next >= targetScore) handleVictory();
          return next;
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-zinc-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '카와이 프루츠 3D' : 'Kawaii Fruits 3D'}
        subtitle="KAWAII FRUIT SLICE POP"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '과일을 마우스/터치로 베어내세요!' : 'Slice fruits!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
        }}
        onMouseMove={(e) => handlePointer(e.clientX, e.clientY)}
        onMouseDown={(e) => handlePointer(e.clientX, e.clientY)}
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

export default PokiKawaiiFruits3DGame;

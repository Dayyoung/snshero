import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiWatermelonDropGameProps {
  onBack: () => void;
}

const TARGET_SCORE = 800;

interface Fruit {
  id: number;
  tier: number; // 0..5
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const FRUIT_TIERS = [
  { name: '체리', emoji: '🍒', radius: 14, color: '#ef4444', score: 10 },
  { name: '딸기', emoji: '🍓', radius: 19, color: '#f43f5e', score: 25 },
  { name: '포도', emoji: '🍇', radius: 25, color: '#a855f7', score: 50 },
  { name: '오렌지', emoji: '🍊', radius: 32, color: '#f97316', score: 90 },
  { name: '사과', emoji: '🍎', radius: 39, color: '#dc2626', score: 150 },
  { name: '수박', emoji: '🍉', radius: 48, color: '#16a34a', score: 300 },
];

export const PokiWatermelonDropGame: React.FC<PokiWatermelonDropGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [currentTier, setCurrentTier] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    fruits: Fruit[];
    nextTier: number;
    dropperX: number;
    score: number;
    gameWon: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    fruits: [],
    nextTier: 0,
    dropperX: 200,
    score: 0,
    gameWon: false,
    particles: [],
  });

  const dropFruit = () => {
    const st = stateRef.current;
    if (st.gameWon) return;

    const tier = st.nextTier;
    const info = FRUIT_TIERS[tier];
    st.fruits.push({
      id: Date.now() + Math.random(),
      tier,
      x: Math.max(70, Math.min(330, st.dropperX)),
      y: 120,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 2.0,
      radius: info.radius,
    });

    st.nextTier = Math.floor(Math.random() * 3); // next is 0, 1, or 2
    setCurrentTier(st.nextTier);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      // Background
      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 101, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('WATERMELON DROP // 수박 드롭 머지', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`스코어: ${st.score}/${TARGET_SCORE} | 다음: ${FRUIT_TIERS[st.nextTier].name} ${FRUIT_TIERS[st.nextTier].emoji}`, 84, 56);

      // Container Box (Glass Bowl)
      const boxLeft = 50;
      const boxRight = w - 50;
      const boxBottom = h - 45;
      const boxTop = 130;

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(boxLeft, boxTop);
      ctx.lineTo(boxLeft, boxBottom);
      ctx.lineTo(boxRight, boxBottom);
      ctx.lineTo(boxRight, boxTop);
      ctx.stroke();

      // Dropper Guide Line & Fruit Preview
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(st.dropperX, 100);
      ctx.lineTo(st.dropperX, boxBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dropper Fruit
      const curInfo = FRUIT_TIERS[st.nextTier];
      ctx.beginPath();
      ctx.arc(st.dropperX, 110, curInfo.radius, 0, Math.PI * 2);
      ctx.fillStyle = curInfo.color;
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Update Fruits Physics
      const gravity = 0.35;
      for (let i = 0; i < st.fruits.length; i++) {
        const f = st.fruits[i];
        f.vy += gravity;
        f.x += f.vx;
        f.y += f.vy;

        // Container Collision
        if (f.x - f.radius < boxLeft + 2) {
          f.x = boxLeft + 2 + f.radius;
          f.vx *= -0.4;
        }
        if (f.x + f.radius > boxRight - 2) {
          f.x = boxRight - 2 - f.radius;
          f.vx *= -0.4;
        }
        if (f.y + f.radius > boxBottom - 2) {
          f.y = boxBottom - 2 - f.radius;
          f.vy = 0;
          f.vx *= 0.85; // Floor friction
        }
      }

      // Fruit vs Fruit Collisions & Merging
      for (let i = 0; i < st.fruits.length; i++) {
        for (let j = i + 1; j < st.fruits.length; j++) {
          const f1 = st.fruits[i];
          const f2 = st.fruits[j];
          const dx = f2.x - f1.x;
          const dy = f2.y - f1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = f1.radius + f2.radius;

          if (dist < minDist) {
            // Check Merge (Same Tier)
            if (f1.tier === f2.tier && f1.tier < FRUIT_TIERS.length - 1) {
              const nextT = f1.tier + 1;
              const nextInfo = FRUIT_TIERS[nextT];
              const mergeX = (f1.x + f2.x) / 2;
              const mergeY = (f1.y + f2.y) / 2;

              // Remove f1 and f2, replace f1 with merged fruit
              f1.tier = nextT;
              f1.radius = nextInfo.radius;
              f1.x = mergeX;
              f1.y = mergeY;
              f1.vx = 0;
              f1.vy = -1.5; // Slight bounce

              st.fruits.splice(j, 1);
              st.score += nextInfo.score;
              setScore(st.score);

              // Merge sparkles
              for (let p = 0; p < 15; p++) {
                st.particles.push({
                  x: mergeX,
                  y: mergeY,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: nextInfo.color,
                  life: 0.9,
                });
              }

              if (st.score >= TARGET_SCORE && !st.gameWon) {
                st.gameWon = true;
                setGameWon(true);
                const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'watermelon-drop',
                  gameTitle: 'Watermelon Drop',
                  score: st.score,
                  durationSeconds: duration,
                });
                setRewardReceipt(receipt);
              }
              break;
            } else {
              // Elastic Push separation
              const overlap = minDist - dist;
              const nx = dx / (dist || 1);
              const ny = dy / (dist || 1);
              f1.x -= nx * overlap * 0.5;
              f1.y -= ny * overlap * 0.5;
              f2.x += nx * overlap * 0.5;
              f2.y += ny * overlap * 0.5;

              f1.vx -= nx * 0.4;
              f1.vy -= ny * 0.4;
              f2.vx += nx * 0.4;
              f2.vy += ny * 0.4;
            }
          }
        }
      }

      // Draw Fruits
      st.fruits.forEach((f) => {
        const info = FRUIT_TIERS[f.tier];
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = info.color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = `${Math.floor(f.radius * 1.1)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.emoji, f.x, f.y);
      });
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#201d1d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 터치 드래그로 조준하고 손을 떼어 과일을 떨어뜨리세요 ]', w / 2, h - 15);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    stateRef.current.dropperX = (e.clientX - rect.left) * scaleX;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Watermelon Drop"
        score={score}
        targetScore={TARGET_SCORE}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons > 0) handlePointer(e);
          }}
          onPointerUp={dropFruit}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-pointer"
        />
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          receipt={rewardReceipt}
          onConfirm={onBack}
        />
      )}
    </div>
  );
};

export default PokiWatermelonDropGame;

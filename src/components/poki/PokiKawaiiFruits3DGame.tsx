import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiKawaiiFruits3DGameProps {
  onBack: () => void;
}

const TARGET_MERGES = 10;

interface KawaiiFruit {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  blink: number;
}

const KAWAII_TIERS = [
  { name: '체리', emoji: '🍒', radius: 18, color: '#f43f5e' },
  { name: '라임', emoji: '🍋', radius: 25, color: '#84cc16' },
  { name: '오렌지', emoji: '🍊', radius: 32, color: '#f97316' },
  { name: '복숭아', emoji: '🍑', radius: 40, color: '#fb7185' },
  { name: '멜론', emoji: '🍈', radius: 50, color: '#22c55e' },
];

export const PokiKawaiiFruits3DGame: React.FC<PokiKawaiiFruits3DGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mergeCount, setMergeCount] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    fruits: KawaiiFruit[];
    dropperX: number;
    nextTier: number;
    mergeCount: number;
    gameWon: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    fruits: [],
    dropperX: 200,
    nextTier: 0,
    mergeCount: 0,
    gameWon: false,
    particles: [],
  });

  const dropKawaiiFruit = () => {
    const st = stateRef.current;
    if (st.gameWon) return;

    const tier = st.nextTier;
    st.fruits.push({
      id: Date.now() + Math.random(),
      tier,
      x: Math.max(70, Math.min(330, st.dropperX)),
      y: 120,
      vx: 0,
      vy: 2,
      radius: KAWAII_TIERS[tier].radius,
      blink: 0,
    });

    st.nextTier = Math.floor(Math.random() * 2);
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

      // Pastel Pink cute background
      ctx.fillStyle = '#fff1f2';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 102, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('KAWAII FRUITS // 귀여운 과일 머지', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#fb7185';
      ctx.fillText(`합성: ${st.mergeCount}/${TARGET_MERGES}회 | 다음: ${KAWAII_TIERS[st.nextTier].name} ${KAWAII_TIERS[st.nextTier].emoji}`, 84, 56);

      // Glass bowl
      const boxLeft = 50;
      const boxRight = w - 50;
      const boxBottom = h - 45;
      const boxTop = 130;

      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(boxLeft, boxTop);
      ctx.lineTo(boxLeft, boxBottom);
      ctx.lineTo(boxRight, boxBottom);
      ctx.lineTo(boxRight, boxTop);
      ctx.stroke();

      // Dropper Fruit Preview
      const curT = KAWAII_TIERS[st.nextTier];
      ctx.beginPath();
      ctx.arc(st.dropperX, 110, curT.radius, 0, Math.PI * 2);
      ctx.fillStyle = curT.color;
      ctx.fill();
      ctx.strokeStyle = '#201d1d';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Update Physics
      for (let i = 0; i < st.fruits.length; i++) {
        const f = st.fruits[i];
        f.vy += 0.35;
        f.x += f.vx;
        f.y += f.vy;

        if (f.x - f.radius < boxLeft) { f.x = boxLeft + f.radius; f.vx *= -0.3; }
        if (f.x + f.radius > boxRight) { f.x = boxRight - f.radius; f.vx *= -0.3; }
        if (f.y + f.radius > boxBottom) { f.y = boxBottom - f.radius; f.vy = 0; f.vx *= 0.8; }
      }

      // Collisions & Merge
      for (let i = 0; i < st.fruits.length; i++) {
        for (let j = i + 1; j < st.fruits.length; j++) {
          const f1 = st.fruits[i];
          const f2 = st.fruits[j];
          const dx = f2.x - f1.x;
          const dy = f2.y - f1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = f1.radius + f2.radius;

          if (dist < minDist) {
            if (f1.tier === f2.tier && f1.tier < KAWAII_TIERS.length - 1) {
              f1.tier += 1;
              f1.radius = KAWAII_TIERS[f1.tier].radius;
              f1.x = (f1.x + f2.x) / 2;
              f1.y = (f1.y + f2.y) / 2;
              f1.vy = -1.5;
              st.fruits.splice(j, 1);

              st.mergeCount += 1;
              setMergeCount(st.mergeCount);

              // Cute heart particles
              for (let p = 0; p < 12; p++) {
                st.particles.push({
                  x: f1.x,
                  y: f1.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: '#fb7185',
                  life: 0.9,
                });
              }

              if (st.mergeCount >= TARGET_MERGES && !st.gameWon) {
                st.gameWon = true;
                setGameWon(true);
                const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'kawaii-fruits-3d',
                  gameTitle: 'Kawaii Fruits 3D',
                  score: st.mergeCount * 100,
                  durationSeconds: duration,
                });
                setRewardReceipt(receipt);
              }
              break;
            } else {
              const overlap = minDist - dist;
              const nx = dx / (dist || 1);
              const ny = dy / (dist || 1);
              f1.x -= nx * overlap * 0.5;
              f1.y -= ny * overlap * 0.5;
              f2.x += nx * overlap * 0.5;
              f2.y += ny * overlap * 0.5;
            }
          }
        }
      }

      // Draw Kawaii Fruits with blinking faces
      st.fruits.forEach((f) => {
        const info = KAWAII_TIERS[f.tier];
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = info.color;
        ctx.fill();
        ctx.strokeStyle = '#201d1d';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3D sphere highlight
        ctx.beginPath();
        ctx.arc(f.x - f.radius * 0.35, f.y - f.radius * 0.35, f.radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        // Kawaii eyes & smile
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(f.x - f.radius * 0.3, f.y, 2.5, 0, Math.PI * 2);
        ctx.arc(f.x + f.radius * 0.3, f.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Cute blush
        ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.beginPath();
        ctx.arc(f.x - f.radius * 0.4, f.y + 4, 3, 0, Math.PI * 2);
        ctx.arc(f.x + f.radius * 0.4, f.y + 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y + 2, 4, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
      });

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
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#201d1d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 화면을 탭하여 귀여운 과일을 합치세요 ]', w / 2, h - 15);
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
        gameTitle="Kawaii Fruits 3D"
        score={mergeCount}
        targetScore={TARGET_MERGES}
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
          onPointerUp={dropKawaiiFruit}
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

export default PokiKawaiiFruits3DGame;

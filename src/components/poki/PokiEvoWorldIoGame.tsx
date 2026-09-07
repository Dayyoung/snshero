import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiEvoWorldIoGameProps {
  onBack: () => void;
}

interface FoodItem {
  x: number;
  y: number;
  type: 'dew' | 'berry' | 'flower';
  exp: number;
}

const EVO_STAGES = [
  { name: 'Fly', icon: '🪰', expReq: 100, color: '#64748b', size: 12 },
  { name: 'Butterfly', icon: '🦋', expReq: 250, color: '#ec4899', size: 16 },
  { name: 'Mosquito', icon: '🦟', expReq: 450, color: '#ef4444', size: 20 },
  { name: 'Falcon', icon: '🦅', expReq: 700, color: '#d97706', size: 26 },
  { name: 'Phoenix', icon: '🔥', expReq: 1000, color: '#f97316', size: 34 },
];

export const PokiEvoWorldIoGame: React.FC<PokiEvoWorldIoGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stageIdx, setStageIdx] = useState(0);
  const [currentExp, setCurrentExp] = useState(0);
  const [water, setWater] = useState(100);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    playerX: number;
    playerY: number;
    targetX: number;
    targetY: number;
    stageIdx: number;
    exp: number;
    water: number;
    gameWon: boolean;
    foods: FoodItem[];
    predators: Array<{ x: number; y: number; vx: number; vy: number; size: number }>;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    playerX: 200,
    playerY: 300,
    targetX: 200,
    targetY: 300,
    stageIdx: 0,
    exp: 0,
    water: 100,
    gameWon: false,
    foods: [],
    predators: [
      { x: 80, y: 150, vx: 1.5, vy: 0.8, size: 28 },
      { x: 320, y: 400, vx: -1.2, vy: -1.1, size: 30 },
    ],
    particles: [],
  });

  // Spawn Initial Food
  useEffect(() => {
    const foods: FoodItem[] = [];
    for (let i = 0; i < 25; i++) {
      foods.push({
        x: 30 + Math.random() * 340,
        y: 100 + Math.random() * 400,
        type: Math.random() > 0.5 ? 'dew' : Math.random() > 0.3 ? 'berry' : 'flower',
        exp: 25,
      });
    }
    stateRef.current.foods = foods;
  }, []);

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

      // Sky background
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, w, h);

      // Water pond at bottom
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, h - 60, w, 60);
      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('~ 수분 보충 워터 존 ~', w / 2 - 60, h - 25);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 97, 24, 18, 48, 48);

      const currStage = EVO_STAGES[st.stageIdx];
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`EVOWORLD // Lv.${st.stageIdx + 1} ${currStage.name}`, 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`EXP: ${st.exp}/${currStage.expReq} | 수분: ${Math.floor(st.water)}%`, 84, 56);

      // Move player towards touch target
      const dx = st.targetX - st.playerX;
      const dy = st.targetY - st.playerY;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const speed = 3.5;
        st.playerX += (dx / dist) * Math.min(speed, dist);
        st.playerY += (dy / dist) * Math.min(speed, dist);
      }

      // Water consumption & Replenishment
      if (st.playerY >= h - 70) {
        st.water = Math.min(100, st.water + 0.8);
      } else {
        st.water = Math.max(0, st.water - 0.04);
      }
      setWater(Math.floor(st.water));

      // Update Predators
      st.predators.forEach((pred) => {
        pred.x += pred.vx;
        pred.y += pred.vy;

        if (pred.x < 30 || pred.x > w - 30) pred.vx *= -1;
        if (pred.y < 100 || pred.y > h - 80) pred.vy *= -1;

        // Draw Predator (Red Danger Zone)
        ctx.beginPath();
        ctx.arc(pred.x, pred.y, pred.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `${pred.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐲', pred.x, pred.y);

        // Check Collision with Predator
        const pDist = Math.hypot(pred.x - st.playerX, pred.y - st.playerY);
        if (pDist < pred.size + currStage.size && st.stageIdx < 4) {
          // Hurt penalty (drop some exp)
          st.exp = Math.max(0, st.exp - 20);
          setCurrentExp(st.exp);
          st.playerX += pred.vx * 15;
          st.playerY += pred.vy * 15;
        }
      });
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Draw & Eat Foods
      st.foods.forEach((food, idx) => {
        // Draw food
        ctx.beginPath();
        ctx.arc(food.x, food.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = food.type === 'dew' ? '#0ea5e9' : food.type === 'berry' ? '#dc2626' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Check consumption
        const fDist = Math.hypot(food.x - st.playerX, food.y - st.playerY);
        if (fDist < currStage.size + 8) {
          st.exp += food.exp;
          setCurrentExp(st.exp);

          // Evolution check
          if (st.exp >= currStage.expReq && st.stageIdx < EVO_STAGES.length - 1) {
            st.stageIdx += 1;
            setStageIdx(st.stageIdx);

            // Evolution spark particles
            for (let i = 0; i < 25; i++) {
              st.particles.push({
                x: st.playerX,
                y: st.playerY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: '#facc15',
                life: 1.2,
              });
            }

            if (st.stageIdx >= EVO_STAGES.length - 1 && !st.gameWon) {
              st.gameWon = true;
              setGameWon(true);
              const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
              const receipt = calculateAndDepositMissionReward({
                gameId: 'flyordie-io',
                gameTitle: 'EvoWorld io',
                score: st.exp,
                durationSeconds: duration,
              });
              setRewardReceipt(receipt);
            }
          }

          // Respawn food elsewhere
          food.x = 30 + Math.random() * 340;
          food.y = 100 + Math.random() * 380;
        }
      });

      // Draw Player Creature
      ctx.save();
      ctx.translate(st.playerX, st.playerY);

      // Creature Aura
      ctx.beginPath();
      ctx.arc(0, 0, currStage.size, 0, Math.PI * 2);
      ctx.fillStyle = currStage.color;
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Emoji Icon
      ctx.font = `${Math.floor(currStage.size * 1.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currStage.icon, 0, 0);

      ctx.restore();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
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
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 화면 터치로 비행하고 이슬/열매를 먹어 피닉스로 진화하세요 ]', w / 2, h - 10);
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
    const scaleY = canvas.height / rect.height;
    stateRef.current.targetX = (e.clientX - rect.left) * scaleX;
    stateRef.current.targetY = (e.clientY - rect.top) * scaleY;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="EvoWorld io"
        score={currentExp}
        targetScore={EVO_STAGES[EVO_STAGES.length - 1].expReq}
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

export default PokiEvoWorldIoGame;


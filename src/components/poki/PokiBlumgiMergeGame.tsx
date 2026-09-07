import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiMergeGameProps {
  onBack: () => void;
}

const BLUMGI_TIERS = [
  { name: '치킨', emoji: '🐣', power: 15, color: '#facc15' },
  { name: '펭귄', emoji: '🐧', power: 35, color: '#0284c7' },
  { name: '부엉이', emoji: '🦉', power: 75, color: '#854d0e' },
  { name: '피닉스', emoji: '🦅', power: 150, color: '#ea580c' },
  { name: '드래곤', emoji: '🐲', power: 300, color: '#16a34a' },
];

interface CreatureSlot {
  id: number;
  tier: number;
  gridIdx: number;
}

export const PokiBlumgiMergeGame: React.FC<PokiBlumgiMergeGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [bossHp, setBossHp] = useState(500);
  const [totalPower, setTotalPower] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    creatures: CreatureSlot[];
    bossHp: number;
    draggedId: number | null;
    dragX: number;
    dragY: number;
    gameWon: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    creatures: [
      { id: 1, tier: 0, gridIdx: 0 },
      { id: 2, tier: 0, gridIdx: 1 },
      { id: 3, tier: 1, gridIdx: 2 },
      { id: 4, tier: 0, gridIdx: 4 },
      { id: 5, tier: 1, gridIdx: 5 },
    ],
    bossHp: 500,
    draggedId: null,
    dragX: 0,
    dragY: 0,
    gameWon: false,
    particles: [],
  });

  const calculatePower = () => {
    return stateRef.current.creatures.reduce((sum, c) => sum + BLUMGI_TIERS[c.tier].power, 0);
  };

  const buyNewCreature = () => {
    const st = stateRef.current;
    if (st.creatures.length >= 9) return;
    const occupied = new Set(st.creatures.map((c) => c.gridIdx));
    for (let i = 0; i < 9; i++) {
      if (!occupied.has(i)) {
        st.creatures.push({ id: Date.now(), tier: 0, gridIdx: i });
        break;
      }
    }
    setTotalPower(calculatePower());
  };

  const attackBoss = () => {
    const st = stateRef.current;
    if (st.gameWon) return;

    const power = calculatePower();
    st.bossHp = Math.max(0, st.bossHp - power);
    setBossHp(st.bossHp);

    // Battle slash particles
    for (let p = 0; p < 25; p++) {
      st.particles.push({
        x: 200,
        y: 160,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: '#ef4444',
        life: 1.0,
      });
    }

    if (st.bossHp <= 0 && !st.gameWon) {
      st.gameWon = true;
      setGameWon(true);
      const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      const receipt = calculateAndDepositMissionReward({
        gameId: 'blumgi-merge',
        gameTitle: 'Blumgi Merge',
        score: 500,
        durationSeconds: duration,
      });
      setRewardReceipt(receipt);
    }
  };

  useEffect(() => {
    setTotalPower(calculatePower());
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

      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 105, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('BLUMGI MERGE // 블룸기 크리처 머지', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`보스 HP: ${st.bossHp}/500 | 아군 총합 전투력: ${calculatePower()}`, 84, 56);

      // Boss Monster Area (Top Center)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(80, 100, 240, 110);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 100, 240, 110);

      // Boss Avatar
      ctx.font = '54px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👹', 200, 145);

      // Boss HP Bar
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(100, 185, 200, 14);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(100, 185, (st.bossHp / 500) * 200, 14);

      // 3x3 Grid for Merging (Bottom Half)
      const gridStartX = 65;
      const gridStartY = 240;
      const cellSize = 80;
      const gap = 12;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const gx = gridStartX + c * (cellSize + gap);
          const gy = gridStartY + r * (cellSize + gap);
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(gx, gy, cellSize, cellSize);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(gx, gy, cellSize, cellSize);
        }
      }

      // Draw Placed Creatures
      st.creatures.forEach((cr) => {
        if (cr.id === st.draggedId) return; // Drawn at finger position

        const r = Math.floor(cr.gridIdx / 3);
        const c = cr.gridIdx % 3;
        const cx = gridStartX + c * (cellSize + gap) + cellSize / 2;
        const cy = gridStartY + r * (cellSize + gap) + cellSize / 2;

        const info = BLUMGI_TIERS[cr.tier];
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fillStyle = info.color;
        ctx.fill();
        ctx.strokeStyle = '#201d1d';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '28px sans-serif';
        ctx.fillText(info.emoji, cx, cy);

        // Power tag
        ctx.fillStyle = '#201d1d';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`+${info.power}`, cx, cy + 34);
      });

      // Draw Dragged Creature
      if (st.draggedId !== null) {
        const dragged = st.creatures.find((c) => c.id === st.draggedId);
        if (dragged) {
          const info = BLUMGI_TIERS[dragged.tier];
          ctx.beginPath();
          ctx.arc(st.dragX, st.dragY, 32, 0, Math.PI * 2);
          ctx.fillStyle = info.color;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.font = '34px sans-serif';
          ctx.fillText(info.emoji, st.dragX, st.dragY);
        }
      }

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

      // Bottom Action Buttons: [소환 +] and [배틀 출진 ⚔️]
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(40, h - 55, 140, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('[+] 크리처 소환', 110, h - 30);

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(220, h - 55, 140, 40);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('⚔️ 보스 총공격', 290, h - 30);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check Bottom Buttons
    if (y >= canvas.height - 60 && y <= canvas.height - 10) {
      if (x >= 40 && x <= 180) {
        buyNewCreature();
        return;
      }
      if (x >= 220 && x <= 360) {
        attackBoss();
        return;
      }
    }

    // Check click on creatures in grid
    const gridStartX = 65;
    const gridStartY = 240;
    const cellSize = 80;
    const gap = 12;

    const st = stateRef.current;
    for (const cr of st.creatures) {
      const r = Math.floor(cr.gridIdx / 3);
      const c = cr.gridIdx % 3;
      const cx = gridStartX + c * (cellSize + gap) + cellSize / 2;
      const cy = gridStartY + r * (cellSize + gap) + cellSize / 2;

      if (Math.hypot(x - cx, y - cy) < 32) {
        st.draggedId = cr.id;
        st.dragX = x;
        st.dragY = y;
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = stateRef.current;
    if (st.draggedId === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    st.dragX = (e.clientX - rect.left) * scaleX;
    st.dragY = (e.clientY - rect.top) * scaleY;
  };

  const handlePointerUp = () => {
    const st = stateRef.current;
    if (st.draggedId !== null) {
      const dragged = st.creatures.find((c) => c.id === st.draggedId);
      if (dragged) {
        // Find which cell was dropped onto
        const gridStartX = 65;
        const gridStartY = 240;
        const cellSize = 80;
        const gap = 12;

        let targetCell = -1;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cx = gridStartX + c * (cellSize + gap) + cellSize / 2;
            const cy = gridStartY + r * (cellSize + gap) + cellSize / 2;
            if (Math.hypot(st.dragX - cx, st.dragY - cy) < 40) {
              targetCell = r * 3 + c;
              break;
            }
          }
        }

        if (targetCell !== -1 && targetCell !== dragged.gridIdx) {
          const other = st.creatures.find((c) => c.gridIdx === targetCell);
          if (other) {
            // Check Merge
            if (other.tier === dragged.tier && other.tier < BLUMGI_TIERS.length - 1) {
              other.tier += 1;
              st.creatures = st.creatures.filter((c) => c.id !== dragged.id);
              setTotalPower(calculatePower());

              // Merge sparkle
              for (let p = 0; p < 15; p++) {
                st.particles.push({
                  x: st.dragX,
                  y: st.dragY,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#facc15',
                  life: 0.9,
                });
              }
            } else {
              // Swap positions
              other.gridIdx = dragged.gridIdx;
              dragged.gridIdx = targetCell;
            }
          } else {
            // Move to empty slot
            dragged.gridIdx = targetCell;
          }
        }
      }
      st.draggedId = null;
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Blumgi Merge"
        score={500 - bossHp}
        targetScore={500}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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

export default PokiBlumgiMergeGame;

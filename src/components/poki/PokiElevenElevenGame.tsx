import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiElevenElevenGameProps {
  onBack: () => void;
}

const TARGET_SCORE = 600;

interface Shape {
  coords: Array<{ r: number; c: number }>;
  color: string;
}

const SHAPES: Shape[] = [
  // 1x1
  { coords: [{ r: 0, c: 0 }], color: '#ef4444' },
  // 2x2
  { coords: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }], color: '#3b82f6' },
  // 3x1
  { coords: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }], color: '#10b981' },
  // 1x3
  { coords: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }], color: '#f59e0b' },
  // L-shape
  { coords: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }], color: '#a855f7' },
];

export const PokiElevenElevenGame: React.FC<PokiElevenElevenGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    grid: (string | null)[][]; // 11x11
    score: number;
    availableShapes: (Shape | null)[];
    selectedShapeIdx: number | null;
    gameWon: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    grid: Array(11).fill(null).map(() => Array(11).fill(null)),
    score: 0,
    availableShapes: [
      SHAPES[0],
      SHAPES[1],
      SHAPES[2],
    ],
    selectedShapeIdx: null,
    gameWon: false,
    particles: [],
  });

  const checkLines = () => {
    const st = stateRef.current;
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    // Check rows
    for (let r = 0; r < 11; r++) {
      if (st.grid[r].every((cell) => cell !== null)) {
        fullRows.push(r);
      }
    }
    // Check cols
    for (let c = 0; c < 11; c++) {
      let full = true;
      for (let r = 0; r < 11; r++) {
        if (st.grid[r][c] === null) {
          full = false;
          break;
        }
      }
      if (full) fullCols.push(c);
    }

    if (fullRows.length > 0 || fullCols.length > 0) {
      // Clear rows
      fullRows.forEach((r) => {
        for (let c = 0; c < 11; c++) st.grid[r][c] = null;
      });
      // Clear cols
      fullCols.forEach((c) => {
        for (let r = 0; r < 11; r++) st.grid[r][c] = null;
      });

      const clearedLines = fullRows.length + fullCols.length;
      const points = clearedLines * 110;
      st.score += points;
      setScore(st.score);

      // Explosive line particles
      for (let p = 0; p < 30; p++) {
        st.particles.push({
          x: 40 + Math.random() * 320,
          y: 110 + Math.random() * 320,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: '#38bdf8',
          life: 1.0,
        });
      }

      if (st.score >= TARGET_SCORE && !st.gameWon) {
        st.gameWon = true;
        setGameWon(true);
        const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const receipt = calculateAndDepositMissionReward({
          gameId: '11-11',
          gameTitle: '11-11',
          score: st.score,
          durationSeconds: duration,
        });
        setRewardReceipt(receipt);
      }
    }
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

      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 108, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('11-11 // 일레븐 일레븐 블록 퍼즐', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`스코어: ${st.score}/${TARGET_SCORE} | 11줄 라인 완성 클리어`, 84, 56);

      // 11x11 Grid Board
      const gridLeft = 35;
      const gridTop = 95;
      const cellSize = 30;

      for (let r = 0; r < 11; r++) {
        for (let c = 0; c < 11; c++) {
          const gx = gridLeft + c * cellSize;
          const gy = gridTop + r * cellSize;
          const val = st.grid[r][c];

          ctx.fillStyle = val ? val : '#f1f5f9';
          ctx.fillRect(gx + 1, gy + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.strokeRect(gx + 1, gy + 1, cellSize - 2, cellSize - 2);
        }
      }

      // Outer Grid Border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(gridLeft, gridTop, 11 * cellSize, 11 * cellSize);

      // Bottom Shape Slots (3 Slots)
      const slotY = 460;
      st.availableShapes.forEach((sh, idx) => {
        const sx = 70 + idx * 110;
        const isSelected = st.selectedShapeIdx === idx;

        // Slot boundary
        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.2)' : '#f8fafc';
        ctx.fillRect(sx - 35, slotY - 30, 70, 70);
        ctx.strokeStyle = isSelected ? '#0284c7' : '#cbd5e1';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(sx - 35, slotY - 30, 70, 70);

        if (sh) {
          sh.coords.forEach((coord) => {
            const bx = sx - 15 + coord.c * 16;
            const by = slotY - 15 + coord.r * 16;
            ctx.fillStyle = sh.color;
            ctx.fillRect(bx, by, 14, 14);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, 14, 14);
          });
        }
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
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#201d1d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 하단 블록 선택 후 보드 빈칸을 터치해 배치하세요 ]', w / 2, h - 8);
      ctx.textAlign = 'left';

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

    const st = stateRef.current;
    if (st.gameWon) return;

    // Check click on bottom shape slots
    const slotY = 460;
    for (let idx = 0; idx < 3; idx++) {
      const sx = 70 + idx * 110;
      if (Math.abs(x - sx) < 35 && Math.abs(y - slotY) < 35) {
        if (st.availableShapes[idx]) {
          st.selectedShapeIdx = idx;
        }
        return;
      }
    }

    // Check click on 11x11 Grid to place selected shape
    const gridLeft = 35;
    const gridTop = 95;
    const cellSize = 30;

    if (
      st.selectedShapeIdx !== null &&
      x >= gridLeft &&
      x < gridLeft + 11 * cellSize &&
      y >= gridTop &&
      y < gridTop + 11 * cellSize
    ) {
      const baseCol = Math.floor((x - gridLeft) / cellSize);
      const baseRow = Math.floor((y - gridTop) / cellSize);
      const shape = st.availableShapes[st.selectedShapeIdx];

      if (shape) {
        // Validate fits inside grid and cells are empty
        const canPlace = shape.coords.every((coord) => {
          const r = baseRow + coord.r;
          const c = baseCol + coord.c;
          return r >= 0 && r < 11 && c >= 0 && c < 11 && st.grid[r][c] === null;
        });

        if (canPlace) {
          shape.coords.forEach((coord) => {
            const r = baseRow + coord.r;
            const c = baseCol + coord.c;
            st.grid[r][c] = shape.color;
          });

          st.score += shape.coords.length * 10;
          setScore(st.score);

          // Mark shape consumed
          st.availableShapes[st.selectedShapeIdx] = null;
          st.selectedShapeIdx = null;

          // Check if all 3 shapes used -> refill
          if (st.availableShapes.every((s) => s === null)) {
            st.availableShapes = [
              SHAPES[Math.floor(Math.random() * SHAPES.length)],
              SHAPES[Math.floor(Math.random() * SHAPES.length)],
              SHAPES[Math.floor(Math.random() * SHAPES.length)],
            ];
          }

          // Check line clears
          checkLines();
        }
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="11-11"
        score={score}
        targetScore={TARGET_SCORE}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
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

export default PokiElevenElevenGame;

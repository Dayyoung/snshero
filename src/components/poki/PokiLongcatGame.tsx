import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiLongcatGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Pos {
  r: number;
  c: number;
}

export const PokiLongcatGame: React.FC<PokiLongcatGameProps> = ({ onBack, cardId = 22 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [level, setLevel] = useState(1);
  const [filledPct, setFilledPct] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // 6x6 puzzle grids (0: empty, 1: wall)
  const levels = [
    {
      rows: 5,
      cols: 5,
      start: { r: 0, c: 0 },
      walls: [{ r: 1, c: 1 }, { r: 3, c: 3 }],
    },
    {
      rows: 5,
      cols: 6,
      start: { r: 2, c: 0 },
      walls: [{ r: 0, c: 3 }, { r: 4, c: 2 }, { r: 2, c: 4 }],
    },
    {
      rows: 6,
      cols: 6,
      start: { r: 0, c: 0 },
      walls: [{ r: 1, c: 2 }, { r: 2, c: 4 }, { r: 4, c: 1 }, { r: 3, c: 3 }],
    },
  ];

  const gameStateRef = useRef({
    currentLevelIdx: 0,
    body: [] as Pos[],
    head: { r: 0, c: 0 },
    touchStart: { x: 0, y: 0 },
    gridRows: 5,
    gridCols: 5,
    walls: [] as Pos[],
    totalEmptyCells: 0,
  });

  const initLevel = (lvlIdx: number) => {
    const lvl = levels[lvlIdx];
    const totalCells = lvl.rows * lvl.cols;
    const emptyCount = totalCells - lvl.walls.length;

    gameStateRef.current = {
      currentLevelIdx: lvlIdx,
      body: [{ ...lvl.start }],
      head: { ...lvl.start },
      touchStart: { x: 0, y: 0 },
      gridRows: lvl.rows,
      gridCols: lvl.cols,
      walls: lvl.walls,
      totalEmptyCells: emptyCount,
    };
    setFilledPct(Math.round((1 / emptyCount) * 100));
  };

  useEffect(() => {
    initLevel(level - 1);
  }, [level]);

  // Swipe move logic
  const moveCat = (dr: number, dc: number) => {
    const state = gameStateRef.current;
    if (dr === 0 && dc === 0) return;

    let currR = state.head.r;
    let currC = state.head.c;
    let moved = false;

    // Slide until blocked
    while (true) {
      const nextR = currR + dr;
      const nextC = currC + dc;

      // Check bounds
      if (nextR < 0 || nextR >= state.gridRows || nextC < 0 || nextC >= state.gridCols) {
        break;
      }

      // Check walls
      if (state.walls.some(w => w.r === nextR && w.c === nextC)) {
        break;
      }

      // Check self body
      if (state.body.some(b => b.r === nextR && b.c === nextC)) {
        break;
      }

      // Valid slide step
      currR = nextR;
      currC = nextC;
      state.body.push({ r: currR, c: currC });
      moved = true;
    }

    if (moved) {
      state.head = { r: currR, c: currC };
      const pct = Math.round((state.body.length / state.totalEmptyCells) * 100);
      setFilledPct(pct);

      // Check level clear
      if (state.body.length === state.totalEmptyCells) {
        if (level < levels.length) {
          setTimeout(() => {
            setLevel(prev => prev + 1);
          }, 300);
        } else {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_longcat',
            gameTitle: 'Longcat',
            isVictory: true,
            score: 100,
            maxTargetScore: 100,
            durationSeconds: 35,
          });
          setRewardResult(deposit);
        }
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
      const state = gameStateRef.current;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, cw, ch);

      const cellSize = Math.min(Math.floor((cw - 60) / state.gridCols), Math.floor((ch - 220) / state.gridRows), 64);
      const boardW = cellSize * state.gridCols;
      const boardH = cellSize * state.gridRows;
      const startX = (cw - boardW) / 2;
      const startY = (ch - boardH) / 2 + 20;

      // Draw Grid Tiles
      for (let r = 0; r < state.gridRows; r++) {
        for (let c = 0; c < state.gridCols; c++) {
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;
          const isWall = state.walls.some(w => w.r === r && w.c === c);

          if (isWall) {
            ctx.fillStyle = '#27272a';
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            ctx.strokeStyle = '#3f3f46';
            ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          } else {
            ctx.fillStyle = '#18181b';
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            ctx.strokeStyle = '#27272a';
            ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          }
        }
      }

      // Draw Longcat Body
      if (state.body.length > 0) {
        // Connect body segments
        ctx.fillStyle = '#fb7185';
        state.body.forEach((seg, idx) => {
          const x = startX + seg.c * cellSize;
          const y = startY + seg.r * cellSize;

          if (idx === state.body.length - 1) {
            // Head with Card Hero Sprite
            drawCardSprite(ctx, cardId, x + 4, y + 4, cellSize - 8, cellSize - 8);
          } else {
            // Body stretch segment
            ctx.fillRect(x + 6, y + 6, cellSize - 12, cellSize - 12);
            // Cute paw pattern
            ctx.fillStyle = '#fda4af';
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fb7185';
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [level, gameWon, cardId]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    gameStateRef.current.touchStart = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;
    const dx = clientX - gameStateRef.current.touchStart.x;
    const dy = clientY - gameStateRef.current.touchStart.y;

    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        moveCat(0, dx > 0 ? 1 : -1);
      } else {
        moveCat(dy > 0 ? 1 : -1, 0);
      }
    }
  };

  const handleResetLevel = () => {
    initLevel(level - 1);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#09090b] overflow-hidden select-none font-mono touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <MinimalistMissionHUD
        title="LONGCAT"
        score={filledPct}
        goalScore={100}
        onBack={onBack}
        unit="%"
      />

      {/* Level Info & Reset */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm">
        <span className="text-xs text-rose-400 font-bold">
          STAGE {level} / {levels.length} • FILL THE GRID 100%
        </span>
        <button
          onClick={handleResetLevel}
          className="px-2.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-sm border border-zinc-600 cursor-pointer"
        >
          [RETRY STAGE]
        </button>
      </div>

      {/* Swipe Guide */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 <span className="text-rose-400 font-bold">상/하/좌/우로 스와이프</span>하여 롱캣을 늘려 모든 칸을 채우세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Victory Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          onClose={onBack}
          rewardAmount={rewardResult?.rewardAmount || 35}
          message="롱캣 퍼즐의 모든 스테이지 그리드를 100% 완벽하게 채웠습니다!"
        />
      )}
    </div>
  );
};

export default PokiLongcatGame;

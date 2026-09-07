import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBoomyWorldGameProps {
  onBack: () => void;
}

interface Tile {
  r: number;
  c: number;
  type: 'empty' | 'monster' | 'barrel' | 'bomb' | 'wall';
  monsterHp?: number;
  flameTimer?: number;
}

export const PokiBoomyWorldGame: React.FC<PokiBoomyWorldGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'placing' | 'exploding' | 'victory' | 'gameover'>('ready');
  const [bombsLeft, setBombsLeft] = useState(3);
  const [monstersDefeated, setMonstersDefeated] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const ROWS = 8;
  const COLS = 6;
  const TILE_SIZE = 50;

  const stateRef = useRef({
    grid: [] as Tile[][],
    totalMonsters: 10,
    chainQueue: [] as { r: number; c: number; delay: number }[],
  });

  const initGrid = useCallback(() => {
    const grid: Tile[][] = [];
    let monsterCount = 0;

    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        // Outer boundaries or inner walls
        if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
          grid[r][c] = { r, c, type: 'wall' };
        } else if ((r % 2 === 0 && c % 2 === 0) && Math.random() > 0.4) {
          grid[r][c] = { r, c, type: 'barrel' }; // Explosive barrels that propagate flame
        } else if (monsterCount < 10 && Math.random() > 0.35) {
          grid[r][c] = { r, c, type: 'monster', monsterHp: 1 };
          monsterCount++;
        } else {
          grid[r][c] = { r, c, type: 'empty' };
        }
      }
    }

    // Ensure exactly 10 monsters
    while (monsterCount < 10) {
      const rr = 1 + Math.floor(Math.random() * (ROWS - 2));
      const cc = 1 + Math.floor(Math.random() * (COLS - 2));
      if (grid[rr][cc].type === 'empty') {
        grid[rr][cc] = { r: rr, c: cc, type: 'monster', monsterHp: 1 };
        monsterCount++;
      }
    }

    stateRef.current.grid = grid;
    stateRef.current.totalMonsters = 10;
    stateRef.current.chainQueue = [];
    setBombsLeft(3);
    setMonstersDefeated(0);
  }, []);

  const handleStart = () => {
    initGrid();
    setGameState('placing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiboomyworld',
      gameTitle: 'Boomy World: Chain Reaction',
      isVictory: true,
      score: 10,
      maxTargetScore: 10,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  // Place or remove bomb on tile
  const handleTileClick = (r: number, c: number) => {
    if (gameState !== 'placing') return;
    const cell = stateRef.current.grid[r]?.[c];
    if (!cell) return;

    if (cell.type === 'empty' && bombsLeft > 0) {
      cell.type = 'bomb';
      setBombsLeft((prev) => prev - 1);
    } else if (cell.type === 'bomb') {
      cell.type = 'empty';
      setBombsLeft((prev) => prev + 1);
    }
  };

  // Detonate chain reaction
  const triggerDetonation = () => {
    if (gameState !== 'placing') return;
    setGameState('exploding');

    const { grid } = stateRef.current;
    let initialBombs = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].type === 'bomb') {
          initialBombs++;
          triggerExplodeAt(r, c, 0);
        }
      }
    }

    if (initialBombs === 0) {
      setGameState('placing');
    }
  };

  const triggerExplodeAt = (startR: number, startC: number, delayMs: number) => {
    setTimeout(() => {
      const { grid } = stateRef.current;
      const origin = grid[startR]?.[startC];
      if (!origin) return;

      origin.flameTimer = 20; // active flame frames

      // Blast cross 4 directions
      const dirs = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];

      dirs.forEach(({ dr, dc }) => {
        for (let step = 1; step <= 2; step++) {
          const nr = startR + dr * step;
          const nc = startC + dc * step;
          const target = grid[nr]?.[nc];
          if (!target || target.type === 'wall') break;

          target.flameTimer = 20;

          if (target.type === 'monster') {
            target.type = 'empty';
            setMonstersDefeated((prev) => {
              const updated = prev + 1;
              if (updated >= 10) {
                setTimeout(() => handleVictory(), 600);
              }
              return updated;
            });
          } else if (target.type === 'barrel') {
            target.type = 'empty';
            // Barrel explodes after 150ms chain delay
            triggerExplodeAt(nr, nc, 150);
            break;
          }
        }
      });
    }, delayMs);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const { grid } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Dark sci-fi arena background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Board offset
      const startX = (width - COLS * TILE_SIZE) / 2;
      const startY = 80;

      // Draw Grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;

          const px = startX + c * TILE_SIZE;
          const py = startY + r * TILE_SIZE;

          // Tile Floor
          ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#334155';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

          // Tile Content
          if (cell.type === 'wall') {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
          } else if (cell.type === 'barrel') {
            // Explosive Barrel
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🛢️', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 5);
          } else if (cell.type === 'monster') {
            // Monster
            ctx.fillStyle = '#7c3aed';
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👾', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 5);
          } else if (cell.type === 'bomb') {
            // Player Bomb
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💣', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 6);
          }

          // Flames Effect
          if (cell.flameTimer && cell.flameTimer > 0) {
            cell.flameTimer--;
            ctx.fillStyle = 'rgba(249, 115, 22, 0.75)';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
          }
        }
      }

      // Hero mascot at bottom (Card #82)
      drawCardSprite(ctx, 82, 30, height - 90, 48, 62);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('[ 폭파 마스터 ]', 90, height - 55);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('빈 타일에 폭탄을 설치하고 격발하세요!', 90, height - 38);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [handleVictory]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = ((e.clientX - rect.left) / rect.width) * 400;
    const my = ((e.clientY - rect.top) / rect.height) * 600;

    const startX = (400 - COLS * TILE_SIZE) / 2;
    const startY = 80;

    const c = Math.floor((mx - startX) / TILE_SIZE);
    const r = Math.floor((my - startY) / TILE_SIZE);

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      handleTileClick(r, c);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#0f172a] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Boomy World"
        missionTarget="몬스터 10마리 연쇄 폭파"
        currentScore={monstersDefeated}
        maxScore={10}
        scoreUnit="마리"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-slate-900 touch-none shadow-2xl"
          onClick={handleCanvasClick}
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">[ Boomy World ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              전략적 폭발물 배치로 보드의 몬스터를 전멸시키세요!<br />
              1. <b>빈 타일</b>을 터치해 TNT 폭탄 3개를 배치합니다.<br />
              2. 붉은 화약통(🛢️)에 불길이 닿으면 <b>연쇄 폭발</b>이 일어납니다.<br />
              3. [격발] 버튼을 탭해 10마리 몬스터를 모두 폭파하세요!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              미션 시작 [START]
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={onBack}
          />
        )}
      </div>

      {/* Bomb Control Bar */}
      {gameState === 'placing' && (
        <div className="w-full max-w-md p-3 bg-slate-950/95 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-amber-400 font-bold flex-1">
            💣 남은 폭탄: {bombsLeft}개
          </div>
          <button
            onClick={triggerDetonation}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-sm text-sm active:scale-95 transition-all shadow animate-pulse"
          >
            🔥 DETONATE (격발!)
          </button>
        </div>
      )}
    </div>
  );
};
export default PokiBoomyWorldGame;

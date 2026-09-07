import React, { useEffect, useRef, useState } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlastBuddiesGameProps {
  onClose: () => void;
}

interface Buddy {
  id: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  isPlayer: boolean;
  cardId: number;
  color: string;
  alive: boolean;
  bombRange: number;
  maxBombs: number;
  activeBombs: number;
}

interface Bomb {
  id: number;
  gx: number;
  gy: number;
  range: number;
  timer: number;
  ownerId: string;
}

interface ExplosionTile {
  gx: number;
  gy: number;
  timer: number;
}

interface Item {
  gx: number;
  gy: number;
  type: 'range' | 'bomb' | 'speed';
}

export default function PokiBlastBuddiesGame({ onClose }: PokiBlastBuddiesGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [enemiesEliminated, setEnemiesEliminated] = useState(0);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const GRID_SIZE = 9; // 9x9 grid

  const stateRef = useRef<{
    map: number[][]; // 0: empty, 1: indestructible wall, 2: destructible crate
    buddies: Buddy[];
    bombs: Bomb[];
    explosions: ExplosionTile[];
    items: Item[];
    tileSize: number;
    offsetX: number;
    offsetY: number;
    touchStartPos: { x: number; y: number } | null;
  }>({
    map: [],
    buddies: [],
    bombs: [],
    explosions: [],
    items: [],
    tileSize: 36,
    offsetX: 0,
    offsetY: 0,
    touchStartPos: null
  });

  const playSound = (type: 'drop' | 'boom' | 'item' | 'win') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'drop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'boom') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'item') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.12);
        osc.frequency.setValueAtTime(784, now + 0.24);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let nextBombId = 1;

    // Init Map
    const initMap = () => {
      const m: number[][] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        m[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
            m[y][x] = 1; // Outer solid wall
          } else if (x % 2 === 0 && y % 2 === 0) {
            m[y][x] = 1; // Pillar
          } else {
            // Safe spawn spots for 3 players
            const isSpawn =
              (x === 1 && y === 1) ||
              (x === 1 && y === 2) ||
              (x === 2 && y === 1) ||
              (x === GRID_SIZE - 2 && y === 1) ||
              (x === GRID_SIZE - 2 && y === 2) ||
              (x === 1 && y === GRID_SIZE - 2) ||
              (x === 2 && y === GRID_SIZE - 2);

            if (!isSpawn && Math.random() < 0.6) {
              m[y][x] = 2; // Destructible crate
            } else {
              m[y][x] = 0;
            }
          }
        }
      }
      stateRef.current.map = m;

      // Init Buddies
      stateRef.current.buddies = [
        {
          id: 'player',
          x: 1,
          y: 1,
          gridX: 1,
          gridY: 1,
          isPlayer: true,
          cardId: 62,
          color: '#3b82f6',
          alive: true,
          bombRange: 2,
          maxBombs: 2,
          activeBombs: 0
        },
        {
          id: 'enemy1',
          x: GRID_SIZE - 2,
          y: 1,
          gridX: GRID_SIZE - 2,
          gridY: 1,
          isPlayer: false,
          cardId: 15,
          color: '#ef4444',
          alive: true,
          bombRange: 2,
          maxBombs: 1,
          activeBombs: 0
        },
        {
          id: 'enemy2',
          x: 1,
          y: GRID_SIZE - 2,
          gridX: 1,
          gridY: GRID_SIZE - 2,
          isPlayer: false,
          cardId: 9,
          color: '#eab308',
          alive: true,
          bombRange: 2,
          maxBombs: 1,
          activeBombs: 0
        }
      ];
    };

    initMap();

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      const s = stateRef.current;
      s.tileSize = Math.min(Math.floor((canvas.width - 24) / GRID_SIZE), Math.floor((canvas.height - 120) / GRID_SIZE), 44);
      s.offsetX = Math.floor((canvas.width - GRID_SIZE * s.tileSize) / 2);
      s.offsetY = Math.floor((canvas.height - GRID_SIZE * s.tileSize) / 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const placeBomb = (buddy: Buddy) => {
      const s = stateRef.current;
      if (!buddy.alive || buddy.activeBombs >= buddy.maxBombs) return;
      // Check if bomb already on this tile
      const exists = s.bombs.some((b) => b.gx === buddy.gridX && b.gy === buddy.gridY);
      if (exists) return;

      s.bombs.push({
        id: nextBombId++,
        gx: buddy.gridX,
        gy: buddy.gridY,
        range: buddy.bombRange,
        timer: 110, // ~1.8s
        ownerId: buddy.id
      });
      buddy.activeBombs++;
      playSound('drop');
    };

    // Main Game Loop
    const loop = () => {
      const s = stateRef.current;

      // Update Bombs
      for (let i = s.bombs.length - 1; i >= 0; i--) {
        const b = s.bombs[i];
        b.timer--;
        if (b.timer <= 0) {
          // Explode!
          playSound('boom');
          const owner = s.buddies.find((bd) => bd.id === b.ownerId);
          if (owner) owner.activeBombs = Math.max(0, owner.activeBombs - 1);

          s.explosions.push({ gx: b.gx, gy: b.gy, timer: 20 });

          // 4 directions
          const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
          ];

          dirs.forEach(({ dx, dy }) => {
            for (let r = 1; r <= b.range; r++) {
              const nx = b.gx + dx * r;
              const ny = b.gy + dy * r;
              if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) break;

              // Solid wall blocks
              if (s.map[ny][nx] === 1) break;

              // Explosion tile
              s.explosions.push({ gx: nx, gy: ny, timer: 20 });

              // Destructible crate
              if (s.map[ny][nx] === 2) {
                s.map[ny][nx] = 0;
                // Chance to drop item
                if (Math.random() < 0.4) {
                  const types: ('range' | 'bomb' | 'speed')[] = ['range', 'bomb', 'speed'];
                  s.items.push({
                    gx: nx,
                    gy: ny,
                    type: types[Math.floor(Math.random() * types.length)]
                  });
                }
                break; // Stop beam after crate
              }
            }
          });

          s.bombs.splice(i, 1);
        }
      }

      // Update Explosions
      for (let i = s.explosions.length - 1; i >= 0; i--) {
        const exp = s.explosions[i];
        exp.timer--;

        // Check if hit buddies
        s.buddies.forEach((bd) => {
          if (bd.alive && bd.gridX === exp.gx && bd.gridY === exp.gy) {
            bd.alive = false;
            if (bd.isPlayer) {
              setGameOver(true);
            }
          }
        });

        if (exp.timer <= 0) {
          s.explosions.splice(i, 1);
        }
      }

      // Enemy Simple AI
      s.buddies.forEach((bd) => {
        if (bd.isPlayer || !bd.alive) return;

        // Random move or place bomb
        if (Math.random() < 0.04) {
          const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
          ];
          const d = dirs[Math.floor(Math.random() * dirs.length)];
          const tx = bd.gridX + d.dx;
          const ty = bd.gridY + d.dy;
          if (
            tx >= 0 &&
            tx < GRID_SIZE &&
            ty >= 0 &&
            ty < GRID_SIZE &&
            s.map[ty][tx] === 0 &&
            !s.bombs.some((bm) => bm.gx === tx && bm.gy === ty)
          ) {
            bd.gridX = tx;
            bd.gridY = ty;
            bd.x = tx;
            bd.y = ty;
          }
        }

        // Drop bomb near crate
        if (Math.random() < 0.015) {
          placeBomb(bd);
        }
      });

      // Item Pickup
      const player = s.buddies.find((b) => b.isPlayer);
      if (player && player.alive) {
        for (let i = s.items.length - 1; i >= 0; i--) {
          const it = s.items[i];
          if (it.gx === player.gridX && it.gy === player.gridY) {
            if (it.type === 'range') player.bombRange++;
            if (it.type === 'bomb') player.maxBombs++;
            playSound('item');
            s.items.splice(i, 1);
          }
        }
      }

      // Check Win Condition
      const enemiesDead = s.buddies.filter((b) => !b.isPlayer && !b.alive).length;
      setEnemiesEliminated(enemiesDead);
      if (enemiesDead >= 2 && !gameWon && player?.alive) {
        setGameWon(true);
        playSound('win');
        const deposit = calculateAndDepositMissionReward({
          gameId: 'pokiblastbuddies',
          gameTitle: 'Blast Buddies',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: 30
        });
        setRewardResult(deposit);
      }

      // Render
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const ts = s.tileSize;
      const ox = s.offsetX;
      const oy = s.offsetY;

      // Draw Grid Background
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const px = ox + x * ts;
          const py = oy + y * ts;

          // Floor
          ctx.fillStyle = (x + y) % 2 === 0 ? '#27272a' : '#3f3f46';
          ctx.fillRect(px, py, ts, ts);

          // Wall / Crate
          if (s.map[y][x] === 1) {
            ctx.fillStyle = '#71717a';
            ctx.fillRect(px, py, ts, ts);
            ctx.strokeStyle = '#52525b';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, ts, ts);
          } else if (s.map[y][x] === 2) {
            ctx.fillStyle = '#b45309';
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
          }
        }
      }

      // Draw Items
      s.items.forEach((it) => {
        const px = ox + it.gx * ts;
        const py = oy + it.gy * ts;
        ctx.fillStyle = it.type === 'range' ? '#ef4444' : it.type === 'bomb' ? '#3b82f6' : '#22c55e';
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + ts / 2, ts * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.type === 'range' ? '🔥' : '💣', px + ts / 2, py + ts / 2);
      });

      // Draw Bombs
      s.bombs.forEach((b) => {
        const px = ox + b.gx * ts + ts / 2;
        const py = oy + b.gy * ts + ts / 2;
        const pulse = 1 + Math.sin(b.timer * 0.2) * 0.1;
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(px, py, ts * 0.35 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py - ts * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Explosions
      s.explosions.forEach((exp) => {
        const px = ox + exp.gx * ts;
        const py = oy + exp.gy * ts;
        ctx.fillStyle = `rgba(249, 115, 22, ${exp.timer / 20})`;
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = `rgba(254, 240, 138, ${exp.timer / 20})`;
        ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
      });

      // Draw Buddies
      s.buddies.forEach((bd) => {
        if (!bd.alive) return;
        const px = ox + bd.x * ts;
        const py = oy + bd.y * ts;
        drawCardSprite(ctx, bd.cardId, px + 2, py + 2, ts - 4, ts - 4);

        if (bd.isPlayer) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
        }
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Swipe navigation & Tap to drop bomb
    let touchStart: { x: number; y: number } | null = null;
    let hasMoved = false;

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
      hasMoved = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;

      if (Math.hypot(dx, dy) > 20) {
        hasMoved = true;
        const player = stateRef.current.buddies.find((b) => b.isPlayer);
        if (player && player.alive) {
          let tx = player.gridX;
          let ty = player.gridY;

          if (Math.abs(dx) > Math.abs(dy)) {
            tx += dx > 0 ? 1 : -1;
          } else {
            ty += dy > 0 ? 1 : -1;
          }

          if (
            tx >= 0 &&
            tx < GRID_SIZE &&
            ty >= 0 &&
            ty < GRID_SIZE &&
            stateRef.current.map[ty][tx] === 0 &&
            !stateRef.current.bombs.some((b) => b.gx === tx && b.gy === ty)
          ) {
            player.gridX = tx;
            player.gridY = ty;
            player.x = tx;
            player.y = ty;
          }
        }
        touchStart = { x: t.clientX, y: t.clientY };
      }
    };

    const handleTouchEnd = () => {
      // Tap without moving = drop bomb
      if (!hasMoved) {
        const player = stateRef.current.buddies.find((b) => b.isPlayer);
        if (player && player.alive) {
          placeBomb(player);
        }
      }
      touchStart = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameWon]);

  return (
    <div className="relative w-full h-full bg-zinc-950 flex flex-col select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Blast Buddies"
        missionTarget="폭탄으로 적 버디 2명 폭파 제압"
        currentProgress={`${enemiesEliminated} / 2 KO`}
        rewardSNS={38}
        onClose={onClose}
      />

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Quick Guide Overlay */}
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-zinc-900/80 text-zinc-400 border border-zinc-700 px-3 py-1 text-[11px] rounded-sm">
            드래그: 이동 | 원터치 탭: 폭탄 설치
          </span>
        </div>

        {/* Game Over Modal */}
        {gameOver && !gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-none text-center max-w-sm">
              <h2 className="text-xl font-bold text-red-400 mb-2">폭발에 휩쓸림!</h2>
              <p className="text-xs text-zinc-400 mb-4">폭탄의 불길을 피하지 못했습니다.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-sm"
                >
                  다시 도전
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-sm border border-zinc-700"
                >
                  나가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardSNS={rewardResult.rewardSNS}
          gameTitle="Blast Buddies"
          isFirstClear={rewardResult.isFirstClear}
          totalPlays={rewardResult.totalPlays}
          streakBonus={rewardResult.streakBonus}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Skull } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface PacmanGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID_SIZE = 15;
const CELL_SIZE = 24;
const CANVAS_W = GRID_SIZE * CELL_SIZE;
const CANVAS_H = GRID_SIZE * CELL_SIZE;
const INITIAL_GHOST_COUNT = 2;
const POWER_DURATION = 6000;
const BASE_GHOST_SPEED = 130;
const MIN_GHOST_SPEED = 75;
const PLAYER_SPEED = 80;
const EXTRA_GHOST_SCORE = 500; // +1 ghost every 500pts

type Direction = 'up' | 'down' | 'left' | 'right' | '';
type CellType = 0 | 1 | 2 | 3;

const MAZE_TEMPLATE: CellType[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,0,0,1,0,1,1,0,1],
  [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,0,0,0,1,3,1,0,0,0,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
  [1,0,1,1,0,1,0,0,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

interface Ghost {
  x: number;
  y: number;
  direction: Direction;
  cardId: number;
  frightened: boolean;
  moveTimer: number;
}

interface Particle {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  cardId: number;
}

export const PacmanGame: React.FC<PacmanGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const playerCardId = (() => {
    const c = deck[0];
    const id = typeof c?.id === 'number' ? c.id : 1;
    return CARD_DATABASE[id] ? id : 1;
  })();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const gameRef = useRef({
    playerX: 1,
    playerY: 1,
    playerDir: 'right' as Direction,
    nextDir: '' as Direction,
    moveTimer: 0,
    maze: MAZE_TEMPLATE.map(row => [...row]) as CellType[][],
    ghosts: [] as Ghost[],
    particles: [] as Particle[],
    score: 0,
    dotsLeft: 0,
    maxGhosts: INITIAL_GHOST_COUNT,
    ghostSpeed: BASE_GHOST_SPEED,
    powerTimer: 0,
    isGameOver: false,
    isWin: false,
    started: false,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [hudScore, setHudScore] = useState(0);
  const [hudGameOver, setHudGameOver] = useState(false);
  const [hudWin, setHudWin] = useState(false);
  const [swipeHint, setSwipeHint] = useState<string | null>(null);
  const hudCounter = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const initMaze = useCallback(() => {
    const g = gameRef.current;
    g.maze = MAZE_TEMPLATE.map(row => [...row]) as CellType[][];
    g.playerX = 1;
    g.playerY = 1;
    g.playerDir = 'right';
    g.nextDir = '';
    g.moveTimer = 0;
    g.score = 0;
    g.powerTimer = 0;
    g.isGameOver = false;
    g.isWin = false;
    g.particles = [];
    g.maxGhosts = INITIAL_GHOST_COUNT;
    g.ghostSpeed = BASE_GHOST_SPEED;

    let dots = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (g.maze[y][x] === 0 || g.maze[y][x] === 2) dots++;
      }
    }
    g.dotsLeft = dots;

    const ghostStarts = [
      { x: 7, y: 6 },
      { x: 1, y: 13 },
    ];
    g.ghosts = ghostStarts.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      direction: ['left', 'right', 'up'][i] as Direction,
      cardId: ((i * 37) % 110) + 1,
      frightened: false,
      moveTimer: 0,
    }));

    rewardedRef.current = false;
    lastTimeRef.current = 0;
    setHudScore(0);
    setHudGameOver(false);
    setHudWin(false);
  }, []);

  useEffect(() => {
    initMaze();
  }, [initMaze]);

  useEffect(() => {
    if ((hudGameOver || hudWin) && !rewardedRef.current) {
      rewardedRef.current = true;
      onReward(Math.floor(gameRef.current.score / 20));
    }
  }, [hudGameOver, hudWin, onReward]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      const key = e.key.toLowerCase();
      const g = gameRef.current;
      if (!g.started) g.started = true;
      if (key === 'arrowup' || key === 'w') { g.nextDir = 'up'; e.preventDefault(); }
      else if (key === 'arrowdown' || key === 's') { g.nextDir = 'down'; e.preventDefault(); }
      else if (key === 'arrowleft' || key === 'a') { g.nextDir = 'left'; e.preventDefault(); }
      else if (key === 'arrowright' || key === 'd') { g.nextDir = 'right'; e.preventDefault(); }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const canMove = (maze: CellType[][], x: number, y: number, dir: Direction): boolean => {
    let nx = x, ny = y;
    if (dir === 'up') ny--;
    else if (dir === 'down') ny++;
    else if (dir === 'left') nx--;
    else if (dir === 'right') nx++;
    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return false;
    return maze[ny][nx] !== 1;
  };

  const moveEntity = (x: number, y: number, dir: Direction) => {
    if (dir === 'up') return { x, y: y - 1 };
    if (dir === 'down') return { x, y: y + 1 };
    if (dir === 'left') return { x: x - 1, y };
    return { x: x + 1, y };
  };

  // Spawn an extra ghost at a random empty cell
  const spawnExtraGhost = useCallback(() => {
    const g = gameRef.current;
    const emptyCells: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (g.maze[y][x] !== 1) {
          const occupied = g.ghosts.some(gh => gh.x === x && gh.y === y);
          if (!occupied && (Math.abs(x - g.playerX) > 5 || Math.abs(y - g.playerY) > 5)) {
            emptyCells.push({ x, y });
          }
        }
      }
    }
    if (emptyCells.length > 0) {
      const pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      g.ghosts.push({
        x: pos.x,
        y: pos.y,
        direction: 'left',
        cardId: ((g.ghosts.length * 47) % 110) + 1,
        frightened: false,
        moveTimer: Math.floor(Math.random() * g.ghostSpeed * 0.5),
      });
    }
  }, []);

  // Update difficulty based on score
  const updateDifficulty = useCallback((score: number) => {
    const g = gameRef.current;
    // Ghost speed: base 130ms → min 75ms (gentle progression)
    const totalDots = (() => {
      let d = 0;
      const t = MAZE_TEMPLATE;
      for (let y = 0; y < GRID_SIZE; y++)
        for (let x = 0; x < GRID_SIZE; x++)
          if (t[y][x] === 0 || t[y][x] === 2) d++;
      return d;
    })();
    const progress = 1 - (g.dotsLeft / totalDots);
    g.ghostSpeed = Math.max(MIN_GHOST_SPEED, BASE_GHOST_SPEED - Math.floor(progress * 55));

    // Extra ghost every EXTRA_GHOST_SCORE points, max 4 total
    const targetGhosts = INITIAL_GHOST_COUNT + Math.floor(score / EXTRA_GHOST_SCORE);
    while (g.ghosts.length < targetGhosts && g.ghosts.length < 4) {
      spawnExtraGhost();
    }
  }, [spawnExtraGhost]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const g = gameRef.current;

      if (g.isGameOver || g.isWin) {
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!g.started) {
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawDelta = timestamp - lastTimeRef.current;
      const delta = Math.min(rawDelta, 33);
      lastTimeRef.current = timestamp;

      if (g.powerTimer > 0) {
        g.powerTimer -= delta;
        if (g.powerTimer <= 0) {
          g.powerTimer = 0;
          for (const gh of g.ghosts) gh.frightened = false;
        }
      }

      g.moveTimer += delta;
      if (g.moveTimer >= PLAYER_SPEED) {
        g.moveTimer = 0;

        if (g.nextDir && canMove(g.maze, g.playerX, g.playerY, g.nextDir)) {
          g.playerDir = g.nextDir;
        }
        if (g.playerDir && canMove(g.maze, g.playerX, g.playerY, g.playerDir)) {
          const next = moveEntity(g.playerX, g.playerY, g.playerDir);
          g.playerX = next.x;
          g.playerY = next.y;

          const cell = g.maze[g.playerY][g.playerX];
          if (cell === 0) {
            g.maze[g.playerY][g.playerX] = 3;
            g.score += 10;
            g.dotsLeft--;
            updateDifficulty(g.score);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          } else if (cell === 2) {
            g.maze[g.playerY][g.playerX] = 3;
            g.score += 50;
            g.dotsLeft--;
            g.powerTimer = POWER_DURATION;
            for (const gh of g.ghosts) gh.frightened = true;
            updateDifficulty(g.score);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          }

          if (g.dotsLeft <= 0) {
            g.isWin = true;
            setHudWin(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          }
        }
      }

      for (const gh of g.ghosts) {
        gh.moveTimer += delta;
        const speed = gh.frightened ? g.ghostSpeed * 1.5 : g.ghostSpeed;
        if (gh.moveTimer >= speed) {
          gh.moveTimer = 0;

          if (gh.frightened) {
            const options = ['up', 'down', 'left', 'right'].filter(d => canMove(g.maze, gh.x, gh.y, d as Direction));
            if (options.length > 0) {
              const awayOptions = options.filter(d => {
                const n = moveEntity(gh.x, gh.y, d as Direction);
                const dx = n.x - g.playerX;
                const dy = n.y - g.playerY;
                return (Math.abs(dx) + Math.abs(dy)) > 0;
              });
              // When frightened, prefer fleeing
              const fleeDir = awayOptions.length > 0 
                ? awayOptions.reduce((best, d) => {
                    const n = moveEntity(gh.x, gh.y, d as Direction);
                    const dist = Math.abs(n.x - g.playerX) + Math.abs(n.y - g.playerY);
                    const nBest = moveEntity(gh.x, gh.y, best as Direction);
                    const bestDist = Math.abs(nBest.x - g.playerX) + Math.abs(nBest.y - g.playerY);
                    return dist > bestDist ? d : best;
                  })
                : options[Math.floor(Math.random() * options.length)];
              gh.direction = fleeDir as Direction;
            }
          } else {
            const options = ['up', 'down', 'left', 'right'].filter(d => canMove(g.maze, gh.x, gh.y, d as Direction));
            if (options.length > 0) {
              let best = options[0];
              let bestDist = Infinity;
              for (const d of options) {
                const n = moveEntity(gh.x, gh.y, d as Direction);
                const dist = Math.abs(n.x - g.playerX) + Math.abs(n.y - g.playerY);
                if (dist < bestDist) {
                  bestDist = dist;
                  best = d;
                }
              }
              // Random movement with moderate chase probability
              const pursuitChance = 0.55;
              if (Math.random() < pursuitChance) {
                gh.direction = best as Direction;
              } else {
                gh.direction = options[Math.floor(Math.random() * options.length)] as Direction;
              }
            }
          }

          if (gh.direction && canMove(g.maze, gh.x, gh.y, gh.direction)) {
            const next = moveEntity(gh.x, gh.y, gh.direction);
            gh.x = next.x;
            gh.y = next.y;
          }
        }

        if (gh.x === g.playerX && gh.y === g.playerY) {
          if (gh.frightened) {
            g.score += 200;
            gh.x = 7; gh.y = 6;
            gh.frightened = false;
            gh.moveTimer = 0;
            updateDifficulty(g.score);
            if (!lowSpecMode) {
              for (let i = 0; i < 3; i++) {
                g.particles.push({
                  x: gh.x * CELL_SIZE + CELL_SIZE / 2,
                  y: gh.y * CELL_SIZE + CELL_SIZE / 2,
                  life: 400, maxLife: 400,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3,
                  cardId: gh.cardId
                });
              }
            }
            playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
          } else {
            g.isGameOver = true;
            setHudGameOver(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
          }
        }
      }

      g.particles = g.particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - delta }))
        .filter(p => p.life > 0);

      hudCounter.current++;
      if (hudCounter.current % 4 === 0) {
        setHudScore(g.score);
      }

      renderCanvas(g, timestamp);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [language, lowSpecMode, playSfx, updateDifficulty]);

  const renderCanvas = (g: typeof gameRef.current, timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = g.maze[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell === 1) {
          ctx.fillStyle = '#1e3a5f';
          ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        } else if (cell === 0) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 2) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          if (!lowSpecMode) {
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.2 * Math.sin(timestamp / 200);
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    const img = cardImgRef.current;
    const drawCard = (cardId: number, cx: number, cy: number, size: number) => {
      if (!img || !img.complete || img.naturalWidth <= 0) {
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
        return;
      }
      const idx = CARD_DATABASE[cardId] ? cardId : 1;
      const col = (idx - 1) % 10;
      const row = Math.floor((idx - 1) / 10);
      const spriteW = img.naturalWidth / 10;
      const spriteH = img.naturalHeight / 11;
      ctx.drawImage(img, col * spriteW, row * spriteH, spriteW, spriteH, cx - size / 2, cy - size / 2, size, size);
    };

    drawCard(playerCardId, g.playerX * CELL_SIZE + CELL_SIZE / 2, g.playerY * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE - 4);

    for (const gh of g.ghosts) {
      const ghX = gh.x * CELL_SIZE + CELL_SIZE / 2;
      const ghY = gh.y * CELL_SIZE + CELL_SIZE / 2;
      const ghSize = CELL_SIZE - 4;

      if (gh.frightened) {
        ctx.save();
        ctx.globalAlpha = g.powerTimer < 2000 ? 0.4 + 0.6 * ((Math.floor(timestamp / 150) % 2)) : 1;
        drawCard(gh.cardId, ghX, ghY, ghSize);
        ctx.restore();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ghX, ghY, ghSize / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        drawCard(gh.cardId, ghX, ghY, ghSize);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ghX, ghY, ghSize / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (!lowSpecMode) {
      for (const p of g.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        drawCard(p.cardId, p.x, p.y, 10 * alpha);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${g.score}`, 4, 4);
    ctx.restore();

    if (g.powerTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${language === 'ko' ? '파워' : 'PWR'} ${Math.ceil(g.powerTimer / 1000)}s`, CANVAS_W - 4, 4);
      ctx.restore();
    }

    // Ghost speed indicator
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      `${language === 'ko' ? '유령' : 'GHOSTS'} ${g.ghosts.length}`,
      4, CANVAS_H - 4
    );
    ctx.restore();

    if (!g.started) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(language === 'ko' ? '스와이프로 방향 전환' : 'SWIPE TO SET DIRECTION', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillText(language === 'ko' ? '탭하여 시작' : 'TAP TO START', CANVAS_W / 2, CANVAS_H / 2 + 14);
      ctx.restore();
    }

    // Swipe direction hint
    if (swipeHint && !g.isGameOver && !g.isWin) {
      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
      const hintX = CANVAS_W / 2;
      const hintY = CANVAS_H / 2;
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (swipeHint === 'up') ctx.fillText('▲', hintX, hintY);
      else if (swipeHint === 'down') ctx.fillText('▼', hintX, hintY);
      else if (swipeHint === 'left') ctx.fillText('◀', hintX, hintY);
      else if (swipeHint === 'right') ctx.fillText('▶', hintX, hintY);
      ctx.restore();
    }
  };

  const changeDirection = (dir: Direction) => {
    const g = gameRef.current;
    if (g.isGameOver || g.isWin) return;
    if (!g.started) g.started = true;
    g.nextDir = dir;
  };

  // ── Touch / Swipe handlers ──
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    touchStartRef.current = null;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Require minimum distance for swipe
    const SWIPE_THRESHOLD = 20;
    if (dist < SWIPE_THRESHOLD) {
      // Tap — just start if not started
      if (!gameRef.current.started) gameRef.current.started = true;
      return;
    }

    // Determine dominant direction
    if (Math.abs(dx) > Math.abs(dy)) {
      const dir: Direction = dx > 0 ? 'right' : 'left';
      setSwipeHint(dir);
      changeDirection(dir);
    } else {
      const dir: Direction = dy > 0 ? 'down' : 'up';
      setSwipeHint(dir);
      changeDirection(dir);
    }

    // Clear hint after 300ms
    setTimeout(() => setSwipeHint(null), 300);
  };

  const startGame = useCallback(() => {
    initMaze();
    gameRef.current.started = true;
  }, [initMaze]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center font-sans select-none">
      <header className="w-full max-w-md flex items-center justify-between p-3">
        <button onClick={onExit} className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black uppercase tracking-tight">{t('mode_pacman', language)}</h1>
          {gameRef.current.powerTimer > 0 && (
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              {language === 'ko' ? '파워' : 'PWR'} {Math.ceil(gameRef.current.powerTimer / 1000)}s
            </p>
          )}
        </div>
        <div className="px-3 py-2 rounded-2xl bg-indigo-500/20 border border-indigo-400/20 text-indigo-100 font-black text-sm tabular-nums">
          {hudScore}
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-4">
        <div
          className="relative bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl touch-none select-none"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-full" />

          {(hudGameOver || hudWin) && (
            <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl">
                {hudWin ? (
                  <Trophy size={42} className="mx-auto text-amber-500 mb-3" />
                ) : (
                  <Skull size={42} className="mx-auto text-rose-500 mb-3" />
                )}
                <h2 className="text-xl font-black mb-1">
                  {hudWin ? (language === 'ko' ? '승리!' : 'WIN!') : (language === 'ko' ? '게임 오버' : 'GAME OVER')}
                </h2>
                <p className="text-sm font-bold text-slate-500 mb-1">
                  {language === 'ko' ? `점수: ${gameRef.current.score}` : `Score: ${gameRef.current.score}`}
                </p>
                <p className="text-sm font-bold text-indigo-600 mb-4">
                  {t('pacman_reward', language).replace('{amount}', String(Math.floor(gameRef.current.score / 20)))}
                </p>
                <div className="flex gap-2">
                  <button onClick={startGame} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer">
                    <RotateCcw size={16} />
                    {language === 'ko' ? '재시작' : 'Restart'}
                  </button>
                  <button onClick={onExit} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black cursor-pointer">
                    {t('home', language)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

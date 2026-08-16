import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Heart } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface BreakoutGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const CANVAS_W = 400;
const CANVAS_H = 600;
const PADDLE_W = 60;
const PADDLE_H = 10;
const BALL_R = 5;
const BRICK_COLS = 10;
const BRICK_ROWS = 10;
const BRICK_W = CANVAS_W / BRICK_COLS;
const BRICK_H = 18;
const BRICK_TOP = 50;
const MAX_LIVES = 3;
const BALL_BASE_SPEED = 4;
const BALL_MAX_SPEED = 7;
const PADDLE_Y = CANVAS_H - 50 - 50;

interface Brick {
  x: number;
  y: number;
  cardId: number;
  alive: boolean;
  row: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  cardId: number;
}

export const BreakoutGame: React.FC<BreakoutGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const gameRef = useRef({
    paddleX: CANVAS_W / 2,
    ballX: CANVAS_W / 2,
    ballY: PADDLE_Y - 30,
    ballVX: BALL_BASE_SPEED * 0.7,
    ballVY: -BALL_BASE_SPEED,
    bricks: [] as Brick[],
    particles: [] as Particle[],
    score: 0,
    lives: MAX_LIVES,
    isGameOver: false,
    isWin: false,
    started: false,
    speedMultiplier: 1,
  });

  const touchRef = useRef<{ active: boolean; x: number }>({ active: false, x: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const [hudScore, setHudScore] = useState(0);
  const [hudLives, setHudLives] = useState(MAX_LIVES);
  const [hudGameOver, setHudGameOver] = useState(false);
  const [hudWin, setHudWin] = useState(false);
  const hudCounter = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const buildBricks = useCallback((): Brick[] => {
    const bricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const cardId = ((row * BRICK_COLS + col) % 110) + 1;
        bricks.push({
          x: col * BRICK_W,
          y: BRICK_TOP + row * BRICK_H,
          cardId: CARD_DATABASE[cardId] ? cardId : 1,
          alive: true,
          row,
        });
      }
    }
    return bricks;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.paddleX = CANVAS_W / 2;
    g.ballX = CANVAS_W / 2;
    g.ballY = PADDLE_Y - 30;
    const angle = -(Math.PI / 4 + Math.random() * Math.PI / 4);
    g.ballVX = BALL_BASE_SPEED * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1);
    g.ballVY = -BALL_BASE_SPEED;
    g.bricks = buildBricks();
    g.particles = [];
    g.score = 0;
    g.lives = MAX_LIVES;
    g.isGameOver = false;
    g.isWin = false;
    g.started = true;
    g.speedMultiplier = 1;
    rewardedRef.current = false;
    lastTimeRef.current = 0;
    setHudScore(0);
    setHudLives(MAX_LIVES);
    setHudGameOver(false);
    setHudWin(false);
  }, [buildBricks]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if ((hudGameOver || hudWin) && !rewardedRef.current) {
      rewardedRef.current = true;
      onReward(Math.floor(gameRef.current.score / 20));
    }
  }, [hudGameOver, hudWin, onReward]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (['arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
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
        g.ballX = g.paddleX;
        g.ballY = PADDLE_Y - 30;
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawDelta = timestamp - lastTimeRef.current;
      const delta = Math.min(rawDelta, 33);
      lastTimeRef.current = timestamp;
      const dt = delta / 16;

      const paddleSpeed = 7 * dt;
      if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) {
        g.paddleX -= paddleSpeed;
      }
      if (keysRef.current.has('arrowright') || keysRef.current.has('d')) {
        g.paddleX += paddleSpeed;
      }

      if (touchRef.current.active) {
        const diff = touchRef.current.x - g.paddleX;
        g.paddleX += diff * 0.3;
      }

      g.paddleX = Math.max(PADDLE_W / 2, Math.min(CANVAS_W - PADDLE_W / 2, g.paddleX));

      const speed = Math.min(BALL_BASE_SPEED * g.speedMultiplier, BALL_MAX_SPEED);
      const currentSpeed = Math.sqrt(g.ballVX * g.ballVX + g.ballVY * g.ballVY);
      if (currentSpeed > 0) {
        const factor = speed / currentSpeed;
        g.ballVX *= factor;
        g.ballVY *= factor;
      }

      g.ballX += g.ballVX * dt;
      g.ballY += g.ballVY * dt;

      if (g.ballX - BALL_R <= 0) {
        g.ballX = BALL_R;
        g.ballVX = Math.abs(g.ballVX);
      }
      if (g.ballX + BALL_R >= CANVAS_W) {
        g.ballX = CANVAS_W - BALL_R;
        g.ballVX = -Math.abs(g.ballVX);
      }
      if (g.ballY - BALL_R <= 0) {
        g.ballY = BALL_R;
        g.ballVY = Math.abs(g.ballVY);
      }

      if (g.ballY + BALL_R >= CANVAS_H) {
        g.lives--;
        setHudLives(g.lives);
        if (g.lives <= 0) {
          g.isGameOver = true;
          setHudGameOver(true);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        } else {
          g.ballX = g.paddleX;
          g.ballY = PADDLE_Y - 30;
          const angle = -(Math.PI / 4 + Math.random() * Math.PI / 4);
          g.ballVX = speed * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1);
          g.ballVY = -speed;
          g.started = true;
          playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        }
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const pLeft = g.paddleX - PADDLE_W / 2;
      const pRight = g.paddleX + PADDLE_W / 2;
      const pTop = PADDLE_Y;
      if (
        g.ballY + BALL_R >= pTop &&
        g.ballY + BALL_R <= pTop + PADDLE_H + 4 &&
        g.ballX >= pLeft - BALL_R &&
        g.ballX <= pRight + BALL_R &&
        g.ballVY > 0
      ) {
        g.ballY = pTop - BALL_R;
        const hitPos = (g.ballX - g.paddleX) / (PADDLE_W / 2);
        const angle = hitPos * (Math.PI / 3);
        g.ballVX = speed * Math.sin(angle);
        g.ballVY = -speed * Math.cos(angle);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      }

      for (const brick of g.bricks) {
        if (!brick.alive) continue;

        const bLeft = brick.x;
        const bRight = brick.x + BRICK_W;
        const bTop = brick.y;
        const bBottom = brick.y + BRICK_H;

        if (
          g.ballX + BALL_R > bLeft &&
          g.ballX - BALL_R < bRight &&
          g.ballY + BALL_R > bTop &&
          g.ballY - BALL_R < bBottom
        ) {
          brick.alive = false;
          g.score += 10;

          const overlapLeft = g.ballX + BALL_R - bLeft;
          const overlapRight = bRight - (g.ballX - BALL_R);
          const overlapTop = g.ballY + BALL_R - bTop;
          const overlapBottom = bBottom - (g.ballY - BALL_R);
          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            g.ballVX = -g.ballVX;
          } else {
            g.ballVY = -g.ballVY;
          }

          g.speedMultiplier = Math.min(g.speedMultiplier + 0.002, 1.6);

          if (!lowSpecMode) {
            for (let i = 0; i < 3; i++) {
              g.particles.push({
                x: brick.x + BRICK_W / 2,
                y: brick.y + BRICK_H / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 400, maxLife: 400,
                cardId: brick.cardId
              });
            }
            if (g.particles.length > 30) {
              g.particles = g.particles.slice(-30);
            }
          }

          playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
          break;
        }
      }

      if (g.bricks.every(b => !b.alive)) {
        g.isWin = true;
        setHudWin(true);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
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
  }, [language, lowSpecMode, playSfx]);

  const renderCanvas = (g: typeof gameRef.current, timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (!lowSpecMode) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < 15; i++) {
        const sx = (i * 127 + Math.floor(timestamp * 0.003 * ((i % 3) + 1))) % CANVAS_W;
        const sy = (i * 73) % CANVAS_H;
        ctx.fillRect(sx, sy, 1, 1);
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

    const rowColors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1'
    ];

    for (const brick of g.bricks) {
      if (!brick.alive) continue;

      const bx = brick.x + 1;
      const by = brick.y + 1;
      const bw = BRICK_W - 2;
      const bh = BRICK_H - 2;

      drawCard(brick.cardId, brick.x + BRICK_W / 2, brick.y + BRICK_H / 2, Math.min(bw, bh) - 2);

      ctx.strokeStyle = rowColors[brick.row % rowColors.length];
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.shadowColor = '#f1f5f9';
    ctx.shadowBlur = lowSpecMode ? 0 : 8;
    ctx.beginPath();
    ctx.arc(g.ballX, g.ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#6366f1';
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = lowSpecMode ? 0 : 10;
    const pX = g.paddleX - PADDLE_W / 2;
    const pY = PADDLE_Y;
    ctx.beginPath();
    ctx.roundRect(pX, pY, PADDLE_W, PADDLE_H, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    for (const p of g.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawCard(p.cardId, p.x, p.y, 8 * alpha);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${g.score}`, 10, 10);
    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const g = gameRef.current;
    if (g.isGameOver || g.isWin) return;
    if (!g.started) g.started = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    touchRef.current = { active: true, x: (e.clientX - rect.left) * scaleX };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!touchRef.current.active) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    touchRef.current = { active: true, x: (e.clientX - rect.left) * scaleX };
  };

  const handlePointerUp = () => {
    touchRef.current = { ...touchRef.current, active: false };
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-between font-sans select-none overflow-hidden pb-3">
      <header className="w-full max-w-lg flex items-center justify-between px-3 py-2 shrink-0">
        <button onClick={onExit} className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-black uppercase tracking-tight">{t('mode_breakout', language)}</h1>
        </div>
        <div className="px-3 py-1.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/20 text-indigo-100 font-black text-xs sm:text-sm tabular-nums">
          {hudScore}
        </div>
      </header>

      <div className="flex items-center gap-3 py-1 text-xs sm:text-sm font-bold shrink-0">
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <Heart key={i} size={16} className={i < hudLives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'} />
        ))}
      </div>

      <main className="w-full max-w-lg flex-1 min-h-0 flex flex-col items-center justify-center px-3">
        <div
          className={cn('relative w-full max-h-[58vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl')}
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-full object-contain" />

          {(hudGameOver || hudWin) && (
            <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
                {hudWin ? (
                  <Trophy size={42} className="mx-auto text-amber-500 mb-3" />
                ) : (
                  <Heart size={42} className="mx-auto text-rose-500 mb-3" />
                )}
                <h2 className="text-xl font-black mb-1">
                  {hudWin ? (language === 'ko' ? '승리!' : 'WIN!') : (language === 'ko' ? '게임 오버' : 'GAME OVER')}
                </h2>
                <p className="text-sm font-bold text-slate-500 mb-1">
                  {language === 'ko' ? `점수: ${gameRef.current.score}` : `Score: ${gameRef.current.score}`}
                </p>
                <p className="text-sm font-bold text-indigo-600 mb-4">
                  {t('breakout_reward', language).replace('{amount}', String(Math.floor(gameRef.current.score / 20)))}
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

        {/* Mobile Left / Right buttons */}
        <div className="mt-3 flex items-center justify-center gap-8 w-full max-w-xs sm:hidden select-none shrink-0">
          <button
            type="button"
            onPointerDown={() => {
              const g = gameRef.current;
              if (!g.started) g.started = true;
              g.paddleX = Math.max(0, g.paddleX - 25);
            }}
            className="flex-1 py-2.5 rounded-xl bg-white/10 active:bg-indigo-500/40 border border-white/20 flex items-center justify-center text-lg text-white active:scale-95 shadow-md touch-manipulation"
          >
            ◀ {language === 'ko' ? '왼쪽' : 'Left'}
          </button>
          <button
            type="button"
            onPointerDown={() => {
              const g = gameRef.current;
              if (!g.started) g.started = true;
              g.paddleX = Math.min(CANVAS_W - PADDLE_W, g.paddleX + 25);
            }}
            className="flex-1 py-2.5 rounded-xl bg-white/10 active:bg-indigo-500/40 border border-white/20 flex items-center justify-center text-lg text-white active:scale-95 shadow-md touch-manipulation"
          >
            {language === 'ko' ? '오른쪽' : 'Right'} ▶
          </button>
        </div>
      </main>

      <div className="px-4 py-1.5 bg-white/5 rounded-2xl text-[9px] sm:text-[10px] text-slate-400 font-bold text-center max-w-lg shrink-0">
        {language === 'ko' ? '화면 드래그 또는 하단 버튼으로 패들을 조작하세요' : 'Drag screen or tap buttons to move paddle'}
      </div>
    </div>
  );
};
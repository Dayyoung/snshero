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

export type BreakoutDifficulty = 'easy' | 'normal' | 'hard';

export const BREAKOUT_DIFFICULTY_CONFIG: Record<BreakoutDifficulty, {
  cols: number;
  rows: number;
  paddleW: number;
  baseSpeed: number;
  maxSpeed: number;
  lives: number;
  minReward: number;
  winReward: number;
  pointDiv: number;
  nameKo: string;
  nameEn: string;
}> = {
  easy: {
    cols: 8,
    rows: 6,
    paddleW: 75,
    baseSpeed: 3.5,
    maxSpeed: 5.5,
    lives: 4,
    minReward: 15,
    winReward: 35,
    pointDiv: 15,
    nameKo: '쉬움',
    nameEn: 'Easy',
  },
  normal: {
    cols: 10,
    rows: 8,
    paddleW: 60,
    baseSpeed: 4.2,
    maxSpeed: 6.8,
    lives: 3,
    minReward: 20,
    winReward: 48,
    pointDiv: 18,
    nameKo: '보통',
    nameEn: 'Normal',
  },
  hard: {
    cols: 10,
    rows: 10,
    paddleW: 48,
    baseSpeed: 5.0,
    maxSpeed: 8.0,
    lives: 2,
    minReward: 25,
    winReward: 60,
    pointDiv: 20,
    nameKo: '어려움',
    nameEn: 'Hard',
  }
};

const CANVAS_W = 400;
const CANVAS_H = 600;
const PADDLE_H = 10;
const BALL_R = 5;
const BRICK_H = 18;
const BRICK_TOP = 50;
const PADDLE_Y = CANVAS_H - 50 - 50;

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
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
  const [difficulty, setDifficulty] = useState<BreakoutDifficulty>('normal');
  const cfg = BREAKOUT_DIFFICULTY_CONFIG[difficulty];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const gameRef = useRef({
    paddleX: CANVAS_W / 2,
    paddleW: cfg.paddleW,
    ballX: CANVAS_W / 2,
    ballY: PADDLE_Y - 30,
    ballVX: cfg.baseSpeed * 0.7,
    ballVY: -cfg.baseSpeed,
    bricks: [] as Brick[],
    particles: [] as Particle[],
    score: 0,
    lives: cfg.lives,
    isGameOver: false,
    isWin: false,
    started: false,
    speedMultiplier: 1,
  });

  const touchRef = useRef<{ active: boolean; x: number }>({ active: false, x: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const [hudScore, setHudScore] = useState(0);
  const [hudLives, setHudLives] = useState(cfg.lives);
  const [hudGameOver, setHudGameOver] = useState(false);
  const [hudWin, setHudWin] = useState(false);
  const [earnedReward, setEarnedReward] = useState(0);
  const hudCounter = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const buildBricks = useCallback((diff: BreakoutDifficulty): Brick[] => {
    const dCfg = BREAKOUT_DIFFICULTY_CONFIG[diff];
    const brickW = CANVAS_W / dCfg.cols;
    const bricks: Brick[] = [];
    for (let row = 0; row < dCfg.rows; row++) {
      for (let col = 0; col < dCfg.cols; col++) {
        const cardId = ((row * dCfg.cols + col) % 110) + 1;
        bricks.push({
          x: col * brickW,
          y: BRICK_TOP + row * BRICK_H,
          w: brickW,
          h: BRICK_H,
          cardId: CARD_DATABASE[cardId] ? cardId : 1,
          alive: true,
          row,
        });
      }
    }
    return bricks;
  }, []);

  const startGame = useCallback((diffToUse?: BreakoutDifficulty) => {
    const targetDiff = diffToUse || difficulty;
    const dCfg = BREAKOUT_DIFFICULTY_CONFIG[targetDiff];
    const g = gameRef.current;
    g.paddleX = CANVAS_W / 2;
    g.paddleW = dCfg.paddleW;
    g.ballX = CANVAS_W / 2;
    g.ballY = PADDLE_Y - 30;
    const angle = -(Math.PI / 4 + Math.random() * Math.PI / 4);
    g.ballVX = dCfg.baseSpeed * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1);
    g.ballVY = -dCfg.baseSpeed;
    g.bricks = buildBricks(targetDiff);
    g.particles = [];
    g.score = 0;
    g.lives = dCfg.lives;
    g.isGameOver = false;
    g.isWin = false;
    g.started = true;
    g.speedMultiplier = 1;
    rewardedRef.current = false;
    lastTimeRef.current = 0;
    setHudScore(0);
    setHudLives(dCfg.lives);
    setHudGameOver(false);
    setHudWin(false);
    setEarnedReward(0);
  }, [buildBricks, difficulty]);

  useEffect(() => {
    startGame(difficulty);
  }, [difficulty, startGame]);

  const calcReward = useCallback((isWin: boolean, score: number, diff: BreakoutDifficulty, livesLeft: number) => {
    const dCfg = BREAKOUT_DIFFICULTY_CONFIG[diff];
    if (isWin) {
      return Math.min(60, dCfg.winReward + livesLeft * 2);
    }
    const scoreBonus = Math.floor(score / dCfg.pointDiv);
    return Math.min(dCfg.winReward - 5, Math.max(dCfg.minReward, 10 + scoreBonus));
  }, []);

  useEffect(() => {
    if ((hudGameOver || hudWin) && !rewardedRef.current) {
      rewardedRef.current = true;
      const finalReward = calcReward(hudWin, gameRef.current.score, difficulty, gameRef.current.lives);
      setEarnedReward(finalReward);
      onReward(finalReward);
    }
  }, [calcReward, difficulty, hudGameOver, hudWin, onReward]);

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

      const curPaddleW = g.paddleW || cfg.paddleW;
      g.paddleX = Math.max(curPaddleW / 2, Math.min(CANVAS_W - curPaddleW / 2, g.paddleX));

      const dCfg = BREAKOUT_DIFFICULTY_CONFIG[difficulty];
      const speed = Math.min(dCfg.baseSpeed * g.speedMultiplier, dCfg.maxSpeed);
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

      const pLeft = g.paddleX - curPaddleW / 2;
      const pRight = g.paddleX + curPaddleW / 2;
      const pTop = PADDLE_Y;
      if (
        g.ballY + BALL_R >= pTop &&
        g.ballY + BALL_R <= pTop + PADDLE_H + 4 &&
        g.ballX >= pLeft - BALL_R &&
        g.ballX <= pRight + BALL_R &&
        g.ballVY > 0
      ) {
        g.ballY = pTop - BALL_R;
        const hitPos = (g.ballX - g.paddleX) / (curPaddleW / 2);
        const angle = hitPos * (Math.PI / 3);
        g.ballVX = speed * Math.sin(angle);
        g.ballVY = -speed * Math.cos(angle);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      }

      for (const brick of g.bricks) {
        if (!brick.alive) continue;

        const bLeft = brick.x;
        const bRight = brick.x + brick.w;
        const bTop = brick.y;
        const bBottom = brick.y + brick.h;

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

          g.speedMultiplier = Math.min(g.speedMultiplier + 0.003, 1.6);

          if (!lowSpecMode) {
            for (let i = 0; i < 3; i++) {
              g.particles.push({
                x: brick.x + brick.w / 2,
                y: brick.y + brick.h / 2,
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

      if (g.bricks.length > 0 && g.bricks.every(b => !b.alive)) {
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
  }, [cfg.paddleW, difficulty, language, lowSpecMode, playSfx]);

  const renderCanvas = (g: typeof gameRef.current, timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#0f172a';
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
      const bw = brick.w - 2;
      const bh = brick.h - 2;

      drawCard(brick.cardId, brick.x + brick.w / 2, brick.y + brick.h / 2, Math.min(bw, bh) - 2);

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
    const curPaddleW = g.paddleW || cfg.paddleW;
    const pX = g.paddleX - curPaddleW / 2;
    const pY = PADDLE_Y;
    ctx.beginPath();
    ctx.roundRect(pX, pY, curPaddleW, PADDLE_H, 4);
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
    ctx.font = 'bold 20px monospace';
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
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-between font-mono select-none overflow-hidden pb-3">
      <header className="w-full max-w-lg flex items-center justify-between px-3 py-2 shrink-0">
        <button onClick={onExit} className="p-2 rounded-sm bg-white/10 hover:bg-white/15 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-bold tracking-tight">{t('mode_breakout', language)}</h1>
        </div>
        <div className="px-2.5 py-1 rounded-sm bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 font-bold text-xs sm:text-sm tabular-nums">
          {hudScore} PTS
        </div>
      </header>

      {/* Difficulty Selector & Lives Header */}
      <div className="w-full max-w-lg px-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {(['easy', 'normal', 'hard'] as BreakoutDifficulty[]).map((d) => {
            const active = difficulty === d;
            const dName = language === 'ko' ? BREAKOUT_DIFFICULTY_CONFIG[d].nameKo : BREAKOUT_DIFFICULTY_CONFIG[d].nameEn;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  if (difficulty !== d) {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setDifficulty(d);
                    startGame(d);
                  }
                }}
                className={cn(
                  "px-2 py-1 text-xs rounded-sm border transition-all cursor-pointer min-h-[36px]",
                  active
                    ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                )}
              >
                [{dName}]
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 py-1 text-xs font-bold shrink-0">
          {Array.from({ length: cfg.lives }).map((_, i) => (
            <Heart key={i} size={15} className={i < hudLives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'} />
          ))}
        </div>
      </div>

      <main className="w-full max-w-lg flex-1 min-h-0 flex flex-col items-center justify-center px-3">
        <div
          className={cn('relative w-full max-h-[58vh] overflow-hidden rounded-sm border border-white/10')}
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-full object-contain" />

          {(hudGameOver || hudWin) && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white text-slate-900 rounded-sm p-5 max-w-sm w-full text-center border border-slate-300 shadow-lg">
                {hudWin ? (
                  <Trophy size={36} className="mx-auto text-amber-500 mb-2" />
                ) : (
                  <Heart size={36} className="mx-auto text-rose-500 mb-2" />
                )}
                <h2 className="text-lg font-bold mb-1">
                  {hudWin ? (language === 'ko' ? '[승리! 완파 성공]' : '[VICTORY! CLEAR]') : (language === 'ko' ? '[게임 오버]' : '[GAME OVER]')}
                </h2>
                <div className="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-2.5 rounded-sm border border-slate-200">
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '난이도' : 'Difficulty'}:</span>
                    <span className="font-bold text-slate-900">[{language === 'ko' ? cfg.nameKo : cfg.nameEn}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '최종 점수' : 'Final Score'}:</span>
                    <span className="font-bold text-slate-900">{gameRef.current.score} PTS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '잔여 생명' : 'Remaining Lives'}:</span>
                    <span className="font-bold text-slate-900">{gameRef.current.lives} / {cfg.lives}</span>
                  </div>
                </div>
                <div className="mb-4 py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-sm">
                  <span className="text-xs text-indigo-700 font-bold">
                    {language === 'ko' ? `보상 지급: +${earnedReward} SNS 포인트` : `Reward Earned: +${earnedReward} SNS Points`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startGame(difficulty)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] text-xs"
                  >
                    <RotateCcw size={14} />
                    {language === 'ko' ? '재도전' : 'Retry'}
                  </button>
                  <button
                    onClick={onExit}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-bold cursor-pointer min-h-[44px] text-xs"
                  >
                    {t('home', language)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Left / Right buttons */}
        <div className="mt-2.5 flex items-center justify-center gap-4 w-full max-w-xs sm:hidden select-none shrink-0">
          <button
            type="button"
            onPointerDown={() => {
              const g = gameRef.current;
              if (!g.started) g.started = true;
              const curPaddleW = g.paddleW || cfg.paddleW;
              g.paddleX = Math.max(curPaddleW / 2, g.paddleX - 25);
            }}
            className="flex-1 py-3 rounded-sm bg-white/10 active:bg-indigo-600 border border-white/20 flex items-center justify-center text-sm font-bold text-white active:scale-95 touch-manipulation min-h-[44px]"
          >
            [◀ {language === 'ko' ? '왼쪽' : 'Left'}]
          </button>
          <button
            type="button"
            onPointerDown={() => {
              const g = gameRef.current;
              if (!g.started) g.started = true;
              const curPaddleW = g.paddleW || cfg.paddleW;
              g.paddleX = Math.min(CANVAS_W - curPaddleW / 2, g.paddleX + 25);
            }}
            className="flex-1 py-3 rounded-sm bg-white/10 active:bg-indigo-600 border border-white/20 flex items-center justify-center text-sm font-bold text-white active:scale-95 touch-manipulation min-h-[44px]"
          >
            [{language === 'ko' ? '오른쪽' : 'Right'} ▶]
          </button>
        </div>
      </main>

      <div className="px-3 py-1 bg-white/5 rounded-sm text-[10px] text-slate-400 font-mono text-center max-w-lg shrink-0 border border-white/5">
        {language === 'ko' ? '드래그 또는 좌우 버튼으로 패들 이동 | 난이도별 최대 35~60 SNS 보상' : 'Drag or tap buttons to move paddle | Up to 35~60 SNS reward'}
      </div>
    </div>
  );
};
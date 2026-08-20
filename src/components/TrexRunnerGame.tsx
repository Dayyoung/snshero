import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Skull } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface TrexRunnerGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export type TrexDifficulty = 'easy' | 'normal' | 'hard';

export interface TrexDifficultyConfig {
  nameKo: string;
  nameEn: string;
  minSpeed: number;
  maxSpeed: number;
  jumpForce: number;
  minObstacleDistance: number;
  baseReward: number;
  scoreDivisor: number;
  maxReward: number;
}

export const TREX_DIFFICULTY_CONFIG: Record<TrexDifficulty, TrexDifficultyConfig> = {
  easy: {
    nameKo: '쉬움',
    nameEn: 'Easy',
    minSpeed: 3.5,
    maxSpeed: 8,
    jumpForce: -12.5,
    minObstacleDistance: 220,
    baseReward: 15,
    scoreDivisor: 25,
    maxReward: 40
  },
  normal: {
    nameKo: '보통',
    nameEn: 'Normal',
    minSpeed: 4.5,
    maxSpeed: 12,
    jumpForce: -12.0,
    minObstacleDistance: 170,
    baseReward: 20,
    scoreDivisor: 20,
    maxReward: 50
  },
  hard: {
    nameKo: '어려움',
    nameEn: 'Hard',
    minSpeed: 6.0,
    maxSpeed: 16,
    jumpForce: -11.5,
    minObstacleDistance: 130,
    baseReward: 25,
    scoreDivisor: 15,
    maxReward: 60
  }
};

const CANVAS_W = 400;
const CANVAS_H = 600;
const GRAVITY = 0.6;
const GROUND_Y = CANVAS_H - 130;
const PLAYER_SIZE = 40;

interface Obstacle {
  x: number;
  width: number;
  height: number;
  cardId: number;
  isCard: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export const TrexRunnerGame: React.FC<TrexRunnerGameProps> = ({
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

  const [difficulty, setDifficulty] = useState<TrexDifficulty>('normal');
  const dCfg = TREX_DIFFICULTY_CONFIG[difficulty];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const gameRef = useRef({
    playerY: GROUND_Y - PLAYER_SIZE,
    playerVY: 0,
    jumpsLeft: 2,
    score: 0,
    speed: dCfg.minSpeed,
    distance: 0,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    isGameOver: false,
    started: false,
    nextObstacleDistance: 200,
    groundOffset: 0,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const touchJumpRef = useRef(false);
  const [hudScore, setHudScore] = useState(0);
  const [hudGameOver, setHudGameOver] = useState(false);
  const [earnedReward, setEarnedReward] = useState(0);
  const hudCounter = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const startGame = useCallback((diffKey: TrexDifficulty = difficulty) => {
    const cfg = TREX_DIFFICULTY_CONFIG[diffKey];
    const g = gameRef.current;
    g.playerY = GROUND_Y - PLAYER_SIZE;
    g.playerVY = 0;
    g.jumpsLeft = 2;
    g.score = 0;
    g.speed = cfg.minSpeed;
    g.distance = 0;
    g.obstacles = [];
    g.particles = [];
    g.isGameOver = false;
    g.started = true;
    g.nextObstacleDistance = 200;
    g.groundOffset = 0;
    rewardedRef.current = false;
    lastTimeRef.current = 0;
    setHudScore(0);
    setHudGameOver(false);
    setEarnedReward(0);
  }, [difficulty]);

  useEffect(() => {
    startGame(difficulty);
  }, [difficulty, startGame]);

  const calcReward = useCallback((score: number, diffKey: TrexDifficulty) => {
    const cfg = TREX_DIFFICULTY_CONFIG[diffKey];
    const bonus = Math.floor(score / cfg.scoreDivisor);
    return Math.min(cfg.maxReward, cfg.baseReward + bonus);
  }, []);

  useEffect(() => {
    if (hudGameOver && !rewardedRef.current) {
      rewardedRef.current = true;
      const finalReward = calcReward(gameRef.current.score, difficulty);
      setEarnedReward(finalReward);
      onReward(finalReward);
    }
  }, [calcReward, difficulty, hudGameOver, onReward]);

  const triggerJump = useCallback(() => {
    const cfg = TREX_DIFFICULTY_CONFIG[difficulty];
    const g = gameRef.current;
    if (g.isGameOver) return;
    if (!g.started) g.started = true;
    if (g.jumpsLeft > 0) {
      g.playerVY = cfg.jumpForce;
      g.jumpsLeft--;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    }
  }, [difficulty, playSfx]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        triggerJump();
      }
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
  }, [triggerJump]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const cfg = TREX_DIFFICULTY_CONFIG[difficulty];
      const g = gameRef.current;

      if (g.isGameOver) {
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawDelta = timestamp - lastTimeRef.current;
      const delta = Math.min(rawDelta, 33);
      lastTimeRef.current = timestamp;

      if (!g.started) {
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = delta / 16;

      g.speed = Math.min(cfg.maxSpeed, cfg.minSpeed + g.distance * 0.0001);
      const moveAmount = g.speed * dt;
      g.distance += moveAmount;
      g.score = Math.floor(g.distance / 10);
      g.groundOffset = (g.groundOffset + moveAmount) % 20;

      g.playerVY += GRAVITY * dt;
      g.playerY += g.playerVY * dt;

      if (g.playerY >= GROUND_Y - PLAYER_SIZE) {
        g.playerY = GROUND_Y - PLAYER_SIZE;
        g.playerVY = 0;
        g.jumpsLeft = 2;
      }

      if (touchJumpRef.current) {
        touchJumpRef.current = false;
        if (g.jumpsLeft > 0) {
          g.playerVY = cfg.jumpForce;
          g.jumpsLeft--;
          playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        }
      }

      g.nextObstacleDistance -= moveAmount;
      if (g.nextObstacleDistance <= 0) {
        const isCard = Math.random() < 0.6;
        const h = isCard ? 40 + Math.random() * 20 : 30 + Math.random() * 40;
        const w = isCard ? 30 : 15 + Math.random() * 20;
        g.obstacles.push({
          x: CANVAS_W + 20,
          width: w,
          height: h,
          cardId: Math.floor(Math.random() * 110) + 1,
          isCard
        });
        g.nextObstacleDistance = cfg.minObstacleDistance + Math.random() * 180 / (g.speed / cfg.minSpeed);
      }

      for (const obs of g.obstacles) {
        obs.x -= moveAmount;
      }
      g.obstacles = g.obstacles.filter(o => o.x + o.width > -20);

      const px = 60;
      const pw = PLAYER_SIZE - 8;
      const ph = PLAYER_SIZE - 8;
      const pLeft = px - pw / 2;
      const pRight = px + pw / 2;
      const pTop = g.playerY;
      const pBottom = g.playerY + PLAYER_SIZE;

      for (const obs of g.obstacles) {
        const oLeft = obs.x;
        const oRight = obs.x + obs.width;
        const oTop = GROUND_Y - obs.height;
        const oBottom = GROUND_Y;

        if (pRight > oLeft + 4 && pLeft < oRight - 4 && pBottom > oTop + 4 && pTop < oBottom - 4) {
          g.isGameOver = true;
          setHudGameOver(true);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
          if (!lowSpecMode) {
            for (let i = 0; i < 8; i++) {
              g.particles.push({
                x: px, y: g.playerY + PLAYER_SIZE / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 500, maxLife: 500,
                color: obs.isCard ? '#3b82f6' : '#22c55e'
              });
            }
          }
        }
      }

      g.particles = g.particles
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - delta
        }))
        .filter(p => p.life > 0);

      hudCounter.current++;
      if (hudCounter.current % 3 === 0) {
        setHudScore(g.score);
      }

      renderCanvas(g, timestamp);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [difficulty, language, lowSpecMode, playSfx]);

  const renderCanvas = (g: typeof gameRef.current, timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    if (!lowSpecMode) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 73 + g.distance * 0.05) % CANVAS_W);
        const sy = (i * 37) % (GROUND_Y - 50);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }

    // Ground
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let x = -g.groundOffset; x < CANVAS_W; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 4);
      ctx.lineTo(x + 10, GROUND_Y + 4);
      ctx.stroke();
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

    for (const obs of g.obstacles) {
      if (obs.isCard) {
        drawCard(obs.cardId, obs.x + obs.width / 2, GROUND_Y - obs.height / 2, obs.height);
      } else {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(obs.x, GROUND_Y - obs.height, obs.width, obs.height);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(obs.x + 2, GROUND_Y - obs.height + 4, obs.width - 4, obs.height - 8);
      }
    }

    if (!g.isGameOver) {
      const bounceY = g.playerY < GROUND_Y - PLAYER_SIZE ? 0 : Math.sin(timestamp / 200) * 2;
      drawCard(playerCardId, 60, g.playerY + PLAYER_SIZE / 2 + bounceY, PLAYER_SIZE);
    }

    if (!lowSpecMode) {
      for (const p of g.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${g.score} M`, CANVAS_W - 15, 15);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(language === 'ko' ? '기록' : 'DISTANCE', CANVAS_W - 15, 38);
    ctx.restore();

    if (!g.started) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(language === 'ko' ? '[터치하여 시작]' : '[TAP TO START]', CANVAS_W / 2, CANVAS_H / 2);
      ctx.restore();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    triggerJump();
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-between font-mono select-none overflow-hidden pb-3">
      <header className="w-full max-w-lg flex items-center justify-between px-3 py-2 shrink-0">
        <button onClick={onExit} className="p-2 rounded-sm bg-white/10 hover:bg-white/15 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-bold tracking-tight">{t('mode_trex', language)}</h1>
          <p className="text-[10px] font-bold text-slate-400">
            {language === 'ko' ? '2단 점프로 장애물 회피' : 'DOUBLE JUMP RUNNER'}
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-sm bg-indigo-500/20 border border-indigo-400/30 text-indigo-100 font-bold text-xs sm:text-sm tabular-nums">
          {hudScore} M
        </div>
      </header>

      {/* Difficulty Selector Tabs */}
      <div className="w-full max-w-lg px-3 flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-1">
          {(['easy', 'normal', 'hard'] as TrexDifficulty[]).map((d) => {
            const active = difficulty === d;
            const dName = language === 'ko' ? TREX_DIFFICULTY_CONFIG[d].nameKo : TREX_DIFFICULTY_CONFIG[d].nameEn;
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
                  "px-2.5 py-1 text-xs rounded-sm border transition-all cursor-pointer min-h-[36px]",
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
        <div className="text-xs text-slate-400">
          MAX: +{dCfg.maxReward} SNS
        </div>
      </div>

      <main className="w-full max-w-lg flex-1 min-h-0 flex flex-col items-center justify-center px-3">
        <div
          className={cn('relative w-full max-h-[55vh] overflow-hidden rounded-sm border border-white/15')}
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-full object-contain"
          />

          {hudGameOver && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-5">
              <div className="bg-white text-slate-900 rounded-sm p-5 max-w-sm w-full text-center border border-slate-300 shadow-lg">
                <Skull size={36} className="mx-auto text-rose-500 mb-2" />
                <h2 className="text-lg font-bold mb-1">{language === 'ko' ? '[게임 오버]' : '[GAME OVER]'}</h2>

                <div className="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-2.5 rounded-sm border border-slate-200">
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '난이도' : 'Difficulty'}:</span>
                    <span className="font-bold text-slate-900">[{language === 'ko' ? dCfg.nameKo : dCfg.nameEn}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ko' ? '이동 거리' : 'Distance'}:</span>
                    <span className="font-bold text-slate-900">{gameRef.current.score} M</span>
                  </div>
                </div>

                <div className="mb-3.5 py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-sm">
                  <span className="text-xs text-indigo-700 font-bold">
                    {language === 'ko' ? `보상 지급: +${earnedReward} SNS 포인트` : `Reward Earned: +${earnedReward} SNS Points`}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => startGame(difficulty)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-bold flex items-center justify-center gap-1 cursor-pointer min-h-[44px] text-xs">
                    <RotateCcw size={14} />
                    {language === 'ko' ? '재시작' : 'Restart'}
                  </button>
                  <button onClick={onExit} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-bold cursor-pointer min-h-[44px] text-xs">
                    {t('home', language)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile One-Hand Big Jump Button */}
        <div className="mt-2.5 flex items-center justify-center w-full max-w-xs select-none shrink-0">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              triggerJump();
            }}
            className="w-full py-3 rounded-sm bg-indigo-600 active:bg-indigo-700 text-white font-bold text-sm active:scale-95 flex items-center justify-center gap-2 touch-manipulation border border-indigo-400/40 min-h-[44px] cursor-pointer"
          >
            [⚡ {language === 'ko' ? '점프 (2단 점프)' : 'JUMP (Double Jump)'}]
          </button>
        </div>
      </main>

      <div className="px-3 py-1.5 bg-white/5 rounded-sm text-[10px] text-slate-400 font-mono text-center max-w-lg shrink-0 border border-white/5">
        {language === 'ko' ? '화면 탭 / 점프 버튼 | 난이도별 15~60 SNS 포인트 보상' : 'Tap screen or jump button | 15~60 SNS points based on difficulty'}
      </div>
    </div>
  );
};

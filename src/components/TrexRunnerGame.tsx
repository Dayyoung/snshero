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

const CANVAS_W = 400;
const CANVAS_H = 600;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y = CANVAS_H - 130;
const PLAYER_SIZE = 40;
const MIN_SPEED = 4;
const MAX_SPEED = 12;

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
    speed: MIN_SPEED,
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
  const hudCounter = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.playerY = GROUND_Y - PLAYER_SIZE;
    g.playerVY = 0;
    g.jumpsLeft = 2;
    g.score = 0;
    g.speed = MIN_SPEED;
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
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (hudGameOver && !rewardedRef.current) {
      rewardedRef.current = true;
      onReward(Math.floor(gameRef.current.score / 10));
    }
  }, [hudGameOver, onReward]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        const g = gameRef.current;
        if (g.isGameOver) return;
        if (!g.started) g.started = true;
        if (g.jumpsLeft > 0) {
          g.playerVY = JUMP_FORCE;
          g.jumpsLeft--;
          playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        }
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
  }, [playSfx]);

  useEffect(() => {
    const loop = (timestamp: number) => {
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

      g.speed = Math.min(MAX_SPEED, MIN_SPEED + g.distance * 0.0001);
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
          g.playerVY = JUMP_FORCE;
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
        g.nextObstacleDistance = 150 + Math.random() * 200 / (g.speed / MIN_SPEED);
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
                life: 600, maxLife: 600,
                color: ['#f87171', '#fbbf24', '#60a5fa'][i % 3]
              });
            }
          }
          break;
        }
      }

      if (!lowSpecMode && !g.isGameOver && Math.random() < 0.15) {
        g.particles.push({
          x: px - 10, y: g.playerY + PLAYER_SIZE,
          vx: -1 - Math.random() * 2, vy: -Math.random() * 1.5,
          life: 300, maxLife: 300,
          color: '#94a3b8'
        });
      }

      g.particles = g.particles
        .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - delta }))
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

    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.6, '#1e293b');
    skyGrad.addColorStop(1, '#334155');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (!lowSpecMode) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 20; i++) {
        const sx = (i * 127 + Math.floor(timestamp * 0.005 * ((i % 3) + 1))) % CANVAS_W;
        const sy = (i * 73) % (GROUND_Y - 40);
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, GROUND_Y, CANVAS_W, 2);

    ctx.strokeStyle = 'rgba(100,116,139,0.3)';
    ctx.lineWidth = 1;
    for (let x = -g.groundOffset; x < CANVAS_W; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 10);
      ctx.lineTo(x + 10, GROUND_Y + 10);
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
        drawCard(obs.cardId, obs.x + obs.width / 2, GROUND_Y - obs.height / 2, Math.min(obs.width, obs.height));
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(obs.x, GROUND_Y - obs.height, obs.width, obs.height);
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(obs.x + 2, GROUND_Y - obs.height + 2, obs.width - 4, 4);
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
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${g.score}`, CANVAS_W - 15, 15);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(language === 'ko' ? '점수' : 'SCORE', CANVAS_W - 15, 38);
    ctx.restore();

    if (!g.started) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(language === 'ko' ? '터치하여 시작' : 'TAP TO START', CANVAS_W / 2, CANVAS_H / 2);
      ctx.restore();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const g = gameRef.current;
    if (g.isGameOver) return;
    if (!g.started) g.started = true;
    touchJumpRef.current = true;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center font-sans select-none">
      <header className="w-full max-w-lg flex items-center justify-between p-3">
        <button onClick={onExit} className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black uppercase tracking-tight">{t('mode_trex', language)}</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'ko' ? '달리고 점프하세요!' : 'RUN & JUMP!'}
          </p>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-indigo-500/20 border border-indigo-400/20 text-indigo-100 font-black text-sm tabular-nums">
          {hudScore}
        </div>
      </header>

      <div
        className={cn('relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 shadow-2xl')}
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full"
        />

        {hudGameOver && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
              <Skull size={42} className="mx-auto text-rose-500 mb-3" />
              <h2 className="text-xl font-black mb-1">{language === 'ko' ? '게임 오버' : 'GAME OVER'}</h2>
              <p className="text-sm font-bold text-slate-500 mb-1">
                {language === 'ko' ? `점수: ${gameRef.current.score}` : `Score: ${gameRef.current.score}`}
              </p>
              <p className="text-sm font-bold text-indigo-600 mb-4">
                {t('trex_reward', language).replace('{amount}', String(Math.floor(gameRef.current.score / 10)))}
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

      <div className="mt-3 px-4 py-2 bg-white/5 rounded-2xl text-[10px] text-slate-400 font-bold text-center max-w-lg">
        {language === 'ko' ? '터치 또는 스페이스바로 점프 | 공중에서 한 번 더 점프!' : 'Tap or Space to jump | Double jump in air!'}
      </div>
    </div>
  );
};
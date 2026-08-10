import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface CardJumperGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const CANVAS_W = 360;
const CANVAS_H = 640;
const PLAYER_W = 32;
const PLAYER_H = 32;
const PLATFORM_W = 60;
const PLATFORM_H = 12;
const GRAVITY = 0.42;
const JUMP_VELOCITY = -11;
const BASE_SCROLL_SPEED = 1.2;
const MIN_SCROLL_SPEED = 0.8;
const MAX_SCROLL_SPEED = 3.5;
const SWIPE_THRESHOLD = 15;
const FAST_SWIPE_MS = 200;
const COIN_SIZE = 20;
const PLATFORM_GAP_BASE = 80;
const PLATFORM_GAP_MIN = 55;

interface Platform {
  x: number;
  y: number;
  w: number;
  cardId: number;
  hasCoin: boolean;
  coinCollected: boolean;
  type?: 'normal' | 'spring' | 'broken';
  brokenStepped?: boolean;
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

export const CardJumperGame: React.FC<CardJumperGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef(0);
  const rewardedRef = useRef(false);

  const playerCardId = deck.length > 0
    ? (typeof deck[0]?.imageIndex === 'number'
        ? deck[0].imageIndex
        : typeof deck[0]?.id === 'number'
          ? deck[0].id
          : 1)
    : 1;
  const validPlayerCardId = CARD_DATABASE[playerCardId] ? playerCardId : 1;

  const gameRef = useRef({
    playerX: CANVAS_W / 2,
    playerY: CANVAS_H / 2,
    playerVY: 0,
    platforms: [] as Platform[],
    particles: [] as Particle[],
    cameraY: 0,
    score: 0,
    bestHeight: 0,
    isGameOver: false,
    started: false,
    scrollSpeed: BASE_SCROLL_SPEED,
    lastPlatformY: CANVAS_H + 100,
    playerDirection: 0,
  });

  const [showTutorial, setShowTutorial] = useState(true);
  const showTutorialRef = useRef(showTutorial);
  useEffect(() => {
    showTutorialRef.current = showTutorial;
  }, [showTutorial]);
  const [hudScore, setHudScore] = useState(0);
  const [hudGameOver, setHudGameOver] = useState(false);
  const [hudBest, setHudBest] = useState(0);
  const [swipeHint, setSwipeHint] = useState<string | null>(null);
  const hudCounter = useRef(0);

  const keysRef = useRef<Set<string>>(new Set());
  const moveRef = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const initPlatforms = useCallback((): Platform[] => {
    const platforms: Platform[] = [];
    // Start platform
    platforms.push({
      x: CANVAS_W / 2 - PLATFORM_W / 2,
      y: CANVAS_H - 100,
      w: PLATFORM_W,
      cardId: 1,
      hasCoin: false,
      coinCollected: true,
    });

    let lastY = CANVAS_H - 100;
    for (let i = 0; i < 12; i++) {
      const gap = PLATFORM_GAP_BASE + Math.random() * 30;
      const y = lastY - gap;
      const w = PLATFORM_W * (0.7 + Math.random() * 0.6);
      const x = Math.random() * (CANVAS_W - w);
      const cardId = Math.floor(Math.random() * 110) + 1;
      
      const rVal = Math.random();
      let type: 'normal' | 'spring' | 'broken' = 'normal';
      if (i >= 3) {
        if (rVal < 0.12) type = 'spring';
        else if (rVal < 0.28) type = 'broken';
      }

      platforms.push({
        x,
        y,
        w,
        cardId: CARD_DATABASE[cardId] ? cardId : 1,
        hasCoin: Math.random() < 0.65,
        coinCollected: false,
        type,
      });
      lastY = y;
    }

    return platforms;
  }, []);

  const startGame = useCallback((forceSkipTutorial = false) => {
    const g = gameRef.current;
    const platforms = initPlatforms();
    const startPlat = platforms[0];
    g.playerX = startPlat.x + startPlat.w / 2;
    g.playerY = startPlat.y - PLAYER_H;
    g.playerVY = 0;
    g.platforms = platforms;
    g.particles = [];
    g.cameraY = 0;
    g.score = 0;
    g.bestHeight = 0;
    g.isGameOver = false;
    g.started = false;
    g.scrollSpeed = BASE_SCROLL_SPEED;
    g.lastPlatformY = platforms[platforms.length - 1].y;
    g.playerDirection = 0;
    moveRef.current = 0;
    rewardedRef.current = false;
    setHudScore(0);
    setHudBest(0);
    setHudGameOver(false);
    if (forceSkipTutorial) {
      setShowTutorial(false);
    }
  }, [initPlatforms]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (hudGameOver && !rewardedRef.current) {
      rewardedRef.current = true;
      onReward(Math.floor(gameRef.current.score / 5));
    }
  }, [hudGameOver, onReward]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showTutorial) return;
      const g = gameRef.current;
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
        e.preventDefault();
        if (!g.started && !g.isGameOver) {
          g.started = true;
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
  }, [showTutorial]);

  // Touch handlers (Split Screen Left/Right)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (showTutorial) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const halfWidth = rect.width / 2;

    const g = gameRef.current;
    if (!g.started && !g.isGameOver) {
      g.started = true;
    }

    if (touchX < halfWidth) {
      moveRef.current = -1;
    } else {
      moveRef.current = 1;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (showTutorial) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (touchX < halfWidth) {
      moveRef.current = -1;
    } else {
      moveRef.current = 1;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    moveRef.current = 0;
  };

  // Game loop
  useEffect(() => {
    const generatePlatform = (g: typeof gameRef.current): Platform => {
      const progress = g.score > 0 ? Math.min(g.score / 500, 1) : 0;
      const maxGap = PLATFORM_GAP_BASE + 30;
      const gap = maxGap - progress * (maxGap - PLATFORM_GAP_MIN);
      const y = g.lastPlatformY - gap;
      const sizeReduction = progress * 0.5;
      const w = PLATFORM_W * (0.7 - sizeReduction + Math.random() * 0.6);
      const x = Math.random() * (CANVAS_W - w);
      const cardId = Math.floor(Math.random() * 110) + 1;
      g.lastPlatformY = y;

      const rVal = Math.random();
      let type: 'normal' | 'spring' | 'broken' = 'normal';
      const springChance = 0.08 + Math.min(progress * 0.08, 0.12);
      const brokenChance = 0.12 + Math.min(progress * 0.18, 0.23);
      if (rVal < springChance) {
        type = 'spring';
      } else if (rVal < springChance + brokenChance) {
        type = 'broken';
      }

      return {
        x,
        y,
        w: Math.max(30, w),
        cardId: CARD_DATABASE[cardId] ? cardId : 1,
        hasCoin: Math.random() < 0.6,
        coinCollected: false,
        type,
      };
    };

    const loop = (timestamp: number) => {
      const g = gameRef.current;

      if (showTutorialRef.current) {
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (g.isGameOver) {
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Input
      const moveSpeed = 5.5;
      if (g.started) {
        if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) {
          moveRef.current = -1;
        } else if (keysRef.current.has('arrowright') || keysRef.current.has('d')) {
          moveRef.current = 1;
        } else {
          moveRef.current = 0;
        }
        g.playerX += moveRef.current * moveSpeed;
        g.playerDirection = moveRef.current;
      } else {
        moveRef.current = 0;
      }

      // Wrap horizontally
      if (g.playerX < -PLAYER_W / 2) g.playerX = CANVAS_W + PLAYER_W / 2;
      if (g.playerX > CANVAS_W + PLAYER_W / 2) g.playerX = -PLAYER_W / 2;

      // Gravity & jump
      g.playerVY += GRAVITY;
      g.playerY += g.playerVY;

      // Camera follows player going up (World Coordinate System)
      const playerScreenY = g.playerY - g.cameraY;
      if (g.started && playerScreenY < CANVAS_H * 0.35) {
        const diff = CANVAS_H * 0.35 - playerScreenY;
        g.cameraY -= diff; // Move camera up (decrease cameraY)
      }

      // Platform collision
      for (const plat of g.platforms) {
        if (g.playerVY > 0 &&
            (!plat.brokenStepped) &&
            g.playerY + PLAYER_H >= plat.y &&
            g.playerY + PLAYER_H <= plat.y + PLATFORM_H + 8 &&
            g.playerX + PLAYER_W / 2 > plat.x &&
            g.playerX - PLAYER_W / 2 < plat.x + plat.w) {

          if (plat.type === 'spring' && g.started) {
            g.playerVY = JUMP_VELOCITY * 1.85;
            g.playerY = plat.y - PLAYER_H;
            playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
          } else if (plat.type === 'broken' && g.started) {
            g.playerVY = JUMP_VELOCITY;
            g.playerY = plat.y - PLAYER_H;
            plat.brokenStepped = true;
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => {
              g.platforms = g.platforms.filter(p => p !== plat);
            }, 200);
          } else {
            g.playerVY = JUMP_VELOCITY;
            g.playerY = plat.y - PLAYER_H;
            playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }

          // Coin collection & score updates only when game has started
          if (g.started) {
            if (plat.hasCoin && !plat.coinCollected) {
              plat.coinCollected = true;
              g.score += 15;
              playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

              if (!lowSpecMode && plat.hasCoin) {
                for (let i = 0; i < 4; i++) {
                  g.particles.push({
                    x: plat.x + plat.w / 2,
                    y: plat.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3 - 2,
                    life: 350,
                    maxLife: 350,
                    cardId: plat.cardId,
                  });
                }
                if (g.particles.length > 25) {
                  g.particles = g.particles.slice(-25);
                }
              }
            }

            // Height score (based on negative cameraY)
            const heightScore = Math.floor(-g.cameraY / 10);
            if (heightScore > g.bestHeight) {
              g.bestHeight = heightScore;
              g.score += 1;
            }

            g.scrollSpeed = Math.min(
              MAX_SCROLL_SPEED,
              Math.max(MIN_SCROLL_SPEED, BASE_SCROLL_SPEED + g.bestHeight * 0.01)
            );
          }
          break;
        }
      }

      // Generate & remove platforms, and check game over only when started
      if (g.started) {
        while (g.platforms.length < 15) {
          g.platforms.push(generatePlatform(g));
        }
        g.platforms = g.platforms.filter(p => p.y - g.cameraY < CANVAS_H + 200);

        if (g.playerY - g.cameraY > CANVAS_H + 100) {
          g.isGameOver = true;
          setHudGameOver(true);
          if (g.bestHeight > hudBest) setHudBest(g.bestHeight);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        }
      }

      // Update particles
      g.particles = g.particles
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 16,
        }))
        .filter(p => p.life > 0);

      // HUD update
      hudCounter.current++;
      if (hudCounter.current % 3 === 0) {
        setHudScore(g.score);
        if (g.bestHeight > hudBest) setHudBest(g.bestHeight);
      }

      renderCanvas(g, timestamp);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [language, lowSpecMode, playSfx, hudBest]);

  const renderCanvas = (g: typeof gameRef.current, timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Adjust canvas resolution dynamically for retina/high-DPR screens
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Scale drawings so they match CANVAS_W and CANVAS_H
    const scaleX = w / CANVAS_W;
    const scaleY = h / CANVAS_H;
    ctx.scale(scaleX, scaleY);

    // Background gradient changing by height/score
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    const scoreVal = g.score;
    if (scoreVal < 40) {
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
    } else if (scoreVal < 100) {
      bgGrad.addColorStop(0, '#311005');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#1e1b4b');
    } else if (scoreVal < 200) {
      bgGrad.addColorStop(0, '#11052C');
      bgGrad.addColorStop(0.5, '#0d0d1a');
      bgGrad.addColorStop(1, '#050510');
    } else {
      bgGrad.addColorStop(0, '#03001e');
      bgGrad.addColorStop(0.5, '#7303c0');
      bgGrad.addColorStop(1, '#ec38bc');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle stars
    if (!lowSpecMode) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 127 + Math.floor(timestamp * 0.001 * ((i % 3) + 1))) % CANVAS_W);
        const sy = ((i * 73 + Math.floor(timestamp * 0.0005)) % CANVAS_H);
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const img = cardImgRef.current;

    const drawCardSprite = (cardId: number, cx: number, cy: number, size: number, borderGlowColor?: string) => {
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
      
      // Draw glow border if color is set
      if (borderGlowColor && !lowSpecMode) {
        ctx.save();
        ctx.shadowColor = borderGlowColor;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = borderGlowColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - size / 2 - 1, cy - size / 2 - 1, size + 2, size + 2);
        ctx.restore();
      }

      ctx.drawImage(
        img,
        col * spriteW, row * spriteH, spriteW, spriteH,
        cx - size / 2, cy - size / 2, size, size
      );
    };

    const cameraY = g.cameraY;

    // Draw platforms
    for (const plat of g.platforms) {
      const screenY = plat.y - cameraY;
      if (screenY < -20 || screenY > CANVAS_H + 20) continue;

      // Platform body color by type
      let bodyColor = '#312e81';
      let topColor = '#4f46e5';
      let shadowColor = '#6366f1';
      if (plat.type === 'spring') {
        bodyColor = '#78350f';
        topColor = '#fbbf24';
        shadowColor = '#d97706';
      } else if (plat.type === 'broken') {
        bodyColor = '#155e75';
        topColor = '#22d3ee';
        shadowColor = '#06b6d4';
        if (plat.brokenStepped) {
          bodyColor = '#374151';
          topColor = '#9ca3af';
        }
      }

      ctx.fillStyle = bodyColor;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = lowSpecMode ? 0 : 6;
      ctx.beginPath();
      ctx.roundRect(plat.x, screenY, plat.w, PLATFORM_H, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Platform top highlight
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.roundRect(plat.x + 2, screenY, plat.w - 4, PLATFORM_H / 2, 3);
      ctx.fill();

      // Coin (decorated card image)
      if (plat.hasCoin && !plat.coinCollected) {
        const isRare = plat.cardId % 10 === 0;
        const glowColor = isRare ? '#fbbf24' : '#818cf8';
        drawCardSprite(plat.cardId, plat.x + plat.w / 2, screenY - COIN_SIZE / 2 - 2, COIN_SIZE, glowColor);

        // Hover glow
        if (!lowSpecMode) {
          const pulse = Math.sin(timestamp * 0.005) * 0.3 + 0.7;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 8 * pulse;
          ctx.fillStyle = isRare ? `rgba(251,191,36,${0.15 * pulse})` : `rgba(129,140,248,${0.15 * pulse})`;
          ctx.beginPath();
          ctx.arc(plat.x + plat.w / 2, screenY - COIN_SIZE / 2 - 2, COIN_SIZE + 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw player
    const playerScreenY = g.playerY - cameraY;
    if (!lowSpecMode) {
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 12;
    }
    // High level visual frame for player
    drawCardSprite(validPlayerCardId, g.playerX, playerScreenY, PLAYER_W, '#38bdf8');
    ctx.shadowBlur = 0;

    // Player outline glow
    if (!lowSpecMode) {
      ctx.strokeStyle = 'rgba(129,140,248,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        g.playerX - PLAYER_W / 2 - 2,
        playerScreenY - PLAYER_H / 2 - 2,
        PLAYER_W + 4,
        PLAYER_H + 4
      );
    }

    // Particles
    for (const p of g.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawCardSprite(p.cardId, p.x, p.y - cameraY, 10 * alpha);
      ctx.restore();
    }

    // HUD
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${g.score}`, 12, 12);

    // Best height
    ctx.fillStyle = 'rgba(251,191,36,0.9)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`TOP: ${g.bestHeight}`, CANVAS_W - 12, 12);
    ctx.restore();
  };

  return (
    <div className="min-h-screen flex flex-col items-center font-sans select-none pb-12 w-full bg-slate-50/30 text-slate-800 overflow-x-hidden">
      {/* Header */}
      <header className="w-full h-16 flex items-center justify-between border-b border-slate-100 px-4 md:px-6 bg-white shrink-0">
        <button
          onClick={onExit}
          className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer text-slate-600 flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
            {t('mode_cardjumper' as any, language)}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {language === 'ko' ? '카드 점프' : 'CARD JUMP'}
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold text-xs tabular-nums">
          {hudScore}
        </div>
      </header>

      <div className="w-full max-w-md px-4 mt-4 flex flex-col items-center">
        {/* Companion Card Info */}
        <div className="w-full bg-white rounded-2xl border border-slate-100 p-3 mb-4 flex items-center gap-3 shadow-xs">
          <div
            className="w-10 h-10 rounded-xl border border-amber-400 bg-cover bg-center shrink-0"
            style={{
              backgroundImage: `url('/card100.png')`,
              backgroundSize: '1000% 1100%',
              backgroundPosition: `${((validPlayerCardId - 1) % 10) * (100 / 9)}% ${Math.floor((validPlayerCardId - 1) / 10) * (100 / 10)}%`,
              imageRendering: 'pixelated',
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">
              {language === 'ko' ? '점프 캐릭터' : 'JUMPER'}
            </p>
            <p className="text-slate-850 text-xs font-bold truncate">
              {CARD_DATABASE[validPlayerCardId]?.title_dis ||
                CARD_DATABASE[validPlayerCardId]?.title_en ||
                `Card #${validPlayerCardId}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[9px] font-bold uppercase">
              {language === 'ko' ? '최고' : 'BEST'}
            </p>
            <p className="text-slate-800 text-sm font-extrabold tabular-nums">{hudBest}</p>
          </div>
        </div>

        {/* Responsive Canvas Wrapper */}
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-3xl border border-slate-950 bg-slate-950 shadow-2xl shadow-indigo-950/20 touch-none max-w-[340px]'
          )}
          style={{
            aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
            touchAction: 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />

          {/* Start Screen Hint */}
          {!gameRef.current.started && !gameRef.current.isGameOver && !showTutorial && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-950/75 backdrop-blur-xs rounded-2xl px-6 py-4 text-center border border-white/5 mx-4">
                <p className="text-white text-sm font-black mb-1">
                  {language === 'ko' ? '화면 좌/우 터치로 이동!' : 'TAP LEFT/RIGHT TO STEER!'}
                </p>
                <p className="text-indigo-300/80 text-[10px] font-bold">
                  {language === 'ko' ? '터치하면 바로 시작됩니다' : 'Game starts on tap'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Touch zone hint */}
        <div className="mt-4 px-4 py-2 bg-white rounded-2xl border border-slate-100 text-[10px] text-slate-500 font-bold text-center w-full max-w-[340px] shadow-xs">
          {language === 'ko'
            ? '화면 왼쪽/오른쪽 터치로 이동 | ← → 키보드 지원'
            : 'Tap left/right screen half to move | Arrow keys supported'}
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Zap size={16} />
              </span>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                {t('tutorial_title', language)}
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
              {t('tutorial_cardjumper', language)}
            </p>
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setShowTutorial(false);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {t('tutorial_start_game', language)}
            </button>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {hudGameOver && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white text-slate-855 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-100/80 animate-in zoom-in-95 duration-200">
            <Trophy size={42} className="mx-auto text-amber-500 mb-3 animate-bounce" />
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              {language === 'ko' ? '게임 오버' : 'GAME OVER'}
            </h2>
            <p className="text-sm font-medium text-slate-500 mb-1">
              {language === 'ko' ? `점수: ${gameRef.current.score}` : `Score: ${gameRef.current.score}`}
            </p>
            <p className="text-sm font-semibold text-amber-500 mb-4">
              {language === 'ko'
                ? `최고 높이: ${gameRef.current.bestHeight}`
                : `Best Height: ${gameRef.current.bestHeight}`}
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-extrabold text-indigo-600">
                +{Math.floor(gameRef.current.score / 5)}
              </span>
              <span className="text-xs font-semibold text-slate-400">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => startGame(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold active:scale-95 transition-all shadow-md shadow-indigo-600/10 hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                {language === 'ko' ? '재시작' : 'Restart'}
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ko' ? '종료' : 'Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


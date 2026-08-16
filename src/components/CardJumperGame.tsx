import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl, getCardSpriteStyle } from '../lib/utils';

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
  const cards1ImgRef = useRef<HTMLImageElement | null>(null);
  const cards2ImgRef = useRef<HTMLImageElement | null>(null);
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
    const img1 = new Image();
    img1.src = getAssetUrl('/cards1.png');
    cards1ImgRef.current = img1;

    const img2 = new Image();
    img2.src = getAssetUrl('/cards2.png');
    cards2ImgRef.current = img2;
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
        let dir = moveRef.current;
        if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) {
          dir = -1;
        } else if (keysRef.current.has('arrowright') || keysRef.current.has('d')) {
          dir = 1;
        }
        g.playerX += dir * moveSpeed;
        g.playerDirection = dir;
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

    const drawCardSprite = (cardId: number, cx: number, cy: number, size: number, borderGlowColor?: string) => {
      const idx = CARD_DATABASE[cardId] ? cardId : 1;
      const isCards2 = idx >= 101;
      const targetImg = isCards2 ? cards2ImgRef.current : cards1ImgRef.current;
      if (!targetImg || !targetImg.complete || targetImg.naturalWidth <= 0) {
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
        return;
      }
      const col = isCards2 ? (idx - 101) % 10 : (idx - 1) % 10;
      const row = isCards2 ? 0 : Math.floor(((idx - 1) % 100) / 10);
      const spriteW = targetImg.naturalWidth / 10;
      const spriteH = targetImg.naturalHeight / 10;
      
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
        targetImg,
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
    <div className="h-[100dvh] max-h-[100dvh] flex flex-col items-center justify-between font-mono select-none pb-1 w-full bg-[#fdfcfc] text-[#201d1d] overflow-hidden">
      {/* Header */}
      <header className="w-full h-12 flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] px-3 sm:px-4 bg-[#fdfcfc] shrink-0">
        <button
          onClick={onExit}
          className="px-2.5 py-1.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm hover:bg-[#f1eeee] text-[#201d1d] transition-colors cursor-pointer flex items-center gap-1 min-h-[44px]"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">[ESC]</span>
        </button>
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-bold text-[#201d1d] tracking-tight">
            {t('mode_cardjumper' as any, language)}
          </h1>
          <p className="text-[9px] font-bold text-[#6e6e73] uppercase tracking-wider">
            [ CARD JUMPER ]
          </p>
        </div>
        <div className="px-3 py-1 rounded-sm bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] font-bold text-xs tabular-nums">
          SCORE: {hudScore}
        </div>
      </header>

      <div className="w-full max-w-md px-3 flex flex-col items-center flex-1 min-h-0 justify-center">
        {/* Companion Card Info */}
        <div className="w-full bg-[#f8f7f7] rounded-none border border-[rgba(15,0,0,0.12)] p-2 mb-1.5 flex items-center gap-2.5 shrink-0">
          <div
            className="w-7 h-7 rounded-sm border border-[rgba(15,0,0,0.2)] bg-cover bg-center shrink-0"
            style={getCardSpriteStyle(validPlayerCardId)}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[#6e6e73] text-[9px] font-bold uppercase tracking-wider">
              {language === 'ko' ? '[ 점퍼 카드 ]' : '[ JUMPER CARD ]'}
            </p>
            <p className="text-[#201d1d] text-xs font-bold truncate">
              {CARD_DATABASE[validPlayerCardId]?.title_dis ||
                CARD_DATABASE[validPlayerCardId]?.title_en ||
                `Card #${validPlayerCardId}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[#6e6e73] text-[8px] font-bold uppercase">
              {language === 'ko' ? '최고 기록' : 'BEST'}
            </p>
            <p className="text-[#201d1d] text-xs font-bold tabular-nums">TOP {hudBest}</p>
          </div>
        </div>

        {/* Responsive Canvas Wrapper */}
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-none border border-[rgba(15,0,0,0.25)] bg-[#0f0000] shadow-none touch-none max-w-[300px] sm:max-w-[340px] max-h-[50vh] flex-1 min-h-0'
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
            className="w-full h-full object-contain"
          />

          {/* Start Screen Hint */}
          {!gameRef.current.started && !gameRef.current.isGameOver && !showTutorial && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div className="bg-[#0f0000]/85 backdrop-blur-none rounded-none px-4 py-3 text-center border border-[rgba(255,255,255,0.2)] mx-4">
                <p className="text-[#fdfcfc] text-xs font-bold mb-1">
                  {language === 'ko' ? '[ 화면 좌/우 터치로 조작 ]' : '[ TAP LEFT/RIGHT TO STEER ]'}
                </p>
                <p className="text-[#9a9898] text-[9px] font-bold">
                  {language === 'ko' ? '터치 시 즉시 게임이 시작됩니다' : 'Game starts on tap'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Left / Right steering buttons */}
        <div className="mt-2 flex items-center justify-center gap-3 w-full max-w-xs sm:hidden select-none shrink-0 px-1">
          <button
            type="button"
            onPointerDown={() => {
              const g = gameRef.current;
              if (!g.started) g.started = true;
              moveRef.current = -1;
            }}
            onPointerUp={() => {
              moveRef.current = 0;
            }}
            onPointerLeave={() => {
              moveRef.current = 0;
            }}
            className="flex-1 py-2.5 rounded-sm bg-[#f1eeee] active:bg-[#201d1d] active:text-[#fdfcfc] border border-[rgba(15,0,0,0.18)] flex items-center justify-center text-xs font-bold text-[#201d1d] active:scale-95 touch-manipulation min-h-[44px]"
          >
            [◀ {language === 'ko' ? '왼쪽' : 'Left'}]
          </button>
          <button
            type="button"
            onPointerDown={() => {
              const g = gameRef.current;
              if (!g.started) g.started = true;
              moveRef.current = 1;
            }}
            onPointerUp={() => {
              moveRef.current = 0;
            }}
            onPointerLeave={() => {
              moveRef.current = 0;
            }}
            className="flex-1 py-2.5 rounded-sm bg-[#f1eeee] active:bg-[#201d1d] active:text-[#fdfcfc] border border-[rgba(15,0,0,0.18)] flex items-center justify-center text-xs font-bold text-[#201d1d] active:scale-95 touch-manipulation min-h-[44px]"
          >
            [{language === 'ko' ? '오른쪽' : 'Right'} ▶]
          </button>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0000]/70 backdrop-blur-none px-4 font-mono">
          <div className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-sm rounded-none border border-[rgba(15,0,0,0.2)] p-5 animate-none">
            <div className="flex items-center gap-2 mb-3 border-b border-[rgba(15,0,0,0.12)] pb-2.5">
              <span className="p-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm text-[#201d1d] shrink-0">
                <Zap size={14} />
              </span>
              <h3 className="text-sm font-bold text-[#201d1d] uppercase tracking-tight">
                [ {t('tutorial_title', language)} ]
              </h3>
            </div>
            <p className="text-xs font-medium text-[#424245] leading-relaxed mb-5 whitespace-pre-line">
              {t('tutorial_cardjumper', language)}
            </p>
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setShowTutorial(false);
              }}
              className="w-full py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-xs rounded-sm border border-[#201d1d] active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              [ {t('tutorial_start_game', language)} ]
            </button>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {hudGameOver && (
        <div className="fixed inset-0 z-50 bg-[#0f0000]/70 backdrop-blur-none flex items-center justify-center p-4 font-mono">
          <div className="bg-[#fdfcfc] text-[#201d1d] rounded-none p-5 max-w-xs w-full text-center border border-[rgba(15,0,0,0.2)] animate-none">
            <Trophy size={36} className="mx-auto text-[#201d1d] mb-2" />
            <h2 className="text-base font-bold text-[#201d1d] mb-1">
              {language === 'ko' ? '[ 게임 오버 ]' : '[ GAME OVER ]'}
            </h2>
            <p className="text-xs font-medium text-[#424245] mb-1">
              {language === 'ko' ? `점수: ${gameRef.current.score}` : `Score: ${gameRef.current.score}`}
            </p>
            <p className="text-xs font-bold text-[#646262] mb-3">
              {language === 'ko'
                ? `최고 높이: ${gameRef.current.bestHeight}`
                : `Best Height: ${gameRef.current.bestHeight}`}
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-4 p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm">
              <span className="text-2xl font-bold text-[#201d1d]">
                +{Math.floor(gameRef.current.score / 5)}
              </span>
              <span className="text-xs font-bold text-[#6e6e73]">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => startGame(true)}
                className="w-full py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm font-bold text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw size={14} />
                {language === 'ko' ? '[ 재시작 ]' : '[ Restart ]'}
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-[#f8f7f7] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.18)] text-[#201d1d] font-bold text-xs rounded-sm active:scale-95 transition-all cursor-pointer min-h-[44px]"
              >
                {language === 'ko' ? '[ 나가기 ]' : '[ Exit ]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


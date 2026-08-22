import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { cn, getAssetUrl } from '../lib/utils';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { get2DGameTutorialSteps } from '../lib/mission2DCardTutorialEngine';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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
const COIN_SIZE = 20;
const PLATFORM_GAP_BASE = 80;

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
  onReward,
}) => {
  const isKo = language === 'ko';
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

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_jumper') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState(false);
  const [hudScore, setHudScore] = useState(0);
  const [hudGameOver, setHudGameOver] = useState(false);
  const [hudBest, setHudBest] = useState(0);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const hudCounter = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const moveRef = useRef(0);
  const startTimeRef = useRef(Date.now());

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

  const startGame = useCallback(() => {
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
    startTimeRef.current = Date.now();
    setHudScore(0);
    setHudBest(0);
    setHudGameOver(false);
    setSettlementReceipt(null);
  }, [initPlatforms]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const triggerSettlement = useCallback((finalScore: number, finalHeight: number) => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;

    const durationSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
    const isVictory = finalHeight >= 50 || finalScore >= 200;

    const receipt = calculateAndDepositMissionReward({
      gameId: 'card_jumper',
      gameTitle: isKo ? '2D 카드 점퍼 스카이' : '2D Card Jumper Sky',
      durationSeconds,
      score: finalScore * 10 + finalHeight * 5,
      maxTargetScore: 1800,
      isVictory,
      difficulty: finalHeight >= 100 ? 'NIGHTMARE' : finalHeight >= 50 ? 'HARD' : 'NORMAL',
      comboCount: Math.floor(finalScore / 10),
      perfectClear: finalHeight >= 100,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isKo, onReward]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showTutorial || isPaused) return;
      const g = gameRef.current;
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      if (['arrowleft', 'arrowright', 'a', 'd', ' '].includes(key)) {
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
  }, [showTutorial, isPaused]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (showTutorial || isPaused) return;

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
    if (showTutorial || isPaused) return;
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

  const handleTouchEnd = () => {
    moveRef.current = 0;
  };

  // Generate platform helper
  const generatePlatform = (g: typeof gameRef.current): Platform => {
    const gap = PLATFORM_GAP_BASE + Math.random() * 30;
    const y = g.lastPlatformY - gap;
    g.lastPlatformY = y;
    const w = PLATFORM_W * (0.65 + Math.random() * 0.7);
    const x = Math.random() * (CANVAS_W - w);
    const cardId = Math.floor(Math.random() * 110) + 1;

    const rVal = Math.random();
    let type: 'normal' | 'spring' | 'broken' = 'normal';
    if (rVal < 0.12) type = 'spring';
    else if (rVal < 0.28) type = 'broken';

    return {
      x,
      y,
      w,
      cardId: CARD_DATABASE[cardId] ? cardId : 1,
      hasCoin: Math.random() < 0.7,
      coinCollected: false,
      type,
    };
  };

  // Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      const g = gameRef.current;

      if (!g.isGameOver && !showTutorial && !isPaused) {
        if (g.started) {
          let moveDir = 0;
          if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) moveDir -= 1;
          if (keysRef.current.has('arrowright') || keysRef.current.has('d')) moveDir += 1;
          if (moveRef.current !== 0) moveDir = moveRef.current;

          const speed = 240;
          g.playerX += moveDir * speed * dt;
          g.playerDirection = moveDir;

          if (g.playerX < PLAYER_W / 2) g.playerX = PLAYER_W / 2;
          if (g.playerX > CANVAS_W - PLAYER_W / 2) g.playerX = CANVAS_W - PLAYER_W / 2;

          g.playerVY += GRAVITY * (dt * 60);
          g.playerY += g.playerVY * (dt * 60);

          if (g.playerVY > 0) {
            const playerBottom = g.playerY + PLAYER_H / 2;
            for (const plat of g.platforms) {
              const platTop = plat.y;
              if (
                playerBottom >= platTop &&
                playerBottom - g.playerVY * (dt * 60) <= platTop + 8 &&
                g.playerX + PLAYER_W / 2 >= plat.x &&
                g.playerX - PLAYER_W / 2 <= plat.x + plat.w
              ) {
                if (plat.type === 'broken') {
                  if (!plat.brokenStepped) {
                    plat.brokenStepped = true;
                    g.playerVY = JUMP_VELOCITY * 0.7;
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                  }
                } else if (plat.type === 'spring') {
                  g.playerVY = JUMP_VELOCITY * 1.55;
                  playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
                } else {
                  g.playerVY = JUMP_VELOCITY;
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                }
                break;
              }
            }
          }

          // Coin Collection
          for (const plat of g.platforms) {
            if (plat.hasCoin && !plat.coinCollected) {
              const coinX = plat.x + plat.w / 2;
              const coinY = plat.y - COIN_SIZE / 2 - 2;
              const dx = g.playerX - coinX;
              const dy = g.playerY - coinY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < (PLAYER_W + COIN_SIZE) / 2) {
                plat.coinCollected = true;
                const coinPts = plat.cardId % 10 === 0 ? 15 : 5;
                g.score += coinPts;
                playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

                for (let i = 0; i < 6; i++) {
                  const angle = (Math.PI * 2 * i) / 6;
                  g.particles.push({
                    x: coinX,
                    y: coinY,
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    life: 250,
                    maxLife: 250,
                    cardId: plat.cardId,
                  });
                }
              }
            }
          }

          // Camera follow
          const targetCameraY = g.playerY - CANVAS_H * 0.55;
          if (targetCameraY < g.cameraY) {
            g.cameraY = targetCameraY;
          } else {
            g.cameraY += g.scrollSpeed * (dt * 60) * 0.4;
          }

          const heightScore = Math.floor(-g.cameraY / 10);
          if (heightScore > g.bestHeight) {
            g.bestHeight = heightScore;
            g.score += 1;
          }

          g.scrollSpeed = Math.min(
            MAX_SCROLL_SPEED,
            Math.max(MIN_SCROLL_SPEED, BASE_SCROLL_SPEED + g.bestHeight * 0.01)
          );

          while (g.platforms.length < 15) {
            g.platforms.push(generatePlatform(g));
          }
          g.platforms = g.platforms.filter(p => p.y - g.cameraY < CANVAS_H + 200);

          if (g.playerY - g.cameraY > CANVAS_H + 80) {
            g.isGameOver = true;
            setHudGameOver(true);
            if (g.bestHeight > hudBest) setHudBest(g.bestHeight);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
            triggerSettlement(g.score, g.bestHeight);
          }
        }
      }

      // Particles
      g.particles = g.particles
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 16,
        }))
        .filter(p => p.life > 0);

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
  }, [showTutorial, isPaused, playSfx, hudBest, triggerSettlement]);

  const renderCanvas = (g: typeof gameRef.current, timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const scaleX = w / CANVAS_W;
    const scaleY = h / CANVAS_H;
    ctx.scale(scaleX, scaleY);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    const scoreVal = g.score;
    if (scoreVal < 40) {
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#020617');
    } else if (scoreVal < 100) {
      bgGrad.addColorStop(0, '#1c1917');
      bgGrad.addColorStop(1, '#090d16');
    } else {
      bgGrad.addColorStop(0, '#180d2b');
      bgGrad.addColorStop(1, '#090d16');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

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

      let bodyColor = '#1e293b';
      let topColor = '#38bdf8';
      let shadowColor = '#0284c7';
      if (plat.type === 'spring') {
        bodyColor = '#451a03';
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
      ctx.beginPath();
      ctx.roundRect(plat.x, screenY, plat.w, PLATFORM_H, 2);
      ctx.fill();

      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.roundRect(plat.x + 2, screenY, plat.w - 4, PLATFORM_H / 2, 2);
      ctx.fill();

      // Coin
      if (plat.hasCoin && !plat.coinCollected) {
        const isRare = plat.cardId % 10 === 0;
        const glowColor = isRare ? '#fbbf24' : '#38bdf8';
        drawCardSprite(plat.cardId, plat.x + plat.w / 2, screenY - COIN_SIZE / 2 - 2, COIN_SIZE, glowColor);
      }
    }

    // Draw player
    const playerScreenY = g.playerY - cameraY;
    drawCardSprite(validPlayerCardId, g.playerX, playerScreenY, PLAYER_W, '#f59e0b');

    // Particles
    for (const p of g.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawCardSprite(p.cardId, p.x, p.y - cameraY, 10 * alpha);
      ctx.restore();
    }

    ctx.restore();
  };

  const tutorialSteps = get2DGameTutorialSteps('card_jumper', isKo);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0f1117] text-slate-100 flex flex-col justify-between font-mono select-none w-full overflow-hidden">
      {/* Top Safe Area HUD */}
      <MobileSafeAreaHUD
        gameTitle={isKo ? '카드 점퍼 스카이' : 'Card Jumper Sky'}
        score={hudScore}
        customMetricLabel={isKo ? '최고 높이' : 'Height'}
        customMetricValue={`${hudBest}m`}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Info Bar */}
      <div className="w-full max-w-md mx-auto px-3 flex items-center justify-between text-xs py-1 bg-white/5 border border-white/10 shrink-0">
        <span className="text-slate-400">
          {isKo ? '조작' : 'CONTROLS'}: <span className="text-amber-400 font-bold">{isKo ? '좌/우 터치 이동' : 'TAP LEFT/RIGHT'}</span>
        </span>
        <span className="text-slate-300">
          {isKo ? '점수' : 'SCORE'}: <span className="text-emerald-400 font-bold">{hudScore}</span>
        </span>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2">
        <div
          className="relative w-full max-w-[320px] aspect-[9/16] max-h-[60vh] bg-black/60 border border-white/10 overflow-hidden touch-none"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />

          {/* Start Overlay */}
          {!gameRef.current.started && !gameRef.current.isGameOver && !showTutorial && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none p-4">
              <div className="bg-slate-900/90 border border-amber-400/50 p-3 text-center rounded-none shadow-xl">
                <p className="text-amber-400 text-xs font-bold mb-1 font-mono">
                  {isKo ? '[ 화면 좌/우 터치로 시작 ]' : '[ TAP LEFT/RIGHT TO START ]'}
                </p>
                <p className="text-slate-400 text-[10px] font-mono">
                  {isKo ? '코인 수집 & 끝없는 도약!' : 'Collect coins & reach the skies!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile One-Handed Left / Right Steering */}
      <div className="shrink-0 flex items-center justify-center gap-3 w-full max-w-xs mx-auto pb-2 px-3 select-none">
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
          className="flex-1 py-3 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-xs font-mono font-bold text-white active:scale-95 touch-manipulation min-h-[44px]"
        >
          ◀ {isKo ? '왼쪽' : 'Left'}
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
          className="flex-1 py-3 rounded-sm bg-white/10 active:bg-amber-500/30 border border-white/20 flex items-center justify-center text-xs font-mono font-bold text-white active:scale-95 touch-manipulation min-h-[44px]"
        >
          {isKo ? '오른쪽' : 'Right'} ▶
        </button>
      </div>

      {/* 2D Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_jumper"
          gameTitle={isKo ? '2D 카드 점퍼 스카이' : '2D Card Jumper Sky'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Game Over Reward Modal */}
      {hudGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={() => startGame()}
          onExit={onExit}
        />
      )}
    </div>
  );
};

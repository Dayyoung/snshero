import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRainbowObbyGameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  cardId?: number;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  type: 'normal' | 'moving' | 'bounce' | 'crumble';
  vx?: number;
  intact?: boolean;
}

interface Star {
  x: number;
  y: number;
  collected: boolean;
}

const RAINBOW_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];

export const PokiRainbowObbyGame: React.FC<PokiRainbowObbyGameProps> = ({
  onBack,
  onExit,
  onClose,
  deck = [],
  cardId,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 11;

  const [currentHeight, setCurrentHeight] = useState(0);
  const [stars, setStars] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 500,
    vx: 0,
    vy: 0,
    cameraY: 0,
    maxHeight: 0,
    targetHeight: 1200,
    isGrounded: false,
    inputLeft: false,
    inputRight: false,
    starsCollected: 0,
    platforms: [] as Platform[],
    starsList: [] as Star[],
    touchActive: false,
    touchSide: '' as 'left' | 'right' | ''
  });

  const initWorld = useCallback(() => {
    const s = gameState.current;
    s.px = 200;
    s.py = 500;
    s.vx = 0;
    s.vy = 0;
    s.cameraY = 0;
    s.maxHeight = 0;
    s.starsCollected = 0;
    s.platforms = [];
    s.starsList = [];

    // Base floor
    s.platforms.push({ x: 0, y: 550, w: 450, h: 40, color: '#475569', type: 'normal' });

    // Procedural rainbow stairs
    let curY = 480;
    for (let i = 1; i <= 60; i++) {
      const col = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
      const w = Math.max(70, 130 - Math.floor(i * 0.8));
      const x = 30 + Math.random() * (360 - w);
      const type = i % 5 === 0 ? 'moving' : i % 7 === 0 ? 'bounce' : 'normal';
      s.platforms.push({
        x,
        y: curY,
        w,
        h: 16,
        color: col,
        type,
        vx: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
        intact: true
      });

      if (i % 3 === 0) {
        s.starsList.push({ x: x + w / 2, y: curY - 25, collected: false });
      }
      curY -= 65 + Math.random() * 20;
    }
    s.targetHeight = Math.abs(curY);
  }, []);

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokirainbowobby',
      gameTitle: isKo ? 'Rainbow Obby (레인보우 오비)' : 'Rainbow Obby',
      durationSeconds: 30,
      score: gameState.current.starsCollected * 100 + 500,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const handleJump = useCallback(() => {
    const s = gameState.current;
    if (s.isGrounded) {
      s.vy = -14.5;
      s.isGrounded = false;
      if (playSfx) playSfx('/sfx/jump.mp3');
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [playSfx]);

  useEffect(() => {
    initWorld();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon && !isGameOver) {
        // Controls
        if (s.inputLeft || s.touchSide === 'left') {
          s.vx = -5;
        } else if (s.inputRight || s.touchSide === 'right') {
          s.vx = 5;
        } else {
          s.vx *= 0.8;
        }

        // Gravity & Physics
        s.vy += 32 * dt;
        s.px += s.vx;
        s.py += s.vy;

        // Screen boundaries
        if (s.px < 20) s.px = 20;
        if (s.px > canvas.width - 20) s.px = canvas.width - 20;

        // Platform collisions
        s.isGrounded = false;
        for (const p of s.platforms) {
          if (p.type === 'moving' && p.vx) {
            p.x += p.vx;
            if (p.x < 10 || p.x + p.w > canvas.width - 10) p.vx = -p.vx;
          }

          if (s.vy > 0 && s.px >= p.x - 15 && s.px <= p.x + p.w + 15 && s.py >= p.y - 5 && s.py <= p.y + 16) {
            s.py = p.y;
            s.isGrounded = true;
            if (p.type === 'bounce') {
              s.vy = -20;
              s.isGrounded = false;
              if (navigator.vibrate) navigator.vibrate(40);
            } else {
              s.vy = 0;
            }
          }
        }

        // Stars collection
        for (const st of s.starsList) {
          if (!st.collected) {
            const dx = s.px - st.x;
            const dy = s.py - st.y;
            if (dx * dx + dy * dy < 700) {
              st.collected = true;
              s.starsCollected++;
              setStars(s.starsCollected);
              if (playSfx) playSfx('/sfx/coin.mp3');
              if (navigator.vibrate) navigator.vibrate(20);
            }
          }
        }

        // Camera follow
        const targetCamY = canvas.height * 0.65 - s.py;
        s.cameraY += (targetCamY - s.cameraY) * 0.1;

        const climbed = Math.max(0, Math.floor(550 - s.py));
        if (climbed > s.maxHeight) {
          s.maxHeight = climbed;
          setCurrentHeight(climbed);
          if (climbed >= s.targetHeight) {
            handleVictory();
          }
        }

        // Fall death check
        if (s.py > 550 - s.cameraY + canvas.height) {
          s.px = 200;
          s.py = 500;
          s.vy = 0;
          if (navigator.vibrate) navigator.vibrate([100, 100]);
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(0, s.cameraY);

      // Rainbow clouds background
      for (let y = 500; y > -4000; y -= 400) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.arc(100, y, 90, 0, Math.PI * 2);
        ctx.arc(300, y + 100, 110, 0, Math.PI * 2);
        ctx.fill();
      }

      // Platforms
      for (const p of s.platforms) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (p.type === 'bounce') {
          ctx.fillStyle = '#fde047';
          ctx.fillRect(p.x + p.w / 2 - 8, p.y - 4, 16, 4);
        }
      }

      // Stars
      for (const st of s.starsList) {
        if (!st.collected) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(st.x, st.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Player Character
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 44, 44, 44);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') gameState.current.inputLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd') gameState.current.inputRight = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') handleJump();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') gameState.current.inputLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') gameState.current.inputRight = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [effectiveCardId, gameWon, handleJump, handleVictory, initWorld, isGameOver, playSfx]);

  const onTouchStart = (side: 'left' | 'right') => {
    gameState.current.touchSide = side;
    handleJump();
  };

  const onTouchEnd = () => {
    gameState.current.touchSide = '';
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Rainbow Obby (레인보우 오비)' : 'Rainbow Obby'}
        currentScore={currentHeight}
        targetScore={1000}
        onBack={handleExit}
        stageInfo={`${Math.floor((currentHeight / 1000) * 100)}% | ⭐ ${stars}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Mobile Pure Touch Controls */}
      <div className="absolute bottom-6 inset-x-4 flex justify-between gap-4 z-20 pointer-events-none">
        <button
          className="pointer-events-auto flex-1 h-20 bg-slate-800/80 active:bg-blue-600/80 text-white rounded-2xl border-2 border-slate-600 flex items-center justify-center font-bold text-2xl backdrop-blur-md active:scale-95 transition-transform"
          onTouchStart={() => onTouchStart('left')}
          onTouchEnd={onTouchEnd}
          onMouseDown={() => onTouchStart('left')}
          onMouseUp={onTouchEnd}
        >
          ◀ JUMP
        </button>
        <button
          className="pointer-events-auto flex-1 h-20 bg-slate-800/80 active:bg-blue-600/80 text-white rounded-2xl border-2 border-slate-600 flex items-center justify-center font-bold text-2xl backdrop-blur-md active:scale-95 transition-transform"
          onTouchStart={() => onTouchStart('right')}
          onTouchEnd={onTouchEnd}
          onMouseDown={() => onTouchStart('right')}
          onMouseUp={onTouchEnd}
        >
          JUMP ▶
        </button>
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardReceipt}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiRainbowObbyGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMonkeyTagGameProps {
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

interface Banana {
  x: number;
  y: number;
  collected: boolean;
}

interface BotMonkey {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTagger: boolean;
}

export const PokiMonkeyTagGame: React.FC<PokiMonkeyTagGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 14;

  const [bananas, setBananas] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 350,
    vx: 0,
    vy: 0,
    speed: 190,
    bananasCount: 0,
    timeRemaining: 45,
    tagger: { x: 80, y: 100, vx: 0, vy: 0, speed: 130 },
    bananasList: [] as Banana[],
    targetX: 200,
    targetY: 350,
    isBoosting: false
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimonkeytag',
      gameTitle: isKo ? 'Monkey Tag IO (몽키 태그)' : 'Monkey Tag IO',
      durationSeconds: 30,
      score: gameState.current.bananasCount * 50 + 500,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Spawn bananas
    const bList: Banana[] = [];
    for (let i = 0; i < 18; i++) {
      bList.push({
        x: 40 + Math.random() * 320,
        y: 80 + Math.random() * 500,
        collected: false
      });
    }
    gameState.current.bananasList = bList;

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

      if (!gameWon) {
        s.timeRemaining -= dt;
        setTimeLeft(Math.max(0, Math.ceil(s.timeRemaining)));
        if (s.timeRemaining <= 0) {
          handleVictory();
        }

        // Player move to touch target
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        const curSpeed = s.isBoosting ? s.speed * 1.6 : s.speed;
        if (dist > 5) {
          s.px += (dx / dist) * curSpeed * dt;
          s.py += (dy / dist) * curSpeed * dt;
        }

        // Tagger AI chase player
        const tdx = s.px - s.tagger.x;
        const tdy = s.py - s.tagger.y;
        const tdist = Math.hypot(tdx, tdy);
        if (tdist > 5) {
          s.tagger.x += (tdx / tdist) * s.tagger.speed * dt;
          s.tagger.y += (tdy / tdist) * s.tagger.speed * dt;
        }

        // Tagged by tagger -> lose bananas & pushback
        if (tdist < 35) {
          s.px += (tdx / tdist) * 80;
          s.py += (tdy / tdist) * 80;
          s.bananasCount = Math.max(0, s.bananasCount - 2);
          setBananas(s.bananasCount);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }

        // Boundaries
        s.px = Math.max(30, Math.min(canvas.width - 30, s.px));
        s.py = Math.max(80, Math.min(canvas.height - 80, s.py));

        // Bananas collect
        for (const b of s.bananasList) {
          if (!b.collected && Math.hypot(s.px - b.x, s.py - b.y) < 30) {
            b.collected = true;
            s.bananasCount++;
            setBananas(s.bananasCount);
            if (playSfx) playSfx('/sfx/coin.mp3');
            if (navigator.vibrate) navigator.vibrate(15);
            if (s.bananasCount >= 15) {
              handleVictory();
            }
          }
        }
      }

      // Render Jungle
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Jungle floor decor
      ctx.fillStyle = '#047857';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(50 + (i % 3) * 140, 120 + Math.floor(i / 3) * 160, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bananas
      for (const b of s.bananasList) {
        if (!b.collected) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#000';
          ctx.font = '10px monospace';
          ctx.fillText('🍌', b.x - 7, b.y + 4);
        }
      }

      // Tagger (Gorilla Bot)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(s.tagger.x, s.tagger.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('TAGGER', s.tagger.x - 20, s.tagger.y - 26);

      // Player Monkey
      drawCardSprite(ctx, effectiveCardId, s.px - 24, s.py - 24, 48, 48);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.targetX = e.clientX - rect.left;
      gameState.current.targetY = e.clientY - rect.top;
    };

    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.buttons > 0) onPointer(e);
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Monkey Tag IO (몽키 태그)' : 'Monkey Tag IO'}
        currentScore={bananas}
        targetScore={15}
        onBack={handleExit}
        stageInfo={`${isKo ? '남은 시간' : 'Time'}: ${timeLeft}s | 🍌 ${bananas}/15`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Boost Action Button */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          className="w-24 h-24 rounded-full bg-emerald-600 active:bg-emerald-500 border-4 border-emerald-400 text-white font-bold text-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          onTouchStart={() => { gameState.current.isBoosting = true; }}
          onTouchEnd={() => { gameState.current.isBoosting = false; }}
          onMouseDown={() => { gameState.current.isBoosting = true; }}
          onMouseUp={() => { gameState.current.isBoosting = false; }}
        >
          DASH!
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

export default PokiMonkeyTagGame;

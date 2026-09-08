import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRedBall4GameProps {
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

export const PokiRedBall4Game: React.FC<PokiRedBall4GameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 59;

  const [stars, setStars] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 60,
    py: 450,
    vx: 0,
    vy: 0,
    rotation: 0,
    isGrounded: false,
    inputLeft: false,
    inputRight: false,
    starsList: [
      { x: 180, y: 380, collected: false },
      { x: 300, y: 320, collected: false },
      { x: 420, y: 260, collected: false },
    ],
    finishX: 520,
    cameraX: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiredball4',
      gameTitle: isKo ? '레드볼 4' : 'Red Ball 4',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const jump = useCallback(() => {
    const s = gameState.current;
    if (s.isGrounded) {
      s.vy = -14;
      s.isGrounded = false;
      if (playSfx) playSfx('/sfx/jump.mp3');
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, [playSfx]);

  useEffect(() => {
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

      if (!gameWon) {
        if (s.inputLeft) { s.vx = -180; s.rotation -= 8 * dt; }
        else if (s.inputRight) { s.vx = 180; s.rotation += 8 * dt; }
        else s.vx *= 0.9;

        s.vy += 32 * 20 * dt; // Gravity
        s.px += s.vx * dt;
        s.py += s.vy * dt;

        // Ground check
        if (s.py >= 480) {
          s.py = 480;
          s.vy = 0;
          s.isGrounded = true;
        }

        // Collect stars
        for (const st of s.starsList) {
          if (!st.collected && Math.hypot(s.px - st.x, s.py - st.y) < 30) {
            st.collected = true;
            const count = s.starsList.filter(it => it.collected).length;
            setStars(count);
            if (navigator.vibrate) navigator.vibrate(15);
          }
        }

        s.cameraX += (s.px - canvas.width * 0.3 - s.cameraX) * 0.1;

        if (s.px >= s.finishX) {
          handleVictory();
        }
      }

      // Render Green Hills
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-s.cameraX, 0);

      // Floor
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 500, 800, 150);

      // Stars
      for (const st of s.starsList) {
        if (!st.collected) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(st.x, st.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Finish Flag
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.finishX, 420, 25, 20);
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.finishX, 420, 4, 80);

      // Red Ball
      ctx.save();
      ctx.translate(s.px, s.py);
      ctx.rotate(s.rotation);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      // Card Sprite inside ball
      drawCardSprite(ctx, effectiveCardId, -16, -16, 32, 32);
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '레드볼 4' : 'Red Ball 4'}
        currentScore={stars}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`⭐ Stars: ${stars}/3`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Touch D-Pad */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-4 z-20 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button
            className="w-20 h-20 bg-slate-800/80 active:bg-red-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md active:scale-95"
            onTouchStart={() => { gameState.current.inputLeft = true; }}
            onTouchEnd={() => { gameState.current.inputLeft = false; }}
            onMouseDown={() => { gameState.current.inputLeft = true; }}
            onMouseUp={() => { gameState.current.inputLeft = false; }}
          >
            ◀
          </button>
          <button
            className="w-20 h-20 bg-slate-800/80 active:bg-red-600 text-white rounded-2xl border-2 border-slate-600 font-bold text-2xl flex items-center justify-center backdrop-blur-md active:scale-95"
            onTouchStart={() => { gameState.current.inputRight = true; }}
            onTouchEnd={() => { gameState.current.inputRight = false; }}
            onMouseDown={() => { gameState.current.inputRight = true; }}
            onMouseUp={() => { gameState.current.inputRight = false; }}
          >
            ▶
          </button>
        </div>
        <button
          className="pointer-events-auto w-24 h-20 bg-red-600 active:bg-red-500 text-white rounded-2xl border-2 border-red-400 font-bold text-xl flex items-center justify-center backdrop-blur-md active:scale-95"
          onClick={jump}
        >
          JUMP
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

export default PokiRedBall4Game;

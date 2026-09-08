import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPunchyGuyGameProps {
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

interface BadGuy {
  x: number;
  y: number;
  hp: number;
  knocked: boolean;
}

export const PokiPunchyGuyGame: React.FC<PokiPunchyGuyGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 40;

  const [knocked, setKnocked] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 520,
    fistPos: { x: 200, y: 520 },
    fistTarget: { x: 200, y: 520 },
    isPunching: false,
    punchProgress: 0,
    enemies: [
      { x: 90, y: 220, hp: 1, knocked: false },
      { x: 200, y: 160, hp: 1, knocked: false },
      { x: 310, y: 220, hp: 1, knocked: false },
      { x: 150, y: 320, hp: 1, knocked: false },
      { x: 260, y: 320, hp: 1, knocked: false },
    ] as BadGuy[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokipunchyguy',
      gameTitle: isKo ? 'Punchy Guy (펀치 가이)' : 'Punchy Guy',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const punch = useCallback((tx: number, ty: number) => {
    const s = gameState.current;
    s.isPunching = true;
    s.fistTarget = { x: tx, y: ty };
    s.punchProgress = 0;
    if (playSfx) playSfx('/sfx/whoosh.mp3');
    if (navigator.vibrate) navigator.vibrate(20);
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
      gameState.current.px = canvas.width / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        if (s.isPunching) {
          s.punchProgress += dt * 4;
          const t = Math.sin(Math.min(Math.PI, s.punchProgress * Math.PI));
          s.fistPos.x = s.px + (s.fistTarget.x - s.px) * t;
          s.fistPos.y = s.py + (s.fistTarget.y - s.py) * t;

          // Check hit
          for (const e of s.enemies) {
            if (!e.knocked && Math.hypot(s.fistPos.x - e.x, s.fistPos.y - e.y) < 35) {
              e.knocked = true;
              const count = s.enemies.filter(it => it.knocked).length;
              setKnocked(count);
              if (playSfx) playSfx('/sfx/punch.mp3');
              if (navigator.vibrate) navigator.vibrate(30);

              if (count >= s.enemies.length) {
                handleVictory();
              }
            }
          }

          if (s.punchProgress >= 1) {
            s.isPunching = false;
            s.fistPos = { x: s.px, y: s.py };
          }
        }
      }

      // Render Boxing Arena
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ring lines
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 100, canvas.width - 80, 440);

      // Enemies
      for (const e of s.enemies) {
        ctx.fillStyle = e.knocked ? '#64748b' : '#ef4444';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Stretch Arm
      if (s.isPunching) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(s.px, s.py - 10);
        ctx.lineTo(s.fistPos.x, s.fistPos.y);
        ctx.stroke();

        // Fist
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(s.fistPos.x, s.fistPos.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Boxer Card Character
      drawCardSprite(ctx, effectiveCardId, s.px - 25, s.py - 35, 50, 50);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      punch(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx, punch]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Punchy Guy (펀치 가이)' : 'Punchy Guy'}
        currentScore={knocked}
        targetScore={5}
        onBack={handleExit}
        stageInfo={`🥊 Knockout: ${knocked}/5`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-rose-200 pointer-events-none">
        {isKo ? '화면의 적을 터치하여 고무고무 펀치를 날려 KO시키세요!' : 'Tap enemies to launch your stretchy knockout punches!'}
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

export default PokiPunchyGuyGame;

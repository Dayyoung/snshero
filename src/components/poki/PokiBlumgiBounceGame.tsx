import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiBounceGameProps {
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

export const PokiBlumgiBounceGame: React.FC<PokiBlumgiBounceGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 103;

  const [score, setScore] = useState(0);
  const targetScore = 3;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    ball: { x: 150, y: 500, vx: 0, vy: 0, r: 20, grounded: true },
    hoop: { x: 300, y: 350 },
    dragStart: { x: 0, y: 0 },
    dragging: false
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiblumgibounce',
      gameTitle: isKo ? '블룸기 바운스' : 'Blumgi Bounce',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initBall = useCallback((w: number, h: number) => {
    gameState.current.ball = { x: w * 0.25, y: h * 0.72, vx: 0, vy: 0, r: 22, grounded: true };
    gameState.current.hoop = { x: w * 0.8, y: h * 0.42 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBall(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Card Avatar
      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      const s = gameState.current;

      // Hoop
      ctx.fillStyle = '#f97316';
      ctx.fillRect(s.hoop.x - 24, s.hoop.y, 48, 8);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.hoop.x - 20, s.hoop.y + 8, 40, 28);

      // Ball Physics
      if (!s.ball.grounded) {
        s.ball.vy += 0.28;
        s.ball.x += s.ball.vx;
        s.ball.y += s.ball.vy;

        if (s.ball.y > h * 0.75) {
          s.ball.y = h * 0.75;
          s.ball.grounded = true;
          s.ball.vx = 0;
          s.ball.vy = 0;
        }

        // Hoop hit
        if (Math.hypot(s.ball.x - s.hoop.x, s.ball.y - s.hoop.y) < 30) {
          s.ball.grounded = true;
          s.ball.x = w * 0.25;
          s.ball.y = h * 0.72;
          if (navigator.vibrate) navigator.vibrate([40, 60]);
          setScore((prev) => {
            const next = prev + 1;
            if (next >= targetScore) handleVictory();
            return next;
          });
        }
      }

      // Ball
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Drag Aim Line
      if (s.dragging && s.ball.grounded) {
        ctx.beginPath();
        ctx.moveTo(s.ball.x, s.ball.y);
        ctx.lineTo(s.dragStart.x, s.dragStart.y);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Guide
      ctx.fillStyle = '#d8b4fe';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '캐릭터를 당겨 각도를 맞추고 손을 떼 골대에 슛을 꽂으세요!' : 'Drag character to aim and release to dunk into the hoop!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, handleVictory, initBall, isKo]);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    gameState.current.dragging = true;
    gameState.current.dragStart = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameState.current.dragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    gameState.current.dragStart = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const handleTouchEnd = () => {
    const s = gameState.current;
    if (s.dragging && s.ball.grounded) {
      const dx = s.ball.x - s.dragStart.x;
      const dy = s.ball.y - s.dragStart.y;
      s.ball.grounded = false;
      s.ball.vx = dx * 0.14;
      s.ball.vy = dy * 0.14;
      s.dragging = false;
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '블룸기 바운스' : 'Blumgi Bounce'}
        subtitle="ELASTIC BOUNCE SLINGSHOT"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '당겨서 골대에 넣으세요!' : 'Aim and bounce!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart as any}
        onMouseMove={handleTouchMove as any}
        onMouseUp={handleTouchEnd}
      />

      {gameWon && rewardReceipt && (
        <VictoryRewardModal
          isOpen={true}
          isVictory={true}
          score={score}
          targetScore={targetScore}
          rewardAmount={rewardReceipt.totalSns}
          onClose={handleExit}
        />
      )}
    </div>
  );
};

export default PokiBlumgiBounceGame;

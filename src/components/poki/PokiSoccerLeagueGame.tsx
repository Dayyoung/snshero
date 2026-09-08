import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSoccerLeagueGameProps {
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

export const PokiSoccerLeagueGame: React.FC<PokiSoccerLeagueGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 95;

  const [score, setScore] = useState(0);
  const targetScore = 3;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    ball: { x: 200, y: 400, vx: 0, vy: 0 },
    player: { x: 200, y: 520, vx: 0, vy: 0 },
    dragStart: { x: 0, y: 0 },
    isDragging: false
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokisoccerleague',
      gameTitle: isKo ? '사커 리그' : 'Soccer League',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initPitch = useCallback((w: number, h: number) => {
    gameState.current.ball = { x: w / 2, y: h * 0.48, vx: 0, vy: 0 };
    gameState.current.player = { x: w / 2, y: h * 0.68, vx: 0, vy: 0 };
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
      initPitch(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.08, h * 0.18, w * 0.84, h * 0.65);

      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.5);
      ctx.lineTo(w * 0.92, h * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.5, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 6;
      ctx.strokeRect(w * 0.35, h * 0.17, w * 0.3, 10);

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.1, 50, 50);

      const s = gameState.current;

      s.ball.x += s.ball.vx;
      s.ball.y += s.ball.vy;
      s.ball.vx *= 0.96;
      s.ball.vy *= 0.96;

      if (s.ball.x < w * 0.1 || s.ball.x > w * 0.9) s.ball.vx *= -1;
      if (s.ball.y < h * 0.19) {
        if (s.ball.x > w * 0.35 && s.ball.x < w * 0.65) {
          s.ball.x = w / 2;
          s.ball.y = h * 0.48;
          s.ball.vx = 0;
          s.ball.vy = 0;
          if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
          setScore((prev) => {
            const next = prev + 1;
            if (next >= targetScore) handleVictory();
            return next;
          });
        } else {
          s.ball.vy *= -1;
        }
      }
      if (s.ball.y > h * 0.82) s.ball.vy *= -1;

      const dist = Math.hypot(s.ball.x - s.player.x, s.ball.y - s.player.y);
      if (dist < 34) {
        const ang = Math.atan2(s.ball.y - s.player.y, s.ball.x - s.player.x);
        s.ball.vx = Math.cos(ang) * 11;
        s.ball.vy = Math.sin(ang) * 11;
      }

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (s.isDragging) {
        ctx.beginPath();
        ctx.moveTo(s.player.x, s.player.y);
        ctx.lineTo(s.dragStart.x, s.dragStart.y);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = '#fde047';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스/터치로 선수를 당겨 조준하고 놓아 골을 넣으세요!' : 'Drag player with mouse or touch, release to shoot a goal!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, handleVictory, initPitch, isKo]);

  const handleStart = (clientX: number, clientY: number) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = clientX - rect.left;
    const ty = clientY - rect.top;

    if (Math.hypot(tx - gameState.current.player.x, ty - gameState.current.player.y) < 50) {
      gameState.current.isDragging = true;
      gameState.current.dragStart = { x: tx, y: ty };
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!gameState.current.isDragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    gameState.current.dragStart = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleEnd = () => {
    const s = gameState.current;
    if (s.isDragging) {
      const dx = s.player.x - s.dragStart.x;
      const dy = s.player.y - s.dragStart.y;
      s.ball.vx = dx * 0.2;
      s.ball.vy = dy * 0.2;
      s.isDragging = false;
      if (navigator.vibrate) navigator.vibrate(40);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-emerald-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '사커 리그' : 'Soccer League'}
        subtitle="FINGER SOCCER SHOOTOUT"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '마우스/터치로 당겨서 골을 넣으세요!' : 'Aim and shoot!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) handleStart(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) handleMove(t.clientX, t.clientY);
        }}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
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

export default PokiSoccerLeagueGame;

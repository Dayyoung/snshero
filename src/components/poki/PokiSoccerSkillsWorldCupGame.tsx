import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSoccerSkillsWorldCupGameProps {
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

export const PokiSoccerSkillsWorldCupGame: React.FC<PokiSoccerSkillsWorldCupGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 56;

  const [goals, setGoals] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    ball: { x: 200, y: 520, vx: 0, vy: 0, active: false, scale: 1 },
    keeperX: 200,
    keeperDir: 1,
    goalsCount: 0,
    touchStartX: 0,
    touchStartY: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokisoccerskills2',
      gameTitle: isKo ? '사커 스킬스 월드컵' : 'Soccer Skills World Cup',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const shoot = useCallback((dx: number, dy: number) => {
    const s = gameState.current;
    if (s.ball.active) return;

    s.ball.active = true;
    s.ball.vx = dx * 3.2;
    s.ball.vy = dy * 3.2;
    if (playSfx) playSfx('/sfx/kick.mp3');
    if (navigator.vibrate) navigator.vibrate(25);
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
      gameState.current.ball.x = canvas.width / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        // Keeper patrol
        s.keeperX += s.keeperDir * 140 * dt;
        if (s.keeperX < canvas.width / 2 - 80 || s.keeperX > canvas.width / 2 + 80) {
          s.keeperDir = -s.keeperDir;
        }

        // Ball flight
        if (s.ball.active) {
          s.ball.x += s.ball.vx * dt;
          s.ball.y += s.ball.vy * dt;
          s.ball.scale = Math.max(0.5, s.ball.scale - 0.4 * dt);

          if (s.ball.y <= 200) {
            const isSaved = Math.abs(s.ball.x - s.keeperX) < 30;
            const inGoal = Math.abs(s.ball.x - canvas.width / 2) < 100;

            if (inGoal && !isSaved) {
              s.goalsCount++;
              setGoals(s.goalsCount);
              if (playSfx) playSfx('/sfx/cheer.mp3');
              if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
              if (s.goalsCount >= 3) {
                handleVictory();
              }
            }

            // Reset
            s.ball.active = false;
            s.ball.x = canvas.width / 2;
            s.ball.y = 520;
            s.ball.scale = 1;
          }
        }
      }

      // Render Stadium
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Goal Post
      const gw = 200;
      const gx = canvas.width / 2 - gw / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx, 140, gw, 8);
      ctx.fillRect(gx, 140, 8, 70);
      ctx.fillRect(gx + gw - 8, 140, 8, 70);

      // Keeper
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(s.keeperX, 200, 16, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      ctx.save();
      ctx.translate(s.ball.x, s.ball.y);
      ctx.scale(s.ball.scale, s.ball.scale);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Striker Card Sprite
      if (!s.ball.active) {
        drawCardSprite(ctx, effectiveCardId, canvas.width / 2 - 50, 490, 44, 44);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    gameState.current.touchStartX = t.clientX;
    gameState.current.touchStartY = t.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - gameState.current.touchStartX;
    const dy = t.clientY - gameState.current.touchStartY;
    if (dy < -20) {
      shoot(dx, dy);
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <MinimalistMissionHUD
        gameTitle={isKo ? '사커 스킬스 월드컵' : 'Soccer World Cup'}
        currentScore={goals}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`⚽ Goals: ${goals}/3`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-white pointer-events-none">
        {isKo ? '공에서 골대 방향으로 위로 스와이프하여 골을 넣으세요!' : 'Swipe up towards the goal to score!'}
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

export default PokiSoccerSkillsWorldCupGame;

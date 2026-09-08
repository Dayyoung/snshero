import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiSlimeGameProps {
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

export const PokiBlumgiSlimeGame: React.FC<PokiBlumgiSlimeGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 109;

  const [score, setScore] = useState(0);
  const targetScore = 5;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    slimeY: 500,
    slimeVy: 0,
    charge: 0,
    charging: false,
    platformX: 200,
    platformVx: 2
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiblumgislime',
      gameTitle: isKo ? '블룸기 슬라임' : 'Blumgi Slime',
      durationSeconds: 15,
      score: 1000,
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

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameState.current.slimeY = canvas.height * 0.72;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!gameState.current.charging) {
          gameState.current.charging = true;
          gameState.current.charge = 0;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        const s = gameState.current;
        if (s.charging) {
          s.slimeVy = -s.charge;
          s.charging = false;
          s.charge = 0;
          if (navigator.vibrate) navigator.vibrate(30);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      const s = gameState.current;

      s.platformX += s.platformVx;
      if (s.platformX < 40 || s.platformX > w - 100) s.platformVx *= -1;

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(s.platformX, h * 0.45, 80, 14);

      ctx.fillStyle = '#334155';
      ctx.fillRect(0, h * 0.75, w, 20);

      if (s.charging) {
        s.charge = Math.min(s.charge + 0.4, 18);
      }
      s.slimeVy += 0.35;
      s.slimeY += s.slimeVy;

      if (s.slimeY > h * 0.72) {
        s.slimeY = h * 0.72;
        s.slimeVy = 0;
      }

      if (s.slimeY >= h * 0.42 && s.slimeY <= h * 0.46 && s.slimeVy > 0) {
        const sx = w / 2;
        if (sx >= s.platformX - 20 && sx <= s.platformX + 100) {
          s.slimeVy = -6;
          if (navigator.vibrate) navigator.vibrate([40, 40]);
          setScore((prev) => {
            const next = prev + 1;
            if (next >= targetScore) handleVictory();
            return next;
          });
        }
      }

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      const squish = s.charging ? s.charge * 0.6 : 0;
      ctx.ellipse(w / 2, s.slimeY + squish, 24 + squish, 20 - squish, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#f472b6';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스 누름 / 스페이스바 / 터치로 힘을 모아 점프하세요!' : 'Click/Hold, Space, or Touch to charge & jump!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [effectiveCardId, isKo]);

  const handleStart = () => {
    if (gameWon) return;
    gameState.current.charging = true;
    gameState.current.charge = 0;
  };

  const handleEnd = () => {
    if (gameWon) return;
    const s = gameState.current;
    if (s.charging) {
      s.slimeVy = -s.charge;
      s.charging = false;
      s.charge = 0;
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '블룸기 슬라임' : 'Blumgi Slime'}
        subtitle="SLIME SQUISH JUMPER"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '클릭/터치로 충전 후 점프하세요!' : 'Charge and jump!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-pointer"
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
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

export default PokiBlumgiSlimeGame;

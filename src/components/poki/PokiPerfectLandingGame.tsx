import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPerfectLandingGameProps {
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

export const PokiPerfectLandingGame: React.FC<PokiPerfectLandingGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 99;

  const [score, setScore] = useState(0);
  const targetScore = 3;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    planeX: 50,
    altitude: 300,
    planeSpeed: 3.5,
    pressing: false
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiperfectlanding',
      gameTitle: isKo ? '퍼펙트 랜딩' : 'Perfect Landing',
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
      gameState.current.altitude = canvas.height * 0.4;
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

      // Runway
      const runwayY = h * 0.68;
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, runwayY, w, 44);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 4;
      ctx.setLineDash([24, 24]);
      ctx.beginPath();
      ctx.moveTo(0, runwayY + 22);
      ctx.lineTo(w, runwayY + 22);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flight Physics
      s.planeX += s.planeSpeed;
      if (s.pressing) {
        s.altitude += 2.8;
      } else {
        s.altitude -= 1.8;
      }
      if (s.altitude < h * 0.2) s.altitude = h * 0.2;

      // Wrap around & touchdown check
      if (s.planeX > w + 40) {
        s.planeX = -40;
        if (s.altitude >= runwayY - 30 && s.altitude <= runwayY + 10) {
          if (navigator.vibrate) navigator.vibrate([60, 40, 80]);
          setScore((prev) => {
            const next = prev + 1;
            if (next >= targetScore) handleVictory();
            return next;
          });
        }
      }

      // Draw Airplane
      ctx.save();
      ctx.translate(s.planeX, s.altitude);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(-24, -12);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-24, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Guide
      ctx.fillStyle = '#93c5fd';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '화면을 길게 터치하여 하강하고 활주로에 완벽 착륙하세요!' : 'Touch & hold to descend and land on runway!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, handleVictory, isKo]);

  const handleTouchStart = () => {
    gameState.current.pressing = true;
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleTouchEnd = () => {
    gameState.current.pressing = false;
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '퍼펙트 랜딩' : 'Perfect Landing'}
        subtitle="AIRPLANE RUNWAY TOUCHDOWN"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '터치로 고도를 조절해 착륙하세요!' : 'Adjust altitude to land!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
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

export default PokiPerfectLandingGame;

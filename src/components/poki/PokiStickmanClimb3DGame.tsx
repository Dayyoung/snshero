import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanClimb3DGameProps {
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

export const PokiStickmanClimb3DGame: React.FC<PokiStickmanClimb3DGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 106;

  const [score, setScore] = useState(0);
  const targetScore = 10;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    playerY: 550,
    axeAngle: 0,
    rockY: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistickmanclimb3d',
      gameTitle: isKo ? '스틱맨 클라임 3D' : 'Stickman Climb 3D',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const doClimb = useCallback(() => {
    if (gameWon) return;
    gameState.current.playerY -= 18;
    if (navigator.vibrate) navigator.vibrate(30);

    setScore((prev) => {
      const next = prev + 1;
      if (next >= targetScore) handleVictory();
      return next;
    });

    if (gameState.current.playerY < window.innerHeight * 0.25) {
      gameState.current.playerY = window.innerHeight * 0.72;
    }
  }, [gameWon, handleVictory, targetScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameState.current.playerY = canvas.height * 0.72;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        doClimb();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      const s = gameState.current;

      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.65);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      for (let y = h * 0.2; y < h * 0.85; y += 40) {
        ctx.strokeRect(w * 0.32, y, w * 0.36, 20);
      }

      const px = w / 2;
      const py = s.playerY;

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(px, py + 15, 22, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(px, py - 16, 12, 0, Math.PI * 2);
      ctx.fill();

      s.axeAngle += 0.04;
      const axeLen = 42;
      const ax = px + Math.cos(s.axeAngle) * axeLen;
      const ay = py + Math.sin(s.axeAngle) * axeLen;
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(ax - 6, ay - 6, 12, 12);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스 클릭 / 스페이스바 / 터치로 암벽을 등반하세요!' : 'Click, Space, or Touch to hook axe & climb up!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [doClimb, effectiveCardId, isKo]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '스틱맨 클라임 3D' : 'Stickman Climb 3D'}
        subtitle="CLIFF AXE CLIMBER"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '클릭 또는 터치로 암벽을 오르세요!' : 'Click or touch to climb!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-pointer"
        onTouchStart={doClimb}
        onMouseDown={doClimb}
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

export default PokiStickmanClimb3DGame;

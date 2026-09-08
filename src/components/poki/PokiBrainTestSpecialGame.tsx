import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTestSpecialGameProps {
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

export const PokiBrainTestSpecialGame: React.FC<PokiBrainTestSpecialGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 107;

  const [score, setScore] = useState(0);
  const targetScore = 4;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    safeCode: [3, 7, 2, 9],
    currentNum: 0,
    unlocked: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokibraintestspecial',
      gameTitle: isKo ? '브레인 테스트 스페셜' : 'Brain Test Special',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const handleDial = useCallback(() => {
    if (gameWon) return;
    const s = gameState.current;
    s.currentNum = (s.currentNum + 1) % 10;
    if (navigator.vibrate) navigator.vibrate(20);

    if (s.currentNum === s.safeCode[s.unlocked]) {
      s.unlocked += 1;
      if (navigator.vibrate) navigator.vibrate([40, 40]);
      setScore((prev) => {
        const next = prev + 1;
        if (next >= targetScore) handleVictory();
        return next;
      });
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
    };
    resize();
    window.addEventListener('resize', resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        handleDial();
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

      const sw = Math.min(w * 0.7, 260);
      const sh = sw;
      const sx = (w - sw) / 2;
      const sy = h * 0.35;

      ctx.fillStyle = '#334155';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 6;
      ctx.strokeRect(sx, sy, sw, sh);

      const cx = sx + sw / 2;
      const cy = sy + sh / 2;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(s.currentNum), cx, cy + 12);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`TARGET: [ ${s.safeCode[s.unlocked] ?? 'OK'} ]`, cx, sy - 20);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.fillText(isKo ? '다이얼을 마우스 클릭 / 터치로 맞춰 금고를 여세요!' : 'Click or tap dial to match code & open safe!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveCardId, handleDial, isKo]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '브레인 테스트 스페셜' : 'Brain Test Special'}
        subtitle="SAFE DIAL RIDDLE"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '다이얼을 클릭/터치해 금고를 여세요!' : 'Match code!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-pointer"
        onTouchStart={handleDial}
        onMouseDown={handleDial}
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

export default PokiBrainTestSpecialGame;

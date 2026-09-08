import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiScaryTeacherHideSeekGameProps {
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

export const PokiScaryTeacherHideSeekGame: React.FC<PokiScaryTeacherHideSeekGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 71;

  const [keysFound, setKeysFound] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 500,
    targetX: 200,
    targetY: 500,
    teacherX: 200,
    teacherY: 200,
    teacherDir: 1,
    keys: [
      { x: 70, y: 180, found: false },
      { x: 310, y: 180, found: false },
      { x: 200, y: 320, found: false },
    ],
    exitY: 100
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiscaryteacherhideseek',
      gameTitle: isKo ? '무서운 선생님 숨바꼭질' : 'Scary Teacher Hide & Seek',
      durationSeconds: 30,
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
        // Move to target
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * 170 * dt;
          s.py += (dy / dist) * 170 * dt;
        }

        // Teacher patrol
        s.teacherX += s.teacherDir * 110 * dt;
        if (s.teacherX < 80 || s.teacherX > canvas.width - 80) s.teacherDir = -s.teacherDir;

        // Check caught
        if (Math.hypot(s.px - s.teacherX, s.py - s.teacherY) < 40) {
          s.px = 200;
          s.py = 500;
          s.targetX = 200;
          s.targetY = 500;
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }

        // Collect keys
        for (const k of s.keys) {
          if (!k.found && Math.hypot(s.px - k.x, s.py - k.y) < 30) {
            k.found = true;
            const count = s.keys.filter(it => it.found).length;
            setKeysFound(count);
            if (playSfx) playSfx('/sfx/coin.mp3');
            if (navigator.vibrate) navigator.vibrate(20);
          }
        }

        // Escape check
        const allKeys = s.keys.every(it => it.found);
        if (allKeys && s.py <= s.exitY + 30) {
          handleVictory();
        }
      }

      // Render Mansion
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Exit Door
      const allKeys = s.keys.every(it => it.found);
      ctx.fillStyle = allKeys ? '#22c55e' : '#64748b';
      ctx.fillRect(canvas.width / 2 - 40, s.exitY - 10, 80, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(allKeys ? 'EXIT OPEN!' : 'LOCKED', canvas.width / 2 - 30, s.exitY + 4);

      // Keys
      for (const k of s.keys) {
        if (!k.found) {
          ctx.fillStyle = '#facc15';
          ctx.font = '18px monospace';
          ctx.fillText('🔑', k.x - 9, k.y + 6);
        }
      }

      // Scary Teacher
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(s.teacherX, s.teacherY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('TEACHER', s.teacherX - 22, s.teacherY - 24);

      // Player Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

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
        gameTitle={isKo ? '무서운 선생님 숨바꼭질' : 'Scary Teacher'}
        currentScore={keysFound}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`🔑 Keys: ${keysFound}/3`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-amber-200 pointer-events-none">
        {isKo ? '선생님을 피해 열쇠 3개를 모두 찾은 후 상단 탈출구로 나가세요!' : 'Avoid teacher, collect 3 keys, and escape through top door!'}
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

export default PokiScaryTeacherHideSeekGame;

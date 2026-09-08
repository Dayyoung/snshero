import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiEscapeSchoolGameProps {
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

export const PokiEscapeSchoolGame: React.FC<PokiEscapeSchoolGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 37;

  const [dist, setDist] = useState(0);
  const [teacherWatch, setTeacherWatch] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 520,
    isHiding: false,
    teacherLooking: false,
    teacherTimer: 2.5,
    doorY: 150
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiescapeschool',
      gameTitle: isKo ? 'Escape From School (학교 탈출)' : 'School Escape',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const stepForward = useCallback(() => {
    const s = gameState.current;
    if (gameWon) return;

    if (s.teacherLooking) {
      // Caught!
      s.py = 520;
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
    } else {
      s.py -= 35;
      setDist(Math.floor(520 - s.py));
      if (s.py <= s.doorY) {
        handleVictory();
      }
    }
  }, [gameWon, handleVictory]);

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
        s.teacherTimer -= dt;
        if (s.teacherTimer <= 0) {
          s.teacherLooking = !s.teacherLooking;
          setTeacherWatch(s.teacherLooking);
          s.teacherTimer = s.teacherLooking ? 1.4 : 2.5 + Math.random() * 1.5;
        }
      }

      // Render Classroom
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Blackboard at top
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(canvas.width / 2 - 120, 80, 240, 50);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.strokeRect(canvas.width / 2 - 120, 80, 240, 50);

      // Exit Door
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(canvas.width / 2 + 100, s.doorY - 20, 35, 50);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('EXIT', canvas.width / 2 + 104, s.doorY + 10);

      // Teacher
      const tx = canvas.width / 2;
      const ty = 150;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(tx, ty, 18, 0, Math.PI * 2);
      ctx.fill();

      if (s.teacherLooking) {
        // Eyes looking at students
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(tx - 6, ty + 4, 4, 0, Math.PI * 2);
        ctx.arc(tx + 6, ty + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(tx - 6, ty + 6, 2, 0, Math.PI * 2);
        ctx.arc(tx + 6, ty + 6, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('👀 WATCHING!', tx - 45, ty - 25);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText('Writing...', tx - 25, ty - 25);
      }

      // Desks
      for (let y = 250; y < 500; y += 70) {
        for (let x = 60; x <= canvas.width - 120; x += 110) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(x, y, 60, 30);
        }
      }

      // Player Student
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Escape From School (학교 탈출)' : 'School Escape'}
        currentScore={dist}
        targetScore={370}
        onBack={handleExit}
        stageInfo={teacherWatch ? (isKo ? '선생님 보는 중! 정지!' : 'FREEZE!') : (isKo ? '전진 가능!' : 'MOVE!')}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Move Step Button */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center z-20">
        <button
          className={`w-full max-w-sm h-20 rounded-2xl border-2 font-bold text-2xl shadow-xl active:scale-95 transition-all ${
            teacherWatch ? 'bg-red-800 border-red-500 text-white' : 'bg-emerald-600 border-emerald-400 text-white animate-pulse'
          }`}
          onClick={stepForward}
        >
          {teacherWatch ? (isKo ? '멈춤 (정지!)' : 'FREEZE!') : (isKo ? '탈출 전진 (STEP)' : 'STEP FORWARD')}
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

export default PokiEscapeSchoolGame;

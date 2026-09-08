import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTest5GameProps {
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

export const PokiBrainTest5Game: React.FC<PokiBrainTest5GameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 104;

  const [score, setScore] = useState(0);
  const targetScore = 3;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    cloudX: 180,
    cloudY: 300,
    sunX: 200,
    sunY: 300,
    bloomed: false
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokibraintest5',
      gameTitle: isKo ? '브레인 테스트 5' : 'Brain Test 5',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initScene = useCallback((w: number, h: number) => {
    gameState.current.sunX = w * 0.35;
    gameState.current.sunY = h * 0.38;
    gameState.current.cloudX = w * 0.35;
    gameState.current.cloudY = h * 0.38;
    gameState.current.bloomed = false;
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
      initScene(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      const s = gameState.current;

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(s.sunX, s.sunY, 40, 0, Math.PI * 2);
      ctx.fill();

      const fx = w / 2;
      const fy = h * 0.68;
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(fx - 4, fy, 8, 60);

      ctx.fillStyle = s.bloomed ? '#ec4899' : '#ca8a04';
      ctx.beginPath();
      ctx.arc(fx, fy, s.bloomed ? 32 : 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(s.cloudX, s.cloudY, 45, 0, Math.PI * 2);
      ctx.arc(s.cloudX + 30, s.cloudY - 12, 38, 0, Math.PI * 2);
      ctx.arc(s.cloudX + 55, s.cloudY, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '먹구름을 마우스/터치 드래그로 치워 햇빛을 꽃에 비춰주세요!' : 'Drag cloud away with mouse/touch to bloom flower!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, initScene, isKo]);

  const handlePointer = (clientX: number, clientY: number) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = clientX - rect.left;
    const ty = clientY - rect.top;

    const s = gameState.current;
    if (Math.hypot(tx - s.cloudX, ty - s.cloudY) < 70) {
      s.cloudX = tx;
      s.cloudY = ty;

      if (Math.hypot(s.cloudX - s.sunX, s.cloudY - s.sunY) > 130 && !s.bloomed) {
        s.bloomed = true;
        if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
        setScore((prev) => {
          const next = prev + 1;
          if (next >= targetScore) handleVictory();
          return next;
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '브레인 테스트 5' : 'Brain Test 5'}
        subtitle="TRICKY RIDDLE BRAIN TEASER"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '구름을 치워 꽃을 피우세요!' : 'Bloom the flower!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
        }}
        onMouseMove={(e) => {
          if (e.buttons > 0) handlePointer(e.clientX, e.clientY);
        }}
        onMouseDown={(e) => handlePointer(e.clientX, e.clientY)}
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

export default PokiBrainTest5Game;

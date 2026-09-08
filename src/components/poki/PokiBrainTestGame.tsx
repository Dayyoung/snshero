import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTestGameProps {
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

export const PokiBrainTestGame: React.FC<PokiBrainTestGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 32;

  const [currentStage, setCurrentStage] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    stage: 1, // 1: Lion size trick, 2: Turn on bulb switch, 3: Feed fish to cat
    bulbOn: false,
    switchY: 480,
    fishPos: { x: 80, y: 480 },
    draggingFish: false
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokibraintest',
      gameTitle: isKo ? 'Brain Test (브레인 테스트)' : 'Brain Test',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const nextStage = useCallback(() => {
    const s = gameState.current;
    if (s.stage < 3) {
      s.stage++;
      setCurrentStage(s.stage);
      if (playSfx) playSfx('/sfx/correct.mp3');
      if (navigator.vibrate) navigator.vibrate([30, 30]);
    } else {
      handleVictory();
    }
  }, [handleVictory, playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const s = gameState.current;
      ctx.fillStyle = s.stage === 2 && !s.bulbOn ? '#020617' : '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;

      if (s.stage === 1) {
        // Question: Which lion is the biggest? (Trick: Elephant is the biggest animal!)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isKo ? '가장 큰 동물을 터치하세요!' : 'Tap the biggest animal!', cx, 160);

        // Lion 1
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx - 90, 300, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('🦁', cx - 90, 305);

        // Lion 2
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx, 280, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText('🦁', cx, 285);

        // Elephant (Trick winner!)
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx + 90, 320, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '24px monospace';
        ctx.fillText('🐘', cx + 90, 328);
      } else if (s.stage === 2) {
        // Light bulb switch
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isKo ? '어두운 방에 불을 켜세요!' : 'Turn on the lights!', cx, 160);

        // Bulb
        ctx.fillStyle = s.bulbOn ? '#facc15' : '#475569';
        ctx.beginPath();
        ctx.arc(cx, 260, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('💡', cx, 266);

        // Light switch
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(cx - 25, 380, 50, 70);
        ctx.fillStyle = s.bulbOn ? '#22c55e' : '#ef4444';
        ctx.fillRect(cx - 15, s.bulbOn ? 390 : 415, 30, 25);
      } else if (s.stage === 3) {
        // Feed fish to cat
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isKo ? '물고기를 고양이에게 끌어다 주세요!' : 'Feed the fish to the cat!', cx, 160);

        // Cat
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(cx + 80, 320, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '24px monospace';
        ctx.fillText('🐱', cx + 80, 328);

        // Fish
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(s.fishPos.x, s.fishPos.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '18px monospace';
        ctx.fillText('🐟', s.fishPos.x, s.fishPos.y + 6);
      }

      ctx.textAlign = 'left';
      drawCardSprite(ctx, effectiveCardId, 30, 80, 44, 44);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = canvas.width / 2;
      const s = gameState.current;

      if (s.stage === 1) {
        // Tap Elephant to win
        if (Math.hypot(mx - (cx + 90), my - 320) < 60) {
          nextStage();
        } else {
          if (navigator.vibrate) navigator.vibrate(80);
        }
      } else if (s.stage === 2) {
        // Tap switch
        if (mx >= cx - 25 && mx <= cx + 25 && my >= 380 && my <= 450) {
          s.bulbOn = true;
          nextStage();
        }
      } else if (s.stage === 3) {
        if (Math.hypot(mx - s.fishPos.x, my - s.fishPos.y) < 35) {
          s.draggingFish = true;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = gameState.current;
      if (s.stage === 3 && s.draggingFish) {
        const rect = canvas.getBoundingClientRect();
        s.fishPos.x = e.clientX - rect.left;
        s.fishPos.y = e.clientY - rect.top;

        const cx = canvas.width / 2;
        if (Math.hypot(s.fishPos.x - (cx + 80), s.fishPos.y - 320) < 50) {
          s.draggingFish = false;
          nextStage();
        }
      }
    };

    const onPointerUp = () => {
      gameState.current.draggingFish = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [effectiveCardId, nextStage]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Brain Test (브레인 테스트)' : 'Brain Test'}
        currentScore={currentStage}
        targetScore={3}
        onBack={handleExit}
        stageInfo={`Quiz ${currentStage}/3`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

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

export default PokiBrainTestGame;

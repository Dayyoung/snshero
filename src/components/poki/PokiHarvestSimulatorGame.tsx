import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHarvestSimulatorGameProps {
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

export const PokiHarvestSimulatorGame: React.FC<PokiHarvestSimulatorGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 92;

  const [score, setScore] = useState(0);
  const targetScore = 20;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    harvesterX: 200,
    harvesterY: 500,
    crops: [] as { x: number; y: number; harvested: boolean; type: string }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiharvestsimulator',
      gameTitle: isKo ? '하베스트 시뮬레이터' : 'Harvest Simulator',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initCrops = useCallback((w: number, h: number) => {
    const crops = [];
    const rows = 8;
    const cols = 6;
    const stepX = (w * 0.8) / cols;
    const stepY = (h * 0.5) / rows;
    const startX = w * 0.1 + stepX / 2;
    const startY = h * 0.25 + stepY / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        crops.push({
          x: startX + c * stepX,
          y: startY + r * stepY,
          harvested: false,
          type: (r + c) % 2 === 0 ? 'wheat' : 'corn'
        });
      }
    }
    gameState.current.crops = crops;
    gameState.current.harvesterX = w / 2;
    gameState.current.harvesterY = h * 0.78;
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
      initCrops(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, w, h);

      // Farm field zone
      ctx.fillStyle = '#292524';
      ctx.fillRect(w * 0.08, h * 0.22, w * 0.84, h * 0.58);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.08, h * 0.22, w * 0.84, h * 0.58);

      // Card Avatar
      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.14, 54, 54);

      // Render Crops
      gameState.current.crops.forEach((crop) => {
        if (!crop.harvested) {
          ctx.fillStyle = crop.type === 'wheat' ? '#eab308' : '#f97316';
          ctx.beginPath();
          ctx.arc(crop.x, crop.y, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
          ctx.fillRect(crop.x - 6, crop.y - 3, 12, 6);
        }
      });

      // Harvester
      const s = gameState.current;
      ctx.save();
      ctx.translate(s.harvesterX, s.harvesterY);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-22, -30, 44, 60);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-26, -34, 52, 12);
      ctx.restore();

      // Guide
      ctx.fillStyle = '#fde047';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '터치 드래그하여 수확기를 몰아 황금빛 밀밭을 수확하세요!' : 'Drag harvester to harvest golden wheat crops!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, initCrops, isKo]);

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const tx = touch.clientX - rect.left;
    const ty = touch.clientY - rect.top;

    gameState.current.harvesterX = tx;
    gameState.current.harvesterY = ty;

    gameState.current.crops.forEach((c) => {
      if (!c.harvested && Math.hypot(tx - c.x, ty - c.y) < 32) {
        c.harvested = true;
        if (navigator.vibrate) navigator.vibrate(15);
        setScore((prev) => {
          const next = prev + 1;
          if (next >= targetScore) handleVictory();
          return next;
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-stone-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '하베스트 시뮬레이터' : 'Harvest Simulator'}
        subtitle="FARM CROPS HARVESTER"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '터치 드래그로 작물을 수확하세요!' : 'Harvest crops!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        onMouseMove={handleTouch as any}
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

export default PokiHarvestSimulatorGame;

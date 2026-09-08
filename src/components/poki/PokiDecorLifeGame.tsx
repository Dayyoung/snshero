import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDecorLifeGameProps {
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

interface FurnitureItem {
  id: number;
  nameKo: string;
  nameEn: string;
  color: string;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  w: number;
  h: number;
  placed: boolean;
  type: 'bed' | 'shelf' | 'lamp' | 'plant' | 'rug';
}

export const PokiDecorLifeGame: React.FC<PokiDecorLifeGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 16;

  const [placedCount, setPlacedCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    items: [
      { id: 1, nameKo: '침대', nameEn: 'Bed', color: '#38bdf8', targetX: 60, targetY: 220, currentX: 50, currentY: 520, w: 90, h: 110, placed: false, type: 'bed' },
      { id: 2, nameKo: '책장', nameEn: 'Shelf', color: '#b45309', targetX: 240, targetY: 150, currentX: 160, currentY: 520, w: 70, h: 90, placed: false, type: 'shelf' },
      { id: 3, nameKo: '스탠드 조명', nameEn: 'Lamp', color: '#facc15', targetX: 280, targetY: 260, currentX: 250, currentY: 520, w: 40, h: 70, placed: false, type: 'lamp' },
      { id: 4, nameKo: '화분', nameEn: 'Plant', color: '#22c55e', targetX: 70, targetY: 150, currentX: 310, currentY: 520, w: 45, h: 50, placed: false, type: 'plant' },
      { id: 5, nameKo: '러그', nameEn: 'Rug', color: '#ec4899', targetX: 160, targetY: 340, currentX: 100, currentY: 600, w: 100, h: 50, placed: false, type: 'rug' },
    ] as FurnitureItem[],
    draggingId: null as number | null,
    dragOffsetX: 0,
    dragOffsetY: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokidecorlife',
      gameTitle: isKo ? 'Decor Life (데코 라이프)' : 'Decor Life',
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

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Room Area
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, 110, canvas.width - 60, 340);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 110, canvas.width - 60, 340);

      // Room Floor Line
      ctx.fillStyle = '#334155';
      ctx.fillRect(30, 310, canvas.width - 60, 140);

      // Silhouette targets
      for (const item of gameState.current.items) {
        if (!item.placed) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.setLineDash([6, 6]);
          ctx.lineWidth = 2;
          ctx.strokeRect(item.targetX, item.targetY, item.w, item.h);
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '10px monospace';
          ctx.fillText(isKo ? item.nameKo : item.nameEn, item.targetX + 5, item.targetY + 20);
        }
      }

      // Bottom Item Tray
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 480, canvas.width, canvas.height - 480);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 480);
      ctx.lineTo(canvas.width, 480);
      ctx.stroke();

      // Items
      for (const item of gameState.current.items) {
        const x = item.placed ? item.targetX : item.currentX;
        const y = item.placed ? item.targetY : item.currentY;

        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(x, y, item.w, item.h, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(isKo ? item.nameKo : item.nameEn, x + 8, y + item.h / 2 + 4);
      }

      // Owner Card Character in Room
      drawCardSprite(ctx, effectiveCardId, canvas.width - 90, 130, 50, 50);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const item of gameState.current.items) {
        if (item.placed) continue;
        if (mx >= item.currentX && mx <= item.currentX + item.w && my >= item.currentY && my <= item.currentY + item.h) {
          gameState.current.draggingId = item.id;
          gameState.current.dragOffsetX = mx - item.currentX;
          gameState.current.dragOffsetY = my - item.currentY;
          if (navigator.vibrate) navigator.vibrate(15);
          break;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!gameState.current.draggingId) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const item = gameState.current.items.find(i => i.id === gameState.current.draggingId);
      if (item) {
        item.currentX = mx - gameState.current.dragOffsetX;
        item.currentY = my - gameState.current.dragOffsetY;
      }
    };

    const onPointerUp = () => {
      if (!gameState.current.draggingId) return;
      const item = gameState.current.items.find(i => i.id === gameState.current.draggingId);
      if (item) {
        // Check snap to target
        const dist = Math.hypot(item.currentX - item.targetX, item.currentY - item.targetY);
        if (dist < 60) {
          item.placed = true;
          item.currentX = item.targetX;
          item.currentY = item.targetY;
          if (playSfx) playSfx('/sfx/snap.mp3');
          if (navigator.vibrate) navigator.vibrate([20, 20]);

          const placed = gameState.current.items.filter(i => i.placed).length;
          setPlacedCount(placed);
          if (placed >= gameState.current.items.length) {
            handleVictory();
          }
        }
      }
      gameState.current.draggingId = null;
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
  }, [effectiveCardId, handleVictory, isKo, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Decor Life (데코 라이프)' : 'Decor Life'}
        currentScore={placedCount}
        targetScore={5}
        onBack={handleExit}
        stageInfo={`${isKo ? '가구 배치' : 'Decor'}: ${placedCount}/5`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-3 inset-x-4 text-center text-xs text-slate-300 pointer-events-none">
        {isKo ? '하단 트레이의 가구를 드래그하여 방 안의 점선 위치에 배치하세요!' : 'Drag furniture from the bottom tray into the dashed spots!'}
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

export default PokiDecorLifeGame;

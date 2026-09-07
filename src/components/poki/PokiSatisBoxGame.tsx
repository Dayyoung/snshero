import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSatisBoxGameProps {
  onBack: () => void;
  cardId?: number;
}

interface SatisItem {
  id: number;
  label: string;
  icon: string;
  x: number;
  y: number;
  slotX: number;
  slotY: number;
  placed: boolean;
}

export const PokiSatisBoxGame: React.FC<PokiSatisBoxGameProps> = ({ onBack, cardId = 55 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState(1);
  const [placedCount, setPlacedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    stage: 1,
    items: [] as SatisItem[],
    draggedItem: null as SatisItem | null,
    dragOffset: { x: 0, y: 0 },
    sparkles: [] as { x: number; y: number; text: string; alpha: number; vy: number }[],
    startTime: Date.now(),
  });

  const initStage = (stgNum: number) => {
    const s = gameStateRef.current;
    s.stage = stgNum;
    setStage(stgNum);
    s.items = [];

    const startY = 160;
    const trayY = window.innerHeight * 0.68;
    const centerX = window.innerWidth / 2;

    if (stgNum === 1) {
      // Pens sorting (5 pens)
      const icons = ['🖊️', '✏️', '🖍️', '✒️', '🖌️'];
      const names = ['펜', '연필', '크레용', '만년필', '붓'];
      for (let i = 0; i < 5; i++) {
        s.items.push({
          id: i,
          icon: icons[i],
          label: names[i],
          slotX: centerX - 120 + i * 60,
          slotY: startY + 60,
          x: centerX - 130 + (i % 3) * 90 + (Math.random() - 0.5) * 20,
          y: trayY + Math.floor(i / 3) * 60,
          placed: false,
        });
      }
    } else if (stgNum === 2) {
      // Bento lunch packing
      const foods = [
        { icon: '🍙', label: '오니기리' },
        { icon: '🍣', label: '연어초밥' },
        { icon: '🥦', label: '브로콜리' },
        { icon: '🍅', label: '방울토마토' },
        { icon: '🥚', label: '계란말이' },
      ];
      for (let i = 0; i < 5; i++) {
        s.items.push({
          id: i,
          icon: foods[i].icon,
          label: foods[i].label,
          slotX: centerX - 110 + (i % 3) * 110,
          slotY: startY + 40 + Math.floor(i / 3) * 80,
          x: centerX - 120 + (i % 3) * 80,
          y: trayY + Math.floor(i / 3) * 60,
          placed: false,
        });
      }
    } else {
      // Desk Organizer
      const tools = [
        { icon: '✂️', label: '가위' },
        { icon: '📏', label: '자' },
        { icon: '📎', label: '클립' },
        { icon: '📌', label: '핀' },
        { icon: '📒', label: '노트' },
      ];
      for (let i = 0; i < 5; i++) {
        s.items.push({
          id: i,
          icon: tools[i].icon,
          label: tools[i].label,
          slotX: centerX - 120 + i * 60,
          slotY: startY + 60,
          x: centerX - 120 + (i % 3) * 80,
          y: trayY + Math.floor(i / 3) * 60,
          placed: false,
        });
      }
    }

    setPlacedCount(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStage(gameStateRef.current.stage);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Warm calming cream background
      ctx.fillStyle = '#fafaf9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const boxW = Math.min(canvas.width - 32, 380);
      const boxX = (canvas.width - boxW) / 2;

      // Top Organizer Container Box
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, 120, boxW, canvas.height * 0.42, 16);
      ctx.fill();
      ctx.stroke();

      // Title & instruction
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        state.stage === 1
          ? '📦 STEP 1: 필통에 필기구를 가지런히 정리하세요'
          : state.stage === 2
          ? '🍱 STEP 2: 도시락 통에 음식을 예쁘게 담으세요'
          : '🗄️ STEP 3: 책상 오거나이저에 도구를 배치하세요',
        canvas.width / 2,
        145
      );

      // Draw Slots (dotted outlines)
      for (const item of state.items) {
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.roundRect(item.slotX - 24, item.slotY - 24, 48, 48, 10);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, item.slotX, item.slotY + 36);
        ctx.restore();
      }

      // Bottom Messy Tray
      ctx.fillStyle = '#f5f5f4';
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, canvas.height * 0.62, boxW, canvas.height * 0.28, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a8a29e';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('정리할 물품 보관함 (위 칸으로 드래그)', canvas.width / 2, canvas.height * 0.62 + 20);

      // Draw Items
      for (const item of state.items) {
        ctx.save();
        const drawX = item.placed ? item.slotX : item.x;
        const drawY = item.placed ? item.slotY : item.y;

        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.icon, drawX, drawY);

        if (item.placed) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('✨', drawX + 16, drawY - 16);
        }
        ctx.restore();
      }

      // Sparkles
      for (let i = state.sparkles.length - 1; i >= 0; i--) {
        const sp = state.sparkles[i];
        sp.y += sp.vy;
        sp.alpha -= 0.03;
        ctx.fillStyle = `rgba(16, 185, 129, ${Math.max(0, sp.alpha)})`;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(sp.text, sp.x, sp.y);
        if (sp.alpha <= 0) state.sparkles.splice(i, 1);
      }

      // Master Card Sprite in bottom left
      drawCardSprite(ctx, cardId, 20, canvas.height - 90, 44, 52);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameOver) return;
    const s = gameStateRef.current;
    for (const it of s.items) {
      if (!it.placed) {
        const dist = Math.hypot(clientX - it.x, clientY - it.y);
        if (dist < 32) {
          s.draggedItem = it;
          s.dragOffset = { x: it.x - clientX, y: it.y - clientY };
          break;
        }
      }
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const s = gameStateRef.current;
    if (s.draggedItem) {
      s.draggedItem.x = clientX + s.dragOffset.x;
      s.draggedItem.y = clientY + s.dragOffset.y;
    }
  };

  const handlePointerUp = () => {
    const s = gameStateRef.current;
    if (s.draggedItem) {
      const it = s.draggedItem;
      const dist = Math.hypot(it.x - it.slotX, it.y - it.slotY);
      if (dist < 45) {
        // Snapped!
        it.placed = true;
        it.x = it.slotX;
        it.y = it.slotY;

        s.sparkles.push({
          x: it.slotX,
          y: it.slotY,
          text: 'PERFECT! ✨',
          alpha: 1,
          vy: -1.5,
        });

        const placed = s.items.filter((i) => i.placed).length;
        setPlacedCount(placed);

        if (placed === s.items.length) {
          // Stage complete
          if (s.stage >= 3) {
            setGameWon(true);
            setGameOver(true);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokisatisbox',
              gameTitle: 'SatisBox Mini Games',
              isVictory: true,
              score: 1000,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
            });
            setRewardResult(reward);
          } else {
            setTimeout(() => {
              initStage(s.stage + 1);
            }, 600);
          }
        }
      }
      s.draggedItem = null;
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fafaf9] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="SatisBox Mini Games"
        score={stage * 333 + placedCount * 20}
        targetScore={1000}
        lives={stage}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointerDown(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointerMove(t.clientX, t.clientY);
        }}
        onTouchEnd={handlePointerUp}
      />

      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none text-xs text-stone-500">
        물건을 알맞은 점선 자리로 드래그하여 완벽하게 정리하세요! (단계 {stage}/3)
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={1000}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          initStage(1);
          gameStateRef.current.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiSatisBoxGame;

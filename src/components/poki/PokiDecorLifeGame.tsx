import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiDecorLifeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface FurnitureSlot {
  id: number;
  name: string;
  emoji: string;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  width: number;
  height: number;
  isPlaced: boolean;
  isUnboxed: boolean;
  charId: number;
}

export const PokiDecorLifeGame: React.FC<PokiDecorLifeGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 16;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [roomStage, setRoomStage] = useState<number>(1);
  const totalRooms = 2;
  const [placedCount, setPlacedCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_decor_life') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    items: [] as FurnitureSlot[],
    selectedIdx: -1,
    dragOffset: { x: 0, y: 0 },
    combo: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
  });

  const initRoom = useCallback((roomNum: number) => {
    const items: FurnitureSlot[] = [];
    if (roomNum === 1) {
      // Cozy Bedroom
      items.push({ id: 1, name: '침대', emoji: '🛏️', targetX: 180, targetY: 200, currentX: 60, currentY: 460, width: 90, height: 70, isPlaced: false, isUnboxed: false, charId: 104 });
      items.push({ id: 2, name: '책상', emoji: '🪑', targetX: 80, targetY: 290, currentX: 150, currentY: 460, width: 60, height: 50, isPlaced: false, isUnboxed: false, charId: 108 });
      items.push({ id: 3, name: '스탠드', emoji: '💡', targetX: 280, targetY: 180, currentX: 230, currentY: 460, width: 40, height: 55, isPlaced: false, isUnboxed: false, charId: 112 });
      items.push({ id: 4, name: '화분', emoji: '🪴', targetX: 280, targetY: 280, currentX: 300, currentY: 460, width: 44, height: 48, isPlaced: false, isUnboxed: false, charId: 116 });
    } else {
      // Modern Living Room
      items.push({ id: 1, name: '소파', emoji: '🛋️', targetX: 180, targetY: 240, currentX: 60, currentY: 460, width: 95, height: 60, isPlaced: false, isUnboxed: false, charId: 105 });
      items.push({ id: 2, name: 'TV장', emoji: '📺', targetX: 180, targetY: 140, currentX: 150, currentY: 460, width: 80, height: 45, isPlaced: false, isUnboxed: false, charId: 109 });
      items.push({ id: 3, name: '벽시계', emoji: '⏰', targetX: 80, targetY: 120, currentX: 230, currentY: 460, width: 40, height: 40, isPlaced: false, isUnboxed: false, charId: 113 });
      items.push({ id: 4, name: '러그', emoji: '🧶', targetX: 180, targetY: 330, currentX: 300, currentY: 460, width: 110, height: 50, isPlaced: false, isUnboxed: false, charId: 117 });
    }

    stateRef.current.items = items;
    setPlacedCount(0);
  }, []);

  useEffect(() => {
    initRoom(roomStage);
  }, [roomStage, initRoom]);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 500 : 100);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_decor_life',
      gameTitle: isKo ? '데코 라이프 인테리어' : 'Decor Life',
      durationSeconds: 50 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && timeLeft > 20,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, isKo, onReward, playSfx]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const items = stateRef.current.items;
      const particles = stateRef.current.particles;

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Cozy room wallpaper & floor
      ctx.fillStyle = '#f8fafc'; // Clean pastel cream wall
      ctx.fillRect(0, 0, width, height * 0.65);

      ctx.fillStyle = '#e2e8f0'; // Hardwood floor
      ctx.fillRect(0, height * 0.65, width, height * 0.35);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(width, height * 0.65);
      ctx.stroke();

      // Draw Silhouette Slots
      for (const it of items) {
        ctx.strokeStyle = it.isPlaced ? '#22c55e' : 'rgba(100, 116, 139, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(it.targetX - it.width / 2, it.targetY - it.height / 2, it.width, it.height);
        ctx.setLineDash([]);

        if (!it.isPlaced) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.fillRect(it.targetX - it.width / 2, it.targetY - it.height / 2, it.width, it.height);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(it.name, it.targetX, it.targetY + 4);
        }
      }

      // Draw Unboxed & Placed Items
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.isUnboxed) {
          // Cardboard Unboxing Box
          ctx.fillStyle = '#b45309';
          ctx.fillRect(it.currentX - 22, it.currentY - 22, 44, 44);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.strokeRect(it.currentX - 22, it.currentY - 22, 44, 44);

          ctx.fillStyle = '#fef3c7';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('📦', it.currentX, it.currentY + 5);
        } else {
          // Placed or floating furniture item
          drawCardSprite(ctx, it.charId, it.currentX - it.width / 2, it.currentY - it.height / 2, it.width, it.height, {
            roundedRadius: 6,
            borderWidth: it.isPlaced ? 2 : 1.5,
            borderColor: it.isPlaced ? '#22c55e' : '#38bdf8',
            shadowBlur: it.isPlaced ? 0 : 8,
            shadowColor: '#38bdf8',
          });

          // Emoji badge
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(it.emoji, it.currentX, it.currentY - it.height / 2 - 4);
        }
      }

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw Player Hero Badge
      drawCardSprite(ctx, playerHeroId, 16, height - 60, 44, 44, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#f59e0b',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, playerHeroId]);

  // Touch Handlers: Tap box to unbox, Drag item to silhouette
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const items = stateRef.current.items;

    // Check tap on boxed item to unbox
    for (const it of items) {
      if (!it.isUnboxed) {
        if (Math.hypot(touchX - it.currentX, touchY - it.currentY) < 30) {
          it.isUnboxed = true;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          return;
        }
      }
    }

    // Check pick unboxed item to drag
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.isUnboxed && !it.isPlaced) {
        if (Math.hypot(touchX - it.currentX, touchY - it.currentY) < 35) {
          stateRef.current.selectedIdx = i;
          stateRef.current.dragOffset = { x: it.currentX - touchX, y: it.currentY - touchY };
          break;
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const selIdx = stateRef.current.selectedIdx;
    if (selIdx < 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const it = stateRef.current.items[selIdx];
    it.currentX = touchX + stateRef.current.dragOffset.x;
    it.currentY = touchY + stateRef.current.dragOffset.y;
  };

  const handlePointerUp = () => {
    const selIdx = stateRef.current.selectedIdx;
    if (selIdx < 0) return;

    const it = stateRef.current.items[selIdx];
    // Check snap to target slot
    if (Math.hypot(it.currentX - it.targetX, it.currentY - it.targetY) < 45) {
      it.currentX = it.targetX;
      it.currentY = it.targetY;
      it.isPlaced = true;
      setScore(s => s + 100);
      stateRef.current.combo++;
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

      // Confetti
      for (let k = 0; k < 8; k++) {
        stateRef.current.particles.push({
          x: it.targetX,
          y: it.targetY,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: '#22c55e',
          alpha: 1,
        });
      }

      const newPlaced = stateRef.current.items.filter(item => item.isPlaced).length;
      setPlacedCount(newPlaced);

      if (newPlaced === stateRef.current.items.length) {
        if (roomStage < totalRooms) {
          setRoomStage(r => r + 1);
          setScore(s => s + 200);
        } else {
          handleGameOver(true);
        }
      }
    }

    stateRef.current.selectedIdx = -1;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'CONTROLS',
      title: isKo ? '데코 라이프 (인테리어 퍼즐)' : 'Decor Life',
      description: isKo
        ? '하단의 택배 상자(📦)를 탭하여 언박싱하고, 나온 가구를 방의 점선 슬롯으로 드래그하여 배치하세요!'
        : 'Tap the boxes to unbox furniture, and drag each piece onto its matching room slot!',
      keyPoints: isKo ? ['택배 상자 탭 언박싱', '가구 드래그 & 드롭', '슬롯 맞춤 배치'] : ['Tap box to unbox', 'Drag & drop furniture', 'Fit into outline slots'],
    },
    {
      badge: 'GOAL',
      title: isKo ? '완벽한 방 꾸미기' : 'Complete Room Makeovers',
      description: isKo
        ? '모든 가구를 알맞은 위치에 배치하여 2개의 멋진 방을 완성하고 승리하세요.'
        : 'Place all items correctly to complete both rooms and claim victory!',
      keyPoints: isKo ? ['방 인테리어 완성', '두 개 스테이지 클리어', 'SNS 포인트 수령'] : ['Complete interior design', 'Finish 2 stages', 'Claim SNS rewards'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.16 데코 라이프' : 'No.16 Decor Life'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`ROOM ${roomStage}/${totalRooms} | 배치: ${placedCount}/4`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Action Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-amber-300 font-bold tracking-wider animate-pulse">
            {isKo ? '📦 상자 탭: 언박싱 | 👆 가구 드래그: 슬롯 배치' : '📦 TAP BOX: UNBOX | 👆 DRAG FURNITURE'}
          </p>
        </div>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isGameOver}
          isVictory={isVictory}
          score={score}
          receipt={settlementReceipt}
          onConfirm={onExit}
          onRestart={() => {
            setIsGameOver(false);
            setIsVictory(false);
            setSettlementReceipt(null);
            setScore(0);
            setRoomStage(1);
            setTimeLeft(50);
            initRoom(1);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.16 데코 라이프' : 'No.16 Decor Life'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_decor_life', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default PokiDecorLifeGame;

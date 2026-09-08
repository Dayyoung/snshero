import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCapitalistBusDriverGameProps {
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

export const PokiCapitalistBusDriverGame: React.FC<PokiCapitalistBusDriverGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 96;

  const [score, setScore] = useState(0);
  const targetScore = 15;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    lane: 1,
    busX: 200,
    busY: 520,
    passengers: [] as { x: number; y: number; collected: boolean; isPassenger: boolean }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicapitalistbusdriver',
      gameTitle: isKo ? '캐피털리스트 버스 드라이버' : 'Capitalist Bus Driver',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initSpawns = useCallback((w: number, h: number) => {
    const spawns = [];
    const laneW = w / 3;
    for (let i = 0; i < 6; i++) {
      const l = Math.floor(Math.random() * 3);
      spawns.push({
        x: l * laneW + laneW / 2,
        y: -i * 180 - 100,
        collected: false,
        isPassenger: Math.random() > 0.3
      });
    }
    gameState.current.passengers = spawns;
    gameState.current.busX = w / 2;
    gameState.current.busY = h * 0.75;
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
      initSpawns(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Keyboard support: ArrowLeft / ArrowRight / A / D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameState.current.lane = Math.max(0, gameState.current.lane - 1);
        if (navigator.vibrate) navigator.vibrate(20);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameState.current.lane = Math.min(2, gameState.current.lane + 1);
        if (navigator.vibrate) navigator.vibrate(20);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      const laneW = w / 3;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, h * 0.15, w, h * 0.72);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.setLineDash([16, 16]);
      ctx.beginPath();
      ctx.moveTo(laneW, h * 0.15);
      ctx.lineTo(laneW, h * 0.87);
      ctx.moveTo(laneW * 2, h * 0.15);
      ctx.lineTo(laneW * 2, h * 0.87);
      ctx.stroke();
      ctx.setLineDash([]);

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.1, 50, 50);

      const s = gameState.current;
      const targetX = s.lane * laneW + laneW / 2;
      s.busX += (targetX - s.busX) * 0.2;

      s.passengers.forEach((p) => {
        p.y += 4;
        if (!p.collected) {
          if (p.isPassenger) {
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👤', p.x, p.y + 5);
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(p.x - 14, p.y - 14, 28, 28);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️', p.x, p.y + 4);
          }

          if (Math.hypot(p.x - s.busX, p.y - s.busY) < 38) {
            p.collected = true;
            if (p.isPassenger) {
              if (navigator.vibrate) navigator.vibrate(20);
              setScore((prev) => {
                const next = prev + 1;
                if (next >= targetScore) handleVictory();
                return next;
              });
            }
          }
        }

        if (p.y > h * 0.88) {
          p.y = -80;
          p.collected = false;
          const l = Math.floor(Math.random() * 3);
          p.x = l * laneW + laneW / 2;
        }
      });

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(s.busX - 24, s.busY - 42, 48, 84);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(s.busX - 18, s.busY - 34, 36, 20);

      ctx.fillStyle = '#fde047';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스 클릭 / 방향키 / 터치: 차선 변경해 승객 탑승!' : 'Click, Arrow keys, or Touch to change lanes!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveCardId, handleVictory, initSpawns, isKo]);

  const handlePointer = (clientX: number) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = clientX - rect.left;
    const laneW = rect.width / 3;

    if (tx < laneW) gameState.current.lane = 0;
    else if (tx < laneW * 2) gameState.current.lane = 1;
    else gameState.current.lane = 2;

    if (navigator.vibrate) navigator.vibrate(25);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '캐피털리스트 버스 드라이버' : 'Capitalist Bus Driver'}
        subtitle="CITY BUS PASSENGER TYCOON"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '차선을 클릭/터치해 승객을 태우세요!' : 'Pick up passengers!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-pointer"
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX);
        }}
        onMouseDown={(e) => handlePointer(e.clientX)}
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

export default PokiCapitalistBusDriverGame;

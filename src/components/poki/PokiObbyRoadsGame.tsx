import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiObbyRoadsGameProps {
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

export const PokiObbyRoadsGame: React.FC<PokiObbyRoadsGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 110;

  const [score, setScore] = useState(0);
  const targetScore = 15;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    lane: 1,
    playerY: 520,
    obstacles: [] as { lane: number; y: number; cleared: boolean }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiobbyroads',
      gameTitle: isKo ? '오비 로드' : 'Obby Roads',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initObstacles = useCallback(() => {
    const obs = [];
    for (let i = 0; i < 6; i++) {
      obs.push({
        lane: Math.floor(Math.random() * 3),
        y: -i * 160 - 100,
        cleared: false
      });
    }
    gameState.current.obstacles = obs;
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
      gameState.current.playerY = canvas.height * 0.75;
      initObstacles();
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

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      const s = gameState.current;
      const laneW = w / 3;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, h * 0.18, w, h * 0.68);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.setLineDash([16, 16]);
      ctx.beginPath();
      ctx.moveTo(laneW, h * 0.18);
      ctx.lineTo(laneW, h * 0.86);
      ctx.moveTo(laneW * 2, h * 0.18);
      ctx.lineTo(laneW * 2, h * 0.86);
      ctx.stroke();
      ctx.setLineDash([]);

      s.obstacles.forEach((ob) => {
        ob.y += 4;
        const ox = ob.lane * laneW + laneW / 2;

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ox - 24, ob.y - 12, 48, 24);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox - 24, ob.y - 12, 48, 24);

        if (!ob.cleared && ob.y > s.playerY) {
          ob.cleared = true;
          if (navigator.vibrate) navigator.vibrate(15);
          setScore((prev) => {
            const next = prev + 1;
            if (next >= targetScore) handleVictory();
            return next;
          });
        }

        if (ob.y > h * 0.88) {
          ob.y = -80;
          ob.lane = Math.floor(Math.random() * 3);
          ob.cleared = false;
        }
      });

      const px = s.lane * laneW + laneW / 2;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(px, s.playerY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#86efac';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스 클릭 / 방향키 / 터치로 장애물을 피하세요!' : 'Click, Arrow keys, or Touch to dodge obstacles!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveCardId, handleVictory, initObstacles, isKo]);

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
        title={isKo ? '오비 로드' : 'Obby Roads'}
        subtitle="OBBY ROAD DODGE RUNNER"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '차선을 클릭/터치해 장애물을 피하세요!' : 'Dodge obstacles!'}
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

export default PokiObbyRoadsGame;

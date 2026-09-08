import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHexellentGameProps {
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

export const PokiHexellentGame: React.FC<PokiHexellentGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 91;

  const [score, setScore] = useState(0);
  const targetScore = 5;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    tiles: [] as { x: number; y: number; r: number; rot: number; targetRot: number; active: boolean }[],
    solvedCount: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokihexellent',
      gameTitle: isKo ? '헥셀런트' : 'Hexellent',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initTiles = useCallback((w: number, h: number) => {
    const tiles = [];
    const size = Math.min(w, h) * 0.14;
    const cx = w / 2;
    const cy = h * 0.52;
    // Hex ring of 7 tiles (center + 6 neighbors)
    tiles.push({ x: cx, y: cy, r: size, rot: Math.floor(Math.random() * 6), targetRot: 0, active: false });
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      const dist = size * 1.75;
      tiles.push({
        x: cx + Math.cos(ang) * dist,
        y: cy + Math.sin(ang) * dist,
        r: size,
        rot: Math.floor(Math.random() * 6) + 1,
        targetRot: 0,
        active: false
      });
    }
    gameState.current.tiles = tiles;
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
      initTiles(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Card Avatar
      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.18, 54, 54);

      // Render Hex Tiles
      gameState.current.tiles.forEach((t) => {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate((t.rot * Math.PI) / 3);

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const rad = (i * Math.PI) / 3;
          const px = t.r * Math.cos(rad);
          const py = t.r * Math.sin(rad);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = t.rot % 6 === 0 ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.strokeStyle = t.rot % 6 === 0 ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Hex lines
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(t.r * 0.85, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(-t.r * 0.42, t.r * 0.73);
        ctx.strokeStyle = t.rot % 6 === 0 ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();
      });

      // Guide
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '육각형 타일을 터치해 회전하여 네온 라인을 연결하세요!' : 'Tap hex tiles to rotate and align neon lines!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, initTiles, isKo]);

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const tx = touch.clientX - rect.left;
    const ty = touch.clientY - rect.top;

    gameState.current.tiles.forEach((t) => {
      if (Math.hypot(tx - t.x, ty - t.y) < t.r) {
        t.rot = (t.rot + 1) % 6;
        if (navigator.vibrate) navigator.vibrate(30);

        // Check align
        const allAligned = gameState.current.tiles.every((tile) => tile.rot % 6 === 0);
        if (allAligned || t.rot % 6 === 0) {
          setScore((prev) => {
            const next = prev + 1;
            if (next >= targetScore) handleVictory();
            return next;
          });
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '헥셀런트' : 'Hexellent'}
        subtitle="HEXAGON ROTATE PUZZLE"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '육각형 타일을 터치해 회전시켜 연결하세요!' : 'Tap tiles to rotate!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onTouchStart={handleTouch}
        onMouseDown={handleTouch as any}
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

export default PokiHexellentGame;

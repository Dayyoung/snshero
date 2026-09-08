import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiYouMonsterGameProps {
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

interface Building {
  x: number;
  w: number;
  h: number;
  destroyed: boolean;
}

export const PokiYouMonsterGame: React.FC<PokiYouMonsterGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 54;

  const [destroyedCount, setDestroyedCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 80,
    py: 450,
    vx: 120,
    buildings: [
      { x: 120, w: 50, h: 120, destroyed: false },
      { x: 190, w: 60, h: 160, destroyed: false },
      { x: 270, w: 50, h: 100, destroyed: false },
      { x: 340, w: 60, h: 140, destroyed: false },
    ] as Building[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiyoumonster',
      gameTitle: isKo ? '유 몬스터! 괴수 대격돌' : 'You Monster!',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const smash = useCallback(() => {
    const s = gameState.current;
    let hit = false;
    for (const b of s.buildings) {
      if (!b.destroyed && Math.abs(s.px - (b.x + b.w / 2)) < 55) {
        b.destroyed = true;
        hit = true;
        const count = s.buildings.filter(it => it.destroyed).length;
        setDestroyedCount(count);
        if (playSfx) playSfx('/sfx/smash.mp3');
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

        if (count >= s.buildings.length) {
          handleVictory();
        }
      }
    }
  }, [handleVictory, playSfx]);

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
        s.px += s.vx * dt;
        if (s.px < 50 || s.px > canvas.width - 50) s.vx = -s.vx;
      }

      // Render City Night
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const groundY = 480;

      // Ground
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      // Buildings
      for (const b of s.buildings) {
        if (b.destroyed) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(b.x, groundY - 20, b.w, 20);
        } else {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, groundY - b.h, b.w, b.h);

          // Windows
          ctx.fillStyle = '#fef08a';
          for (let wy = groundY - b.h + 15; wy < groundY - 15; wy += 25) {
            for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 16) {
              ctx.fillRect(wx, wy, 8, 12);
            }
          }
        }
      }

      // Giant Kaiju Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 35, groundY - 70, 70, 70);

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
        gameTitle={isKo ? '유 몬스터! 괴수 대격돌' : 'You Monster!'}
        currentScore={destroyedCount}
        targetScore={4}
        onBack={handleExit}
        stageInfo={`🏢 Smashed: ${destroyedCount}/4`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Smash Action Button */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center z-20">
        <button
          className="w-full max-w-sm h-20 bg-amber-600 active:bg-amber-500 border-2 border-amber-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform"
          onClick={smash}
        >
          {isKo ? '괴수 펀치 스매시! 💥' : 'KAIJU SMASH! 💥'}
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

export default PokiYouMonsterGame;

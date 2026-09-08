import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiMergeGameProps {
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

export const PokiBlumgiMergeGame: React.FC<PokiBlumgiMergeGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 105;

  const [score, setScore] = useState(0);
  const targetScore = 5;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    grid: [1, 1, 2, 2, 1, 3, 0, 1, 2],
    selectedIdx: -1
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiblumgimerge',
      gameTitle: isKo ? '블룸기 머지' : 'Blumgi Merge',
      durationSeconds: 15,
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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
      const size = 80;
      const gap = 12;
      const startX = (w - (size * 3 + gap * 2)) / 2;
      const startY = h * 0.35;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = r * 3 + c;
          const cx = startX + c * (size + gap);
          const cy = startY + r * (size + gap);

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(cx, cy, size, size);
          ctx.strokeStyle = s.selectedIdx === idx ? '#fbbf24' : '#334155';
          ctx.lineWidth = s.selectedIdx === idx ? 3 : 1;
          ctx.strokeRect(cx, cy, size, size);

          const tier = s.grid[idx];
          if (tier > 0) {
            const colors = ['', '#38bdf8', '#ec4899', '#facc15', '#4ade80'];
            ctx.fillStyle = colors[tier % colors.length];
            ctx.beginPath();
            ctx.arc(cx + size / 2, cy + size / 2, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Lv.' + tier, cx + size / 2, cy + size / 2 + 6);
          }
        }
      }

      ctx.fillStyle = '#fde047';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '같은 레벨의 블룸기를 마우스 클릭 / 터치로 합체시키세요!' : 'Click or tap matching level blumgis to merge them!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, isKo]);

  const handlePointer = (clientX: number, clientY: number) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = clientX - rect.left;
    const ty = clientY - rect.top;

    const s = gameState.current;
    const size = 80;
    const gap = 12;
    const startX = (rect.width - (size * 3 + gap * 2)) / 2;
    const startY = rect.height * 0.35;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const cx = startX + c * (size + gap);
        const cy = startY + r * (size + gap);

        if (tx >= cx && tx <= cx + size && ty >= cy && ty <= cy + size) {
          if (s.selectedIdx === -1) {
            if (s.grid[idx] > 0) s.selectedIdx = idx;
          } else {
            if (s.selectedIdx !== idx && s.grid[s.selectedIdx] === s.grid[idx] && s.grid[idx] > 0) {
              s.grid[idx] += 1;
              s.grid[s.selectedIdx] = 0;
              if (navigator.vibrate) navigator.vibrate(35);
              setScore((prev) => {
                const next = prev + 1;
                if (next >= targetScore) handleVictory();
                return next;
              });
            }
            s.selectedIdx = -1;
          }
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '블룸기 머지' : 'Blumgi Merge'}
        subtitle="CUTE MONSTER MERGE"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '같은 블룸기를 클릭/터치해 합체하세요!' : 'Merge blumgis!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-pointer"
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
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

export default PokiBlumgiMergeGame;

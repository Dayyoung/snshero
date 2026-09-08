import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiElevenElevenGameProps {
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

export const PokiElevenElevenGame: React.FC<PokiElevenElevenGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 108;

  const [score, setScore] = useState(0);
  const targetScore = 15;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    board: Array(36).fill(false)
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokieleveneleven',
      gameTitle: isKo ? '11-11' : '11-11',
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
      const size = Math.min(w * 0.13, 44);
      const startX = (w - size * 6) / 2;
      const startY = h * 0.32;

      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          const idx = r * 6 + c;
          const cx = startX + c * size;
          const cy = startY + r * size;

          ctx.fillStyle = s.board[idx] ? '#38bdf8' : '#1e293b';
          ctx.fillRect(cx + 2, cy + 2, size - 4, size - 4);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 2, cy + 2, size - 4, size - 4);
        }
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '그리드 타일을 마우스 클릭 / 터치로 채워 라인을 클리어하세요!' : 'Click or tap grid tiles to fill and clear lines!', w / 2, h * 0.88);

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

    const size = Math.min(rect.width * 0.13, 44);
    const startX = (rect.width - size * 6) / 2;
    const startY = rect.height * 0.32;

    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const idx = r * 6 + c;
        const cx = startX + c * size;
        const cy = startY + r * size;

        if (tx >= cx && tx <= cx + size && ty >= cy && ty <= cy + size) {
          if (!gameState.current.board[idx]) {
            gameState.current.board[idx] = true;
            if (navigator.vibrate) navigator.vibrate(20);
            setScore((prev) => {
              const next = prev + 1;
              if (next >= targetScore) handleVictory();
              return next;
            });
          }
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '11-11' : '11-11'}
        subtitle="GRID BLOCK PUZZLE"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '타일을 클릭/터치해 채우세요!' : 'Fill tiles!'}
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

export default PokiElevenElevenGame;

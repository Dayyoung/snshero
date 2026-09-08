import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlockyBlastGameProps {
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

export const PokiBlockyBlastGame: React.FC<PokiBlockyBlastGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 9;

  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    grid: Array.from({ length: 8 }, () => Array(8).fill(false)),
    score: 0,
    lines: 0,
    won: false,
    startTime: Date.now()
  });

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tx = clientX - rect.left;
    const ty = clientY - rect.top;
    const gs = gameStateRef.current;

    const size = Math.min(canvas.width * 0.85, canvas.height * 0.55);
    const startX = (canvas.width - size) / 2;
    const startY = canvas.height * 0.28;
    const cellSize = size / 8;

    const col = Math.floor((tx - startX) / cellSize);
    const row = Math.floor((ty - startY) / cellSize);

    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      if (!gs.grid[row][col]) {
        gs.grid[row][col] = true;
        gs.score += 20;
        triggerHaptic(15);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

        // Check line clears
        let cleared = 0;
        // Rows
        for (let r = 0; r < 8; r++) {
          if (gs.grid[r].every(c => c)) {
            gs.grid[r] = Array(8).fill(false);
            cleared++;
          }
        }
        // Cols
        for (let c = 0; c < 8; c++) {
          let fullCol = true;
          for (let r = 0; r < 8; r++) { if (!gs.grid[r][c]) fullCol = false; }
          if (fullCol) {
            for (let r = 0; r < 8; r++) gs.grid[r][c] = false;
            cleared++;
          }
        }

        if (cleared > 0) {
          gs.lines += cleared;
          gs.score += cleared * 150;
          setLinesCleared(gs.lines);
          triggerHaptic(40);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        }

        setScore(gs.score);

        if (gs.score >= 800 && !gs.won) {
          gs.won = true;
          triggerHaptic(60);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          const elapsedSec = Math.max(5, Math.floor((Date.now() - gs.startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki_blockyblast',
            gameTitle: isKo ? '블로키 블래스트' : 'Blocky Blast',
            durationSeconds: elapsedSec,
            score: gs.score,
            maxTargetScore: 800,
            isVictory: true
          });
          setRewardReceipt(receipt);
          setGameWon(true);
          onReward?.(receipt.totalSns);
        }
      }
    }
  };

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

    const loop = () => {
      const gs = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);

      // Hero avatar
      const pSize = 54;
      drawCardSprite(ctx, effectiveCardId, w / 2 - pSize / 2, h * 0.15, pSize, pSize, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#a855f7',
        shadowBlur: 10,
        shadowColor: '#a855f7'
      });

      // 8x8 Grid
      const size = Math.min(w * 0.85, h * 0.55);
      const startX = (w - size) / 2;
      const startY = h * 0.28;
      const cellSize = size / 8;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(startX - 6, startY - 6, size + 12, size + 12);

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;
          ctx.fillStyle = gs.grid[r][c] ? '#f59e0b' : '#0f172a';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          if (gs.grid[r][c]) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          }
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '빈 칸을 탭하여 블록 배치 | 가로/세로 한 줄 완성 시 블래스트!' : 'Tap cells to place blocks | Clear rows to blast!', w / 2, h - 35);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, isKo]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) handlePointerDown(t.clientX, t.clientY);
      }}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-pointer" />

      <MinimalistMissionHUD
        title={isKo ? '블로키 블래스트' : 'Blocky Blast'}
        score={score}
        targetScore={800}
        stageInfo={`LINES: ${linesCleared}`}
        onExit={handleExit}
        unit="pt"
      />

      {gameWon && (
        <VictoryRewardModal
          isOpen={gameWon}
          rewardReceipt={rewardReceipt}
          onClose={handleExit}
          onClaimBonus={handleExit}
          language={isKo ? 'ko' : 'en'}
        />
      )}
    </div>
  );
};

export default PokiBlockyBlastGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPhoneCaseDIYGameProps {
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

export const PokiPhoneCaseDIYGame: React.FC<PokiPhoneCaseDIYGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 94;

  const [score, setScore] = useState(0);
  const targetScore = 20;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    drops: [] as { x: number; y: number; r: number; color: string }[],
    stickers: [] as { x: number; y: number; emoji: string }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiphonecasediy',
      gameTitle: isKo ? '폰 케이스 DIY' : 'Phone Case DIY',
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

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.14, 54, 54);

      const pw = Math.min(w * 0.65, 240);
      const ph = pw * 1.85;
      const px = (w - pw) / 2;
      const py = (h - ph) / 2 + 20;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 28);
      ctx.fill();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(px + 16, py + 16, 50, 50, 12);
      ctx.fill();

      gameState.current.drops.forEach((d) => {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      gameState.current.stickers.forEach((st) => {
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(st.emoji, st.x, st.y);
      });

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스/터치 드래그로 스프레이 분사 & 클릭하여 스티커 부착!' : 'Drag mouse/touch to spray color & click to stick stickers!', w / 2, h * 0.88);

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

    const colors = ['#ec4899', '#38bdf8', '#a855f7', '#facc15', '#4ade80'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    gameState.current.drops.push({ x: tx, y: ty, r: Math.random() * 8 + 6, color: col });

    if (Math.random() > 0.8) {
      const emojis = ['💖', '⭐', '⚡', '👑', '🌈'];
      gameState.current.stickers.push({ x: tx, y: ty, emoji: emojis[Math.floor(Math.random() * emojis.length)] });
    }

    if (navigator.vibrate) navigator.vibrate(15);
    setScore((prev) => {
      const next = prev + 1;
      if (next >= targetScore) handleVictory();
      return next;
    });
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '폰 케이스 DIY' : 'Phone Case DIY'}
        subtitle="CREATIVE PHONE DECORATION"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '마우스 클릭/드래그로 꾸미세요!' : 'Decorate your phone case!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
        }}
        onMouseMove={(e) => {
          if (e.buttons > 0) handlePointer(e.clientX, e.clientY);
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

export default PokiPhoneCaseDIYGame;

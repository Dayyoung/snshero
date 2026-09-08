import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBubbleStormGameProps {
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

interface Bubble {
  x: number;
  y: number;
  color: string;
  popped: boolean;
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];

export const PokiBubbleStormGame: React.FC<PokiBubbleStormGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 45;

  const [poppedCount, setPoppedCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    bubbles: [] as Bubble[],
    cannonAngle: -Math.PI / 2,
    bullet: null as { x: number; y: number; vx: number; vy: number; color: string } | null,
    nextColor: COLORS[0],
    poppedTotal: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokibubblestorm',
      gameTitle: isKo ? '버블 스톰' : 'Bubble Storm',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const shootBubble = useCallback(() => {
    const s = gameState.current;
    if (s.bullet) return;

    const angle = s.cannonAngle;
    const speed = 600;
    s.bullet = {
      x: 200,
      y: 520,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: s.nextColor
    };
    s.nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    if (playSfx) playSfx('/sfx/pop.mp3');
    if (navigator.vibrate) navigator.vibrate(20);
  }, [playSfx]);

  useEffect(() => {
    // Generate bubble grid
    const bList: Bubble[] = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 7; c++) {
        bList.push({
          x: 45 + c * 48,
          y: 120 + r * 44,
          color: COLORS[(r + c) % COLORS.length],
          popped: false
        });
      }
    }
    gameState.current.bubbles = bList;

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
        if (s.bullet) {
          s.bullet.x += s.bullet.vx * dt;
          s.bullet.y += s.bullet.vy * dt;

          // Wall bounce
          if (s.bullet.x < 20 || s.bullet.x > canvas.width - 20) {
            s.bullet.vx = -s.bullet.vx;
          }

          // Check hit with bubbles
          for (const b of s.bubbles) {
            if (!b.popped && Math.hypot(s.bullet.x - b.x, s.bullet.y - b.y) < 32) {
              // Pop matching or nearby
              b.popped = true;
              s.poppedTotal += 3;
              setPoppedCount(s.poppedTotal);
              s.bullet = null;
              if (navigator.vibrate) navigator.vibrate(30);

              if (s.poppedTotal >= 15) {
                handleVictory();
              }
              break;
            }
          }

          if (s.bullet && s.bullet.y < 80) {
            s.bullet = null;
          }
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bubbles
      for (const b of s.bubbles) {
        if (!b.popped) {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Cannon
      const cx = canvas.width / 2;
      ctx.save();
      ctx.translate(cx, 540);
      ctx.rotate(s.cannonAngle);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, -8, 40, 16);
      ctx.restore();

      // Next Bubble loaded
      ctx.fillStyle = s.nextColor;
      ctx.beginPath();
      ctx.arc(cx, 540, 16, 0, Math.PI * 2);
      ctx.fill();

      // Bullet
      if (s.bullet) {
        ctx.fillStyle = s.bullet.color;
        ctx.beginPath();
        ctx.arc(s.bullet.x, s.bullet.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Player Card Sprite
      drawCardSprite(ctx, effectiveCardId, cx - 60, 510, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = canvas.width / 2;
      gameState.current.cannonAngle = Math.atan2(my - 540, mx - cx);
    };

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      onPointer(e);
      shootBubble();
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointer);
    };
  }, [effectiveCardId, gameWon, handleVictory, shootBubble]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '버블 스톰' : 'Bubble Storm'}
        currentScore={poppedCount}
        targetScore={15}
        onBack={handleExit}
        stageInfo={`🫧 Popped: ${poppedCount}/15`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-cyan-200 pointer-events-none">
        {isKo ? '화면을 조준 탭하여 버블을 발사하고 버블 스톰을 터뜨리세요!' : 'Aim and tap to launch bubbles and clear the storm!'}
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

export default PokiBubbleStormGame;

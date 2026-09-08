import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiKarateFighterGameProps {
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

interface Foe {
  x: number;
  side: 'left' | 'right';
  hp: number;
}

export const PokiKarateFighterGame: React.FC<PokiKarateFighterGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 52;

  const [kills, setKills] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    foes: [] as Foe[],
    totalKills: 0,
    actionAnim: 0,
    actionType: '' as 'punch' | 'kick' | ''
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokikaratefighter',
      gameTitle: isKo ? '가라데 파이터' : 'Karate Fighter',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const attack = useCallback((side: 'left' | 'right', type: 'punch' | 'kick') => {
    const s = gameState.current;
    s.actionAnim = 0.2;
    s.actionType = type;

    // Check hit
    for (let i = s.foes.length - 1; i >= 0; i--) {
      const f = s.foes[i];
      if (f.side === side && Math.abs(f.x - 200) < 90) {
        s.foes.splice(i, 1);
        s.totalKills++;
        setKills(s.totalKills);
        if (playSfx) playSfx('/sfx/hit.mp3');
        if (navigator.vibrate) navigator.vibrate(25);
        if (s.totalKills >= 15) {
          handleVictory();
        }
        break;
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
        if (s.actionAnim > 0) s.actionAnim -= dt;

        // Spawn foes
        if (s.foes.length < 4 && Math.random() < 0.04) {
          const side = Math.random() > 0.5 ? 'left' : 'right';
          s.foes.push({
            x: side === 'left' ? -20 : canvas.width + 20,
            side,
            hp: 1
          });
        }

        // Move foes to center
        const cx = canvas.width / 2;
        for (const f of s.foes) {
          if (f.x < cx) f.x += 120 * dt;
          else f.x -= 120 * dt;
        }
      }

      // Render Dojo
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = 450;

      // Floor tatami
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, cy + 20, canvas.width, canvas.height - cy);

      // Foes
      for (const f of s.foes) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(f.x, cy - 20, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(f.x - 10, cy - 4, 20, 24);
      }

      // Karateka Player Card Sprite
      drawCardSprite(ctx, effectiveCardId, cx - 25, cy - 30, 50, 50);

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
        gameTitle={isKo ? '가라데 파이터' : 'Karate Fighter'}
        currentScore={kills}
        targetScore={15}
        onBack={handleExit}
        stageInfo={`🥋 K.O: ${kills}/15`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 2 Big Attack Buttons */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between gap-6 z-20">
        <button
          className="flex-1 h-20 bg-blue-600 active:bg-blue-500 border-2 border-blue-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95"
          onClick={() => attack('left', 'punch')}
        >
          ◀ PUNCH
        </button>
        <button
          className="flex-1 h-20 bg-red-600 active:bg-red-500 border-2 border-red-400 text-white font-bold text-2xl rounded-2xl shadow-xl active:scale-95"
          onClick={() => attack('right', 'kick')}
        >
          KICK ▶
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

export default PokiKarateFighterGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPartyTimeGameProps {
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

interface Note {
  lane: number;
  y: number;
  hit: boolean;
}

export const PokiPartyTimeGame: React.FC<PokiPartyTimeGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 39;

  const [combo, setCombo] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    notes: [] as Note[],
    comboCount: 0,
    speed: 260,
    spawnTimer: 0,
    hitLineY: 480
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokipartytime',
      gameTitle: isKo ? 'Party Time (파티 타임)' : 'Party Time',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const tapLane = useCallback((l: number) => {
    const s = gameState.current;
    let hitAny = false;
    for (const n of s.notes) {
      if (!n.hit && n.lane === l && Math.abs(n.y - s.hitLineY) < 50) {
        n.hit = true;
        hitAny = true;
        s.comboCount++;
        setCombo(s.comboCount);
        if (playSfx) playSfx('/sfx/beat.mp3');
        if (navigator.vibrate) navigator.vibrate(20);
        if (s.comboCount >= 18) {
          handleVictory();
        }
        break;
      }
    }
    if (!hitAny) {
      s.comboCount = 0;
      setCombo(0);
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
        // Spawn notes
        s.spawnTimer += dt;
        if (s.spawnTimer > 0.6) {
          s.spawnTimer = 0;
          s.notes.push({ lane: Math.floor(Math.random() * 4), y: -30, hit: false });
        }

        // Update notes
        for (let i = s.notes.length - 1; i >= 0; i--) {
          const n = s.notes[i];
          n.y += s.speed * dt;

          if (!n.hit && n.y > s.hitLineY + 60) {
            s.comboCount = 0;
            setCombo(0);
            s.notes.splice(i, 1);
          } else if (n.hit) {
            s.notes.splice(i, 1);
          }
        }
      }

      // Render Disco Floor
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const laneW = canvas.width / 4;

      // Lane dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneW, 0);
        ctx.lineTo(i * laneW, canvas.height);
        ctx.stroke();
      }

      // Hit Line
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, s.hitLineY);
      ctx.lineTo(canvas.width, s.hitLineY);
      ctx.stroke();

      // Notes
      const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
      for (const n of s.notes) {
        ctx.fillStyle = colors[n.lane];
        ctx.beginPath();
        ctx.arc(n.lane * laneW + laneW / 2, n.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Dancer Card Character
      drawCardSprite(ctx, effectiveCardId, canvas.width / 2 - 25, 120, 50, 50);

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
        gameTitle={isKo ? 'Party Time (파티 타임)' : 'Party Time'}
        currentScore={combo}
        targetScore={18}
        onBack={handleExit}
        stageInfo={`🎵 Combo: ${combo}/18`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 4 Rhythm Touch Pads */}
      <div className="absolute bottom-6 inset-x-2 flex gap-2 z-20">
        {['🔴', '🔵', '🟢', '🟡'].map((icon, idx) => (
          <button
            key={idx}
            className="flex-1 h-24 bg-slate-900/80 active:bg-slate-700 border-2 border-slate-600 rounded-2xl text-2xl flex items-center justify-center active:scale-95 transition-transform backdrop-blur-md"
            onClick={() => tapLane(idx)}
          >
            {icon}
          </button>
        ))}
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

export default PokiPartyTimeGame;

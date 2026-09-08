import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanBattleGameProps {
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

interface Enemy {
  id: number;
  x: number;
  side: 'left' | 'right';
  speed: number;
  hp: number;
  isDead: boolean;
}

interface SlashFx {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
}

export const PokiStickmanBattleGame: React.FC<PokiStickmanBattleGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 15;

  const [kills, setKills] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 450,
    facing: 'right' as 'left' | 'right',
    enemies: [] as Enemy[],
    slashes: [] as SlashFx[],
    spawnTimer: 0,
    totalKills: 0,
    currentCombo: 0,
    attackAnim: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokistickmanbattle',
      gameTitle: isKo ? 'Stickman Battle (스틱맨 배틀)' : 'Stickman Battle',
      durationSeconds: 30,
      score: gameState.current.totalKills * 50 + 500,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const attack = useCallback((side: 'left' | 'right') => {
    const s = gameState.current;
    s.facing = side;
    s.attackAnim = 0.2;

    const hitRange = 100;
    let hitAny = false;

    for (const e of s.enemies) {
      if (e.isDead) continue;
      const isTargetSide = (side === 'left' && e.x < s.px) || (side === 'right' && e.x > s.px);
      if (isTargetSide && Math.abs(e.x - s.px) < hitRange) {
        e.hp--;
        hitAny = true;
        if (e.hp <= 0) {
          e.isDead = true;
          s.totalKills++;
          s.currentCombo++;
          setKills(s.totalKills);
          setCombo(s.currentCombo);
        }
      }
    }

    // Visual slash
    s.slashes.push({
      x: side === 'left' ? s.px - 40 : s.px + 40,
      y: s.py - 20,
      radius: 45,
      color: hitAny ? '#f59e0b' : '#38bdf8',
      alpha: 1.0
    });

    if (hitAny) {
      if (playSfx) playSfx('/sfx/slash.mp3');
      if (navigator.vibrate) navigator.vibrate(25);
      if (s.totalKills >= 20) {
        handleVictory();
      }
    } else {
      s.currentCombo = 0;
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
      gameState.current.px = canvas.width / 2;
      gameState.current.py = canvas.height * 0.65;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        if (s.attackAnim > 0) s.attackAnim -= dt;

        // Spawn enemies
        s.spawnTimer += dt;
        if (s.spawnTimer > 0.8) {
          s.spawnTimer = 0;
          const side = Math.random() > 0.5 ? 'left' : 'right';
          s.enemies.push({
            id: Date.now() + Math.random(),
            x: side === 'left' ? -30 : canvas.width + 30,
            side,
            speed: 120 + Math.random() * 60,
            hp: 1,
            isDead: false
          });
        }

        // Update enemies
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          if (e.isDead) {
            s.enemies.splice(i, 1);
            continue;
          }

          if (e.x < s.px) {
            e.x += e.speed * dt;
          } else {
            e.x -= e.speed * dt;
          }

          // Damage player if touched
          if (Math.abs(e.x - s.px) < 15) {
            s.currentCombo = 0;
            setCombo(0);
            e.isDead = true;
            if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
          }
        }

        // Update slashes
        for (let i = s.slashes.length - 1; i >= 0; i--) {
          s.slashes[i].alpha -= dt * 4;
          if (s.slashes[i].alpha <= 0) {
            s.slashes.splice(i, 1);
          }
        }
      }

      // Render Dojo
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor line
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, s.py + 20, canvas.width, canvas.height - s.py);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, s.py + 20);
      ctx.lineTo(canvas.width, s.py + 20);
      ctx.stroke();

      // Draw Enemies
      for (const e of s.enemies) {
        ctx.fillStyle = '#ef4444';
        // Head
        ctx.beginPath();
        ctx.arc(e.x, s.py - 20, 10, 0, Math.PI * 2);
        ctx.fill();
        // Body line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(e.x, s.py - 10);
        ctx.lineTo(e.x, s.py + 15);
        ctx.stroke();
      }

      // Slashes
      for (const sl of s.slashes) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, sl.alpha);
        ctx.strokeStyle = sl.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(sl.x, sl.y, sl.radius, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      // Player
      drawCardSprite(ctx, effectiveCardId, s.px - 25, s.py - 30, 50, 50);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') attack('left');
      if (e.key === 'ArrowRight' || e.key === 'd') attack('right');
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [attack, effectiveCardId, gameWon]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Stickman Battle (스틱맨 배틀)' : 'Stickman Battle'}
        currentScore={kills}
        targetScore={20}
        onBack={handleExit}
        stageInfo={`${isKo ? '처치' : 'Kills'}: ${kills}/20 | 🔥 Combo ${combo}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Pure Touch Screen Controls */}
      <div className="absolute inset-y-0 inset-x-0 flex z-20 pointer-events-none">
        <button
          className="pointer-events-auto w-1/2 h-full active:bg-blue-500/10 flex items-end justify-center pb-12"
          onClick={() => attack('left')}
        >
          <span className="bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-6 rounded-2xl backdrop-blur-md">
            ◀ ATTACK LEFT
          </span>
        </button>
        <button
          className="pointer-events-auto w-1/2 h-full active:bg-red-500/10 flex items-end justify-center pb-12"
          onClick={() => attack('right')}
        >
          <span className="bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-6 rounded-2xl backdrop-blur-md">
            ATTACK RIGHT ▶
          </span>
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

export default PokiStickmanBattleGame;

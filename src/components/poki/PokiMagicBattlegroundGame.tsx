import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMagicBattlegroundGameProps {
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

interface SpellOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface WizardFoe {
  x: number;
  y: number;
  hp: number;
}

export const PokiMagicBattlegroundGame: React.FC<PokiMagicBattlegroundGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 61;

  const [kills, setKills] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    py: 480,
    targetX: 200,
    targetY: 480,
    spells: [] as SpellOrb[],
    foes: [] as WizardFoe[],
    totalKills: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimagicbattleground',
      gameTitle: isKo ? '매직 배틀그라운드' : 'Magic Battleground',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const castSpell = useCallback((tx: number, ty: number) => {
    const s = gameState.current;
    const angle = Math.atan2(ty - s.py, tx - s.px);
    const speed = 550;
    s.spells.push({
      x: s.px,
      y: s.py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: '#a855f7'
    });
    if (playSfx) playSfx('/sfx/magic.mp3');
    if (navigator.vibrate) navigator.vibrate(20);
  }, [playSfx]);

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
        // Move to target
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * 180 * dt;
          s.py += (dy / dist) * 180 * dt;
        }

        // Spawn foes
        if (s.foes.length < 5 && Math.random() < 0.03) {
          s.foes.push({
            x: 40 + Math.random() * (canvas.width - 80),
            y: 80 + Math.random() * 200,
            hp: 2
          });
        }

        // Update spells
        for (let i = s.spells.length - 1; i >= 0; i--) {
          const sp = s.spells[i];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;

          for (let j = s.foes.length - 1; j >= 0; j--) {
            const f = s.foes[j];
            if (Math.hypot(sp.x - f.x, sp.y - f.y) < 30) {
              f.hp--;
              s.spells.splice(i, 1);
              if (f.hp <= 0) {
                s.foes.splice(j, 1);
                s.totalKills++;
                setKills(s.totalKills);
                if (navigator.vibrate) navigator.vibrate(25);
                if (s.totalKills >= 12) {
                  handleVictory();
                }
              }
              break;
            }
          }

          if (sp.y < -50 || sp.x < -50 || sp.x > canvas.width + 50) {
            s.spells.splice(i, 1);
          }
        }
      }

      // Render Mystic Arena
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Magic circles on floor
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 300, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Spells
      for (const sp of s.spells) {
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Wizard Foes
      for (const f of s.foes) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mage Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      castSpell(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [castSpell, effectiveCardId, gameWon, handleVictory]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '매직 배틀그라운드' : 'Magic Battleground'}
        currentScore={kills}
        targetScore={12}
        onBack={handleExit}
        stageInfo={`🔮 Kills: ${kills}/12`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-purple-200 pointer-events-none">
        {isKo ? '화면의 적을 터치하여 비전 마법탄을 발사하세요!' : 'Tap anywhere to cast arcane magic orbs!'}
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

export default PokiMagicBattlegroundGame;

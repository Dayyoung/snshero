import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiKarateFighterGameProps {
  onBack: () => void;
  cardId?: number;
}

export const PokiKarateFighterGame: React.FC<PokiKarateFighterGameProps> = ({ onBack, cardId = 52 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [round, setRound] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    round: 1,
    playerHp: 100,
    enemyHp: 100,
    playerAction: 'idle' as 'idle' | 'punch' | 'kick' | 'block',
    actionTimer: 0,
    enemyAction: 'idle' as 'idle' | 'warning' | 'attack',
    enemyTimer: 60,
    enemyCardId: 15,
    particles: [] as { x: number; y: number; text?: string; color: string; life: number; vx: number; vy: number }[],
    startTime: Date.now(),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Dojo wooden tatami background
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Tatami mat borders
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      const dojoW = Math.min(canvas.width - 32, 420);
      const dojoX = (canvas.width - dojoW) / 2;
      ctx.strokeRect(dojoX, 100, dojoW, canvas.height - 220);

      // Japanese Dojo Calligraphy Banner
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🥋 武道館 (DOJO KARATE ARENA)', canvas.width / 2, 85);

      const playerX = canvas.width / 2 - 80;
      const enemyX = canvas.width / 2 + 80;
      const groundY = canvas.height * 0.52;

      // Action timer tick
      if (state.actionTimer > 0) {
        state.actionTimer--;
        if (state.actionTimer === 0) state.playerAction = 'idle';
      }

      // Enemy AI logic
      state.enemyTimer--;
      if (state.enemyTimer === 30) {
        state.enemyAction = 'warning';
      } else if (state.enemyTimer <= 0) {
        // Enemy attacks!
        state.enemyAction = 'attack';
        state.enemyTimer = 80 + Math.floor(Math.random() * 40);

        if (state.playerAction === 'block') {
          // Block success!
          state.particles.push({
            x: playerX + 30,
            y: groundY - 40,
            text: '🛡️ PARRY BLOCK!',
            color: '#38bdf8',
            life: 25,
            vx: 0,
            vy: -1.5,
          });
          state.enemyHp = Math.max(0, state.enemyHp - 15);
          setEnemyHp(state.enemyHp);
        } else {
          // Player hit!
          state.playerHp = Math.max(0, state.playerHp - 20);
          setPlayerHp(state.playerHp);
          state.particles.push({
            x: playerX,
            y: groundY - 40,
            text: '-20 HIT!',
            color: '#ef4444',
            life: 25,
            vx: 0,
            vy: -1.5,
          });

          if (state.playerHp <= 0 && !gameOver) {
            setGameOver(true);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokikaratefighter',
              gameTitle: 'Karate Fighter',
              isVictory: false,
              score: (state.round - 1) * 333,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
            });
            setRewardResult(reward);
            return;
          }
        }
      }

      // Draw Player Fighter
      ctx.save();
      let pOffsetX = 0;
      if (state.playerAction === 'punch') pOffsetX = 25;
      else if (state.playerAction === 'kick') pOffsetX = 35;
      else if (state.playerAction === 'block') pOffsetX = -10;

      drawCardSprite(ctx, cardId, playerX + pOffsetX - 30, groundY - 60, 60, 80);

      // Player status text
      if (state.playerAction !== 'idle') {
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          state.playerAction === 'punch' ? '👊 정권' : state.playerAction === 'kick' ? '🦵 발차기' : '🛡️ 가드',
          playerX + pOffsetX,
          groundY - 70
        );
      }
      ctx.restore();

      // Draw Enemy Fighter
      ctx.save();
      let eOffsetX = 0;
      if (state.enemyAction === 'attack') eOffsetX = -25;
      drawCardSprite(ctx, state.enemyCardId, enemyX + eOffsetX - 30, groundY - 60, 60, 80, { flipH: true });

      if (state.enemyAction === 'warning') {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ ATTACK!', enemyX, groundY - 75);
      }
      ctx.restore();

      // HP Bars
      const hpBarW = 110;
      // Player HP
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(playerX - 55, groundY + 40, hpBarW, 8);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(playerX - 55, groundY + 40, (state.playerHp / 100) * hpBarW, 8);

      // Enemy HP
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(enemyX - 55, groundY + 40, hpBarW, 8);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(enemyX - 55, groundY + 40, (state.enemyHp / 100) * hpBarW, 8);

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.text) {
          ctx.fillStyle = pt.color;
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(pt.text, pt.x, pt.y);
        }
        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cardId, gameOver, gameWon]);

  const attack = (type: 'punch' | 'kick' | 'block') => {
    if (gameOver) return;
    const s = gameStateRef.current;
    s.playerAction = type;
    s.actionTimer = 18;

    if (type === 'punch' || type === 'kick') {
      const dmg = type === 'punch' ? 20 : 35;
      s.enemyHp = Math.max(0, s.enemyHp - dmg);
      setEnemyHp(s.enemyHp);

      s.particles.push({
        x: window.innerWidth / 2 + 80,
        y: window.innerHeight * 0.52 - 40,
        text: `-${dmg} HIT!`,
        color: '#f59e0b',
        life: 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -2,
      });

      // Enemy defeated check
      if (s.enemyHp <= 0) {
        if (s.round >= 3) {
          // Dojo Champion!
          setGameWon(true);
          setGameOver(true);
          const reward = calculateAndDepositMissionReward({
            gameId: 'pokikaratefighter',
            gameTitle: 'Karate Fighter',
            isVictory: true,
            score: 1000,
            maxTargetScore: 1000,
            durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
          });
          setRewardResult(reward);
        } else {
          // Next round
          s.round++;
          setRound(s.round);
          s.enemyHp = 100;
          setEnemyHp(100);
          s.enemyCardId = s.round === 2 ? 24 : 10;
          s.enemyTimer = 60;
        }
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fef3c7] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Karate Fighter"
        score={round}
        targetScore={3}
        lives={Math.ceil(playerHp / 34)}
        onBack={onBack}
      />

      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Touch Action Controls */}
      <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-center gap-3 pointer-events-auto">
        <button
          onClick={() => attack('block')}
          className="flex-1 max-w-[110px] bg-sky-600 active:bg-sky-700 text-white font-bold py-3 rounded-sm border border-sky-400 text-xs shadow"
        >
          <div>🛡️ 막기</div>
          <div className="text-[10px] opacity-80">적 경고 시 가드</div>
        </button>
        <button
          onClick={() => attack('punch')}
          className="flex-1 max-w-[110px] bg-amber-600 active:bg-amber-700 text-white font-bold py-3 rounded-sm border border-amber-400 text-xs shadow"
        >
          <div>👊 정권</div>
          <div className="text-[10px] opacity-80">빠른 잽 20pt</div>
        </button>
        <button
          onClick={() => attack('kick')}
          className="flex-1 max-w-[110px] bg-rose-600 active:bg-rose-700 text-white font-bold py-3 rounded-sm border border-rose-400 text-xs shadow"
        >
          <div>🦵 발차기</div>
          <div className="text-[10px] opacity-80">하이킥 35pt</div>
        </button>
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={round * 333}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setRound(1);
          setPlayerHp(100);
          setEnemyHp(100);
          const s = gameStateRef.current;
          s.round = 1;
          s.playerHp = 100;
          s.enemyHp = 100;
          s.enemyCardId = 15;
          s.enemyTimer = 60;
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};

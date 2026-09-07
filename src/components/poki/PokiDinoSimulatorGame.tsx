import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDinoSimulatorGameProps {
  onBack: () => void;
  cardId?: number;
}

interface DinoPrey {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'meat' | 'prey' | 'raptor';
  hp: number;
}

export const PokiDinoSimulatorGame: React.FC<PokiDinoSimulatorGameProps> = ({ onBack, cardId = 57 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [survivalScore, setSurvivalScore] = useState(0);
  const [dinoHp, setDinoHp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    dinoX: 200,
    dinoY: 350,
    targetX: 200,
    targetY: 350,
    hp: 100,
    score: 0,
    entities: [] as DinoPrey[],
    particles: [] as { x: number; y: number; text: string; color: string; life: number; vy: number }[],
    startTime: Date.now(),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const s = gameStateRef.current;
      s.dinoX = canvas.width / 2;
      s.dinoY = canvas.height / 2;
      s.targetX = s.dinoX;
      s.targetY = s.dinoY;

      // Spawn prehistoric entities
      s.entities = [];
      for (let i = 0; i < 6; i++) {
        s.entities.push({
          x: Math.random() * (canvas.width - 60) + 30,
          y: 120 + Math.random() * (canvas.height - 240),
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          type: i < 3 ? 'prey' : i < 5 ? 'meat' : 'raptor',
          hp: 30,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const state = gameStateRef.current;

      // Follow target smooth
      state.dinoX += (state.targetX - state.dinoX) * 0.12;
      state.dinoY += (state.targetY - state.dinoY) * 0.12;

      // Update prehistoric entities
      for (let i = state.entities.length - 1; i >= 0; i--) {
        const ent = state.entities[i];
        ent.x += ent.vx;
        ent.y += ent.vy;

        if (ent.x < 30 || ent.x > canvas.width - 30) ent.vx *= -1;
        if (ent.y < 110 || ent.y > canvas.height - 90) ent.vy *= -1;

        // Collision with player T-Rex
        const dist = Math.hypot(ent.x - state.dinoX, ent.y - state.dinoY);
        if (dist < 46) {
          if (ent.type === 'meat') {
            state.score += 100;
            state.hp = Math.min(100, state.hp + 15);
            setDinoHp(state.hp);
            setSurvivalScore(state.score);
            state.particles.push({
              x: ent.x,
              y: ent.y,
              text: '+100 MEAT 🍖',
              color: '#10b981',
              life: 25,
              vy: -1.5,
            });
            state.entities.splice(i, 1);
          } else if (ent.type === 'prey') {
            state.score += 150;
            setSurvivalScore(state.score);
            state.particles.push({
              x: ent.x,
              y: ent.y,
              text: '+150 HUNT 🦕',
              color: '#f59e0b',
              life: 25,
              vy: -1.5,
            });
            state.entities.splice(i, 1);
          } else if (ent.type === 'raptor') {
            // Raptor fight
            state.score += 200;
            state.hp -= 15;
            setDinoHp(Math.max(0, state.hp));
            setSurvivalScore(state.score);
            state.particles.push({
              x: ent.x,
              y: ent.y,
              text: 'ROAR! +200 🦖',
              color: '#ef4444',
              life: 25,
              vy: -1.5,
            });
            state.entities.splice(i, 1);

            if (state.hp <= 0 && !gameOver) {
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokidinosimulator',
                gameTitle: 'Dino Simulator',
                isVictory: false,
                score: state.score,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }
          }

          // Respawn entity
          state.entities.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: 120 + Math.random() * (canvas.height - 240),
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            type: Math.random() < 0.4 ? 'prey' : Math.random() < 0.7 ? 'meat' : 'raptor',
            hp: 30,
          });

          // Win check: 1,000 score
          if (state.score >= 1000 && !gameWon) {
            setGameWon(true);
            setGameOver(true);
            const reward = calculateAndDepositMissionReward({
              gameId: 'pokidinosimulator',
              gameTitle: 'Dino Simulator',
              isVictory: true,
              score: 1000,
              maxTargetScore: 1000,
              durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
            });
            setRewardResult(reward);
            return;
          }
        }
      }

      // Drawing
      // Jurassic Jungle Floor
      ctx.fillStyle = '#14532d'; // Deep jungle green
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Prehistoric Fern textures
      ctx.fillStyle = '#166534';
      for (let x = 30; x < canvas.width; x += 60) {
        for (let y = 130; y < canvas.height - 80; y += 60) {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Water holes
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.3, canvas.height * 0.3, 45, 30, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Draw Entities
      for (const ent of state.entities) {
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = ent.type === 'meat' ? '🍖' : ent.type === 'prey' ? '🦕' : '🦖';
        ctx.fillText(icon, ent.x, ent.y);
      }

      // Draw Player T-Rex Card Sprite
      drawCardSprite(ctx, cardId, state.dinoX - 26, state.dinoY - 30, 52, 60);

      // T-Rex footprint ripple
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(state.dinoX, state.dinoY + 32, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.y += pt.vy;
        pt.life--;
        ctx.fillStyle = pt.color;
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pt.text, pt.x, pt.y);
        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId, gameOver, gameWon]);

  const handlePointer = (clientX: number, clientY: number) => {
    gameStateRef.current.targetX = clientX;
    gameStateRef.current.targetY = clientY;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#14532d] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Dino Simulator"
        score={survivalScore}
        targetScore={1000}
        lives={Math.ceil(dinoHp / 25)}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseMove={(e) => handlePointer(e.clientX, e.clientY)}
        onMouseDown={(e) => handlePointer(e.clientX, e.clientY)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-emerald-300">
        터치/드래그로 티라노를 조종하여 사냥(🦕)과 고기(🍖)를 섭취해 1,000pt를 달성하세요! (HP: {dinoHp}%)
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={survivalScore}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setSurvivalScore(0);
          setDinoHp(100);
          const s = gameStateRef.current;
          s.score = 0;
          s.hp = 100;
          s.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiDinoSimulatorGame;

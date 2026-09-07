import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPetnestGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Pet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'dog' | 'cat' | 'bunny';
  following: boolean;
  rescued: boolean;
}

export const PokiPetnestGame: React.FC<PokiPetnestGameProps> = ({ onBack, cardId = 43 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lovePoints, setLovePoints] = useState(0);
  const [rescuedCount, setRescuedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    playerX: 200,
    playerY: 400,
    targetX: 200,
    targetY: 400,
    isDragging: false,
    lovePoints: 0,
    rescuedCount: 0,
    pets: [] as Pet[],
    hearts: [] as { x: number; y: number; text: string; alpha: number; vy: number }[],
    startTime: Date.now(),
    timeLeft: 60,
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
      gameStateRef.current.playerX = canvas.width / 2;
      gameStateRef.current.playerY = canvas.height / 2 + 50;
      gameStateRef.current.targetX = gameStateRef.current.playerX;
      gameStateRef.current.targetY = gameStateRef.current.playerY;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Spawn initial pets
    const petTypes: ('dog' | 'cat' | 'bunny')[] = ['dog', 'cat', 'bunny'];
    for (let i = 0; i < 8; i++) {
      gameStateRef.current.pets.push({
        x: Math.random() * (canvas.width - 60) + 30,
        y: Math.random() * (canvas.height - 240) + 160,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        type: petTypes[i % 3],
        following: false,
        rescued: false,
      });
    }

    const timerInterval = setInterval(() => {
      const s = gameStateRef.current;
      if (s.timeLeft > 0 && !gameOver) {
        s.timeLeft--;
        setTimeLeft(s.timeLeft);
        if (s.timeLeft <= 0) {
          // Time over evaluation
          const won = s.lovePoints >= 1000;
          setGameOver(true);
          setGameWon(won);
          const reward = calculateAndDepositMissionReward({
            gameId: 'pokipetnest',
            gameTitle: 'Petnest.io',
            isVictory: won,
            score: s.lovePoints,
            maxTargetScore: 1000,
            durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
          });
          setRewardResult(reward);
        }
      }
    }, 1000);

    const render = () => {
      const state = gameStateRef.current;

      // Smooth follow target
      state.playerX += (state.targetX - state.playerX) * 0.15;
      state.playerY += (state.targetY - state.playerY) * 0.15;

      // Sanctuary Habitat Zone (Safe Haven at bottom center)
      const shelterX = canvas.width / 2;
      const shelterY = canvas.height - 100;
      const shelterRadius = 75;

      // Update pets
      let followersCount = 0;
      for (const pet of state.pets) {
        if (pet.following) followersCount++;
      }

      for (let i = state.pets.length - 1; i >= 0; i--) {
        const pet = state.pets[i];

        if (!pet.following && !pet.rescued) {
          // Wander freely
          pet.x += pet.vx;
          pet.y += pet.vy;
          if (pet.x < 30 || pet.x > canvas.width - 30) pet.vx *= -1;
          if (pet.y < 120 || pet.y > canvas.height - 160) pet.vy *= -1;

          // Check pickup by player
          const dist = Math.hypot(pet.x - state.playerX, pet.y - state.playerY);
          if (dist < 45 && followersCount < 4) {
            pet.following = true;
            followersCount++;
          }
        } else if (pet.following && !pet.rescued) {
          // Follow player
          const dx = state.playerX - pet.x;
          const dy = state.playerY - pet.y;
          pet.x += dx * 0.08;
          pet.y += dy * 0.08;

          // Check if brought to shelter
          const shelterDist = Math.hypot(pet.x - shelterX, pet.y - shelterY);
          if (shelterDist < shelterRadius) {
            pet.rescued = true;
            pet.following = false;
            state.rescuedCount++;
            state.lovePoints += 150;
            setRescuedCount(state.rescuedCount);
            setLovePoints(state.lovePoints);

            state.hearts.push({
              x: pet.x,
              y: pet.y,
              text: '💖 +150 LOVE',
              alpha: 1,
              vy: -2,
            });

            // Re-spawn a new wild pet
            state.pets.push({
              x: Math.random() * (canvas.width - 60) + 30,
              y: Math.random() * (canvas.height - 300) + 140,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              type: petTypes[Math.floor(Math.random() * 3)],
              following: false,
              rescued: false,
            });

            // Win check
            if (state.lovePoints >= 1000 && !gameWon) {
              setGameWon(true);
              setGameOver(true);
              const reward = calculateAndDepositMissionReward({
                gameId: 'pokipetnest',
                gameTitle: 'Petnest.io',
                isVictory: true,
                score: state.lovePoints,
                maxTargetScore: 1000,
                durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
              });
              setRewardResult(reward);
              return;
            }
          }
        }
      }

      // Drawing
      // Park green meadow
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grass texture dots
      ctx.fillStyle = '#a7f3d0';
      for (let x = 20; x < canvas.width; x += 50) {
        for (let y = 140; y < canvas.height - 120; y += 50) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Shelter Zone
      ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(shelterX, shelterY, shelterRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#854d0e';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏡 펫 보금자리 (NEST)', shelterX, shelterY - 10);
      ctx.font = '11px monospace';
      ctx.fillText('여기로 동물들을 데려오세요', shelterX, shelterY + 12);

      // Draw Pets
      for (const pet of state.pets) {
        if (pet.rescued) continue;
        ctx.save();
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐰';
        ctx.fillText(icon, pet.x, pet.y);

        if (pet.following) {
          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('💖', pet.x, pet.y - 18);
        }
        ctx.restore();
      }

      // Draw Player Hero Sprite
      drawCardSprite(ctx, cardId, state.playerX - 22, state.playerY - 26, 44, 52);

      // Player footprint / shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(state.playerX, state.playerY + 28, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hearts animation
      for (let i = state.hearts.length - 1; i >= 0; i--) {
        const h = state.hearts[i];
        h.y += h.vy;
        h.alpha -= 0.02;
        ctx.fillStyle = `rgba(244, 63, 94, ${Math.max(0, h.alpha)})`;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(h.text, h.x, h.y);
        if (h.alpha <= 0) state.hearts.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, [cardId, gameOver, gameWon]);

  const handlePointer = (clientX: number, clientY: number) => {
    gameStateRef.current.targetX = clientX;
    gameStateRef.current.targetY = clientY;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#ecfdf5] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Petnest.io"
        score={lovePoints}
        targetScore={1000}
        timeLeft={timeLeft}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseMove={(e) => handlePointer(e.clientX, e.clientY)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointer(t.clientX, t.clientY);
        }}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-emerald-800">
        화면을 터치/드래그하여 공원의 귀여운 동물들을 구조해 하단 보금자리로 데려오세요!
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={lovePoints}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setLovePoints(0);
          setRescuedCount(0);
          setTimeLeft(60);
          gameStateRef.current.lovePoints = 0;
          gameStateRef.current.rescuedCount = 0;
          gameStateRef.current.timeLeft = 60;
          gameStateRef.current.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiPetnestGame;

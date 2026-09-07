import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDogsLifeGameProps {
  onBack: () => void;
}

interface BoneItem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface Hurdle {
  x: number;
  y: number;
  w: number;
  h: number;
  cleared: boolean;
}

interface Butterfly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export const PokiDogsLifeGame: React.FC<PokiDogsLifeGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory'>('ready');
  const [bonesCollected, setBonesCollected] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [barkText, setBarkText] = useState<string | null>(null);

  const stateRef = useRef({
    dog: {
      x: 200,
      y: 300,
      vx: 0,
      vy: 0,
      facing: 1 as 1 | -1,
      speed: 3.5,
      isBarking: 0,
      isJumping: 0,
    },
    bones: [] as BoneItem[],
    hurdles: [] as Hurdle[],
    butterflies: [] as Butterfly[],
    targetPos: null as { x: number; y: number } | null,
    totalBones: 5,
  });

  const initPark = useCallback(() => {
    stateRef.current.dog = {
      x: 200,
      y: 480,
      vx: 0,
      vy: 0,
      facing: 1,
      speed: 3.5,
      isBarking: 0,
      isJumping: 0,
    };

    // 5 bones distributed in the park
    stateRef.current.bones = [
      { id: 1, x: 80, y: 120, collected: false },
      { id: 2, x: 320, y: 150, collected: false },
      { id: 3, x: 190, y: 240, collected: false },
      { id: 4, x: 60, y: 380, collected: false },
      { id: 5, x: 330, y: 440, collected: false },
    ];

    // Hurdles (Agility track)
    stateRef.current.hurdles = [
      { x: 130, y: 180, w: 50, h: 14, cleared: false },
      { x: 230, y: 320, w: 50, h: 14, cleared: false },
    ];

    // Ambient butterflies
    stateRef.current.butterflies = [
      { x: 100, y: 200, vx: 0.8, vy: 0.5, color: '#f43f5e' },
      { x: 280, y: 250, vx: -0.6, vy: 0.8, color: '#eab308' },
      { x: 200, y: 100, vx: 0.5, vy: -0.7, color: '#38bdf8' },
    ];

    stateRef.current.targetPos = null;
    setBonesCollected(0);
    setBarkText(null);
  }, []);

  const handleStart = () => {
    initPark();
    setGameState('playing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokidogslife',
      gameTitle: "Dog's Life Adventure",
      isVictory: true,
      score: 5,
      maxTargetScore: 5,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  // Action: Bark (멍멍!)
  const triggerBark = useCallback(() => {
    stateRef.current.dog.isBarking = 25;
    setBarkText('멍! 멍! 🐾');
    setTimeout(() => setBarkText(null), 1200);

    // Scares butterflies away
    stateRef.current.butterflies.forEach((b) => {
      b.vx = (Math.random() - 0.5) * 4;
      b.vy = (Math.random() - 0.5) * 4;
    });
  }, []);

  // Action: Jump (어질리티 점프)
  const triggerJump = useCallback(() => {
    if (stateRef.current.dog.isJumping === 0) {
      stateRef.current.dog.isJumping = 20;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const { dog, bones, hurdles, butterflies } = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      // Lush green park grass
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(0, 0, width, height);

      // Park pathways / sand trail
      ctx.fillStyle = '#d4a373';
      ctx.beginPath();
      ctx.ellipse(200, 300, 150, 220, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.ellipse(200, 300, 110, 170, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trees & bushes (Ambient decorations)
      const trees = [
        { x: 40, y: 50 },
        { x: 350, y: 60 },
        { x: 40, y: 530 },
        { x: 360, y: 540 },
        { x: 200, y: 50 },
      ];
      trees.forEach((t) => {
        ctx.fillStyle = '#1b4332';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.arc(t.x, t.y - 6, 22, 0, Math.PI * 2);
        ctx.fill();
      });

      if (gameState === 'playing') {
        // Dog Movement toward target position
        if (stateRef.current.targetPos) {
          const dx = stateRef.current.targetPos.x - dog.x;
          const dy = stateRef.current.targetPos.y - dog.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 6) {
            dog.vx = (dx / dist) * dog.speed;
            dog.vy = (dy / dist) * dog.speed;
            dog.facing = dx > 0 ? 1 : -1;
          } else {
            dog.vx = 0;
            dog.vy = 0;
          }
        } else {
          dog.vx *= 0.8;
          dog.vy *= 0.8;
        }

        dog.x += dog.vx;
        dog.y += dog.vy;

        // Bounds
        dog.x = Math.max(30, Math.min(width - 30, dog.x));
        dog.y = Math.max(40, Math.min(height - 40, dog.y));

        if (dog.isBarking > 0) dog.isBarking--;
        if (dog.isJumping > 0) dog.isJumping--;

        // Check Bones Collection
        bones.forEach((b) => {
          if (!b.collected) {
            const dist = Math.hypot(dog.x - b.x, dog.y - b.y);
            if (dist < 32) {
              b.collected = true;
              const newCount = bones.filter((item) => item.collected).length;
              setBonesCollected(newCount);

              if (newCount >= 5) {
                handleVictory();
              }
            }
          }
        });

        // Check Hurdles Cleared
        hurdles.forEach((h) => {
          if (
            dog.x > h.x &&
            dog.x < h.x + h.w &&
            dog.y > h.y - 10 &&
            dog.y < h.y + h.h + 10 &&
            dog.isJumping > 0
          ) {
            h.cleared = true;
          }
        });

        // Butterflies wandering
        butterflies.forEach((bf) => {
          bf.x += bf.vx;
          bf.y += bf.vy;
          if (bf.x < 30 || bf.x > width - 30) bf.vx *= -1;
          if (bf.y < 40 || bf.y > height - 40) bf.vy *= -1;
        });
      }

      // Draw Hurdles
      hurdles.forEach((h) => {
        ctx.fillStyle = h.cleared ? '#22c55e' : '#ea580c';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(h.x + 8, h.y + 3, h.w - 16, h.h - 6);
      });

      // Draw Bones
      bones.forEach((b) => {
        if (!b.collected) {
          ctx.save();
          ctx.translate(b.x, b.y);
          // Bone shape
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(-8, -4, 4, 0, Math.PI * 2);
          ctx.arc(-8, 4, 4, 0, Math.PI * 2);
          ctx.arc(8, -4, 4, 0, Math.PI * 2);
          ctx.arc(8, 4, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(-8, -3, 16, 6);
          ctx.restore();
        }
      });

      // Draw Butterflies
      butterflies.forEach((bf) => {
        ctx.fillStyle = bf.color;
        ctx.beginPath();
        ctx.arc(bf.x - 3, bf.y, 4, 0, Math.PI * 2);
        ctx.arc(bf.x + 3, bf.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Dog Hero (Card #78 Dog)
      ctx.save();
      const jumpOffsetY = dog.isJumping > 0 ? Math.sin((dog.isJumping / 20) * Math.PI) * 20 : 0;
      const drawY = dog.y - jumpOffsetY;

      if (dog.facing === -1) {
        ctx.translate(dog.x + 18, drawY);
        ctx.scale(-1, 1);
        drawCardSprite(ctx, 78, -18, -22, 36, 44);
      } else {
        drawCardSprite(ctx, 78, dog.x - 18, drawY - 22, 36, 44);
      }
      ctx.restore();

      // Bark Speech bubble
      if (dog.isBarking > 0 && barkText) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dog.x - 30, dog.y - 50, 60, 22);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(dog.x - 30, dog.y - 50, 60, 22);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('멍멍! 🦴', dog.x, dog.y - 35);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, barkText, handleVictory]);

  // Touch Move Navigation
  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    stateRef.current.targetPos = {
      x: ((t.clientX - rect.left) / rect.width) * 400,
      y: ((t.clientY - rect.top) / rect.height) * 600,
    };
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#1b4332] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Dog's Life Adventure"
        missionTarget="황금 뼈다귀 5개 수집"
        currentScore={bonesCollected}
        maxScore={5}
        scoreUnit="개"
        onBack={onBack}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full object-contain rounded border border-white/20 bg-[#2d6a4f] touch-none shadow-2xl"
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onTouchEnd={() => {
            stateRef.current.targetPos = null;
          }}
          onMouseDown={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            stateRef.current.targetPos = {
              x: ((e.clientX - rect.left) / rect.width) * 400,
              y: ((e.clientY - rect.top) / rect.height) * 600,
            };
          }}
          onMouseMove={(e) => {
            if (stateRef.current.targetPos) {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              stateRef.current.targetPos = {
                x: ((e.clientX - rect.left) / rect.width) * 400,
                y: ((e.clientY - rect.top) / rect.height) * 600,
              };
            }
          }}
          onMouseUp={() => {
            stateRef.current.targetPos = null;
          }}
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">[ Dog's Life Adventure ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              공원을 신나게 달리는 귀여운 강아지가 되어보세요!<br />
              <b>화면 터치/드래그</b>: 강아지 산책 이동<br />
              <b>[멍멍 짖기]</b>: 나비 쫓기 & 기분 전환<br />
              <b>[점프]</b>: 허들 넘기<br />
              공원 곳곳의 <b>황금 뼈다귀 5개</b>를 모두 찾아보세요!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              산책 시작 [START]
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={onBack}
          />
        )}
      </div>

      {/* Dog Action Controls */}
      {gameState === 'playing' && (
        <div className="w-full max-w-md p-3 bg-slate-900/95 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex-1">
            뼈다귀: {bonesCollected} / 5
          </div>
          <button
            onClick={triggerBark}
            className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-sm text-sm active:scale-95 transition-all shadow"
          >
            🐶 멍멍 짖기!
          </button>
          <button
            onClick={triggerJump}
            className="flex-1 py-3 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-bold rounded-sm text-sm active:scale-95 transition-all shadow"
          >
            🐾 허들 점프!
          </button>
        </div>
      )}
    </div>
  );
};
export default PokiDogsLifeGame;

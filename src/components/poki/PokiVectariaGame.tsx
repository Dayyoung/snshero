import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiVectariaGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isPlayer: boolean;
}

interface VoxelEnemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  charId: number;
  shootTimer: number;
}

export const PokiVectariaGame: React.FC<PokiVectariaGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 7;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const totalWaves = 3;
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_vectaria') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 180,
      y: 400,
      targetX: 180,
      targetY: 400,
      speed: 4.0,
      hp: 100,
    },
    enemies: [] as VoxelEnemy[],
    projectiles: [] as Projectile[],
    crystals: [] as { x: number; y: number; val: number }[],
    combo: 0,
    isTouchActive: false,
  });

  const initWave = useCallback((w: number) => {
    const enemies: VoxelEnemy[] = [];
    const count = 3 + w;
    const enemyChars = [103, 107, 113, 118];

    for (let i = 0; i < count; i++) {
      enemies.push({
        id: i + 1,
        x: 40 + Math.random() * 280,
        y: 60 + Math.random() * 160,
        hp: 3 + w,
        maxHp: 3 + w,
        charId: enemyChars[i % enemyChars.length],
        shootTimer: Math.random() * 60,
      });
    }

    const crystals: { x: number; y: number; val: number }[] = [];
    for (let i = 0; i < 8; i++) {
      crystals.push({
        x: 30 + Math.random() * 300,
        y: 200 + Math.random() * 180,
        val: 30,
      });
    }

    stateRef.current.enemies = enemies;
    stateRef.current.crystals = crystals;
    stateRef.current.projectiles = [];
  }, []);

  useEffect(() => {
    initWave(wave);
  }, [wave, initWave]);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 450 : 80);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_vectaria',
      gameTitle: isKo ? '벡타리아 복셀 배틀' : 'Vectaria.io',
      durationSeconds: 45 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && playerHp >= 60,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, playerHp, isKo, onReward, playSfx]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const enemies = stateRef.current.enemies;
      const projs = stateRef.current.projectiles;
      const crystals = stateRef.current.crystals;

      // Player move
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }

      // Collect crystals
      for (let i = crystals.length - 1; i >= 0; i--) {
        const c = crystals[i];
        if (Math.hypot(p.x - c.x, p.y - c.y) < 26) {
          crystals.splice(i, 1);
          setScore(s => s + c.val);
          stateRef.current.combo++;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x += (Math.random() - 0.5) * 2;
        e.shootTimer++;

        // Enemy shoot towards player
        if (e.shootTimer > 80) {
          e.shootTimer = 0;
          const edx = p.x - e.x;
          const edy = p.y - e.y;
          const edist = Math.sqrt(edx * edx + edy * edy);
          if (edist > 0) {
            projs.push({
              x: e.x,
              y: e.y,
              vx: (edx / edist) * 3.2,
              vy: (edy / edist) * 3.2,
              color: '#ef4444',
              isPlayer: false,
            });
          }
        }
      }

      // Update Projectiles
      for (let i = projs.length - 1; i >= 0; i--) {
        const pr = projs[i];
        pr.x += pr.vx;
        pr.y += pr.vy;

        // Player projectile hit enemies?
        if (pr.isPlayer) {
          for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
            const en = enemies[eIdx];
            if (Math.hypot(pr.x - en.x, pr.y - en.y) < 22) {
              en.hp -= 1;
              projs.splice(i, 1);
              if (en.hp <= 0) {
                enemies.splice(eIdx, 1);
                setScore(s => s + 80);
                stateRef.current.combo++;
                if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

                if (enemies.length === 0) {
                  if (wave < totalWaves) {
                    setWave(w => w + 1);
                    setScore(s => s + 200);
                  } else {
                    handleGameOver(true);
                  }
                }
              }
              break;
            }
          }
        } else {
          // Enemy projectile hit player?
          if (Math.hypot(pr.x - p.x, pr.y - p.y) < 20) {
            projs.splice(i, 1);
            p.hp -= 15;
            setPlayerHp(p.hp);
            stateRef.current.combo = 0;
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            if (p.hp <= 0) {
              handleGameOver(false);
              return;
            }
          }
        }

        // Out of bounds
        if (pr.x < -20 || pr.x > width + 20 || pr.y < -20 || pr.y > height + 20) {
          projs.splice(i, 1);
        }
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // 3D Isometric grid background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Voxel arena floor tiles
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Crystals
      for (const c of crystals) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - 12);
        ctx.lineTo(c.x + 10, c.y);
        ctx.lineTo(c.x, c.y + 12);
        ctx.lineTo(c.x - 10, c.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw Projectiles
      for (const pr of projs) {
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Enemies
      for (const en of enemies) {
        drawCardSprite(ctx, en.charId, en.x - 16, en.y - 16, 32, 32, {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#ef4444',
          shadowBlur: 6,
          shadowColor: '#ef4444',
        });

        // HP bar
        const hpPct = en.hp / en.maxHp;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(en.x - 14, en.y + 18, 28, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(en.x - 14, en.y + 18, 28 * hpPct, 3);
      }

      // Draw Player Hero Sprite
      drawCardSprite(ctx, playerHeroId, p.x - 18, p.y - 18, 36, 36, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#38bdf8',
        shadowBlur: 8,
        shadowColor: '#38bdf8',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, wave, playerHeroId, handleGameOver]);

  // Touch handlers: Drag to Move, Tap on enemy to shoot!
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    stateRef.current.isTouchActive = true;

    // Shoot projectile towards touch
    const p = stateRef.current.player;
    const dx = touchX - p.x;
    const dy = touchY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 15) {
      stateRef.current.projectiles.push({
        x: p.x,
        y: p.y,
        vx: (dx / dist) * 7.5,
        vy: (dy / dist) * 7.5,
        color: '#38bdf8',
        isPlayer: true,
      });
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }

    p.targetX = touchX;
    p.targetY = touchY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isTouchActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.player.targetX = e.clientX - rect.left;
    stateRef.current.player.targetY = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    stateRef.current.isTouchActive = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '벡타리아 복셀 배틀' : 'Vectaria.io',
      badge: 'MISSION 07',
      description: isKo
        ? '화면을 탭하여 마법 볼트를 발사하고 적 복셀 전사를 쓰러뜨리세요! 손가락으로 드래그하면 자유롭게 이동합니다.'
        : 'Tap to fire magic bolts at enemy voxel fighters! Drag your finger anywhere to move.',
      keyPoints: isKo
        ? ['원터치 드래그로 복셀 영웅 이동', '적을 탭하여 마법 탄환 저격', '3개 웨이브 전수 격파 시 승리']
        : ['Drag anywhere to move', 'Tap enemies to shoot magic bolts', 'Clear 3 enemy waves to win'],
    },
    {
      title: isKo ? '크리스탈 수집 & 웨이브 격파' : 'Collect Gems & Clear Waves',
      badge: 'GEM RUSH',
      description: isKo
        ? '맵의 파란 크리스탈을 획득하여 점수를 올리고, 3개 웨이브의 적을 모두 소탕하세요.'
        : 'Gather blue crystals to gain bonus score and conquer all 3 enemy waves.',
      keyPoints: isKo
        ? ['보석 수집으로 보너스 스코어', '한 손으로 100% 모바일 조작', '목표 점수 1,000점 달성']
        : ['Collect gems for extra points', '100% one-hand friendly', 'Reach 1,000 score target'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.07 벡타리아 io' : 'No.07 Vectaria.io'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`WAVE ${wave}/${totalWaves} | HP: ${playerHp}%`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Action Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-sky-400 font-bold tracking-wider animate-pulse">
            {isKo ? '🎯 탭: 마법 발사 공격 | 👆 드래그: 이동' : '🎯 TAP: FIRE MAGIC | 👆 DRAG: MOVE'}
          </p>
        </div>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isGameOver}
          isVictory={isVictory}
          score={score}
          receipt={settlementReceipt}
          onConfirm={onExit}
          onRestart={() => {
            setIsGameOver(false);
            setIsVictory(false);
            setSettlementReceipt(null);
            setScore(0);
            setWave(1);
            setPlayerHp(100);
            stateRef.current.player.hp = 100;
            setTimeLeft(45);
            initWave(1);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.07 벡타리아 io' : 'No.07 Vectaria.io'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_vectaria', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiLevelDevilGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isFake?: boolean;
  fallDelay?: number;
  falling?: boolean;
}

interface SpikeTrap {
  x: number;
  y: number;
  width: number;
  height: number;
  hidden: boolean;
  triggerDist: number;
}

export const PokiLevelDevilGame: React.FC<PokiLevelDevilGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 5;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [stage, setStage] = useState<number>(1);
  const totalStages = 3;
  const [deaths, setDeaths] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_leveldevil') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 40,
      y: 350,
      vx: 0,
      vy: 0,
      width: 36,
      height: 36,
      isGrounded: false,
      targetX: 40,
    },
    goal: {
      x: 280,
      y: 120,
      width: 44,
      height: 44,
      isTrolling: false,
    },
    platforms: [] as Platform[],
    spikes: [] as SpikeTrap[],
    isTouchActive: false,
    combo: 0,
  });

  const initStage = useCallback((s: number) => {
    stateRef.current.player.x = 40;
    stateRef.current.player.y = 350;
    stateRef.current.player.vx = 0;
    stateRef.current.player.vy = 0;
    stateRef.current.player.targetX = 40;
    stateRef.current.goal.isTrolling = false;

    const plats: Platform[] = [];
    const spks: SpikeTrap[] = [];

    if (s === 1) {
      // Stage 1: Fake floor that drops when stepped on
      plats.push({ x: 20, y: 390, width: 90, height: 20 });
      plats.push({ x: 130, y: 390, width: 80, height: 20, isFake: true, fallDelay: 12 });
      plats.push({ x: 230, y: 390, width: 100, height: 20 });
      plats.push({ x: 180, y: 260, width: 80, height: 20 });
      plats.push({ x: 260, y: 170, width: 80, height: 20 });

      spks.push({ x: 140, y: 440, width: 60, height: 16, hidden: false, triggerDist: 0 });
      spks.push({ x: 190, y: 244, width: 40, height: 16, hidden: true, triggerDist: 60 });
      stateRef.current.goal = { x: 280, y: 120, width: 44, height: 44, isTrolling: false };
    } else if (s === 2) {
      // Stage 2: Goal runs away once!
      plats.push({ x: 20, y: 390, width: 100, height: 20 });
      plats.push({ x: 140, y: 320, width: 70, height: 20 });
      plats.push({ x: 60, y: 240, width: 80, height: 20 });
      plats.push({ x: 180, y: 160, width: 100, height: 20 });

      spks.push({ x: 150, y: 304, width: 30, height: 16, hidden: true, triggerDist: 50 });
      stateRef.current.goal = { x: 220, y: 110, width: 44, height: 44, isTrolling: true };
    } else {
      // Stage 3: Devil traps everywhere
      plats.push({ x: 20, y: 390, width: 70, height: 20 });
      plats.push({ x: 110, y: 350, width: 50, height: 20, isFake: true, fallDelay: 8 });
      plats.push({ x: 180, y: 300, width: 60, height: 20 });
      plats.push({ x: 110, y: 220, width: 60, height: 20 });
      plats.push({ x: 210, y: 150, width: 90, height: 20 });

      spks.push({ x: 190, y: 284, width: 30, height: 16, hidden: true, triggerDist: 40 });
      spks.push({ x: 120, y: 204, width: 30, height: 16, hidden: true, triggerDist: 40 });
      stateRef.current.goal = { x: 240, y: 100, width: 44, height: 44, isTrolling: false };
    }

    stateRef.current.platforms = plats;
    stateRef.current.spikes = spks;
  }, []);

  useEffect(() => {
    initStage(stage);
  }, [stage, initStage]);

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

    const finalScore = score + (victory ? 500 : 80) - deaths * 30;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_leveldevil',
      gameTitle: isKo ? '레벨 데빌' : 'Level Devil',
      durationSeconds: 45 - timeLeft,
      score: Math.max(100, finalScore),
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && deaths === 0,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, deaths, isKo, onReward, playSfx]);

  const respawn = () => {
    setDeaths(d => d + 1);
    setScore(s => Math.max(0, s - 30));
    stateRef.current.combo = 0;
    initStage(stage);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  // Jump
  const triggerJump = useCallback(() => {
    const p = stateRef.current.player;
    if (p.isGrounded) {
      p.vy = -13.5;
      p.isGrounded = false;
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }
  }, [playSfx]);

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

    const gravity = 0.65;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const plats = stateRef.current.platforms;
      const spikes = stateRef.current.spikes;
      const goal = stateRef.current.goal;

      // Player horizontal seek
      p.vx = (p.targetX - p.x) * 0.15;
      p.x += p.vx;

      // Vertical physics
      p.vy += gravity;
      p.y += p.vy;
      p.isGrounded = false;

      // Platforms collision
      for (const pl of plats) {
        if (pl.falling) {
          pl.y += 6;
          continue;
        }

        if (
          p.x + p.width > pl.x &&
          p.x < pl.x + pl.width &&
          p.y + p.height >= pl.y &&
          p.y + p.height <= pl.y + 20 &&
          p.vy >= 0
        ) {
          p.y = pl.y - p.height;
          p.vy = 0;
          p.isGrounded = true;

          // Fake trap trigger
          if (pl.isFake && !pl.falling) {
            pl.fallDelay = (pl.fallDelay || 10) - 1;
            if (pl.fallDelay <= 0) {
              pl.falling = true;
            }
          }
        }
      }

      // Spikes collision & proximity triggers
      for (const spk of spikes) {
        const dist = Math.hypot(p.x - spk.x, p.y - spk.y);
        if (spk.hidden && dist < spk.triggerDist) {
          spk.hidden = false; // POP! Sudden spike trap
        }

        if (!spk.hidden) {
          if (
            p.x + p.width > spk.x &&
            p.x < spk.x + spk.width &&
            p.y + p.height > spk.y &&
            p.y < spk.y + spk.height
          ) {
            respawn();
            return;
          }
        }
      }

      // Goal interaction (Trolling check)
      const distToGoal = Math.hypot(p.x - goal.x, p.y - goal.y);
      if (goal.isTrolling && distToGoal < 60) {
        // Goal teleports to another platform!
        goal.x = 40;
        goal.y = 190;
        goal.isTrolling = false;
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      } else if (distToGoal < 30) {
        // Goal reached!
        if (stage < totalStages) {
          setStage(s => s + 1);
          setScore(s => s + 250);
          stateRef.current.combo += 2;
        } else {
          handleGameOver(true);
        }
        return;
      }

      // Fall off screen
      if (p.y > height + 60) {
        respawn();
        return;
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Dark hellish background
      ctx.fillStyle = '#180808';
      ctx.fillRect(0, 0, width, height);

      // Subtle red spikes background pattern
      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x + 20, height - 30);
        ctx.lineTo(x + 40, height);
        ctx.fill();
      }

      // Draw Platforms
      for (const pl of plats) {
        ctx.fillStyle = pl.isFake ? '#b91c1c' : '#334155';
        ctx.fillRect(pl.x, pl.y, pl.width, pl.height);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pl.x, pl.y, pl.width, pl.height);
      }

      // Draw Spikes
      for (const spk of spikes) {
        if (spk.hidden) continue;
        ctx.fillStyle = '#ef4444';
        const spikeCount = Math.floor(spk.width / 12);
        for (let k = 0; k < spikeCount; k++) {
          ctx.beginPath();
          ctx.moveTo(spk.x + k * 12, spk.y + spk.height);
          ctx.lineTo(spk.x + k * 12 + 6, spk.y);
          ctx.lineTo(spk.x + (k + 1) * 12, spk.y + spk.height);
          ctx.fill();
        }
      }

      // Draw Goal Door
      ctx.fillStyle = '#eab308';
      ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DOOR', goal.x + goal.width / 2, goal.y + goal.height / 2 + 4);

      // Draw Player Hero Sprite
      drawCardSprite(ctx, playerHeroId, p.x, p.y, p.width, p.height, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#ef4444',
        shadowBlur: 8,
        shadowColor: '#ef4444',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, stage, playerHeroId, handleGameOver]);

  // Touch handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.isTouchActive = true;
    stateRef.current.player.targetX = e.clientX - rect.left - 18;
    triggerJump();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isTouchActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.player.targetX = e.clientX - rect.left - 18;
  };

  const handlePointerUp = () => {
    stateRef.current.isTouchActive = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '레벨 데빌 (악마의 플랫포머)' : 'Level Devil',
      badge: 'MISSION 05',
      description: isKo
        ? '문(DOOR)을 향해 도달하세요! 하지만 방심하지 마세요. 바닥이 꺼지거나 문이 도망치는 얄미운 트랩이 곳곳에 숨겨져 있습니다.'
        : 'Reach the door to escape! Beware of unexpected trolling traps like falling floors and fake doors.',
      keyPoints: isKo
        ? ['숨겨진 함정 파악 및 타이밍 점프', '목표 포털 문 도달 시 클리어', '낚시 트랩 패턴 기억하기']
        : ['Anticipate surprise traps', 'Reach door to clear stage', 'Memorize troll patterns'],
    },
    {
      title: isKo ? '원터치 점프 & 이동' : 'Touch Jump & Move',
      badge: 'TOUCH CONTROLS',
      description: isKo
        ? '화면을 탭하면 즉시 점프하며, 좌우로 드래그하여 정확하게 착지할 수 있습니다.'
        : 'Tap anywhere to jump, and drag left/right to steer your character.',
      keyPoints: isKo
        ? ['원터치 탭: 신속 도약 점프', '좌우 드래그: 섬세한 공중 방향 제어', '한 손으로 100% 플레이 가능']
        : ['Tap: Quick jump', 'Drag: Airborne movement', '100% one-hand friendly'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.05 레벨 데빌' : 'No.05 Level Devil'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`STAGE ${stage}/${totalStages} (데스: ${deaths})`}
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
          <p className="text-xs text-rose-400 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 탭: 점프 | ↔️ 드래그: 이동 | ⚠️ 악마 트랩 주의' : '👆 TAP: JUMP | ↔️ DRAG: MOVE | ⚠️ BEWARE TRAPS'}
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
            setStage(1);
            setDeaths(0);
            setTimeLeft(45);
            initStage(1);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.05 레벨 데빌' : 'No.05 Level Devil'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_leveldevil', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default PokiLevelDevilGame;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiTalkingTomGoldRunGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Obstacle {
  lane: number; // 0, 1, 2
  y: number;
  type: 'barricade' | 'bus';
}

interface GoldBar {
  lane: number;
  y: number;
}

export const PokiTalkingTomGoldRunGame: React.FC<PokiTalkingTomGoldRunGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 13;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [goldCount, setGoldCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_tom_gold_run') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    currentLane: 1, // 0: Left, 1: Center, 2: Right
    playerX: 180,
    playerY: 420,
    isJumping: false,
    jumpOffset: 0,
    jumpVy: 0,
    speed: 5.5,
    obstacles: [] as Obstacle[],
    golds: [] as GoldBar[],
    touchStartPos: { x: 0, y: 0 },
    combo: 0,
  });

  const initGame = useCallback(() => {
    stateRef.current.currentLane = 1;
    stateRef.current.jumpOffset = 0;
    stateRef.current.jumpVy = 0;
    stateRef.current.speed = 5.5;
    stateRef.current.obstacles = [];
    stateRef.current.golds = [];
    setGoldCount(0);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Spawner
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const interval = setInterval(() => {
      const lane = Math.floor(Math.random() * 3);
      stateRef.current.obstacles.push({
        lane,
        y: -50,
        type: Math.random() < 0.3 ? 'bus' : 'barricade',
      });

      // Spawn gold in another lane
      const goldLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
      stateRef.current.golds.push({ lane: goldLane, y: -80 });
      stateRef.current.golds.push({ lane: goldLane, y: -130 });
    }, 1400);
    return () => clearInterval(interval);
  }, [isGameOver, isVictory, showTutorial]);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(score >= 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial, score]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 400 : 80);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_tom_gold_run',
      gameTitle: isKo ? '톰 골드런' : 'Talking Tom Gold Run',
      durationSeconds: 45 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && goldCount >= 35,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, goldCount, isKo, onReward, playSfx]);

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

    const laneWidth = width / 3;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const st = stateRef.current;
      const obs = st.obstacles;
      const golds = st.golds;

      // Target X based on current lane
      const targetX = laneWidth * st.currentLane + laneWidth / 2;
      st.playerX += (targetX - st.playerX) * 0.22;

      // Jump physics
      if (st.isJumping) {
        st.jumpOffset += st.jumpVy;
        st.jumpVy += 0.8;
        if (st.jumpOffset >= 0) {
          st.jumpOffset = 0;
          st.jumpVy = 0;
          st.isJumping = false;
        }
      }

      // Move obstacles down
      for (let i = obs.length - 1; i >= 0; i--) {
        const o = obs[i];
        o.y += st.speed;

        // Collision check with player
        if (
          o.lane === st.currentLane &&
          o.y > st.playerY - 20 &&
          o.y < st.playerY + 30
        ) {
          // If jumping, can jump over barricade
          if (o.type === 'barricade' && st.jumpOffset < -30) {
            // Cleared barricade!
          } else {
            // Crashed!
            handleGameOver(false);
            return;
          }
        }

        if (o.y > height + 50) {
          obs.splice(i, 1);
          setScore(s => s + 20);
        }
      }

      // Move golds down
      for (let i = golds.length - 1; i >= 0; i--) {
        const g = golds[i];
        g.y += st.speed;

        if (
          g.lane === st.currentLane &&
          g.y > st.playerY - 25 &&
          g.y < st.playerY + 35
        ) {
          golds.splice(i, 1);
          setGoldCount(c => c + 1);
          setScore(s => s + 35);
          st.combo++;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          break;
        }

        if (g.y > height + 50) {
          golds.splice(i, 1);
        }
      }

      if (score >= 1000 || goldCount >= 35) {
        handleGameOver(true);
        return;
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // 3-lane Asphalt highway
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);

      // Lane dividers (white dashed lines)
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.moveTo(laneWidth, 0);
      ctx.lineTo(laneWidth, height);
      ctx.moveTo(laneWidth * 2, 0);
      ctx.lineTo(laneWidth * 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Obstacles
      for (const o of obs) {
        const ox = laneWidth * o.lane + laneWidth / 2;
        if (o.type === 'barricade') {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ox - 30, o.y - 12, 60, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🚧 STOP', ox, o.y + 4);
        } else {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(ox - 32, o.y - 30, 64, 60);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🚌 BUS', ox, o.y + 5);
        }
      }

      // Draw Gold Bars
      for (const g of golds) {
        const gx = laneWidth * g.lane + laneWidth / 2;
        ctx.fillStyle = '#facc15';
        ctx.fillRect(gx - 12, g.y - 8, 24, 16);
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(gx - 12, g.y - 8, 24, 16);
      }

      // Draw Player Hero (with jump offset)
      const curY = st.playerY + st.jumpOffset;
      drawCardSprite(ctx, playerHeroId, st.playerX - 20, curY - 20, 40, 40, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#facc15',
        shadowBlur: 8,
        shadowColor: '#facc15',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, score, goldCount, playerHeroId, handleGameOver]);

  // Touch Swipe Handlers (Left/Right lane change, Up to jump)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.touchStartPos = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const dx = e.clientX - stateRef.current.touchStartPos.x;
    const dy = e.clientY - stateRef.current.touchStartPos.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      if (dx > 0) {
        // Swipe Right
        stateRef.current.currentLane = Math.min(2, stateRef.current.currentLane + 1);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else {
        // Swipe Left
        stateRef.current.currentLane = Math.max(0, stateRef.current.currentLane - 1);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    } else if (dy < -30 && !stateRef.current.isJumping) {
      // Swipe Up: Jump
      stateRef.current.isJumping = true;
      stateRef.current.jumpVy = -15;
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'CONTROLS',
      title: isKo ? '톰 골드런 (3레인 러너)' : 'Talking Tom Gold Run',
      description: isKo
        ? '좌우로 스와이프하여 3개 레인을 이동하고, 위로 스와이프하여 바리케이드를 점프해 뛰어넘으세요!'
        : 'Swipe left/right to switch lanes, and swipe up to leap over barricades!',
      keyPoints: isKo ? ['좌우 스와이프 레인 전환', '상향 스와이프 점프', '장애물 충돌 방지'] : ['Swipe left/right', 'Swipe up to jump', 'Avoid barricades'],
    },
    {
      badge: 'GOAL',
      title: isKo ? '금괴 수집 & 스코어 질주' : 'Collect Gold Bars',
      description: isKo
        ? '도둑이 떨어뜨리는 반짝이는 황금 금괴를 35개 이상 수집하여 스테이지를 정복하세요.'
        : 'Collect 35+ gold bars dropped on the highway to achieve victory!',
      keyPoints: isKo ? ['황금 금괴 35개 수집', '연속 주행 콤보', 'SNS 보상 획득'] : ['Collect 35 gold bars', 'Running combo', 'Claim SNS rewards'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.13 톰 골드런' : 'No.13 Tom Gold Run'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`금괴: ${goldCount}개 수집`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Action Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-yellow-400 font-bold tracking-wider animate-pulse">
            {isKo ? '↔️ 스와이프: 레인 변경 | ⬆️ 스와이프: 점프' : '↔️ SWIPE: SWITCH LANE | ⬆️ SWIPE: JUMP'}
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
            setGoldCount(0);
            setTimeLeft(45);
            initGame();
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.13 톰 골드런' : 'No.13 Tom Gold Run'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_tom_gold_run', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default PokiTalkingTomGoldRunGame;

import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCastleBlasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface StackBlock {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export const VoxelCastleBlasterGame: React.FC<VoxelCastleBlasterGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 58;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [currentFloor, setCurrentFloor] = useState<number>(0);
  const targetFloor = 20;
  const [perfectStreak, setPerfectStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streakFeedback, setStreakFeedback] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_sky_stack') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const BLOCK_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
  ];

  const stateRef = useRef({
    blocks: [] as StackBlock[],
    movingBlock: {
      x: 30,
      y: 480,
      width: 180,
      height: 22,
      vx: 180,
      color: '#ef4444',
    },
    floor: 0,
    perfectStreak: 0,
    maxStreak: 0,
    score: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    blockCounter: 1,
    cameraOffsetY: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    const baseBlock: StackBlock = {
      id: 0,
      x: 90,
      y: 500,
      width: 180,
      height: 24,
      color: '#334155',
    };

    s.blocks = [baseBlock];
    s.movingBlock = {
      x: 30,
      y: 476,
      width: 180,
      height: 24,
      vx: 190,
      color: BLOCK_COLORS[0],
    };
    s.floor = 0;
    s.perfectStreak = 0;
    s.maxStreak = 0;
    s.score = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.cameraOffsetY = 0;

    setCurrentFloor(0);
    setPerfectStreak(0);
    setMaxStreak(0);
    setScore(0);
    setStreakFeedback(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Touch / Pointer Direct Tap Stack Handler (Zero Joysticks)
  const handleScreenTap = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const topFixed = s.blocks[s.blocks.length - 1];
    const mb = s.movingBlock;

    // Check overlap with the block directly below
    const left1 = mb.x;
    const right1 = mb.x + mb.width;
    const left2 = topFixed.x;
    const right2 = topFixed.x + topFixed.width;

    const overlapLeft = Math.max(left1, left2);
    const overlapRight = Math.min(right1, right2);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 0) {
      // Missed completely ➔ Game Over
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      endGame(false);
      return;
    }

    const diff = Math.abs(mb.x - topFixed.x);
    const isPerfect = diff <= 4;

    let finalX = overlapLeft;
    let finalWidth = overlapWidth;

    if (isPerfect) {
      // Perfect Snap!
      finalX = topFixed.x;
      finalWidth = topFixed.width;
      s.perfectStreak += 1;
      if (s.perfectStreak > s.maxStreak) s.maxStreak = s.perfectStreak;

      // Expand block if 3+ perfects in a row
      if (s.perfectStreak >= 3) {
        finalWidth = Math.min(220, finalWidth + 10);
        finalX = Math.max(10, finalX - 5);
      }

      s.score += 200 + s.perfectStreak * 50;
      setStreakFeedback(isKo ? `퍼펙트 스택! ${s.perfectStreak} COMBO ⚡` : `PERFECT! ${s.perfectStreak} COMBO ⚡`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      // Sliced overhang
      s.perfectStreak = 0;
      s.score += 100;
      setStreakFeedback(null);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
    setTimeout(() => setStreakFeedback(null), 500);

    const newFixedBlock: StackBlock = {
      id: s.blockCounter++,
      x: finalX,
      y: mb.y,
      width: finalWidth,
      height: mb.height,
      color: mb.color,
    };
    s.blocks.push(newFixedBlock);

    s.floor += 1;
    setCurrentFloor(s.floor);
    setPerfectStreak(s.perfectStreak);
    setMaxStreak(s.maxStreak);
    setScore(s.score);

    // Check Victory (20 Floors reached)
    if (s.floor >= targetFloor) {
      endGame(true);
      return;
    }

    // Spawn Next Moving Block
    const nextY = mb.y - mb.height;
    const nextSpeed = (190 + s.floor * 12) * (s.floor % 2 === 0 ? 1 : -1);
    s.movingBlock = {
      x: nextSpeed > 0 ? 10 : 350 - finalWidth,
      y: nextY,
      width: finalWidth,
      height: mb.height,
      vx: nextSpeed,
      color: BLOCK_COLORS[s.floor % BLOCK_COLORS.length],
    };

    // Smooth Camera Scroll Upwards
    if (s.floor > 5) {
      s.cameraOffsetY = (s.floor - 5) * mb.height;
    }
  };

  // Main 60FPS Stack Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Update Moving Block X position
      const mb = s.movingBlock;
      mb.x += mb.vx * dt;

      if (mb.x < 10) {
        mb.x = 10;
        mb.vx *= -1;
      } else if (mb.x + mb.width > 350) {
        mb.x = 350 - mb.width;
        mb.vx *= -1;
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Sunset Sky Horizon Gradient Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(0, s.cameraOffsetY);

      // Grid Guide Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h + s.cameraOffsetY; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Render Fixed Stack Blocks
      s.blocks.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
      });

      // Render Moving Block
      ctx.fillStyle = mb.color;
      ctx.fillRect(mb.x, mb.y, mb.width, mb.height);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(mb.x, mb.y, mb.width, mb.height);

      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const endGame = (isWin: boolean) => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);

    if (isWin) {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_sky_stack',
      gameTitle: '블리츠 스카이 스택',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : s.floor * 120) + s.maxStreak * 80,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.floor >= 10,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 20층 타워 완성' : 'STEP 1: REACH 20 FLOORS',
      title: isKo ? '타이밍에 맞춰 탭하여 블록을 쌓으세요' : 'Tap to Stack Blocks to the Sky',
      description: isKo
        ? '가상 조이스틱 없이 좌우로 움직이는 블록을 화면 터치 한 번으로 정확한 위치에 착지시켜 20층 스카이 타워를 건설하세요.'
        : 'Tap anywhere on screen to snap moving blocks onto the tower and reach 20 floors.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 원터치 탭)',
            '퍼펙트 스택 성공 시 콤보 배수 및 블록 크기 확장',
            '삐져나온 부분은 잘려나가며 20층 도달 시 완승'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Screen Tap',
            'Consecutive perfect stacks enlarge block width',
            'Overhanging edges slice off; reach floor 20 to win'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 어디든 원터치 탭 (Single Tap)' : 'One-Touch Screen Tap',
      description: isKo
        ? '블록이 정렬된 순간 화면 아무 곳이나 가볍게 탭합니다.'
        : 'Simply tap anywhere when the block aligns with the tower.',
      keyPoints: isKo
        ? [
            '👆 원터치 탭: 즉각적인 물리 착지 & 슬라이스',
            '⚡ 층수가 높아질수록 빨라지는 스피드 스릴',
            '🏙️ 카메라 자동 수직 트래킹 스크롤'
          ]
        : [
            '👆 Single Tap: Instant landing & slicing physics',
            '⚡ Progressive speed increase on higher floors',
            '🏙️ Smooth automated vertical camera scrolling'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '타워 등반 완수 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '달성 층수 및 퍼펙트 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Height floors and perfect combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      onClick={handleScreenTap}
      className="relative w-full h-[100dvh] bg-[#090e17] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none cursor-pointer"
    >
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <MinimalistMissionHUD
          title={isKo ? '블리츠 스카이 스택' : 'Blitz Sky Stack'}
          language={(language as Language) || 'ko'}
          telemetries={[
            { label: isKo ? '층수' : 'Floor', value: `${currentFloor}/${targetFloor}F`, color: 'text-amber-400 font-bold text-base' },
            { label: isKo ? '퍼펙트' : 'Combo', value: `${perfectStreak}x`, color: perfectStreak >= 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
            { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-300 font-bold' }
          ]}
          onExit={onExit}
          onHelp={() => setShowTutorial(true)}
          onPauseToggle={() => setIsPaused(prev => !prev)}
          isPaused={isPaused}
        />
      </div>

      {/* Pure Touch Stacking Tower Canvas Viewport */}
      <div className="flex-1 w-full max-w-sm relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          className="w-full h-full object-contain touch-none shadow-2xl"
        />

        {/* Floating Streak Feedback */}
        {streakFeedback && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-xl font-bold text-amber-300 drop-shadow-lg animate-bounce">
            {streakFeedback}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 탭하여 블록을 아래 타워에 쌓으세요 (퍼펙트 시 크기 확장)' : 'Tap anywhere to stack blocks (Perfects expand width)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <div onClick={(e) => e.stopPropagation()}>
          <UniversalTutorialModal
            gameId="arcade_sky_stack"
            gameTitle={isKo ? '블리츠 스카이 스택: 물리 타워' : 'Blitz Sky Stack: Physics Tower'}
            customSteps={tutorialSteps}
            language={(language as Language) || 'ko'}
            onStartGame={() => setShowTutorial(false)}
            onClose={() => setShowTutorial(false)}
          />
        </div>
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <div onClick={(e) => e.stopPropagation()}>
          <VictoryRewardModal
            receipt={settlementReceipt}
            language={(language as Language) || 'ko'}
            onPlayAgain={initGame}
            onExit={onExit}
          />
        </div>
      )}
    </div>
  );
};
export default VoxelCastleBlasterGame;

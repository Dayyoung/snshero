import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBaseballDerbyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface FlyingItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'fruit' | 'bomb' | 'gem';
  icon: string;
  radius: number;
  sliced: boolean;
  points: number;
}

interface SliceTrailPoint {
  x: number;
  y: number;
  time: number;
}

export const VoxelBaseballDerbyGame: React.FC<VoxelBaseballDerbyGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 80;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(35);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_slice_ninja') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    items: [] as FlyingItem[],
    trail: [] as SliceTrailPoint[],
    isSlicing: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    itemCounter: 1,
    spawnTimer: 0,
  });

  const FRUIT_ICONS = ['🍎', '🍉', '🍊', '🍓', '🍍', '🥝'];

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.items = [];
    s.trail = [];
    s.isSlicing = false;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.lives = 3;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.itemCounter = 1;
    s.spawnTimer = 0;

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(3);
    setTimeLeft(35);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch / Pointer Slice Gesture Handlers (Pure Mobile Finger Slice)
  const checkSliceCollision = (x1: number, y1: number, x2: number, y2: number) => {
    const s = stateRef.current;
    let slicedInThisSwipe = 0;

    s.items.forEach((item) => {
      if (item.sliced) return;

      // Line segment to point distance check
      const lineLen = Math.hypot(x2 - x1, y2 - y1);
      if (lineLen === 0) return;

      const u = ((item.x - x1) * (x2 - x1) + (item.y - y1) * (y2 - y1)) / (lineLen * lineLen);
      const clampedU = Math.max(0, Math.min(1, u));
      const nearestX = x1 + clampedU * (x2 - x1);
      const nearestY = y1 + clampedU * (y2 - y1);
      const dist = Math.hypot(item.x - nearestX, item.y - nearestY);

      if (dist < item.radius + 10) {
        item.sliced = true;

        if (item.type === 'bomb') {
          // Hit Bomb!
          s.lives -= 1;
          s.combo = 0;
          setLives(s.lives);
          setCombo(0);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          if (s.lives <= 0) {
            endGame();
          }
        } else {
          // Sliced Fruit or Gem!
          slicedInThisSwipe += 1;
          s.score += item.points;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      }
    });

    if (slicedInThisSwipe > 0) {
      s.combo += slicedInThisSwipe;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;
      setScore(s.score + (s.combo > 3 ? s.combo * 50 : 0));
      setCombo(s.combo);
      setMaxCombo(s.maxCombo);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    s.isSlicing = true;
    s.trail = [{ x, y, time: performance.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isSlicing || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const prevPoint = s.trail[s.trail.length - 1];
    if (prevPoint) {
      checkSliceCollision(prevPoint.x, prevPoint.y, x, y);
    }

    s.trail.push({ x, y, time: performance.now() });
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    s.isSlicing = false;
  };

  // Main 60FPS Slice Engine Loop
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

      // Spawn Flying Items
      s.spawnTimer += dt;
      if (s.spawnTimer >= 0.85 && s.items.length < 7) {
        s.spawnTimer = 0;
        const count = 1 + Math.floor(Math.random() * 2);

        for (let k = 0; k < count; k++) {
          const isBomb = Math.random() < 0.22;
          const isGem = !isBomb && Math.random() < 0.15;
          const fruit = FRUIT_ICONS[Math.floor(Math.random() * FRUIT_ICONS.length)];

          s.items.push({
            id: s.itemCounter++,
            x: 60 + Math.random() * 240,
            y: 520,
            vx: (Math.random() - 0.5) * 120,
            vy: -(380 + Math.random() * 120),
            type: isBomb ? 'bomb' : isGem ? 'gem' : 'fruit',
            icon: isBomb ? '💣' : isGem ? '💎' : fruit,
            radius: 22,
            sliced: false,
            points: isGem ? 300 : 100,
          });
        }
      }

      // Update Items Physics
      const gravity = 480;
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.vy += gravity * dt;

        // Remove fallen items
        if (item.y > 560 && item.vy > 0) {
          if (!item.sliced && item.type === 'fruit') {
            s.combo = 0;
            setCombo(0);
          }
          s.items.splice(i, 1);
        }
      }

      // Trim old slice trail
      const trailExpire = now - 180;
      s.trail = s.trail.filter((p) => p.time >= trailExpire);

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dojo Wood Texture Background
      ctx.fillStyle = '#1c130e';
      ctx.fillRect(0, 0, w, h);

      // Subtle Dojo Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Render Flying Items
      s.items.forEach((item) => {
        if (item.sliced) {
          // Half 1
          ctx.font = `${item.radius * 1.3}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.save();
          ctx.translate(item.x - 12, item.y);
          ctx.rotate(-0.3);
          ctx.fillText(item.icon, 0, 0);
          ctx.restore();

          // Half 2
          ctx.save();
          ctx.translate(item.x + 12, item.y);
          ctx.rotate(0.3);
          ctx.fillText(item.icon, 0, 0);
          ctx.restore();
        } else {
          ctx.font = `${item.radius * 1.6}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.icon, item.x, item.y);
        }
      });

      // Render Blade Slice Trail (Glowing Katana Slash)
      if (s.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.trail[0].x, s.trail[0].y);
        for (let i = 1; i < s.trail.length; i++) {
          ctx.lineTo(s.trail[i].x, s.trail[i].y);
        }

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const endGame = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_slice_ninja',
      gameTitle: '블리츠 슬라이스 닌자',
      durationSeconds: duration,
      score: s.score + s.maxCombo * 80,
      difficulty: 'NIGHTMARE',
      isVictory: s.score >= 1800,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 화면을 손가락으로 베어내기' : 'STEP 1: SLICE WITH FINGER',
      title: isKo ? '과일을 베고 폭탄을 피하세요' : 'Slice Fruits & Avoid Bombs',
      description: isKo
        ? '가상 조이스틱 없이 튀어오르는 과일과 보석을 손가락으로 슥 베어 가르고, 폭탄은 피하세요.'
        : 'Slice flying fruits and gems with your finger while dodging dangerous bombs.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 슬라이스)',
            '한 번의 스와이프로 여러 개를 베면 콤보 가산',
            '폭탄(💣)을 베면 생명이 감소합니다.'
          ]
        : [
            'Zero Virtual Joysticks: 100% Mobile Touch Slice',
            'Slice multiple fruits in one swipe for combo bonus',
            'Slicing a bomb (💣) costs 1 life'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 스와이프 슬라이스' : 'Direct Screen Touch Slice',
      description: isKo
        ? '손가락을 화면에 대고 빠르게 슥 그어 카타나 검기를 날립니다.'
        : 'Swipe quickly across the screen to slice incoming objects.',
      keyPoints: isKo
        ? [
            '👆 손가락 스와이프: 실시간 부드러운 검기 궤적',
            '⚡ 콤보 연계: 연속 베기로 피버 잭팟 점수 획득',
            '💎 다이아몬드 보석 베기 시 300P 대량 보너스'
          ]
        : [
            '👆 Touch Swipe: Fluid glowing katana blade trails',
            '⚡ Chain Combos: Consecutive slices yield fever points',
            '💎 Slice Diamonds for 300P massive bonus'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '시간 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '최종 점수 및 맥스 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Score and max combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#120a06] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 슬라이스 닌자' : 'Blitz Slice Ninja'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '생명' : 'Life', value: '❤️'.repeat(lives), color: 'text-rose-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${combo}x`, color: combo > 3 ? 'text-amber-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-400 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Slice Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair"
        />
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 손가락으로 슥 그어 과일을 베어내세요 (폭탄 주의!)' : 'Swipe across screen to slice fruits (Avoid bombs!)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_slice_ninja"
          gameTitle={isKo ? '블리츠 슬라이스 닌자: 슬라이스 액션' : 'Blitz Slice Ninja: Slice Action'}
          customSteps={tutorialSteps}
          language={(language as Language) || 'ko'}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={(language as Language) || 'ko'}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default VoxelBaseballDerbyGame;

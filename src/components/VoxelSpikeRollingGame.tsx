import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSpikeRollingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface CrushTarget {
  id: number;
  x: number;
  y: number;
  type: 'golem' | 'wall' | 'gem' | 'tnt';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  crushed: boolean;
}

export const VoxelSpikeRollingGame: React.FC<VoxelSpikeRollingGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 105;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [targetsCrushed, setTargetsCrushed] = useState<number>(0);
  const [boulderLevel, setBoulderLevel] = useState<number>(1);
  const maxBoulderLevel = 5;
  const [score, setScore] = useState<number>(0);
  const [crushCombo, setCrushCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_spike_roller') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const rollerY = 410;

  const stateRef = useRef({
    rollerX: 180,
    targetRollerX: 180,
    rollerAngle: 0,
    boulderLevel: 1,
    targets: [] as CrushTarget[],
    targetsCrushed: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    targetCounter: 1,
    spawnTimer: 0,
    speed: 400,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.rollerX = 180;
    s.targetRollerX = 180;
    s.rollerAngle = 0;
    s.boulderLevel = 1;
    s.targets = [];
    s.targetsCrushed = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.targetCounter = 1;
    s.spawnTimer = 0;
    s.speed = 400;
    s.particles = [];

    // Initial crush targets
    s.targets.push(
      { id: s.targetCounter++, x: 100, y: 140, type: 'golem', cardId: 78, icon: '🗿', points: 400, radius: 26, crushed: false },
      { id: s.targetCounter++, x: 260, y: 220, type: 'gem', cardId: 100, icon: '💎', points: 300, radius: 20, crushed: false }
    );

    setTargetsCrushed(0);
    setBoulderLevel(1);
    setScore(0);
    setCrushCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
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
          const isTargetMet = stateRef.current.targetsCrushed >= 10;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Horizontal Touch Drag Handlers (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetRollerX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetRollerX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  // Main 60FPS Spike Roller Loop
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

      // Roller Movement & Rotation
      s.rollerX += (s.targetRollerX - s.rollerX) * Math.min(1, dt * 22);
      s.rollerAngle += dt * 10;

      // Spawn Crush Targets
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.7) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isTnt = rand < 0.2;
        const isGolem = rand >= 0.2 && rand < 0.5;
        const isGem = rand >= 0.5 && rand < 0.7;
        const cardId = isTnt ? 55 : (isGolem ? 78 : (isGem ? 100 : 34));

        s.targets.push({
          id: s.targetCounter++,
          x: 50 + Math.random() * 260,
          y: -40,
          type: isTnt ? 'tnt' : (isGolem ? 'golem' : (isGem ? 'gem' : 'wall')),
          cardId,
          icon: isTnt ? '🧨' : (isGolem ? '🗿' : (isGem ? '💎' : '🧱')),
          points: isTnt ? 800 : (isGolem ? 400 : (isGem ? 300 : 250)),
          radius: isTnt ? 24 : (isGolem ? 26 : 22),
          crushed: false,
        });
      }

      // Move Targets Downward
      const currentRollerRadius = 24 + (s.boulderLevel - 1) * 5;

      for (let i = s.targets.length - 1; i >= 0; i--) {
        const t = s.targets[i];
        t.y += s.speed * dt;

        if (!t.crushed && Math.hypot(t.x - s.rollerX, t.y - rollerY) < t.radius + currentRollerRadius) {
          t.crushed = true;
          s.targetsCrushed += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          // Level up boulder every 4 crushed items
          if (s.targetsCrushed % 4 === 0 && s.boulderLevel < maxBoulderLevel) {
            s.boulderLevel += 1;
            setBoulderLevel(s.boulderLevel);
            s.score += 1000;
            setFeedbackText(`🎉 BOULDER EXPANDED TO LV.${s.boulderLevel}! +1000P 🎉`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          } else {
            const pts = t.points + s.combo * 35;
            s.score += pts;
            setFeedbackText(`CRUSHED! ${t.icon} +${pts}P 💥`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }

          setTargetsCrushed(s.targetsCrushed);
          setScore(s.score);
          setCrushCombo(s.combo);
          setMaxCombo(s.maxCombo);
          setTimeout(() => setFeedbackText(null), 300);

          // Crush Rock / Spark Particles
          for (let p = 0; p < 12; p++) {
            s.particles.push({
              x: s.rollerX,
              y: rollerY,
              vx: (Math.random() - 0.5) * 240,
              vy: (Math.random() - 0.5) * 240,
              color: t.type === 'tnt' ? '#ef4444' : (t.type === 'gem' ? '#06b6d4' : '#f59e0b'),
              life: 0.4,
            });
          }
        }

        if (t.y > 540) {
          s.targets.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Lava Dungeon Stone Road Gradient
      const lavaGrad = ctx.createLinearGradient(0, 0, 0, h);
      lavaGrad.addColorStop(0, '#1c1917');
      lavaGrad.addColorStop(0.5, '#292524');
      lavaGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(0, 0, w, h);

      // Dungeon Road Track Borders
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 0, w - 40, h);

      // Render Targets (Card Sprites)
      s.targets.forEach((t) => {
        if (!t.crushed) {
          ctx.save();
          ctx.translate(t.x, t.y);

          drawCardSprite(
            ctx,
            t.cardId,
            -t.radius,
            -t.radius,
            t.radius * 2,
            t.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: t.type === 'tnt' ? '#ef4444' : (t.type === 'gem' ? '#06b6d4' : '#f59e0b'),
              shadowBlur: t.type === 'tnt' || t.type === 'gem' ? 16 : 6,
              shadowColor: t.type === 'tnt' ? 'rgba(239, 68, 68, 0.9)' : (t.type === 'gem' ? 'rgba(6, 182, 212, 0.9)' : 'rgba(245, 158, 11, 0.8)'),
            }
          );

          ctx.restore();
        }
      });

      // Render Giant Spike Roller (Player Hero Badge)
      const renderRollerRadius = 24 + (s.boulderLevel - 1) * 5;
      ctx.save();
      ctx.translate(s.rollerX, rollerY);
      ctx.rotate(s.rollerAngle);

      drawCardSprite(
        ctx,
        playerHeroId,
        -renderRollerRadius,
        -renderRollerRadius,
        renderRollerRadius * 2,
        renderRollerRadius * 2,
        {
          circleClip: true,
          borderWidth: 2.5,
          borderColor: '#f59e0b',
          shadowBlur: 18,
          shadowColor: 'rgba(245, 158, 11, 0.9)',
        }
      );

      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [rollerY, playSfx, playerHeroId]);

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
      gameId: 'arcade_spike_roller',
      gameTitle: '블리츠 스파이크 롤러',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.targetsCrushed * 300 + s.boulderLevel * 400)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.targetsCrushed >= 10,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 좌우 드래그 파괴 진격' : 'STEP 1: DRAG CRUSH & SMASH',
      title: isKo ? '스파이크 볼을 좌우로 드래그해 골렘과 벽을 짓밟으세요' : 'Drag spike boulder left & right to crush golems and stone walls',
      description: isKo
        ? '가상 조이스틱 없이 화면의 거대 스파이크 볼(⚙️)을 손가락으로 직접 좌우 드래그하여 골렘(🗿), 방어벽(🧱), TNT(🧨)를 닥치는 대로 분쇄 파괴하고 크기를 키우세요.'
        : 'Slide left and right to roll the massive spiked boulder to crush golems and blast obstacles.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그)',
            'TNT(🧨) 폭파 및 바위 Lv.5 확장 시 1,000P 잭팟',
            '35초간 최대 콤보로 전방을 초토화하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Horizontal Drag',
            'TNT Barrels and Lv.5 Boulder grant 1,000P smash jackpots',
            'Crush all obstacles with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 좌우 드래그 (Horizontal Drag)' : 'Horizontal Drag Gesture',
      description: isKo
        ? '손가락을 좌우로 밀어 거대 바위의 분쇄 라인을 제어합니다.'
        : 'Slide your thumb left and right smoothly across the road.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 60FPS 즉각 반응 초강력 물리 분쇄',
            '💥 연속 파괴 시 스파이크 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant fluid boulder control',
            '💥 Consecutive smashes grant combo multipliers',
            '⏱️ 35s time attack spike roller sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '돌파 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '파괴한 오브젝트 수 및 바위 레벨 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Crushed objects count and boulder level multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1c1917] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 스파이크 롤러' : 'Blitz Spike Roller'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '파괴' : 'Crushed', value: `${targetsCrushed}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '바위' : 'Size', value: `Lv.${boulderLevel}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Spike Roller Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '손가락으로 스파이크 볼을 좌우 드래그해 골렘과 벽을 분쇄 파괴하세요' : 'Drag spike boulder left & right to crush golems and walls'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_spike_roller"
          gameTitle={isKo ? '블리츠 스파이크: 바위 분쇄 러너' : 'Blitz Spike: Boulder Crusher'}
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
export default VoxelSpikeRollingGame;

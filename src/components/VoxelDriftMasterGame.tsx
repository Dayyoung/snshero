import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDriftMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface TrackCorner {
  id: number;
  x: number;
  y: number;
  radius: number;
  passed: boolean;
}

export const VoxelDriftMasterGame: React.FC<VoxelDriftMasterGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 44;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [driftCornersCount, setDriftCornersCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [driftCombo, setDriftCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_sling_drift') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    carX: 180,
    carY: 420,
    carAngle: -Math.PI / 2, // Facing up
    speed: 260,
    isHolding: false,
    activeCorner: null as TrackCorner | null,
    corners: [] as TrackCorner[],
    driftCount: 0,
    score: 0,
    driftCombo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    cornerCounter: 1,
    spawnTimer: 0,
    scrollOffset: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.carX = 180;
    s.carY = 420;
    s.carAngle = -Math.PI / 2;
    s.speed = 260;
    s.isHolding = false;
    s.activeCorner = null;
    s.corners = [
      { id: 1, x: 180, y: 220, radius: 55, passed: false },
      { id: 2, x: 180, y: 20, radius: 55, passed: false },
    ];
    s.driftCount = 0;
    s.score = 0;
    s.driftCombo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.cornerCounter = 3;
    s.spawnTimer = 0;
    s.scrollOffset = 0;

    setDriftCornersCount(0);
    setScore(0);
    setDriftCombo(0);
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
          endGame(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch / Pointer Hold & Release Drift Action (Zero Joysticks)
  const handlePointerDown = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    s.isHolding = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    if (s.isHolding && s.activeCorner) {
      // Released Sling Shot Boost!
      s.driftCombo += 1;
      if (s.driftCombo > s.maxCombo) s.maxCombo = s.driftCombo;

      const pts = 150 + s.driftCombo * 40;
      s.score += pts;
      s.driftCount += 1;

      setScore(s.score);
      setDriftCombo(s.driftCombo);
      setMaxCombo(s.maxCombo);
      setDriftCornersCount(s.driftCount);

      setFeedbackText(`PERFECT DRIFT! +${pts}P ⚡`);
      setTimeout(() => setFeedbackText(null), 400);

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      s.activeCorner.passed = true;
      s.activeCorner = null;
    }

    s.isHolding = false;
  };

  // Main 60FPS Sling Drift Engine Loop
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

      // Find nearest upcoming anchor corner
      if (!s.activeCorner) {
        for (const c of s.corners) {
          if (!c.passed && Math.hypot(c.x - s.carX, c.y - s.carY) < 110) {
            s.activeCorner = c;
            break;
          }
        }
      }

      // Physics Motion
      if (s.isHolding && s.activeCorner) {
        // Orbit around anchor corner (Drift Tether)
        const dx = s.carX - s.activeCorner.x;
        const dy = s.carY - s.activeCorner.y;
        let angle = Math.atan2(dy, dx);

        const angularSpeed = 4.2; // Rad/s
        angle += angularSpeed * dt;

        s.carX = s.activeCorner.x + Math.cos(angle) * s.activeCorner.radius;
        s.carY = s.activeCorner.y + Math.sin(angle) * s.activeCorner.radius;
        s.carAngle = angle + Math.PI / 2; // Tangent heading
      } else {
        // Linear Forward Motion
        s.carX += Math.cos(s.carAngle) * s.speed * dt;
        s.carY += Math.sin(s.carAngle) * s.speed * dt;
      }

      // Track Scroll down when car moves up
      const targetScreenY = 380;
      if (s.carY < targetScreenY) {
        const scrollDist = (targetScreenY - s.carY);
        s.carY = targetScreenY;

        s.corners.forEach((c) => {
          c.y += scrollDist;
        });
      }

      // Spawn Next Corners
      const highestCornerY = s.corners.reduce((minY, c) => Math.min(minY, c.y), 500);
      if (highestCornerY > -100) {
        const nextX = 100 + Math.random() * 160;
        s.corners.push({
          id: s.cornerCounter++,
          x: nextX,
          y: highestCornerY - 200,
          radius: 55,
          passed: false,
        });
      }

      // Remove offscreen corners
      for (let i = s.corners.length - 1; i >= 0; i--) {
        if (s.corners[i].y > 580) {
          s.corners.splice(i, 1);
        }
      }

      // Boundary Crash Check (Off Track)
      if (s.carX < 30 || s.carX > 330) {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        endGame(false);
        return;
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Neon Cyber Track Background
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, w, h);

      // Road Borders
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(35, 0);
      ctx.lineTo(35, h);
      ctx.moveTo(w - 35, 0);
      ctx.lineTo(w - 35, h);
      ctx.stroke();

      // Render Anchor Corners (⚓)
      s.corners.forEach((c) => {
        ctx.fillStyle = c.passed ? '#334155' : '#0284c7';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Track Anchor Card Sprite Emblem
        drawCardSprite(
          ctx,
          18,
          c.x - 12,
          c.y - 12,
          24,
          24,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: s.activeCorner?.id === c.id ? '#fde047' : '#38bdf8',
            shadowBlur: 8,
            shadowColor: s.activeCorner?.id === c.id ? 'rgba(253, 224, 71, 0.9)' : 'rgba(56, 189, 248, 0.7)',
          }
        );

        // Drift Tether Line if Holding
        if (s.isHolding && s.activeCorner && s.activeCorner.id === c.id) {
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(s.carX, s.carY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Render Drift Skid Marks
      if (s.isHolding && s.activeCorner) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
        ctx.beginPath();
        ctx.arc(s.carX, s.carY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Player Sports Car
      ctx.save();
      ctx.translate(s.carX, s.carY);
      ctx.rotate(s.carAngle + Math.PI / 2);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(-12, -20, 24, 40, 4);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hero Driver Emblem on Car
      drawCardSprite(
        ctx,
        playerHeroId,
        -9,
        -9,
        18,
        18,
        {
          circleClip: true,
          borderWidth: 1,
          borderColor: '#ffffff',
          shadowBlur: 6,
          shadowColor: 'rgba(244, 63, 94, 0.8)',
        }
      );

      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx, playerHeroId]);

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
      gameId: 'arcade_sling_drift',
      gameTitle: '블리츠 슬링 드리프트',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : s.driftCount * 300) + s.maxCombo * 70,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.driftCount >= 10,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 원터치 슬링 드리프트' : 'STEP 1: SLING DRIFT',
      title: isKo ? '화면을 꾹 눌러 코너를 드리프트하세요' : 'Hold Screen to Sling Drift Around Anchors',
      description: isKo
        ? '가상 조이스틱 없이 차량이 앵커(⚓)에 다가갈 때 화면을 꾹 누르고 있으면 줄을 걸고 드리프트하며, 손을 떼면 직선으로 부스터 사출됩니다.'
        : 'Hold anywhere to tether to the anchor and drift, then release in time to launch forward.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 원터치 홀드 & 릴리즈)',
            '완벽한 각도에서 손을 떼면 PERFECT DRIFT 콤보',
            '트랙 벽 충돌 없이 35초간 최대 코너를 통과하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% One-Touch Hold & Release',
            'Release at the perfect tangent for PERFECT DRIFT combos',
            'Survive 35s of high-speed drifting without wall crashing'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 길게 누르기 & 손 떼기 (Hold & Release)' : 'Hold & Release Screen',
      description: isKo
        ? '화면 아무 곳이나 꾹 누르고 있다가 코너 탈출 시 손을 뗍니다.'
        : 'Simply press and hold on corners, then release into the straightaway.',
      keyPoints: isKo
        ? [
            '👆 홀드 & 릴리즈: 실시간 앵커 테더 물리 궤적',
            '⚡ 연속 코너링 콤보로 피버 스코어 잭팟 획득',
            '🏎️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Hold & Release: Real-time tether physics trajectory',
            '⚡ High drift combos grant massive bonus scores',
            '🏎️ 35s time attack high-score sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '레이스 완주 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '통과 코너 수 및 드리프트 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Cleared corners and drift combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative w-full h-[100dvh] bg-[#070913] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none cursor-pointer"
    >
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <MinimalistMissionHUD
          title={isKo ? '블리츠 슬링 드리프트' : 'Blitz Sling Drift'}
          language={(language as Language) || 'ko'}
          telemetries={[
            { label: isKo ? '코너' : 'Corners', value: `${driftCornersCount}회`, color: 'text-amber-400 font-bold' },
            { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
            { label: isKo ? '드리프트' : 'Combo', value: `${driftCombo}x`, color: driftCombo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
            { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
          ]}
          onExit={onExit}
          onHelp={() => setShowTutorial(true)}
          onPauseToggle={() => setIsPaused(prev => !prev)}
          isPaused={isPaused}
        />
      </div>

      {/* Pure Touch Sling Drift Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          className="w-full h-full object-contain touch-none shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-xl font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 꾹 누르면 드리프트, 손을 떼면 사출됩니다' : 'Hold screen to drift around anchor, release to launch'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <div onClick={(e) => e.stopPropagation()}>
          <UniversalTutorialModal
            gameId="arcade_sling_drift"
            gameTitle={isKo ? '블리츠 슬링 드리프트: 원터치 레이싱' : 'Blitz Sling Drift: One-Touch Racing'}
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
export default VoxelDriftMasterGame;

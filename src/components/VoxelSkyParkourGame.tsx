import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSkyParkourGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SkyStep {
  id: number;
  lane: number; // 0: Left, 1: Center, 2: Right
  y: number;
  type: 'normal' | 'cloud' | 'gem' | 'goal';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
}

export const VoxelSkyParkourGame: React.FC<VoxelSkyParkourGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 26;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [stepsClimbed, setStepsClimbed] = useState<number>(0);
  const maxSteps = 25;
  const [score, setScore] = useState<number>(0);
  const [parkourCombo, setParkourCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_sky_parkour') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const laneX = [90, 180, 270];

  const stateRef = useRef({
    steps: [] as SkyStep[],
    currentStepIdx: 0,
    playerLane: 1,
    playerY: 420,
    jumpAnim: 0,
    stepsClimbed: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const setupSkySteps = useCallback(() => {
    const steps: SkyStep[] = [];
    let curLane = 1;

    for (let i = 0; i < maxSteps; i++) {
      if (i > 0) {
        // Random step in adjacent or same lane
        const choices = [0, 1, 2].filter((l) => Math.abs(l - curLane) <= 1);
        curLane = choices[Math.floor(Math.random() * choices.length)];
      }

      const isGoal = i === maxSteps - 1;
      const isGem = (i + 1) % 4 === 0;
      const isCloud = (i + 1) % 3 === 0;
      const cardId = isGoal ? 83 : (isGem ? 100 : (isCloud ? 92 : 34));

      steps.push({
        id: i + 1,
        lane: curLane,
        y: 420 - i * 75,
        type: isGoal ? 'goal' : (isGem ? 'gem' : (isCloud ? 'cloud' : 'normal')),
        cardId,
        icon: isGoal ? '🏆' : (isGem ? '💎' : (isCloud ? '☁️' : '🧱')),
        points: isGoal ? 1500 : (isGem ? 400 : 250),
        radius: 28,
      });
    }
    return steps;
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.steps = setupSkySteps();
    s.currentStepIdx = 0;
    s.playerLane = s.steps[0].lane;
    s.playerY = 420;
    s.jumpAnim = 0;
    s.stepsClimbed = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.particles = [];

    setStepsClimbed(0);
    setScore(0);
    setParkourCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [setupSkySteps]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          const isTargetMet = stateRef.current.stepsClimbed >= 15;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Tap Platform Jump (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    const tapX = (e.clientX - rect.left) * scaleX;

    // Detect tapped lane (0, 1, 2)
    let tappedLane = 1;
    if (tapX < 135) tappedLane = 0;
    else if (tapX > 225) tappedLane = 2;

    const nextStep = s.steps[s.currentStepIdx + 1];

    if (nextStep && nextStep.lane === tappedLane) {
      // Correct step jump!
      s.currentStepIdx += 1;
      s.playerLane = tappedLane;
      s.jumpAnim = 1;
      s.stepsClimbed += 1;
      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      const pts = nextStep.points + s.combo * 40;
      s.score += pts;

      setStepsClimbed(s.stepsClimbed);
      setScore(s.score);
      setParkourCombo(s.combo);
      setMaxCombo(s.maxCombo);

      setFeedbackText(`PERFECT JUMP! ${nextStep.icon} +${pts}P ✨`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      setTimeout(() => setFeedbackText(null), 300);

      // Jump Sparkles
      for (let p = 0; p < 8; p++) {
        s.particles.push({
          x: laneX[tappedLane],
          y: s.playerY,
          vx: (Math.random() - 0.5) * 200,
          vy: -Math.random() * 150,
          color: '#38bdf8',
          life: 0.4,
        });
      }

      if (nextStep.type === 'goal' || s.stepsClimbed >= maxSteps) {
        endGame(true);
      }
    } else {
      // Wrong lane miss
      s.combo = 0;
      setParkourCombo(0);
      setFeedbackText(isKo ? '발판 빗나감! ❌' : 'MISSED PLATFORM! ❌');
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setTimeout(() => setFeedbackText(null), 300);
    }
  };

  // Main 60FPS Sky Parkour Loop
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

      if (s.jumpAnim > 0) s.jumpAnim -= dt * 5;

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

      // Sky Blue Atmosphere Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.5, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Camera Follow Y (Smooth Scrolling)
      const scrollOffsetY = s.currentStepIdx * 75;

      // Render 3 Lane Guidelines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      laneX.forEach((lx) => {
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, h);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Render Sky Steps
      s.steps.forEach((st, idx) => {
        const renderY = st.y + scrollOffsetY;
        if (renderY > -50 && renderY < h + 50) {
          ctx.save();
          ctx.translate(laneX[st.lane], renderY);

          const isCurrent = idx === s.currentStepIdx;
          const isNext = idx === s.currentStepIdx + 1;

          drawCardSprite(
            ctx,
            st.cardId,
            -st.radius,
            -st.radius,
            st.radius * 2,
            st.radius * 2,
            {
              circleClip: true,
              borderWidth: isNext ? 2.5 : 1.5,
              borderColor: isNext ? '#fde047' : (isCurrent ? '#34d399' : '#94a3b8'),
              shadowBlur: isNext ? 18 : 6,
              shadowColor: isNext ? 'rgba(253, 224, 71, 0.9)' : (isCurrent ? 'rgba(52, 211, 153, 0.8)' : 'rgba(148, 163, 184, 0.5)'),
            }
          );

          ctx.restore();
        }
      });

      // Render Parkour Hero (Jumping Animation, Player Hero Badge)
      const curX = laneX[s.playerLane];
      const jumpOffset = Math.sin(s.jumpAnim * Math.PI) * 22;

      ctx.save();
      ctx.translate(curX, s.playerY - jumpOffset);

      drawCardSprite(
        ctx,
        playerHeroId,
        -20,
        -20,
        40,
        40,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#fde047',
          shadowBlur: 18,
          shadowColor: 'rgba(253, 224, 71, 0.9)',
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
  }, [laneX, playerHeroId]);

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
      gameId: 'arcade_sky_parkour',
      gameTitle: '블리츠 스카이 파쿠르',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.stepsClimbed * 250) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.stepsClimbed >= 15,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 직접 탭 발판 점프' : 'STEP 1: DIRECT TAP PLATFORM JUMP',
      title: isKo ? '다음 발판의 레인(좌/중/우)을 탭해 구름 위를 도약하세요' : 'Tap Next Platform Lane (Left/Center/Right) to Jump',
      description: isKo
        ? '가상 조이스틱 없이 다음 발판이 위치한 화면의 좌측, 중앙, 우측을 손가락으로 직접 탭하여 리듬감 있게 25단 스카이 파쿠르를 정복하세요.'
        : 'Tap the left, center, or right lane to jump continuously across 25 vertical sky platforms.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 탭 파쿠르)',
            '골드 트로피(🏆) 발판 도달 시 1,500P 잭팟 올클리어',
            '35초간 최대 콤보로 25개 발판을 정복하고 완주'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Platform Jumping',
            'Gold Trophy (🏆) goal awards 1,500P all-clear jackpot',
            'Climb 25 steps with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 탭 (Direct Lane Tap)' : 'Direct Lane Tap',
      description: isKo
        ? '화면의 3개 레인 중 다음 발판이 있는 레인을 탭합니다.'
        : 'Tap the lane matching the next platform.',
      keyPoints: isKo
        ? [
            '👆 레인 직접 탭: 60FPS 즉시 도약 착지',
            '⚡ 연속 착지 성공 시 파쿠르 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Lane Tap: Instant fluid jump to platform',
            '⚡ Consecutive jumps grant combo multipliers',
            '⏱️ 35s time attack sky parkour sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '완주 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '도달한 발판 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Climbed platforms count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0284c7] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 스카이 파쿠르' : 'Blitz Sky Parkour'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '발판' : 'Step', value: `${stepsClimbed}/${maxSteps}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${parkourCombo}x`, color: parkourCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Sky Parkour Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
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
          {isKo ? '다음 발판의 레인(좌측/중앙/우측)을 손가락으로 직접 탭하세요' : 'Tap matching platform lane (left/center/right) to jump'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_sky_parkour"
          gameTitle={isKo ? '블리츠 스카이: 파쿠르 런' : 'Blitz Sky: Parkour Run'}
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
export default VoxelSkyParkourGame;

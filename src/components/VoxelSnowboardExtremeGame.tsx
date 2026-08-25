import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSnowboardExtremeGameProps {
  deck: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SlopeObstacle {
  id: number;
  x: number;
  y: number;
  type: 'gate' | 'ramp' | 'tree' | 'crystal';
  icon: string;
  points: number;
  radius: number;
  cleared: boolean;
}

export const VoxelSnowboardExtremeGame: React.FC<VoxelSnowboardExtremeGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 48;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [gatesCleared, setGatesCleared] = useState<number>(0);
  const [distanceRun, setDistanceRun] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [snowCombo, setSnowCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_snowboard_extreme') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const boarderY = 410;

  const stateRef = useRef({
    boarderX: 180,
    targetBoarderX: 180,
    boarderAngle: 0,
    isAirborne: false,
    airTime: 0,
    obstacles: [] as SlopeObstacle[],
    gatesCleared: 0,
    distanceRun: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    obsCounter: 1,
    spawnTimer: 0,
    speed: 420,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.boarderX = 180;
    s.targetBoarderX = 180;
    s.boarderAngle = 0;
    s.isAirborne = false;
    s.airTime = 0;
    s.obstacles = [];
    s.gatesCleared = 0;
    s.distanceRun = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.obsCounter = 1;
    s.spawnTimer = 0;
    s.speed = 420;
    s.particles = [];

    // Initial items on slope
    s.obstacles.push(
      { id: s.obsCounter++, x: 120, y: 140, type: 'gate', icon: '🚩', points: 400, radius: 24, cleared: false },
      { id: s.obsCounter++, x: 240, y: 220, type: 'crystal', icon: '❄️', points: 300, radius: 20, cleared: false }
    );

    setGatesCleared(0);
    setDistanceRun(0);
    setScore(0);
    setSnowCombo(0);
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

  // Direct Horizontal Finger Drag Handlers (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetBoarderX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetBoarderX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  // Main 60FPS Snowboard Loop
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

      // Boarder Lean & Follow
      const dx = s.targetBoarderX - s.boarderX;
      s.boarderX += dx * Math.min(1, dt * 20);
      s.boarderAngle = Math.max(-0.4, Math.min(0.4, dx * 0.015));

      // Airborne Jump Animation
      if (s.isAirborne) {
        s.airTime -= dt;
        s.boarderAngle += dt * 8; // 360 Spin
        if (s.airTime <= 0) {
          s.isAirborne = false;
        }
      }

      // Distance update
      s.distanceRun += Math.round(s.speed * dt * 0.1);
      setDistanceRun(s.distanceRun);

      // Spawn Slope Obstacles & Gates
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.68) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isTree = rand < 0.35;
        const isGate = rand >= 0.35 && rand < 0.65;
        const isRamp = rand >= 0.65 && rand < 0.8;

        s.obstacles.push({
          id: s.obsCounter++,
          x: 50 + Math.random() * 260,
          y: -40,
          type: isRamp ? 'ramp' : (isGate ? 'gate' : (isTree ? 'tree' : 'crystal')),
          icon: isRamp ? '🎿' : (isGate ? '🚩' : (isTree ? '🌲' : '❄️')),
          points: isRamp ? 800 : (isGate ? 400 : (isTree ? -300 : 250)),
          radius: isRamp ? 26 : (isGate ? 24 : (isTree ? 22 : 18)),
          cleared: false,
        });
      }

      // Move Slope Elements Downward
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const obs = s.obstacles[i];
        obs.y += s.speed * dt;

        if (!obs.cleared && Math.hypot(obs.x - s.boarderX, obs.y - boarderY) < obs.radius + 18) {
          obs.cleared = true;

          if (obs.type === 'tree') {
            if (!s.isAirborne) {
              s.score = Math.max(0, s.score - 300);
              s.combo = 0;
              s.speed = Math.max(280, s.speed - 70);

              setScore(s.score);
              setSnowCombo(0);

              setFeedbackText(isKo ? '나무 충돌! 💥' : 'TREE CRASH! 💥');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              setTimeout(() => setFeedbackText(null), 300);

              // Crash Snow Particles
              for (let p = 0; p < 12; p++) {
                s.particles.push({
                  x: s.boarderX,
                  y: boarderY,
                  vx: (Math.random() - 0.5) * 200,
                  vy: (Math.random() - 0.5) * 200,
                  color: '#ffffff',
                  life: 0.4,
                });
              }
            }
          } else if (obs.type === 'ramp') {
            // Jump Ramp -> 360 Aerial Spin!
            s.isAirborne = true;
            s.airTime = 0.6;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = obs.points + s.combo * 50;
            s.score += pts;

            setScore(s.score);
            setSnowCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`🔥 360° BIG AIR JUMP! +${pts}P ⚡`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            setTimeout(() => setFeedbackText(null), 400);

            // Air Sparks
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: s.boarderX,
                y: boarderY,
                vx: (Math.random() - 0.5) * 240,
                vy: (Math.random() - 0.5) * 240,
                color: '#38bdf8',
                life: 0.5,
              });
            }
          } else {
            // Gate or Crystal
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            if (obs.type === 'gate') {
              s.gatesCleared += 1;
              setGatesCleared(s.gatesCleared);
              setFeedbackText(`PERFECT GATE! 🚩 +${obs.points + s.combo * 30}P`);
            } else {
              setFeedbackText(`CRYSTAL! ❄️ +${obs.points + s.combo * 30}P`);
            }

            const pts = obs.points + s.combo * 30;
            s.score += pts;

            setScore(s.score);
            setSnowCombo(s.combo);
            setMaxCombo(s.maxCombo);

            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);

            // Snow spray
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: s.boarderX,
                y: boarderY,
                vx: (Math.random() - 0.5) * 180,
                vy: Math.random() * 120,
                color: '#e0f2fe',
                life: 0.4,
              });
            }
          }
        }

        if (obs.y > 540) {
          s.obstacles.splice(i, 1);
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

      // Snowy Mountain Slope Gradient
      const snowGrad = ctx.createLinearGradient(0, 0, 0, h);
      snowGrad.addColorStop(0, '#bae6fd');
      snowGrad.addColorStop(0.5, '#e0f2fe');
      snowGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = snowGrad;
      ctx.fillRect(0, 0, w, h);

      // Ski Track Lines
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(s.boarderX - 8, 0);
      ctx.lineTo(s.boarderX - 8, boarderY);
      ctx.moveTo(s.boarderX + 8, 0);
      ctx.lineTo(s.boarderX + 8, boarderY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Slope Obstacles
      s.obstacles.forEach((obs) => {
        if (!obs.cleared) {
          ctx.save();
          ctx.translate(obs.x, obs.y);
          if (obs.type === 'ramp') {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 16;
          } else if (obs.type === 'gate') {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 14;
          }
          ctx.font = `${obs.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Snowboarder Hero
      ctx.save();
      ctx.translate(s.boarderX, boarderY);
      ctx.rotate(s.boarderAngle);
      if (s.isAirborne) {
        ctx.scale(1.3, 1.3);
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
      }
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏂', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [boarderY, isKo, playSfx]);

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
      gameId: 'arcade_snowboard_extreme',
      gameTitle: '블리츠 스노보드 익스트림',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.gatesCleared * 250 + s.distanceRun * 2)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.distanceRun >= 400,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 좌우 드래그 슬라롬' : 'STEP 1: DRAG STEER SLALOM',
      title: isKo ? '보더를 좌우로 드래그해 게이트를 통과하고 점프대를 타세요' : 'Drag left & right to pass slalom gates and hit big air ramps',
      description: isKo
        ? '가상 조이스틱 없이 화면의 스노보더(🏂)를 손가락으로 직접 좌우 드래그하여 나무(🌲)를 회피하고 슬라롬 깃발(🚩)과 점프대(🎿)를 관통하며 활강하세요.'
        : 'Slide left and right to steer the snowboarder, dodge trees, clear slalom gates, and launch off big air ramps.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그)',
            '점프대(🎿) 돌파 시 800P 잭팟 및 360° 공중 회전',
            '35초간 최대 콤보로 설산을 완주하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Horizontal Drag',
            'Big Air Ramps (🎿) award 800P and 360° spin tricks',
            'Cover snowy distance with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 좌우 드래그 (Horizontal Drag)' : 'Horizontal Drag Gesture',
      description: isKo
        ? '손가락을 부드럽게 밀어 보더의 설산 라인을 제어합니다.'
        : 'Slide your thumb left and right smoothly across snow tracks.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 60FPS 즉각 반응 부드러운 카빙 턴',
            '🚩 연속 게이트 통과 시 설산 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant fluid carving control',
            '🚩 Consecutive gate passes grant combo multipliers',
            '⏱️ 35s time attack snowboard extreme sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '활강 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '통과한 게이트 수 및 주행 거리 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Cleared gates count and distance multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#e0f2fe] text-slate-900 font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 스노보드 익스트림' : 'Blitz Snowboard Extreme'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distanceRun}m`, color: 'text-amber-500 font-bold' },
          { label: isKo ? '게이트' : 'Gates', value: `${gatesCleared}개`, color: 'text-blue-600 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-600 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Snowboard Canvas Viewport */}
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-500 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/70 text-white px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/60 text-white border border-white/10 rounded-full text-[10px] font-mono">
          {isKo ? '손가락으로 보더를 좌우 드래그해 게이트(🚩)를 통과하고 나무를 피하세요' : 'Drag snowboarder left & right to clear gates and dodge trees'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_snowboard_extreme"
          gameTitle={isKo ? '블리츠 스노보드: 설산 익스트림' : 'Blitz Snowboard: Mountain Extreme'}
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
export default VoxelSnowboardExtremeGame;

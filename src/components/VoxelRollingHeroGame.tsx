import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelRollingHeroGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface TrackObstacle {
  id: number;
  x: number;
  y: number;
  type: 'star' | 'boost' | 'rock' | 'laser';
  icon: string;
  points: number;
  radius: number;
  collected: boolean;
}

export const VoxelRollingHeroGame: React.FC<VoxelRollingHeroGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [starsCollected, setStarsCollected] = useState<number>(0);
  const [distanceRun, setDistanceRun] = useState<number>(0);
  const targetDistance = 500;
  const [score, setScore] = useState<number>(0);
  const [rollingCombo, setRollingCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_rolling_ball') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const ballY = 430;

  const stateRef = useRef({
    ballX: 180,
    targetBallX: 180,
    ballRollAngle: 0,
    obstacles: [] as TrackObstacle[],
    starsCollected: 0,
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
    speed: 380,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.ballX = 180;
    s.targetBallX = 180;
    s.ballRollAngle = 0;
    s.obstacles = [];
    s.starsCollected = 0;
    s.distanceRun = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.obsCounter = 1;
    s.spawnTimer = 0;
    s.speed = 380;
    s.particles = [];

    // Initial items on track
    s.obstacles.push(
      { id: s.obsCounter++, x: 120, y: 150, type: 'star', icon: '⭐', points: 300, radius: 22, collected: false },
      { id: s.obsCounter++, x: 240, y: 220, type: 'boost', icon: '⚡', points: 500, radius: 24, collected: false }
    );

    setStarsCollected(0);
    setDistanceRun(0);
    setScore(0);
    setRollingCombo(0);
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

  // Touch Handlers: Direct Horizontal Finger Drag (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetBallX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetBallX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  // Main 60FPS Rolling Ball Loop
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

      // Smooth Ball Movement Tracking
      s.ballX += (s.targetBallX - s.ballX) * Math.min(1, dt * 22);
      s.ballRollAngle += dt * 10;

      // Distance update
      s.distanceRun += Math.round(s.speed * dt * 0.1);
      setDistanceRun(s.distanceRun);

      // Spawn Obstacles & Boosters
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.65) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isRock = rand < 0.35;
        const isBoost = rand > 0.8;
        const isLaser = rand >= 0.35 && rand < 0.5;

        s.obstacles.push({
          id: s.obsCounter++,
          x: 50 + Math.random() * 260,
          y: -40,
          type: isBoost ? 'boost' : (isRock ? 'rock' : (isLaser ? 'laser' : 'star')),
          icon: isBoost ? '⚡' : (isRock ? '🪨' : (isLaser ? '🚧' : '⭐')),
          points: isBoost ? 500 : (isRock ? -300 : (isLaser ? -200 : 300)),
          radius: isBoost ? 24 : (isRock ? 22 : 20),
          collected: false,
        });
      }

      // Move Track Obstacles (Downward speed)
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const obs = s.obstacles[i];
        obs.y += s.speed * dt;

        // Collision Check with Rolling Ball
        if (!obs.collected && Math.hypot(obs.x - s.ballX, obs.y - ballY) < obs.radius + 18) {
          obs.collected = true;

          if (obs.type === 'rock' || obs.type === 'laser') {
            s.score = Math.max(0, s.score + obs.points);
            s.combo = 0;
            s.speed = Math.max(280, s.speed - 80);

            setScore(s.score);
            setRollingCombo(0);

            setFeedbackText(isKo ? '충돌! 감속 발생 💥' : 'CRASH! SLOW DOWN 💥');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);

            // Crash Sparks
            for (let p = 0; p < 10; p++) {
              s.particles.push({
                x: s.ballX,
                y: ballY,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: '#ef4444',
                life: 0.4,
              });
            }
          } else {
            // Star or Boost
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            if (obs.type === 'boost') {
              s.speed = Math.min(650, s.speed + 70);
              setFeedbackText(isKo ? '광속 부스터 가속! ⚡ +500P' : 'SPEED BOOST! ⚡ +500P');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            } else {
              s.starsCollected += 1;
              setStarsCollected(s.starsCollected);
              setFeedbackText(`STAR! ⭐ +${obs.points + s.combo * 30}P`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            }

            const pts = obs.points + s.combo * 30;
            s.score += pts;

            setScore(s.score);
            setRollingCombo(s.combo);
            setMaxCombo(s.maxCombo);
            setTimeout(() => setFeedbackText(null), 300);

            // Collect Sparkles
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: s.ballX,
                y: ballY,
                vx: (Math.random() - 0.5) * 220,
                vy: (Math.random() - 0.5) * 220,
                color: obs.type === 'boost' ? '#38bdf8' : '#fde047',
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

      // Cyber Highway Track Background
      const highwayGrad = ctx.createLinearGradient(0, 0, 0, h);
      highwayGrad.addColorStop(0, '#0f172a');
      highwayGrad.addColorStop(0.5, '#1e1b4b');
      highwayGrad.addColorStop(1, '#020617');
      ctx.fillStyle = highwayGrad;
      ctx.fillRect(0, 0, w, h);

      // Track Lanes (Neon Lines)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([16, 16]);
      ctx.lineDashOffset = -s.distanceRun * 2;
      ctx.beginPath();
      ctx.moveTo(120, 0);
      ctx.lineTo(120, h);
      ctx.moveTo(240, 0);
      ctx.lineTo(240, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Track Borders
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 0, w - 40, h);

      // Render Obstacles
      s.obstacles.forEach((obs) => {
        if (!obs.collected) {
          ctx.save();
          ctx.translate(obs.x, obs.y);
          if (obs.type === 'boost') {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 18;
          } else if (obs.type === 'star') {
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 15;
          }
          ctx.font = `${obs.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Glowing Rolling Ball Hero
      ctx.save();
      ctx.translate(s.ballX, ballY);
      ctx.rotate(s.ballRollAngle);
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 20;
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚽', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [ballY, isKo, playSfx]);

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
      gameId: 'arcade_rolling_ball',
      gameTitle: '블리츠 롤링 볼',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.starsCollected * 200 + s.distanceRun * 2)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.distanceRun >= 400,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 좌우 드래그 질주' : 'STEP 1: HORIZONTAL DRAG ROLLING',
      title: isKo ? '볼을 좌우로 드래그해 장애물을 피하고 스타를 수집하세요' : 'Drag Ball Left & Right to Dodge Obstacles & Collect Stars',
      description: isKo
        ? '가상 조이스틱 없이 화면의 롤링 볼(⚽)을 손가락으로 직접 좌우 드래그하여 바위(🪨)와 바리케이드(🚧)를 회피하고 스타(⭐)와 광속 부스터(⚡)를 밟으며 질주하세요.'
        : 'Slide your finger left and right to steer the rolling ball, avoid hazards, and hit speed boosters.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그)',
            '광속 부스터(⚡) 획득 시 500P 잭팟 및 속도 급가속',
            '35초간 최대 콤보로 500m 거리를 돌파하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Horizontal Drag',
            'Speed Boosters (⚡) award 500P and massive acceleration',
            'Cover 500m distance with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 좌우 드래그 (Horizontal Drag)' : 'Horizontal Drag Gesture',
      description: isKo
        ? '손가락을 원하는 레인으로 부드럽게 밀어 볼의 위치를 제어합니다.'
        : 'Slide your thumb left and right smoothly across lanes.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 60FPS 즉시 반응 부드러운 위치 동기화',
            '⭐ 연속 스타 획득 시 롤링 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant fluid 60FPS position tracking',
            '⭐ Consecutive star collections grant combo multipliers',
            '⏱️ 35s time attack rolling ball sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '질주 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '달성 주행 거리 및 수집 스타 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Distance covered and star collection multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 롤링 볼' : 'Blitz Rolling Ball'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distanceRun}m`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '스타' : 'Stars', value: `${starsCollected}개`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Rolling Ball Canvas Viewport */}
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
          {isKo ? '손가락으로 볼을 좌우 드래그해 장애물을 피하고 부스터를 밟으세요' : 'Drag ball left & right to dodge obstacles and hit speed boosters'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_rolling_ball"
          gameTitle={isKo ? '블리츠 롤링: 스피드 볼' : 'Blitz Rolling: Speed Ball'}
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
export default VoxelRollingHeroGame;

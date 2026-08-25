import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMotocrossStuntGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMotocrossStuntGame: React.FC<VoxelMotocrossStuntGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 91;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [distanceM, setDistanceM] = useState<number>(0);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [flipsCompleted, setFlipsCompleted] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [stuntCombo, setStuntCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_motocross_stunt') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    bikeX: 100,
    bikeY: 340,
    bikeVy: 0,
    bikeAngle: 0,
    speed: 0,
    isHolding: false,
    isInAir: false,
    airRotation: 0,
    distance: 0,
    flips: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.bikeX = 100;
    s.bikeY = 340;
    s.bikeVy = 0;
    s.bikeAngle = 0;
    s.speed = 0;
    s.isHolding = false;
    s.isInAir = false;
    s.airRotation = 0;
    s.distance = 0;
    s.flips = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.particles = [];

    setDistanceM(0);
    setSpeedKmh(0);
    setFlipsCompleted(0);
    setScore(0);
    setStuntCombo(0);
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

  // Touch Handlers: Screen Hold to Accelerate / Rotate in Air
  const handlePointerDown = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    s.isHolding = true;
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    s.isHolding = false;
  };

  // Main 60FPS Motocross Physics Loop
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

      // Ground Height Calculation at X (Hills Profile)
      const getGroundY = (dist: number) => {
        return 340 + Math.sin(dist * 0.015) * 45 + Math.cos(dist * 0.04) * 20;
      };

      const groundY = getGroundY(s.distance + s.bikeX);
      const nextGroundY = getGroundY(s.distance + s.bikeX + 15);
      const groundSlope = Math.atan2(nextGroundY - groundY, 15);

      if (!s.isInAir) {
        // On Ground: Acceleration / Deceleration
        if (s.isHolding) {
          s.speed = Math.min(220, s.speed + 120 * dt);
        } else {
          s.speed = Math.max(40, s.speed - 50 * dt);
        }

        s.bikeY = groundY;
        s.bikeAngle = groundSlope;

        // Jump off hill crest
        if (groundSlope < -0.35 && s.speed > 100) {
          s.isInAir = true;
          s.bikeVy = -s.speed * 2.8;
          s.airRotation = 0;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
      } else {
        // In Air: Gravity & 360° Backflips
        s.bikeVy += 650 * dt;
        s.bikeY += s.bikeVy * dt;

        if (s.isHolding) {
          // Flip Rotation in Air!
          s.bikeAngle -= Math.PI * 3.2 * dt;
          s.airRotation += Math.PI * 3.2 * dt;
        }

        // Landing Check
        if (s.bikeY >= groundY && s.bikeVy > 0) {
          s.bikeY = groundY;
          s.isInAir = false;

          const fullFlips = Math.floor(s.airRotation / (Math.PI * 1.85));

          // Angle alignment check (must land close to wheels down)
          const normAngle = ((s.bikeAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const isSmoothLanding = normAngle < 0.8 || normAngle > Math.PI * 2 - 0.8;

          if (fullFlips > 0 && isSmoothLanding) {
            s.flips += fullFlips;
            s.combo += fullFlips;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = fullFlips * 400 + s.combo * 50;
            s.score += pts;

            setFlipsCompleted(s.flips);
            setScore(s.score);
            setStuntCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`🔥 ${fullFlips > 1 ? 'DOUBLE ' : ''}BACKFLIP! +${pts}P 🔥`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            setTimeout(() => setFeedbackText(null), 400);

            // Stunt Sparkles
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: s.bikeX,
                y: s.bikeY,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: '#fde047',
                life: 0.5,
              });
            }
          } else if (!isSmoothLanding) {
            // Crash wipeout
            s.speed = 30;
            s.combo = 0;
            setStuntCombo(0);

            setFeedbackText(isKo ? '착지 각도 불안정! 💥' : 'WIPEOUT LANDING! 💥');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => setFeedbackText(null), 500);
          }
        }
      }

      // Distance Progress
      s.distance += (s.speed * dt) * 1.5;
      setDistanceM(Math.round(s.distance / 10));
      setSpeedKmh(Math.round(s.speed));

      // Exhaust Dirt Particles
      if (Math.random() < 0.4) {
        s.particles.push({
          x: s.bikeX - 18,
          y: s.bikeY + 8,
          vx: -s.speed * 0.4,
          vy: (Math.random() - 0.5) * 50,
          color: '#d97706',
          life: 0.4,
        });
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

      // Sunset Desert Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#f59e0b');
      skyGrad.addColorStop(0.5, '#ea580c');
      skyGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Sun Orb
      ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
      ctx.beginPath();
      ctx.arc(280, 100, 36, 0, Math.PI * 2);
      ctx.fill();

      // Render Rolling Dirt Hills Terrain
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let screenX = 0; screenX <= w; screenX += 10) {
        const hy = getGroundY(s.distance + screenX);
        ctx.lineTo(screenX, hy);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Dirt Outline
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Render Stunt Motocross Bike
      ctx.save();
      ctx.translate(s.bikeX, s.bikeY);
      ctx.rotate(s.bikeAngle);

      if (s.isInAir && s.isHolding) {
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 20;
      }

      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏍️', 0, -12);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx]);

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
      gameId: 'arcade_motocross_stunt',
      gameTitle: '블리츠 모토크로스',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (Math.round(s.distance / 10) * 8 + s.flips * 300)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.flips >= 3,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 화면 홀드 가속 & 백플립' : 'STEP 1: HOLD ACCELERATION & FLIP',
      title: isKo ? '화면을 길게 눌러 가속하고 공중에서 360도 회전하세요' : 'Hold Screen to Accelerate & Flip 360° in the Air',
      description: isKo
        ? '가상 조이스틱 없이 지상에서 화면을 길게 눌러 최고 속도로 질주하고, 언덕에서 날아오른 공중에서 화면을 길게 눌러 360도 백플립 스턴트를 성공시킨 후 바퀴 각도를 맞춰 착지하세요.'
        : 'Hold screen to accelerate on the ground, and hold in the air to execute continuous 360° backflips.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 홀드 가속 & 공중 회전)',
            '공중 360도 백플립 성공 착지 시 400P 잭팟 보너스',
            '35초간 최대 콤보로 사막 언덕을 질주하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Screen Hold Acceleration & Stunts',
            'Smooth 360° backflip landings award 400P stunt bonus',
            'Chain continuous stunt combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 터치 & 홀드 (Touch & Hold)' : 'Touch & Hold Gesture',
      description: isKo
        ? '지상에서 누르면 가속, 공중에서 누르면 회전합니다.'
        : 'Hold to accelerate on ground, hold to rotate in air.',
      keyPoints: isKo
        ? [
            '👆 지상 홀드: 220km/h 광속 가속 질주',
            '🔄 공중 홀드: 360도 백플립 익스트림 스턴트',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Ground Hold: Accelerate up to 220 km/h',
            '🔄 Air Hold: Execute 360° backflip extreme stunts',
            '⏱️ 35s time attack motocross sprint'
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
            '백플립 횟수 및 주행 거리 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Completed backflips and distance multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#78350f] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 모토크로스' : 'Blitz Motocross'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distanceM}m`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '속도' : 'Speed', value: `${speedKmh}km/h`, color: speedKmh >= 150 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '백플립' : 'Flips', value: `${flipsCompleted}회`, color: 'text-emerald-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Motocross Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면 홀드: 가속 질주 | 공중 홀드: 360° 백플립 스턴트' : 'Hold on ground to accelerate | Hold in air to flip 360°'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_motocross_stunt"
          gameTitle={isKo ? '블리츠 모토: 익스트림 스턴트' : 'Blitz Moto: Extreme Stunt'}
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
export default VoxelMotocrossStuntGame;

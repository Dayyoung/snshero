import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMicroKartGameProps {
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
  type: 'rival' | 'oil' | 'turbo' | 'coin';
  icon: string;
  isHit: boolean;
}

export const VoxelMicroKartGame: React.FC<VoxelMicroKartGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 82;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [speedKmh, setSpeedKmh] = useState<number>(140);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [kartCombo, setKartCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_micro_kart') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    kartX: 180,
    targetX: 180,
    kartY: 420,
    speed: 140,
    turboTimer: 0,
    oilSpinTimer: 0,
    distance: 0,
    coins: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    obstacles: [] as TrackObstacle[],
    obsCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.kartX = 180;
    s.targetX = 180;
    s.kartY = 420;
    s.speed = 140;
    s.turboTimer = 0;
    s.oilSpinTimer = 0;
    s.distance = 0;
    s.coins = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.obstacles = [];
    s.obsCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    setDistanceKm(0);
    setSpeedKmh(140);
    setCoinsCollected(0);
    setScore(0);
    setKartCombo(0);
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

    s.targetX = Math.max(50, Math.min(310, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetX = Math.max(50, Math.min(310, (e.clientX - rect.left) * scaleX));
  };

  // Main 60FPS Micro Kart Circuit Loop
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

      // Smooth Steering towards Finger
      s.kartX += (s.targetX - s.kartX) * Math.min(1, dt * 18);

      // Handle Turbo Boost & Oil Slip
      if (s.turboTimer > 0) {
        s.turboTimer -= dt;
        s.speed = 240;
      } else if (s.oilSpinTimer > 0) {
        s.oilSpinTimer -= dt;
        s.speed = 70;
      } else {
        s.speed = 140;
      }
      setSpeedKmh(Math.round(s.speed));

      // Distance Progress
      s.distance += (s.speed * dt) / 3.6;
      setDistanceKm(Math.round(s.distance));

      // Spawn Obstacles & Boosters
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.65) {
        s.spawnTimer = 0;
        const rand = Math.random();
        let type: 'rival' | 'oil' | 'turbo' | 'coin' = 'coin';
        let icon = '🪙';

        if (rand < 0.25) {
          type = 'rival';
          icon = '🚙';
        } else if (rand < 0.45) {
          type = 'oil';
          icon = '🛢️';
        } else if (rand < 0.65) {
          type = 'turbo';
          icon = '⚡';
        }

        s.obstacles.push({
          id: s.obsCounter++,
          x: 60 + Math.random() * 240,
          y: -30,
          type,
          icon,
          isHit: false,
        });
      }

      // Move Obstacles
      const scrollSpeed = s.speed * 2.8;
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const obs = s.obstacles[i];
        obs.y += scrollSpeed * dt;

        // Collision Check with Kart (kart at 180, 420, radius 22)
        if (!obs.isHit && Math.hypot(obs.x - s.kartX, obs.y - s.kartY) < 32) {
          obs.isHit = true;

          if (obs.type === 'turbo') {
            s.turboTimer = 2.0;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = 400 + s.combo * 30;
            s.score += pts;

            setScore(s.score);
            setKartCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`⚡ TURBO SURGE! +${pts}P ⚡`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            setTimeout(() => setFeedbackText(null), 400);

            // Turbo Sparkles
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: s.kartX,
                y: s.kartY,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: '#38bdf8',
                life: 0.5,
              });
            }
          } else if (obs.type === 'coin') {
            s.coins += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = 150 + s.combo * 20;
            s.score += pts;

            setCoinsCollected(s.coins);
            setScore(s.score);
            setKartCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`COIN +${pts}P 🪙`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);
          } else if (obs.type === 'oil') {
            s.oilSpinTimer = 1.5;
            s.combo = 0;
            setKartCombo(0);

            setFeedbackText(isKo ? '오일 슬릭 스핀! 🛢️' : 'OIL SLICK SPIN! 🛢️');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => setFeedbackText(null), 500);
          } else if (obs.type === 'rival') {
            s.score = Math.max(0, s.score - 100);
            s.combo = 0;
            setScore(s.score);
            setKartCombo(0);

            setFeedbackText(isKo ? '라이벌 카트 충돌! 💥' : 'RIVAL CRASH! 💥');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => setFeedbackText(null), 500);
          }
        }

        if (obs.y > 530) {
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

      // Track Grass Outer Margins
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, w, h);

      // Asphalt Track Curvature
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 0, w - 80, h);

      // Track Curb Borders (Red & White Stripes)
      const curbH = 20;
      const offset = (Date.now() * 0.3) % (curbH * 2);
      for (let cy = -curbH * 2; cy < h; cy += curbH) {
        const isRed = Math.floor((cy + offset) / curbH) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
        ctx.fillRect(34, cy + offset, 6, curbH);
        ctx.fillRect(w - 40, cy + offset, 6, curbH);
      }

      // Dashed White Lane Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -Date.now() * 0.4;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Obstacles
      s.obstacles.forEach((obs) => {
        if (!obs.isHit) {
          ctx.save();
          ctx.translate(obs.x, obs.y);
          ctx.font = '30px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obs.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Player Micro Kart
      ctx.save();
      ctx.translate(s.kartX, s.kartY);

      if (s.turboTimer > 0) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
      }

      ctx.font = '38px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawCardSprite(ctx, playerHeroId, -22, -22, 44, 44, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#fde047',
        shadowBlur: 14,
        shadowColor: 'rgba(253, 224, 71, 0.6)',
      });
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
      gameId: 'arcade_micro_kart',
      gameTitle: '블리츠 마이크로 카트',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : Math.round(s.distance) * 2) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.distance >= 400,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 서킷 주행' : 'STEP 1: DRAG CIRCUIT STEERING',
      title: isKo ? '카트를 좌우로 드래그해 터보를 밟고 골인하세요' : 'Drag Kart Left & Right to Hit Turbo & Reach Goal',
      description: isKo
        ? '가상 조이스틱 없이 카트(🏎️)를 손가락으로 화면에서 직접 좌우 드래그하여 장애물 차량(🚙)과 오일(🛢️)을 피하고, 터보 부스터(⚡)와 코인(🪙)을 밟으며 최고 속도로 질주하세요.'
        : 'Drag the micro kart directly left and right with your finger to dodge traffic and oil, while grabbing turbo pads and coins.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그 조향)',
            '터보 부스터(⚡) 획득 시 240km/h 광속 서지 가속',
            '35초간 400m 이상 질주하고 서킷을 제패하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Horizontal Finger Drag',
            'Turbo Boosters (⚡) surge kart speed up to 240 km/h',
            'Race over 400m within 35s to claim championship'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 좌우 직접 드래그 (Horizontal Drag)' : 'Horizontal Drag Gesture',
      description: isKo
        ? '손가락을 대고 원하는 차선으로 부드럽게 미끄러집니다.'
        : 'Slide your thumb left and right seamlessly across the track.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 실시간 즉각 반응 레이싱 조향',
            '🪙 코인 및 터보 연속 획득 시 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant fluid steering response',
            '🪙 Consecutive coin and turbo hits trigger high score combo',
            '⏱️ 35s time attack circuit sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '완주 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '주행 거리 및 수집 코인 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Travel distance and collected coins multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 마이크로 카트' : 'Blitz Micro Kart'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distanceKm}m`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '속도' : 'Speed', value: `${speedKmh}km/h`, color: speedKmh >= 200 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Micro Kart Canvas Viewport */}
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
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '손가락으로 카트를 좌우 드래그해 터보를 밟고 골인하세요' : 'Drag kart left & right to grab turbos and reach the finish line'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_micro_kart"
          gameTitle={isKo ? '블리츠 카트: 서킷 레이스' : 'Blitz Kart: Circuit Race'}
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
export default VoxelMicroKartGame;

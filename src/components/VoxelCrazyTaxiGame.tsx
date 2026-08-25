import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCrazyTaxiGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface TrafficCar {
  id: number;
  x: number;
  y: number;
  speed: number;
  color: string;
  icon: string;
  passed: boolean;
}

interface RoadCoin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export const VoxelCrazyTaxiGame: React.FC<VoxelCrazyTaxiGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 96;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [nearMissCombo, setNearMissCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [comboText, setComboText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_highway_racer') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    carX: 180,
    carY: 440,
    carWidth: 32,
    carHeight: 52,
    traffic: [] as TrafficCar[],
    coins: [] as RoadCoin[],
    score: 0,
    nearMissCombo: 0,
    maxCombo: 0,
    distance: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    trafficCounter: 1,
    spawnTimer: 0,
    roadOffset: 0,
  });

  const TRAFFIC_ICONS = ['🚙', '🚚', '🚐', '🚕', '🚒'];

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.carX = 180;
    s.carY = 440;
    s.traffic = [];
    s.coins = [];
    s.score = 0;
    s.nearMissCombo = 0;
    s.maxCombo = 0;
    s.distance = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.trafficCounter = 1;
    s.spawnTimer = 0;
    s.roadOffset = 0;

    setScore(0);
    setNearMissCombo(0);
    setMaxCombo(0);
    setDistanceMeters(0);
    setTimeLeft(35);
    setComboText(null);
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

  // Touch / Pointer Direct Drag Steering Handler (Zero Joysticks)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    const touchX = (e.clientX - rect.left) * scaleX;
    s.carX = Math.min(305, Math.max(55, touchX));
  };

  // Main 60FPS Racing Physics Engine Loop
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

      // Scroll Highway Road Lines
      const roadSpeed = 380;
      s.roadOffset = (s.roadOffset + roadSpeed * dt) % 40;
      s.distance += roadSpeed * dt * 0.05;
      setDistanceMeters(Math.floor(s.distance));

      // Spawn Traffic & Coins
      s.spawnTimer += dt;
      if (s.spawnTimer >= 0.75 && s.traffic.length < 6) {
        s.spawnTimer = 0;
        const lanes = [90, 180, 270];
        const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
        const icon = TRAFFIC_ICONS[Math.floor(Math.random() * TRAFFIC_ICONS.length)];

        s.traffic.push({
          id: s.trafficCounter++,
          x: chosenLane,
          y: -60,
          speed: 160 + Math.random() * 80,
          color: '#ef4444',
          icon,
          passed: false,
        });

        // Spawn gold coins sometimes
        if (Math.random() < 0.6) {
          const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
          s.coins.push({
            id: s.trafficCounter++,
            x: coinLane,
            y: -100,
            collected: false,
          });
        }
      }

      // Update Traffic Cars
      for (let i = s.traffic.length - 1; i >= 0; i--) {
        const car = s.traffic[i];
        car.y += (roadSpeed - car.speed) * dt;

        // Collision Check (Hit Traffic ➔ Game Over)
        const hitX = Math.abs(car.x - s.carX) < 28;
        const hitY = Math.abs(car.y - s.carY) < 42;

        if (hitX && hitY) {
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          endGame(false);
          return;
        }

        // Near Miss (칼치기 추월) Check
        if (!car.passed && car.y > s.carY - 10 && car.y < s.carY + 40) {
          const dist = Math.abs(car.x - s.carX);
          if (dist >= 28 && dist <= 55) {
            car.passed = true;
            s.nearMissCombo += 1;
            if (s.nearMissCombo > s.maxCombo) s.maxCombo = s.nearMissCombo;

            const bonus = 150 + s.nearMissCombo * 50;
            s.score += bonus;
            setScore(s.score);
            setNearMissCombo(s.nearMissCombo);
            setMaxCombo(s.maxCombo);

            setComboText(`NEAR MISS! +${bonus}P ⚡`);
            setTimeout(() => setComboText(null), 400);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
        }

        // Remove offscreen cars
        if (car.y > 560) {
          s.traffic.splice(i, 1);
        }
      }

      // Update Coins
      for (let i = s.coins.length - 1; i >= 0; i--) {
        const c = s.coins[i];
        c.y += roadSpeed * dt;

        if (!c.collected && Math.hypot(c.x - s.carX, c.y - s.carY) < 32) {
          c.collected = true;
          s.score += 80;
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }

        if (c.y > 560 || c.collected) {
          s.coins.splice(i, 1);
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Asphalt Road Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);

      // Road Shoulders
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 40, h);
      ctx.fillRect(w - 40, 0, 40, h);

      // Shoulder Solid Lines
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(40, h);
      ctx.moveTo(w - 40, 0);
      ctx.lineTo(w - 40, h);
      ctx.stroke();

      // Lane Divider Dashed Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -s.roadOffset;

      const lane1X = 135;
      const lane2X = 225;

      ctx.beginPath();
      ctx.moveTo(lane1X, 0);
      ctx.lineTo(lane1X, h);
      ctx.moveTo(lane2X, 0);
      ctx.lineTo(lane2X, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Coins (Gold)
      s.coins.forEach((c) => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Render Traffic Cars
      s.traffic.forEach((car) => {
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(car.icon, car.x, car.y);
      });

      // Render Player Sports Car (Cyan Supercar)
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(s.carX - 16, s.carY - 26, 32, 52, 6);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Windshield & Headlights
      ctx.fillStyle = '#082f49';
      ctx.fillRect(s.carX - 12, s.carY - 14, 24, 14);

      // Headlight Beams
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.moveTo(s.carX - 12, s.carY - 26);
      ctx.lineTo(s.carX - 24, s.carY - 80);
      ctx.lineTo(s.carX + 24, s.carY - 80);
      ctx.lineTo(s.carX + 12, s.carY - 26);
      ctx.fill();
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx]);

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
      gameId: 'arcade_highway_racer',
      gameTitle: '블리츠 하이웨이 레이서',
      durationSeconds: duration,
      score: s.score + Math.floor(s.distance * 2) + s.maxCombo * 70,
      difficulty: 'NIGHTMARE',
      isVictory: isWin,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 고속도로 추월 질주' : 'STEP 1: HIGHWAY RACING',
      title: isKo ? '손가락으로 드래그해 차선을 변경하세요' : 'Direct Finger Drag to Steer',
      description: isKo
        ? '가상 조이스틱 없이 화면을 손가락으로 직접 좌우 드래그하여 차선을 변경하고, 장애물 차량을 아슬아슬하게 칼치기 추월하세요.'
        : 'Drag smoothly across the screen to steer your supercar and dodge incoming traffic.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 1:1 조향 추적)',
            '장애물 차량 근접 추월(Near Miss) 시 콤보 잭팟',
            '충돌 없이 35초간 최대 주행 거리를 기록하면 승리'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Steering',
            'Near-miss overtakes trigger massive combo multipliers',
            'Survive 35 seconds of high-speed racing to win'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 좌우 드래그 (Direct Drag)' : 'Direct Screen Drag',
      description: isKo
        ? '손가락을 화면에 대고 좌우로 미끄러지듯 이동하여 조향합니다.'
        : 'Slide your finger left and right anywhere to control your vehicle.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 즉각적인 반응 속도',
            '🪙 황금 코인 수집 시 추가 점수 획득',
            '⚡ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Touch Drag: Real-time instantaneous steering response',
            '🪙 Collect gold coins along lanes for extra score',
            '⚡ 35s time attack high-score sprint'
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
            '주행 거리 및 칼치기 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Distance traveled and near-miss combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#090d16] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 하이웨이 레이서' : 'Blitz Highway Racer'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distanceMeters}m`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '칼치기' : 'Combo', value: `${nearMissCombo}x`, color: nearMissCombo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Racing Highway Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          className="w-full h-full object-contain touch-none cursor-ew-resize shadow-2xl"
        />

        {/* Floating Near Miss Feedback */}
        {comboText && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-xl font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {comboText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 손가락으로 좌우 드래그하여 차선을 변경하세요 (칼치기 콤보)' : 'Drag finger left/right to steer and near-miss traffic'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_highway_racer"
          gameTitle={isKo ? '블리츠 하이웨이 레이서: 고속 레이싱' : 'Blitz Highway Racer: Highway Racing'}
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
export default VoxelCrazyTaxiGame;

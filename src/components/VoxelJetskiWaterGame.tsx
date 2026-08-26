import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelJetskiWaterGameProps {
  deck: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface WaterGate {
  id: number;
  y: number;
  leftX: number;
  rightX: number;
  isPassed: boolean;
}

interface WaveRamp {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isHit: boolean;
}

export const VoxelJetskiWaterGame: React.FC<VoxelJetskiWaterGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 79;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [distance, setDistance] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [slalomCombo, setSlalomCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [turboEnergy, setTurboEnergy] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_jetski_surf') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    jetskiX: 180,
    targetX: 180,
    speed: 320,
    isTurbo: false,
    turboTimer: 0,
    turboGauge: 100,
    isAirborne: false,
    airY: 0,
    airVy: 0,
    gates: [] as WaterGate[],
    ramps: [] as WaveRamp[],
    distance: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    gateCounter: 1,
    spawnTimer: 0,
    waveOffset: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.jetskiX = 180;
    s.targetX = 180;
    s.speed = 320;
    s.isTurbo = false;
    s.turboTimer = 0;
    s.turboGauge = 100;
    s.isAirborne = false;
    s.airY = 0;
    s.airVy = 0;
    s.gates = [];
    s.ramps = [];
    s.distance = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.gateCounter = 1;
    s.spawnTimer = 0;
    s.waveOffset = 0;

    // Initial Gate
    s.gates.push({
      id: s.gateCounter++,
      y: 100,
      leftX: 110,
      rightX: 250,
      isPassed: false,
    });

    setDistance(0);
    setScore(0);
    setSlalomCombo(0);
    setMaxCombo(0);
    setTurboEnergy(100);
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

  // Direct Horizontal Touch Drag for Steering (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  // Double Tap or Hold to trigger Turbo Surge
  const handleTurboTrigger = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.turboGauge < 30 || s.isTurbo) return;

    s.isTurbo = true;
    s.turboTimer = 2.5;
    s.turboGauge = Math.max(0, s.turboGauge - 35);
    setTurboEnergy(Math.round(s.turboGauge));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setFeedbackText('TURBO SURGE! ⚡🌊');
    setTimeout(() => setFeedbackText(null), 400);
  };

  // Main 60FPS Jetski Water Racing Loop
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

      // Turbo & Speed Management
      if (s.isTurbo) {
        s.turboTimer -= dt;
        s.speed = 550;
        if (s.turboTimer <= 0) {
          s.isTurbo = false;
        }
      } else {
        s.speed = 320;
        // Turbo gauge recovery
        s.turboGauge = Math.min(100, s.turboGauge + dt * 10);
        setTurboEnergy(Math.round(s.turboGauge));
      }

      // Smooth Horizontal Interpolation
      s.jetskiX += (s.targetX - s.jetskiX) * Math.min(1, dt * 14);

      // Distance update
      s.distance += s.speed * dt * 0.05;
      setDistance(Math.round(s.distance));

      // Wave animation offset
      s.waveOffset = (s.waveOffset + s.speed * dt * 0.8) % 40;

      // Spawn Gates and Wave Ramps
      s.spawnTimer += dt;
      if (s.spawnTimer >= (s.isTurbo ? 0.9 : 1.4)) {
        s.spawnTimer = 0;
        const gateCenter = 100 + Math.random() * 160;
        const gateGap = 120;

        s.gates.push({
          id: s.gateCounter++,
          y: -20,
          leftX: gateCenter - gateGap / 2,
          rightX: gateCenter + gateGap / 2,
          isPassed: false,
        });

        // 35% chance to spawn a wave ramp
        if (Math.random() < 0.35) {
          s.ramps.push({
            id: s.gateCounter++,
            x: 80 + Math.random() * 200,
            y: -80,
            w: 50,
            h: 24,
            isHit: false,
          });
        }
      }

      const jetskiY = 390;

      // Update Airborne Jump Physics
      if (s.isAirborne) {
        s.airY += s.airVy * dt;
        s.airVy -= 380 * dt;
        if (s.airY <= 0) {
          s.airY = 0;
          s.airVy = 0;
          s.isAirborne = false;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      }

      // Update Water Gates
      for (let i = s.gates.length - 1; i >= 0; i--) {
        const gate = s.gates[i];
        gate.y += s.speed * dt;

        // Check Passage through Buoys
        if (!gate.isPassed && gate.y >= jetskiY - 20 && gate.y <= jetskiY + 20) {
          gate.isPassed = true;
          if (s.jetskiX >= gate.leftX && s.jetskiX <= gate.rightX) {
            // Slalom Gate Passed!
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = 200 + s.combo * 25;
            s.score += pts;
            setScore(s.score);
            setSlalomCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`PERFECT SLALOM! +${pts}P 🚩`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            setTimeout(() => setFeedbackText(null), 350);
          } else {
            // Missed Buoy Gate
            s.combo = 0;
            setSlalomCombo(0);
          }
        }

        if (gate.y > 520) {
          s.gates.splice(i, 1);
        }
      }

      // Update Wave Ramps
      for (let i = s.ramps.length - 1; i >= 0; i--) {
        const ramp = s.ramps[i];
        ramp.y += s.speed * dt;

        if (
          !ramp.isHit &&
          !s.isAirborne &&
          Math.abs(ramp.x - s.jetskiX) < ramp.w / 2 + 15 &&
          Math.abs(ramp.y - jetskiY) < ramp.h / 2 + 15
        ) {
          ramp.isHit = true;
          s.isAirborne = true;
          s.airVy = 260;
          s.score += 400;
          setScore(s.score);
          setFeedbackText('🌊 WAVE LAUNCH AIR STUNT! +400P');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);
        }

        if (ramp.y > 520) {
          s.ramps.splice(i, 1);
        }
      }

      // 400m Goal Reach Win
      if (s.distance >= 400) {
        endGame(true);
        return;
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Tropical Blue Ocean Background
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#0369a1');
      oceanGrad.addColorStop(0.6, '#0284c7');
      oceanGrad.addColorStop(1, '#0ea5e9');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // Moving Water Ripple Waves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      for (let y = s.waveOffset; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < w; x += 40) {
          ctx.quadraticCurveTo(x + 20, y + 8, x + 40, y);
        }
        ctx.stroke();
      }

      // Render Wave Ramps (Card Sprite Emblem)
      s.ramps.forEach((ramp) => {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(ramp.x - ramp.w / 2, ramp.y - ramp.h / 2, ramp.w, ramp.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(ramp.x - ramp.w / 2, ramp.y - ramp.h / 2, ramp.w, ramp.h);

        drawCardSprite(
          ctx,
          100,
          ramp.x - 12,
          ramp.y - 12,
          24,
          24,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#38bdf8',
            shadowBlur: 8,
            shadowColor: 'rgba(56, 189, 248, 0.8)',
          }
        );
      });

      // Render Buoy Gates (Red 🔴 & Green 🟢 Card Sprites)
      s.gates.forEach((gate) => {
        // Connecting Water Gate Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(gate.leftX, gate.y);
        ctx.lineTo(gate.rightX, gate.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Left Red Buoy Card Sprite
        drawCardSprite(
          ctx,
          16,
          gate.leftX - 11,
          gate.y - 11,
          22,
          22,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#ef4444',
            shadowBlur: 6,
            shadowColor: 'rgba(239, 68, 68, 0.8)',
          }
        );

        // Right Green Buoy Card Sprite
        drawCardSprite(
          ctx,
          16,
          gate.rightX - 11,
          gate.y - 11,
          22,
          22,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#10b981',
            shadowBlur: 6,
            shadowColor: 'rgba(16, 185, 129, 0.8)',
          }
        );
      });

      // Render Jetski Foam Wake
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.moveTo(s.jetskiX - 10, jetskiY + 20 - s.airY * 0.4);
      ctx.lineTo(s.jetskiX + 10, jetskiY + 20 - s.airY * 0.4);
      ctx.lineTo(s.jetskiX + 22, jetskiY + 50 - s.airY * 0.4);
      ctx.lineTo(s.jetskiX - 22, jetskiY + 50 - s.airY * 0.4);
      ctx.closePath();
      ctx.fill();

      // Render Jetski Hero Rider
      ctx.save();
      ctx.translate(s.jetskiX, jetskiY - s.airY * 0.5);

      drawCardSprite(
        ctx,
        playerHeroId,
        -16,
        -16,
        32,
        32,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: s.isTurbo ? '#38bdf8' : '#ffffff',
          shadowBlur: s.isTurbo ? 16 : 8,
          shadowColor: s.isTurbo ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255, 255, 255, 0.7)',
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
      gameId: 'arcade_jetski_surf',
      gameTitle: '블리츠 제트스키 서프',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : Math.round(s.distance * 8)) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.distance >= 350,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 좌우 드래그 슬라롬 레이스' : 'STEP 1: DRAG SLALOM RACE',
      title: isKo ? '화면을 좌우로 드래그해 부표를 통과하세요' : 'Drag Left & Right to Slalom through Buoys',
      description: isKo
        ? '가상 조이스틱 없이 화면을 좌우로 드래그하여 제트스키를 조종하고, 깃발 부표(🚩) 사이를 연속으로 통과하며 400m 결승선까지 질주하세요.'
        : 'Drag horizontally to steer the jetski through buoy gates and sprint to the 400m finish line.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그 조향)',
            '파도 점프대(🌊) 진입 시 공중 스턴트 +400P 보너스',
            '터보 부스트 버튼으로 순간 초고속 파도 질주'
          ]
        : [
            'Zero Virtual Joysticks: 100% Horizontal Drag Steering',
            'Wave Ramps (🌊) launch high air stunts for +400P',
            'Activate Turbo Surge for high-speed wave blasting'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 (Direct Drag)' : 'Direct Screen Drag',
      description: isKo
        ? '손가락을 대고 좌우로 미끄러지듯 이동합니다.'
        : 'Slide your thumb smoothly to weave through gates.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 실시간 즉각 반응 제트스키 조향',
            '⚡ 터보 게이지 충전 시 터보 부스트 발동',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant responsive jetski navigation',
            '⚡ Charge turbo gauge for blazing boost speeds',
            '⏱️ 35s time attack aquatic sprint'
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
            '완주 거리 및 슬라롬 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Distance traveled and slalom combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0369a1] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 제트스키' : 'Blitz Jetski Surf'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}/400m`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '터보' : 'Turbo', value: `${turboEnergy}%`, color: turboEnergy >= 30 ? 'text-cyan-300 font-bold' : 'text-slate-400' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${slalomCombo}x`, color: slalomCombo > 4 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Jetski Racing Canvas Viewport */}
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}

        {/* Turbo Boost Trigger Button Overlay at Bottom-Right */}
        <button
          type="button"
          onClick={handleTurboTrigger}
          disabled={turboEnergy < 30}
          className={`absolute bottom-6 right-6 px-4 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-1.5 transition-all ${
            turboEnergy >= 30
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 scale-105 active:scale-95 animate-pulse'
              : 'bg-slate-800/80 text-slate-500 border border-white/10 opacity-60'
          }`}
        >
          ⚡ TURBO
        </button>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 좌우로 드래그해 부표를 통과하고 터보로 질주하세요' : 'Drag horizontally to weave through buoys and hit turbo'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_jetski_surf"
          gameTitle={isKo ? '블리츠 제트스키: 수상 슬라롬' : 'Blitz Jetski: Water Slalom'}
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
export default VoxelJetskiWaterGame;

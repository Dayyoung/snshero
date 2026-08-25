import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSnowboardSlalomGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SlalomGate {
  id: number;
  x: number;
  y: number;
  type: 'red_gate' | 'blue_gate' | 'boost_pad' | 'snow_gem';
  icon: string;
  points: number;
  radius: number;
  cleared: boolean;
}

export const VoxelSnowboardSlalomGame: React.FC<VoxelSnowboardSlalomGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 93;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [gatesPassed, setGatesPassed] = useState<number>(0);
  const [distanceRun, setDistanceRun] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [slalomCombo, setSlalomCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_alpine_slalom') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const riderY = 410;

  const stateRef = useRef({
    riderX: 180,
    targetRiderX: 180,
    carveAngle: 0,
    gates: [] as SlalomGate[],
    gatesPassed: 0,
    distanceRun: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    gateCounter: 1,
    spawnTimer: 0,
    speed: 430,
    lastGateColor: 'none',
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.riderX = 180;
    s.targetRiderX = 180;
    s.carveAngle = 0;
    s.gates = [];
    s.gatesPassed = 0;
    s.distanceRun = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.gateCounter = 1;
    s.spawnTimer = 0;
    s.speed = 430;
    s.lastGateColor = 'none';
    s.particles = [];

    // Initial Gates on Slope
    s.gates.push(
      { id: s.gateCounter++, x: 100, y: 130, type: 'red_gate', icon: '🚩', points: 350, radius: 26, cleared: false },
      { id: s.gateCounter++, x: 260, y: 220, type: 'blue_gate', icon: '🔷', points: 350, radius: 26, cleared: false }
    );

    setGatesPassed(0);
    setDistanceRun(0);
    setScore(0);
    setSlalomCombo(0);
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

  // Direct Horizontal Drag Handlers (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetRiderX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetRiderX = Math.max(40, Math.min(320, (e.clientX - rect.left) * scaleX));
  };

  // Main 60FPS Slalom Loop
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

      // Rider Carving Lean & Tracking
      const dx = s.targetRiderX - s.riderX;
      s.riderX += dx * Math.min(1, dt * 22);
      s.carveAngle = Math.max(-0.45, Math.min(0.45, dx * 0.018));

      // Distance update
      s.distanceRun += Math.round(s.speed * dt * 0.1);
      setDistanceRun(s.distanceRun);

      // Spawn Zigzag Slalom Gates & Boost Pads
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.65) {
        s.spawnTimer = 0;
        const isRed = s.gateCounter % 2 === 1;
        const isBoost = Math.random() < 0.2;

        const gateX = isRed ? 70 + Math.random() * 80 : 210 + Math.random() * 80;

        s.gates.push({
          id: s.gateCounter++,
          x: isBoost ? 180 : gateX,
          y: -40,
          type: isBoost ? 'boost_pad' : (isRed ? 'red_gate' : 'blue_gate'),
          icon: isBoost ? '⚡' : (isRed ? '🚩' : '🔷'),
          points: isBoost ? 600 : 350,
          radius: isBoost ? 24 : 26,
          cleared: false,
        });
      }

      // Move Slalom Elements Downward
      for (let i = s.gates.length - 1; i >= 0; i--) {
        const g = s.gates[i];
        g.y += s.speed * dt;

        if (!g.cleared && Math.hypot(g.x - s.riderX, g.y - riderY) < g.radius + 18) {
          g.cleared = true;
          s.gatesPassed += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          if (g.type === 'boost_pad') {
            s.speed = Math.min(680, s.speed + 60);
            const pts = g.points + s.combo * 50;
            s.score += pts;
            setFeedbackText(`⚡ SUPER BOOST! +${pts}P ⚡`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          } else {
            const isAlternate = s.lastGateColor !== 'none' && s.lastGateColor !== g.type;
            s.lastGateColor = g.type;
            const pts = g.points + (isAlternate ? 250 : 0) + s.combo * 30;
            s.score += pts;

            setFeedbackText(isAlternate ? `🔥 PERFECT CARVE! +${pts}P` : `GATE! +${pts}P ✨`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }

          setGatesPassed(s.gatesPassed);
          setScore(s.score);
          setSlalomCombo(s.combo);
          setMaxCombo(s.maxCombo);
          setTimeout(() => setFeedbackText(null), 300);

          // Snow Spray Particles
          for (let p = 0; p < 10; p++) {
            s.particles.push({
              x: s.riderX,
              y: riderY,
              vx: (Math.random() - 0.5) * 200,
              vy: Math.random() * 140,
              color: g.type === 'red_gate' ? '#ef4444' : (g.type === 'blue_gate' ? '#38bdf8' : '#fde047'),
              life: 0.4,
            });
          }
        }

        if (g.y > 540) {
          s.gates.splice(i, 1);
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

      // Alpine Snow Slope Gradient
      const alpineGrad = ctx.createLinearGradient(0, 0, 0, h);
      alpineGrad.addColorStop(0, '#93c5fd');
      alpineGrad.addColorStop(0.5, '#dbeafe');
      alpineGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = alpineGrad;
      ctx.fillRect(0, 0, w, h);

      // Carving Ski Lines
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(s.riderX - 6, 0);
      ctx.lineTo(s.riderX - 6, riderY);
      ctx.moveTo(s.riderX + 6, 0);
      ctx.lineTo(s.riderX + 6, riderY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Slalom Gates
      s.gates.forEach((g) => {
        if (!g.cleared) {
          ctx.save();
          ctx.translate(g.x, g.y);
          if (g.type === 'boost_pad') {
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 18;
          } else if (g.type === 'red_gate') {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 14;
          } else {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 14;
          }
          ctx.font = `${g.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(g.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Alpine Rider Hero
      ctx.save();
      ctx.translate(s.riderX, riderY);
      ctx.rotate(s.carveAngle);
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 16;
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⛷️', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [riderY, playSfx]);

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
      gameId: 'arcade_alpine_slalom',
      gameTitle: '블리츠 알파인 슬라롬',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.gatesPassed * 250 + s.distanceRun * 2)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.distanceRun >= 400,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 지그재그 슬라롬 카빙' : 'STEP 1: ZIGZAG SLALOM CARVING',
      title: isKo ? '라이더를 좌우로 드래그해 레드/블루 깃발을 번갈아 통과하세요' : 'Drag left and right to alternate between red and blue gates',
      description: isKo
        ? '가상 조이스틱 없이 화면의 알파인 라이더(⛷️)를 손가락으로 직접 지그재그 좌우 드래그하여 레드 깃발(🚩)과 블루 깃발(🔷)을 교차 통과하고 부스트 패드(⚡)를 밟으세요.'
        : 'Slide left and right to carve smoothly through alternating red and blue slalom gates and hit speed boost pads.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 지그재그 드래그)',
            '레드/블루 교차 퍼펙트 카빙 시 600P 잭팟 대박 보너스',
            '35초간 최대 콤보로 알파인 슬라롬을 완주하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Zigzag Carving Drag',
            'Alternating red/blue gates grant 600P carving jackpot',
            'Cover snowy alpine distance with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 지그재그 드래그' : 'Zigzag Drag Gesture',
      description: isKo
        ? '손가락을 좌우로 부드럽게 밀어 설산 카빙 각도를 제어합니다.'
        : 'Slide your thumb left and right smoothly across alpine slopes.',
      keyPoints: isKo
        ? [
            '👆 지그재그 드래그: 60FPS 즉각 반응 초정밀 카빙 턴',
            '🚩 연속 게이트 통과 시 알파인 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Zigzag Drag: Instant fluid carving turns',
            '🚩 Consecutive gate passes grant combo multipliers',
            '⏱️ 35s time attack alpine slalom sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '슬라롬 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '통과한 깃발 수 및 주행 거리 비례 대량 잭팟',
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
    <div className="relative w-full h-[100dvh] bg-[#dbeafe] text-slate-900 font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 알파인 슬라롬' : 'Blitz Alpine Slalom'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distanceRun}m`, color: 'text-amber-500 font-bold' },
          { label: isKo ? '게이트' : 'Gates', value: `${gatesPassed}개`, color: 'text-blue-600 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-600 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Alpine Slalom Canvas Viewport */}
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
          {isKo ? '손가락으로 라이더를 좌우 드래그해 레드(🚩)/블루(🔷) 깃발을 통과하세요' : 'Drag rider left & right to clear red/blue slalom gates'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_alpine_slalom"
          gameTitle={isKo ? '블리츠 알파인: 설산 슬라롬' : 'Blitz Alpine: Mountain Slalom'}
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
export default VoxelSnowboardSlalomGame;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelFlightLandingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Aircraft {
  id: number;
  type: 'plane' | 'heli' | 'jet';
  icon: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
  path: { x: number; y: number }[];
  isLanded: boolean;
  radius: number;
}

export const VoxelFlightLandingGame: React.FC<VoxelFlightLandingGameProps> = ({
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

  const [landedCount, setLandedCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [landingCombo, setLandingCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_flight_landing') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    aircrafts: [] as Aircraft[],
    selectedCraft: null as Aircraft | null,
    isDrawingPath: false,
    landed: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    craftCounter: 1,
    spawnTimer: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.aircrafts = [];
    s.selectedCraft = null;
    s.isDrawingPath = false;
    s.landed = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.craftCounter = 1;
    s.spawnTimer = 0;

    // Initial Aircraft Spawn
    s.aircrafts.push({
      id: s.craftCounter++,
      type: 'plane',
      icon: '✈️',
      x: 50,
      y: 60,
      vx: 40,
      vy: 20,
      speed: 45,
      angle: Math.atan2(20, 40),
      path: [],
      isLanded: false,
      radius: 16,
    });

    setLandedCount(0);
    setScore(0);
    setLandingCombo(0);
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

  // Touch Handlers for Direct Flight Path Drawing (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const tapX = (e.clientX - rect.left) * scaleX;
    const tapY = (e.clientY - rect.top) * scaleY;

    // Select aircraft nearest to tap
    for (const craft of s.aircrafts) {
      if (!craft.isLanded && Math.hypot(craft.x - tapX, craft.y - tapY) < 32) {
        s.selectedCraft = craft;
        s.isDrawingPath = true;
        craft.path = [{ x: tapX, y: tapY }];
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || !s.isDrawingPath || !s.selectedCraft) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;

    const lastPoint = s.selectedCraft.path[s.selectedCraft.path.length - 1];
    if (!lastPoint || Math.hypot(lastPoint.x - curX, lastPoint.y - curY) > 12) {
      s.selectedCraft.path.push({ x: curX, y: curY });
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    s.isDrawingPath = false;
    s.selectedCraft = null;
  };

  // Main 60FPS Flight Control Loop
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

      const runwayX = 180;
      const runwayY = 430;
      const runwayW = 140;
      const runwayH = 50;

      const helipadX = 70;
      const helipadY = 430;
      const helipadR = 25;

      // Spawn incoming aircrafts
      s.spawnTimer += dt;
      if (s.spawnTimer >= 2.5 && s.aircrafts.length < 5) {
        s.spawnTimer = 0;
        const isLeft = Math.random() > 0.5;
        const isHeli = Math.random() < 0.35;

        const startX = isLeft ? 20 : 340;
        const startY = 40 + Math.random() * 120;
        const targetX = 180 + (Math.random() - 0.5) * 80;
        const targetY = 250 + Math.random() * 80;
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const spd = isHeli ? 35 : 48;

        s.aircrafts.push({
          id: s.craftCounter++,
          type: isHeli ? 'heli' : 'plane',
          icon: isHeli ? '🚁' : '✈️',
          x: startX,
          y: startY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          speed: spd,
          angle,
          path: [],
          isLanded: false,
          radius: 16,
        });
      }

      // Update aircraft movements
      for (let i = s.aircrafts.length - 1; i >= 0; i--) {
        const craft = s.aircrafts[i];

        if (craft.path.length > 0) {
          // Follow drawn flight path
          const target = craft.path[0];
          const dx = target.x - craft.x;
          const dy = target.y - craft.y;
          const dist = Math.hypot(dx, dy);

          craft.angle = Math.atan2(dy, dx);
          const moveStep = craft.speed * dt;

          if (dist <= moveStep) {
            craft.x = target.x;
            craft.y = target.y;
            craft.path.shift();
          } else {
            craft.x += (dx / dist) * moveStep;
            craft.y += (dy / dist) * moveStep;
          }
        } else {
          // Free forward glide
          craft.x += Math.cos(craft.angle) * craft.speed * dt;
          craft.y += Math.sin(craft.angle) * craft.speed * dt;

          // Bounce soft screen edges
          if (craft.x < 20 || craft.x > 340) craft.angle = Math.PI - craft.angle;
          if (craft.y < 30 || craft.y > 360) craft.angle = -craft.angle;
        }

        // Check Touchdown Landing on Runway / Helipad
        if (!craft.isLanded) {
          let landed = false;
          if (
            craft.type === 'plane' &&
            Math.abs(craft.x - runwayX) < runwayW / 2 &&
            Math.abs(craft.y - runwayY) < runwayH / 2
          ) {
            landed = true;
          } else if (
            craft.type === 'heli' &&
            Math.hypot(craft.x - helipadX, craft.y - helipadY) < helipadR
          ) {
            landed = true;
          }

          if (landed) {
            craft.isLanded = true;
            s.landed += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = (craft.type === 'heli' ? 350 : 250) + s.combo * 50;
            s.score += pts;

            setScore(s.score);
            setLandingCombo(s.combo);
            setMaxCombo(s.maxCombo);
            setLandedCount(s.landed);

            setFeedbackText(`TOUCHDOWN! +${pts}P 🛬`);
            setTimeout(() => setFeedbackText(null), 400);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            s.aircrafts.splice(i, 1);
            continue;
          }
        }
      }

      // Mid-Air Collision Check
      for (let i = 0; i < s.aircrafts.length; i++) {
        for (let j = i + 1; j < s.aircrafts.length; j++) {
          const c1 = s.aircrafts[i];
          const c2 = s.aircrafts[j];
          if (!c1.isLanded && !c2.isLanded && Math.hypot(c1.x - c2.x, c1.y - c2.y) < 26) {
            // Collision Crash Game Over!
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            endGame(false);
            return;
          }
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Radar Sky Background (Cyber Slate Green)
      ctx.fillStyle = '#06131c';
      ctx.fillRect(0, 0, w, h);

      // Radar Range Circles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      [80, 160, 240].forEach((r) => {
        ctx.beginPath();
        ctx.arc(w / 2, 220, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Helipad Zone at Bottom-Left
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(helipadX, helipadY, helipadR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '16px serif';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛑 H', helipadX, helipadY);

      // Main Runway at Bottom-Right
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(runwayX - runwayW / 2, runwayY - runwayH / 2, runwayW, runwayH);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(runwayX - runwayW / 2, runwayY - runwayH / 2, runwayW, runwayH);

      // Runway Strip Lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(runwayX - runwayW / 2 + 10, runwayY);
      ctx.lineTo(runwayX + runwayW / 2 - 10, runwayY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '16px serif';
      ctx.fillText('🛫 RUNWAY', runwayX, runwayY - 14);

      // Render Flight Paths (Glowing Cyan Line)
      s.aircrafts.forEach((craft) => {
        if (craft.path.length > 0) {
          ctx.strokeStyle = craft.type === 'heli' ? '#fde047' : '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(craft.x, craft.y);
          craft.path.forEach((pt) => ctx.lineTo(pt.x, pt.y));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Render Aircrafts
      s.aircrafts.forEach((craft) => {
        ctx.save();
        ctx.translate(craft.x, craft.y);
        ctx.rotate(craft.angle + Math.PI / 2);

        ctx.font = '26px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(craft.icon, 0, 0);

        ctx.restore();
      });
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
      gameId: 'arcade_flight_landing',
      gameTitle: '블리츠 플라이트 랜딩',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : s.landed * 300) + s.maxCombo * 60,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.landed >= 6,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 비행기 드래그 유도 착륙' : 'STEP 1: DRAG FLIGHT PATH',
      title: isKo ? '비행기를 활주로로 직접 드래그하세요' : 'Direct Finger Drag to Guide Aircraft to Runway',
      description: isKo
        ? '가상 조이스틱 없이 상공에 진입한 비행기(✈️)나 헬기(🚁)를 터치하여 하단 활주로(🛫)와 헬리패드(🛑)까지 손가락으로 안전 경로를 그려 착륙시키세요.'
        : 'Touch incoming planes and helicopters to draw direct flight paths to the runway and helipad.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 비행 궤적 드래그)',
            '비행기 상호 간 공중 충돌을 피하며 유도하세요',
            '35초간 무사고 안전 착륙 챔피언에 도전하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Path Drawing',
            'Avoid mid-air collisions between incoming aircrafts',
            'Achieve zero-accident perfect touchdowns in 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 경로 그리기 (Path Trace)' : 'Draw Path Gesture',
      description: isKo
        ? '비행기를 누른 채 활주로까지 자유롭게 선을 긋습니다.'
        : 'Flick and drag smoothly from aircraft to the landing zone.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 레이더 항로 궤적 생성',
            '🛬 퍼펙트 터치다운 연속 달성 시 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Touch Drag: Real-time dynamic radar vector paths',
            '🛬 Consecutive touchdowns grant high combo multipliers',
            '⏱️ 35s time attack air-traffic sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '착륙 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '착륙 기체 수 및 터치다운 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Landed aircrafts and touchdown combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#030d14] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 플라이트 랜딩' : 'Blitz Flight Landing'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '착륙' : 'Landed', value: `${landedCount}대`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${landingCombo}x`, color: landingCombo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Flight Landing Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '비행기를 터치하여 하단 활주로/헬리패드로 드래그해 착륙시키세요' : 'Touch aircraft and drag a path to the runway/helipad'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_flight_landing"
          gameTitle={isKo ? '블리츠 플라이트 랜딩: 관제 착륙' : 'Blitz Flight Landing: Air Traffic Control'}
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
export default VoxelFlightLandingGame;

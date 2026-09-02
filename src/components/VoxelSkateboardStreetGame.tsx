import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSkateboardStreetGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface StreetElement {
  id: number;
  x: number;
  y: number;
  type: 'rail' | 'cone' | 'star' | 'ramp';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  cleared: boolean;
}

export const VoxelSkateboardStreetGame: React.FC<VoxelSkateboardStreetGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 92;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [tricksPerformed, setTricksPerformed] = useState<number>(0);
  const [distanceRun, setDistanceRun] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [skateCombo, setSkateCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_skate_street') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const groundY = 410;

  const stateRef = useRef({
    skaterY: groundY,
    skaterVy: 0,
    isInAir: false,
    isGrinding: false,
    boardFlipAngle: 0,
    elements: [] as StreetElement[],
    tricksPerformed: 0,
    distanceRun: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    elemCounter: 1,
    spawnTimer: 0,
    touchStart: { x: 0, y: 0, time: 0 },
    isHolding: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.skaterY = groundY;
    s.skaterVy = 0;
    s.isInAir = false;
    s.isGrinding = false;
    s.boardFlipAngle = 0;
    s.elements = [];
    s.tricksPerformed = 0;
    s.distanceRun = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.elemCounter = 1;
    s.spawnTimer = 0;
    s.isHolding = false;
    s.particles = [];

    // Initial items on road
    s.elements.push(
      { id: s.elemCounter++, x: 200, y: groundY - 20, type: 'star', cardId: 100, icon: '⭐', points: 250, radius: 20, cleared: false },
      { id: s.elemCounter++, x: 380, y: groundY - 10, type: 'rail', cardId: 58, icon: '🛹', points: 600, radius: 28, cleared: false }
    );

    setTricksPerformed(0);
    setDistanceRun(0);
    setScore(0);
    setSkateCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [groundY]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          const isTargetMet = stateRef.current.tricksPerformed >= 8;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Pure Touch Gestures: Swipe Up to Ollie Jump, Swipe Left/Right in Air for Kickflip, Hold on Rail for Grind
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    s.isHolding = true;
    s.touchStart = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const dx = endX - s.touchStart.x;
    const dy = endY - s.touchStart.y;

    s.isHolding = false;

    // Gesture Classification
    if (!s.isInAir && dy < -35) {
      // Swipe Up: Ollie Jump!
      s.isInAir = true;
      s.skaterVy = -480;
      s.boardFlipAngle = 0;
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

      setFeedbackText(isKo ? '🔥 OLLIE JUMP!' : '🔥 OLLIE JUMP!');
      setTimeout(() => setFeedbackText(null), 300);
    } else if (s.isInAir && Math.abs(dx) > 30) {
      // Swipe Left or Right in Air: 360 Kickflip Trick!
      s.boardFlipAngle += Math.PI * 2;
      s.tricksPerformed += 1;
      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      const pts = 450 + s.combo * 40;
      s.score += pts;

      setTricksPerformed(s.tricksPerformed);
      setScore(s.score);
      setSkateCombo(s.combo);
      setMaxCombo(s.maxCombo);

      setFeedbackText(`🛹 KICKFLIP 360° +${pts}P ✨`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      setTimeout(() => setFeedbackText(null), 400);

      // Trick Sparkles
      for (let p = 0; p < 10; p++) {
        s.particles.push({
          x: 100,
          y: s.skaterY,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          color: '#fde047',
          life: 0.4,
        });
      }
    }
  };

  // Main 60FPS Skate Street Loop
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

      const speed = 400;

      // Physics: Air Gravity & Skater Jump
      if (s.isInAir) {
        s.skaterVy += 980 * dt; // Gravity
        s.skaterY += s.skaterVy * dt;

        if (s.skaterY >= groundY) {
          s.skaterY = groundY;
          s.skaterVy = 0;
          s.isInAir = false;
          s.boardFlipAngle = 0;
        }
      }

      // Distance update
      s.distanceRun += Math.round(speed * dt * 0.1);
      setDistanceRun(s.distanceRun);

      // Spawn Elements (Rails, Cones, Stars, Ramps)
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.85) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isRail = rand < 0.35;
        const isCone = rand >= 0.35 && rand < 0.65;
        const cardId = isRail ? 58 : (isCone ? 34 : 100);

        s.elements.push({
          id: s.elemCounter++,
          x: 400,
          y: isRail ? groundY - 15 : (isCone ? groundY - 5 : groundY - 60),
          type: isRail ? 'rail' : (isCone ? 'cone' : 'star'),
          cardId,
          icon: isRail ? '🛹' : (isCone ? '🚧' : '⭐'),
          points: isRail ? 600 : (isCone ? -250 : 300),
          radius: isRail ? 28 : (isCone ? 20 : 18),
          cleared: false,
        });
      }

      // Move Street Elements (Leftward scroll)
      for (let i = s.elements.length - 1; i >= 0; i--) {
        const elem = s.elements[i];
        elem.x -= speed * dt;

        const skaterX = 100;
        const dist = Math.hypot(elem.x - skaterX, elem.y - s.skaterY);

        if (!elem.cleared && dist < elem.radius + 20) {
          elem.cleared = true;

          if (elem.type === 'cone') {
            if (!s.isInAir) {
              // Hit obstacle penalty
              s.score = Math.max(0, s.score - 250);
              s.combo = 0;
              setScore(s.score);
              setSkateCombo(0);

              setFeedbackText(isKo ? '장애물 충돌! 💥' : 'CRASH! 💥');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              setTimeout(() => setFeedbackText(null), 300);
            } else {
              // Cleared obstacle with Ollie jump!
              s.combo += 1;
              s.score += 350;
              setScore(s.score);
              setSkateCombo(s.combo);
            }
          } else if (elem.type === 'rail') {
            // Rail Grind!
            s.isGrinding = true;
            s.tricksPerformed += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = elem.points + s.combo * 50;
            s.score += pts;

            setTricksPerformed(s.tricksPerformed);
            setScore(s.score);
            setSkateCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`🔥 50-50 RAIL GRIND! +${pts}P ⚡`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            setTimeout(() => setFeedbackText(null), 400);

            // Grind Sparks
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: skaterX,
                y: s.skaterY + 10,
                vx: (Math.random() - 0.5) * 220,
                vy: -Math.random() * 150,
                color: '#f97316',
                life: 0.4,
              });
            }
          } else if (elem.type === 'star') {
            // Star collect
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = elem.points + s.combo * 30;
            s.score += pts;

            setScore(s.score);
            setSkateCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`STAR! ⭐ +${pts}P`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);
          }
        }

        if (elem.x < -60) {
          s.elements.splice(i, 1);
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

      // Sunset Skatepark Skyline Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#f97316');
      skyGrad.addColorStop(0.5, '#7c3aed');
      skyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Asphalt Street Ground
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, groundY + 15, w, h - (groundY + 15));
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 15);
      ctx.lineTo(w, groundY + 15);
      ctx.stroke();

      // Render Street Elements (Card Sprites)
      s.elements.forEach((elem) => {
        if (!elem.cleared) {
          ctx.save();
          ctx.translate(elem.x, elem.y);

          drawCardSprite(
            ctx,
            elem.cardId,
            -elem.radius,
            -elem.radius,
            elem.radius * 2,
            elem.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: elem.type === 'rail' ? '#f97316' : (elem.type === 'star' ? '#fde047' : '#ef4444'),
              shadowBlur: elem.type === 'rail' || elem.type === 'star' ? 16 : 6,
              shadowColor: elem.type === 'rail' ? 'rgba(249, 115, 22, 0.9)' : (elem.type === 'star' ? 'rgba(253, 224, 71, 0.9)' : 'rgba(239, 68, 68, 0.7)'),
            }
          );

          ctx.restore();
        }
      });

      // Render Skateboard Hero (Player Hero Badge)
      ctx.save();
      ctx.translate(100, s.skaterY);
      ctx.rotate(s.boardFlipAngle);

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
  }, [groundY, isKo, playSfx, playerHeroId]);

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
      gameId: 'arcade_skate_street',
      gameTitle: '블리츠 스케이트 스트리트',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.tricksPerformed * 300 + s.distanceRun * 2)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.tricksPerformed >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 제스처 스케이트 트릭' : 'STEP 1: PURE GESTURE SKATE TRICKS',
      title: isKo ? '화면 위 스와이프로 알리 점프, 공중 좌우 스와이프로 킥플립을 구사하세요' : 'Swipe Up for Ollie Jump, Swipe Left/Right in Air for Kickflip',
      description: isKo
        ? '가상 조이스틱 없이 화면을 위로 스와이프하여 장애물을 뛰어넘고, 공중에서 좌우로 스와이프하여 360 킥플립 트릭을 시전하며 레일을 타고 그라인드하세요.'
        : 'Swipe up to execute high ollie jumps, swipe left or right in air to kickflip 360, and grind along rails.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 모바일 퓨어 제스처 조작)',
            '레일 그라인드 성공 시 600P 잭팟 대박 보너스',
            '35초간 최대 콤보로 스트리트 트릭을 완성하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Mobile Pure Gestures',
            'Rail Grinds award 600P massive trick jackpot',
            'Perform street combos within 35s sprint'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '위로 스와이프 & 공중 좌우 스와이프' : 'Swipe Up & Air Swipes',
      description: isKo
        ? '지상에서 위로 쓸어올리고 공중에서 좌우로 쓸어 트릭을 넣습니다.'
        : 'Swipe up on ground to jump, swipe left/right in air for trick.',
      keyPoints: isKo
        ? [
            '⬆️ 위로 스와이프: 고공 알리 점프 (Ollie Jump)',
            '↔️ 공중 좌우 스와이프: 360° 익스트림 킥플립',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '⬆️ Swipe Up: High air Ollie jump',
            '↔️ Air Swipe: 360° extreme Kickflip combo',
            '⏱️ 35s time attack skate street sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '라이딩 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '구사한 트릭 수 및 주행 거리 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Performed tricks and distance multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 스케이트 스트리트' : 'Blitz Skate Street'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '트릭' : 'Tricks', value: `${tricksPerformed}회`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${skateCombo}x`, color: skateCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Skate Street Canvas Viewport */}
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '위로 스와이프해 점프하고, 공중에서 좌우 스와이프로 360 킥플립을 구사하세요' : 'Swipe up to Ollie jump, swipe left/right in air for 360 kickflip'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_skate_street"
          gameTitle={isKo ? '블리츠 스케이트: 스트리트 익스트림' : 'Blitz Skate: Street Extreme'}
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
export default VoxelSkateboardStreetGame;

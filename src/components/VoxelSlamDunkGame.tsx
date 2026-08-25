import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSlamDunkGameProps {
  deck: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface FlyingBasketball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  state: 'flying' | 'scored' | 'missed';
}

export const VoxelSlamDunkGame: React.FC<VoxelSlamDunkGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 76;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [basketsScored, setBasketsScored] = useState<number>(0);
  const [ballsLeft, setBallsLeft] = useState<number>(20);
  const [score, setScore] = useState<number>(0);
  const [dunkStreak, setDunkStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_slam_dunk') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const ballOriginX = 180;
  const ballOriginY = 430;
  const rimX = 180;
  const rimY = 130;
  const rimRadius = 26;

  const stateRef = useRef({
    balls: [] as FlyingBasketball[],
    hoopMovingX: 180,
    hoopVx: 70,
    basketsScored: 0,
    ballsLeft: 20,
    score: 0,
    streak: 0,
    maxStreak: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    touchStart: { x: 0, y: 0, time: 0 },
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.balls = [];
    s.hoopMovingX = 180;
    s.hoopVx = 70;
    s.basketsScored = 0;
    s.ballsLeft = 20;
    s.score = 0;
    s.streak = 0;
    s.maxStreak = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.particles = [];

    setBasketsScored(0);
    setBallsLeft(20);
    setScore(0);
    setDunkStreak(0);
    setMaxStreak(0);
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

  // Pure Touch Flick Gestures: Swipe Up towards the Hoop
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.ballsLeft <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    s.touchStart = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.ballsLeft <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const dx = endX - s.touchStart.x;
    const dy = endY - s.touchStart.y;
    const dt = Math.max(1, Date.now() - s.touchStart.time);

    // Upward Flick Check
    if (dy < -30) {
      s.ballsLeft -= 1;
      setBallsLeft(s.ballsLeft);

      const flickSpeedY = Math.max(-650, Math.min(-380, (dy / dt) * 600));
      const flickSpeedX = (dx / dt) * 350;

      s.balls.push({
        x: ballOriginX,
        y: ballOriginY,
        vx: flickSpeedX,
        vy: flickSpeedY,
        scale: 1.0,
        state: 'flying',
      });

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  // Main 60FPS Basketball Loop
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

      // Moving Basketball Hoop (Patrols Left & Right)
      s.hoopMovingX += s.hoopVx * dt;
      if (s.hoopMovingX > 270) {
        s.hoopMovingX = 270;
        s.hoopVx = -Math.abs(s.hoopVx);
      } else if (s.hoopMovingX < 90) {
        s.hoopMovingX = 90;
        s.hoopVx = Math.abs(s.hoopVx);
      }

      // Update Flying Basketballs
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        if (b.state === 'flying') {
          b.vy += 520 * dt; // Gravity
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.scale = Math.max(0.65, b.scale - dt * 0.4);

          // Check Basket Rim Hit
          const distToRim = Math.hypot(b.x - s.hoopMovingX, b.y - rimY);
          if (distToRim < rimRadius + 10 && b.vy > 0) {
            // Swish / Slam Dunk!
            b.state = 'scored';
            s.basketsScored += 1;
            s.streak += 1;
            if (s.streak > s.maxStreak) s.maxStreak = s.streak;

            const isSwish = distToRim < 14;
            const pts = (isSwish ? 600 : 400) + s.streak * 50;
            s.score += pts;

            setBasketsScored(s.basketsScored);
            setScore(s.score);
            setDunkStreak(s.streak);
            setMaxStreak(s.maxStreak);

            setFeedbackText(isSwish ? `🔥 PERFECT SWISH! +${pts}P 🔥` : `SLAM DUNK! 🏀 +${pts}P`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            setTimeout(() => setFeedbackText(null), 400);

            // Net & Flame Sparkles
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: s.hoopMovingX,
                y: rimY,
                vx: (Math.random() - 0.5) * 220,
                vy: (Math.random() - 0.5) * 220,
                color: isSwish ? '#f97316' : '#fde047',
                life: 0.5,
              });
            }
          }

          if (b.y > 520 || b.x < 10 || b.x > 350) {
            b.state = 'missed';
            s.streak = 0;
            setDunkStreak(0);
          }
        } else {
          s.balls.splice(i, 1);
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

      // Arena Stadium Hardwood Court Background
      const courtGrad = ctx.createLinearGradient(0, 0, 0, h);
      courtGrad.addColorStop(0, '#1e1b4b');
      courtGrad.addColorStop(0.5, '#7c2d12');
      courtGrad.addColorStop(1, '#431407');
      ctx.fillStyle = courtGrad;
      ctx.fillRect(0, 0, w, h);

      // Court 3-Point Arc Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.hoopMovingX, rimY, 130, 0, Math.PI);
      ctx.stroke();

      // Render Moving Basketball Backboard & Rim
      ctx.save();
      ctx.translate(s.hoopMovingX, rimY);

      // Backboard
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(-38, -35, 76, 35);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(-18, -20, 36, 20);

      // Orange Metal Rim
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, rimRadius, 0, Math.PI);
      ctx.stroke();

      // Net
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-rimRadius, 0);
      ctx.lineTo(-rimRadius * 0.6, 26);
      ctx.lineTo(rimRadius * 0.6, 26);
      ctx.lineTo(rimRadius, 0);
      ctx.stroke();
      ctx.restore();

      // Render Flying Basketballs
      s.balls.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.scale, b.scale);
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 15;
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏀', 0, 0);
        ctx.restore();
      });

      // Render Ready Basketball at Bottom
      ctx.save();
      ctx.translate(ballOriginX, ballOriginY);
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 18;
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏀', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
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
      gameId: 'arcade_slam_dunk',
      gameTitle: '블리츠 슬램덩크',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.basketsScored * 300) + s.maxStreak * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.basketsScored >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 플릭 농구 슛' : 'STEP 1: SWIPE UP FLICK SHOOTING',
      title: isKo ? '농구공을 골대를 향해 손가락으로 쓸어올려 슛을 넣으세요' : 'Flick the basketball upward toward the moving hoop',
      description: isKo
        ? '가상 조이스틱 없이 하단의 농구공(🏀)을 손가락으로 골대를 향해 빠르게 위로 쓸어올려(Swipe Flick) 클린 스위시 골과 슬램덩크를 꽂아넣으세요.'
        : 'Flick your finger upward to shoot the basketball into the moving hoop for swish points and slam dunk streaks.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 플릭 슛)',
            '클린 스위시 골 성공 시 600P 잭팟 대박 보너스',
            '35초간 최대 연속 골(ON FIRE)로 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Swipe Up Flick Shoot',
            'Clean Swish shots award 600P massive bonus',
            'Score continuous ON FIRE streaks within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 위로 스와이프 플릭 (Swipe Up Flick)' : 'Swipe Up Flick Gesture',
      description: isKo
        ? '손가락으로 공을 잡고 위로 힘껏 밀어올려 슛을 날립니다.'
        : 'Flick your thumb upward with speed and direction.',
      keyPoints: isKo
        ? [
            '⬆️ 위로 플릭: 실시간 각도와 속도가 반영된 슛 궤적',
            '🔥 연속 골 성공 시 버닝 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '⬆️ Swipe Flick: Physics trajectory based on swipe vector',
            '🔥 Consecutive baskets ignite ON FIRE bonus multipliers',
            '⏱️ 35s time attack slam dunk sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '경기 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '성공한 골 수 및 연속 골 스트릭 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Scored baskets count and streak multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#431407] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 슬램덩크' : 'Blitz Slam Dunk'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '득점' : 'Goals', value: `${basketsScored}골`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '공' : 'Balls', value: `${ballsLeft}구`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Slam Dunk Canvas Viewport */}
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
          {isKo ? '농구공을 골대를 향해 손가락으로 빠르게 쓸어올려 슛을 넣으세요' : 'Flick basketball upward toward the moving hoop to score'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_slam_dunk"
          gameTitle={isKo ? '블리츠 슬램덩크: 농구 슛' : 'Blitz Slam Dunk: Basketball Shoot'}
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
export default VoxelSlamDunkGame;

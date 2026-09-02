import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSuperStrikersGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface FlyingBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  state: 'flying' | 'scored' | 'blocked' | 'missed';
}

export const VoxelSuperStrikersGame: React.FC<VoxelSuperStrikersGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 60;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [goalsScored, setGoalsScored] = useState<number>(0);
  const [ballsLeft, setBallsLeft] = useState<number>(15);
  const [score, setScore] = useState<number>(0);
  const [goalStreak, setGoalStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_super_striker') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const ballOriginX = 180;
  const ballOriginY = 430;
  const goalTopY = 90;
  const goalBottomY = 170;
  const goalLeftX = 60;
  const goalRightX = 300;

  const stateRef = useRef({
    balls: [] as FlyingBall[],
    keeperX: 180,
    keeperVx: 90,
    defenderX: 140,
    defenderVx: -70,
    goalsScored: 0,
    ballsLeft: 15,
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
    s.keeperX = 180;
    s.keeperVx = 90;
    s.defenderX = 140;
    s.defenderVx = -70;
    s.goalsScored = 0;
    s.ballsLeft = 15;
    s.score = 0;
    s.streak = 0;
    s.maxStreak = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.particles = [];

    setGoalsScored(0);
    setBallsLeft(15);
    setScore(0);
    setGoalStreak(0);
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
          const isTargetMet = stateRef.current.goalsScored >= 6;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Pure Touch Swipe Curve Kick Handlers
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

    if (dy < -30) {
      s.ballsLeft -= 1;
      setBallsLeft(s.ballsLeft);

      const flickSpeedY = Math.max(-680, Math.min(-420, (dy / dt) * 650));
      const flickSpeedX = (dx / dt) * 450;

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

  // Main 60FPS Free Kick Striker Loop
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

      // Moving Goalkeeper (Guards Goal Line)
      s.keeperX += s.keeperVx * dt;
      if (s.keeperX > goalRightX - 35) {
        s.keeperX = goalRightX - 35;
        s.keeperVx = -Math.abs(s.keeperVx);
      } else if (s.keeperX < goalLeftX + 35) {
        s.keeperX = goalLeftX + 35;
        s.keeperVx = Math.abs(s.keeperVx);
      }

      // Moving Defender Wall (Midfield)
      s.defenderX += s.defenderVx * dt;
      if (s.defenderX > 250) {
        s.defenderX = 250;
        s.defenderVx = -Math.abs(s.defenderVx);
      } else if (s.defenderX < 110) {
        s.defenderX = 110;
        s.defenderVx = Math.abs(s.defenderVx);
      }

      // Update Flying Soccer Balls
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        if (b.state === 'flying') {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.scale = Math.max(0.55, b.scale - dt * 0.6);

          // Check Defender Wall Block (at y ~ 280)
          if (b.y > 260 && b.y < 300) {
            if (Math.abs(b.x - s.defenderX) < 28) {
              b.state = 'blocked';
              s.streak = 0;
              setGoalStreak(0);
              setFeedbackText(isKo ? '수비벽에 막힘! 🛡️' : 'DEFENDER BLOCKED! 🛡️');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              setTimeout(() => setFeedbackText(null), 300);
            }
          }

          // Check Goal Line (at y ~ 130)
          if (b.y <= goalBottomY && b.y >= goalTopY && b.state === 'flying') {
            const isInsideGoal = b.x >= goalLeftX && b.x <= goalRightX;
            const distToKeeper = Math.hypot(b.x - s.keeperX, b.y - (goalTopY + 30));

            if (isInsideGoal) {
              if (distToKeeper < 32) {
                // Goalkeeper Save
                b.state = 'blocked';
                s.streak = 0;
                setGoalStreak(0);
                setFeedbackText(isKo ? '골키퍼 선방! 🧤' : 'KEEPER SAVE! 🧤');
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                setTimeout(() => setFeedbackText(null), 300);
              } else {
                // GOAL!
                b.state = 'scored';
                s.goalsScored += 1;
                s.streak += 1;
                if (s.streak > s.maxStreak) s.maxStreak = s.streak;

                const isTopCorner = (b.x < goalLeftX + 35 || b.x > goalRightX - 35) && b.y < goalTopY + 35;
                const pts = (isTopCorner ? 600 : 400) + s.streak * 50;
                s.score += pts;

                setGoalsScored(s.goalsScored);
                setScore(s.score);
                setGoalStreak(s.streak);
                setMaxStreak(s.maxStreak);

                setFeedbackText(isTopCorner ? `🔥 TOP CORNER BANGER! +${pts}P ⚽` : `GOAL! ⚽ +${pts}P`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                setTimeout(() => setFeedbackText(null), 400);

                // Goal net particles
                for (let p = 0; p < 14; p++) {
                  s.particles.push({
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 240,
                    vy: (Math.random() - 0.5) * 240,
                    color: isTopCorner ? '#fde047' : '#38bdf8',
                    life: 0.5,
                  });
                }
              }
            } else {
              b.state = 'missed';
              s.streak = 0;
              setGoalStreak(0);
            }
          }

          if (b.y < 30 || b.x < 10 || b.x > 350) {
            b.state = 'missed';
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

      // Stadium Night Green Turf Background
      const pitchGrad = ctx.createLinearGradient(0, 0, 0, h);
      pitchGrad.addColorStop(0, '#064e3b');
      pitchGrad.addColorStop(0.5, '#047857');
      pitchGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = pitchGrad;
      ctx.fillRect(0, 0, w, h);

      // Penalty Box Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(goalLeftX - 15, goalTopY, (goalRightX - goalLeftX) + 30, 200);

      // Goal Post Net
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(goalLeftX, goalTopY, goalRightX - goalLeftX, goalBottomY - goalTopY);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(goalLeftX, goalTopY, goalRightX - goalLeftX, goalBottomY - goalTopY);

      // Render Goalkeeper (Card Sprite)
      ctx.save();
      ctx.translate(s.keeperX, goalTopY + 35);

      drawCardSprite(
        ctx,
        78,
        -20,
        -20,
        40,
        40,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#fde047',
          shadowBlur: 14,
          shadowColor: 'rgba(253, 224, 71, 0.9)',
        }
      );

      ctx.restore();

      // Render Defender Wall (Card Sprite)
      ctx.save();
      ctx.translate(s.defenderX, 280);

      drawCardSprite(
        ctx,
        34,
        -18,
        -18,
        36,
        36,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#ef4444',
          shadowBlur: 12,
          shadowColor: 'rgba(239, 68, 68, 0.8)',
        }
      );

      ctx.restore();

      // Render Flying Balls (Player Hero Badge)
      s.balls.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.scale, b.scale);

        drawCardSprite(
          ctx,
          playerHeroId,
          -18,
          -18,
          36,
          36,
          {
            circleClip: true,
            borderWidth: 2,
            borderColor: '#ffffff',
            shadowBlur: 14,
            shadowColor: 'rgba(255, 255, 255, 0.9)',
          }
        );

        ctx.restore();
      });

      // Render Ready Soccer Ball at Bottom (Player Hero Badge)
      ctx.save();
      ctx.translate(ballOriginX, ballOriginY);

      drawCardSprite(
        ctx,
        playerHeroId,
        -22,
        -22,
        44,
        44,
        {
          circleClip: true,
          borderWidth: 2.5,
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
  }, [goalBottomY, goalLeftX, goalRightX, goalTopY, isKo, playSfx, playerHeroId]);

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
      gameId: 'arcade_super_striker',
      gameTitle: '블리츠 슈퍼 스트라이커',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.goalsScored * 350) + s.maxStreak * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.goalsScored >= 6,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 감아차기 프리킥 슛' : 'STEP 1: SWIPE CURVE FREE KICK',
      title: isKo ? '축구공을 골대 구석으로 손가락을 쓸어 감아차세요' : 'Swipe your finger to curve the soccer ball past keeper & wall',
      description: isKo
        ? '가상 조이스틱 없이 하단의 축구공(⚽)을 손가락으로 골대를 향해 쓸어올려(Swipe Curve) 수비벽(🛡️)과 골키퍼(🧤)를 피해 골망 상단 구석에 꽂아넣으세요.'
        : 'Flick and curve your finger to score top-corner free kicks past moving defenders and the goalkeeper.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 감아차기 슛)',
            '골대 상단 구석 탑코너 성공 시 600P 잭팟 대박 보너스',
            '35초간 최대 연속 골(ON FIRE)로 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Swipe Curve Free Kicks',
            'Top corner bangers award 600P massive goal jackpot',
            'Score continuous goal streaks within 35s match sprint'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 스와이프 감아차기' : 'Swipe Curve Gesture',
      description: isKo
        ? '손가락으로 공을 밀어 올리며 좌우 궤적을 줍니다.'
        : 'Flick your thumb upward with left/right curve vectors.',
      keyPoints: isKo
        ? [
            '⬆️ 위로 스와이프: 실시간 속도와 각도가 반영된 탄도 궤적',
            '⚽ 연속 골 성공 시 스트라이커 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '⬆️ Swipe Curve: Realistic physics curve trajectory',
            '⚽ Consecutive goals grant striker combo multipliers',
            '⏱️ 35s time attack free kick sprint'
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
            'Scored goals count and streak multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#022c22] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 슈퍼 스트라이커' : 'Blitz Super Striker'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '득점' : 'Goals', value: `${goalsScored}골`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '공' : 'Balls', value: `${ballsLeft}구`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Super Striker Canvas Viewport */}
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
          {isKo ? '축구공을 골대를 향해 손가락으로 쓸어올려 감아차세요' : 'Swipe soccer ball upward toward the goal to curve shoot'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_super_striker"
          gameTitle={isKo ? '블리츠 슈퍼 스트라이커: 프리킥' : 'Blitz Super Striker: Free Kick'}
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
export default VoxelSuperStrikersGame;

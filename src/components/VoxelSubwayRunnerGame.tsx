import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSubwayRunnerGameProps {
  deck: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface TrackItem {
  id: number;
  lane: number; // 0: Left, 1: Center, 2: Right
  y: number;
  type: 'train' | 'barrier' | 'coin' | 'board';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  cleared: boolean;
}

export const VoxelSubwayRunnerGame: React.FC<VoxelSubwayRunnerGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 72;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [distanceRun, setDistanceRun] = useState<number>(0);
  const [hasHoverboard, setHasHoverboard] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [subwayCombo, setSubwayCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_subway_runner') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const laneX = [85, 180, 275];
  const playerY = 410;

  const stateRef = useRef({
    currentLane: 1,
    targetLaneX: 180,
    playerX: 180,
    jumpOffset: 0,
    isJumping: false,
    jumpVy: 0,
    isSliding: false,
    slideTimer: 0,
    hasHoverboard: false,
    boardTimer: 0,
    items: [] as TrackItem[],
    coinsCollected: 0,
    distanceRun: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    itemCounter: 1,
    spawnTimer: 0,
    speed: 430,
    touchStart: { x: 0, y: 0, time: 0 },
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.currentLane = 1;
    s.targetLaneX = 180;
    s.playerX = 180;
    s.jumpOffset = 0;
    s.isJumping = false;
    s.jumpVy = 0;
    s.isSliding = false;
    s.slideTimer = 0;
    s.hasHoverboard = false;
    s.boardTimer = 0;
    s.items = [];
    s.coinsCollected = 0;
    s.distanceRun = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.itemCounter = 1;
    s.spawnTimer = 0;
    s.speed = 430;
    s.particles = [];

    // Initial items on tracks
    s.items.push(
      { id: s.itemCounter++, lane: 0, y: 140, type: 'coin', cardId: 100, icon: '🪙', points: 250, radius: 20, cleared: false },
      { id: s.itemCounter++, lane: 2, y: 220, type: 'board', cardId: 58, icon: '🛹', points: 600, radius: 24, cleared: false }
    );

    setCoinsCollected(0);
    setDistanceRun(0);
    setHasHoverboard(false);
    setScore(0);
    setSubwayCombo(0);
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

  // Pure Touch Gestures: 4-Way Swipes (Left/Right Lane, Up Jump, Down Slide)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

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
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const dx = endX - s.touchStart.x;
    const dy = endY - s.touchStart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) {
        // Swipe Right
        s.currentLane = Math.min(2, s.currentLane + 1);
        s.targetLaneX = laneX[s.currentLane];
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      } else if (dx < -30) {
        // Swipe Left
        s.currentLane = Math.max(0, s.currentLane - 1);
        s.targetLaneX = laneX[s.currentLane];
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
    } else {
      if (dy < -30 && !s.isJumping) {
        // Swipe Up: Jump!
        s.isJumping = true;
        s.jumpVy = -480;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      } else if (dy > 30) {
        // Swipe Down: Slide!
        s.isSliding = true;
        s.slideTimer = 0.6;
        if (s.isJumping) {
          s.jumpVy = 600; // Fast drop
        }
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
    }
  };

  // Main 60FPS Subway Runner Loop
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

      // Smooth Lane Switching
      s.playerX += (s.targetLaneX - s.playerX) * Math.min(1, dt * 20);

      // Jump Physics
      if (s.isJumping) {
        s.jumpVy += 980 * dt;
        s.jumpOffset += s.jumpVy * dt;
        if (s.jumpOffset >= 0) {
          s.jumpOffset = 0;
          s.isJumping = false;
          s.jumpVy = 0;
        }
      }

      // Slide Timer
      if (s.isSliding) {
        s.slideTimer -= dt;
        if (s.slideTimer <= 0) {
          s.isSliding = false;
        }
      }

      // Hoverboard Timer
      if (s.hasHoverboard) {
        s.boardTimer -= dt;
        if (s.boardTimer <= 0) {
          s.hasHoverboard = false;
          setHasHoverboard(false);
        }
      }

      // Distance update
      s.distanceRun += Math.round(s.speed * dt * 0.1);
      setDistanceRun(s.distanceRun);

      // Spawn Subway Items
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.65) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isTrain = rand < 0.35;
        const isBarrier = rand >= 0.35 && rand < 0.6;
        const isBoard = rand >= 0.6 && rand < 0.72;
        const cardId = isBoard ? 58 : (isTrain ? 78 : (isBarrier ? 34 : 100));

        const targetLane = Math.floor(Math.random() * 3);

        s.items.push({
          id: s.itemCounter++,
          lane: targetLane,
          y: -40,
          type: isBoard ? 'board' : (isTrain ? 'train' : (isBarrier ? 'barrier' : 'coin')),
          cardId,
          icon: isBoard ? '🛹' : (isTrain ? '🚆' : (isBarrier ? '🚧' : '🪙')),
          points: isBoard ? 600 : (isTrain ? -300 : (isBarrier ? -200 : 250)),
          radius: isBoard ? 24 : (isTrain ? 30 : 22),
          cleared: false,
        });
      }

      // Move Items Downward
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.y += s.speed * dt;

        const itemLaneX = laneX[item.lane];
        const dist = Math.hypot(itemLaneX - s.playerX, item.y - (playerY + s.jumpOffset));

        if (!item.cleared && dist < item.radius + 20) {
          item.cleared = true;

          if (item.type === 'train' || item.type === 'barrier') {
            const canDodgeWithJump = item.type === 'barrier' && s.jumpOffset < -25;
            const canDodgeWithSlide = item.type === 'barrier' && s.isSliding;

            if (s.hasHoverboard) {
              // Hoverboard shield absorbs hit!
              s.score += 300;
              setFeedbackText('HOVERBOARD SHIELD! 💥 +300P');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            } else if (canDodgeWithJump || canDodgeWithSlide) {
              // Perfect Jump or Slide Dodge!
              s.combo += 1;
              s.score += 400;
              setFeedbackText('DODGE CLEAR! ✨ +400P');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            } else {
              // Hit Penalty
              s.score = Math.max(0, s.score - 250);
              s.combo = 0;
              setScore(s.score);
              setSubwayCombo(0);

              setFeedbackText(isKo ? '충돌! 감속 발생 💥' : 'CRASH! 💥');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              setTimeout(() => setFeedbackText(null), 300);

              // Sparks
              for (let p = 0; p < 10; p++) {
                s.particles.push({
                  x: s.playerX,
                  y: playerY,
                  vx: (Math.random() - 0.5) * 200,
                  vy: (Math.random() - 0.5) * 200,
                  color: '#ef4444',
                  life: 0.4,
                });
              }
            }
          } else if (item.type === 'board') {
            // Hoverboard Boost!
            s.hasHoverboard = true;
            s.boardTimer = 6;
            setHasHoverboard(true);

            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = item.points + s.combo * 50;
            s.score += pts;

            setFeedbackText(`🛹 HOVERBOARD RUSH! +${pts}P ⚡`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            setTimeout(() => setFeedbackText(null), 400);
          } else {
            // Coin Collect
            s.coinsCollected += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = item.points + s.combo * 30;
            s.score += pts;

            setCoinsCollected(s.coinsCollected);
            setScore(s.score);
            setSubwayCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`COIN! 🪙 +${pts}P`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);
          }
        }

        if (item.y > 540) {
          s.items.splice(i, 1);
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

      // Subway Tunnel Neon Gradient
      const subwayGrad = ctx.createLinearGradient(0, 0, 0, h);
      subwayGrad.addColorStop(0, '#0f172a');
      subwayGrad.addColorStop(0.5, '#1e1b4b');
      subwayGrad.addColorStop(1, '#020617');
      ctx.fillStyle = subwayGrad;
      ctx.fillRect(0, 0, w, h);

      // 3 Train Rail Tracks
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 14]);
      ctx.lineDashOffset = -s.distanceRun * 2;
      laneX.forEach((lx) => {
        ctx.beginPath();
        ctx.moveTo(lx - 16, 0);
        ctx.lineTo(lx - 16, h);
        ctx.moveTo(lx + 16, 0);
        ctx.lineTo(lx + 16, h);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Render Items (Card Sprites)
      s.items.forEach((item) => {
        if (!item.cleared) {
          ctx.save();
          ctx.translate(laneX[item.lane], item.y);

          drawCardSprite(
            ctx,
            item.cardId,
            -item.radius,
            -item.radius,
            item.radius * 2,
            item.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: item.type === 'board' ? '#38bdf8' : (item.type === 'coin' ? '#fde047' : '#ef4444'),
              shadowBlur: item.type === 'board' || item.type === 'coin' ? 16 : 6,
              shadowColor: item.type === 'board' ? 'rgba(56, 189, 248, 0.9)' : (item.type === 'coin' ? 'rgba(253, 224, 71, 0.9)' : 'rgba(239, 68, 68, 0.7)'),
            }
          );

          ctx.restore();
        }
      });

      // Render Subway Runner Hero (Player Hero Badge)
      ctx.save();
      ctx.translate(s.playerX, playerY + s.jumpOffset);

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
          borderColor: s.hasHoverboard ? '#38bdf8' : '#fde047',
          shadowBlur: s.hasHoverboard ? 20 : 12,
          shadowColor: s.hasHoverboard ? 'rgba(56, 189, 248, 0.9)' : 'rgba(253, 224, 71, 0.8)',
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
  }, [laneX, playerY, isKo, playSfx, playerHeroId]);

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
      gameId: 'arcade_subway_runner',
      gameTitle: '블리츠 서브웨이 러너',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.coinsCollected * 200 + s.distanceRun * 2)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.distanceRun >= 400,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 4방향 스와이프 질주' : 'STEP 1: 4-WAY SWIPE PARKOUR',
      title: isKo ? '화면 스와이프로 레인 변경, 점프, 슬라이딩을 구사하세요' : 'Swipe 4 ways for lane shifts, high jumps, and slide rolls',
      description: isKo
        ? '가상 조이스틱 없이 화면을 좌우로 쓸어 레인을 이동하고, 위로 쓸어 점프, 아래로 쓸어 슬라이딩하여 열차(🚆)와 바리케이드(🚧)를 돌파하며 호버보드(🛹)와 코인(🪙)을 쓸어담으세요.'
        : 'Swipe left/right to switch lanes, swipe up to jump over hurdles, and swipe down to slide under barriers.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 모바일 퓨어 4방향 스와이프)',
            '호버보드(🛹) 획득 시 600P 잭팟 및 무적 보호막',
            '35초간 최대 콤보로 지하철 선로를 질주하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% 4-Way Swipe Parkour',
            'Hoverboards (🛹) award 600P and invincible shield',
            'Run continuous subway combos within 35s sprint'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 4방향 스와이프 (4-Way Swipes)' : '4-Way Swipe Gestures',
      description: isKo
        ? '화면을 상/하/좌/우로 빠르게 쓸어 넘깁니다.'
        : 'Quickly swipe up/down/left/right on screen.',
      keyPoints: isKo
        ? [
            '↔️ 좌우 스와이프: 3개 레인 쾌속 이동',
            '⬆️ 위로 스와이프: 고공 점프 / ⬇️ 아래: 슬라이딩',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '↔️ Left/Right: Swift 3-lane switching',
            '⬆️ Up: High jump / ⬇️ Down: Slide roll',
            '⏱️ 35s time attack subway runner sprint'
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
            '획득한 코인 수 및 주행 거리 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Collected coins and distance multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 서브웨이 러너' : 'Blitz Subway Runner'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distanceRun}m`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '코인' : 'Coins', value: `${coinsCollected}개`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Subway Runner Canvas Viewport */}
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
          {isKo ? '화면을 좌우/상하로 스와이프해 레인을 변경하고 점프/슬라이딩하세요' : 'Swipe 4 ways for lane switches, jumps, and slides'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_subway_runner"
          gameTitle={isKo ? '블리츠 서브웨이: 파쿠르 러너' : 'Blitz Subway: Parkour Runner'}
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
export default VoxelSubwayRunnerGame;

import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMonsterIsleGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface WildMonster {
  id: number;
  x: number;
  y: number;
  vx: number;
  hp: number;
  type: 'common' | 'rare' | 'legend';
  icon: string;
  points: number;
  radius: number;
  isCaptured: boolean;
}

interface BallShot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  scale: number;
  alive: boolean;
}

export const VoxelMonsterIsleGame: React.FC<VoxelMonsterIsleGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 45;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [ballsLeft, setBallsLeft] = useState<number>(25);
  const [score, setScore] = useState<number>(0);
  const [tameCombo, setTameCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_monster_tamer') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    monsters: [] as WildMonster[],
    balls: [] as BallShot[],
    ballsLeft: 25,
    capturedCount: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    monsterCounter: 1,
    spawnTimer: 0,
    touchStart: { x: 180, y: 440, time: 0 },
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.monsters = [];
    s.balls = [];
    s.ballsLeft = 25;
    s.capturedCount = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.monsterCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial 3 Monsters
    s.monsters.push(
      { id: s.monsterCounter++, x: 80, y: 160, vx: 60, hp: 1, type: 'common', icon: '🦊', points: 200, radius: 22, isCaptured: false },
      { id: s.monsterCounter++, x: 260, y: 220, vx: -80, hp: 1, type: 'rare', icon: '🦄', points: 450, radius: 26, isCaptured: false }
    );

    setCapturedCount(0);
    setBallsLeft(25);
    setScore(0);
    setTameCombo(0);
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
          const isTargetMet = stateRef.current.capturedCount >= 6;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch Handlers: Direct Upward Swipe Ball Toss (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.ballsLeft <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.touchStart = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.ballsLeft <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    const dx = endX - s.touchStart.x;
    const dy = endY - s.touchStart.y;
    const dt = Math.max(0.05, (Date.now() - s.touchStart.time) / 1000);

    // Must swipe upward
    if (dy < -30) {
      s.ballsLeft -= 1;
      setBallsLeft(s.ballsLeft);

      const vx = (dx / dt) * 0.4;
      const vy = (dy / dt) * 0.5;

      s.balls.push({
        id: Date.now() + Math.random(),
        x: s.touchStart.x,
        y: s.touchStart.y,
        vx,
        vy: Math.max(-800, vy),
        radius: 12,
        scale: 1,
        alive: true,
      });

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  // Main 60FPS Monster Isle Loop
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

      // Spawn Wild Monsters
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.4 && s.monsters.length < 5) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isLegend = rand < 0.18;
        const isRare = rand < 0.45;

        s.monsters.push({
          id: s.monsterCounter++,
          x: Math.random() < 0.5 ? 20 : 340,
          y: 130 + Math.random() * 150,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isLegend ? 130 : (isRare ? 95 : 65)),
          hp: 1,
          type: isLegend ? 'legend' : (isRare ? 'rare' : 'common'),
          icon: isLegend ? '🐉' : (isRare ? '🦄' : '🦊'),
          points: isLegend ? 1200 : (isRare ? 450 : 200),
          radius: isLegend ? 32 : (isRare ? 26 : 22),
          isCaptured: false,
        });
      }

      // Move Monsters (Bounce on side walls)
      s.monsters.forEach((m) => {
        if (!m.isCaptured) {
          m.x += m.vx * dt;
          if (m.x > 330) {
            m.x = 330;
            m.vx = -Math.abs(m.vx);
          } else if (m.x < 30) {
            m.x = 30;
            m.vx = Math.abs(m.vx);
          }
        }
      });

      // Update Tossing Balls
      for (let bIdx = s.balls.length - 1; bIdx >= 0; bIdx--) {
        const b = s.balls[bIdx];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.scale = Math.max(0.4, b.scale - dt * 0.9);

        // Check Collision with Wild Monsters
        for (let mIdx = s.monsters.length - 1; mIdx >= 0; mIdx--) {
          const m = s.monsters[mIdx];
          if (!m.isCaptured && Math.hypot(m.x - b.x, m.y - b.y) < m.radius + 15) {
            b.alive = false;
            m.isCaptured = true;

            s.capturedCount += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = m.points + s.combo * 40;
            s.score += pts;

            setCapturedCount(s.capturedCount);
            setScore(s.score);
            setTameCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`TAMED ${m.icon}! +${pts}P 🔮`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            setTimeout(() => setFeedbackText(null), 400);

            // Capture Sparkles
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: m.x,
                y: m.y,
                vx: (Math.random() - 0.5) * 220,
                vy: (Math.random() - 0.5) * 220,
                color: m.type === 'legend' ? '#fde047' : '#38bdf8',
                life: 0.6,
              });
            }

            s.monsters.splice(mIdx, 1);
            break;
          }
        }

        if (b.y < 60 || b.scale <= 0.4 || !b.alive) {
          s.balls.splice(bIdx, 1);
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

      // Mystical Isle Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Lush Meadow Grass Platform
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 360, w, 140);

      // Render Wild Monsters (Card Sprites)
      s.monsters.forEach((m) => {
        if (!m.isCaptured) {
          ctx.save();
          ctx.translate(m.x, m.y);

          const monsterCardId = m.type === 'legend' ? 88 : m.type === 'rare' ? 41 : 27;

          drawCardSprite(
            ctx,
            monsterCardId,
            -m.radius,
            -m.radius,
            m.radius * 2,
            m.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: m.type === 'legend' ? '#fde047' : m.type === 'rare' ? '#a855f7' : '#38bdf8',
              shadowBlur: m.type === 'legend' ? 18 : 8,
              shadowColor: m.type === 'legend' ? 'rgba(253, 224, 71, 0.9)' : m.type === 'rare' ? 'rgba(168, 85, 247, 0.8)' : 'rgba(56, 189, 248, 0.8)',
            }
          );

          ctx.restore();
        }
      });

      // Render Tossing Balls (Card Sprites)
      s.balls.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.scale, b.scale);

        drawCardSprite(
          ctx,
          100,
          -14,
          -14,
          28,
          28,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#a855f7',
            shadowBlur: 10,
            shadowColor: 'rgba(168, 85, 247, 0.8)',
          }
        );

        ctx.restore();
      });

      // Render Ready Ball & Hero Tamer at Bottom Center
      if (s.ballsLeft > 0) {
        ctx.save();
        ctx.translate(180, 440);

        drawCardSprite(
          ctx,
          playerHeroId,
          -22,
          -22,
          44,
          44,
          {
            circleClip: true,
            borderWidth: 2,
            borderColor: '#38bdf8',
            shadowBlur: 14,
            shadowColor: 'rgba(56, 189, 248, 0.8)',
          }
        );

        ctx.restore();
      }

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
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
      gameId: 'arcade_monster_tamer',
      gameTitle: '블리츠 몬스터 테이머',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.capturedCount * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.capturedCount >= 6,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 위로 스와이프 몬스터 포획' : 'STEP 1: SWIPE UP TO TAME MONSTERS',
      title: isKo ? '몬스터볼을 쓸어올려 희귀 몬스터를 포획하세요' : 'Swipe Up Taming Balls to Capture Rare Monsters',
      description: isKo
        ? '가상 조이스틱 없이 화면 하단의 몬스터볼(🔮)을 손가락으로 위로 쓸어올려(Swipe Toss) 좌우로 뛰어다니는 여우(🦊), 유니콘(🦄), 전설의 드래곤(🐉)을 명중시켜 테이밍하세요.'
        : 'Swipe up from the bottom to toss taming orbs and capture running foxes, unicorns and legendary dragons.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 위로 스와이프 투척)',
            '전설의 드래곤(🐉) 포획 시 1,200P 대박 보너스',
            '35초간 최대 콤보로 몬스터들을 테이밍하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Upward Swipe Ball Toss',
            'Legendary Dragons (🐉) award huge 1,200P jackpot',
            'Capture monsters with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 위로 스와이프 (Upward Swipe)' : 'Upward Swipe Toss',
      description: isKo
        ? '손가락을 대고 원하는 몬스터의 예상 위치로 휙 쓸어올립니다.'
        : 'Flick upwards towards predicted monster positions.',
      keyPoints: isKo
        ? [
            '⬆️ 위로 스와이프: 실시간 탄도 궤적 몬스터볼 투척',
            '🔮 연속 포획 성공 시 테이머 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '⬆️ Upward Flick: Launch trajectory-driven taming orbs',
            '🔮 Consecutive captures grant escalating combo multipliers',
            '⏱️ 35s time attack monster taming sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '포획 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '포획 몬스터 등급 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Captured monster tiers and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0284c7] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 몬스터 테이머' : 'Blitz Monster Tamer'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '포획' : 'Tamed', value: `${capturedCount}마리`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '볼' : 'Balls', value: `${ballsLeft}개`, color: 'text-purple-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Monster Isle Canvas Viewport */}
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
          {isKo ? '몬스터볼을 위로 쓸어올려 뛰어다니는 몬스터를 포획하세요' : 'Swipe up to toss taming balls and capture wild monsters'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_monster_tamer"
          gameTitle={isKo ? '블리츠 몬스터: 포획 테이머' : 'Blitz Monster: Creature Tamer'}
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
export default VoxelMonsterIsleGame;

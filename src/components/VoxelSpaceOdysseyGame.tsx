import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSpaceOdysseyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SpaceTarget {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'pirate' | 'boss' | 'asteroid' | 'gem';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  hp: number;
  maxHp: number;
  cleared: boolean;
}

interface PlayerLaser {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const VoxelSpaceOdysseyGame: React.FC<VoxelSpaceOdysseyGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 38;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [piratesDefeated, setPiratesDefeated] = useState<number>(0);
  const [mineralsGathered, setMineralsGathered] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [spaceCombo, setSpaceCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_space_odyssey') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const playerY = 420;

  const stateRef = useRef({
    playerX: 180,
    targetPlayerX: 180,
    targets: [] as SpaceTarget[],
    lasers: [] as PlayerLaser[],
    piratesDefeated: 0,
    mineralsGathered: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    targetCounter: 1,
    spawnTimer: 0,
    laserTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.playerX = 180;
    s.targetPlayerX = 180;
    s.targets = [];
    s.lasers = [];
    s.piratesDefeated = 0;
    s.mineralsGathered = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.targetCounter = 1;
    s.spawnTimer = 0;
    s.laserTimer = 0;
    s.particles = [];

    // Initial space fleet
    s.targets.push(
      { id: s.targetCounter++, x: 100, y: 140, vx: 50, type: 'pirate', cardId: 78, icon: '🛸', points: 400, radius: 24, hp: 1, maxHp: 1, cleared: false },
      { id: s.targetCounter++, x: 260, y: 190, vx: -40, type: 'gem', cardId: 100, icon: '💎', points: 300, radius: 20, hp: 1, maxHp: 1, cleared: false }
    );

    setPiratesDefeated(0);
    setMineralsGathered(0);
    setScore(0);
    setSpaceCombo(0);
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
          const isTargetMet = stateRef.current.piratesDefeated >= 8;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Horizontal Touch Drag Handlers (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetPlayerX = Math.max(35, Math.min(325, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetPlayerX = Math.max(35, Math.min(325, (e.clientX - rect.left) * scaleX));
  };

  // Main 60FPS Space Shooter Loop
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

      // Player Ship Movement Tracking
      s.playerX += (s.targetPlayerX - s.playerX) * Math.min(1, dt * 24);

      // Auto-Fire Plasma Lasers
      s.laserTimer += dt;
      if (s.laserTimer > 0.2) {
        s.laserTimer = 0;
        s.lasers.push(
          { x: s.playerX - 10, y: playerY - 15, vx: 0, vy: -650 },
          { x: s.playerX + 10, y: playerY - 15, vx: 0, vy: -650 }
        );
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
      }

      // Update Lasers
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        const l = s.lasers[i];
        l.y += l.vy * dt;

        // Collision Check with Targets
        for (let j = s.targets.length - 1; j >= 0; j--) {
          const t = s.targets[j];
          if (!t.cleared && Math.hypot(t.x - l.x, t.y - l.y) < t.radius + 10) {
            t.hp -= 1;
            s.lasers.splice(i, 1);

            if (t.hp <= 0) {
              t.cleared = true;
              s.combo += 1;
              if (s.combo > s.maxCombo) s.maxCombo = s.combo;

              if (t.type === 'boss') {
                s.piratesDefeated += 2;
                const pts = t.points + s.combo * 50;
                s.score += pts;
                setFeedbackText(`👑 MOTHERSHIP DESTROYED! +${pts}P 💥`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              } else if (t.type === 'pirate') {
                s.piratesDefeated += 1;
                const pts = t.points + s.combo * 30;
                s.score += pts;
                setFeedbackText(`PIRATE DESTROYED! 🛸 +${pts}P`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              } else {
                s.mineralsGathered += 1;
                const pts = t.points + s.combo * 20;
                s.score += pts;
                setFeedbackText(`MINERAL! 💎 +${pts}P`);
              }

              setPiratesDefeated(s.piratesDefeated);
              setMineralsGathered(s.mineralsGathered);
              setScore(s.score);
              setSpaceCombo(s.combo);
              setMaxCombo(s.maxCombo);
              setTimeout(() => setFeedbackText(null), 300);

              // Blast Particles
              for (let p = 0; p < 12; p++) {
                s.particles.push({
                  x: t.x,
                  y: t.y,
                  vx: (Math.random() - 0.5) * 220,
                  vy: (Math.random() - 0.5) * 220,
                  color: t.type === 'boss' ? '#f59e0b' : (t.type === 'gem' ? '#06b6d4' : '#ef4444'),
                  life: 0.4,
                });
              }

              s.targets.splice(j, 1);
            }
            break;
          }
        }

        if (l.y < -20) {
          s.lasers.splice(i, 1);
        }
      }

      // Spawn Space Targets
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.85 && s.targets.length < 6) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isBoss = rand < 0.15;
        const isAsteroid = rand >= 0.15 && rand < 0.4;
        const isGem = rand >= 0.4 && rand < 0.65;
        const cardId = isBoss ? 83 : (isGem ? 100 : (isAsteroid ? 34 : 78));

        s.targets.push({
          id: s.targetCounter++,
          x: Math.random() < 0.5 ? 40 : 320,
          y: 70 + Math.random() * 190,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isBoss ? 40 : (isGem ? 60 : 50)),
          type: isBoss ? 'boss' : (isGem ? 'gem' : (isAsteroid ? 'asteroid' : 'pirate')),
          cardId,
          icon: isBoss ? '👾' : (isGem ? '💎' : (isAsteroid ? '🪨' : '🛸')),
          points: isBoss ? 1000 : (isGem ? 300 : (isAsteroid ? 200 : 400)),
          radius: isBoss ? 30 : (isGem ? 20 : (isAsteroid ? 24 : 24)),
          hp: isBoss ? 3 : (isAsteroid ? 2 : 1),
          maxHp: isBoss ? 3 : (isAsteroid ? 2 : 1),
          cleared: false,
        });
      }

      // Move Space Targets
      s.targets.forEach((t) => {
        t.x += t.vx * dt;
        if (t.x > 325) {
          t.x = 325;
          t.vx = -Math.abs(t.vx);
        } else if (t.x < 35) {
          t.x = 35;
          t.vx = Math.abs(t.vx);
        }
      });

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

      // Deep Galaxy Space Gradient
      const spaceGrad = ctx.createLinearGradient(0, 0, 0, h);
      spaceGrad.addColorStop(0, '#020617');
      spaceGrad.addColorStop(0.5, '#0f172a');
      spaceGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, w, h);

      // Render Lasers
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      s.lasers.forEach((l) => {
        ctx.fillRect(l.x - 2, l.y, 4, 16);
      });
      ctx.shadowBlur = 0;

      // Render Space Targets (Card Sprites)
      s.targets.forEach((t) => {
        ctx.save();
        ctx.translate(t.x, t.y);

        drawCardSprite(
          ctx,
          t.cardId,
          -t.radius,
          -t.radius,
          t.radius * 2,
          t.radius * 2,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: t.type === 'boss' ? '#f59e0b' : (t.type === 'gem' ? '#06b6d4' : (t.type === 'asteroid' ? '#64748b' : '#ef4444')),
            shadowBlur: t.type === 'boss' || t.type === 'gem' ? 18 : 6,
            shadowColor: t.type === 'boss' ? 'rgba(245, 158, 11, 0.9)' : (t.type === 'gem' ? 'rgba(6, 182, 212, 0.9)' : 'rgba(239, 68, 68, 0.7)'),
          }
        );

        // HP Bar for Boss & Asteroids
        if (t.maxHp > 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-16, t.radius + 3, 32, 4);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-16, t.radius + 3, 32 * (t.hp / t.maxHp), 4);
        }
        ctx.restore();
      });

      // Render Player Starfighter (Player Hero Badge)
      ctx.save();
      ctx.translate(s.playerX, playerY);

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
          borderColor: '#fde047',
          shadowBlur: 16,
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
  }, [playerY, playSfx, playerHeroId]);

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
      gameId: 'arcade_space_odyssey',
      gameTitle: '블리츠 스페이스 오디세이',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.piratesDefeated * 300 + s.mineralsGathered * 200)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.piratesDefeated >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 은하 슈팅' : 'STEP 1: DRAG FLIGHT & AUTO-FIRE',
      title: isKo ? '전투기를 좌우로 드래그해 해적 함대와 외계 모선을 요격하세요' : 'Drag starfighter left & right to blast pirate fleets & alien motherships',
      description: isKo
        ? '가상 조이스틱 없이 하단의 전투기(🚀)를 손가락으로 직접 좌우 드래그하여 자동 연사되는 플라즈마 레이저로 우주 해적(🛸)과 외계 거대 모선(👾)을 격파하고 양자 젬(💎)을 채굴하세요.'
        : 'Slide left and right to pilot the starfighter with automatic plasma lasers to destroy space pirates and alien motherships.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그 비행)',
            '외계 거대 모선(👾) 격파 시 1,000P 잭팟 대박 보너스',
            '35초간 최대 콤보로 은하 함대를 소탕하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Horizontal Drag Flight',
            'Alien Motherships (👾) award 1,000P massive space jackpot',
            'Defeat pirate fleets with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 좌우 드래그 (Horizontal Drag)' : 'Horizontal Drag Gesture',
      description: isKo
        ? '손가락을 좌우로 부드럽게 밀어 은하 기동을 제어합니다.'
        : 'Slide your thumb left and right smoothly across space.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 60FPS 즉각 반응 초정밀 레이저 조준',
            '🛸 연속 격추 시 스페이스 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant fluid flight and precision aiming',
            '🛸 Consecutive destroys grant combo multipliers',
            '⏱️ 35s time attack space odyssey sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '은하 작전 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격파한 함선 수 및 채굴 미네랄 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Destroyed pirate ships and minerals multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 스페이스 오디세이' : 'Blitz Space Odyssey'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '격파' : 'Kills', value: `${piratesDefeated}척`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '미네랄' : 'Gems', value: `${mineralsGathered}개`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Space Shooter Canvas Viewport */}
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '손가락으로 전투기를 좌우 드래그해 해적 함선과 외계 모선을 요격하세요' : 'Drag starfighter left & right to blast pirate ships and motherships'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_space_odyssey"
          gameTitle={isKo ? '블리츠 스페이스: 은하 오디세이' : 'Blitz Space: Galaxy Odyssey'}
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
export default VoxelSpaceOdysseyGame;

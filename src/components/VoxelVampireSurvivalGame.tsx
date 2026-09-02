import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelVampireSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface UndeadMob {
  id: number;
  x: number;
  y: number;
  type: 'bat' | 'skeleton' | 'vampire_lord';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

export const VoxelVampireSurvivalGame: React.FC<VoxelVampireSurvivalGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 64;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [kills, setKills] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [vampireCombo, setVampireCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_vampire_survival') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    hunterX: 180,
    hunterY: 260,
    targetX: 180,
    targetY: 260,
    bladeAngle: 0,
    bladeRadius: 65,
    enemies: [] as UndeadMob[],
    kills: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    enemyCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.hunterX = 180;
    s.hunterY = 260;
    s.targetX = 180;
    s.targetY = 260;
    s.bladeAngle = 0;
    s.bladeRadius = 65;
    s.enemies = [];
    s.kills = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.enemyCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial Undead Mobs
    s.enemies.push(
      { id: s.enemyCounter++, x: 80, y: 120, type: 'bat', cardId: 26, icon: '🦇', points: 300, radius: 20, hp: 1, maxHp: 1, isAlive: true },
      { id: s.enemyCounter++, x: 280, y: 380, type: 'skeleton', cardId: 78, icon: '💀', points: 500, radius: 24, hp: 2, maxHp: 2, isAlive: true }
    );

    setKills(0);
    setScore(0);
    setVampireCombo(0);
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
          const isTargetMet = stateRef.current.kills >= 10;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Finger Drag Handlers (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetX = Math.max(35, Math.min(325, (e.clientX - rect.left) * scaleX));
    s.targetY = Math.max(50, Math.min(450, (e.clientY - rect.top) * scaleY));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetX = Math.max(35, Math.min(325, (e.clientX - rect.left) * scaleX));
    s.targetY = Math.max(50, Math.min(450, (e.clientY - rect.top) * scaleY));
  };

  // Main 60FPS Vampire Survival Loop
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

      // Hunter Movement Tracking
      s.hunterX += (s.targetX - s.hunterX) * Math.min(1, dt * 20);
      s.hunterY += (s.targetY - s.hunterY) * Math.min(1, dt * 20);

      // Orbiting Holy Blade Rotation
      s.bladeAngle += dt * 7;

      // Calculate 3 Orbiting Holy Blade positions
      const bladePositions = [
        { x: s.hunterX + Math.cos(s.bladeAngle) * s.bladeRadius, y: s.hunterY + Math.sin(s.bladeAngle) * s.bladeRadius },
        { x: s.hunterX + Math.cos(s.bladeAngle + (Math.PI * 2) / 3) * s.bladeRadius, y: s.hunterY + Math.sin(s.bladeAngle + (Math.PI * 2) / 3) * s.bladeRadius },
        { x: s.hunterX + Math.cos(s.bladeAngle + (Math.PI * 4) / 3) * s.bladeRadius, y: s.hunterY + Math.sin(s.bladeAngle + (Math.PI * 4) / 3) * s.bladeRadius }
      ];

      // Spawn Undead Enemies
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.8 && s.enemies.length < 9) {
        s.spawnTimer = 0;
        const rand = Math.random();
        
        // Spawn from random edge
        const spawnX = Math.random() < 0.5 ? 20 : 340;
        const spawnY = Math.random() < 0.5 ? 30 : 470;
        const isLord = rand < 0.18;
        const isSkeleton = rand >= 0.18 && rand < 0.55;
        const cardId = isLord ? 83 : (isSkeleton ? 78 : 26);

        s.enemies.push({
          id: s.enemyCounter++,
          x: spawnX,
          y: spawnY,
          type: isLord ? 'vampire_lord' : (isSkeleton ? 'skeleton' : 'bat'),
          cardId,
          icon: isLord ? '🧛' : (isSkeleton ? '💀' : '🦇'),
          points: isLord ? 1000 : (isSkeleton ? 500 : 300),
          radius: isLord ? 32 : (isSkeleton ? 24 : 20),
          hp: isLord ? 3 : (isSkeleton ? 2 : 1),
          maxHp: isLord ? 3 : (isSkeleton ? 2 : 1),
          isAlive: true,
        });
      }

      // Move Enemies Toward Hunter & Collision Check with Orbiting Blades
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const mob = s.enemies[i];
        if (mob.isAlive) {
          const dx = s.hunterX - mob.x;
          const dy = s.hunterY - mob.y;
          const dist = Math.hypot(dx, dy);

          const speed = mob.type === 'bat' ? 65 : (mob.type === 'skeleton' ? 45 : 35);
          if (dist > 5) {
            mob.x += (dx / dist) * speed * dt;
            mob.y += (dy / dist) * speed * dt;
          }

          // Check Monster bite Player -> Player damage & Game Over!
          if (dist < mob.radius + 14) {
            s.combo = 0;
            setVampireCombo(0);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setFeedbackText(isKo ? '피격! 언데드 습격 💥' : 'BITTEN! -HP 💥');
            setTimeout(() => setFeedbackText(null), 300);

            // Trigger Defeat Game Over on contact if overwhelmed
            endGame(false);
            return;
          }

          // Check Blade Collision
          for (const bp of bladePositions) {
            if (Math.hypot(mob.x - bp.x, mob.y - bp.y) < mob.radius + 18) {
              mob.hp -= 1;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

              // Blade Spark FX
              for (let p = 0; p < 8; p++) {
                s.particles.push({
                  x: mob.x,
                  y: mob.y,
                  vx: (Math.random() - 0.5) * 200,
                  vy: (Math.random() - 0.5) * 200,
                  color: '#fde047',
                  life: 0.3,
                });
              }

              if (mob.hp <= 0) {
                mob.isAlive = false;
                s.kills += 1;
                s.combo += 1;
                if (s.combo > s.maxCombo) s.maxCombo = s.combo;

                const pts = mob.points + s.combo * 40;
                s.score += pts;

                setKills(s.kills);
                setScore(s.score);
                setVampireCombo(s.combo);
                setMaxCombo(s.maxCombo);

                if (mob.type === 'vampire_lord') {
                  setFeedbackText(`👑 VAMPIRE LORD SLAIN! +${pts}P 💥`);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                } else {
                  setFeedbackText(`UNDEAD PURGED! +${pts}P ⚡`);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                }
                setTimeout(() => setFeedbackText(null), 300);

                // Purge Particles
                for (let p = 0; p < 14; p++) {
                  s.particles.push({
                    x: mob.x,
                    y: mob.y,
                    vx: (Math.random() - 0.5) * 240,
                    vy: (Math.random() - 0.5) * 240,
                    color: mob.type === 'vampire_lord' ? '#ef4444' : '#a855f7',
                    life: 0.4,
                  });
                }
              }
              break;
            }
          }
        }
      }

      // Filter Dead Enemies
      s.enemies = s.enemies.filter((e) => e.isAlive);

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

      // Gothic Dungeon Dark Gradient
      const gothicGrad = ctx.createLinearGradient(0, 0, 0, h);
      gothicGrad.addColorStop(0, '#0f051d');
      gothicGrad.addColorStop(0.5, '#1e0b36');
      gothicGrad.addColorStop(1, '#08020f');
      ctx.fillStyle = gothicGrad;
      ctx.fillRect(0, 0, w, h);

      // Holy Blade Orbit Radius Circle
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s.hunterX, s.hunterY, s.bladeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Render Orbiting Holy Blades (Card Sprites)
      bladePositions.forEach((bp) => {
        ctx.save();
        ctx.translate(bp.x, bp.y);

        drawCardSprite(
          ctx,
          55,
          -12,
          -12,
          24,
          24,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#fde047',
            shadowBlur: 14,
            shadowColor: 'rgba(253, 224, 71, 0.9)',
          }
        );

        ctx.restore();
      });

      // Render Enemies (Card Sprites)
      s.enemies.forEach((mob) => {
        if (mob.isAlive) {
          ctx.save();
          ctx.translate(mob.x, mob.y);

          drawCardSprite(
            ctx,
            mob.cardId,
            -mob.radius,
            -mob.radius,
            mob.radius * 2,
            mob.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: mob.type === 'vampire_lord' ? '#ef4444' : '#a855f7',
              shadowBlur: mob.type === 'vampire_lord' ? 20 : 10,
              shadowColor: mob.type === 'vampire_lord' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(168, 85, 247, 0.8)',
            }
          );

          // HP Bar
          if (mob.maxHp > 1) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-16, mob.radius + 4, 32, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-16, mob.radius + 4, 32 * (mob.hp / mob.maxHp), 4);
          }
          ctx.restore();
        }
      });

      // Render Vampire Hunter Hero (Player Hero Badge)
      ctx.save();
      ctx.translate(s.hunterX, s.hunterY);

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
      gameId: 'arcade_vampire_survival',
      gameTitle: '블리츠 뱀파이어 서바이벌',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.kills * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.kills >= 10,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 회전 블레이드 토벌' : 'STEP 1: DRAG & ORBIT PURGE',
      title: isKo ? '헌터를 손가락으로 드래그해 회전 블레이드로 적을 토벌하세요' : 'Drag hunter to slice approaching undead swarms with holy blades',
      description: isKo
        ? '가상 조이스틱 없이 화면의 헌터(🧙‍♂️)를 손가락으로 직접 드래그하여 주변을 회전하는 3개의 신성 블레이드(⚔️)로 몰려드는 박쥐(🦇), 스켈레톤(💀), 뱀파이어 로드(🧛)를 갈아버리세요.'
        : 'Slide your finger to direct the hunter, letting the 3 orbiting holy swords slice through undead waves.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 2D 드래그 이동)',
            '뱀파이어 로드(🧛) 처치 시 1,000P 잭팟 대박 보너스',
            '35초간 최대 콤보로 언데드 스웜을 전멸시키고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Drag',
            'Vampire Lord (🧛) awards 1,000P massive survival jackpot',
            'Eliminate all undead swarms with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 자유 드래그 (Direct Finger Drag)' : 'Direct Drag Gesture',
      description: isKo
        ? '손가락을 원하는 위치로 밀어 헌터의 위치를 조종합니다.'
        : 'Slide your thumb smoothly anywhere across the arena.',
      keyPoints: isKo
        ? [
            '👆 자유 드래그: 60FPS 즉각 반응 초정밀 회피 및 접근',
            '⚔️ 연속 처치 시 서바이벌 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Free Drag: Instant 60FPS fluid dodge and slicing',
            '⚔️ Consecutive purges grant survival combo multipliers',
            '⏱️ 35s time attack vampire survival sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '토벌 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '처치한 언데드 수 및 뱀파이어 로드 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Purged undead count and boss multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#08020f] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 뱀파이어 서바이벌' : 'Blitz Vampire Survival'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '토벌' : 'Kills', value: `${kills}마리`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${vampireCombo}x`, color: vampireCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Vampire Survival Canvas Viewport */}
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
          {isKo ? '손가락으로 헌터를 드래그해 회전 블레이드로 언데드를 토벌하세요' : 'Drag hunter to slice approaching undead with orbiting blades'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_vampire_survival"
          gameTitle={isKo ? '블리츠 뱀파이어: 언데드 토벌' : 'Blitz Vampire: Undead Purge'}
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
export default VoxelVampireSurvivalGame;

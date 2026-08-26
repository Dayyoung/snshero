import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMiningDefenseGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface MiningMonster {
  id: number;
  x: number;
  y: number;
  speed: number;
  hp: number;
  maxHp: number;
  type: 'goblin' | 'golem' | 'bat';
  icon: string;
  points: number;
  radius: number;
}

interface TurretSlot {
  id: number;
  x: number;
  y: number;
  level: number;
  type: 'arrow' | 'cannon' | 'tesla';
  cooldown: number;
  range: number;
}

export const VoxelMiningDefenseGame: React.FC<VoxelMiningDefenseGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 24;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [coreHp, setCoreHp] = useState<number>(100);
  const [minerals, setMinerals] = useState<number>(120);
  const [wave, setWave] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [defenseCombo, setDefenseCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_mining_def') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    coreHp: 100,
    minerals: 120,
    wave: 1,
    turrets: [
      { id: 1, x: 120, y: 200, level: 1, type: 'arrow' as const, cooldown: 0, range: 110 },
      { id: 2, x: 240, y: 200, level: 1, type: 'cannon' as const, cooldown: 0, range: 110 },
      { id: 3, x: 120, y: 320, level: 0, type: 'tesla' as const, cooldown: 0, range: 110 },
      { id: 4, x: 240, y: 320, level: 0, type: 'arrow' as const, cooldown: 0, range: 110 },
    ] as TurretSlot[],
    monsters: [] as MiningMonster[],
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    monsterCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    lasers: [] as { x1: number; y1: number; x2: number; y2: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.coreHp = 100;
    s.minerals = 120;
    s.wave = 1;
    s.turrets = [
      { id: 1, x: 120, y: 200, level: 1, type: 'arrow', cooldown: 0, range: 110 },
      { id: 2, x: 240, y: 200, level: 1, type: 'cannon', cooldown: 0, range: 110 },
      { id: 3, x: 120, y: 320, level: 0, type: 'tesla', cooldown: 0, range: 110 },
      { id: 4, x: 240, y: 320, level: 0, type: 'arrow', cooldown: 0, range: 110 },
    ];
    s.monsters = [];
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.monsterCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];
    s.lasers = [];

    setCoreHp(100);
    setMinerals(120);
    setWave(1);
    setScore(0);
    setDefenseCombo(0);
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

  // Touch Handlers: Tap Slot to Build/Upgrade, Tap Monster to Strike Lightning
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

    // Check Slot Tap (Build / Upgrade Turret)
    for (const slot of s.turrets) {
      if (Math.hypot(slot.x - tapX, slot.y - tapY) < 32) {
        const cost = slot.level === 0 ? 50 : 80;
        if (s.minerals >= cost && slot.level < 3) {
          s.minerals -= cost;
          slot.level += 1;
          setMinerals(s.minerals);
          s.score += 250;
          setScore(s.score);

          setFeedbackText(isKo ? `포탑 강화 Lv.${slot.level}! 🏹` : `TURRET UPGRADED Lv.${slot.level}! 🏹`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);
          return;
        }
      }
    }

    // Direct Screen Tap: Holy Lightning Strike on Monster!
    let hitMonster = false;
    for (let i = s.monsters.length - 1; i >= 0; i--) {
      const m = s.monsters[i];
      if (Math.hypot(m.x - tapX, m.y - tapY) < m.radius + 24) {
        hitMonster = true;
        m.hp -= 50;

        // Lightning Beam Effect from Top
        s.lasers.push({
          x1: tapX,
          y1: 0,
          x2: tapX,
          y2: tapY,
          color: '#38bdf8',
          life: 0.25,
        });

        // Sparks
        for (let p = 0; p < 8; p++) {
          s.particles.push({
            x: m.x,
            y: m.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color: '#38bdf8',
            life: 0.4,
          });
        }

        if (m.hp <= 0) {
          s.minerals += m.type === 'golem' ? 40 : 20;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = m.points + s.combo * 25;
          s.score += pts;

          setMinerals(s.minerals);
          setScore(s.score);
          setDefenseCombo(s.combo);
          setMaxCombo(s.maxCombo);

          s.monsters.splice(i, 1);
        }
        break;
      }
    }

    if (hitMonster) {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  // Main 60FPS Mining Defense Loop
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

      const coreX = 180;
      const coreY = 260;

      // Spawn Mining Monsters
      s.spawnTimer += dt;
      const spawnRate = s.timeLeft <= 10 ? 0.45 : 0.75;
      if (s.spawnTimer >= spawnRate && s.monsters.length < 12) {
        s.spawnTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = 240;
        const mx = coreX + Math.cos(angle) * spawnDist;
        const my = coreY + Math.sin(angle) * spawnDist;

        const isGolem = Math.random() < 0.25;
        const isBat = Math.random() < 0.35;

        s.monsters.push({
          id: s.monsterCounter++,
          x: mx,
          y: my,
          speed: isGolem ? 30 : (isBat ? 70 : 45),
          hp: isGolem ? 120 : (isBat ? 35 : 55),
          maxHp: isGolem ? 120 : (isBat ? 35 : 55),
          type: isGolem ? 'golem' : (isBat ? 'bat' : 'goblin'),
          icon: isGolem ? '🗿' : (isBat ? '🦇' : '👺'),
          points: isGolem ? 450 : (isBat ? 200 : 150),
          radius: isGolem ? 20 : 15,
        });
      }

      // Turrets Auto Attack Closest Monster
      s.turrets.forEach((turret) => {
        if (turret.level > 0) {
          turret.cooldown -= dt;
          if (turret.cooldown <= 0) {
            // Find closest monster
            let closest: MiningMonster | null = null;
            let minDist = turret.range;

            s.monsters.forEach((m) => {
              const d = Math.hypot(m.x - turret.x, m.y - turret.y);
              if (d < minDist) {
                minDist = d;
                closest = m;
              }
            });

            if (closest) {
              turret.cooldown = 0.55 / turret.level;
              (closest as MiningMonster).hp -= 20 * turret.level;

              s.lasers.push({
                x1: turret.x,
                y1: turret.y,
                x2: (closest as MiningMonster).x,
                y2: (closest as MiningMonster).y,
                color: turret.type === 'cannon' ? '#f97316' : '#a855f7',
                life: 0.15,
              });

              if ((closest as MiningMonster).hp <= 0) {
                const cIndex = s.monsters.indexOf(closest);
                if (cIndex !== -1) {
                  s.minerals += 15;
                  setMinerals(s.minerals);
                  s.score += (closest as MiningMonster).points;
                  setScore(s.score);
                  s.monsters.splice(cIndex, 1);
                }
              }
            }
          }
        }
      });

      // Move Monsters towards Core
      for (let i = s.monsters.length - 1; i >= 0; i--) {
        const m = s.monsters[i];
        const dx = coreX - m.x;
        const dy = coreY - m.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 28) {
          m.x += (dx / dist) * m.speed * dt;
          m.y += (dy / dist) * m.speed * dt;
        } else {
          // Attack Core
          s.coreHp = Math.max(0, s.coreHp - (m.type === 'golem' ? 22 : 12));
          setCoreHp(s.coreHp);
          s.combo = 0;
          setDefenseCombo(0);

          setFeedbackText(isKo ? '크리스탈 코어 피격! 💔' : 'CORE DAMAGED! 💔');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);

          s.monsters.splice(i, 1);

          if (s.coreHp <= 0) {
            endGame(false);
            return;
          }
        }
      }

      // Update Lasers
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        const l = s.lasers[i];
        l.life -= dt;
        if (l.life <= 0) s.lasers.splice(i, 1);
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

      // Deep Mine Cavern Floor Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Mine Track Grid & Hexagons
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1.5;
      [70, 140, 210].forEach((r) => {
        ctx.beginPath();
        ctx.arc(coreX, coreY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Render Central Crystal Mine Core (Player Hero Badge)
      ctx.save();
      ctx.translate(coreX, coreY);

      drawCardSprite(
        ctx,
        playerHeroId,
        -24,
        -24,
        48,
        48,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
          shadowBlur: 18,
          shadowColor: 'rgba(56, 189, 248, 0.9)',
        }
      );
      ctx.restore();

      // Render Turret Slots (Card Sprites)
      s.turrets.forEach((slot) => {
        ctx.save();
        ctx.translate(slot.x, slot.y);

        if (slot.level === 0) {
          // Empty Slot
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText('BUILD', 0, 4);
          ctx.fillText('50💎', 0, 16);
        } else {
          // Active Turret Card Sprite
          const turretCardId = slot.type === 'cannon' ? 58 : slot.type === 'tesla' ? 76 : 34;

          drawCardSprite(
            ctx,
            turretCardId,
            -22,
            -22,
            44,
            44,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: slot.type === 'tesla' ? '#fde047' : '#38bdf8',
              shadowBlur: 8,
              shadowColor: slot.type === 'tesla' ? 'rgba(253, 224, 71, 0.8)' : 'rgba(56, 189, 248, 0.8)',
            }
          );

          // Level Stars
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#fde047';
          ctx.textAlign = 'center';
          ctx.fillText(`Lv.${slot.level}`, 0, 26);
        }
        ctx.restore();
      });

      // Render Lasers & Lightning
      s.lasers.forEach((l) => {
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Render Monsters (Card Sprites)
      s.monsters.forEach((m) => {
        ctx.save();
        ctx.translate(m.x, m.y);

        const monsterCardId = m.type === 'goblin' ? 25 : m.type === 'golem' ? 65 : 43;

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
            borderColor: '#ef4444',
            shadowBlur: 8,
            shadowColor: 'rgba(239, 68, 68, 0.8)',
          }
        );

        // Mini HP Bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-12, m.radius + 3, 24, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-12, m.radius + 3, 24 * (m.hp / m.maxHp), 4);
        ctx.restore();
      });

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx, playerHeroId]);

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
      gameId: 'arcade_mining_defense',
      gameTitle: '블리츠 마이닝 디펜스',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.minerals * 10) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.coreHp >= 30,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 포탑 건설 & 번개 폭격' : 'STEP 1: TURRET BUILD & LIGHTNING',
      title: isKo ? '포탑을 탭해 건설하고 몬스터를 탭해 번개로 요격하세요' : 'Tap Slots to Build Turrets & Tap Monsters for Lightning Strikes',
      description: isKo
        ? '가상 조이스틱 없이 방어 슬롯을 탭하여 포탑(🏹, 💣, ⚡)을 건설/강화하고, 중앙의 크리스탈 코어(💎)로 몰려오는 몬스터 무리를 손가락으로 직접 탭하여 성스러운 번개 벼락으로 폭파 정화하세요.'
        : 'Tap defense slots to construct turrets and directly tap incoming monsters to summon lightning strikes.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 슬롯 탭 건설 & 몬스터 탭 요격)',
            '수집한 광물(💎)로 4개 포탑을 3레벨까지 풀업그레이드',
            '35초간 크리스탈 코어 HP를 수호하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Screen Tap Turret Build & Lightning',
            'Upgrade 4 defense turrets up to Lv.3 with mined minerals',
            'Defend crystal core HP for 35s to claim victory'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 타깃 탭 (Direct Target Tap)' : 'Direct Screen Tap',
      description: isKo
        ? '슬롯을 탭해 강화하고, 적을 탭해 벼락을 투하합니다.'
        : 'Tap slots to upgrade, and tap creeps to strike lightning.',
      keyPoints: isKo
        ? [
            '👆 슬롯 탭: 포탑 배치 및 자동 사격 강화',
            '⚡ 몬스터 탭: 강력한 신성 번개 즉각 폭파 (50 데미지)',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Slot Tap: Build and boost auto-firing turrets',
            '⚡ Monster Tap: Strike instant holy lightning (50 DMG)',
            '⏱️ 35s time attack mining defense sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '수호 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '잔여 코어 HP 및 업그레이드 포탑 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining core HP and upgraded turrets multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0b132b] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 마이닝 디펜스' : 'Blitz Mining Defense'}
        language={(language as Language) || 'ko'}
        hp={{ current: coreHp, max: 100 }}
        telemetries={[
          { label: isKo ? '광물' : 'Minerals', value: `${minerals}💎`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${defenseCombo}x`, color: defenseCombo > 4 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Mining Defense Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
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
          {isKo ? '슬롯 탭: 포탑 강화 | 몬스터 탭: 번개 벼락 요격' : 'Tap Slot: Build Turret | Tap Monster: Strike Lightning'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_mining_defense"
          gameTitle={isKo ? '블리츠 마이닝: 크리스탈 디펜스' : 'Blitz Mining: Crystal Defense'}
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
export default VoxelMiningDefenseGame;

import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTowerCraftGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PlacedTower {
  id: number;
  x: number;
  y: number;
  type: 'flame' | 'frost' | 'tesla';
  cardId: number;
  icon: string;
  range: number;
  damage: number;
  cooldown: number;
  cooldownTimer: number;
}

interface MobEnemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'goblin' | 'bat' | 'dragon';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

interface DefenseShot {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  life: number;
}

export const VoxelTowerCraftGame: React.FC<VoxelTowerCraftGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 56;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [enemiesDefeated, setEnemiesDefeated] = useState<number>(0);
  const [mana, setMana] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [defenseCombo, setDefenseCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [selectedTowerType, setSelectedTowerType] = useState<'flame' | 'frost' | 'tesla'>('flame');
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_tower_craft') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const towerCosts = { flame: 30, frost: 40, tesla: 50 };

  const stateRef = useRef({
    towers: [] as PlacedTower[],
    enemies: [] as MobEnemy[],
    shots: [] as DefenseShot[],
    enemiesDefeated: 0,
    mana: 100,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    selectedTowerType: 'flame' as 'flame' | 'frost' | 'tesla',
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    enemyCounter: 1,
    towerCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.towers = [
      { id: s.towerCounter++, x: 90, y: 320, type: 'flame', cardId: 55, icon: '🔥', range: 110, damage: 1, cooldown: 0.8, cooldownTimer: 0 },
      { id: s.towerCounter++, x: 270, y: 320, type: 'tesla', cardId: 100, icon: '⚡', range: 120, damage: 2, cooldown: 1.2, cooldownTimer: 0 }
    ];
    s.enemies = [];
    s.shots = [];
    s.enemiesDefeated = 0;
    s.mana = 100;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.selectedTowerType = 'flame';
    s.isGameOver = false;
    s.startTime = Date.now();
    s.enemyCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial Enemy Mob
    s.enemies.push(
      { id: s.enemyCounter++, x: 50, y: 130, vx: 55, type: 'goblin', cardId: 78, icon: '👹', points: 300, radius: 22, hp: 1, maxHp: 1, isAlive: true },
      { id: s.enemyCounter++, x: 310, y: 190, vx: -45, type: 'bat', cardId: 26, icon: '🦇', points: 400, radius: 24, hp: 2, maxHp: 2, isAlive: true }
    );

    setEnemiesDefeated(0);
    setMana(100);
    setScore(0);
    setDefenseCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setSelectedTowerType('flame');
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

  // Direct Tap to Build Tower or Tap Enemy to Support Attack
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

    // Check if tapped enemy mob directly (Direct Air Support Blast)
    let hitMob = false;
    for (const mob of s.enemies) {
      if (mob.isAlive && Math.hypot(mob.x - tapX, mob.y - tapY) < mob.radius + 16) {
        hitMob = true;
        mob.hp -= 1;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

        // Spark FX
        for (let p = 0; p < 8; p++) {
          s.particles.push({
            x: mob.x,
            y: mob.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color: '#f59e0b',
            life: 0.3,
          });
        }

        if (mob.hp <= 0) {
          mob.isAlive = false;
          s.enemiesDefeated += 1;
          s.mana = Math.min(150, s.mana + 25);
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = mob.points + s.combo * 40;
          s.score += pts;

          setEnemiesDefeated(s.enemiesDefeated);
          setMana(s.mana);
          setScore(s.score);
          setDefenseCombo(s.combo);
          setMaxCombo(s.maxCombo);

          setFeedbackText(`TAP BLAST! +${pts}P 💥`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          setTimeout(() => setFeedbackText(null), 300);
        }
        break;
      }
    }

    // If not tapping mob and in middle/lower area, deploy Tower
    if (!hitMob && tapY > 230 && tapY < 450 && s.towers.length < 8) {
      const cost = towerCosts[selectedTowerType];
      if (s.mana >= cost) {
        s.mana -= cost;
        setMana(s.mana);

        const icon = selectedTowerType === 'flame' ? '🔥' : (selectedTowerType === 'frost' ? '❄️' : '⚡');
        const cardId = selectedTowerType === 'flame' ? 55 : (selectedTowerType === 'frost' ? 92 : 100);
        const range = selectedTowerType === 'flame' ? 110 : (selectedTowerType === 'frost' ? 130 : 120);
        const damage = selectedTowerType === 'flame' ? 1 : (selectedTowerType === 'frost' ? 1 : 2);
        const cooldown = selectedTowerType === 'flame' ? 0.8 : (selectedTowerType === 'frost' ? 1.0 : 1.2);

        s.towers.push({
          id: s.towerCounter++,
          x: tapX,
          y: tapY,
          type: selectedTowerType,
          cardId,
          icon,
          range,
          damage,
          cooldown,
          cooldownTimer: 0,
        });

        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        setFeedbackText(`TOWER DEPLOYED! ${icon}`);
        setTimeout(() => setFeedbackText(null), 300);
      } else {
        setFeedbackText(isKo ? '마나 부족!' : 'LOW MANA!');
        setTimeout(() => setFeedbackText(null), 300);
      }
    }
  };

  // Main 60FPS Tower Craft Loop
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

      // Passive Mana Regen
      s.mana = Math.min(150, s.mana + dt * 6);
      setMana(Math.round(s.mana));

      // Spawn Enemy Mobs
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.3 && s.enemies.length < 6) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isDragon = rand < 0.2;
        const isBat = rand >= 0.2 && rand < 0.6;
        const cardId = isDragon ? 83 : (isBat ? 26 : 78);

        s.enemies.push({
          id: s.enemyCounter++,
          x: Math.random() < 0.5 ? 40 : 320,
          y: 70 + Math.random() * 140,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isDragon ? 35 : (isBat ? 55 : 45)),
          type: isDragon ? 'dragon' : (isBat ? 'bat' : 'goblin'),
          cardId,
          icon: isDragon ? '🐲' : (isBat ? '🦇' : '👹'),
          points: isDragon ? 1000 : (isBat ? 500 : 300),
          radius: isDragon ? 32 : (isBat ? 24 : 22),
          hp: isDragon ? 3 : (isBat ? 2 : 1),
          maxHp: isDragon ? 3 : (isBat ? 2 : 1),
          isAlive: true,
        });
      }

      // Move Enemies
      s.enemies.forEach((enemy) => {
        enemy.x += enemy.vx * dt;
        if (enemy.x > 325) {
          enemy.x = 325;
          enemy.vx = -Math.abs(enemy.vx);
        } else if (enemy.x < 35) {
          enemy.x = 35;
          enemy.vx = Math.abs(enemy.vx);
        }
      });

      // Towers Auto-Attack
      s.towers.forEach((tower) => {
        tower.cooldownTimer -= dt;
        if (tower.cooldownTimer <= 0) {
          // Find closest alive enemy in range
          for (let i = s.enemies.length - 1; i >= 0; i--) {
            const enemy = s.enemies[i];
            if (enemy.isAlive && Math.hypot(enemy.x - tower.x, enemy.y - tower.y) <= tower.range) {
              tower.cooldownTimer = tower.cooldown;
              enemy.hp -= tower.damage;

              s.shots.push({
                x: tower.x,
                y: tower.y,
                targetX: enemy.x,
                targetY: enemy.y,
                color: tower.type === 'flame' ? '#ef4444' : (tower.type === 'frost' ? '#38bdf8' : '#fde047'),
                life: 0.15,
              });

              if (enemy.hp <= 0) {
                enemy.isAlive = false;
                s.enemiesDefeated += 1;
                s.combo += 1;
                if (s.combo > s.maxCombo) s.maxCombo = s.combo;

                const pts = enemy.points + s.combo * 40;
                s.score += pts;

                setEnemiesDefeated(s.enemiesDefeated);
                setScore(s.score);
                setDefenseCombo(s.combo);
                setMaxCombo(s.maxCombo);

                if (enemy.type === 'dragon') {
                  setFeedbackText(`🐲 DRAGON BOSS SLAIN! +${pts}P 💥`);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                } else {
                  setFeedbackText(`ENEMY SLAIN! +${pts}P ⚡`);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                }
                setTimeout(() => setFeedbackText(null), 300);

                // Mob Blast Particles
                for (let p = 0; p < 14; p++) {
                  s.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 260,
                    vy: (Math.random() - 0.5) * 260,
                    color: enemy.type === 'dragon' ? '#f59e0b' : '#38bdf8',
                    life: 0.4,
                  });
                }
              }
              break;
            }
          }
        }
      });

      // Filter dead enemies
      s.enemies = s.enemies.filter((e) => e.isAlive);

      // Update Shots FX
      for (let i = s.shots.length - 1; i >= 0; i--) {
        const sh = s.shots[i];
        sh.life -= dt;
        if (sh.life <= 0) s.shots.splice(i, 1);
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

      // Dungeon Defense Arena Dark Gradient
      const defenseGrad = ctx.createLinearGradient(0, 0, 0, h);
      defenseGrad.addColorStop(0, '#0f172a');
      defenseGrad.addColorStop(0.5, '#1e293b');
      defenseGrad.addColorStop(1, '#020617');
      ctx.fillStyle = defenseGrad;
      ctx.fillRect(0, 0, w, h);

      // Enemy Invasion Lane Border
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(20, 60, w - 40, 160);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 60, w - 40, 160);

      // Tower Placement Zone Border
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(20, 230, w - 40, 230);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 230, w - 40, 230);

      // Render Tower Beams / Shots
      s.shots.forEach((sh) => {
        ctx.strokeStyle = sh.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = sh.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.targetX, sh.targetY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Render Enemies (Card Sprites)
      s.enemies.forEach((enemy) => {
        if (enemy.isAlive) {
          ctx.save();
          ctx.translate(enemy.x, enemy.y);

          drawCardSprite(
            ctx,
            enemy.cardId,
            -enemy.radius,
            -enemy.radius,
            enemy.radius * 2,
            enemy.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: enemy.type === 'dragon' ? '#f59e0b' : '#ef4444',
              shadowBlur: enemy.type === 'dragon' ? 18 : 8,
              shadowColor: enemy.type === 'dragon' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.8)',
            }
          );

          // HP Bar
          if (enemy.maxHp > 1) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-16, enemy.radius + 4, 32, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-16, enemy.radius + 4, 32 * (enemy.hp / enemy.maxHp), 4);
          }
          ctx.restore();
        }
      });

      // Render Placed Towers (Card Sprites)
      s.towers.forEach((tower) => {
        ctx.save();
        ctx.translate(tower.x, tower.y);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, tower.range, 0, Math.PI * 2);
        ctx.fill();

        drawCardSprite(
          ctx,
          tower.cardId,
          -18,
          -18,
          36,
          36,
          {
            circleClip: true,
            borderWidth: 2,
            borderColor: tower.type === 'flame' ? '#ef4444' : (tower.type === 'frost' ? '#38bdf8' : '#fde047'),
            shadowBlur: 14,
            shadowColor: tower.type === 'flame' ? 'rgba(239, 68, 68, 0.8)' : (tower.type === 'frost' ? 'rgba(56, 189, 248, 0.8)' : 'rgba(253, 224, 71, 0.8)'),
          }
        );

        ctx.restore();
      });

      // Render Commander Hero Badge at Base
      ctx.save();
      ctx.translate(w / 2, 430);

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
          borderColor: '#38bdf8',
          shadowBlur: 16,
          shadowColor: 'rgba(56, 189, 248, 0.9)',
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
      gameId: 'arcade_tower_craft',
      gameTitle: '블리츠 타워 크래프트',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.enemiesDefeated * 350) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.enemiesDefeated >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 탭 타워 배치 & 포격' : 'STEP 1: TAP DEPLOY & STRIKE',
      title: isKo ? '타워를 터치해 배치하고 적을 탭해 직접 지원 사격하세요' : 'Tap to place defense towers and tap enemy mobs for air strikes',
      description: isKo
        ? '가상 조이스틱 없이 하단 영역을 터치하여 3종 원소 타워(🔥 플레임, ❄️ 프로스트, ⚡ 테슬라)를 배치하고 상단에 몰려오는 몬스터를 직접 탭해 포격을 쏟아부으세요.'
        : 'Tap the lower zone to build elemental towers and tap incoming monsters for instant air support.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 탭 타워 건설 & 지원 사격)',
            '드래곤 보스(🐲) 격파 시 1,000P 잭팟 대박 보너스',
            '35초간 최대 콤보로 전선을 수호하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Construction & Strikes',
            'Dragon Boss (🐲) awards 1,000P massive defense jackpot',
            'Defend the fortress with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 탭 조작 (Direct Tap Actions)' : 'Direct Tap Gesture',
      description: isKo
        ? '원소 버튼 선택 후 필드를 탭해 타워를 짓고 적을 탭해 공격합니다.'
        : 'Select elemental cards, tap field to build and tap mobs to strike.',
      keyPoints: isKo
        ? [
            '👆 전장 탭: 60FPS 즉시 건설 및 초정밀 지원 사격',
            '⚡ 연속 격퇴 시 디펜스 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Field Tap: Instant 60FPS construction & air strikes',
            '⚡ Consecutive eliminates grant defense combo multipliers',
            '⏱️ 35s time attack tower defense sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '방어 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격퇴한 몬스터 수 및 배치 타워 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Defeated monsters count and tower multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 타워 크래프트' : 'Blitz Tower Craft'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '격퇴' : 'Kills', value: `${enemiesDefeated}마리`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '마나' : 'Mana', value: `${mana}`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Tower Defense Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={480}
          onPointerDown={handlePointerDown}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Element Tower Selection Dock */}
      <div className="w-full max-w-md px-4 py-2 flex items-center justify-around bg-black/60 border-t border-white/10 select-none z-10">
        <button
          onClick={() => setSelectedTowerType('flame')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-sm border text-xs font-mono transition-all ${
            selectedTowerType === 'flame' ? 'bg-red-600/30 border-red-500 text-red-300' : 'bg-white/5 border-white/10 text-slate-400'
          }`}
        >
          <span>🔥</span>
          <span>플레임 (30M)</span>
        </button>
        <button
          onClick={() => setSelectedTowerType('frost')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-sm border text-xs font-mono transition-all ${
            selectedTowerType === 'frost' ? 'bg-sky-600/30 border-sky-500 text-sky-300' : 'bg-white/5 border-white/10 text-slate-400'
          }`}
        >
          <span>❄️</span>
          <span>프로스트 (40M)</span>
        </button>
        <button
          onClick={() => setSelectedTowerType('tesla')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-sm border text-xs font-mono transition-all ${
            selectedTowerType === 'tesla' ? 'bg-amber-600/30 border-amber-500 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400'
          }`}
        >
          <span>⚡</span>
          <span>테슬라 (50M)</span>
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_tower_craft"
          gameTitle={isKo ? '블리츠 타워: 전략 디펜스' : 'Blitz Tower: Strategy Defense'}
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
export default VoxelTowerCraftGame;

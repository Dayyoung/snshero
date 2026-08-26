import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDungeonCrawlerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface DungeonMonster {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  cardId: number;
  avatar: string;
  name: string;
  enName: string;
  speed: number;
  radius: number;
  isBoss: boolean;
}

interface DungeonLoot {
  id: number;
  x: number;
  y: number;
  type: 'chest' | 'potion';
  icon: string;
  radius: number;
}

export const VoxelDungeonCrawlerGame: React.FC<VoxelDungeonCrawlerGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 37;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const totalFloors = 5;
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [slashCombo, setSlashCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_dungeon_slasher') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    floor: 1,
    playerHp: 100,
    score: 0,
    slashCombo: 0,
    maxCombo: 0,
    timeLeft: 35,
    monsters: [] as DungeonMonster[],
    loots: [] as DungeonLoot[],
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    monsterCounter: 1,
    lootCounter: 1,
    spawnTimer: 0,
    floorMonstersKilled: 0,
    floorMonstersTarget: 6,
  });

  const setupFloor = useCallback((floorNum: number) => {
    const s = stateRef.current;
    s.floor = floorNum;
    s.monsters = [];
    s.loots = [];
    s.floorMonstersKilled = 0;
    s.floorMonstersTarget = 5 + floorNum * 2;
    s.spawnTimer = 0;

    setCurrentFloor(floorNum);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.playerHp = 100;
    s.score = 0;
    s.slashCombo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.monsterCounter = 1;
    s.lootCounter = 1;

    setPlayerHp(100);
    setScore(0);
    setSlashCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupFloor(1);
  }, [setupFloor]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch / Pointer Tap Slash Action (Zero Joysticks)
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

    // 1. Check Loot Pickups (Chests / Potions)
    for (let i = s.loots.length - 1; i >= 0; i--) {
      const loot = s.loots[i];
      if (Math.hypot(loot.x - tapX, loot.y - tapY) < loot.radius + 20) {
        if (loot.type === 'chest') {
          s.score += 300;
          setScore(s.score);
          setFeedbackText(`TREASURE! +300P 📦`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        } else {
          s.playerHp = Math.min(100, s.playerHp + 25);
          setPlayerHp(s.playerHp);
          setFeedbackText(`HP RECOVER +25 🧪`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
        setTimeout(() => setFeedbackText(null), 350);
        s.loots.splice(i, 1);
        return;
      }
    }

    // 2. Check Monster Tap Slash
    for (let i = s.monsters.length - 1; i >= 0; i--) {
      const m = s.monsters[i];
      if (Math.hypot(m.x - tapX, m.y - tapY) < m.radius + 22) {
        m.hp -= 35;
        s.slashCombo += 1;
        if (s.slashCombo > s.maxCombo) s.maxCombo = s.slashCombo;

        const pts = 80 + s.slashCombo * 20;
        s.score += pts;
        setScore(s.score);
        setSlashCombo(s.slashCombo);
        setMaxCombo(s.maxCombo);

        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        // Monster Slain
        if (m.hp <= 0) {
          s.floorMonstersKilled += 1;
          s.monsters.splice(i, 1);

          // Chance to drop loot
          if (Math.random() < 0.45) {
            s.loots.push({
              id: s.lootCounter++,
              x: m.x,
              y: m.y,
              type: Math.random() < 0.6 ? 'chest' : 'potion',
              icon: Math.random() < 0.6 ? '📦' : '🧪',
              radius: 18,
            });
          }

          // Check Floor Clear
          if (s.floorMonstersKilled >= s.floorMonstersTarget) {
            if (s.floor < totalFloors) {
              setFeedbackText(`B${s.floor}F CLEARED! 🚪`);
              s.score += 600;
              setScore(s.score);
              setTimeout(() => {
                setFeedbackText(null);
                setupFloor(s.floor + 1);
              }, 700);
            } else {
              // Slay Final Dungeon Boss!
              endGame(true);
            }
          }
        }
        return;
      }
    }

    // Miss Slash
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  // Main 60FPS Dungeon Battle Loop
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

      // Spawn Floor Monsters
      s.spawnTimer += dt;
      if (
        s.spawnTimer >= 0.85 &&
        s.monsters.length < 5 &&
        s.floorMonstersKilled + s.monsters.length < s.floorMonstersTarget
      ) {
        s.spawnTimer = 0;
        const isBossSpawn = s.floor === 5 && s.monsters.length === 0;
        const monsterPool = [11, 23, 35, 48, 56, 67];
        const cardId = isBossSpawn ? 88 : monsterPool[Math.floor(Math.random() * monsterPool.length)];

        s.monsters.push({
          id: s.monsterCounter++,
          x: 40 + Math.random() * 280,
          y: 40, // Spawn from top dungeon gate
          hp: isBossSpawn ? 180 : 30 + s.floor * 15,
          maxHp: isBossSpawn ? 180 : 30 + s.floor * 15,
          cardId,
          avatar: isBossSpawn ? '👿' : s.floor % 2 === 0 ? '🧟' : '💀',
          name: isBossSpawn ? '던전 군주' : '던전 몬스터',
          enName: isBossSpawn ? 'Dungeon Lord' : 'Dungeon Monster',
          speed: 60 + s.floor * 12,
          radius: isBossSpawn ? 32 : 22,
          isBoss: isBossSpawn,
        });
      }

      // Update Monsters (Advance towards bottom player barrier)
      for (let i = s.monsters.length - 1; i >= 0; i--) {
        const m = s.monsters[i];
        m.y += m.speed * dt;

        // Reach Player Gate
        if (m.y >= 450) {
          s.monsters.splice(i, 1);
          s.playerHp = Math.max(0, s.playerHp - 16);
          s.slashCombo = 0;
          setPlayerHp(s.playerHp);
          setSlashCombo(0);
          setFeedbackText(isKo ? '방벽 피격! -16 HP 💥' : 'GATE HIT! -16 HP 💥');
          setTimeout(() => setFeedbackText(null), 350);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          if (s.playerHp <= 0) {
            endGame(false);
            return;
          }
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dark Stone Dungeon Tile Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Floor Stone Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Render Dropped Loots (Card Sprites)
      s.loots.forEach((loot) => {
        drawCardSprite(
          ctx,
          loot.type === 'chest' ? 100 : 12,
          loot.x - 12,
          loot.y - 12,
          24,
          24,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: loot.type === 'chest' ? '#fde047' : '#34d399',
            shadowBlur: 6,
            shadowColor: loot.type === 'chest' ? 'rgba(253, 224, 71, 0.8)' : 'rgba(52, 211, 153, 0.8)',
          }
        );
      });

      // Render Monsters (Card Sprites)
      s.monsters.forEach((m) => {
        const size = m.isBoss ? 44 : 32;
        drawCardSprite(
          ctx,
          m.cardId,
          m.x - size / 2,
          m.y - size / 2,
          size,
          size,
          {
            circleClip: true,
            borderWidth: m.isBoss ? 2 : 1.5,
            borderColor: m.isBoss ? '#fde047' : '#ef4444',
            shadowBlur: m.isBoss ? 10 : 6,
            shadowColor: m.isBoss ? 'rgba(253, 224, 71, 0.9)' : 'rgba(239, 68, 68, 0.7)',
          }
        );

        // Monster Health Bar
        const barW = m.isBoss ? 45 : 30;
        const barH = 5;
        const barX = m.x - barW / 2;
        const barY = m.y - m.radius - 8;

        ctx.fillStyle = '#374151';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(barX, barY, barW * (m.hp / m.maxHp), barH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
      });

      // Player Defense Gate at bottom
      ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
      ctx.fillRect(0, 450, w, 50);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 450, w, 50);

      // Hero Guardian Emblem
      drawCardSprite(
        ctx,
        playerHeroId,
        w / 2 - 16,
        459,
        32,
        32,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#0284c7',
          shadowBlur: 10,
          shadowColor: 'rgba(2, 132, 199, 0.8)',
        }
      );
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx, setupFloor, playerHeroId]);

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
      gameId: 'arcade_dungeon_slasher',
      gameTitle: '블리츠 던전 슬래셔',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.floor * 400) + s.maxCombo * 60,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.floor >= 3,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 몬스터 직접 탭 슬래시' : 'STEP 1: TAP SLASH MONSTERS',
      title: isKo ? '다가오는 몬스터를 탭하여 베어 넘기세요' : 'Tap Directly on Approaching Monsters to Slay',
      description: isKo
        ? '가상 조이스틱 없이 화면 상단에서 몰려오는 던전 몬스터를 손가락으로 직접 탭하여 처치하고, 드롭된 보물 상자(📦)와 물약(🧪)을 탭하여 수집하세요.'
        : 'Tap incoming monsters directly with your fingers and collect dropped chests and potions.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 몬스터 직접 원터치 탭 슬래시)',
            '보물 상자(📦) 300P / 체력 물약(🧪) HP 25 회복',
            '5개 층(B1F ~ B5F)의 던전 보스를 모두 토벌하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Slashes',
            'Chests (📦) grant 300P / Potions (🧪) heal 25 HP',
            'Conquer all 5 dungeon floors and slay the Dungeon Lord'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 타깃 탭 (Direct Target Tap)' : 'Direct Screen Tap',
      description: isKo
        ? '몬스터와 보물 상자를 손가락으로 빠르게 탭합니다.'
        : 'Simply tap monsters and items across the dungeon screen.',
      keyPoints: isKo
        ? [
            '👆 타깃 직접 탭: 즉각적인 슬래시 타격 반응',
            '⚡ 연속 슬래시 콤보 배수 보너스로 점수 대량 가산',
            '⚔️ 방벽 도달 전 모든 몬스터를 소탕하세요'
          ]
        : [
            '👆 Direct Tap: Instant slashing hit feedback',
            '⚡ High hit combo multipliers grant massive score',
            '⚔️ Clear all monsters before they breach the gate'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '던전 돌파 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '돌파 층수 및 보물 파밍 수 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Cleared floors and looted chests multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#090d16] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 던전 슬래셔' : 'Blitz Dungeon Slasher'}
        language={(language as Language) || 'ko'}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '던전' : 'Floor', value: `B${currentFloor}F/${totalFloors}F`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${slashCombo}x`, color: slashCombo > 5 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Dungeon Slasher Canvas Viewport */}
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
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-lg font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '몬스터를 탭해 공격하고 보물 상자(📦)를 탭해 수집하세요' : 'Tap monsters to slash & tap chests to collect loot'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_dungeon_slasher"
          gameTitle={isKo ? '블리츠 던전 슬래셔: 탭 액션' : 'Blitz Dungeon Slasher: Tap Action'}
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
export default VoxelDungeonCrawlerGame;

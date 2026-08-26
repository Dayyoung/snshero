import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDragonSlayerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface DragonFireball {
  id: number;
  x: number;
  y: number;
  speed: number;
  radius: number;
  destroyed: boolean;
}

export const VoxelDragonSlayerGame: React.FC<VoxelDragonSlayerGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 62;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [playerHp, setPlayerHp] = useState<number>(100);
  const [dragonHp, setDragonHp] = useState<number>(500);
  const [isGroggy, setIsGroggy] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [hitCombo, setHitCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_dragon_raid') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    playerHp: 100,
    dragonHp: 500,
    dragonMaxHp: 500,
    dragonX: 180,
    dragonY: 130,
    dragonHoverTime: 0,
    isGroggy: false,
    groggyTimeLeft: 0,
    fireballs: [] as DragonFireball[],
    score: 0,
    hitCombo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    fireballCounter: 1,
    spawnTimer: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.playerHp = 100;
    s.dragonHp = 500;
    s.dragonMaxHp = 500;
    s.dragonX = 180;
    s.dragonY = 130;
    s.dragonHoverTime = 0;
    s.isGroggy = false;
    s.groggyTimeLeft = 0;
    s.fireballs = [];
    s.score = 0;
    s.hitCombo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.fireballCounter = 1;
    s.spawnTimer = 0;

    setPlayerHp(100);
    setDragonHp(500);
    setIsGroggy(false);
    setScore(0);
    setHitCombo(0);
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
          endGame(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch / Pointer Direct Tap Action (Zero Joysticks)
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

    // 1. Check Fireball Interception (Bullet Parrying)
    for (let i = s.fireballs.length - 1; i >= 0; i--) {
      const fb = s.fireballs[i];
      if (Math.hypot(fb.x - tapX, fb.y - tapY) < fb.radius + 18) {
        fb.destroyed = true;
        s.score += 150;
        s.hitCombo += 1;
        if (s.hitCombo > s.maxCombo) s.maxCombo = s.hitCombo;

        setScore(s.score);
        setHitCombo(s.hitCombo);
        setMaxCombo(s.maxCombo);
        setFeedbackText(`FIRE INTERCEPT! +150P 🛡️`);
        setTimeout(() => setFeedbackText(null), 300);

        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        s.fireballs.splice(i, 1);
        return;
      }
    }

    // 2. Direct Dragon Tap Attack (Head / Core Hit)
    const distToDragon = Math.hypot(s.dragonX - tapX, s.dragonY - tapY);
    if (distToDragon < 65) {
      const isCritical = distToDragon < 28; // Head direct shot
      let dmg = (isCritical ? 35 : 18) * (s.isGroggy ? 2.5 : 1.0);

      s.dragonHp = Math.max(0, s.dragonHp - dmg);
      s.hitCombo += 1;
      if (s.hitCombo > s.maxCombo) s.maxCombo = s.hitCombo;

      const pts = Math.round(dmg * 10 + s.hitCombo * 10);
      s.score += pts;

      setDragonHp(Math.round(s.dragonHp));
      setScore(s.score);
      setHitCombo(s.hitCombo);
      setMaxCombo(s.maxCombo);

      if (isCritical) {
        setFeedbackText(`CRITICAL HEADSHOT! -${Math.round(dmg)} HP ⚡`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      }
      setTimeout(() => setFeedbackText(null), 350);

      // Trigger Groggy if health reaches 50%
      if (s.dragonHp <= 250 && !s.isGroggy && s.groggyTimeLeft === 0) {
        s.isGroggy = true;
        s.groggyTimeLeft = 6.0;
        setIsGroggy(true);
        setFeedbackText(`DRAGON GROGGY! 2.5x DAMAGE! 💥`);
        setTimeout(() => setFeedbackText(null), 800);
      }

      // Dragon Defeated!
      if (s.dragonHp <= 0) {
        endGame(true);
      }
    }
  };

  // Main 60FPS Dragon Raid Engine Loop
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

      // Dragon Hovering Movement
      s.dragonHoverTime += dt;
      if (!s.isGroggy) {
        s.dragonX = 180 + Math.sin(s.dragonHoverTime * 2.2) * 80;
        s.dragonY = 130 + Math.cos(s.dragonHoverTime * 3.0) * 20;

        // Spawn Dragon Fireballs
        s.spawnTimer += dt;
        if (s.spawnTimer >= 0.85 && s.fireballs.length < 5) {
          s.spawnTimer = 0;
          s.fireballs.push({
            id: s.fireballCounter++,
            x: s.dragonX + (Math.random() - 0.5) * 40,
            y: s.dragonY + 30,
            speed: 180 + Math.random() * 80,
            radius: 16,
            destroyed: false,
          });
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        }
      } else {
        // Groggy State Countdown
        s.dragonY = 160;
        s.groggyTimeLeft -= dt;
        if (s.groggyTimeLeft <= 0) {
          s.isGroggy = false;
          setIsGroggy(false);
        }
      }

      // Update Fireballs
      for (let i = s.fireballs.length - 1; i >= 0; i--) {
        const fb = s.fireballs[i];
        fb.y += fb.speed * dt;

        // Impact Player Base (Bottom Screen)
        if (fb.y >= 500) {
          s.fireballs.splice(i, 1);
          s.playerHp = Math.max(0, s.playerHp - 18);
          s.hitCombo = 0;
          setPlayerHp(s.playerHp);
          setHitCombo(0);
          setFeedbackText(isKo ? '화염 피격! -18 HP 🔥' : 'FIRE HIT! -18 HP 🔥');
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

      // Volcanic Dungeon Arena Background
      ctx.fillStyle = '#18080a';
      ctx.fillRect(0, 0, w, h);

      // Lava Cracks
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(120, h);
      ctx.moveTo(330, 0);
      ctx.lineTo(240, h);
      ctx.stroke();

      // Render Fireballs (Card Fire Energy)
      s.fireballs.forEach((fb) => {
        drawCardSprite(
          ctx,
          7,
          fb.x - 14,
          fb.y - 14,
          28,
          28,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#fde047',
            shadowBlur: 8,
            shadowColor: 'rgba(253, 224, 71, 0.8)',
          }
        );
      });

      // Render Boss Dragon (Red Wyvern Card Sprite)
      const dX = s.dragonX;
      const dY = s.dragonY;

      // Dragon Wings
      ctx.fillStyle = s.isGroggy ? '#7f1d1d' : '#dc2626';
      ctx.beginPath();
      ctx.moveTo(dX, dY);
      ctx.lineTo(dX - 85, dY - 40);
      ctx.lineTo(dX - 45, dY + 30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(dX, dY);
      ctx.lineTo(dX + 85, dY - 40);
      ctx.lineTo(dX + 45, dY + 30);
      ctx.closePath();
      ctx.fill();

      // Dragon Body & Card Sprite Head
      drawCardSprite(
        ctx,
        62,
        dX - 32,
        dY - 32,
        64,
        64,
        {
          circleClip: true,
          borderWidth: 2.5,
          borderColor: s.isGroggy ? '#eab308' : '#ef4444',
          shadowBlur: 14,
          shadowColor: s.isGroggy ? 'rgba(234, 179, 8, 0.9)' : 'rgba(239, 68, 68, 0.9)',
        }
      );

      // Boss Health Bar above Dragon
      const barW = 140;
      const barH = 8;
      const barX = dX - barW / 2;
      const barY = dY - 55;

      ctx.fillStyle = '#374151';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = s.isGroggy ? '#eab308' : '#ef4444';
      ctx.fillRect(barX, barY, barW * (s.dragonHp / s.dragonMaxHp), barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // Player Bow Sight / Shield Zone at bottom
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillRect(0, 480, w, 60);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 480, w, 60);

      // Player Hero Base Emblem
      drawCardSprite(
        ctx,
        playerHeroId,
        w / 2 - 16,
        494,
        32,
        32,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#06b6d4',
          shadowBlur: 10,
          shadowColor: 'rgba(6, 182, 212, 0.8)',
        }
      );
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
      gameId: 'arcade_dragon_raid',
      gameTitle: '블리츠 드래곤 레이드',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : Math.round((500 - s.dragonHp) * 3)) + s.maxCombo * 70,
      difficulty: 'NIGHTMARE',
      isVictory: isWin,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 드래곤 직접 사격' : 'STEP 1: DRAGON RAID',
      title: isKo ? '드래곤을 탭하여 마법 탄환을 쏘세요' : 'Tap Dragon to Fire Magic Arrows',
      description: isKo
        ? '가상 조이스틱 없이 날아다니는 드래곤의 머리를 직접 탭하여 크리티컬 헤드샷을 날리고, 날아오는 화염구를 탭하여 격추 요격하세요.'
        : 'Tap directly on the flying dragon to land headshots and tap fireballs to intercept them.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 원터치 탭 사격)',
            '날아오는 화염구(🔥)를 직접 탭하면 150P 요격 보너스',
            '드래곤 그로기(😵‍💫) 시 2.5배 폭풍 데미지 찬스'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Shooting',
            'Tap incoming fireballs (🔥) to intercept for 150P',
            'Groggy state (😵‍💫) activates 2.5x critical burst damage'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '목표물 직접 원터치 탭 (Direct Target Tap)' : 'Direct Screen Tap',
      description: isKo
        ? '드래곤의 약점 머리와 날아오는 화염탄을 손가락으로 가볍게 탭합니다.'
        : 'Simply tap the dragon head and incoming fireballs with your fingers.',
      keyPoints: isKo
        ? [
            '👆 타깃 직접 탭: 번개 같은 사격 및 요격 피드백',
            '⚡ 연속 히트 콤보로 피버 스코어 잭팟 획득',
            '🐉 500 HP 드래곤을 35초 내에 완전히 토벌하세요'
          ]
        : [
            '👆 Direct Tap: Instant responsive hit & parry feedback',
            '⚡ High hit combos grant massive bonus scores',
            '🐉 Slay 500 HP Dragon boss within 35 seconds'
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
            '잔여 HP 및 토벌 데미지 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining HP and boss damage multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0c0506] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 드래곤 레이드' : 'Blitz Dragon Raid'}
        language={(language as Language) || 'ko'}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '보스HP' : 'Dragon', value: `${dragonHp}/500`, color: dragonHp <= 150 ? 'text-rose-500 font-bold animate-pulse' : 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${hitCombo}x`, color: hitCombo > 5 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Dragon Raid Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
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
          {isKo ? '드래곤 머리를 탭하여 공격하고 화염탄을 탭해 요격하세요' : 'Tap dragon to shoot & tap fireballs to intercept'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_dragon_raid"
          gameTitle={isKo ? '블리츠 드래곤 레이드: 보스 토벌' : 'Blitz Dragon Raid: Boss Slaying'}
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
export default VoxelDragonSlayerGame;

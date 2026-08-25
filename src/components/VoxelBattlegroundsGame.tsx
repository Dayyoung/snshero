import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBattlegroundsGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  isReflected: boolean;
}

export const VoxelBattlegroundsGame: React.FC<VoxelBattlegroundsGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 34;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [playerHp, setPlayerHp] = useState<number>(100);
  const [bossHp, setBossHp] = useState<number>(1000);
  const [maxBossHp] = useState<number>(1000);
  const [grazeCombo, setGrazeCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [shieldReady, setShieldReady] = useState<boolean>(true);
  const [shieldCooldown, setShieldCooldown] = useState<number>(0);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_bullet_dodge') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    heroX: 180,
    heroY: 420,
    heroRadius: 10,
    bossX: 180,
    bossY: 80,
    bossHp: 1000,
    playerHp: 100,
    bullets: [] as Bullet[],
    score: 0,
    grazeCombo: 0,
    maxCombo: 0,
    shieldActive: false,
    shieldTimer: 0,
    shieldCooldown: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    bulletCounter: 1,
    bossAttackTimer: 0,
    bossAngle: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.heroX = 180;
    s.heroY = 420;
    s.bossX = 180;
    s.bossY = 80;
    s.bossHp = 1000;
    s.playerHp = 100;
    s.bullets = [];
    s.score = 0;
    s.grazeCombo = 0;
    s.maxCombo = 0;
    s.shieldActive = false;
    s.shieldTimer = 0;
    s.shieldCooldown = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.bulletCounter = 1;
    s.bossAttackTimer = 0;
    s.bossAngle = 0;

    setPlayerHp(100);
    setBossHp(1000);
    setGrazeCombo(0);
    setScore(0);
    setShieldReady(true);
    setShieldCooldown(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Touch / Pointer Direct Drag Movement (Zero Virtual Joystick)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    s.heroX = Math.min(340, Math.max(20, touchX));
    s.heroY = Math.min(500, Math.max(160, touchY));
  };

  // Double Tap or Long Press for Shield Parry Burst
  const lastTapTimeRef = useRef<number>(0);
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
    const now = performance.now();
    const s = stateRef.current;

    if (now - lastTapTimeRef.current < 300) {
      // Double tap detected: Activate Parry Shield!
      if (s.shieldCooldown <= 0 && !s.shieldActive) {
        s.shieldActive = true;
        s.shieldTimer = 1.2;
        s.shieldCooldown = 4.0;
        setShieldReady(false);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    }
    lastTapTimeRef.current = now;
  };

  // Main 60FPS Bullet Hell Engine Loop
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

      // Shield Timer & Cooldown update
      if (s.shieldActive) {
        s.shieldTimer -= dt;
        if (s.shieldTimer <= 0) s.shieldActive = false;
      }
      if (s.shieldCooldown > 0) {
        s.shieldCooldown -= dt;
        setShieldCooldown(Math.max(0, s.shieldCooldown));
        if (s.shieldCooldown <= 0) setShieldReady(true);
      }

      // Boss Movement & Bullet Spawning
      s.bossX = 180 + Math.sin(now * 0.002) * 110;
      s.bossAttackTimer += dt;

      if (s.bossAttackTimer >= 0.18) {
        s.bossAttackTimer = 0;
        s.bossAngle += 0.35;

        // Spiral Bullet Pattern
        const count = 5;
        for (let i = 0; i < count; i++) {
          const angle = s.bossAngle + (i * Math.PI * 2) / count;
          const speed = 140 + Math.random() * 40;
          s.bullets.push({
            id: s.bulletCounter++,
            x: s.bossX,
            y: s.bossY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#f43f5e',
            radius: 5,
            isReflected: false,
          });
        }
      }

      // Update Bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (!b.isReflected) {
          const distToHero = Math.hypot(b.x - s.heroX, b.y - s.heroY);

          // Shield Reflection Check
          if (s.shieldActive && distToHero < 28) {
            b.isReflected = true;
            b.color = '#38bdf8';
            b.vx *= -1.5;
            b.vy *= -1.5;
            s.score += 150;
            setScore(s.score);
            continue;
          }

          // Graze Check (Near Miss)
          if (distToHero < 22 && distToHero >= s.heroRadius + b.radius) {
            s.grazeCombo += 1;
            if (s.grazeCombo > s.maxCombo) s.maxCombo = s.grazeCombo;
            s.score += 20 * s.grazeCombo;
            setGrazeCombo(s.grazeCombo);
            setScore(s.score);
          }

          // Direct Hit Check
          if (distToHero < s.heroRadius + b.radius) {
            s.bullets.splice(i, 1);
            s.playerHp = Math.max(0, s.playerHp - 15);
            s.grazeCombo = 0;
            setPlayerHp(s.playerHp);
            setGrazeCombo(0);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

            if (s.playerHp <= 0) {
              endGame(false);
            }
            continue;
          }
        } else {
          // Reflected bullet hits Boss
          const distToBoss = Math.hypot(b.x - s.bossX, b.y - s.bossY);
          if (distToBoss < 35) {
            s.bullets.splice(i, 1);
            s.bossHp = Math.max(0, s.bossHp - 45);
            s.score += 300;
            setBossHp(s.bossHp);
            setScore(s.score);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.bossHp <= 0) {
              endGame(true);
            }
            continue;
          }
        }

        // Out of screen bounds
        if (b.x < -20 || b.x > 380 || b.y < -20 || b.y > 540) {
          s.bullets.splice(i, 1);
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep Space Arena Background
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Boss Mecha
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(s.bossX, s.bossY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👾', s.bossX, s.bossY);

      // Bullets
      s.bullets.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Player Hero
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(s.heroX, s.heroY, s.heroRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shield Barrier Aura
      if (s.shieldActive) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.heroX, s.heroY, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fill();
      }
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
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_bullet_dodge',
      gameTitle: '블리츠 불릿 닷지',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : 800) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 탄막 회피 & 패링 결투' : 'STEP 1: DODGE & PARRY',
      title: isKo ? '손가락으로 이동하고 탄막을 반사하세요' : 'Direct Finger Move & Parry Reflect',
      description: isKo
        ? '가상 조이스틱 없이 화면을 손가락으로 직접 터치해 탄막을 아슬아슬하게 피하고, 더블 탭으로 패링 실드를 켜서 탄막을 보스에게 반사하세요.'
        : 'Drag your hero directly to dodge bullets and double tap to activate Parry Shield.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 위치 추적)',
            '스치기(Graze) 성공 시 콤보 배수 급증',
            '더블 탭으로 패링 실드 발동 ➔ 탄막 반사로 보스 격파'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Tracking',
            'Near-miss Graze chains massive combo multipliers',
            'Double tap to activate Parry Shield & reflect bullets'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 & 더블 탭' : 'Direct Drag & Double Tap',
      description: isKo
        ? '화면 위 어디든 손가락을 대고 자유롭게 드래그하여 탄막을 회피합니다.'
        : 'Drag smoothly anywhere on screen to dodge complex bullet hell patterns.',
      keyPoints: isKo
        ? [
            '👆 화면 직접 드래그: 1:1 즉각적인 영웅 이동',
            '⚡ 더블 탭(Double Tap): 1.2초 무적 패링 실드',
            '🛡️ 4초 쿨다운 후 패링 실드 재사용 가능'
          ]
        : [
            '👆 Direct Drag: 1:1 instantaneous hero movement',
            '⚡ Double Tap: 1.2s invincible Parry Shield',
            '🛡️ 4s cooldown to recharge shield'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '보스 격파 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon boss defeat.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '그레이즈 콤보 및 잔여 HP 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Graze combo and remaining HP multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#030611] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 불릿 닷지' : 'Blitz Bullet Dodge'}
        language={(language as Language) || 'ko'}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '보스' : 'Boss', value: `${bossHp}/${maxBossHp}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '패링' : 'Parry', value: shieldReady ? 'READY ⚡' : `${shieldCooldown.toFixed(1)}s`, color: shieldReady ? 'text-cyan-300 font-bold animate-pulse' : 'text-slate-400' },
          { label: isKo ? '콤보' : 'Graze', value: `${grazeCombo}x`, color: grazeCombo > 5 ? 'text-amber-400 font-bold' : 'text-slate-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Bullet Dodge Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain touch-none cursor-crosshair"
        />
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '손가락으로 드래그해 탄막을 피하세요 (더블 탭: 패링 실드)' : 'Drag to dodge bullets (Double tap: Parry Shield)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_bullet_dodge"
          gameTitle={isKo ? '블리츠 불릿 닷지: 탄막 결투' : 'Blitz Bullet Dodge: Bullet Hell'}
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
export default VoxelBattlegroundsGame;

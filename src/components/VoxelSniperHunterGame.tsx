import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSniperHunterGameProps {
  deck: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SniperTarget {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'agent' | 'vip' | 'barrel' | 'drone';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  hp: number;
  maxHp: number;
  isHit: boolean;
}

export const VoxelSniperHunterGame: React.FC<VoxelSniperHunterGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 78;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [targetsEliminated, setTargetsEliminated] = useState<number>(0);
  const [ammo, setAmmo] = useState<number>(10);
  const maxAmmo = 10;
  const [score, setScore] = useState<number>(0);
  const [sniperCombo, setSniperCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_sniper_hunter') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    targets: [] as SniperTarget[],
    ammo: 10,
    targetsEliminated: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    targetCounter: 1,
    spawnTimer: 0,
    scopeRing: { x: 180, y: 250, active: false },
    crosshairs: [] as { x: number; y: number; life: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.targets = [];
    s.ammo = 10;
    s.targetsEliminated = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.targetCounter = 1;
    s.spawnTimer = 0;
    s.crosshairs = [];
    s.particles = [];

    // Initial Targets
    s.targets.push(
      { id: s.targetCounter++, x: 80, y: 140, vx: 45, type: 'agent', cardId: 78, icon: '🦹', points: 300, radius: 24, hp: 1, maxHp: 1, isHit: false },
      { id: s.targetCounter++, x: 260, y: 190, vx: -35, type: 'barrel', cardId: 34, icon: '🛢️', points: 500, radius: 22, hp: 1, maxHp: 1, isHit: false }
    );

    setTargetsEliminated(0);
    setAmmo(10);
    setScore(0);
    setSniperCombo(0);
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
          const isTargetMet = stateRef.current.targetsEliminated >= 8;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Reload Ammo
  const handleReload = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.ammo === maxAmmo) return;
    s.ammo = maxAmmo;
    setAmmo(maxAmmo);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setFeedbackText(isKo ? '스나이퍼 탄창 장전 완료! ⚡' : 'SNIPER RELOADED! ⚡');
    setTimeout(() => setFeedbackText(null), 300);
  };

  // Direct Tap Precision Sniper Fire (Zero Joysticks)
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

    if (s.ammo <= 0) {
      handleReload();
      return;
    }

    s.ammo -= 1;
    setAmmo(s.ammo);
    s.crosshairs.push({ x: tapX, y: tapY, life: 0.3 });
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

    // Check Hit on Targets
    let hitAny = false;
    for (let i = s.targets.length - 1; i >= 0; i--) {
      const t = s.targets[i];
      if (Math.hypot(t.x - tapX, t.y - tapY) < t.radius + 14) {
        hitAny = true;
        t.hp -= 1;

        s.combo += 1;
        if (s.combo > s.maxCombo) s.maxCombo = s.combo;

        if (t.type === 'barrel') {
          // Explosive Barrel Blast -> Kills all nearby targets!
          s.targetsEliminated += 1;
          const blastPts = 800 + s.combo * 50;
          s.score += blastPts;

          setFeedbackText(isKo ? `💥 폭발 배럴 연쇄 폭파! +${blastPts}P` : `💥 BARREL BLAST! +${blastPts}P`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

          // Blast particles
          for (let p = 0; p < 18; p++) {
            s.particles.push({
              x: t.x,
              y: t.y,
              vx: (Math.random() - 0.5) * 280,
              vy: (Math.random() - 0.5) * 280,
              color: '#f97316',
              life: 0.5,
            });
          }

          s.targets.splice(i, 1);
        } else {
          const isHeadshot = Math.hypot(t.x - tapX, (t.y - t.radius * 0.4) - tapY) < 14;
          const pts = (t.points + (isHeadshot ? 400 : 0)) + s.combo * 50;
          s.score += pts;

          setFeedbackText(isHeadshot ? `🎯 HEADSHOT! +${pts}P` : `SNIPED! +${pts}P 💥`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          // Sniper blood / spark particles
          for (let p = 0; p < 10; p++) {
            s.particles.push({
              x: tapX,
              y: tapY,
              vx: (Math.random() - 0.5) * 220,
              vy: (Math.random() - 0.5) * 220,
              color: isHeadshot ? '#fde047' : '#ef4444',
              life: 0.4,
            });
          }

          if (t.hp <= 0) {
            s.targetsEliminated += 1;
            s.targets.splice(i, 1);
          }
        }

        setTargetsEliminated(s.targetsEliminated);
        setScore(s.score);
        setSniperCombo(s.combo);
        setMaxCombo(s.maxCombo);
        setTimeout(() => setFeedbackText(null), 300);
        break;
      }
    }

    if (!hitAny) {
      s.combo = 0;
      setSniperCombo(0);
    }
  };

  // Main 60FPS Sniper Loop
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

      // Spawn Sniper Targets
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.0 && s.targets.length < 5) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isVip = rand < 0.18;
        const isBarrel = rand >= 0.18 && rand < 0.45;
        const isDrone = rand >= 0.45 && rand < 0.7;
        const cardId = isVip ? 83 : (isBarrel ? 34 : (isDrone ? 26 : 78));

        s.targets.push({
          id: s.targetCounter++,
          x: Math.random() < 0.5 ? 30 : 330,
          y: 90 + Math.random() * 210,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isVip ? 40 : (isDrone ? 80 : 50)),
          type: isVip ? 'vip' : (isBarrel ? 'barrel' : (isDrone ? 'drone' : 'agent')),
          cardId,
          icon: isVip ? '👑' : (isBarrel ? '🛢️' : (isDrone ? '🤖' : '🦹')),
          points: isVip ? 1000 : (isBarrel ? 500 : (isDrone ? 400 : 300)),
          radius: isVip ? 28 : (isBarrel ? 22 : 24),
          hp: isVip ? 2 : 1,
          maxHp: isVip ? 2 : 1,
          isHit: false,
        });
      }

      // Move Targets
      s.targets.forEach((t) => {
        t.x += t.vx * dt;
        if (t.x > 330) {
          t.x = 330;
          t.vx = -Math.abs(t.vx);
        } else if (t.x < 30) {
          t.x = 30;
          t.vx = Math.abs(t.vx);
        }
      });

      // Update Crosshairs
      for (let i = s.crosshairs.length - 1; i >= 0; i--) {
        const c = s.crosshairs[i];
        c.life -= dt;
        if (c.life <= 0) s.crosshairs.splice(i, 1);
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

      // Night City Sniper Rooftop Background
      const cityGrad = ctx.createLinearGradient(0, 0, 0, h);
      cityGrad.addColorStop(0, '#020617');
      cityGrad.addColorStop(0.5, '#0f172a');
      cityGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = cityGrad;
      ctx.fillRect(0, 0, w, h);

      // Sniper Scope Vignette Overlay
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Render Sniper Targets (Card Sprites)
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
            borderColor: t.type === 'vip' ? '#fde047' : (t.type === 'barrel' ? '#f97316' : (t.type === 'drone' ? '#38bdf8' : '#ef4444')),
            shadowBlur: t.type === 'vip' ? 18 : 6,
            shadowColor: t.type === 'vip' ? 'rgba(253, 224, 71, 0.9)' : (t.type === 'barrel' ? 'rgba(249, 115, 22, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
          }
        );

        // HP Bar for VIP
        if (t.maxHp > 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-14, t.radius + 3, 28, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-14, t.radius + 3, 28 * (t.hp / t.maxHp), 4);
        }
        ctx.restore();
      });

      // Render Crosshair Taps
      s.crosshairs.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.moveTo(-24, 0);
        ctx.lineTo(24, 0);
        ctx.moveTo(0, -24);
        ctx.lineTo(0, 24);
        ctx.stroke();
        ctx.restore();
      });

      // Render Sniper Hero Badge at Bottom
      drawCardSprite(
        ctx,
        playerHeroId,
        w / 2 - 24,
        430,
        48,
        48,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
          shadowBlur: 14,
          shadowColor: 'rgba(56, 189, 248, 0.8)',
        }
      );

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playerHeroId]);

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
      gameId: 'arcade_sniper_hunter',
      gameTitle: '블리츠 스나이퍼 헌터',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.targetsEliminated * 350) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.targetsEliminated >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 화면 탭 정밀 저격 암살' : 'STEP 1: TAP PRECISION SNIPING',
      title: isKo ? '화면의 적 요원과 폭발 배럴을 직접 탭해 저격하세요' : 'Tap Enemy Agents and Explosive Barrels to Snipe',
      description: isKo
        ? '가상 조이스틱 없이 건물 옥상과 도로를 이동하는 적 요원(🦹), VIP 타깃(👑), 폭발 배럴(🛢️)을 손가락으로 직접 탭하여 초정밀 헤드샷 암살을 성공시키세요.'
        : 'Tap roaming agents and explosive red barrels directly on your screen to eliminate targets with precision headshots.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 타깃 탭 저격)',
            'VIP 타깃(👑) 암살 시 1,000P 잭팟 대박 보너스',
            '폭발 배럴(🛢️) 저격 시 주변 연쇄 폭파 암살'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Sniper Fire',
            'VIP Targets (👑) award 1,000P massive bounty jackpot',
            'Shoot red barrels (🛢️) to trigger explosive chain kills'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 탭 & 재장전 (Direct Tap & Reload)' : 'Direct Tap & Reload',
      description: isKo
        ? '표적을 탭하여 저격하고, 탄창 소진 시 재장전 버튼을 누릅니다.'
        : 'Tap targets to snipe, tap reload when empty.',
      keyPoints: isKo
        ? [
            '👆 타깃 직접 탭: 60FPS 즉각 반응 초정밀 탄도 사격',
            '🎯 연속 헤드샷 시 스나이퍼 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Direct Tap: Instant precision ballistics strike',
            '🎯 Consecutive headshots grant combo multipliers',
            '⏱️ 35s time attack sniper hunter sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '암살 작전 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '암살한 타깃 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Eliminated targets count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 스나이퍼 헌터' : 'Blitz Sniper Hunter'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '암살' : 'Kills', value: `${targetsEliminated}명`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '탄창' : 'Ammo', value: `${ammo}/${maxAmmo}`, color: ammo <= 2 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Sniper Canvas Viewport */}
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}

        {/* Quick Reload Overlay Button (Bottom Right) */}
        <button
          onClick={handleReload}
          className="absolute bottom-4 right-4 z-10 px-4 py-2 bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg border border-white/20 transition-transform"
        >
          {isKo ? '장전 🔄' : 'RELOAD 🔄'}
        </button>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '적 요원과 폭발 배럴(🛢️)을 손가락으로 직접 탭해 저격하세요' : 'Tap enemy agents and explosive barrels directly to snipe'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_sniper_hunter"
          gameTitle={isKo ? '블리츠 스나이퍼: 정밀 저격' : 'Blitz Sniper: Precision Hunter'}
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
export default VoxelSniperHunterGame;

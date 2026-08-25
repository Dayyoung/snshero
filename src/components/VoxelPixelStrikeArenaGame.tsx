import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPixelStrikeArenaGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface StrikeTarget {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'terrorist' | 'drone' | 'boss';
  icon: string;
  points: number;
  radius: number;
  hp: number;
  maxHp: number;
  isHit: boolean;
}

export const VoxelPixelStrikeArenaGame: React.FC<VoxelPixelStrikeArenaGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [targetsEliminated, setTargetsEliminated] = useState<number>(0);
  const [ammo, setAmmo] = useState<number>(12);
  const maxAmmo = 12;
  const [score, setScore] = useState<number>(0);
  const [strikeCombo, setStrikeCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_pixel_strike') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    targets: [] as StrikeTarget[],
    ammo: 12,
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
    crosshairs: [] as { x: number; y: number; life: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.targets = [];
    s.ammo = 12;
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
      { id: s.targetCounter++, x: 90, y: 150, vx: 50, vy: 0, type: 'terrorist', icon: '🦹', points: 300, radius: 24, hp: 1, maxHp: 1, isHit: false },
      { id: s.targetCounter++, x: 270, y: 110, vx: -70, vy: 20, type: 'drone', icon: '🤖', points: 450, radius: 20, hp: 1, maxHp: 1, isHit: false }
    );

    setTargetsEliminated(0);
    setAmmo(12);
    setScore(0);
    setStrikeCombo(0);
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

  // Reload Ammo
  const handleReload = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.ammo === maxAmmo) return;
    s.ammo = maxAmmo;
    setAmmo(maxAmmo);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setFeedbackText(isKo ? '재장전 완료! ⚡' : 'RELOADED! ⚡');
    setTimeout(() => setFeedbackText(null), 300);
  };

  // Direct Tap Precision Shooting
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
    s.crosshairs.push({ x: tapX, y: tapY, life: 0.25 });
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Check Hit on Targets
    let hitAny = false;
    for (let i = s.targets.length - 1; i >= 0; i--) {
      const t = s.targets[i];
      if (Math.hypot(t.x - tapX, t.y - tapY) < t.radius + 15) {
        hitAny = true;
        t.hp -= 1;

        s.combo += 1;
        if (s.combo > s.maxCombo) s.maxCombo = s.combo;

        const isHeadshot = Math.hypot(t.x - tapX, (t.y - t.radius * 0.4) - tapY) < 14;
        const pts = (t.points + (isHeadshot ? 300 : 0)) + s.combo * 40;
        s.score += pts;

        setScore(s.score);
        setStrikeCombo(s.combo);
        setMaxCombo(s.maxCombo);

        setFeedbackText(isHeadshot ? `🎯 HEADSHOT! +${pts}P` : `HIT! +${pts}P 💥`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        setTimeout(() => setFeedbackText(null), 300);

        // Hit Sparkles
        for (let p = 0; p < 10; p++) {
          s.particles.push({
            x: tapX,
            y: tapY,
            vx: (Math.random() - 0.5) * 240,
            vy: (Math.random() - 0.5) * 240,
            color: isHeadshot ? '#fde047' : '#ef4444',
            life: 0.4,
          });
        }

        if (t.hp <= 0) {
          s.targetsEliminated += 1;
          setTargetsEliminated(s.targetsEliminated);
          s.targets.splice(i, 1);
        }
        break;
      }
    }

    if (!hitAny) {
      s.combo = 0;
      setStrikeCombo(0);
    }
  };

  // Main 60FPS Strike Arena Loop
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

      // Spawn Targets
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.0 && s.targets.length < 5) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isBoss = rand < 0.18;
        const isDrone = rand < 0.55;

        s.targets.push({
          id: s.targetCounter++,
          x: Math.random() < 0.5 ? 30 : 330,
          y: 80 + Math.random() * 220,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isBoss ? 45 : (isDrone ? 95 : 65)),
          vy: isDrone ? (Math.random() - 0.5) * 60 : 0,
          type: isBoss ? 'boss' : (isDrone ? 'drone' : 'terrorist'),
          icon: isBoss ? '👾' : (isDrone ? '🤖' : '🦹'),
          points: isBoss ? 800 : (isDrone ? 450 : 300),
          radius: isBoss ? 30 : (isDrone ? 20 : 24),
          hp: isBoss ? 3 : 1,
          maxHp: isBoss ? 3 : 1,
          isHit: false,
        });
      }

      // Move Targets
      s.targets.forEach((t) => {
        t.x += t.vx * dt;
        t.y += t.vy * dt;

        if (t.x > 330) {
          t.x = 330;
          t.vx = -Math.abs(t.vx);
        } else if (t.x < 30) {
          t.x = 30;
          t.vx = Math.abs(t.vx);
        }

        if (t.y < 70) {
          t.y = 70;
          t.vy = Math.abs(t.vy);
        } else if (t.y > 340) {
          t.y = 340;
          t.vy = -Math.abs(t.vy);
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

      // Cyber Pixel Arena City Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.6, '#1e293b');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Render Targets
      s.targets.forEach((t) => {
        ctx.save();
        ctx.translate(t.x, t.y);
        if (t.type === 'boss') {
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 20;
        }
        ctx.font = `${t.radius * 1.8}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.icon, 0, 0);

        // HP Bar for Boss
        if (t.maxHp > 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-14, t.radius + 2, 28, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-14, t.radius + 2, 28 * (t.hp / t.maxHp), 4);
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
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.moveTo(0, -20);
        ctx.lineTo(0, 20);
        ctx.stroke();
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
  }, []);

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
      gameId: 'arcade_pixel_strike',
      gameTitle: '블리츠 픽셀 스트라이크',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.targetsEliminated * 300) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.targetsEliminated >= 10,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 화면 직접 탭 정밀 사격' : 'STEP 1: TAP PRECISION SHOOTING',
      title: isKo ? '화면의 적 표적을 직접 탭해 저격 소탕하세요' : 'Tap Enemy Targets to Shoot & Eliminate',
      description: isKo
        ? '가상 조이스틱 없이 화면을 비행하는 드론(🤖), 픽셀 요원(🦹), 사이버 보스(👾)를 손가락으로 직접 탭하여 초정밀 사격으로 제압하고 헤드샷을 터뜨리세요.'
        : 'Tap roaming drones and agents directly on your screen to eliminate them with precision headshots.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 타깃 탭 사격)',
            '헤드샷 적중 시 +300P 추가 보너스',
            '35초간 최대 콤보로 타깃을 소탕하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Shooting',
            'Headshots award +300P precision bonus',
            'Eliminate targets with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 탭 & 재장전 (Direct Tap & Reload)' : 'Direct Tap & Reload',
      description: isKo
        ? '표적을 탭하여 즉시 사격하고, 탄창이 비면 재장전 버튼을 누릅니다.'
        : 'Tap targets to shoot, tap reload button when empty.',
      keyPoints: isKo
        ? [
            '👆 타깃 탭: 즉시 반응 고속 레이저 사격',
            '⚡ 연속 명중 시 스트라이크 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Tap Target: Instant pinpoint laser shot',
            '⚡ Consecutive hits grant combo multipliers',
            '⏱️ 35s time attack strike arena sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '작전 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '소탕한 타깃 수 및 최대 콤보 비례 대량 잭팟',
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
    <div className="relative w-full h-[100dvh] bg-[#0f172a] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 픽셀 스트라이크' : 'Blitz Pixel Strike'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '소탕' : 'Kills', value: `${targetsEliminated}명`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '탄창' : 'Ammo', value: `${ammo}/${maxAmmo}`, color: ammo <= 3 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Strike Canvas Viewport */}
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
          {isKo ? '재장전 🔄' : 'RELOAD 🔄'}
        </button>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '적 타깃을 손가락으로 직접 탭해 사격하고 헤드샷을 터뜨리세요' : 'Tap enemy targets directly to shoot with headshots'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_pixel_strike"
          gameTitle={isKo ? '블리츠 픽셀: 건슈팅 아레나' : 'Blitz Pixel: Gun Arena'}
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
export default VoxelPixelStrikeArenaGame;

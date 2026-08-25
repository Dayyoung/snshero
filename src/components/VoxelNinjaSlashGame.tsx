import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelNinjaSlashGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface FlyingTarget {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'shuriken' | 'bamboo' | 'scroll' | 'bomb' | 'boss';
  icon: string;
  points: number;
  radius: number;
  isSliced: boolean;
}

export const VoxelNinjaSlashGame: React.FC<VoxelNinjaSlashGameProps> = ({
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

  const [targetsSliced, setTargetsSliced] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [ninjaCombo, setNinjaCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_ninja_slash') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    targets: [] as FlyingTarget[],
    bladeTrail: [] as { x: number; y: number; life: number }[],
    targetsSliced: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    targetCounter: 1,
    spawnTimer: 0,
    isSlashing: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.targets = [];
    s.bladeTrail = [];
    s.targetsSliced = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.targetCounter = 1;
    s.spawnTimer = 0;
    s.isSlashing = false;
    s.particles = [];

    setTargetsSliced(0);
    setScore(0);
    setNinjaCombo(0);
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

  // Touch Handlers: Direct Katana Blade Swipe (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.isSlashing = true;
    s.bladeTrail = [{ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY, life: 0.25 }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isSlashing || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;

    s.bladeTrail.push({ x: curX, y: curY, life: 0.25 });

    // Check Katana Blade Slicing Collision
    s.targets.forEach((target) => {
      if (!target.isSliced && Math.hypot(target.x - curX, target.y - curY) < target.radius + 15) {
        target.isSliced = true;

        if (target.type === 'bomb') {
          s.score = Math.max(0, s.score - 300);
          s.combo = 0;
          setScore(s.score);
          setNinjaCombo(0);

          setFeedbackText(isKo ? '폭탄 폭발! 💣💥' : 'BOMB EXPLODED! 💣💥');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);

          // Explosion Sparks
          for (let p = 0; p < 12; p++) {
            s.particles.push({
              x: target.x,
              y: target.y,
              vx: (Math.random() - 0.5) * 250,
              vy: (Math.random() - 0.5) * 250,
              color: '#ef4444',
              life: 0.5,
            });
          }
        } else {
          s.targetsSliced += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = target.points + s.combo * 30;
          s.score += pts;

          setTargetsSliced(s.targetsSliced);
          setScore(s.score);
          setNinjaCombo(s.combo);
          setMaxCombo(s.maxCombo);

          setFeedbackText(`SLASH! ${target.icon} +${pts}P ⚔️`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          setTimeout(() => setFeedbackText(null), 300);

          // Blade Sparkles
          for (let p = 0; p < 10; p++) {
            s.particles.push({
              x: target.x,
              y: target.y,
              vx: (Math.random() - 0.5) * 220,
              vy: (Math.random() - 0.5) * 220,
              color: target.type === 'boss' ? '#fde047' : '#38bdf8',
              life: 0.5,
            });
          }
        }
      }
    });
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    s.isSlashing = false;
  };

  // Main 60FPS Ninja Slash Loop
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

      // Spawn Flying Targets (Bamboo, Shuriken, Scroll, Bomb, Boss)
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.65) {
        s.spawnTimer = 0;
        const rand = Math.random();
        let type: 'shuriken' | 'bamboo' | 'scroll' | 'bomb' | 'boss' = 'bamboo';
        let icon = '🎋';
        let points = 200;
        let radius = 22;

        if (rand < 0.15) {
          type = 'boss';
          icon = '🥷';
          points = 1000;
          radius = 32;
        } else if (rand < 0.35) {
          type = 'shuriken';
          icon = '💠';
          points = 350;
          radius = 20;
        } else if (rand < 0.55) {
          type = 'scroll';
          icon = '📜';
          points = 400;
          radius = 24;
        } else if (rand < 0.75) {
          type = 'bomb';
          icon = '💣';
          points = 0;
          radius = 22;
        }

        const startX = 60 + Math.random() * 240;
        s.targets.push({
          id: s.targetCounter++,
          x: startX,
          y: 520,
          vx: (180 - startX) * 0.9 + (Math.random() - 0.5) * 80,
          vy: -480 - Math.random() * 120,
          type,
          icon,
          points,
          radius,
          isSliced: false,
        });
      }

      // Move Flying Targets (Gravity)
      for (let i = s.targets.length - 1; i >= 0; i--) {
        const t = s.targets[i];
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.vy += 500 * dt; // Gravity

        if (t.y > 540) {
          s.targets.splice(i, 1);
        }
      }

      // Update Blade Trail
      for (let i = s.bladeTrail.length - 1; i >= 0; i--) {
        const tr = s.bladeTrail[i];
        tr.life -= dt;
        if (tr.life <= 0) s.bladeTrail.splice(i, 1);
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

      // Midnight Moonlight Dojo Background
      const dojoGrad = ctx.createLinearGradient(0, 0, 0, h);
      dojoGrad.addColorStop(0, '#0f172a');
      dojoGrad.addColorStop(0.6, '#1e1b4b');
      dojoGrad.addColorStop(1, '#311042');
      ctx.fillStyle = dojoGrad;
      ctx.fillRect(0, 0, w, h);

      // Moon Circle
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.beginPath();
      ctx.arc(280, 110, 42, 0, Math.PI * 2);
      ctx.fill();

      // Render Flying Targets
      s.targets.forEach((t) => {
        if (!t.isSliced) {
          ctx.save();
          ctx.translate(t.x, t.y);
          if (t.type === 'boss') {
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 20;
          }
          ctx.font = `${t.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(t.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Katana Blade Glowing Trail
      if (s.bladeTrail.length > 1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.bladeTrail[0].x, s.bladeTrail[0].y);
        for (let i = 1; i < s.bladeTrail.length; i++) {
          ctx.lineTo(s.bladeTrail[i].x, s.bladeTrail[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
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
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_ninja_slash',
      gameTitle: '블리츠 닌자 슬래시',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.targetsSliced * 150) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.targetsSliced >= 15,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 카타나 슬라이스' : 'STEP 1: KATANA BLADE SLICING',
      title: isKo ? '화면을 슥 그어 날아오는 표적들을 베어가르세요' : 'Swipe Screen to Slice Flying Ninja Targets',
      description: isKo
        ? '가상 조이스틱 없이 화면에 튀어오르는 대나무(🎋), 수리검(💠), 비급서(📜), 그림자 닌자(🥷)를 손가락으로 슥슥 그어 일도양단하고 폭탄(💣)을 피하세요.'
        : 'Swipe your finger across the screen like a katana blade to slice bamboo, shurikens, and shadow ninjas while dodging bombs.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 슬래시 스와이프)',
            '그림자 닌자(🥷) 베어 가를 시 1,000P 잭팟 대박',
            '폭탄(💣)을 피해 35초간 최대 콤보로 표적을 베고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Katana Slicing',
            'Shadow Ninjas (🥷) award 1,000P massive strike jackpot',
            'Avoid bombs and chain slice combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 슬래시 스와이프 (Blade Swipe)' : 'Blade Swipe Gesture',
      description: isKo
        ? '손가락으로 날아오는 표적들을 관통하듯 시원하게 베어냅니다.'
        : 'Slice cleanly through flying targets with swift finger strokes.',
      keyPoints: isKo
        ? [
            '👆 슬래시 궤적: 실시간 푸른빛 카타나 검기 잔상',
            '⚔️ 연속 베기 성공 시 닌자 슬래시 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Blade Path: Radiant blue katana energy trail',
            '⚔️ Consecutive slices grant escalating combo multipliers',
            '⏱️ 35s time attack ninja slash sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '수련 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '슬라이스 표적 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Sliced targets count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 닌자 슬래시' : 'Blitz Ninja Slash'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '베기' : 'Sliced', value: `${targetsSliced}개`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${ninjaCombo}x`, color: ninjaCombo > 3 ? 'text-amber-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Ninja Slash Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '손가락으로 화면을 슥 그어 날아오는 표적들을 베어가르세요' : 'Swipe screen like a blade to slice targets and avoid bombs'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_ninja_slash"
          gameTitle={isKo ? '블리츠 닌자: 카타나 슬라이스' : 'Blitz Ninja: Katana Slice'}
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
export default VoxelNinjaSlashGame;

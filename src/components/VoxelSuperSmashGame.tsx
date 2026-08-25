import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSuperSmashGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SmashFighter {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'minion' | 'brawler' | 'champion';
  icon: string;
  points: number;
  radius: number;
  damagePct: number;
  isKnockedOut: boolean;
}

export const VoxelSuperSmashGame: React.FC<VoxelSuperSmashGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 55;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [fightersKnockedOut, setFightersKnockedOut] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [smashCombo, setSmashCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_super_smash') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const ringRadius = 150;
  const ringCenterX = 180;
  const ringCenterY = 260;

  const stateRef = useRef({
    fighters: [] as SmashFighter[],
    fightersKnockedOut: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    fighterCounter: 1,
    spawnTimer: 0,
    touchTargetId: null as number | null,
    touchStart: { x: 0, y: 0, time: 0 },
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.fighters = [];
    s.fightersKnockedOut = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.fighterCounter = 1;
    s.spawnTimer = 0;
    s.touchTargetId = null;
    s.particles = [];

    // Initial Opponents in Ring
    s.fighters.push(
      { id: s.fighterCounter++, x: 120, y: 220, vx: 20, vy: 15, type: 'minion', icon: '🥊', points: 300, radius: 24, damagePct: 20, isKnockedOut: false },
      { id: s.fighterCounter++, x: 240, y: 280, vx: -20, vy: -15, type: 'brawler', icon: '🥋', points: 500, radius: 26, damagePct: 40, isKnockedOut: false }
    );

    setFightersKnockedOut(0);
    setScore(0);
    setSmashCombo(0);
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

  // Pure Touch Gestures: Swipe/Flick Fighter to Launch Smash Knockout
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

    // Find touched fighter
    for (const f of s.fighters) {
      if (!f.isKnockedOut && Math.hypot(f.x - tapX, f.y - tapY) < f.radius + 18) {
        s.touchTargetId = f.id;
        s.touchStart = { x: tapX, y: tapY, time: Date.now() };
        break;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.touchTargetId === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    const dx = endX - s.touchStart.x;
    const dy = endY - s.touchStart.y;
    const dt = Math.max(1, Date.now() - s.touchStart.time);

    const targetFighter = s.fighters.find((f) => f.id === s.touchTargetId);
    s.touchTargetId = null;

    if (targetFighter && !targetFighter.isKnockedOut) {
      // Calculate smash power from swipe velocity
      const swipeDist = Math.hypot(dx, dy);
      const speed = Math.max(300, (swipeDist / dt) * 600);
      const angle = Math.atan2(dy || -1, dx || (Math.random() - 0.5));

      targetFighter.damagePct += 45;
      const knockbackPower = speed * (1 + targetFighter.damagePct / 80);

      targetFighter.vx = Math.cos(angle) * knockbackPower;
      targetFighter.vy = Math.sin(angle) * knockbackPower;

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

      // Smash hit sparks
      for (let p = 0; p < 12; p++) {
        s.particles.push({
          x: targetFighter.x,
          y: targetFighter.y,
          vx: (Math.random() - 0.5) * 260,
          vy: (Math.random() - 0.5) * 260,
          color: '#fde047',
          life: 0.4,
        });
      }
    }
  };

  // Main 60FPS Super Smash Loop
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

      // Spawn Opponents
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.2 && s.fighters.length < 5) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isChampion = rand < 0.2;
        const isBrawler = rand >= 0.2 && rand < 0.6;

        s.fighters.push({
          id: s.fighterCounter++,
          x: ringCenterX + (Math.random() - 0.5) * 120,
          y: ringCenterY + (Math.random() - 0.5) * 120,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          type: isChampion ? 'champion' : (isBrawler ? 'brawler' : 'minion'),
          icon: isChampion ? '👑' : (isBrawler ? '🥋' : '🥊'),
          points: isChampion ? 1000 : (isBrawler ? 500 : 300),
          radius: isChampion ? 28 : (isBrawler ? 26 : 24),
          damagePct: isChampion ? 60 : (isBrawler ? 30 : 10),
          isKnockedOut: false,
        });
      }

      // Update Fighters Physics
      for (let i = s.fighters.length - 1; i >= 0; i--) {
        const f = s.fighters[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        // Friction
        f.vx *= Math.max(0, 1 - dt * 1.5);
        f.vy *= Math.max(0, 1 - dt * 1.5);

        // Check Ring Boundary Knockout
        const distFromCenter = Math.hypot(f.x - ringCenterX, f.y - ringCenterY);
        if (distFromCenter > ringRadius + 20 && !f.isKnockedOut) {
          f.isKnockedOut = true;
          s.fightersKnockedOut += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = f.points + s.combo * 50;
          s.score += pts;

          setFightersKnockedOut(s.fightersKnockedOut);
          setScore(s.score);
          setSmashCombo(s.combo);
          setMaxCombo(s.maxCombo);

          setFeedbackText(`🔥 RING OUT KNOCKOUT! +${pts}P 💥`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);

          // Knockout Star Blast
          for (let p = 0; p < 18; p++) {
            s.particles.push({
              x: f.x,
              y: f.y,
              vx: (Math.random() - 0.5) * 320,
              vy: (Math.random() - 0.5) * 320,
              color: '#ef4444',
              life: 0.5,
            });
          }

          s.fighters.splice(i, 1);
        }
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

      // Arena Stadium Dark Gradient
      const arenaGrad = ctx.createLinearGradient(0, 0, 0, h);
      arenaGrad.addColorStop(0, '#0f172a');
      arenaGrad.addColorStop(0.5, '#1e1b4b');
      arenaGrad.addColorStop(1, '#020617');
      ctx.fillStyle = arenaGrad;
      ctx.fillRect(0, 0, w, h);

      // Super Smash Octagon Battle Ring
      ctx.save();
      ctx.translate(ringCenterX, ringCenterY);

      // Ring Floor
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.fill();

      // Ring Neon Edge (Danger Zone)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
      ctx.stroke();

      // Center Smash Logo Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Render Opponent Fighters
      s.fighters.forEach((f) => {
        if (!f.isKnockedOut) {
          ctx.save();
          ctx.translate(f.x, f.y);
          if (f.type === 'champion') {
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 18;
          } else {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 12;
          }

          ctx.font = `${f.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(f.icon, 0, 0);

          // Damage Percentage Tag
          ctx.fillStyle = f.damagePct > 80 ? '#ef4444' : '#fde047';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`${f.damagePct}%`, 0, f.radius + 12);
          ctx.restore();
        }
      });

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [ringCenterX, ringCenterY, ringRadius, playSfx]);

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
      gameId: 'arcade_super_smash',
      gameTitle: '블리츠 슈퍼 스매시',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.fightersKnockedOut * 350) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.fightersKnockedOut >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 스와이프 장외 넉아웃' : 'STEP 1: SWIPE SMASH KNOCKOUT',
      title: isKo ? '파이터를 손가락으로 쓸어 넘겨 링 밖으로 날려버리세요' : 'Flick opponent fighters out of the battle ring to score ring-out KOs',
      description: isKo
        ? '가상 조이스틱 없이 링 위의 라이벌 파이터(🥊, 🥋, 👑)를 손가락으로 잡고 원하는 방향으로 힘껏 쓸어 넘겨(Swipe Flick) 장외 홈런 넉아웃을 터뜨리세요.'
        : 'Swipe and flick fighters toward the perimeter to launch them out of the ring.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 스와이프 플릭)',
            '챔피언(👑) 장외 넉아웃 시 1,000P 잭팟 대박 보너스',
            '35초간 최대 콤보로 링 위를 제패하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Swipe & Flick Smash',
            'Champion Fighters (👑) award 1,000P massive KO jackpot',
            'Achieve continuous KO streaks within 35s battle sprint'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 스와이프 플릭 (Direct Swipe Flick)' : 'Direct Swipe Flick Gesture',
      description: isKo
        ? '적을 터치한 뒤 빠르게 튕겨 날려보냅니다.'
        : 'Touch an opponent and flick quickly in any direction.',
      keyPoints: isKo
        ? [
            '👆 스와이프 플릭: 스와이프 속도 비례 초강력 넉백',
            '💥 대미지%가 높을수록 더 멀리 날아감',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Swipe Flick: Knockback scales with swipe velocity',
            '💥 Higher damage percentage increases fly distance',
            '⏱️ 35s time attack super smash sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '대난투 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '넉아웃시킨 파이터 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Knocked out fighters count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 슈퍼 스매시' : 'Blitz Super Smash'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '넉아웃' : 'KOs', value: `${fightersKnockedOut}명`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${smashCombo}x`, color: smashCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Super Smash Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
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
          {isKo ? '파이터를 손가락으로 잡고 링 밖으로 빠르게 쓸어 넘기세요' : 'Touch fighter and swipe quickly toward the ring edge to knock out'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_super_smash"
          gameTitle={isKo ? '블리츠 스매시: 대난투 배틀' : 'Blitz Smash: Brawler Arena'}
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
export default VoxelSuperSmashGame;

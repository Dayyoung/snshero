import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMedievalSiegeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface CastleTarget {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  type: 'gate' | 'tower' | 'wall' | 'king';
  icon: string;
  points: number;
  isDestroyed: boolean;
}

interface BoulderProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alive: boolean;
}

export const VoxelMedievalSiegeGame: React.FC<VoxelMedievalSiegeGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 40;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [targetsDestroyed, setTargetsDestroyed] = useState<number>(0);
  const [shotsFired, setShotsFired] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [siegeCombo, setSiegeCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_siege_sling') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    slingshotOrigin: { x: 70, y: 380 },
    dragPos: { x: 70, y: 380 },
    isDragging: false,
    boulders: [] as BoulderProjectile[],
    targets: [] as CastleTarget[],
    targetsDestroyed: 0,
    shotsFired: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const setupFortress = () => {
    const s = stateRef.current;
    s.targets = [
      // Left Guard Tower
      { id: 1, x: 230, y: 340, width: 35, height: 70, hp: 50, maxHp: 50, type: 'tower', icon: '🗼', points: 300, isDestroyed: false },
      // Main Fortress Gate
      { id: 2, x: 275, y: 355, width: 45, height: 55, hp: 70, maxHp: 70, type: 'gate', icon: '🚪', points: 400, isDestroyed: false },
      // Right Guard Tower
      { id: 3, x: 330, y: 340, width: 35, height: 70, hp: 50, maxHp: 50, type: 'tower', icon: '🗼', points: 300, isDestroyed: false },
      // Upper Bastion Wall
      { id: 4, x: 250, y: 275, width: 60, height: 40, hp: 60, maxHp: 60, type: 'wall', icon: '🧱', points: 350, isDestroyed: false },
      // King's Keep Flag at Peak
      { id: 5, x: 280, y: 215, width: 40, height: 45, hp: 80, maxHp: 80, type: 'king', icon: '👑', points: 800, isDestroyed: false },
    ];
  };

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.slingshotOrigin = { x: 70, y: 380 };
    s.dragPos = { x: 70, y: 380 };
    s.isDragging = false;
    s.boulders = [];
    s.targetsDestroyed = 0;
    s.shotsFired = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.particles = [];

    setupFortress();

    setTargetsDestroyed(0);
    setShotsFired(0);
    setScore(0);
    setSiegeCombo(0);
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

  // Touch Handlers: Direct Slingshot Drag & Release (Zero Joysticks)
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

    if (Math.hypot(tapX - s.slingshotOrigin.x, tapY - s.slingshotOrigin.y) < 55) {
      s.isDragging = true;
      s.dragPos = { x: tapX, y: tapY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;

    // Limit sling drag range to 70px
    const dx = curX - s.slingshotOrigin.x;
    const dy = curY - s.slingshotOrigin.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 70;

    if (dist > maxDist) {
      s.dragPos = {
        x: s.slingshotOrigin.x + (dx / dist) * maxDist,
        y: s.slingshotOrigin.y + (dy / dist) * maxDist,
      };
    } else {
      s.dragPos = { x: curX, y: curY };
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused) return;
    s.isDragging = false;

    // Launch Boulder in opposite direction of pull
    const dx = s.slingshotOrigin.x - s.dragPos.x;
    const dy = s.slingshotOrigin.y - s.dragPos.y;
    const power = Math.hypot(dx, dy);

    if (power > 15) {
      s.shotsFired += 1;
      setShotsFired(s.shotsFired);

      const launchSpeed = power * 12;
      const angle = Math.atan2(dy, dx);

      s.boulders.push({
        id: Date.now() + Math.random(),
        x: s.slingshotOrigin.x,
        y: s.slingshotOrigin.y,
        vx: Math.cos(angle) * launchSpeed,
        vy: Math.sin(angle) * launchSpeed,
        radius: 10,
        alive: true,
      });

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    s.dragPos = { ...s.slingshotOrigin };
  };

  // Main 60FPS Slingshot & Physics Destruction Loop
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

      const gravity = 550;

      // Update Boulders Physics
      for (let bIdx = s.boulders.length - 1; bIdx >= 0; bIdx--) {
        const b = s.boulders[bIdx];
        b.vy += gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Spawn Flame Trail
        s.particles.push({
          x: b.x,
          y: b.y,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          color: '#f97316',
          life: 0.25,
        });

        // Check Target Collisions
        s.targets.forEach((tgt) => {
          if (!tgt.isDestroyed) {
            if (
              b.x > tgt.x - tgt.width / 2 &&
              b.x < tgt.x + tgt.width / 2 &&
              b.y > tgt.y - tgt.height / 2 &&
              b.y < tgt.y + tgt.height / 2
            ) {
              b.alive = false;
              tgt.hp -= 40;

              // Explosion Particles
              for (let p = 0; p < 12; p++) {
                s.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 250,
                  vy: (Math.random() - 0.5) * 250,
                  color: '#ef4444',
                  life: 0.6,
                });
              }

              if (tgt.hp <= 0) {
                tgt.isDestroyed = true;
                s.targetsDestroyed += 1;
                s.combo += 1;
                if (s.combo > s.maxCombo) s.maxCombo = s.combo;

                const pts = tgt.points + s.combo * 50;
                s.score += pts;

                setScore(s.score);
                setTargetsDestroyed(s.targetsDestroyed);
                setSiegeCombo(s.combo);
                setMaxCombo(s.maxCombo);

                setFeedbackText(`FORTRESS SMASHED! +${pts}P 💥`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                setTimeout(() => setFeedbackText(null), 350);

                // All Targets Destroyed -> Next Fortress Wave!
                if (s.targets.every((t) => t.isDestroyed)) {
                  s.score += 1500;
                  setScore(s.score);
                  setFeedbackText(`👑 SIEGE VICTORY! +1500P 👑`);
                  setTimeout(() => {
                    setupFortress();
                  }, 600);
                }
              } else {
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }
            }
          }
        });

        // Out of Bounds
        if (b.y > 440 || b.x > 380 || !b.alive) {
          s.boulders.splice(bIdx, 1);
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

      // Medieval Battlefield Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.6, '#312e81');
      skyGrad.addColorStop(1, '#431407');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Battlefield Ground
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 420, w, 80);

      // Slingshot Base Structure
      ctx.fillStyle = '#78350f';
      ctx.fillRect(s.slingshotOrigin.x - 6, s.slingshotOrigin.y, 12, 40);

      // Slingshot Rubber Band
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(s.slingshotOrigin.x - 12, s.slingshotOrigin.y - 10);
      ctx.lineTo(s.dragPos.x, s.dragPos.y);
      ctx.lineTo(s.slingshotOrigin.x + 12, s.slingshotOrigin.y - 10);
      ctx.stroke();

      // Slingshot Boulder (in hand or catapult)
      ctx.save();
      ctx.translate(s.dragPos.x, s.dragPos.y);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Trajectory Dot Prediction when Dragging
      if (s.isDragging) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
        const dx = s.slingshotOrigin.x - s.dragPos.x;
        const dy = s.slingshotOrigin.y - s.dragPos.y;
        const power = Math.hypot(dx, dy);
        const launchSpeed = power * 12;
        const angle = Math.atan2(dy, dx);
        let simX = s.slingshotOrigin.x;
        let simY = s.slingshotOrigin.y;
        let simVx = Math.cos(angle) * launchSpeed;
        let simVy = Math.sin(angle) * launchSpeed;

        for (let step = 0; step < 12; step++) {
          simVy += gravity * 0.04;
          simX += simVx * 0.04;
          simY += simVy * 0.04;
          ctx.beginPath();
          ctx.arc(simX, simY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Flying Boulders
      s.boulders.forEach((b) => {
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Render Fortress Targets
      s.targets.forEach((tgt) => {
        if (!tgt.isDestroyed) {
          ctx.save();
          ctx.translate(tgt.x, tgt.y);
          ctx.font = `${tgt.height * 0.75}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tgt.icon, 0, 0);

          // Mini HP Bar
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-tgt.width / 2, tgt.height / 2 + 2, tgt.width, 4);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(-tgt.width / 2, tgt.height / 2 + 2, tgt.width * (tgt.hp / tgt.maxHp), 4);
          ctx.restore();
        }
      });

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
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
      gameId: 'arcade_siege_sling',
      gameTitle: '블리츠 시즈 슬링',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.targetsDestroyed * 200) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.targetsDestroyed >= 5,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 슬링샷 조준 & 요새 파괴' : 'STEP 1: SLINGSHOT AIM & FORTRESS DESTRUCTION',
      title: isKo ? '바위를 뒤로 당겨 성벽과 타워를 일격에 파괴하세요' : 'Pull Back the Boulder to Shatter Walls & Towers',
      description: isKo
        ? '가상 조이스틱 없이 투석기 화염 바위(🪨🔥)를 손가락으로 뒤로 당겨 궤적을 조준하고 손을 떼어 발사하여 적 요새의 수비탑(🗼), 성문(🚪), 왕실 깃발(👑)을 차례로 무너뜨리세요.'
        : 'Drag the flaming boulder backwards to aim your slingshot trajectory, then release to demolish enemy towers, gates and keeps.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 뒤로 당기기 슬링샷 발사)',
            '점선 포물선 궤적 가이드로 정밀한 타격 조준',
            '35초간 요새의 전 시설을 파괴하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Pull-Back Slingshot Release',
            'Predictive dotted trajectory guide for pin-point accuracy',
            'Shatter all defensive structures within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '뒤로 당겨 손 떼기 (Drag & Release)' : 'Pull Back & Release',
      description: isKo
        ? '바위를 뒤로 당겼다가 목표물을 향해 튕겨냅니다.'
        : 'Drag backwards to build sling tension and release to fire.',
      keyPoints: isKo
        ? [
            '🏹 뒤로 드래그: 탄도 파워 및 궤적 실시간 조준',
            '💥 손 떼기(Release): 고속 화염 바위 발사 및 폭파',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '🏹 Drag Back: Adjust launch velocity and trajectory arc',
            '💥 Release: Fire flaming boulder to trigger chain collapse',
            '⏱️ 35s time attack siege sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '공성 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '파괴한 요새 부속물 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Destroyed targets and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e1b4b] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 시즈 슬링' : 'Blitz Siege Sling'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '파괴' : 'Demolished', value: `${targetsDestroyed}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '발사' : 'Shots', value: `${shotsFired}발`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Siege Slingshot Canvas Viewport */}
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
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '바위를 뒤로 당겨 궤적을 조준하고 손을 떼어 요새를 파괴하세요' : 'Pull back on the boulder and release to shatter the fortress'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_siege_sling"
          gameTitle={isKo ? '블리츠 시즈: 공성 슬링샷' : 'Blitz Siege: Fortress Sling'}
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
export default VoxelMedievalSiegeGame;

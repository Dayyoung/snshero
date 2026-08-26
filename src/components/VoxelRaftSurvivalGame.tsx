import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelRaftSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface FloatingDebris {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'wood' | 'chest' | 'coconut' | 'shark';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  hp: number;
  collected: boolean;
}

interface ThrownHook {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 'flying' | 'retracting';
  hookedItem: FloatingDebris | null;
}

export const VoxelRaftSurvivalGame: React.FC<VoxelRaftSurvivalGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 47;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [resourcesSalvaged, setResourcesSalvaged] = useState<number>(0);
  const [raftLevel, setRaftLevel] = useState<number>(1);
  const maxRaftLevel = 5;
  const [score, setScore] = useState<number>(0);
  const [salvageCombo, setSalvageCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_raft_survival') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const raftOriginX = 180;
  const raftOriginY = 440;

  const stateRef = useRef({
    debris: [] as FloatingDebris[],
    hook: null as ThrownHook | null,
    isAiming: false,
    dragPos: { x: raftOriginX, y: raftOriginY },
    resourcesSalvaged: 0,
    raftLevel: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    debrisCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.debris = [];
    s.hook = null;
    s.isAiming = false;
    s.dragPos = { x: raftOriginX, y: raftOriginY };
    s.resourcesSalvaged = 0;
    s.raftLevel = 1;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.debrisCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial Debris on Ocean
    s.debris.push(
      { id: s.debrisCounter++, x: 80, y: 140, vx: 40, type: 'wood', cardId: 34, icon: '🪵', points: 250, radius: 22, hp: 1, collected: false },
      { id: s.debrisCounter++, x: 270, y: 190, vx: -50, type: 'chest', cardId: 100, icon: '📦', points: 600, radius: 24, hp: 1, collected: false }
    );

    setResourcesSalvaged(0);
    setRaftLevel(1);
    setScore(0);
    setSalvageCombo(0);
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

  // Drag Back & Release Hook (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.hook !== null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    // Check direct shark tap to repel
    const sharkTarget = s.debris.find(d => d.type === 'shark' && Math.hypot(d.x - touchX, d.y - touchY) < d.radius + 15);
    if (sharkTarget) {
      sharkTarget.hp -= 1;
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

      if (sharkTarget.hp <= 0) {
        sharkTarget.collected = true;
        s.score += 600;
        setScore(s.score);
        setFeedbackText(isKo ? '상어 퇴치 완료! 🦈💥 +600P' : 'SHARK REPELLED! 🦈💥 +600P');
        setTimeout(() => setFeedbackText(null), 400);
      }
      return;
    }

    if (Math.hypot(touchX - raftOriginX, touchY - raftOriginY) < 70) {
      s.isAiming = true;
      s.dragPos = { x: touchX, y: touchY };
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isAiming || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.dragPos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isAiming || s.isGameOver || s.isPaused) return;
    s.isAiming = false;

    const dx = raftOriginX - s.dragPos.x;
    const dy = raftOriginY - s.dragPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 25 && !s.hook) {
      const speed = Math.min(680, dist * 7);
      const angle = Math.atan2(dy, dx);

      s.hook = {
        x: raftOriginX,
        y: raftOriginY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        state: 'flying',
        hookedItem: null,
      };

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }

    s.dragPos = { x: raftOriginX, y: raftOriginY };
  };

  // Main 60FPS Raft Loop
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

      // Spawn Floating Ocean Debris
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.1 && s.debris.length < 6) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isShark = rand < 0.18;
        const isChest = rand < 0.45;
        const isCoconut = rand < 0.7;
        const cardId = isShark ? 48 : (isChest ? 100 : (isCoconut ? 17 : 34));

        s.debris.push({
          id: s.debrisCounter++,
          x: Math.random() < 0.5 ? 30 : 330,
          y: 90 + Math.random() * 200,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isShark ? 70 : (isChest ? 40 : 55)),
          type: isShark ? 'shark' : (isChest ? 'chest' : (isCoconut ? 'coconut' : 'wood')),
          cardId,
          icon: isShark ? '🦈' : (isChest ? '📦' : (isCoconut ? '🥥' : '🪵')),
          points: isShark ? 0 : (isChest ? 600 : (isCoconut ? 350 : 250)),
          radius: isShark ? 28 : (isChest ? 24 : 22),
          hp: isShark ? 2 : 1,
          collected: false,
        });
      }

      // Move Debris (Floating Ocean Current)
      s.debris.forEach((d) => {
        d.x += d.vx * dt;
        if (d.x > 330) {
          d.x = 330;
          d.vx = -Math.abs(d.vx);
        } else if (d.x < 30) {
          d.x = 30;
          d.vx = Math.abs(d.vx);
        }
      });

      // Update Flying / Retracting Hook
      if (s.hook) {
        const hk = s.hook;
        if (hk.state === 'flying') {
          hk.x += hk.vx * dt;
          hk.y += hk.vy * dt;

          // Check Collision with Debris
          for (let i = s.debris.length - 1; i >= 0; i--) {
            const d = s.debris[i];
            if (!d.collected && d.type !== 'shark' && Math.hypot(d.x - hk.x, d.y - hk.y) < d.radius + 14) {
              d.collected = true;
              hk.hookedItem = d;
              hk.state = 'retracting';
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              break;
            }
          }

          if (hk.y < 50 || hk.x < 20 || hk.x > 340) {
            hk.state = 'retracting';
          }
        } else {
          // Retract towards Raft Origin
          const angle = Math.atan2(raftOriginY - hk.y, raftOriginX - hk.x);
          const retractSpeed = 550;
          hk.x += Math.cos(angle) * retractSpeed * dt;
          hk.y += Math.sin(angle) * retractSpeed * dt;

          if (hk.hookedItem) {
            hk.hookedItem.x = hk.x;
            hk.hookedItem.y = hk.y;
          }

          if (Math.hypot(raftOriginX - hk.x, raftOriginY - hk.y) < 25) {
            // Hook Retracted to Raft!
            if (hk.hookedItem) {
              s.resourcesSalvaged += 1;
              s.combo += 1;
              if (s.combo > s.maxCombo) s.maxCombo = s.combo;

              const pts = hk.hookedItem.points + s.combo * 40;
              s.score += pts;

              // Expand Raft level every 3 items
              if (s.resourcesSalvaged % 3 === 0 && s.raftLevel < maxRaftLevel) {
                s.raftLevel += 1;
                setRaftLevel(s.raftLevel);
                s.score += 1000;
                setFeedbackText(`🎉 RAFT EXPANDED TO LV.${s.raftLevel}! +1000P 🎉`);
              } else {
                setFeedbackText(`SALVAGED! ${hk.hookedItem.icon} +${pts}P ✨`);
              }

              setResourcesSalvaged(s.resourcesSalvaged);
              setScore(s.score);
              setSalvageCombo(s.combo);
              setMaxCombo(s.maxCombo);

              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              setTimeout(() => setFeedbackText(null), 400);

              // Remove hooked item from debris list
              s.debris = s.debris.filter((item) => item.id !== hk.hookedItem!.id);
            }
            s.hook = null;
          }
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

      // Tropical Blue Ocean Background
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#0284c7');
      oceanGrad.addColorStop(0.6, '#0369a1');
      oceanGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // Trajectory Preview Line
      if (s.isAiming) {
        const aimDx = raftOriginX - s.dragPos.x;
        const aimDy = raftOriginY - s.dragPos.y;

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(raftOriginX, raftOriginY);
        ctx.lineTo(raftOriginX + aimDx * 2.5, raftOriginY + aimDy * 2.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Hook Rope Line
      if (s.hook) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(raftOriginX, raftOriginY);
        ctx.lineTo(s.hook.x, s.hook.y);
        ctx.stroke();

        // Hook Head
        ctx.save();
        ctx.translate(s.hook.x, s.hook.y);
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪝', 0, 0);
        ctx.restore();
      }

      // Render Floating Ocean Debris (Card Sprites)
      s.debris.forEach((d) => {
        ctx.save();
        ctx.translate(d.x, d.y);

        drawCardSprite(
          ctx,
          d.cardId,
          -d.radius,
          -d.radius,
          d.radius * 2,
          d.radius * 2,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: d.type === 'chest' ? '#fde047' : (d.type === 'shark' ? '#ef4444' : (d.type === 'coconut' ? '#22c55e' : '#ca8a04')),
            shadowBlur: d.type === 'chest' ? 16 : 6,
            shadowColor: d.type === 'chest' ? 'rgba(253, 224, 71, 0.9)' : (d.type === 'shark' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(202, 138, 4, 0.6)'),
          }
        );

        ctx.restore();
      });

      // Render Raft Fortress at Bottom (Expands with Level)
      ctx.save();
      ctx.translate(raftOriginX, raftOriginY);
      const raftWidth = 80 + (s.raftLevel - 1) * 20;
      const raftHeight = 35 + (s.raftLevel - 1) * 6;
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-raftWidth / 2, -raftHeight / 2, raftWidth, raftHeight);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.strokeRect(-raftWidth / 2, -raftHeight / 2, raftWidth, raftHeight);

      // Raft Sailor / Hook Base (Player Hero Badge)
      drawCardSprite(
        ctx,
        playerHeroId,
        -20,
        -25,
        40,
        40,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#fde047',
          shadowBlur: 14,
          shadowColor: 'rgba(253, 224, 71, 0.9)',
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
      gameId: 'arcade_raft_survival',
      gameTitle: '블리츠 뗏목 서바이벌',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.resourcesSalvaged * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.resourcesSalvaged >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 슬링 갈고리 낚시' : 'STEP 1: DRAG & RELEASE HOOK SALVAGE',
      title: isKo ? '뗏목에서 갈고리를 당겨 바다의 자원을 낚아채세요' : 'Drag hook back to aim and release to hook ocean debris',
      description: isKo
        ? '가상 조이스틱 없이 하단의 뗏목에서 갈고리(🪝)를 손가락으로 뒤로 당겨 궤적을 조준하고 손을 떼어 발사하여 목재(🪵), 보물상자(📦), 야자수(🥥)를 낚아채고 상어(🦈)를 탭해 퇴치하세요.'
        : 'Drag the grappling hook back to aim trajectory and release to salvage ocean resources while tapping sharks to repel them.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 슬링샷 갈고리 투척)',
            '황금 보물상자(📦) 인양 시 600P 잭팟 대박 보너스',
            '35초간 최대 콤보로 뗏목을 Lv.5까지 확장하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Drag Back Hook Launch',
            'Treasure Chests (📦) award 600P salvage jackpot',
            'Expand your raft fortress to Lv.5 within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 당기기 & 상어 연타 (Drag & Release, Tap Shark)' : 'Drag & Release Hook, Tap Shark',
      description: isKo
        ? '갈고리를 당겨 쏘고, 접근하는 상어는 직접 탭하여 쫓아냅니다.'
        : 'Pull hook to fire, tap roaming sharks directly to repel.',
      keyPoints: isKo
        ? [
            '👆 당기기 & 놓기: 뗏목 갈고리 투척 및 자동 인양',
            '🦈 상어 직접 탭: 뗏목을 보호하는 쾌속 퇴치',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Drag & Release: Grappling hook throw and auto retrieve',
            '🦈 Tap Shark: Swift defense to protect the raft',
            '⏱️ 35s time attack ocean raft survival sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '생존 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '인양한 자원 수 및 뗏목 레벨 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Salvaged resources and raft level multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0c4a6e] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 뗏목 서바이벌' : 'Blitz Raft Survival'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '인양' : 'Salvaged', value: `${resourcesSalvaged}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '뗏목' : 'Raft', value: `Lv.${raftLevel}`, color: 'text-emerald-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Raft Survival Canvas Viewport */}
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '갈고리를 뒤로 당겨 자원을 낚고, 상어(🦈)는 직접 탭해 퇴치하세요' : 'Drag hook back to salvage debris, tap sharks to repel'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_raft_survival"
          gameTitle={isKo ? '블리츠 뗏목: 해양 서바이벌' : 'Blitz Raft: Ocean Survival'}
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
export default VoxelRaftSurvivalGame;

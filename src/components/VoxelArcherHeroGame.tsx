import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelArcherHeroGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SlingshotArrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  power: number;
}

interface TargetMonster {
  id: number;
  x: number;
  y: number;
  vx: number;
  hp: number;
  maxHp: number;
  cardId: number;
  points: number;
  radius: number;
}

export const VoxelArcherHeroGame: React.FC<VoxelArcherHeroGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 63;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [arrowsLeft, setArrowsLeft] = useState<number>(15);
  const [wave, setWave] = useState<number>(1);
  const [kills, setKills] = useState<number>(0);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_slingshot_archer') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    bowPos: { x: 180, y: 440 },
    dragPos: null as { x: number; y: number } | null,
    isDragging: false,
    arrows: [] as SlingshotArrow[],
    monsters: [] as TargetMonster[],
    score: 0,
    arrowsLeft: 15,
    wave: 1,
    kills: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    monsterCounter: 1,
    spawnTimer: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.bowPos = { x: 180, y: 440 };
    s.dragPos = null;
    s.isDragging = false;
    s.arrows = [];
    s.monsters = [];
    s.score = 0;
    s.arrowsLeft = 15;
    s.wave = 1;
    s.kills = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.monsterCounter = 1;
    s.spawnTimer = 0;

    setScore(0);
    setArrowsLeft(15);
    setWave(1);
    setKills(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Touch / Pointer Handlers: Pure Slingshot Drag & Release (Zero Joystick)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.arrowsLeft <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    // Start dragging if near bottom bow area
    if (touchY > 300) {
      s.isDragging = true;
      s.dragPos = { x: touchX, y: touchY };
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
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

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    // Limit drag distance
    const dx = touchX - s.bowPos.x;
    const dy = touchY - s.bowPos.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 80;

    if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      s.dragPos = {
        x: s.bowPos.x + Math.cos(angle) * maxDist,
        y: s.bowPos.y + Math.sin(angle) * maxDist,
      };
    } else {
      s.dragPos = { x: touchX, y: touchY };
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused || !s.dragPos) {
      s.isDragging = false;
      s.dragPos = null;
      return;
    }

    // Calculate launch velocity (opposite direction of drag)
    const dx = s.bowPos.x - s.dragPos.x;
    const dy = s.bowPos.y - s.dragPos.y;
    const power = Math.hypot(dx, dy);

    if (power > 15) {
      const speed = power * 0.16;
      const angle = Math.atan2(dy, dx);

      s.arrows.push({
        x: s.bowPos.x,
        y: s.bowPos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        active: true,
        power: Math.floor(power * 2),
      });

      s.arrowsLeft -= 1;
      setArrowsLeft(s.arrowsLeft);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }

    s.isDragging = false;
    s.dragPos = null;
  };

  // Main Game Physics Loop
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

      // Spawn Monsters
      s.spawnTimer += dt;
      if (s.spawnTimer >= 1.2 && s.monsters.length < 6) {
        s.spawnTimer = 0;
        const monsterPool = [6, 8, 12, 18, 24, 30, 45, 52, 68, 99];
        const randomCardId = monsterPool[Math.floor(Math.random() * monsterPool.length)];
        const isDragon = Math.random() < 0.25;
        const isOrc = Math.random() < 0.4;

        s.monsters.push({
          id: s.monsterCounter++,
          x: Math.random() < 0.5 ? -20 : 380,
          y: 60 + Math.random() * 180,
          vx: (Math.random() < 0.5 ? 1 : -1) * (30 + Math.random() * 35),
          hp: isDragon ? 3 : isOrc ? 2 : 1,
          maxHp: isDragon ? 3 : isOrc ? 2 : 1,
          cardId: isDragon ? 62 : randomCardId,
          points: isDragon ? 500 : isOrc ? 250 : 100,
          radius: isDragon ? 24 : isOrc ? 20 : 16,
          icon: isDragon ? '🐲' : isOrc ? '👹' : '👺',
        });
      }

      // Update Monsters
      for (let i = s.monsters.length - 1; i >= 0; i--) {
        const m = s.monsters[i];
        m.x += m.vx * dt;

        // Bounce horizontally
        if (m.x < 20 || m.x > 340) {
          m.vx *= -1;
        }
      }

      // Update Arrows
      for (let i = s.arrows.length - 1; i >= 0; i--) {
        const a = s.arrows[i];
        if (!a.active) continue;

        a.x += a.vx * dt * 60;
        a.y += a.vy * dt * 60;
        a.vy += 0.15; // Gravity

        // Check arrow collision with monsters
        for (let j = s.monsters.length - 1; j >= 0; j--) {
          const m = s.monsters[j];
          const dist = Math.hypot(a.x - m.x, a.y - m.y);

          if (dist < m.radius + 8) {
            a.active = false;
            m.hp -= 1;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (m.hp <= 0) {
              s.monsters.splice(j, 1);
              s.score += m.points;
              s.kills += 1;
              setScore(s.score);
              setKills(s.kills);
            }
            break;
          }
        }

        // Out of bounds
        if (a.x < -20 || a.x > 380 || a.y < -20 || a.y > 500) {
          a.active = false;
        }
      }

      // Check Game Over (Out of arrows and no flying arrows)
      const hasFlyingArrows = s.arrows.some((a) => a.active);
      if (s.arrowsLeft <= 0 && !hasFlyingArrows && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'arcade_slingshot_archer',
          gameTitle: '아케인 슬링샷 궁수',
          durationSeconds: duration,
          score: s.score + s.kills * 100,
          difficulty: 'NIGHTMARE',
          isVictory: s.kills >= 6,
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
        return;
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Arcane Forest Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a1912');
      bgGrad.addColorStop(1, '#050c09');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Target Monsters (Card Monster Sprites)
      s.monsters.forEach((m) => {
        drawCardSprite(
          ctx,
          m.cardId,
          m.x - m.radius,
          m.y - m.radius,
          m.radius * 2,
          m.radius * 2,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#ef4444',
            shadowBlur: 8,
            shadowColor: 'rgba(239, 68, 68, 0.6)',
          }
        );

        // HP bar
        if (m.maxHp > 1) {
          const barW = m.radius * 1.8;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(m.x - barW / 2, m.y - m.radius - 8, barW, 4);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(m.x - barW / 2, m.y - m.radius - 8, (barW * m.hp) / m.maxHp, 4);
        }
      });

      // Flying Arrows
      s.arrows.forEach((a) => {
        if (!a.active) return;
        const angle = Math.atan2(a.vy, a.vx);
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(angle);

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(6, -4);
        ctx.lineTo(6, 4);
        ctx.fill();

        ctx.restore();
      });

      // Slingshot Bow Base & Player Hero Badge
      const bx = s.bowPos.x;
      const by = s.bowPos.y;

      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(bx, by, 32, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();

      // Slingshot Hero Avatar
      drawCardSprite(
        ctx,
        playerHeroId,
        bx - 18,
        by - 18,
        36,
        36,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#fde047',
          shadowBlur: 10,
          shadowColor: 'rgba(253, 224, 71, 0.6)',
        }
      );

      // Slingshot String & Drag Pulling Indicator
      if (s.isDragging && s.dragPos) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - 26, by - 10);
        ctx.lineTo(s.dragPos.x, s.dragPos.y);
        ctx.lineTo(bx + 26, by - 10);
        ctx.stroke();

        // Arrow on pulled string
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(s.dragPos.x, s.dragPos.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Trajectory Prediction Line
        const dx = bx - s.dragPos.x;
        const dy = by - s.dragPos.y;
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + dx * 2.5, by + dy * 2.5);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Idle string
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - 26, by - 10);
        ctx.lineTo(bx + 26, by - 10);
        ctx.stroke();
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [onReward, playSfx]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 슬링샷 조준 사격' : 'STEP 1: SLINGSHOT AIM & SHOOT',
      title: isKo ? '활시위를 당겨 몬스터를 격추하세요' : 'Pull String & Shoot Flying Monsters',
      description: isKo
        ? '가상 조이스틱 없이 화면 하단 활시위를 손가락으로 당겨 각도와 파워를 조준하고 손을 떼어 사격하세요.'
        : 'Drag the slingshot string to aim angle and release your touch to fire arrows.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 슬링샷 조준)',
            '드래그 거리 비례 파워 증폭 및 궤적 표시',
            '드래곤/오크 명중 시 대량 잭팟 점수'
          ]
        : [
            'Zero Virtual Joystick: 100% Touch Slingshot',
            'Pull distance increases arrow speed & trajectory',
            'Hit flying dragons & orcs for massive points'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 & 릴리즈 (Hold & Release)' : 'Drag & Release Shooting',
      description: isKo
        ? '활시위를 터치하여 아래로 당긴 뒤, 손가락을 떼면 즉시 화살이 발사됩니다.'
        : 'Touch the string, pull backwards, and release your finger to shoot.',
      keyPoints: isKo
        ? [
            '👆 터치 & 드래그: 활시위 당기기 및 궤적 조준',
            '🎯 손 떼기(Release): 즉시 시원한 화살 발사',
            '🏹 잔여 화살 15발 효율적 운용'
          ]
        : [
            '👆 Touch & Drag: Pull string to aim trajectory',
            '🎯 Release Finger: Instant powerful arrow launch',
            '🏹 Manage your 15 arrow stock wisely'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '사격 완수 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon archery finish.',
      keyPoints: isKo
        ? [
            '완주 즉시 LocalStorage 영구 지갑 입금',
            '격추 몬스터 수 및 잔여 화살 비례 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Monster kills and accuracy multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#050c09] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '아케인 슬링샷 궁수' : 'Arcane Slingshot Archer'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '화살' : 'Arrows', value: `${arrowsLeft}/15`, color: arrowsLeft <= 3 ? 'text-rose-500 font-bold animate-pulse' : 'text-amber-400 font-bold' },
          { label: isKo ? '처치' : 'Kills', value: `${kills}`, color: 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-400 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Slingshot Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center cursor-crosshair select-none touch-none">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none"
        />
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-[10px] text-slate-400 font-mono">
          {isKo ? '활시위를 터치하여 아래로 당긴 뒤 놓으세요 (슬링샷 사격)' : 'Drag the bowstring backwards and release to fire'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_slingshot_archer"
          gameTitle={isKo ? '아케인 슬링샷 궁수: 물리 액션' : 'Arcane Slingshot Archer: Physics'}
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
export default VoxelArcherHeroGame;

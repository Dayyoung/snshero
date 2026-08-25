import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelLaserStealthGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface LaserBeam {
  id: number;
  y: number;
  speed: number;
  dir: number;
  minY: number;
  maxY: number;
}

interface Jewel {
  id: number;
  x: number;
  y: number;
  isCollected: boolean;
  points: number;
}

const VAULT_LEVELS = [
  {
    level: 1,
    name: '보안 1구역: 레이저 복도',
    enName: 'Sector 1: Laser Hallway',
    laserSpeed: 110,
    lasers: [
      { id: 1, y: 150, speed: 90, dir: 1, minY: 120, maxY: 200 },
      { id: 2, y: 300, speed: 110, dir: -1, minY: 250, maxY: 350 },
    ],
    jewels: [
      { id: 1, x: 90, y: 220, isCollected: false, points: 300 },
      { id: 2, x: 270, y: 220, isCollected: false, points: 300 },
    ],
    exit: { x: 180, y: 70, radius: 24 },
  },
  {
    level: 2,
    name: '보안 2구역: 펄스 그리드',
    enName: 'Sector 2: Pulse Grid',
    laserSpeed: 140,
    lasers: [
      { id: 1, y: 130, speed: 120, dir: 1, minY: 100, maxY: 180 },
      { id: 2, y: 230, speed: 140, dir: -1, minY: 190, maxY: 280 },
      { id: 3, y: 340, speed: 130, dir: 1, minY: 290, maxY: 380 },
    ],
    jewels: [
      { id: 1, x: 80, y: 180, isCollected: false, points: 400 },
      { id: 2, x: 280, y: 180, isCollected: false, points: 400 },
      { id: 3, x: 180, y: 290, isCollected: false, points: 400 },
    ],
    exit: { x: 180, y: 60, radius: 24 },
  },
  {
    level: 3,
    name: '보안 3구역: 마스터 볼트',
    enName: 'Sector 3: Master Vault',
    laserSpeed: 170,
    lasers: [
      { id: 1, y: 120, speed: 150, dir: 1, minY: 90, maxY: 170 },
      { id: 2, y: 200, speed: 170, dir: -1, minY: 160, maxY: 250 },
      { id: 3, y: 290, speed: 160, dir: 1, minY: 250, maxY: 340 },
      { id: 4, y: 370, speed: 180, dir: -1, minY: 330, maxY: 420 },
    ],
    jewels: [
      { id: 1, x: 70, y: 150, isCollected: false, points: 500 },
      { id: 2, x: 290, y: 150, isCollected: false, points: 500 },
      { id: 3, x: 70, y: 330, isCollected: false, points: 500 },
      { id: 4, x: 290, y: 330, isCollected: false, points: 500 },
    ],
    exit: { x: 180, y: 50, radius: 24 },
  },
];

export const VoxelLaserStealthGame: React.FC<VoxelLaserStealthGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 97;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [jewelsCount, setJewelsCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [stealthCombo, setStealthCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [alarmAlert, setAlarmAlert] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_laser_infil') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    levelIdx: 0,
    agentX: 180,
    agentY: 440,
    targetX: 180,
    targetY: 440,
    lasers: [] as LaserBeam[],
    jewels: [] as Jewel[],
    collectedCount: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    alarmCooldown: 0,
  });

  const setupLevel = useCallback((idx: number) => {
    const s = stateRef.current;
    const lvl = VAULT_LEVELS[idx] || VAULT_LEVELS[0];
    s.levelIdx = idx;
    s.agentX = 180;
    s.agentY = 440;
    s.targetX = 180;
    s.targetY = 440;
    s.lasers = lvl.lasers.map((l) => ({ ...l }));
    s.jewels = lvl.jewels.map((j) => ({ ...j }));

    setCurrentLevelIdx(idx);
    setAlarmAlert(false);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.collectedCount = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();

    setScore(0);
    setJewelsCount(0);
    setStealthCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupLevel(0);
  }, [setupLevel]);

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

  // Touch Handlers: Direct Finger Drag Movement (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetX = Math.max(30, Math.min(330, (e.clientX - rect.left) * scaleX));
    s.targetY = Math.max(40, Math.min(460, (e.clientY - rect.top) * scaleY));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetX = Math.max(30, Math.min(330, (e.clientX - rect.left) * scaleX));
    s.targetY = Math.max(40, Math.min(460, (e.clientY - rect.top) * scaleY));
  };

  // Main 60FPS Laser Security Engine Loop
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

      const lvl = VAULT_LEVELS[s.levelIdx] || VAULT_LEVELS[0];

      // Smooth Agent Motion towards Finger Target
      s.agentX += (s.targetX - s.agentX) * Math.min(1, dt * 14);
      s.agentY += (s.targetY - s.agentY) * Math.min(1, dt * 14);

      // Update Moving Lasers
      s.lasers.forEach((l) => {
        l.y += l.speed * l.dir * dt;
        if (l.y > l.maxY) {
          l.y = l.maxY;
          l.dir = -1;
        } else if (l.y < l.minY) {
          l.y = l.minY;
          l.dir = 1;
        }

        // Check Collision with Agent
        if (Math.abs(l.y - s.agentY) < 14) {
          // Laser Tripped! Alarm Triggered!
          if (s.alarmCooldown <= 0) {
            s.alarmCooldown = 1.0;
            s.score = Math.max(0, s.score - 150);
            s.combo = 0;
            setScore(s.score);
            setStealthCombo(0);
            setAlarmAlert(true);
            setFeedbackText(isKo ? '경보 발령! 레이저 접촉 -150P 🚨' : 'ALARM! LASER CONTACT -150P 🚨');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

            // Push agent back
            s.agentY = Math.min(440, s.agentY + 50);
            s.targetY = s.agentY;

            setTimeout(() => {
              setAlarmAlert(false);
              setFeedbackText(null);
            }, 600);
          }
        }
      });

      if (s.alarmCooldown > 0) s.alarmCooldown -= dt;

      // Check Jewel Pickup
      s.jewels.forEach((j) => {
        if (!j.isCollected && Math.hypot(j.x - s.agentX, j.y - s.agentY) < 26) {
          j.isCollected = true;
          s.collectedCount += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = j.points + s.combo * 30;
          s.score += pts;
          setScore(s.score);
          setJewelsCount(s.collectedCount);
          setStealthCombo(s.combo);
          setMaxCombo(s.maxCombo);

          setFeedbackText(`DIAMOND HACKED! +${pts}P 💎`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);
        }
      });

      // Check Exit Goal Passage
      if (Math.hypot(lvl.exit.x - s.agentX, lvl.exit.y - s.agentY) < lvl.exit.radius + 15) {
        // Vault Level Escaped!
        if (s.levelIdx < VAULT_LEVELS.length - 1) {
          s.score += 1000;
          setScore(s.score);
          setFeedbackText(`SECTOR CLEARED! +1000P 🚪`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          setTimeout(() => {
            setFeedbackText(null);
            setupLevel(s.levelIdx + 1);
          }, 700);
        } else {
          // Master Vault Win!
          endGame(true);
          return;
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // High-Security Vault Grid Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Security Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 30; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 30; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Render Exit Vault Door at Top
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(lvl.exit.x, lvl.exit.y, lvl.exit.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚪', lvl.exit.x, lvl.exit.y);

      // Render Jewels (Diamonds)
      s.jewels.forEach((j) => {
        if (!j.isCollected) {
          ctx.font = '26px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💎', j.x, j.y);
        }
      });

      // Render Laser Beams (Glowing Crimson Red)
      s.lasers.forEach((l) => {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(20, l.y);
        ctx.lineTo(w - 20, l.y);
        ctx.stroke();

        // Laser Projectors on walls
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(12, l.y - 4, 8, 8);
        ctx.fillRect(w - 20, l.y - 4, 8, 8);
      });
      ctx.shadowBlur = 0;

      // Render Agent (Secret Infiltrator)
      ctx.save();
      ctx.translate(s.agentX, s.agentY);
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🕵️', 0, 0);
      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx, setupLevel]);

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
      gameId: 'arcade_laser_infil',
      gameTitle: '블리츠 레이저 인필트레이션',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.levelIdx + 1) * 700) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.levelIdx >= 2,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 잠입 탈출' : 'STEP 1: DRAG STEALTH INFILTRATION',
      title: isKo ? '레이저를 피해 다이아몬드를 털고 탈출하세요' : 'Dodge Lasers, Steal Diamonds and Escape',
      description: isKo
        ? '가상 조이스틱 없이 요원(🕵️)을 손가락으로 화면에 직접 드래그하여 움직이며, 붉은 레이저 트랩(🔴⚡)을 피해 다이아몬드(💎)를 수집하고 상단 탈출구(🚪)로 골인하세요.'
        : 'Drag the secret agent with your finger to dodge moving lasers, collect diamonds, and reach the exit vault.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 드래그 이동)',
            '왕복 레이저 접촉 시 경보 발령 및 뒤로 튕김(-150P)',
            '3개 보안 구역(Sector 1~3) 완벽 잠입 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Drag',
            'Laser contact triggers alarm and penalty knockback',
            'Clear all 3 high-security sectors to claim jackpot'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 (Direct Drag)' : 'Direct Drag Gesture',
      description: isKo
        ? '손가락을 대고 원하는 방향으로 요원을 부드럽게 이끕니다.'
        : 'Slide your thumb smoothly to guide the secret agent.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 즉각 반응 잠입 이동',
            '💎 다이아몬드 연속 획득 시 스텔스 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Finger Drag: Instant responsive stealth navigation',
            '💎 Consecutive diamond hacks grant high combo multipliers',
            '⏱️ 35s time attack infiltration sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '탈출 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '수집 다이아몬드 및 탈출 구역 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Hacked diamonds and cleared sectors multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  const currentLevel = VAULT_LEVELS[currentLevelIdx] || VAULT_LEVELS[0];

  return (
    <div className="relative w-full h-[100dvh] bg-[#090d16] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 레이저 잠입' : 'Blitz Laser Infiltration'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '구역' : 'Sector', value: `${currentLevelIdx + 1}/${VAULT_LEVELS.length} ${isKo ? currentLevel.name : currentLevel.enName}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '보석' : 'Gems', value: `${jewelsCount}💎`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Laser Infiltration Canvas Viewport */}
      <div className={`flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2 transition-colors ${alarmAlert ? 'bg-rose-950/30 ring-4 ring-rose-500/50' : ''}`}>
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
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
          {isKo ? '손가락으로 요원을 드래그해 레이저를 피해 탈출구로 가세요' : 'Drag agent with finger to dodge lasers and reach the exit'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_laser_infil"
          gameTitle={isKo ? '블리츠 레이저: 잠입 탈출' : 'Blitz Laser: Infiltration'}
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
export default VoxelLaserStealthGame;

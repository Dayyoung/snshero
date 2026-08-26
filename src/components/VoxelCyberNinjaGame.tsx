import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCyberNinjaGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type Direction = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';

interface ShadowAttacker {
  id: number;
  dir: Direction;
  progress: number; // 0 (far) ~ 1 (impact)
  speed: number;
  isParried: boolean;
}

export const VoxelCyberNinjaGame: React.FC<VoxelCyberNinjaGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 46;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [hp, setHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [parryCombo, setParryCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [slashFlashDir, setSlashFlashDir] = useState<Direction | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_shadow_duel') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    hp: 100,
    score: 0,
    parryCombo: 0,
    maxCombo: 0,
    timeLeft: 35,
    attackers: [] as ShadowAttacker[],
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    attackerCounter: 1,
    spawnTimer: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.hp = 100;
    s.score = 0;
    s.parryCombo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.attackers = [];
    s.isGameOver = false;
    s.startTime = Date.now();
    s.attackerCounter = 1;
    s.spawnTimer = 0;

    setHp(100);
    setScore(0);
    setParryCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setSlashFlashDir(null);
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

  // Handle Directional Parry Tap (Zero Joysticks - Direct 4-Quadrant Tap)
  const handleParryDirection = (dir: Direction) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    setSlashFlashDir(dir);
    setTimeout(() => setSlashFlashDir(null), 120);

    // Find incoming attacker in this direction
    const targetIdx = s.attackers.findIndex(
      (a) => a.dir === dir && !a.isParried && a.progress >= 0.55 && a.progress <= 0.95
    );

    if (targetIdx !== -1) {
      // Just Parry Strike!
      const attacker = s.attackers[targetIdx];
      attacker.isParried = true;

      const isPerfect = attacker.progress >= 0.75 && attacker.progress <= 0.90;
      s.parryCombo += 1;
      if (s.parryCombo > s.maxCombo) s.maxCombo = s.parryCombo;

      const points = (isPerfect ? 250 : 120) + s.parryCombo * 30;
      s.score += points;

      setParryCombo(s.parryCombo);
      setMaxCombo(s.maxCombo);
      setScore(s.score);
      setFeedbackText(isPerfect ? `PERFECT PARRY! +${points}P ⚡` : `PARRY! +${points}P ⚔️`);
      setTimeout(() => setFeedbackText(null), 400);

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      s.attackers.splice(targetIdx, 1);
    } else {
      // Whiff parry (Miss timing)
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  // Touch Quadrant Detection
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Determine Quadrant (Top / Bottom / Left / Right)
    const dx = x - 0.5;
    const dy = y - 0.5;

    if (Math.abs(dx) > Math.abs(dy)) {
      handleParryDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      handleParryDirection(dy > 0 ? 'BOTTOM' : 'TOP');
    }
  };

  // Main 60FPS Battle Animation Loop
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

      // Spawn Attackers
      s.spawnTimer += dt;
      if (s.spawnTimer >= 0.75 && s.attackers.length < 5) {
        s.spawnTimer = 0;
        const dirs: Direction[] = ['TOP', 'BOTTOM', 'LEFT', 'RIGHT'];
        const chosenDir = dirs[Math.floor(Math.random() * dirs.length)];

        s.attackers.push({
          id: s.attackerCounter++,
          dir: chosenDir,
          progress: 0,
          speed: 0.65 + Math.random() * 0.35,
          isParried: false,
        });
      }

      // Update Attackers
      const centerX = 180;
      const centerY = 270;

      for (let i = s.attackers.length - 1; i >= 0; i--) {
        const a = s.attackers[i];
        a.progress += a.speed * dt;

        // Hit player (Impact!)
        if (a.progress >= 1.0) {
          s.attackers.splice(i, 1);
          s.hp = Math.max(0, s.hp - 18);
          s.parryCombo = 0;
          setHp(s.hp);
          setParryCombo(0);
          setFeedbackText(isKo ? '피격! -18 HP 💥' : 'HIT! -18 HP 💥');
          setTimeout(() => setFeedbackText(null), 400);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          if (s.hp <= 0) {
            endGame(false);
            return;
          }
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Cyber Dojo Arena Background
      ctx.fillStyle = '#080c16';
      ctx.fillRect(0, 0, w, h);

      // 4-Quadrant Divider Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.moveTo(w, 0);
      ctx.lineTo(0, h);
      ctx.stroke();

      // Parry Impact Timing Ring (Zone: 0.75 ~ 0.90)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
      ctx.stroke();

      // Center Hero Ninja (Official Card Sprite)
      drawCardSprite(
        ctx,
        playerHeroId,
        centerX - 24,
        centerY - 24,
        48,
        48,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
          shadowBlur: 12,
          shadowColor: 'rgba(56, 189, 248, 0.8)',
        }
      );

      // Slash Flash Effect
      if (slashFlashDir) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        if (slashFlashDir === 'TOP') {
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(0, 0);
          ctx.lineTo(w, 0);
        } else if (slashFlashDir === 'BOTTOM') {
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(0, h);
          ctx.lineTo(w, h);
        } else if (slashFlashDir === 'LEFT') {
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(0, 0);
          ctx.lineTo(0, h);
        } else {
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(w, 0);
          ctx.lineTo(w, h);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Render Shadow Attackers (Card Monster Sprites)
      s.attackers.forEach((a) => {
        let ax = centerX;
        let ay = centerY;
        const maxDist = 220;
        const dist = maxDist * (1 - a.progress);

        if (a.dir === 'TOP') ay = centerY - dist;
        else if (a.dir === 'BOTTOM') ay = centerY + dist;
        else if (a.dir === 'LEFT') ax = centerX - dist;
        else if (a.dir === 'RIGHT') ax = centerX + dist;

        drawCardSprite(
          ctx,
          33,
          ax - 16,
          ay - 16,
          32,
          32,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#e11d48',
            shadowBlur: 8,
            shadowColor: 'rgba(225, 29, 72, 0.8)',
          }
        );
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx, slashFlashDir, playerHeroId]);

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
      gameId: 'arcade_shadow_duel',
      gameTitle: '블리츠 섀도우 듀얼',
      durationSeconds: duration,
      score: s.score + (isWin ? 2500 : 600) + s.maxCombo * 80,
      difficulty: 'NIGHTMARE',
      isVictory: isWin,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 4방향 패링 배틀' : 'STEP 1: 4-WAY PARRY DUEL',
      title: isKo ? '다가오는 적의 방향을 타이밍 맞춰 탭하세요' : 'Tap Quadrant to Parry Incoming Attackers',
      description: isKo
        ? '가상 조이스틱 없이 화면 상/하/좌/우에서 돌진해오는 적 그림자 닌자를 파란색 타이밍 링에 맞춰 해당 방향을 탭해 패링 반격하세요.'
        : 'Tap the matching screen quadrant as incoming enemies enter the cyan timing circle.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 4방향 직접 터치 패링)',
            '파란 원 타이밍에 정확히 탭 시 PERFECT PARRY 보너스',
            '35초간 HP를 보존하며 최대 콤보를 달성하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% 4-Quadrant Direct Tap',
            'Time your tap inside the cyan circle for PERFECT PARRY',
            'Survive 35s while chaining high parry combos'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 4분할 직접 탭 (Quadrant Tap)' : '4-Quadrant Direct Tap',
      description: isKo
        ? '적이 다가오는 쪽 화면 영역(상/하/좌/우)을 손가락으로 탭합니다.'
        : 'Simply tap the quadrant (Top/Bottom/Left/Right) where the enemy attacks.',
      keyPoints: isKo
        ? [
            '👆 4분할 원터치 탭: 번개 같은 카운터 검기 발동',
            '⚡ 저스트 타이밍 연속 패링으로 피버 콤보 점수 획득',
            '🛡️ 빗맞출 경우 패링 실패 및 피격 주의'
          ]
        : [
            '👆 Quadrant Tap: Lightning-fast counter slashes',
            '⚡ Just-timing consecutive parries unleash fever points',
            '🛡️ Mistimed taps will cause you to take damage'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '결투 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '잔여 HP 및 패링 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining HP and parry combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#05070e] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 섀도우 듀얼' : 'Blitz Shadow Duel'}
        language={(language as Language) || 'ko'}
        hp={{ current: hp, max: 100 }}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '패링' : 'Combo', value: `${parryCombo}x`, color: parryCombo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch 4-Quadrant Parry Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          onPointerDown={handlePointerDown}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-lg font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '적 돌진 방향(상/하/좌/우) 화면을 타이밍 맞춰 탭하세요 (패링 콤보)' : 'Tap quadrant (Top/Bottom/Left/Right) in time to parry'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_shadow_duel"
          gameTitle={isKo ? '블리츠 섀도우 듀얼: 패링 배틀' : 'Blitz Shadow Duel: Parry Battle'}
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
export default VoxelCyberNinjaGame;

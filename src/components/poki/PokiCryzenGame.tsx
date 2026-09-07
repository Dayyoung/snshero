import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiCryzenGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Target {
  id: number;
  x: number;
  y: number;
  radius: number;
  aimTimer: number;
  maxAimTimer: number;
  charId: number;
  isHeadshot: boolean;
}

export const PokiCryzenGame: React.FC<PokiCryzenGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 8;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [ammo, setAmmo] = useState<number>(10);
  const maxAmmo = 10;
  const [kills, setKills] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_cryzen') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    targets: [] as Target[],
    crosshair: { x: 180, y: 260 },
    combo: 0,
    playerHp: 100,
    ammo: 10,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
  });

  const spawnTarget = useCallback((width: number, height: number) => {
    const enemyChars = [104, 106, 111, 117, 122];
    const newTarget: Target = {
      id: Date.now() + Math.random(),
      x: 50 + Math.random() * (width - 100),
      y: 100 + Math.random() * (height - 240),
      radius: 26,
      aimTimer: 0,
      maxAimTimer: 110 - Math.min(50, stateRef.current.combo * 4),
      charId: enemyChars[Math.floor(Math.random() * enemyChars.length)],
      isHeadshot: false,
    };
    stateRef.current.targets.push(newTarget);
  }, []);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(kills >= 15);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial, kills]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 400 : 80) + kills * 30;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_cryzen',
      gameTitle: isKo ? '크라이젠 전술 사격' : 'Cryzen.io',
      durationSeconds: 45 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && playerHp >= 80,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, kills, playerHp, isKo, onReward, playSfx]);

  const reloadAmmo = useCallback(() => {
    stateRef.current.ammo = maxAmmo;
    setAmmo(maxAmmo);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  }, [maxAmmo, playSfx]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const targets = stateRef.current.targets;
      const particles = stateRef.current.particles;

      // Spawn target if fewer than 4
      if (targets.length < 4 && Math.random() < 0.05) {
        spawnTarget(width, height);
      }

      // Update Targets Aim countdown
      for (let i = targets.length - 1; i >= 0; i--) {
        const tg = targets[i];
        tg.aimTimer++;

        if (tg.aimTimer >= tg.maxAimTimer) {
          // Target fired at player!
          targets.splice(i, 1);
          stateRef.current.playerHp -= 20;
          setPlayerHp(stateRef.current.playerHp);
          stateRef.current.combo = 0;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          if (stateRef.current.playerHp <= 0) {
            handleGameOver(false);
            return;
          }
        }
      }

      if (kills >= 20 || score >= 1000) {
        handleGameOver(true);
        return;
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Cyber tactical bunker background
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, width, height);

      // Tactical bunker crates / obstacles
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, height - 120, 110, 120);
      ctx.fillRect(width - 120, height - 140, 110, 140);
      ctx.fillRect(width * 0.35, height - 90, width * 0.3, 90);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, height - 120, 110, 120);
      ctx.strokeRect(width - 120, height - 140, 110, 140);
      ctx.strokeRect(width * 0.35, height - 90, width * 0.3, 90);

      // Draw Targets
      for (const tg of targets) {
        // Red warning aiming ring
        const aimPct = tg.aimTimer / tg.maxAimTimer;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + aimPct * 0.7})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tg.x, tg.y, tg.radius * (1.6 - aimPct * 0.6), 0, Math.PI * 2);
        ctx.stroke();

        // Target Enemy Card Sprite
        drawCardSprite(ctx, tg.charId, tg.x - tg.radius, tg.y - tg.radius, tg.radius * 2, tg.radius * 2, {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#ef4444',
          shadowBlur: 8,
          shadowColor: '#ef4444',
        });

        // Headshot bullseye dot on top center
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(tg.x, tg.y - 12, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Bullet sparks
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.05;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw Crosshair
      const ch = stateRef.current.crosshair;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ch.x, ch.y, 18, 0, Math.PI * 2);
      ctx.moveTo(ch.x - 24, ch.y);
      ctx.lineTo(ch.x + 24, ch.y);
      ctx.moveTo(ch.x, ch.y - 24);
      ctx.lineTo(ch.x, ch.y + 24);
      ctx.stroke();

      // Draw Player Hero Badge (Corner)
      drawCardSprite(ctx, playerHeroId, 16, height - 70, 50, 50, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#38bdf8',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, spawnTarget, kills, score, playerHeroId, handleGameOver]);

  // Touch: Tap on target to shoot!
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    stateRef.current.crosshair = { x: touchX, y: touchY };

    if (stateRef.current.ammo <= 0) {
      // Empty gun click! Reload
      reloadAmmo();
      return;
    }

    stateRef.current.ammo -= 1;
    setAmmo(stateRef.current.ammo);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    // Gunshot sparks
    for (let i = 0; i < 6; i++) {
      stateRef.current.particles.push({
        x: touchX,
        y: touchY,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: '#fbbf24',
        alpha: 1,
      });
    }

    // Hit test on targets
    const targets = stateRef.current.targets;
    for (let i = targets.length - 1; i >= 0; i--) {
      const tg = targets[i];
      const dist = Math.hypot(touchX - tg.x, touchY - tg.y);
      if (dist <= tg.radius + 8) {
        // Hit!
        const isHeadshot = Math.hypot(touchX - tg.x, touchY - (tg.y - 12)) <= 12;
        targets.splice(i, 1);
        setKills(k => k + 1);

        const earned = isHeadshot ? 120 : 60;
        setScore(s => s + earned);
        stateRef.current.combo++;
        if (playSfx) playSfx(isHeadshot ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        break;
      }
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '크라이젠 전술 사격 (스나이퍼)' : 'Cryzen.io Tactical FPS',
      badge: 'MISSION 08',
      description: isKo
        ? '엄폐물 사이로 나타나는 적을 직접 탭하여 즉시 저격하세요! 빨간 조준 원이 좁아지기 전에 사격해야 반격을 받지 않습니다.'
        : 'Tap on emerging enemy snipers to shoot them before their red targeting ring contracts and they shoot back!',
      keyPoints: isKo
        ? ['나타나는 적을 즉시 원터치 저격', '적 조준 원 수축 전 선제 타격', '체력 보존 및 정확한 반응속도']
        : ['Tap emerging snipers instantly', 'Fire before red ring contracts', 'Preserve HP and reaction time'],
    },
    {
      title: isKo ? '헤드샷 & 탄약 재장전' : 'Headshots & Reload',
      badge: 'HEADSHOT',
      description: isKo
        ? '머리 윗부분의 노란 점을 정확히 맞히면 2배의 헤드샷 점수를 획득합니다. 탄약이 떨어지면 화면을 탭하여 재장전하세요.'
        : 'Hit the yellow headshot mark for double points! When ammo runs out, tap again to reload.',
      keyPoints: isKo
        ? ['노란 헤드샷 부위 타격 시 2배 점수', '탄약 소진 시 자동 탭 재장전', '100% 모바일 퓨어 터치']
        : ['Hit yellow mark for 2x score', 'Tap to reload when empty', '100% pure touch control'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.08 크라이젠 io' : 'No.08 Cryzen.io'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`처치: ${kills}명 | 탄약: ${ammo}/${maxAmmo} | 체력: ${playerHp}%`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Reload Button / Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button
            onClick={reloadAmmo}
            className="px-4 py-1.5 bg-sky-950 border border-sky-600/60 rounded-sm text-xs text-sky-300 font-bold hover:bg-sky-900 active:scale-95 transition-all shadow-md"
          >
            🔄 {isKo ? `재장전 (${ammo}/${maxAmmo})` : `RELOAD (${ammo}/${maxAmmo})`}
          </button>
        </div>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isGameOver}
          isVictory={isVictory}
          score={score}
          receipt={settlementReceipt}
          onConfirm={onExit}
          onRestart={() => {
            setIsGameOver(false);
            setIsVictory(false);
            setSettlementReceipt(null);
            setScore(0);
            setKills(0);
            setAmmo(maxAmmo);
            setPlayerHp(100);
            stateRef.current.playerHp = 100;
            stateRef.current.ammo = maxAmmo;
            stateRef.current.targets = [];
            setTimeLeft(45);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.08 크라이젠 io' : 'No.08 Cryzen.io'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_cryzen', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

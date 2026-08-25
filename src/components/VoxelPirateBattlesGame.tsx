import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPirateBattlesGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PirateFleet {
  id: number;
  x: number;
  y: number;
  vx: number;
  hp: number;
  maxHp: number;
  type: 'sloop' | 'frigate' | 'galleon';
  icon: string;
  points: number;
  radius: number;
  isSunk: boolean;
}

interface CannonShot {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  alive: boolean;
}

export const VoxelPirateBattlesGame: React.FC<VoxelPirateBattlesGameProps> = ({
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

  const [shipsSunk, setShipsSunk] = useState<number>(0);
  const [salvoGauge, setSalvoGauge] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [cannonCombo, setCannonCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_pirate_cannon') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    fleet: [] as PirateFleet[],
    cannonballs: [] as CannonShot[],
    salvoGauge: 0,
    shipsSunk: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    shipCounter: 1,
    spawnTimer: 0,
    touchStart: { x: 0, y: 0, time: 0 },
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.fleet = [];
    s.cannonballs = [];
    s.salvoGauge = 0;
    s.shipsSunk = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.shipCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial 3 Pirate Ships
    s.fleet.push(
      { id: s.shipCounter++, x: 90, y: 130, vx: 50, hp: 1, maxHp: 1, type: 'sloop', icon: '⛵', points: 200, radius: 22, isSunk: false },
      { id: s.shipCounter++, x: 260, y: 180, vx: -65, hp: 2, maxHp: 2, type: 'frigate', icon: '🏴‍☠️', points: 450, radius: 26, isSunk: false }
    );

    setShipsSunk(0);
    setSalvoGauge(0);
    setScore(0);
    setCannonCombo(0);
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

  // Trigger Broadside Salvo Ultimate
  const triggerBroadsideSalvo = () => {
    const s = stateRef.current;
    if (s.salvoGauge < 100 || s.isGameOver || s.isPaused) return;
    s.salvoGauge = 0;
    setSalvoGauge(0);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    setFeedbackText(isKo ? '💥 브로드사이드 전탄 발사! 💥' : '💥 BROADSIDE FULL SALVO! 💥');
    setTimeout(() => setFeedbackText(null), 600);

    // Sink all visible pirate ships
    let sunkInSalvo = 0;
    s.fleet.forEach((ship) => {
      if (!ship.isSunk) {
        ship.isSunk = true;
        sunkInSalvo += 1;
        s.score += ship.points * 1.5;

        for (let p = 0; p < 15; p++) {
          s.particles.push({
            x: ship.x,
            y: ship.y,
            vx: (Math.random() - 0.5) * 250,
            vy: (Math.random() - 0.5) * 250,
            color: '#f97316',
            life: 0.6,
          });
        }
      }
    });

    s.shipsSunk += sunkInSalvo;
    s.combo += sunkInSalvo;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;

    const pts = sunkInSalvo * 600;
    s.score += pts;

    setShipsSunk(s.shipsSunk);
    setScore(s.score);
    setCannonCombo(s.combo);
    setMaxCombo(s.maxCombo);

    s.fleet = [];
  };

  // Touch Handlers: Tap to Shoot, Downward Swipe for Broadside Salvo
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.touchStart = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    const dy = endY - s.touchStart.y;

    // Check Downward Swipe for Broadside Salvo
    if (dy > 45 && s.salvoGauge >= 100) {
      triggerBroadsideSalvo();
      return;
    }

    // Direct Target Tap: Fire Cannonball
    const cannonStartX = 180;
    const cannonStartY = 450;
    const angle = Math.atan2(endY - cannonStartY, endX - cannonStartX);
    const speed = 600;

    s.cannonballs.push({
      x: cannonStartX,
      y: cannonStartY,
      tx: endX,
      ty: endY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alive: true,
    });

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  // Main 60FPS Pirate Battles Loop
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

      // Spawn Enemy Pirate Fleets
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.2 && s.fleet.length < 5) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isGalleon = rand < 0.2;
        const isFrigate = rand < 0.55;

        s.fleet.push({
          id: s.shipCounter++,
          x: Math.random() < 0.5 ? 30 : 330,
          y: 100 + Math.random() * 190,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isGalleon ? 45 : (isFrigate ? 80 : 60)),
          hp: isGalleon ? 4 : (isFrigate ? 2 : 1),
          maxHp: isGalleon ? 4 : (isFrigate ? 2 : 1),
          type: isGalleon ? 'galleon' : (isFrigate ? 'frigate' : 'sloop'),
          icon: isGalleon ? '🏴‍☠️' : (isFrigate ? '⛵' : '🚤'),
          points: isGalleon ? 800 : (isFrigate ? 400 : 200),
          radius: isGalleon ? 32 : (isFrigate ? 26 : 22),
          isSunk: false,
        });
      }

      // Move Pirate Ships (Patrol Ocean)
      s.fleet.forEach((ship) => {
        ship.x += ship.vx * dt;
        if (ship.x > 330) {
          ship.x = 330;
          ship.vx = -Math.abs(ship.vx);
        } else if (ship.x < 30) {
          ship.x = 30;
          ship.vx = Math.abs(ship.vx);
        }
      });

      // Update Flying Cannonballs
      for (let cIdx = s.cannonballs.length - 1; cIdx >= 0; cIdx--) {
        const c = s.cannonballs[cIdx];
        c.x += c.vx * dt;
        c.y += c.vy * dt;

        // Collision with Pirate Ships
        for (let fIdx = s.fleet.length - 1; fIdx >= 0; fIdx--) {
          const ship = s.fleet[fIdx];
          if (!ship.isSunk && Math.hypot(ship.x - c.x, ship.y - c.y) < ship.radius + 15) {
            c.alive = false;
            ship.hp -= 1;

            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            s.salvoGauge = Math.min(100, s.salvoGauge + 14);
            setSalvoGauge(s.salvoGauge);

            const pts = 150 + s.combo * 20;
            s.score += pts;

            setScore(s.score);
            setCannonCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`CANNON HIT! +${pts}P 💥`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);

            // Explosion Sparks
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: c.x,
                y: c.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: '#f97316',
                life: 0.4,
              });
            }

            if (ship.hp <= 0) {
              ship.isSunk = true;
              s.shipsSunk += 1;
              s.score += ship.points;

              setShipsSunk(s.shipsSunk);
              setScore(s.score);

              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              s.fleet.splice(fIdx, 1);
            }
            break;
          }
        }

        if (c.y < 40 || !c.alive) {
          s.cannonballs.splice(cIdx, 1);
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

      // Deep Blue Caribbean Ocean Background
      const seaGrad = ctx.createLinearGradient(0, 0, 0, h);
      seaGrad.addColorStop(0, '#0c4a6e');
      seaGrad.addColorStop(0.6, '#0284c7');
      seaGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, w, h);

      // Salvo Gauge Bar at Top
      const barW = 280;
      const barH = 12;
      const barX = (w - barW) / 2;
      const barY = 48;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = s.salvoGauge >= 100 ? '#fde047' : '#38bdf8';
      ctx.fillRect(barX, barY, barW * (s.salvoGauge / 100), barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = s.salvoGauge >= 100 ? '#fde047' : '#bae6fd';
      ctx.textAlign = 'center';
      ctx.fillText(
        s.salvoGauge >= 100
          ? (isKo ? '⚡ 브로드사이드 준비 완료! (아래로 스와이프) ⚡' : '⚡ BROADSIDE READY! (Swipe Down) ⚡')
          : `함포 살보 게이지 [${s.salvoGauge}%]`,
        w / 2,
        barY - 8
      );

      // Render Enemy Pirate Fleet
      s.fleet.forEach((ship) => {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        if (ship.type === 'galleon') {
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 20;
        }
        ctx.font = `${ship.radius * 1.8}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ship.icon, 0, 0);

        // HP Bar for Bigger Ships
        if (ship.maxHp > 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-14, ship.radius + 2, 28, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-14, ship.radius + 2, 28 * (ship.hp / ship.maxHp), 4);
        }
        ctx.restore();
      });

      // Render Flying Cannonballs
      s.cannonballs.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });

      // Render Flagship Cannon at Bottom
      ctx.save();
      ctx.translate(180, 450);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.font = '44px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx]);

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
      gameId: 'arcade_pirate_cannon',
      gameTitle: '블리츠 파이럿 캐논',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.shipsSunk * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.shipsSunk >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 화면 탭 함포 사격' : 'STEP 1: TAP CANNON FIRE',
      title: isKo ? '적 해적선을 직접 탭해 포격 격침시키세요' : 'Tap Enemy Pirate Ships to Fire Cannonballs',
      description: isKo
        ? '가상 조이스틱 없이 화면을 항해하는 해적선(⛵, 🚤, 🏴‍☠️)을 손가락으로 직접 탭하여 고속 함포를 발사하고, 게이지 100% 충전 시 화면을 아래로 쓸어내려 전탄 브로드사이드 폭격을 퍼부으세요.'
        : 'Tap pirate ships to shoot cannonballs, and swipe down when the meter is 100% full to unleash a devastating broadside salvo.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 화면 탭 함포 사격)',
            '거대 해적 기함(🏴‍☠️) 격침 시 800P 잭팟 대박 보너스',
            '35초간 최대 콤보로 해적 함대를 소탕하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Cannon Fire',
            'Pirate Galleons (🏴‍☠️) award 800P massive bounty jackpot',
            'Defeat enemy fleets with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 탭 & 아래로 스와이프 (Tap & Swipe Down)' : 'Tap & Downward Swipe',
      description: isKo
        ? '탭으로 조준 사격하고, 아래로 쓸어내려 전탄 발사합니다.'
        : 'Tap to shoot, swipe down at 100% for full salvo.',
      keyPoints: isKo
        ? [
            '👆 화면 탭: 즉시 반응 고속 함포탄 투하',
            '⬇️ 아래로 스와이프: 게이지 100% 시 전 화면 브로드사이드 폭격',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Screen Tap: Instant high-velocity cannonball shot',
            '⬇️ Swipe Down: Full-screen broadside volley at 100% meter',
            '⏱️ 35s time attack pirate fleet sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '격침 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격침한 해적선 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Sunk pirate ships count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0c4a6e] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 파이럿 캐논' : 'Blitz Pirate Cannon'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '격침' : 'Sunk', value: `${shipsSunk}척`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '살보' : 'Salvo', value: `${salvoGauge}%`, color: salvoGauge >= 100 ? 'text-amber-300 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Pirate Cannon Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
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
          {isKo ? '적 해적선을 직접 탭해 포격하고, 100% 시 아래로 스와이프하세요' : 'Tap ships to shoot, swipe down at 100% for full broadside salvo'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_pirate_cannon"
          gameTitle={isKo ? '블리츠 파이럿: 함포전' : 'Blitz Pirate: Cannon Battles'}
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
export default VoxelPirateBattlesGame;

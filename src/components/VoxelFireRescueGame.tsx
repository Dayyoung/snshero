import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelFireRescueGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface FireTarget {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  extinguished: boolean;
}

interface CivilianRescue {
  id: number;
  x: number;
  y: number;
  speed: number;
  rescued: boolean;
}

export const VoxelFireRescueGame: React.FC<VoxelFireRescueGameProps> = ({
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

  const [currentBuilding, setCurrentBuilding] = useState<number>(1);
  const totalBuildings = 4;
  const [extinguishedTotal, setExtinguishedTotal] = useState<number>(0);
  const [rescuedTotal, setRescuedTotal] = useState<number>(0);
  const [waterTank, setWaterTank] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_fire_rescue') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    building: 1,
    fires: [] as FireTarget[],
    civilians: [] as CivilianRescue[],
    waterParticles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    isSpraying: false,
    sprayPos: { x: 180, y: 250 },
    waterTank: 100,
    score: 0,
    extinguished: 0,
    rescued: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    fireCounter: 1,
    civilianCounter: 1,
    spawnTimer: 0,
  });

  const setupBuilding = useCallback((buildingNum: number) => {
    const s = stateRef.current;
    s.building = buildingNum;
    s.fires = [];
    s.civilians = [];
    s.waterTank = 100;

    // Create 3x3 Window Fires Grid
    const startX = 60;
    const startY = 110;
    const gapX = 80;
    const gapY = 80;

    let id = 1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        s.fires.push({
          id: id++,
          x: startX + c * gapX + 40,
          y: startY + r * gapY + 40,
          hp: 40 + buildingNum * 15,
          maxHp: 40 + buildingNum * 15,
          extinguished: false,
        });
      }
    }

    setCurrentBuilding(buildingNum);
    setWaterTank(100);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.extinguished = 0;
    s.rescued = 0;
    s.timeLeft = 35;
    s.waterTank = 100;
    s.isGameOver = false;
    s.startTime = Date.now();

    setScore(0);
    setExtinguishedTotal(0);
    setRescuedTotal(0);
    setWaterTank(100);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupBuilding(1);
  }, [setupBuilding]);

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

  // Touch Handlers for Direct Screen Water Jet Spraying (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;

    // Check civilian tap rescue
    for (let i = s.civilians.length - 1; i >= 0; i--) {
      const civ = s.civilians[i];
      if (!civ.rescued && Math.hypot(civ.x - curX, civ.y - curY) < 30) {
        civ.rescued = true;
        s.score += 400;
        s.rescued += 1;
        setScore(s.score);
        setRescuedTotal(s.rescued);
        setFeedbackText(isKo ? '시민 구조 성공! +400P 🏃' : 'CIVILIAN RESCUED! +400P 🏃');
        setTimeout(() => setFeedbackText(null), 350);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        return;
      }
    }

    s.isSpraying = true;
    s.sprayPos = { x: curX, y: curY };
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || !s.isSpraying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.sprayPos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = () => {
    stateRef.current.isSpraying = false;
  };

  // Main 60FPS Fire Rescue Spray Loop
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

      // Water Spray Particles & Extinguish Logic
      if (s.isSpraying && s.waterTank > 0) {
        s.waterTank = Math.max(0, s.waterTank - 25 * dt);
        setWaterTank(Math.round(s.waterTank));

        // Emit Water Particles from bottom nozzle (x: 180, y: 480)
        for (let k = 0; k < 3; k++) {
          const dx = s.sprayPos.x - 180;
          const dy = s.sprayPos.y - 480;
          const dist = Math.hypot(dx, dy);
          const spd = 600 + Math.random() * 100;

          s.waterParticles.push({
            x: 180,
            y: 480,
            vx: (dx / dist) * spd + (Math.random() - 0.5) * 40,
            vy: (dy / dist) * spd + (Math.random() - 0.5) * 40,
            life: 0.6,
          });
        }

        // Extinguish Fire at spray target position
        s.fires.forEach((f) => {
          if (!f.extinguished && Math.hypot(f.x - s.sprayPos.x, f.y - s.sprayPos.y) < 36) {
            f.hp -= 45 * dt;
            if (f.hp <= 0) {
              f.extinguished = true;
              s.score += 200;
              s.extinguished += 1;
              setScore(s.score);
              setExtinguishedTotal(s.extinguished);

              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

              // Check Building All Clear
              if (s.fires.every((fire) => fire.extinguished)) {
                if (s.building < totalBuildings) {
                  setFeedbackText(`BUILDING ${s.building} SECURED! 🚒`);
                  s.score += 800;
                  setScore(s.score);
                  setTimeout(() => {
                    setFeedbackText(null);
                    setupBuilding(s.building + 1);
                  }, 700);
                } else {
                  // All Buildings Cleared!
                  endGame(true);
                }
              }
            }
          }
        });
      } else if (!s.isSpraying) {
        // Slowly Refill Water Tank when not spraying
        s.waterTank = Math.min(100, s.waterTank + 20 * dt);
        setWaterTank(Math.round(s.waterTank));
      }

      // Update Water Particles
      for (let i = s.waterParticles.length - 1; i >= 0; i--) {
        const p = s.waterParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          s.waterParticles.splice(i, 1);
        }
      }

      // Spawn Civilians (Escaping from windows)
      s.spawnTimer += dt;
      if (s.spawnTimer >= 3.5 && s.civilians.length < 2) {
        s.spawnTimer = 0;
        const randomFire = s.fires[Math.floor(Math.random() * s.fires.length)];
        s.civilians.push({
          id: s.civilianCounter++,
          x: randomFire.x,
          y: randomFire.y,
          speed: 40,
          rescued: false,
        });
      }

      // Update Civilians
      for (let i = s.civilians.length - 1; i >= 0; i--) {
        const civ = s.civilians[i];
        if (!civ.rescued) {
          civ.y += civ.speed * dt;
          if (civ.y > 450) {
            s.civilians.splice(i, 1);
          }
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Night City Background
      ctx.fillStyle = '#060a17';
      ctx.fillRect(0, 0, w, h);

      // Building Brick Facade
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 80, 280, 320);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 80, 280, 320);

      // Render Windows & Fires
      s.fires.forEach((f) => {
        // Window Frame
        ctx.fillStyle = f.extinguished ? '#0284c7' : '#0f172a';
        ctx.fillRect(f.x - 24, f.y - 24, 48, 48);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(f.x - 24, f.y - 24, 48, 48);

        if (!f.extinguished) {
          ctx.font = '28px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🔥', f.x, f.y);

          // Fire Health Bar
          const barW = 36;
          const barH = 4;
          const barX = f.x - barW / 2;
          const barY = f.y + 28;

          ctx.fillStyle = '#374151';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(barX, barY, barW * (f.hp / f.maxHp), barH);
        } else {
          ctx.font = '20px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💧', f.x, f.y);
        }
      });

      // Render Civilians
      s.civilians.forEach((civ) => {
        if (!civ.rescued) {
          ctx.font = '26px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏃', civ.x, civ.y);
        }
      });

      // Render Water Jet Particles (Blue / Cyan Glow)
      ctx.fillStyle = '#38bdf8';
      s.waterParticles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Fire Truck Nozzle at bottom
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(180, 480, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚒', 180, 480);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [setupBuilding, playSfx]);

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
      gameId: 'arcade_fire_rescue',
      gameTitle: '블리츠 파이어 레스큐',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : s.building * 400) + s.rescued * 200,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.building >= 3,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 고압 물대포 조준 분사' : 'STEP 1: WATER JET SPRAY',
      title: isKo ? '화면을 터치해 불길을 직접 진압하세요' : 'Direct Touch to Aim and Spray High-Pressure Water',
      description: isKo
        ? '가상 조이스틱 없이 불타는 창문(🔥)을 손가락으로 누르고 있으면 소방차에서 고압 물줄기가 발사되어 화재를 진압하며, 탈출하는 시민(🏃)을 탭하여 구조하세요.'
        : 'Hold on burning windows to spray water jets and extinguish flames, then tap escaping citizens to rescue them.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 드래그 분사 & 탭 구조)',
            '손을 떼면 물탱크(💧)가 자동으로 다시 충전됩니다',
            '4개 빌딩의 화재를 모두 진압하여 도시를 구하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Touch Aiming',
            'Release to automatically refill your water tank (💧)',
            'Extinguish all fires across 4 buildings to save the city'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 터치 & 드래그 (Direct Drag)' : 'Direct Screen Drag',
      description: isKo
        ? '불길이 치솟는 곳으로 손가락을 자유롭게 끌고 이동합니다.'
        : 'Slide your finger seamlessly across burning windows.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 수압 물리 워터젯 발사',
            '🏃 탈출 시민 원터치 탭 구조 시 +400P 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Touch Drag: Real-time dynamic water jet physics',
            '🏃 Single tap escaping citizens for +400P bonus',
            '⏱️ 35s time attack high-score sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '화재 진압 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '진압 빌딩 수 및 구조 시민 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Cleared buildings and rescued citizens multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#050914] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 파이어 레스큐' : 'Blitz Fire Rescue'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '빌딩' : 'Building', value: `${currentBuilding}/${totalBuildings}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '물탱크' : 'Water', value: `${waterTank}%`, color: waterTank < 20 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-emerald-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Fire Rescue Canvas Viewport */}
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
          {isKo ? '불타는 창문을 눌러 물을 분사하고 시민(🏃)을 탭해 구조하세요' : 'Hold on fire to spray water and tap citizens to rescue'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_fire_rescue"
          gameTitle={isKo ? '블리츠 파이어 레스큐: 화재 진압' : 'Blitz Fire Rescue: Water Jet Action'}
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
export default VoxelFireRescueGame;

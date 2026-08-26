import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDeepSeaOdysseyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface DeepSeaItem {
  id: number;
  x: number;
  y: number;
  type: 'crystal' | 'oxygen' | 'jellyfish' | 'shark';
  cardId: number;
  icon: string;
  radius: number;
  collected: boolean;
}

export const VoxelDeepSeaOdysseyGame: React.FC<VoxelDeepSeaOdysseyGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 42;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [oxygen, setOxygen] = useState<number>(100);
  const [depthMeters, setDepthMeters] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [crystalsCollected, setCrystalsCollected] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_deepsea_diver') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    subX: 180,
    subY: 200,
    subRadius: 18,
    oxygen: 100,
    depth: 0,
    score: 0,
    crystals: 0,
    combo: 0,
    maxCombo: 0,
    items: [] as DeepSeaItem[],
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    itemCounter: 1,
    spawnTimer: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.subX = 180;
    s.subY = 200;
    s.oxygen = 100;
    s.depth = 0;
    s.score = 0;
    s.crystals = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.items = [];
    s.isGameOver = false;
    s.startTime = Date.now();
    s.itemCounter = 1;
    s.spawnTimer = 0;

    setOxygen(100);
    setDepthMeters(0);
    setScore(0);
    setCrystalsCollected(0);
    setCombo(0);
    setMaxCombo(0);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Touch / Pointer Direct Drag Submarine Movement (Zero Joysticks)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    s.subX = Math.min(330, Math.max(30, touchX));
    s.subY = Math.min(500, Math.max(80, touchY));
  };

  // Main 60FPS Deep Sea Diving Loop
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

      // Oxygen Depletion & Depth Increase
      s.oxygen = Math.max(0, s.oxygen - 2.8 * dt);
      setOxygen(Math.round(s.oxygen));

      if (s.oxygen <= 0) {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        endGame(false);
        return;
      }

      s.depth += 18 * dt;
      setDepthMeters(Math.floor(s.depth));

      // Check Victory at 300m depth
      if (s.depth >= 300) {
        endGame(true);
        return;
      }

      // Spawn Deep Sea Items
      s.spawnTimer += dt;
      if (s.spawnTimer >= 0.65 && s.items.length < 8) {
        s.spawnTimer = 0;
        const rand = Math.random();
        let type: 'crystal' | 'oxygen' | 'jellyfish' | 'shark' = 'crystal';
        let cardId = 100;
        let icon = '💎';

        if (rand < 0.35) {
          type = 'crystal';
          cardId = 100;
          icon = '💎';
        } else if (rand < 0.65) {
          type = 'oxygen';
          cardId = 12;
          icon = '🫧';
        } else if (rand < 0.85) {
          type = 'jellyfish';
          cardId = 38;
          icon = '🪼';
        } else {
          type = 'shark';
          cardId = 49;
          icon = '🦈';
        }

        s.items.push({
          id: s.itemCounter++,
          x: 40 + Math.random() * 280,
          y: 560, // Floating up from bottom
          type,
          cardId,
          icon,
          radius: 18,
          collected: false,
        });
      }

      // Update Items Position & Collisions
      const floatSpeed = 160;
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.y -= floatSpeed * dt;

        // Collision with Submarine
        if (!item.collected && Math.hypot(item.x - s.subX, item.y - s.subY) < s.subRadius + item.radius) {
          item.collected = true;

          if (item.type === 'crystal') {
            s.crystals += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = 200 + s.combo * 40;
            s.score += pts;
            setCrystalsCollected(s.crystals);
            setCombo(s.combo);
            setMaxCombo(s.maxCombo);
            setScore(s.score);
            setFeedbackText(`CRYSTAL! +${pts}P 💎`);
            setTimeout(() => setFeedbackText(null), 400);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          } else if (item.type === 'oxygen') {
            s.oxygen = Math.min(100, s.oxygen + 22);
            s.score += 100;
            setOxygen(Math.round(s.oxygen));
            setScore(s.score);
            setFeedbackText(`OXYGEN +22% 🫧`);
            setTimeout(() => setFeedbackText(null), 400);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          } else {
            // Hazard (Jellyfish / Shark)
            s.oxygen = Math.max(0, s.oxygen - 20);
            s.combo = 0;
            setOxygen(Math.round(s.oxygen));
            setCombo(0);
            setFeedbackText(isKo ? '충돌! 산소 유출 -20% ⚠️' : 'HAZARD! -20% O2 ⚠️');
            setTimeout(() => setFeedbackText(null), 400);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

            if (s.oxygen <= 0) {
              endGame(false);
              return;
            }
          }
        }

        // Remove offscreen items
        if (item.y < -30 || item.collected) {
          s.items.splice(i, 1);
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep Ocean Abyssal Gradient Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // Bioluminescent Plankton Bubbles
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      for (let i = 0; i < 15; i++) {
        const bx = (i * 27 + now * 0.02) % w;
        const by = (i * 37 + now * 0.04) % h;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Floating Items (Card Sprites)
      s.items.forEach((item) => {
        const borderColor =
          item.type === 'crystal'
            ? '#38bdf8'
            : item.type === 'oxygen'
            ? '#34d399'
            : item.type === 'jellyfish'
            ? '#c084fc'
            : '#f43f5e';

        drawCardSprite(
          ctx,
          item.cardId,
          item.x - 14,
          item.y - 14,
          28,
          28,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor,
            shadowBlur: 6,
            shadowColor: `${borderColor}88`,
          }
        );
      });

      // Render Submarine (Yellow Explorer)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(s.subX, s.subY, 26, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Submarine Cockpit Hero Pilot Emblem
      drawCardSprite(
        ctx,
        playerHeroId,
        s.subX - 8,
        s.subY - 8,
        16,
        16,
        {
          circleClip: true,
          borderWidth: 1,
          borderColor: '#fde047',
          shadowBlur: 6,
          shadowColor: 'rgba(253, 224, 71, 0.8)',
        }
      );

      // Submarine Headlight Beam
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.moveTo(s.subX + 24, s.subY);
      ctx.lineTo(s.subX + 110, s.subY + 50);
      ctx.lineTo(s.subX + 110, s.subY - 50);
      ctx.closePath();
      ctx.fill();
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
      gameId: 'arcade_deepsea_diver',
      gameTitle: '블리츠 딥씨 다이버',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : Math.floor(s.depth * 5)) + s.maxCombo * 70,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.depth >= 150,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 300m 심해 탐사' : 'STEP 1: 300M DIVE',
      title: isKo ? '손가락으로 잠수함을 조종하세요' : 'Direct Finger Drag Submarine',
      description: isKo
        ? '가상 조이스틱 없이 화면 속 잠수함을 손가락으로 직접 드래그하여 산소 방울(🫧)과 크리스탈(💎)을 수집하고 해파리(🪼)를 피하세요.'
        : 'Drag your submarine directly to collect oxygen bubbles and crystals while dodging hazards.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 위치 추적)',
            '산소(🫧)를 지속 공급하며 300m 심해에 도달하면 승리',
            '해파리/상어 충돌 시 산소 대량 유출 주의'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Tracking',
            'Refill oxygen bubbles (🫧) to reach 300m abyssal depth',
            'Dodging jellyfish & sharks prevents fatal oxygen leaks'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 (Direct Drag)' : 'Direct Screen Drag',
      description: isKo
        ? '화면 어디든 손가락을 대고 미끄러지듯 이동하여 잠수함을 조종합니다.'
        : 'Slide your finger smoothly anywhere to pilot your submarine.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 즉각적인 부유 기동',
            '💎 연속 크리스탈 채굴 시 콤보 배수 보너스',
            '⚡ 300m 도달 시 즉시 심해 탐사 대성공'
          ]
        : [
            '👆 Touch Drag: Instant fluid underwater movement',
            '💎 Consecutive crystal mining chains combo multipliers',
            '⚡ Reach 300m depth to achieve abyssal victory'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '탐사 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '도달 수심 및 크리스탈 채굴 수 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Reached depth and collected crystals multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020510] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 딥씨 다이버' : 'Blitz Deep Sea Diver'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '수심' : 'Depth', value: `${depthMeters}m/300m`, color: 'text-amber-400 font-bold text-base' },
          { label: isKo ? '산소' : 'O2', value: `${oxygen}%`, color: oxygen <= 25 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '채굴' : 'Crystals', value: `${crystalsCollected}💎`, color: 'text-emerald-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Deep Sea Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-lg font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '잠수함을 드래그하여 산소(🫧)와 보석(💎)을 모으세요' : 'Drag submarine to collect O2 bubbles and crystals'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_deepsea_diver"
          gameTitle={isKo ? '블리츠 딥씨 다이버: 심해 탐사' : 'Blitz Deep Sea Diver: Abyssal Diving'}
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
export default VoxelDeepSeaOdysseyGame;

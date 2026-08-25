import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTreasureDiggerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface OreItem {
  mesh: THREE.Mesh;
  type: 'small_gold' | 'big_gold' | 'diamond' | 'rock';
  value: number;
  weight: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  isCollected: boolean;
}

export const VoxelTreasureDiggerGame: React.FC<VoxelTreasureDiggerGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_treasure_digger') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [goldScore, setGoldScore] = useState<number>(0);
  const targetGold = 4000;
  const [tntCount, setTntCount] = useState<number>(2);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    hookAngle: 0,
    hookSpeed: 1.8,
    hookAngleDir: 1,
    hookState: 'swinging' as 'swinging' | 'shooting' | 'retracting',
    hookLength: 1.0,
    hookTargetItem: null as OreItem | null,
    goldScore: 0,
    tntCount: 2,
    timeLeft: 60,
    ores: [] as OreItem[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    hookLineMesh: null as THREE.Mesh | null,
    hookGroup: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const handleShootHook = () => {
    const s = stateRef.current;
    if (s.hookState === 'swinging' && !s.isGameOver && !s.isVictory && !s.isPaused) {
      s.hookState = 'shooting';
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handleUseTnt = () => {
    const s = stateRef.current;
    if (s.tntCount > 0 && s.hookTargetItem && !s.isGameOver && !s.isVictory && !s.isPaused) {
      s.tntCount -= 1;
      setTntCount(s.tntCount);
      s.hookTargetItem.mesh.visible = false;
      s.hookTargetItem.isCollected = true;
      s.hookTargetItem = null;
      s.hookState = 'retracting';
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a110a);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, -3.5, 14);
    camera.lookAt(0, -4.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x332211, 0.9);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xffeedd, 2.0);
    spotLight.position.set(0, 5, 8);
    scene.add(spotLight);

    // Miner Cart
    const cart = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.8, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
    );
    cart.position.set(0, 0.4, 0);
    scene.add(cart);

    // Hook Group
    const hookGroup = new THREE.Group();
    hookGroup.position.set(0, 0, 0);

    const lineGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.y = -0.5;
    hookGroup.add(lineMesh);

    const claw = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6 })
    );
    claw.rotation.x = Math.PI;
    claw.position.y = -1.0;
    hookGroup.add(claw);

    scene.add(hookGroup);
    stateRef.current.hookGroup = hookGroup;
    stateRef.current.hookLineMesh = lineMesh;

    // Spawn Underground Ores
    stateRef.current.ores = [];
    const oreTypes = [
      { type: 'small_gold' as const, value: 500, weight: 1.0, radius: 0.6, color: 0xfacc15 },
      { type: 'big_gold' as const, value: 1200, weight: 2.2, radius: 1.1, color: 0xeab308 },
      { type: 'diamond' as const, value: 2000, weight: 0.8, radius: 0.5, color: 0x06b6d4 },
      { type: 'rock' as const, value: 50, weight: 3.5, radius: 1.3, color: 0x78716c }
    ];

    for (let i = 0; i < 16; i++) {
      const proto = oreTypes[i % 4];
      const ox = (Math.random() - 0.5) * 14;
      const oy = -2.5 - Math.random() * 6.5;

      const mesh = new THREE.Mesh(
        proto.type === 'diamond' ? new THREE.OctahedronGeometry(proto.radius) : new THREE.DodecahedronGeometry(proto.radius),
        new THREE.MeshStandardMaterial({ color: proto.color, roughness: 0.4 })
      );
      mesh.position.set(ox, oy, 0);
      scene.add(mesh);

      stateRef.current.ores.push({
        mesh,
        type: proto.type,
        value: proto.value,
        weight: proto.weight,
        x: ox,
        y: oy,
        z: 0,
        radius: proto.radius,
        isCollected: false
      });
    }

    // 60s Timer
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);

      if (s.timeLeft <= 0 && !s.isGameOver) {
        s.isGameOver = true;
        s.isVictory = s.goldScore >= targetGold;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_treasure_digger',
          gameTitle: '복셀 트레저 디거',
          durationSeconds: duration,
          score: s.goldScore,
          difficulty: 'HARD',
          isVictory: s.isVictory
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }, 1000);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      if (s.hookState === 'swinging') {
        s.hookAngle += s.hookAngleDir * s.hookSpeed * dt * 25;
        if (s.hookAngle > 1.2) { s.hookAngle = 1.2; s.hookAngleDir = -1; }
        if (s.hookAngle < -1.2) { s.hookAngle = -1.2; s.hookAngleDir = 1; }
        if (hookGroup) hookGroup.rotation.z = s.hookAngle;
      } else if (s.hookState === 'shooting') {
        s.hookLength += 16 * dt;
        if (lineMesh) {
          lineMesh.scale.set(1, s.hookLength, 1);
          lineMesh.position.y = -s.hookLength / 2;
        }
        claw.position.y = -s.hookLength;

        const tipX = -Math.sin(s.hookAngle) * s.hookLength;
        const tipY = -Math.cos(s.hookAngle) * s.hookLength;

        // Check Ore Collision
        for (const o of s.ores) {
          if (!o.isCollected && Math.hypot(tipX - o.x, tipY - o.y) < o.radius + 0.4) {
            s.hookTargetItem = o;
            s.hookState = 'retracting';
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            break;
          }
        }

        if (s.hookLength > 11.5) {
          s.hookState = 'retracting';
        }
      } else if (s.hookState === 'retracting') {
        const pullSpeed = s.hookTargetItem ? 12 / s.hookTargetItem.weight : 16;
        s.hookLength -= pullSpeed * dt;

        if (lineMesh) {
          lineMesh.scale.set(1, Math.max(1, s.hookLength), 1);
          lineMesh.position.y = -s.hookLength / 2;
        }
        claw.position.y = -s.hookLength;

        const tipX = -Math.sin(s.hookAngle) * s.hookLength;
        const tipY = -Math.cos(s.hookAngle) * s.hookLength;

        if (s.hookTargetItem) {
          s.hookTargetItem.mesh.position.set(tipX, tipY, 0);
        }

        if (s.hookLength <= 1.0) {
          s.hookLength = 1.0;
          s.hookState = 'swinging';

          if (s.hookTargetItem) {
            s.hookTargetItem.isCollected = true;
            scene.remove(s.hookTargetItem.mesh);
            s.goldScore += s.hookTargetItem.value;
            setGoldScore(s.goldScore);
            s.hookTargetItem = null;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.goldScore >= targetGold && !s.isGameOver) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_treasure_digger',
                gameTitle: '복셀 트레저 디거',
                durationSeconds: duration,
                score: s.goldScore + 2000,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      clearInterval(timerInterval);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = stateRef.current;
    s.goldScore = 0;
    s.tntCount = 2;
    s.timeLeft = 60;
    s.hookState = 'swinging';
    s.hookLength = 1.0;
    s.hookTargetItem = null;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.ores.forEach(o => {
      o.isCollected = false;
      o.mesh.visible = true;
      s.scene?.add(o.mesh);
    });
    setGoldScore(0);
    setTntCount(2);
    setTimeLeft(60);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 황금 광산 $4,000 채굴' : 'STEP 1: GOLD DIGGER',
      title: isKo ? '$4,000 골드 광물 채굴 승리' : 'Mine $4,000 in Minerals',
      description: isKo
        ? '회전하는 갈고리를 지하로 사출하여 황금 덩어리와 다이아몬드를 채굴하고 목표 금액을 달성하세요.'
        : 'Launch your claw deep underground to mine gold nuggets and diamonds.',
      keyPoints: isKo
        ? [
            '60초 내 $4,000 달성 시 승리',
            '다이아몬드는 가볍고 고가치 ($2,000)',
            '바위는 무겁고 저가치 ($50)'
          ]
        : [
            'Mine $4,000 within 60s to win',
            'Diamonds are light and high value ($2,000)',
            'Rocks are heavy and low value ($50)'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '탭 사출 & 더블탭 TNT 폭파' : 'Tap Launch & Double Tap TNT',
      description: isKo
        ? '가상 버튼 없이 화면 탭으로 갈고리를 사출하고, 무거운 바위가 걸렸을 때 더블탭하여 TNT로 파괴합니다.'
        : 'Tap screen to fire the claw and double-tap to detonate TNT on heavy rocks with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 화면 탭: 조준 각도로 갈고리 즉시 사출',
            '💥 더블탭: 걸린 장애물 TNT 폭파 파쇄',
            '⚡ 릴 회수 가속으로 시간 절약'
          ]
        : [
            '👆 Screen Tap: Fire claw along aim angle',
            '💥 Double Tap: Detonate TNT to shatter rocks',
            '⚡ Save time with fast reel retract'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '채굴 성공 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '채굴 골드액 및 잔여 시간 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Mined gold and remaining time bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 트레저 디거' : 'Voxel Treasure Digger'}
        language={language}
        telemetries={[
          { label: isKo ? '골드' : 'Gold', value: `$${goldScore}/$${targetGold}`, color: goldScore >= targetGold ? 'text-emerald-400 font-bold' : 'text-amber-300' },
          { label: isKo ? 'TNT' : 'TNT', value: `💣x${tntCount}`, color: tntCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-500' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 15 ? 'text-rose-400 font-bold' : 'text-cyan-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerDown={handleShootHook}
          onDoubleClick={handleUseTnt}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 탭: 갈고리 사출 | 더블탭: TNT 폭파 (버튼 없음)' : 'Tap: Launch Claw | Double Tap: Detonate TNT (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_treasure_digger"
          gameTitle={isKo ? '3D 복셀 트레저 디거: 황금 광산 채굴' : 'Voxel Treasure Digger: Gold Rush'}
          customSteps={customTutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default VoxelTreasureDiggerGame;

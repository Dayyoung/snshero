import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTowerStackGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface StackBlock {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
}

export const VoxelTowerStackGame: React.FC<VoxelTowerStackGameProps> = ({
  deck: _deck,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_tower_stack') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [floorCount, setFloorCount] = useState<number>(0);
  const targetFloors = 20;
  const [combo, setCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const blockColors = [
    0xef4444, 0xf97316, 0xf59e0b, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899
  ];

  const stateRef = useRef({
    currentFloor: 0,
    stack: [] as StackBlock[],
    currentBlockMesh: null as THREE.Mesh | null,
    blockWidth: 8,
    blockDepth: 8,
    blockHeight: 1.2,
    blockX: 0,
    blockZ: 0,
    moveDir: 1,
    axis: 'x' as 'x' | 'z',
    combo: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    speed: 12,
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const handlePlaceBlock = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.currentBlockMesh || !s.scene) return;

    const prevBlock = s.stack[s.stack.length - 1];
    let diff = 0;
    let newWidth = s.blockWidth;
    let newDepth = s.blockDepth;
    let newX = s.blockX;
    let newZ = s.blockZ;

    if (s.axis === 'x') {
      diff = s.blockX - prevBlock.x;
      if (Math.abs(diff) < 0.35) {
        // Perfect Snap!
        diff = 0;
        newX = prevBlock.x;
        s.combo += 1;
        s.score += 250;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else if (Math.abs(diff) >= s.blockWidth) {
        // Complete Miss -> Game Over
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_tower_stack',
          gameTitle: '복셀 타워 스택',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: false
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
        return;
      } else {
        // Slice block
        s.combo = 0;
        newWidth = s.blockWidth - Math.abs(diff);
        newX = prevBlock.x + (diff / 2);
        s.score += 100;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
    } else {
      diff = s.blockZ - prevBlock.z;
      if (Math.abs(diff) < 0.35) {
        diff = 0;
        newZ = prevBlock.z;
        s.combo += 1;
        s.score += 250;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else if (Math.abs(diff) >= s.blockDepth) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_tower_stack',
          gameTitle: '복셀 타워 스택',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: false
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
        return;
      } else {
        s.combo = 0;
        newDepth = s.blockDepth - Math.abs(diff);
        newZ = prevBlock.z + (diff / 2);
        s.score += 100;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
    }

    s.blockWidth = newWidth;
    s.blockDepth = newDepth;
    s.currentBlockMesh.position.set(newX, s.currentFloor * s.blockHeight, newZ);
    s.currentBlockMesh.scale.set(newWidth / 8, 1, newDepth / 8);

    s.stack.push({
      mesh: s.currentBlockMesh,
      x: newX,
      y: s.currentFloor * s.blockHeight,
      z: newZ,
      width: newWidth,
      depth: newDepth
    });

    s.currentFloor += 1;
    setFloorCount(s.currentFloor);
    setCombo(s.combo);
    setScore(s.score);

    // Check Victory
    if (s.currentFloor >= targetFloors) {
      s.isVictory = true;
      s.isGameOver = true;
      setIsGameOver(true);
      const duration = (Date.now() - s.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'voxel_tower_stack',
        gameTitle: '복셀 타워 스택',
        durationSeconds: duration,
        score: s.score + 2500,
        difficulty: 'HARD',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      return;
    }

    // Spawn Next Moving Block
    s.axis = s.axis === 'x' ? 'z' : 'x';
    s.moveDir = 1;

    const nextGeo = new THREE.BoxGeometry(8, s.blockHeight, 8);
    const nextMat = new THREE.MeshStandardMaterial({
      color: blockColors[s.currentFloor % blockColors.length],
      roughness: 0.3
    });
    const nextMesh = new THREE.Mesh(nextGeo, nextMat);
    nextMesh.scale.set(newWidth / 8, 1, newDepth / 8);

    if (s.axis === 'x') {
      s.blockX = -12;
      s.blockZ = newZ;
    } else {
      s.blockX = newX;
      s.blockZ = -12;
    }

    nextMesh.position.set(s.blockX, s.currentFloor * s.blockHeight, s.blockZ);
    s.scene.add(nextMesh);
    s.currentBlockMesh = nextMesh;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(16, 20, 20);
    camera.lookAt(0, 5, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(15, 35, 20);
    scene.add(dirLight);

    // Base Platform Block
    const baseGeo = new THREE.BoxGeometry(8, 1.2, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, 0, 0);
    scene.add(baseMesh);

    stateRef.current.stack = [{ mesh: baseMesh, x: 0, y: 0, z: 0, width: 8, depth: 8 }];
    stateRef.current.currentFloor = 1;
    setFloorCount(1);

    // Initial 1st moving block
    const firstGeo = new THREE.BoxGeometry(8, 1.2, 8);
    const firstMat = new THREE.MeshStandardMaterial({ color: blockColors[0], roughness: 0.3 });
    const firstMesh = new THREE.Mesh(firstGeo, firstMat);
    firstMesh.position.set(-12, 1.2, 0);
    scene.add(firstMesh);

    stateRef.current.currentBlockMesh = firstMesh;
    stateRef.current.blockX = -12;
    stateRef.current.blockZ = 0;
    stateRef.current.axis = 'x';

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Move current floating block back and forth
      if (s.currentBlockMesh) {
        if (s.axis === 'x') {
          s.blockX += s.moveDir * s.speed * dt;
          if (s.blockX > 12) { s.blockX = 12; s.moveDir = -1; }
          if (s.blockX < -12) { s.blockX = -12; s.moveDir = 1; }
          s.currentBlockMesh.position.x = s.blockX;
        } else {
          s.blockZ += s.moveDir * s.speed * dt;
          if (s.blockZ > 12) { s.blockZ = 12; s.moveDir = -1; }
          if (s.blockZ < -12) { s.blockZ = -12; s.moveDir = 1; }
          s.currentBlockMesh.position.z = s.blockZ;
        }
      }

      // Camera smoothly tracks tower height
      const targetCamY = s.currentFloor * 1.2 + 8;
      camera.position.y += (targetCamY - camera.position.y) * 4 * dt;
      camera.lookAt(0, s.currentFloor * 1.2, 0);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = stateRef.current;
    s.currentFloor = 1;
    s.blockWidth = 8;
    s.blockDepth = 8;
    s.combo = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.stack.forEach((b, i) => { if (i > 0) s.scene?.remove(b.mesh); });
    if (s.currentBlockMesh) s.scene?.remove(s.currentBlockMesh);

    s.stack = [s.stack[0]];
    const firstGeo = new THREE.BoxGeometry(8, 1.2, 8);
    const firstMat = new THREE.MeshStandardMaterial({ color: blockColors[0], roughness: 0.3 });
    const firstMesh = new THREE.Mesh(firstGeo, firstMat);
    firstMesh.position.set(-12, 1.2, 0);
    s.scene?.add(firstMesh);

    s.currentBlockMesh = firstMesh;
    s.blockX = -12;
    s.blockZ = 0;
    s.axis = 'x';

    setFloorCount(1);
    setCombo(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 20층 스카이라인 건설' : 'STEP 1: TOWER STACK',
      title: isKo ? '20층 초고층 빌딩 완성' : 'Reach 20th Floor Skyline',
      description: isKo
        ? '움직이는 복셀 블록을 타이밍에 맞춰 정밀하게 스택하여 20층 높이까지 도달하세요.'
        : 'Snap moving voxel blocks in rhythm to construct a 20-floor skyscraper.',
      keyPoints: isKo
        ? [
            '20층 도달 시 완승',
            '오차 범위가 클수록 블록 크기 축소',
            '완전 빗나갈 경우 타워 붕괴'
          ]
        : [
            'Reach 20 floors to win',
            'Misalignment slices block size',
            'Total miss causes tower collapse'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원터치 탭 스택 스냅' : 'One-Tap Precision Snap',
      description: isKo
        ? '가상 버튼 없이 화면 아무 곳이나 탭하여 블록을 아래 층과 완벽하게 정렬시켜 쌓습니다.'
        : 'Tap anywhere on screen to snap the moving block with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 화면 탭: 블록 즉시 낙하 스택',
            '✨ 퍼펙트 스냅: 콤보 보너스 +250P',
            '⚡ 3연속 퍼펙트 시 블록 크기 회복'
          ]
        : [
            '👆 Screen Tap: Instant block snap',
            '✨ Perfect Snap: Combo bonus +250P',
            '⚡ 3x Combo restores block size'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '타워 완공 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '도달 층수 및 연속 퍼펙트 콤보 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Floor height and combo bonuses',
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
        title={isKo ? '복셀 타워 스택' : 'Voxel Tower Stack'}
        language={language}
        telemetries={[
          { label: isKo ? '높이' : 'Floors', value: `${floorCount}F/${targetFloors}F`, color: 'text-emerald-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: combo > 1 ? 'text-pink-400 font-bold' : 'text-slate-400' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-yellow-300' }
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
          onClick={handlePlaceBlock}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-emerald-500/30 rounded-full text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 탭: 블록 정밀 스택 낙하 (버튼 없음)' : 'Tap Screen: Precision Stack Block (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_tower_stack"
          gameTitle={isKo ? '3D 복셀 타워 스택: 스카이라인 건설' : 'Voxel Tower Stack: Skyline Builder'}
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
export default VoxelTowerStackGame;

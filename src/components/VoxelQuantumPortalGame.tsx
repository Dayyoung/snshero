import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelQuantumPortalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelQuantumPortalGame: React.FC<VoxelQuantumPortalGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_quantum_portal') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [puzzlesSolved, setPuzzlesSolved] = useState<number>(0);
  const targetPuzzles = 3;
  const [bluePortalActive, setBluePortalActive] = useState<boolean>(false);
  const [orangePortalActive, setOrangePortalActive] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posZ: 8,
    rotY: 0,
    moveDir: new THREE.Vector2(0, 0),
    bluePortal: null as THREE.Mesh | null,
    orangePortal: null as THREE.Mesh | null,
    puzzlesSolved: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    playerMesh: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const shootPortal = (type: 'blue' | 'orange') => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const pGeo = new THREE.TorusGeometry(1.2, 0.15, 8, 24);
    const pMat = new THREE.MeshStandardMaterial({
      color: type === 'blue' ? 0x06b6d4 : 0xf59e0b,
      emissive: type === 'blue' ? 0x0891b2 : 0xd97706
    });

    const targetX = (type === 'blue' ? -1 : 1) * (4 + s.puzzlesSolved * 2);
    const targetZ = -8 - s.puzzlesSolved * 4;

    if (type === 'blue') {
      if (s.bluePortal) s.scene.remove(s.bluePortal);
      const bMesh = new THREE.Mesh(pGeo, pMat);
      bMesh.position.set(targetX, 1.6, targetZ);
      s.scene.add(bMesh);
      s.bluePortal = bMesh;
      setBluePortalActive(true);
    } else {
      if (s.orangePortal) s.scene.remove(s.orangePortal);
      const oMesh = new THREE.Mesh(pGeo, pMat);
      oMesh.position.set(targetX, 1.6, targetZ);
      s.scene.add(oMesh);
      s.orangePortal = oMesh;
      setOrangePortalActive(true);
    }

    if (s.bluePortal && s.orangePortal) {
      s.puzzlesSolved += 1;
      s.score += 400;
      setPuzzlesSolved(s.puzzlesSolved);
      setScore(s.score);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Clear portals for next puzzle
      setTimeout(() => {
        if (s.bluePortal) s.scene?.remove(s.bluePortal);
        if (s.orangePortal) s.scene?.remove(s.orangePortal);
        s.bluePortal = null;
        s.orangePortal = null;
        setBluePortalActive(false);
        setOrangePortalActive(false);
      }, 800);

      if (s.puzzlesSolved >= targetPuzzles && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_quantum_portal',
          gameTitle: '복셀 퀀텀 포탈',
          durationSeconds: duration,
          score: s.score + 2000,
          difficulty: 'HARD',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, 10, 16);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(10, 25, 10);
    scene.add(dirLight);

    // Chamber Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Avatar
    const pGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x6366f1 }));
    pBody.position.y = 0.8;
    pGroup.add(pBody);

    pGroup.position.set(0, 0, 8);
    scene.add(pGroup);
    stateRef.current.playerMesh = pGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Move player
      const speed = 10;
      s.posX += s.moveDir.x * speed * dt;
      s.posZ += s.moveDir.y * speed * dt;
      s.posX = THREE.MathUtils.clamp(s.posX, -20, 20);
      s.posZ = THREE.MathUtils.clamp(s.posZ, -20, 20);

      if (s.moveDir.length() > 0.1) {
        s.rotY = Math.atan2(s.moveDir.x, s.moveDir.y);
      }

      if (pGroup) {
        pGroup.position.set(s.posX, 0, s.posZ);
        pGroup.rotation.y = s.rotY;
      }

      // Camera follow
      camera.position.set(s.posX, 10, s.posZ + 14);
      camera.lookAt(s.posX, 1, s.posZ);

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
    s.posX = 0;
    s.posZ = 8;
    s.rotY = 0;
    s.puzzlesSolved = 0;
    s.score = 0;
    if (s.bluePortal) s.scene?.remove(s.bluePortal);
    if (s.orangePortal) s.scene?.remove(s.orangePortal);
    s.bluePortal = null;
    s.orangePortal = null;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setPuzzlesSolved(0);
    setScore(0);
    setBluePortalActive(false);
    setOrangePortalActive(false);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 퀀텀 포탈 퍼즐' : 'STEP 1: QUANTUM PUZZLE',
      title: isKo ? '블루/오렌지 포탈 3단계 연결' : 'Link Portals Across 3 Stages',
      description: isKo
        ? '시공간 챔버에서 블루 포탈과 오렌지 포탈을 쌍으로 생성하여 3개의 퍼즐을 돌파하세요.'
        : 'Cast paired blue and orange portals in the chamber room to solve 3 spatial puzzles.',
      keyPoints: isKo
        ? [
            '3단계 시공간 퍼즐 해결 시 승리',
            '블루 + 오렌지 포탈 한 쌍 완성 시 통과',
            '단계마다 +400P 보너스 획득'
          ]
        : [
            'Solve 3 spatial puzzles to win',
            'Link paired Blue + Orange portals',
            '+400P bonus points per puzzle'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 이동 & 화면 좌/우 탭 발사' : 'Drag Move & Left/Right Portal Tap',
      description: isKo
        ? '가상 버튼 없이 드래그로 이동하고, 화면 좌측 탭은 블루 포탈, 우측 탭은 오렌지 포탈을 발사합니다.'
        : 'Drag anywhere to move, and tap left screen for Blue portal, right screen for Orange portal with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 챔버 360° 이동',
            '🔷 화면 좌측 탭: 블루 포탈 발사',
            '🔶 화면 우측 탭: 오렌지 포탈 발사'
          ]
        : [
            '👆 Drag: Smooth 360° chamber move',
            '🔷 Tap Left: Shoot Blue Portal',
            '🔶 Tap Right: Shoot Orange Portal'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '퍼즐 돌파 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '스피드 탈출 및 포탈 연결 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Speed and portal pairing bonuses',
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
        title={isKo ? '복셀 퀀텀 포탈' : 'Voxel Quantum Portal'}
        language={language}
        telemetries={[
          { label: isKo ? '퍼즐' : 'Puzzle', value: `${puzzlesSolved}/${targetPuzzles}`, color: 'text-amber-300' },
          { label: isKo ? '블루' : 'Blue', value: bluePortalActive ? 'OPEN' : 'READY', color: bluePortalActive ? 'text-cyan-400 font-bold' : 'text-slate-400' },
          { label: isKo ? '오렌지' : 'Orange', value: orangePortalActive ? 'OPEN' : 'READY', color: orangePortalActive ? 'text-orange-400 font-bold' : 'text-slate-400' },
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
          className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                moved = true;
                stateRef.current.moveDir.x = Math.abs(dx) > 8 ? (dx > 0 ? 1 : -1) : 0;
                stateRef.current.moveDir.y = Math.abs(dy) > 8 ? (dy > 0 ? 1 : -1) : 0;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.x = 0;
              stateRef.current.moveDir.y = 0;

              if (!moved) {
                // Tap Left Half (Blue) / Right Half (Orange)
                if (startX < rect.width / 2) {
                  shootPortal('blue');
                } else {
                  shootPortal('orange');
                }
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 이동 | 좌측 탭: 블루 포탈 | 우측 탭: 오렌지 포탈 (버튼 없음)' : 'Drag: Move | Tap Left: Blue Portal | Tap Right: Orange Portal (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_quantum_portal"
          gameTitle={isKo ? '3D 복셀 퀀텀 포탈: 시공간 퍼즐' : 'Voxel Quantum Portal: Spatial Puzzle'}
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
export default VoxelQuantumPortalGame;

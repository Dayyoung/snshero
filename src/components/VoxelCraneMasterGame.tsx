import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCraneMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ContainerBox {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  rotY: number;
  color: number;
  isLoaded: boolean;
}

export const VoxelCraneMasterGame: React.FC<VoxelCraneMasterGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_crane_master') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const totalContainers = 8;
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    craneX: 0,
    craneZ: 0,
    hoistY: 6,
    isGrabbing: false,
    heldBox: null as ContainerBox | null,
    heldRot: 0,
    loaded: 0,
    score: 0,
    timeLeft: 60,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    containers: [] as ContainerBox[],
    shipSlots: [] as { x: number; z: number; occupied: boolean }[],
    hoistMesh: null as THREE.Mesh | null
  });

  const toggleMagnet = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    if (s.heldBox) {
      // Release Container
      const box = s.heldBox;
      let placedOnShip = false;
      for (const slot of s.shipSlots) {
        if (!slot.occupied && Math.abs(s.craneX - slot.x) < 2.5 && Math.abs(s.craneZ - slot.z) < 2.5) {
          slot.occupied = true;
          box.x = slot.x;
          box.z = slot.z;
          box.y = 1.0;
          box.mesh.position.set(box.x, box.y, box.z);
          box.isLoaded = true;
          placedOnShip = true;
          s.loaded += 1;
          s.score += 200;
          setLoadedCount(s.loaded);
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

          if (s.loaded >= totalContainers) {
            endGame(true);
          }
          break;
        }
      }

      if (!placedOnShip) {
        // Dropped back onto pier
        box.y = 1.0;
        box.mesh.position.set(s.craneX, box.y, s.craneZ);
      }

      s.heldBox = null;
      s.isGrabbing = false;
    } else {
      // Grab nearest container
      let nearest: ContainerBox | null = null;
      let minDist = 3.0;

      for (const box of s.containers) {
        if (box.isLoaded) continue;
        const d = Math.hypot(box.x - s.craneX, box.z - s.craneZ);
        if (d < minDist) {
          minDist = d;
          nearest = box;
        }
      }

      if (nearest) {
        s.heldBox = nearest;
        s.isGrabbing = true;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    }
  };

  const rotateContainer = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || !s.heldBox) return;
    s.heldRot = (s.heldRot + Math.PI / 2) % (Math.PI * 2);
    s.heldBox.mesh.rotation.y = s.heldRot;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const moveCraneDir = (dx: number, dz: number) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    s.craneX = Math.max(-14, Math.min(14, s.craneX + dx * 2.0));
    s.craneZ = Math.max(-10, Math.min(10, s.craneZ + dz * 2.0));
  };

  const endGame = (isVictory: boolean) => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'voxel_crane_master',
      gameTitle: '복셀 크레인 마스터',
      durationSeconds: duration,
      score: s.score + (isVictory ? 1000 : 0),
      difficulty: 'HARD',
      isVictory
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 30, 100);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 24, 28);
    camera.lookAt(0, 2, -2);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(30, 50, 30);
    scene.add(dirLight);

    // Pier Ground & Ocean
    const pierGeo = new THREE.PlaneGeometry(36, 14);
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const pier = new THREE.Mesh(pierGeo, pierMat);
    pier.rotation.x = -Math.PI / 2;
    pier.position.set(0, 0, 5);
    scene.add(pier);

    const waterGeo = new THREE.PlaneGeometry(60, 20);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.2, -8);
    scene.add(water);

    // Cargo Ship
    const shipGeo = new THREE.BoxGeometry(26, 2, 8);
    const shipMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const ship = new THREE.Mesh(shipGeo, shipMat);
    ship.position.set(0, 0.2, -6);
    scene.add(ship);

    // Ship Cargo Slots (8 slots)
    stateRef.current.shipSlots = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const sx = (col - 1.5) * 5.2;
        const sz = -7.5 + row * 3.2;
        stateRef.current.shipSlots.push({ x: sx, z: sz, occupied: false });

        const slotOutline = new THREE.Mesh(
          new THREE.PlaneGeometry(4.4, 2.4),
          new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true })
        );
        slotOutline.rotation.x = -Math.PI / 2;
        slotOutline.position.set(sx, 1.25, sz);
        scene.add(slotOutline);
      }
    }

    // Hoist Mesh
    const hoistGeo = new THREE.BoxGeometry(3.6, 0.4, 2.0);
    const hoistMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const hoist = new THREE.Mesh(hoistGeo, hoistMat);
    scene.add(hoist);
    stateRef.current.hoistMesh = hoist;

    // Spawn 8 Containers on Pier
    const boxGeo = new THREE.BoxGeometry(4.0, 1.8, 2.0);
    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4, 0xec4899, 0x84cc16];
    stateRef.current.containers = [];

    for (let i = 0; i < totalContainers; i++) {
      const cMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.5 });
      const cMesh = new THREE.Mesh(boxGeo, cMat);
      const cx = (i % 4 - 1.5) * 5.5;
      const cz = 3 + Math.floor(i / 4) * 3.5;
      cMesh.position.set(cx, 1.0, cz);
      scene.add(cMesh);

      stateRef.current.containers.push({
        mesh: cMesh,
        x: cx,
        y: 1.0,
        z: cz,
        rotY: 0,
        color: colors[i % colors.length],
        isLoaded: false
      });
    }

    // Timer Interval
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);

      if (s.timeLeft <= 0) {
        endGame(s.loaded >= 4);
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

      // Update Hoist Position
      if (s.hoistMesh) {
        s.hoistMesh.position.set(s.craneX, s.hoistY, s.craneZ);
      }

      // Update Held Box
      if (s.heldBox) {
        s.heldBox.mesh.position.set(s.craneX, s.hoistY - 1.1, s.craneZ);
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
    s.craneX = 0;
    s.craneZ = 0;
    s.loaded = 0;
    s.score = 0;
    s.timeLeft = 60;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.heldBox = null;
    s.isGrabbing = false;
    setLoadedCount(0);
    setScore(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 크레인 마스터' : 'Voxel Crane Master'}
        language={language}
        telemetries={[
          { label: isKo ? '적재' : 'Loaded', value: `${loadedCount}/${totalContainers}개`, color: 'text-amber-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-300' },
          { label: isKo ? '남은시간' : 'Time', value: `${timeLeft}s`, color: 'text-cyan-300' }
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

              if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
                moved = true;
                const dirX = Math.abs(dx) > 12 ? (dx > 0 ? 0.35 : -0.35) : 0;
                const dirZ = Math.abs(dy) > 12 ? (dy > 0 ? 0.35 : -0.35) : 0;
                moveCraneDir(dirX, dirZ);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Toggle Magnet Grab / Drop
                toggleMagnet();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={rotateContainer}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 크레인 이동 | 탭: 전자석 흡착/배치 | 더블탭: 회전 (버튼 없음)' : 'Drag: Move Crane | Tap: Magnet Grab/Drop | Double Tap: Rotate (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_crane_master"
          gameTitle={isKo ? '3D 복셀 크레인 마스터: 항만 컨테이너 적재' : 'Voxel Crane Master: Port Cargo Loader'}
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

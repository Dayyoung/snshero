import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
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

interface BuildingTarget {
  mesh: THREE.Group;
  fireGroup: THREE.Group;
  fireHealth: number;
  maxFireHealth: number;
  rescued: boolean;
  x: number;
  z: number;
}

export const VoxelFireRescueGame: React.FC<VoxelFireRescueGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_fire_rescue') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [extinguishedCount, setExtinguishedCount] = useState<number>(0);
  const totalBuildings = 6;
  const [waterTank, setWaterTank] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    truckPos: new THREE.Vector3(0, 0.5, 0),
    truckRot: 0,
    speed: 0,
    isWaterSpraying: false,
    waterTank: 100,
    score: 0,
    extinguished: 0,
    timeLeft: 60,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    buildings: [] as BuildingTarget[],
    waterParticles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    truckMesh: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const handleMobileSpray = (active: boolean) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    s.isWaterSpraying = active;
    if (active) {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  };

  const handleMobileThrottle = (dir: number) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    s.speed = dir * 14;
  };

  const handleMobileTurn = (dir: number) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    s.truckRot += dir * 0.4;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181a24);
    scene.fog = new THREE.FogExp2(0x181a24, 0.018);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.4);
    sun.position.set(30, 60, 30);
    scene.add(sun);

    // City Ground Grid
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Firetruck Mesh
    const truckGroup = new THREE.Group();
    const truckBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 4.2), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    truckBody.position.y = 0.7;
    truckGroup.add(truckBody);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 1.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cabin.position.set(0, 1.4, -0.8);
    truckGroup.add(cabin);

    scene.add(truckGroup);
    stateRef.current.truckMesh = truckGroup;

    // Spawn 6 Burning Buildings
    stateRef.current.buildings = [];
    const bCoords = [[-14, -14], [14, -14], [-14, 14], [14, 14], [-20, 0], [20, 0]];

    bCoords.forEach(([bx, bz]) => {
      const bGroup = new THREE.Group();
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      bMesh.position.y = 4;
      bGroup.add(bMesh);

      // Fire Group
      const fireGroup = new THREE.Group();
      for (let f = 0; f < 3; f++) {
        const fireMesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.8, 2, 8),
          new THREE.MeshBasicMaterial({ color: 0xf97316 })
        );
        fireMesh.position.set((f - 1) * 1.2, 8.5, 0);
        fireGroup.add(fireMesh);
      }
      bGroup.add(fireGroup);

      bGroup.position.set(bx, 0, bz);
      scene.add(bGroup);

      stateRef.current.buildings.push({
        mesh: bGroup,
        fireGroup,
        fireHealth: 100,
        maxFireHealth: 100,
        rescued: false,
        x: bx,
        z: bz
      });
    });

    // Timer Interval
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);

      if (s.timeLeft <= 0) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_fire_rescue',
          gameTitle: '복셀 파이어 레스큐',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: s.extinguished >= 3
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

      // Update Truck Position
      s.truckPos.x += Math.sin(s.truckRot) * s.speed * dt;
      s.truckPos.z += Math.cos(s.truckRot) * s.speed * dt;
      s.truckPos.x = THREE.MathUtils.clamp(s.truckPos.x, -35, 35);
      s.truckPos.z = THREE.MathUtils.clamp(s.truckPos.z, -35, 35);

      if (truckGroup) {
        truckGroup.position.copy(s.truckPos);
        truckGroup.rotation.y = s.truckRot;
      }

      // Camera Follow
      camera.position.set(
        s.truckPos.x - Math.sin(s.truckRot) * 14,
        10,
        s.truckPos.z - Math.cos(s.truckRot) * 14
      );
      camera.lookAt(s.truckPos.x, 2, s.truckPos.z);

      // Water Spraying & Extinguishing
      if (s.isWaterSpraying && s.waterTank > 0) {
        s.waterTank = Math.max(0, s.waterTank - dt * 15);
        setWaterTank(Math.round(s.waterTank));

        // Check distance to burning buildings
        s.buildings.forEach(b => {
          if (b.fireHealth > 0) {
            const dist = Math.hypot(b.x - s.truckPos.x, b.z - s.truckPos.z);
            if (dist < 14) {
              b.fireHealth = Math.max(0, b.fireHealth - dt * 45);
              if (b.fireHealth <= 0) {
                b.fireGroup.visible = false;
                s.extinguished += 1;
                s.score += 300;
                setExtinguishedCount(s.extinguished);
                setScore(s.score);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

                if (s.extinguished >= totalBuildings) {
                  s.isGameOver = true;
                  setIsGameOver(true);
                  const duration = (Date.now() - s.startTime) / 1000;
                  const receipt = calculateAndDepositMissionReward({
                    gameId: 'voxel_fire_rescue',
                    gameTitle: '복셀 파이어 레스큐',
                    durationSeconds: duration,
                    score: s.score + 1000,
                    difficulty: 'HARD',
                    isVictory: true
                  });
                  setSettlementReceipt(receipt);
                  onReward(receipt.totalSns);
                }
              }
            }
          }
        });
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
    s.truckPos.set(0, 0.5, 0);
    s.truckRot = 0;
    s.speed = 0;
    s.extinguished = 0;
    s.waterTank = 100;
    s.score = 0;
    s.timeLeft = 60;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.buildings.forEach(b => {
      b.fireHealth = 100;
      b.fireGroup.visible = true;
    });
    setExtinguishedCount(0);
    setWaterTank(100);
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
        title={isKo ? '복셀 파이어 레스큐' : 'Voxel Fire Rescue'}
        language={language}
        telemetries={[
          { label: isKo ? '진압' : 'Extinguished', value: `${extinguishedCount}/${totalBuildings}채`, color: 'text-amber-300' },
          { label: isKo ? '물탱크' : 'Water', value: `${waterTank}%`, color: 'text-cyan-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-300' },
          { label: isKo ? '남은시간' : 'Time', value: `${timeLeft}s`, color: 'text-rose-300' }
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
            handleMobileSpray(true);

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 10) {
                moved = true;
                handleMobileTurn(dx > 0 ? -1 : 1);
              }
              if (Math.abs(dy) > 10) {
                moved = true;
                handleMobileThrottle(dy < 0 ? 1 : -1);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              handleMobileSpray(false);
              handleMobileThrottle(0);
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
          {isKo ? '드래그: 소방차 주행 조향 | 탭/홀드: 고압 방수포 분사 (버튼 없음)' : 'Drag: Drive Firetruck | Tap/Hold: Spray Water Cannon (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_fire_rescue"
          gameTitle={isKo ? '3D 복셀 파이어 레스큐: 도심 화재 진압' : 'Voxel Fire Rescue: City Fire'}
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

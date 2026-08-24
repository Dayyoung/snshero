import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCrazyTaxiGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Passenger {
  mesh: THREE.Group;
  x: number;
  z: number;
  destZ: number;
  farePoints: number;
  timeBonus: number;
  isPickedUp: boolean;
}

interface Obstacle {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  hit: boolean;
}

export const VoxelCrazyTaxiGame: React.FC<VoxelCrazyTaxiGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_crazy_taxi') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [passengersDelivered, setPassengersDelivered] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    taxiPos: new THREE.Vector3(0, 0.4, 0),
    taxiVel: new THREE.Vector3(0, 0, 18),
    taxiYaw: 0,
    taxiPitch: 0,
    taxiRoll: 0,
    taxiGroup: null as THREE.Group | null,
    steerDir: 0,
    isBoosting: false,
    boostGauge: 100,
    isJumping: false,
    jumpVel: 0,
    currentPassenger: null as Passenger | null,
    passengers: [] as Passenger[],
    obstacles: [] as Obstacle[],
    cityProps: [] as THREE.Mesh[],
    score: 0,
    deliveredCount: 0,
    timeLeft: 60,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    speed: 18
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0x38bdf8, 30, 90);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 4, -7);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Sunlight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfef08a, 1.8);
    sun.position.set(20, 40, 20);
    sun.castShadow = !lowSpecMode;
    scene.add(sun);

    // Infinite Road (Asphalt)
    const roadGeo = new THREE.PlaneGeometry(16, 200);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 80);
    scene.add(road);

    // Voxel Yellow Cab Mesh
    const taxiGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    taxiGroup.add(body);

    const cabinGeo = new THREE.BoxGeometry(1.5, 0.6, 2.0);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.1, -0.2);
    taxiGroup.add(cabin);

    const signGeo = new THREE.BoxGeometry(0.8, 0.25, 0.3);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfacc15, emissiveIntensity: 0.8 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.5, -0.2);
    taxiGroup.add(sign);

    scene.add(taxiGroup);
    stateRef.current.taxiGroup = taxiGroup;

    // Spawn Initial Passengers & Obstacles
    const spawnPassenger = (zPos: number) => {
      const pGroup = new THREE.Group();
      const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
      pBody.position.y = 0.6;
      pGroup.add(pBody);

      const px = (Math.random() - 0.5) * 10;
      pGroup.position.set(px, 0, zPos);
      scene.add(pGroup);

      stateRef.current.passengers.push({
        mesh: pGroup,
        x: px,
        z: zPos,
        destZ: zPos + 180 + Math.random() * 80,
        farePoints: 500,
        timeBonus: 8,
        isPickedUp: false
      });
    };

    const spawnObstacle = (zPos: number) => {
      const obsGeo = new THREE.BoxGeometry(1.6, 1.4, 3.2);
      const obsMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const obsMesh = new THREE.Mesh(obsGeo, obsMat);
      const ox = (Math.random() - 0.5) * 11;
      obsMesh.position.set(ox, 0.7, zPos);
      scene.add(obsMesh);

      stateRef.current.obstacles.push({
        mesh: obsMesh,
        x: ox,
        z: zPos,
        hit: false
      });
    };

    for (let i = 0; i < 6; i++) spawnPassenger(40 + i * 70);
    for (let i = 0; i < 12; i++) spawnObstacle(30 + i * 35);

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
          gameId: 'voxel_crazy_taxi',
          gameTitle: '복셀 크레이지 택시',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: s.deliveredCount >= 3
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

      // Speed & Nitro Boost
      const targetSpeed = s.isBoosting ? 38 : 22;
      s.speed = THREE.MathUtils.lerp(s.speed, targetSpeed, dt * 4);
      setSpeedKmh(Math.round(s.speed * 4.5));

      // Steering
      s.taxiPos.x = THREE.MathUtils.clamp(s.taxiPos.x + s.steerDir * 14 * dt, -6.5, 6.5);
      s.taxiPos.z += s.speed * dt;

      // Jump Physics
      if (s.isJumping) {
        s.taxiPos.y += s.jumpVel * dt;
        s.jumpVel -= 28 * dt; // Gravity
        if (s.taxiPos.y <= 0.4) {
          s.taxiPos.y = 0.4;
          s.isJumping = false;
          s.jumpVel = 0;
        }
      }

      if (s.taxiGroup) {
        s.taxiGroup.position.copy(s.taxiPos);
        s.taxiGroup.rotation.y = THREE.MathUtils.lerp(s.taxiGroup.rotation.y, -s.steerDir * 0.25, dt * 10);
      }

      // Camera Follow
      camera.position.set(s.taxiPos.x * 0.4, s.taxiPos.y + 3.2, s.taxiPos.z - 7.5);
      camera.lookAt(s.taxiPos.x * 0.8, s.taxiPos.y + 1.0, s.taxiPos.z + 10);

      // Passenger Pickup / Dropoff
      for (let p of s.passengers) {
        if (!p.isPickedUp && !s.currentPassenger) {
          if (Math.hypot(p.x - s.taxiPos.x, p.z - s.taxiPos.z) < 2.8) {
            p.isPickedUp = true;
            s.currentPassenger = p;
            scene.remove(p.mesh);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
        }
      }

      if (s.currentPassenger && s.taxiPos.z >= s.currentPassenger.destZ) {
        // Delivered!
        s.score += s.currentPassenger.farePoints;
        s.deliveredCount += 1;
        s.timeLeft += s.currentPassenger.timeBonus;
        setScore(s.score);
        setPassengersDelivered(s.deliveredCount);
        setTimeLeft(s.timeLeft);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');

        // Spawn next passenger ahead
        spawnPassenger(s.taxiPos.z + 100 + Math.random() * 60);
        s.currentPassenger = null;
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
    s.taxiPos.set(0, 0.4, 0);
    s.score = 0;
    s.deliveredCount = 0;
    s.timeLeft = 60;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.currentPassenger = null;
    setScore(0);
    setPassengersDelivered(0);
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
        title={isKo ? '복셀 크레이지 택시' : 'Voxel Crazy Taxi'}
        language={language}
        telemetries={[
          { label: isKo ? '승객수송' : 'Delivered', value: `${passengersDelivered}명`, color: 'text-emerald-300' },
          { label: isKo ? '매출' : 'Revenue', value: `${score}P`, color: 'text-amber-300' },
          { label: isKo ? '속도' : 'Speed', value: `${speedKmh}km/h`, color: 'text-cyan-300' },
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
          className="absolute inset-0 z-10 select-none touch-none"
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

              if (Math.abs(dx) > 10) {
                moved = true;
                stateRef.current.steerDir = dx > 0 ? 1 : -1;
              }
              if (dy < -20) {
                moved = true;
                stateRef.current.isBoosting = true;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.steerDir = 0;
              stateRef.current.isBoosting = false;

              if (!moved) {
                // Tap: Crazy Jump
                if (!stateRef.current.isJumping) {
                  stateRef.current.isJumping = true;
                  stateRef.current.jumpVel = 12;
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                }
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            stateRef.current.isBoosting = true;
            setTimeout(() => { stateRef.current.isBoosting = false; }, 1200);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-400/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 조향 | 탭: 점프 | 위로 드래그/더블탭: 니트로 부스트 (버튼 없음)' : 'Drag L/R: Steer | Tap: Jump | Drag Up/Double Tap: Nitro (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_crazy_taxi"
          gameTitle={isKo ? '3D 복셀 크레이지 택시: 시티 질주' : 'Voxel Crazy Taxi: City Rush'}
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

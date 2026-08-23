import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Flame, Clock, Navigation, CheckCircle } from 'lucide-react';
import { CardData } from '../types';

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

  const [score, setScore] = useState<number>(0);
  const [passengersDelivered, setPassengersDelivered] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [boostGauge, setBoostGauge] = useState<number>(100);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [hasPassenger, setHasPassenger] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    taxiPos: new THREE.Vector3(0, 0.4, 0),
    taxiVel: new THREE.Vector3(0, 0, 18),
    taxiYaw: 0,
    taxiPitch: 0,
    taxiRoll: 0,
    taxiGroup: null as THREE.Group | null,
    steerDir: 0, // -1 left, 1 right
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

    // Voxel Yellow Taxi Mesh
    const taxiGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.65, 2.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    body.castShadow = !lowSpecMode;
    taxiGroup.add(body);

    // Roof & Taxi Sign
    const roofGeo = new THREE.BoxGeometry(1.3, 0.5, 1.4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 1.05, -0.1);
    taxiGroup.add(roof);

    const signGeo = new THREE.BoxGeometry(0.6, 0.2, 0.3);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfde047, emissiveIntensity: 0.8 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.4, -0.1);
    taxiGroup.add(sign);

    // 4 Voxel Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const wheelPositions = [
      [-0.85, 0.35, 0.9],
      [0.85, 0.35, 0.9],
      [-0.85, 0.35, -0.9],
      [0.85, 0.35, -0.9]
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      taxiGroup.add(wheel);
    });

    scene.add(taxiGroup);
    stateRef.current.taxiGroup = taxiGroup;

    // Road Track with Asphalt & Sidewalks
    const roadWidth = 14;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, 800);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 350);
    road.receiveShadow = !lowSpecMode;
    scene.add(road);

    // Lane Markings
    for (let lz = 0; lz < 750; lz += 8) {
      const lineGeo = new THREE.PlaneGeometry(0.3, 4);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(0, 0.02, lz);
      scene.add(lineMesh);
    }

    // City Buildings & Props on sides
    const cityProps: THREE.Mesh[] = [];
    const buildingColors = [0x94a3b8, 0x64748b, 0x475569, 0x38bdf8, 0xf43f5e, 0x10b981, 0xa855f7];

    for (let bz = 0; bz < 750; bz += 18) {
      // Left side building
      const h1 = 8 + Math.random() * 20;
      const bGeo1 = new THREE.BoxGeometry(6, h1, 14);
      const bMat1 = new THREE.MeshStandardMaterial({ color: buildingColors[Math.floor(Math.random() * buildingColors.length)] });
      const bMesh1 = new THREE.Mesh(bGeo1, bMat1);
      bMesh1.position.set(-12, h1 / 2, bz);
      scene.add(bMesh1);
      cityProps.push(bMesh1);

      // Right side building
      const h2 = 8 + Math.random() * 20;
      const bGeo2 = new THREE.BoxGeometry(6, h2, 14);
      const bMat2 = new THREE.MeshStandardMaterial({ color: buildingColors[Math.floor(Math.random() * buildingColors.length)] });
      const bMesh2 = new THREE.Mesh(bGeo2, bMat2);
      bMesh2.position.set(12, h2 / 2, bz);
      scene.add(bMesh2);
      cityProps.push(bMesh2);
    }

    // Spawn Voxel Passengers & Obstacles along the track
    const passengers: Passenger[] = [];
    const obstacles: Obstacle[] = [];

    for (let pz = 50; pz < 720; pz += 60) {
      const pGroup = new THREE.Group();
      const pBodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.6);
      const pBodyMat = new THREE.MeshStandardMaterial({ color: 0xec4899 });
      const pBody = new THREE.Mesh(pBodyGeo, pBodyMat);
      pBody.position.y = 0.6;
      pGroup.add(pBody);

      // Voxel Money Icon Float
      const mGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
      const mMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const mMesh = new THREE.Mesh(mGeo, mMat);
      mMesh.position.y = 1.6;
      pGroup.add(mMesh);

      const px = (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 2);
      pGroup.position.set(px, 0, pz);
      scene.add(pGroup);

      passengers.push({
        mesh: pGroup,
        x: px,
        z: pz,
        destZ: pz + 70 + Math.random() * 50,
        farePoints: 500 + Math.floor(Math.random() * 300),
        timeBonus: 10,
        isPickedUp: false
      });
    }

    // Obstacles (Barricades & Traffic Cones)
    for (let oz = 30; oz < 740; oz += 25) {
      const ox = (Math.random() - 0.5) * 8;
      const oGeo = new THREE.ConeGeometry(0.4, 0.9, 8);
      const oMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
      const oMesh = new THREE.Mesh(oGeo, oMat);
      oMesh.position.set(ox, 0.45, oz);
      scene.add(oMesh);

      obstacles.push({
        mesh: oMesh,
        x: ox,
        z: oz,
        hit: false
      });
    }

    stateRef.current.passengers = passengers;
    stateRef.current.obstacles = obstacles;

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = stateRef.current;
      if (state.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Time countdown
      state.timeLeft -= dt;
      setTimeLeft(Math.max(0, Math.ceil(state.timeLeft)));

      if (state.timeLeft <= 0) {
        state.isGameOver = true;
        setIsGameOver(true);
        const reward = Math.min(260, Math.floor(state.score / 50) + state.deliveredCount * 30);
        setRewardSns(reward);
        onReward(reward);
      }

      // Boost Gauge Handling
      if (state.isBoosting && state.boostGauge > 0) {
        state.boostGauge -= 30 * dt;
        state.speed = 36;
      } else {
        state.isBoosting = false;
        state.boostGauge = Math.min(100, state.boostGauge + 15 * dt);
        state.speed = 22;
      }
      setBoostGauge(Math.round(state.boostGauge));
      setSpeedKmh(Math.round(state.speed * 4.2));

      // Steering
      const steerSpeed = 12;
      state.taxiPos.x += state.steerDir * steerSpeed * dt;
      state.taxiPos.x = Math.max(-5.5, Math.min(5.5, state.taxiPos.x));

      // Forward motion
      state.taxiPos.z += state.speed * dt;

      // Jump Physics
      if (state.isJumping) {
        state.jumpVel -= 28 * dt;
        state.taxiPos.y += state.jumpVel * dt;
        if (state.taxiPos.y <= 0.4) {
          state.taxiPos.y = 0.4;
          state.isJumping = false;
          state.jumpVel = 0;
        }
      }

      // Taxi Mesh Orientations
      if (state.taxiGroup) {
        state.taxiGroup.position.copy(state.taxiPos);
        state.taxiGroup.rotation.y = -state.steerDir * 0.25;
        state.taxiGroup.rotation.z = -state.steerDir * 0.15;
      }

      // Passenger Pickup / Delivery Collision
      for (const p of state.passengers) {
        if (!p.isPickedUp && !state.currentPassenger) {
          const dx = state.taxiPos.x - p.x;
          const dz = state.taxiPos.z - p.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 2.5) {
            p.isPickedUp = true;
            state.currentPassenger = p;
            scene.remove(p.mesh);
            setHasPassenger(true);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          }
        }
      }

      // Destination Check
      if (state.currentPassenger) {
        if (state.taxiPos.z >= state.currentPassenger.destZ) {
          // Delivered successfully!
          state.score += state.currentPassenger.farePoints;
          state.deliveredCount++;
          state.timeLeft += state.currentPassenger.timeBonus;
          setScore(state.score);
          setPassengersDelivered(state.deliveredCount);
          state.currentPassenger = null;
          setHasPassenger(false);
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
        }
      }

      // Obstacle Collision
      for (const obs of state.obstacles) {
        if (!obs.hit && Math.abs(state.taxiPos.z - obs.z) < 1.2 && Math.abs(state.taxiPos.x - obs.x) < 1.2 && state.taxiPos.y < 0.8) {
          obs.hit = true;
          obs.mesh.position.y += 3;
          state.speed = 10;
          state.timeLeft = Math.max(0, state.timeLeft - 2);
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      }

      // Camera Follow
      camera.position.set(state.taxiPos.x * 0.6, state.taxiPos.y + 3.8, state.taxiPos.z - 7.5);
      camera.lookAt(state.taxiPos.x, state.taxiPos.y + 1, state.taxiPos.z + 10);

      // Loop track when reaching end
      if (state.taxiPos.z > 700) {
        state.taxiPos.z = 20;
        state.passengers.forEach(p => { p.isPickedUp = false; scene.add(p.mesh); });
        state.obstacles.forEach(o => { o.hit = false; o.mesh.position.y = 0.45; });
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Key handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.steerDir = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.steerDir = 1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Shift') stateRef.current.isBoosting = true;
      if (e.key === ' ' && !stateRef.current.isJumping) {
        stateRef.current.isJumping = true;
        stateRef.current.jumpVel = 12;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && stateRef.current.steerDir === -1) stateRef.current.steerDir = 0;
      if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && stateRef.current.steerDir === 1) stateRef.current.steerDir = 0;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Shift') stateRef.current.isBoosting = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-sky-950 flex flex-col items-center select-none overflow-hidden font-mono">
      {/* 3D Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Header HUD */}
      <div className="relative z-10 w-full max-w-xl p-3 flex items-center justify-between pointer-events-auto bg-slate-900/85 backdrop-blur-sm border-b border-amber-500/40">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 text-xs font-bold rounded-sm border border-amber-500/40"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy size={14} />
            <span>{score.toLocaleString()}P</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle size={14} />
            <span>x{passengersDelivered}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400">
            <Clock size={14} />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Passenger Delivery Status */}
      <div className="relative z-10 mt-2 flex flex-col items-center pointer-events-none gap-1">
        {hasPassenger ? (
          <div className="px-4 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-sm tracking-wider flex items-center gap-1.5 animate-pulse">
            <Navigation size={14} />
            <span>{isKo ? '승객 탑승 중! 목적지로 질주하세요!' : 'PASSENGER ONBOARD! RUSH TO DESTINATION!'}</span>
          </div>
        ) : (
          <div className="px-3 py-0.5 bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-sm">
            {isKo ? '길가의 승객에게 접근하여 태우세요' : 'Drive near roadside passengers to pick up'}
          </div>
        )}
      </div>

      {/* Speedometer & Boost Bar */}
      <div className="absolute top-16 right-4 z-10 flex flex-col items-end pointer-events-none gap-1 bg-slate-950/70 p-2.5 rounded-sm border border-slate-800">
        <div className="text-xl font-black text-amber-400 tracking-wider">
          {speedKmh} <span className="text-[10px] text-slate-400">KM/H</span>
        </div>
        <div className="w-24 h-2 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
          <div className="h-full bg-cyan-400 transition-all duration-75" style={{ width: `${boostGauge}%` }} />
        </div>
        <span className="text-[9px] text-cyan-400 font-bold">NITRO BOOST</span>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
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
                // Swipe up: Nitro boost
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
        <div className="px-3 py-1 bg-black/70 border border-amber-400/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 조향 | 탭: 점프 | 위로 드래그/더블탭: 니트로 부스트 (버튼 없음)' : 'Drag L/R: Steer | Tap: Jump | Drag Up/Double Tap: Nitro (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '택시 운행 종료!' : 'SHIFT FINISHED!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '수송한 승객 수' : 'Delivered'}</span>
                <span className="text-emerald-400 font-bold">{passengersDelivered}명</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 운행 매출' : 'Total Revenue'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상 포인트' : 'SNS Reward'}</span>
                <span className="text-cyan-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-sm rounded-sm tracking-wider shadow-lg"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

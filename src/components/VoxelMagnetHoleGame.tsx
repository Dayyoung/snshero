import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Magnet, Sparkles, Timer, Zap, Expand } from 'lucide-react';
import { CardData } from '../types';

interface VoxelMagnetHoleGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface CityObject {
  mesh: THREE.Object3D;
  x: number;
  z: number;
  radius: number;
  points: number;
  swallowed: boolean;
  isFalling: boolean;
  fallSpeed: number;
}

export const VoxelMagnetHoleGame: React.FC<VoxelMagnetHoleGameProps> = ({
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
  const [holeSize, setHoleSize] = useState<number>(1.2);
  const [swallowedCount, setSwallowedCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [magnetCooldown, setMagnetCooldown] = useState<number>(0);
  const [bannerText, setBannerText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    holeX: 0,
    holeZ: 0,
    targetX: 0,
    targetZ: 0,
    holeRadius: 1.2,
    score: 0,
    swallowedCount: 0,
    timeLeft: 90,
    isGameOver: false,
    magnetPulseTime: 0,
    magnetCooldown: 0,
    cityObjects: [] as CityObject[],
    holeMesh: null as THREE.Group | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0x38bdf8, 30, 90);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 14, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Sunlight & City Ambience
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // Ground Road Grid
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = !lowSpecMode;
    scene.add(groundMesh);

    // Voxel Blackhole Mesh (Dark void cylinder + neon accretion disk)
    const holeGroup = new THREE.Group();

    const holeVoidGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.2, 32);
    const holeVoidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const holeVoid = new THREE.Mesh(holeVoidGeo, holeVoidMat);
    holeVoid.position.y = 0.05;
    holeGroup.add(holeVoid);

    const ringGeo = new THREE.RingGeometry(0.95, 1.15, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.12;
    holeGroup.add(ring);

    holeGroup.position.set(0, 0, 0);
    scene.add(holeGroup);
    stateRef.current.holeMesh = holeGroup;

    // City Props Spawner
    const objects: CityObject[] = [];

    // Helper: Small Hydrant / Trash Bin (radius ~0.4, req size > 0.8)
    const createTrashBin = (x: number, z: number) => {
      const geo = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.3, z);
      scene.add(mesh);
      return { mesh, x, z, radius: 0.4, points: 10, swallowed: false, isFalling: false, fallSpeed: 0 };
    };

    // Helper: Bench / Street Light (radius ~0.7, req size > 1.2)
    const createBench = (x: number, z: number) => {
      const geo = new THREE.BoxGeometry(0.9, 0.4, 0.4);
      const mat = new THREE.MeshStandardMaterial({ color: 0x854d0e });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.2, z);
      scene.add(mesh);
      return { mesh, x, z, radius: 0.7, points: 25, swallowed: false, isFalling: false, fallSpeed: 0 };
    };

    // Helper: Trees (radius ~1.2, req size > 1.8)
    const createTree = (x: number, z: number) => {
      const treeGroup = new THREE.Group();
      const trunkGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.6;
      treeGroup.add(trunk);

      const leafGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 1.8;
      treeGroup.add(leaf);

      treeGroup.position.set(x, 0, z);
      scene.add(treeGroup);
      return { mesh: treeGroup, x, z, radius: 1.2, points: 50, swallowed: false, isFalling: false, fallSpeed: 0 };
    };

    // Helper: Voxel Cars (radius ~1.8, req size > 2.5)
    const createCar = (x: number, z: number, color: number) => {
      const carGroup = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 2.4);
      const bodyMat = new THREE.MeshStandardMaterial({ color });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.4;
      carGroup.add(body);

      const roofGeo = new THREE.BoxGeometry(1.3, 0.5, 1.4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 0.85, -0.1);
      carGroup.add(roof);

      carGroup.position.set(x, 0, z);
      scene.add(carGroup);
      return { mesh: carGroup, x, z, radius: 1.8, points: 100, swallowed: false, isFalling: false, fallSpeed: 0 };
    };

    // Helper: Voxel Buildings (radius ~3.5, req size > 4.5)
    const createBuilding = (x: number, z: number, color: number) => {
      const h = 4 + Math.random() * 4;
      const bGeo = new THREE.BoxGeometry(3.0, h, 3.0);
      const bMat = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(bGeo, bMat);
      mesh.position.set(x, h / 2, z);
      scene.add(mesh);
      return { mesh, x, z, radius: 3.5, points: 250, swallowed: false, isFalling: false, fallSpeed: 0 };
    };

    // Populate City Scene
    for (let i = 0; i < 45; i++) {
      const x = (Math.random() - 0.5) * 65;
      const z = (Math.random() - 0.5) * 65;
      if (Math.hypot(x, z) < 3.0) continue;
      objects.push(createTrashBin(x, z));
    }

    for (let i = 0; i < 35; i++) {
      const x = (Math.random() - 0.5) * 65;
      const z = (Math.random() - 0.5) * 65;
      if (Math.hypot(x, z) < 4.0) continue;
      objects.push(createBench(x, z));
    }

    for (let i = 0; i < 28; i++) {
      const x = (Math.random() - 0.5) * 65;
      const z = (Math.random() - 0.5) * 65;
      if (Math.hypot(x, z) < 5.0) continue;
      objects.push(createTree(x, z));
    }

    const carColors = [0xef4444, 0xf59e0b, 0x3b82f6, 0x10b981, 0x8b5cf6];
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 65;
      const z = (Math.random() - 0.5) * 65;
      if (Math.hypot(x, z) < 6.0) continue;
      objects.push(createCar(x, z, carColors[i % carColors.length]));
    }

    const bldColors = [0x475569, 0x64748b, 0x94a3b8, 0x334155];
    for (let i = 0; i < 14; i++) {
      const x = (Math.random() - 0.5) * 65;
      const z = (Math.random() - 0.5) * 65;
      if (Math.hypot(x, z) < 9.0) continue;
      objects.push(createBuilding(x, z, bldColors[i % bldColors.length]));
    }

    stateRef.current.cityObjects = objects;

    // Timer Interval
    const timerInterval = setInterval(() => {
      const state = stateRef.current;
      if (state.isGameOver) return;

      if (state.magnetCooldown > 0) {
        state.magnetCooldown -= 1;
        setMagnetCooldown(state.magnetCooldown);
      }

      state.timeLeft -= 1;
      setTimeLeft(state.timeLeft);

      if (state.timeLeft <= 0) {
        state.isGameOver = true;
        setIsGameOver(true);
        const earnedSns = Math.min(260, Math.max(35, Math.floor(state.score * 0.15)));
        setRewardSns(earnedSns);
        onReward(earnedSns);
      }
    }, 1000);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const state = stateRef.current;

      if (!state.isGameOver) {
        // Move Blackhole
        state.holeX += (state.targetX - state.holeX) * 0.1;
        state.holeZ += (state.targetZ - state.holeZ) * 0.1;

        if (state.holeMesh) {
          state.holeMesh.position.set(state.holeX, 0, state.holeZ);
          state.holeMesh.scale.set(state.holeRadius, 1, state.holeRadius);
          // Spin accretion ring
          state.holeMesh.children[1].rotation.z += delta * 2.5;
        }

        // Camera Follow
        camera.position.set(state.holeX, 14 + state.holeRadius * 1.5, state.holeZ + 14 + state.holeRadius * 1.2);
        camera.lookAt(state.holeX, 0, state.holeZ);

        // Check Object Suction & Falling
        state.cityObjects.forEach(obj => {
          if (obj.swallowed) return;

          const dist = Math.hypot(state.holeX - obj.x, state.holeZ - obj.z);

          // Vacuum suction check
          const effectiveRadius = state.magnetPulseTime > 0 ? state.holeRadius * 2.2 : state.holeRadius;

          if (dist < effectiveRadius) {
            // Can be swallowed if hole is large enough for object
            if (state.holeRadius * 1.15 >= obj.radius) {
              obj.isFalling = true;
              // Pull to center
              obj.mesh.position.x += (state.holeX - obj.mesh.position.x) * 0.18;
              obj.mesh.position.z += (state.holeZ - obj.mesh.position.z) * 0.18;
              obj.fallSpeed += 0.04;
              obj.mesh.position.y -= obj.fallSpeed;
              obj.mesh.scale.multiplyScalar(0.92);

              if (obj.mesh.position.y < -3.0 || obj.mesh.scale.x < 0.05) {
                obj.swallowed = true;
                scene.remove(obj.mesh);

                state.swallowedCount += 1;
                state.score += obj.points;

                // Hole Expands
                state.holeRadius = Math.min(16.0, state.holeRadius + obj.points * 0.0035);
                setHoleSize(Number(state.holeRadius.toFixed(1)));
                setScore(state.score);
                setSwallowedCount(state.swallowedCount);

                setBannerText(isKo ? `🕳️ 사물 흡입! (+${obj.points}P)` : `🕳️ OBJECT CONSUMED! (+${obj.points}P)`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
              }
            }
          }
        });

        if (state.magnetPulseTime > 0) {
          state.magnetPulseTime -= delta;
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(timerInterval);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, isKo, playSfx]);

  // Touch Move Hole
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isGameOver) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const normX = (clientX / window.innerWidth - 0.5) * 2;
    const normY = (clientY / window.innerHeight - 0.5) * 2;

    stateRef.current.targetX = normX * 30;
    stateRef.current.targetZ = normY * 30;
  };

  // Magnet Vacuum Booster (Pulses for 3.5 seconds)
  const handleMagnetBoost = () => {
    const state = stateRef.current;
    if (state.magnetCooldown > 0 || isGameOver) return;

    state.magnetPulseTime = 3.5;
    state.magnetCooldown = 15;
    setMagnetCooldown(15);
    setBannerText(isKo ? '⚡ 10m 자석 진공 흡입 가동!!' : '⚡ 10M MAGNET VACUUM ENGAGED!!');
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none"
      onTouchMove={handleTouchMove}
      onMouseMove={handleTouchMove}
    >
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-purple-500/40 px-3 py-1.5 rounded-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs text-purple-300 font-bold">
            {isKo ? `점수: ${score}P` : `Score: ${score}`}
          </span>
          <span className="text-[10px] text-amber-400 font-bold">
            [{holeSize}m Ø]
          </span>
          <span className="text-[10px] text-slate-300 flex items-center gap-1">
            <Timer size={12} className="text-rose-400" />
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Hole Growth / Swallowed Counter */}
      <div className="absolute top-14 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 text-purple-300 px-2.5 py-1 rounded-sm text-xs font-bold w-fit">
          <Expand size={14} className="text-purple-400" />
          <span>{isKo ? `블랙홀 직경: ${holeSize}m` : `HOLE: ${holeSize}m`}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-sm text-[11px] font-bold w-fit">
          <span>{isKo ? `삼킨 사물: ${swallowedCount}개` : `Swallowed: ${swallowedCount}`}</span>
        </div>
      </div>

      {/* Banner Notification */}
      {bannerText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-purple-600/90 text-white px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg z-10 pointer-events-none animate-bounce">
          {bannerText}
        </div>
      )}

      {/* Mobile-First Magnet Vacuum Action Button */}
      <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center gap-2 z-10">
        <button
          onClick={handleMagnetBoost}
          disabled={magnetCooldown > 0}
          className={`w-full max-w-sm py-4 border text-slate-950 font-black text-base rounded-sm shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer transition-all active:scale-95 ${
            magnetCooldown > 0
              ? 'bg-slate-800 border-slate-700 text-slate-500'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-300'
          }`}
        >
          <Magnet size={20} className={magnetCooldown === 0 ? 'animate-bounce' : ''} />
          <span>
            {magnetCooldown > 0
              ? (isKo ? `⚡ 자석 쿨다운 (${magnetCooldown}초)` : `⚡ COOLDOWN (${magnetCooldown}s)`)
              : (isKo ? '⚡ 10m 자석 진공 흡입 부스터' : '⚡ 10M MAGNET VACUUM')}
          </span>
        </button>
        <p className="text-[11px] text-slate-300 bg-slate-900/80 px-3 py-0.5 rounded-sm border border-slate-700">
          {isKo ? '화면을 드래그하여 블랙홀을 이동하고 작은 사물부터 삼켜 거대화하세요!' : 'Drag screen to move blackhole and swallow city objects to grow!'}
        </p>
      </div>

      {/* Game Over Summary Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-purple-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-purple-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-purple-400 uppercase tracking-widest">
              {isKo ? '🏆 블랙홀 삼키기 완료!' : '🏆 BLACKHOLE TIME UP!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '최종 블랙홀 직경' : 'Final Hole Size'}</span>
                <span className="font-bold text-purple-300">{holeSize}m</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '삼킨 총 사물' : 'Total Swallowed'}</span>
                <span className="font-bold text-amber-300">{swallowedCount} 개</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최종 득점' : 'Final Score'}</span>
                <span className="font-bold text-indigo-300">{score} PTS</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                <span>{isKo ? '획득 SNS 보상' : 'Earned SNS'}</span>
                <span>+{rewardSns} SNS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all cursor-pointer"
              >
                {isKo ? '보상 수령 및 복귀' : 'Claim & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

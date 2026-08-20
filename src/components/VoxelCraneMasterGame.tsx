import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Anchor, Trophy, RotateCw, ArrowDown, Sparkles } from 'lucide-react';
import { CardData } from '../types';

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
  language: _language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [totalContainers] = useState<number>(8);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [hasMagnetGrab, setHasMagnetGrab] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    craneX: 0,
    craneZ: 0,
    hoistY: 6,
    isGrabbing: false,
    heldBox: null as ContainerBox | null,
    heldRot: 0,
    keys: {} as Record<string, boolean>,
    loaded: 0,
    score: 0,
    timeLeft: 60,
    isGameOver: false,
    containers: [] as ContainerBox[],
    shipSlots: [] as { x: number; z: number; occupied: boolean }[]
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'e') toggleMagnet();
      if (e.key.toLowerCase() === 'r') rotateContainer();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const toggleMagnet = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;

    if (s.heldBox) {
      // Release Container
      const box = s.heldBox;
      // Check if above a ship slot
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
          s.score += 30;
          setLoadedCount(s.loaded);
          setScore(s.score);
          if (playSfx) playSfx('/sounds/success.mp3');

          if (s.loaded >= 8) {
            endGame();
          }
          break;
        }
      }

      if (!placedOnShip) {
        box.y = 0.8;
        box.mesh.position.set(s.craneX, box.y, s.craneZ);
      }

      s.heldBox = null;
      setHasMagnetGrab(false);
    } else {
      // Try to grab nearest unplaced container
      for (const box of s.containers) {
        if (!box.isLoaded) {
          const dx = box.x - s.craneX;
          const dz = box.z - s.craneZ;
          if (Math.abs(dx) < 2.2 && Math.abs(dz) < 2.2) {
            s.heldBox = box;
            setHasMagnetGrab(true);
            if (playSfx) playSfx('/sounds/magnet_attach.mp3');
            break;
          }
        }
      }
    }
  };

  const rotateContainer = () => {
    const s = stateRef.current;
    if (s.heldBox) {
      s.heldRot += Math.PI / 2;
      s.heldBox.mesh.rotation.y = s.heldRot;
      if (playSfx) playSfx('/sounds/rotate.mp3');
    }
  };

  const endGame = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);
    const finalSns = Math.min(260, Math.max(30, s.score * 3 + 40));
    setRewardSns(finalSns);
    onReward(finalSns);
    if (playSfx) playSfx('/sounds/fanfare.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0284c7); // Sea blue
    scene.fog = new THREE.FogExp2(0x0284c7, 0.012);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffedd5, 1.3);
    sun.position.set(30, 60, 40);
    scene.add(sun);

    // Port Dock Ground
    const dockGeo = new THREE.PlaneGeometry(30, 60);
    const dockMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const dock = new THREE.Mesh(dockGeo, dockMat);
    dock.rotation.x = -Math.PI / 2;
    dock.position.set(-15, 0, 0);
    scene.add(dock);

    // Water Surface
    const waterGeo = new THREE.PlaneGeometry(60, 60);
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x0369a1 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(20, -0.2, 0);
    scene.add(water);

    // Cargo Ship Hull in Water
    const shipGroup = new THREE.Group();
    shipGroup.position.set(16, 0.5, 0);
    const hullMesh = new THREE.Mesh(
      new THREE.BoxGeometry(14, 3, 46),
      new THREE.MeshLambertMaterial({ color: 0xb91c1c })
    );
    hullMesh.position.y = 0;
    shipGroup.add(hullMesh);

    // Ship Cargo Hold Slots (4 x 2 Grid)
    const shipSlots: { x: number; z: number; occupied: boolean }[] = [];
    for (let rx = 0; rx < 2; rx++) {
      for (let rz = 0; rz < 4; rz++) {
        const sx = 13 + rx * 5.5;
        const sz = -15 + rz * 10;
        shipSlots.push({ x: sx, z: sz, occupied: false });

        // Slot Marker Outline
        const marker = new THREE.Mesh(
          new THREE.BoxGeometry(4.5, 0.1, 8.5),
          new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true })
        );
        marker.position.set(sx, 1.6, sz);
        scene.add(marker);
      }
    }
    stateRef.current.shipSlots = shipSlots;
    scene.add(shipGroup);

    // Spawn Port Container Stack
    const cColors = [0x2563eb, 0xd97706, 0x16a34a, 0x9333ea];
    const containers: ContainerBox[] = [];
    for (let i = 0; i < 8; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = -18 + col * 5.5;
      const cz = -15 + row * 10;
      const color = cColors[i % cColors.length];

      const cMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 2.2, 8.2),
        new THREE.MeshLambertMaterial({ color })
      );
      cMesh.position.set(cx, 1.1, cz);
      scene.add(cMesh);

      containers.push({
        mesh: cMesh,
        x: cx,
        y: 1.1,
        z: cz,
        rotY: 0,
        color,
        isLoaded: false
      });
    }
    stateRef.current.containers = containers;

    // Gantry Crane Mesh
    const craneGroup = new THREE.Group();
    const gantryMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });

    // Gantry Frame Columns
    const col1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 16, 1.2), gantryMat);
    col1.position.set(-25, 8, 0);
    craneGroup.add(col1);

    const col2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 16, 1.2), gantryMat);
    col2.position.set(25, 8, 0);
    craneGroup.add(col2);

    // Horizontal Girder
    const girder = new THREE.Mesh(new THREE.BoxGeometry(52, 1.5, 2.5), gantryMat);
    girder.position.set(0, 16, 0);
    craneGroup.add(girder);

    // Trolley & Magnet
    const trolley = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 4),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    trolley.position.set(0, 15, 0);
    craneGroup.add(trolley);

    const magnet = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.6, 6),
      new THREE.MeshLambertMaterial({ color: 0xef4444 })
    );
    magnet.position.set(0, 6, 0);
    craneGroup.add(magnet);

    scene.add(craneGroup);

    // Timer Interval
    const timer = setInterval(() => {
      const s = stateRef.current;
      if (s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);
      if (s.timeLeft <= 0) {
        endGame();
      }
    }, 1000);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Crane Trolley Controls
      const keys = s.keys;
      if (keys['w'] || keys['arrowup']) s.craneZ -= 0.35;
      if (keys['s'] || keys['arrowdown']) s.craneZ += 0.35;
      if (keys['a'] || keys['arrowleft']) s.craneX -= 0.35;
      if (keys['d'] || keys['arrowright']) s.craneX += 0.35;

      s.craneX = Math.max(-22, Math.min(22, s.craneX));
      s.craneZ = Math.max(-25, Math.min(25, s.craneZ));

      trolley.position.x = s.craneX;
      trolley.position.z = s.craneZ;
      magnet.position.x = s.craneX;
      magnet.position.z = s.craneZ;
      craneGroup.position.z = s.craneZ;

      if (s.heldBox) {
        s.heldBox.mesh.position.set(s.craneX, 4.5, s.craneZ);
      }

      // Camera View
      camera.position.set(s.craneX * 0.4, 28, s.craneZ + 28);
      camera.lookAt(s.craneX * 0.4, 3, s.craneZ);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  const moveCraneDir = (dx: number, dz: number) => {
    stateRef.current.craneX = Math.max(-22, Math.min(22, stateRef.current.craneX + dx * 2));
    stateRef.current.craneZ = Math.max(-25, Math.min(25, stateRef.current.craneZ + dz * 2));
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0284c7] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
            <Anchor className="w-3.5 h-3.5" /> [No.73 샘와이 전담] 3D 크레인 마스터
          </div>
          <div className="text-[10px] text-slate-300">갠트리 크레인 컨테이너 적재 & 항만 타이쿤</div>
        </div>
        <div className="text-xs text-cyan-300 font-bold">
          남은시간: {timeLeft}s
        </div>
      </div>

      {/* Stats HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f172a]/90 text-xs border-b border-slate-700 z-20">
        <div>적재 진행도: <strong className="text-amber-400">{loadedCount} / {totalContainers}개</strong></div>
        <div>총점: <strong className="text-emerald-400">{score}P</strong></div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="relative flex-1 w-full overflow-hidden" />

      {/* Mobile Controls */}
      <div className="p-3 bg-[#0f172a]/95 border-t border-slate-700 flex items-center justify-between gap-2 z-20">
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button
            onClick={() => moveCraneDir(0, -1)}
            className="w-11 h-11 bg-slate-800 border border-slate-600 rounded-sm font-bold text-xs active:bg-slate-700"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => moveCraneDir(-1, 0)}
            className="w-11 h-11 bg-slate-800 border border-slate-600 rounded-sm font-bold text-xs active:bg-slate-700"
          >
            ◀
          </button>
          <button
            onClick={() => moveCraneDir(0, 1)}
            className="w-11 h-11 bg-slate-800 border border-slate-600 rounded-sm font-bold text-xs active:bg-slate-700"
          >
            ▼
          </button>
          <button
            onClick={() => moveCraneDir(1, 0)}
            className="w-11 h-11 bg-slate-800 border border-slate-600 rounded-sm font-bold text-xs active:bg-slate-700"
          >
            ▶
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={rotateContainer}
            className="px-3 h-12 bg-slate-800 border border-slate-600 rounded-sm text-xs font-bold flex items-center gap-1 active:bg-slate-700"
          >
            <RotateCw className="w-4 h-4" /> [회전]
          </button>
          <button
            onClick={toggleMagnet}
            className={`px-4 h-12 rounded-sm font-bold text-xs flex items-center gap-1.5 shadow-lg ${
              hasMagnetGrab ? 'bg-amber-500 text-black' : 'bg-red-600 text-white'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
            {hasMagnetGrab ? '[화물선 적재]' : '[전자석 흡착]'}
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-amber-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-amber-400 mb-1">[컨테이너 적재 완료!]</h2>
            <p className="text-xs text-slate-300 mb-4">항만 화물선 물류 적재 작전 완료</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">적재 성공:</span>
                <span className="text-amber-400 font-bold">{loadedCount} / {totalContainers}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">최종 점수:</span>
                <span className="text-emerald-400 font-bold">{score}P</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1">
                <span className="text-amber-300 font-bold">확정 보상 SNS:</span>
                <span className="text-amber-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-2.5 bg-amber-500 text-black font-bold text-xs rounded-sm active:bg-amber-400"
            >
              [보상 수령 및 복귀]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

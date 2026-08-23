import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Flame, Droplets, Trophy, Users, ShieldAlert } from 'lucide-react';
import { CardData } from '../types';

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
  hasVictim: boolean;
  victimMesh?: THREE.Mesh;
  rescued: boolean;
  x: number;
  z: number;
}

export const VoxelFireRescueGame: React.FC<VoxelFireRescueGameProps> = ({
  deck: _deck,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [extinguishedCount, setExtinguishedCount] = useState<number>(0);
  const [rescuedCount, setRescuedCount] = useState<number>(0);
  const [waterTank, setWaterTank] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);
  const [isWaterSpraying, setIsWaterSpraying] = useState<boolean>(false);

  const stateRef = useRef({
    truckPos: new THREE.Vector3(0, 0.5, 0),
    truckRot: 0,
    speed: 0,
    keys: {} as Record<string, boolean>,
    isWaterSpraying: false,
    waterTank: 100,
    score: 0,
    extinguished: 0,
    rescued: 0,
    timeLeft: 60,
    isGameOver: false,
    buildings: [] as BuildingTarget[],
    waterParticles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        stateRef.current.isWaterSpraying = true;
        setIsWaterSpraying(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        stateRef.current.isWaterSpraying = false;
        setIsWaterSpraying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181a24);
    scene.fog = new THREE.FogExp2(0x181a24, 0.018);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xff9f43, 1.2);
    dirLight.position.set(30, 60, 20);
    scene.add(dirLight);

    // City Ground Grid
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x222736 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(160, 40, 0x475569, 0x334155);
    grid.position.y = 0.02;
    scene.add(grid);

    // Fire Truck Mesh
    const truckGroup = new THREE.Group();
    const truckBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.4, 4.4),
      new THREE.MeshLambertMaterial({ color: 0xef4444 })
    );
    truckBody.position.y = 0.9;
    truckGroup.add(truckBody);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.0, 1.6),
      new THREE.MeshLambertMaterial({ color: 0xf8fafc })
    );
    cabin.position.set(0, 1.8, 1.1);
    truckGroup.add(cabin);

    const siren = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    siren.position.set(0, 2.4, 1.1);
    truckGroup.add(siren);

    const cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 1.4),
      new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
    );
    cannon.rotation.x = Math.PI / 4;
    cannon.position.set(0, 1.8, -0.6);
    truckGroup.add(cannon);

    scene.add(truckGroup);

    // Generate City Buildings with Fires
    const buildings: BuildingTarget[] = [];
    const bColors = [0x475569, 0x334155, 0x64748b, 0x1e293b];

    for (let i = 0; i < 12; i++) {
      const bGroup = new THREE.Group();
      const angle = (i / 12) * Math.PI * 2;
      const dist = 24 + (i % 3) * 12;
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;
      const bh = 8 + (i % 4) * 4;

      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(6, bh, 6),
        new THREE.MeshLambertMaterial({ color: bColors[i % bColors.length] })
      );
      bMesh.position.set(0, bh / 2, 0);
      bGroup.add(bMesh);

      // Windows
      const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      for (let wy = 2; wy < bh - 1; wy += 2.5) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.0, 6.1), winMat);
        win.position.set(0, wy, 0);
        bGroup.add(win);
      }

      // Fire Effects
      const fireGroup = new THREE.Group();
      const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      for (let f = 0; f < 5; f++) {
        const fMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.2), fireMat);
        fMesh.position.set((f % 3 - 1) * 1.8, bh + 1, Math.floor(f / 3) * 1.8);
        fireGroup.add(fMesh);
      }
      bGroup.add(fireGroup);

      // Victim on roof
      let victimMesh: THREE.Mesh | undefined;
      const hasVictim = i % 2 === 0;
      if (hasVictim) {
        victimMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.4, 0.8),
          new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
        );
        victimMesh.position.set(0, bh + 0.8, 0);
        bGroup.add(victimMesh);
      }

      bGroup.position.set(bx, 0, bz);
      scene.add(bGroup);

      buildings.push({
        mesh: bGroup,
        fireGroup,
        fireHealth: 100,
        maxFireHealth: 100,
        hasVictim,
        victimMesh,
        rescued: false,
        x: bx,
        z: bz
      });
    }
    stateRef.current.buildings = buildings;

    // Timer Interval
    const timerInterval = setInterval(() => {
      if (stateRef.current.isGameOver) return;
      stateRef.current.timeLeft -= 1;
      setTimeLeft(stateRef.current.timeLeft);

      // Refill water tank slowly
      if (stateRef.current.waterTank < 100) {
        stateRef.current.waterTank = Math.min(100, stateRef.current.waterTank + 5);
        setWaterTank(Math.floor(stateRef.current.waterTank));
      }

      if (stateRef.current.timeLeft <= 0) {
        stateRef.current.isGameOver = true;
        setIsGameOver(true);
        const finalSns = Math.min(260, Math.max(30, stateRef.current.score * 4 + 40));
        setRewardSns(finalSns);
        onReward(finalSns);
        if (playSfx) playSfx('/sounds/fanfare.mp3');
      }
    }, 1000);

    // Animation Loop
    let animId: number;
    const waterGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const state = stateRef.current;
      if (state.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Truck Movement
      const keys = state.keys;
      if (keys['w'] || keys['arrowup']) state.speed = Math.min(0.6, state.speed + 0.03);
      else if (keys['s'] || keys['arrowdown']) state.speed = Math.max(-0.3, state.speed - 0.03);
      else state.speed *= 0.92;

      if (keys['a'] || keys['arrowleft']) state.truckRot += 0.04 * (state.speed >= 0 ? 1 : -1);
      if (keys['d'] || keys['arrowright']) state.truckRot -= 0.04 * (state.speed >= 0 ? 1 : -1);

      state.truckPos.x += Math.sin(state.truckRot) * state.speed;
      state.truckPos.z += Math.cos(state.truckRot) * state.speed;

      truckGroup.position.copy(state.truckPos);
      truckGroup.rotation.y = state.truckRot;

      // Water Spraying
      if (state.isWaterSpraying && state.waterTank > 0) {
        state.waterTank = Math.max(0, state.waterTank - 0.4);
        setWaterTank(Math.floor(state.waterTank));

        const pMesh = new THREE.Mesh(waterGeom, waterMat);
        const sprayOrigin = state.truckPos.clone().add(new THREE.Vector3(0, 1.8, 0));
        pMesh.position.copy(sprayOrigin);
        scene.add(pMesh);

        const sprayDir = new THREE.Vector3(
          Math.sin(state.truckRot),
          0.35,
          Math.cos(state.truckRot)
        ).normalize();

        state.waterParticles.push({
          mesh: pMesh,
          vel: sprayDir.multiplyScalar(0.9),
          life: 30
        });
      }

      // Update Water Particles & Collision
      for (let i = state.waterParticles.length - 1; i >= 0; i--) {
        const p = state.waterParticles[i];
        p.mesh.position.add(p.vel);
        p.vel.y -= 0.015; // Gravity
        p.life -= 1;

        // Check collision with buildings
        for (const b of state.buildings) {
          if (b.fireHealth > 0) {
            const dx = p.mesh.position.x - b.x;
            const dz = p.mesh.position.z - b.z;
            if (Math.abs(dx) < 3.5 && Math.abs(dz) < 3.5 && p.mesh.position.y > 2) {
              b.fireHealth = Math.max(0, b.fireHealth - 2.5);
              p.life = 0;

              if (b.fireHealth <= 0) {
                b.fireGroup.visible = false;
                state.extinguished += 1;
                state.score += 15;
                setExtinguishedCount(state.extinguished);
                setScore(state.score);
                if (playSfx) playSfx('/sounds/extinguish.mp3');
              }
              break;
            }
          }
        }

        if (p.life <= 0 || p.mesh.position.y <= 0) {
          scene.remove(p.mesh);
          state.waterParticles.splice(i, 1);
        }
      }

      // Citizen Rescue Range Check
      for (const b of state.buildings) {
        if (b.hasVictim && !b.rescued && b.fireHealth <= 20) {
          const dist = state.truckPos.distanceTo(new THREE.Vector3(b.x, 0, b.z));
          if (dist < 8.0) {
            b.rescued = true;
            if (b.victimMesh) b.victimMesh.visible = false;
            state.rescued += 1;
            state.score += 25;
            setRescuedCount(state.rescued);
            setScore(state.score);
            if (playSfx) playSfx('/sounds/rescue.mp3');
          }
        }
      }

      // Camera Follow
      const camOffset = new THREE.Vector3(
        -Math.sin(state.truckRot) * 16,
        14,
        -Math.cos(state.truckRot) * 16
      );
      camera.position.copy(state.truckPos).add(camOffset);
      camera.lookAt(state.truckPos.clone().add(new THREE.Vector3(0, 2, 0)));

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      clearInterval(timerInterval);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  const handleMobileSpray = (active: boolean) => {
    stateRef.current.isWaterSpraying = active;
    setIsWaterSpraying(active);
  };

  const handleMobileTurn = (dir: number) => {
    stateRef.current.truckRot += dir * 0.15;
  };

  const handleMobileThrottle = (dir: number) => {
    stateRef.current.speed = dir * 0.5;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#181a24] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-[#f97316] flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5" /> [No.70 에일라 전담] 3D 파이어 트럭 히어로
          </div>
          <div className="text-[10px] text-slate-300">고압 방수포 화재 진압 & 시민 구조 아케이드</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#38bdf8] font-bold">남은시간: {timeLeft}s</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-1 px-3 py-1.5 bg-[#0f172a] text-center text-xs border-b border-slate-700/50 z-20">
        <div className="bg-slate-800/80 py-1 rounded-sm">
          <span className="text-slate-400 text-[10px]">화재 진압:</span>{' '}
          <span className="text-[#f97316] font-bold">{extinguishedCount}채</span>
        </div>
        <div className="bg-slate-800/80 py-1 rounded-sm">
          <span className="text-slate-400 text-[10px]">시민 구조:</span>{' '}
          <span className="text-[#38bdf8] font-bold">{rescuedCount}명</span>
        </div>
        <div className="bg-slate-800/80 py-1 rounded-sm">
          <span className="text-slate-400 text-[10px]">물 탱크:</span>{' '}
          <span className="text-cyan-400 font-bold">{waterTank}%</span>
        </div>
        <div className="bg-slate-800/80 py-1 rounded-sm">
          <span className="text-slate-400 text-[10px]">점수:</span>{' '}
          <span className="text-amber-400 font-bold">{score}P</span>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div ref={mountRef} className="relative flex-1 w-full overflow-hidden" />

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
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
        <div className="px-3 py-1 bg-black/70 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 소방차 주행 조향 | 탭/홀드: 고압 방수포 분사 (버튼 없음)' : 'Drag: Drive Firetruck | Tap/Hold: Spray Water (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-amber-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-amber-400 mb-1">[화재 진압 완료!]</h2>
            <p className="text-xs text-slate-300 mb-4">도심 화재 진압 및 시민 구조 작전 성공</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">진압 완료:</span>
                <span className="text-[#f97316] font-bold">{extinguishedCount}채 (+{extinguishedCount * 15}P)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">시민 구조:</span>
                <span className="text-[#38bdf8] font-bold">{rescuedCount}명 (+{rescuedCount * 25}P)</span>
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

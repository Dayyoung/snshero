import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Shield, AlertTriangle, Eye, Lock, Unlock, Gem } from 'lucide-react';
import { CardData } from '../types';

interface VoxelLaserStealthGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface LaserGrid {
  mesh: THREE.Mesh;
  yMin: number;
  yMax: number;
  speed: number;
  dir: number;
  axis: 'x' | 'z';
  pos: number;
  isStunned: boolean;
}

interface Jewel {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  collected: boolean;
  value: number;
}

export const VoxelLaserStealthGame: React.FC<VoxelLaserStealthGameProps> = ({
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
  const [alarmLevel, setAlarmLevel] = useState<number>(0);
  const [empCharges, setEmpCharges] = useState<number>(3);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    thiefPos: new THREE.Vector3(0, 0.4, -18),
    thiefVel: new THREE.Vector3(0, 0, 0),
    moveDir: new THREE.Vector2(0, 0),
    isSliding: false,
    slideTimer: 0,
    empCooldown: 0,
    empCharges: 3,
    alarmLevel: 0,
    score: 0,
    currentLevel: 1,
    isGameOver: false,
    thiefMesh: null as THREE.Group | null,
    lasers: [] as LaserGrid[],
    jewels: [] as Jewel[],
    exitDoorMesh: null as THREE.Mesh | null,
    empExplosions: [] as { mesh: THREE.Mesh; radius: number; life: number }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 18, -12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Moody Museum Vault Ambient & Spotlights
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.8);
    scene.add(ambientLight);

    const blueSpot = new THREE.SpotLight(0x38bdf8, 2.5);
    blueSpot.position.set(0, 20, 0);
    scene.add(blueSpot);

    // Marble Floor & Vault Walls
    const floorGeo = new THREE.PlaneGeometry(16, 42);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.5 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // Wall Borders
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 42), wallMat);
    leftWall.position.set(-8.4, 1.5, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 42), wallMat);
    rightWall.position.set(8.4, 1.5, 0);
    scene.add(rightWall);

    // Voxel Thief (Player)
    const thiefGroup = new THREE.Group();
    const tBodyGeo = new THREE.BoxGeometry(0.8, 1.1, 0.6);
    const tBodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const tBody = new THREE.Mesh(tBodyGeo, tBodyMat);
    tBody.position.y = 0.55;
    thiefGroup.add(tBody);

    // Night Vision Goggles
    const goggleGeo = new THREE.BoxGeometry(0.6, 0.2, 0.25);
    const goggleMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const goggles = new THREE.Mesh(goggleGeo, goggleMat);
    goggles.position.set(0, 0.9, 0.35);
    thiefGroup.add(goggles);

    thiefGroup.position.set(0, 0, -18);
    scene.add(thiefGroup);
    stateRef.current.thiefMesh = thiefGroup;

    // Exit Vault Door at z = 19
    const exitGeo = new THREE.BoxGeometry(4, 2.5, 0.8);
    const exitMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6 });
    const exitDoor = new THREE.Mesh(exitGeo, exitMat);
    exitDoor.position.set(0, 1.25, 19.5);
    scene.add(exitDoor);
    stateRef.current.exitDoorMesh = exitDoor;

    // Generate Laser Security Barriers & Collectible Relics
    const lasers: LaserGrid[] = [];
    const jewels: Jewel[] = [];

    const laserMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    for (let z = -14; z <= 15; z += 4) {
      // Horizontal laser beam
      const lGeo = new THREE.CylinderGeometry(0.08, 0.08, 16, 8);
      const lMesh = new THREE.Mesh(lGeo, laserMat);
      lMesh.rotation.z = Math.PI / 2;
      const initialY = 0.4 + (Math.random() > 0.5 ? 0.9 : 0);
      lMesh.position.set(0, initialY, z);
      scene.add(lMesh);

      lasers.push({
        mesh: lMesh,
        yMin: 0.4,
        yMax: 1.4,
        speed: 1.2 + Math.random() * 1.5,
        dir: Math.random() > 0.5 ? 1 : -1,
        axis: 'z',
        pos: z,
        isStunned: false
      });

      // Spawn Diamond Relic
      const jGeo = new THREE.OctahedronGeometry(0.35, 0);
      const jMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.7 });
      const jMesh = new THREE.Mesh(jGeo, jMat);
      const jx = (Math.random() - 0.5) * 12;
      jMesh.position.set(jx, 0.5, z + 2);
      scene.add(jMesh);

      jewels.push({
        mesh: jMesh,
        x: jx,
        z: z + 2,
        collected: false,
        value: 300
      });
    }

    stateRef.current.lasers = lasers;
    stateRef.current.jewels = jewels;

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

      // Slide duration
      if (state.isSliding) {
        state.slideTimer -= dt;
        if (state.slideTimer <= 0) {
          state.isSliding = false;
          setIsSliding(false);
        }
      }

      // Player Movement
      const moveSpeed = state.isSliding ? 14 : 7;
      state.thiefPos.x += state.moveDir.x * moveSpeed * dt;
      state.thiefPos.z += state.moveDir.y * moveSpeed * dt;

      state.thiefPos.x = Math.max(-7.2, Math.min(7.2, state.thiefPos.x));
      state.thiefPos.z = Math.max(-19, Math.min(20, state.thiefPos.z));

      // Mesh orientation & height
      if (state.thiefMesh) {
        state.thiefMesh.position.set(state.thiefPos.x, state.isSliding ? 0.25 : 0, state.thiefPos.z);
        if (state.moveDir.lengthSq() > 0.01) {
          const angle = Math.atan2(state.moveDir.x, state.moveDir.y);
          state.thiefMesh.rotation.y = angle;
        }
        state.thiefMesh.scale.set(1, state.isSliding ? 0.45 : 1, state.isSliding ? 1.5 : 1);
      }

      // Update Moving Lasers
      for (const laser of state.lasers) {
        if (!laser.isStunned) {
          laser.mesh.position.y += laser.speed * laser.dir * dt;
          if (laser.mesh.position.y > laser.yMax) {
            laser.mesh.position.y = laser.yMax;
            laser.dir = -1;
          } else if (laser.mesh.position.y < laser.yMin) {
            laser.mesh.position.y = laser.yMin;
            laser.dir = 1;
          }

          // Laser Collision with Player
          const dz = Math.abs(state.thiefPos.z - laser.pos);
          const laserY = laser.mesh.position.y;
          const playerH = state.isSliding ? 0.45 : 1.1;

          if (dz < 0.35 && laserY <= playerH && laserY >= (state.isSliding ? 0.1 : 0.3)) {
            // Alarm trigger!
            state.alarmLevel += 25 * dt;
            setAlarmLevel(Math.min(100, Math.round(state.alarmLevel)));
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (state.alarmLevel >= 100) {
              state.isGameOver = true;
              setIsGameOver(true);
              const reward = Math.min(260, Math.floor(state.score / 50));
              setRewardSns(reward);
              onReward(reward);
            }
          }
        }
      }

      // Jewel Collection
      for (const j of state.jewels) {
        if (!j.collected) {
          j.mesh.rotation.y += 3 * dt;
          const dx = state.thiefPos.x - j.x;
          const dz = state.thiefPos.z - j.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 0.9) {
            j.collected = true;
            scene.remove(j.mesh);
            state.score += j.value;
            setScore(state.score);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          }
        }
      }

      // Reached Exit Vault Door!
      if (state.thiefPos.z >= 18.5) {
        state.score += 1000 + (100 - state.alarmLevel) * 10;
        state.currentLevel++;
        setScore(state.score);
        setCurrentLevel(state.currentLevel);

        // Reset to start with higher score
        state.thiefPos.set(0, 0, -18);
        state.jewels.forEach(j => { j.collected = false; scene.add(j.mesh); });
        state.lasers.forEach(l => { l.speed += 0.4; });
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
      }

      // Smooth Camera Tracking
      camera.position.set(state.thiefPos.x * 0.4, 16, state.thiefPos.z - 8);
      camera.lookAt(state.thiefPos.x, 0.5, state.thiefPos.z + 4);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.moveDir.x = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.moveDir.x = 1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') stateRef.current.moveDir.y = 1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') stateRef.current.moveDir.y = -1;
      if (e.key === ' ' && !stateRef.current.isSliding) {
        stateRef.current.isSliding = true;
        stateRef.current.slideTimer = 0.8;
        setIsSliding(true);
      }
      if ((e.key === 'e' || e.key === 'E' || e.key === 'f') && stateRef.current.empCharges > 0) {
        stateRef.current.empCharges--;
        setEmpCharges(stateRef.current.empCharges);
        stateRef.current.lasers.forEach(l => {
          l.isStunned = true;
          l.mesh.visible = false;
          setTimeout(() => { l.isStunned = false; l.mesh.visible = true; }, 3500);
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && stateRef.current.moveDir.x === -1) stateRef.current.moveDir.x = 0;
      if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && stateRef.current.moveDir.x === 1) stateRef.current.moveDir.x = 0;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && stateRef.current.moveDir.y === 1) stateRef.current.moveDir.y = 0;
      if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && stateRef.current.moveDir.y === -1) stateRef.current.moveDir.y = 0;
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
    <div className="relative w-full h-full min-h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      {/* 3D Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Header HUD */}
      <div className="relative z-10 w-full max-w-xl p-3 flex items-center justify-between pointer-events-auto bg-slate-900/85 backdrop-blur-sm border-b border-rose-500/40">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-400 text-xs font-bold rounded-sm border border-rose-500/40"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy size={14} />
            <span>{score.toLocaleString()}P</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <Gem size={14} />
            <span>LV.{currentLevel}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <Zap size={14} />
            <span>EMP x{empCharges}</span>
          </div>
        </div>
      </div>

      {/* Alarm Level Bar */}
      <div className="relative z-10 mt-2 w-full max-w-sm px-4 flex flex-col items-center pointer-events-none gap-1">
        <div className="w-full flex justify-between text-[11px] font-bold text-rose-400">
          <span className="flex items-center gap-1"><AlertTriangle size={12} /> SECURITY ALARM</span>
          <span>{alarmLevel}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
          <div
            className={`h-full transition-all duration-75 ${alarmLevel > 70 ? 'bg-rose-500 animate-pulse' : alarmLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${alarmLevel}%` }}
          />
        </div>
      </div>

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

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                stateRef.current.moveDir.x = Math.abs(dx) > 10 ? (dx > 0 ? 1 : -1) : 0;
                stateRef.current.moveDir.y = Math.abs(dy) > 10 ? (dy < 0 ? 1 : -1) : 0;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.x = 0;
              stateRef.current.moveDir.y = 0;

              if (!moved) {
                // Tap: Slide Dodge
                if (!stateRef.current.isSliding) {
                  stateRef.current.isSliding = true;
                  stateRef.current.slideTimer = 0.8;
                  setIsSliding(true);
                }
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            // Double Tap: EMP Stun
            if (stateRef.current.empCharges > 0) {
              stateRef.current.empCharges--;
              setEmpCharges(stateRef.current.empCharges);
              stateRef.current.lasers.forEach(l => {
                l.isStunned = true;
                l.mesh.visible = false;
                setTimeout(() => { l.isStunned = false; l.mesh.visible = true; }, 3500);
              });
            }
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-cyan-400/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 잠입 이동 | 탭: 슬라이딩 회피 | 더블탭: EMP 무력화 (버튼 없음)' : 'Drag: Move | Tap: Slide Dodge | Double Tap: EMP Stun (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <AlertTriangle size={40} className="text-rose-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {alarmLevel >= 100 ? (isKo ? '경보 발령! 체포됨!' : 'ALARM TRIGGERED!') : (isKo ? '탈출 완료!' : 'VAULT CLEARED!')}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '탈출 스테이지' : 'Cleared Stage'}</span>
                <span className="text-cyan-400 font-bold">LV.{currentLevel}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '획득 전리품 가치' : 'Loot Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상 포인트' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-black text-sm rounded-sm tracking-wider shadow-lg"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

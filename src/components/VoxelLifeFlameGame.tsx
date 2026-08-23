import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Flame, Heart, Sparkles, Shield } from 'lucide-react';
import { CardData } from '../types';

interface VoxelLifeFlameGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ShadowCreep {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  hp: number;
  speed: number;
}

interface FlameShot {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

export const VoxelLifeFlameGame: React.FC<VoxelLifeFlameGameProps> = ({
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
  const [treeHp, setTreeHp] = useState<number>(100);
  const [purifiedCount, setPurifiedCount] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    aimAngle: 0,
    treeHp: 100,
    score: 0,
    purifiedCount: 0,
    wave: 1,
    isGameOver: false,
    creeps: [] as ShadowCreep[],
    flames: [] as FlameShot[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    dragonMesh: null as THREE.Group | null,
    treeMesh: null as THREE.Group | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0a0e);
    scene.fog = new THREE.FogExp2(0x1a0a0e, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 14, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Life Flame Arena Lighting
    const ambientLight = new THREE.AmbientLight(0xf43f5e, 0.7);
    scene.add(ambientLight);

    const treeLight = new THREE.PointLight(0xfb7185, 2.5, 30);
    treeLight.position.set(0, 4, 0);
    scene.add(treeLight);

    // Ground Disc
    const groundGeo = new THREE.CylinderGeometry(14, 14, 0.6, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x271318, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.3;
    scene.add(ground);

    // Build Central World Tree (Life Tree Voxel)
    const treeGroup = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a1525, roughness: 0.8 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3, emissive: 0x9f1239, emissiveIntensity: 0.5 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 4.0, 8), trunkMat);
    trunk.position.y = 2.0;
    treeGroup.add(trunk);

    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2), foliageMat);
    foliage.position.y = 4.2;
    treeGroup.add(foliage);

    scene.add(treeGroup);
    stateRef.current.treeMesh = treeGroup;

    // Alexstra Red Dragon Turret at Tree Center
    const dragonGroup = new THREE.Group();
    const dragonMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });

    const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.4), dragonMat);
    dBody.position.y = 0.5;
    dragonGroup.add(dBody);

    const dHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.8), goldMat);
    dHead.position.set(0, 0.8, 0.8);
    dragonGroup.add(dHead);

    dragonGroup.position.set(0, 1.0, 0);
    scene.add(dragonGroup);
    stateRef.current.dragonMesh = dragonGroup;

    // Spawn Shadow Creep Function
    const spawnCreep = (waveNum: number) => {
      const cGroup = new THREE.Group();
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 4;

      const cMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const cEyeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

      const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), cMat);
      cGroup.add(cBody);

      const cEye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), cEyeMat);
      cEye.position.set(0, 0.2, 0.45);
      cGroup.add(cEye);

      const posX = Math.cos(angle) * dist;
      const posZ = Math.sin(angle) * dist;
      cGroup.position.set(posX, 0.5, posZ);
      cGroup.lookAt(0, 0.5, 0);
      scene.add(cGroup);

      stateRef.current.creeps.push({
        mesh: cGroup,
        pos: cGroup.position,
        hp: Math.min(3, Math.floor(1 + waveNum * 0.3)),
        speed: 2.0 + waveNum * 0.3
      });
    };

    // Initial Creeps
    for (let i = 0; i < 6; i++) {
      spawnCreep(1);
    }

    // Fire Life Flame Shot
    const fireFlame = () => {
      if (stateRef.current.isGameOver) return;
      const fGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const fMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      const fMesh = new THREE.Mesh(fGeo, fMat);

      const angle = stateRef.current.aimAngle;
      const spawnPos = new THREE.Vector3(Math.sin(angle) * 1.5, 1.2, Math.cos(angle) * 1.5);
      fMesh.position.copy(spawnPos);
      scene.add(fMesh);

      const vel = new THREE.Vector3(Math.sin(angle) * 25, 0, Math.cos(angle) * 25);
      stateRef.current.flames.push({
        mesh: fMesh,
        pos: fMesh.position,
        vel
      });

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    };

    const spawnPurifyFX = (pos: THREE.Vector3) => {
      const pCount = lowSpecMode ? 4 : 8;
      const pGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xfb7185 });
      for (let p = 0; p < pCount; p++) {
        const pm = new THREE.Mesh(pGeo, pMat);
        pm.position.copy(pos);
        scene.add(pm);
        stateRef.current.particles.push({
          mesh: pm,
          vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 1, (Math.random() - 0.5) * 6),
          life: 0.5
        });
      }
    };

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.aimAngle -= 0.25;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.aimAngle += 0.25;
      } else if (e.key === ' ' || e.key === 'f' || e.key === 'F') {
        fireFlame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;
    let spawnAcc = 0;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      if (!state.isGameOver) {
        // Aim Dragon
        if (dragonGroup) {
          dragonGroup.rotation.y = state.aimAngle;
        }
        if (treeGroup) {
          foliage.rotation.y += 0.5 * delta;
        }

        // Spawn Wave
        spawnAcc += delta;
        if (spawnAcc > 2.0) {
          spawnAcc = 0;
          spawnCreep(state.wave);
          if (state.purifiedCount > state.wave * 8) {
            state.wave++;
            setWave(state.wave);
          }
        }

        // Update Flames
        for (let f = state.flames.length - 1; f >= 0; f--) {
          const flame = state.flames[f];
          flame.pos.addScaledVector(flame.vel, delta);

          let hit = false;
          for (let c = state.creeps.length - 1; c >= 0; c--) {
            const creep = state.creeps[c];
            if (flame.pos.distanceTo(creep.pos) < 1.0) {
              hit = true;
              creep.hp--;
              spawnPurifyFX(creep.pos);

              if (creep.hp <= 0) {
                scene.remove(creep.mesh);
                state.creeps.splice(c, 1);
                state.score += 200;
                state.purifiedCount++;
                setScore(state.score);
                setPurifiedCount(state.purifiedCount);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              }
              break;
            }
          }

          if (hit || flame.pos.length() > 16) {
            scene.remove(flame.mesh);
            state.flames.splice(f, 1);
          }
        }

        // Update Creeps
        for (let c = state.creeps.length - 1; c >= 0; c--) {
          const creep = state.creeps[c];
          const dir = new THREE.Vector3(0, 0.5, 0).sub(creep.pos).normalize();
          creep.pos.addScaledVector(dir, creep.speed * delta);
          creep.mesh.position.copy(creep.pos);
          creep.mesh.lookAt(0, 0.5, 0);

          // Attack Tree
          if (creep.pos.length() < 1.8) {
            scene.remove(creep.mesh);
            state.creeps.splice(c, 1);
            state.treeHp = Math.max(0, state.treeHp - 15);
            setTreeHp(state.treeHp);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');

            if (state.treeHp <= 0) {
              state.isGameOver = true;
              setIsGameOver(true);
              const reward = Math.min(50, Math.max(10, Math.floor(state.score / 180)));
              setRewardSns(reward);
              onReward(reward);
            }
          }
        }

        // Victory Condition (25 Purified)
        if (state.purifiedCount >= 25 && !state.isGameOver) {
          state.isGameOver = true;
          setIsGameOver(true);
          const winReward = 45;
          setRewardSns(winReward);
          onReward(winReward);
        }
      }

      // Update Particles
      for (let p = state.particles.length - 1; p >= 0; p--) {
        const pt = state.particles[p];
        pt.life -= delta;
        pt.mesh.position.addScaledVector(pt.vel, delta);
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
          state.particles.splice(p, 1);
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col select-none overflow-hidden font-mono">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Top Header */}
      <div className="relative z-10 w-full p-3 sm:p-4 flex items-center justify-between bg-slate-950/80 border-b border-rose-900/40 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-rose-400 text-slate-200 text-xs font-bold rounded-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/70 border border-rose-500/50 rounded-sm text-rose-300">
            <Heart size={13} className="text-rose-400 animate-pulse" />
            <span>{isKo ? '세계수 HP' : 'Tree HP'}: {treeHp}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 border border-amber-500/50 rounded-sm text-amber-300">
            <Trophy size={13} className="text-amber-400" />
            <span>{score.toLocaleString()}P</span>
          </div>
        </div>
      </div>

      {/* Tree HP Bar */}
      <div className="relative z-10 w-full px-4 pt-2 flex flex-col items-center gap-1 pointer-events-none">
        <div className="w-full max-w-md flex justify-between text-[10px] text-rose-300 font-bold">
          <span>{isKo ? '생명의 나무 결계 수호' : 'Life Tree Shield'}</span>
          <span>{purifiedCount}/25 {isKo ? '정화' : 'Purified'}</span>
        </div>
        <div className="w-full max-w-md h-2 bg-slate-900 border border-rose-800 rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-pink-400 transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
            style={{ width: `${treeHp}%` }}
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

              if (Math.abs(dx) > 8) {
                moved = true;
                stateRef.current.aimAngle += (dx > 0 ? 0.05 : -0.05);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Fire Flame Burst
                window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
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
        <div className="px-3 py-1 bg-black/70 border border-rose-500/30 rounded-full text-[10px] text-rose-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 화염 조준 회전 | 탭: 생명의 불꽃 발사 (버튼 없음)' : 'Drag L/R: Aim Flame Angle | Tap: Fire Burst (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {purifiedCount >= 25 ? (isKo ? '생명의 나무 수호 성공!' : 'TREE DEFENDED!') : (isKo ? '세계수 결계 붕괴' : 'TREE FELL')}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '정화한 섀도우 괴물' : 'Monsters Purified'}</span>
                <span className="text-rose-400 font-bold">{purifiedCount}마리</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '남은 세계수 HP' : 'Remaining Tree HP'}</span>
                <span className="text-emerald-400 font-bold">{treeHp}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 점수' : 'Final Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-black text-sm rounded-sm tracking-wider shadow-lg cursor-pointer"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

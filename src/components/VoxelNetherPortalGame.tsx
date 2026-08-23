import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap } from 'lucide-react';
import { CardData } from '../types';

interface VoxelNetherPortalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Island {
  mesh: THREE.Group;
  z: number;
  lane: number; // -1, 0, 1
  hasOrb: boolean;
  hasRift: boolean;
  orbMesh?: THREE.Mesh;
  riftMesh?: THREE.Mesh;
}

export const VoxelNetherPortalGame: React.FC<VoxelNetherPortalGameProps> = ({
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
  const [orbsCollected, setOrbsCollected] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [portalProgress, setPortalProgress] = useState<number>(0); // 0 ~ 100%
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPortalCleared, setIsPortalCleared] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    playerLane: 0, // -1, 0, 1
    playerY: 0,
    jumpVel: 0,
    isJumping: false,
    speed: 18,
    distance: 0,
    score: 0,
    orbsCollected: 0,
    portalProgress: 0,
    isGameOver: false,
    isPortalCleared: false,
    playerMesh: null as THREE.Group | null,
    islands: [] as Island[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0505);
    scene.fog = new THREE.FogExp2(0x1a0505, 0.025);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 2, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Nether Lava Lighting
    const ambientLight = new THREE.AmbientLight(0xff4422, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xff8844, 1.5);
    dirLight.position.set(5, 15, 5);
    scene.add(dirLight);

    // Lava Ocean
    const lavaGeo = new THREE.PlaneGeometry(80, 200, 16, 16);
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0x991100, wireframe: lowSpecMode });
    const lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
    lavaMesh.rotation.x = -Math.PI / 2;
    lavaMesh.position.set(0, -2, -60);
    scene.add(lavaMesh);

    // Build Nether Dragon Voxel Character
    const playerGroup = new THREE.Group();
    
    // Body (Black & Purple Nether Voxel)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), bodyMat);
    body.position.y = 0.6;
    playerGroup.add(body);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.3 });
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.6), wingMat);
    leftWing.position.set(-0.9, 0.8, 0);
    playerGroup.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.6), wingMat);
    rightWing.position.set(0.9, 0.8, 0);
    playerGroup.add(rightWing);

    // Horns / Eyes (Glowing Orange)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.2), eyeMat);
    eyeL.position.set(-0.25, 0.8, -0.6);
    playerGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.2), eyeMat);
    eyeR.position.set(0.25, 0.8, -0.6);
    playerGroup.add(eyeR);

    scene.add(playerGroup);
    stateRef.current.playerMesh = playerGroup;

    // Create Initial Islands
    const laneWidth = 2.4;
    const islandGeo = new THREE.BoxGeometry(2.0, 0.8, 4.0);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x3b1c1c, roughness: 0.8 });
    const orbGeo = new THREE.OctahedronGeometry(0.4);
    const orbMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.8 });
    const riftGeo = new THREE.TorusGeometry(0.5, 0.15, 8, 16);
    const riftMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const islands: Island[] = [];
    for (let i = 0; i < 20; i++) {
      const z = -i * 6;
      const lane = (i % 3) - 1;
      const islandGroup = new THREE.Group();

      const baseMesh = new THREE.Mesh(islandGeo, islandMat);
      islandGroup.add(baseMesh);

      let orbMesh: THREE.Mesh | undefined;
      let riftMesh: THREE.Mesh | undefined;
      const hasOrb = Math.random() > 0.4;
      const hasRift = !hasOrb && i > 3 && Math.random() > 0.5;

      if (hasOrb) {
        orbMesh = new THREE.Mesh(orbGeo, orbMat);
        orbMesh.position.set(0, 1.2, 0);
        islandGroup.add(orbMesh);
      } else if (hasRift) {
        riftMesh = new THREE.Mesh(riftGeo, riftMat);
        riftMesh.position.set(0, 1.2, 0);
        riftMesh.rotation.x = Math.PI / 2;
        islandGroup.add(riftMesh);
      }

      islandGroup.position.set(lane * laneWidth, 0, z);
      scene.add(islandGroup);

      islands.push({
        mesh: islandGroup,
        z,
        lane,
        hasOrb,
        hasRift,
        orbMesh,
        riftMesh
      });
    }
    stateRef.current.islands = islands;

    // Spawn Particles
    const spawnNetherBurst = (pos: THREE.Vector3, color: number) => {
      const pCount = lowSpecMode ? 4 : 8;
      const pGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const pMat = new THREE.MeshBasicMaterial({ color });
      for (let p = 0; p < pCount; p++) {
        const pm = new THREE.Mesh(pGeo, pMat);
        pm.position.copy(pos);
        scene.add(pm);
        stateRef.current.particles.push({
          mesh: pm,
          vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 6 + 2, (Math.random() - 0.5) * 6),
          life: 0.8
        });
      }
    };

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (stateRef.current.playerLane > -1) {
          stateRef.current.playerLane--;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (stateRef.current.playerLane < 1) {
          stateRef.current.playerLane++;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      } else if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && !stateRef.current.isJumping) {
        stateRef.current.isJumping = true;
        stateRef.current.jumpVel = 9;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      if (!state.isGameOver) {
        // Update Player Jump & Lane Position
        if (state.isJumping) {
          state.playerY += state.jumpVel * delta;
          state.jumpVel -= 25 * delta;
          if (state.playerY <= 0) {
            state.playerY = 0;
            state.isJumping = false;
            state.jumpVel = 0;
          }
        }

        const targetX = state.playerLane * laneWidth;
        if (playerGroup) {
          playerGroup.position.x += (targetX - playerGroup.position.x) * 12 * delta;
          playerGroup.position.y = state.playerY;
          // Wing flap
          leftWing.rotation.z = Math.sin(now * 0.01) * 0.3;
          rightWing.rotation.z = -Math.sin(now * 0.01) * 0.3;
        }

        // Advance World
        state.distance += state.speed * delta;
        setDistance(Math.floor(state.distance));
        state.portalProgress = Math.min(100, (state.orbsCollected / 15) * 100);
        setPortalProgress(Math.floor(state.portalProgress));

        // Move Islands toward player
        for (const isl of state.islands) {
          isl.z += state.speed * delta;
          isl.mesh.position.z = isl.z;

          if (isl.orbMesh) {
            isl.orbMesh.rotation.y += 2 * delta;
          }
          if (isl.riftMesh) {
            isl.riftMesh.rotation.z += 3 * delta;
          }

          // Check Collision with player (around z = 0)
          if (Math.abs(isl.z) < 1.2 && isl.lane === state.playerLane) {
            // Orb Collection
            if (isl.hasOrb && isl.orbMesh) {
              isl.hasOrb = false;
              isl.orbMesh.visible = false;
              state.orbsCollected++;
              state.score += 250;
              setOrbsCollected(state.orbsCollected);
              setScore(state.score);
              spawnNetherBurst(playerGroup.position, 0xa855f7);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

              if (state.orbsCollected >= 15 && !state.isPortalCleared) {
                state.isPortalCleared = true;
                setIsPortalCleared(true);
                state.isGameOver = true;
                setIsGameOver(true);
                const finalReward = 45;
                setRewardSns(finalReward);
                onReward(finalReward);
              }
            }

            // Dimensional Rift Collision (Damage / Game Over if not jumped over)
            if (isl.hasRift && state.playerY < 1.0) {
              state.isGameOver = true;
              setIsGameOver(true);
              const earned = Math.max(10, Math.floor(state.orbsCollected * 2));
              setRewardSns(earned);
              onReward(earned);
              spawnNetherBurst(playerGroup.position, 0xef4444);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
            }
          }

          // Recycle Island behind player
          if (isl.z > 8) {
            isl.z -= state.islands.length * 6;
            isl.lane = Math.floor(Math.random() * 3) - 1;
            isl.mesh.position.x = isl.lane * laneWidth;
            isl.mesh.position.z = isl.z;

            isl.hasOrb = Math.random() > 0.4;
            isl.hasRift = !isl.hasOrb && Math.random() > 0.5;

            if (isl.orbMesh) isl.orbMesh.visible = isl.hasOrb;
            if (isl.riftMesh) isl.riftMesh.visible = isl.hasRift;
          }
        }
      }

      // Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life -= delta;
        p.mesh.position.addScaledVector(p.vel, delta);
        if (p.life <= 0) {
          scene.remove(p.mesh);
          state.particles.splice(i, 1);
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

      {/* Top HUD */}
      <div className="relative z-10 w-full p-3 sm:p-4 flex items-center justify-between bg-slate-950/80 border-b border-purple-900/40 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-200 text-xs font-bold rounded-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/70 border border-purple-500/50 rounded-sm text-purple-300">
            <Sparkles size={13} className="text-purple-400 animate-pulse" />
            <span>{orbsCollected}/15 {isKo ? '오브' : 'Orbs'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 border border-amber-500/50 rounded-sm text-amber-300">
            <Trophy size={13} className="text-amber-400" />
            <span>{score.toLocaleString()}P</span>
          </div>
        </div>
      </div>

      {/* Nether Portal Charge Progress Bar */}
      <div className="relative z-10 w-full px-4 pt-2 flex flex-col items-center gap-1 pointer-events-none">
        <div className="w-full max-w-md flex justify-between text-[10px] text-purple-300 font-bold">
          <span>{isKo ? '네더 차원 포탈 충전' : 'Nether Portal Charge'}</span>
          <span>{portalProgress}%</span>
        </div>
        <div className="w-full max-w-md h-2 bg-slate-900 border border-purple-800 rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
            style={{ width: `${portalProgress}%` }}
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

              if (Math.abs(dx) > 20) {
                moved = true;
                if (dx > 0 && stateRef.current.playerLane < 1) {
                  stateRef.current.playerLane++;
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                } else if (dx < 0 && stateRef.current.playerLane > -1) {
                  stateRef.current.playerLane--;
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                }
                window.removeEventListener('pointermove', onMove);
              } else if (dy < -25) {
                moved = true;
                if (!stateRef.current.isJumping) {
                  stateRef.current.isJumping = true;
                  stateRef.current.jumpVel = 9;
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
                }
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Jump
                if (!stateRef.current.isJumping) {
                  stateRef.current.isJumping = true;
                  stateRef.current.jumpVel = 9;
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
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
        <div className="px-3 py-1 bg-black/70 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 스와이프: 레인 이동 | 탭/위로 스와이프: 점프 (버튼 없음)' : 'Swipe L/R: Switch Lane | Tap/Swipe Up: Jump (No Buttons)'}
        </div>
      </div>

      {/* Game Over / Portal Clear Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-purple-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isPortalCleared ? (isKo ? '네더 포탈 차원 탈출 성공!' : 'PORTAL CLEARED!') : (isKo ? '차원 균열 추락' : 'RIFT COLLAPSE')}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '획득 네더 오브' : 'Orbs Collected'}</span>
                <span className="text-purple-400 font-bold">{orbsCollected}/15</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '질주 거리' : 'Distance'}</span>
                <span className="text-cyan-400 font-bold">{distance}m</span>
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
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-black text-sm rounded-sm tracking-wider shadow-lg cursor-pointer"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

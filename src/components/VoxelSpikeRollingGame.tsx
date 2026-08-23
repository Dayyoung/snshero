import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Flame } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSpikeRollingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ObstacleBlock {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  type: 'rock' | 'gem' | 'tnt';
  points: number;
  broken: boolean;
}

export const VoxelSpikeRollingGame: React.FC<VoxelSpikeRollingGameProps> = ({
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
  const [combo, setCombo] = useState<number>(0);
  const [boulderSize, setBoulderSize] = useState<number>(1.0);
  const [distance, setDistance] = useState<number>(0);
  const [isFever, setIsFever] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    rollerX: 0,
    rollerZ: 0,
    speed: 20,
    targetX: 0,
    scale: 1.0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    distance: 0,
    isFever: false,
    feverTimer: 0,
    isGameOver: false,
    rollerMesh: null as THREE.Group | null,
    obstacles: [] as ObstacleBlock[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x180f08);
    scene.fog = new THREE.FogExp2(0x180f08, 0.02);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 2, -15);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Desert Canyon Lighting
    const ambientLight = new THREE.AmbientLight(0xfbbf24, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf97316, 1.8);
    dirLight.position.set(10, 25, 10);
    scene.add(dirLight);

    // Canyon Floor Track (Sloping Downward)
    const floorGeo = new THREE.PlaneGeometry(16, 200, 16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, -80);
    scene.add(floorMesh);

    // Canyon Walls
    const wallGeo = new THREE.BoxGeometry(2, 6, 200);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const lWall = new THREE.Mesh(wallGeo, wallMat);
    lWall.position.set(-9, 3, -80);
    scene.add(lWall);

    const rWall = new THREE.Mesh(wallGeo, wallMat);
    rWall.position.set(9, 3, -80);
    scene.add(rWall);

    // Build Spike Dragon Roller Mesh (Central Core + Protruding Spikes)
    const rollerGroup = new THREE.Group();
    const coreGeo = new THREE.DodecahedronGeometry(1.0);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.4, metalness: 0.6 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rollerGroup.add(coreMesh);

    // Add 12 Spikes
    const spikeGeo = new THREE.ConeGeometry(0.3, 0.8, 6);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });
    const spikeDirs = [
      [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
      [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, 0.7, -0.7], [0.7, 0, 0.7], [-0.7, 0, 0.7]
    ];
    spikeDirs.forEach(([x, y, z]) => {
      const sp = new THREE.Mesh(spikeGeo, spikeMat);
      sp.position.set(x * 1.1, y * 1.1, z * 1.1);
      sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());
      rollerGroup.add(sp);
    });

    rollerGroup.position.set(0, 1.2, 0);
    scene.add(rollerGroup);
    stateRef.current.rollerMesh = rollerGroup;

    // Obstacle Spawner
    const rockGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
    const gemGeo = new THREE.OctahedronGeometry(0.6);
    const gemMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.6 });

    const spawnObstacleRow = (zPos: number) => {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let c = 0; c < count; c++) {
        const laneX = (Math.random() - 0.5) * 12;
        const isGem = Math.random() < 0.4;

        const mesh = new THREE.Mesh(isGem ? gemGeo : rockGeo, isGem ? gemMat : rockMat);
        mesh.position.set(laneX, isGem ? 1.0 : 0.7, zPos);
        scene.add(mesh);

        stateRef.current.obstacles.push({
          mesh,
          pos: mesh.position,
          type: isGem ? 'gem' : 'rock',
          points: isGem ? 300 : 150,
          broken: false
        });
      }
    };

    // Initial Obstacle Field
    for (let z = -15; z > -150; z -= 8) {
      spawnObstacleRow(z);
    }

    const spawnShatterFX = (pos: THREE.Vector3, color: number) => {
      const pCount = lowSpecMode ? 4 : 8;
      const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const pMat = new THREE.MeshBasicMaterial({ color });
      for (let p = 0; p < pCount; p++) {
        const pm = new THREE.Mesh(pGeo, pMat);
        pm.position.copy(pos);
        scene.add(pm);
        stateRef.current.particles.push({
          mesh: pm,
          vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 2, (Math.random() - 0.5) * 8),
          life: 0.6
        });
      }
    };

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.targetX = Math.max(-6, stateRef.current.targetX - 2.5);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.targetX = Math.min(6, stateRef.current.targetX + 2.5);
      } else if (e.key === ' ' || e.key === 'Shift') {
        // Super Spike Expansion Dash
        stateRef.current.speed = 35;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Shift') {
        stateRef.current.speed = 20;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      if (!state.isGameOver) {
        state.distance += state.speed * delta;
        setDistance(Math.floor(state.distance));

        // Steer Roller
        state.rollerX += (state.targetX - state.rollerX) * 10 * delta;
        if (rollerGroup) {
          rollerGroup.position.x = state.rollerX;
          rollerGroup.rotation.x -= state.speed * 0.15 * delta;
          rollerGroup.rotation.z = -(state.targetX - state.rollerX) * 0.1;
          rollerGroup.scale.setScalar(state.scale);
        }

        // Combo decay
        if (state.combo > 0) {
          state.comboTimer -= delta;
          if (state.comboTimer <= 0) {
            state.combo = 0;
            setCombo(0);
          }
        }

        // Move Obstacles
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.pos.z += state.speed * delta;
          obs.mesh.position.z = obs.pos.z;

          // Collision Check
          if (!obs.broken && Math.abs(obs.pos.z - 0) < 1.4 && Math.abs(obs.pos.x - state.rollerX) < (1.2 * state.scale)) {
            obs.broken = true;
            obs.mesh.visible = false;

            state.combo++;
            state.comboTimer = 2.0;
            const multiplier = state.isFever ? 2.5 : 1.0;
            const addedScore = Math.floor(obs.points * (1 + state.combo * 0.1) * multiplier);
            state.score += addedScore;
            state.scale = Math.min(2.0, state.scale + 0.05);

            setScore(state.score);
            setCombo(state.combo);
            setBoulderSize(parseFloat(state.scale.toFixed(2)));

            spawnShatterFX(obs.pos, obs.type === 'gem' ? 0x06b6d4 : 0xf97316);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

            if (state.combo >= 10 && !state.isFever) {
              state.isFever = true;
              setIsFever(true);
            }
          }

          // Recycle Obstacles
          if (obs.pos.z > 15) {
            scene.remove(obs.mesh);
            state.obstacles.splice(i, 1);
          }
        }

        // Spawn new rows
        while (state.obstacles.length < 24) {
          spawnObstacleRow(-120 - Math.random() * 30);
        }

        // End condition: 1500m reached or 10000 points
        if (state.distance >= 1200 && !state.isGameOver) {
          state.isGameOver = true;
          setIsGameOver(true);
          const finalSns = Math.min(50, Math.max(15, Math.floor(state.score / 250)));
          setRewardSns(finalSns);
          onReward(finalSns);
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
      window.removeEventListener('keyup', handleKeyUp);
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
      <div className="relative z-10 w-full p-3 sm:p-4 flex items-center justify-between bg-slate-950/80 border-b border-orange-900/40 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-orange-400 text-slate-200 text-xs font-bold rounded-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 border border-amber-500/50 rounded-sm text-amber-300">
            <Trophy size={13} className="text-amber-400" />
            <span>{score.toLocaleString()}P</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-950/70 border border-orange-500/50 rounded-sm text-orange-300">
            <span>📏 {distance}m / 1200m</span>
          </div>
        </div>
      </div>

      {/* Combo & Boulder Size Indicator */}
      <div className="relative z-10 w-full px-4 pt-2 flex flex-col items-center gap-1 pointer-events-none">
        {combo > 1 && (
          <div className="px-3 py-0.5 bg-orange-950/80 border border-orange-400 text-orange-300 text-xs font-black rounded-sm animate-bounce">
            🔥 {combo} CRUSH COMBO!
          </div>
        )}
        <div className="text-[10px] text-amber-300/80 font-bold">
          {isKo ? `볼더 크기: x${boulderSize}` : `Boulder Size: x${boulderSize}`}
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
                stateRef.current.targetX = Math.max(-6, Math.min(6, (curX / rect.width - 0.5) * 12));
              }
              if (dy < -25) {
                moved = true;
                stateRef.current.speed = 35;
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.speed = 20;

              if (!moved) {
                // Tap: Short Boost
                stateRef.current.speed = 35;
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
                setTimeout(() => { stateRef.current.speed = 20; }, 1000);
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            stateRef.current.speed = 38;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
            setTimeout(() => { stateRef.current.speed = 20; }, 1500);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-orange-500/30 rounded-full text-[10px] text-orange-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 볼더 조향 | 탭/더블탭: 부스트 가속 (버튼 없음)' : 'Drag L/R: Steer Boulder | Tap/Double Tap: Boost (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-orange-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '협곡 돌파 완주 성공!' : 'CANYON RUN COMPLETE!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '질주 거리' : 'Distance'}</span>
                <span className="text-orange-400 font-bold">{distance}m</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최대 볼더 배율' : 'Max Boulder Size'}</span>
                <span className="text-amber-400 font-bold">x{boulderSize}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 점수' : 'Final Score'}</span>
                <span className="text-yellow-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-black text-sm rounded-sm tracking-wider shadow-lg cursor-pointer"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Mountain, Zap } from 'lucide-react';
import { CardData } from '../types';

interface VoxelTerraQuakeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface TileBlock {
  mesh: THREE.Mesh;
  gridX: number;
  gridZ: number;
  height: number;
  targetHeight: number;
  isFalling: boolean;
  hasGem: boolean;
  gemMesh?: THREE.Mesh;
}

export const VoxelTerraQuakeGame: React.FC<VoxelTerraQuakeGameProps> = ({
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
  const [gemsMined, setGemsMined] = useState<number>(0);
  const [stompCooldown, setStompCooldown] = useState<number>(0);
  const [survivalTime, setSurvivalTime] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    playerX: 0,
    playerZ: 0,
    score: 0,
    gemsMined: 0,
    stompCooldown: 0,
    survivalTime: 0,
    isGameOver: false,
    playerMesh: null as THREE.Group | null,
    tiles: [] as TileBlock[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1712);
    scene.fog = new THREE.FogExp2(0x0f1712, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 16, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Earth Cavern Lighting
    const ambientLight = new THREE.AmbientLight(0x84cc16, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa3e635, 1.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Build 7x7 Grid of Floating Terra Tiles
    const gridSize = 7;
    const tileSize = 2.0;
    const tileGeo = new THREE.BoxGeometry(tileSize * 0.9, 1.0, tileSize * 0.9);
    const tileMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.8 });
    const gemGeo = new THREE.OctahedronGeometry(0.4);
    const gemMat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.8 });

    const tiles: TileBlock[] = [];
    const offset = (gridSize - 1) * tileSize * 0.5;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const mesh = new THREE.Mesh(tileGeo, tileMat);
        const posX = x * tileSize - offset;
        const posZ = z * tileSize - offset;
        mesh.position.set(posX, 0, posZ);
        scene.add(mesh);

        let gemMesh: THREE.Mesh | undefined;
        const hasGem = Math.random() < 0.2;
        if (hasGem) {
          gemMesh = new THREE.Mesh(gemGeo, gemMat);
          gemMesh.position.set(posX, 1.2, posZ);
          scene.add(gemMesh);
        }

        tiles.push({
          mesh,
          gridX: posX,
          gridZ: posZ,
          height: 0,
          targetHeight: 0,
          isFalling: false,
          hasGem,
          gemMesh
        });
      }
    }
    stateRef.current.tiles = tiles;

    // Build Earth Dragon Character (Green & Obsidian Stone Voxel)
    const playerGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.5 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), bodyMat);
    body.position.y = 0.7;
    playerGroup.add(body);

    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 4), hornMat);
    hornL.position.set(-0.35, 1.4, 0);
    playerGroup.add(hornL);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 4), hornMat);
    hornR.position.set(0.35, 1.4, 0);
    playerGroup.add(hornR);

    scene.add(playerGroup);
    stateRef.current.playerMesh = playerGroup;

    // Earth Stomp Shockwave Trigger
    const triggerStomp = () => {
      if (stateRef.current.isGameOver || stateRef.current.stompCooldown > 0) return;
      stateRef.current.stompCooldown = 2.5;
      setStompCooldown(2.5);

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

      // Shockwave Ring FX
      const ringGeo = new THREE.RingGeometry(0.5, 3.5, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xa3e635, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(stateRef.current.playerX, 0.1, stateRef.current.playerZ);
      scene.add(ring);

      let rScale = 1.0;
      const expandRing = () => {
        rScale += 0.2;
        ring.scale.setScalar(rScale);
        ringMat.opacity -= 0.05;
        if (ringMat.opacity > 0) {
          requestAnimationFrame(expandRing);
        } else {
          scene.remove(ring);
        }
      };
      expandRing();

      // Collect all nearby gems & stabilize adjacent tiles
      for (const t of stateRef.current.tiles) {
        const dist = Math.hypot(t.gridX - stateRef.current.playerX, t.gridZ - stateRef.current.playerZ);
        if (dist < 4.5) {
          if (t.hasGem && t.gemMesh) {
            t.hasGem = false;
            scene.remove(t.gemMesh);
            stateRef.current.gemsMined++;
            stateRef.current.score += 350;
            setGemsMined(stateRef.current.gemsMined);
            setScore(stateRef.current.score);
          }
          // Reset falling threat
          t.targetHeight = 0;
          t.isFalling = false;
        }
      }
    };

    // Keyboard Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver) return;
      const step = 1.8;
      const maxB = 6.0;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.playerX = Math.max(-maxB, stateRef.current.playerX - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.playerX = Math.min(maxB, stateRef.current.playerX + step);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        stateRef.current.playerZ = Math.max(-maxB, stateRef.current.playerZ - step);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        stateRef.current.playerZ = Math.min(maxB, stateRef.current.playerZ + step);
      } else if (e.key === ' ') {
        triggerStomp();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;
    let collapseTimer = 0;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      if (!state.isGameOver) {
        state.survivalTime += delta;
        setSurvivalTime(Math.floor(state.survivalTime));

        if (state.stompCooldown > 0) {
          state.stompCooldown = Math.max(0, state.stompCooldown - delta);
          setStompCooldown(parseFloat(state.stompCooldown.toFixed(1)));
        }

        // Move Player Smoothly
        if (playerGroup) {
          playerGroup.position.x += (state.playerX - playerGroup.position.x) * 12 * delta;
          playerGroup.position.z += (state.playerZ - playerGroup.position.z) * 12 * delta;
        }

        // Randomly pick tiles to shake and collapse
        collapseTimer += delta;
        if (collapseTimer > 1.2) {
          collapseTimer = 0;
          const targetTile = state.tiles[Math.floor(Math.random() * state.tiles.length)];
          if (targetTile) {
            targetTile.isFalling = true;
            targetTile.targetHeight = -6.0;
          }
        }

        // Update Tile Heights
        for (const t of state.tiles) {
          if (t.isFalling) {
            t.height += (t.targetHeight - t.height) * 4 * delta;
            t.mesh.position.y = t.height;
            if (t.gemMesh) t.gemMesh.position.y = t.height + 1.2;

            // Check if player standing on falling tile
            const dist = Math.hypot(t.gridX - state.playerX, t.gridZ - state.playerZ);
            if (dist < 1.0 && t.height < -1.5) {
              state.isGameOver = true;
              setIsGameOver(true);
              const reward = Math.min(50, Math.max(10, Math.floor(state.score / 200) + Math.floor(state.survivalTime * 0.8)));
              setRewardSns(reward);
              onReward(reward);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
            }

            // Restore tile after falling
            if (t.height < -5.5) {
              t.height = 0;
              t.targetHeight = 0;
              t.isFalling = false;
              t.mesh.position.y = 0;
            }
          }
        }

        // Winning Condition (Survive 45 seconds)
        if (state.survivalTime >= 45 && !state.isGameOver) {
          state.isGameOver = true;
          setIsGameOver(true);
          const winReward = 45;
          setRewardSns(winReward);
          onReward(winReward);
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
      <div className="relative z-10 w-full p-3 sm:p-4 flex items-center justify-between bg-slate-950/80 border-b border-lime-900/40 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-lime-400 text-slate-200 text-xs font-bold rounded-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-lime-950/70 border border-lime-500/50 rounded-sm text-lime-300">
            <Mountain size={13} className="text-lime-400" />
            <span>⏱️ {survivalTime}s / 45s</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 border border-amber-500/50 rounded-sm text-amber-300">
            <Trophy size={13} className="text-amber-400" />
            <span>{score.toLocaleString()}P</span>
          </div>
        </div>
      </div>

      {/* Mobile Touch D-Pad & Stomp Button */}
      {!isGameOver && (
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-between px-6 pointer-events-auto">
          {/* 4-Way D-Pad */}
          <div className="grid grid-cols-3 gap-1.5 w-36 h-36">
            <div />
            <button
              onPointerDown={() => { stateRef.current.playerZ = Math.max(-6, stateRef.current.playerZ - 1.8); }}
              className="bg-slate-900/80 border border-lime-500/60 text-lime-300 font-black rounded-sm active:scale-95 flex items-center justify-center shadow-md"
            >
              ▲
            </button>
            <div />
            <button
              onPointerDown={() => { stateRef.current.playerX = Math.max(-6, stateRef.current.playerX - 1.8); }}
              className="bg-slate-900/80 border border-lime-500/60 text-lime-300 font-black rounded-sm active:scale-95 flex items-center justify-center shadow-md"
            >
              ◀
            </button>
            <div className="bg-lime-950/40 rounded-sm flex items-center justify-center text-[10px] text-lime-400 font-bold">MOVE</div>
            <button
              onPointerDown={() => { stateRef.current.playerX = Math.min(6, stateRef.current.playerX + 1.8); }}
              className="bg-slate-900/80 border border-lime-500/60 text-lime-300 font-black rounded-sm active:scale-95 flex items-center justify-center shadow-md"
            >
              ▶
            </button>
            <div />
            <button
              onPointerDown={() => { stateRef.current.playerZ = Math.min(6, stateRef.current.playerZ + 1.8); }}
              className="bg-slate-900/80 border border-lime-500/60 text-lime-300 font-black rounded-sm active:scale-95 flex items-center justify-center shadow-md"
            >
              ▼
            </button>
            <div />
          </div>

          {/* Stomp Button */}
          <button
            disabled={stompCooldown > 0}
            onPointerDown={() => {
              const e = new KeyboardEvent('keydown', { key: ' ' });
              window.dispatchEvent(e);
            }}
            className={`w-28 h-28 self-end text-white text-xs font-black rounded-sm active:scale-95 flex flex-col items-center justify-center gap-1 shadow-lg border ${stompCooldown <= 0 ? 'bg-gradient-to-r from-lime-600 to-emerald-600 border-lime-400 animate-pulse shadow-[0_0_20px_rgba(132,204,22,0.8)] cursor-pointer' : 'bg-slate-800/80 border-slate-700 opacity-40 cursor-not-allowed'}`}
          >
            <Zap size={24} />
            <span>{stompCooldown > 0 ? `${stompCooldown}s` : (isKo ? '어스 스톰프' : 'TERRA STOMP')}</span>
          </button>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-lime-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(132,204,22,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {survivalTime >= 45 ? (isKo ? '지반 서바이벌 완주 성공!' : 'SURVIVAL COMPLETE!') : (isKo ? '지반 붕괴 낙하!' : 'TERRA COLLAPSED')}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '생존 시간' : 'Survival Time'}</span>
                <span className="text-lime-400 font-bold">{survivalTime}s</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '채굴한 대지 보석' : 'Gems Mined'}</span>
                <span className="text-amber-400 font-bold">{gemsMined}개</span>
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
              className="w-full py-3 bg-lime-600 hover:bg-lime-500 active:scale-98 text-slate-950 font-black text-sm rounded-sm tracking-wider shadow-lg cursor-pointer"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

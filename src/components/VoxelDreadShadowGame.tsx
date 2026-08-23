import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Eye, EyeOff, Shield, Zap, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelDreadShadowGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Searchlight {
  mesh: THREE.Mesh;
  coneMesh: THREE.Mesh;
  angle: number;
  speed: number;
  pos: THREE.Vector3;
}

export const VoxelDreadShadowGame: React.FC<VoxelDreadShadowGameProps> = ({
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
  const [hackProgress, setHackProgress] = useState<number>(0); // 0 ~ 100%
  const [stealthEnergy, setStealthEnergy] = useState<number>(100); // 0 ~ 100%
  const [isCloaked, setIsCloaked] = useState<boolean>(false);
  const [detectionLevel, setDetectionLevel] = useState<number>(0); // 0 ~ 100%
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    playerX: 0,
    playerZ: 14,
    isCloaked: false,
    stealthEnergy: 100,
    detectionLevel: 0,
    hackProgress: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    playerDragon: null as THREE.Group | null,
    searchlights: [] as Searchlight[],
    coreMesh: null as THREE.Mesh | null,
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050d);
    scene.fog = new THREE.FogExp2(0x05050d, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Dark Cyber Infiltration Lighting
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.5);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x6366f1, 1.2);
    moonLight.position.set(10, 25, 10);
    scene.add(moonLight);

    // Grid Floor
    const floorGeo = new THREE.PlaneGeometry(32, 40, 16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x090914, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Infiltration Obstacle Voxel Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const wallPositions = [
      [-6, 1.5, 6], [6, 1.5, 6],
      [-8, 1.5, -4], [8, 1.5, -4],
      [0, 1.5, 0]
    ];
    wallPositions.forEach(([wx, wy, wz]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 1), wallMat);
      wall.position.set(wx, wy, wz);
      scene.add(wall);
    });

    // Central Dark Core
    const coreGeo = new THREE.IcosahedronGeometry(1.6);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 1.6, -14);
    scene.add(coreMesh);
    stateRef.current.coreMesh = coreMesh;

    // Searchlight Towers
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const searchlights: Searchlight[] = [];

    const towerPositions = [
      [-7, 0, 1], [7, 0, 1],
      [-5, 0, -9], [5, 0, -9]
    ];

    towerPositions.forEach(([tx, ty, tz], idx) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4, 8), towerMat);
      tower.position.set(tx, 2, tz);
      scene.add(tower);

      const coneGeo = new THREE.ConeGeometry(3.5, 9, 16, 1, true);
      const cone = new THREE.Mesh(coneGeo, lightMat);
      cone.rotation.x = Math.PI / 3;
      cone.position.set(tx, 3.5, tz);
      scene.add(cone);

      searchlights.push({
        mesh: tower,
        coneMesh: cone,
        angle: idx * (Math.PI / 2),
        speed: (idx % 2 === 0 ? 1 : -1) * (1.2 + idx * 0.2),
        pos: new THREE.Vector3(tx, 0, tz)
      });
    });
    stateRef.current.searchlights = searchlights;

    // Dreadwing Shadow Character Mesh
    const dragonGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

    const dBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.4), bodyMat);
    dBody.position.y = 0.5;
    dragonGroup.add(dBody);

    const dWings = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.8), bodyMat);
    dWings.position.set(0, 0.6, 0);
    dragonGroup.add(dWings);

    const dEyes = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.15), eyeMat);
    dEyes.position.set(0, 0.6, -0.7);
    dragonGroup.add(dEyes);

    dragonGroup.position.set(0, 0, 14);
    scene.add(dragonGroup);
    stateRef.current.playerDragon = dragonGroup;

    // Toggle Shadow Cloak
    const toggleCloak = () => {
      if (stateRef.current.isGameOver) return;
      if (!stateRef.current.isCloaked && stateRef.current.stealthEnergy > 20) {
        stateRef.current.isCloaked = true;
        setIsCloaked(true);
        bodyMat.transparent = true;
        bodyMat.opacity = 0.3;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      } else {
        stateRef.current.isCloaked = false;
        setIsCloaked(false);
        bodyMat.transparent = false;
        bodyMat.opacity = 1.0;
      }
    };

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver) return;
      const step = 1.5;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.playerX = Math.max(-12, stateRef.current.playerX - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.playerX = Math.min(12, stateRef.current.playerX + step);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        stateRef.current.playerZ = Math.max(-14, stateRef.current.playerZ - step);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        stateRef.current.playerZ = Math.min(15, stateRef.current.playerZ + step);
      } else if (e.key === ' ') {
        toggleCloak();
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
        // Energy consumption during cloaking
        if (state.isCloaked) {
          state.stealthEnergy = Math.max(0, state.stealthEnergy - 25 * delta);
          setStealthEnergy(Math.floor(state.stealthEnergy));
          if (state.stealthEnergy <= 0) {
            toggleCloak();
          }
        } else {
          state.stealthEnergy = Math.min(100, state.stealthEnergy + 12 * delta);
          setStealthEnergy(Math.floor(state.stealthEnergy));
        }

        // Dragon Movement
        if (dragonGroup) {
          dragonGroup.position.x += (state.playerX - dragonGroup.position.x) * 10 * delta;
          dragonGroup.position.z += (state.playerZ - dragonGroup.position.z) * 10 * delta;
          dragonGroup.lookAt(state.playerX, 0, state.playerZ - 1);
        }

        // Rotate Searchlights & Check Detection
        let inSearchlight = false;
        for (const sl of state.searchlights) {
          sl.angle += sl.speed * delta;
          sl.coneMesh.rotation.y = sl.angle;

          // Projected beam position on floor
          const beamTargetX = sl.pos.x + Math.sin(sl.angle) * 5;
          const beamTargetZ = sl.pos.z + Math.cos(sl.angle) * 5;

          const distToBeam = Math.hypot(state.playerX - beamTargetX, state.playerZ - beamTargetZ);
          if (distToBeam < 3.2) {
            inSearchlight = true;
          }
        }

        // Detection buildup if exposed in searchlight
        if (inSearchlight && !state.isCloaked) {
          state.detectionLevel = Math.min(100, state.detectionLevel + 60 * delta);
          setDetectionLevel(Math.floor(state.detectionLevel));
          if (state.detectionLevel >= 100) {
            state.isGameOver = true;
            setIsGameOver(true);
            const reward = Math.max(10, Math.floor(state.hackProgress * 0.3));
            setRewardSns(reward);
            onReward(reward);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
          }
        } else {
          state.detectionLevel = Math.max(0, state.detectionLevel - 20 * delta);
          setDetectionLevel(Math.floor(state.detectionLevel));
        }

        // Core Hacking Check (Near core at z = -14)
        const distToCore = Math.hypot(state.playerX - 0, state.playerZ - (-14));
        if (distToCore < 3.5) {
          state.hackProgress = Math.min(100, state.hackProgress + 25 * delta);
          state.score += 150 * delta;
          setHackProgress(Math.floor(state.hackProgress));
          setScore(Math.floor(state.score));

          if (coreMesh) {
            coreMesh.rotation.y += 3.0 * delta;
          }

          if (state.hackProgress >= 100 && !state.isVictory) {
            state.isVictory = true;
            setIsVictory(true);
            state.isGameOver = true;
            setIsGameOver(true);
            const winReward = 50;
            setRewardSns(winReward);
            onReward(winReward);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          }
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
            <Zap size={13} className="text-purple-400 animate-pulse" />
            <span>{isKo ? '해킹 진행도' : 'Hack'}: {hackProgress}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 border border-amber-500/50 rounded-sm text-amber-300">
            <Trophy size={13} className="text-amber-400" />
            <span>{score.toLocaleString()}P</span>
          </div>
        </div>
      </div>

      {/* Stealth Energy & Detection Gauges */}
      <div className="relative z-10 w-full px-4 pt-2 flex flex-col items-center gap-1.5 pointer-events-none">
        {/* Detection Gauge */}
        <div className="w-full max-w-md flex justify-between text-[10px] text-rose-300 font-bold">
          <span>{isKo ? '경보 탐지 수치' : 'DETECTION ALERT'}</span>
          <span>{detectionLevel}%</span>
        </div>
        <div className="w-full max-w-md h-2 bg-slate-900 border border-rose-800 rounded-sm overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${detectionLevel > 60 ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,1)]' : 'bg-orange-500'}`}
            style={{ width: `${detectionLevel}%` }}
          />
        </div>

        {/* Cloak Energy Gauge */}
        <div className="w-full max-w-md flex justify-between text-[10px] text-purple-300 font-bold mt-1">
          <span>{isKo ? '섀도우 은신 에너지' : 'STEALTH CLOAK ENERGY'}</span>
          <span>{stealthEnergy}%</span>
        </div>
        <div className="w-full max-w-md h-2 bg-slate-900 border border-purple-800 rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 transition-all duration-200"
            style={{ width: `${stealthEnergy}%` }}
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
                stateRef.current.playerX = Math.max(-12, Math.min(12, stateRef.current.playerX + dx * 0.03));
                stateRef.current.playerZ = Math.max(-14, Math.min(15, stateRef.current.playerZ + dy * 0.03));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Toggle Cloak
                const evt = new KeyboardEvent('keydown', { key: ' ' });
                window.dispatchEvent(evt);
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
          {isKo ? '드래그: 잠입 이동 | 탭: 은신 섀도우 토글 (버튼 없음)' : 'Drag: Sneak Move | Tap: Toggle Cloak (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-purple-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isVictory ? (isKo ? '암흑 기지 침투 해킹 완료!' : 'INFILTRATION SUCCESS!') : (isKo ? '경보 감지 체포' : 'DETECTED & CAPTURED')}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '코어 해킹 진행도' : 'Core Hack Progress'}</span>
                <span className="text-purple-400 font-bold">{hackProgress}%</span>
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

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_dread_shadow') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [hackProgress, setHackProgress] = useState<number>(0);
  const [stealthEnergy, setStealthEnergy] = useState<number>(100);
  const [isCloaked, setIsCloaked] = useState<boolean>(false);
  const [detectionLevel, setDetectionLevel] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

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
    isPaused: false,
    startTime: Date.now(),
    playerDragon: null as THREE.Group | null,
    searchlights: [] as Searchlight[],
    coreMesh: null as THREE.Mesh | null
  });

  const toggleCloak = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;

    if (!s.isCloaked && s.stealthEnergy > 10) {
      s.isCloaked = true;
      setIsCloaked(true);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      s.isCloaked = false;
      setIsCloaked(false);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

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

    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.5);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x6366f1, 1.2);
    moonLight.position.set(10, 25, 10);
    scene.add(moonLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(32, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x090914, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Obstacle Walls
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

    // Core Terminal at [0, 1.5, -14]
    const coreGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 0.8 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 1.5, -14);
    scene.add(core);
    stateRef.current.coreMesh = core;

    // Searchlights
    stateRef.current.searchlights = [];
    const lightCoords = [[-6, 0, 8], [6, 0, 8], [0, 0, -2], [-5, 0, -10], [5, 0, -10]];
    lightCoords.forEach(([lx, ly, lz], idx) => {
      const sGroup = new THREE.Group();
      const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.5, 12), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      sBase.position.y = 0.75;
      sGroup.add(sBase);

      const coneGeo = new THREE.ConeGeometry(3.5, 9, 16, 1, true);
      coneGeo.rotateX(Math.PI / 2);
      const coneMat = new THREE.MeshBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(0, 1.2, 4.5);
      sGroup.add(cone);

      sGroup.position.set(lx, ly, lz);
      scene.add(sGroup);

      stateRef.current.searchlights.push({
        mesh: sBase,
        coneMesh: cone,
        angle: idx * (Math.PI / 2.5),
        speed: 1.2 + idx * 0.2,
        pos: new THREE.Vector3(lx, ly, lz)
      });
    });

    // Player Shadow Infiltrator
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3 }));
    pBody.position.y = 0.7;
    playerGroup.add(pBody);

    playerGroup.position.set(0, 0, 14);
    scene.add(playerGroup);
    stateRef.current.playerDragon = playerGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Cloak Energy
      if (s.isCloaked) {
        s.stealthEnergy = Math.max(0, s.stealthEnergy - dt * 25);
        if (s.stealthEnergy <= 0) {
          s.isCloaked = false;
          setIsCloaked(false);
        }
      } else {
        s.stealthEnergy = Math.min(100, s.stealthEnergy + dt * 10);
      }
      setStealthEnergy(Math.round(s.stealthEnergy));

      if (playerGroup) {
        playerGroup.position.set(s.playerX, 0, s.playerZ);
        (pBody.material as THREE.MeshStandardMaterial).opacity = s.isCloaked ? 0.3 : 1.0;
        (pBody.material as THREE.MeshStandardMaterial).transparent = s.isCloaked;
      }

      // Rotate Searchlights & Detect Player
      let detectedNow = false;
      s.searchlights.forEach(sl => {
        sl.angle += sl.speed * dt;
        sl.coneMesh.parent?.rotation.set(0, sl.angle, 0);

        if (!s.isCloaked) {
          const coneDir = new THREE.Vector3(Math.sin(sl.angle), 0, Math.cos(sl.angle));
          const toPlayer = new THREE.Vector3(s.playerX - sl.pos.x, 0, s.playerZ - sl.pos.z);
          const dist = toPlayer.length();

          if (dist < 8.5) {
            toPlayer.normalize();
            const dot = coneDir.dot(toPlayer);
            if (dot > 0.85) {
              detectedNow = true;
            }
          }
        }
      });

      if (detectedNow) {
        s.detectionLevel = Math.min(100, s.detectionLevel + dt * 45);
      } else {
        s.detectionLevel = Math.max(0, s.detectionLevel - dt * 20);
      }
      setDetectionLevel(Math.round(s.detectionLevel));

      if (s.detectionLevel >= 100 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_dread_shadow',
          gameTitle: '복셀 드레드 섀도우',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: false
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }

      // Hack Core Terminal
      const distToCore = Math.hypot(s.playerX - 0, s.playerZ - (-14));
      if (distToCore < 3.0) {
        s.hackProgress = Math.min(100, s.hackProgress + dt * 25);
        s.score += 20;
        setHackProgress(Math.round(s.hackProgress));
        setScore(s.score);

        if (s.hackProgress >= 100 && !s.isGameOver) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_dread_shadow',
            gameTitle: '복셀 드레드 섀도우',
            durationSeconds: duration,
            score: s.score + 1000,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = stateRef.current;
    s.playerX = 0;
    s.playerZ = 14;
    s.isCloaked = false;
    s.stealthEnergy = 100;
    s.detectionLevel = 0;
    s.hackProgress = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setIsCloaked(false);
    setStealthEnergy(100);
    setDetectionLevel(0);
    setHackProgress(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 드레드 섀도우' : 'Voxel Dread Shadow'}
        language={language}
        hp={{ current: 100 - detectionLevel, max: 100 }}
        telemetries={[
          { label: isKo ? '해킹' : 'Hack', value: `${hackProgress}%`, color: 'text-purple-300' },
          { label: isKo ? '은신' : 'Cloak', value: `${stealthEnergy}%`, color: isCloaked ? 'text-indigo-400' : 'text-cyan-300' },
          { label: isKo ? '경보' : 'Alert', value: `${detectionLevel}%`, color: detectionLevel > 50 ? 'text-rose-400' : 'text-emerald-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
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
                toggleCloak();
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
        <div className="px-3 py-1 bg-black/75 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 잠입 이동 | 탭: 은신 섀도우 토글 (버튼 없음)' : 'Drag: Sneak Move | Tap: Toggle Cloak (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_dread_shadow"
          gameTitle={isKo ? '3D 복셀 드레드 섀도우: 기지 잠입 해킹' : 'Voxel Dread Shadow: Stealth Infiltration'}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};

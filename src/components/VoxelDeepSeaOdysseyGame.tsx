import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDeepSeaOdysseyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDeepSeaOdysseyGame: React.FC<VoxelDeepSeaOdysseyGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_deep_sea_odyssey') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [oxygen, setOxygen] = useState<number>(100);
  const [depth, setDepth] = useState<number>(100);
  const [crystals, setCrystals] = useState<number>(0);
  const targetCrystals = 6;
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    posX: 0,
    posY: -10,
    posZ: 0,
    rotY: 0,
    oxygen: 100,
    battery: 100,
    crystals: 0,
    keys: { w: false, s: false, a: false, d: false },
    crystalsList: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; collected: boolean }[],
    krakenTentacles: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; hp: number }[],
    torpedoes: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null,
    subGroup: null as THREE.Group | null
  });

  const fireTorpedo = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const torpGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
    torpGeo.rotateX(Math.PI / 2);
    const torpMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const torp = new THREE.Mesh(torpGeo, torpMat);
    torp.position.set(s.posX, s.posY, s.posZ - 1.5);
    s.scene.add(torp);

    s.torpedoes.push({
      mesh: torp,
      vx: Math.sin(s.rotY) * 35,
      vy: 0,
      vz: -Math.cos(s.rotY) * 35,
      life: 3.0
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020815);
    scene.fog = new THREE.FogExp2(0x020815, 0.025);
    gameStateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x002244, 0.6);
    scene.add(ambientLight);

    const subSpot = new THREE.SpotLight(0xaaffff, 4, 60, Math.PI / 4, 0.4);
    scene.add(subSpot);

    // Deep Trench Seabed
    const seabedGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    seabedGeo.rotateX(-Math.PI / 2);
    const seabedMat = new THREE.MeshLambertMaterial({ color: 0x081525, flatShading: true });
    const seabed = new THREE.Mesh(seabedGeo, seabedMat);
    seabed.position.y = -80;
    scene.add(seabed);

    // Voxel Submarine
    const subGroup = new THREE.Group();
    const subBodyGeo = new THREE.BoxGeometry(1.6, 1.4, 3.8);
    const subBodyMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const subBody = new THREE.Mesh(subBodyGeo, subBodyMat);
    subBody.position.y = 0.7;
    subGroup.add(subBody);

    const glassDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    glassDome.position.set(0, 0.8, -1.2);
    subGroup.add(glassDome);

    scene.add(subGroup);
    gameStateRef.current.subGroup = subGroup;

    // Spawn 6 Aether Crystals
    const crystalGeo = new THREE.OctahedronGeometry(0.8, 0);
    const crystalMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8 });
    gameStateRef.current.crystalsList = [];

    for (let i = 0; i < targetCrystals; i++) {
      const cMesh = new THREE.Mesh(crystalGeo, crystalMat);
      const cx = (Math.random() - 0.5) * 35;
      const cy = -15 - Math.random() * 25;
      const cz = -20 - Math.random() * 50;
      cMesh.position.set(cx, cy, cz);
      scene.add(cMesh);

      gameStateRef.current.crystalsList.push({
        mesh: cMesh,
        x: cx,
        y: cy,
        z: cz,
        collected: false
      });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Oxygen Depletion
      s.oxygen = Math.max(0, s.oxygen - dt * 1.2);
      setOxygen(Math.round(s.oxygen));

      if (s.oxygen <= 0 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_deep_sea_odyssey',
          gameTitle: '복셀 딥씨 오디세이',
          durationSeconds: duration,
          score: s.crystals * 400,
          difficulty: 'HARD',
          isVictory: false
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }

      // Movement
      if (s.keys.w) s.posZ -= 16 * dt;
      if (s.keys.s) s.posZ += 16 * dt;
      if (s.keys.a) s.posX -= 16 * dt;
      if (s.keys.d) s.posX += 16 * dt;

      s.posX = Math.max(-28, Math.min(28, s.posX));
      s.posZ = Math.max(-70, Math.min(20, s.posZ));
      s.posY = -10 + s.posZ * 0.3;
      setDepth(Math.round(Math.abs(s.posY) * 20));

      if (s.subGroup) {
        s.subGroup.position.set(s.posX, s.posY, s.posZ);
      }

      // Spotlight Follow
      subSpot.position.set(s.posX, s.posY + 1, s.posZ);
      subSpot.target.position.set(s.posX, s.posY, s.posZ - 10);

      // Camera Follow
      camera.position.set(s.posX, s.posY + 4, s.posZ + 8);
      camera.lookAt(s.posX, s.posY, s.posZ - 5);

      // Collect Crystals
      s.crystalsList.forEach(c => {
        if (!c.collected) {
          c.mesh.rotation.y += dt * 2;
          const dist = Math.hypot(c.x - s.posX, c.y - s.posY, c.z - s.posZ);
          if (dist < 2.8) {
            c.collected = true;
            scene.remove(c.mesh);
            s.crystals += 1;
            s.oxygen = Math.min(100, s.oxygen + 15);
            setCrystals(s.crystals);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.crystals >= targetCrystals) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_deep_sea_odyssey',
                gameTitle: '복셀 딥씨 오디세이',
                durationSeconds: duration,
                score: s.crystals * 500 + Math.round(s.oxygen * 10),
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
        }
      });

      // Update Torpedoes
      for (let i = s.torpedoes.length - 1; i >= 0; i--) {
        const torp = s.torpedoes[i];
        torp.mesh.position.x += torp.vx * dt;
        torp.mesh.position.z += torp.vz * dt;
        torp.life -= dt;
        if (torp.life <= 0) {
          scene.remove(torp.mesh);
          s.torpedoes.splice(i, 1);
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
    const s = gameStateRef.current;
    s.posX = 0;
    s.posZ = 0;
    s.oxygen = 100;
    s.crystals = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setOxygen(100);
    setCrystals(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 딥씨 오디세이' : 'Voxel Deep Sea Odyssey'}
        language={language}
        hp={{ current: oxygen, max: 100 }}
        telemetries={[
          { label: isKo ? '크리스탈' : 'Crystals', value: `${crystals}/${targetCrystals}개`, color: 'text-cyan-300' },
          { label: isKo ? '수심' : 'Depth', value: `${depth}m`, color: 'text-amber-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          gameStateRef.current.isPaused = !isPaused;
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
                gameStateRef.current.keys.w = dy < -8;
                gameStateRef.current.keys.s = dy > 8;
                gameStateRef.current.keys.a = dx < -8;
                gameStateRef.current.keys.d = dx > 8;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              gameStateRef.current.keys.w = false;
              gameStateRef.current.keys.s = false;
              gameStateRef.current.keys.a = false;
              gameStateRef.current.keys.d = false;

              if (!moved) {
                // Tap: Fire Torpedo
                fireTorpedo();
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
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 잠수함 조종 & 심해 탐사 | 탭: 어뢰 발사 (버튼 없음)' : 'Drag: Steer Submarine | Tap: Fire Torpedo (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_deep_sea_odyssey"
          gameTitle={isKo ? '3D 복셀 딥씨 오디세이: 아틀란티스 탐사' : 'Voxel Deep Sea Odyssey: Atlantis'}
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

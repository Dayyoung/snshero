import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelWaterSlideGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface WaterDrop {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  collected: boolean;
}

export const VoxelWaterSlideGame: React.FC<VoxelWaterSlideGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_water_slide') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const targetDistance = 800;
  const [speedKmh, setSpeedKmh] = useState<number>(65);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    tubeX: 0,
    tubeZ: 0,
    steerDir: 0,
    speed: 35,
    distance: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    tubeGroup: null as THREE.Group | null,
    waterDrops: [] as WaterDrop[],
    scene: null as THREE.Scene | null
  });

  const triggerBoost = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.speed = 55;
    setSpeedKmh(95);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setTimeout(() => {
      s.speed = 35;
      setSpeedKmh(65);
    }, 1500);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0x38bdf8, 40, 120);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 1.2, -15);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfef08a, 1.8);
    sun.position.set(30, 80, 40);
    scene.add(sun);

    // Water Slide Half-Pipe Track
    const slideGeo = new THREE.CylinderGeometry(6, 6, 1200, 16, 1, true, Math.PI, Math.PI);
    const slideMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      side: THREE.BackSide
    });
    const slideMesh = new THREE.Mesh(slideGeo, slideMat);
    slideMesh.rotation.x = Math.PI / 2;
    slideMesh.position.set(0, 0, -500);
    scene.add(slideMesh);

    // Voxel Inflatable Water Tube
    const tubeGroup = new THREE.Group();
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.28, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 })
    );
    torus.rotation.x = Math.PI / 2;
    tubeGroup.add(torus);

    const rider = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.65, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    rider.position.y = 0.45;
    tubeGroup.add(rider);

    tubeGroup.position.set(0, 0.35, 0);
    scene.add(tubeGroup);
    stateRef.current.tubeGroup = tubeGroup;

    // Spawn Water Ring Drops
    stateRef.current.waterDrops = [];
    for (let i = 1; i <= 35; i++) {
      const oz = -i * 25;
      const ox = (Math.random() - 0.5) * 6;
      const drop = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.15, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 })
      );
      drop.position.set(ox, 0.5, oz);
      scene.add(drop);

      stateRef.current.waterDrops.push({
        mesh: drop,
        x: ox,
        z: oz,
        collected: false
      });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Downhill motion
      s.tubeZ -= s.speed * dt;
      s.distance = Math.min(targetDistance, Math.round(-s.tubeZ));
      setDistance(s.distance);

      // Horizontal steer
      s.tubeX += s.steerDir * 14 * dt;
      s.tubeX = THREE.MathUtils.clamp(s.tubeX, -3.5, 3.5);

      if (tubeGroup) {
        tubeGroup.position.set(s.tubeX, 0.35, s.tubeZ);
        tubeGroup.rotation.z = -s.steerDir * 0.3;
        tubeGroup.rotation.y = s.steerDir * 0.2;
      }

      // Check Drop Pickup
      s.waterDrops.forEach(d => {
        if (!d.collected && Math.hypot(s.tubeX - d.x, s.tubeZ - d.z) < 1.6) {
          d.collected = true;
          scene.remove(d.mesh);
          s.score += 150;
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      });

      // Camera Follow
      camera.position.set(s.tubeX * 0.4, 4, s.tubeZ + 8);
      camera.lookAt(s.tubeX * 0.4, 1.2, s.tubeZ - 15);

      // Finish Check
      if (s.distance >= targetDistance && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_water_slide',
          gameTitle: '복셀 워터 슬라이드',
          durationSeconds: duration,
          score: s.score + 2500,
          difficulty: 'HARD',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
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
    s.tubeX = 0;
    s.tubeZ = 0;
    s.steerDir = 0;
    s.score = 0;
    s.distance = 0;
    s.speed = 35;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.waterDrops.forEach(d => {
      d.collected = false;
      s.scene?.add(d.mesh);
    });
    setScore(0);
    setDistance(0);
    setSpeedKmh(65);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 워터 슬라이드' : 'Voxel Water Slide'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}m/${targetDistance}m`, color: 'text-cyan-300' },
          { label: isKo ? '속도' : 'Speed', value: `${speedKmh}KM/H`, color: speedKmh > 70 ? 'text-amber-400 font-bold' : 'text-emerald-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-yellow-300' }
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

              if (Math.abs(dx) > 8) {
                moved = true;
                stateRef.current.steerDir = dx > 0 ? 1 : -1;
              }
              if (dy < -25) {
                triggerBoost();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.steerDir = 0;

              if (!moved) {
                // Tap: Turbo Boost
                triggerBoost();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={triggerBoost}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-400/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 슬라이드 조향 | 탭/더블탭/위로: 워터젯 부스트 (버튼 없음)' : 'Drag L/R: Steer | Tap/Double Tap/Up: Turbo Boost (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_water_slide"
          gameTitle={isKo ? '3D 복셀 워터 슬라이드: 하이퍼 스플래시' : 'Voxel Water Slide: Hyper Splash'}
          sportType="racing"
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
export default VoxelWaterSlideGame;

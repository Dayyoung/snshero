import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelJetskiWaterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface BuoyGate {
  mesh: THREE.Group;
  z: number;
  cleared: boolean;
}

export const VoxelJetskiWaterGame: React.FC<VoxelJetskiWaterGameProps> = ({
  deck: _deck,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_jetski_water') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(0);
  const targetDistance = 400;
  const [turboBoost, setTurboBoost] = useState<number>(100);
  const [stuntScore, setStuntScore] = useState<number>(0);
  const [isStunting, setIsStunting] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    jetskiPos: new THREE.Vector3(0, 0.4, 0),
    speed: 0.6,
    isTurbo: false,
    turbo: 100,
    isAirborne: false,
    jumpY: 0,
    airRot: 0,
    stuntScore: 0,
    distance: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    buoys: [] as BuoyGate[],
    jetskiMesh: null as THREE.Group | null
  });

  const activateTurbo = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.turbo < 30) return;
    s.isTurbo = true;
    s.turbo -= 30;
    s.speed = 1.2;
    setTurboBoost(Math.floor(s.turbo));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setTimeout(() => {
      s.speed = 0.6;
      s.isTurbo = false;
    }, 2000);
  };

  const triggerAirStunt = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.isAirborne) return;
    s.isAirborne = true;
    setIsStunting(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0284c7);
    scene.fog = new THREE.FogExp2(0x0284c7, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Ocean Water Plane
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 600),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, transparent: true, opacity: 0.9 })
    );
    ocean.rotation.x = -Math.PI / 2;
    scene.add(ocean);

    // Jetski Mesh
    const jetskiGroup = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4 })
    );
    hull.position.y = 0.3;
    jetskiGroup.add(hull);

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    seat.position.set(0, 0.7, 0.2);
    jetskiGroup.add(seat);

    jetskiGroup.position.set(0, 0.4, 0);
    scene.add(jetskiGroup);
    stateRef.current.jetskiMesh = jetskiGroup;

    // Spawn 10 Buoy Gates along z
    stateRef.current.buoys = [];
    for (let i = 0; i < 10; i++) {
      const bGroup = new THREE.Group();
      const bL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
      bL.position.set(-4, 0.6, 0);
      bGroup.add(bL);

      const bR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
      bR.position.set(4, 0.6, 0);
      bGroup.add(bR);

      const bz = -30 - i * 40;
      bGroup.position.set(0, 0, bz);
      scene.add(bGroup);

      stateRef.current.buoys.push({
        mesh: bGroup,
        z: bz,
        cleared: false
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

      // Jetski Movement
      s.distance += s.speed * 40 * dt;
      setDistance(Math.min(targetDistance, Math.round(s.distance)));

      // Turbo Recovery
      s.turbo = Math.min(100, s.turbo + dt * 8);
      setTurboBoost(Math.round(s.turbo));

      // Air Stunt Physics
      if (s.isAirborne) {
        s.airRot += dt * 10;
        s.jumpY = Math.sin(s.airRot) * 2.5;

        if (jetskiGroup) {
          jetskiGroup.rotation.z = s.airRot;
          jetskiGroup.position.y = 0.4 + Math.max(0, s.jumpY);
        }

        if (s.airRot >= Math.PI * 2) {
          s.isAirborne = false;
          s.airRot = 0;
          s.jumpY = 0;
          setIsStunting(false);
          s.stuntScore += 300;
          s.score += 300;
          setStuntScore(s.stuntScore);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      } else {
        if (jetskiGroup) {
          jetskiGroup.position.y = 0.4 + Math.sin(now * 0.005) * 0.1;
          jetskiGroup.rotation.z = 0;
          jetskiGroup.position.x = s.jetskiPos.x;
        }
      }

      // Camera Follow
      camera.position.set(s.jetskiPos.x, 5, 10);
      camera.lookAt(s.jetskiPos.x, 1, -10);

      // Move buoys
      s.buoys.forEach(b => {
        b.mesh.position.z = b.z + s.distance;

        if (!b.cleared && b.mesh.position.z > 0 && b.mesh.position.z < 6) {
          if (Math.abs(s.jetskiPos.x) < 4.0) {
            b.cleared = true;
            s.stuntScore += 200;
            s.score += 200;
            setStuntScore(s.stuntScore);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
        }
      });

      // Finish Check
      if (s.distance >= targetDistance && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_jetski_water',
          gameTitle: '복셀 제트스키 워터 레이스',
          durationSeconds: duration,
          score: s.score + 1000,
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
    s.jetskiPos.set(0, 0.4, 0);
    s.speed = 0.6;
    s.turbo = 100;
    s.isAirborne = false;
    s.jumpY = 0;
    s.airRot = 0;
    s.stuntScore = 0;
    s.distance = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.buoys.forEach(b => (b.cleared = false));
    setDistance(0);
    setTurboBoost(100);
    setStuntScore(0);
    setIsStunting(false);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 제트스키 워터 레이스' : 'Voxel Jetski Water Race'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}/${targetDistance}m`, color: 'text-cyan-300' },
          { label: isKo ? '터보' : 'Turbo', value: `${turboBoost}%`, color: 'text-amber-300' },
          { label: isKo ? '스턴트' : 'Stunt', value: isStunting ? '✨ 360° SPIN' : `${stuntScore}P`, color: isStunting ? 'text-pink-400 animate-bounce' : 'text-emerald-300' }
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
                stateRef.current.jetskiPos.x = Math.max(-12, Math.min(12, stateRef.current.jetskiPos.x + dx * 0.04));
              }
              if (dy < -25) {
                moved = true;
                activateTurbo();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Air Stunt
                triggerAirStunt();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={activateTurbo}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 조향 | 탭: 360° 공중 스턴트 | 더블탭: 하이드로 터보 (버튼 없음)' : 'Drag L/R: Steer | Tap: Air Stunt | Double Tap: Turbo (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_jetski_water"
          gameTitle={isKo ? '3D 복셀 제트스키 워터 레이스: 수상 파도타기' : 'Voxel Jetski Water Race: Wave Riding'}
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

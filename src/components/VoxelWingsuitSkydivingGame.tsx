import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelWingsuitSkydivingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelWingsuitSkydivingGame: React.FC<VoxelWingsuitSkydivingGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_wingsuit_skydiving') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(0);
  const totalGoal = 1000;
  const [score, setScore] = useState<number>(0);
  const [speedKmh, setSpeedKmh] = useState<number>(180);
  const [ringsPassed, setRingsPassed] = useState<number>(0);
  const totalRings = 20;
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posY: 20,
    posZ: 0,
    targetX: 0,
    targetY: 20,
    speed: 45,
    score: 0,
    distance: 0,
    ringsPassed: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    diverMesh: null as THREE.Group | null,
    rings: [] as { mesh: THREE.Mesh; passed: boolean; z: number; x: number; y: number }[],
    scene: null as THREE.Scene | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x70b5ff);
    scene.fog = new THREE.FogExp2(0x70b5ff, 0.008);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 800);
    camera.position.set(0, 22, 6);
    camera.lookAt(0, 20, -20);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x556677, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // Wingsuit Glider Model
    const diverGroup = new THREE.Group();
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    head.position.set(0, 0.25, -0.6);
    diverGroup.add(head);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.4, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    diverGroup.add(body);

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
    );
    wings.position.set(0, 0.05, 0);
    diverGroup.add(wings);

    diverGroup.position.set(0, 20, 0);
    scene.add(diverGroup);
    stateRef.current.diverMesh = diverGroup;

    // Spawn 20 Glowing Sky Rings
    stateRef.current.rings = [];
    for (let i = 1; i <= totalRings; i++) {
      const rz = -i * 50;
      const rx = (Math.random() - 0.5) * 12;
      const ry = 14 + Math.random() * 12;

      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.25, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.6 })
      );
      ringMesh.position.set(rx, ry, rz);
      scene.add(ringMesh);

      stateRef.current.rings.push({
        mesh: ringMesh,
        passed: false,
        x: rx,
        y: ry,
        z: rz
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

      // Forward gliding
      s.posZ -= s.speed * dt;
      s.distance = Math.min(totalGoal, Math.round(-s.posZ));
      setDistance(s.distance);

      // Smooth steering
      s.posX += (s.targetX - s.posX) * 6 * dt;
      s.posY += (s.targetY - s.posY) * 6 * dt;

      if (diverGroup) {
        diverGroup.position.set(s.posX, s.posY, s.posZ);
        diverGroup.rotation.z = (s.targetX - s.posX) * -0.15;
        diverGroup.rotation.x = (s.targetY - s.posY) * 0.08;
      }

      // Ring Collision Check
      s.rings.forEach(r => {
        if (!r.passed && Math.abs(s.posZ - r.z) < 2.0) {
          if (Math.hypot(s.posX - r.x, s.posY - r.y) < 2.5) {
            r.passed = true;
            s.ringsPassed += 1;
            s.score += 200;
            setRingsPassed(s.ringsPassed);
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
        }
      });

      // Camera Follow
      camera.position.set(s.posX * 0.4, s.posY + 2, s.posZ + 6);
      camera.lookAt(s.posX * 0.4, s.posY, s.posZ - 20);

      // Finish Line Check
      if (s.distance >= totalGoal && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_wingsuit_skydiving',
          gameTitle: '복셀 윙슈트 스카이다이빙',
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
    s.posX = 0;
    s.posY = 20;
    s.posZ = 0;
    s.targetX = 0;
    s.targetY = 20;
    s.score = 0;
    s.distance = 0;
    s.ringsPassed = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.rings.forEach(r => { r.passed = false; });
    setScore(0);
    setDistance(0);
    setRingsPassed(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 윙슈트 스카이다이빙' : 'Voxel Wingsuit Skydiving'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}m/${totalGoal}m`, color: 'text-cyan-300' },
          { label: isKo ? '링' : 'Rings', value: `${ringsPassed}/${totalRings}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '속도' : 'Speed', value: `${speedKmh}KM/H`, color: 'text-emerald-300' },
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
          className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerMove={(e) => {
            const normX = (e.clientX / window.innerWidth - 0.5) * 2;
            const normY = -(e.clientY / window.innerHeight - 0.5) * 2;
            stateRef.current.targetX = normX * 8.0;
            stateRef.current.targetY = 20 + normY * 8.0;
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-sky-400/30 rounded-full text-[10px] text-sky-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 윙슈트 360° 비행 활공 조향 (버튼 없음)' : 'Drag Screen: 360° Wingsuit Gliding Steer (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_wingsuit_skydiving"
          gameTitle={isKo ? '3D 복셀 윙슈트 스카이다이빙: 협곡 활공' : 'Voxel Wingsuit Skydiving: Canyon Glide'}
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
export default VoxelWingsuitSkydivingGame;

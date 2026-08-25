import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_spike_rolling') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [boulderSize, setBoulderSize] = useState<number>(1.0);
  const [distance, setDistance] = useState<number>(0);
  const maxDistance = 1000;
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    rollerX: 0,
    rollerZ: 0,
    speed: 25,
    targetX: 0,
    scale: 1.0,
    score: 0,
    combo: 0,
    distance: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    rollerMesh: null as THREE.Group | null,
    obstacles: [] as ObstacleBlock[],
    scene: null as THREE.Scene | null
  });

  const triggerBoost = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.speed = 42;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setTimeout(() => { s.speed = 25; }, 1500);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x180f08);
    scene.fog = new THREE.FogExp2(0x180f08, 0.02);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 2, -15);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xfbbf24, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf97316, 1.8);
    dirLight.position.set(10, 25, 10);
    scene.add(dirLight);

    // Canyon Floor Track
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 1200),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -500);
    scene.add(floor);

    // Spike Roller Boulder
    const rollerGroup = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
    );
    rollerGroup.add(core);

    // Add Spikes
    for (let i = 0; i < 12; i++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.8 })
      );
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.2;
      const sinPhi = Math.sin(phi);
      spike.position.set(r * sinPhi * Math.cos(theta), r * sinPhi * Math.sin(theta), r * Math.cos(phi));
      spike.lookAt(spike.position.clone().multiplyScalar(2));
      rollerGroup.add(spike);
    }

    rollerGroup.position.set(0, 1.2, 0);
    scene.add(rollerGroup);
    stateRef.current.rollerMesh = rollerGroup;

    // Spawn Obstacles
    stateRef.current.obstacles = [];
    for (let i = 1; i <= 35; i++) {
      const oz = -i * 30;
      const ox = (Math.random() - 0.5) * 10;
      const type: ObstacleBlock['type'] = i % 4 === 0 ? 'gem' : (i % 7 === 0 ? 'tnt' : 'rock');

      let color = 0x57534e;
      let pts = 100;
      if (type === 'gem') { color = 0x06b6d4; pts = 250; }
      else if (type === 'tnt') { color = 0xef4444; pts = 350; }

      const oMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.4, 1.4),
        new THREE.MeshStandardMaterial({ color })
      );
      oMesh.position.set(ox, 0.7, oz);
      scene.add(oMesh);

      stateRef.current.obstacles.push({
        mesh: oMesh,
        pos: new THREE.Vector3(ox, 0.7, oz),
        type,
        points: pts,
        broken: false
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

      // Forward motion
      s.rollerZ -= s.speed * dt;
      s.distance = Math.min(maxDistance, Math.round(-s.rollerZ));
      setDistance(s.distance);

      // Horizontal steer
      s.rollerX += (s.targetX - s.rollerX) * 8 * dt;

      if (rollerGroup) {
        rollerGroup.position.set(s.rollerX, 1.2 * s.scale, s.rollerZ);
        rollerGroup.rotation.x -= (s.speed * dt) / (1.2 * s.scale);
        rollerGroup.scale.set(s.scale, s.scale, s.scale);
      }

      // Check Obstacle Crush
      s.obstacles.forEach(o => {
        if (!o.broken && Math.hypot(s.rollerX - o.pos.x, s.rollerZ - o.pos.z) < 1.6 * s.scale) {
          o.broken = true;
          scene.remove(o.mesh);
          s.combo += 1;
          s.score += o.points * Math.min(5, s.combo);
          s.scale = Math.min(2.5, s.scale + 0.05);
          setCombo(s.combo);
          setScore(s.score);
          setBoulderSize(parseFloat(s.scale.toFixed(1)));
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      });

      // Camera Follow
      camera.position.set(s.rollerX * 0.4, 6 * s.scale, s.rollerZ + 12);
      camera.lookAt(s.rollerX * 0.4, 2, s.rollerZ - 15);

      // Finish Line Check
      if (s.distance >= maxDistance && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_spike_rolling',
          gameTitle: '복셀 스파이크 롤링',
          durationSeconds: duration,
          score: s.score + 2000,
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
    s.rollerX = 0;
    s.rollerZ = 0;
    s.targetX = 0;
    s.scale = 1.0;
    s.score = 0;
    s.combo = 0;
    s.distance = 0;
    s.speed = 25;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.obstacles.forEach(o => {
      o.broken = false;
      s.scene?.add(o.mesh);
    });
    setScore(0);
    setCombo(0);
    setBoulderSize(1.0);
    setDistance(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 스파이크 롤링' : 'Voxel Spike Rolling'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}m/${maxDistance}m`, color: 'text-cyan-300' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: combo > 1 ? 'text-amber-400 font-bold' : 'text-slate-400' },
          { label: isKo ? '크기' : 'Size', value: `x${boulderSize}`, color: 'text-orange-400 font-bold' },
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

              if (Math.abs(dx) > 6) {
                moved = true;
                stateRef.current.targetX = THREE.MathUtils.clamp((curX / rect.width - 0.5) * 12, -6, 6);
              }
              if (dy < -25) {
                moved = true;
                triggerBoost();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Boost
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
        <div className="px-3 py-1 bg-black/75 border border-orange-500/30 rounded-full text-[10px] text-orange-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 볼더 조향 | 탭/더블탭/위로: 부스트 가속 (버튼 없음)' : 'Drag L/R: Steer Boulder | Tap/Double Tap/Up: Boost (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_spike_rolling"
          gameTitle={isKo ? '3D 복셀 스파이크 롤링: 협곡 파괴 질주' : 'Voxel Spike Rolling: Canyon Rush'}
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
export default VoxelSpikeRollingGame;

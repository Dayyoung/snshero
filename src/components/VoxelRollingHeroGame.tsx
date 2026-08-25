import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelRollingHeroGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelRollingHeroGame: React.FC<VoxelRollingHeroGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_rolling_hero') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(0);
  const totalStars = 20;
  const [distance, setDistance] = useState<number>(0);
  const goalDistance = 500;
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posY: 1.2,
    posZ: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    stars: 0,
    score: 0,
    distance: 0,
    moveDir: new THREE.Vector2(0, 0),
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    ballMesh: null as THREE.Mesh | null,
    starList: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; collected: boolean }[],
    scene: null as THREE.Scene | null
  });

  const jump = () => {
    const s = stateRef.current;
    if (s.posY > 1.4 || s.isGameOver || s.isVictory || s.isPaused) return;
    s.vy = 14;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 300);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(20, 50, 20);
    scene.add(sun);

    // Track
    const track = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1, 600),
      new THREE.MeshLambertMaterial({ color: 0x44aa88 })
    );
    track.position.set(0, -0.5, -280);
    scene.add(track);

    // Rolling Ball
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xff3366, shininess: 80 })
    );
    ball.position.set(0, 1.2, 0);
    scene.add(ball);
    stateRef.current.ballMesh = ball;

    // Spawn 20 Stars
    stateRef.current.starList = [];
    const starGeo = new THREE.OctahedronGeometry(0.8, 0);
    const starMat = new THREE.MeshPhongMaterial({ color: 0xffdd00, emissive: 0x886600 });

    for (let i = 0; i < totalStars; i++) {
      const sMesh = new THREE.Mesh(starGeo, starMat);
      const sz = -i * 25 - 20;
      const sx = (Math.random() - 0.5) * 6;
      sMesh.position.set(sx, 1.5, sz);
      scene.add(sMesh);

      stateRef.current.starList.push({
        mesh: sMesh,
        x: sx,
        y: 1.5,
        z: sz,
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

      // Accelerate forward
      s.vz = -18;
      s.vx = s.moveDir.x * 12;

      s.posX += s.vx * dt;
      s.posZ += s.vz * dt;

      // Jump & Gravity
      s.vy -= 32 * dt;
      s.posY += s.vy * dt;

      if (s.posY <= 1.2) {
        s.posY = 1.2;
        s.vy = 0;
      }

      s.distance = Math.min(goalDistance, Math.round(-s.posZ));
      setDistance(s.distance);

      if (ball) {
        ball.position.set(s.posX, s.posY, s.posZ);
        ball.rotation.x -= 8 * dt;
        ball.rotation.z -= s.vx * dt * 0.5;
      }

      // Check Star Collection
      s.starList.forEach(st => {
        if (!st.collected && Math.hypot(s.posX - st.x, s.posZ - st.z) < 1.8 && Math.abs(s.posY - st.y) < 1.8) {
          st.collected = true;
          scene.remove(st.mesh);
          s.stars += 1;
          s.score += 150;
          setStars(s.stars);
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      });

      // Camera Follow
      camera.position.set(s.posX * 0.4, s.posY + 5, s.posZ + 12);
      camera.lookAt(s.posX * 0.4, s.posY, s.posZ - 5);

      // Check Track Fall
      if (Math.abs(s.posX) > 5.5 && s.posY <= 1.2 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_rolling_hero',
          gameTitle: '복셀 롤링 히어로',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: false
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }

      // Check Goal Reached
      if (s.distance >= goalDistance && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_rolling_hero',
          gameTitle: '복셀 롤링 히어로',
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
    s.posX = 0;
    s.posY = 1.2;
    s.posZ = 0;
    s.vx = 0;
    s.vy = 0;
    s.vz = 0;
    s.stars = 0;
    s.score = 0;
    s.distance = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.starList.forEach(st => {
      st.collected = false;
      s.scene?.add(st.mesh);
    });
    setStars(0);
    setDistance(0);
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
        title={isKo ? '복셀 롤링 히어로' : 'Voxel Rolling Hero'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}m/${goalDistance}m`, color: 'text-cyan-300' },
          { label: isKo ? '별' : 'Stars', value: `${stars}/${totalStars}`, color: 'text-amber-300' },
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
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const dx = curX - startX;

              if (Math.abs(dx) > 6) {
                moved = true;
                stateRef.current.moveDir.x = THREE.MathUtils.clamp(dx * 0.02, -1, 1);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.x = 0;

              if (!moved) {
                // Tap: Jump
                jump();
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
        <div className="px-3 py-1 bg-black/75 border border-rose-500/30 rounded-full text-[10px] text-rose-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 볼 롤링 조종 | 탭: 점프 (버튼 없음)' : 'Drag L/R: Steer Ball | Tap: Jump (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_rolling_hero"
          gameTitle={isKo ? '3D 복셀 롤링 히어로: 트랙 완주 레이스' : 'Voxel Rolling Hero: Track Rush'}
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

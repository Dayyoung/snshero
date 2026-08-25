import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSnowboardExtremeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSnowboardExtremeGame: React.FC<VoxelSnowboardExtremeGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_snowboard_extreme') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(0);
  const maxDistance = 1000;
  const [trickScore, setTrickScore] = useState<number>(0);
  const [rank, setRank] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    posX: 0,
    posY: 0,
    posZ: 0,
    speedZ: 40,
    steerX: 0,
    isAirborne: false,
    airTime: 0,
    trickScore: 0,
    isBoosting: false,
    rank: 1,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    boarder: null as THREE.Group | null,
    trees: [] as { x: number; z: number; mesh: THREE.Mesh }[]
  });

  const jumpTrick = () => {
    const s = gameStateRef.current;
    if (s.isAirborne || s.isGameOver || s.isVictory || s.isPaused) return;
    s.isAirborne = true;
    s.airTime = 0.8;
    s.trickScore += 250;
    setTrickScore(s.trickScore);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const triggerBoost = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.isBoosting = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setTimeout(() => { s.isBoosting = false; }, 2000);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xddeeff);
    scene.fog = new THREE.FogExp2(0xddeeff, 0.012);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Downhill Slope Terrain
    const slope = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 1200, 32, 64),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
    );
    slope.rotation.x = -Math.PI / 2;
    slope.position.set(0, 0, -500);
    scene.add(slope);

    // Snowboarder Group
    const boarder = new THREE.Group();
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.1, 3.0),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    board.position.y = 0.1;
    boarder.add(board);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.4, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    body.position.y = 0.8;
    boarder.add(body);

    boarder.position.set(0, 0, 0);
    scene.add(boarder);
    gameStateRef.current.boarder = boarder;

    // Generate Trees
    gameStateRef.current.trees = [];
    for (let i = 0; i < 40; i++) {
      const tree = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x15803d })
      );
      const tx = (Math.random() - 0.5) * 60;
      const tz = -i * 28 - 30;
      tree.position.set(tx, 2, tz);
      scene.add(tree);
      gameStateRef.current.trees.push({ x: tx, z: tz, mesh: tree });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      const currentSpeed = s.isBoosting ? 65 : 40;
      s.posZ -= currentSpeed * dt;
      s.posX += s.steerX * 18 * dt;
      s.posX = THREE.MathUtils.clamp(s.posX, -25, 25);

      const currentDist = Math.min(maxDistance, Math.round(-s.posZ));
      setDistance(currentDist);

      // Airborne jump physics
      if (s.isAirborne) {
        s.airTime -= dt;
        s.posY = Math.sin((1 - s.airTime / 0.8) * Math.PI) * 3.5;
        if (s.airTime <= 0) {
          s.isAirborne = false;
          s.posY = 0;
        }
      }

      if (boarder) {
        boarder.position.set(s.posX, s.posY, s.posZ);
        boarder.rotation.y = -s.steerX * 0.4;
        boarder.rotation.z = s.steerX * 0.2;
      }

      // Camera Follow
      camera.position.set(s.posX * 0.5, s.posY + 5, s.posZ + 10);
      camera.lookAt(s.posX * 0.5, s.posY + 1, s.posZ - 10);

      // Finish Line Check
      if (currentDist >= maxDistance && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_snowboard_extreme',
          gameTitle: '복셀 스노보드 익스트림',
          durationSeconds: duration,
          score: s.trickScore + 2000,
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
    const s = gameStateRef.current;
    s.posX = 0;
    s.posY = 0;
    s.posZ = 0;
    s.steerX = 0;
    s.isAirborne = false;
    s.airTime = 0;
    s.trickScore = 0;
    s.isBoosting = false;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setDistance(0);
    setTrickScore(0);
    setRank(1);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 스노보드 익스트림' : 'Voxel Snowboard Extreme'}
        language={language}
        telemetries={[
          { label: isKo ? '진행' : 'Dist', value: `${distance}m/${maxDistance}m`, color: 'text-cyan-300' },
          { label: isKo ? '순위' : 'Rank', value: `#${rank}/8`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '트릭' : 'Trick', value: `${trickScore}P`, color: 'text-yellow-300' }
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

              if (Math.abs(dx) > 6) {
                moved = true;
                gameStateRef.current.steerX = THREE.MathUtils.clamp(dx * 0.02, -1, 1);
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
              gameStateRef.current.steerX = 0;

              if (!moved) {
                // Tap: Jump Trick
                jumpTrick();
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
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 슬로프 조향 | 탭: 점프 트릭 | 더블탭/위로: 부스터 (버튼 없음)' : 'Drag L/R: Steer | Tap: Jump Trick | Double Tap/Up: Boost (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_snowboard_extreme"
          gameTitle={isKo ? '3D 복셀 스노보드: 다운힐 챔피언십' : 'Voxel Snowboard: Downhill Race'}
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
export default VoxelSnowboardExtremeGame;

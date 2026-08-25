import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSkyParkourGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PlatformData {
  id: number;
  mesh: THREE.Mesh;
  type: 'normal' | 'slime' | 'ice' | 'checkpoint' | 'goal';
  pos: THREE.Vector3;
  size: THREE.Vector3;
}

export const VoxelSkyParkourGame: React.FC<VoxelSkyParkourGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_sky_parkour') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [stageProgress, setStageProgress] = useState<number>(0);
  const totalPlatforms = 25;
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [fallsCount, setFallsCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posY: 1.5,
    posZ: 0,
    velX: 0,
    velY: 0,
    velZ: 0,
    isGrounded: true,
    moveDir: new THREE.Vector2(0, 0),
    stageProgress: 0,
    fallsCount: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    lastCheckpoint: new THREE.Vector3(0, 1.5, 0),
    playerMesh: null as THREE.Group | null,
    platforms: [] as PlatformData[],
    scene: null as THREE.Scene | null
  });

  const jump = () => {
    const s = stateRef.current;
    if (!s.isGrounded || s.isGameOver || s.isVictory || s.isPaused) return;
    s.velY = 12;
    s.isGrounded = false;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0x38bdf8, 30, 80);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Player Model
    const pGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), new THREE.MeshStandardMaterial({ color: 0x6366f1 }));
    pBody.position.y = 0.7;
    pGroup.add(pBody);
    pGroup.position.set(0, 1.5, 0);
    scene.add(pGroup);
    stateRef.current.playerMesh = pGroup;

    // Generate 25 Sky Parkour Platforms
    stateRef.current.platforms = [];
    let curX = 0;
    let curY = 0;
    let curZ = 0;

    for (let i = 0; i < totalPlatforms; i++) {
      let type: PlatformData['type'] = 'normal';
      let color = 0x64748b;

      if (i === 0) {
        type = 'checkpoint';
        color = 0x22c55e;
      } else if (i === totalPlatforms - 1) {
        type = 'goal';
        color = 0xf59e0b;
      } else if (i % 8 === 0) {
        type = 'checkpoint';
        color = 0x3b82f6;
      } else if (i % 4 === 0) {
        type = 'slime';
        color = 0x10b981;
      }

      const pSize = new THREE.Vector3(3.0, 0.8, 3.0);
      const pMesh = new THREE.Mesh(
        new THREE.BoxGeometry(pSize.x, pSize.y, pSize.z),
        new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
      );
      pMesh.position.set(curX, curY, curZ);
      scene.add(pMesh);

      stateRef.current.platforms.push({
        id: i,
        mesh: pMesh,
        type,
        pos: new THREE.Vector3(curX, curY, curZ),
        size: pSize
      });

      // Next platform step
      curZ -= 5.5 + Math.random() * 2.0;
      curX += (Math.random() - 0.5) * 4.0;
      curY += (Math.random() - 0.2) * 1.5;
    }

    // Timer
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Horizontal movement
      const speed = 8;
      s.posX += s.moveDir.x * speed * dt;
      s.posZ += s.moveDir.y * speed * dt;

      // Gravity & Vertical physics
      s.velY -= 28 * dt;
      s.posY += s.velY * dt;

      // Check Platform Collisions
      s.isGrounded = false;
      for (const p of s.platforms) {
        const minX = p.pos.x - p.size.x / 2 - 0.3;
        const maxX = p.pos.x + p.size.x / 2 + 0.3;
        const minZ = p.pos.z - p.size.z / 2 - 0.3;
        const maxZ = p.pos.z + p.size.z / 2 + 0.3;
        const topY = p.pos.y + p.size.y / 2;

        if (s.posX >= minX && s.posX <= maxX && s.posZ >= minZ && s.posZ <= maxZ) {
          if (s.posY >= topY && s.posY <= topY + 0.8 && s.velY <= 0) {
            s.posY = topY;
            s.velY = 0;
            s.isGrounded = true;

            if (p.type === 'slime') {
              s.velY = 18;
              s.isGrounded = false;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            } else if (p.type === 'checkpoint') {
              s.lastCheckpoint.set(p.pos.x, topY + 1.0, p.pos.z);
            } else if (p.type === 'goal' && !s.isGameOver) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_sky_parkour',
                gameTitle: '복셀 스카이 파쿠르',
                durationSeconds: duration,
                score: s.score + 2500,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }

            s.stageProgress = Math.max(s.stageProgress, p.id);
            setStageProgress(s.stageProgress);
            s.score = s.stageProgress * 120;
            setScore(s.score);
            break;
          }
        }
      }

      // Check Fall below void
      if (s.posY < -15) {
        s.fallsCount += 1;
        setFallsCount(s.fallsCount);
        s.posX = s.lastCheckpoint.x;
        s.posY = s.lastCheckpoint.y;
        s.posZ = s.lastCheckpoint.z;
        s.velY = 0;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3');
      }

      if (pGroup) {
        pGroup.position.set(s.posX, s.posY, s.posZ);
      }

      // Camera follow
      camera.position.set(s.posX, s.posY + 4.5, s.posZ + 7.5);
      camera.lookAt(s.posX, s.posY + 0.8, s.posZ - 5);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      clearInterval(timerInterval);
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
    s.posY = 1.5;
    s.posZ = 0;
    s.velY = 0;
    s.stageProgress = 0;
    s.fallsCount = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.lastCheckpoint.set(0, 1.5, 0);
    setStageProgress(0);
    setFallsCount(0);
    setScore(0);
    setElapsedTime(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 스카이 파쿠르' : 'Voxel Sky Parkour'}
        language={language}
        telemetries={[
          { label: isKo ? '진행' : 'Stage', value: `${stageProgress + 1}/${totalPlatforms}`, color: 'text-amber-300' },
          { label: isKo ? '추락' : 'Falls', value: `${fallsCount}회`, color: fallsCount > 3 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
          { label: isKo ? '시간' : 'Time', value: `${elapsedTime}s`, color: 'text-emerald-300' }
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

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                moved = true;
                stateRef.current.moveDir.x = Math.abs(dx) > 8 ? (dx > 0 ? 1 : -1) : 0;
                stateRef.current.moveDir.y = Math.abs(dy) > 8 ? (dy > 0 ? 1 : -1) : 0;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.x = 0;
              stateRef.current.moveDir.y = 0;

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
        <div className="px-3 py-1 bg-black/75 border border-sky-500/30 rounded-full text-[10px] text-sky-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 발판 이동 | 탭: 파쿠르 도약 점프 (버튼 없음)' : 'Drag: Move on Platform | Tap: Parkour Jump (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_sky_parkour"
          gameTitle={isKo ? '3D 복셀 스카이 파쿠르: 천공 등반' : 'Voxel Sky Parkour: Sky Climb'}
          sportType="parkour"
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
export default VoxelSkyParkourGame;

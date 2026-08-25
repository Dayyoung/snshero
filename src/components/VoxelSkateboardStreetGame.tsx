import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSkateboardStreetGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSkateboardStreetGame: React.FC<VoxelSkateboardStreetGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_skateboard_street') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const totalGoal = 1000;
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [trickText, setTrickText] = useState<string>('');
  const [isGrinding, setIsGrinding] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posY: 0.25,
    posZ: 0,
    targetX: 0,
    speed: 0.85,
    jumpVelY: 0,
    isInAir: false,
    isGrinding: false,
    boardFlipAngle: 0,
    combo: 1,
    score: 0,
    distance: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    skaterMesh: null as THREE.Group | null,
    boardMesh: null as THREE.Group | null,
    rails: [] as { x: number; zStart: number; zEnd: number; height: number }[],
    obstacles: [] as { x: number; z: number; width: number; height: number; type: 'bin' | 'cone' | 'rail' }[]
  });

  const handleOllie = () => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver || s.isInAir) return;
    s.isInAir = true;
    s.isGrinding = false;
    setIsGrinding(false);
    s.jumpVelY = 0.24;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleKickflip = () => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver || !s.isInAir) return;
    s.boardFlipAngle += Math.PI * 2;
    s.combo += 1;
    s.score += 250 * s.combo;
    setScore(s.score);
    setComboMultiplier(s.combo);
    setTrickText(`🔥 KICKFLIP 360° x${s.combo}!`);
    setTimeout(() => setTrickText(''), 1000);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0x38bdf8, 30, 110);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 3.5, 6.5);
    camera.lookAt(0, 1.0, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    dirLight.position.set(30, 50, 30);
    scene.add(dirLight);

    // Street Floor
    const street = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 1200),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0, -500);
    scene.add(street);

    // Skater & Board Group
    const skaterGroup = new THREE.Group();
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    board.position.y = 0.1;
    skaterGroup.add(board);

    const rider = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2563eb })
    );
    rider.position.y = 0.8;
    skaterGroup.add(rider);

    skaterGroup.position.set(0, 0.25, 0);
    scene.add(skaterGroup);
    stateRef.current.skaterMesh = skaterGroup;
    stateRef.current.boardMesh = skaterGroup;

    // Generate Rails & Obstacles
    stateRef.current.rails = [];
    stateRef.current.obstacles = [];
    for (let i = 1; i <= 20; i++) {
      const rz = -i * 45;
      const rx = (i % 2 === 0 ? 1 : -1) * 3;
      const rMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 18, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
      );
      rMesh.rotation.x = Math.PI / 2;
      rMesh.position.set(rx, 0.6, rz);
      scene.add(rMesh);

      stateRef.current.rails.push({
        x: rx,
        zStart: rz + 9,
        zEnd: rz - 9,
        height: 0.6
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

      // Forward movement
      s.posZ -= s.speed * 60 * dt;
      s.distance = Math.min(totalGoal, Math.round(-s.posZ));
      setDistance(s.distance);

      // Horizontal steer
      s.posX += (s.targetX - s.posX) * 8 * dt;

      // Jump & Gravity
      if (s.isInAir) {
        s.jumpVelY -= 0.65 * dt;
        s.posY += s.jumpVelY;

        if (s.posY <= 0.25) {
          s.posY = 0.25;
          s.jumpVelY = 0;
          s.isInAir = false;
          s.combo = 1;
          setComboMultiplier(1);
        }
      }

      // Check Rail Grind
      let grinding = false;
      s.rails.forEach(r => {
        if (Math.abs(s.posX - r.x) < 0.6 && s.posZ <= r.zStart && s.posZ >= r.zEnd) {
          grinding = true;
          s.posY = r.height;
          s.isInAir = false;
          s.score += Math.round(150 * dt * 10);
          setScore(s.score);
        }
      });
      s.isGrinding = grinding;
      setIsGrinding(grinding);

      if (skaterGroup) {
        skaterGroup.position.set(s.posX, s.posY, s.posZ);
        skaterGroup.rotation.y = (s.targetX - s.posX) * 0.15;
      }

      // Camera Follow
      camera.position.set(s.posX * 0.4, s.posY + 3.5, s.posZ + 6.5);
      camera.lookAt(s.posX * 0.4, s.posY + 1.0, s.posZ - 10);

      // Goal Reach Check
      if (s.distance >= totalGoal && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_skateboard_street',
          gameTitle: '복셀 스트리트 스케이트보드',
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
    s.posY = 0.25;
    s.posZ = 0;
    s.targetX = 0;
    s.score = 0;
    s.distance = 0;
    s.combo = 1;
    s.isGameOver = false;
    s.isInAir = false;
    s.isGrinding = false;
    s.startTime = Date.now();
    setScore(0);
    setDistance(0);
    setComboMultiplier(1);
    setIsGrinding(false);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 스트리트 스케이트' : 'Voxel Street Skateboard'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}m/${totalGoal}m`, color: 'text-cyan-300' },
          { label: isKo ? '콤보' : 'Combo', value: `x${comboMultiplier}`, color: comboMultiplier > 1 ? 'text-amber-400 font-bold' : 'text-slate-400' },
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

      {/* Grind / Trick Overlay */}
      {isGrinding && (
        <div className="absolute top-14 left-4 flex items-center gap-1.5 bg-amber-400 border border-[#201d1d] text-[#201d1d] px-2.5 py-1 rounded-sm text-xs font-black animate-pulse z-10 pointer-events-none shadow-xs">
          <span>{isKo ? '🔥 50-50 레일 그라인드 중!!' : '🔥 50-50 RAIL GRINDING!'}</span>
        </div>
      )}

      {trickText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-400 border border-[#201d1d] text-[#201d1d] px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-md z-10 pointer-events-none animate-bounce">
          {trickText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const clientX = moveEvt.clientX;
              const normX = (clientX / window.innerWidth - 0.5) * 2;
              stateRef.current.targetX = normX * 6.5;

              if (Math.abs(clientX - (startX + rect.left)) > 15) {
                moved = true;
                if (stateRef.current.isInAir) {
                  handleKickflip();
                  window.removeEventListener('pointermove', onMove);
                }
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Ollie jump or Air Kickflip
                if (stateRef.current.isInAir) {
                  handleKickflip();
                } else {
                  handleOllie();
                }
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
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 카빙 조향 | 탭: 올리 점프 | 공중 탭/스와이프: 킥플립 360 (버튼 없음)' : 'Drag: Carve Steer | Tap: Ollie | Air Tap/Swipe: Kickflip 360 (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_skateboard_street"
          gameTitle={isKo ? '3D 복셀 스트리트 스케이트: 그라인드 마스터' : 'Voxel Street Skateboard: Grind Master'}
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

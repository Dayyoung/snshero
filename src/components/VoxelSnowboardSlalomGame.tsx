import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSnowboardSlalomGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSnowboardSlalomGame: React.FC<VoxelSnowboardSlalomGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_snowboard_slalom') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const totalGoal = 1000;
  const [gatesPassed, setGatesPassed] = useState<number>(0);
  const totalGates = 20;
  const [trickText, setTrickText] = useState<string>('');
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
    carveAngle: 0,
    score: 0,
    distance: 0,
    gatesPassed: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    riderMesh: null as THREE.Group | null,
    gates: [] as { x: number; z: number; color: 'red' | 'blue'; passed: boolean; missed: boolean }[]
  });

  const handleJumpTrick = () => {
    const s = stateRef.current;
    if (s.isInAir || s.isGameOver || s.isVictory || s.isPaused) return;
    s.isInAir = true;
    s.jumpVelY = 0.22;
    s.score += 200;
    setScore(s.score);
    setTrickText(isKo ? '🔥 MUTE GRAB +200P!' : '🔥 MUTE GRAB +200P!');
    setTimeout(() => setTrickText(''), 1000);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe);
    scene.fog = new THREE.Fog(0xdbeafe, 40, 150);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 3.8, 7.0);
    camera.lookAt(0, 1.2, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x93c5fd, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(30, 60, 30);
    scene.add(dirLight);

    // Mountain Slope
    const slope = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 1200),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
    );
    slope.rotation.x = -Math.PI / 2;
    slope.position.set(0, 0, -500);
    scene.add(slope);

    // Rider Group
    const riderGroup = new THREE.Group();
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.08, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4 })
    );
    board.position.y = 0.08;
    riderGroup.add(board);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.3, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2563eb })
    );
    body.position.y = 0.8;
    riderGroup.add(body);

    riderGroup.position.set(0, 0.25, 0);
    scene.add(riderGroup);
    stateRef.current.riderMesh = riderGroup;

    // Generate 20 Slalom Gates
    stateRef.current.gates = [];
    for (let i = 1; i <= totalGates; i++) {
      const gz = -i * 50;
      const gx = (i % 2 === 0 ? 1 : -1) * (3.5 + Math.random() * 2.0);
      const color: 'red' | 'blue' = i % 2 === 0 ? 'red' : 'blue';

      const poleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8),
        new THREE.MeshStandardMaterial({ color: color === 'red' ? 0xef4444 : 0x3b82f6 })
      );
      poleMesh.position.set(gx, 1.25, gz);
      scene.add(poleMesh);

      stateRef.current.gates.push({
        x: gx,
        z: gz,
        color,
        passed: false,
        missed: false
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
      s.posZ -= s.speed * 60 * dt;
      s.distance = Math.min(totalGoal, Math.round(-s.posZ));
      setDistance(s.distance);

      // Carving steer
      s.posX += (s.targetX - s.posX) * 7 * dt;

      // Airborne Jump
      if (s.isInAir) {
        s.jumpVelY -= 0.65 * dt;
        s.posY += s.jumpVelY;
        if (s.posY <= 0.25) {
          s.posY = 0.25;
          s.jumpVelY = 0;
          s.isInAir = false;
        }
      }

      if (riderGroup) {
        riderGroup.position.set(s.posX, s.posY, s.posZ);
        riderGroup.rotation.y = (s.targetX - s.posX) * 0.15;
        riderGroup.rotation.z = (s.targetX - s.posX) * -0.08;
      }

      // Check Gate Pass
      s.gates.forEach(g => {
        if (!g.passed && !g.missed && s.posZ <= g.z + 1.0 && s.posZ >= g.z - 1.0) {
          if (Math.abs(s.posX - g.x) < 2.5) {
            g.passed = true;
            s.gatesPassed += 1;
            s.score += 150;
            setGatesPassed(s.gatesPassed);
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          } else {
            g.missed = true;
          }
        }
      });

      // Camera Follow
      camera.position.set(s.posX * 0.4, s.posY + 3.8, s.posZ + 7.0);
      camera.lookAt(s.posX * 0.4, s.posY + 1.2, s.posZ - 10);

      // Goal Reach Check
      if (s.distance >= totalGoal && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_snowboard_slalom',
          gameTitle: '복셀 스노보드 슬라롬',
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
    s.gatesPassed = 0;
    s.isInAir = false;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.gates.forEach(g => {
      g.passed = false;
      g.missed = false;
    });
    setScore(0);
    setDistance(0);
    setGatesPassed(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 스노보드 슬라롬' : 'Voxel Snowboard Slalom'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}m/${totalGoal}m`, color: 'text-cyan-300' },
          { label: isKo ? '게이트' : 'Gates', value: `${gatesPassed}/${totalGates}`, color: 'text-amber-400 font-bold' },
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

      {/* Trick Notification Banner */}
      {trickText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-cyan-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg z-10 pointer-events-none animate-bounce">
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
              stateRef.current.targetX = normX * 7.0;

              if (Math.abs(clientX - (startX + rect.left)) > 15) {
                moved = true;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Jump Trick
                handleJumpTrick();
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
          {isKo ? '좌우 드래그: 슬라롬 카빙 회전 | 탭: 뮬트 그랩 점프 트릭 (버튼 없음)' : 'Drag L/R: Slalom Carve | Tap: Mute Grab Trick (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_snowboard_slalom"
          gameTitle={isKo ? '3D 복셀 스노보드: 슬라롬 챔피언' : 'Voxel Snowboard: Slalom Championship'}
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
export default VoxelSnowboardSlalomGame;

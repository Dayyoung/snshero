import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDartsBarGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDartsBarGame: React.FC<VoxelDartsBarGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_darts_bar') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const totalRounds = 8;
  const [dartsLeft, setDartsLeft] = useState<number>(3);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    aimX: 0,
    aimY: 0,
    swayTime: 0,
    isThrowing: false,
    dartPos: new THREE.Vector3(0, 1.6, 2.5),
    dartVel: new THREE.Vector3(0, 0, 0),
    isDartFlying: false,
    activeDartMesh: null as THREE.Group | null,
    stuckDarts: [] as THREE.Group[],
    totalScore: 0,
    round: 1,
    dartsInRound: 3,
    combo: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    zoomLevel: 1.0,
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const handleThrowDart = () => {
    const s = stateRef.current;
    if (s.isDartFlying || s.dartsInRound <= 0 || s.isGameOver || s.isPaused || !s.scene) return;

    s.isDartFlying = true;
    s.dartsInRound -= 1;
    setDartsLeft(s.dartsInRound);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const dartGroup = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    shaft.rotation.x = Math.PI / 2;
    dartGroup.add(shaft);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.24;
    dartGroup.add(tip);

    dartGroup.position.set(s.aimX, 1.6 + s.aimY, 2.4);
    s.scene.add(dartGroup);
    s.activeDartMesh = dartGroup;

    s.dartPos.copy(dartGroup.position);
    s.dartVel.set(0, 0, -22);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120d18);
    scene.fog = new THREE.Fog(0x120d18, 5, 20);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
    camera.position.set(0, 1.65, 3.2);
    camera.lookAt(0, 1.73, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.6);
    scene.add(ambientLight);

    const boardSpot = new THREE.SpotLight(0xfff3cc, 2.5);
    boardSpot.position.set(0, 3.0, 1.5);
    boardSpot.target.position.set(0, 1.73, 0);
    boardSpot.angle = Math.PI / 4;
    scene.add(boardSpot);
    scene.add(boardSpot.target);

    // Pub Back Wall & Floor
    const wallGeo = new THREE.PlaneGeometry(16, 10);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1f1726, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 2.5, -0.05);
    scene.add(wall);

    // Dartboard Cylinder Mesh
    const boardGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.04, 32);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.rotation.x = Math.PI / 2;
    board.position.set(0, 1.73, 0);
    scene.add(board);

    // Bullseye Ring
    const bullGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16);
    const bullMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.3 });
    const bull = new THREE.Mesh(bullGeo, bullMat);
    bull.rotation.x = Math.PI / 2;
    bull.position.set(0, 1.73, 0.01);
    scene.add(bull);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Update Flying Dart
      if (s.isDartFlying && s.activeDartMesh) {
        s.dartPos.addScaledVector(s.dartVel, dt);
        s.activeDartMesh.position.copy(s.dartPos);

        // Impact Board at Z = 0
        if (s.dartPos.z <= 0.02) {
          s.isDartFlying = false;
          s.stuckDarts.push(s.activeDartMesh);

          // Calculate Hit Distance to Bullseye
          const dist = Math.hypot(s.dartPos.x - 0, s.dartPos.y - 1.73);
          let points = 50;
          if (dist < 0.06) {
            points = 200; // Bullseye
            s.combo += 1;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          } else if (dist < 0.22) {
            points = 100; // Triple/Double ring
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          } else {
            points = 40;
            s.combo = 0;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }

          s.totalScore += points;
          setTotalScore(s.totalScore);
          setCombo(s.combo);

          // Round Transition
          if (s.dartsInRound <= 0) {
            if (s.round >= totalRounds) {
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_darts_bar',
                gameTitle: '복셀 다츠 바',
                durationSeconds: duration,
                score: s.totalScore,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            } else {
              s.round += 1;
              s.dartsInRound = 3;
              setCurrentRound(s.round);
              setDartsLeft(3);
              // Clear stuck darts after round
              setTimeout(() => {
                s.stuckDarts.forEach(d => scene.remove(d));
                s.stuckDarts = [];
              }, 600);
            }
          }
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
    const s = stateRef.current;
    s.totalScore = 0;
    s.round = 1;
    s.dartsInRound = 3;
    s.combo = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.stuckDarts.forEach(d => s.scene?.remove(d));
    s.stuckDarts = [];
    setTotalScore(0);
    setCurrentRound(1);
    setDartsLeft(3);
    setCombo(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 다츠 바' : 'Voxel Darts Bar'}
        language={language}
        telemetries={[
          { label: isKo ? '점수' : 'Score', value: `${totalScore}P`, color: 'text-amber-300' },
          { label: isKo ? '라운드' : 'Round', value: `R${currentRound}/${totalRounds}`, color: 'text-cyan-300' },
          { label: isKo ? '다트' : 'Darts', value: `${dartsLeft}발`, color: 'text-rose-300' }
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

              if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
                moved = true;
                stateRef.current.aimX = Math.max(-0.4, Math.min(0.4, stateRef.current.aimX + dx * 0.001));
                stateRef.current.aimY = Math.max(-0.4, Math.min(0.4, stateRef.current.aimY - dy * 0.001));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Throw Dart
                handleThrowDart();
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
          {isKo ? '화면 드래그: 정밀 조준점 이동 | 탭: 다트 투척 (버튼 없음)' : 'Drag: Move Crosshair | Tap: Throw Dart (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_darts_bar"
          gameTitle={isKo ? '3D 복셀 다츠 바: 마스터 불스아이' : 'Voxel Darts Bar: Master Bullseye'}
          sportType="darts"
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

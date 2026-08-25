import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSlamDunkGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSlamDunkGame: React.FC<VoxelSlamDunkGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_slam_dunk') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [shotsLeft, setShotsLeft] = useState<number>(10);
  const [isDunking, setIsDunking] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    ballPos: new THREE.Vector3(0, 1.2, 8),
    ballVel: new THREE.Vector3(0, 0, 0),
    isShooting: false,
    isDunking: false,
    playerPos: new THREE.Vector3(0, 1.0, 8),
    playerJumpY: 0,
    score: 0,
    streak: 0,
    shotsLeft: 10,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    dragStartX: 0,
    dragStartY: 0,
    isDragging: false,
    ballMesh: null as THREE.Mesh | null,
    playerGroup: null as THREE.Group | null
  });

  const performSlamDunk = () => {
    const s = stateRef.current;
    if (s.isShooting || s.isDunking || s.isGameOver || s.shotsLeft <= 0 || s.isPaused) return;

    s.isDunking = true;
    setIsDunking(true);
    s.shotsLeft -= 1;
    setShotsLeft(s.shotsLeft);

    let step = 0;
    const dunkAnim = setInterval(() => {
      step += 1;
      s.playerPos.z = 8 - step * 0.8;
      s.playerJumpY = Math.sin((step / 25) * Math.PI) * 6;

      if (s.playerGroup && s.ballMesh) {
        s.playerGroup.position.set(0, 1.0 + s.playerJumpY, s.playerPos.z);
        s.ballMesh.position.set(0, 2.6 + s.playerJumpY, s.playerPos.z - 0.5);
      }

      if (step >= 25) {
        clearInterval(dunkAnim);
        s.isDunking = false;
        setIsDunking(false);

        s.streak += 1;
        const pts = s.streak >= 3 ? 30 : 20;
        s.score += pts;
        setStreak(s.streak);
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        s.playerPos.set(0, 1.0, 8);
        s.playerJumpY = 0;
        if (s.playerGroup) s.playerGroup.position.copy(s.playerPos);
        if (s.ballMesh) s.ballMesh.position.set(0, 1.2, 7.5);

        if (s.shotsLeft <= 0) {
          endGame();
        }
      }
    }, 30);
  };

  const endGame = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    s.isVictory = s.score >= 150;
    setIsGameOver(true);

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'voxel_slam_dunk',
      gameTitle: '복셀 슬램덩크',
      durationSeconds: duration,
      score: s.score + 2000,
      difficulty: 'HARD',
      isVictory: s.isVictory
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 4, 14);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const spotLight = new THREE.SpotLight(0xffedd5, 1.6);
    spotLight.position.set(0, 20, 10);
    scene.add(spotLight);

    // Basketball Court Floor
    const court = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 40),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4 })
    );
    court.rotation.x = -Math.PI / 2;
    scene.add(court);

    // Rim & Hoop
    const hoop = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 16), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    pole.position.set(0, 3, -12);
    hoop.add(pole);

    const board = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    board.position.set(0, 5, -11.5);
    hoop.add(board);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 24), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 4.3, -10.8);
    hoop.add(rim);
    scene.add(hoop);

    // Basketball
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 })
    );
    ball.position.set(0, 1.2, 7.5);
    scene.add(ball);
    stateRef.current.ballMesh = ball;

    // Player Avatar
    const pGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    pBody.position.y = 0.8;
    pGroup.add(pBody);
    pGroup.position.set(0, 1.0, 8);
    scene.add(pGroup);
    stateRef.current.playerGroup = pGroup;

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Shooting physics
      if (s.isShooting) {
        s.ballVel.y -= 0.018;
        s.ballPos.add(s.ballVel);
        ball.position.copy(s.ballPos);

        // Check Hoop Basket
        if (s.ballPos.z <= -10.5 && s.ballPos.z >= -11.5 && s.ballPos.y >= 3.8 && s.ballPos.y <= 4.8 && Math.abs(s.ballPos.x) < 0.8) {
          s.isShooting = false;
          s.streak += 1;
          s.score += s.streak >= 3 ? 30 : 20;
          setStreak(s.streak);
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          s.ballPos.set(0, 1.2, 7.5);
          s.ballVel.set(0, 0, 0);
          ball.position.copy(s.ballPos);

          if (s.shotsLeft <= 0) endGame();
        } else if (s.ballPos.y < 0.3 || s.ballPos.z < -16) {
          // Miss
          s.isShooting = false;
          s.streak = 0;
          setStreak(0);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3');

          s.ballPos.set(0, 1.2, 7.5);
          s.ballVel.set(0, 0, 0);
          ball.position.copy(s.ballPos);

          if (s.shotsLeft <= 0) endGame();
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
    s.score = 0;
    s.streak = 0;
    s.shotsLeft = 10;
    s.isShooting = false;
    s.isDunking = false;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.ballPos.set(0, 1.2, 7.5);
    s.ballVel.set(0, 0, 0);
    s.playerPos.set(0, 1.0, 8);
    setScore(0);
    setStreak(0);
    setShotsLeft(10);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 슬램덩크' : 'Voxel Slam Dunk'}
        language={language}
        telemetries={[
          { label: isKo ? '남은 슛' : 'Shots', value: `${shotsLeft}구`, color: shotsLeft <= 2 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
          { label: isKo ? '콤보' : 'Streak', value: `x${streak}`, color: streak >= 3 ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-300' },
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
          onPointerDown={(e) => {
            const s = stateRef.current;
            if (s.isShooting || s.isDunking || s.isGameOver || s.shotsLeft <= 0) return;
            s.isDragging = true;
            s.dragStartX = e.clientX;
            s.dragStartY = e.clientY;
          }}
          onPointerUp={(e) => {
            const s = stateRef.current;
            if (!s.isDragging || s.isShooting || s.isDunking) return;
            s.isDragging = false;

            const dx = e.clientX - s.dragStartX;
            const dy = e.clientY - s.dragStartY;

            if (dy < -25) {
              s.isShooting = true;
              s.shotsLeft -= 1;
              setShotsLeft(s.shotsLeft);

              s.ballPos.set(0, 1.6, 7.5);
              const power = Math.min(1.2, Math.abs(dy) * 0.007);
              s.ballVel.set(dx * 0.002, power * 0.55 + 0.35, -power * 0.9 - 0.4);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }
          }}
          onDoubleClick={performSlamDunk}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '위로 스와이프: 3점슛 슛팅 | 더블탭: 360° 슬램덩크 (버튼 없음)' : 'Swipe Up: 3-Point Shot | Double Tap: 360° Slam Dunk (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_slam_dunk"
          gameTitle={isKo ? '3D 복셀 슬램덩크: 3점슛 & 덩크슛' : 'Voxel Slam Dunk: 3-Point & Dunk'}
          sportType="basketball"
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
export default VoxelSlamDunkGame;

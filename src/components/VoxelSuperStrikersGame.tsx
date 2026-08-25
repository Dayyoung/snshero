import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSuperStrikersGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSuperStrikersGame: React.FC<VoxelSuperStrikersGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_super_strikers') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [goalBanner, setGoalBanner] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    carPos: new THREE.Vector3(0, 0.6, 18),
    carVel: new THREE.Vector3(0, 0, 0),
    moveDir: new THREE.Vector2(0, 0),
    carRot: 0,
    aiPos: new THREE.Vector3(0, 0.6, -18),
    ballPos: new THREE.Vector3(0, 1.2, 0),
    ballVel: new THREE.Vector3(0, 0, 0),
    isBoosting: false,
    pScore: 0,
    aScore: 0,
    timeLeft: 60,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    carMesh: null as THREE.Group | null,
    aiMesh: null as THREE.Group | null,
    ballMesh: null as THREE.Mesh | null
  });

  const triggerBoost = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.isBoosting = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setTimeout(() => { s.isBoosting = false; }, 1200);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1128);
    scene.fog = new THREE.FogExp2(0x0a1128, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 20, 32);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffea00, 1.4);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // Arena Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 80),
      new THREE.MeshStandardMaterial({ color: 0x1c3144, roughness: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Field Grid
    const grid = new THREE.GridHelper(80, 20, 0x00f5d4, 0x00bbf9);
    grid.position.y = 0.05;
    scene.add(grid);

    // Ball
    const bMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 })
    );
    bMesh.position.set(0, 1.2, 0);
    scene.add(bMesh);
    stateRef.current.ballMesh = bMesh;

    // Player Rocket Car
    const pCar = new THREE.Group();
    const pBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.0, 3.5),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4 })
    );
    pBody.position.y = 0.5;
    pCar.add(pBody);
    pCar.position.copy(stateRef.current.carPos);
    scene.add(pCar);
    stateRef.current.carMesh = pCar;

    // AI Car
    const aiCar = new THREE.Group();
    const aiBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.0, 3.5),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e })
    );
    aiBody.position.y = 0.5;
    aiCar.add(aiBody);
    aiCar.position.copy(stateRef.current.aiPos);
    scene.add(aiCar);
    stateRef.current.aiMesh = aiCar;

    // Timer
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);

      if (s.timeLeft <= 0 && !s.isGameOver) {
        s.isGameOver = true;
        s.isVictory = s.pScore > s.aScore;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_super_strikers',
          gameTitle: '복셀 슈퍼 스트라이커즈',
          durationSeconds: duration,
          score: s.pScore * 1000 + 1500,
          difficulty: 'HARD',
          isVictory: s.isVictory
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }, 1000);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Player Movement
      const currentSpeed = s.isBoosting ? 38 : 22;
      s.carPos.x += s.moveDir.x * currentSpeed * dt;
      s.carPos.z += s.moveDir.y * currentSpeed * dt;
      s.carPos.x = THREE.MathUtils.clamp(s.carPos.x, -22, 22);
      s.carPos.z = THREE.MathUtils.clamp(s.carPos.z, -36, 36);

      if (pCar) {
        pCar.position.copy(s.carPos);
        if (s.moveDir.length() > 0.1) {
          pCar.rotation.y = Math.atan2(s.moveDir.x, s.moveDir.y);
        }
      }

      // AI Chases Ball
      const aiDir = new THREE.Vector3().subVectors(s.ballPos, s.aiPos).normalize();
      s.aiPos.x += aiDir.x * 16 * dt;
      s.aiPos.z += aiDir.z * 16 * dt;
      s.aiPos.x = THREE.MathUtils.clamp(s.aiPos.x, -22, 22);
      s.aiPos.z = THREE.MathUtils.clamp(s.aiPos.z, -36, 36);

      if (aiCar) {
        aiCar.position.copy(s.aiPos);
        aiCar.rotation.y = Math.atan2(aiDir.x, aiDir.z);
      }

      // Ball Physics & Car Collision
      s.ballPos.addScaledVector(s.ballVel, dt);
      s.ballVel.multiplyScalar(0.97);

      // Player Hit Ball
      if (s.carPos.distanceTo(s.ballPos) < 2.8) {
        const hitDir = new THREE.Vector3().subVectors(s.ballPos, s.carPos).normalize();
        const force = s.isBoosting ? 45 : 28;
        s.ballVel.copy(hitDir).multiplyScalar(force);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }

      // AI Hit Ball
      if (s.aiPos.distanceTo(s.ballPos) < 2.8) {
        const hitDir = new THREE.Vector3().subVectors(s.ballPos, s.aiPos).normalize();
        s.ballVel.copy(hitDir).multiplyScalar(24);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }

      // Wall Rebound
      if (Math.abs(s.ballPos.x) > 22) {
        s.ballPos.x = Math.sign(s.ballPos.x) * 22;
        s.ballVel.x *= -0.8;
      }

      // Goal Checks (Z: -38 is AI Goal, Z: 38 is Player Goal)
      if (s.ballPos.z < -37 && Math.abs(s.ballPos.x) < 8) {
        s.pScore += 1;
        setPlayerScore(s.pScore);
        setGoalBanner(isKo ? '⚽ GOAL! 플레이어 득점!!' : '⚽ GOAL! PLAYER SCORED!!');
        s.ballPos.set(0, 1.2, 0);
        s.ballVel.set(0, 0, 0);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        setTimeout(() => setGoalBanner(null), 1500);
      } else if (s.ballPos.z > 37 && Math.abs(s.ballPos.x) < 8) {
        s.aScore += 1;
        setAiScore(s.aScore);
        setGoalBanner(isKo ? '💥 AI 득점 허용!' : '💥 AI SCORED!');
        s.ballPos.set(0, 1.2, 0);
        s.ballVel.set(0, 0, 0);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3');
        setTimeout(() => setGoalBanner(null), 1500);
      }

      if (bMesh) {
        bMesh.position.copy(s.ballPos);
      }

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
    s.carPos.set(0, 0.6, 18);
    s.aiPos.set(0, 0.6, -18);
    s.ballPos.set(0, 1.2, 0);
    s.ballVel.set(0, 0, 0);
    s.pScore = 0;
    s.aScore = 0;
    s.timeLeft = 60;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setPlayerScore(0);
    setAiScore(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 슈퍼 스트라이커즈' : 'Voxel Super Strikers'}
        language={language}
        telemetries={[
          { label: isKo ? '스코어' : 'Score', value: `${playerScore} : ${aiScore}`, color: playerScore >= aiScore ? 'text-cyan-400 font-bold' : 'text-rose-400' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 15 ? 'text-rose-400 font-bold' : 'text-emerald-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Goal Banner */}
      {goalBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-6 py-2 rounded-sm text-sm font-black tracking-wider shadow-xl z-20 pointer-events-none animate-bounce">
          {goalBanner}
        </div>
      )}

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
                stateRef.current.moveDir.x = THREE.MathUtils.clamp(dx * 0.02, -1, 1);
                stateRef.current.moveDir.y = THREE.MathUtils.clamp(dy * 0.02, -1, 1);
              }
              if (dy < -25) {
                triggerBoost();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.set(0, 0);

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
        <div className="px-3 py-1 bg-black/75 border border-amber-400/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 로켓카 조향 | 탭/더블탭/위로: 슈퍼 부스트 (버튼 없음)' : 'Drag: Rocket Car Steer | Tap/Double Tap/Up: Boost (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_super_strikers"
          gameTitle={isKo ? '3D 복셀 슈퍼 스트라이커즈: 로켓 축구 리그' : 'Voxel Super Strikers: Rocket League'}
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
export default VoxelSuperStrikersGame;

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { ResponsiveCleanHUD } from './ResponsiveCleanHUD';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPinballClimberGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Bumper {
  mesh: THREE.Mesh;
  lightMesh: THREE.Mesh;
  radius: number;
  points: number;
  hitCooldown: number;
}

interface VoxelCoin {
  mesh: THREE.Mesh;
  collected: boolean;
  y: number;
}

export const VoxelPinballClimberGame: React.FC<VoxelPinballClimberGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_pinball_climber') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [combo, setCombo] = useState<number>(0);
  const [ballsLeft, setBallsLeft] = useState<number>(3);
  const [isFever, setIsFever] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    ballPos: new THREE.Vector3(0, 2, 0),
    ballVel: new THREE.Vector3(0, 0, 0),
    ballMesh: null as THREE.Mesh | null,
    leftFlipper: null as THREE.Mesh | null,
    rightFlipper: null as THREE.Mesh | null,
    leftFlipAngle: 0,
    rightFlipAngle: 0,
    leftFlipPressed: false,
    rightFlipPressed: false,
    cameraY: 6,
    targetCameraY: 6,
    currentFloor: 1,
    maxFloorReached: 1,
    score: 0,
    combo: 0,
    comboTimer: 0,
    ballsLeft: 3,
    isFever: false,
    feverTime: 0,
    isGameOver: false,
    isPaused: false,
    bumpers: [] as Bumper[],
    coins: [] as VoxelCoin[],
    startTime: Date.now()
  });

  useEffect(() => {
    stateRef.current.isPaused = isPaused || showTutorial;
  }, [isPaused, showTutorial]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 150);
    camera.position.set(0, 6, 16);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Cyberpunk Neon Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf43f5e, 1.5);
    dirLight.position.set(5, 20, 10);
    scene.add(dirLight);

    // Build Vertical Pinball Climber Tower (50 Floors)
    const towerRadius = 4.5;
    const wallGeo = new THREE.BoxGeometry(0.4, 120, 1.2);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-towerRadius, 60, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(towerRadius, 60, 0);
    scene.add(rightWall);

    // Back Panel with Neon Grid
    const backGeo = new THREE.PlaneGeometry(towerRadius * 2, 120);
    const backMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.set(0, 60, -0.6);
    scene.add(backMesh);

    // Pinball Ball
    const ballGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 2.5, 0);
    scene.add(ball);
    stateRef.current.ballMesh = ball;
    stateRef.current.ballPos.set(0, 2.5, 0);
    stateRef.current.ballVel.set((Math.random() - 0.5) * 4, 12, 0);

    // Flippers
    const flipperGeo = new THREE.BoxGeometry(2.2, 0.45, 0.6);
    const flipperMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.4 });

    const leftFlipper = new THREE.Mesh(flipperGeo, flipperMat);
    leftFlipper.position.set(-1.8, 1.2, 0);
    scene.add(leftFlipper);
    stateRef.current.leftFlipper = leftFlipper;

    const rightFlipper = new THREE.Mesh(flipperGeo, flipperMat);
    rightFlipper.position.set(1.8, 1.2, 0);
    scene.add(rightFlipper);
    stateRef.current.rightFlipper = rightFlipper;

    // Generate Bumpers and Floating Boosters along 50 floors
    const bumpers: Bumper[] = [];
    const coins: VoxelCoin[] = [];

    for (let floor = 1; floor <= 45; floor++) {
      const yBase = floor * 2.6 + 2;
      const count = Math.floor(Math.random() * 2) + 1;

      for (let b = 0; b < count; b++) {
        const x = (Math.random() - 0.5) * (towerRadius * 1.3);
        const bumpRadius = 0.55 + Math.random() * 0.25;

        const bumpGeo = new THREE.CylinderGeometry(bumpRadius, bumpRadius, 0.5, 16);
        const bumpMat = new THREE.MeshStandardMaterial({
          color: floor % 5 === 0 ? 0xf43f5e : 0xa855f7,
          emissive: floor % 5 === 0 ? 0xe11d48 : 0x9333ea,
          emissiveIntensity: 0.5,
          metalness: 0.3
        });
        const bumpMesh = new THREE.Mesh(bumpGeo, bumpMat);
        bumpMesh.position.set(x, yBase + (b * 0.8), 0);
        bumpMesh.rotation.x = Math.PI / 2;
        scene.add(bumpMesh);

        // Core Ring
        const ringGeo = new THREE.TorusGeometry(bumpRadius + 0.1, 0.05, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(x, yBase + (b * 0.8), 0.2);
        scene.add(ringMesh);

        bumpers.push({
          mesh: bumpMesh,
          lightMesh: ringMesh as any,
          radius: bumpRadius,
          points: 100 * (floor % 5 === 0 ? 3 : 1),
          hitCooldown: 0
        });
      }

      // Add Collectible Voxel Gems
      if (Math.random() > 0.4) {
        const coinGeo = new THREE.OctahedronGeometry(0.35, 0);
        const coinMat = new THREE.MeshStandardMaterial({
          color: 0x34d399,
          emissive: 0x10b981,
          emissiveIntensity: 0.6,
          metalness: 0.8
        });
        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.position.set((Math.random() - 0.5) * (towerRadius * 1.2), yBase + 1.2, 0);
        scene.add(coinMesh);
        coins.push({ mesh: coinMesh, collected: false, y: yBase + 1.2 });
      }
    }

    stateRef.current.bumpers = bumpers;
    stateRef.current.coins = coins;

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = stateRef.current;
      if (state.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Fever Mode Timer
      if (state.isFever) {
        state.feverTime -= dt;
        if (state.feverTime <= 0) {
          state.isFever = false;
          setIsFever(false);
        }
      }

      // Combo Timer
      if (state.combo > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) {
          state.combo = 0;
          setCombo(0);
        }
      }

      // Physics: Gravity & Ball Velocity
      const gravity = -14.0;
      state.ballVel.y += gravity * dt;

      // Terminal Velocity cap
      state.ballVel.x = Math.max(-16, Math.min(16, state.ballVel.x));
      state.ballVel.y = Math.max(-20, Math.min(26, state.ballVel.y));

      state.ballPos.x += state.ballVel.x * dt;
      state.ballPos.y += state.ballVel.y * dt;

      // Wall Collisions
      if (state.ballPos.x < -towerRadius + 0.45) {
        state.ballPos.x = -towerRadius + 0.45;
        state.ballVel.x = Math.abs(state.ballVel.x) * 0.85;
      } else if (state.ballPos.x > towerRadius - 0.45) {
        state.ballPos.x = towerRadius - 0.45;
        state.ballVel.x = -Math.abs(state.ballVel.x) * 0.85;
      }

      // Flipper Rotations & Hits
      const maxAngle = 0.55;
      const targetLeft = state.leftFlipPressed ? maxAngle : -0.25;
      const targetRight = state.rightFlipPressed ? -maxAngle : 0.25;

      state.leftFlipAngle += (targetLeft - state.leftFlipAngle) * 22 * dt;
      state.rightFlipAngle += (targetRight - state.rightFlipAngle) * 22 * dt;

      if (state.leftFlipper) state.leftFlipper.rotation.z = state.leftFlipAngle;
      if (state.rightFlipper) state.rightFlipper.rotation.z = state.rightFlipAngle;

      // Flipper Hit Checks (Lower bound)
      if (state.ballPos.y < 2.0 && state.ballPos.y > 0.6) {
        // Left flipper hit
        if (state.ballPos.x >= -3.0 && state.ballPos.x <= -0.4) {
          const power = state.leftFlipPressed ? 19 : 7;
          state.ballVel.y = power;
          state.ballVel.x = (state.ballPos.x + 1.8) * 6 + (state.leftFlipPressed ? 4 : 0);
          state.ballPos.y = 2.0;
          if (state.leftFlipPressed && playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
        // Right flipper hit
        else if (state.ballPos.x <= 3.0 && state.ballPos.x >= 0.4) {
          const power = state.rightFlipPressed ? 19 : 7;
          state.ballVel.y = power;
          state.ballVel.x = (state.ballPos.x - 1.8) * 6 - (state.rightFlipPressed ? 4 : 0);
          state.ballPos.y = 2.0;
          if (state.rightFlipPressed && playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
      }

      // Floor Calculation
      const calculatedFloor = Math.max(1, Math.floor(state.ballPos.y / 2.6) + 1);
      if (calculatedFloor > state.maxFloorReached) {
        state.maxFloorReached = calculatedFloor;
        setCurrentFloor(calculatedFloor);
        state.score += (calculatedFloor - state.currentFloor) * 150;
        setScore(state.score);
        state.currentFloor = calculatedFloor;
      }

      // Bumpers Collision
      for (const bump of state.bumpers) {
        bump.hitCooldown = Math.max(0, bump.hitCooldown - dt);
        const dx = state.ballPos.x - bump.mesh.position.x;
        const dy = state.ballPos.y - bump.mesh.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bump.radius + 0.45 && bump.hitCooldown <= 0) {
          bump.hitCooldown = 0.15;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          // Super Spring Bumper Bounce
          const bounceForce = state.isFever ? 24 : 17;
          state.ballVel.x = nx * bounceForce + (Math.random() - 0.5) * 4;
          state.ballVel.y = ny * bounceForce + 4;

          state.combo++;
          state.comboTimer = 2.5;
          setCombo(state.combo);

          const mult = state.isFever ? 3 : (1 + state.combo * 0.1);
          const pts = Math.round(bump.points * mult);
          state.score += pts;
          setScore(state.score);

          if (state.combo >= 6 && !state.isFever) {
            state.isFever = true;
            state.feverTime = 6.0;
            setIsFever(true);
          }

          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');

          // Bumper hit scale pulse
          bump.mesh.scale.set(1.4, 1.4, 1.4);
        } else {
          bump.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 10 * dt);
        }
      }

      // Collect Gems
      for (const coin of state.coins) {
        if (!coin.collected) {
          coin.mesh.rotation.y += 3.5 * dt;
          const dx = state.ballPos.x - coin.mesh.position.x;
          const dy = state.ballPos.y - coin.mesh.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 0.8) {
            coin.collected = true;
            scene.remove(coin.mesh);
            state.score += 500;
            setScore(state.score);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          }
        }
      }

      // Ball Drain (Fall below flippers)
      if (state.ballPos.y < -1.5) {
        state.ballsLeft--;
        setBallsLeft(state.ballsLeft);
        if (state.ballsLeft <= 0) {
          state.isGameOver = true;
          setIsGameOver(true);
          const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_pinball_climber',
            gameTitle: isKo ? '3D 복셀 핀볼 배틀 타워: 범퍼 클라이머' : 'Voxel Pinball Climber: Bumper Tower',
            durationSeconds,
            score: state.score,
            maxTargetScore: 10000,
            isVictory: true,
            difficulty: 'NORMAL',
            comboCount: state.combo,
            perfectClear: state.maxFloorReached >= 10
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        } else {
          // Respawn ball
          state.ballPos.set(0, state.maxFloorReached * 2.6 + 2, 0);
          state.ballVel.set((Math.random() - 0.5) * 6, 8, 0);
        }
      }

      // Update Mesh & Smooth Ascending Camera
      if (state.ballMesh) {
        state.ballMesh.position.copy(state.ballPos);
      }

      state.targetCameraY = Math.max(6, state.ballPos.y + 3);
      camera.position.y += (state.targetCameraY - camera.position.y) * 4 * dt;
      camera.lookAt(0, camera.position.y - 2, 0);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Keyboard Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.leftFlipPressed = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.rightFlipPressed = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.leftFlipPressed = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.rightFlipPressed = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx, isKo]);

  const handleRestart = () => {
    setIsGameOver(false);
    setSettlementReceipt(null);
    setScore(0);
    setCurrentFloor(1);
    setCombo(0);
    setBallsLeft(3);
    setIsFever(false);

    const state = stateRef.current;
    state.ballPos.set(0, 2, 0);
    state.ballVel.set(0, 0, 0);
    state.score = 0;
    state.currentFloor = 1;
    state.maxFloorReached = 1;
    state.combo = 0;
    state.ballsLeft = 3;
    state.isFever = false;
    state.isGameOver = false;
    state.startTime = Date.now();
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Responsive Clean HUD (Upper 5% Slim Bar per design.md) */}
      <ResponsiveCleanHUD
        gameTitle={isKo ? '핀볼 범퍼 타워' : 'Voxel Pinball'}
        score={score}
        customMetricLabel={isKo ? '층수' : 'Floor'}
        customMetricValue={`${currentFloor}F (●x${ballsLeft})`}
        combo={combo}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Fever / Combo Overlay */}
      <div className="relative z-10 mt-14 flex flex-col items-center pointer-events-none gap-1">
        {combo > 1 && (
          <div className="px-3 py-0.5 bg-[#fdfcfc]/90 border border-[#201d1d]/30 text-[#201d1d] text-xs font-bold rounded-sm animate-bounce shadow-xs">
            {combo} COMBO BOOST!
          </div>
        )}
        {isFever && (
          <div className="px-4 py-1 bg-amber-400 border border-[#201d1d] text-[#201d1d] text-xs font-black rounded-sm animate-pulse tracking-widest flex items-center gap-1 shadow-md">
            <span>SUPER FEVER x3 MULTIPLIER!</span>
          </div>
        )}
      </div>

      {/* Mobile Touch Flipper Controls (Left / Right Screen Halves) */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div className="absolute inset-x-0 bottom-0 top-16 z-20 flex pointer-events-auto">
          {/* Left Flipper Button Area */}
          <div
            onPointerDown={() => { stateRef.current.leftFlipPressed = true; }}
            onPointerUp={() => { stateRef.current.leftFlipPressed = false; }}
            onPointerLeave={() => { stateRef.current.leftFlipPressed = false; }}
            className="w-1/2 h-full flex items-end justify-start p-6 active:bg-cyan-500/10 cursor-pointer"
          >
            <div className="px-4 py-3 bg-[#fdfcfc]/90 border-2 border-[#201d1d] text-[#201d1d] text-xs font-black rounded-sm shadow-md">
              {isKo ? '◀ 좌측 플리퍼 (A)' : '◀ LEFT FLIPPER'}
            </div>
          </div>

          {/* Right Flipper Button Area */}
          <div
            onPointerDown={() => { stateRef.current.rightFlipPressed = true; }}
            onPointerUp={() => { stateRef.current.rightFlipPressed = false; }}
            onPointerLeave={() => { stateRef.current.rightFlipPressed = false; }}
            className="w-1/2 h-full flex items-end justify-end p-6 active:bg-cyan-500/10 cursor-pointer"
          >
            <div className="px-4 py-3 bg-[#fdfcfc]/90 border-2 border-[#201d1d] text-[#201d1d] text-xs font-black rounded-sm shadow-md">
              {isKo ? '우측 플리퍼 (D) ▶' : 'RIGHT FLIPPER ▶'}
            </div>
          </div>
        </div>
      )}

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_pinball_climber"
          gameTitle={isKo ? '3D 복셀 핀볼 배틀 타워: 범퍼 클라이머' : 'Voxel Pinball Climber: Bumper Tower'}
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

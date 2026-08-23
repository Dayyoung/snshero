import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { ResponsiveCleanHUD } from './ResponsiveCleanHUD';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMotocrossStuntGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMotocrossStuntGame: React.FC<VoxelMotocrossStuntGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_motocross_stunt') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [totalGoal] = useState<number>(2000);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [nitroGauge, setNitroGauge] = useState<number>(100);
  const [stuntText, setStuntText] = useState<string>('');
  const [flipCount, setFlipCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posY: 0.8,
    posZ: 0,
    rotX: 0, // Pitch (tilt up/down)
    rotY: 0,
    rotZ: 0,
    speed: 0,
    maxSpeed: 1.1,
    accel: 0.02,
    isGasPressed: false,
    isNitroActive: false,
    isInAir: false,
    airTime: 0,
    inAirFlipAngle: 0,
    flips: 0,
    score: 0,
    nitro: 100,
    distance: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    bikeMesh: null as THREE.Group | null,
    frontWheel: null as THREE.Mesh | null,
    rearWheel: null as THREE.Mesh | null
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
    scene.background = new THREE.Color(0xf59e0b);
    scene.fog = new THREE.Fog(0xf59e0b, 40, 140);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 1.5, -5);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Warm Sunset / Desert Offroad Lighting
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x78350f, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    dirLight.position.set(40, 60, 40);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // Voxel Motocross Bike & Rider Model
    const bikeGroup = new THREE.Group();

    // Bike Frame (Orange & Black)
    const frameGeo = new THREE.BoxGeometry(0.3, 0.45, 1.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.5, roughness: 0.4 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.5;
    bikeGroup.add(frame);

    // Engine Block
    const engGeo = new THREE.BoxGeometry(0.25, 0.3, 0.4);
    const engMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.2 });
    const engine = new THREE.Mesh(engGeo, engMat);
    engine.position.set(0, 0.35, 0);
    bikeGroup.add(engine);

    // Exhaust Pipe
    const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.x = Math.PI / 3;
    pipe.position.set(0.18, 0.4, 0.4);
    bikeGroup.add(pipe);

    // Wheels (Knobby Dirt Tires)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16);

    const fWheel = new THREE.Mesh(wheelGeo, wheelMat);
    fWheel.rotation.z = Math.PI / 2;
    fWheel.position.set(0, 0.3, -0.7);
    bikeGroup.add(fWheel);
    stateRef.current.frontWheel = fWheel;

    const rWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rWheel.rotation.z = Math.PI / 2;
    rWheel.position.set(0, 0.3, 0.7);
    bikeGroup.add(rWheel);
    stateRef.current.rearWheel = rWheel;

    // Handlebars
    const barGeo = new THREE.BoxGeometry(0.8, 0.05, 0.05);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 0.85, -0.45);
    bikeGroup.add(bar);

    // Rider (Voxel Motocross Helmet & Gear)
    const riderGroup = new THREE.Group();
    // Torso
    const rBodyGeo = new THREE.BoxGeometry(0.4, 0.5, 0.3);
    const rBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const rBody = new THREE.Mesh(rBodyGeo, rBodyMat);
    rBody.position.set(0, 0.9, -0.05);
    riderGroup.add(rBody);

    // Helmet
    const helmGeo = new THREE.BoxGeometry(0.38, 0.35, 0.38);
    const helmMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.set(0, 1.35, -0.15);
    riderGroup.add(helm);

    // Goggles Visor
    const gogGeo = new THREE.BoxGeometry(0.32, 0.12, 0.1);
    const gogMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const gog = new THREE.Mesh(gogGeo, gogMat);
    gog.position.set(0, 1.35, -0.36);
    riderGroup.add(gog);

    bikeGroup.add(riderGroup);
    scene.add(bikeGroup);
    stateRef.current.bikeMesh = bikeGroup;

    // Terrain Generator Function (Calculates height Y based on Z)
    const getTerrainHeight = (z: number) => {
      // Periodic hills, huge ramps every 120m
      const baseWave = Math.sin(z * 0.05) * 1.5;
      const rampMod = Math.abs(z % 120);
      let rampH = 0;
      if (rampMod > 90 && rampMod < 115) {
        // Ramp incline
        rampH = (rampMod - 90) * 0.25;
      }
      return Math.max(0, baseWave + rampH);
    };

    // Offroad Dirt Ground Track Mesh
    const trackGeo = new THREE.PlaneGeometry(16, 2200, 1, 300);
    const pos = trackGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const zVal = pos.getY(i) - 1000;
      pos.setZ(i, getTerrainHeight(zVal));
    }
    trackGeo.computeVertexNormals();

    const trackMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.95 });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.position.set(0, 0, -1000);
    trackMesh.receiveShadow = !lowSpecMode;
    scene.add(trackMesh);

    // Ramp structures & Roadside flags
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    for (let z = -60; z > -2000; z -= 80) {
      const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8 });
      const poleL = new THREE.Mesh(poleGeo, poleMat);
      poleL.position.set(-6, getTerrainHeight(z) + 1.75, z);
      scene.add(poleL);

      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.02), flagMat);
      flag.position.set(-5.5, getTerrainHeight(z) + 3.0, z);
      scene.add(flag);
    }

    // Finish Line Arch at z = -2000
    const archGeo = new THREE.BoxGeometry(14, 6, 1);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, getTerrainHeight(-2000) + 3, -2000);
    scene.add(arch);

    // Game Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const state = stateRef.current;

      if (!state.isGameOver) {
        // Acceleration & Speed
        const topSpeed = state.isNitroActive ? state.maxSpeed * 1.5 : state.maxSpeed;
        if (state.isGasPressed) {
          state.speed = Math.min(topSpeed, state.speed + state.accel);
        } else {
          state.speed = Math.max(0, state.speed - 0.015);
        }

        // Nitro consumption
        if (state.isNitroActive) {
          state.nitro = Math.max(0, state.nitro - delta * 40);
          setNitroGauge(Math.floor(state.nitro));
          if (state.nitro <= 0) state.isNitroActive = false;
        } else {
          state.nitro = Math.min(100, state.nitro + delta * 5);
          setNitroGauge(Math.floor(state.nitro));
        }

        // Move forward along Z
        state.posZ -= state.speed * 60 * delta * 2.2;
        const currDist = Math.min(2000, Math.floor(-state.posZ));
        state.distance = currDist;
        setDistance(currDist);
        setSpeedKmh(Math.floor(state.speed * 120));

        // Wheels spin
        if (state.frontWheel && state.rearWheel) {
          state.frontWheel.rotation.x += state.speed * 2.0;
          state.rearWheel.rotation.x += state.speed * 2.0;
        }

        // Terrain Elevation vs In-Air Physics
        const groundY = getTerrainHeight(state.posZ) + 0.35;

        if (state.posY > groundY + 0.15) {
          // Bike is in the air!
          state.isInAir = true;
          state.airTime += delta;
          state.posY -= 0.15 * (delta * 60); // In-air gravity fall

          // Pitch rotation in air
          state.rotX += state.inAirFlipAngle * delta * 5.0;
        } else {
          // Bike touched ground
          if (state.isInAir) {
            // Landing evaluation
            const normRot = Math.abs(state.rotX % (Math.PI * 2));
            if (normRot < 0.4 || normRot > Math.PI * 2 - 0.4) {
              // Perfect landing!
              state.score += 150;
              setScore(state.score);
              setStuntText(isKo ? '✨ 퍼펙트 착지! (+150P & 가속!)' : '✨ PERFECT LANDING! (+150P)');
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            } else if (normRot < 0.9 || normRot > Math.PI * 2 - 0.9) {
              // Good landing
              state.score += 50;
              setScore(state.score);
              setStuntText(isKo ? '👍 굿 착지! (+50P)' : '👍 GOOD LANDING! (+50P)');
            } else {
              // Crash Wipeout
              state.speed = 0.1;
              setStuntText(isKo ? '💥 크래시 와이프아웃!' : '💥 CRASH WIPEOUT!');
            }
            state.isInAir = false;
            state.airTime = 0;
            state.rotX = 0;
            state.inAirFlipAngle = 0;
          }

          state.posY = groundY;
          // Calculate slope pitch
          const nextGroundY = getTerrainHeight(state.posZ - 1.0);
          state.rotX = -(nextGroundY - groundY) * 0.5;
        }

        // Apply Bike Position and Rotation
        if (bikeGroup) {
          bikeGroup.position.set(state.posX, state.posY, state.posZ);
          bikeGroup.rotation.x = state.rotX;
        }

        // Camera Follow
        camera.position.set(state.posX, state.posY + 3.2, state.posZ + 6.5);
        camera.lookAt(state.posX, state.posY + 1.2, state.posZ - 10);

        // Check Goal
        if (currDist >= 2000 && !state.isGameOver) {
          state.isGameOver = true;
          setIsGameOver(true);
          const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_motocross_stunt',
            gameTitle: isKo ? '3D 복셀 익스트림 모터크로스: 스턴트 랠리' : 'Voxel Extreme Motocross: Stunt Rally',
            durationSeconds,
            score: state.score,
            maxTargetScore: 5000,
            isVictory: true,
            difficulty: 'NORMAL',
            comboCount: state.flips,
            perfectClear: state.flips >= 5
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, isKo, playSfx]);

  const handleRestart = () => {
    setIsGameOver(false);
    setSettlementReceipt(null);
    setScore(0);
    setDistance(0);
    setSpeedKmh(0);
    setNitroGauge(100);
    setStuntText('');
    setFlipCount(0);

    const state = stateRef.current;
    state.posX = 0;
    state.posY = 0.8;
    state.posZ = 0;
    state.rotX = 0;
    state.rotY = 0;
    state.rotZ = 0;
    state.speed = 0;
    state.isGasPressed = false;
    state.isNitroActive = false;
    state.isInAir = false;
    state.airTime = 0;
    state.inAirFlipAngle = 0;
    state.flips = 0;
    state.score = 0;
    state.nitro = 100;
    state.distance = 0;
    state.isGameOver = false;
    state.startTime = Date.now();
  };

  // Gas Hold Controls
  const handleGasStart = () => {
    stateRef.current.isGasPressed = true;
  };
  const handleGasEnd = () => {
    stateRef.current.isGasPressed = false;
  };

  // Backflip Trick Trigger (in-air)
  const handleBackflip = () => {
    const state = stateRef.current;
    if (!state.isInAir || state.isGameOver) return;
    state.inAirFlipAngle = -1.2;
    state.flips += 1;
    state.score += 300;
    setFlipCount(state.flips);
    setScore(state.score);
    setStuntText(isKo ? '🔥 360° 백플립 에어 트릭 (+300P)!!' : '🔥 360° BACKFLIP STUNT (+300P)!!');
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  // Nitro Boost Trigger
  const handleNitro = () => {
    const state = stateRef.current;
    if (state.nitro < 20 || isGameOver) return;
    state.isNitroActive = true;
    setStuntText(isKo ? '🚀 니트로 부스터 가동!!' : '🚀 NITRO BOOST ACTIVATED!!');
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Responsive Clean HUD */}
      <ResponsiveCleanHUD
        gameTitle={isKo ? '복셀 모터크로스' : 'Voxel Motocross'}
        score={score}
        customMetricLabel={isKo ? '거리' : 'Dist'}
        customMetricValue={`${distance}m/${totalGoal}m`}
        combo={flipCount}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Speed & Nitro Bar */}
      <div className="absolute top-14 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-[#fdfcfc]/90 border border-[#201d1d]/30 text-[#201d1d] px-2.5 py-1 rounded-sm text-xs font-bold w-fit shadow-xs">
          <span>{speedKmh} km/h</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#fdfcfc]/90 border border-[#201d1d]/30 px-2.5 py-1 rounded-sm text-xs font-bold w-fit shadow-xs">
          <span className="text-xs text-orange-600 font-black">NITRO</span>
          <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
            <div className="bg-orange-500 h-full transition-all" style={{ width: `${nitroGauge}%` }} />
          </div>
        </div>
      </div>

      {/* Stunt Announcement */}
      {stuntText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-400 border border-[#201d1d] text-[#201d1d] px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-md z-10 pointer-events-none animate-bounce">
          {stuntText}
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
            const startY = e.clientY - rect.top;
            let moved = false;
            handleGasStart();

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dy) > 20) {
                moved = true;
                handleBackflip();
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              handleGasEnd();
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => handleNitro()}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-[#201d1d]/85 border border-[#201d1d]/40 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 길게 누름: 가속 | 공중에서 스와이프: 360° 플립 | 더블탭: 니트로 (버튼 없음)' : 'Hold Screen: Gas | Swipe in Air: 360° Flip | Double Tap: Nitro (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_motocross_stunt"
          gameTitle={isKo ? '3D 복셀 익스트림 모터크로스: 스턴트 랠리' : 'Voxel Extreme Motocross: Stunt Rally'}
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

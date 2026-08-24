import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
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
  const totalGoal = 1000;
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [nitroGauge, setNitroGauge] = useState<number>(100);
  const [flipCount, setFlipCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posY: 0.8,
    posZ: 0,
    rotX: 0,
    speed: 0,
    maxSpeed: 1.1,
    accel: 0.02,
    isGasPressed: false,
    isNitroActive: false,
    isInAir: false,
    flips: 0,
    score: 0,
    nitro: 100,
    distance: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    bikeMesh: null as THREE.Group | null
  });

  const handleNitro = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.nitro < 25) return;
    s.isNitroActive = true;
    s.nitro -= 25;
    s.speed = 1.3;
    setNitroGauge(Math.floor(s.nitro));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setTimeout(() => {
      s.isNitroActive = false;
    }, 1500);
  };

  const handleBackflip = () => {
    const s = stateRef.current;
    if (!s.isInAir || s.isGameOver || s.isVictory || s.isPaused) return;
    s.flips += 1;
    s.score += 350;
    setFlipCount(s.flips);
    setScore(s.score);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

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
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x78350f, 0.85);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(20, 50, 30);
    scene.add(sun);

    // Desert Track Floor
    const trackGeo = new THREE.PlaneGeometry(16, 2000);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, -1000);
    scene.add(track);

    // Bike Group
    const bikeGroup = new THREE.Group();
    const bBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.9, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 })
    );
    bBody.position.y = 0.6;
    bikeGroup.add(bBody);

    bikeGroup.position.set(0, 0.8, 0);
    scene.add(bikeGroup);
    stateRef.current.bikeMesh = bikeGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Speed handling
      if (s.isGasPressed && !s.isNitroActive) {
        s.speed = Math.min(s.maxSpeed, s.speed + s.accel);
      } else if (!s.isGasPressed && !s.isNitroActive) {
        s.speed = Math.max(0, s.speed - 0.015);
      }
      setSpeedKmh(Math.round(s.speed * 130));

      // Nitro recharge
      s.nitro = Math.min(100, s.nitro + dt * 8);
      setNitroGauge(Math.round(s.nitro));

      // Move Forward along Z
      s.posZ -= s.speed * 45 * dt;
      s.distance = Math.round(-s.posZ);
      setDistance(Math.min(totalGoal, s.distance));

      // Jump / Air Simulation (repeating ramps every 150m)
      const rampOffset = Math.abs(s.posZ) % 150;
      if (rampOffset > 10 && rampOffset < 40) {
        s.isInAir = true;
        s.posY = 0.8 + Math.sin(((rampOffset - 10) / 30) * Math.PI) * 4.0;
      } else {
        s.isInAir = false;
        s.posY = 0.8;
      }

      if (bikeGroup) {
        bikeGroup.position.set(s.posX, s.posY, s.posZ);
      }

      // Camera Follow
      camera.position.set(s.posX, s.posY + 3.5, s.posZ + 7.5);
      camera.lookAt(s.posX, s.posY + 1.0, s.posZ - 8);

      // Check Goal Reached
      if (s.distance >= totalGoal && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_motocross_stunt',
          gameTitle: '복셀 익스트림 모터크로스',
          durationSeconds: duration,
          score: s.score + 2500,
          difficulty: 'NIGHTMARE',
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
    s.posZ = 0;
    s.posY = 0.8;
    s.speed = 0;
    s.nitro = 100;
    s.distance = 0;
    s.score = 0;
    s.flips = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setDistance(0);
    setScore(0);
    setFlipCount(0);
    setNitroGauge(100);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 모터크로스' : 'Voxel Motocross'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}m/${totalGoal}m`, color: 'text-amber-300' },
          { label: isKo ? '속도' : 'Speed', value: `${speedKmh} KM/H`, color: 'text-cyan-300' },
          { label: isKo ? '플립' : 'Flip', value: `${flipCount}회`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '니트로' : 'Nitro', value: `${nitroGauge}%`, color: 'text-orange-400 font-bold' }
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
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            stateRef.current.isGasPressed = true;

            const onMove = (moveEvt: PointerEvent) => {
              const curY = moveEvt.clientY - rect.top;
              const dy = curY - startY;
              if (Math.abs(dy) > 20) {
                handleBackflip();
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.isGasPressed = false;
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={handleNitro}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 길게 누름: 가속 주행 | 공중 스와이프: 360° 플립 | 더블탭: 니트로 (버튼 없음)' : 'Hold: Accelerate | Swipe in Air: 360° Flip | Double Tap: Nitro (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_motocross_stunt"
          gameTitle={isKo ? '3D 복셀 익스트림 모터크로스: 스턴트 랠리' : 'Voxel Extreme Motocross: Stunt Rally'}
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

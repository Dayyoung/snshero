import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDriftMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDriftMasterGame: React.FC<VoxelDriftMasterGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_drift_master') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0);
  const [driftScore, setDriftScore] = useState<number>(0);
  const targetScore = 2000;
  const [nitro, setNitro] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    posX: 45,
    posZ: 0,
    rotY: 0,
    speed: 0,
    driftScore: 0,
    nitro: 100,
    isDrifting: false,
    keys: { w: false, s: false, a: false, d: false, space: false },
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    carMesh: null as THREE.Group | null
  });

  const triggerNitro = () => {
    const s = gameStateRef.current;
    if (s.nitro < 25 || s.isGameOver || s.isVictory || s.isPaused) return;
    s.nitro -= 25;
    s.speed += 20;
    setNitro(Math.round(s.nitro));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x223366, 0.8);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xff00ff, 1.2);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);

    // Circuit Track
    const trackGeo = new THREE.RingGeometry(30, 60, 32);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const track = new THREE.Mesh(trackGeo, trackMat);
    scene.add(track);

    // Sports Car Mesh
    const car = new THREE.Group();
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 3.6), new THREE.MeshPhongMaterial({ color: 0xff0055 }));
    carBody.position.y = 0.5;
    car.add(carBody);

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.6), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    spoiler.position.set(0, 1.1, 1.5);
    car.add(spoiler);

    car.position.set(45, 0, 0);
    scene.add(car);
    gameStateRef.current.carMesh = car;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Steering & Acceleration
      if (s.keys.w) s.speed = Math.min(45, s.speed + 25 * dt);
      else if (s.keys.s) s.speed = Math.max(-15, s.speed - 25 * dt);
      else s.speed = THREE.MathUtils.lerp(s.speed, 0, dt * 2);

      let steerRate = s.keys.space ? 3.5 : 2.0;
      if (s.keys.a) s.rotY += steerRate * dt;
      if (s.keys.d) s.rotY -= steerRate * dt;

      s.posX += Math.sin(s.rotY) * s.speed * dt;
      s.posZ += Math.cos(s.rotY) * s.speed * dt;

      setSpeed(Math.round(Math.abs(s.speed) * 4));

      // Nitro Recharge
      s.nitro = Math.min(100, s.nitro + dt * 8);
      setNitro(Math.round(s.nitro));

      // Drift Score Logic
      if (s.keys.space && Math.abs(s.speed) > 15) {
        s.driftScore += Math.round(Math.abs(s.speed) * 20 * dt);
        setDriftScore(s.driftScore);

        if (s.driftScore >= targetScore && !s.isGameOver) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_drift_master',
            gameTitle: '복셀 드리프트 마스터',
            durationSeconds: duration,
            score: s.driftScore,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }

      if (car) {
        car.position.set(s.posX, 0, s.posZ);
        car.rotation.y = s.rotY;

        camera.position.set(
          s.posX - Math.sin(s.rotY) * 12,
          6,
          s.posZ - Math.cos(s.rotY) * 12
        );
        camera.lookAt(s.posX, 1.5, s.posZ);
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
    s.posX = 45;
    s.posZ = 0;
    s.rotY = 0;
    s.speed = 0;
    s.driftScore = 0;
    s.nitro = 100;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setSpeed(0);
    setDriftScore(0);
    setNitro(100);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 드리프트 마스터' : 'Voxel Drift Master'}
        language={language}
        telemetries={[
          { label: isKo ? '드리프트' : 'Drift', value: `${driftScore}/${targetScore}P`, color: 'text-amber-300' },
          { label: isKo ? '속도' : 'Speed', value: `${speed}km/h`, color: 'text-cyan-300' },
          { label: isKo ? '니트로' : 'Nitro', value: `${nitro}%`, color: 'text-fuchsia-300' }
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

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                gameStateRef.current.keys.w = dy < -8;
                gameStateRef.current.keys.s = dy > 12;
                gameStateRef.current.keys.a = dx < -10;
                gameStateRef.current.keys.d = dx > 10;
                gameStateRef.current.keys.space = Math.abs(dx) > 25;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              gameStateRef.current.keys.w = false;
              gameStateRef.current.keys.s = false;
              gameStateRef.current.keys.a = false;
              gameStateRef.current.keys.d = false;
              gameStateRef.current.keys.space = false;

              if (!moved) {
                // Tap: Nitro Boost
                triggerNitro();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={triggerNitro}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 주행 & 드리프트 | 탭/더블탭: 니트로 부스트 (버튼 없음)' : 'Drag: Drive & Drift | Tap/Double Tap: Nitro (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_drift_master"
          gameTitle={isKo ? '3D 복셀 드리프트 마스터: 나이트 서킷 레이서' : 'Voxel Drift Master: Night Circuit'}
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

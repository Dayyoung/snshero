import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMicroKartGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMicroKartGame: React.FC<VoxelMicroKartGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_micro_kart') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentLap, setCurrentLap] = useState<number>(1);
  const totalLaps = 3;
  const [speed, setSpeed] = useState<number>(0);
  const [turboGauge, setTurboGauge] = useState<number>(100);
  const [items, setItems] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    kartAngle: 0,
    speed: 0,
    maxSpeed: 0.65,
    steer: 0,
    turbo: 100,
    isTurbo: false,
    lap: 1,
    checkpointsPassed: 0,
    items: 3,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    kartGroup: null as THREE.Group | null
  });

  const handleTurbo = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.turbo < 30) return;
    s.isTurbo = true;
    s.turbo -= 30;
    s.speed = 1.1;
    setTurboGauge(Math.floor(s.turbo));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setTimeout(() => {
      s.speed = s.maxSpeed;
      s.isTurbo = false;
    }, 2000);
  };

  const handleUseItem = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.items <= 0) return;
    s.items -= 1;
    s.score += 250;
    setItems(s.items);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a7d44);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 16, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x445544, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 25, 10);
    scene.add(dirLight);

    // Oval Race Track
    const trackGeo = new THREE.TorusGeometry(12, 3.2, 16, 64);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = Math.PI / 2;
    track.position.y = 0.05;
    scene.add(track);

    // Start/Finish Line
    const lineGeo = new THREE.PlaneGeometry(6.4, 1.2);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(12, 0.06, 0);
    scene.add(line);

    // Voxel Micro Kart
    const kartGroup = new THREE.Group();
    const kBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.4, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xe63946 })
    );
    kBody.position.y = 0.25;
    kartGroup.add(kBody);

    kartGroup.position.set(12, 0.3, 0);
    scene.add(kartGroup);
    stateRef.current.kartGroup = kartGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Accelerate
      if (!s.isTurbo) {
        s.speed = THREE.MathUtils.clamp(s.speed + dt * 0.4, 0, s.maxSpeed);
      }
      setSpeed(Math.round(s.speed * 120));

      // Turbo recharge
      s.turbo = Math.min(100, s.turbo + dt * 6);
      setTurboGauge(Math.round(s.turbo));

      // Steer & Move along circle
      s.kartAngle += (s.speed * 2.2 + s.steer * 0.8) * dt;

      if (s.kartAngle >= Math.PI * 2) {
        s.kartAngle -= Math.PI * 2;
        s.lap += 1;
        setCurrentLap(Math.min(totalLaps, s.lap));
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        if (s.lap > totalLaps && !s.isGameOver) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_micro_kart',
            gameTitle: '복셀 마이크로 카트',
            durationSeconds: duration,
            score: s.score + 1500,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }

      if (kartGroup) {
        const radius = 12;
        kartGroup.position.set(Math.cos(s.kartAngle) * radius, 0.3, Math.sin(s.kartAngle) * radius);
        kartGroup.rotation.y = -s.kartAngle + Math.PI / 2;
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
    s.kartAngle = 0;
    s.speed = 0;
    s.steer = 0;
    s.turbo = 100;
    s.lap = 1;
    s.items = 3;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setCurrentLap(1);
    setSpeed(0);
    setTurboGauge(100);
    setItems(3);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 마이크로 카트' : 'Voxel Micro Kart'}
        language={language}
        telemetries={[
          { label: isKo ? '랩' : 'Lap', value: `${currentLap}/${totalLaps}`, color: 'text-amber-300' },
          { label: isKo ? '속도' : 'Speed', value: `${speed} KM/H`, color: 'text-cyan-300' },
          { label: isKo ? '터보' : 'Turbo', value: `${turboGauge}%`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '아이템' : 'Item', value: `x${items}`, color: 'text-emerald-300' }
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

              if (Math.abs(dx) > 8) {
                moved = true;
                stateRef.current.steer = dx > 0 ? 1 : -1;
              }
              if (dy < -25) {
                moved = true;
                handleTurbo();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.steer = 0;

              if (!moved) {
                // Tap: Use Item
                handleUseItem();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={handleTurbo}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 조향 | 탭: 아이템 발사 | 더블탭: 터보 부스트 (버튼 없음)' : 'Drag L/R: Steer | Tap: Item | Double Tap: Turbo (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_micro_kart"
          gameTitle={isKo ? '3D 복셀 마이크로 카트: 그랑프리 3랩 레이싱' : 'Voxel Micro Kart: 3-Lap Grand Prix'}
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

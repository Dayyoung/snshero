import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelFlightLandingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelFlightLandingGame: React.FC<VoxelFlightLandingGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_flight_landing') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentAirport, setCurrentAirport] = useState<number>(1);
  const totalAirports = 3;
  const [altitude, setAltitude] = useState<number>(500);
  const [airspeed, setAirspeed] = useState<number>(240);
  const [gearDeployed, setGearDeployed] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    planePos: new THREE.Vector3(0, 8, -40),
    pitch: 0,
    roll: 0,
    speed: 0.6,
    gear: false,
    airportIdx: 1,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    planeMesh: null as THREE.Group | null
  });

  const toggleGear = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.gear = !s.gear;
    setGearDeployed(s.gear);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6ba4d9);
    scene.fog = new THREE.Fog(0x6ba4d9, 40, 180);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 10, -50);
    camera.lookAt(0, 8, -40);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x446688, 0.95);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // Terrain & Runway
    const terrainGeo = new THREE.PlaneGeometry(300, 300);
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.9 });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    const runwayGeo = new THREE.PlaneGeometry(12, 120);
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 0.05, 40);
    scene.add(runway);

    // Plane Mesh
    const planeGroup = new THREE.Group();
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 5.0), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    fuselage.position.y = 0.6;
    planeGroup.add(fuselage);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.15, 1.8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    wing.position.set(0, 0.6, 0.2);
    planeGroup.add(wing);

    planeGroup.position.set(0, 8, -40);
    scene.add(planeGroup);
    stateRef.current.planeMesh = planeGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Flight Movement
      s.planePos.z += s.speed * 40 * dt;
      s.planePos.x += s.roll * 15 * dt;
      s.planePos.y += s.pitch * 10 * dt;

      // Telemetries
      const alt = Math.max(0, Math.round(s.planePos.y * 60));
      const spd = Math.round(s.speed * 400);
      setAltitude(alt);
      setAirspeed(spd);

      if (planeGroup) {
        planeGroup.position.copy(s.planePos);
        planeGroup.rotation.set(-s.pitch * 0.4, 0, -s.roll * 0.6);

        camera.position.set(s.planePos.x, s.planePos.y + 4, s.planePos.z - 14);
        camera.lookAt(s.planePos.x, s.planePos.y, s.planePos.z + 10);
      }

      // Runway Landing Check (z around 40, y close to 0.5)
      if (s.planePos.z > 20 && s.planePos.z < 60) {
        if (s.planePos.y < 2.0 && s.gear && Math.abs(s.planePos.x) < 4.0) {
          // Successful touchdown!
          s.score += 500;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.airportIdx >= totalAirports) {
            s.isVictory = true;
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_flight_landing',
              gameTitle: '복셀 플라이트 랜딩',
              durationSeconds: duration,
              score: s.score + 1000,
              difficulty: 'HARD',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          } else {
            s.airportIdx += 1;
            setCurrentAirport(s.airportIdx);
            s.planePos.set(0, 10, -40);
            s.gear = false;
            setGearDeployed(false);
          }
        }
      }

      // Crash Check
      if (s.planePos.y <= 0 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_flight_landing',
          gameTitle: '복셀 플라이트 랜딩',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: false
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
    s.planePos.set(0, 8, -40);
    s.pitch = 0;
    s.roll = 0;
    s.gear = false;
    s.airportIdx = 1;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setCurrentAirport(1);
    setGearDeployed(false);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 플라이트 랜딩' : 'Voxel Flight Landing'}
        language={language}
        telemetries={[
          { label: isKo ? '공항' : 'Airport', value: `${currentAirport}/${totalAirports}`, color: 'text-sky-300' },
          { label: isKo ? '고도' : 'ALT', value: `${altitude}FT`, color: 'text-amber-300' },
          { label: isKo ? '속도' : 'SPD', value: `${airspeed}KTS`, color: 'text-cyan-300' },
          { label: isKo ? '기어' : 'Gear', value: gearDeployed ? '🟢 DOWN' : '⚪ UP', color: gearDeployed ? 'text-emerald-300' : 'text-slate-400' }
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

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                moved = true;
                stateRef.current.roll = Math.max(-1, Math.min(1, dx * 0.02));
                stateRef.current.pitch = Math.max(-1, Math.min(1, -dy * 0.02));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.roll = 0;
              stateRef.current.pitch = 0;

              if (!moved) {
                // Tap: Toggle Gear
                toggleGear();
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
        <div className="px-3 py-1 bg-black/75 border border-sky-500/30 rounded-full text-[10px] text-sky-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 기수 피치 & 롤 선회 | 탭: 랜딩기어 ON/OFF (버튼 없음)' : 'Drag: Pitch & Roll | Tap: Toggle Landing Gear (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_flight_landing"
          gameTitle={isKo ? '3D 복셀 플라이트 랜딩: 활주로 정밀 착륙' : 'Voxel Flight Landing: Runway Landing'}
          sportType="flight"
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

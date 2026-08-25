import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelWindHunterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelWindHunterGame: React.FC<VoxelWindHunterGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_wind_hunter') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);
  const maxRounds = 5;
  const [totalScore, setTotalScore] = useState<number>(0);
  const [windSpeed, setWindSpeed] = useState<number>(2.4);
  const [windAngle, setWindAngle] = useState<number>(45);
  const [drawPower, setDrawPower] = useState<number>(0);
  const [lastShotText, setLastShotText] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    aimX: 0,
    aimY: 0,
    isDrawing: false,
    drawPower: 0,
    windSpeed: 2.5,
    windDir: new THREE.Vector2(1, 0),
    round: 1,
    totalScore: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    arrowMesh: null as THREE.Group | null,
    isArrowFlying: false,
    arrowPos: new THREE.Vector3(0, 1.5, 0),
    arrowVel: new THREE.Vector3(0, 0, 0),
    scene: null as THREE.Scene | null
  });

  const generateWind = () => {
    const speed = +(Math.random() * 4.0 + 1.0).toFixed(1);
    const angleDeg = Math.floor(Math.random() * 360);
    const rad = (angleDeg * Math.PI) / 180;
    stateRef.current.windSpeed = speed;
    stateRef.current.windDir.set(Math.cos(rad), Math.sin(rad));
    setWindSpeed(speed);
    setWindAngle(angleDeg);
  };

  useEffect(() => {
    generateWind();
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e7, 1.4);
    sunLight.position.set(40, 80, -30);
    scene.add(sunLight);

    // Meadow Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Archery Target at 70m
    const targetGroup = new THREE.Group();
    targetGroup.position.set(0, 1.5, -70);

    const targetBack = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0xfafafa })
    );
    targetBack.rotation.x = Math.PI / 2;
    targetGroup.add(targetBack);

    const rings = [
      { r: 1.8, col: 0x0284c7 },
      { r: 1.2, col: 0xdc2626 },
      { r: 0.6, col: 0xfacc15 },
      { r: 0.2, col: 0xf59e0b }
    ];
    rings.forEach(({ r, col }) => {
      const ringMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, 0.22, 32),
        new THREE.MeshStandardMaterial({ color: col })
      );
      ringMesh.rotation.x = Math.PI / 2;
      targetGroup.add(ringMesh);
    });
    scene.add(targetGroup);

    // Voxel Arrow Group
    const arrowGroup = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x854d0e })
    );
    shaft.rotation.x = Math.PI / 2;
    arrowGroup.add(shaft);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.7;
    arrowGroup.add(tip);

    arrowGroup.visible = false;
    scene.add(arrowGroup);
    stateRef.current.arrowMesh = arrowGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Draw Power Meter
      if (s.isDrawing) {
        s.drawPower = Math.min(100, s.drawPower + 120 * dt);
        setDrawPower(Math.round(s.drawPower));
      }

      // Arrow Physics
      if (s.isArrowFlying && s.arrowMesh) {
        const windAccelX = s.windDir.x * s.windSpeed * 0.12;
        const windAccelY = s.windDir.y * s.windSpeed * 0.08;

        s.arrowVel.x += windAccelX * dt;
        s.arrowVel.y += (-9.8 * 0.2 + windAccelY) * dt;
        s.arrowPos.addScaledVector(s.arrowVel, dt * 60);
        s.arrowMesh.position.copy(s.arrowPos);

        // Target Impact Hit Check
        if (s.arrowPos.z <= -70) {
          s.isArrowFlying = false;
          const hitDist = Math.hypot(s.arrowPos.x, s.arrowPos.y - 1.5);
          let shotPts = 0;
          let text = 'MISS!';

          if (hitDist <= 0.25) { shotPts = 10; text = '🎯 10P BULLSEYE!!'; }
          else if (hitDist <= 0.65) { shotPts = 9; text = '🔥 9P GOLD!'; }
          else if (hitDist <= 1.25) { shotPts = 7; text = '✨ 7P RED!'; }
          else if (hitDist <= 1.85) { shotPts = 5; text = '💫 5P BLUE!'; }

          s.totalScore += shotPts;
          setTotalScore(s.totalScore);
          setLastShotText(text);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          setTimeout(() => {
            setLastShotText(null);
            if (s.round < maxRounds) {
              s.round += 1;
              setRound(s.round);
              generateWind();
            } else {
              s.isVictory = s.totalScore >= 35;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_wind_hunter',
                gameTitle: '복셀 윈드 헌터',
                durationSeconds: duration,
                score: s.totalScore * 500,
                difficulty: 'HARD',
                isVictory: s.isVictory
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }, 1200);
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
    s.round = 1;
    s.totalScore = 0;
    s.drawPower = 0;
    s.isDrawing = false;
    s.isArrowFlying = false;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setRound(1);
    setTotalScore(0);
    setDrawPower(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    generateWind();
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 윈드 헌터' : 'Voxel Wind Hunter'}
        language={language}
        telemetries={[
          { label: isKo ? '라운드' : 'Round', value: `${round}/${maxRounds}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '풍속' : 'Wind', value: `${windSpeed}m/s`, color: 'text-cyan-300' },
          { label: isKo ? '점수' : 'Score', value: `${totalScore}P`, color: 'text-yellow-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Crosshair Center */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-10 h-10 border border-white/50 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </div>
      </div>

      {/* Shot Result Banner */}
      {lastShotText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-6 py-2 rounded-sm text-sm font-black tracking-wider shadow-xl z-20 pointer-events-none animate-bounce">
          {lastShotText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const s = stateRef.current;
            if (s.isArrowFlying) return;
            s.isDrawing = true;
            s.drawPower = 0;
            const rect = e.currentTarget.getBoundingClientRect();
            s.aimX = (e.clientX - rect.left - rect.width / 2) * 0.03;
            s.aimY = -(e.clientY - rect.top - rect.height / 2) * 0.03;
          }}
          onPointerMove={(e) => {
            const s = stateRef.current;
            if (!s.isDrawing) return;
            const rect = e.currentTarget.getBoundingClientRect();
            s.aimX = (e.clientX - rect.left - rect.width / 2) * 0.03;
            s.aimY = -(e.clientY - rect.top - rect.height / 2) * 0.03;
          }}
          onPointerUp={() => {
            const s = stateRef.current;
            if (!s.isDrawing || s.isArrowFlying) return;
            s.isDrawing = false;
            s.isArrowFlying = true;
            s.arrowPos.set(0, 1.5, 0);

            const speed = (s.drawPower / 100) * 1.6 + 0.8;
            s.arrowVel.set(s.aimX * 0.8, s.aimY * 0.8, -speed * 2.5);

            if (s.arrowMesh) {
              s.arrowMesh.position.copy(s.arrowPos);
              s.arrowMesh.visible = true;
            }
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-400/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 누르기: 시위 당기기 & 조준 | 손 떼기: 발사 (버튼 없음)' : 'Hold: Draw Bow & Aim | Release: Shoot Arrow (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_wind_hunter"
          gameTitle={isKo ? '3D 복셀 윈드 헌터: 풍향 양궁 마스터' : 'Voxel Wind Hunter: Archery Champion'}
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
export default VoxelWindHunterGame;

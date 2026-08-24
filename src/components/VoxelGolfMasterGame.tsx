import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelGolfMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelGolfMasterGame: React.FC<VoxelGolfMasterGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_golf_master') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<number>(0);
  const [power, setPower] = useState<number>(50);
  const [angle, setAngle] = useState<number>(0);
  const [wind, setWind] = useState<number>(2.5);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    ballPos: new THREE.Vector3(0, 0.4, 20),
    ballVel: new THREE.Vector3(0, 0, 0),
    holePos: new THREE.Vector3(0, 0.1, -15),
    isShooting: false,
    strokes: 0,
    power: 50,
    angle: 0,
    wind: 2.5,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    ballMesh: null as THREE.Mesh | null
  });

  const swingClub = () => {
    const s = stateRef.current;
    if (s.isShooting || s.isGameOver || s.isVictory || s.isPaused) return;
    s.isShooting = true;
    s.strokes += 1;
    setStrokes(s.strokes);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const rad = (s.angle * Math.PI) / 180;
    const pVal = (s.power / 100) * 0.9;
    s.ballVel.set(Math.sin(rad) * pVal, 0.4 * (s.power / 100), -Math.cos(rad) * pVal);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x064e3b);
    scene.fog = new THREE.FogExp2(0x064e3b, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 14, 28);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfef08a, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Green Fairway
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 60),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Hole Cup & Flag
    const holeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    holeMesh.position.copy(stateRef.current.holePos);
    scene.add(holeMesh);

    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    flagPole.position.set(0, 3, -15);
    scene.add(flagPole);

    const flagBanner = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    flagBanner.position.set(0.7, 5.5, -15);
    scene.add(flagBanner);

    // Golf Ball
    const ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    ballMesh.position.copy(stateRef.current.ballPos);
    scene.add(ballMesh);
    stateRef.current.ballMesh = ballMesh;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      if (s.isShooting) {
        // Apply wind & gravity
        s.ballVel.x += s.wind * 0.05 * dt;
        s.ballVel.y -= 9.8 * 0.15 * dt;

        s.ballPos.addScaledVector(s.ballVel, dt * 60);

        // Ground bounce
        if (s.ballPos.y <= 0.4) {
          s.ballPos.y = 0.4;
          s.ballVel.y = -s.ballVel.y * 0.4;
          s.ballVel.x *= 0.88;
          s.ballVel.z *= 0.88;

          if (Math.abs(s.ballVel.y) < 0.05) s.ballVel.y = 0;
          if (s.ballVel.length() < 0.05) {
            s.isShooting = false;
            s.ballVel.set(0, 0, 0);
          }
        }

        if (ballMesh) {
          ballMesh.position.copy(s.ballPos);
        }

        // Hole check
        const distToHole = Math.hypot(s.ballPos.x - s.holePos.x, s.ballPos.z - s.holePos.z);
        if (distToHole < 1.2 && s.ballPos.y <= 0.6) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          const duration = (Date.now() - s.startTime) / 1000;
          const scoreVal = Math.max(500, 3000 - s.strokes * 500);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_golf_master',
            gameTitle: '복셀 골프 마스터',
            durationSeconds: duration,
            score: scoreVal,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
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
    s.ballPos.set(0, 0.4, 20);
    s.ballVel.set(0, 0, 0);
    s.isShooting = false;
    s.strokes = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setStrokes(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 골프 마스터' : 'Voxel Golf Master'}
        language={language}
        telemetries={[
          { label: isKo ? '타수' : 'Strokes', value: `${strokes}타`, color: 'text-emerald-300' },
          { label: isKo ? '풍향' : 'Wind', value: `+${wind}m/s`, color: 'text-sky-300' },
          { label: isKo ? '파워' : 'Power', value: `${power}%`, color: 'text-amber-300' },
          { label: isKo ? '각도' : 'Angle', value: `${angle}°`, color: 'text-cyan-300' }
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
                const newAngle = Math.max(-30, Math.min(30, stateRef.current.angle + dx * 0.05));
                stateRef.current.angle = Math.round(newAngle);
                setAngle(Math.round(newAngle));

                const newPow = Math.max(20, Math.min(100, stateRef.current.power - dy * 0.2));
                stateRef.current.power = Math.round(newPow);
                setPower(Math.round(newPow));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Swing Club
                swingClub();
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
        <div className="px-3 py-1 bg-black/75 border border-emerald-500/30 rounded-full text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 조준 각도 | 상하: 파워 조절 | 탭: 골프 스윙 (버튼 없음)' : 'Drag L/R: Aim | Drag U/D: Power | Tap: Swing (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_golf_master"
          gameTitle={isKo ? '3D 복셀 골프 마스터: 필드 퍼팅 대결' : 'Voxel Golf Master: Field Putting'}
          sportType="golf"
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

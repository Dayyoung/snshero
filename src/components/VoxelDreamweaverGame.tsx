import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDreamweaverGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EmeraldRing {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  passed: boolean;
  points: number;
}

export const VoxelDreamweaverGame: React.FC<VoxelDreamweaverGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_dreamweaver') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [ringsPassed, setRingsPassed] = useState<number>(0);
  const targetRings = 15;
  const [flightSpeed, setFlightSpeed] = useState<number>(22);
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [combo, setCombo] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    dragonX: 0,
    dragonY: 0,
    targetX: 0,
    targetY: 0,
    speed: 22,
    score: 0,
    ringsPassed: 0,
    combo: 0,
    timeLeft: 50,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    playerDragon: null as THREE.Group | null,
    rings: [] as EmeraldRing[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x062419);
    scene.fog = new THREE.FogExp2(0x062419, 0.02);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 150);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 1, -20);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x34d399, 0.8);
    scene.add(ambientLight);

    const dreamLight = new THREE.DirectionalLight(0x6ee7b7, 1.8);
    dreamLight.position.set(10, 25, 10);
    scene.add(dreamLight);

    // Floating Dream Islands
    const islandGeo = new THREE.DodecahedronGeometry(3.0);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8 });
    for (let i = 0; i < 15; i++) {
      const isl = new THREE.Mesh(islandGeo, islandMat);
      isl.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 20 - 4, -Math.random() * 120);
      scene.add(isl);
    }

    // Emerald Dream Dragon
    const dragonGroup = new THREE.Group();
    const dragonMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 2.0), dragonMat);
    body.position.y = 0.4;
    dragonGroup.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.0), dragonMat);
    head.position.set(0, 0.7, -1.3);
    dragonGroup.add(head);

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: 0x34d399 }));
    wingL.position.set(-1.6, 0.6, 0);
    dragonGroup.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: 0x34d399 }));
    wingR.position.set(1.6, 0.6, 0);
    dragonGroup.add(wingR);

    scene.add(dragonGroup);
    stateRef.current.playerDragon = dragonGroup;

    // Spawn Emerald Rings ahead
    const ringGeo = new THREE.TorusGeometry(1.6, 0.15, 12, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.8 });

    stateRef.current.rings = [];
    for (let i = 0; i < 20; i++) {
      const rMesh = new THREE.Mesh(ringGeo, ringMat);
      const rx = (Math.random() - 0.5) * 12;
      const ry = (Math.random() - 0.5) * 8;
      const rz = -20 - i * 22;
      rMesh.position.set(rx, ry, rz);
      scene.add(rMesh);

      stateRef.current.rings.push({
        mesh: rMesh,
        pos: new THREE.Vector3(rx, ry, rz),
        passed: false,
        points: 150
      });
    }

    // Timer Interval
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);

      if (s.timeLeft <= 0) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_dreamweaver',
          gameTitle: '복셀 드림위버',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: s.ringsPassed >= 10
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

      // Smooth Flight Steering
      s.dragonX = THREE.MathUtils.lerp(s.dragonX, s.targetX, dt * 6);
      s.dragonY = THREE.MathUtils.lerp(s.dragonY, s.targetY, dt * 6);

      if (dragonGroup) {
        dragonGroup.position.set(s.dragonX, s.dragonY, 0);
        dragonGroup.rotation.z = -(s.targetX - s.dragonX) * 0.2;
        dragonGroup.rotation.x = (s.targetY - s.dragonY) * 0.15;
      }

      // Move Rings forward
      s.rings.forEach(r => {
        r.pos.z += s.speed * dt;
        r.mesh.position.copy(r.pos);
        r.mesh.rotation.z += dt * 1.5;

        // Pass ring check
        if (!r.passed && Math.abs(r.pos.z - 0) < 1.8) {
          const dist = Math.hypot(r.pos.x - s.dragonX, r.pos.y - s.dragonY);
          if (dist < 1.8) {
            r.passed = true;
            s.ringsPassed += 1;
            s.combo += 1;
            s.score += r.points * Math.min(4, s.combo);
            setRingsPassed(s.ringsPassed);
            setScore(s.score);
            setCombo(s.combo);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.ringsPassed >= targetRings) {
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_dreamweaver',
                gameTitle: '복셀 드림위버',
                durationSeconds: duration,
                score: s.score + 1000,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
        }

        // Recycle ring
        if (r.pos.z > 12) {
          r.pos.z = -120;
          r.pos.x = (Math.random() - 0.5) * 12;
          r.pos.y = (Math.random() - 0.5) * 8;
          r.passed = false;
        }
      });

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
    s.dragonX = 0;
    s.dragonY = 0;
    s.targetX = 0;
    s.targetY = 0;
    s.score = 0;
    s.ringsPassed = 0;
    s.combo = 0;
    s.timeLeft = 50;
    s.isGameOver = false;
    s.startTime = Date.now();
    setScore(0);
    setRingsPassed(0);
    setCombo(0);
    setTimeLeft(50);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 드림위버' : 'Voxel Dreamweaver'}
        language={language}
        telemetries={[
          { label: isKo ? '링통과' : 'Rings', value: `${ringsPassed}/${targetRings}개`, color: 'text-emerald-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300' },
          { label: isKo ? '콤보' : 'Combo', value: `✨ x${combo}`, color: 'text-cyan-300' },
          { label: isKo ? '남은시간' : 'Time', value: `${timeLeft}s`, color: 'text-rose-300' }
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
                stateRef.current.targetX = Math.max(-7, Math.min(7, (curX / rect.width - 0.5) * 14));
                stateRef.current.targetY = Math.max(-5, Math.min(5, (0.5 - curY / rect.height) * 10));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Boost Dash
                stateRef.current.speed = 36;
                setFlightSpeed(36);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
                setTimeout(() => {
                  stateRef.current.speed = 22;
                  setFlightSpeed(22);
                }, 1000);
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            stateRef.current.speed = 38;
            setFlightSpeed(38);
            setTimeout(() => {
              stateRef.current.speed = 22;
              setFlightSpeed(22);
            }, 1500);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-emerald-500/30 rounded-full text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 에메랄드 드래곤 비행 조종 | 탭/더블탭: 부스트 대시 (버튼 없음)' : 'Drag: Glide Flight | Tap/Double Tap: Boost Dash (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_dreamweaver"
          gameTitle={isKo ? '3D 복셀 드림위버: 에메랄드 꿈의 비행' : 'Voxel Dreamweaver: Emerald Flight'}
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

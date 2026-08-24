import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelArcaneNexusGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelArcaneNexusGame: React.FC<VoxelArcaneNexusGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_arcane_nexus') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [activeRingIndex, setActiveRingIndex] = useState<number>(0); // 0: Inner, 1: Mid, 2: Outer
  const [nexusOverloads, setNexusOverloads] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    activeRing: 0,
    ringAngles: [0, 0, 0], // Current rotation angles of 3 rings (rad)
    targetAngles: [0, 0, 0],
    requiredAngles: [0, 0, 0], // Target alignment angles for puzzle solution
    ringMeshes: [] as THREE.Group[],
    coreMesh: null as THREE.Mesh | null,
    score: 0,
    nexusOverloads: 0,
    combo: 0,
    timeLeft: 45,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  // Generate new target angle alignment
  const randomizeTargetRings = () => {
    const step = Math.PI / 4; // 45 degree steps (8 positions)
    const angles = [
      Math.floor(Math.random() * 8) * step,
      Math.floor(Math.random() * 8) * step,
      Math.floor(Math.random() * 8) * step
    ];
    stateRef.current.requiredAngles = angles;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a22);
    scene.fog = new THREE.FogExp2(0x0c0a22, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 15, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Arcane Magic Lighting
    const ambientLight = new THREE.AmbientLight(0x818cf8, 0.8);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0xa855f7, 3.0, 25);
    coreLight.position.set(0, 2, 0);
    scene.add(coreLight);

    // Central Nexus Core Crystal
    const coreGeo = new THREE.OctahedronGeometry(1.2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 1.0;
    scene.add(coreMesh);
    stateRef.current.coreMesh = coreMesh;

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(2, 2.5, 1.2, 8);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.7 });
    const pedMesh = new THREE.Mesh(pedGeo, pedMat);
    pedMesh.position.y = -0.6;
    scene.add(pedMesh);

    // Build 3 Concentric Voxel Arcane Rings
    const ringRadii = [3.5, 5.5, 7.5];
    const ringColors = [0xa855f7, 0x38bdf8, 0xf59e0b];
    stateRef.current.ringMeshes = [];

    ringRadii.forEach((radius, ringIdx) => {
      const ringGroup = new THREE.Group();
      const nodeCount = 8;
      const step = (Math.PI * 2) / nodeCount;

      for (let i = 0; i < nodeCount; i++) {
        const angle = i * step;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const isKeyRune = i === 0;
        const nodeGeo = new THREE.BoxGeometry(isKeyRune ? 0.9 : 0.6, isKeyRune ? 0.9 : 0.6, isKeyRune ? 0.9 : 0.6);
        const nodeMat = new THREE.MeshStandardMaterial({
          color: isKeyRune ? 0xffffff : ringColors[ringIdx],
          emissive: isKeyRune ? 0xa855f7 : ringColors[ringIdx],
          emissiveIntensity: isKeyRune ? 1.0 : 0.3
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.position.set(x, 0.4, z);
        ringGroup.add(nodeMesh);
      }

      scene.add(ringGroup);
      stateRef.current.ringMeshes.push(ringGroup);
    });

    randomizeTargetRings();

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
          gameId: 'voxel_arcane_nexus',
          gameTitle: '복셀 아케인 넥서스',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: s.score >= 1000
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

      // Rotate core
      if (s.coreMesh) {
        s.coreMesh.rotation.y += dt * 1.5;
        s.coreMesh.rotation.x += dt * 0.8;
      }

      // Smoothly interpolate ring angles
      for (let i = 0; i < 3; i++) {
        s.ringAngles[i] = THREE.MathUtils.lerp(s.ringAngles[i], s.targetAngles[i], dt * 12);
        if (s.ringMeshes[i]) {
          s.ringMeshes[i].rotation.y = s.ringAngles[i];
        }
      }

      // Update mana particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        p.mesh.scale.multiplyScalar(0.96);
        if (p.life <= 0) {
          scene.remove(p.mesh);
          s.particles.splice(i, 1);
        }
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

  const handlePulseOverload = () => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');

    // Check alignment precision
    let alignedRings = 0;
    const step = Math.PI / 4;

    for (let i = 0; i < 3; i++) {
      const curNorm = (((s.targetAngles[i] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
      const reqNorm = (((s.requiredAngles[i] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
      const diff = Math.abs(curNorm - reqNorm);
      if (diff < 0.15 || Math.abs(diff - Math.PI * 2) < 0.15) {
        alignedRings += 1;
      }
    }

    if (alignedRings === 3) {
      // Perfect 3-Ring Overload Alignment!
      s.nexusOverloads += 1;
      s.combo += 1;
      const pts = 600 + s.combo * 150;
      s.score += pts;
      s.timeLeft = Math.min(60, s.timeLeft + 5);
      setScore(s.score);
      setNexusOverloads(s.nexusOverloads);
      setCombo(s.combo);
      setTimeLeft(s.timeLeft);
      randomizeTargetRings();
    } else if (alignedRings >= 1) {
      // Partial Alignment
      const pts = alignedRings * 100;
      s.score += pts;
      setScore(s.score);
    } else {
      // Alignment Miss
      s.combo = 0;
      setCombo(0);
    }
  };

  const handleRestart = () => {
    const s = stateRef.current;
    s.score = 0;
    s.nexusOverloads = 0;
    s.combo = 0;
    s.timeLeft = 45;
    s.isGameOver = false;
    s.targetAngles = [0, 0, 0];
    s.startTime = Date.now();
    setScore(0);
    setNexusOverloads(0);
    setCombo(0);
    setTimeLeft(45);
    setIsGameOver(false);
    setSettlementReceipt(null);
    randomizeTargetRings();
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 아케인 넥서스' : 'Voxel Arcane Nexus'}
        language={language}
        telemetries={[
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300' },
          { label: isKo ? '과부하' : 'Overload', value: `${nexusOverloads}회`, color: 'text-purple-300' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: 'text-cyan-300' },
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

      {/* Active Ring Selector Indicator */}
      <div className="absolute top-14 left-4 flex gap-1.5 z-20 pointer-events-none">
        {['안쪽 고리', '중간 고리', '바깥 고리'].map((name, idx) => (
          <div
            key={idx}
            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-sm border transition-all ${
              activeRingIndex === idx
                ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                : 'bg-black/60 border-white/10 text-slate-400'
            }`}
          >
            {isKo ? name : `Ring ${idx + 1}`}
          </div>
        ))}
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none"
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

              if (Math.abs(dx) > 20) {
                moved = true;
                const step = Math.PI / 4;
                stateRef.current.targetAngles[stateRef.current.activeRing] += dx > 0 ? step : -step;
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                window.removeEventListener('pointermove', onMove);
              } else if (Math.abs(dy) > 25) {
                moved = true;
                if (dy < 0) {
                  stateRef.current.activeRing = (stateRef.current.activeRing + 1) % 3;
                } else {
                  stateRef.current.activeRing = (stateRef.current.activeRing + 2) % 3;
                }
                setActiveRingIndex(stateRef.current.activeRing);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Trigger Mana Pulse Overload
                handlePulseOverload();
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
        <div className="px-3 py-1 bg-black/75 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 스와이프: 링 45° 회전 | 상하: 링 선택 | 탭: 마나 펄스 방출 (버튼 없음)' : 'Swipe L/R: Rotate 45° | Swipe U/D: Select Ring | Tap: Mana Pulse (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_arcane_nexus"
          gameTitle={isKo ? '3D 복셀 아케인 넥서스: 마나 고리 조율' : 'Voxel Arcane Nexus: Mana Ring Tuning'}
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

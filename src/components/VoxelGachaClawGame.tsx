import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelGachaClawGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ToyFigure {
  mesh: THREE.Mesh;
  type: string;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export const VoxelGachaClawGame: React.FC<VoxelGachaClawGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_gacha_claw') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [collectedCount, setCollectedCount] = useState<number>(0);
  const targetToys = 5;
  const [tokens, setTokens] = useState<number>(10);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    clawX: 0,
    clawZ: 0,
    clawY: 4.2,
    clawState: 'idle' as 'idle' | 'moving' | 'dropping' | 'grabbing' | 'lifting' | 'returning',
    clawTargetToy: null as ToyFigure | null,
    collected: 0,
    tokens: 10,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    toys: [] as ToyFigure[],
    clawMesh: null as THREE.Group | null
  });

  const handleMoveClaw = (dx: number, dz: number) => {
    const s = stateRef.current;
    if (s.clawState !== 'idle' || s.isGameOver || s.isVictory || s.isPaused) return;
    s.clawX = Math.max(-2.2, Math.min(2.2, s.clawX + dx));
    s.clawZ = Math.max(-2.2, Math.min(2.2, s.clawZ + dz));
  };

  const handleDropClaw = () => {
    const s = stateRef.current;
    if (s.clawState !== 'idle' || s.tokens <= 0 || s.isGameOver || s.isVictory || s.isPaused) return;

    s.tokens -= 1;
    setTokens(s.tokens);
    s.clawState = 'dropping';
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181024);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 9);
    camera.lookAt(0, 2.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x442255, 0.9);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xff66cc, 2.5);
    spotLight.position.set(0, 8, 4);
    scene.add(spotLight);

    // Gacha Machine Glass Box
    const machine = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.25, roughness: 0.1 })
    );
    machine.position.y = 2.5;
    scene.add(machine);

    // Drop Chute
    const chute = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.2, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    chute.position.set(-2, 0.4, -2);
    scene.add(chute);

    // Claw Mesh
    const clawGroup = new THREE.Group();
    const clawBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    clawGroup.add(clawBody);

    const fingerL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    fingerL.position.set(-0.3, -0.4, 0);
    clawGroup.add(fingerL);

    const fingerR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    fingerR.position.set(0.3, -0.4, 0);
    clawGroup.add(fingerR);

    clawGroup.position.set(0, 4.2, 0);
    scene.add(clawGroup);
    stateRef.current.clawMesh = clawGroup;

    // Spawn 8 Toy Figures
    stateRef.current.toys = [];
    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xec4899, 0x8b5cf6, 0xf59e0b];
    for (let i = 0; i < 8; i++) {
      const tx = (Math.random() - 0.5) * 4;
      const tz = (Math.random() - 0.5) * 4;
      const tMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.4),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.4 })
      );
      tMesh.position.set(tx, 0.4, tz);
      scene.add(tMesh);

      stateRef.current.toys.push({
        mesh: tMesh,
        type: `Toy-${i}`,
        x: tx,
        y: 0.4,
        z: tz,
        collected: false
      });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Claw State Machine
      if (s.clawState === 'idle') {
        clawGroup.position.set(s.clawX, 4.2, s.clawZ);
      } else if (s.clawState === 'dropping') {
        s.clawY -= dt * 3.5;
        clawGroup.position.set(s.clawX, s.clawY, s.clawZ);

        if (s.clawY <= 0.8) {
          s.clawState = 'grabbing';
          // Check proximity to toys
          s.clawTargetToy = null;
          s.toys.forEach(t => {
            if (!t.collected && Math.hypot(t.x - s.clawX, t.z - s.clawZ) < 0.65) {
              s.clawTargetToy = t;
            }
          });
        }
      } else if (s.clawState === 'grabbing') {
        setTimeout(() => {
          s.clawState = 'lifting';
        }, 300);
      } else if (s.clawState === 'lifting') {
        s.clawY += dt * 3.5;
        clawGroup.position.set(s.clawX, s.clawY, s.clawZ);

        if (s.clawTargetToy) {
          s.clawTargetToy.mesh.position.set(s.clawX, s.clawY - 0.4, s.clawZ);
        }

        if (s.clawY >= 4.2) {
          s.clawY = 4.2;
          s.clawState = 'returning';
        }
      } else if (s.clawState === 'returning') {
        s.clawX = THREE.MathUtils.lerp(s.clawX, -2, dt * 3);
        s.clawZ = THREE.MathUtils.lerp(s.clawZ, -2, dt * 3);
        clawGroup.position.set(s.clawX, s.clawY, s.clawZ);

        if (s.clawTargetToy) {
          s.clawTargetToy.mesh.position.set(s.clawX, s.clawY - 0.4, s.clawZ);
        }

        if (Math.hypot(s.clawX - (-2), s.clawZ - (-2)) < 0.2) {
          if (s.clawTargetToy && !s.clawTargetToy.collected) {
            s.clawTargetToy.collected = true;
            s.clawTargetToy.mesh.position.y = -10;
            s.collected += 1;
            s.score += 350;
            setCollectedCount(s.collected);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.collected >= targetToys) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_gacha_claw',
                gameTitle: '복셀 가챠 클로',
                durationSeconds: duration,
                score: s.score + 1000,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }

          s.clawTargetToy = null;
          s.clawState = 'idle';
          s.clawX = 0;
          s.clawZ = 0;

          if (s.tokens <= 0 && s.collected < targetToys && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_gacha_claw',
              gameTitle: '복셀 가챠 클로',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'HARD',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
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
    s.clawX = 0;
    s.clawZ = 0;
    s.clawY = 4.2;
    s.clawState = 'idle';
    s.collected = 0;
    s.tokens = 10;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.toys.forEach(t => {
      t.collected = false;
      t.mesh.position.set(t.x, t.y, t.z);
    });
    setCollectedCount(0);
    setTokens(10);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 가챠 클로' : 'Voxel Gacha Claw'}
        language={language}
        telemetries={[
          { label: isKo ? '피규어' : 'Toys', value: `${collectedCount}/${targetToys}개`, color: 'text-pink-300' },
          { label: isKo ? '토큰' : 'Tokens', value: `🪙 x${tokens}`, color: 'text-amber-300' },
          {
            label: isKo ? '상태' : 'State',
            value: stateRef.current.clawState === 'idle' ? '조준중' : '집게동작',
            color: stateRef.current.clawState === 'idle' ? 'text-cyan-300' : 'text-emerald-300'
          }
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

              if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
                moved = true;
                const dirX = Math.abs(dx) > 15 ? (dx > 0 ? 0.35 : -0.35) : 0;
                const dirZ = Math.abs(dy) > 15 ? (dy > 0 ? 0.35 : -0.35) : 0;
                handleMoveClaw(dirX, dirZ);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Drop Claw
                handleDropClaw();
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
        <div className="px-3 py-1 bg-black/75 border border-pink-500/30 rounded-full text-[10px] text-pink-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 집게 위치 조준 | 탭: 집게 하강 & 인형 잡기 (버튼 없음)' : 'Drag: Aim Claw Position | Tap: Drop Claw (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_gacha_claw"
          gameTitle={isKo ? '3D 복셀 가챠 클로: 아케이드 인형뽑기' : 'Voxel Gacha Claw: Arcade Claw'}
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

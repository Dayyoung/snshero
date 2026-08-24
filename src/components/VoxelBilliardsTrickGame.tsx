import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBilliardsTrickGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface BilliardBall {
  mesh: THREE.Mesh;
  num: number;
  color: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isPocketed: boolean;
}

export const VoxelBilliardsTrickGame: React.FC<VoxelBilliardsTrickGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_billiards_trick') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pocketedCount, setPocketedCount] = useState<number>(0);
  const totalBalls = 7;
  const [power, setPower] = useState<number>(50);
  const [shots, setShots] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    cueAngle: 0,
    cuePower: 50,
    balls: [] as BilliardBall[],
    cueBall: null as BilliardBall | null,
    isShooting: false,
    pocketed: 0,
    shots: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    cueMesh: null as THREE.Mesh | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e141b);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 8.5, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x223344, 0.9);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xffffff, 2.8);
    spotLight.position.set(0, 8, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.3;
    scene.add(spotLight);

    // Billiard Pool Table
    const tableClothGeo = new THREE.BoxGeometry(6, 0.2, 10);
    const tableClothMat = new THREE.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.8 });
    const tableCloth = new THREE.Mesh(tableClothGeo, tableClothMat);
    tableCloth.position.y = 0;
    scene.add(tableCloth);

    // Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5c3317 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 10.4), railMat);
    railL.position.set(-3.2, 0.2, 0);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 10.4), railMat);
    railR.position.set(3.2, 0.2, 0);
    const railT = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.4, 0.4), railMat);
    railT.position.set(0, 0.2, -5.2);
    const railB = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.4, 0.4), railMat);
    railB.position.set(0, 0.2, 5.2);
    scene.add(railL, railR, railT, railB);

    // Pockets
    const pocketGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const pocketMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const pocketCoords = [
      [-2.8, -4.8], [2.8, -4.8],
      [-2.9, 0], [2.9, 0],
      [-2.8, 4.8], [2.8, 4.8]
    ];
    pocketCoords.forEach(([px, pz]) => {
      const pMesh = new THREE.Mesh(pocketGeo, pocketMat);
      pMesh.position.set(px, 0.11, pz);
      scene.add(pMesh);
    });

    // Cue Stick Mesh
    const cueGeo = new THREE.CylinderGeometry(0.04, 0.08, 4.5, 8);
    const cueMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
    const cueMesh = new THREE.Mesh(cueGeo, cueMat);
    cueMesh.rotation.x = Math.PI / 2;
    scene.add(cueMesh);
    stateRef.current.cueMesh = cueMesh;

    // Spawn Balls
    const colors = [0xffffff, 0xfacc15, 0x3b82f6, 0xef4444, 0xa855f7, 0xf97316, 0x10b981, 0x1e293b];
    stateRef.current.balls = [];

    // Cue Ball
    const ballGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const cueBallMat = new THREE.MeshStandardMaterial({ color: colors[0], roughness: 0.2 });
    const cueBallMesh = new THREE.Mesh(ballGeo, cueBallMat);
    cueBallMesh.position.set(0, 0.3, 2.5);
    scene.add(cueBallMesh);

    const cueBallObj: BilliardBall = {
      mesh: cueBallMesh,
      num: 0,
      color: colors[0],
      pos: new THREE.Vector3(0, 0.3, 2.5),
      vel: new THREE.Vector3(0, 0, 0),
      isPocketed: false
    };
    stateRef.current.cueBall = cueBallObj;
    stateRef.current.balls.push(cueBallObj);

    // Target Balls in Triangle
    let bIdx = 1;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col <= row; col++) {
        if (bIdx > 7) break;
        const bx = (col - row / 2) * 0.45;
        const bz = -2.0 - row * 0.4;
        const bMat = new THREE.MeshStandardMaterial({ color: colors[bIdx], roughness: 0.2 });
        const bMesh = new THREE.Mesh(ballGeo, bMat);
        bMesh.position.set(bx, 0.3, bz);
        scene.add(bMesh);

        stateRef.current.balls.push({
          mesh: bMesh,
          num: bIdx,
          color: colors[bIdx],
          pos: new THREE.Vector3(bx, 0.3, bz),
          vel: new THREE.Vector3(0, 0, 0),
          isPocketed: false
        });
        bIdx++;
      }
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Update Cue Stick Position
      if (s.cueBall && !s.cueBall.isPocketed && !s.isShooting) {
        if (s.cueMesh) {
          s.cueMesh.visible = true;
          const cueDist = 2.8 + (s.cuePower / 100) * 0.6;
          s.cueMesh.position.set(
            s.cueBall.pos.x + Math.sin(s.cueAngle) * cueDist,
            0.55,
            s.cueBall.pos.z + Math.cos(s.cueAngle) * cueDist
          );
          s.cueMesh.rotation.y = s.cueAngle;
        }
      } else if (s.cueMesh) {
        s.cueMesh.visible = false;
      }

      // Ball Physics & Collisions
      let anyMoving = false;
      for (let b of s.balls) {
        if (b.isPocketed) continue;

        if (b.vel.lengthSq() > 0.0001) {
          anyMoving = true;
          b.pos.addScaledVector(b.vel, dt);
          b.vel.multiplyScalar(0.985); // Friction
          b.mesh.position.copy(b.pos);

          // Rail Bounce
          if (Math.abs(b.pos.x) > 2.7) {
            b.vel.x = -b.vel.x * 0.85;
            b.pos.x = Math.sign(b.pos.x) * 2.7;
          }
          if (Math.abs(b.pos.z) > 4.7) {
            b.vel.z = -b.vel.z * 0.85;
            b.pos.z = Math.sign(b.pos.z) * 4.7;
          }

          // Pocket Detection
          for (let [px, pz] of pocketCoords) {
            if (Math.hypot(b.pos.x - px, b.pos.z - pz) < 0.45) {
              b.isPocketed = true;
              b.mesh.position.y = -10;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');

              if (b.num !== 0) {
                s.pocketed += 1;
                setPocketedCount(s.pocketed);

                if (s.pocketed >= totalBalls) {
                  s.isGameOver = true;
                  setIsGameOver(true);
                  const duration = (Date.now() - s.startTime) / 1000;
                  const receipt = calculateAndDepositMissionReward({
                    gameId: 'voxel_billiards_trick',
                    gameTitle: '복셀 당구 트릭샷',
                    durationSeconds: duration,
                    score: s.pocketed * 400 + Math.max(0, 1000 - s.shots * 80),
                    difficulty: 'HARD',
                    isVictory: true
                  });
                  setSettlementReceipt(receipt);
                  onReward(receipt.totalSns);
                }
              } else {
                // Scratch cue ball -> respawn
                setTimeout(() => {
                  b.isPocketed = false;
                  b.pos.set(0, 0.3, 2.5);
                  b.vel.set(0, 0, 0);
                  b.mesh.position.copy(b.pos);
                }, 800);
              }
              break;
            }
          }
        }
      }

      // Ball to Ball Collisions
      for (let i = 0; i < s.balls.length; i++) {
        for (let j = i + 1; j < s.balls.length; j++) {
          const b1 = s.balls[i];
          const b2 = s.balls[j];
          if (b1.isPocketed || b2.isPocketed) continue;

          const diff = new THREE.Vector3().subVectors(b2.pos, b1.pos);
          const dist = diff.length();
          if (dist < 0.4 && dist > 0.0001) {
            const normal = diff.normalize();
            const relVel = new THREE.Vector3().subVectors(b1.vel, b2.vel);
            const impulse = relVel.dot(normal);

            if (impulse > 0) {
              b1.vel.subScaledVector(normal, impulse * 0.95);
              b2.vel.addScaledVector(normal, impulse * 0.95);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }
          }
        }
      }

      s.isShooting = anyMoving;

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

  const handleShoot = () => {
    const s = stateRef.current;
    if (s.isShooting || !s.cueBall || s.cueBall.isPocketed || s.isGameOver || s.isPaused) return;

    s.shots += 1;
    setShots(s.shots);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const shotSpeed = 10 + (s.cuePower / 100) * 25;
    s.cueBall.vel.set(
      -Math.sin(s.cueAngle) * shotSpeed,
      0,
      -Math.cos(s.cueAngle) * shotSpeed
    );
  };

  const handleRestart = () => {
    const s = stateRef.current;
    s.pocketed = 0;
    s.shots = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    setPocketedCount(0);
    setShots(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 당구 트릭샷' : 'Voxel Billiards Trick'}
        language={language}
        telemetries={[
          { label: isKo ? '포켓' : 'Pocket', value: `${pocketedCount}/${totalBalls}구`, color: 'text-emerald-300' },
          { label: isKo ? '파워' : 'Power', value: `${power}%`, color: 'text-amber-300' },
          { label: isKo ? '샷' : 'Shots', value: `${shots}회`, color: 'text-cyan-300' }
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
                // Horizontal drag: rotate cue angle
                stateRef.current.cueAngle += dx * 0.003;
                // Vertical drag: adjust power
                const newPow = Math.max(20, Math.min(100, stateRef.current.cuePower - dy * 0.2));
                stateRef.current.cuePower = newPow;
                setPower(Math.round(newPow));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Strike Cue Ball
                handleShoot();
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
          {isKo ? '좌우 드래그: 360° 조준 | 상하: 파워 조절 | 탭: 샷 타격 (버튼 없음)' : 'Drag L/R: 360° Aim | Drag U/D: Power | Tap: Strike (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_billiards_trick"
          gameTitle={isKo ? '3D 복셀 당구 트릭샷: 마스터 큐' : 'Voxel Billiards Trick: Master Cue'}
          sportType="billiards"
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

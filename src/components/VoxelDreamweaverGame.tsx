import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Wind, Zap } from 'lucide-react';
import { CardData } from '../types';

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

  const [score, setScore] = useState<number>(0);
  const [ringsPassed, setRingsPassed] = useState<number>(0);
  const [flightSpeed, setFlightSpeed] = useState<number>(20);
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [combo, setCombo] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

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
    playerDragon: null as THREE.Group | null,
    rings: [] as EmeraldRing[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
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
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Emerald Dream World Lighting
    const ambientLight = new THREE.AmbientLight(0x34d399, 0.8);
    scene.add(ambientLight);

    const dreamLight = new THREE.DirectionalLight(0x6ee7b7, 1.8);
    dreamLight.position.set(10, 25, 10);
    scene.add(dreamLight);

    // Dream Cloud Floating Islands
    const islandGeo = new THREE.DodecahedronGeometry(3.0);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8 });
    for (let i = 0; i < 15; i++) {
      const isl = new THREE.Mesh(islandGeo, islandMat);
      isl.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 20 - 4, -Math.random() * 120);
      scene.add(isl);
    }

    // Build Ysela Green Dream Dragon
    const dragonGroup = new THREE.Group();
    const dragonMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xa7f3d0, metalness: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 2.0), dragonMat);
    dragonGroup.add(body);

    const lWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.0), dragonMat);
    lWing.position.set(-1.8, 0.3, 0);
    dragonGroup.add(lWing);

    const rWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.0), dragonMat);
    rWing.position.set(1.8, 0.3, 0);
    dragonGroup.add(rWing);

    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 6), hornMat);
    horn.position.set(0, 0.8, -0.6);
    horn.rotation.x = -Math.PI / 4;
    dragonGroup.add(horn);

    dragonGroup.position.set(0, 0, 0);
    scene.add(dragonGroup);
    stateRef.current.playerDragon = dragonGroup;

    // Emerald Torus Rings
    const ringGeo = new THREE.TorusGeometry(1.6, 0.2, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.8 });

    const spawnRing = (zPos: number) => {
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      const posX = (Math.random() - 0.5) * 14;
      const posY = (Math.random() - 0.5) * 8;
      mesh.position.set(posX, posY, zPos);
      scene.add(mesh);

      stateRef.current.rings.push({
        mesh,
        pos: mesh.position,
        passed: false,
        points: 250
      });
    };

    // Initial Rings
    for (let z = -20; z > -160; z -= 14) {
      spawnRing(z);
    }

    const spawnDreamParticles = (pos: THREE.Vector3, color: number) => {
      const pCount = lowSpecMode ? 4 : 8;
      const pGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const pMat = new THREE.MeshBasicMaterial({ color });
      for (let p = 0; p < pCount; p++) {
        const pm = new THREE.Mesh(pGeo, pMat);
        pm.position.copy(pos);
        scene.add(pm);
        stateRef.current.particles.push({
          mesh: pm,
          vel: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6),
          life: 0.8
        });
      }
    };

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver) return;
      const step = 2.0;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.targetX = Math.max(-7, stateRef.current.targetX - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.targetX = Math.min(7, stateRef.current.targetX + step);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        stateRef.current.targetY = Math.min(5, stateRef.current.targetY + step);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        stateRef.current.targetY = Math.max(-5, stateRef.current.targetY - step);
      } else if (e.key === ' ') {
        stateRef.current.speed = 36;
        setFlightSpeed(36);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        stateRef.current.speed = 22;
        setFlightSpeed(22);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;
    let timerAcc = 0;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      if (!state.isGameOver) {
        // Countdown
        timerAcc += delta;
        if (timerAcc >= 1.0) {
          timerAcc = 0;
          state.timeLeft = Math.max(0, state.timeLeft - 1);
          setTimeLeft(state.timeLeft);
          if (state.timeLeft <= 0) {
            state.isGameOver = true;
            setIsGameOver(true);
            const reward = Math.min(50, Math.max(15, Math.floor(state.score / 200)));
            setRewardSns(reward);
            onReward(reward);
          }
        }

        // Dragon movement
        state.dragonX += (state.targetX - state.dragonX) * 8 * delta;
        state.dragonY += (state.targetY - state.dragonY) * 8 * delta;
        if (dragonGroup) {
          dragonGroup.position.x = state.dragonX;
          dragonGroup.position.y = state.dragonY;
          dragonGroup.rotation.z = -(state.targetX - state.dragonX) * 0.15;
          dragonGroup.rotation.x = (state.targetY - state.dragonY) * 0.15;
          lWing.rotation.z = Math.sin(now * 0.01) * 0.3;
          rWing.rotation.z = -Math.sin(now * 0.01) * 0.3;
        }

        // Update Rings
        for (let i = state.rings.length - 1; i >= 0; i--) {
          const ring = state.rings[i];
          ring.pos.z += state.speed * delta;
          ring.mesh.position.z = ring.pos.z;
          ring.mesh.rotation.z += 1.5 * delta;

          // Check Ring Pass
          if (!ring.passed && Math.abs(ring.pos.z - 0) < 1.5) {
            const dist = Math.hypot(ring.pos.x - state.dragonX, ring.pos.y - state.dragonY);
            if (dist < 1.6) {
              ring.passed = true;
              ring.mesh.visible = false;
              state.combo++;
              state.ringsPassed++;
              state.score += ring.points * (1 + state.combo * 0.2);
              setRingsPassed(state.ringsPassed);
              setScore(Math.floor(state.score));
              setCombo(state.combo);
              spawnDreamParticles(dragonGroup.position, 0x34d399);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            }
          }

          // Recycle
          if (ring.pos.z > 10) {
            scene.remove(ring.mesh);
            state.rings.splice(i, 1);
          }
        }

        // Spawn new rings
        while (state.rings.length < 12) {
          spawnRing(-140 - Math.random() * 20);
        }
      }

      // Update Particles
      for (let p = state.particles.length - 1; p >= 0; p--) {
        const pt = state.particles[p];
        pt.life -= delta;
        pt.mesh.position.addScaledVector(pt.vel, delta);
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
          state.particles.splice(p, 1);
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col select-none overflow-hidden font-mono">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Top Header */}
      <div className="relative z-10 w-full p-3 sm:p-4 flex items-center justify-between bg-slate-950/80 border-b border-emerald-900/40 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-emerald-400 text-slate-200 text-xs font-bold rounded-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/50 rounded-sm text-emerald-300">
            <Sparkles size={13} className="text-emerald-400 animate-pulse" />
            <span>{ringsPassed} {isKo ? '링 통과' : 'Rings'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 border border-amber-500/50 rounded-sm text-amber-300">
            <Trophy size={13} className="text-amber-400" />
            <span>{score.toLocaleString()}P</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/70 border border-cyan-500/50 rounded-sm text-cyan-300">
            <span>⏱️ {timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Flight Speed & Combo Banner */}
      <div className="relative z-10 w-full px-4 pt-2 flex flex-col items-center gap-1 pointer-events-none">
        {combo > 1 && (
          <div className="px-3 py-0.5 bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-black rounded-sm animate-bounce">
            ✨ {combo} RING COMBO CHAIN!
          </div>
        )}
        <div className="text-[10px] text-emerald-300/80 font-bold">
          {isKo ? `비행 속도: ${flightSpeed} km/h` : `Flight Speed: ${flightSpeed} km/h`}
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
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
            setTimeout(() => { stateRef.current.speed = 22; setFlightSpeed(22); }, 1500);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-emerald-500/30 rounded-full text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 글라이더 조종 | 탭/더블탭: 에메랄드 부스트 (버튼 없음)' : 'Drag: Glide Flight | Tap/Double Tap: Boost (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '꿈의 비행 완료!' : 'EMERALD FLIGHT COMPLETE!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '통과한 에메랄드 링' : 'Rings Cleared'}</span>
                <span className="text-emerald-400 font-bold">{ringsPassed}개</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 점수' : 'Final Score'}</span>
                <span className="text-yellow-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm rounded-sm tracking-wider shadow-lg cursor-pointer"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

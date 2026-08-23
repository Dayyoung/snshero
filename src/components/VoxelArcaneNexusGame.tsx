import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Disc, Zap } from 'lucide-react';
import { CardData } from '../types';

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

  const [score, setScore] = useState<number>(0);
  const [activeRingIndex, setActiveRingIndex] = useState<number>(0); // 0: Inner, 1: Mid, 2: Outer
  const [nexusOverloads, setNexusOverloads] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

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

    // Build Central Nexus Core Crystal (Malygon Arcane Core)
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

    // Build 3 Concentric Voxel Arcane Rings
    const ringRadii = [3.2, 5.4, 7.6];
    const ringColors = [0x38bdf8, 0x818cf8, 0xc084fc];
    const ringMeshes: THREE.Group[] = [];

    ringRadii.forEach((radius, idx) => {
      const ringGroup = new THREE.Group();
      const nodeGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: ringColors[idx],
        emissive: ringColors[idx],
        emissiveIntensity: 0.4,
        roughness: 0.3
      });

      // 8 Arcane Nodes per Ring
      for (let n = 0; n < 8; n++) {
        const theta = (n / 8) * Math.PI * 2;
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.set(Math.cos(theta) * radius, 0.2, Math.sin(theta) * radius);
        ringGroup.add(node);
      }

      // Ring Track Outline
      const trackGeo = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 32);
      const trackMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b, side: THREE.DoubleSide });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.rotation.x = -Math.PI / 2;
      scene.add(track);

      scene.add(ringGroup);
      ringMeshes.push(ringGroup);
    });

    stateRef.current.ringMeshes = ringMeshes;
    randomizeTargetRings();

    const spawnPulseFX = (pos: THREE.Vector3) => {
      const pCount = lowSpecMode ? 6 : 12;
      const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      for (let p = 0; p < pCount; p++) {
        const pm = new THREE.Mesh(pGeo, pMat);
        pm.position.copy(pos);
        scene.add(pm);
        stateRef.current.particles.push({
          mesh: pm,
          vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 1, (Math.random() - 0.5) * 8),
          life: 0.6
        });
      }
    };

    // Check Alignment Trigger
    const triggerPulse = () => {
      if (stateRef.current.isGameOver) return;
      const step = Math.PI / 4;
      const state = stateRef.current;

      // Check if all 3 rings match the required angles (modulo 2PI)
      let matchCount = 0;
      for (let i = 0; i < 3; i++) {
        const curNorm = (((state.ringAngles[i] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        const reqNorm = (((state.requiredAngles[i] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        if (Math.abs(curNorm - reqNorm) < 0.2 || Math.abs(curNorm - reqNorm - Math.PI * 2) < 0.2) {
          matchCount++;
        }
      }

      if (matchCount >= 2) {
        // Successful Alignment
        state.combo++;
        state.nexusOverloads++;
        const added = 350 * state.combo;
        state.score += added;
        setScore(state.score);
        setCombo(state.combo);
        setNexusOverloads(state.nexusOverloads);

        spawnPulseFX(new THREE.Vector3(0, 1, 0));
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        randomizeTargetRings();

        if (state.nexusOverloads >= 8 && !state.isGameOver) {
          state.isGameOver = true;
          setIsGameOver(true);
          const winReward = 45;
          setRewardSns(winReward);
          onReward(winReward);
        }
      } else {
        state.combo = 0;
        setCombo(0);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
      }
    };

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver) return;
      const step = Math.PI / 4;
      const cur = stateRef.current.activeRing;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.targetAngles[cur] -= step;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.targetAngles[cur] += step;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else if (e.key === '1') {
        stateRef.current.activeRing = 0;
        setActiveRingIndex(0);
      } else if (e.key === '2') {
        stateRef.current.activeRing = 1;
        setActiveRingIndex(1);
      } else if (e.key === '3') {
        stateRef.current.activeRing = 2;
        setActiveRingIndex(2);
      } else if (e.key === ' ') {
        triggerPulse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;
    let timerAcc = 0;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      if (!state.isGameOver) {
        timerAcc += delta;
        if (timerAcc >= 1.0) {
          timerAcc = 0;
          state.timeLeft = Math.max(0, state.timeLeft - 1);
          setTimeLeft(state.timeLeft);
          if (state.timeLeft <= 0) {
            state.isGameOver = true;
            setIsGameOver(true);
            const reward = Math.min(50, Math.max(10, Math.floor(state.score / 200)));
            setRewardSns(reward);
            onReward(reward);
          }
        }

        // Rotate Nexus Core Crystal
        if (coreMesh) {
          coreMesh.rotation.y += 1.0 * delta;
          coreMesh.rotation.x = Math.sin(now * 0.003) * 0.2;
        }

        // Smoothly rotate rings
        for (let i = 0; i < 3; i++) {
          state.ringAngles[i] += (state.targetAngles[i] - state.ringAngles[i]) * 10 * delta;
          if (ringMeshes[i]) {
            ringMeshes[i].rotation.y = state.ringAngles[i];
          }
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
      <div className="relative z-10 w-full p-3 sm:p-4 flex items-center justify-between bg-slate-950/80 border-b border-indigo-900/40 backdrop-blur-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-indigo-400 text-slate-200 text-xs font-bold rounded-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/70 border border-indigo-500/50 rounded-sm text-indigo-300">
            <Zap size={13} className="text-indigo-400 animate-pulse" />
            <span>{nexusOverloads}/8 {isKo ? '과부하' : 'Overload'}</span>
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

      {/* Ring Selection Tabs */}
      <div className="relative z-10 w-full px-4 pt-2 flex justify-center gap-2 pointer-events-auto">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            onClick={() => {
              stateRef.current.activeRing = idx;
              setActiveRingIndex(idx);
            }}
            className={`px-4 py-1.5 text-xs font-black rounded-sm border transition-all cursor-pointer ${activeRingIndex === idx ? 'bg-indigo-600 border-indigo-300 text-white shadow-[0_0_12px_rgba(99,102,241,0.8)]' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}
          >
            {idx === 0 ? (isKo ? '1단 링(내부)' : 'Inner Ring') : idx === 1 ? (isKo ? '2단 링(중간)' : 'Mid Ring') : (isKo ? '3단 링(외부)' : 'Outer Ring')}
          </button>
        ))}
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
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

              if (Math.abs(dx) > 25) {
                moved = true;
                const step = Math.PI / 4;
                stateRef.current.targetAngles[stateRef.current.activeRing] += dx > 0 ? step : -step;
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                window.removeEventListener('pointermove', onMove);
              } else if (Math.abs(dy) > 30) {
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
                // Tap: Trigger Mana Pulse
                const evt = new KeyboardEvent('keydown', { key: ' ' });
                window.dispatchEvent(evt);
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
        <div className="px-3 py-1 bg-black/70 border border-indigo-500/30 rounded-full text-[10px] text-indigo-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 스와이프: 링 회전 | 상하 스와이프: 링 전환 | 탭: 마나 방출 (버튼 없음)' : 'Swipe L/R: Rotate | Swipe U/D: Switch Ring | Tap: Pulse (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-indigo-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '비전 넥서스 활성화 완료!' : 'ARCANE NEXUS COMPLETE!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '성공한 마나 과부하' : 'Nexus Overloads'}</span>
                <span className="text-indigo-400 font-bold">{nexusOverloads}회</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 점수' : 'Final Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-black text-sm rounded-sm tracking-wider shadow-lg cursor-pointer"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

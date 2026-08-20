import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Gift, Move } from 'lucide-react';
import { CardData } from '../types';

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

  const [collectedCount, setCollectedCount] = useState<number>(0);
  const targetToys = 5;
  const [tokens, setTokens] = useState<number>(10);
  const [isClawBusy, setIsClawBusy] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    clawX: 0,
    clawZ: 0,
    clawY: 4.2,
    clawState: 'idle' as 'idle' | 'moving' | 'dropping' | 'grabbing' | 'lifting' | 'returning',
    clawTargetToy: null as ToyFigure | null,
    collected: 0,
    tokens: 10,
    toys: [] as ToyFigure[],
    isGameOver: false
  });

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
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Arcade Lights
    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x442255, 0.9);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xff66cc, 2.5);
    spotLight.position.set(0, 8, 4);
    scene.add(spotLight);

    // Gacha Machine Glass Box
    const machineGeo = new THREE.BoxGeometry(6, 6, 6);
    const machineMat = new THREE.MeshStandardMaterial({
      color: 0x4cc9f0,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1
    });
    const machine = new THREE.Mesh(machineGeo, machineMat);
    machine.position.y = 2.5;
    scene.add(machine);

    // Drop Chute
    const chuteGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.set(-2, 0.4, -2);
    scene.add(chute);

    // Claw Assembly
    const clawGroup = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 2, 8);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 1;

    const headGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xff0055, metalness: 0.5 });
    const clawHead = new THREE.Mesh(headGeo, headMat);

    // 3 Prongs
    const prongMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    for (let i = 0; i < 3; i++) {
      const prong = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), prongMat);
      const angle = (i / 3) * Math.PI * 2;
      prong.position.set(Math.cos(angle) * 0.4, -0.4, Math.sin(angle) * 0.4);
      prong.rotation.z = Math.cos(angle) * 0.3;
      clawHead.add(prong);
    }

    clawGroup.add(shaft, clawHead);
    clawGroup.position.set(0, 4.2, 0);
    scene.add(clawGroup);

    // Scatter Voxel Toy Figures
    const toys: ToyFigure[] = [];
    const colors = [0xffbe0b, 0xfb5607, 0xff006e, 0x8338ec, 0x3a86ff];
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.3 });
      const mesh = new THREE.Mesh(geo, mat);

      const x = (Math.random() - 0.5) * 4.0;
      const z = (Math.random() - 0.5) * 4.0;
      mesh.position.set(x, 0.4, z);
      mesh.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2);
      scene.add(mesh);

      toys.push({
        mesh,
        type: `Toy_${i + 1}`,
        x,
        y: 0.4,
        z,
        collected: false
      });
    }
    stateRef.current.toys = toys;

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!stateRef.current.isGameOver) {
        // Claw FSM
        if (stateRef.current.clawState === 'dropping') {
          stateRef.current.clawY -= 0.08;
          clawGroup.position.y = stateRef.current.clawY;

          if (stateRef.current.clawY <= 0.8) {
            // Reached bottom, try grabbing
            stateRef.current.clawState = 'grabbing';
            setIsClawBusy(true);

            // Check if near any toy
            let grabbed: ToyFigure | null = null;
            for (let t of stateRef.current.toys) {
              if (!t.collected) {
                const dist = Math.hypot(stateRef.current.clawX - t.x, stateRef.current.clawZ - t.z);
                if (dist < 0.9) {
                  grabbed = t;
                  break;
                }
              }
            }

            stateRef.current.clawTargetToy = grabbed;
            setTimeout(() => {
              stateRef.current.clawState = 'lifting';
            }, 600);
          }
        } else if (stateRef.current.clawState === 'lifting') {
          stateRef.current.clawY += 0.08;
          clawGroup.position.y = stateRef.current.clawY;

          if (stateRef.current.clawTargetToy) {
            stateRef.current.clawTargetToy.mesh.position.set(
              stateRef.current.clawX,
              stateRef.current.clawY - 0.4,
              stateRef.current.clawZ
            );
          }

          if (stateRef.current.clawY >= 4.2) {
            stateRef.current.clawY = 4.2;
            stateRef.current.clawState = 'returning';
          }
        } else if (stateRef.current.clawState === 'returning') {
          // Move towards chute (-2, -2)
          stateRef.current.clawX = THREE.MathUtils.lerp(stateRef.current.clawX, -2, 0.06);
          stateRef.current.clawZ = THREE.MathUtils.lerp(stateRef.current.clawZ, -2, 0.06);
          clawGroup.position.x = stateRef.current.clawX;
          clawGroup.position.z = stateRef.current.clawZ;

          if (stateRef.current.clawTargetToy) {
            stateRef.current.clawTargetToy.mesh.position.set(
              stateRef.current.clawX,
              stateRef.current.clawY - 0.4,
              stateRef.current.clawZ
            );
          }

          if (Math.hypot(stateRef.current.clawX - (-2), stateRef.current.clawZ - (-2)) < 0.1) {
            // Dropped in chute
            if (stateRef.current.clawTargetToy) {
              stateRef.current.clawTargetToy.collected = true;
              scene.remove(stateRef.current.clawTargetToy.mesh);
              stateRef.current.clawTargetToy = null;
              stateRef.current.collected += 1;
              setCollectedCount(stateRef.current.collected);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

              if (stateRef.current.collected >= targetToys) {
                stateRef.current.isGameOver = true;
                setIsGameOver(true);
                const r = 260;
                setRewardSns(r);
                onReward(r);
              }
            }
            stateRef.current.clawState = 'idle';
            setIsClawBusy(false);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, onReward, playSfx]);

  const handleMoveClaw = (dx: number, dz: number) => {
    if (stateRef.current.clawState !== 'idle' || stateRef.current.isGameOver) return;
    stateRef.current.clawX = Math.max(-2.2, Math.min(2.2, stateRef.current.clawX + dx));
    stateRef.current.clawZ = Math.max(-2.2, Math.min(2.2, stateRef.current.clawZ + dz));
  };

  const handleDropClaw = () => {
    if (stateRef.current.clawState !== 'idle' || stateRef.current.isGameOver || stateRef.current.tokens <= 0) return;
    stateRef.current.tokens -= 1;
    setTokens(stateRef.current.tokens);
    stateRef.current.clawState = 'dropping';
    setIsClawBusy(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-pink-500/40 px-3 py-1.5 rounded-sm">
          <Gift size={16} className="text-pink-400" />
          <span className="text-xs text-pink-300 font-bold">
            {isKo ? `수집: ${collectedCount}/${targetToys}개` : `TOYS: ${collectedCount}/${targetToys}`}
          </span>
          <span className="text-[10px] text-amber-300">
            🪙 x{tokens}
          </span>
        </div>
      </div>

      {/* Mobile Controls: D-Pad & Grab Drop */}
      <div className="absolute bottom-6 left-3 right-3 flex items-center justify-between gap-3 z-10">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-2 rounded-sm border border-slate-700">
          <div />
          <button
            onClick={() => handleMoveClaw(0, -0.4)}
            className="w-10 h-10 bg-slate-800 active:bg-pink-600 text-white font-bold text-xs rounded-sm flex items-center justify-center cursor-pointer"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => handleMoveClaw(-0.4, 0)}
            className="w-10 h-10 bg-slate-800 active:bg-pink-600 text-white font-bold text-xs rounded-sm flex items-center justify-center cursor-pointer"
          >
            ◀
          </button>
          <div className="w-10 h-10 flex items-center justify-center text-slate-500 text-xs">
            <Move size={14} />
          </div>
          <button
            onClick={() => handleMoveClaw(0.4, 0)}
            className="w-10 h-10 bg-slate-800 active:bg-pink-600 text-white font-bold text-xs rounded-sm flex items-center justify-center cursor-pointer"
          >
            ▶
          </button>
          <div />
          <button
            onClick={() => handleMoveClaw(0, 0.4)}
            className="w-10 h-10 bg-slate-800 active:bg-pink-600 text-white font-bold text-xs rounded-sm flex items-center justify-center cursor-pointer"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Drop Grab Button */}
        <button
          onClick={handleDropClaw}
          disabled={isClawBusy || tokens <= 0}
          className={`flex-1 py-6 font-black text-base uppercase rounded-sm border shadow-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            isClawBusy
              ? 'bg-slate-800 text-slate-500 border-slate-700'
              : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 active:scale-95 text-white border-pink-300'
          }`}
        >
          <Gift size={24} />
          <span>{isKo ? '집게 하강 (GRAB)' : 'DROP CLAW'}</span>
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest">
              {isKo ? '🏆 피규어 5종 수집 완료!' : '🏆 5 FIGURES COLLECTED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '수집한 피규어' : 'Collected Toys'}</span>
                <span className="font-bold text-amber-300">{collectedCount} / {targetToys}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                <span>{isKo ? '획득 SNS 보상' : 'Earned SNS'}</span>
                <span>+{rewardSns} SNS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all"
              >
                {isKo ? '보상 수령 및 복귀' : 'Claim & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

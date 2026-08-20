import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award, Crosshair } from 'lucide-react';
import { CardData } from '../types';

interface VoxelQuantumPortalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelQuantumPortalGame: React.FC<VoxelQuantumPortalGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [bluePortalActive, setBluePortalActive] = useState<boolean>(false);
  const [orangePortalActive, setOrangePortalActive] = useState<boolean>(false);
  const [puzzlesSolved, setPuzzlesSolved] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posY: 1.6,
    posZ: 10,
    rotY: 0,
    bluePortal: null as THREE.Vector3 | null,
    orangePortal: null as THREE.Vector3 | null,
    puzzlesSolved: 0,
    keys: { w: false, s: false, a: false, d: false },
    isGameOver: false,
    isVictory: false
  });

  const shootPortal = (type: 'blue' | 'orange') => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const targetPos = new THREE.Vector3(
      s.posX + Math.sin(s.rotY) * 20,
      1.5,
      s.posZ - Math.cos(s.rotY) * 20
    );

    if (type === 'blue') {
      s.bluePortal = targetPos;
      setBluePortalActive(true);
    } else {
      s.orangePortal = targetPos;
      setOrangePortalActive(true);
    }

    // If both portals are open, puzzle trigger
    if (s.bluePortal && s.orangePortal) {
      s.puzzlesSolved += 1;
      setPuzzlesSolved(s.puzzlesSolved);

      if (s.puzzlesSolved >= 3) {
        s.isVictory = true;
        setIsVictory(true);
        const reward = 55 + s.puzzlesSolved * 5;
        setRewardSns(reward);
        onReward(reward);
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    // Chamber Room
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    // Quantum Cube
    const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const cubeMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x004488 });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(0, 0.75, 0);
    scene.add(cube);

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === 'q' || k === 'j') shootPortal('blue');
      if (k === 'e' || k === 'k') shootPortal('orange');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        if (s.keys.a) s.rotY += 2.0 * dt;
        if (s.keys.d) s.rotY -= 2.0 * dt;

        const forward = (s.keys.w ? 1 : 0) - (s.keys.s ? 1 : 0);
        s.posX += Math.sin(s.rotY) * forward * 12 * dt;
        s.posZ -= Math.cos(s.rotY) * forward * 12 * dt;

        camera.position.set(s.posX, 1.8, s.posZ);
        camera.rotation.y = s.rotY;

        cube.rotation.y += dt;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white select-none overflow-hidden flex flex-col font-sans">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Top HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Portal Status */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className={`text-xs font-bold ${bluePortalActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            🔵 블루 포탈
          </div>

          <div className={`text-xs font-bold ${orangePortalActive ? 'text-amber-400' : 'text-slate-500'}`}>
            🟠 오렌지 포탈
          </div>

          <div className="bg-indigo-950 border border-indigo-500/40 px-2 py-0.5 rounded text-indigo-300 text-xs font-bold">
            해결: {puzzlesSolved}/3
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <button
            onPointerDown={() => (gameStateRef.current.keys.w = true)}
            onPointerUp={() => (gameStateRef.current.keys.w = false)}
            className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
          >
            ▲
          </button>
          <div className="flex gap-1">
            <button
              onPointerDown={() => (gameStateRef.current.keys.a = true)}
              onPointerUp={() => (gameStateRef.current.keys.a = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ◀
            </button>
            <button
              onPointerDown={() => (gameStateRef.current.keys.s = true)}
              onPointerUp={() => (gameStateRef.current.keys.s = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ▼
            </button>
            <button
              onPointerDown={() => (gameStateRef.current.keys.d = true)}
              onPointerUp={() => (gameStateRef.current.keys.d = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={() => shootPortal('blue')}
            className="w-16 h-16 bg-cyan-600/90 text-white rounded-2xl border-2 border-cyan-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl"
          >
            <span>블루 포탈 [Q]</span>
          </button>
          <button
            onClick={() => shootPortal('orange')}
            className="w-16 h-16 bg-amber-600/90 text-white rounded-2xl border-2 border-amber-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl"
          >
            <span>오렌지 [E]</span>
          </button>
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '시공간 탈출 성공! VICTORY' : '실험 실패! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '퀀텀 포탈을 완벽히 활용하여 모든 물리학 퍼즐을 돌파했습니다!'
                : '시공간 루프에 갇혔습니다.'}
            </p>

            {isVictory && (
              <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-2xl">
                <span className="text-xs text-slate-400 block uppercase font-bold">REWARD</span>
                <span className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
                  <Sparkles size={20} /> +{rewardSns} SNS
                </span>
              </div>
            )}

            <button
              onClick={onExit}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              {language === 'ko' ? '확인 및 나가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award, Hammer, Cog } from 'lucide-react';
import { CardData } from '../types';

interface VoxelFactoryCraftGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelFactoryCraftGame: React.FC<VoxelFactoryCraftGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [iron, setIron] = useState<number>(10);
  const [belts, setBelts] = useState<number>(0);
  const [chipsProduced, setChipsProduced] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    iron: 10,
    belts: 0,
    chipsProduced: 0,
    machines: [] as { type: string; x: number; z: number }[],
    isGameOver: false,
    isVictory: false
  });

  const buildConveyorBelt = (scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.iron < 2 || s.isGameOver || s.isVictory) return;
    s.iron -= 2;
    s.belts += 1;
    setIron(s.iron);
    setBelts(s.belts);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Add Belt Mesh
    const bGeo = new THREE.BoxGeometry(2, 0.2, 2);
    const bMat = new THREE.MeshLambertMaterial({ color: 0x333344 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set((s.belts - 3) * 2.2, 0.1, 0);
    scene.add(bMesh);

    if (s.belts >= 6) {
      s.isVictory = true;
      setIsVictory(true);
      const reward = 60 + s.belts * 5;
      setRewardSns(reward);
      onReward(reward);
    }
  };

  const manualMineOre = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory) return;
    s.iron += 3;
    setIron(s.iron);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(0, 16, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Factory Floor Grid
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    // Core Assembler Machine
    const asmGeo = new THREE.BoxGeometry(3, 2.5, 3);
    const asmMat = new THREE.MeshLambertMaterial({ color: 0x3182ce });
    const asm = new THREE.Mesh(asmGeo, asmMat);
    asm.position.set(0, 1.25, -6);
    scene.add(asm);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        // Auto produce chips if belts exist
        if (s.belts > 0) {
          s.chipsProduced += s.belts * 2 * dt;
          setChipsProduced(Math.floor(s.chipsProduced));
        }
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

        {/* Resources & Belts */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="text-cyan-400 font-bold text-xs">
            ⛏️ 철광석: {iron}
          </div>

          <div className="text-yellow-400 font-bold text-xs">
            ⚙️ 컨베이어 벨트: {belts}/6
          </div>

          <div className="text-emerald-400 font-bold text-xs">
            💾 칩셋 생산량: {chipsProduced}개
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-3 pointer-events-auto">
        <button
          onClick={manualMineOre}
          className="w-32 h-16 bg-slate-800/90 hover:bg-slate-700 text-white rounded-2xl border border-slate-600 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl"
        >
          <Hammer size={18} />
          <span>철광석 채굴 (+3)</span>
        </button>

        <button
          onClick={() => {
            const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
            if (scene) buildConveyorBelt(scene);
          }}
          disabled={iron < 2}
          className={`w-36 h-16 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl ${iron >= 2 ? 'bg-cyan-600/90 border-cyan-400 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-500'}`}
        >
          <Cog size={18} />
          <span>벨트 설치 (2철광석)</span>
        </button>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '자동화 공장 완성! VICTORY' : '공장 중단! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '완벽한 컨베이어 벨트 라인을 구축하여 대량 생산 시스템을 완성했습니다!'
                : '공장 생산 라인이 중단되었습니다.'}
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

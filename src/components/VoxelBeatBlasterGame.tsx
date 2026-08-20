import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award, Music } from 'lucide-react';
import { CardData } from '../types';

interface VoxelBeatBlasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelBeatBlasterGame: React.FC<VoxelBeatBlasterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    score: 0,
    combo: 0,
    cubes: [] as { mesh: THREE.Mesh; lane: number; z: number; hit: boolean }[],
    spawnTimer: 0,
    isGameOver: false,
    isVictory: false
  });

  const hitLane = (lane: number, scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory) return;

    let hitSuccess = false;
    for (let i = 0; i < s.cubes.length; i++) {
      const c = s.cubes[i];
      if (c.lane === lane && !c.hit && Math.abs(c.z - 2) < 3.5) {
        c.hit = true;
        hitSuccess = true;
        scene.remove(c.mesh);
        s.cubes.splice(i, 1);
        s.combo += 1;
        s.score += 100 * Math.min(4, Math.floor(s.combo / 5) + 1);
        setCombo(s.combo);
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

        if (s.score >= 3000) {
          s.isVictory = true;
          setIsVictory(true);
          const reward = 50 + Math.floor(s.score / 200);
          setRewardSns(reward);
          onReward(reward);
        }
        break;
      }
    }

    if (!hitSuccess) {
      s.combo = 0;
      setCombo(0);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050014);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 1, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xff00ff, 0.8);
    scene.add(ambient);

    // 4 Neon Rails
    const lanes = [-4.5, -1.5, 1.5, 4.5];
    const railMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    lanes.forEach(x => {
      const railGeo = new THREE.BoxGeometry(0.2, 0.1, 100);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, 0, -30);
      scene.add(rail);
    });

    // Hit line
    const hitLineGeo = new THREE.BoxGeometry(12, 0.2, 0.5);
    const hitLineMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const hitLine = new THREE.Mesh(hitLineGeo, hitLineMat);
    hitLine.position.set(0, 0.1, 2);
    scene.add(hitLine);

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'd') hitLane(0, scene);
      if (k === 'f') hitLane(1, scene);
      if (k === 'j') hitLane(2, scene);
      if (k === 'k') hitLane(3, scene);
    };

    window.addEventListener('keydown', handleKeyDown);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        // Spawn Beat Cubes
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          s.spawnTimer = 0.45;
          const laneIdx = Math.floor(Math.random() * 4);
          const laneX = lanes[laneIdx];
          const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
          const cubeMat = new THREE.MeshPhongMaterial({ color: 0xff00ff, emissive: 0x550055 });
          const cube = new THREE.Mesh(cubeGeo, cubeMat);
          cube.position.set(laneX, 0.8, -70);
          scene.add(cube);

          s.cubes.push({ mesh: cube, lane: laneIdx, z: -70, hit: false });
        }

        // Update Cubes
        for (let i = s.cubes.length - 1; i >= 0; i--) {
          const c = s.cubes[i];
          c.z += 26 * dt;
          c.mesh.position.z = c.z;

          if (c.z > 8) {
            scene.remove(c.mesh);
            s.cubes.splice(i, 1);
            s.combo = 0;
            setCombo(0);
          }
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
      window.removeEventListener('keydown', handleKeyDown);
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

        {/* Score & Combo */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="text-yellow-400 font-black font-mono text-sm">
            🎵 SCORE: {score}/3000
          </div>

          <div className="text-cyan-400 font-bold text-xs">
            🔥 COMBO: {combo}
          </div>
        </div>
      </div>

      {/* 4 Touch Lane Buttons */}
      <div className="absolute bottom-6 left-4 right-4 z-20 grid grid-cols-4 gap-2 pointer-events-auto">
        {['D', 'F', 'J', 'K'].map((key, idx) => (
          <button
            key={key}
            onClick={() => {
              const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
              if (scene) hitLane(idx, scene);
            }}
            className="h-20 bg-gradient-to-t from-fuchsia-900/90 to-cyan-900/90 text-white rounded-2xl border-2 border-cyan-400 font-black text-xl flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl"
          >
            <span>{key}</span>
            <span className="text-[10px] text-cyan-300 font-normal">LANE {idx + 1}</span>
          </button>
        ))}
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '비트 마스터 VICTORY' : '미션 실패! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '완벽한 리듬 감각으로 네온 레일을 지배하고 최고 점수를 달성했습니다!'
                : '곡 연주가 중단되었습니다.'}
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

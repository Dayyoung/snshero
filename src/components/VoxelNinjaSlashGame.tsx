import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Swords, Eye, Zap } from 'lucide-react';
import { CardData } from '../types';

interface VoxelNinjaSlashGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelNinjaSlashGame: React.FC<VoxelNinjaSlashGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [slashedCount, setSlashedCount] = useState<number>(0);
  const [bulletTime, setBulletTime] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    ninjaPos: new THREE.Vector3(0, 0.8, 14),
    targets: [] as { mesh: THREE.Mesh; x: number; z: number; isGuarding: boolean }[],
    isSlashing: false,
    bulletTime: false,
    bulletTimeTimer: 0,
    slashedCount: 0,
    isGameOver: false
  });

  const performSlash = (dirX: number) => {
    const s = stateRef.current;
    if (s.isSlashing || s.isGameOver) return;
    s.isSlashing = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Dash forward & slash
    s.ninjaPos.z -= 5;
    s.ninjaPos.x += dirX * 4;

    // Check hit
    for (let i = s.targets.length - 1; i >= 0; i--) {
      const t = s.targets[i];
      if (s.ninjaPos.distanceTo(t.mesh.position) < 4.0) {
        t.mesh.position.y = -10; // eliminate
        s.targets.splice(i, 1);
        s.slashedCount += 1;
        setSlashedCount(s.slashedCount);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        break;
      }
    }

    setTimeout(() => { s.isSlashing = false; }, 200);

    if (s.targets.length === 0 || s.ninjaPos.z < -20) {
      s.isGameOver = true;
      setIsGameOver(true);
      const reward = 250;
      setRewardSns(reward);
      onReward(reward);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    }
  };

  const triggerBulletTime = () => {
    const s = stateRef.current;
    if (s.bulletTimeTimer > 0) return;
    s.bulletTime = true;
    s.bulletTimeTimer = 60; // 0.3-1s slowdown
    setBulletTime(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060810);
    scene.fog = new THREE.FogExp2(0x060810, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);
    camera.lookAt(0, 1, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xec4899, 1.4);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Bamboo Forest Ground
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 60), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Ninja Player Mesh
    const ninjaGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.0), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    body.position.y = 0.9;
    ninjaGroup.add(body);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 0.3), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    blade.position.set(0.8, 1.0, 0.4);
    ninjaGroup.add(blade);
    scene.add(ninjaGroup);

    // Spawn 6 Enemy Guards
    for (let i = 0; i < 6; i++) {
      const eGroup = new THREE.Group();
      const eb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 1.2), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
      eb.position.y = 1.0;
      eGroup.add(eb);
      const zPos = 8 - i * 6;
      const xPos = (i % 2 === 0 ? 3 : -3);
      eGroup.position.set(xPos, 0, zPos);
      scene.add(eGroup);
      stateRef.current.targets.push({ mesh: eGroup as any, x: xPos, z: zPos, isGuarding: true });
    }

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      if (s.bulletTimeTimer > 0) {
        s.bulletTimeTimer -= 1;
        if (s.bulletTimeTimer <= 0) {
          s.bulletTime = false;
          setBulletTime(false);
        }
      }

      ninjaGroup.position.copy(s.ninjaPos);
      camera.position.set(s.ninjaPos.x * 0.5, 8, s.ninjaPos.z + 10);
      camera.lookAt(s.ninjaPos.clone().add(new THREE.Vector3(0, 1, -4)));

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white text-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-sm border border-slate-700 font-bold"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="text-pink-400 font-black">SLASHED: {slashedCount}/6</span>
          {bulletTime && <span className="text-cyan-300 font-bold animate-pulse">⚡ BULLET TIME (SLOW)</span>}
        </div>

        <button
          onClick={triggerBulletTime}
          className="px-2.5 py-1 bg-cyan-900/80 border border-cyan-400 rounded-sm text-cyan-300 text-[11px] font-bold"
        >
          불릿타임 [0.3s]
        </button>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Slash Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-auto">
        <button
          onClick={() => performSlash(-1)}
          className="w-20 h-16 bg-pink-600 active:bg-pink-500 border border-pink-400 rounded-sm text-white font-black text-xs flex flex-col items-center justify-center shadow-lg"
        >
          <Swords size={20} />
          좌측 베기 ◀
        </button>
        <button
          onClick={() => performSlash(0)}
          className="w-24 h-16 bg-purple-600 active:bg-purple-500 border border-purple-400 rounded-sm text-white font-black text-sm flex flex-col items-center justify-center shadow-lg"
        >
          <Swords size={24} />
          정면 돌진 베기 ▲
        </button>
        <button
          onClick={() => performSlash(1)}
          className="w-20 h-16 bg-pink-600 active:bg-pink-500 border border-pink-400 rounded-sm text-white font-black text-xs flex flex-col items-center justify-center shadow-lg"
        >
          <Swords size={20} />
          우측 베기 ▶
        </button>
      </div>

      {/* Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{slashedCount >= 5 ? (language === 'ko' ? '그림자 암살 성공!' : 'SHADOW ASSASSIN!') : 'SLASH FINISHED'}</h2>
            <div className="bg-slate-950 p-3 rounded-xs border border-amber-400/30 text-amber-300 font-bold text-sm">
              +{rewardSns} SNS 포인트 획득!
            </div>
            <button
              onClick={onExit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-sm border border-amber-300 text-sm"
            >
              {language === 'ko' ? '확인 및 돌아가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

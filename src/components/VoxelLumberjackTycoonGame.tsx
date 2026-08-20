import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Axe, Hammer, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelLumberjackTycoonGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelLumberjackTycoonGame: React.FC<VoxelLumberjackTycoonGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [woodCount, setWoodCount] = useState<number>(0);
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0.5, 10),
    trees: [] as { mesh: THREE.Mesh; hp: number; x: number; z: number }[],
    keys: {} as Record<string, boolean>,
    wood: 0,
    build: 0,
    chopCooldown: 0,
    isGameOver: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 16, 22);
    camera.lookAt(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Forest Island
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x14532d }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Build Site (Bridge / Cabin)
    const siteMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    siteMesh.position.set(0, 0.2, -12);
    scene.add(siteMesh);

    // Player Lumberjack
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), new THREE.MeshLambertMaterial({ color: 0xd97706 }));
    pBody.position.y = 0.9;
    playerGroup.add(pBody);
    const axe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.6), new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
    axe.position.set(0.8, 1.0, 0.4);
    playerGroup.add(axe);
    scene.add(playerGroup);

    // Spawn 8 Voxel Trees
    for (let i = 0; i < 8; i++) {
      const tGroup = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 3), new THREE.MeshLambertMaterial({ color: 0x713f12 }));
      trunk.position.y = 1.5;
      tGroup.add(trunk);
      const leaves = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), new THREE.MeshLambertMaterial({ color: 0x22c55e }));
      leaves.position.y = 3.8;
      tGroup.add(leaves);

      const x = (Math.random() - 0.5) * 28;
      const z = (Math.random() - 0.5) * 16 + 2;
      tGroup.position.set(x, 0, z);
      scene.add(tGroup);
      stateRef.current.trees.push({ mesh: tGroup as any, hp: 30, x, z });
    }

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Movement
      const isUp = s.keys['w'] || s.keys['arrowup'];
      const isDown = s.keys['s'] || s.keys['arrowdown'];
      const isLeft = s.keys['a'] || s.keys['arrowleft'];
      const isRight = s.keys['d'] || s.keys['arrowright'];

      const spd = 0.16;
      if (isUp) s.pPos.z -= spd;
      if (isDown) s.pPos.z += spd;
      if (isLeft) s.pPos.x -= spd;
      if (isRight) s.pPos.x += spd;

      s.pPos.x = Math.max(-18, Math.min(18, s.pPos.x));
      s.pPos.z = Math.max(-18, Math.min(18, s.pPos.z));
      playerGroup.position.copy(s.pPos);

      // Auto-Chop Trees in proximity
      s.chopCooldown -= 1;
      if (s.chopCooldown <= 0) {
        for (let i = s.trees.length - 1; i >= 0; i--) {
          const t = s.trees[i];
          if (s.pPos.distanceTo(t.mesh.position) < 2.5) {
            s.chopCooldown = 15;
            t.hp -= 10;
            axe.rotation.x = -1.0;
            setTimeout(() => { axe.rotation.x = 0; }, 150);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

            if (t.hp <= 0) {
              scene.remove(t.mesh);
              s.trees.splice(i, 1);
              s.wood += 5;
              setWoodCount(s.wood);
            }
            break;
          }
        }
      }

      // Auto-Deposit Wood at site
      if (s.pPos.distanceTo(siteMesh.position) < 3.5 && s.wood > 0) {
        s.build += s.wood * 10;
        s.wood = 0;
        setWoodCount(0);
        setBuildProgress(Math.min(100, s.build));
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

        if (s.build >= 100) {
          s.isGameOver = true;
          setIsGameOver(true);
          const reward = 250;
          setRewardSns(reward);
          onReward(reward);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        }
      }

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

        <div className="flex items-center gap-4 font-black">
          <span className="text-amber-400">🪵 보유 통나무: {woodCount}개</span>
          <span className="text-emerald-400">🏗️ 건설 진행도: {buildProgress}%</span>
        </div>

        <div className="text-slate-400 text-[11px]">[나무에 다가가면 자동 벌목]</div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* D-Pad Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-auto">
        <button
          onPointerDown={() => { stateRef.current.keys['a'] = true; }}
          onPointerUp={() => { stateRef.current.keys['a'] = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-amber-600 border border-amber-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ◀
        </button>
        <button
          onPointerDown={() => { stateRef.current.keys['w'] = true; }}
          onPointerUp={() => { stateRef.current.keys['w'] = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-amber-600 border border-amber-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▲
        </button>
        <button
          onPointerDown={() => { stateRef.current.keys['s'] = true; }}
          onPointerUp={() => { stateRef.current.keys['s'] = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-amber-600 border border-amber-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▼
        </button>
        <button
          onPointerDown={() => { stateRef.current.keys['d'] = true; }}
          onPointerUp={() => { stateRef.current.keys['d'] = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-amber-600 border border-amber-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▶
        </button>
      </div>

      {/* Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{language === 'ko' ? '기지 건설 완료!' : 'BASE BUILT!'}</h2>
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

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Zap, Sparkles, ArrowLeft, Trophy, Crosshair, Award } from 'lucide-react';
import { CardData } from '../types';

interface VoxelRaftSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelRaftSurvivalGame: React.FC<VoxelRaftSurvivalGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [planks, setPlanks] = useState<number>(0);
  const [raftSize, setRaftSize] = useState<number>(4);
  const [sharkHp, setSharkHp] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    planks: 0,
    raftSize: 4,
    sharkHp: 100,
    isHookFlying: false,
    hookPos: new THREE.Vector3(),
    hookVelocity: new THREE.Vector3(),
    debrisList: [] as { mesh: THREE.Mesh; x: number; z: number; collected: boolean }[],
    shark: null as THREE.Group | null,
    sharkAngle: 0,
    isGameOver: false,
    isVictory: false
  });

  const throwHook = (scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.isHookFlying || s.isGameOver || s.isVictory) return;
    s.isHookFlying = true;
    s.hookPos.set(0, 1.2, 0);
    s.hookVelocity.set(0, 5, -28);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const expandRaft = (scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.planks < 4 || s.isGameOver || s.isVictory) return;
    s.planks -= 4;
    s.raftSize += 1;
    setPlanks(s.planks);
    setRaftSize(s.raftSize);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Add new raft plank mesh
    const plankGeo = new THREE.BoxGeometry(2, 0.4, 2);
    const plankMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
    scene.add(plank);

    if (s.raftSize >= 10) {
      s.isVictory = true;
      setIsVictory(true);
      const reward = 50 + s.raftSize * 3;
      setRewardSns(reward);
      onReward(reward);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2266aa);
    scene.fog = new THREE.FogExp2(0x2266aa, 0.015);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffeedd, 0.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(40, 80, 40);
    scene.add(sun);

    // Endless Ocean
    const oceanGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshPhongMaterial({ color: 0x005588, transparent: true, opacity: 0.85, flatShading: true });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    scene.add(ocean);

    // Raft Base
    const raftGroup = new THREE.Group();
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z += 2) {
        const plank = new THREE.Mesh(
          new THREE.BoxGeometry(1.9, 0.4, 1.9),
          new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
        );
        plank.position.set(x, 0, z);
        raftGroup.add(plank);
      }
    }
    scene.add(raftGroup);

    // Hook Mesh
    const hookMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.08, 6, 12),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    hookMesh.visible = false;
    scene.add(hookMesh);

    // Shark Mesh
    const sharkGroup = new THREE.Group();
    const sharkBody = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 3.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x334455 })
    );
    sharkBody.rotateX(-Math.PI / 2);
    sharkGroup.add(sharkBody);

    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 4), new THREE.MeshLambertMaterial({ color: 0x223344 }));
    fin.position.set(0, 0.8, 0);
    sharkGroup.add(fin);

    scene.add(sharkGroup);
    gameStateRef.current.shark = sharkGroup;

    // Spawn 15 Floating Debris (Wood / Barrels)
    for (let i = 0; i < 15; i++) {
      const dMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshLambertMaterial({ color: 0xaa7744 })
      );
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 25;
      const dx = Math.sin(angle) * dist;
      const dz = Math.cos(angle) * dist;
      dMesh.position.set(dx, 0.2, dz);
      scene.add(dMesh);

      gameStateRef.current.debrisList.push({
        mesh: dMesh,
        x: dx,
        z: dz,
        collected: false
      });
    }

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();
      const s = gameStateRef.current;

      // Shark circling
      s.sharkAngle += 0.8 * dt;
      const sx = Math.sin(s.sharkAngle) * 16;
      const sz = Math.cos(s.sharkAngle) * 16;
      sharkGroup.position.set(sx, -0.2, sz);
      sharkGroup.rotation.y = s.sharkAngle + Math.PI / 2;

      // Hook flight & reel-in
      if (s.isHookFlying) {
        hookMesh.visible = true;
        s.hookPos.addScaledVector(s.hookVelocity, dt);
        s.hookVelocity.y -= 15 * dt; // gravity
        hookMesh.position.copy(s.hookPos);

        // Check debris collision
        s.debrisList.forEach(d => {
          if (d.collected) return;
          if (s.hookPos.distanceTo(d.mesh.position) < 2.0) {
            d.collected = true;
            scene.remove(d.mesh);
            s.planks += 2;
            setPlanks(s.planks);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          }
        });

        // Shark hit check
        if (s.hookPos.distanceTo(sharkGroup.position) < 3.0) {
          s.sharkHp = Math.max(0, s.sharkHp - 25);
          setSharkHp(s.sharkHp);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }

        if (s.hookPos.y < -0.5 || s.hookPos.distanceTo(new THREE.Vector3(0, 0, 0)) > 35) {
          s.isHookFlying = false;
          hookMesh.visible = false;
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

        {/* Planks & Raft Size */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
            <span>🪵 {planks} 나무판자</span>
          </div>

          <div className="bg-amber-950 border border-amber-500/40 px-2 py-0.5 rounded text-amber-300 text-xs font-bold">
            뗏목 규모: {raftSize}/10
          </div>

          <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
            <span>🦈 상어 체력: {sharkHp}%</span>
          </div>
        </div>
      </div>

      {/* Mobile Action Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-3 pointer-events-auto">
        <button
          onClick={() => {
            const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
            if (scene) expandRaft(scene);
          }}
          disabled={planks < 4}
          className={`w-32 h-16 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 ${planks >= 4 ? 'bg-amber-600/90 border-amber-400 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-500'}`}
        >
          <span>뗏목 확장 (4목재)</span>
        </button>

        <button
          onClick={() => {
            const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
            if (scene) throwHook(scene);
          }}
          className="w-32 h-16 bg-cyan-600/90 text-white rounded-2xl border-2 border-cyan-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl"
        >
          <Crosshair size={22} />
          <span>갈고리 투척 [Space]</span>
        </button>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '해양 요새 완성! VICTORY' : '표류 실패! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '뗏목을 거대한 해상 요새로 확장하고 대해원의 지배자가 되었습니다!'
                : '식인 상어의 공격으로 뗏목이 파괴되었습니다.'}
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

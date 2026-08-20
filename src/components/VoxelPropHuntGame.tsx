import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award, Crosshair, Shield } from 'lucide-react';
import { CardData } from '../types';

interface VoxelPropHuntGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelPropHuntGame: React.FC<VoxelPropHuntGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hunterHp, setHunterHp] = useState<number>(100);
  const [propsFound, setPropsFound] = useState<number>(0);
  const [ammo, setAmmo] = useState<number>(18);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posZ: 0,
    rotY: 0,
    hunterHp: 100,
    propsFound: 0,
    ammo: 18,
    keys: { w: false, s: false, a: false, d: false },
    propsList: [] as { mesh: THREE.Mesh; isRealProp: boolean; found: boolean }[],
    isGameOver: false,
    isVictory: false
  });

  const fireShotgun = (scene: THREE.Scene, camera: THREE.Camera) => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.ammo <= 0) return;
    s.ammo -= 1;
    setAmmo(s.ammo);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Raycast hit check from camera center
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const meshes = s.propsList.filter(p => !p.found).map(p => p.mesh);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const targetProp = s.propsList.find(p => p.mesh === hitMesh);

      if (targetProp) {
        if (targetProp.isRealProp) {
          // Found hiding player prop!
          targetProp.found = true;
          scene.remove(targetProp.mesh);
          s.propsFound += 1;
          setPropsFound(s.propsFound);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

          if (s.propsFound >= 5) {
            s.isVictory = true;
            setIsVictory(true);
            const reward = 55 + s.propsFound * 5;
            setRewardSns(reward);
            onReward(reward);
          }
        } else {
          // Misfire penalty
          s.hunterHp = Math.max(0, s.hunterHp - 15);
          setHunterHp(s.hunterHp);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          if (s.hunterHp <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
          }
        }
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a24);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x778899, 0.9);
    scene.add(ambient);
    const point = new THREE.PointLight(0xffeedd, 1.5, 50);
    point.position.set(0, 10, 0);
    scene.add(point);

    // Room Floor
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    // Spawn Props (Crates, Chairs, Barrels) - 5 fake hiding players + 15 decoys
    const propTypes = [
      { geo: new THREE.BoxGeometry(1.2, 1.2, 1.2), color: 0x8b5a2b }, // Crate
      { geo: new THREE.CylinderGeometry(0.6, 0.6, 1.4, 8), color: 0x555555 }, // Barrel
      { geo: new THREE.BoxGeometry(0.8, 1.6, 0.8), color: 0xcc6633 }  // Chair/Box
    ];

    for (let i = 0; i < 20; i++) {
      const type = propTypes[i % propTypes.length];
      const pMesh = new THREE.Mesh(type.geo, new THREE.MeshLambertMaterial({ color: type.color }));
      const px = (Math.random() - 0.5) * 45;
      const pz = (Math.random() - 0.5) * 45;
      pMesh.position.set(px, 0.7, pz);
      scene.add(pMesh);

      gameStateRef.current.propsList.push({
        mesh: pMesh,
        isRealProp: i < 5, // First 5 are disguise players!
        found: false
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === ' ' || k === 'j') fireShotgun(scene, camera);
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
        if (s.keys.a) s.rotY += 2.2 * dt;
        if (s.keys.d) s.rotY -= 2.2 * dt;

        const forward = (s.keys.w ? 1 : 0) - (s.keys.s ? 1 : 0);
        s.posX += Math.sin(s.rotY) * forward * 14 * dt;
        s.posZ -= Math.cos(s.rotY) * forward * 14 * dt;
        s.posX = Math.max(-28, Math.min(28, s.posX));
        s.posZ = Math.max(-28, Math.min(28, s.posZ));

        // 1st person hunter camera
        camera.position.set(s.posX, 1.8, s.posZ);
        camera.rotation.y = s.rotY;
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

        {/* Hunter HP & Found Count */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1.5">
            <Shield size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">헌터 HP: {hunterHp}%</span>
          </div>

          <div className="text-yellow-400 font-bold text-xs">
            🎯 색출: {propsFound}/5
          </div>

          <div className="text-cyan-400 font-bold text-xs">
            💥 탄약: {ammo}발
          </div>
        </div>
      </div>

      {/* Center Crosshair */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/60 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
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

        <button
          onClick={() => {
            const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
            const camera = (mountRef.current?.children[0] as any)?.__r3f?.camera;
            if (scene && camera) fireShotgun(scene, camera);
          }}
          className="w-20 h-20 bg-rose-600/90 text-white rounded-2xl border-2 border-rose-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl pointer-events-auto"
        >
          <Crosshair size={24} />
          <span>샷건 사격 [Space]</span>
        </button>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '모든 사물 색출 완료! VICTORY' : '사냥 실패! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '숨어있던 모든 프롭 변신자들을 정확히 찾아냈습니다!'
                : '오발 페널티 누적으로 헌터 체력이 소진되었습니다.'}
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

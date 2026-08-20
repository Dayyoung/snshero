import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Zap, Sparkles, ArrowLeft, Trophy, Crosshair, Award } from 'lucide-react';
import { CardData } from '../types';

interface VoxelMonsterIsleGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMonsterIsleGame: React.FC<VoxelMonsterIsleGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cubes, setCubes] = useState<number>(10);
  const [captured, setCaptured] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posZ: 0,
    rotY: 0,
    cubes: 10,
    captured: 0,
    keys: { w: false, s: false, a: false, d: false },
    monsters: [] as { mesh: THREE.Group; x: number; z: number; hp: number; captured: boolean; name: string }[],
    throwCubes: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
    isGameOver: false,
    isVictory: false
  });

  const throwTamingCube = (scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.cubes <= 0) return;
    s.cubes -= 1;
    setCubes(s.cubes);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const cubeGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const cubeMat = new THREE.MeshLambertMaterial({ color: 0x00ccff });
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    cubeMesh.position.set(s.posX, 1.5, s.posZ);
    scene.add(cubeMesh);

    const speed = 25;
    s.throwCubes.push({
      mesh: cubeMesh,
      vx: Math.sin(s.rotY) * speed,
      vy: 8,
      vz: -Math.cos(s.rotY) * speed,
      life: 3.0
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88ccff);
    scene.fog = new THREE.FogExp2(0x88ccff, 0.015);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Island Terrain
    const islandGeo = new THREE.PlaneGeometry(160, 160, 16, 16);
    islandGeo.rotateX(-Math.PI / 2);
    const islandMat = new THREE.MeshLambertMaterial({ color: 0x55aa44 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    scene.add(island);

    // Player Mesh
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), new THREE.MeshLambertMaterial({ color: 0x2244aa }));
    pBody.position.y = 0.9;
    playerGroup.add(pBody);
    scene.add(playerGroup);

    // Spawn 10 Wild Pixel Monsters
    const monsterColors = [0xff4444, 0x44ff44, 0xffff44, 0xaa44ff, 0xff8800];
    for (let i = 0; i < 10; i++) {
      const mGroup = new THREE.Group();
      const mBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshLambertMaterial({ color: monsterColors[i % monsterColors.length] })
      );
      mBody.position.y = 0.8;
      mGroup.add(mBody);

      // Horns / Ears
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 4), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      horn.position.set(0.3, 1.6, 0);
      mGroup.add(horn);

      const mx = (Math.random() - 0.5) * 100;
      const mz = -15 - Math.random() * 80;
      mGroup.position.set(mx, 0, mz);
      scene.add(mGroup);

      gameStateRef.current.monsters.push({
        mesh: mGroup,
        x: mx,
        z: mz,
        hp: 100,
        captured: false,
        name: `Monster #${i + 1}`
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === ' ' || k === 'j') throwTamingCube(scene);
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
        s.posX += Math.sin(s.rotY) * forward * 14 * dt;
        s.posZ -= Math.cos(s.rotY) * forward * 14 * dt;

        playerGroup.position.set(s.posX, 0, s.posZ);
        playerGroup.rotation.y = s.rotY;

        camera.position.set(s.posX - Math.sin(s.rotY) * 8, 5, s.posZ + Math.cos(s.rotY) * 8);
        camera.lookAt(s.posX, 1.5, s.posZ);

        // Update Throw Cubes
        for (let i = s.throwCubes.length - 1; i >= 0; i--) {
          const c = s.throwCubes[i];
          c.mesh.position.x += c.vx * dt;
          c.mesh.position.y += c.vy * dt;
          c.mesh.position.z += c.vz * dt;
          c.vy -= 18 * dt; // gravity
          c.life -= dt;

          let hit = false;
          s.monsters.forEach(m => {
            if (m.captured || hit) return;
            const dist = c.mesh.position.distanceTo(m.mesh.position);
            if (dist < 2.5) {
              hit = true;
              m.captured = true;
              scene.remove(m.mesh);
              s.captured += 1;
              setCaptured(s.captured);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

              if (s.captured >= 6) {
                s.isVictory = true;
                setIsVictory(true);
                const reward = 50 + s.captured * 5;
                setRewardSns(reward);
                onReward(reward);
              }
            }
          });

          if (hit || c.mesh.position.y < 0 || c.life <= 0) {
            scene.remove(c.mesh);
            s.throwCubes.splice(i, 1);
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

        {/* Cubes & Captured Stats */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold">
            <Zap size={14} />
            <span>{cubes} 테이밍 큐브</span>
          </div>

          <div className="bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 rounded text-emerald-300 text-xs font-bold">
            포획: {captured}/6
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

        <button
          onClick={() => {
            const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
            if (scene) throwTamingCube(scene);
          }}
          className="w-20 h-20 bg-cyan-600/90 text-white rounded-2xl border-2 border-cyan-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 pointer-events-auto"
        >
          <Crosshair size={24} />
          <span>큐브 투척 [Space]</span>
        </button>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '테이머즈 마스터 VICTORY' : '큐브 소진! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '섬의 야생 몬스터들을 성공적으로 포획하여 최강의 덱을 구축했습니다!'
                : '모든 테이밍 큐브가 소진되었습니다.'}
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

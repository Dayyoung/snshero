import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award } from 'lucide-react';
import { CardData } from '../types';

interface VoxelRollingHeroGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelRollingHeroGame: React.FC<VoxelRollingHeroGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posY: 1,
    posZ: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    stars: 0,
    keys: { a: false, d: false, w: false, s: false, space: false },
    starList: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; collected: boolean }[],
    isGameOver: false,
    isVictory: false
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(20, 50, 20);
    scene.add(sun);

    // Track Track Path (1000m)
    const trackGeo = new THREE.BoxGeometry(10, 1, 600);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0x44aa88 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, -0.5, -280);
    scene.add(track);

    // Rolling Ball Sphere
    const ballGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const ballMat = new THREE.MeshPhongMaterial({ color: 0xff3366, shininess: 80 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 1.2, 0);
    scene.add(ball);

    // Spawn 20 Stars along track
    const starGeo = new THREE.OctahedronGeometry(0.8, 0);
    const starMat = new THREE.MeshPhongMaterial({ color: 0xffdd00, emissive: 0x886600 });
    for (let i = 0; i < 20; i++) {
      const sMesh = new THREE.Mesh(starGeo, starMat);
      const sz = -i * 28 - 20;
      const sx = (Math.random() - 0.5) * 6;
      sMesh.position.set(sx, 1.5, sz);
      scene.add(sMesh);
      gameStateRef.current.starList.push({ mesh: sMesh, x: sx, y: 1.5, z: sz, collected: false });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === ' ') {
        const s = gameStateRef.current;
        if (s.posY <= 1.3) {
          s.vy = 14;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        // Torque & Accelerations
        if (s.keys.a) s.vx -= 25 * dt;
        if (s.keys.d) s.vx += 25 * dt;
        if (s.keys.w) s.vz -= 30 * dt;
        if (s.keys.s) s.vz += 20 * dt;

        s.vx *= 0.95;
        s.vz *= 0.98;
        s.vy -= 30 * dt;

        s.posX += s.vx * dt;
        s.posZ += s.vz * dt;
        s.posY += s.vy * dt;

        if (s.posY <= 1.2 && Math.abs(s.posX) < 5 && s.posZ <= 10 && s.posZ >= -570) {
          s.posY = 1.2;
          s.vy = 0;
        }

        // Fall off track
        if (s.posY < -10) {
          s.isGameOver = true;
          setIsGameOver(true);
        }

        ball.position.set(s.posX, s.posY, s.posZ);
        ball.rotation.x += s.vz * dt * 0.5;
        ball.rotation.z -= s.vx * dt * 0.5;

        setDistance(Math.min(500, Math.floor(-s.posZ)));

        camera.position.set(s.posX, s.posY + 6, s.posZ + 12);
        camera.lookAt(s.posX, s.posY, s.posZ);

        // Collect stars
        s.starList.forEach(st => {
          if (st.collected) return;
          st.mesh.rotation.y = time * 3;
          if (ball.position.distanceTo(st.mesh.position) < 2.0) {
            st.collected = true;
            scene.remove(st.mesh);
            s.stars += 1;
            setStars(s.stars);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }
        });

        if (-s.posZ >= 550) {
          s.isVictory = true;
          setIsVictory(true);
          const reward = 50 + s.stars * 3;
          setRewardSns(reward);
          onReward(reward);
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

        {/* Distance & Stars */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="text-yellow-400 font-bold text-xs">
            ⭐ {stars}/20 별
          </div>

          <div className="text-cyan-400 font-bold text-xs">
            🏁 {distance}m / 500m
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
            const s = gameStateRef.current;
            if (s.posY <= 1.3) {
              s.vy = 14;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }
          }}
          className="w-20 h-20 bg-rose-600/90 text-white rounded-2xl border-2 border-rose-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl pointer-events-auto"
        >
          <Award size={24} />
          <span>점프 [Space]</span>
        </button>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '골인 완주! VICTORY' : '낙하 탈락! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '위험천만한 롤링 트랙을 완주하고 정상에 도달했습니다!'
                : '발판을 벗어나 추락했습니다.'}
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

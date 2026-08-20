import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Zap, Sparkles, Navigation, Bomb } from 'lucide-react';
import { CardData } from '../types';

interface VoxelMicroKartGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMicroKartGame: React.FC<VoxelMicroKartGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [currentLap, setCurrentLap] = useState<number>(1);
  const totalLaps = 3;
  const [speed, setSpeed] = useState<number>(0);
  const [turboGauge, setTurboGauge] = useState<number>(100);
  const [items, setItems] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    kartPos: new THREE.Vector3(0, 0.3, 0),
    kartRot: 0,
    speed: 0,
    maxSpeed: 0.65,
    steer: 0,
    turbo: 100,
    isTurbo: false,
    lap: 1,
    checkpointsPassed: 0,
    items: 3,
    isGameOver: false
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a7d44);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 16, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x445544, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 25, 10);
    scene.add(dirLight);

    // Oval Race Track
    const trackGeo = new THREE.TorusGeometry(12, 3.2, 16, 64);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = Math.PI / 2;
    track.position.y = 0.05;
    scene.add(track);

    // Start/Finish Line
    const lineGeo = new THREE.PlaneGeometry(6.4, 1.2);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(12, 0.06, 0);
    scene.add(line);

    // Voxel Micro Kart
    const kartGroup = new THREE.Group();
    const kBodyGeo = new THREE.BoxGeometry(0.9, 0.4, 1.4);
    const kBodyMat = new THREE.MeshStandardMaterial({ color: 0xe63946 });
    const kBody = new THREE.Mesh(kBodyGeo, kBodyMat);
    kBody.position.y = 0.25;

    // Kart Wheels
    const wGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const w1 = new THREE.Mesh(wGeo, wMat);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(-0.5, 0.2, 0.5);
    const w2 = new THREE.Mesh(wGeo, wMat);
    w2.rotation.z = Math.PI / 2;
    w2.position.set(0.5, 0.2, 0.5);
    const w3 = new THREE.Mesh(wGeo, wMat);
    w3.rotation.z = Math.PI / 2;
    w3.position.set(-0.5, 0.2, -0.5);
    const w4 = new THREE.Mesh(wGeo, wMat);
    w4.rotation.z = Math.PI / 2;
    w4.position.set(0.5, 0.2, -0.5);

    kartGroup.add(kBody, w1, w2, w3, w4);
    kartGroup.position.set(12, 0.1, 0);
    scene.add(kartGroup);

    // AI Rival Karts
    const rivals: { mesh: THREE.Group; angle: number; speed: number }[] = [];
    const colors = [0x457b9d, 0x2a9d8f, 0xf4a261];
    for (let i = 0; i < 3; i++) {
      const rGroup = new THREE.Group();
      const rBody = new THREE.Mesh(kBodyGeo, new THREE.MeshStandardMaterial({ color: colors[i] }));
      rBody.position.y = 0.25;
      rGroup.add(rBody);
      scene.add(rGroup);
      rivals.push({ mesh: rGroup, angle: 0.3 * (i + 1), speed: 0.02 + i * 0.003 });
    }

    let trackAngle = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!stateRef.current.isGameOver) {
        // Accelerate
        const max = stateRef.current.isTurbo ? 0.9 : stateRef.current.maxSpeed;
        stateRef.current.speed = THREE.MathUtils.lerp(stateRef.current.speed, max, 0.05);

        // Turn angle
        trackAngle += (stateRef.current.speed * 0.035);
        stateRef.current.kartRot += stateRef.current.steer * 0.04;

        // Kart position on track oval
        const r = 12;
        const x = Math.cos(trackAngle) * r;
        const z = Math.sin(trackAngle) * r;
        kartGroup.position.set(x, 0.2, z);
        kartGroup.rotation.y = -trackAngle + Math.PI / 2 + stateRef.current.steer * 0.4;

        // Camera follow
        camera.position.x = x + Math.sin(trackAngle) * 6;
        camera.position.z = z - Math.cos(trackAngle) * 6 + 4;
        camera.position.y = 9;
        camera.lookAt(x, 0.5, z);

        // Check Lap completion
        if (trackAngle >= Math.PI * 2) {
          trackAngle -= Math.PI * 2;
          stateRef.current.lap += 1;
          if (stateRef.current.lap > totalLaps) {
            stateRef.current.isGameOver = true;
            setIsGameOver(true);
            const reward = 260;
            setRewardSns(reward);
            onReward(reward);
          } else {
            setCurrentLap(stateRef.current.lap);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          }
        }

        // Move Rival Karts
        rivals.forEach((riv) => {
          riv.angle += riv.speed;
          riv.mesh.position.set(Math.cos(riv.angle) * 12, 0.2, Math.sin(riv.angle) * 12);
          riv.mesh.rotation.y = -riv.angle + Math.PI / 2;
        });

        // Turbo recovery
        if (stateRef.current.isTurbo) {
          stateRef.current.turbo = Math.max(0, stateRef.current.turbo - 1.5);
          if (stateRef.current.turbo <= 0) stateRef.current.isTurbo = false;
        } else {
          stateRef.current.turbo = Math.min(100, stateRef.current.turbo + 0.3);
        }
        setTurboGauge(Math.floor(stateRef.current.turbo));
        setSpeed(Math.floor(stateRef.current.speed * 160));
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
  }, [lowSpecMode, totalLaps, onReward, playSfx]);

  const handleTurbo = () => {
    if (stateRef.current.turbo > 30) {
      stateRef.current.isTurbo = true;
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handleUseItem = () => {
    if (stateRef.current.items > 0) {
      stateRef.current.items -= 1;
      setItems(stateRef.current.items);
      handleTurbo();
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    }
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

        <div className="flex items-center gap-2 bg-slate-900/90 border border-red-500/40 px-3 py-1.5 rounded-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs text-amber-300 font-bold">
            {isKo ? `랩: ${currentLap}/${totalLaps}` : `LAP: ${currentLap}/${totalLaps}`}
          </span>
          <span className="text-[10px] text-cyan-300">
            {speed} KM/H
          </span>
        </div>
      </div>

      {/* Mobile Controls: Left Steer / Right Steer / Turbo / Item */}
      <div className="absolute bottom-6 left-3 right-3 flex flex-col gap-2 z-10">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] text-amber-300 font-bold">TURBO BOOST</span>
          <span className="text-[10px] text-slate-400">{turboGauge}%</span>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-amber-900 mb-1">
          <div className="h-full bg-amber-500 transition-all duration-75" style={{ width: `${turboGauge}%` }} />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onPointerDown={() => { stateRef.current.steer = -1; }}
            onPointerUp={() => { stateRef.current.steer = 0; }}
            className="py-4 bg-slate-900/90 active:bg-blue-600 text-white font-black text-sm uppercase rounded-sm border border-slate-700 flex items-center justify-center cursor-pointer"
          >
            ◀ LEFT
          </button>
          <button
            onPointerDown={() => { stateRef.current.steer = 1; }}
            onPointerUp={() => { stateRef.current.steer = 0; }}
            className="py-4 bg-slate-900/90 active:bg-blue-600 text-white font-black text-sm uppercase rounded-sm border border-slate-700 flex items-center justify-center cursor-pointer"
          >
            RIGHT ▶
          </button>
          <button
            onClick={handleTurbo}
            className="py-4 bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-black text-xs uppercase rounded-sm border border-amber-300 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Zap size={16} />
            <span>TURBO</span>
          </button>
          <button
            onClick={handleUseItem}
            className="py-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase rounded-sm border border-red-300 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Bomb size={16} />
            <span>x{items}</span>
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest">
              {isKo ? '🏆 그랑프리 3랩 완주!' : '🏆 GRAND PRIX CLEARED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '최종 순위' : 'Final Rank'}</span>
                <span className="font-bold text-amber-300">1ST PLACE 🥇</span>
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

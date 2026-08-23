import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Waves, Droplets, Compass } from 'lucide-react';
import { CardData } from '../types';

interface VoxelWaterSlideGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface WaterDrop {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  collected: boolean;
}

export const VoxelWaterSlideGame: React.FC<VoxelWaterSlideGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [speedKmh, setSpeedKmh] = useState<number>(65);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    tubePos: new THREE.Vector3(0, 45, 0),
    tubeAngle: 0,
    steerDir: 0,
    speed: 35,
    distance: 0,
    score: 0,
    isGameOver: false,
    tubeGroup: null as THREE.Group | null,
    waterDrops: [] as WaterDrop[],
    splashes: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0x38bdf8, 40, 120);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 47, -6);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Bright Tropical Summer Sun
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfef08a, 2.0);
    sun.position.set(30, 80, 40);
    sun.castShadow = !lowSpecMode;
    scene.add(sun);

    // Voxel Inflatable Water Tube (Player)
    const tubeGroup = new THREE.Group();

    // Inflatable Torus Ring
    const torusGeo = new THREE.TorusGeometry(0.75, 0.28, 12, 24);
    const torusMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 2;
    tubeGroup.add(torus);

    // Voxel Rider Body
    const riderGeo = new THREE.BoxGeometry(0.55, 0.65, 0.55);
    const riderMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const rider = new THREE.Mesh(riderGeo, riderMat);
    rider.position.y = 0.45;
    tubeGroup.add(rider);

    tubeGroup.position.set(0, 45, 0);
    scene.add(tubeGroup);
    stateRef.current.tubeGroup = tubeGroup;

    // Curved Slide Flume Track Geometry (Descending from Y=45 to Y=0 over 800m)
    const trackLength = 800;
    const slideCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 45, 0),
      new THREE.Vector3(8, 38, 150),
      new THREE.Vector3(-10, 30, 300),
      new THREE.Vector3(12, 22, 450),
      new THREE.Vector3(-8, 14, 600),
      new THREE.Vector3(0, 2, 750),
      new THREE.Vector3(0, 0, 800)
    ]);

    const tubeGeo = new THREE.TubeGeometry(slideCurve, 120, 2.4, 16, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.BackSide
    });
    const slideMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(slideMesh);

    // Water Surface Inside Slide
    const waterGeo = new THREE.TubeGeometry(slideCurve, 120, 2.2, 16, false);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
      side: THREE.BackSide
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    scene.add(waterMesh);

    // Spawn Collectible Water Pearls along the flume
    const waterDrops: WaterDrop[] = [];
    const pearlGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const pearlMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.7 });

    for (let i = 0; i < 40; i++) {
      const u = (i + 1) / 42;
      const pt = slideCurve.getPoint(u);
      const pearl = new THREE.Mesh(pearlGeo, pearlMat);
      pearl.position.set(pt.x + (Math.random() - 0.5) * 1.5, pt.y - 1.2, pt.z);
      scene.add(pearl);
      waterDrops.push({ mesh: pearl, x: pearl.position.x, z: pt.z, collected: false });
    }

    stateRef.current.waterDrops = waterDrops;

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = stateRef.current;
      if (state.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Distance advancement along slide curve
      state.distance += state.speed * dt;
      setDistance(Math.round(state.distance));
      setSpeedKmh(Math.round(state.speed * 2.8));

      const u = Math.min(0.999, state.distance / trackLength);
      const pt = slideCurve.getPoint(u);
      const tangent = slideCurve.getTangent(u);

      // Carving Left/Right Offset
      state.tubeAngle += state.steerDir * 6 * dt;
      state.tubeAngle = Math.max(-1.5, Math.min(1.5, state.tubeAngle));

      state.tubePos.set(pt.x + state.tubeAngle, pt.y - 1.4, pt.z);

      if (state.tubeGroup) {
        state.tubeGroup.position.copy(state.tubePos);
        state.tubeGroup.rotation.y = Math.atan2(tangent.x, tangent.z);
        state.tubeGroup.rotation.z = -state.tubeAngle * 0.4;
      }

      // Collect Pearls
      for (const d of state.waterDrops) {
        if (!d.collected && Math.abs(state.tubePos.z - d.z) < 2.5 && Math.abs(state.tubePos.x - d.x) < 1.2) {
          d.collected = true;
          scene.remove(d.mesh);
          state.score += 250;
          setScore(state.score);
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        }
      }

      // Check Splashdown at bottom of slide
      if (state.distance >= trackLength - 10) {
        state.isGameOver = true;
        setIsGameOver(true);
        const reward = Math.min(260, Math.floor(state.score / 45) + 60);
        setRewardSns(reward);
        onReward(reward);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
      }

      // Dynamic Camera
      camera.position.set(state.tubePos.x * 0.7, state.tubePos.y + 2.8, state.tubePos.z - 5.5);
      camera.lookAt(state.tubePos.x, state.tubePos.y, state.tubePos.z + 12);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.steerDir = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.steerDir = 1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Shift') stateRef.current.speed = 52;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && stateRef.current.steerDir === -1) stateRef.current.steerDir = 0;
      if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && stateRef.current.steerDir === 1) stateRef.current.steerDir = 0;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Shift') stateRef.current.speed = 35;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-sky-950 flex flex-col items-center select-none overflow-hidden font-mono">
      {/* 3D Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Header HUD */}
      <div className="relative z-10 w-full max-w-xl p-3 flex items-center justify-between pointer-events-auto bg-slate-900/85 backdrop-blur-sm border-b border-cyan-500/40">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-400 text-xs font-bold rounded-sm border border-cyan-500/40"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy size={14} />
            <span>{score.toLocaleString()}P</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-300">
            <Waves size={14} />
            <span>{distance}m / 800m</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <Zap size={14} />
            <span>{speedKmh} KM/H</span>
          </div>
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 10) {
                moved = true;
                stateRef.current.steerDir = dx > 0 ? 1 : -1;
              }
              if (dy < -20) {
                stateRef.current.speed = 52;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.steerDir = 0;
              stateRef.current.speed = 35;

              if (!moved) {
                // Tap: Temporary Turbo Boost
                stateRef.current.speed = 52;
                setTimeout(() => { stateRef.current.speed = 35; }, 1000);
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            stateRef.current.speed = 55;
            setTimeout(() => { stateRef.current.speed = 35; }, 1500);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-cyan-400/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 슬라이드 조향 | 탭/더블탭/위로: 워터젯 부스트 (버튼 없음)' : 'Drag L/R: Steer | Tap/Double Tap/Up: Turbo Boost (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-cyan-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '워터 슬라이드 완주!' : 'SPLASHDOWN FINISH!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '질주 거리' : 'Total Distance'}</span>
                <span className="text-cyan-400 font-bold">{distance}m</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 획득 점수' : 'Final Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상 포인트' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-slate-950 font-black text-sm rounded-sm tracking-wider shadow-lg"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

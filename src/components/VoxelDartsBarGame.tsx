import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Target, Sparkles, Volume2, VolumeX, Eye } from 'lucide-react';
import { CardData } from '../types';

interface VoxelDartsBarGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDartsBarGame: React.FC<VoxelDartsBarGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds] = useState<number>(8);
  const [dartsLeft, setDartsLeft] = useState<number>(3);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [lastScoreText, setLastScoreText] = useState<string>('');
  const [combo, setCombo] = useState<number>(0);
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const stateRef = useRef({
    aimX: 0,
    aimY: 0,
    swayTime: 0,
    isThrowing: false,
    dartPos: new THREE.Vector3(0, 1.6, 2.5),
    dartVel: new THREE.Vector3(0, 0, 0),
    isDartFlying: false,
    activeDartMesh: null as THREE.Group | null,
    stuckDarts: [] as THREE.Group[],
    totalScore: 0,
    round: 1,
    dartsInRound: 3,
    combo: 0,
    isGameOver: false,
    zoomLevel: 1.0,
    targetZoom: 1.0
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120d18);
    scene.fog = new THREE.Fog(0x120d18, 5, 20);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
    camera.position.set(0, 1.65, 3.2);
    camera.lookAt(0, 1.73, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Pub Atmosphere Lighting
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.6);
    scene.add(ambientLight);

    const boardSpot = new THREE.SpotLight(0xfff3cc, 2.5);
    boardSpot.position.set(0, 3.0, 1.5);
    boardSpot.target.position.set(0, 1.73, 0);
    boardSpot.angle = Math.PI / 4;
    boardSpot.penumbra = 0.4;
    boardSpot.castShadow = !lowSpecMode;
    scene.add(boardSpot);
    scene.add(boardSpot.target);

    // Warm Bar Neon Lights
    const neonPink = new THREE.PointLight(0xff007f, 1.5, 8);
    neonPink.position.set(-2.5, 2.5, 1);
    scene.add(neonPink);

    const neonCyan = new THREE.PointLight(0x00e5ff, 1.5, 8);
    neonCyan.position.set(2.5, 2.5, 1);
    scene.add(neonCyan);

    // Wooden Pub Wall & Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.85 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !lowSpecMode;
    scene.add(floorMesh);

    const wallGeo = new THREE.PlaneGeometry(16, 8);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a151f, roughness: 0.9 });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 4, -0.05);
    wallMesh.receiveShadow = !lowSpecMode;
    scene.add(wallMesh);

    // Dartboard Surround Wood Cabinet / Ring
    const cabinetGeo = new THREE.BoxGeometry(1.6, 1.6, 0.08);
    const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x3d2012, roughness: 0.7 });
    const cabinetMesh = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinetMesh.position.set(0, 1.73, -0.01);
    scene.add(cabinetMesh);

    // Voxel Dartboard Base (Circular Backplate)
    const boardBackGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.04, 32);
    const boardBackMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.6 });
    const boardBackMesh = new THREE.Mesh(boardBackGeo, boardBackMat);
    boardBackMesh.rotation.x = Math.PI / 2;
    boardBackMesh.position.set(0, 1.73, 0.03);
    scene.add(boardBackMesh);

    // Voxel Dartboard Rings & Segments
    // Outer Ring (Double ring)
    const doubleRingGeo = new THREE.RingGeometry(0.38, 0.42, 32);
    const doubleRingMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    const doubleRingMesh = new THREE.Mesh(doubleRingGeo, doubleRingMat);
    doubleRingMesh.position.set(0, 1.73, 0.052);
    scene.add(doubleRingMesh);

    // Triple Ring
    const tripleRingGeo = new THREE.RingGeometry(0.22, 0.26, 32);
    const tripleRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const tripleRingMesh = new THREE.Mesh(tripleRingGeo, tripleRingMat);
    tripleRingMesh.position.set(0, 1.73, 0.053);
    scene.add(tripleRingMesh);

    // Outer Bull (25P)
    const outerBullGeo = new THREE.CircleGeometry(0.065, 24);
    const outerBullMat = new THREE.MeshBasicMaterial({ color: 0x16a34a, side: THREE.DoubleSide });
    const outerBullMesh = new THREE.Mesh(outerBullGeo, outerBullMat);
    outerBullMesh.position.set(0, 1.73, 0.054);
    scene.add(outerBullMesh);

    // Double Bullseye (50P)
    const bullseyeGeo = new THREE.CircleGeometry(0.03, 24);
    const bullseyeMat = new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
    const bullseyeMesh = new THREE.Mesh(bullseyeGeo, bullseyeMat);
    bullseyeMesh.position.set(0, 1.73, 0.055);
    scene.add(bullseyeMesh);

    // Dartboard Spider Wire & Segments
    for (let i = 0; i < 20; i++) {
      const angle = (i * Math.PI * 2) / 20;
      const wireGeo = new THREE.BoxGeometry(0.004, 0.42, 0.005);
      const wireMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(0, 1.73, 0.056);
      wire.rotation.z = angle;
      scene.add(wire);
    }

    // Function to create a 3D Voxel Dart
    const createDartMesh = () => {
      const dartGroup = new THREE.Group();

      // Steel Tip
      const tipGeo = new THREE.ConeGeometry(0.006, 0.04, 8);
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.rotation.x = -Math.PI / 2;
      tip.position.z = -0.07;
      dartGroup.add(tip);

      // Brass Barrel (Heavy grip)
      const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8);
      const barrelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.z = -0.02;
      dartGroup.add(barrel);

      // Shaft
      const shaftGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8);
      const shaftMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.3, roughness: 0.7 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.z = 0.035;
      dartGroup.add(shaft);

      // Voxel Flights (4 wings)
      const flightMat = new THREE.MeshStandardMaterial({ color: 0xef4444, side: THREE.DoubleSide });
      for (let i = 0; i < 2; i++) {
        const flightGeo = new THREE.BoxGeometry(0.04, 0.002, 0.035);
        const flight = new THREE.Mesh(flightGeo, flightMat);
        flight.position.z = 0.07;
        if (i === 1) flight.rotation.z = Math.PI / 2;
        dartGroup.add(flight);
      }

      return dartGroup;
    };

    // Active in-hand Dart
    const playerDart = createDartMesh();
    playerDart.position.set(0, 1.45, 2.5);
    scene.add(playerDart);
    stateRef.current.activeDartMesh = playerDart;

    // Crosshair in 3D
    const reticleGroup = new THREE.Group();
    const reticleRingGeo = new THREE.RingGeometry(0.02, 0.023, 24);
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const reticleRing = new THREE.Mesh(reticleRingGeo, reticleMat);
    reticleGroup.add(reticleRing);

    const dotGeo = new THREE.CircleGeometry(0.004, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    reticleGroup.add(dot);

    reticleGroup.position.set(0, 1.73, 0.06);
    scene.add(reticleGroup);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const state = stateRef.current;

      // Smooth Camera Zoom (When aiming/holding breath)
      state.zoomLevel += (state.targetZoom - state.zoomLevel) * 0.1;
      camera.fov = 50 / state.zoomLevel;
      camera.updateProjectionMatrix();

      // Breathing Sway
      state.swayTime += delta * (state.targetZoom > 1.2 ? 1.5 : 3.0);
      const swayAmplitude = state.targetZoom > 1.2 ? 0.015 : 0.045;
      const currentAimX = state.aimX + Math.sin(state.swayTime) * swayAmplitude;
      const currentAimY = 1.73 + state.aimY + Math.cos(state.swayTime * 1.3) * (swayAmplitude * 0.8);

      reticleGroup.position.x = currentAimX;
      reticleGroup.position.y = currentAimY;

      // Update in-hand dart position
      if (!state.isDartFlying && state.activeDartMesh) {
        state.activeDartMesh.position.x = currentAimX * 0.7;
        state.activeDartMesh.position.y = 1.45 + (currentAimY - 1.73) * 0.5;
        state.activeDartMesh.position.z = 2.5;
        state.activeDartMesh.rotation.set(
          -(currentAimY - 1.73) * 0.3,
          (currentAimX) * 0.3,
          0
        );
      }

      // Flying Dart Physics
      if (state.isDartFlying && state.activeDartMesh) {
        state.activeDartMesh.position.addScaledVector(state.dartVel, delta * 60);

        // Check impact with dartboard at z = 0.05
        if (state.activeDartMesh.position.z <= 0.06) {
          state.activeDartMesh.position.z = 0.055;
          state.isDartFlying = false;

          // Calculate Score based on distance to center (0, 1.73)
          const hitX = state.activeDartMesh.position.x;
          const hitY = state.activeDartMesh.position.y;
          const distFromCenter = Math.hypot(hitX, hitY - 1.73);

          let points = 0;
          let label = '';

          if (distFromCenter <= 0.03) {
            points = 50;
            label = isKo ? '🎯 더블 불스아이 (50P)!!' : '🎯 DOUBLE BULLSEYE (50P)!!';
            if (!isMuted) playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          } else if (distFromCenter <= 0.065) {
            points = 25;
            label = isKo ? '🟢 아우터 불 (25P)!' : '🟢 OUTER BULL (25P)!';
            if (!isMuted) playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          } else if (distFromCenter >= 0.22 && distFromCenter <= 0.26) {
            // Triple Ring: random base number 10~20 x 3
            const base = 15 + Math.floor(Math.random() * 6);
            points = base * 3;
            label = isKo ? `🔥 트리플 ${base} (${points}P)!` : `🔥 TRIPLE ${base} (${points}P)!`;
            if (!isMuted) playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          } else if (distFromCenter >= 0.38 && distFromCenter <= 0.42) {
            // Double Ring
            const base = 10 + Math.floor(Math.random() * 11);
            points = base * 2;
            label = isKo ? `✨ 더블 ${base} (${points}P)!` : `✨ DOUBLE ${base} (${points}P)!`;
            if (!isMuted) playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          } else if (distFromCenter <= 0.45) {
            // Single Wedge
            points = 10 + Math.floor(Math.random() * 11);
            label = isKo ? `📍 싱글 (${points}P)` : `📍 SINGLE (${points}P)`;
            if (!isMuted) playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          } else {
            // Missed Board
            points = 0;
            label = isKo ? '💨 보드 빗나감 (0P)' : '💨 BOARD MISS (0P)';
          }

          // Combo tracking
          if (points >= 25) {
            state.combo += 1;
          } else {
            state.combo = 0;
          }
          setCombo(state.combo);

          state.totalScore += points;
          setTotalScore(state.totalScore);
          setLastScoreText(label);

          // Save stuck dart
          state.stuckDarts.push(state.activeDartMesh);

          // Advance turn / round
          state.dartsInRound -= 1;
          setDartsLeft(state.dartsInRound);

          if (state.dartsInRound <= 0) {
            if (state.round >= 8) {
              // End of Game
              state.isGameOver = true;
              setIsGameOver(true);
              const earnedSns = Math.min(260, Math.max(25, Math.floor(state.totalScore * 0.6)));
              setRewardSns(earnedSns);
              onReward(earnedSns);
            } else {
              // Next round
              setTimeout(() => {
                state.round += 1;
                state.dartsInRound = 3;
                setCurrentRound(state.round);
                setDartsLeft(3);

                // Clear stuck darts
                state.stuckDarts.forEach(d => scene.remove(d));
                state.stuckDarts = [];

                // New active dart
                const nextDart = createDartMesh();
                nextDart.position.set(0, 1.45, 2.5);
                scene.add(nextDart);
                state.activeDartMesh = nextDart;
              }, 1200);
            }
          } else {
            // Next dart in same round
            setTimeout(() => {
              const nextDart = createDartMesh();
              nextDart.position.set(0, 1.45, 2.5);
              scene.add(nextDart);
              state.activeDartMesh = nextDart;
            }, 600);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Handle Resize
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
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, isKo, isMuted, playSfx]);

  // Touch / Drag Aiming
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (stateRef.current.isDartFlying || isGameOver) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const normX = (clientX / window.innerWidth - 0.5) * 0.8;
    const normY = -(clientY / window.innerHeight - 0.5) * 0.8;

    stateRef.current.aimX = normX;
    stateRef.current.aimY = normY;
  };

  // Hold to Aim / Zoom In (Stabilize breath)
  const handleAimStart = () => {
    if (stateRef.current.isDartFlying || isGameOver) return;
    setIsAiming(true);
    stateRef.current.targetZoom = 1.45;
  };

  // Release to Throw
  const handleThrow = () => {
    if (stateRef.current.isDartFlying || isGameOver || !stateRef.current.activeDartMesh) return;
    setIsAiming(false);
    stateRef.current.targetZoom = 1.0;

    const state = stateRef.current;
    state.isDartFlying = true;

    // Throw velocity towards target (aimX, aimY, 0.05)
    const targetX = state.aimX;
    const targetY = 1.73 + state.aimY;
    const dx = (targetX - state.activeDartMesh.position.x);
    const dy = (targetY - state.activeDartMesh.position.y);
    const dz = (0.055 - state.activeDartMesh.position.z);

    const dist = Math.hypot(dx, dy, dz);
    const speed = 0.16;
    state.dartVel.set((dx / dist) * speed, (dy / dist) * speed, (dz / dist) * speed);

    if (!isMuted) playSfx?.('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none"
      onTouchMove={handleTouchMove}
      onMouseMove={handleTouchMove}
    >
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

        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs text-amber-300 font-bold">
            {isKo ? `점수: ${totalScore}P` : `Score: ${totalScore}`}
          </span>
          <span className="text-[10px] text-slate-400">
            [R{currentRound}/{totalRounds}]
          </span>
          <div className="flex gap-1 pl-1 border-l border-slate-700">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < dartsLeft ? 'bg-rose-500 shadow-rose-500/50' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-300 rounded-sm hover:bg-slate-800 text-xs"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Combo Badge */}
      {combo > 1 && (
        <div className="absolute top-14 right-4 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 px-3 py-0.5 text-xs font-black rounded-sm animate-pulse z-10 pointer-events-none">
          🔥 {combo} COMBO BULLS!
        </div>
      )}

      {/* Last Hit Announcer */}
      {lastScoreText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-amber-500/60 text-amber-300 px-4 py-1.5 rounded-sm text-xs font-black tracking-wider shadow-xl z-10 pointer-events-none animate-bounce">
          {lastScoreText}
        </div>
      )}

      {/* Mobile-First Controls */}
      <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center gap-2.5 z-10">
        <div className="w-full max-w-xs flex gap-2">
          <button
            onMouseDown={handleAimStart}
            onMouseUp={handleThrow}
            onTouchStart={handleAimStart}
            onTouchEnd={handleThrow}
            className={`flex-1 py-4 font-black text-base rounded-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
              isAiming
                ? 'bg-rose-600 border border-rose-400 text-white animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-red-600 border border-amber-300 text-slate-950'
            }`}
          >
            <Target size={20} />
            <span>{isAiming ? (isKo ? '🎯 손 떼면 투척!' : '🎯 RELEASE TO THROW') : (isKo ? '🎯 롱프레스 조준 후 투척' : '🎯 HOLD AIM & THROW')}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-300 bg-slate-900/80 px-3 py-0.5 rounded-sm border border-slate-700 flex items-center gap-1.5">
          <Eye size={12} className="text-sky-400" />
          <span>{isKo ? '화면 드래그로 조준점을 맞추고 롱프레스로 숨참기 정밀 샷!' : 'Drag screen to align target, hold to zoom & stabilize!'}</span>
        </p>
      </div>

      {/* Game Over Summary Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest">
              {isKo ? '🏆 다트 바 8라운드 완주!' : '🏆 8 ROUNDS COMPLETED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '최종 득점' : 'Final Score'}</span>
                <span className="font-bold text-amber-300">{totalScore} PTS</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최대 콤보' : 'Max Combo'}</span>
                <span className="font-bold text-indigo-300">{combo} COMBO</span>
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

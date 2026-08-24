import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCoasterTycoonGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelCoasterTycoonGame: React.FC<VoxelCoasterTycoonGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_coaster_tycoon') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mode, setMode] = useState<'build' | 'ride'>('build');
  const [trackPieces, setTrackPieces] = useState<number>(5);
  const [thrillScore, setThrillScore] = useState<number>(85);
  const [rideProgress, setRideProgress] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    points: [
      new THREE.Vector3(0, 2, 20),
      new THREE.Vector3(0, 16, -10),
      new THREE.Vector3(15, 6, -30),
      new THREE.Vector3(-15, 12, -40),
      new THREE.Vector3(0, 2, 20)
    ],
    mode: 'build' as 'build' | 'ride',
    cartProgress: 0,
    speed: 0.003,
    curve: null as THREE.CatmullRomCurve3 | null,
    cartMesh: null as THREE.Group | null,
    scene: null as THREE.Scene | null,
    trackLine: null as THREE.Line | null,
    camera: null as THREE.PerspectiveCamera | null,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    thrill: 85
  });

  const addSpecialPiece = (type: 'loop' | 'drop' | 'corkscrew') => {
    const s = stateRef.current;
    if (s.mode === 'ride' || s.isGameOver || s.isPaused) return;

    const last = s.points[s.points.length - 2];
    const newPt = last.clone();

    if (type === 'loop') {
      newPt.y += 18;
      newPt.z -= 15;
      s.thrill += 35;
    } else if (type === 'drop') {
      newPt.y = 2;
      newPt.z -= 20;
      s.thrill += 25;
    } else {
      newPt.x += 20;
      newPt.y += 10;
      s.thrill += 30;
    }

    s.points.splice(s.points.length - 1, 0, newPt);
    setTrackPieces(s.points.length);
    setThrillScore(s.thrill);
    updateTrackGeometry();
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const updateTrackGeometry = () => {
    const s = stateRef.current;
    if (!s.scene) return;

    s.curve = new THREE.CatmullRomCurve3(s.points, true);
    const pts = s.curve.getPoints(120);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);

    if (s.trackLine) {
      s.scene.remove(s.trackLine);
    }

    const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
    const line = new THREE.Line(geo, mat);
    s.scene.add(line);
    s.trackLine = line;
  };

  const startRide = () => {
    const s = stateRef.current;
    if (s.mode === 'ride' || s.isGameOver || s.isPaused) return;
    s.mode = 'ride';
    s.cartProgress = 0;
    setMode('ride');
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 30, 160);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 5, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    dirLight.position.set(50, 80, 50);
    scene.add(dirLight);

    // Ground Grid
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Initial Track
    updateTrackGeometry();

    // Coaster Cart Mesh
    const cartGroup = new THREE.Group();
    const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 3), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    cartBody.position.y = 0.6;
    cartGroup.add(cartBody);
    scene.add(cartGroup);
    stateRef.current.cartMesh = cartGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      if (s.mode === 'ride' && s.curve && s.cartMesh && camera) {
        s.cartProgress += s.speed * (dt * 60);
        setRideProgress(Math.min(100, Math.round(s.cartProgress * 100)));

        const point = s.curve.getPointAt(Math.min(s.cartProgress % 1, 0.999));
        const tangent = s.curve.getTangentAt(Math.min(s.cartProgress % 1, 0.999)).normalize();

        s.cartMesh.position.copy(point);
        s.cartMesh.lookAt(point.clone().add(tangent));

        // 1st Person POV Camera attached to Cart
        camera.position.copy(point).add(new THREE.Vector3(0, 1.5, 0));
        camera.lookAt(point.clone().add(tangent.clone().multiplyScalar(10)));

        if (s.cartProgress >= 1.0) {
          s.mode = 'build';
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_coaster_tycoon',
            gameTitle: '복셀 코스터 타이쿤',
            durationSeconds: duration,
            score: s.thrill * 25,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      } else if (camera) {
        // Overview Camera in build mode
        camera.position.set(0, 30, 50);
        camera.lookAt(0, 5, 0);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = stateRef.current;
    s.mode = 'build';
    s.cartProgress = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    setMode('build');
    setRideProgress(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 롤러코스터 타이쿤' : 'Voxel Coaster Tycoon'}
        language={language}
        telemetries={[
          { label: isKo ? '스릴점수' : 'Thrill', value: `${thrillScore}P`, color: 'text-amber-300' },
          { label: isKo ? '트랙구간' : 'Tracks', value: `${trackPieces}구간`, color: 'text-cyan-300' },
          { label: isKo ? '모드' : 'Mode', value: mode === 'ride' ? `${rideProgress}% (탑승)` : '건설중', color: 'text-emerald-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Bottom Track Builder Pure Gesture Bar */}
      {mode === 'build' && !isGameOver && !isPaused && !showTutorial && (
        <div className="absolute bottom-4 left-3 right-3 z-20 flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex gap-1.5 flex-1">
            <button
              onClick={() => addSpecialPiece('loop')}
              className="flex-1 py-2.5 bg-slate-900/90 border border-cyan-400/40 rounded-sm text-[11px] font-bold text-cyan-300 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {isKo ? '+ 360° 루프' : '+ Loop'}
            </button>
            <button
              onClick={() => addSpecialPiece('drop')}
              className="flex-1 py-2.5 bg-slate-900/90 border border-amber-400/40 rounded-sm text-[11px] font-bold text-amber-300 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {isKo ? '+ 급강하 힐' : '+ Drop'}
            </button>
            <button
              onClick={() => addSpecialPiece('corkscrew')}
              className="flex-1 py-2.5 bg-slate-900/90 border border-purple-400/40 rounded-sm text-[11px] font-bold text-purple-300 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {isKo ? '+ 코크스크류' : '+ Corkscrew'}
            </button>
          </div>

          <button
            onClick={startRide}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-sm shadow-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>🎢</span>
            <span>{isKo ? '1인칭 탑승' : 'Ride POV'}</span>
          </button>
        </div>
      )}

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_coaster_tycoon"
          gameTitle={isKo ? '3D 복셀 롤러코스터 타이쿤: 스릴 라이더' : 'Voxel Coaster Tycoon: Thrill Rider'}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};

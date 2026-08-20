import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Rocket, Trophy, Play, Plus, Sparkles } from 'lucide-react';
import { CardData } from '../types';

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
  language: _language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'build' | 'ride'>('build');
  const [trackPieces, setTrackPieces] = useState<number>(4);
  const [thrillScore, setThrillScore] = useState<number>(85);
  const [rideProgress, setRideProgress] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

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
    thrill: 85
  });

  const addSpecialPiece = (type: 'loop' | 'drop' | 'corkscrew') => {
    const s = stateRef.current;
    if (s.mode === 'ride') return;

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
    if (playSfx) playSfx('/sounds/build.mp3');
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
    stateRef.current.mode = 'ride';
    stateRef.current.cartProgress = 0;
    setMode('ride');
    if (playSfx) playSfx('/sounds/coaster_start.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.01);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfacc15, 1.3);
    sun.position.set(30, 80, 40);
    scene.add(sun);

    // Ground Grid
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Initial Track
    updateTrackGeometry();

    // Coaster Cart Mesh
    const cartGroup = new THREE.Group();
    const cartBody = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.2, 3),
      new THREE.MeshLambertMaterial({ color: 0xef4444 })
    );
    cartBody.position.y = 0.6;
    cartGroup.add(cartBody);

    scene.add(cartGroup);
    stateRef.current.cartMesh = cartGroup;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;

      if (s.mode === 'build') {
        // Build mode overview orbit
        camera.position.set(35, 40, 45);
        camera.lookAt(0, 10, -15);
      } else if (s.mode === 'ride' && s.curve && s.cartMesh) {
        // 1st Person Coaster Ride
        s.cartProgress += s.speed;
        setRideProgress(Math.min(100, Math.floor(s.cartProgress * 100)));

        if (s.cartProgress >= 1.0) {
          // Completed Ride
          s.mode = 'build';
          setMode('build');
          s.isGameOver = true;
          setIsGameOver(true);
          const finalSns = Math.min(260, Math.max(40, s.thrill + 40));
          setRewardSns(finalSns);
          onReward(finalSns);
          if (playSfx) playSfx('/sounds/fanfare.mp3');
          return;
        }

        const pt = s.curve.getPointAt(s.cartProgress);
        const tangent = s.curve.getTangentAt(s.cartProgress).normalize();

        s.cartMesh.position.copy(pt);
        s.cartMesh.lookAt(pt.clone().add(tangent));

        // Mount camera inside cart
        camera.position.copy(pt).add(new THREE.Vector3(0, 1.5, 0));
        camera.lookAt(pt.clone().add(tangent.multiplyScalar(5)));
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
            <Rocket className="w-3.5 h-3.5" /> [No.77 무라디 전담] 3D 롤러코스터 타이쿤
          </div>
          <div className="text-[10px] text-slate-300">스플라인 레일 건설 & 1인칭 탑승 스릴 라이더</div>
        </div>
        <div className="text-xs text-cyan-300 font-bold">
          스릴 지수: {thrillScore}P
        </div>
      </div>

      {/* Stats HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b]/90 text-xs border-b border-slate-700 z-20">
        <div>레일 구간: <strong className="text-amber-400">{trackPieces}개</strong></div>
        {mode === 'ride' ? (
          <div className="text-pink-400 font-bold animate-pulse">
            탑승 진행률: {rideProgress}%
          </div>
        ) : (
          <div className="text-slate-400">건설 모드 (스릴 트랙 추가)</div>
        )}
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="relative flex-1 w-full overflow-hidden" />

      {/* Bottom Controls */}
      <div className="p-3 bg-[#1e293b]/95 border-t border-slate-700 flex items-center justify-between gap-2 z-20">
        <div className="flex gap-1.5">
          <button
            onClick={() => addSpecialPiece('loop')}
            disabled={mode === 'ride'}
            className="px-2.5 py-2.5 bg-slate-800 border border-slate-600 rounded-sm text-[11px] font-bold active:bg-slate-700 disabled:opacity-50"
          >
            [+ 360° 루프]
          </button>
          <button
            onClick={() => addSpecialPiece('drop')}
            disabled={mode === 'ride'}
            className="px-2.5 py-2.5 bg-slate-800 border border-slate-600 rounded-sm text-[11px] font-bold active:bg-slate-700 disabled:opacity-50"
          >
            [+ 급강하 힐]
          </button>
          <button
            onClick={() => addSpecialPiece('corkscrew')}
            disabled={mode === 'ride'}
            className="px-2.5 py-2.5 bg-slate-800 border border-slate-600 rounded-sm text-[11px] font-bold active:bg-slate-700 disabled:opacity-50"
          >
            [+ 코크스크류]
          </button>
        </div>

        <button
          onClick={startRide}
          disabled={mode === 'ride'}
          className="px-5 py-3 bg-amber-500 text-black font-bold text-xs rounded-sm active:bg-amber-400 shadow-lg flex items-center gap-1 disabled:opacity-50"
        >
          <Play className="w-4 h-4" /> [1인칭 탑승 출발]
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-amber-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-amber-400 mb-1">[스릴 라이딩 완주!]</h2>
            <p className="text-xs text-slate-300 mb-4">1인칭 롤러코스터 탑승 성공</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">최종 스릴 점수:</span>
                <span className="text-amber-400 font-bold">{thrillScore}P</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1">
                <span className="text-amber-300 font-bold">확정 보상 SNS:</span>
                <span className="text-amber-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-2.5 bg-amber-500 text-black font-bold text-xs rounded-sm active:bg-amber-400"
            >
              [보상 수령 및 복귀]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

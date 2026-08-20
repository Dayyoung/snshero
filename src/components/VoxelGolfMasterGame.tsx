import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Target, Wind } from 'lucide-react';
import { CardData } from '../types';

interface VoxelGolfMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelGolfMasterGame: React.FC<VoxelGolfMasterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<number>(0);
  const [power, setPower] = useState<number>(50);
  const [angle, setAngle] = useState<number>(0);
  const [wind, setWind] = useState<number>(2.5);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isHoleInOne, setIsHoleInOne] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    ballPos: new THREE.Vector3(0, 0.4, 20),
    ballVel: new THREE.Vector3(0, 0, 0),
    holePos: new THREE.Vector3(0, 0.1, -15),
    isShooting: false,
    strokes: 0,
    power: 50,
    angle: 0,
    wind: 2.5,
    isGameOver: false
  });

  const swingClub = () => {
    const s = stateRef.current;
    if (s.isShooting || s.isGameOver) return;
    s.isShooting = true;
    s.strokes += 1;
    setStrokes(s.strokes);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const rad = (s.angle * Math.PI) / 180;
    const pVal = (s.power / 100) * 0.9;
    s.ballVel.set(Math.sin(rad) * pVal, 0.4 * (s.power / 100), -Math.cos(rad) * pVal);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x064e3b);
    scene.fog = new THREE.FogExp2(0x064e3b, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 14, 28);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfef08a, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Green Fairway
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 60), new THREE.MeshLambertMaterial({ color: 0x15803d }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Hole Cup & Flag
    const holeMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    holeMesh.position.copy(stateRef.current.holePos);
    scene.add(holeMesh);

    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    flagPole.position.set(0, 3, -15);
    scene.add(flagPole);
    const flagBanner = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.1), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    flagBanner.position.set(0.7, 5.5, -15);
    scene.add(flagBanner);

    // Golf Ball
    const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    ballMesh.position.copy(stateRef.current.ballPos);
    scene.add(ballMesh);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      if (s.isShooting) {
        // Physics
        s.ballVel.y -= 0.02; // Gravity
        s.ballVel.x += s.wind * 0.0005; // Wind drift
        s.ballPos.add(s.ballVel);

        // Ground bounce
        if (s.ballPos.y <= 0.5) {
          s.ballPos.y = 0.5;
          s.ballVel.y *= -0.4;
          s.ballVel.x *= 0.94;
          s.ballVel.z *= 0.94;

          if (s.ballVel.length() < 0.03) {
            s.isShooting = false;
            s.ballVel.set(0, 0, 0);

            // Check Hole-in!
            const dist = s.ballPos.distanceTo(s.holePos);
            if (dist < 1.8) {
              s.isGameOver = true;
              setIsGameOver(true);
              const isHole1 = s.strokes === 1;
              setIsHoleInOne(isHole1);
              const reward = isHole1 ? 260 : Math.max(100, 200 - s.strokes * 20);
              setRewardSns(reward);
              onReward(reward);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            }
          }
        }
      }

      ballMesh.position.copy(s.ballPos);
      camera.position.set(s.ballPos.x * 0.4, 14, s.ballPos.z + 14);
      camera.lookAt(s.ballPos);

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
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white text-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-sm border border-slate-700 font-bold"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 font-black">
          <span className="text-emerald-400">STROKE: {strokes}</span>
          <span className="text-sky-300 flex items-center gap-1">
            <Wind size={14} /> 풍향: +{wind}m/s
          </span>
        </div>

        <div className="text-amber-300 font-bold">파워: {power}%</div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-sm border border-slate-800 pointer-events-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-300 font-bold">각도:</span>
          <input
            type="range"
            min="-30"
            max="30"
            value={angle}
            onChange={(e) => { setAngle(Number(e.target.value)); stateRef.current.angle = Number(e.target.value); }}
            className="w-28"
          />
          <span className="text-xs text-cyan-300 font-black">{angle}°</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-300 font-bold">파워:</span>
          <input
            type="range"
            min="20"
            max="100"
            value={power}
            onChange={(e) => { setPower(Number(e.target.value)); stateRef.current.power = Number(e.target.value); }}
            className="w-28"
          />
          <span className="text-xs text-amber-300 font-black">{power}%</span>
        </div>

        <button
          onClick={swingClub}
          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 active:bg-emerald-500 border border-emerald-400 rounded-sm text-white font-black text-xs shadow-lg"
        >
          SWING (샷 발사)
        </button>
      </div>

      {/* Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{isHoleInOne ? (language === 'ko' ? '🌟 홀인원 잭팟!' : 'HOLE IN ONE!!') : 'HOLE IN SUCCESS!'}</h2>
            <p className="text-sm text-slate-300">
              {language === 'ko' ? `총 타수: ${strokes}타 만에 홀인 성공` : `Total Strokes: ${strokes}`}
            </p>
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

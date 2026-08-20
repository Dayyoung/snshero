import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Target, Flame, ArrowLeft, Trophy, Zap } from 'lucide-react';
import { CardData } from '../types';

interface VoxelMedievalSiegeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Boulder {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  alive: boolean;
}

interface CastleBlock {
  mesh: THREE.Mesh;
  alive: boolean;
}

export const VoxelMedievalSiegeGame: React.FC<VoxelMedievalSiegeGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState<number>(45);
  const [power, setPower] = useState<number>(75);
  const [shotsLeft, setShotsLeft] = useState<number>(8);
  const [castleHp, setCastleHp] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  const angleRef = useRef<number>(45);
  const powerRef = useRef<number>(75);
  const bouldersRef = useRef<Boulder[]>([]);
  const castleBlocksRef = useRef<CastleBlock[]>([]);
  const animationFrameRef = useRef<number>(0);
  const castleHpRef = useRef<number>(100);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 300);
    camera.position.set(-25, 20, 45);
    camera.lookAt(0, 8, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Sunlight
    const sun = new THREE.DirectionalLight(0xfffaed, 1.6);
    sun.position.set(30, 60, 40);
    sun.castShadow = !lowSpecMode;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x607d8b, 0.9));

    // Green Grass Terrain
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3f6212 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Trebuchet (Catapult) Model
    const trebuchetGroup = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(4, 1, 8);
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });
    const baseFrame = new THREE.Mesh(frameGeo, frameMat);
    baseFrame.position.y = 0.5;
    trebuchetGroup.add(baseFrame);

    const armGeo = new THREE.BoxGeometry(0.6, 12, 0.6);
    const armMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, 4, 0);
    arm.rotation.x = -Math.PI / 4;
    trebuchetGroup.add(arm);

    trebuchetGroup.position.set(0, 0, 30);
    scene.add(trebuchetGroup);

    // Voxel Castle Wall Builder
    const blockMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const blockGeo = new THREE.BoxGeometry(2, 2, 2);

    for (let y = 0; y < 6; y++) {
      for (let x = -7; x <= 7; x++) {
        const block = new THREE.Mesh(blockGeo, blockMat);
        block.position.set(x * 2.1, 1 + y * 2.1, -25);
        block.castShadow = true;
        block.receiveShadow = true;
        scene.add(block);
        castleBlocksRef.current.push({ mesh: block, alive: true });
      }
    }

    // Castle Towers
    const towerGeo = new THREE.BoxGeometry(5, 18, 5);
    const towerMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const leftTower = new THREE.Mesh(towerGeo, towerMat);
    leftTower.position.set(-18, 9, -25);
    const rightTower = new THREE.Mesh(towerGeo, towerMat);
    rightTower.position.set(18, 9, -25);
    scene.add(leftTower, rightTower);

    // Fire Trebuchet Boulder
    const launchBoulder = () => {
      if (shotsLeft <= 0) return;
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      setShotsLeft(s => s - 1);

      const rad = (angleRef.current * Math.PI) / 180;
      const spd = (powerRef.current / 100) * 45;

      const boulderGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const boulderMat = new THREE.MeshBasicMaterial({ color: 0xf97316 }); // Flaming rock
      const boulderMesh = new THREE.Mesh(boulderGeo, boulderMat);
      boulderMesh.position.set(0, 5, 28);
      scene.add(boulderMesh);

      bouldersRef.current.push({
        mesh: boulderMesh,
        vx: 0,
        vy: Math.sin(rad) * spd,
        vz: -Math.cos(rad) * spd,
        alive: true,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'j') {
        launchBoulder();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Update Boulders
      for (let i = bouldersRef.current.length - 1; i >= 0; i--) {
        const b = bouldersRef.current[i];
        if (!b.alive) continue;

        b.vy -= 9.8 * delta * 2.5; // Gravity
        b.mesh.position.x += b.vx * delta;
        b.mesh.position.y += b.vy * delta;
        b.mesh.position.z += b.vz * delta;

        // Collision with Castle Blocks
        castleBlocksRef.current.forEach(cb => {
          if (!cb.alive) return;
          if (b.mesh.position.distanceTo(cb.mesh.position) < 2.5) {
            cb.alive = false;
            scene.remove(cb.mesh);
            castleHpRef.current = Math.max(0, castleHpRef.current - 4);
            setCastleHp(castleHpRef.current);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }
        });

        // Hit ground or back wall
        if (b.mesh.position.y <= 0 || b.mesh.position.z < -40) {
          b.alive = false;
          scene.remove(b.mesh);
          bouldersRef.current.splice(i, 1);
        }
      }

      // Check Victory
      if (castleHpRef.current <= 0 && !isVictory) {
        setIsVictory(true);
        onReward(230);
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, playSfx, onReward, shotsLeft, isVictory]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#87ceeb] text-slate-900 font-mono select-none overflow-hidden flex flex-col">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-slate-900/80 text-white backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-sm text-xs font-bold transition-all border border-white/15"
        >
          <ArrowLeft size={14} />
          {language === 'ko' ? '로비로' : 'LOBBY'}
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="text-amber-400">성벽 내구도: {castleHp}%</span>
          <span className="text-rose-400">잔여 화염탄: {shotsLeft}발</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="w-full flex-1 touch-none" />

      {/* Bottom Controls (Angle & Power) */}
      <div className="absolute bottom-6 left-0 right-0 z-20 px-4 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-2 bg-slate-900/90 p-3 rounded-sm border border-slate-700 text-white text-xs pointer-events-auto w-64">
          <div className="flex justify-between items-center">
            <span>발사 각도: {angle}°</span>
            <input
              type="range"
              min="20"
              max="75"
              value={angle}
              onChange={e => setAngle(Number(e.target.value))}
              className="w-32"
            />
          </div>
          <div className="flex justify-between items-center">
            <span>투석 장력: {power}%</span>
            <input
              type="range"
              min="40"
              max="100"
              value={power}
              onChange={e => setPower(Number(e.target.value))}
              className="w-32"
            />
          </div>
        </div>

        {/* Launch Trigger */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))}
          className="w-16 h-16 bg-rose-600/90 active:bg-rose-500 border border-rose-400 rounded-full flex flex-col items-center justify-center text-white text-xs font-black shadow-2xl pointer-events-auto animate-pulse"
        >
          <Flame size={24} />
          <span className="text-[9px]">FIRE</span>
        </button>
      </div>

      {/* Victory */}
      {isVictory && (
        <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-6 bg-slate-900 border-2 border-amber-500 rounded-sm max-w-sm w-full space-y-4 text-white">
            <Trophy size={48} className="mx-auto text-amber-400 animate-bounce" />
            <h2 className="text-2xl font-black text-amber-400">CASTLE DESTROYED!</h2>
            <p className="text-xs text-slate-300">
              {language === 'ko'
                ? `철벽의 성채를 함락시키고 깃발을 탈환하였습니다!`
                : `Siege complete! Castle captured.`}
            </p>
            <div className="p-2 bg-amber-950/60 border border-amber-500/40 text-amber-300 text-sm font-bold">
              +230 SNS POINT EARNED
            </div>
            <button
              onClick={onExit}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-sm text-sm"
            >
              {language === 'ko' ? '보상 수령 및 로비로' : 'CLAIM REWARD & EXIT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default VoxelMedievalSiegeGame;

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Crosshair, Zap, ArrowLeft, Trophy, Swords } from 'lucide-react';
import { CardData } from '../types';

interface VoxelTitanMechaGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyMecha {
  mesh: THREE.Group;
  x: number;
  z: number;
  hp: number;
  alive: boolean;
}

export const VoxelTitanMechaGame: React.FC<VoxelTitanMechaGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ap, setAp] = useState<number>(100);
  const [boostEnergy, setBoostEnergy] = useState<number>(100);
  const [mechasDestroyed, setMechasDestroyed] = useState<number>(0);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const mechaPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const mechaYawRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const enemiesRef = useRef<EnemyMecha[]>([]);
  const missilesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 8, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // City Lighting
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x1e293b, 1.2));

    // City Floor
    const floorGeo = new THREE.PlaneGeometry(150, 150);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Destructible Skyscraper Buildings
    const buildingMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    for (let i = 0; i < 16; i++) {
      const bh = 15 + Math.random() * 25;
      const bGeo = new THREE.BoxGeometry(6, bh, 6);
      const bMesh = new THREE.Mesh(bGeo, buildingMat);
      const bx = (Math.random() - 0.5) * 80;
      const bz = (Math.random() - 0.5) * 80;
      if (Math.abs(bx) > 8 || Math.abs(bz) > 8) {
        bMesh.position.set(bx, bh / 2, bz);
        scene.add(bMesh);
      }
    }

    // Player Titan Mecha Model
    const mechaGroup = new THREE.Group();

    // Torso
    const torsoGeo = new THREE.BoxGeometry(2, 2.5, 1.5);
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 3;
    mechaGroup.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(1, 0.8, 1);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xe0f2fe });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 4.6, 0.2);
    mechaGroup.add(head);

    // Left Arm (Gatling)
    const armGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
    const armMat = new THREE.MeshLambertMaterial({ color: 0x0369a1 });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-1.6, 3, 0);
    mechaGroup.add(leftArm);

    // Right Arm (Beam Blade)
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(1.6, 3, 0);
    const bladeGeo = new THREE.BoxGeometry(0.2, 3, 0.2);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, -1.5, 1);
    blade.rotation.x = Math.PI / 3;
    rightArm.add(blade);
    mechaGroup.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.9, 3, 0.9);
    const leftLeg = new THREE.Mesh(legGeo, armMat);
    leftLeg.position.set(-0.7, 1.5, 0);
    const rightLeg = new THREE.Mesh(legGeo, armMat);
    rightLeg.position.set(0.7, 1.5, 0);
    mechaGroup.add(leftLeg, rightLeg);

    scene.add(mechaGroup);

    // Spawn 4 Enemy Mechas
    for (let i = 0; i < 4; i++) {
      const eGroup = new THREE.Group();
      const eTorso = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 1.5), new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
      eTorso.position.y = 3;
      eGroup.add(eTorso);
      const ex = (Math.random() - 0.5) * 50;
      const ez = -25 - Math.random() * 30;
      eGroup.position.set(ex, 0, ez);
      scene.add(eGroup);

      enemiesRef.current.push({
        mesh: eGroup,
        x: ex,
        z: ez,
        hp: 120,
        alive: true,
      });
    }

    // Launch Homing Missiles
    const fireMissiles = () => {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      const mGeo = new THREE.BoxGeometry(0.3, 0.3, 1.2);
      const mMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

      for (let i = -1; i <= 1; i += 2) {
        const missile = new THREE.Mesh(mGeo, mMat);
        missile.position.set(
          mechaPosRef.current.x + i * 1.5,
          mechaPosRef.current.y + 4.5,
          mechaPosRef.current.z - 1
        );
        scene.add(missile);
        missilesRef.current.push(missile);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'j') {
        fireMissiles();
      }
      if (e.key === 'Shift') {
        // Boost
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Mecha Move
      let moveX = 0;
      let moveZ = 0;
      let isBoosting = keysRef.current['shift'];

      if (keysRef.current['w'] || keysRef.current['arrowup']) moveZ -= 1;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) moveZ += 1;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) mechaYawRef.current += 2.2 * delta;
      if (keysRef.current['d'] || keysRef.current['arrowright']) mechaYawRef.current -= 2.2 * delta;

      const speed = isBoosting ? 22 : 12;
      const sin = Math.sin(mechaYawRef.current);
      const cos = Math.cos(mechaYawRef.current);

      mechaPosRef.current.x += (moveX * cos + moveZ * sin) * speed * delta;
      mechaPosRef.current.z += (-moveX * sin + moveZ * cos) * speed * delta;

      if (isBoosting) {
        mechaPosRef.current.y = 2.5; // Hovering
      } else {
        mechaPosRef.current.y = 0;
      }

      mechaGroup.position.set(mechaPosRef.current.x, mechaPosRef.current.y, mechaPosRef.current.z);
      mechaGroup.rotation.y = mechaYawRef.current;

      camera.position.set(
        mechaPosRef.current.x + Math.sin(mechaYawRef.current) * 12,
        mechaPosRef.current.y + 7,
        mechaPosRef.current.z + Math.cos(mechaYawRef.current) * 12
      );
      camera.lookAt(mechaPosRef.current.x, mechaPosRef.current.y + 3, mechaPosRef.current.z);

      // Missiles Update
      for (let i = missilesRef.current.length - 1; i >= 0; i--) {
        const m = missilesRef.current[i];
        m.position.z -= 45 * delta;

        enemiesRef.current.forEach(enemy => {
          if (!enemy.alive) return;
          if (m.position.distanceTo(enemy.mesh.position) < 3.0) {
            enemy.hp -= 40;
            if (enemy.hp <= 0) {
              enemy.alive = false;
              scene.remove(enemy.mesh);
              setMechasDestroyed(d => d + 1);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }
          }
        });

        if (m.position.z < mechaPosRef.current.z - 80) {
          scene.remove(m);
          missilesRef.current.splice(i, 1);
        }
      }

      // Check Victory
      const allDead = enemiesRef.current.every(e => !e.alive);
      if (allDead && !isVictory) {
        setIsVictory(true);
        onReward(260);
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, playSfx, onReward, isVictory]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] text-white font-mono select-none overflow-hidden flex flex-col">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-sm text-xs font-bold transition-all border border-white/15"
        >
          <ArrowLeft size={14} />
          {language === 'ko' ? '로비로' : 'LOBBY'}
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="text-cyan-400">AP: {ap}%</span>
          <span className="text-pink-400">적 타이탄 파괴: {mechasDestroyed}/4</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="w-full flex-1 touch-none" />

      {/* Mobile Controls */}
      <div className="absolute bottom-6 left-0 right-0 z-20 px-4 flex items-center justify-between pointer-events-none">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1 pointer-events-auto w-32 h-32">
          <div />
          <button
            onPointerDown={() => { keysRef.current['w'] = true; }}
            onPointerUp={() => { keysRef.current['w'] = false; }}
            className="bg-white/20 active:bg-white/40 border border-white/30 rounded-sm flex items-center justify-center text-white font-bold"
          >
            ▲
          </button>
          <div />
          <button
            onPointerDown={() => { keysRef.current['a'] = true; }}
            onPointerUp={() => { keysRef.current['a'] = false; }}
            className="bg-white/20 active:bg-white/40 border border-white/30 rounded-sm flex items-center justify-center text-white font-bold"
          >
            ◀
          </button>
          <div className="bg-white/10 rounded-sm flex items-center justify-center text-[10px] text-white/50">
            PAD
          </div>
          <button
            onPointerDown={() => { keysRef.current['d'] = true; }}
            onPointerUp={() => { keysRef.current['d'] = false; }}
            className="bg-white/20 active:bg-white/40 border border-white/30 rounded-sm flex items-center justify-center text-white font-bold"
          >
            ▶
          </button>
          <div />
          <button
            onPointerDown={() => { keysRef.current['s'] = true; }}
            onPointerUp={() => { keysRef.current['s'] = false; }}
            className="bg-white/20 active:bg-white/40 border border-white/30 rounded-sm flex items-center justify-center text-white font-bold"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Boost & Missiles */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onPointerDown={() => { keysRef.current['shift'] = true; }}
            onPointerUp={() => { keysRef.current['shift'] = false; }}
            className="w-14 h-14 bg-cyan-600/90 active:bg-cyan-500 border border-cyan-400 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold shadow-lg"
          >
            <Zap size={18} />
            <span className="text-[9px]">BOOST</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))}
            className="w-16 h-16 bg-pink-600/90 active:bg-pink-500 border border-pink-400 rounded-full flex flex-col items-center justify-center text-white text-xs font-black shadow-xl animate-pulse"
          >
            <Crosshair size={22} />
            <span className="text-[10px]">MISSILE</span>
          </button>
        </div>
      </div>

      {/* Victory */}
      {isVictory && (
        <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-6 bg-slate-900 border-2 border-cyan-500 rounded-sm max-w-sm w-full space-y-4">
            <Trophy size={48} className="mx-auto text-cyan-400 animate-bounce" />
            <h2 className="text-2xl font-black text-cyan-400">CITY LIBERATED!</h2>
            <p className="text-xs text-slate-300">
              {language === 'ko'
                ? `적 타이탄 메카 부대를 섬멸하고 도시 아레나를 수호했습니다!`
                : `Titan Mechas neutralized! City secured.`}
            </p>
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-sm font-bold">
              +260 SNS POINT EARNED
            </div>
            <button
              onClick={onExit}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-sm text-sm"
            >
              {language === 'ko' ? '보상 수령 및 로비로' : 'CLAIM REWARD & EXIT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default VoxelTitanMechaGame;

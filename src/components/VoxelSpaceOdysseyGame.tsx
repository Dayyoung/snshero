import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rocket, Shield, Crosshair, Zap, Award, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSpaceOdysseyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Asteroid {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  hp: number;
  mineralType: 'iron' | 'gold' | 'crystal';
  alive: boolean;
}

interface PirateShip {
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  hp: number;
  alive: boolean;
}

export const VoxelSpaceOdysseyGame: React.FC<VoxelSpaceOdysseyGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [minerals, setMinerals] = useState<{ iron: number; gold: number; crystal: number }>({
    iron: 0,
    gold: 0,
    crystal: 0,
  });
  const [shield, setShield] = useState<number>(100);
  const [maxShield] = useState<number>(100);
  const [fuel, setFuel] = useState<number>(100);
  const [piratesDefeated, setPiratesDefeated] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  const shipPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const shipRotRef = useRef<{ pitch: number; yaw: number; roll: number }>({ pitch: 0, yaw: 0, roll: 0 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const asteroidsRef = useRef<Asteroid[]>([]);
  const piratesRef = useRef<PirateShip[]>([]);
  const lasersRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(0, 3, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Starfield Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 400;
      starPos[i + 1] = (Math.random() - 0.5) * 400;
      starPos[i + 2] = (Math.random() - 0.5) * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xfff7d6, 1.8);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x223355, 0.9));

    // Player Voxel Spaceship
    const shipGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.8, 3.2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
    const shipBody = new THREE.Mesh(bodyGeo, bodyMat);
    shipGroup.add(shipBody);

    const cockpitGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
    const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.5, 0.2);
    shipGroup.add(cockpit);

    const wingGeo = new THREE.BoxGeometry(4.5, 0.2, 1.4);
    const wingMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0, -0.4);
    shipGroup.add(wings);

    // Engines
    const engineGeo = new THREE.BoxGeometry(0.6, 0.6, 0.8);
    const engineMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const leftEngine = new THREE.Mesh(engineGeo, engineMat);
    leftEngine.position.set(-1.2, 0, 1.6);
    const rightEngine = new THREE.Mesh(engineGeo, engineMat);
    rightEngine.position.set(1.2, 0, 1.6);
    shipGroup.add(leftEngine, rightEngine);

    scene.add(shipGroup);

    // Asteroids Field
    const asteroidGeo = new THREE.DodecahedronGeometry(2.5, 1);
    const matIron = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const matGold = new THREE.MeshLambertMaterial({ color: 0xeab308 });
    const matCrystal = new THREE.MeshLambertMaterial({ color: 0x06b6d4 });

    for (let i = 0; i < 25; i++) {
      const typeRand = Math.random();
      const type: 'iron' | 'gold' | 'crystal' = typeRand < 0.5 ? 'iron' : typeRand < 0.8 ? 'gold' : 'crystal';
      const mat = type === 'iron' ? matIron : type === 'gold' ? matGold : matCrystal;
      const mesh = new THREE.Mesh(asteroidGeo, mat);

      const ax = (Math.random() - 0.5) * 120;
      const ay = (Math.random() - 0.5) * 50;
      const az = -30 - Math.random() * 150;
      mesh.position.set(ax, ay, az);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(mesh);

      asteroidsRef.current.push({
        mesh,
        x: ax,
        y: ay,
        z: az,
        hp: type === 'crystal' ? 60 : 30,
        mineralType: type,
        alive: true,
      });
    }

    // Pirate Ships
    for (let i = 0; i < 4; i++) {
      const pirateGroup = new THREE.Group();
      const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 3), new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
      pirateGroup.add(pBody);
      const px = (Math.random() - 0.5) * 60;
      const py = (Math.random() - 0.5) * 20;
      const pz = -50 - Math.random() * 80;
      pirateGroup.position.set(px, py, pz);
      scene.add(pirateGroup);

      piratesRef.current.push({
        mesh: pirateGroup,
        x: px,
        y: py,
        z: pz,
        hp: 80,
        alive: true,
      });
    }

    // Space Station (Goal)
    const stationGroup = new THREE.Group();
    const stationCore = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 4, 16), new THREE.MeshLambertMaterial({ color: 0x475569 }));
    const stationRing = new THREE.Mesh(new THREE.TorusGeometry(18, 1.2, 8, 32), new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
    stationGroup.add(stationCore, stationRing);
    stationGroup.position.set(0, 0, -220);
    scene.add(stationGroup);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'j') {
        fireLaser();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Laser firing
    const fireLaser = () => {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      const laserGeo = new THREE.BoxGeometry(0.2, 0.2, 2.5);
      const laserMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const laser = new THREE.Mesh(laserGeo, laserMat);
      laser.position.set(shipPosRef.current.x, shipPosRef.current.y, shipPosRef.current.z - 2);
      scene.add(laser);
      lasersRef.current.push(laser);
    };

    // Game loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Controls
      let forward = 0;
      let strafeX = 0;
      let strafeY = 0;

      if (keysRef.current['w'] || keysRef.current['arrowup']) forward -= 1;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) forward += 1;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) strafeX -= 1;
      if (keysRef.current['d'] || keysRef.current['arrowright']) strafeX += 1;
      if (keysRef.current['q']) strafeY -= 1;
      if (keysRef.current['e']) strafeY += 1;

      const speed = 22;
      shipPosRef.current.z += (forward * speed - 10) * delta; // constant forward thrust
      shipPosRef.current.x += strafeX * speed * delta;
      shipPosRef.current.y += strafeY * speed * delta;

      shipGroup.position.set(shipPosRef.current.x, shipPosRef.current.y, shipPosRef.current.z);
      shipGroup.rotation.z = -strafeX * 0.35;
      shipGroup.rotation.x = forward * 0.15;

      camera.position.set(shipPosRef.current.x, shipPosRef.current.y + 3, shipPosRef.current.z + 9);
      camera.lookAt(shipPosRef.current.x, shipPosRef.current.y, shipPosRef.current.z - 15);

      // Station rotation
      stationGroup.rotation.z += delta * 0.1;

      // Update lasers
      for (let i = lasersRef.current.length - 1; i >= 0; i--) {
        const laser = lasersRef.current[i];
        laser.position.z -= 60 * delta;

        // Check Asteroid Hits
        asteroidsRef.current.forEach(ast => {
          if (!ast.alive) return;
          const dist = laser.position.distanceTo(ast.mesh.position);
          if (dist < 3.2) {
            ast.hp -= 25;
            if (ast.hp <= 0) {
              ast.alive = false;
              scene.remove(ast.mesh);
              setMinerals(m => ({ ...m, [ast.mineralType]: m[ast.mineralType] + (ast.mineralType === 'crystal' ? 3 : 5) }));
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }
          }
        });

        // Check Pirate Hits
        piratesRef.current.forEach(pirate => {
          if (!pirate.alive) return;
          const dist = laser.position.distanceTo(pirate.mesh.position);
          if (dist < 3.0) {
            pirate.hp -= 30;
            if (pirate.hp <= 0) {
              pirate.alive = false;
              scene.remove(pirate.mesh);
              setPiratesDefeated(p => p + 1);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }
          }
        });

        if (laser.position.z < shipPosRef.current.z - 150) {
          scene.remove(laser);
          lasersRef.current.splice(i, 1);
        }
      }

      // Check Docking with Space Station
      if (shipPosRef.current.z <= -200) {
        setIsVictory(true);
        onReward(220);
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
  }, [lowSpecMode, playSfx, onReward]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#02040a] text-white font-mono select-none overflow-hidden flex flex-col">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-sm text-xs font-bold transition-all border border-white/15"
        >
          <ArrowLeft size={14} />
          {language === 'ko' ? '로비로' : 'LOBBY'}
        </button>

        {/* Shield & Minerals */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-sky-300">
            <Shield size={14} />
            <span>SHIELD {shield}%</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 px-2 py-1 border border-slate-700 rounded-sm">
            <span className="text-slate-300">철: {minerals.iron}</span>
            <span className="text-yellow-400">금: {minerals.gold}</span>
            <span className="text-cyan-300">수정: {minerals.crystal}</span>
          </div>
          <div className="text-rose-400 font-bold">
            해적 격추: {piratesDefeated}/4
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="w-full flex-1 touch-none" />

      {/* Screen Gesture Touch Overlay */}
      {!isVictory && (
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

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                keysRef.current['w'] = dy < -8;
                keysRef.current['s'] = dy > 12;
                keysRef.current['a'] = dx < -10;
                keysRef.current['d'] = dx > 10;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              keysRef.current['w'] = false;
              keysRef.current['s'] = false;
              keysRef.current['a'] = false;
              keysRef.current['d'] = false;

              if (!moved) {
                // Tap: Fire Laser
                window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 우주선 비행 조종 | 탭: 레이저 발사 (버튼 없음)' : 'Drag: Fly Spaceship | Tap: Fire Laser (No Buttons)'}
        </div>
      </div>

      {/* Victory */}
      {isVictory && (
        <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-6 bg-slate-900 border-2 border-cyan-500 rounded-sm max-w-sm w-full space-y-4">
            <Trophy size={48} className="mx-auto text-cyan-400 animate-bounce" />
            <h2 className="text-2xl font-black text-cyan-400">STATION DOCKED!</h2>
            <p className="text-xs text-slate-300">
              {language === 'ko'
                ? `성계 개척 성공! 수집한 광물과 해적 전리품이 정산되었습니다.`
                : `Star Pioneer Mission Accomplished!`}
            </p>
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-sm font-bold">
              +220 SNS POINT EARNED
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
export default VoxelSpaceOdysseyGame;

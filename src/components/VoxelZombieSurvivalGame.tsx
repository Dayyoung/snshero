import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Skull, Shield, Crosshair, Wrench, Trophy, ArrowLeft, Zap } from 'lucide-react';
import { CardData } from '../types';

interface VoxelZombieSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Zombie {
  mesh: THREE.Group;
  x: number;
  z: number;
  hp: number;
  speed: number;
  alive: boolean;
}

interface Barricade {
  mesh: THREE.Group;
  planks: number;
  x: number;
  z: number;
}

export const VoxelZombieSurvivalGame: React.FC<VoxelZombieSurvivalGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wave, setWave] = useState<number>(1);
  const [points, setPoints] = useState<number>(500);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerMaxHp] = useState<number>(100);
  const [ammo, setAmmo] = useState<number>(30);
  const [weapon, setWeapon] = useState<'pistol' | 'shotgun' | 'raygun'>('pistol');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  const playerPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const playerYawRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const zombiesRef = useRef<Zombie[]>([]);
  const barricadesRef = useRef<Barricade[]>([]);
  const animationFrameRef = useRef<number>(0);
  const waveRef = useRef<number>(1);
  const pointsRef = useRef<number>(500);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080c);
    scene.fog = new THREE.FogExp2(0x05080c, 0.04);

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    camera.position.set(0, 1.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Night Atmosphere & Moon
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.0);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    moonLight.position.set(-20, 40, -20);
    scene.add(moonLight);

    // Flashlight
    const flashlight = new THREE.SpotLight(0xfffaed, 3.5, 30, Math.PI / 6, 0.4);
    flashlight.position.set(0, 1.7, 0);
    scene.add(flashlight);
    scene.add(flashlight.target);

    // Outpost Room Builder
    const roomGroup = new THREE.Group();
    const floorGeo = new THREE.BoxGeometry(20, 0.2, 20);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1e1e24 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.1;
    roomGroup.add(floorMesh);

    // Walls with 4 Window Barricades
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const wallGeo = new THREE.BoxGeometry(20, 4, 1);

    // North Wall with Window
    const northWallLeft = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 1), wallMat);
    northWallLeft.position.set(-6.5, 2, -10);
    const northWallRight = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 1), wallMat);
    northWallRight.position.set(6.5, 2, -10);
    roomGroup.add(northWallLeft, northWallRight);

    // South Wall
    const southWall = new THREE.Mesh(wallGeo, wallMat);
    southWall.position.set(0, 2, 10);
    roomGroup.add(southWall);

    // West & East Walls
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 20), wallMat);
    westWall.position.set(-10, 2, 0);
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 20), wallMat);
    eastWall.position.set(10, 2, 0);
    roomGroup.add(westWall, eastWall);

    scene.add(roomGroup);

    // Barricade Window (North)
    const barGroup = new THREE.Group();
    for (let p = 0; p < 5; p++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.4, 0.2), new THREE.MeshLambertMaterial({ color: 0x78350f }));
      plank.position.set(0, 0.8 + p * 0.6, -10);
      barGroup.add(plank);
    }
    scene.add(barGroup);
    barricadesRef.current = [{ mesh: barGroup, planks: 5, x: 0, z: -10 }];

    // Spawn Zombies
    const spawnZombiesForWave = (w: number) => {
      zombiesRef.current.forEach(z => scene.remove(z.mesh));
      zombiesRef.current = [];

      const count = 5 + w * 3;
      for (let i = 0; i < count; i++) {
        const zGroup = new THREE.Group();
        const zBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.6), new THREE.MeshLambertMaterial({ color: 0x15803d }));
        zBody.position.y = 0.8;
        const zHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial({ color: 0x166534 }));
        zHead.position.y = 1.8;
        zGroup.add(zBody, zHead);

        const zx = (Math.random() - 0.5) * 16;
        const zz = -15 - Math.random() * 25;
        zGroup.position.set(zx, 0, zz);
        scene.add(zGroup);

        zombiesRef.current.push({
          mesh: zGroup,
          x: zx,
          z: zz,
          hp: 40 + w * 10,
          speed: 0.035 + w * 0.005,
          alive: true,
        });
      }
    };

    spawnZombiesForWave(1);

    // Shoot gun
    const shootGun = () => {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      setAmmo(a => {
        if (a <= 1) {
          // Reload
          setTimeout(() => setAmmo(30), 1200);
          return 0;
        }
        return a - 1;
      });

      // Raycast forward from camera
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

      zombiesRef.current.forEach(zombie => {
        if (!zombie.alive) return;
        const intersects = raycaster.intersectObjects(zombie.mesh.children);
        if (intersects.length > 0) {
          const isHeadshot = intersects[0].point.y > 1.4;
          const dmg = isHeadshot ? 100 : 40;
          zombie.hp -= dmg;
          pointsRef.current += isHeadshot ? 100 : 50;
          setPoints(pointsRef.current);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

          if (zombie.hp <= 0) {
            zombie.alive = false;
            scene.remove(zombie.mesh);
          }
        }
      });
    };

    // Repair window
    const repairWindow = () => {
      barricadesRef.current.forEach(bar => {
        if (bar.planks < 5) {
          bar.planks += 1;
          pointsRef.current += 10;
          setPoints(pointsRef.current);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
        }
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'j') {
        shootGun();
      }
      if (e.key === 'f' || e.key === 'e') {
        repairWindow();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Player move
      let moveX = 0;
      let moveZ = 0;
      if (keysRef.current['w'] || keysRef.current['arrowup']) moveZ -= 1;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) moveZ += 1;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) playerYawRef.current += 2.0 * delta;
      if (keysRef.current['d'] || keysRef.current['arrowright']) playerYawRef.current -= 2.0 * delta;

      const speed = 5.0;
      const sin = Math.sin(playerYawRef.current);
      const cos = Math.cos(playerYawRef.current);

      playerPosRef.current.x += (moveX * cos + moveZ * sin) * speed * delta;
      playerPosRef.current.z += (-moveX * sin + moveZ * cos) * speed * delta;

      // Keep inside room
      playerPosRef.current.x = Math.max(-8, Math.min(8, playerPosRef.current.x));
      playerPosRef.current.z = Math.max(-8, Math.min(8, playerPosRef.current.z));

      camera.position.set(playerPosRef.current.x, 1.7, playerPosRef.current.z);
      camera.rotation.y = playerYawRef.current;

      flashlight.position.copy(camera.position);
      flashlight.target.position.set(
        camera.position.x - Math.sin(playerYawRef.current) * 10,
        camera.position.y,
        camera.position.z - Math.cos(playerYawRef.current) * 10
      );

      // Zombie AI
      let allDead = true;
      zombiesRef.current.forEach(z => {
        if (!z.alive) return;
        allDead = false;
        const dx = playerPosRef.current.x - z.x;
        const dz = playerPosRef.current.z - z.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 1.2) {
          z.x += (dx / dist) * z.speed;
          z.z += (dz / dist) * z.speed;
          z.mesh.position.set(z.x, 0, z.z);
          z.mesh.rotation.y = Math.atan2(dx, dz);
        } else {
          setPlayerHp(h => {
            const next = h - 5 * delta;
            if (next <= 0) setIsGameOver(true);
            return Math.max(0, next);
          });
        }
      });

      // Wave Clear Check
      if (allDead && !isGameOver && !isVictory) {
        if (waveRef.current >= 5) {
          setIsVictory(true);
          onReward(240);
        } else {
          waveRef.current += 1;
          setWave(waveRef.current);
          spawnZombiesForWave(waveRef.current);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3');
        }
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
    <div className="relative w-full h-[100dvh] bg-[#05080c] text-white font-mono select-none overflow-hidden flex flex-col">
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
          <span className="text-red-400 bg-red-950/80 px-2 py-1 border border-red-500/40 rounded-sm">
            WAVE {wave}/5
          </span>
          <span className="text-amber-300">POINTS: {points}</span>
          <span className="text-emerald-400">AMMO: {ammo}/30</span>
          <span className="text-rose-300">HP: {Math.round(playerHp)}</span>
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-emerald-400/80 rounded-full" />
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
                // Tap: Fire Gun
                window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            // Double Tap: Repair Barricade
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-red-500/30 rounded-full text-[10px] text-red-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 조준 및 시점 회전 | 탭: 사격 | 더블탭: 바리케이드 수리 (버튼 없음)' : 'Drag: Aim | Tap: Fire | Double Tap: Repair Barricade (No Buttons)'}
        </div>
      </div>

      {/* Victory */}
      {isVictory && (
        <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-6 bg-slate-900 border-2 border-emerald-500 rounded-sm max-w-sm w-full space-y-4">
            <Trophy size={48} className="mx-auto text-emerald-400 animate-bounce" />
            <h2 className="text-2xl font-black text-emerald-400">OUTPOST SURVIVED!</h2>
            <p className="text-xs text-slate-300">
              {language === 'ko'
                ? `5개 웨이브의 모든 변이체 좀비 호드를 저지하고 요새를 사수했습니다!`
                : `All 5 waves cleared! Fortress secured.`}
            </p>
            <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm font-bold">
              +240 SNS POINT EARNED
            </div>
            <button
              onClick={onExit}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-sm text-sm"
            >
              {language === 'ko' ? '보상 수령 및 로비로' : 'CLAIM REWARD & EXIT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default VoxelZombieSurvivalGame;

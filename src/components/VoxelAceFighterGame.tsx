import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rocket, Shield, Crosshair, Zap, Award, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelAceFighterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Missile {
  mesh: THREE.Mesh;
  target: THREE.Object3D | null;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

interface EnemyFighter {
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  isBoss?: boolean;
}

export const VoxelAceFighterGame: React.FC<VoxelAceFighterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [shield, setShield] = useState<number>(100);
  const [maxShield] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [missileStock, setMissileStock] = useState<number>(12);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posY: 10,
    posZ: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    speed: 25,
    boost: false,
    barrelRoll: 0,
    shield: 100,
    maxShield: 100,
    score: 0,
    missileStock: 12,
    keys: { w: false, s: false, a: false, d: false, boost: false, shoot: false, missile: false },
    bullets: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
    missiles: [] as Missile[],
    enemies: [] as EnemyFighter[],
    isGameOver: false,
    isVictory: false,
    shootCooldown: 0
  });

  const fireGun = (scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.shootCooldown > 0) return;
    s.shootCooldown = 0.12;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const bGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 4);
    bGeo.rotateX(Math.PI / 2);
    const bMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    for (let offset of [-0.8, 0.8]) {
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(s.posX + offset, s.posY - 0.2, s.posZ - 2);
      scene.add(bMesh);

      s.bullets.push({
        mesh: bMesh,
        vx: -Math.sin(s.rotY) * 90,
        vy: Math.sin(s.rotX) * 90,
        vz: -Math.cos(s.rotY) * 90,
        life: 2.0
      });
    }
  };

  const fireHomingMissile = (scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.missileStock <= 0) return;
    s.missileStock -= 1;
    setMissileStock(s.missileStock);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Find nearest target ahead
    let bestTarget: THREE.Object3D | null = null;
    let minDist = 200;

    s.enemies.forEach(e => {
      if (!e.alive) return;
      const dz = e.z - s.posZ;
      if (dz < 0 && Math.abs(dz) < minDist) {
        minDist = Math.abs(dz);
        bestTarget = e.group;
      }
    });

    const mGeo = new THREE.ConeGeometry(0.2, 1.5, 6);
    mGeo.rotateX(Math.PI / 2);
    const mMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const mMesh = new THREE.Mesh(mGeo, mMat);
    mMesh.position.set(s.posX, s.posY - 0.5, s.posZ - 2);
    scene.add(mMesh);

    s.missiles.push({
      mesh: mMesh,
      target: bestTarget,
      vx: 0,
      vy: 0,
      vz: -45,
      life: 4.0
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1530);
    scene.fog = new THREE.FogExp2(0x0a1530, 0.008);

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x88aacc, 0.9);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
    sun.position.set(100, 200, 100);
    scene.add(sun);

    // Procedural Cloud & Mountain Terrain Floor
    const terrainGeo = new THREE.PlaneGeometry(800, 1200, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshLambertMaterial({ color: 0x182a4a, flatShading: true });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = -30;
    scene.add(terrain);

    // Jet Fighter Mesh Generator
    const createFighterMesh = (isPlayerJet: boolean) => {
      const jet = new THREE.Group();

      // Fuselage
      const bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 4.5);
      const bodyMat = new THREE.MeshLambertMaterial({ color: isPlayerJet ? 0x2266cc : 0xcc2233 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      jet.add(body);

      // Cockpit Glass
      const cockpitGeo = new THREE.BoxGeometry(0.8, 0.5, 1.5);
      const cockpitMat = new THREE.MeshPhongMaterial({ color: 0x00ffee, transparent: true, opacity: 0.8 });
      const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
      cockpit.position.set(0, 0.5, -0.5);
      jet.add(cockpit);

      // Main Delta Wings
      const wingGeo = new THREE.BoxGeometry(6.5, 0.12, 2.2);
      const wingMat = new THREE.MeshLambertMaterial({ color: isPlayerJet ? 0x1a4a8a : 0x991122 });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      wings.position.set(0, 0, 0.2);
      jet.add(wings);

      // Vertical Stabilizers
      const finGeo = new THREE.BoxGeometry(0.12, 1.4, 1.2);
      const finMat = new THREE.MeshLambertMaterial({ color: isPlayerJet ? 0x3388ff : 0xff4455 });
      const finL = new THREE.Mesh(finGeo, finMat);
      finL.position.set(-1.2, 0.8, 1.5);
      finL.rotation.z = -0.2;
      jet.add(finL);

      const finR = new THREE.Mesh(finGeo, finMat);
      finR.position.set(1.2, 0.8, 1.5);
      finR.rotation.z = 0.2;
      jet.add(finR);

      // Engine Thruster Glow
      const thrusterGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.6, 8);
      thrusterGeo.rotateX(Math.PI / 2);
      const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
      thruster.position.set(0, 0, 2.3);
      jet.add(thruster);

      return jet;
    };

    const playerFighter = createFighterMesh(true);
    scene.add(playerFighter);

    // Spawn 8 Enemy Jets + 1 Massive Aerial Leviathan Boss
    for (let i = 0; i < 8; i++) {
      const eJet = createFighterMesh(false);
      const spawnZ = -60 - i * 40;
      const spawnX = (Math.random() - 0.5) * 60;
      const spawnY = 5 + Math.random() * 20;
      eJet.position.set(spawnX, spawnY, spawnZ);
      scene.add(eJet);

      gameStateRef.current.enemies.push({
        group: eJet,
        x: spawnX,
        y: spawnY,
        z: spawnZ,
        hp: 40,
        maxHp: 40,
        alive: true
      });
    }

    // Boss Aerial Battleship
    const bossGroup = new THREE.Group();
    const bHull = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 24), new THREE.MeshLambertMaterial({ color: 0x331122 }));
    bossGroup.add(bHull);
    const bCore = new THREE.Mesh(new THREE.OctahedronGeometry(3), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
    bCore.position.y = 4;
    bossGroup.add(bCore);
    bossGroup.position.set(0, 25, -450);
    scene.add(bossGroup);

    gameStateRef.current.enemies.push({
      group: bossGroup,
      x: 0,
      y: 25,
      z: -450,
      hp: 300,
      maxHp: 300,
      alive: true,
      isBoss: true
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === 'shift') gameStateRef.current.keys.boost = true;
      if (k === ' ' || k === 'j') fireGun(scene);
      if (k === 'k' || k === 'e') fireHomingMissile(scene);
      if (k === 'q') gameStateRef.current.barrelRoll = Math.PI * 2;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
      if (k === 'shift') gameStateRef.current.keys.boost = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (s.shootCooldown > 0) s.shootCooldown -= dt;

      if (!s.isGameOver && !s.isVictory) {
        // Boost & Flight Speeds
        const curSpeed = s.keys.boost ? 50 : 28;
        s.posZ -= curSpeed * dt;

        // Steering Pitch & Yaw
        if (s.keys.w) s.posY += 20 * dt;
        if (s.keys.s) s.posY -= 20 * dt;
        if (s.keys.a) s.posX -= 25 * dt;
        if (s.keys.d) s.posX += 25 * dt;

        // Pitch & Roll visual banking
        const targetRotZ = s.keys.a ? 0.6 : s.keys.d ? -0.6 : 0;
        s.rotZ += (targetRotZ - s.rotZ) * 6 * dt;

        if (s.barrelRoll > 0) {
          s.barrelRoll = Math.max(0, s.barrelRoll - 10 * dt);
          s.rotZ += s.barrelRoll;
        }

        playerFighter.position.set(s.posX, s.posY, s.posZ);
        playerFighter.rotation.z = s.rotZ;
        playerFighter.rotation.x = s.keys.w ? 0.2 : s.keys.s ? -0.2 : 0;

        // Smooth 3rd person chase camera
        camera.position.set(s.posX, s.posY + 4, s.posZ + 12);
        camera.lookAt(s.posX, s.posY, s.posZ - 20);

        // Infinite terrain loop follow
        terrain.position.z = s.posZ - 100;

        // Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.mesh.position.x += b.vx * dt;
          b.mesh.position.y += b.vy * dt;
          b.mesh.position.z += b.vz * dt;
          b.life -= dt;

          let hit = false;
          s.enemies.forEach(e => {
            if (!e.alive || hit) return;
            const dist = b.mesh.position.distanceTo(e.group.position);
            const hitbox = e.isBoss ? 8 : 3.5;
            if (dist < hitbox) {
              hit = true;
              e.hp -= 15;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
              if (e.hp <= 0) {
                e.alive = false;
                scene.remove(e.group);
                s.score += e.isBoss ? 300 : 50;
                setScore(s.score);

                if (e.isBoss) {
                  s.isVictory = true;
                  setIsVictory(true);
                  const reward = 70 + Math.floor(s.score / 10);
                  setRewardSns(reward);
                  onReward(reward);
                }
              }
            }
          });

          if (hit || b.life <= 0) {
            scene.remove(b.mesh);
            s.bullets.splice(i, 1);
          }
        }

        // Missiles Homing
        for (let i = s.missiles.length - 1; i >= 0; i--) {
          const m = s.missiles[i];
          if (m.target && m.target.parent) {
            const dir = new THREE.Vector3().subVectors(m.target.position, m.mesh.position).normalize();
            m.vx += (dir.x * 55 - m.vx) * 4 * dt;
            m.vy += (dir.y * 55 - m.vy) * 4 * dt;
            m.vz += (dir.z * 55 - m.vz) * 4 * dt;
          }
          m.mesh.position.x += m.vx * dt;
          m.mesh.position.y += m.vy * dt;
          m.mesh.position.z += m.vz * dt;
          m.life -= dt;

          let hit = false;
          s.enemies.forEach(e => {
            if (!e.alive || hit) return;
            const dist = m.mesh.position.distanceTo(e.group.position);
            const hitbox = e.isBoss ? 9 : 4.5;
            if (dist < hitbox) {
              hit = true;
              e.hp -= 65;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              if (e.hp <= 0) {
                e.alive = false;
                scene.remove(e.group);
                s.score += e.isBoss ? 300 : 50;
                setScore(s.score);
                if (e.isBoss) {
                  s.isVictory = true;
                  setIsVictory(true);
                  const reward = 70 + Math.floor(s.score / 10);
                  setRewardSns(reward);
                  onReward(reward);
                }
              }
            }
          });

          if (hit || m.life <= 0) {
            scene.remove(m.mesh);
            s.missiles.splice(i, 1);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white select-none overflow-hidden flex flex-col font-sans">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Top Flight HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Shield & Missile Count */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1.5">
            <Shield size={16} className="text-sky-400" />
            <div className="w-20 sm:w-28 h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400 transition-all" style={{ width: `${(shield / maxShield) * 100}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-sky-400">{shield}</span>
          </div>

          <div className="flex items-center gap-1 text-orange-400 text-xs font-bold">
            <Rocket size={14} />
            <span>{missileStock} MISSILES</span>
          </div>

          <div className="text-yellow-400 text-xs font-bold">
            SCORE: {score}
          </div>
        </div>
      </div>

      {/* Center Targeting Reticle HUD */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-cyan-400/40 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-2 h-2 bg-cyan-400 rounded-full" />
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      <div
        className="absolute inset-0 z-10 select-none touch-none"
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

            if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
              moved = true;
              gameStateRef.current.keys.w = dy < -12;
              gameStateRef.current.keys.s = dy > 12;
              gameStateRef.current.keys.a = dx < -12;
              gameStateRef.current.keys.d = dx > 12;
            }
          };

          const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            gameStateRef.current.keys.w = false;
            gameStateRef.current.keys.s = false;
            gameStateRef.current.keys.a = false;
            gameStateRef.current.keys.d = false;

            if (!moved) {
              // Tap: Fire Gun
              const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
              if (scene) fireGun(scene);
            }
          };

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
          window.addEventListener('pointercancel', onUp);
        }}
        onDoubleClick={() => {
          const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
          if (scene) fireHomingMissile(scene);
        }}
      />

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 비행 | 탭: 기관포 | 더블탭: 유도탄 (화면 버튼 없음)' : 'Drag: Fly | Tap: Fire Cannon | Double Tap: Missile (No Buttons)'}
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '창공의 발키리 VICTORY' : '격추 완료! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '공중 거대 요새 레비아탄을 격파하고 제공권을 장악했습니다!'
                : '적기들의 집중 요격으로 기체가 손상되었습니다.'}
            </p>

            {isVictory && (
              <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-2xl">
                <span className="text-xs text-slate-400 block uppercase font-bold">REWARD</span>
                <span className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
                  <Sparkles size={20} /> +{rewardSns} SNS
                </span>
              </div>
            )}

            <button
              onClick={onExit}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              {language === 'ko' ? '확인 및 나가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

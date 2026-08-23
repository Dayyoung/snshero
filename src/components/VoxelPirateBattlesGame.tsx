import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Shield, Target, Crosshair, ArrowLeft, Trophy, Zap, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelPirateBattlesGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Cannonball {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  isPlayer: boolean;
}

interface PirateShip {
  group: THREE.Group;
  x: number;
  z: number;
  rotY: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  shootTimer: number;
}

export const VoxelPirateBattlesGame: React.FC<VoxelPirateBattlesGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hp, setHp] = useState<number>(100);
  const [maxHp] = useState<number>(100);
  const [gold, setGold] = useState<number>(0);
  const [sunkCount, setSunkCount] = useState<number>(0);
  const [windAngle, setWindAngle] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    playerX: 0,
    playerZ: 0,
    playerRotY: 0,
    playerSpeed: 0,
    hp: 100,
    maxHp: 100,
    gold: 0,
    sunkCount: 0,
    windAngle: 0,
    keys: { w: false, s: false, a: false, d: false, q: false, e: false },
    cannonballs: [] as Cannonball[],
    enemies: [] as PirateShip[],
    isGameOver: false,
    isVictory: false,
    cooldownLeft: 0,
    cooldownRight: 0
  });

  const fireCannons = (side: 'left' | 'right') => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory) return;
    if (side === 'left' && s.cooldownLeft > 0) return;
    if (side === 'right' && s.cooldownRight > 0) return;

    if (side === 'left') s.cooldownLeft = 1.2;
    else s.cooldownRight = 1.2;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const angleOffset = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    const fireAngle = s.playerRotY + angleOffset;
    const ballGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    for (let i = -1; i <= 1; i++) {
      const ball = new THREE.Mesh(ballGeo, ballMat);
      const spread = i * 0.1;
      const spawnX = s.playerX + Math.sin(fireAngle + spread) * 1.5;
      const spawnZ = s.playerZ + Math.cos(fireAngle + spread) * 1.5;
      ball.position.set(spawnX, 1.0, spawnZ);

      const speed = 25;
      s.cannonballs.push({
        mesh: ball,
        vx: Math.sin(fireAngle + spread) * speed,
        vy: 3,
        vz: Math.cos(fireAngle + spread) * speed,
        isPlayer: true
      });
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x225588);
    scene.fog = new THREE.FogExp2(0x225588, 0.015);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    if (!lowSpecMode) renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.7);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    sun.castShadow = !lowSpecMode;
    scene.add(sun);

    // Ocean Mesh with wavy animation
    const oceanGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0x005577,
      transparent: true,
      opacity: 0.85,
      shininess: 90,
      flatShading: true
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    scene.add(ocean);

    // Treasure Island
    const islandGeo = new THREE.CylinderGeometry(8, 12, 3, 16);
    const islandMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, 0.5, -80);
    scene.add(island);

    // Palm Tree on island
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 3, -80);
    scene.add(trunk);

    const leavesGeo = new THREE.ConeGeometry(2.5, 2, 6);
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.set(0, 5.5, -80);
    scene.add(leaves);

    // Treasure Chest
    const chestGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    const chestMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 2.2, -78);
    scene.add(chest);

    // Create Ship Helper
    const createShipMesh = (isPlayerShip: boolean) => {
      const ship = new THREE.Group();

      // Hull
      const hullGeo = new THREE.BoxGeometry(2, 1.2, 4.5);
      const hullMat = new THREE.MeshLambertMaterial({ color: isPlayerShip ? 0x8b4513 : 0x2f4f4f });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.position.y = 0.6;
      ship.add(hull);

      // Deck Cabin
      const cabinGeo = new THREE.BoxGeometry(1.6, 1, 1.5);
      const cabinMat = new THREE.MeshLambertMaterial({ color: isPlayerShip ? 0xa0522d : 0x1c1c1c });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.4, -1.2);
      ship.add(cabin);

      // Mast
      const mastGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
      const mastMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(0, 2.8, 0.3);
      ship.add(mast);

      // Sail
      const sailGeo = new THREE.PlaneGeometry(2.8, 2.2);
      const sailMat = new THREE.MeshLambertMaterial({
        color: isPlayerShip ? 0xffffff : 0xcc2222,
        side: THREE.DoubleSide
      });
      const sail = new THREE.Mesh(sailGeo, sailMat);
      sail.position.set(0, 3.2, 0.4);
      ship.add(sail);

      // Pirate Flag
      const flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
      const flagMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(0.4, 5.1, 0.3);
      ship.add(flag);

      return ship;
    };

    const playerShip = createShipMesh(true);
    scene.add(playerShip);

    // Spawn 5 Enemy Pirate Ships
    const enemyPositions = [
      { x: -35, z: -30 },
      { x: 40, z: -45 },
      { x: -25, z: -70 },
      { x: 30, z: -90 },
      { x: 0, z: -110 }
    ];

    enemyPositions.forEach(pos => {
      const eMesh = createShipMesh(false);
      eMesh.position.set(pos.x, 0, pos.z);
      scene.add(eMesh);
      gameStateRef.current.enemies.push({
        group: eMesh,
        x: pos.x,
        z: pos.z,
        rotY: Math.random() * Math.PI * 2,
        hp: 60,
        maxHp: 60,
        alive: true,
        shootTimer: Math.random() * 2 + 1
      });
    });

    // Key handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === 'q') fireCannons('left');
      if (k === 'e') fireCannons('right');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();
      const s = gameStateRef.current;

      if (s.cooldownLeft > 0) s.cooldownLeft -= dt;
      if (s.cooldownRight > 0) s.cooldownRight -= dt;

      // Animate ocean waves
      const posAttr = oceanGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getZ(i);
        const wave = Math.sin(u * 0.1 + time * 1.5) * 0.4 + Math.cos(v * 0.1 + time * 1.2) * 0.4;
        posAttr.setY(i, wave);
      }
      posAttr.needsUpdate = true;

      if (!s.isGameOver && !s.isVictory) {
        // Player Ship Movement & Steering
        if (s.keys.a) s.playerRotY += 1.5 * dt;
        if (s.keys.d) s.playerRotY -= 1.5 * dt;
        if (s.keys.w) s.playerSpeed = Math.min(s.playerSpeed + 8 * dt, 14);
        else if (s.keys.s) s.playerSpeed = Math.max(s.playerSpeed - 12 * dt, 0);
        else s.playerSpeed = Math.max(s.playerSpeed - 3 * dt, 0);

        s.playerX += Math.sin(s.playerRotY) * s.playerSpeed * dt;
        s.playerZ += Math.cos(s.playerRotY) * s.playerSpeed * dt;

        // Wave bobbing
        const waveHeight = Math.sin(s.playerX * 0.1 + time * 1.5) * 0.3;
        playerShip.position.set(s.playerX, waveHeight, s.playerZ);
        playerShip.rotation.y = s.playerRotY;
        playerShip.rotation.z = Math.sin(time * 2) * 0.05 + (s.keys.a ? 0.05 : s.keys.d ? -0.05 : 0);
        playerShip.rotation.x = Math.cos(time * 1.5) * 0.03;

        // Follow Camera
        const camDist = 14;
        const camHeight = 7;
        camera.position.x = s.playerX - Math.sin(s.playerRotY) * camDist;
        camera.position.z = s.playerZ - Math.cos(s.playerRotY) * camDist;
        camera.position.y = waveHeight + camHeight;
        camera.lookAt(s.playerX, waveHeight + 2, s.playerZ);

        // Wind angle drift
        s.windAngle = Math.sin(time * 0.2) * Math.PI;
        setWindAngle(Math.round((s.windAngle * 180) / Math.PI));

        // Treasure Island Reach check
        const distToIsland = Math.hypot(s.playerX - 0, s.playerZ - (-80));
        if (distToIsland < 12 && s.sunkCount >= 3) {
          s.isVictory = true;
          setIsVictory(true);
          const reward = 50 + s.gold * 2;
          setRewardSns(reward);
          onReward(reward);
        }

        // Enemy Ship AI
        s.enemies.forEach(enemy => {
          if (!enemy.alive) return;

          const dx = s.playerX - enemy.x;
          const dz = s.playerZ - enemy.z;
          const dist = Math.hypot(dx, dz);

          // Aim & Steer toward player
          const targetAngle = Math.atan2(dx, dz);
          enemy.rotY += (targetAngle - enemy.rotY) * 0.8 * dt;

          if (dist > 20) {
            enemy.x += Math.sin(enemy.rotY) * 6 * dt;
            enemy.z += Math.cos(enemy.rotY) * 6 * dt;
          }

          const eWave = Math.sin(enemy.x * 0.1 + time * 1.5) * 0.3;
          enemy.group.position.set(enemy.x, eWave, enemy.z);
          enemy.group.rotation.y = enemy.rotY;

          // Enemy shoot
          enemy.shootTimer -= dt;
          if (enemy.shootTimer <= 0 && dist < 45) {
            enemy.shootTimer = 2.5 + Math.random() * 1.5;
            const eBall = new THREE.Mesh(
              new THREE.SphereGeometry(0.25, 8, 8),
              new THREE.MeshLambertMaterial({ color: 0xcc2222 })
            );
            eBall.position.set(enemy.x, 1, enemy.z);
            scene.add(eBall);
            const shootSpeed = 20;
            s.cannonballs.push({
              mesh: eBall,
              vx: (dx / dist) * shootSpeed,
              vy: 2,
              vz: (dz / dist) * shootSpeed,
              isPlayer: false
            });
          }
        });

        // Update Cannonballs
        for (let i = s.cannonballs.length - 1; i >= 0; i--) {
          const ball = s.cannonballs[i];
          if (!ball.mesh.parent) scene.add(ball.mesh);

          ball.mesh.position.x += ball.vx * dt;
          ball.mesh.position.y += ball.vy * dt;
          ball.mesh.position.z += ball.vz * dt;
          ball.vy -= 9.8 * dt; // gravity

          // Splash into ocean
          if (ball.mesh.position.y < 0) {
            scene.remove(ball.mesh);
            s.cannonballs.splice(i, 1);
            continue;
          }

          // Hit Player
          if (!ball.isPlayer) {
            const hitDist = Math.hypot(ball.mesh.position.x - s.playerX, ball.mesh.position.z - s.playerZ);
            if (hitDist < 2.5 && ball.mesh.position.y < 3) {
              scene.remove(ball.mesh);
              s.cannonballs.splice(i, 1);
              s.hp = Math.max(0, s.hp - 15);
              setHp(s.hp);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              if (s.hp <= 0) {
                s.isGameOver = true;
                setIsGameOver(true);
              }
              continue;
            }
          }

          // Hit Enemy
          if (ball.isPlayer) {
            s.enemies.forEach(enemy => {
              if (!enemy.alive) return;
              const hitDist = Math.hypot(ball.mesh.position.x - enemy.x, ball.mesh.position.z - enemy.z);
              if (hitDist < 3.0 && ball.mesh.position.y < 3.5) {
                scene.remove(ball.mesh);
                s.cannonballs.splice(i, 1);
                enemy.hp -= 25;
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                if (enemy.hp <= 0) {
                  enemy.alive = false;
                  scene.remove(enemy.group);
                  s.sunkCount += 1;
                  s.gold += 30;
                  setSunkCount(s.sunkCount);
                  setGold(s.gold);
                }
              }
            });
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
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Top HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Ship HP & Gold Stats */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1.5">
            <Shield size={16} className="text-emerald-400" />
            <div className="w-20 sm:w-28 h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(hp / maxHp) * 100}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{hp}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
            <span>🪙 {gold}</span>
          </div>

          <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
            <Crosshair size={14} />
            <span>{sunkCount}/5 Sunk</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-sky-950/80 border border-sky-600/40 px-2.5 py-1 rounded-xl text-sky-300 text-xs font-bold">
          <Compass size={14} className="animate-spin" />
          <span>Wind {windAngle}°</span>
        </div>
      </div>

      {/* Crosshair / Firing Guide Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-red-400 rounded-full" />
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isVictory && (
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
                gameStateRef.current.keys.w = dy < -8;
                gameStateRef.current.keys.s = dy > 12;
                gameStateRef.current.keys.a = dx < -10;
                gameStateRef.current.keys.d = dx > 10;
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
                // Tap: Fire broadside cannon depending on left or right half of screen
                if (startX < rect.width / 2) {
                  fireCannons('left');
                } else {
                  fireCannons('right');
                }
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
        <div className="px-3 py-1 bg-black/70 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 함선 조타 항해 | 좌/우측 탭: 좌/우현 일제 사격 (버튼 없음)' : 'Drag: Steer Ship | Tap Left/Right: Port/Starboard Broadside (No Buttons)'}
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Zap size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '대항해시대 제패! VICTORY' : '함선 침몰! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '모든 적 해적선을 격파하고 고대 보물섬을 정복했습니다!'
                : '적들의 포격으로 선체가 파괴되었습니다.'}
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

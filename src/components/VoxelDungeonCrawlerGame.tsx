import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Swords, Shield, Heart, Zap, Sparkles, Trophy, RotateCcw, ArrowLeft, Crosshair, Award } from 'lucide-react';
import { CardData } from '../types';

interface VoxelDungeonCrawlerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface DungeonEnemy {
  mesh: THREE.Group;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  isBoss?: boolean;
  alive: boolean;
  attackCooldown: number;
}

export const VoxelDungeonCrawlerGame: React.FC<VoxelDungeonCrawlerGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [floor, setFloor] = useState<number>(1);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerMaxHp] = useState<number>(100);
  const [playerStamina, setPlayerStamina] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [relicCount, setRelicCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [comboCount, setComboCount] = useState<number>(0);
  const [activeRelic, setActiveRelic] = useState<string>('블러드 블레이드 (흡혈 +10%)');

  const playerPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const playerAngleRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const enemiesRef = useRef<DungeonEnemy[]>([]);
  const isAttackingRef = useRef<boolean>(false);
  const isDashingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number>(0);
  const currentFloorRef = useRef<number>(1);
  const scoreRef = useRef<number>(0);

  const heroCard = deck[0] || { name: 'Kadan', element: 'fire', attack: 85 };

  // Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d14);
    scene.fog = new THREE.FogExp2(0x0b0d14, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 22, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404466, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.5);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // Player Torch Point Light
    const playerLight = new THREE.PointLight(0xffaa44, 2.5, 18);
    playerLight.position.set(0, 3, 0);
    scene.add(playerLight);

    // Dungeon Floor & Walls Generator
    const dungeonGroup = new THREE.Group();
    scene.add(dungeonGroup);

    const buildFloorMap = (floorNum: number) => {
      while (dungeonGroup.children.length > 0) {
        dungeonGroup.remove(dungeonGroup.children[0]);
      }

      // Floor tiles
      const floorGeo = new THREE.BoxGeometry(2, 0.4, 2);
      const floorMat1 = new THREE.MeshLambertMaterial({ color: 0x1f2438 });
      const floorMat2 = new THREE.MeshLambertMaterial({ color: 0x181c2e });
      const wallMat = new THREE.MeshLambertMaterial({ color: 0x333b5c });
      const wallGeo = new THREE.BoxGeometry(2, 4, 2);

      const mapSize = 24;
      for (let x = -mapSize / 2; x <= mapSize / 2; x += 2) {
        for (let z = -mapSize / 2; z <= mapSize / 2; z += 2) {
          const isBorder = Math.abs(x) === mapSize / 2 || Math.abs(z) === mapSize / 2;
          const isPillar = (x % 6 === 0 && z % 6 === 0) && Math.abs(x) > 4 && Math.abs(z) > 4;

          if (isBorder || isPillar) {
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(x, 2, z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            dungeonGroup.add(wall);
          } else {
            const mat = (Math.abs(x + z) / 2) % 2 === 0 ? floorMat1 : floorMat2;
            const tile = new THREE.Mesh(floorGeo, mat);
            tile.position.set(x, -0.2, z);
            tile.receiveShadow = true;
            dungeonGroup.add(tile);
          }
        }
      }

      // Spawn portal / exit at far end
      const portalGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
      const portalMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
      const portal = new THREE.Mesh(portalGeo, portalMat);
      portal.position.set(0, 0.1, -mapSize / 2 + 3);
      dungeonGroup.add(portal);

      // Spawn Enemies
      enemiesRef.current.forEach(e => scene.remove(e.mesh));
      enemiesRef.current = [];

      const enemyCount = floorNum === 10 ? 1 : 4 + floorNum * 2;
      for (let i = 0; i < enemyCount; i++) {
        const isBoss = floorNum === 10 || (floorNum % 3 === 0 && i === 0);
        const enemyGroup = new THREE.Group();

        const bodyGeo = new THREE.BoxGeometry(isBoss ? 2.5 : 1.2, isBoss ? 3.5 : 1.8, isBoss ? 2.5 : 1.2);
        const bodyMat = new THREE.MeshLambertMaterial({ color: isBoss ? 0xdc2626 : 0x7c3aed });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = (isBoss ? 3.5 : 1.8) / 2;
        body.castShadow = true;
        enemyGroup.add(body);

        // Eyes
        const eyeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.3, isBoss ? 2.8 : 1.3, isBoss ? 1.3 : 0.65);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.3, isBoss ? 2.8 : 1.3, isBoss ? 1.3 : 0.65);
        enemyGroup.add(leftEye, rightEye);

        const spawnDist = 6 + Math.random() * 5;
        const angle = Math.random() * Math.PI * 2;
        const ex = Math.cos(angle) * spawnDist;
        const ez = Math.sin(angle) * spawnDist;

        enemyGroup.position.set(ex, 0, ez);
        scene.add(enemyGroup);

        enemiesRef.current.push({
          mesh: enemyGroup,
          x: ex,
          z: ez,
          hp: isBoss ? 300 + floorNum * 50 : 40 + floorNum * 15,
          maxHp: isBoss ? 300 + floorNum * 50 : 40 + floorNum * 15,
          speed: isBoss ? 0.045 : 0.065,
          isBoss,
          alive: true,
          attackCooldown: 0,
        });
      }
    };

    // Player Voxel Avatar
    const playerMesh = new THREE.Group();
    const heroBodyGeo = new THREE.BoxGeometry(1, 1.4, 0.7);
    const heroBodyMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
    const heroBody = new THREE.Mesh(heroBodyGeo, heroBodyMat);
    heroBody.position.y = 0.9;
    heroBody.castShadow = true;
    playerMesh.add(heroBody);

    const heroHeadGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const heroHeadMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
    const heroHead = new THREE.Mesh(heroHeadGeo, heroHeadMat);
    heroHead.position.y = 1.9;
    heroHead.castShadow = true;
    playerMesh.add(heroHead);

    // Sword
    const swordGeo = new THREE.BoxGeometry(0.2, 1.8, 0.3);
    const swordMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const sword = new THREE.Mesh(swordGeo, swordMat);
    sword.position.set(0.7, 1.1, 0.5);
    sword.rotation.x = Math.PI / 4;
    playerMesh.add(sword);

    // Shield
    const shieldGeo = new THREE.BoxGeometry(0.15, 0.9, 0.7);
    const shieldMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(-0.6, 1.0, 0.2);
    playerMesh.add(shield);

    scene.add(playerMesh);

    buildFloorMap(1);

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'j') {
        performAttack();
      }
      if (e.key === 'Shift' || e.key === 'k') {
        performDash();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Attack Action
    const performAttack = () => {
      if (isAttackingRef.current) return;
      isAttackingRef.current = true;
      sword.rotation.x = -Math.PI / 3;
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Check hits
      const px = playerPosRef.current.x;
      const pz = playerPosRef.current.z;
      const pAngle = playerAngleRef.current;

      let hitCount = 0;
      enemiesRef.current.forEach(enemy => {
        if (!enemy.alive) return;
        const dx = enemy.x - px;
        const dz = enemy.z - pz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 3.2) {
          hitCount++;
          const dmg = 35 + Math.floor(Math.random() * 15);
          enemy.hp -= dmg;
          enemy.mesh.position.x += Math.sin(pAngle) * 1.2;
          enemy.mesh.position.z += Math.cos(pAngle) * 1.2;

          // Flash red
          const bodyMesh = enemy.mesh.children[0] as THREE.Mesh;
          if (bodyMesh && bodyMesh.material) {
            (bodyMesh.material as THREE.MeshLambertMaterial).color.setHex(0xffffff);
            setTimeout(() => {
              if (enemy.alive) {
                (bodyMesh.material as THREE.MeshLambertMaterial).color.setHex(enemy.isBoss ? 0xdc2626 : 0x7c3aed);
              }
            }, 100);
          }

          if (enemy.hp <= 0) {
            enemy.alive = false;
            scene.remove(enemy.mesh);
            scoreRef.current += enemy.isBoss ? 200 : 50;
            setScore(scoreRef.current);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }
        }
      });

      if (hitCount > 0) {
        setComboCount(c => c + hitCount);
      }

      setTimeout(() => {
        sword.rotation.x = Math.PI / 4;
        isAttackingRef.current = false;
      }, 220);
    };

    // Dash Action
    const performDash = () => {
      if (isDashingRef.current) return;
      isDashingRef.current = true;
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
      const pAngle = playerAngleRef.current;
      playerPosRef.current.x += Math.sin(pAngle) * 4;
      playerPosRef.current.z += Math.cos(pAngle) * 4;
      setTimeout(() => {
        isDashingRef.current = false;
      }, 350);
    };

    // Main Game Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Player Movement
      let moveX = 0;
      let moveZ = 0;
      if (keysRef.current['w'] || keysRef.current['arrowup']) moveZ -= 1;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) moveZ += 1;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) moveX -= 1;
      if (keysRef.current['d'] || keysRef.current['arrowright']) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const speed = 8.5;
        playerPosRef.current.x += (moveX / len) * speed * delta;
        playerPosRef.current.z += (moveZ / len) * speed * delta;

        playerAngleRef.current = Math.atan2(moveX, moveZ);
        playerMesh.rotation.y = playerAngleRef.current;

        // Walking bob
        playerMesh.position.y = Math.abs(Math.sin(time * 0.012)) * 0.2;
      }

      // Constrain inside room
      playerPosRef.current.x = Math.max(-10, Math.min(10, playerPosRef.current.x));
      playerPosRef.current.z = Math.max(-10, Math.min(10, playerPosRef.current.z));

      playerMesh.position.x = playerPosRef.current.x;
      playerMesh.position.z = playerPosRef.current.z;

      playerLight.position.x = playerPosRef.current.x;
      playerLight.position.z = playerPosRef.current.z;

      // Camera Follow Smoothly
      camera.position.x += (playerPosRef.current.x - camera.position.x) * 0.1;
      camera.position.z += (playerPosRef.current.z + 18 - camera.position.z) * 0.1;
      camera.lookAt(playerPosRef.current.x, 0, playerPosRef.current.z);

      // Check Portal Trigger (Next Floor)
      const distToPortal = Math.sqrt(
        Math.pow(playerPosRef.current.x - 0, 2) + Math.pow(playerPosRef.current.z - (-9), 2)
      );
      const allEnemiesCleared = enemiesRef.current.every(e => !e.alive);
      if (distToPortal < 2.0 && allEnemiesCleared) {
        if (currentFloorRef.current >= 10) {
          setIsVictory(true);
          onReward(250);
        } else {
          currentFloorRef.current += 1;
          setFloor(currentFloorRef.current);
          setRelicCount(r => r + 1);
          playerPosRef.current = { x: 0, z: 8 };
          buildFloorMap(currentFloorRef.current);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3');
        }
      }

      // Enemy AI & Updates
      enemiesRef.current.forEach(enemy => {
        if (!enemy.alive) return;
        const dx = playerPosRef.current.x - enemy.x;
        const dz = playerPosRef.current.z - enemy.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 1.2) {
          enemy.x += (dx / dist) * enemy.speed;
          enemy.z += (dz / dist) * enemy.speed;
          enemy.mesh.position.x = enemy.x;
          enemy.mesh.position.z = enemy.z;
          enemy.mesh.rotation.y = Math.atan2(dx, dz);
        } else {
          // Attack player
          enemy.attackCooldown -= delta;
          if (enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 1.2;
            setPlayerHp(prev => {
              const next = prev - (enemy.isBoss ? 25 : 10);
              if (next <= 0) {
                setIsGameOver(true);
              }
              return Math.max(0, next);
            });
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
          }
        }
      });

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

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
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, playSfx, onReward]);

  const handleMobileAttack = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
  };

  const handleMobileDash = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0b0d14] text-[#fdfcfc] font-mono select-none overflow-hidden flex flex-col">
      {/* Top Header HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-sm text-xs font-bold transition-all border border-white/15"
        >
          <ArrowLeft size={14} />
          {language === 'ko' ? '로비로' : 'LOBBY'}
        </button>

        {/* Floor & Hero Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/40 rounded-sm">
            <Shield size={14} className="text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300">
              {language === 'ko' ? `지하 ${floor}층 / 10층` : `B${floor}F / 10F`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-24 h-3 bg-red-950 rounded-full overflow-hidden border border-red-500/40">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-200"
                style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
              />
            </div>
            <span className="text-xs text-red-300 font-bold">{playerHp} HP</span>
          </div>
        </div>

        {/* Score & Combo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-300 font-bold bg-amber-950/60 px-2 py-1 border border-amber-500/30 rounded-sm">
            SCORE: {score}
          </span>
          {comboCount > 0 && (
            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-1 border border-emerald-500/30 rounded-sm animate-pulse">
              {comboCount} HIT!
            </span>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full flex-1 touch-none" />

      {/* Active Relic Badge */}
      <div className="absolute top-14 left-3 z-20 px-2.5 py-1 bg-purple-950/80 border border-purple-500/40 rounded-sm text-[11px] text-purple-300 flex items-center gap-1.5">
        <Sparkles size={12} className="text-purple-400" />
        <span>유물: {activeRelic}</span>
      </div>

      {/* Mobile Virtual Controls */}
      <div className="absolute bottom-6 left-0 right-0 z-20 px-4 flex items-center justify-between pointer-events-none">
        {/* Virtual D-Pad */}
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

        {/* Action Buttons (Attack, Dash) */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={handleMobileDash}
            className="w-14 h-14 bg-amber-600/80 active:bg-amber-500 border border-amber-400 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold shadow-lg"
          >
            <Zap size={18} />
            <span className="text-[9px]">DASH</span>
          </button>
          <button
            onClick={handleMobileAttack}
            className="w-16 h-16 bg-rose-600/90 active:bg-rose-500 border border-rose-400 rounded-full flex flex-col items-center justify-center text-white text-sm font-bold shadow-xl animate-pulse"
          >
            <Swords size={22} />
            <span className="text-[10px]">SLASH</span>
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-6 bg-slate-900 border-2 border-red-500 rounded-sm max-w-sm w-full space-y-4">
            <h2 className="text-2xl font-black text-red-400">YOU PERISHED</h2>
            <p className="text-xs text-slate-300">
              {language === 'ko'
                ? `지하 ${floor}층에서 쓰러졌습니다. 점수: ${score}`
                : `Fallen on Floor ${floor}. Score: ${score}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsGameOver(false);
                  setFloor(1);
                  setPlayerHp(100);
                  setScore(0);
                  currentFloorRef.current = 1;
                  scoreRef.current = 0;
                  playerPosRef.current = { x: 0, z: 0 };
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm text-xs"
              >
                {language === 'ko' ? '다시 도전' : 'RETRY'}
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-sm text-xs border border-white/20"
              >
                {language === 'ko' ? '나가기' : 'EXIT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {isVictory && (
        <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-6 bg-slate-900 border-2 border-amber-500 rounded-sm max-w-sm w-full space-y-4">
            <Trophy size={48} className="mx-auto text-yellow-400 animate-bounce" />
            <h2 className="text-2xl font-black text-yellow-400">LABYRINTH CONQUERED!</h2>
            <p className="text-xs text-slate-300">
              {language === 'ko'
                ? `지하 10층 심연의 드래곤을 토벌하였습니다! 최종 점수: ${score}`
                : `Abyssal Dragon Defeated! Final Score: ${score}`}
            </p>
            <div className="p-2 bg-amber-950/60 border border-amber-500/40 text-amber-300 text-sm font-bold">
              +250 SNS POINT EARNED
            </div>
            <button
              onClick={onExit}
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-sm text-sm"
            >
              {language === 'ko' ? '보상 수령 및 로비로' : 'CLAIM REWARD & EXIT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default VoxelDungeonCrawlerGame;

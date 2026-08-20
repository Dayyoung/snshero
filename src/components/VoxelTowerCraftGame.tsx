import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Crosshair, Flame, Zap, Award, ArrowLeft, Trophy, Sparkles, Hammer } from 'lucide-react';
import { CardData } from '../types';

interface VoxelTowerCraftGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Tower {
  mesh: THREE.Group;
  gx: number;
  gz: number;
  type: 'flame' | 'ice' | 'tesla' | 'railgun';
  range: number;
  damage: number;
  cooldown: number;
  timer: number;
}

interface EnemyMob {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  alive: boolean;
  pathIndex: number;
}

export const VoxelTowerCraftGame: React.FC<VoxelTowerCraftGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [coreHp, setCoreHp] = useState<number>(100);
  const [energy, setEnergy] = useState<number>(150);
  const [wave, setWave] = useState<number>(1);
  const [maxWave] = useState<number>(5);
  const [selectedTowerType, setSelectedTowerType] = useState<'flame' | 'ice' | 'tesla' | 'railgun'>('flame');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    coreHp: 100,
    energy: 150,
    wave: 1,
    isGameOver: false,
    isVictory: false,
    gridSize: 16,
    grid: Array(16).fill(null).map(() => Array(16).fill(0)), // 0: empty, 1: wall, 2: tower
    towers: [] as Tower[],
    enemies: [] as EnemyMob[],
    projectiles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; damage: number }[],
    waveTimer: 10,
    isWaveActive: false,
    selectedTowerType: 'flame' as 'flame' | 'ice' | 'tesla' | 'railgun'
  });

  const towerCosts = {
    flame: 40,
    ice: 50,
    tesla: 70,
    railgun: 100
  };

  const buildTower = (gx: number, gz: number, scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (gx < 0 || gx >= s.gridSize || gz < 0 || gz >= s.gridSize) return;
    if (s.grid[gx][gz] !== 0) return;
    const cost = towerCosts[s.selectedTowerType];
    if (s.energy < cost) return;

    s.energy -= cost;
    setEnergy(s.energy);
    s.grid[gx][gz] = 2;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const towerGroup = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.6;
    towerGroup.add(base);

    // Top Turret
    const turretGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.0, 8);
    const typeColor = s.selectedTowerType === 'flame' ? 0xff4400 : s.selectedTowerType === 'ice' ? 0x00ccff : s.selectedTowerType === 'tesla' ? 0xaa00ff : 0xffff00;
    const turretMat = new THREE.MeshLambertMaterial({ color: typeColor });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.y = 1.6;
    towerGroup.add(turret);

    const worldX = (gx - s.gridSize / 2 + 0.5) * 2;
    const worldZ = (gz - s.gridSize / 2 + 0.5) * 2;
    towerGroup.position.set(worldX, 0, worldZ);
    scene.add(towerGroup);

    s.towers.push({
      mesh: towerGroup,
      gx,
      gz,
      type: s.selectedTowerType,
      range: s.selectedTowerType === 'railgun' ? 15 : s.selectedTowerType === 'tesla' ? 10 : 8,
      damage: s.selectedTowerType === 'railgun' ? 60 : s.selectedTowerType === 'tesla' ? 35 : 20,
      cooldown: s.selectedTowerType === 'railgun' ? 2.0 : s.selectedTowerType === 'tesla' ? 1.0 : 0.6,
      timer: 0
    });
  };

  useEffect(() => {
    gameStateRef.current.selectedTowerType = selectedTowerType;
  }, [selectedTowerType]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101525);
    scene.fog = new THREE.FogExp2(0x101525, 0.02);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(0, 26, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    if (!lowSpecMode) renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x7788aa, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // Grid Base Platform
    const gridGeo = new THREE.PlaneGeometry(32, 32, 16, 16);
    gridGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshLambertMaterial({ color: 0x1e2640 });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    scene.add(gridMesh);

    // Grid wire helper
    const gridHelper = new THREE.GridHelper(32, 16, 0x00ffff, 0x334466);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Core Crystal (At center/bottom end)
    const coreGeo = new THREE.OctahedronGeometry(1.5, 0);
    const coreMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x008866, shininess: 100 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 2, 14);
    scene.add(coreMesh);

    // Spawn Path Waypoints (From Top to Core)
    const waypoints = [
      { x: 0, z: -16 },
      { x: -10, z: -8 },
      { x: 10, z: 0 },
      { x: -6, z: 8 },
      { x: 0, z: 14 }
    ];

    // Raycaster for mouse click to build tower
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(gridMesh);
      if (intersects.length > 0) {
        const hit = intersects[0].point;
        const gx = Math.floor((hit.x + 16) / 2);
        const gz = Math.floor((hit.z + 16) / 2);
        buildTower(gx, gz, scene);
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);

    // Spawn wave monsters
    const spawnWave = (currentW: number) => {
      const s = gameStateRef.current;
      const monsterCount = 5 + currentW * 4;
      for (let i = 0; i < monsterCount; i++) {
        setTimeout(() => {
          if (s.isGameOver || s.isVictory) return;
          const mobGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
          const mobMat = new THREE.MeshLambertMaterial({
            color: currentW % 2 === 0 ? 0xff2255 : 0xaa22ff
          });
          const mobMesh = new THREE.Mesh(mobGeo, mobMat);
          mobMesh.position.set(waypoints[0].x, 0.6, waypoints[0].z);
          scene.add(mobMesh);

          s.enemies.push({
            mesh: mobMesh,
            x: waypoints[0].x,
            z: waypoints[0].z,
            hp: 50 + currentW * 30,
            maxHp: 50 + currentW * 30,
            speed: 3.5 + Math.random() * 1.5,
            alive: true,
            pathIndex: 0
          });
        }, i * 700);
      }
    };

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();
      const s = gameStateRef.current;

      coreMesh.rotation.y = time * 2;
      coreMesh.position.y = 2 + Math.sin(time * 3) * 0.3;

      if (!s.isGameOver && !s.isVictory) {
        // Wave management
        s.waveTimer -= dt;
        if (s.waveTimer <= 0) {
          s.waveTimer = 25;
          s.isWaveActive = true;
          spawnWave(s.wave);
        }

        // Check wave complete
        if (s.enemies.length === 0 && s.isWaveActive && s.waveTimer < 15) {
          s.isWaveActive = false;
          if (s.wave >= maxWave) {
            s.isVictory = true;
            setIsVictory(true);
            const reward = 60 + s.energy;
            setRewardSns(reward);
            onReward(reward);
          } else {
            s.wave += 1;
            s.energy += 80;
            setWave(s.wave);
            setEnergy(s.energy);
          }
        }

        // Enemy movement along waypoints
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const mob = s.enemies[i];
          if (!mob.alive) continue;

          const target = waypoints[mob.pathIndex + 1];
          if (!target) {
            // Reached core
            scene.remove(mob.mesh);
            s.enemies.splice(i, 1);
            s.coreHp = Math.max(0, s.coreHp - 15);
            setCoreHp(s.coreHp);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            if (s.coreHp <= 0) {
              s.isGameOver = true;
              setIsGameOver(true);
            }
            continue;
          }

          const dx = target.x - mob.x;
          const dz = target.z - mob.z;
          const dist = Math.hypot(dx, dz);

          if (dist < 0.5) {
            mob.pathIndex += 1;
          } else {
            mob.x += (dx / dist) * mob.speed * dt;
            mob.z += (dz / dist) * mob.speed * dt;
            mob.mesh.position.set(mob.x, 0.6, mob.z);
          }
        }

        // Towers Auto-target and shoot
        s.towers.forEach(t => {
          t.timer -= dt;
          if (t.timer > 0) return;

          // Find nearest enemy in range
          let closestEnemy: EnemyMob | null = null;
          let minDist = t.range;

          const tWorldX = (t.gx - s.gridSize / 2 + 0.5) * 2;
          const tWorldZ = (t.gz - s.gridSize / 2 + 0.5) * 2;

          s.enemies.forEach(mob => {
            if (!mob.alive) return;
            const d = Math.hypot(mob.x - tWorldX, mob.z - tWorldZ);
            if (d < minDist) {
              minDist = d;
              closestEnemy = mob;
            }
          });

          if (closestEnemy) {
            t.timer = t.cooldown;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

            // Fire beam / projectile
            const projGeo = new THREE.SphereGeometry(0.3, 6, 6);
            const projMat = new THREE.MeshBasicMaterial({
              color: t.type === 'flame' ? 0xff4400 : t.type === 'ice' ? 0x00ffff : 0xffff00
            });
            const proj = new THREE.Mesh(projGeo, projMat);
            proj.position.set(tWorldX, 1.8, tWorldZ);
            scene.add(proj);

            const dx = (closestEnemy as EnemyMob).x - tWorldX;
            const dz = (closestEnemy as EnemyMob).z - tWorldZ;
            const dist = Math.hypot(dx, dz);

            s.projectiles.push({
              mesh: proj,
              vx: (dx / dist) * 25,
              vy: 0,
              vz: (dz / dist) * 25,
              damage: t.damage
            });
          }
        });

        // Update Projectiles
        for (let i = s.projectiles.length - 1; i >= 0; i--) {
          const p = s.projectiles[i];
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.z += p.vz * dt;

          let hit = false;
          s.enemies.forEach(mob => {
            if (!mob.alive || hit) return;
            const d = Math.hypot(mob.x - p.mesh.position.x, mob.z - p.mesh.position.z);
            if (d < 1.2) {
              hit = true;
              mob.hp -= p.damage;
              if (mob.hp <= 0) {
                mob.alive = false;
                scene.remove(mob.mesh);
                s.energy += 15;
                setEnergy(s.energy);
              }
            }
          });

          if (hit || Math.hypot(p.mesh.position.x, p.mesh.position.z) > 30) {
            scene.remove(p.mesh);
            s.projectiles.splice(i, 1);
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
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, maxWave, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white select-none overflow-hidden flex flex-col font-sans">
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-pointer" />

      {/* Top HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Core HP & Energy */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1.5">
            <Shield size={16} className="text-cyan-400" />
            <div className="w-20 sm:w-28 h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${coreHp}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">{coreHp}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
            <Zap size={14} />
            <span>{energy} ENERGY</span>
          </div>

          <div className="bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 text-xs font-bold border border-indigo-700/50">
            WAVE {wave}/{maxWave}
          </div>
        </div>
      </div>

      {/* Bottom Tower Selector Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-700 shadow-2xl pointer-events-auto">
        <button
          onClick={() => setSelectedTowerType('flame')}
          className={`flex flex-col items-center p-2 rounded-xl border ${selectedTowerType === 'flame' ? 'bg-orange-600/30 border-orange-500 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          <Flame size={20} />
          <span className="text-[10px] font-bold mt-1">화염 (40)</span>
        </button>

        <button
          onClick={() => setSelectedTowerType('ice')}
          className={`flex flex-col items-center p-2 rounded-xl border ${selectedTowerType === 'ice' ? 'bg-cyan-600/30 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          <Crosshair size={20} />
          <span className="text-[10px] font-bold mt-1">냉각 (50)</span>
        </button>

        <button
          onClick={() => setSelectedTowerType('tesla')}
          className={`flex flex-col items-center p-2 rounded-xl border ${selectedTowerType === 'tesla' ? 'bg-purple-600/30 border-purple-500 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          <Zap size={20} />
          <span className="text-[10px] font-bold mt-1">테슬라 (70)</span>
        </button>

        <button
          onClick={() => setSelectedTowerType('railgun')}
          className={`flex flex-col items-center p-2 rounded-xl border ${selectedTowerType === 'railgun' ? 'bg-yellow-600/30 border-yellow-500 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          <Award size={20} />
          <span className="text-[10px] font-bold mt-1">레일건 (100)</span>
        </button>
      </div>

      {/* Guide Note */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-black/60 px-3 py-1 rounded-full text-[11px] text-slate-300 pointer-events-none">
        💡 그리드 바닥을 터치/클릭하여 타워를 건설하고 코어를 수호하세요!
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Hammer size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '코어 수호 성공! VICTORY' : '코어 파괴! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '모든 웨이브 몬스터를 격퇴하고 수호 결계를 완성했습니다!'
                : '몬스터들의 침공으로 코어 크리스탈이 파괴되었습니다.'}
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

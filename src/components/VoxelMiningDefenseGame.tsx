import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Volume2, VolumeX, Shield, Pickaxe, Hammer, Bomb, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { CardData, Language } from '../types';

interface VoxelMiningDefenseGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type BlockType = 'grass' | 'dirt' | 'stone' | 'iron' | 'gold' | 'turret';

interface BlockData {
  x: number;
  y: number;
  z: number;
  type: BlockType;
  mesh?: THREE.Mesh;
}

interface MonsterData {
  id: number;
  mesh: THREE.Mesh;
  hp: number;
  maxHp: number;
  speed: number;
}

export const VoxelMiningDefenseGame: React.FC<VoxelMiningDefenseGameProps> = ({
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [phase, setPhase] = useState<'day' | 'night'>('day');
  const [wave, setWave] = useState(1);
  const [maxWaves] = useState(3);
  const [timeLeft, setTimeLeft] = useState(25); // Day phase timer
  const [coreHp, setCoreHp] = useState(100);
  const [maxCoreHp] = useState(100);
  const [minedOres, setMinedOres] = useState({ stone: 10, iron: 5, gold: 2 });
  const [selectedTool, setSelectedTool] = useState<'pickaxe' | 'stone' | 'iron' | 'turret'>('pickaxe');
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [score, setScore] = useState(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const blocksRef = useRef<Map<string, BlockData>>(new Map());
  const monstersRef = useRef<MonsterData[]>([]);
  const turretsRef = useRef<{ x: number; y: number; z: number; lastShot: number; mesh: THREE.Mesh }[]>([]);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sound helper
  const triggerSound = useCallback((type: 'mine' | 'build' | 'hit' | 'win' | 'lose') => {
    if (isMuted) return;
    if (type === 'mine') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    else if (type === 'build') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    else if (type === 'hit') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
    else if (type === 'win') playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    else if (type === 'lose') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3');
  }, [isMuted, playSfx]);

  // Block Materials
  const materialsRef = useRef<{ [key in BlockType]?: THREE.Material }>({});

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#87CEEB'); // Sky blue
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(12, 16, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // 5. Materials
    materialsRef.current = {
      grass: new THREE.MeshLambertMaterial({ color: 0x4caf50 }),
      dirt: new THREE.MeshLambertMaterial({ color: 0x795548 }),
      stone: new THREE.MeshLambertMaterial({ color: 0x9e9e9e }),
      iron: new THREE.MeshLambertMaterial({ color: 0xe0e0e0 }),
      gold: new THREE.MeshLambertMaterial({ color: 0xffd700 }),
      turret: new THREE.MeshLambertMaterial({ color: 0x0288d1 }),
    };

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    // 6. Generate 11x11 Base Island
    const blocks = new Map<string, BlockData>();
    const size = 5;
    for (let x = -size; x <= size; x++) {
      for (let z = -size; z <= size; z++) {
        // Floor
        let type: BlockType = 'grass';
        const rand = Math.random();
        if (rand < 0.15) type = 'gold';
        else if (rand < 0.35) type = 'iron';
        else if (rand < 0.6) type = 'stone';

        const mesh = new THREE.Mesh(boxGeo, materialsRef.current[type]);
        mesh.position.set(x, 0, z);
        mesh.castShadow = !lowSpecMode;
        mesh.receiveShadow = !lowSpecMode;
        scene.add(mesh);

        const key = `${x},0,${z}`;
        blocks.set(key, { x, y: 0, z, type, mesh });
      }
    }
    blocksRef.current = blocks;

    // 7. Core Crystal in the Center
    const coreGeo = new THREE.OctahedronGeometry(0.9, 0);
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x00ffff, wireframe: false });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 1.2, 0);
    scene.add(coreMesh);
    coreMeshRef.current = coreMesh;

    // 8. Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Rotate core
      if (coreMeshRef.current) {
        coreMeshRef.current.rotation.y += 0.02;
        coreMeshRef.current.position.y = 1.2 + Math.sin(time * 0.003) * 0.15;
      }

      // Update Monsters
      const monsters = monstersRef.current;
      for (let i = monsters.length - 1; i >= 0; i--) {
        const mon = monsters[i];
        // Move towards center (0, 0, 0)
        const dx = 0 - mon.mesh.position.x;
        const dz = 0 - mon.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.8) {
          mon.mesh.position.x += (dx / dist) * mon.speed * dt;
          mon.mesh.position.z += (dz / dist) * mon.speed * dt;
          mon.mesh.rotation.y = Math.atan2(-dx, -dz);
        } else {
          // Attack Core
          setCoreHp((prev) => {
            const next = Math.max(0, prev - 10 * dt);
            if (next <= 0 && !gameOver) {
              setGameOver(true);
              setIsVictory(false);
              triggerSound('lose');
            }
            return next;
          });
        }
      }

      // Turrets Shoot Monsters
      const turrets = turretsRef.current;
      turrets.forEach((turret) => {
        if (time - turret.lastShot > 800) {
          // Find closest monster
          let closestMon: MonsterData | null = null;
          let minDist = 7;
          monsters.forEach((m) => {
            const d = m.mesh.position.distanceTo(turret.mesh.position);
            if (d < minDist) {
              minDist = d;
              closestMon = m;
            }
          });

          if (closestMon) {
            turret.lastShot = time;
            (closestMon as MonsterData).hp -= 25;
            if ((closestMon as MonsterData).hp <= 0) {
              scene.remove((closestMon as MonsterData).mesh);
              monstersRef.current = monstersRef.current.filter((m) => m.id !== (closestMon as MonsterData).id);
              setScore((s) => s + 50);
              triggerSound('hit');
            }
          }
        }
      });

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [lowSpecMode, triggerSound, gameOver]);

  // Timer & Wave Lifecycle
  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      if (phase === 'day') {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Switch to night
            setPhase('night');
            if (sceneRef.current) sceneRef.current.background = new THREE.Color('#0f172a');
            spawnMonsterWave(wave);
            return 20;
          }
          return prev - 1;
        });
      } else {
        // Night phase countdown
        setTimeLeft((prev) => {
          if (prev <= 1 || monstersRef.current.length === 0) {
            // Night cleared
            if (wave >= maxWaves) {
              setGameOver(true);
              setIsVictory(true);
              const rewardSns = 60;
              onReward(rewardSns);
              triggerSound('win');
              return 0;
            } else {
              setWave((w) => w + 1);
              setPhase('day');
              if (sceneRef.current) sceneRef.current.background = new THREE.Color('#87CEEB');
              return 25;
            }
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, wave, maxWaves, gameOver, onReward, triggerSound]);

  // Spawn monster wave
  const spawnMonsterWave = (currentWave: number) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const count = 4 + currentWave * 3;
    const newMonsters: MonsterData[] = [];

    const monGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    const monMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 8 + Math.random() * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const mesh = new THREE.Mesh(monGeo, monMat);
      mesh.position.set(x, 0.6, z);
      scene.add(mesh);

      newMonsters.push({
        id: Date.now() + i,
        mesh,
        hp: 40 + currentWave * 15,
        maxHp: 40 + currentWave * 15,
        speed: 1.5 + currentWave * 0.3,
      });
    }

    monstersRef.current = newMonsters;
  };

  // Click / Tap on 3D Voxel World (Mine or Build)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current || gameOver) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const meshes: THREE.Mesh[] = [];
    blocksRef.current.forEach((b) => {
      if (b.mesh) meshes.push(b.mesh);
    });

    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const clickedMesh = hit.object as THREE.Mesh;
      const bx = Math.round(clickedMesh.position.x);
      const by = Math.round(clickedMesh.position.y);
      const bz = Math.round(clickedMesh.position.z);
      const key = `${bx},${by},${bz}`;

      if (selectedTool === 'pickaxe') {
        // Mine block
        const block = blocksRef.current.get(key);
        if (block && (bx !== 0 || bz !== 0)) { // Cannot mine core
          if (block.type === 'stone') setMinedOres((prev) => ({ ...prev, stone: prev.stone + 1 }));
          else if (block.type === 'iron') setMinedOres((prev) => ({ ...prev, iron: prev.iron + 1 }));
          else if (block.type === 'gold') setMinedOres((prev) => ({ ...prev, gold: prev.gold + 1 }));

          sceneRef.current.remove(clickedMesh);
          blocksRef.current.delete(key);
          setScore((s) => s + 10);
          triggerSound('mine');
        }
      } else if (selectedTool === 'stone' || selectedTool === 'iron') {
        // Build wall on top
        const cost = 1;
        if (selectedTool === 'stone' && minedOres.stone >= cost) {
          setMinedOres((prev) => ({ ...prev, stone: prev.stone - cost }));
          const newY = by + 1;
          if (newY <= 3) {
            const newGeo = new THREE.BoxGeometry(1, 1, 1);
            const newMesh = new THREE.Mesh(newGeo, materialsRef.current[selectedTool]);
            newMesh.position.set(bx, newY, bz);
            sceneRef.current.add(newMesh);
            blocksRef.current.set(`${bx},${newY},${bz}`, { x: bx, y: newY, z: bz, type: selectedTool, mesh: newMesh });
            triggerSound('build');
          }
        }
      } else if (selectedTool === 'turret') {
        // Place Turret
        if (minedOres.iron >= 3 && minedOres.gold >= 1) {
          setMinedOres((prev) => ({ ...prev, iron: prev.iron - 3, gold: prev.gold - 1 }));
          const tGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
          const tMesh = new THREE.Mesh(tGeo, materialsRef.current['turret']);
          tMesh.position.set(bx, by + 1, bz);
          sceneRef.current.add(tMesh);
          turretsRef.current.push({ x: bx, y: by + 1, z: bz, lastShot: 0, mesh: tMesh });
          triggerSound('build');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono select-none overflow-hidden h-[100dvh]">
      {/* Top Header Bar (DESIGN.md: 1px hairline, flat, rounded-none) */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center border border-[rgba(15,0,0,0.12)] rounded-sm bg-white hover:bg-neutral-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider">
              {language === 'ko' ? '[3D 복셀 광산 서바이벌 디펜스]' : '[3D VOXEL MINING DEFENSE]'}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-neutral-500">
              <span>{phase === 'day' ? '☀️ 낮 (자원 채굴/건설)' : '🌙 밤 (몬스터 습격)'}</span>
              <span>•</span>
              <span>WAVE {wave}/{maxWaves}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Core HP */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-neutral-500">CORE HP</span>
            <div className="w-20 h-2.5 bg-neutral-200 border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-200"
                style={{ width: `${(coreHp / maxCoreHp) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center border border-[rgba(15,0,0,0.12)] rounded-sm bg-white hover:bg-neutral-100 cursor-pointer"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Area */}
      <div
        ref={mountRef}
        onClick={handleCanvasClick}
        className="flex-1 w-full relative cursor-crosshair overflow-hidden"
      >
        {/* Floating Timer & Status */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#fdfcfc]/90 border border-[rgba(15,0,0,0.12)] shadow-xs rounded-sm text-xs font-black text-center pointer-events-none">
          {phase === 'day' ? `낮 파밍 남은 시간: ${timeLeft}s` : `밤 방어 진행 중: ${timeLeft}s (${monstersRef.current.length}마리)`}
        </div>

        {/* Resources HUD */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 p-2 bg-[#fdfcfc]/90 border border-[rgba(15,0,0,0.12)] rounded-sm text-[11px] pointer-events-none">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-neutral-400 border border-neutral-600" />
            <span>돌: {minedOres.stone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-slate-200 border border-slate-400" />
            <span>철: {minedOres.iron}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-amber-400 border border-amber-600" />
            <span>금: {minedOres.gold}</span>
          </div>
          <div className="text-[10px] text-indigo-600 font-black mt-1">SCORE: {score}</div>
        </div>
      </div>

      {/* Bottom Tool Hotbar (DESIGN.md: 44px+ touch targets, rounded-sm) */}
      <footer className="p-2 border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] shrink-0">
        <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
          {[
            { id: 'pickaxe', labelKo: '곡괭이', icon: Pickaxe, cost: '채굴' },
            { id: 'stone', labelKo: '돌벽', icon: Hammer, cost: '돌 1개' },
            { id: 'turret', labelKo: '방어포탑', icon: Shield, cost: '철3 금1' },
          ].map((tool) => {
            const active = selectedTool === tool.id;
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedTool(tool.id as any);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                }}
                className={`flex-1 min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center border transition-all cursor-pointer rounded-sm ${
                  active
                    ? 'bg-[#201d1d] text-white border-[#201d1d]'
                    : 'bg-white text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon size={14} />
                  <span className="text-xs font-bold">{tool.labelKo}</span>
                </div>
                <span className={`text-[9px] ${active ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  [{tool.cost}]
                </span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* Game Over / Victory Modal */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-6 rounded-sm shadow-xl text-center flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              {isVictory ? (
                <div className="p-3 bg-amber-100 text-amber-600 rounded-full border border-amber-300">
                  <Trophy size={32} />
                </div>
              ) : (
                <div className="p-3 bg-rose-100 text-rose-600 rounded-full border border-rose-300">
                  <Bomb size={32} />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-black uppercase">
                {isVictory ? (language === 'ko' ? '복셀 디펜스 완승!' : 'DEFENSE VICTORY!') : (language === 'ko' ? '코어 파괴 (패배)' : 'CORE DESTROYED')}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {isVictory
                  ? `모든 웨이브 방어 성공! 점수: ${score}점 (+60 SNS 획득)`
                  : `영웅 코어가 파괴되었습니다. 점수: ${score}점`}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onExit}
                className="flex-1 min-h-[44px] py-2 bg-[#201d1d] text-white font-bold text-xs rounded-sm hover:bg-neutral-800 cursor-pointer"
              >
                {language === 'ko' ? '[로비로 나가기]' : '[EXIT TO LOBBY]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

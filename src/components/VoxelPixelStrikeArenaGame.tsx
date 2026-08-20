import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Volume2, VolumeX, Crosshair, Trophy, RotateCcw, Zap, ShieldAlert, Award } from 'lucide-react';
import { CardData, Language } from '../types';

interface VoxelPixelStrikeArenaGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'sniper';

interface WeaponInfo {
  name: string;
  damage: number;
  fireRate: number; // ms
  ammoMax: number;
  reloadTime: number; // ms
  color: number;
}

const WEAPONS: Record<WeaponType, WeaponInfo> = {
  pistol: { name: '권총 (Pistol)', damage: 25, fireRate: 350, ammoMax: 12, reloadTime: 1200, color: 0x94a3b8 },
  shotgun: { name: '샷건 (Shotgun)', damage: 60, fireRate: 800, ammoMax: 6, reloadTime: 1800, color: 0xf97316 },
  rifle: { name: '돌격소총 (Rifle)', damage: 20, fireRate: 120, ammoMax: 30, reloadTime: 1500, color: 0x3b82f6 },
  sniper: { name: '스나이퍼 (Sniper)', damage: 100, fireRate: 1200, ammoMax: 5, reloadTime: 2200, color: 0xa855f7 },
};

interface BotData {
  id: number;
  name: string;
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  kills: number;
  lastShot: number;
  targetPos: THREE.Vector3;
}

export const VoxelPixelStrikeArenaGame: React.FC<VoxelPixelStrikeArenaGameProps> = ({
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('rifle');
  const [ammo, setAmmo] = useState(30);
  const [isReloading, setIsReloading] = useState(false);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerKills, setPlayerKills] = useState(0);
  const [matchTime, setMatchTime] = useState(60); // 60s deathmatch
  const [gameOver, setGameOver] = useState(false);
  const [killFeed, setKillFeed] = useState<string[]>([]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const botsRef = useRef<BotData[]>([]);
  const lastShotTimeRef = useRef(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const playerPosRef = useRef(new THREE.Vector3(0, 1.6, 0));
  const playerYawRef = useRef(0);
  const playerPitchRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Sound helper
  const triggerSound = useCallback((type: 'shoot' | 'hit' | 'reload' | 'win' | 'lose') => {
    if (isMuted) return;
    if (type === 'shoot') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
    else if (type === 'hit') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    else if (type === 'reload') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    else if (type === 'win') playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    else if (type === 'lose') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3');
  }, [isMuted, playSfx]);

  // Initialize 3D Arena
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1e293b');
    scene.fog = new THREE.Fog('#1e293b', 20, 50);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 30, 20);
    scene.add(dirLight);

    // 5. Arena Floor & Obstacles (Voxel Matrix)
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Obstacle Crates
    const boxGeo = new THREE.BoxGeometry(2, 2, 2);
    const boxMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    for (let i = 0; i < 20; i++) {
      const box = new THREE.Mesh(boxGeo, boxMat);
      const x = (Math.random() - 0.5) * 45;
      const z = (Math.random() - 0.5) * 45;
      if (Math.abs(x) > 3 || Math.abs(z) > 3) {
        box.position.set(x, 1, z);
        scene.add(box);
      }
    }

    // 6. Spawn 5 AI Bots
    const botNames = ['ShadowSniper', 'PixelReaper', 'CyberKnight', 'VoxelAce', 'NovaStriker'];
    const bots: BotData[] = [];
    botNames.forEach((name, idx) => {
      const group = new THREE.Group();
      // Body
      const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.6;
      group.add(bodyMesh);

      // Head
      const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const headMat = new THREE.MeshLambertMaterial({ color: 0xfca5a5 });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 1.4;
      group.add(headMesh);

      const angle = (idx / botNames.length) * Math.PI * 2;
      const radius = 15 + Math.random() * 5;
      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      scene.add(group);

      bots.push({
        id: idx + 1,
        name,
        mesh: group,
        hp: 100,
        maxHp: 100,
        kills: 0,
        lastShot: 0,
        targetPos: new THREE.Vector3((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40),
      });
    });
    botsRef.current = bots;

    // 7. Keyboard listeners
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 8. Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Update Player Movement
      const speed = 7;
      const forward = new THREE.Vector3(-Math.sin(playerYawRef.current), 0, -Math.cos(playerYawRef.current));
      const right = new THREE.Vector3(Math.cos(playerYawRef.current), 0, -Math.sin(playerYawRef.current));

      const move = new THREE.Vector3();
      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) move.add(forward);
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) move.sub(forward);
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) move.add(right);
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) move.sub(right);

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed * dt);
        playerPosRef.current.add(move);
        // Arena boundary clamp
        playerPosRef.current.x = Math.max(-28, Math.min(28, playerPosRef.current.x));
        playerPosRef.current.z = Math.max(-28, Math.min(28, playerPosRef.current.z));
      }

      camera.position.copy(playerPosRef.current);
      camera.rotation.set(playerPitchRef.current, playerYawRef.current, 0, 'YXZ');

      // Update AI Bots
      botsRef.current.forEach((bot) => {
        if (bot.hp <= 0) return;

        // Move towards targetPos
        const dir = new THREE.Vector3().subVectors(bot.targetPos, bot.mesh.position);
        if (dir.length() < 2) {
          bot.targetPos.set((Math.random() - 0.5) * 45, 0, (Math.random() - 0.5) * 45);
        } else {
          dir.normalize().multiplyScalar(3.5 * dt);
          bot.mesh.position.add(dir);
          bot.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }

        // Bot AI shoot player if in sight
        const distToPlayer = bot.mesh.position.distanceTo(playerPosRef.current);
        if (distToPlayer < 20 && time - bot.lastShot > 1800) {
          bot.lastShot = time;
          // 40% hit probability
          if (Math.random() < 0.4) {
            setPlayerHp((prev) => {
              const next = Math.max(0, prev - 12);
              if (next <= 0 && !gameOver) {
                setGameOver(true);
                triggerSound('lose');
              }
              return next;
            });
            triggerSound('hit');
          }
        }
      });

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [lowSpecMode, triggerSound, gameOver]);

  // Match Timer
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setMatchTime((t) => {
        if (t <= 1) {
          setGameOver(true);
          const reward = Math.max(30, playerKills * 15);
          onReward(reward);
          triggerSound('win');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, playerKills, onReward, triggerSound]);

  // Shoot Weapon
  const shoot = () => {
    if (isReloading || ammo <= 0 || gameOver || !sceneRef.current || !cameraRef.current) return;
    const now = performance.now();
    const weapon = WEAPONS[currentWeapon];
    if (now - lastShotTimeRef.current < weapon.fireRate) return;

    lastShotTimeRef.current = now;
    setAmmo((a) => a - 1);
    triggerSound('shoot');

    // Raycast hit detection
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);

    const botMeshes: THREE.Object3D[] = [];
    botsRef.current.forEach((b) => {
      if (b.hp > 0) botMeshes.push(b.mesh);
    });

    const intersects = raycaster.intersectObjects(botMeshes, true);
    if (intersects.length > 0) {
      // Find hit bot
      let hitBot: BotData | null = null;
      for (const bot of botsRef.current) {
        if (bot.mesh === intersects[0].object || bot.mesh.children.includes(intersects[0].object as any)) {
          hitBot = bot;
          break;
        }
      }

      if (hitBot) {
        hitBot.hp -= weapon.damage;
        triggerSound('hit');
        if (hitBot.hp <= 0) {
          hitBot.mesh.position.set(999, -999, 999); // Hide dead bot
          setPlayerKills((k) => k + 1);
          setKillFeed((kf) => [`YOU eliminated ${hitBot?.name}! (+100)`, ...kf.slice(0, 2)]);
          // Respawn bot in 4s
          setTimeout(() => {
            if (hitBot && sceneRef.current) {
              hitBot.hp = 100;
              hitBot.mesh.position.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
            }
          }, 4000);
        }
      }
    }
  };

  // Reload Weapon
  const reload = () => {
    if (isReloading || ammo >= WEAPONS[currentWeapon].ammoMax) return;
    setIsReloading(true);
    triggerSound('reload');
    setTimeout(() => {
      setAmmo(WEAPONS[currentWeapon].ammoMax);
      setIsReloading(false);
    }, WEAPONS[currentWeapon].reloadTime);
  };

  // Switch Weapon
  const switchWeapon = (w: WeaponType) => {
    setCurrentWeapon(w);
    setAmmo(WEAPONS[w].ammoMax);
    setIsReloading(false);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono select-none overflow-hidden h-[100dvh]">
      {/* Top Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center border border-[rgba(15,0,0,0.12)] rounded-sm bg-white hover:bg-neutral-100 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider">
              {language === 'ko' ? '[3D 픽셀 스트라이크 아레나]' : '[3D PIXEL STRIKE ARENA]'}
            </h1>
            <span className="text-[10px] text-neutral-500">8-PLAYER DEATHMATCH • {matchTime}s</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-neutral-500">HP: {playerHp}/100</span>
            <div className="w-20 h-2.5 bg-neutral-200 border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-150"
                style={{ width: `${Math.max(0, playerHp)}%` }}
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

      {/* 3D FPS Canvas */}
      <div
        ref={mountRef}
        onClick={shoot}
        className="flex-1 w-full relative cursor-crosshair overflow-hidden"
      >
        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-emerald-400">
          <Crosshair size={24} />
        </div>

        {/* Top HUD: Kills & Score */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 p-2 bg-[#fdfcfc]/90 border border-[rgba(15,0,0,0.12)] rounded-sm text-xs pointer-events-none">
          <div className="font-black text-rose-600">KILLS: {playerKills}</div>
          <div className="text-[10px] text-neutral-500">AMMO: {ammo} / {WEAPONS[currentWeapon].ammoMax}</div>
        </div>

        {/* Kill Feed */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-none">
          {killFeed.map((kf, i) => (
            <div key={i} className="px-2 py-1 bg-black/70 text-amber-300 text-[10px] rounded-xs">
              {kf}
            </div>
          ))}
        </div>

        {/* Mobile On-Screen Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
          {/* Mobile Turn Controls */}
          <div className="flex gap-2">
            <button
              onMouseDown={() => { playerYawRef.current += 0.15; }}
              onTouchStart={() => { playerYawRef.current += 0.15; }}
              className="min-h-[48px] min-w-[48px] bg-black/60 text-white font-black text-sm rounded-sm border border-white/20 active:bg-black/90 cursor-pointer"
            >
              ◀ 회전
            </button>
            <button
              onMouseDown={() => { playerYawRef.current -= 0.15; }}
              onTouchStart={() => { playerYawRef.current -= 0.15; }}
              className="min-h-[48px] min-w-[48px] bg-black/60 text-white font-black text-sm rounded-sm border border-white/20 active:bg-black/90 cursor-pointer"
            >
              회전 ▶
            </button>
          </div>

          {/* Shoot & Reload */}
          <div className="flex gap-2">
            <button
              onClick={reload}
              className="min-h-[48px] px-3 bg-neutral-800 text-white font-bold text-xs rounded-sm border border-white/20 active:bg-neutral-900 cursor-pointer"
            >
              [재장전]
            </button>
            <button
              onClick={shoot}
              className="min-h-[48px] px-5 bg-rose-600 text-white font-black text-sm rounded-sm border border-rose-400 active:bg-rose-700 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Zap size={16} /> [발사]
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Weapon Selection Bar */}
      <footer className="p-2 border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] shrink-0">
        <div className="flex items-center justify-center gap-1.5 max-w-md mx-auto">
          {(['pistol', 'shotgun', 'rifle', 'sniper'] as WeaponType[]).map((wKey) => {
            const w = WEAPONS[wKey];
            const active = currentWeapon === wKey;
            return (
              <button
                key={wKey}
                onClick={() => switchWeapon(wKey)}
                className={`flex-1 min-h-[44px] py-1 px-1 flex flex-col items-center justify-center border rounded-sm cursor-pointer transition-all ${
                  active
                    ? 'bg-[#201d1d] text-white border-[#201d1d]'
                    : 'bg-white text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-neutral-100'
                }`}
              >
                <span className="text-[11px] font-bold">{w.name.split(' ')[0]}</span>
                <span className={`text-[8px] ${active ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  DMG {w.damage}
                </span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-6 rounded-sm shadow-xl text-center flex flex-col gap-4">
            <div className="flex justify-center">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-full border border-amber-300">
                <Trophy size={32} />
              </div>
            </div>
            <div>
              <h2 className="text-base font-black uppercase">
                {language === 'ko' ? '데스매치 경기 종료!' : 'DEATHMATCH FINISHED!'}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {`총 처치: ${playerKills} KILLS • (+${Math.max(30, playerKills * 15)} SNS 획득)`}
              </p>
            </div>
            <button
              onClick={onExit}
              className="min-h-[44px] py-2 bg-[#201d1d] text-white font-bold text-xs rounded-sm hover:bg-neutral-800 cursor-pointer"
            >
              {language === 'ko' ? '[로비로 나가기]' : '[EXIT TO LOBBY]'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

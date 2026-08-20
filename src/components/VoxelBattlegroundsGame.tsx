import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Shield, Crosshair, ArrowLeft, Trophy, Zap, RefreshCw, Volume2, VolumeX, Eye } from 'lucide-react';
import { CardData, Language } from '../types';

interface VoxelBattlegroundsGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PlayerState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotationY: number;
  hp: number;
  maxHp: number;
  shield: number;
  weapon: 'RIFLE' | 'SHOTGUN' | 'SNIPER';
  ammo: number;
  materials: number;
  kills: number;
  aliveCount: number;
}

interface BotEnemy {
  id: number;
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  hp: number;
  alive: boolean;
  targetX: number;
  targetZ: number;
  shootCooldown: number;
}

export const VoxelBattlegroundsGame: React.FC<VoxelBattlegroundsGameProps> = ({
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'gliding' | 'combat' | 'gameover' | 'victory'>('gliding');
  const [player, setPlayer] = useState<PlayerState>({
    x: 0,
    y: 35,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    rotationY: 0,
    hp: 100,
    maxHp: 100,
    shield: 50,
    weapon: 'RIFLE',
    ammo: 120,
    materials: 100,
    kills: 0,
    aliveCount: 12,
  });

  const [zoneRadius, setZoneRadius] = useState<number>(80);
  const [isBuildingWall, setIsBuildingWall] = useState<boolean>(false);
  const [gameTime, setGameTime] = useState<number>(0);

  // References for Three.js scene loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const zoneMeshRef = useRef<THREE.Mesh | null>(null);
  const botsRef = useRef<BotEnemy[]>([]);
  const wallsRef = useRef<THREE.Mesh[]>([]);
  const playerRef = useRef<PlayerState>(player);
  playerRef.current = player;

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize Three.js 3D Voxel Battlegrounds Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x70b8ff);
    scene.fog = new THREE.FogExp2(0x70b8ff, lowSpecMode ? 0.015 : 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 500);
    camera.position.set(0, 35, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1.0 : 1.5));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // Floating Island Voxel Terrain (160x160)
    const islandGeo = new THREE.BoxGeometry(160, 10, 160);
    const islandMat = new THREE.MeshLambertMaterial({ color: 0x4e8d3b });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, -5, 0);
    scene.add(island);

    // Scattered Voxel Rocks & Buildings
    const blockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    for (let i = 0; i < 24; i++) {
      const bx = (Math.random() - 0.5) * 120;
      const bz = (Math.random() - 0.5) * 120;
      const h = Math.floor(Math.random() * 4) + 2;
      const bGeo = new THREE.BoxGeometry(4, h * 2, 4);
      const bMesh = new THREE.Mesh(bGeo, i % 2 === 0 ? blockMat : woodMat);
      bMesh.position.set(bx, h, bz);
      scene.add(bMesh);
    }

    // Shrinking Storm Zone (Cylinder)
    const zoneGeo = new THREE.CylinderGeometry(80, 80, 60, 32, 1, true);
    const zoneMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    zoneMesh.position.set(0, 20, 0);
    scene.add(zoneMesh);
    zoneMeshRef.current = zoneMesh;

    // Spawn 11 AI Bot Enemies
    const botList: BotEnemy[] = [];
    const botColors = [0xe74c3c, 0x9b59b6, 0xf39c12, 0x1abc9c, 0x34495e];
    for (let i = 0; i < 11; i++) {
      const bGroup = new THREE.Group();
      const bodyMat = new THREE.MeshLambertMaterial({ color: botColors[i % botColors.length] });
      const bBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.2), bodyMat);
      bBody.position.y = 1.2;
      bGroup.add(bBody);

      const bHead = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshLambertMaterial({ color: 0xf1c40f }));
      bHead.position.y = 2.8;
      bGroup.add(bHead);

      const bx = (Math.random() - 0.5) * 100;
      const bz = (Math.random() - 0.5) * 100;
      bGroup.position.set(bx, 0, bz);
      scene.add(bGroup);

      botList.push({
        id: i + 1,
        mesh: bGroup,
        x: bx,
        y: 0,
        z: bz,
        hp: 60,
        alive: true,
        targetX: bx + (Math.random() - 0.5) * 30,
        targetZ: bz + (Math.random() - 0.5) * 30,
        shootCooldown: Math.random() * 60,
      });
    }
    botsRef.current = botList;

    // Main Game Loop
    let animId = 0;
    let localTime = 0;
    let localZone = 80;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      localTime++;
      if (localTime % 30 === 0) {
        setGameTime((t) => t + 1);
      }

      // Zone Shrinking
      if (localZone > 15) {
        localZone -= 0.015;
        if (zoneMeshRef.current) {
          zoneMeshRef.current.scale.set(localZone / 80, 1, localZone / 80);
        }
        setZoneRadius(Math.floor(localZone));
      }

      const p = playerRef.current;

      // Handle Glide or Ground Combat Movement
      let speed = p.y > 0 ? 0.35 : 0.45;
      let dx = 0;
      let dz = 0;

      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) dz -= speed;
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) dz += speed;
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dx -= speed;
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dx += speed;

      // Glider slow descent
      let nextY = p.y;
      if (p.y > 0) {
        nextY = Math.max(0, p.y - 0.12);
        if (nextY === 0 && gameState === 'gliding') {
          setGameState('combat');
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
      }

      const nextX = Math.max(-75, Math.min(75, p.x + dx));
      const nextZ = Math.max(-75, Math.min(75, p.z + dz));

      // Zone Damage Check
      const distFromCenter = Math.sqrt(nextX * nextX + nextZ * nextZ);
      let nextHp = p.hp;
      let nextShield = p.shield;
      if (distFromCenter > localZone && localTime % 60 === 0) {
        if (nextShield > 0) nextShield -= 5;
        else nextHp -= 8;
        playSfx('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3');
      }

      // Update Camera follow player
      camera.position.set(nextX, nextY + 2.5, nextZ + 6);
      camera.lookAt(nextX, nextY + 1.5, nextZ - 10);

      // AI Bots Update
      let currentAlive = 1; // player
      botsRef.current.forEach((bot) => {
        if (!bot.alive) return;
        currentAlive++;

        // Bot movement
        const bdx = bot.targetX - bot.x;
        const bdz = bot.targetZ - bot.z;
        const dist = Math.sqrt(bdx * bdx + bdz * bdz);
        if (dist > 1) {
          bot.x += (bdx / dist) * 0.15;
          bot.z += (bdz / dist) * 0.15;
          bot.mesh.position.set(bot.x, 0, bot.z);
        } else {
          bot.targetX = (Math.random() - 0.5) * (localZone * 1.5);
          bot.targetZ = (Math.random() - 0.5) * (localZone * 1.5);
        }

        // Bot Shooting at Player
        const pDist = Math.sqrt((bot.x - nextX) ** 2 + (bot.z - nextZ) ** 2);
        if (pDist < 25) {
          bot.shootCooldown--;
          if (bot.shootCooldown <= 0) {
            bot.shootCooldown = 90 + Math.random() * 60;
            // Bot hit player
            if (Math.random() > 0.4) {
              if (nextShield > 0) nextShield = Math.max(0, nextShield - 10);
              else nextHp = Math.max(0, nextHp - 12);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            }
          }
        }
      });

      // Update Player State
      setPlayer((prev) => ({
        ...prev,
        x: nextX,
        y: nextY,
        z: nextZ,
        hp: nextHp,
        shield: nextShield,
        aliveCount: currentAlive,
      }));

      // Check GameOver / Victory
      if (nextHp <= 0 && gameState !== 'gameover') {
        setGameState('gameover');
        playSfx('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3');
      } else if (currentAlive === 1 && gameState !== 'victory') {
        setGameState('victory');
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        onReward(300);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  // Player Shoot Gun
  const handleShoot = () => {
    if (player.ammo <= 0 || gameState !== 'combat') return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setPlayer((prev) => ({ ...prev, ammo: prev.ammo - 1 }));

    // Check hit nearest bot in front
    botsRef.current.forEach((bot) => {
      if (!bot.alive) return;
      const dist = Math.sqrt((bot.x - player.x) ** 2 + (bot.z - (player.z - 10)) ** 2);
      if (dist < 12) {
        bot.hp -= player.weapon === 'SHOTGUN' ? 60 : player.weapon === 'SNIPER' ? 100 : 35;
        if (bot.hp <= 0) {
          bot.alive = false;
          if (sceneRef.current) sceneRef.current.remove(bot.mesh);
          setPlayer((p) => ({ ...p, kills: p.kills + 1, materials: p.materials + 30 }));
          playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        }
      }
    });
  };

  // Build Quick Voxel Wall
  const handleBuildWall = () => {
    if (player.materials < 20 || !sceneRef.current) return;

    setPlayer((prev) => ({ ...prev, materials: prev.materials - 20 }));
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const wallMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const wallGeo = new THREE.BoxGeometry(4, 3, 0.8);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(player.x, 1.5, player.z - 3);
    sceneRef.current.add(wall);
    wallsRef.current.push(wall);
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-slate-950 font-mono text-white select-none overflow-hidden">
      {/* Top HUD Bar */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto min-w-[40px] min-h-[40px] px-2.5 py-1 bg-black/60 border border-white/20 text-xs font-bold rounded-sm flex items-center gap-1 hover:bg-black/80 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Alive & Kills Count */}
        <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 border border-white/20 rounded-sm text-xs font-black">
          <div className="flex items-center gap-1 text-emerald-400">
            <span>👤</span>
            <span>{player.aliveCount} ALIVE</span>
          </div>
          <div className="text-white/40">|</div>
          <div className="flex items-center gap-1 text-rose-400">
            <span>🎯</span>
            <span>{player.kills} KILLS</span>
          </div>
        </div>

        {/* Zone Radius */}
        <div className="bg-blue-900/80 px-2.5 py-1 border border-blue-400/50 rounded-sm text-xs font-bold flex items-center gap-1">
          <span>🌀 ZONE: {zoneRadius}m</span>
        </div>
      </div>

      {/* Three.js 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Center Aim Crosshair */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <Crosshair size={28} className="text-white/80 opacity-70" />
      </div>

      {/* Bottom Health & Shield & Weapon HUD */}
      <div className="absolute bottom-20 left-3 right-3 z-20 pointer-events-none flex flex-col gap-1.5 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          {/* HP Bar */}
          <div className="flex-1 bg-black/70 border border-white/20 p-1 rounded-sm">
            <div className="text-[10px] font-bold text-emerald-300 mb-0.5">HP {player.hp}/100</div>
            <div className="w-full bg-slate-800 h-2 rounded-none overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${player.hp}%` }} />
            </div>
          </div>

          {/* Shield Bar */}
          <div className="flex-1 bg-black/70 border border-white/20 p-1 rounded-sm">
            <div className="text-[10px] font-bold text-cyan-300 mb-0.5">SHIELD {player.shield}/50</div>
            <div className="w-full bg-slate-800 h-2 rounded-none overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all" style={{ width: `${(player.shield / 50) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Weapon & Ammo & Build Materials */}
        <div className="flex items-center justify-between bg-black/80 border border-white/20 px-3 py-1.5 rounded-sm text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-400">[{player.weapon}]</span>
            <span className="font-bold text-slate-300">AMMO: {player.ammo}</span>
          </div>
          <div className="font-bold text-yellow-300">WOOD: {player.materials}</div>
        </div>
      </div>

      {/* Mobile Touch Action Controls (Shoot & Wall Build) */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={handleBuildWall}
          disabled={player.materials < 20}
          className="min-w-[54px] min-h-[54px] bg-amber-800/90 border border-amber-500 rounded-sm font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-md cursor-pointer"
        >
          <span>🧱</span>
          <span className="text-[10px]">{language === 'ko' ? '벽건설' : 'Build'}</span>
        </button>

        <button
          onClick={handleShoot}
          disabled={player.ammo <= 0}
          className="min-w-[64px] min-h-[64px] bg-red-600/90 border-2 border-red-400 rounded-sm font-black text-sm flex flex-col items-center justify-center active:scale-95 shadow-lg cursor-pointer"
        >
          <Crosshair size={20} />
          <span className="text-[11px]">{language === 'ko' ? '사격' : 'Fire'}</span>
        </button>
      </div>

      {/* Victory / Game Over Overlay */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="text-5xl mb-2">🍗👑</div>
          <div className="text-2xl font-black text-yellow-400 mb-1">
            {language === 'ko' ? '이겼닭! 오늘 저녁은 치킨이닭!' : 'WINNER WINNER CHICKEN DINNER!'}
          </div>
          <div className="text-xs text-slate-300 mb-4">
            {language === 'ko' ? `최후의 1인 생존! 보상 +300 SNS 획득` : `Last Survivor! +300 SNS Reward`}
          </div>
          <button
            onClick={onExit}
            className="min-h-[44px] px-6 bg-yellow-400 text-black font-black text-xs rounded-sm hover:bg-yellow-300 cursor-pointer"
          >
            {language === 'ko' ? '결과 확인 및 복귀' : 'Claim & Exit'}
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center p-4">
          <div className="text-4xl mb-2">💀</div>
          <div className="text-xl font-black text-red-500 mb-1">
            {language === 'ko' ? '전투 불능 (작전 실패)' : 'ELIMINATED'}
          </div>
          <div className="text-xs text-slate-300 mb-4">
            {language === 'ko' ? `${player.kills}킬 달성` : `${player.kills} Kills Recorded`}
          </div>
          <button
            onClick={onExit}
            className="min-h-[44px] px-6 bg-slate-700 text-white font-black text-xs rounded-sm hover:bg-slate-600 cursor-pointer"
          >
            {language === 'ko' ? '로비로 나가기' : 'Exit to Lobby'}
          </button>
        </div>
      )}
    </div>
  );
};

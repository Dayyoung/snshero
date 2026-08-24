import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_battlegrounds') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
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
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const zoneMeshRef = useRef<THREE.Mesh | null>(null);
  const botsRef = useRef<BotEnemy[]>([]);
  const wallsRef = useRef<THREE.Mesh[]>([]);
  const playerRef = useRef<PlayerState>(player);
  playerRef.current = player;

  const gameStateRef = useRef({
    isPaused: false,
    startTime: Date.now(),
    isGameOver: false
  });

  const handleShoot = () => {
    const p = playerRef.current;
    if (p.ammo <= 0 || p.hp <= 0 || gameStateRef.current.isGameOver || gameStateRef.current.isPaused) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Bullet Raycast / Hit Detection against Bots
    const shootDist = 45;
    let hitBot: BotEnemy | null = null;
    let minD = shootDist;

    for (let bot of botsRef.current) {
      if (!bot.alive) continue;
      const dx = bot.x - p.x;
      const dz = bot.z - p.z;
      const dist = Math.hypot(dx, dz);

      // Angle check towards bot
      const angleToBot = Math.atan2(dx, dz);
      const angleDiff = Math.abs(angleToBot - p.rotationY);

      if (dist < minD && (angleDiff < 0.6 || Math.abs(angleDiff - Math.PI * 2) < 0.6)) {
        minD = dist;
        hitBot = bot;
      }
    }

    if (hitBot) {
      hitBot.hp -= 35;
      if (hitBot.hp <= 0) {
        hitBot.alive = false;
        if (sceneRef.current) sceneRef.current.remove(hitBot.mesh);
        p.kills += 1;
        p.aliveCount = Math.max(1, p.aliveCount - 1);
        p.materials += 40;
        p.ammo += 30;

        if (p.aliveCount <= 1) {
          // Chicken Dinner Victory!
          setGameState('victory');
          gameStateRef.current.isGameOver = true;
          const duration = (Date.now() - gameStateRef.current.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_battlegrounds',
            gameTitle: '복셀 배틀그라운드',
            durationSeconds: duration,
            score: p.kills * 400 + 1500,
            difficulty: 'NIGHTMARE',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }
    }

    p.ammo -= 1;
    setPlayer({ ...p });
  };

  const handleBuildWall = () => {
    const p = playerRef.current;
    if (p.materials < 20 || !sceneRef.current || gameStateRef.current.isGameOver || gameStateRef.current.isPaused) return;

    p.materials -= 20;
    setPlayer({ ...p });
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const wallGeo = new THREE.BoxGeometry(4, 3, 0.4);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const wall = new THREE.Mesh(wallGeo, wallMat);

    const fwdX = Math.sin(p.rotationY) * 3.5;
    const fwdZ = Math.cos(p.rotationY) * 3.5;
    wall.position.set(p.x + fwdX, 1.5, p.z + fwdZ);
    wall.rotation.y = p.rotationY;
    sceneRef.current.add(wall);
    wallsRef.current.push(wall);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc);
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    dirLight.position.set(60, 100, 40);
    scene.add(dirLight);

    // Voxel Terrain Island
    const terrainGeo = new THREE.PlaneGeometry(240, 240, 32, 32);
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    // Safe Zone Storm Circle
    const zoneGeo = new THREE.CylinderGeometry(80, 80, 50, 32, 1, true);
    const zoneMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    zoneMesh.position.y = 25;
    scene.add(zoneMesh);
    zoneMeshRef.current = zoneMesh;

    // Spawn 11 Enemy Bots
    botsRef.current = [];
    for (let i = 0; i < 11; i++) {
      const g = new THREE.Group();
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 1.2), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      bMesh.position.y = 1.0;
      g.add(bMesh);

      const rad = 25 + Math.random() * 45;
      const ang = Math.random() * Math.PI * 2;
      const bx = Math.cos(ang) * rad;
      const bz = Math.sin(ang) * rad;
      g.position.set(bx, 0, bz);
      scene.add(g);

      botsRef.current.push({
        id: i,
        mesh: g,
        x: bx,
        y: 0,
        z: bz,
        hp: 100,
        alive: true,
        targetX: bx + (Math.random() - 0.5) * 20,
        targetZ: bz + (Math.random() - 0.5) * 20,
        shootCooldown: 1.0 + Math.random() * 2.0
      });
    }

    let animId: number;
    let lastTime = performance.now();
    let currentRadius = 80;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const p = playerRef.current;
      if (gameStateRef.current.isPaused || gameStateRef.current.isGameOver) return;

      // Gliding down or Ground movement
      if (p.y > 0) {
        p.y = Math.max(0, p.y - 7.5 * dt);
        if (p.y <= 0) setGameState('combat');
      }

      // Safe Zone Shrink
      if (currentRadius > 15) {
        currentRadius -= dt * 0.8;
        setZoneRadius(Math.round(currentRadius));
        if (zoneMeshRef.current) {
          zoneMeshRef.current.scale.set(currentRadius / 80, 1, currentRadius / 80);
        }
      }

      // Storm Damage if outside circle
      const pDist = Math.hypot(p.x, p.z);
      if (pDist > currentRadius) {
        p.hp = Math.max(0, p.hp - 8 * dt);
        if (p.hp <= 0) {
          setGameState('gameover');
          gameStateRef.current.isGameOver = true;
          const duration = (Date.now() - gameStateRef.current.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_battlegrounds',
            gameTitle: '복셀 배틀그라운드',
            durationSeconds: duration,
            score: p.kills * 400,
            difficulty: 'NORMAL',
            isVictory: false
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
        setPlayer({ ...p });
      }

      // Update Bot AI
      for (let bot of botsRef.current) {
        if (!bot.alive) continue;

        // Move towards target / safe zone center
        const dx = (bot.targetX - bot.x);
        const dz = (bot.targetZ - bot.z);
        const d = Math.hypot(dx, dz);
        if (d > 1) {
          bot.x += (dx / d) * 3.5 * dt;
          bot.z += (dz / d) * 3.5 * dt;
          bot.mesh.position.set(bot.x, 0, bot.z);
        } else {
          bot.targetX = (Math.random() - 0.5) * currentRadius * 0.8;
          bot.targetZ = (Math.random() - 0.5) * currentRadius * 0.8;
        }

        // Shoot at player if close
        const distToP = Math.hypot(p.x - bot.x, p.z - bot.z);
        bot.shootCooldown -= dt;
        if (distToP < 25 && bot.shootCooldown <= 0) {
          bot.shootCooldown = 2.0 + Math.random() * 1.5;
          if (p.shield > 0) {
            p.shield = Math.max(0, p.shield - 12);
          } else {
            p.hp = Math.max(0, p.hp - 12);
          }
          if (p.hp <= 0) {
            setGameState('gameover');
            gameStateRef.current.isGameOver = true;
            const duration = (Date.now() - gameStateRef.current.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_battlegrounds',
              gameTitle: '복셀 배틀그라운드',
              durationSeconds: duration,
              score: p.kills * 400,
              difficulty: 'NORMAL',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
          setPlayer({ ...p });
        }
      }

      // Camera Chase 3rd Person View
      if (cameraRef.current) {
        const camDist = 6;
        const camH = 3.2;
        cameraRef.current.position.set(
          p.x - Math.sin(p.rotationY) * camDist,
          p.y + camH,
          p.z - Math.cos(p.rotationY) * camDist
        );
        cameraRef.current.lookAt(p.x, p.y + 1.5, p.z);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    setPlayer({
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
    setGameState('gliding');
    gameStateRef.current.isGameOver = false;
    gameStateRef.current.startTime = Date.now();
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 배틀그라운드' : 'Voxel Battlegrounds'}
        language={language}
        hp={{ current: player.hp, max: 100 }}
        telemetries={[
          { label: isKo ? '생존' : 'Alive', value: `${player.aliveCount}/12명`, color: 'text-amber-300' },
          { label: isKo ? '처치' : 'Kills', value: `${player.kills}킬`, color: 'text-rose-300' },
          { label: isKo ? '탄약' : 'Ammo', value: `${player.ammo}`, color: 'text-cyan-300' },
          { label: isKo ? '목재' : 'Wood', value: `${player.materials}`, color: 'text-yellow-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          gameStateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Crosshair */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-8 h-8 border border-white/40 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {gameState !== 'gameover' && gameState !== 'victory' && !isPaused && !showTutorial && (
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

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                moved = true;
                const p = playerRef.current;
                p.rotationY -= dx * 0.006;
                p.x += Math.sin(p.rotationY) * (-dy * 0.05);
                p.z += Math.cos(p.rotationY) * (-dy * 0.05);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Fire Gun
                handleShoot();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={handleBuildWall}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 이동/조준 | 탭: 사격 | 더블탭: 방어벽 건설 (버튼 없음)' : 'Drag: Move/Aim | Tap: Shoot | Double Tap: Build Wall (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_battlegrounds"
          gameTitle={isKo ? '3D 복셀 배틀그라운드: 치킨 디너 챌린지' : 'Voxel Battlegrounds: Chicken Dinner Challenge'}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
      {(gameState === 'victory' || gameState === 'gameover') && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};

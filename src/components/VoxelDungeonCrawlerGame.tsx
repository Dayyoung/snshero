import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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
  alive: boolean;
  attackTimer: number;
}

export const VoxelDungeonCrawlerGame: React.FC<VoxelDungeonCrawlerGameProps> = ({
  deck: _deck,
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
      return localStorage.getItem('hero_tutorial_game_voxel_dungeon_crawler') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [floor, setFloor] = useState<number>(1);
  const totalFloors = 5;
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posZ: 0,
    playerHp: 100,
    score: 0,
    floor: 1,
    isAttacking: false,
    attackCooldown: 0,
    keys: { w: false, s: false, a: false, d: false },
    enemies: [] as DungeonEnemy[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null,
    heroMesh: null as THREE.Group | null
  });

  const handleMobileAttack = () => {
    const s = stateRef.current;
    if (s.isAttacking || s.isGameOver || s.isVictory || s.isPaused) return;

    s.isAttacking = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    setTimeout(() => {
      s.isAttacking = false;
    }, 200);

    // Hit nearby enemies
    s.enemies.forEach(e => {
      if (!e.alive) return;
      const dist = Math.hypot(e.x - s.posX, e.z - s.posZ);
      if (dist < 3.8) {
        e.hp -= 40;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        if (e.hp <= 0) {
          e.alive = false;
          s.score += 250;
          setScore(s.score);

          // Check all dead in floor
          const allDead = s.enemies.every(en => !en.alive);
          if (allDead) {
            if (s.floor >= totalFloors) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_dungeon_crawler',
                gameTitle: '복셀 던전 크롤러',
                durationSeconds: duration,
                score: s.score + 1500,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            } else {
              s.floor += 1;
              setFloor(s.floor);
              s.posX = 0;
              s.posZ = 0;
              // Spawn next floor enemies
              s.enemies.forEach(en => {
                en.alive = true;
                en.hp = 40 + s.floor * 10;
                en.x = (Math.random() - 0.5) * 16;
                en.z = (Math.random() - 0.5) * 16;
              });
            }
          }
        }
      }
    });
  };

  const handleMobileDash = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    s.posX = Math.max(-10, Math.min(10, s.posX + (Math.random() > 0.5 ? 4 : -4)));
    s.posZ = Math.max(-10, Math.min(10, s.posZ + (Math.random() > 0.5 ? 4 : -4)));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d14);
    scene.fog = new THREE.FogExp2(0x0b0d14, 0.035);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 22, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404466, 1.2);
    scene.add(ambientLight);

    const torchLight = new THREE.PointLight(0xffaa44, 2.5, 20);
    torchLight.position.set(0, 3, 0);
    scene.add(torchLight);

    // Dungeon Ground & Walls
    const floorGeo = new THREE.PlaneGeometry(28, 28);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const dungeonFloor = new THREE.Mesh(floorGeo, floorMat);
    dungeonFloor.rotation.x = -Math.PI / 2;
    scene.add(dungeonFloor);

    // Hero Mesh
    const heroGroup = new THREE.Group();
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.6, 0.8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    hBody.position.y = 0.8;
    heroGroup.add(hBody);

    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.3), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    sword.position.set(0.6, 0.8, 0.4);
    heroGroup.add(sword);

    scene.add(heroGroup);
    stateRef.current.heroMesh = heroGroup;

    // Spawn 5 Enemies per Floor
    stateRef.current.enemies = [];
    for (let i = 0; i < 5; i++) {
      const eGroup = new THREE.Group();
      const eBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
      eBody.position.y = 0.7;
      eGroup.add(eBody);

      const ex = (Math.random() - 0.5) * 16;
      const ez = (Math.random() - 0.5) * 16;
      eGroup.position.set(ex, 0, ez);
      scene.add(eGroup);

      stateRef.current.enemies.push({
        mesh: eGroup,
        x: ex,
        z: ez,
        hp: 50,
        maxHp: 50,
        alive: true,
        attackTimer: 1.0 + Math.random()
      });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Hero Movement
      if (s.keys.w) s.posZ -= 12 * dt;
      if (s.keys.s) s.posZ += 12 * dt;
      if (s.keys.a) s.posX -= 12 * dt;
      if (s.keys.d) s.posX += 12 * dt;

      s.posX = Math.max(-12, Math.min(12, s.posX));
      s.posZ = Math.max(-12, Math.min(12, s.posZ));

      if (heroGroup) {
        heroGroup.position.set(s.posX, 0, s.posZ);
      }
      torchLight.position.set(s.posX, 3, s.posZ);

      // Camera Follow
      camera.position.set(s.posX, 20, s.posZ + 16);
      camera.lookAt(s.posX, 0, s.posZ);

      // Enemy AI
      s.enemies.forEach(e => {
        if (!e.alive) {
          e.mesh.position.y = -10;
          return;
        }

        e.mesh.position.set(e.x, 0, e.z);

        // Move towards player
        const dx = s.posX - e.x;
        const dz = s.posZ - e.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 1.2) {
          e.x += (dx / dist) * 4 * dt;
          e.z += (dz / dist) * 4 * dt;
        } else {
          // Attack player
          e.attackTimer -= dt;
          if (e.attackTimer <= 0) {
            e.attackTimer = 1.2;
            s.playerHp = Math.max(0, s.playerHp - 12);
            setPlayerHp(s.playerHp);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

            if (s.playerHp <= 0 && !s.isGameOver) {
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_dungeon_crawler',
                gameTitle: '복셀 던전 크롤러',
                durationSeconds: duration,
                score: s.score,
                difficulty: 'HARD',
                isVictory: false
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
        }
      });

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
    const s = stateRef.current;
    s.posX = 0;
    s.posZ = 0;
    s.playerHp = 100;
    s.score = 0;
    s.floor = 1;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.enemies.forEach(e => {
      e.alive = true;
      e.hp = 50;
    });
    setPlayerHp(100);
    setScore(0);
    setFloor(1);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 던전 크롤러' : 'Voxel Dungeon Crawler'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '층수' : 'Floor', value: `B${floor}/${totalFloors}F`, color: 'text-amber-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
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
                stateRef.current.keys.w = dy < -8;
                stateRef.current.keys.s = dy > 8;
                stateRef.current.keys.a = dx < -8;
                stateRef.current.keys.d = dx > 8;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.keys.w = false;
              stateRef.current.keys.s = false;
              stateRef.current.keys.a = false;
              stateRef.current.keys.d = false;

              if (!moved) {
                // Tap: Attack
                handleMobileAttack();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={handleMobileDash}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-red-500/30 rounded-full text-[10px] text-red-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 히어로 이동 | 탭: 검 참격 | 더블탭: 회피 대시 (버튼 없음)' : 'Drag: Move Hero | Tap: Sword Slash | Double Tap: Dash (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_dungeon_crawler"
          gameTitle={isKo ? '3D 복셀 던전 크롤러: 미궁 탐사' : 'Voxel Dungeon Crawler: Labyrinth'}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
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
export default VoxelDungeonCrawlerGame;

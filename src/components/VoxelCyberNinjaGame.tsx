import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCyberNinjaGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelCyberNinjaGame: React.FC<VoxelCyberNinjaGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_cyber_ninja') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hp, setHp] = useState<number>(100);
  const [energy, setEnergy] = useState<number>(100);
  const [killCount, setKillCount] = useState<number>(0);
  const targetKills = 8;
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    posX: 0,
    posY: 1,
    posZ: 0,
    rotY: 0,
    hp: 100,
    maxHp: 100,
    energy: 100,
    killCount: 0,
    isSlashing: false,
    slashCooldown: 0,
    keys: { w: false, s: false, a: false, d: false },
    enemies: [] as { group: THREE.Group; x: number; z: number; hp: number; alive: boolean; shootTimer: number }[],
    enemyBullets: [] as { mesh: THREE.Mesh; vx: number; vz: number; life: number }[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null,
    ninjaGroup: null as THREE.Group | null
  });

  const performKatanaSlash = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.slashCooldown > 0) return;
    s.slashCooldown = 0.25;
    s.isSlashing = true;
    setTimeout(() => {
      s.isSlashing = false;
    }, 200);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Slash hitbox check
    s.enemies.forEach(e => {
      if (!e.alive) return;
      const dist = Math.hypot(e.x - s.posX, e.z - s.posZ);
      if (dist < 4.5) {
        e.hp -= 40;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        if (e.hp <= 0) {
          e.alive = false;
          s.killCount += 1;
          s.energy = Math.min(100, s.energy + 25);
          setKillCount(s.killCount);
          setEnergy(Math.round(s.energy));

          if (s.killCount >= targetKills) {
            s.isVictory = true;
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_cyber_ninja',
              gameTitle: '복셀 사이버 닌자',
              durationSeconds: duration,
              score: s.killCount * 300 + 1000,
              difficulty: 'HARD',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }
      }
    });

    // Deflect incoming bullets
    s.enemyBullets.forEach(b => {
      const d = Math.hypot(b.mesh.position.x - s.posX, b.mesh.position.z - s.posZ);
      if (d < 3.2) {
        b.vx = -b.vx * 1.5;
        b.vz = -b.vz * 1.5;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
    });
  };

  const performBlinkStrike = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.energy < 30) return;
    s.energy -= 30;
    setEnergy(Math.round(s.energy));

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');

    // Teleport forward
    const forwardX = Math.sin(s.rotY) * 9;
    const forwardZ = Math.cos(s.rotY) * 9;
    s.posX = Math.max(-20, Math.min(20, s.posX + forwardX));
    s.posZ = Math.max(-20, Math.min(20, s.posZ + forwardZ));

    performKatanaSlash();
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050014);
    scene.fog = new THREE.Fog(0x050014, 20, 80);
    gameStateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 150);
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xff00ff, 0x00ffff, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x00ffff, 1.4);
    dirLight.position.set(20, 30, 20);
    scene.add(dirLight);

    // Neon Floor Grid
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0518, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Voxel Ninja Character
    const ninjaGroup = new THREE.Group();
    const ninjaBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x1e1b4b }));
    ninjaBody.position.y = 0.9;
    ninjaGroup.add(ninjaBody);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.4), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
    visor.position.set(0, 1.4, 0.4);
    ninjaGroup.add(visor);

    scene.add(ninjaGroup);
    gameStateRef.current.ninjaGroup = ninjaGroup;

    // Spawn 8 Enemies
    const enemyGeo = new THREE.BoxGeometry(1.4, 1.8, 1.0);
    const enemyMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    gameStateRef.current.enemies = [];

    for (let i = 0; i < targetKills; i++) {
      const eGroup = new THREE.Group();
      const eMesh = new THREE.Mesh(enemyGeo, enemyMat);
      eMesh.position.y = 0.9;
      eGroup.add(eMesh);

      const angle = (i / targetKills) * Math.PI * 2;
      const ex = Math.sin(angle) * 16;
      const ez = Math.cos(angle) * 16;
      eGroup.position.set(ex, 0, ez);
      scene.add(eGroup);

      gameStateRef.current.enemies.push({
        group: eGroup,
        x: ex,
        z: ez,
        hp: 40,
        alive: true,
        shootTimer: 1.0 + Math.random() * 2.0
      });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Update Ninja Movement
      if (s.keys.w) s.posZ -= 16 * dt;
      if (s.keys.s) s.posZ += 16 * dt;
      if (s.keys.a) s.posX -= 16 * dt;
      if (s.keys.d) s.posX += 16 * dt;

      s.posX = Math.max(-24, Math.min(24, s.posX));
      s.posZ = Math.max(-24, Math.min(24, s.posZ));

      if (s.ninjaGroup) {
        s.ninjaGroup.position.set(s.posX, 0, s.posZ);
      }

      // Camera Follow
      camera.position.set(s.posX, 14, s.posZ + 18);
      camera.lookAt(s.posX, 1, s.posZ);

      // Enemy AI & Bullet Firing
      s.enemies.forEach(e => {
        if (!e.alive) {
          e.group.position.y = -10;
          return;
        }

        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 2.0 + Math.random() * 1.5;

          const dx = s.posX - e.x;
          const dz = s.posZ - e.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.1) {
            const bGeo = new THREE.SphereGeometry(0.3, 8, 8);
            const bMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
            const bMesh = new THREE.Mesh(bGeo, bMat);
            bMesh.position.set(e.x, 1.2, e.z);
            scene.add(bMesh);

            const bSpeed = 14;
            s.enemyBullets.push({
              mesh: bMesh,
              vx: (dx / dist) * bSpeed,
              vz: (dz / dist) * bSpeed,
              life: 3.5
            });
          }
        }
      });

      // Update Bullets
      for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
        const b = s.enemyBullets[i];
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.z += b.vz * dt;
        b.life -= dt;

        // Player Hit
        const dist = Math.hypot(b.mesh.position.x - s.posX, b.mesh.position.z - s.posZ);
        if (dist < 1.0) {
          s.hp = Math.max(0, s.hp - 15);
          setHp(s.hp);
          scene.remove(b.mesh);
          s.enemyBullets.splice(i, 1);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

          if (s.hp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_cyber_ninja',
              gameTitle: '복셀 사이버 닌자',
              durationSeconds: duration,
              score: s.killCount * 250,
              difficulty: 'HARD',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
          continue;
        }

        if (b.life <= 0) {
          scene.remove(b.mesh);
          s.enemyBullets.splice(i, 1);
        }
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
    const s = gameStateRef.current;
    s.posX = 0;
    s.posZ = 0;
    s.hp = 100;
    s.energy = 100;
    s.killCount = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.enemies.forEach(e => {
      e.alive = true;
      e.hp = 40;
    });
    setHp(100);
    setEnergy(100);
    setKillCount(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 사이버 닌자' : 'Voxel Cyber Ninja'}
        language={language}
        hp={{ current: hp, max: 100 }}
        telemetries={[
          { label: isKo ? '암살' : 'Kills', value: `${killCount}/${targetKills}명`, color: 'text-rose-300' },
          { label: isKo ? '에너지' : 'Energy', value: `${energy}%`, color: 'text-cyan-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          gameStateRef.current.isPaused = !isPaused;
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
                gameStateRef.current.keys.w = dy < -8;
                gameStateRef.current.keys.s = dy > 8;
                gameStateRef.current.keys.a = dx < -8;
                gameStateRef.current.keys.d = dx > 8;
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
                // Tap: Katana Slash
                performKatanaSlash();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={performBlinkStrike}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-400/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 닌자 이동 | 탭: 카타나 베기 & 탄환 튕겨내기 | 더블탭: 블링크 참격 (버튼 없음)' : 'Drag: Move Ninja | Tap: Katana Slash & Deflect | Double Tap: Blink Strike (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_cyber_ninja"
          gameTitle={isKo ? '3D 복셀 사이버 닌자: 네온 섀도우' : 'Voxel Cyber Ninja: Neon Shadow'}
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

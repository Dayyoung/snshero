import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_ace_fighter') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [shield, setShield] = useState<number>(100);
  const [maxShield] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [missileStock, setMissileStock] = useState<number>(12);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

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
    isPaused: false,
    startTime: Date.now(),
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

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    let closestEnemy: EnemyFighter | null = null;
    let closestDist = 999;
    for (let e of s.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - s.posX, e.y - s.posY, e.z - s.posZ);
      if (d < closestDist && e.z < s.posZ) {
        closestDist = d;
        closestEnemy = e;
      }
    }

    const mGeo = new THREE.ConeGeometry(0.2, 1.4, 4);
    mGeo.rotateX(Math.PI / 2);
    const mMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const mMesh = new THREE.Mesh(mGeo, mMat);
    mMesh.position.set(s.posX, s.posY - 0.5, s.posZ - 2);
    scene.add(mMesh);

    s.missiles.push({
      mesh: mMesh,
      target: closestEnemy ? closestEnemy.group : null,
      vx: 0,
      vy: 0,
      vz: -45,
      life: 4.0
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1128);
    scene.fog = new THREE.FogExp2(0x0a1128, 0.005);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x112244, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffddaa, 1.2);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // Player Fighter Mesh
    const playerGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.5, 4.0);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    playerGroup.add(body);

    const wingGeo = new THREE.BoxGeometry(5.0, 0.1, 1.8);
    const wingMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0, 0.2);
    playerGroup.add(wings);

    const tailGeo = new THREE.BoxGeometry(0.15, 1.2, 1.2);
    const tailMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.7, 1.4);
    playerGroup.add(tail);

    scene.add(playerGroup);

    // Clouds
    const clouds: THREE.Mesh[] = [];
    const cloudGeo = new THREE.DodecahedronGeometry(8, 0);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    for (let i = 0; i < 40; i++) {
      const c = new THREE.Mesh(cloudGeo, cloudMat);
      c.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 30 + 10, -Math.random() * 500);
      scene.add(c);
      clouds.push(c);
    }

    // Spawn Initial Enemies
    const spawnEnemy = (x: number, y: number, z: number, isBoss = false) => {
      const g = new THREE.Group();
      const eBodyGeo = new THREE.BoxGeometry(isBoss ? 6 : 1.4, isBoss ? 2.5 : 0.6, isBoss ? 8 : 3.5);
      const eBodyMat = new THREE.MeshLambertMaterial({ color: isBoss ? 0xd97706 : 0xdc2626 });
      const eBody = new THREE.Mesh(eBodyGeo, eBodyMat);
      g.add(eBody);

      if (isBoss) {
        const turretGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.8, 6);
        const turretMat = new THREE.MeshLambertMaterial({ color: 0x7c2d12 });
        const turret = new THREE.Mesh(turretGeo, turretMat);
        turret.position.set(0, 1.5, 0);
        g.add(turret);
      }

      g.position.set(x, y, z);
      scene.add(g);

      gameStateRef.current.enemies.push({
        group: g,
        x,
        y,
        z,
        hp: isBoss ? 600 : 60,
        maxHp: isBoss ? 600 : 60,
        alive: true,
        isBoss
      });
    };

    for (let i = 0; i < 15; i++) {
      spawnEnemy((Math.random() - 0.5) * 80, Math.random() * 20 + 5, -80 - i * 35);
    }
    spawnEnemy(0, 12, -650, true); // Boss Carrier

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver || s.isVictory) return;

      if (s.shootCooldown > 0) s.shootCooldown -= dt;

      // Pitch / Yaw / Roll based on keys or gesture controls
      if (s.keys.w) s.rotX = Math.max(s.rotX - 2.5 * dt, -0.6);
      else if (s.keys.s) s.rotX = Math.min(s.rotX + 2.5 * dt, 0.6);
      else s.rotX *= 0.92;

      if (s.keys.a) {
        s.rotY += 1.8 * dt;
        s.rotZ = Math.min(s.rotZ + 3.0 * dt, 0.8);
      } else if (s.keys.d) {
        s.rotY -= 1.8 * dt;
        s.rotZ = Math.max(s.rotZ - 3.0 * dt, -0.8);
      } else {
        s.rotZ *= 0.9;
      }

      // Forward Thrust
      s.posX -= Math.sin(s.rotY) * s.speed * dt * 1.5;
      s.posY += Math.sin(s.rotX) * s.speed * dt * 1.5;
      s.posZ -= Math.cos(s.rotY) * s.speed * dt;

      playerGroup.position.set(s.posX, s.posY, s.posZ);
      playerGroup.rotation.set(-s.rotX, s.rotY, s.rotZ);

      // Chase Camera
      camera.position.set(
        s.posX + Math.sin(s.rotY) * 6,
        s.posY + 2.5 - Math.sin(s.rotX) * 3,
        s.posZ + Math.cos(s.rotY) * 6
      );
      camera.lookAt(s.posX, s.posY + 0.5, s.posZ - 8);

      // Update Bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.y += b.vy * dt;
        b.mesh.position.z += b.vz * dt;
        b.life -= dt;

        // Hit Detection against enemies
        for (let enemy of s.enemies) {
          if (!enemy.alive) continue;
          const dist = b.mesh.position.distanceTo(enemy.group.position);
          if (dist < (enemy.isBoss ? 4.5 : 2.0)) {
            enemy.hp -= 20;
            b.life = 0;
            if (enemy.hp <= 0) {
              enemy.alive = false;
              scene.remove(enemy.group);
              s.score += enemy.isBoss ? 1500 : 200;
              setScore(s.score);
              if (enemy.isBoss) {
                s.isVictory = true;
                const duration = (Date.now() - s.startTime) / 1000;
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'voxel_ace_fighter',
                  gameTitle: '복셀 에이스 파이터',
                  durationSeconds: duration,
                  score: s.score,
                  difficulty: 'NIGHTMARE',
                  isVictory: true
                });
                setSettlementReceipt(receipt);
                onReward(receipt.totalSns);
                setIsGameOver(true);
              }
            }
            break;
          }
        }

        if (b.life <= 0) {
          scene.remove(b.mesh);
          s.bullets.splice(i, 1);
        }
      }

      // Update Missiles
      for (let i = s.missiles.length - 1; i >= 0; i--) {
        const m = s.missiles[i];
        if (m.target && m.target.parent) {
          const tPos = m.target.position;
          const dir = new THREE.Vector3().subVectors(tPos, m.mesh.position).normalize();
          m.vx = THREE.MathUtils.lerp(m.vx, dir.x * 60, 0.1);
          m.vy = THREE.MathUtils.lerp(m.vy, dir.y * 60, 0.1);
          m.vz = THREE.MathUtils.lerp(m.vz, dir.z * 60, 0.1);
        }
        m.mesh.position.x += m.vx * dt;
        m.mesh.position.y += m.vy * dt;
        m.mesh.position.z += m.vz * dt;
        m.mesh.lookAt(m.mesh.position.clone().add(new THREE.Vector3(m.vx, m.vy, m.vz)));
        m.life -= dt;

        for (let enemy of s.enemies) {
          if (!enemy.alive) continue;
          if (m.mesh.position.distanceTo(enemy.group.position) < (enemy.isBoss ? 5.0 : 2.5)) {
            enemy.hp -= 120;
            m.life = 0;
            if (enemy.hp <= 0) {
              enemy.alive = false;
              scene.remove(enemy.group);
              s.score += enemy.isBoss ? 1500 : 200;
              setScore(s.score);
              if (enemy.isBoss) {
                s.isVictory = true;
                const duration = (Date.now() - s.startTime) / 1000;
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'voxel_ace_fighter',
                  gameTitle: '복셀 에이스 파이터',
                  durationSeconds: duration,
                  score: s.score,
                  difficulty: 'NIGHTMARE',
                  isVictory: true
                });
                setSettlementReceipt(receipt);
                onReward(receipt.totalSns);
                setIsGameOver(true);
              }
            }
            break;
          }
        }

        if (m.life <= 0) {
          scene.remove(m.mesh);
          s.missiles.splice(i, 1);
        }
      }

      // Recycle Clouds
      for (let c of clouds) {
        if (c.position.z > s.posZ + 20) {
          c.position.z = s.posZ - 300 - Math.random() * 200;
          c.position.x = s.posX + (Math.random() - 0.5) * 180;
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
    setScore(0);
    setShield(100);
    setMissileStock(12);
    setIsGameOver(false);
    setSettlementReceipt(null);
    const s = gameStateRef.current;
    s.posX = 0;
    s.posY = 10;
    s.posZ = 0;
    s.rotX = 0;
    s.rotY = 0;
    s.rotZ = 0;
    s.score = 0;
    s.shield = 100;
    s.missileStock = 12;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 에이스 파이터' : 'Voxel Ace Fighter'}
        language={language}
        hp={{ current: shield, max: maxShield }}
        telemetries={[
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300' },
          { label: isKo ? '미사일' : 'Missiles', value: `${missileStock}발`, color: 'text-cyan-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          gameStateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Center Targeting Reticle HUD */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-14 h-14 border border-cyan-400/50 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </div>
      </div>

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
                gameStateRef.current.keys.w = dy < -10;
                gameStateRef.current.keys.s = dy > 10;
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
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 조향 비행 | 탭: 기관포 | 더블탭: 유도 미사일 (화면 버튼 없음)' : 'Drag: Fly | Tap: Cannon | Double Tap: Missile (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_ace_fighter"
          gameTitle={isKo ? '3D 복셀 에이스 파이터: 창공의 발키리' : 'Voxel Ace Fighter: Valkyrie of Skies'}
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

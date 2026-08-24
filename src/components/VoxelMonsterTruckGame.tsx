import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMonsterTruckGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyTruck {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  rot: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export const VoxelMonsterTruckGame: React.FC<VoxelMonsterTruckGameProps> = ({
  deck: _deck,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_monster_truck') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [enemiesLeft, setEnemiesLeft] = useState<number>(3);
  const [nitro, setNitro] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    truckPos: new THREE.Vector3(0, 0.8, 15),
    truckRot: 0,
    speed: 0,
    hp: 100,
    nitro: 100,
    isNitro: false,
    score: 0,
    enemiesLeft: 3,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    enemies: [] as EnemyTruck[],
    playerTruck: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const activateNitro = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.nitro < 25) return;
    s.isNitro = true;
    s.nitro -= 25;
    s.speed = 1.2;
    setNitro(Math.floor(s.nitro));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setTimeout(() => {
      s.isNitro = false;
    }, 1500);
  };

  const performDonutTurn = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.truckRot += Math.PI;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3f2e1e);
    scene.fog = new THREE.FogExp2(0x3f2e1e, 0.015);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 14, 28);
    camera.lookAt(0, 1, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffeedd, 0.8);
    scene.add(ambLight);

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Mud Arena Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Monster Truck
    const pGroup = new THREE.Group();
    const pBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.2, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 })
    );
    pBody.position.y = 1.0;
    pGroup.add(pBody);

    pGroup.position.set(0, 0.8, 15);
    scene.add(pGroup);
    stateRef.current.playerTruck = pGroup;

    // Spawn 3 Enemy Trucks
    stateRef.current.enemies = [];
    for (let i = 0; i < 3; i++) {
      const eGroup = new THREE.Group();
      const eBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.2, 3.8),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
      );
      eBody.position.y = 1.0;
      eGroup.add(eBody);

      const ex = (i - 1) * 14;
      const ez = -15;
      eGroup.position.set(ex, 0.8, ez);
      scene.add(eGroup);

      stateRef.current.enemies.push({
        mesh: eGroup,
        pos: new THREE.Vector3(ex, 0.8, ez),
        rot: Math.PI,
        hp: 100,
        maxHp: 100,
        alive: true
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

      // Nitro recharge
      s.nitro = Math.min(100, s.nitro + dt * 10);
      setNitro(Math.round(s.nitro));

      // Move player truck
      const moveSpeed = s.isNitro ? 28 : (s.speed !== 0 ? 14 : 0);
      if (moveSpeed > 0) {
        s.truckPos.x += Math.sin(s.truckRot) * moveSpeed * dt;
        s.truckPos.z += Math.cos(s.truckRot) * moveSpeed * dt;
        s.truckPos.x = THREE.MathUtils.clamp(s.truckPos.x, -35, 35);
        s.truckPos.z = THREE.MathUtils.clamp(s.truckPos.z, -35, 35);
      }

      if (pGroup) {
        pGroup.position.copy(s.truckPos);
        pGroup.rotation.y = s.truckRot;
      }

      // Camera follow
      camera.position.set(s.truckPos.x, 14, s.truckPos.z + 16);
      camera.lookAt(s.truckPos.x, 1, s.truckPos.z);

      // Enemies AI & Collisions
      s.enemies.forEach(e => {
        if (!e.alive) return;

        const toPlayer = new THREE.Vector3().subVectors(s.truckPos, e.pos).normalize();
        e.pos.addScaledVector(toPlayer, 8 * dt);
        e.mesh.position.copy(e.pos);

        // Check Truck Smash
        const dist = s.truckPos.distanceTo(e.pos);
        if (dist < 3.2) {
          const dmgToEnemy = s.isNitro ? 60 : 30;
          const dmgToPlayer = s.isNitro ? 5 : 15;

          e.hp -= dmgToEnemy;
          s.hp = Math.max(0, s.hp - dmgToPlayer);
          s.score += 250;
          setPlayerHp(s.hp);
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          // Bounce back
          s.truckPos.subScaledVector(toPlayer, 4.0);
          e.pos.addScaledVector(toPlayer, 4.0);

          if (e.hp <= 0) {
            e.alive = false;
            scene.remove(e.mesh);
            s.enemiesLeft -= 1;
            setEnemiesLeft(s.enemiesLeft);

            if (s.enemiesLeft <= 0 && !s.isGameOver) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_monster_truck',
                gameTitle: '복셀 몬스터 트럭 데몰리션',
                durationSeconds: duration,
                score: s.score + 2000,
                difficulty: 'NIGHTMARE',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }

          if (s.hp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_monster_truck',
              gameTitle: '복셀 몬스터 트럭 데몰리션',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'NIGHTMARE',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
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
    s.truckPos.set(0, 0.8, 15);
    s.truckRot = 0;
    s.speed = 0;
    s.hp = 100;
    s.nitro = 100;
    s.score = 0;
    s.enemiesLeft = 3;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.enemies.forEach((e, idx) => {
      e.alive = true;
      e.hp = 100;
      const ex = (idx - 1) * 14;
      e.pos.set(ex, 0.8, -15);
      s.scene?.add(e.mesh);
    });
    setPlayerHp(100);
    setEnemiesLeft(3);
    setNitro(100);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 몬스터 트럭' : 'Voxel Monster Truck'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '적 트럭' : 'Rivals', value: `${enemiesLeft}대`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '니트로' : 'Nitro', value: `${nitro}%`, color: nitro >= 25 ? 'text-amber-400 font-bold' : 'text-slate-400' },
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

              if (Math.abs(dx) > 6) {
                moved = true;
                stateRef.current.truckRot -= dx * 0.003;
              }
              if (Math.abs(dy) > 6) {
                moved = true;
                stateRef.current.speed = dy < 0 ? 0.6 : -0.3;
              }
              if (dy < -25) {
                activateNitro();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.speed = 0;

              if (!moved) {
                // Tap: Donut Turn
                performDonutTurn();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={activateNitro}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 조향 & 주행 | 탭: 360° 도넛 턴 | 더블탭/위로: 니트로 램 어택 (버튼 없음)' : 'Drag: Steer & Drive | Tap: Donut Turn | Double Tap/Up: Nitro Ram (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_monster_truck"
          gameTitle={isKo ? '3D 복셀 몬스터 트럭: 데몰리션 더비 난투' : 'Voxel Monster Truck: Demolition Derby'}
          sportType="racing"
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

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPirateBattlesGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Cannonball {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  isPlayer: boolean;
}

interface PirateShip {
  group: THREE.Group;
  x: number;
  z: number;
  rotY: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  shootTimer: number;
}

export const VoxelPirateBattlesGame: React.FC<VoxelPirateBattlesGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_pirate_battles') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hp, setHp] = useState<number>(100);
  const [sunkCount, setSunkCount] = useState<number>(0);
  const targetSunk = 4;
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    playerX: 0,
    playerZ: 0,
    playerRotY: 0,
    playerSpeed: 0,
    moveDir: new THREE.Vector2(0, 0),
    hp: 100,
    sunkCount: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    cooldownLeft: 0,
    cooldownRight: 0,
    cannonballs: [] as Cannonball[],
    enemies: [] as PirateShip[],
    playerShip: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const fireCannons = (side: 'left' | 'right') => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;
    if (side === 'left' && s.cooldownLeft > 0) return;
    if (side === 'right' && s.cooldownRight > 0) return;

    if (side === 'left') s.cooldownLeft = 0.8;
    else s.cooldownRight = 0.8;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const angleOffset = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    const fireAngle = s.playerRotY + angleOffset;
    const ballGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

    for (let i = -1; i <= 1; i++) {
      const ball = new THREE.Mesh(ballGeo, ballMat);
      const spread = i * 0.12;
      const spawnX = s.playerX + Math.sin(fireAngle + spread) * 1.5;
      const spawnZ = s.playerZ + Math.cos(fireAngle + spread) * 1.5;
      ball.position.set(spawnX, 1.0, spawnZ);
      s.scene.add(ball);

      const speed = 28;
      s.cannonballs.push({
        mesh: ball,
        vx: Math.sin(fireAngle + spread) * speed,
        vy: 2.5,
        vz: Math.cos(fireAngle + spread) * speed,
        isPlayer: true
      });
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0284c7);
    scene.fog = new THREE.Fog(0x0284c7, 30, 100);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 0, -5);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffedd5, 1.4);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Ocean Mesh
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.2 })
    );
    ocean.rotation.x = -Math.PI / 2;
    scene.add(ocean);

    // Player Pirate Galleon
    const pShip = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.2, 4.4),
      new THREE.MeshStandardMaterial({ color: 0x78350f })
    );
    hull.position.y = 0.6;
    pShip.add(hull);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x451a03 })
    );
    mast.position.y = 2.4;
    pShip.add(mast);

    pShip.position.set(0, 0, 0);
    scene.add(pShip);
    stateRef.current.playerShip = pShip;

    // Spawn 4 Enemy Ships
    stateRef.current.enemies = [];
    for (let i = 0; i < targetSunk; i++) {
      const eShip = new THREE.Group();
      const eHull = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 1.0, 4.0),
        new THREE.MeshStandardMaterial({ color: 0x991b1b })
      );
      eHull.position.y = 0.5;
      eShip.add(eHull);

      const ex = (i % 2 === 0 ? 1 : -1) * (14 + i * 4);
      const ez = -15 - i * 8;
      eShip.position.set(ex, 0, ez);
      scene.add(eShip);

      stateRef.current.enemies.push({
        group: eShip,
        x: ex,
        z: ez,
        rotY: Math.PI,
        hp: 3,
        maxHp: 3,
        alive: true,
        shootTimer: 2.0 + Math.random() * 2.0
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

      // Cooldowns
      if (s.cooldownLeft > 0) s.cooldownLeft -= dt;
      if (s.cooldownRight > 0) s.cooldownRight -= dt;

      // Player Movement
      const speed = 10;
      s.playerX += s.moveDir.x * speed * dt;
      s.playerZ += s.moveDir.y * speed * dt;
      s.playerX = THREE.MathUtils.clamp(s.playerX, -40, 40);
      s.playerZ = THREE.MathUtils.clamp(s.playerZ, -40, 40);

      if (s.moveDir.length() > 0.1) {
        s.playerRotY = Math.atan2(s.moveDir.x, s.moveDir.y);
      }

      if (pShip) {
        pShip.position.set(s.playerX, 0, s.playerZ);
        pShip.rotation.y = s.playerRotY;
      }

      // Camera Follow
      camera.position.set(s.playerX, 14, s.playerZ + 18);
      camera.lookAt(s.playerX, 1, s.playerZ);

      // Cannonballs Update
      for (let i = s.cannonballs.length - 1; i >= 0; i--) {
        const b = s.cannonballs[i];
        b.vy -= 9.8 * 0.8 * dt;
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.y += b.vy * dt;
        b.mesh.position.z += b.vz * dt;

        // Check Hit Enemy
        for (const e of s.enemies) {
          if (e.alive && b.mesh.position.distanceTo(e.group.position) < 2.4) {
            e.hp -= 1;
            s.score += 200;
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (e.hp <= 0) {
              e.alive = false;
              scene.remove(e.group);
              s.sunkCount += 1;
              setSunkCount(s.sunkCount);

              if (s.sunkCount >= targetSunk && !s.isGameOver) {
                s.isVictory = true;
                s.isGameOver = true;
                setIsGameOver(true);
                const duration = (Date.now() - s.startTime) / 1000;
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'voxel_pirate_battles',
                  gameTitle: '복셀 해적 대함대',
                  durationSeconds: duration,
                  score: s.score + 2500,
                  difficulty: 'NIGHTMARE',
                  isVictory: true
                });
                setSettlementReceipt(receipt);
                onReward(receipt.totalSns);
              }
            }
            break;
          }
        }

        if (b.mesh.position.y <= 0) {
          scene.remove(b.mesh);
          s.cannonballs.splice(i, 1);
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
    const s = stateRef.current;
    s.playerX = 0;
    s.playerZ = 0;
    s.playerRotY = 0;
    s.hp = 100;
    s.sunkCount = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.enemies.forEach((e, idx) => {
      e.alive = true;
      e.hp = 3;
      const ex = (idx % 2 === 0 ? 1 : -1) * (14 + idx * 4);
      const ez = -15 - idx * 8;
      e.group.position.set(ex, 0, ez);
      s.scene?.add(e.group);
    });
    setHp(100);
    setSunkCount(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 해상 함대전 미션' : 'STEP 1: NAVAL BATTLE',
      title: isKo ? '적 해적선 4척 격침 완승' : 'Sink 4 Enemy Pirate Ships',
      description: isKo
        ? '거친 대양을 항해하며 포격 위치를 선점하고 적 해적선 4척을 모두 격침하세요.'
        : 'Navigate open oceans, maneuver for broadside firing lines and sink 4 enemy vessels.',
      keyPoints: isKo
        ? [
            '적 함선 4척 격침 시 즉시 승리',
            '선체 HP 100% 보존하며 함포 사격',
            '격침마다 +200P 전리품 획득'
          ]
        : [
            'Sink 4 pirate ships to win',
            'Protect hull HP at 100%',
            '+200P loot points per vessel'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 항해 & 좌/우현 함포 사격' : 'Drag Steer & Broadside Fire',
      description: isKo
        ? '가상 조타키 없이 드래그로 항해하고, 화면 좌/우측을 탭하여 좌현/우현 함포를 일제 사격합니다.'
        : 'Drag anywhere to steer ship, and tap left/right screen halves for broadside volleys with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 함선 360° 조타 및 항해',
            '💥 화면 좌측 탭: 좌현 일제 포격',
            '💥 화면 우측 탭: 우현 일제 포격'
          ]
        : [
            '👆 Drag: Smooth 360° steering',
            '💥 Tap Left: Port broadside fire',
            '💥 Tap Right: Starboard broadside fire'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '함대전 승리 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 선체 HP 및 전리품 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Hull HP and loot bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 해적 대함대' : 'Voxel Pirate Battles'}
        language={language}
        hp={{ current: hp, max: 100 }}
        telemetries={[
          { label: isKo ? '격침' : 'Sunk', value: `${sunkCount}/${targetSunk}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300' }
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

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                moved = true;
                stateRef.current.moveDir.x = Math.abs(dx) > 8 ? (dx > 0 ? 1 : -1) : 0;
                stateRef.current.moveDir.y = Math.abs(dy) > 8 ? (dy > 0 ? 1 : -1) : 0;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.x = 0;
              stateRef.current.moveDir.y = 0;

              if (!moved) {
                // Tap Left / Right Broadside
                if (startX < rect.width / 2) {
                  fireCannons('left');
                } else {
                  fireCannons('right');
                }
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 조타 항해 | 좌/우측 탭: 좌현/우현 일제 사격 (버튼 없음)' : 'Drag: Steer | Tap Left/Right: Port/Starboard Fire (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_pirate_battles"
          gameTitle={isKo ? '3D 복셀 해적 대함대: 해상 함대전' : 'Voxel Pirate Battles: Naval Warfare'}
          customSteps={customTutorialSteps}
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

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelZombieSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Zombie {
  mesh: THREE.Mesh;
  hp: number;
  speed: number;
  alive: boolean;
}

export const VoxelZombieSurvivalGame: React.FC<VoxelZombieSurvivalGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_zombie_survival') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [wave, setWave] = useState<number>(1);
  const maxWaves = 3;
  const [ammo, setAmmo] = useState<number>(30);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    playerX: 0,
    playerZ: 0,
    moveDir: new THREE.Vector2(0, 0),
    aimAngle: 0,
    playerHp: 100,
    ammo: 30,
    wave: 1,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    zombies: [] as Zombie[],
    bullets: [] as { mesh: THREE.Mesh; vel: THREE.Vector3 }[],
    playerMesh: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const fireGun = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene || s.ammo <= 0) return;

    s.ammo -= 1;
    setAmmo(s.ammo);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const bMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.8 })
    );
    bMesh.position.set(s.playerX, 1.2, s.playerZ);
    s.scene.add(bMesh);

    const fwd = new THREE.Vector3(-Math.sin(s.aimAngle), 0, -Math.cos(s.aimAngle)).normalize();
    s.bullets.push({ mesh: bMesh, vel: fwd.multiplyScalar(40) });
  };

  const reloadAmmo = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.ammo = 30;
    setAmmo(30);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080c);
    scene.fog = new THREE.FogExp2(0x05080c, 0.04);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.0);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    moonLight.position.set(-20, 40, -20);
    scene.add(moonLight);

    // Outpost Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36),
      new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Hero
    const pGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x10b981 })
    );
    body.position.y = 0.9;
    pGroup.add(body);
    pGroup.position.set(0, 0, 0);
    scene.add(pGroup);
    stateRef.current.playerMesh = pGroup;

    // Spawn Wave Zombies
    const spawnWave = (w: number) => {
      stateRef.current.zombies = [];
      const count = 6 + w * 4;
      for (let i = 0; i < count; i++) {
        const zMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.8, 0.8),
          new THREE.MeshStandardMaterial({ color: 0xdc2626 })
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = 14 + Math.random() * 4;
        const zx = Math.cos(angle) * dist;
        const zz = Math.sin(angle) * dist;
        zMesh.position.set(zx, 0.9, zz);
        scene.add(zMesh);

        stateRef.current.zombies.push({
          mesh: zMesh,
          hp: 30 + w * 15,
          speed: 3.5 + w * 0.5,
          alive: true
        });
      }
    };
    spawnWave(1);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Player Movement
      const speed = 10;
      s.playerX += s.moveDir.x * speed * dt;
      s.playerZ += s.moveDir.y * speed * dt;
      s.playerX = THREE.MathUtils.clamp(s.playerX, -15, 15);
      s.playerZ = THREE.MathUtils.clamp(s.playerZ, -15, 15);

      if (s.moveDir.length() > 0.1) {
        s.aimAngle = Math.atan2(-s.moveDir.x, -s.moveDir.y);
      }

      if (pGroup) {
        pGroup.position.set(s.playerX, 0, s.playerZ);
        pGroup.rotation.y = s.aimAngle;
      }

      // Update Bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.mesh.position.addScaledVector(b.vel, dt);

        // Check Zombie Hit
        for (const z of s.zombies) {
          if (z.alive && b.mesh.position.distanceTo(z.mesh.position) < 1.4) {
            z.hp -= 25;
            s.score += 50;
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (z.hp <= 0) {
              z.alive = false;
              scene.remove(z.mesh);
              s.score += 150;
              setScore(s.score);
            }
            break;
          }
        }

        if (b.mesh.position.length() > 30) {
          scene.remove(b.mesh);
          s.bullets.splice(i, 1);
        }
      }

      // Update Zombies Chasing Player
      let aliveZombies = 0;
      s.zombies.forEach(z => {
        if (!z.alive) return;
        aliveZombies++;

        const dir = new THREE.Vector3(s.playerX - z.mesh.position.x, 0, s.playerZ - z.mesh.position.z).normalize();
        z.mesh.position.addScaledVector(dir, z.speed * dt);
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Attack Player
        if (z.mesh.position.distanceTo(new THREE.Vector3(s.playerX, 0.9, s.playerZ)) < 1.4) {
          s.playerHp -= 20 * dt;
          setPlayerHp(Math.max(0, Math.round(s.playerHp)));

          if (s.playerHp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_zombie_survival',
              gameTitle: '복셀 좀비 서바이벌',
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

      // Wave Clear Check
      if (aliveZombies === 0 && !s.isGameOver) {
        if (s.wave < maxWaves) {
          s.wave += 1;
          setWave(s.wave);
          spawnWave(s.wave);
        } else {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_zombie_survival',
            gameTitle: '복셀 좀비 서바이벌',
            durationSeconds: duration,
            score: s.score + 2500,
            difficulty: 'NIGHTMARE',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
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
    s.playerHp = 100;
    s.ammo = 30;
    s.wave = 1;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.zombies.forEach(z => s.scene?.remove(z.mesh));
    s.zombies = [];
    setPlayerHp(100);
    setAmmo(30);
    setWave(1);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 좀비 호드 요새 사수' : 'STEP 1: ZOMBIE OUTPOST',
      title: isKo ? '3개 웨이브 좀비 군단 전원 섬멸' : 'Survive 3 Zombie Waves',
      description: isKo
        ? '어둠 속에서 몰려오는 변이체 좀비 호드를 사격하여 전원 섬멸하고 요새를 사수하세요.'
        : 'Eliminate all mutant zombie waves with precision rifle fire to secure the outpost.',
      keyPoints: isKo
        ? [
            '3웨이브 좀비 전멸 시 완승',
            '탄약 소진 시 더블탭 재장전',
            '플레이어 HP 0% 도달 방어'
          ]
        : [
            'Clear 3 waves to win',
            'Double tap to reload ammo',
            'Prevent player HP reaching 0%'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 기동 & 탭 사격' : 'Drag Maneuver & Tap Fire',
      description: isKo
        ? '가상 D-Pad 없이 화면 드래그로 요새를 360° 기동하고, 탭하여 정밀 사격, 더블탭으로 재장전합니다.'
        : 'Drag anywhere to move around and tap to fire rifle shells with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 360° 부드러운 전방위 기동',
            '💥 탭: 전방 정밀 라이플 사격',
            '⚡ 더블탭: 탄약 30발 즉시 재장전'
          ]
        : [
            '👆 Drag: Smooth 360° movement',
            '💥 Tap: Precision rifle fire',
            '⚡ Double Tap: Fast ammo reload'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '요새 사수 승리 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 체력 및 좀비 처치 콤보 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining HP and kill bonuses',
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
        title={isKo ? '복셀 좀비 서바이벌' : 'Voxel Zombie Survival'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '웨이브' : 'Wave', value: `${wave}/${maxWaves}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '탄약' : 'Ammo', value: `${ammo}/30`, color: ammo <= 5 ? 'text-rose-400 font-bold' : 'text-emerald-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-yellow-300' }
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
              stateRef.current.moveDir.set(0, 0);

              if (!moved) {
                // Tap: Fire Gun
                fireGun();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={reloadAmmo}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-rose-500/30 rounded-full text-[10px] text-rose-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 이동 | 탭: 사격 | 더블탭: 탄약 재장전 (버튼 없음)' : 'Drag: Move | Tap: Fire Rifle | Double Tap: Reload Ammo (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_zombie_survival"
          gameTitle={isKo ? '3D 복셀 좀비 서바이벌: 요새 사수' : 'Voxel Zombie Survival: Outpost Defense'}
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
export default VoxelZombieSurvivalGame;

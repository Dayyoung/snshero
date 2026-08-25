import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelVampireSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelVampireSurvivalGame: React.FC<VoxelVampireSurvivalGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_vampire_survival') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [survivalTime, setSurvivalTime] = useState<number>(0);
  const targetTime = 45;
  const [kills, setKills] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0.5, 0),
    moveDir: new THREE.Vector2(0, 0),
    playerHp: 100,
    survivalTime: 0,
    kills: 0,
    score: 0,
    scytheAngle: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    enemies: [] as { mesh: THREE.Mesh; hp: number; isAlive: boolean }[],
    orbs: [] as { mesh: THREE.Mesh; pos: THREE.Vector3 }[],
    playerMesh: null as THREE.Mesh | null,
    scytheMesh: null as THREE.Mesh | null,
    scene: null as THREE.Scene | null
  });

  const triggerPulse = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Knockback and damage surrounding enemies
    s.enemies.forEach(e => {
      if (e.isAlive && e.mesh.position.distanceTo(s.pPos) < 6.0) {
        e.hp -= 35;
        const pushDir = new THREE.Vector3().subVectors(e.mesh.position, s.pPos).normalize();
        e.mesh.position.addScaledVector(pushDir, 3.5);

        if (e.hp <= 0) {
          e.isAlive = false;
          s.scene?.remove(e.mesh);
          s.kills += 1;
          s.score += 150;
          setKills(s.kills);
          setScore(s.score);
        }
      }
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0612);
    scene.fog = new THREE.FogExp2(0x0a0612, 0.025);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 22, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xa855f7, 1.8);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Arena Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x181024, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Hero
    const playerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xc084fc })
    );
    playerMesh.position.set(0, 0.9, 0);
    scene.add(playerMesh);
    stateRef.current.playerMesh = playerMesh;

    // Orbiting Scythe Weapon
    const scythe = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e })
    );
    scene.add(scythe);
    stateRef.current.scytheMesh = scythe;

    // Timer Interval
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.survivalTime += 1;
      setSurvivalTime(s.survivalTime);
      s.score += 25;
      setScore(s.score);

      // Spawn Swarm Mob every second
      if (s.enemies.filter(e => e.isAlive).length < 25) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 24 + Math.random() * 6;
        const ex = s.pPos.x + Math.cos(angle) * dist;
        const ez = s.pPos.z + Math.sin(angle) * dist;

        const mob = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 1.4, 1.0),
          new THREE.MeshStandardMaterial({ color: 0xdc2626 })
        );
        mob.position.set(ex, 0.7, ez);
        scene.add(mob);

        s.enemies.push({
          mesh: mob,
          hp: 20 + s.survivalTime,
          isAlive: true
        });
      }

      if (s.survivalTime >= targetTime && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_vampire_survival',
          gameTitle: '복셀 뱀파이어 서바이벌',
          durationSeconds: duration,
          score: s.score + 2500,
          difficulty: 'NIGHTMARE',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }, 1000);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Player Movement
      const speed = 11;
      s.pPos.x += s.moveDir.x * speed * dt;
      s.pPos.z += s.moveDir.y * speed * dt;
      s.pPos.x = THREE.MathUtils.clamp(s.pPos.x, -35, 35);
      s.pPos.z = THREE.MathUtils.clamp(s.pPos.z, -35, 35);

      if (playerMesh) {
        playerMesh.position.set(s.pPos.x, 0.9, s.pPos.z);
      }

      // Orbiting Scythe Rotation
      s.scytheAngle += 5.5 * dt;
      const scytheRadius = 3.2;
      const sx = s.pPos.x + Math.cos(s.scytheAngle) * scytheRadius;
      const sz = s.pPos.z + Math.sin(s.scytheAngle) * scytheRadius;
      if (scythe) {
        scythe.position.set(sx, 1.0, sz);
        scythe.rotation.y = -s.scytheAngle;
      }

      // Camera Follow
      camera.position.set(s.pPos.x * 0.4, 22, s.pPos.z * 0.4 + 16);
      camera.lookAt(s.pPos.x * 0.4, 0, s.pPos.z * 0.4);

      // Update Enemies
      s.enemies.forEach(e => {
        if (!e.isAlive) return;

        const dir = new THREE.Vector3().subVectors(s.pPos, e.mesh.position).normalize();
        e.mesh.position.addScaledVector(dir, 4.5 * dt);

        // Scythe Slash Hit Check
        if (e.mesh.position.distanceTo(new THREE.Vector3(sx, 1.0, sz)) < 1.8) {
          e.hp -= 25;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (e.hp <= 0) {
            e.isAlive = false;
            scene.remove(e.mesh);
            s.kills += 1;
            s.score += 100;
            setKills(s.kills);
            setScore(s.score);
          }
        }

        // Mob Attacks Player
        if (e.mesh.position.distanceTo(s.pPos) < 1.4) {
          s.playerHp -= 15 * dt;
          setPlayerHp(Math.max(0, Math.round(s.playerHp)));

          if (s.playerHp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_vampire_survival',
              gameTitle: '복셀 뱀파이어 서바이벌',
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
      clearInterval(timerInterval);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = stateRef.current;
    s.pPos.set(0, 0.5, 0);
    s.playerHp = 100;
    s.survivalTime = 0;
    s.kills = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.enemies.forEach(e => s.scene?.remove(e.mesh));
    s.enemies = [];
    setPlayerHp(100);
    setSurvivalTime(0);
    setKills(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 45초 밤의 서바이벌' : 'STEP 1: VAMPIRE SURVIVAL',
      title: isKo ? '45초 생존 & 언데드 군단 섬멸' : 'Survive 45s & Slay Undead',
      description: isKo
        ? '몰려오는 언데드 몬스터들을 회전하는 낫으로 베어 넘기며 45초 동안 살아남으세요.'
        : 'Slice through swarming undead mobs with an orbiting scythe and survive 45s.',
      keyPoints: isKo
        ? [
            '45초 생존 성공 시 즉시 완승',
            '회전 사신의 낫으로 적 자동 타격',
            '플레이어 HP 0% 도달 방어'
          ]
        : [
            'Survive 45s to win',
            'Orbiting death scythe slashes mobs automatically',
            'Prevent HP reaching 0%'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 카이팅 & 탭 펄스 방출' : 'Drag Kite & Tap Pulse',
      description: isKo
        ? '가상 D-Pad 없이 화면 드래그로 영웅을 360° 카이팅 무빙하고, 위험할 때 탭하여 광역 넉백 펄스를 방출합니다.'
        : 'Drag anywhere to kite hero smoothly and tap to unleash a knockback energy pulse with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 360° 부드러운 카이팅 기동',
            '💥 탭: 주변 적 광역 넉백 펄스 폭발',
            '⚡ 낫 타격 범위 내로 적 유인'
          ]
        : [
            '👆 Drag: Smooth 360° kiting movement',
            '💥 Tap: Radial knockback energy pulse',
            '⚡ Lure mobs into scythe orbit radius'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '생존 승리 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '처치 수 및 잔여 체력 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Kills and remaining HP bonuses',
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
        title={isKo ? '복셀 뱀파이어 서바이벌' : 'Voxel Vampire Survival'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${survivalTime}s/${targetTime}s`, color: survivalTime >= targetTime ? 'text-emerald-400 font-bold' : 'text-purple-300' },
          { label: isKo ? '처치' : 'Kills', value: `💀${kills}`, color: 'text-rose-400 font-bold' },
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
                // Tap: Pulse Burst
                triggerPulse();
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
        <div className="px-3 py-1 bg-black/75 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 카이팅 이동 | 탭: 펄스 방출 (자동 낫 공격, 버튼 없음)' : 'Drag: Kite Move | Tap: Pulse Blast (Auto Scythe, No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_vampire_survival"
          gameTitle={isKo ? '3D 복셀 뱀파이어 서바이벌: 밤의 생존' : 'Voxel Vampire Survival: Night Realm'}
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
export default VoxelVampireSurvivalGame;

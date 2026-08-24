import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMegaFlareAssaultGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyShip {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  hp: number;
  maxHp: number;
  speed: number;
  points: number;
}

interface Laser {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isMega: boolean;
}

export const VoxelMegaFlareAssaultGame: React.FC<VoxelMegaFlareAssaultGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_mega_flare') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [megaGauge, setMegaGauge] = useState<number>(0);
  const [destroyedCount, setDestroyedCount] = useState<number>(0);
  const targetEnemies = 15;
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    aimX: 0,
    aimY: 0,
    score: 0,
    megaGauge: 0,
    destroyedCount: 0,
    timeLeft: 60,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    enemies: [] as EnemyShip[],
    lasers: [] as Laser[],
    scene: null as THREE.Scene | null,
    playerDragon: null as THREE.Group | null
  });

  const fireNormalShot = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    const lGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const lMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const lMesh = new THREE.Mesh(lGeo, lMat);
    const startPos = new THREE.Vector3(s.aimX * 4, s.aimY * 3, 4);
    lMesh.position.copy(startPos);
    s.scene.add(lMesh);

    const targetPos = new THREE.Vector3(s.aimX * 25, s.aimY * 18, -60);
    const vel = targetPos.sub(startPos).normalize().multiplyScalar(65);

    s.lasers.push({
      mesh: lMesh,
      pos: startPos.clone(),
      vel,
      isMega: false
    });

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const fireMegaFlare = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.megaGauge < 100 || !s.scene) return;

    s.megaGauge = 0;
    setMegaGauge(0);

    const mGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const mMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const mMesh = new THREE.Mesh(mGeo, mMat);
    const startPos = new THREE.Vector3(0, 0, 4);
    mMesh.position.copy(startPos);
    s.scene.add(mMesh);

    const vel = new THREE.Vector3(0, 0, -45);
    s.lasers.push({
      mesh: mMesh,
      pos: startPos.clone(),
      vel,
      isMega: true
    });

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1322);
    scene.fog = new THREE.FogExp2(0x0c1322, 0.02);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 150);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 1, -20);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x60a5fa, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    sunLight.position.set(10, 30, 20);
    scene.add(sunLight);

    // Player Dragon
    const dragonGroup = new THREE.Group();
    const dBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 2.4), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    dragonGroup.add(dBody);

    const dWings = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
    dWings.position.set(0, 0.4, 0);
    dragonGroup.add(dWings);

    dragonGroup.position.set(0, 0, 4);
    scene.add(dragonGroup);
    stateRef.current.playerDragon = dragonGroup;

    // Timer Interval
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);

      if (s.timeLeft <= 0 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_mega_flare',
          gameTitle: '복셀 메가 플레어 어설트',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'NIGHTMARE',
          isVictory: s.destroyedCount >= 10
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }, 1000);

    let animId: number;
    let lastTime = performance.now();
    let spawnTimer = 0;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Spawn Enemy Ships
      spawnTimer += dt;
      if (spawnTimer > 1.4 && s.enemies.length < 7) {
        spawnTimer = 0;
        const ex = (Math.random() - 0.5) * 30;
        const ey = (Math.random() - 0.5) * 16 + 2;
        const ez = -70;

        const eGroup = new THREE.Group();
        const eMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 3.0), new THREE.MeshStandardMaterial({ color: 0x334155 }));
        eGroup.add(eMesh);
        eGroup.position.set(ex, ey, ez);
        scene.add(eGroup);

        s.enemies.push({
          mesh: eGroup,
          pos: new THREE.Vector3(ex, ey, ez),
          hp: 2,
          maxHp: 2,
          speed: 12 + Math.random() * 6,
          points: 200
        });
      }

      // Aim dragon
      if (dragonGroup) {
        dragonGroup.position.set(s.aimX * 3, s.aimY * 2, 4);
        dragonGroup.rotation.z = -s.aimX * 0.3;
        dragonGroup.rotation.x = s.aimY * 0.2;
      }

      // Update Lasers
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        const l = s.lasers[i];
        l.pos.addScaledVector(l.vel, dt);
        l.mesh.position.copy(l.pos);

        let hit = false;
        for (let eIdx = s.enemies.length - 1; eIdx >= 0; eIdx--) {
          const e = s.enemies[eIdx];
          const dist = l.pos.distanceTo(e.pos);
          const hitRadius = l.isMega ? 6.0 : 2.0;

          if (dist < hitRadius) {
            hit = !l.isMega;
            e.hp -= l.isMega ? 10 : 1;

            if (e.hp <= 0) {
              scene.remove(e.mesh);
              s.enemies.splice(eIdx, 1);
              s.destroyedCount += 1;
              s.score += e.points;
              s.megaGauge = Math.min(100, s.megaGauge + 15);

              setDestroyedCount(s.destroyedCount);
              setScore(s.score);
              setMegaGauge(s.megaGauge);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

              if (s.destroyedCount >= targetEnemies && !s.isGameOver) {
                s.isVictory = true;
                s.isGameOver = true;
                setIsGameOver(true);
                const duration = (Date.now() - s.startTime) / 1000;
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'voxel_mega_flare',
                  gameTitle: '복셀 메가 플레어 어설트',
                  durationSeconds: duration,
                  score: s.score + 2500,
                  difficulty: 'NIGHTMARE',
                  isVictory: true
                });
                setSettlementReceipt(receipt);
                onReward(receipt.totalSns);
              }
            }
          }
        }

        if (hit || l.pos.z < -80) {
          scene.remove(l.mesh);
          s.lasers.splice(i, 1);
        }
      }

      // Move Enemies Forward
      for (let eIdx = s.enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = s.enemies[eIdx];
        e.pos.z += e.speed * dt;
        e.mesh.position.copy(e.pos);

        if (e.pos.z > 10) {
          scene.remove(e.mesh);
          s.enemies.splice(eIdx, 1);
        }
      }

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
    s.enemies.forEach(e => s.scene?.remove(e.mesh));
    s.lasers.forEach(l => s.scene?.remove(l.mesh));
    s.enemies = [];
    s.lasers = [];
    s.score = 0;
    s.megaGauge = 0;
    s.destroyedCount = 0;
    s.timeLeft = 60;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setScore(0);
    setMegaGauge(0);
    setDestroyedCount(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 공중 함대 요격' : 'STEP 1: AIR FLEET ASSAULT',
      title: isKo ? '적 비행선 격추 & 메가 게이지' : 'Intercept Enemy Ships',
      description: isKo
        ? '하늘을 뒤덮는 적 침공 함선을 조준 요격하고 메가 플레어 브레스로 전장을 일소하세요.'
        : 'Aim and shoot down invading fleet ships, charge your mega gauge and unleash catastrophic breath.',
      keyPoints: isKo
        ? [
            '적 함선 15대 격추 시 완승 클리어',
            '제한 시간 60초 내 공중전 제압',
            '격추마다 메가 게이지 +15% 급상승'
          ]
        : [
            'Shoot down 15 enemy ships to win',
            'Dominate the sky within 60s limit',
            '+15% Mega gauge boost per kill'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조준' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 조준 & 2x 탭 궁극기' : 'Drag Aim & Double-Tap Ultimate',
      description: isKo
        ? '가상 버튼 없이 드래그로 십자선을 조준하고, 탭으로 포격, 2x 탭으로 100% 메가 플레어를 발사합니다.'
        : 'Drag anywhere to aim reticle, tap to fire fireballs, and double-tap to unleash full Mega Flare.',
      keyPoints: isKo
        ? [
            '👆 전방향 드래그: 드래곤 비행 및 십자선 조준',
            '🔥 탭: 고속 파이어볼 포격',
            '⚡ 2x 탭: 100% 게이지 메가 플레어 전체 격파'
          ]
        : [
            '👆 Free Drag: Flight aiming reticle',
            '🔥 Tap: High-velocity fireballs',
            '⚡ Double-Tap: 100% Mega Flare sweep'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '공중 함대 제압 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '스피드 격추 및 메가 플레어 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Speed kills and mega flare bonuses',
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
        title={isKo ? '복셀 메가 플레어' : 'Voxel Mega Flare'}
        language={language}
        telemetries={[
          { label: isKo ? '격추' : 'Kills', value: `${destroyedCount}/${targetEnemies}`, color: 'text-amber-300' },
          { label: isKo ? '메가' : 'Mega', value: `${megaGauge}%`, color: megaGauge >= 100 ? 'text-rose-400 font-black animate-pulse' : 'text-orange-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 15 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
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

              if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
                moved = true;
                stateRef.current.aimX = THREE.MathUtils.clamp(stateRef.current.aimX + dx * 0.003, -1, 1);
                stateRef.current.aimY = THREE.MathUtils.clamp(stateRef.current.aimY - dy * 0.003, -1, 1);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Fire Normal Shot
                fireNormalShot();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={fireMegaFlare}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 조준 | 탭: 포격 발사 | 더블탭: 100% 게이지 메가 플레어 (버튼 없음)' : 'Drag: Aim | Tap: Fire | Double Tap: 100% Mega Flare (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_mega_flare"
          gameTitle={isKo ? '3D 복셀 메가 플레어 어설트: 공중 함대 요격' : 'Voxel Mega Flare: Sky Fleet Assault'}
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

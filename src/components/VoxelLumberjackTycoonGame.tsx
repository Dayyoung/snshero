import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelLumberjackTycoonGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelLumberjackTycoonGame: React.FC<VoxelLumberjackTycoonGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_lumberjack_tycoon') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [woodCount, setWoodCount] = useState<number>(0);
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0.5, 10),
    moveDir: new THREE.Vector2(0, 0),
    trees: [] as { mesh: THREE.Group; hp: number; x: number; z: number }[],
    wood: 0,
    build: 0,
    chopCooldown: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    playerGroup: null as THREE.Group | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 16, 22);
    camera.lookAt(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Forest Island
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Build Site (Cabin Base)
    const siteMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
    );
    siteMesh.position.set(0, 0.2, -12);
    scene.add(siteMesh);

    // Lumberjack Player
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    pBody.position.y = 0.9;
    playerGroup.add(pBody);

    const axe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    axe.position.set(0.8, 1.0, 0.4);
    playerGroup.add(axe);

    playerGroup.position.set(0, 0.5, 10);
    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;

    // Spawn 8 Trees
    stateRef.current.trees = [];
    for (let i = 0; i < 8; i++) {
      const tGroup = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 3, 8), new THREE.MeshStandardMaterial({ color: 0x713f12 }));
      trunk.position.y = 1.5;
      tGroup.add(trunk);

      const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4, 8), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
      foliage.position.y = 4.5;
      tGroup.add(foliage);

      const tx = (i % 4 - 1.5) * 8 + (Math.random() - 0.5) * 2;
      const tz = (Math.floor(i / 4) - 0.5) * 10 + 2;
      tGroup.position.set(tx, 0, tz);
      scene.add(tGroup);

      stateRef.current.trees.push({
        mesh: tGroup,
        hp: 3,
        x: tx,
        z: tz
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

      // Move player
      const speed = 11;
      s.pPos.x += s.moveDir.x * speed * dt;
      s.pPos.z += s.moveDir.y * speed * dt;
      s.pPos.x = THREE.MathUtils.clamp(s.pPos.x, -18, 18);
      s.pPos.z = THREE.MathUtils.clamp(s.pPos.z, -18, 18);

      if (playerGroup) {
        playerGroup.position.copy(s.pPos);
      }

      // Check Tree Chop
      s.chopCooldown -= dt;
      if (s.chopCooldown <= 0) {
        s.trees.forEach(t => {
          if (t.hp > 0) {
            const dist = s.pPos.distanceTo(new THREE.Vector3(t.x, 0.5, t.z));
            if (dist < 2.4) {
              t.hp -= 1;
              s.chopCooldown = 0.5;
              s.wood += 2;
              setWoodCount(s.wood);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

              if (t.hp <= 0) {
                t.mesh.scale.set(0, 0, 0);
              }
            }
          }
        });
      }

      // Check Build Site Deposit
      const distToSite = s.pPos.distanceTo(new THREE.Vector3(0, 0.5, -12));
      if (distToSite < 4.0 && s.wood > 0) {
        const deposited = Math.min(s.wood, 2);
        s.wood -= deposited;
        s.build = Math.min(100, s.build + deposited * 5);
        setWoodCount(s.wood);
        setBuildProgress(s.build);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        if (s.build >= 100 && !s.isGameOver) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_lumberjack_tycoon',
            gameTitle: '복셀 벌목꾼 타이쿤',
            durationSeconds: duration,
            score: s.build * 25 + 500,
            difficulty: 'HARD',
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
    s.pPos.set(0, 0.5, 10);
    s.moveDir.set(0, 0);
    s.wood = 0;
    s.build = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.trees.forEach(t => {
      t.hp = 3;
      t.mesh.scale.set(1, 1, 1);
    });
    setWoodCount(0);
    setBuildProgress(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 숲속 벌목 & 타이쿤' : 'STEP 1: LUMBERJACK HARVEST',
      title: isKo ? '나무 벌목 및 기지 건설' : 'Chop Trees & Build Cabin',
      description: isKo
        ? '숲속의 나무에 접근하여 통나무를 벌목하고 북쪽 기지 건설 현장에 납품하여 완공하세요.'
        : 'Approach voxel trees to chop lumber and deliver logs to the north build site to complete construction.',
      keyPoints: isKo
        ? [
            '나무 접근 시 0.5초 주기 자동 벌목',
            '통나무 수집 후 북쪽 기지로 운반',
            '건설 진행도 100% 달성 시 승리'
          ]
        : [
            'Auto-chops lumber every 0.5s near trees',
            'Transport logs to the north base site',
            'Reach 100% build progress to win'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 이동' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원터치 드래그 이동 조작' : 'One-Thumb Free Movement',
      description: isKo
        ? '가상 D-Pad 없이 화면 어디서든 손가락을 드래그하여 벌목꾼을 360도 자유자재로 이동합니다.'
        : 'Drag anywhere on screen to smoothly navigate your lumberjack across the forest with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 전방향 드래그: 벌목꾼 이동',
            '🪵 근접 자동 상호작용 (벌목/건축)',
            '⚡ 최단 경로 운반으로 스피드 보너스'
          ]
        : [
            '👆 Free Drag: Smooth 360° movement',
            '🪵 Proximity auto-interaction',
            '⚡ Optimize delivery route for bonus'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '기지 완공 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '스피드 완공 및 벌목 생산성 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Speed building and harvest bonuses',
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
        title={isKo ? '복셀 벌목꾼 타이쿤' : 'Voxel Lumberjack Tycoon'}
        language={language}
        telemetries={[
          { label: isKo ? '통나무' : 'Logs', value: `${woodCount}개`, color: 'text-amber-300' },
          { label: isKo ? '건설' : 'Build', value: `${buildProgress}%`, color: buildProgress >= 100 ? 'text-emerald-400 font-black animate-pulse' : 'text-cyan-300' }
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

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
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
          {isKo ? '화면 드래그: 벌목꾼 이동 (나무/기지 접근 시 자동 상호작용, 버튼 없음)' : 'Drag: Move Lumberjack (Auto Chops/Builds on proximity, No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_lumberjack_tycoon"
          gameTitle={isKo ? '3D 복셀 벌목꾼 타이쿤: 숲속 기지 건설' : 'Voxel Lumberjack Tycoon: Forest Base'}
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

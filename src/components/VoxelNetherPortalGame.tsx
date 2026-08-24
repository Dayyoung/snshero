import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelNetherPortalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Island {
  mesh: THREE.Group;
  z: number;
  lane: number;
  hasOrb: boolean;
  hasRift: boolean;
  orbMesh?: THREE.Mesh;
}

export const VoxelNetherPortalGame: React.FC<VoxelNetherPortalGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_nether_portal') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [orbsCollected, setOrbsCollected] = useState<number>(0);
  const targetOrbs = 15;
  const [distance, setDistance] = useState<number>(0);
  const [portalProgress, setPortalProgress] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    playerLane: 0,
    playerY: 0,
    jumpVel: 0,
    isJumping: false,
    speed: 18,
    distance: 0,
    score: 0,
    orbsCollected: 0,
    portalProgress: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    playerMesh: null as THREE.Group | null,
    islands: [] as Island[],
    scene: null as THREE.Scene | null
  });

  const handleJump = () => {
    const s = stateRef.current;
    if (s.isJumping || s.isGameOver || s.isVictory || s.isPaused) return;
    s.isJumping = true;
    s.jumpVel = 9;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
  };

  const handleSwitchLane = (dir: -1 | 1) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.playerLane = THREE.MathUtils.clamp(s.playerLane + dir, -1, 1);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0505);
    scene.fog = new THREE.FogExp2(0x1a0505, 0.025);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 2, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xff4422, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xff8844, 1.5);
    dirLight.position.set(5, 15, 5);
    scene.add(dirLight);

    // Lava Floor
    const lava = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 200),
      new THREE.MeshBasicMaterial({ color: 0x991100 })
    );
    lava.rotation.x = -Math.PI / 2;
    lava.position.set(0, -2, -60);
    scene.add(lava);

    // Player Dragon Mesh
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.3 })
    );
    pBody.position.y = 0.5;
    playerGroup.add(pBody);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);
    stateRef.current.playerMesh = playerGroup;

    // Spawn Initial Islands
    stateRef.current.islands = [];
    for (let i = 0; i < 15; i++) {
      const zPos = -i * 8;
      const iGroup = new THREE.Group();

      [-1, 0, 1].forEach(lane => {
        const platform = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.4, 6),
          new THREE.MeshStandardMaterial({ color: 0x3b1c1c })
        );
        platform.position.set(lane * 2.2, 0, 0);
        iGroup.add(platform);
      });

      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xc084fc })
      );
      const orbLane = Math.floor(Math.random() * 3) - 1;
      orb.position.set(orbLane * 2.2, 1.0, 0);
      iGroup.add(orb);

      iGroup.position.set(0, 0, zPos);
      scene.add(iGroup);

      stateRef.current.islands.push({
        mesh: iGroup,
        z: zPos,
        lane: orbLane,
        hasOrb: true,
        hasRift: false,
        orbMesh: orb
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

      // Distance & Speed
      s.distance += Math.round(s.speed * dt);
      setDistance(s.distance);

      // Jump Physics
      if (s.isJumping) {
        s.playerY += s.jumpVel * dt;
        s.jumpVel -= 28 * dt;

        if (s.playerY <= 0) {
          s.playerY = 0;
          s.isJumping = false;
          s.jumpVel = 0;
        }
      }

      if (playerGroup) {
        const targetX = s.playerLane * 2.2;
        playerGroup.position.x += (targetX - playerGroup.position.x) * 12 * dt;
        playerGroup.position.y = s.playerY;
      }

      // Move Islands toward player
      s.islands.forEach(isl => {
        isl.mesh.position.z += s.speed * dt;

        // Check Orb Collection
        if (isl.hasOrb && isl.orbMesh && Math.abs(isl.mesh.position.z) < 1.4 && s.playerLane === isl.lane) {
          isl.hasOrb = false;
          isl.orbMesh.scale.set(0, 0, 0);
          s.orbsCollected += 1;
          s.score += 200;
          s.portalProgress = Math.min(100, Math.round((s.orbsCollected / targetOrbs) * 100));

          setOrbsCollected(s.orbsCollected);
          setScore(s.score);
          setPortalProgress(s.portalProgress);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.orbsCollected >= targetOrbs && !s.isGameOver) {
            s.isVictory = true;
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_nether_portal',
              gameTitle: '복셀 네더 포탈',
              durationSeconds: duration,
              score: s.score + 2500,
              difficulty: 'NIGHTMARE',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }

        // Recycle Island
        if (isl.mesh.position.z > 10) {
          isl.mesh.position.z -= 15 * 8;
          isl.hasOrb = true;
          isl.lane = Math.floor(Math.random() * 3) - 1;
          if (isl.orbMesh) {
            isl.orbMesh.position.set(isl.lane * 2.2, 1.0, 0);
            isl.orbMesh.scale.set(1, 1, 1);
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
    s.playerLane = 0;
    s.playerY = 0;
    s.isJumping = false;
    s.distance = 0;
    s.score = 0;
    s.orbsCollected = 0;
    s.portalProgress = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setDistance(0);
    setScore(0);
    setOrbsCollected(0);
    setPortalProgress(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 네더 차원 탈출' : 'STEP 1: NETHER ESCAPE',
      title: isKo ? '네더 오브 수집 & 포탈 충전' : 'Collect Orbs & Charge Portal',
      description: isKo
        ? '불타는 용암 해협을 질주하며 15개의 네더 오브를 수집하여 차원 탈출 포탈을 완충하세요.'
        : 'Dash across boiling lava channels, gather 15 Nether Orbs and fully charge the dimensional portal.',
      keyPoints: isKo
        ? [
            '네더 오브 15개 완충 시 즉시 탈출 승리',
            '3개 레인 신속 전환 및 용암 균열 회피',
            '오브 수집마다 +200P 보너스 획득'
          ]
        : [
            'Collect 15 Nether Orbs to win',
            'Swiftly switch across 3 lanes',
            '+200P bonus points per orb'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '스와이프 레인 이동 & 탭 점프' : 'Swipe Lanes & Tap Jump',
      description: isKo
        ? '가상 버튼 없이 좌우 스와이프로 3개 레인을 이동하고, 탭 또는 위로 스와이프하여 점프합니다.'
        : 'Swipe left/right to dodge between 3 lanes, and tap/swipe up to jump with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 좌우 스와이프: 3개 레인 즉각 전환',
            '🦘 탭 / 위로 스와이프: 용암 점프 도약',
            '⚡ 오브 연속 획득 시 스피드 가속'
          ]
        : [
            '👆 Swipe L/R: 3-lane instant switch',
            '🦘 Tap / Swipe Up: High lava jump',
            '⚡ Speed boost on consecutive orbs'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '포탈 탈출 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '도달 거리 및 탈출 스피드 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Distance and speed multipliers',
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
        title={isKo ? '복셀 네더 포탈' : 'Voxel Nether Portal'}
        language={language}
        telemetries={[
          { label: isKo ? '오브' : 'Orbs', value: `${orbsCollected}/${targetOrbs}`, color: 'text-purple-300' },
          { label: isKo ? '포탈' : 'Portal', value: `${portalProgress}%`, color: portalProgress >= 100 ? 'text-emerald-400 font-bold animate-pulse' : 'text-fuchsia-300' },
          { label: isKo ? '거리' : 'Dist', value: `${distance}m`, color: 'text-cyan-300' },
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

              if (Math.abs(dx) > 18) {
                moved = true;
                handleSwitchLane(dx > 0 ? 1 : -1);
                window.removeEventListener('pointermove', onMove);
              } else if (dy < -20) {
                moved = true;
                handleJump();
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Jump
                handleJump();
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
          {isKo ? '좌우 스와이프: 레인 이동 | 탭/위로: 점프 도약 (버튼 없음)' : 'Swipe L/R: Switch Lane | Tap/Swipe Up: Jump (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_nether_portal"
          gameTitle={isKo ? '3D 복셀 네더 포탈: 차원 탈출' : 'Voxel Nether Portal: Escape'}
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

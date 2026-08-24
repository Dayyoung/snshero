import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPixelOvercookedGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelPixelOvercookedGame: React.FC<VoxelPixelOvercookedGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_pixel_overcooked') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const targetScore = 150;
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [heldItem, setHeldItem] = useState<string>('none');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posZ: 0,
    rotY: 0,
    score: 0,
    timeLeft: 60,
    heldItem: 'none' as 'none' | 'meat' | 'cooked_meat' | 'bread' | 'burger',
    moveDir: new THREE.Vector2(0, 0),
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    stations: {
      meatDispenser: { x: -6, z: -4 },
      breadDispenser: { x: -6, z: 4 },
      pan: { x: 0, z: -6, cooking: false, timer: 0 },
      plate: { x: 6, z: 0, hasBread: false, hasMeat: false },
      delivery: { x: 0, z: 6 }
    },
    playerGroup: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const interactStation = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;

    // Check Meat Dispenser
    if (Math.hypot(s.posX - s.stations.meatDispenser.x, s.posZ - s.stations.meatDispenser.z) < 2.8) {
      if (s.heldItem === 'none') {
        s.heldItem = 'meat';
        setHeldItem(isKo ? '생고기' : 'Raw Meat');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
      return;
    }

    // Check Bread Dispenser
    if (Math.hypot(s.posX - s.stations.breadDispenser.x, s.posZ - s.stations.breadDispenser.z) < 2.8) {
      if (s.heldItem === 'none') {
        s.heldItem = 'bread';
        setHeldItem(isKo ? '빵' : 'Bread');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
      return;
    }

    // Check Pan
    if (Math.hypot(s.posX - s.stations.pan.x, s.posZ - s.stations.pan.z) < 2.8) {
      if (s.heldItem === 'meat' && !s.stations.pan.cooking) {
        s.heldItem = 'none';
        setHeldItem('none');
        s.stations.pan.cooking = true;
        s.stations.pan.timer = 2.5;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      } else if (s.heldItem === 'none' && s.stations.pan.cooking && s.stations.pan.timer <= 0) {
        s.stations.pan.cooking = false;
        s.heldItem = 'cooked_meat';
        setHeldItem(isKo ? '구운 패티' : 'Cooked Meat');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
      return;
    }

    // Check Plate
    if (Math.hypot(s.posX - s.stations.plate.x, s.posZ - s.stations.plate.z) < 2.8) {
      if (s.heldItem === 'bread') {
        s.stations.plate.hasBread = true;
        s.heldItem = 'none';
        setHeldItem('none');
      } else if (s.heldItem === 'cooked_meat') {
        s.stations.plate.hasMeat = true;
        s.heldItem = 'none';
        setHeldItem('none');
      }

      if (s.stations.plate.hasBread && s.stations.plate.hasMeat) {
        s.stations.plate.hasBread = false;
        s.stations.plate.hasMeat = false;
        s.heldItem = 'burger';
        setHeldItem(isKo ? '완성된 버거' : 'Burger');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
      return;
    }

    // Check Delivery
    if (Math.hypot(s.posX - s.stations.delivery.x, s.posZ - s.stations.delivery.z) < 2.8) {
      if (s.heldItem === 'burger') {
        s.heldItem = 'none';
        setHeldItem('none');
        s.score += 50;
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        if (s.score >= targetScore && !s.isGameOver) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_pixel_overcooked',
            gameTitle: '복셀 픽셀 오버쿡드',
            durationSeconds: duration,
            score: s.score + 2000,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 16, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(10, 25, 10);
    scene.add(dirLight);

    // Kitchen Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Stations
    const sMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const meatSt = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), sMat);
    meatSt.position.set(-6, 0.5, -4);
    scene.add(meatSt);

    const breadSt = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), sMat);
    breadSt.position.set(-6, 0.5, 4);
    scene.add(breadSt);

    const panSt = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    panSt.position.set(0, 0.5, -6);
    scene.add(panSt);

    const plateSt = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    plateSt.position.set(6, 0.5, 0);
    scene.add(plateSt);

    const delivSt = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 2), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    delivSt.position.set(0, 0.5, 6);
    scene.add(delivSt);

    // Chef Player
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.6, 0.8), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    pBody.position.y = 0.8;
    playerGroup.add(pBody);

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    hat.position.y = 1.9;
    playerGroup.add(hat);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;

    // Timer
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
          gameId: 'voxel_pixel_overcooked',
          gameTitle: '복셀 픽셀 오버쿡드',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: s.score >= targetScore
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

      // Pan timer
      if (s.stations.pan.cooking && s.stations.pan.timer > 0) {
        s.stations.pan.timer -= dt;
      }

      // Move player
      const speed = 10;
      s.posX += s.moveDir.x * speed * dt;
      s.posZ += s.moveDir.y * speed * dt;
      s.posX = THREE.MathUtils.clamp(s.posX, -9, 9);
      s.posZ = THREE.MathUtils.clamp(s.posZ, -9, 9);

      if (s.moveDir.length() > 0.1) {
        s.rotY = Math.atan2(s.moveDir.x, s.moveDir.y);
      }

      if (playerGroup) {
        playerGroup.position.set(s.posX, 0, s.posZ);
        playerGroup.rotation.y = s.rotY;
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
    s.posX = 0;
    s.posZ = 0;
    s.rotY = 0;
    s.score = 0;
    s.timeLeft = 60;
    s.heldItem = 'none';
    s.stations.pan.cooking = false;
    s.stations.pan.timer = 0;
    s.stations.plate.hasBread = false;
    s.stations.plate.hasMeat = false;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setScore(0);
    setTimeLeft(60);
    setHeldItem('none');
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 픽셀 키친 오더' : 'STEP 1: KITCHEN RUSH',
      title: isKo ? '수제 버거 서빙 150점 달성' : 'Serve Burgers & Score 150P',
      description: isKo
        ? '생고기를 프라이팬에 구워 빵과 조합한 뒤 서빙대에 납품하여 150점을 달성하세요.'
        : 'Cook raw meat on the pan, assemble with bread on the plate and deliver to score 150P.',
      keyPoints: isKo
        ? [
            '150점 (버거 3개) 서빙 시 승리',
            '생고기 굽기(2.5초) ➔ 접시 조립 ➔ 서빙',
            '60초 타임어택 내 완주'
          ]
        : [
            'Serve 3 burgers (150P) to win',
            'Cook meat (2.5s) ➔ Plate assemble ➔ Deliver',
            'Clear within 60s limit'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 이동 & 탭 상호작용' : 'Drag Move & Tap Interact',
      description: isKo
        ? '가상 D-Pad 없이 화면 드래그로 주방을 이동하고, 조리대 접근 시 탭하여 상호작용합니다.'
        : 'Drag anywhere to move your chef and tap near stations to pick up/cook/deliver with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 셰프 360° 주방 이동',
            '🍳 조리대 근접 탭: 재료 수령 / 조리 / 조립',
            '⚡ 최단 동선 이동으로 스피드 보너스'
          ]
        : [
            '👆 Drag: Smooth 360° kitchen move',
            '🍳 Proximity Tap: Pick / Cook / Serve',
            '⚡ Optimize chef route for speed bonus'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '주방 클리어 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 시간 및 완벽 서빙 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining time and perfect service bonus',
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
        title={isKo ? '복셀 픽셀 오버쿡드' : 'Voxel Pixel Overcooked'}
        language={language}
        telemetries={[
          { label: isKo ? '점수' : 'Score', value: `${score}/${targetScore}`, color: 'text-amber-300' },
          { label: isKo ? '아이템' : 'Held', value: `${heldItem}`, color: 'text-cyan-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 15 ? 'text-rose-400 font-bold' : 'text-emerald-300' }
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
                // Tap: Interact with station
                interactStation();
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
          {isKo ? '화면 드래그: 셰프 이동 | 조리대 근접 탭: 재료 수령 / 조리 / 서빙 (버튼 없음)' : 'Drag: Move Chef | Proximity Tap: Pick / Cook / Serve (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_pixel_overcooked"
          gameTitle={isKo ? '3D 복셀 픽셀 오버쿡드: 키친 러시' : 'Voxel Pixel Overcooked: Kitchen Rush'}
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

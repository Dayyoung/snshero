import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPropHuntGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelPropHuntGame: React.FC<VoxelPropHuntGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_prop_hunt') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hunterHp, setHunterHp] = useState<number>(100);
  const [propsFound, setPropsFound] = useState<number>(0);
  const targetProps = 5;
  const [ammo, setAmmo] = useState<number>(18);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posZ: 0,
    rotY: 0,
    hunterHp: 100,
    propsFound: 0,
    ammo: 18,
    score: 0,
    moveDir: new THREE.Vector2(0, 0),
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    propsList: [] as { mesh: THREE.Mesh; isRealProp: boolean; found: boolean }[],
    playerGroup: null as THREE.Group | null,
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const fireShotgun = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.ammo <= 0 || !s.camera || !s.scene) return;

    s.ammo -= 1;
    setAmmo(s.ammo);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Raycast hit check from camera direction
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), s.camera);

    const activeProps = s.propsList.filter(p => !p.found);
    const meshes = activeProps.map(p => p.mesh);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const target = activeProps.find(p => p.mesh === hitMesh);

      if (target) {
        if (target.isRealProp) {
          // Found real hiding prop
          target.found = true;
          s.scene.remove(target.mesh);
          s.propsFound += 1;
          s.score += 300;
          setPropsFound(s.propsFound);
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

          if (s.propsFound >= targetProps && !s.isGameOver) {
            s.isVictory = true;
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_prop_hunt',
              gameTitle: '복셀 프롭 헌트',
              durationSeconds: duration,
              score: s.score + 2000,
              difficulty: 'HARD',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        } else {
          // Misfire penalty
          s.hunterHp = Math.max(0, s.hunterHp - 15);
          setHunterHp(s.hunterHp);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.hunterHp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_prop_hunt',
              gameTitle: '복셀 프롭 헌트',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'HARD',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
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
    scene.background = new THREE.Color(0x1a1a24);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 1, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    dirLight.position.set(10, 30, 20);
    scene.add(dirLight);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Hunter Avatar
    const hunter = new THREE.Group();
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    hBody.position.y = 0.75;
    hunter.add(hBody);

    hunter.position.set(0, 0, 0);
    scene.add(hunter);
    stateRef.current.playerGroup = hunter;

    // Spawn 16 Props (5 real, 11 decoys)
    stateRef.current.propsList = [];
    for (let i = 0; i < 16; i++) {
      const isReal = i < targetProps;
      const pMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color: isReal ? 0xf59e0b : 0x64748b })
      );
      const px = (Math.random() - 0.5) * 45;
      const pz = (Math.random() - 0.5) * 45;
      pMesh.position.set(px, 0.6, pz);
      scene.add(pMesh);

      stateRef.current.propsList.push({
        mesh: pMesh,
        isRealProp: isReal,
        found: false
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

      // Move hunter
      const speed = 11;
      s.posX += s.moveDir.x * speed * dt;
      s.posZ += s.moveDir.y * speed * dt;
      s.posX = THREE.MathUtils.clamp(s.posX, -25, 25);
      s.posZ = THREE.MathUtils.clamp(s.posZ, -25, 25);

      if (s.moveDir.length() > 0.1) {
        s.rotY = Math.atan2(s.moveDir.x, s.moveDir.y);
      }

      if (hunter) {
        hunter.position.set(s.posX, 0, s.posZ);
        hunter.rotation.y = s.rotY;
      }

      // Camera Follow
      camera.position.set(s.posX, 8, s.posZ + 12);
      camera.lookAt(s.posX, 1, s.posZ);

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
    s.posX = 0;
    s.posZ = 0;
    s.rotY = 0;
    s.hunterHp = 100;
    s.propsFound = 0;
    s.ammo = 18;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.propsList.forEach(p => {
      p.found = false;
      s.scene?.add(p.mesh);
    });
    setHunterHp(100);
    setPropsFound(0);
    setAmmo(18);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 프롭 색출 미션' : 'STEP 1: PROP DETECTION',
      title: isKo ? '변신 사물 5개 색출 완승' : 'Find 5 Hiding Props',
      description: isKo
        ? '전장에 은신한 5개의 황금색 프롭을 찾아내고 일반 사물 오발을 피해 사격하세요.'
        : 'Locate 5 real hiding props across the room while avoiding decoy misfires.',
      keyPoints: isKo
        ? [
            '변신 프롭 5개 적중 시 즉시 완승',
            '일반 사물 오발 시 HP -15% 페널티',
            '탄약 잔여 18발 내 완주'
          ]
        : [
            'Find 5 real props to win',
            '-15% HP penalty on decoy misfires',
            'Clear within 18 available ammo'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 탐색 & 탭 샷건 사격' : 'Drag Move & Tap Shoot',
      description: isKo
        ? '가상 D-Pad 없이 화면 드래그로 방 안을 수색하고, 탭하여 의심 사물을 사격합니다.'
        : 'Drag anywhere to explore the room, and tap to fire your shotgun with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 헌터 360° 수색 이동',
            '💥 탭: 샷건 정밀 사격',
            '⚡ 사물 근접 시 색상 판별 유리'
          ]
        : [
            '👆 Drag: Smooth 360° hunter move',
            '💥 Tap: Accurate shotgun shot',
            '⚡ Close-up inspection reveals colors'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '프롭 색출 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 헌터 체력 및 명중률 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Hunter HP and accuracy bonuses',
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
        title={isKo ? '복셀 프롭 헌트' : 'Voxel Prop Hunt'}
        language={language}
        hp={{ current: hunterHp, max: 100 }}
        telemetries={[
          { label: isKo ? '색출' : 'Found', value: `${propsFound}/${targetProps}`, color: 'text-amber-300' },
          { label: isKo ? '탄약' : 'Ammo', value: `${ammo}발`, color: ammo <= 3 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Crosshair Center */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-6 h-6 border border-rose-500/60 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
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
                // Tap: Fire Shotgun
                fireShotgun();
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
        <div className="px-3 py-1 bg-black/75 border border-rose-500/30 rounded-full text-[10px] text-rose-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 헌터 이동 | 탭: 샷건 사격 (버튼 없음)' : 'Drag: Move Hunter | Tap: Fire Shotgun (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_prop_hunt"
          gameTitle={isKo ? '3D 복셀 프롭 헌트: 변신 사물 색출' : 'Voxel Prop Hunt: Hidden Props'}
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

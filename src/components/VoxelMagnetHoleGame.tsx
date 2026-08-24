import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMagnetHoleGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface CityObject {
  mesh: THREE.Object3D;
  x: number;
  z: number;
  radius: number;
  points: number;
  swallowed: boolean;
  isFalling: boolean;
  fallSpeed: number;
}

export const VoxelMagnetHoleGame: React.FC<VoxelMagnetHoleGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_blackhole') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [holeSize, setHoleSize] = useState<number>(1.2);
  const [swallowedCount, setSwallowedCount] = useState<number>(0);
  const targetObjects = 35;
  const [magnetCooldown, setMagnetCooldown] = useState<number>(0);
  const [bannerText, setBannerText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    holeX: 0,
    holeZ: 0,
    targetX: 0,
    targetZ: 0,
    holeRadius: 1.2,
    score: 0,
    swallowedCount: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    magnetPulseTime: 0,
    magnetCooldown: 0,
    startTime: Date.now(),
    cityObjects: [] as CityObject[],
    holeMesh: null as THREE.Group | null
  });

  useEffect(() => {
    stateRef.current.isPaused = isPaused || showTutorial;
  }, [isPaused, showTutorial]);

  const handleMagnetBoost = () => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver || s.isVictory || s.magnetCooldown > 0) return;
    s.magnetCooldown = 15;
    s.magnetPulseTime = 4.0;
    setMagnetCooldown(15);
    setBannerText(isKo ? '⚡ 10m 자석 진공 흡입 가동!!' : '⚡ 10M MAGNET VACUUM ENGAGED!!');
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0x38bdf8, 30, 90);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 16, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambLight);

    const sun = new THREE.DirectionalLight(0xfef08a, 1.4);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Black Hole Mesh Group
    const holeGroup = new THREE.Group();
    const diskGeo = new THREE.RingGeometry(0.1, 1.2, 32);
    const diskMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0.02;
    holeGroup.add(disk);

    const glowGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.03;
    holeGroup.add(glow);

    scene.add(holeGroup);
    stateRef.current.holeMesh = holeGroup;

    // Spawn 50 City Objects
    stateRef.current.cityObjects = [];
    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];

    for (let i = 0; i < 50; i++) {
      const isCar = i % 3 === 0;
      const isTree = i % 3 === 1;
      const ox = (Math.random() - 0.5) * 60;
      const oz = (Math.random() - 0.5) * 60;
      if (Math.hypot(ox, oz) < 4) continue;

      let objMesh: THREE.Object3D;
      let objRadius = 0.8;
      let objPoints = 100;

      if (isCar) {
        objMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 2.0), new THREE.MeshStandardMaterial({ color: colors[i % colors.length] }));
        objMesh.position.set(ox, 0.4, oz);
        objRadius = 0.9;
        objPoints = 150;
      } else if (isTree) {
        objMesh = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
        objMesh.position.set(ox, 1.2, oz);
        objRadius = 0.7;
        objPoints = 80;
      } else {
        objMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.0, 2.0), new THREE.MeshStandardMaterial({ color: 0x64748b }));
        objMesh.position.set(ox, 2.0, oz);
        objRadius = 1.6;
        objPoints = 300;
      }

      scene.add(objMesh);
      stateRef.current.cityObjects.push({
        mesh: objMesh,
        x: ox,
        z: oz,
        radius: objRadius,
        points: objPoints,
        swallowed: false,
        isFalling: false,
        fallSpeed: 0
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

      // Cooldown timer
      if (s.magnetCooldown > 0) {
        s.magnetCooldown -= dt;
        if (s.magnetCooldown <= 0) {
          s.magnetCooldown = 0;
          setMagnetCooldown(0);
        }
      }

      if (s.magnetPulseTime > 0) {
        s.magnetPulseTime -= dt;
        if (s.magnetPulseTime <= 0) setBannerText('');
      }

      // Smooth hole movement
      s.holeX += (s.targetX - s.holeX) * 8 * dt;
      s.holeZ += (s.targetZ - s.holeZ) * 8 * dt;

      if (holeGroup) {
        holeGroup.position.set(s.holeX, 0, s.holeZ);
        const scale = s.holeRadius / 1.2;
        holeGroup.scale.set(scale, scale, scale);
      }

      // Camera Follow
      camera.position.set(s.holeX, 16 + s.holeRadius * 2, s.holeZ + 16 + s.holeRadius * 2);
      camera.lookAt(s.holeX, 0, s.holeZ);

      // Check Object Swallow
      s.cityObjects.forEach(obj => {
        if (obj.swallowed) return;

        const dist = Math.hypot(obj.x - s.holeX, obj.z - s.holeZ);

        // Magnet attraction
        if (s.magnetPulseTime > 0 && dist < 12 && obj.radius <= s.holeRadius * 1.3) {
          const pullDir = new THREE.Vector2(s.holeX - obj.x, s.holeZ - obj.z).normalize();
          obj.x += pullDir.x * 12 * dt;
          obj.z += pullDir.y * 12 * dt;
          obj.mesh.position.x = obj.x;
          obj.mesh.position.z = obj.z;
        }

        if (dist < s.holeRadius && obj.radius <= s.holeRadius * 1.1) {
          obj.isFalling = true;
        }

        if (obj.isFalling) {
          obj.fallSpeed += dt * 20;
          obj.mesh.position.y -= obj.fallSpeed * dt;
          obj.mesh.scale.multiplyScalar(0.92);

          if (obj.mesh.position.y < -4) {
            obj.swallowed = true;
            scene.remove(obj.mesh);
            s.swallowedCount += 1;
            s.score += obj.points;
            s.holeRadius = Math.min(6.0, s.holeRadius + 0.08);

            setSwallowedCount(s.swallowedCount);
            setScore(s.score);
            setHoleSize(parseFloat(s.holeRadius.toFixed(1)));
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.swallowedCount >= targetObjects && !s.isGameOver) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_blackhole',
                gameTitle: '복셀 마그넷 홀',
                durationSeconds: duration,
                score: s.score + 1500,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
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
    s.holeX = 0;
    s.holeZ = 0;
    s.targetX = 0;
    s.targetZ = 0;
    s.holeRadius = 1.2;
    s.score = 0;
    s.swallowedCount = 0;
    s.magnetCooldown = 0;
    s.magnetPulseTime = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setScore(0);
    setHoleSize(1.2);
    setSwallowedCount(0);
    setMagnetCooldown(0);
    setBannerText('');
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 블랙홀 거대화' : 'STEP 1: GROW THE HOLE',
      title: isKo ? '도시 사물 집어삼키기' : 'Swallow the City',
      description: isKo
        ? '작은 가로등, 나무부터 삼켜 블랙홀의 직경을 키우고 거대한 자동차와 빌딩까지 삼키세요.'
        : 'Start with small trees and props, expand your blackhole radius, and devour giant cars and buildings.',
      keyPoints: isKo
        ? [
            '내 직경보다 작은 사물만 흡입 가능',
            '35개 이상 사물 삼키면 승리',
            '블랙홀 직경 최대 6m까지 무한 확장'
          ]
        : [
            'Can only swallow objects smaller than radius',
            'Devour 35+ objects to clear',
            'Grow blackhole up to 6 meters wide'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 컨트롤' : 'STEP 2: PURE GESTURES',
      title: isKo ? '자유 드래그 & 자석 진공 펄스' : 'Free Drag & Magnet Pulse',
      description: isKo
        ? '가상 조이스틱 없이 화면 드래그로 블랙홀을 이동하고, 2x 탭으로 10m 자석 진공을 발동합니다.'
        : 'Drag anywhere to move the hole, and double-tap to unleash a 10m magnet vacuum with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 자유 드래그: 블랙홀 전방향 이동',
            '⚡ 2x 탭: 10m 자석 진공 흡입 부스터',
            '🌊 연속 삼킴 시 피버 콤보 발동'
          ]
        : [
            '👆 Free Drag: Smooth omni-directional move',
            '⚡ Double-Tap: 10m Magnet vacuum boost',
            '🌊 Fever multiplier on rapid swallowing'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '도시 정복 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '블랙홀 최종 직경 및 스피드 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Final hole size and speed bonuses',
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
        title={isKo ? '복셀 마그넷 홀' : 'Voxel Magnet Hole'}
        language={language}
        telemetries={[
          { label: isKo ? '직경' : 'Size', value: `${holeSize}m`, color: 'text-purple-300' },
          { label: isKo ? '삼킴' : 'Swallowed', value: `${swallowedCount}/${targetObjects}`, color: 'text-emerald-300' },
          { label: isKo ? '자석' : 'Magnet', value: magnetCooldown > 0 ? `${Math.round(magnetCooldown)}s` : 'READY', color: magnetCooldown === 0 ? 'text-amber-400 font-black animate-pulse' : 'text-slate-400' },
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

      {/* Action Banner */}
      {bannerText && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/85 border border-amber-400 text-amber-300 px-4 py-1 rounded-full text-xs font-black tracking-wider shadow-lg z-30 pointer-events-none animate-bounce">
          {bannerText}
        </div>
      )}

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

              const speed = 0.08;
              stateRef.current.targetX = THREE.MathUtils.clamp(stateRef.current.targetX + dx * speed, -28, 28);
              stateRef.current.targetZ = THREE.MathUtils.clamp(stateRef.current.targetZ + dy * speed, -28, 28);
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={handleMagnetBoost}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 블랙홀 이동 | 더블탭: 10m 자석 진공 펄스 (버튼 없음)' : 'Drag: Move Hole | Double Tap: 10m Magnet Vacuum Pulse (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_blackhole"
          gameTitle={isKo ? '3D 복셀 마그넷 홀 (블랙홀 이터)' : 'Voxel Magnet Hole: Blackhole Eater'}
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

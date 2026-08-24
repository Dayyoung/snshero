import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMonsterIsleGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMonsterIsleGame: React.FC<VoxelMonsterIsleGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_monster_isle') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [cubes, setCubes] = useState<number>(10);
  const [captured, setCaptured] = useState<number>(0);
  const targetCaptured = 5;
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    posX: 0,
    posZ: 0,
    rotY: 0,
    cubes: 10,
    captured: 0,
    moveDir: new THREE.Vector2(0, 0),
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    monsters: [] as { mesh: THREE.Group; x: number; z: number; hp: number; captured: boolean }[],
    throwCubes: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
    playerGroup: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const throwTamingCube = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.cubes <= 0 || !s.scene) return;

    s.cubes -= 1;
    setCubes(s.cubes);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const cubeGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2 });
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    cubeMesh.position.set(s.posX, 1.2, s.posZ);
    s.scene.add(cubeMesh);

    const speed = 26;
    s.throwCubes.push({
      mesh: cubeMesh,
      vx: Math.sin(s.rotY) * speed,
      vy: 6,
      vz: -Math.cos(s.rotY) * speed,
      life: 2.5
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88ccff);
    scene.fog = new THREE.FogExp2(0x88ccff, 0.015);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 300);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.4);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Island Terrain
    const island = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
    );
    island.rotation.x = -Math.PI / 2;
    scene.add(island);

    // Player Avatar
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
    pBody.position.y = 0.7;
    playerGroup.add(pBody);
    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;

    // Spawn 8 Wild Monsters
    stateRef.current.monsters = [];
    const mColors = [0xef4444, 0x8b5cf6, 0xf59e0b, 0x10b981];

    for (let i = 0; i < 8; i++) {
      const mGroup = new THREE.Group();
      const mBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 12, 12),
        new THREE.MeshStandardMaterial({ color: mColors[i % mColors.length] })
      );
      mBody.position.y = 0.8;
      mGroup.add(mBody);

      const mx = (Math.random() - 0.5) * 60;
      const mz = (Math.random() - 0.5) * 60;
      mGroup.position.set(mx, 0, mz);
      scene.add(mGroup);

      stateRef.current.monsters.push({
        mesh: mGroup,
        x: mx,
        z: mz,
        hp: 1,
        captured: false
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
      const speed = 12;
      s.posX += s.moveDir.x * speed * dt;
      s.posZ += s.moveDir.y * speed * dt;
      s.posX = THREE.MathUtils.clamp(s.posX, -50, 50);
      s.posZ = THREE.MathUtils.clamp(s.posZ, -50, 50);

      if (s.moveDir.length() > 0.1) {
        s.rotY = Math.atan2(s.moveDir.x, s.moveDir.y);
      }

      if (playerGroup) {
        playerGroup.position.set(s.posX, 0, s.posZ);
        playerGroup.rotation.y = s.rotY;
      }

      // Camera follow
      camera.position.set(s.posX, 8, s.posZ + 12);
      camera.lookAt(s.posX, 1, s.posZ);

      // Throw cubes update
      for (let i = s.throwCubes.length - 1; i >= 0; i--) {
        const c = s.throwCubes[i];
        c.life -= dt;
        c.vy -= 9.8 * 1.5 * dt;
        c.mesh.position.x += c.vx * dt;
        c.mesh.position.y += c.vy * dt;
        c.mesh.position.z += c.vz * dt;

        // Monster collision
        for (const m of s.monsters) {
          if (!m.captured && c.mesh.position.distanceTo(m.mesh.position) < 1.6) {
            m.captured = true;
            scene.remove(m.mesh);
            s.captured += 1;
            s.score += 300;
            setCaptured(s.captured);
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.captured >= targetCaptured && !s.isGameOver) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_monster_isle',
                gameTitle: '복셀 몬스터 아일',
                durationSeconds: duration,
                score: s.score + 1500,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
            break;
          }
        }

        if (c.life <= 0 || c.mesh.position.y <= 0.3) {
          scene.remove(c.mesh);
          s.throwCubes.splice(i, 1);
        }
      }

      // Check cube out failure
      if (s.cubes <= 0 && s.throwCubes.length === 0 && s.captured < targetCaptured && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_monster_isle',
          gameTitle: '복셀 몬스터 아일',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'HARD',
          isVictory: false
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
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
    s.posX = 0;
    s.posZ = 0;
    s.rotY = 0;
    s.cubes = 10;
    s.captured = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.monsters.forEach(m => {
      m.captured = false;
      s.scene?.add(m.mesh);
    });
    setCubes(10);
    setCaptured(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 야생 몬스터 포획' : 'STEP 1: MONSTER TAMING',
      title: isKo ? '몬스터 아일 탐험 포획' : 'Explore Isle & Tame Monsters',
      description: isKo
        ? '3D 복셀 미지의 섬을 탐험하며 야생 몬스터를 찾아 테이밍 큐브를 던져 포획하세요.'
        : 'Explore the 3D voxel island, locate wild monsters and throw taming cubes to capture them.',
      keyPoints: isKo
        ? [
            '야생 몬스터 5마리 포획 시 승리',
            '테이밍 큐브 잔여 10개 내 완료',
            '포획마다 +300P 보너스 획득'
          ]
        : [
            'Capture 5 wild monsters to win',
            'Clear within 10 available taming cubes',
            '+300P bonus points per capture'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 컨트롤' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원터치 드래그 & 탭 큐브 투척' : 'Free Drag & Tap Cube Throw',
      description: isKo
        ? '가상 조이스틱 없이 화면 드래그로 자유 이동하고 탭하여 테이밍 큐브를 던집니다.'
        : 'Drag anywhere to explore the island and tap to throw taming cubes with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 자유 드래그: 테이머 360° 섬 탐험 이동',
            '🎯 탭: 조준 방향 테이밍 큐브 투척',
            '⚡ 몬스터 근접 시 포획 확률 증가'
          ]
        : [
            '👆 Free Drag: Smooth 360° movement',
            '🎯 Tap: Launch taming cube forward',
            '⚡ Higher capture chance at close range'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '몬스터 테이밍 완료 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 큐브 및 스피드 포획 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining cubes and speed bonuses',
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
        title={isKo ? '복셀 몬스터 아일' : 'Voxel Monster Isle'}
        language={language}
        telemetries={[
          { label: isKo ? '포획' : 'Captured', value: `${captured}/${targetCaptured}`, color: 'text-emerald-300' },
          { label: isKo ? '큐브' : 'Cubes', value: `x${cubes}`, color: cubes <= 2 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
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
                // Tap: Throw Taming Cube
                throwTamingCube();
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
        <div className="px-3 py-1 bg-black/75 border border-emerald-500/30 rounded-full text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 섬 탐험 이동 | 탭: 테이밍 큐브 투척 (버튼 없음)' : 'Drag: Move & Explore | Tap: Throw Taming Cube (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_monster_isle"
          gameTitle={isKo ? '3D 복셀 몬스터 아일: 야생 몬스터 포획' : 'Voxel Monster Isle: Wild Taming'}
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

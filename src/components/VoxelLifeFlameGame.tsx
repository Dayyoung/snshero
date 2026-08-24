import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelLifeFlameGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ShadowCreep {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  hp: number;
  speed: number;
}

interface FlameShot {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

export const VoxelLifeFlameGame: React.FC<VoxelLifeFlameGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_life_flame') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [treeHp, setTreeHp] = useState<number>(100);
  const [purifiedCount, setPurifiedCount] = useState<number>(0);
  const targetPurified = 25;
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    aimAngle: 0,
    treeHp: 100,
    score: 0,
    purifiedCount: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    creeps: [] as ShadowCreep[],
    flames: [] as FlameShot[],
    scene: null as THREE.Scene | null,
    dragonMesh: null as THREE.Group | null
  });

  const fireFlame = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    const fGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const fMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const fMesh = new THREE.Mesh(fGeo, fMat);
    const origin = new THREE.Vector3(0, 1.2, 0);
    fMesh.position.copy(origin);
    s.scene.add(fMesh);

    const speed = 25;
    const vel = new THREE.Vector3(Math.sin(s.aimAngle) * speed, 0, Math.cos(s.aimAngle) * speed);

    s.flames.push({
      mesh: fMesh,
      pos: origin.clone(),
      vel
    });

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0a0e);
    scene.fog = new THREE.FogExp2(0x1a0a0e, 0.025);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 14, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xf43f5e, 0.7);
    scene.add(ambientLight);

    const treeLight = new THREE.PointLight(0xfb7185, 2.5, 30);
    treeLight.position.set(0, 4, 0);
    scene.add(treeLight);

    // Ground Disc
    const groundGeo = new THREE.CylinderGeometry(14, 14, 0.6, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x271318, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.3;
    scene.add(ground);

    // Tree of Life
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 4, 8), new THREE.MeshStandardMaterial({ color: 0x4a1525 }));
    trunk.position.y = 2;
    treeGroup.add(trunk);

    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2), new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0x9f1239 }));
    crown.position.y = 4.2;
    treeGroup.add(crown);

    scene.add(treeGroup);

    // Flame Dragon Guardian
    const dragonGroup = new THREE.Group();
    const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.6), new THREE.MeshStandardMaterial({ color: 0xfb7185 }));
    dBody.position.y = 1.0;
    dragonGroup.add(dBody);
    scene.add(dragonGroup);
    stateRef.current.dragonMesh = dragonGroup;

    let animId: number;
    let lastTime = performance.now();
    let spawnTimer = 0;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Spawn creeps
      spawnTimer += dt;
      if (spawnTimer > 1.2 && s.creeps.length < 8) {
        spawnTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 13;
        const pos = new THREE.Vector3(Math.sin(angle) * dist, 0.4, Math.cos(angle) * dist);

        const cGroup = new THREE.Group();
        const cMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshStandardMaterial({ color: 0x09090b }));
        cGroup.add(cMesh);
        cGroup.position.copy(pos);
        scene.add(cGroup);

        s.creeps.push({
          mesh: cGroup,
          pos,
          hp: 2,
          speed: 1.8 + Math.random() * 0.8
        });
      }

      // Aim dragon
      if (dragonGroup) {
        dragonGroup.rotation.y = s.aimAngle;
        dragonGroup.position.set(Math.sin(s.aimAngle) * 2, 0, Math.cos(s.aimAngle) * 2);
      }

      // Move flames
      for (let i = s.flames.length - 1; i >= 0; i--) {
        const f = s.flames[i];
        f.pos.addScaledVector(f.vel, dt);
        f.mesh.position.copy(f.pos);

        // Check creep hit
        let hit = false;
        for (let cIdx = s.creeps.length - 1; cIdx >= 0; cIdx--) {
          const c = s.creeps[cIdx];
          if (f.pos.distanceTo(c.pos) < 1.0) {
            hit = true;
            c.hp -= 1;
            if (c.hp <= 0) {
              scene.remove(c.mesh);
              s.creeps.splice(cIdx, 1);
              s.purifiedCount += 1;
              s.score += 150;
              setPurifiedCount(s.purifiedCount);
              setScore(s.score);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

              if (s.purifiedCount >= targetPurified && !s.isGameOver) {
                s.isVictory = true;
                s.isGameOver = true;
                setIsGameOver(true);
                const duration = (Date.now() - s.startTime) / 1000;
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'voxel_life_flame',
                  gameTitle: '복셀 생명의 불꽃',
                  durationSeconds: duration,
                  score: s.score + 2000,
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

        if (hit || f.pos.length() > 15) {
          scene.remove(f.mesh);
          s.flames.splice(i, 1);
        }
      }

      // Move creeps toward tree center
      for (let cIdx = s.creeps.length - 1; cIdx >= 0; cIdx--) {
        const c = s.creeps[cIdx];
        const dir = new THREE.Vector3(0, 0.4, 0).sub(c.pos).normalize();
        c.pos.addScaledVector(dir, c.speed * dt);
        c.mesh.position.copy(c.pos);

        if (c.pos.length() < 1.4) {
          // Creep damages tree
          s.treeHp = Math.max(0, s.treeHp - 10);
          setTreeHp(s.treeHp);
          scene.remove(c.mesh);
          s.creeps.splice(cIdx, 1);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

          if (s.treeHp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_life_flame',
              gameTitle: '복셀 생명의 불꽃',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'NIGHTMARE',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
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
    s.creeps.forEach(c => s.scene?.remove(c.mesh));
    s.flames.forEach(f => s.scene?.remove(f.mesh));
    s.creeps = [];
    s.flames = [];
    s.treeHp = 100;
    s.purifiedCount = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setTreeHp(100);
    setPurifiedCount(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 세계수 수호 미션' : 'STEP 1: TREE DEFENSE',
      title: isKo ? '생명의 나무 결계 방어' : 'Protect the World Tree',
      description: isKo
        ? '3D 복셀 원형 제단으로 몰려드는 섀도우 괴물들을 정화하여 세계수의 HP를 지켜내세요.'
        : 'Purify invading shadow creeps approaching the sacred Tree of Life in the 3D voxel altar.',
      keyPoints: isKo
        ? [
            '세계수 HP: 100% 보존',
            '섀도우 괴물 25마리 정화 시 클리어',
            '원형 제단 360도 전방위 방어'
          ]
        : [
            'Maintain World Tree HP at 100%',
            'Purify 25 shadow creeps to win',
            '360-degree omni-directional defense'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 컨트롤' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화염 조준 & 생명의 불꽃 발사' : 'Aim Flame & Cast Burst',
      description: isKo
        ? '가상 조이스틱 없이 드래그 회전 조준과 원터치 탭으로 생명의 불꽃을 발사합니다.'
        : 'Aim flame angle by dragging horizontally and tap to unleash fiery bursts with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 360° 드래곤 화염 조준',
            '🔥 탭: 생명의 화염 구체 발사',
            '⚡ 콤보 정화 시 보너스 점수 가산'
          ]
        : [
            '👆 Drag L/R: 360° Dragon flame aiming',
            '🔥 Tap: Cast Life Flame projectile',
            '⚡ Bonus points on combo purifications'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '세계수 수호 성공 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '세계수 잔여 체력 및 스피드 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining HP and speed bonus',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 생명의 불꽃' : 'Voxel Life Flame'}
        language={language}
        hp={{ current: treeHp, max: 100 }}
        telemetries={[
          { label: isKo ? '정화' : 'Purified', value: `${purifiedCount}/${targetPurified}`, color: 'text-rose-300' },
          { label: isKo ? '세계수HP' : 'TreeHP', value: `${treeHp}%`, color: treeHp < 30 ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-300' },
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
              const dx = curX - startX;
              if (Math.abs(dx) > 6) {
                moved = true;
                stateRef.current.aimAngle += dx > 0 ? 0.05 : -0.05;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Fire Flame Burst
                fireFlame();
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
          {isKo ? '좌우 드래그: 화염 조준 회전 | 탭: 생명의 불꽃 발사 (버튼 없음)' : 'Drag L/R: Aim Flame Angle | Tap: Fire Burst (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_life_flame"
          gameTitle={isKo ? '3D 복셀 생명의 불꽃: 세계수 수호' : 'Voxel Life Flame: World Tree Defense'}
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

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTitanMechaGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyMecha {
  mesh: THREE.Group;
  x: number;
  z: number;
  hp: number;
  alive: boolean;
}

export const VoxelTitanMechaGame: React.FC<VoxelTitanMechaGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_titan_mecha') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [ap, setAp] = useState<number>(100);
  const [mechasDestroyed, setMechasDestroyed] = useState<number>(0);
  const targetMechas = 4;
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    mechaPos: new THREE.Vector3(0, 0, 0),
    moveDir: new THREE.Vector2(0, 0),
    mechaYaw: 0,
    ap: 100,
    mechasDestroyed: 0,
    score: 0,
    isBoosting: false,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    mechaMesh: null as THREE.Group | null,
    enemies: [] as EnemyMecha[],
    missiles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3 }[],
    scene: null as THREE.Scene | null
  });

  const fireMissile = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const mGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.6, 8);
    const mMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const missile = new THREE.Mesh(mGeo, mMat);
    missile.rotation.x = Math.PI / 2;
    missile.position.copy(s.mechaPos).add(new THREE.Vector3(0, 2.5, -1.0));
    s.scene.add(missile);

    const fwd = new THREE.Vector3(-Math.sin(s.mechaYaw), 0, -Math.cos(s.mechaYaw)).normalize();
    s.missiles.push({ mesh: missile, vel: fwd.multiplyScalar(40) });
  };

  const triggerBoost = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.isBoosting = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
    setTimeout(() => { s.isBoosting = false; }, 1200);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 2, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x1e293b, 1.2));

    // City Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Titan Mecha
    const mecha = new THREE.Group();
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    torso.position.y = 3;
    mecha.add(torso);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.8, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 })
    );
    head.position.y = 4.6;
    mecha.add(head);

    mecha.position.copy(stateRef.current.mechaPos);
    scene.add(mecha);
    stateRef.current.mechaMesh = mecha;

    // Spawn 4 Enemy Titan Mechas
    stateRef.current.enemies = [];
    for (let i = 0; i < targetMechas; i++) {
      const eGroup = new THREE.Group();
      const eTorso = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.6, 1.6),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 })
      );
      eTorso.position.y = 3;
      eGroup.add(eTorso);

      const ex = (i % 2 === 0 ? 1 : -1) * (18 + i * 8);
      const ez = -20 - i * 15;
      eGroup.position.set(ex, 0, ez);
      scene.add(eGroup);

      stateRef.current.enemies.push({
        mesh: eGroup,
        x: ex,
        z: ez,
        hp: 3,
        alive: true
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

      // Mecha Maneuver
      const speed = s.isBoosting ? 28 : 14;
      s.mechaPos.x += s.moveDir.x * speed * dt;
      s.mechaPos.z += s.moveDir.y * speed * dt;
      s.mechaPos.x = THREE.MathUtils.clamp(s.mechaPos.x, -50, 50);
      s.mechaPos.z = THREE.MathUtils.clamp(s.mechaPos.z, -60, 40);

      if (s.moveDir.length() > 0.1) {
        s.mechaYaw = Math.atan2(-s.moveDir.x, -s.moveDir.y);
      }

      if (mecha) {
        mecha.position.copy(s.mechaPos);
        mecha.rotation.y = s.mechaYaw;
      }

      // Camera Follow
      camera.position.set(s.mechaPos.x * 0.5, 8, s.mechaPos.z + 14);
      camera.lookAt(s.mechaPos.x * 0.5, 2, s.mechaPos.z - 10);

      // Missiles Update & Hit Detection
      for (let i = s.missiles.length - 1; i >= 0; i--) {
        const m = s.missiles[i];
        m.mesh.position.addScaledVector(m.vel, dt);

        for (const e of s.enemies) {
          if (e.alive && m.mesh.position.distanceTo(e.mesh.position) < 3.2) {
            e.hp -= 1;
            s.score += 200;
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (e.hp <= 0) {
              e.alive = false;
              scene.remove(e.mesh);
              s.mechasDestroyed += 1;
              setMechasDestroyed(s.mechasDestroyed);

              if (s.mechasDestroyed >= targetMechas && !s.isGameOver) {
                s.isVictory = true;
                s.isGameOver = true;
                setIsGameOver(true);
                const duration = (Date.now() - s.startTime) / 1000;
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'voxel_titan_mecha',
                  gameTitle: '복셀 타이탄 메카',
                  durationSeconds: duration,
                  score: s.score + 2500,
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

        if (m.mesh.position.z < -100 || m.mesh.position.distanceTo(s.mechaPos) > 80) {
          scene.remove(m.mesh);
          s.missiles.splice(i, 1);
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
    s.mechaPos.set(0, 0, 0);
    s.mechaYaw = 0;
    s.ap = 100;
    s.mechasDestroyed = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.enemies.forEach((e, i) => {
      e.alive = true;
      e.hp = 3;
      const ex = (i % 2 === 0 ? 1 : -1) * (18 + i * 8);
      const ez = -20 - i * 15;
      e.mesh.position.set(ex, 0, ez);
      s.scene?.add(e.mesh);
    });
    setAp(100);
    setMechasDestroyed(0);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 타이탄 도시 방어전' : 'STEP 1: MECHA WARFARE',
      title: isKo ? '적 타이탄 메카 4기 섬멸' : 'Destroy 4 Enemy Titans',
      description: isKo
        ? '파괴된 도시 전장에서 기동하며 적 타이탄 메카 4기를 유도 미사일로 모두 파괴하세요.'
        : 'Maneuver through the ruined city and eliminate 4 enemy Titan mechas with missiles.',
      keyPoints: isKo
        ? [
            '적 타이탄 4기 전원 격파 시 승리',
            '원거리 정밀 미사일 집중 포격',
            '부스트 기동으로 적 포격 회피'
          ]
        : [
            'Destroy 4 Titans to win',
            'Fire precision missile salvos',
            'Boost maneuver to dodge enemy fire'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 기동 & 탭 미사일 사격' : 'Drag Maneuver & Tap Fire',
      description: isKo
        ? '가상 D-Pad 없이 화면 드래그로 메카를 360° 조향 기동하고, 탭하여 미사일을 발사합니다.'
        : 'Drag anywhere to maneuver Titan and tap to fire missiles with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 메카 360° 쾌속 기동 조향',
            '💥 탭: 전방 유도 미사일 발사',
            '⚡ 더블탭 / 위로: 오버클럭 부스트'
          ]
        : [
            '👆 Drag: Smooth 360° maneuver',
            '💥 Tap: Fire guided missiles',
            '⚡ Double Tap / Up: Overclock boost'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '도시 수호 승리 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 AP 및 적 메카 격파 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'AP and destruction bonuses',
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
        title={isKo ? '복셀 타이탄 메카' : 'Voxel Titan Mecha'}
        language={language}
        hp={{ current: ap, max: 100 }}
        telemetries={[
          { label: isKo ? '적 메카' : 'Titans', value: `${mechasDestroyed}/${targetMechas}`, color: 'text-rose-400 font-bold' },
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
              if (dy < -25) {
                triggerBoost();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.set(0, 0);

              if (!moved) {
                // Tap: Fire Missile
                fireMissile();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={triggerBoost}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 메카 기동 | 탭: 미사일 발사 | 더블탭/위로: 부스트 (버튼 없음)' : 'Drag: Maneuver Mecha | Tap: Fire Missiles | Double Tap/Up: Boost (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_titan_mecha"
          gameTitle={isKo ? '3D 복셀 타이탄 메카: 도시 아레나 방어전' : 'Voxel Titan Mecha: City Warfare'}
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
export default VoxelTitanMechaGame;

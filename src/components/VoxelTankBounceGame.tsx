import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTankBounceGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelTankBounceGame: React.FC<VoxelTankBounceGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_tank_bounce') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [tanksLeft, setTanksLeft] = useState<number>(5);
  const targetTanks = 5;
  const [ammo, setAmmo] = useState<number>(12);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0.6, 14),
    pRot: 0,
    moveDir: new THREE.Vector2(0, 0),
    bullets: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; bounces: number }[],
    enemyTanks: [] as { mesh: THREE.Mesh; hp: number; isAlive: boolean }[],
    ammo: 12,
    tanksLeft: 5,
    playerHp: 100,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    tankGroup: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const fireShell = () => {
    const s = stateRef.current;
    if (s.ammo <= 0 || s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;
    s.ammo -= 1;
    setAmmo(s.ammo);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const fwd = new THREE.Vector3(-Math.sin(s.pRot), 0, -Math.cos(s.pRot)).normalize();
    const shellMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 })
    );
    shellMesh.position.copy(s.pPos).add(new THREE.Vector3(0, 0.4, 0));
    s.scene.add(shellMesh);
    s.bullets.push({ mesh: shellMesh, vel: fwd.multiplyScalar(30), bounces: 2 });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    scene.fog = new THREE.FogExp2(0x111827, 0.02);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 24, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Arena Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 48),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Tank
    const pTank = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.0, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    hull.position.y = 0.5;
    pTank.add(hull);

    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x0369a1 })
    );
    turret.rotation.x = Math.PI / 2;
    turret.position.set(0, 0.8, -1.2);
    pTank.add(turret);

    pTank.position.copy(stateRef.current.pPos);
    scene.add(pTank);
    stateRef.current.tankGroup = pTank;

    // Spawn 5 Enemy Tanks
    stateRef.current.enemyTanks = [];
    for (let i = 0; i < targetTanks; i++) {
      const eMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.0, 3.0),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 })
      );
      const ex = (i - 2) * 6.5;
      const ez = -16 + (i % 2) * 6;
      eMesh.position.set(ex, 0.5, ez);
      scene.add(eMesh);

      stateRef.current.enemyTanks.push({
        mesh: eMesh,
        hp: 1,
        isAlive: true
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

      // Tank Movement
      const speed = 12;
      s.pPos.x += s.moveDir.x * speed * dt;
      s.pPos.z += s.moveDir.y * speed * dt;
      s.pPos.x = THREE.MathUtils.clamp(s.pPos.x, -16, 16);
      s.pPos.z = THREE.MathUtils.clamp(s.pPos.z, -22, 22);

      if (s.moveDir.length() > 0.1) {
        s.pRot = Math.atan2(-s.moveDir.x, -s.moveDir.y);
      }

      if (pTank) {
        pTank.position.copy(s.pPos);
        pTank.rotation.y = s.pRot;
      }

      // Update Shells
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.mesh.position.addScaledVector(b.vel, dt);

        // Wall Bounce
        if (Math.abs(b.mesh.position.x) > 17) {
          b.vel.x *= -1;
          b.bounces -= 1;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }
        if (Math.abs(b.mesh.position.z) > 23) {
          b.vel.z *= -1;
          b.bounces -= 1;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }

        // Enemy Hit Check
        for (const e of s.enemyTanks) {
          if (e.isAlive && b.mesh.position.distanceTo(e.mesh.position) < 2.0) {
            e.isAlive = false;
            scene.remove(e.mesh);
            s.tanksLeft -= 1;
            s.score += 300;
            setTanksLeft(s.tanksLeft);
            setScore(s.score);
            b.bounces = 0;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.tanksLeft <= 0 && !s.isGameOver) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_tank_bounce',
                gameTitle: '복셀 탱크 바운스',
                durationSeconds: duration,
                score: s.score + 2500,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
            break;
          }
        }

        if (b.bounces <= 0) {
          scene.remove(b.mesh);
          s.bullets.splice(i, 1);

          if (s.ammo <= 0 && s.tanksLeft > 0 && !s.isGameOver && s.bullets.length === 0) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_tank_bounce',
              gameTitle: '복셀 탱크 바운스',
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
    s.pPos.set(0, 0.6, 14);
    s.pRot = 0;
    s.ammo = 12;
    s.tanksLeft = 5;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.enemyTanks.forEach((e, i) => {
      e.isAlive = true;
      e.mesh.position.set((i - 2) * 6.5, 0.5, -16 + (i % 2) * 6);
      s.scene?.add(e.mesh);
    });
    setAmmo(12);
    setTanksLeft(5);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 도탄 포격 섬멸 작전' : 'STEP 1: RICOCHET WARFARE',
      title: isKo ? '벽면 반사 도탄으로 적 전차 5대 파괴' : 'Destroy 5 Enemy Tanks',
      description: isKo
        ? '벽면에 포탄을 도탄시켜 장애물 뒤에 숨은 적 탱크 5대를 모두 파괴하세요.'
        : 'Bounce shells off arena walls to eliminate all 5 enemy tanks behind cover.',
      keyPoints: isKo
        ? [
            '적 전차 5대 파괴 시 즉시 완승',
            '벽면에 최대 2회 도탄 반사',
            '탄약 12발 내 완주'
          ]
        : [
            'Destroy 5 tanks to win',
            'Shells ricochet up to 2 times',
            'Clear within 12 available ammo'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 기동 & 탭 도탄 포격' : 'Drag Drive & Tap Fire',
      description: isKo
        ? '가상 D-Pad 없이 화면 드래그로 탱크를 주행하고, 탭하여 전방으로 도탄 포탄을 발사합니다.'
        : 'Drag anywhere to drive tank and tap to fire ricochet cannon shells with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 탱크 360° 주행 및 포탑 회전',
            '💥 탭: 정밀 도탄 포탄 격발',
            '⚡ 각도 계산 도탄 시 사각지대 타격'
          ]
        : [
            '👆 Drag: Smooth 360° driving',
            '💥 Tap: Fire ricochet cannon shell',
            '⚡ Calculate angles for blind spot hits'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '전차전 승리 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 탄약 및 도탄 명중률 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Ammo and accuracy bonuses',
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
        title={isKo ? '복셀 탱크 바운스' : 'Voxel Tank Bounce'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '적 전차' : 'Tanks', value: `${tanksLeft}/${targetTanks}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '포탄' : 'Ammo', value: `${ammo}발`, color: ammo <= 3 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
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
                // Tap: Fire Shell
                fireShell();
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
        <div className="px-3 py-1 bg-black/75 border border-amber-400/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 전차 기동 | 탭: 도탄 포탄 발사 (버튼 없음)' : 'Drag: Drive Tank | Tap: Fire Ricochet Shell (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_tank_bounce"
          gameTitle={isKo ? '3D 복셀 탱크 바운스: 도탄 아레나' : 'Voxel Tank Bounce: Ricochet Arena'}
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
export default VoxelTankBounceGame;

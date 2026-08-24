import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelLaserStealthGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface LaserGrid {
  mesh: THREE.Mesh;
  yMin: number;
  yMax: number;
  speed: number;
  dir: number;
  axis: 'x' | 'z';
  pos: number;
  isStunned: boolean;
}

interface Jewel {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  collected: boolean;
  value: number;
}

export const VoxelLaserStealthGame: React.FC<VoxelLaserStealthGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_laser_stealth') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [alarmLevel, setAlarmLevel] = useState<number>(0);
  const [empCharges, setEmpCharges] = useState<number>(3);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    thiefPos: new THREE.Vector3(0, 0.4, -18),
    thiefVel: new THREE.Vector3(0, 0, 0),
    moveDir: new THREE.Vector2(0, 0),
    isSliding: false,
    slideTimer: 0,
    empCharges: 3,
    alarmLevel: 0,
    score: 0,
    currentLevel: 1,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    thiefMesh: null as THREE.Group | null,
    lasers: [] as LaserGrid[],
    jewels: [] as Jewel[],
    exitDoorMesh: null as THREE.Mesh | null
  });

  const triggerSlide = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.isSliding) return;
    s.isSliding = true;
    s.slideTimer = 0.8;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const triggerEmp = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.empCharges <= 0) return;
    s.empCharges -= 1;
    setEmpCharges(s.empCharges);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    s.lasers.forEach(l => {
      l.isStunned = true;
      l.mesh.visible = false;
      setTimeout(() => {
        l.isStunned = false;
        l.mesh.visible = true;
      }, 3500);
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 18, -12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.8);
    scene.add(ambientLight);

    const blueSpot = new THREE.SpotLight(0x38bdf8, 2.5);
    blueSpot.position.set(0, 20, 0);
    scene.add(blueSpot);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 44),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Exit Vault Gate
    const exitDoor = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 1),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x047857 })
    );
    exitDoor.position.set(0, 2, 20);
    scene.add(exitDoor);
    stateRef.current.exitDoorMesh = exitDoor;

    // Player Thief
    const thiefGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x1e1b4b }));
    body.position.y = 0.7;
    thiefGroup.add(body);

    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981 }));
    goggles.position.set(0, 1.1, 0.4);
    thiefGroup.add(goggles);

    thiefGroup.position.set(0, 0.4, -18);
    scene.add(thiefGroup);
    stateRef.current.thiefMesh = thiefGroup;

    // Laser Grids (6 moving beams)
    stateRef.current.lasers = [];
    for (let i = 0; i < 6; i++) {
      const isX = i % 2 === 0;
      const lGeo = isX ? new THREE.CylinderGeometry(0.08, 0.08, 24, 8) : new THREE.CylinderGeometry(0.08, 0.08, 44, 8);
      const lMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const lMesh = new THREE.Mesh(lGeo, lMat);
      if (isX) {
        lMesh.rotation.z = Math.PI / 2;
        lMesh.position.set(0, 1.2, -12 + i * 5);
      } else {
        lMesh.rotation.x = Math.PI / 2;
        lMesh.position.set(-8 + i * 3, 1.2, 0);
      }
      scene.add(lMesh);

      stateRef.current.lasers.push({
        mesh: lMesh,
        yMin: 0.4,
        yMax: 2.2,
        speed: 1.5 + i * 0.4,
        dir: 1,
        axis: isX ? 'x' : 'z',
        pos: isX ? -12 + i * 5 : -8 + i * 3,
        isStunned: false
      });
    }

    // Jewels
    stateRef.current.jewels = [];
    for (let j = 0; j < 5; j++) {
      const jMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.4),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2 })
      );
      const jx = (j % 2 === 0 ? 1 : -1) * (3 + j * 1.5);
      const jz = -10 + j * 6;
      jMesh.position.set(jx, 0.6, jz);
      scene.add(jMesh);

      stateRef.current.jewels.push({
        mesh: jMesh,
        x: jx,
        z: jz,
        collected: false,
        value: 300
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

      // Sliding timer
      if (s.isSliding) {
        s.slideTimer -= dt;
        if (s.slideTimer <= 0) s.isSliding = false;
      }

      // Movement
      const moveSpeed = s.isSliding ? 14 : 9;
      s.thiefPos.x += s.moveDir.x * moveSpeed * dt;
      s.thiefPos.z += s.moveDir.y * moveSpeed * dt;

      s.thiefPos.x = THREE.MathUtils.clamp(s.thiefPos.x, -10, 10);
      s.thiefPos.z = THREE.MathUtils.clamp(s.thiefPos.z, -19, 21);

      if (thiefGroup) {
        thiefGroup.position.copy(s.thiefPos);
        thiefGroup.scale.y = s.isSliding ? 0.4 : 1.0;
      }

      // Move Lasers
      s.lasers.forEach(l => {
        if (l.isStunned) return;
        l.mesh.position.y += l.dir * l.speed * dt;
        if (l.mesh.position.y > l.yMax) {
          l.mesh.position.y = l.yMax;
          l.dir = -1;
        } else if (l.mesh.position.y < l.yMin) {
          l.mesh.position.y = l.yMin;
          l.dir = 1;
        }

        // Collision Check
        const dist = l.axis === 'x'
          ? Math.abs(s.thiefPos.z - l.pos)
          : Math.abs(s.thiefPos.x - l.pos);

        if (dist < 0.6) {
          const beamY = l.mesh.position.y;
          const playerY = s.isSliding ? 0.3 : 0.8;
          if (Math.abs(beamY - playerY) < 0.5) {
            // Laser Hit
            s.alarmLevel = Math.min(100, s.alarmLevel + dt * 50);
            setAlarmLevel(Math.round(s.alarmLevel));
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

            if (s.alarmLevel >= 100 && !s.isGameOver) {
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_laser_stealth',
                gameTitle: '복셀 레이저 스텔스',
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
      });

      // Collect Jewels
      s.jewels.forEach(j => {
        if (!j.collected) {
          const dist = s.thiefPos.distanceTo(new THREE.Vector3(j.x, 0.4, j.z));
          if (dist < 1.2) {
            j.collected = true;
            j.mesh.visible = false;
            s.score += j.value;
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
        }
      });

      // Exit Door Check
      if (s.thiefPos.z >= 19 && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_laser_stealth',
          gameTitle: '복셀 레이저 스텔스',
          durationSeconds: duration,
          score: s.score + 1500,
          difficulty: 'HARD',
          isVictory: true
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
    s.thiefPos.set(0, 0.4, -18);
    s.moveDir.set(0, 0);
    s.isSliding = false;
    s.empCharges = 3;
    s.alarmLevel = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.jewels.forEach(j => {
      j.collected = false;
      j.mesh.visible = true;
    });
    setScore(0);
    setAlarmLevel(0);
    setEmpCharges(3);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 뮤지엄 볼트 탈출' : 'STEP 1: VAULT ESCAPE',
      title: isKo ? '보석 루팅 및 비상구 도달' : 'Loot Jewels & Reach Exit',
      description: isKo
        ? '움직이는 레이저 경보 센서를 피해 보석을 루팅하고 녹색 비상구 게이트로 탈출하세요.'
        : 'Evade moving laser alarm beams, steal jewels, and escape through the green vault gate.',
      keyPoints: isKo
        ? [
            '레이저 접촉 시 알람 수치 급상승',
            '보석 루팅당 +300P 보너스',
            '경보 100% 도달 전 안전 탈출'
          ]
        : [
            'Alarm rises rapidly upon laser contact',
            '+300P bonus per stolen jewel',
            'Escape before alarm hits 100%'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 컨트롤' : 'STEP 2: PURE GESTURES',
      title: isKo ? '슬라이딩 회피 & EMP 무력화' : 'Slide Dodge & EMP Stun',
      description: isKo
        ? '가상 조이스틱 없이 드래그 이동, 탭 슬라이딩 회피, 더블탭 EMP로 모든 센서를 잠식합니다.'
        : 'Control stealth runs with drag movement, tap slide-dodge, and double-tap EMP blast.',
      keyPoints: isKo
        ? [
            '👆 드래그: 전방향 스텔스 잠입 이동',
            '⚡ 탭: 낮은 레이저 슬라이딩 회피',
            '💥 2x 탭: 전자기 EMP 3.5초 무력화'
          ]
        : [
            '👆 Drag: Multi-directional stealth movement',
            '⚡ Tap: Low laser slide dodging',
            '💥 Double-Tap: EMP 3.5s laser blackout'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '탈출 성공 시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '스피드 탈출 및 보석 루팅 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Speed escape and jewel loot bonuses',
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
        title={isKo ? '복셀 레이저 스텔스' : 'Voxel Laser Stealth'}
        language={language}
        telemetries={[
          { label: isKo ? '경보' : 'Alarm', value: `${alarmLevel}%`, color: alarmLevel > 70 ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-300' },
          { label: isKo ? 'EMP' : 'EMP', value: `x${empCharges}`, color: 'text-cyan-300' },
          { label: isKo ? '전리품' : 'Loot', value: `${score}P`, color: 'text-amber-300' }
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

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                stateRef.current.moveDir.x = Math.abs(dx) > 10 ? (dx > 0 ? 1 : -1) : 0;
                stateRef.current.moveDir.y = Math.abs(dy) > 10 ? (dy < 0 ? 1 : -1) : 0;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.moveDir.x = 0;
              stateRef.current.moveDir.y = 0;

              if (!moved) {
                // Tap: Slide Dodge
                triggerSlide();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={triggerEmp}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 잠입 이동 | 탭: 슬라이딩 회피 | 더블탭: EMP 무력화 (버튼 없음)' : 'Drag: Move | Tap: Slide Dodge | Double Tap: EMP Stun (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_laser_stealth"
          gameTitle={isKo ? '3D 복셀 레이저 스텔스: 뮤지엄 볼트 잠입' : 'Voxel Laser Stealth: Vault Heist'}
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

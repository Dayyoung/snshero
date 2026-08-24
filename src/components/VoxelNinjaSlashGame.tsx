import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelNinjaSlashGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelNinjaSlashGame: React.FC<VoxelNinjaSlashGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_ninja_slash') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [slashedCount, setSlashedCount] = useState<number>(0);
  const targetGuards = 8;
  const [combo, setCombo] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [bulletTime, setBulletTime] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    ninjaPos: new THREE.Vector3(0, 0.8, 14),
    targetVelocity: new THREE.Vector3(0, 0, 0),
    targets: [] as { mesh: THREE.Group; x: number; z: number; hp: number; isAlive: boolean }[],
    isSlashing: false,
    slashAnimTime: 0,
    bulletTime: false,
    bulletTimeTimer: 0,
    slashedCount: 0,
    combo: 1,
    score: 0,
    timeLeft: 60,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    bladeMesh: null as THREE.Mesh | null,
    ninjaGroup: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const handleSlash = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;

    s.isSlashing = true;
    s.slashAnimTime = 0.25;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Check hit nearby guards
    s.targets.forEach(t => {
      if (t.isAlive) {
        const dist = s.ninjaPos.distanceTo(new THREE.Vector3(t.x, 0.8, t.z));
        if (dist < 3.2) {
          t.hp -= 1;
          if (t.hp <= 0) {
            t.isAlive = false;
            s.scene?.remove(t.mesh);
            s.slashedCount += 1;
            s.combo = Math.min(10, s.combo + 1);
            s.score += 250 * s.combo;

            setSlashedCount(s.slashedCount);
            setCombo(s.combo);
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.slashedCount >= targetGuards && !s.isGameOver) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_ninja_slash',
                gameTitle: '복셀 닌자 슬래시',
                durationSeconds: duration,
                score: s.score + 2500,
                difficulty: 'NIGHTMARE',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
        }
      }
    });
  };

  const handleBulletTime = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.bulletTime = true;
    s.bulletTimeTimer = 3.0;
    setBulletTime(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleDash = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.ninjaPos.z -= 6.0;
    s.ninjaPos.z = THREE.MathUtils.clamp(s.ninjaPos.z, -25, 25);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060810);
    scene.fog = new THREE.FogExp2(0x060810, 0.02);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);
    camera.lookAt(0, 1, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xec4899, 1.4);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Bamboo Forest Ground
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 60),
      new THREE.MeshLambertMaterial({ color: 0x0f172a })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Ninja Player
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), new THREE.MeshLambertMaterial({ color: 0x1e1b4b }));
    pBody.position.y = 0.7;
    playerGroup.add(pBody);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.6), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 }));
    blade.position.set(0.6, 0.7, 0.5);
    playerGroup.add(blade);
    stateRef.current.bladeMesh = blade;

    playerGroup.position.set(0, 0.8, 14);
    scene.add(playerGroup);
    stateRef.current.ninjaGroup = playerGroup;

    // Spawn 8 Guards
    stateRef.current.targets = [];
    for (let i = 0; i < targetGuards; i++) {
      const gGroup = new THREE.Group();
      const gBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), new THREE.MeshLambertMaterial({ color: 0x991b1b }));
      gBody.position.y = 0.7;
      gGroup.add(gBody);

      const gx = (Math.random() - 0.5) * 20;
      const gz = (Math.random() - 0.5) * 35;
      gGroup.position.set(gx, 0.8, gz);
      scene.add(gGroup);

      stateRef.current.targets.push({
        mesh: gGroup,
        x: gx,
        z: gz,
        hp: 2,
        isAlive: true
      });
    }

    // Timer Interval
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
          gameId: 'voxel_ninja_slash',
          gameTitle: '복셀 닌자 슬래시',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'NIGHTMARE',
          isVictory: s.slashedCount >= targetGuards
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

      const timeScale = s.bulletTime ? 0.35 : 1.0;

      if (s.bulletTimeTimer > 0) {
        s.bulletTimeTimer -= dt;
        if (s.bulletTimeTimer <= 0) {
          s.bulletTime = false;
          setBulletTime(false);
        }
      }

      // Move Ninja
      s.ninjaPos.x += s.targetVelocity.x * dt * 14;
      s.ninjaPos.z += s.targetVelocity.z * dt * 14;
      s.ninjaPos.x = THREE.MathUtils.clamp(s.ninjaPos.x, -12, 12);
      s.ninjaPos.z = THREE.MathUtils.clamp(s.ninjaPos.z, -26, 26);

      if (playerGroup) {
        playerGroup.position.copy(s.ninjaPos);
      }

      // Camera Follow
      camera.position.set(s.ninjaPos.x, 8, s.ninjaPos.z + 8);
      camera.lookAt(s.ninjaPos.x, 1, s.ninjaPos.z - 6);

      // Slash Animation
      if (blade && s.slashAnimTime > 0) {
        s.slashAnimTime -= dt;
        blade.rotation.y += dt * 25;
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
    s.ninjaPos.set(0, 0.8, 14);
    s.targetVelocity.set(0, 0, 0);
    s.slashedCount = 0;
    s.combo = 1;
    s.score = 0;
    s.timeLeft = 60;
    s.bulletTime = false;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.targets.forEach(t => {
      t.isAlive = true;
      t.hp = 2;
      s.scene?.add(t.mesh);
    });
    setSlashedCount(0);
    setCombo(1);
    setScore(0);
    setTimeLeft(60);
    setBulletTime(false);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 그림자 암살 미션' : 'STEP 1: SHADOW ASSASSIN',
      title: isKo ? '경비병 8인 전격 암살' : 'Eliminate 8 Guards',
      description: isKo
        ? '대나무 숲에 잠입하여 60초 내에 8명의 경비병을 연속 베기로 제압하세요.'
        : 'Infiltrate the bamboo grove and eliminate 8 guards using combo slashes within 60s.',
      keyPoints: isKo
        ? [
            '경비병 8인 처치 시 즉시 승리',
            '연속 베기 콤보 최대 10x 배율 달성',
            '60초 타임어택 제한 시간'
          ]
        : [
            'Eliminate 8 guards to win',
            'Chain combo slashes up to 10x multiplier',
            '60s time attack challenge'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 전투' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원핸드 모바일 검술 조작' : 'One-Thumb Combat Controls',
      description: isKo
        ? '가상 버튼 없이 드래그로 이동, 탭으로 검술 베기, 스와이프로 불릿타임, 2x 탭으로 대시합니다.'
        : 'Drag to move, tap to slash, swipe for bullet time, and double-tap to flash dash with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 360° 자유 이동 및 접근',
            '⚔️ 탭: 3단 연속 베기 콤보',
            '⏱️ 스와이프: 불릿 타임 (시간 35% 감속)',
            '💨 2x 탭: 그림자 섬광 대시'
          ]
        : [
            '👆 Drag: Smooth 360° movement',
            '⚔️ Tap: 3-hit combo slash',
            '⏱️ Swipe: Bullet Time slow-mo',
            '💨 Double-Tap: Shadow Flash Dash'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '암살 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '콤보 배율 및 스피드 암살 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Combo and speed assassination bonuses',
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
        title={isKo ? '복셀 닌자 슬래시' : 'Voxel Ninja Slash'}
        language={language}
        telemetries={[
          { label: isKo ? '처치' : 'Kills', value: `${slashedCount}/${targetGuards}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: combo > 1 ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-400' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 15 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
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

      {/* Bullet Time Indicator */}
      {bulletTime && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-cyan-400 border border-cyan-200 text-slate-950 px-3 py-0.5 rounded-full text-xs font-black animate-pulse z-30 pointer-events-none shadow-md">
          <span>⚡ BULLET TIME (SLOW MOTION)</span>
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
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                stateRef.current.targetVelocity.x = Math.abs(dx) > 10 ? (dx > 0 ? 1 : -1) : 0;
                stateRef.current.targetVelocity.z = Math.abs(dy) > 10 ? (dy > 0 ? 1 : -1) : 0;
              }

              if (dy < -25) {
                handleBulletTime();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.targetVelocity.set(0, 0, 0);

              if (!moved) {
                // Tap: Slash
                handleSlash();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={handleDash}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-pink-500/30 rounded-full text-[10px] text-pink-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 이동 | 탭: 검술 베기 | 위로 스와이프: 불릿타임 | 더블탭: 대시 (버튼 없음)' : 'Drag: Move | Tap: Slash | Swipe Up: Bullet Time | Double Tap: Dash (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_ninja_slash"
          gameTitle={isKo ? '3D 복셀 닌자 슬래시: 그림자 암살자' : '3D Voxel Ninja Slash: Shadow Assassin'}
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

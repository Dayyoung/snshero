import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { OneThumbMeleeGestureAdapter } from '../lib/oneThumbMeleeGestureAdapter';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
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
  const [combo, setCombo] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [bulletTime, setBulletTime] = useState<boolean>(false);
  const [actionBanner, setActionBanner] = useState<string>('');
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
    isPaused: false,
    startTime: Date.now(),
    bladeMesh: null as THREE.Mesh | null,
    ninjaGroup: null as THREE.Group | null
  });

  useEffect(() => {
    stateRef.current.isPaused = isPaused || showTutorial;
  }, [isPaused, showTutorial]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060810);
    scene.fog = new THREE.FogExp2(0x060810, 0.02);

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

    // Bamboo Forest Ground with Grid Hairlines
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 60),
      new THREE.MeshLambertMaterial({ color: 0x0f172a })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Add glowing arena border lines
    const borderGeo = new THREE.BoxGeometry(24, 0.2, 0.4);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const bTop = new THREE.Mesh(borderGeo, borderMat);
    bTop.position.set(0, 0.1, -25);
    scene.add(bTop);
    const bBot = new THREE.Mesh(borderGeo, borderMat);
    bBot.position.set(0, 0.1, 20);
    scene.add(bBot);

    // Ninja Player Mesh
    const ninjaGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 1.0),
      new THREE.MeshLambertMaterial({ color: 0x1e293b })
    );
    body.position.y = 0.9;
    ninjaGroup.add(body);

    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.0, 0.35),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    blade.position.set(0.8, 1.0, 0.4);
    ninjaGroup.add(blade);
    scene.add(ninjaGroup);

    stateRef.current.ninjaGroup = ninjaGroup;
    stateRef.current.bladeMesh = blade;

    // Spawn 8 Enemy Guards in Formation
    stateRef.current.targets = [];
    for (let i = 0; i < 8; i++) {
      const eGroup = new THREE.Group();
      const eb = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 2.0, 1.2),
        new THREE.MeshLambertMaterial({ color: 0xef4444 })
      );
      eb.position.y = 1.0;
      eGroup.add(eb);

      // Enemy weapon
      const ew = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1.4, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      ew.position.set(0.8, 0.9, 0.3);
      eGroup.add(ew);

      const zPos = 10 - i * 4.5;
      const xPos = (i % 2 === 0 ? 3.5 : -3.5);
      eGroup.position.set(xPos, 0, zPos);
      scene.add(eGroup);

      stateRef.current.targets.push({
        mesh: eGroup,
        x: xPos,
        z: zPos,
        hp: 100,
        isAlive: true
      });
    }

    // Set up Melee Pure Gesture Adapter
    const meleeAdapter = new OneThumbMeleeGestureAdapter(container, {
      onMove: (normX, normZ) => {
        const s = stateRef.current;
        if (s.isGameOver || s.isPaused) return;
        s.targetVelocity.x = normX * 0.35;
        s.targetVelocity.z = normZ * 0.4;
      },
      onComboSlash: (comboIdx) => {
        const s = stateRef.current;
        if (s.isSlashing || s.isGameOver || s.isPaused) return;
        s.isSlashing = true;
        s.slashAnimTime = 12;
        s.combo = Math.min(10, s.combo + 1);
        setCombo(s.combo);

        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

        // Check melee hit against targets
        let hitAny = false;
        for (const t of s.targets) {
          if (!t.isAlive) continue;
          const dist = s.ninjaPos.distanceTo(t.mesh.position);
          if (dist < 4.5) {
            t.hp -= 50;
            if (t.hp <= 0) {
              t.isAlive = false;
              t.mesh.position.y = -10; // Eliminate
              s.slashedCount += 1;
              s.score += 250 * s.combo;
              setSlashedCount(s.slashedCount);
              setScore(s.score);
              hitAny = true;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            }
          }
        }

        const slashNames = ['⚡ 일섬 (Light)', '⚔️ 연참 (Medium)', '💥 귀신 베기 (Finisher)'];
        setActionBanner(`${slashNames[(comboIdx - 1) % 3]} [${s.combo}x Combo]`);
        setTimeout(() => setActionBanner(''), 900);

        // Check Victory Condition
        const remaining = s.targets.filter(t => t.isAlive).length;
        if (remaining === 0 || s.ninjaPos.z < -22) {
          finishGame(true);
        }
      },
      onParryGuard: () => {
        // Swipe triggers Bullet Time slowdown
        const s = stateRef.current;
        if (s.bulletTimeTimer > 0 || s.isGameOver || s.isPaused) return;
        s.bulletTime = true;
        s.bulletTimeTimer = 75; // ~1.2s of slow motion
        setBulletTime(true);
        setActionBanner(isKo ? '⏱️ 불릿 타임: 시간 왜곡!' : '⏱️ BULLET TIME: Time Slowed!');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setTimeout(() => setActionBanner(''), 1200);
      },
      onEvasiveDodge: () => {
        // Double tap: Shadow Flash Dash forward
        const s = stateRef.current;
        if (s.isGameOver || s.isPaused) return;
        s.ninjaPos.z -= 6.0;
        s.score += 100;
        setScore(s.score);
        setActionBanner(isKo ? '💨 그림자 섬광 대시!' : '💨 Shadow Flash Dash!');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        setTimeout(() => setActionBanner(''), 800);
      },
      onChargeStrike: () => {
        // Long press: Void Shockwave
        const s = stateRef.current;
        if (s.isGameOver || s.isPaused) return;
        setActionBanner(isKo ? '🌀 멸살 파동격 (Area Shockwave)!' : '🌀 Void Shockwave!');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

        // Damage all in radius 8
        for (const t of s.targets) {
          if (!t.isAlive) continue;
          if (s.ninjaPos.distanceTo(t.mesh.position) < 8.0) {
            t.isAlive = false;
            t.mesh.position.y = -10;
            s.slashedCount += 1;
            s.score += 350 * s.combo;
          }
        }
        setSlashedCount(s.slashedCount);
        setScore(s.score);

        const remaining = s.targets.filter(t => t.isAlive).length;
        if (remaining === 0) finishGame(true);
      }
    });

    const finishGame = (victory: boolean) => {
      const s = stateRef.current;
      if (s.isGameOver) return;
      s.isGameOver = true;
      setIsGameOver(true);

      const durationSeconds = Math.round((Date.now() - s.startTime) / 1000);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'voxel_ninja_slash',
        gameTitle: isKo ? '3D 복셀 닌자 슬래시: 그림자 암살자' : '3D Voxel Ninja Slash: Shadow Assassin',
        durationSeconds,
        score: s.score,
        maxTargetScore: 3000,
        isVictory: victory,
        difficulty: 'HARD',
        comboCount: s.combo,
        perfectClear: s.slashedCount >= 8
      });

      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    };

    // 1-second countdown timer
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isGameOver || s.isPaused) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);
      if (s.timeLeft <= 0) {
        finishGame(false);
      }
    }, 1000);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;

      if (s.isGameOver || s.isPaused) {
        renderer.render(scene, camera);
        return;
      }

      // Handle Bullet Time slowdown factor
      const timeScale = s.bulletTime ? 0.35 : 1.0;

      if (s.bulletTimeTimer > 0) {
        s.bulletTimeTimer -= 1;
        if (s.bulletTimeTimer <= 0) {
          s.bulletTime = false;
          setBulletTime(false);
        }
      }

      // Smooth Position update
      s.ninjaPos.x = Math.max(-6.5, Math.min(6.5, s.ninjaPos.x + s.targetVelocity.x * timeScale));
      s.ninjaPos.z += s.targetVelocity.z * timeScale;
      s.targetVelocity.multiplyScalar(0.9);

      // Slash blade animation
      if (s.isSlashing && blade) {
        s.slashAnimTime -= 1;
        blade.rotation.x = -Math.sin(((12 - s.slashAnimTime) / 12) * Math.PI) * 2.2;
        if (s.slashAnimTime <= 0) {
          s.isSlashing = false;
          blade.rotation.x = 0;
        }
      }

      ninjaGroup.position.copy(s.ninjaPos);
      camera.position.set(s.ninjaPos.x * 0.4, 8, s.ninjaPos.z + 10);
      camera.lookAt(s.ninjaPos.x * 0.4, 1, s.ninjaPos.z - 4);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(timerInterval);
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      meleeAdapter.destroy();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, isKo, onReward, playSfx]);

  const handleRestart = () => {
    setIsGameOver(false);
    setSettlementReceipt(null);
    setSlashedCount(0);
    setScore(0);
    setCombo(1);
    setTimeLeft(60);

    const s = stateRef.current;
    s.ninjaPos.set(0, 0.8, 14);
    s.slashedCount = 0;
    s.score = 0;
    s.combo = 1;
    s.timeLeft = 60;
    s.isGameOver = false;
    s.startTime = Date.now();

    s.targets.forEach(t => {
      t.hp = 100;
      t.isAlive = true;
      t.mesh.position.set(t.x, 0, t.z);
    });
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 닌자 암살 룰' : 'STEP 1: ASSASSIN RULES',
      title: isKo ? '8명의 적 가드 격파' : 'Defeat All 8 Enemy Guards',
      description: isKo
        ? '제한 시간 60초 내에 대나무 숲길을 전진하며 배치된 모든 적 닌자를 처치하세요. 콤보를 이을수록 점수와 SNS 포인트가 급상승합니다.'
        : 'Advance through the bamboo forest path and eliminate all 8 enemy guards before the 60s timer expires.',
      keyPoints: isKo
        ? [
            '적 가드 전원 처치 시 암살 완수 및 즉시 보상',
            '연속 공격 시 최대 10x 콤보 배율 누적',
            '제한 시간 60초 초과 시 임무 실패'
          ]
        : [
            'Eliminate all guards for instant victory',
            'Chain consecutive slashes up to 10x multiplier',
            'Clear within 60s limit'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 100% 퓨어 제스처' : 'STEP 2: PURE GESTURE CONTROLS',
      title: isKo ? '원핸드 모바일 제스처 전투' : 'One-Thumb Combat Gestures',
      description: isKo
        ? '화면 어디든 엄지로 직관적인 탭, 드래그, 스와이프를 사용하여 검술을 펼치세요.'
        : 'Touch, drag, and swipe anywhere on screen for seamless one-thumb melee combat.',
      keyPoints: isKo
        ? [
            '👆 드래그: 360도 자유 이동 및 적에게 접근',
            '⚔️ 탭: 3단 연속 베기 콤보 공격',
            '⏱️ 스와이프: 불릿 타임 (시간 35% 감속)',
            '💨 2x 탭: 그림자 섬광 대시 돌파'
          ]
        : [
            '👆 Drag: 360-degree smooth movement',
            '⚔️ Tap: 3-hit combo melee slash',
            '⏱️ Swipe: Bullet Time slow motion (35% speed)',
            '💨 Double-Tap: Shadow Flash Dash'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED SNS REWARDS',
      title: isKo ? '즉시 지갑 입금 & 보너스' : 'Instant Wallet Deposit',
      description: isKo
        ? '클리어 즉시 분당 50P 표준 및 콤보 보너스가 유저 지갑에 100% 확정 입금됩니다.'
        : 'Standard ~50P/min payout + combo bonus deposited immediately to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 로컬스토리지 영구 지갑 입금',
            '퍼펙트 클리어 시 최대 +80 SNS 추가',
            '일일 퀘스트 및 시즌 미션 자동 누적'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Perfect run awards up to +80 extra SNS',
            'Advances daily & season quests automatically'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Safe-Area Aware Minimal HUD */}
      <MobileSafeAreaHUD
        gameTitle={isKo ? '복셀 닌자 슬래시' : 'Voxel Ninja Slash'}
        score={score}
        timeLeft={timeLeft}
        combo={combo}
        customMetricLabel={isKo ? '처치' : 'Kills'}
        customMetricValue={`${slashedCount}/8`}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Action Notification Banner */}
      {actionBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#fdfcfc] border-2 border-[#201d1d] text-[#201d1d] px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-md z-30 pointer-events-none animate-bounce">
          {actionBanner}
        </div>
      )}

      {/* Bullet Time Indicator */}
      {bulletTime && (
        <div className="absolute top-14 left-4 bg-cyan-400 border border-[#201d1d] text-[#201d1d] px-2.5 py-0.5 rounded-sm text-xs font-black animate-pulse z-30 pointer-events-none shadow-xs">
          <span>⚡ BULLET TIME (SLOW)</span>
        </div>
      )}

      {/* Bottom Hint Banner */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center z-20 pointer-events-none">
          <div className="bg-[#fdfcfc]/90 border border-[#201d1d]/30 px-3 py-1 text-[11px] font-bold text-[#201d1d] rounded-sm shadow-xs text-center max-w-sm">
            {isKo
              ? '👆 화면 드래그(이동) / 탭(연속 베기) / 스와이프(불릿타임) / 더블탭(대시)'
              : '👆 Drag (Move) / Tap (Combo Slash) / Swipe (Bullet Time) / 2x Tap (Dash)'}
          </div>
        </div>
      )}

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

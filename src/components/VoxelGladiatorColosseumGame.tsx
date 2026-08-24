import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { OneThumbMeleeGestureAdapter } from '../lib/oneThumbMeleeGestureAdapter';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelGladiatorColosseumGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelGladiatorColosseumGame: React.FC<VoxelGladiatorColosseumGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const heroCards = deck.slice(0, 3);
  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_gladiator_colosseum') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [enemyHp, setEnemyHp] = useState<number>(200);
  const [crowdFever, setCrowdFever] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [actionBanner, setActionBanner] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const currentHero = heroCards[activeHeroIdx] || { title: 'Gladiator', power: 20 };

  const stateRef = useRef({
    playerPos: new THREE.Vector3(0, 0, 4),
    targetVelocity: new THREE.Vector3(0, 0, 0),
    playerHp: 100,
    enemyHp: 200,
    crowdFever: 0,
    isGuarding: false,
    parryWindow: 0,
    isAttacking: false,
    attackTime: 0,
    enemyAttackCooldown: 60,
    enemyIsAttacking: false,
    heroIdx: 0,
    combo: 1,
    score: 0,
    timeLeft: 90,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    pSword: null as THREE.Mesh | null,
    pShield: null as THREE.Mesh | null,
    eAxe: null as THREE.Mesh | null,
    playerGroup: null as THREE.Group | null,
    enemyGroup: null as THREE.Group | null
  });

  useEffect(() => {
    stateRef.current.isPaused = isPaused || showTutorial;
  }, [isPaused, showTutorial]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0f0a);
    scene.fog = new THREE.FogExp2(0x1a0f0a, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffedd5, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xf97316, 1.4);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // Arena Floor
    const arenaGeo = new THREE.CylinderGeometry(14, 14, 1, 32);
    const arenaMat = new THREE.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.9 });
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.y = -0.5;
    scene.add(arena);

    // Player Gladiator
    const pGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.6, 0.8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    pBody.position.y = 0.8;
    pGroup.add(pBody);

    const pSword = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 0.3), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 }));
    pSword.position.set(0.7, 0.9, 0.4);
    pGroup.add(pSword);
    stateRef.current.pSword = pSword;

    const pShield = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.2), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    pShield.position.set(-0.7, 0.8, 0.4);
    pGroup.add(pShield);
    stateRef.current.pShield = pShield;

    pGroup.position.set(0, 0, 4);
    scene.add(pGroup);
    stateRef.current.playerGroup = pGroup;

    // Boss Champion
    const eGroup = new THREE.Group();
    const eBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.2), new THREE.MeshStandardMaterial({ color: 0x7c2d12 }));
    eBody.position.y = 1.2;
    eGroup.add(eBody);

    const eAxe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 0.8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    eAxe.position.set(1.2, 1.4, 0.6);
    eGroup.add(eAxe);
    stateRef.current.eAxe = eAxe;

    eGroup.position.set(0, 0, -4);
    scene.add(eGroup);
    stateRef.current.enemyGroup = eGroup;

    // Gesture Adapter
    const gesture = new OneThumbMeleeGestureAdapter(container, {
      onMove: (nx, nz) => {
        const s = stateRef.current;
        if (s.isPaused || s.isGameOver) return;
        s.targetVelocity.set(nx * 12, 0, nz * 12);
      },
      onComboSlash: () => {
        const s = stateRef.current;
        if (s.isPaused || s.isGameOver || s.isAttacking) return;
        s.isAttacking = true;
        s.attackTime = 0.2;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

        // Check Hit
        const dist = s.playerPos.distanceTo(eGroup.position);
        if (dist < 4.2) {
          const dmg = (heroCards[s.heroIdx]?.power || 20) * (s.crowdFever > 80 ? 2.2 : 1.0);
          s.enemyHp = Math.max(0, s.enemyHp - dmg);
          s.score += Math.round(dmg * 10);
          s.combo += 1;
          s.crowdFever = Math.min(100, s.crowdFever + 8);
          setEnemyHp(Math.round(s.enemyHp));
          setScore(s.score);
          setCombo(s.combo);
          setCrowdFever(Math.round(s.crowdFever));
          setActionBanner(`💥 ${Math.round(dmg)} DMG! (x${s.combo} HIT)`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.enemyHp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_gladiator_colosseum',
              gameTitle: '복셀 검투사 콜로세움',
              durationSeconds: duration,
              score: s.score + 2000,
              difficulty: 'NIGHTMARE',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }
      },
      onParryGuard: () => {
        const s = stateRef.current;
        if (s.isPaused || s.isGameOver) return;
        s.isGuarding = true;
        s.parryWindow = 0.4;
        setActionBanner('🛡️ PARRY GUARD!');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        setTimeout(() => {
          s.isGuarding = false;
        }, 400);
      },
      onEvasiveDodge: () => {
        const s = stateRef.current;
        if (s.isPaused || s.isGameOver || heroCards.length <= 1) return;
        s.heroIdx = (s.heroIdx + 1) % heroCards.length;
        setActiveHeroIdx(s.heroIdx);
        setActionBanner(`🔄 HERO TAG: ${heroCards[s.heroIdx]?.title || 'Hero'}`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      },
      onChargeStrike: () => {
        // Charge Strike
      }
    });

    // Timer Interval
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);

      if (s.timeLeft <= 0) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_gladiator_colosseum',
          gameTitle: '복셀 검투사 콜로세움',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'NIGHTMARE',
          isVictory: s.enemyHp <= 50
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

      // Player Movement
      s.playerPos.addScaledVector(s.targetVelocity, dt);
      s.playerPos.x = THREE.MathUtils.clamp(s.playerPos.x, -11, 11);
      s.playerPos.z = THREE.MathUtils.clamp(s.playerPos.z, -11, 11);
      pGroup.position.copy(s.playerPos);

      // Sword Swing
      if (s.isAttacking && s.pSword) {
        s.attackTime -= dt;
        s.pSword.rotation.x = Math.sin(s.attackTime * 20) * 1.2;
        if (s.attackTime <= 0) {
          s.isAttacking = false;
          s.pSword.rotation.x = 0;
        }
      }

      // Boss AI Attack
      s.enemyAttackCooldown -= dt * 60;
      if (s.enemyAttackCooldown <= 0) {
        s.enemyAttackCooldown = 70;
        const dist = s.playerPos.distanceTo(eGroup.position);
        if (dist < 4.5) {
          if (s.isGuarding) {
            // Parried!
            s.crowdFever = Math.min(100, s.crowdFever + 20);
            setActionBanner('✨ PERFECT PARRY COUNTER!');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          } else {
            // Hit Player
            s.playerHp = Math.max(0, s.playerHp - 18);
            s.combo = 1;
            setPlayerHp(s.playerHp);
            setCombo(1);
            setActionBanner('⚠️ BOSS STRIKE HIT!');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

            if (s.playerHp <= 0 && !s.isGameOver) {
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_gladiator_colosseum',
                gameTitle: '복셀 검투사 콜로세움',
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
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      gesture.destroy();
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
    s.playerPos.set(0, 0, 4);
    s.targetVelocity.set(0, 0, 0);
    s.playerHp = 100;
    s.enemyHp = 200;
    s.crowdFever = 0;
    s.combo = 1;
    s.score = 0;
    s.timeLeft = 90;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setPlayerHp(100);
    setEnemyHp(200);
    setCrowdFever(0);
    setCombo(1);
    setScore(0);
    setTimeLeft(90);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 투기장 챔피언 결투' : 'STEP 1: ARENA CHAMPION DUEL',
      title: isKo ? '콜로세움 보스 격파' : 'Colosseum Boss Raid',
      description: isKo
        ? '3D 복셀 원형 투기장에서 거대 챔피언의 도끼 참격을 피하고 패링 가드로 반격하세요.'
        : 'Circle strafe around the giant champion in the 3D voxel arena and counter with parry guards.',
      keyPoints: isKo
        ? [
            '보스 HP: 200 / 플레이어 HP: 100',
            '피버 80% 달성 시 공격력 2.2배 증폭',
            '제한 시간 90초 내 보스 토벌'
          ]
        : [
            'Boss HP: 200 / Player HP: 100',
            '2.2x damage boost on 80%+ Fever',
            'Defeat the boss within 90 seconds'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 원터치 퓨어 제스처' : 'STEP 2: ONE-THUMB GESTURES',
      title: isKo ? '100% 제스처 무술 컨트롤' : 'Pure Gesture Melee Controls',
      description: isKo
        ? '가상 버튼 없이 드래그, 탭, 스와이프, 2x 탭 제스처로 모든 액션을 조작합니다.'
        : 'Zero on-screen buttons: control all melee moves with drag, tap, swipe and double-tap gestures.',
      keyPoints: isKo
        ? [
            '👆 드래그: 원형 투기장 이동',
            '⚔️ 탭: 3연속 검술 콤보',
            '🛡️ 스와이프: 0.33초 정밀 패링 가드',
            '🔄 2x 탭: 덱 영웅 태그 스위칭'
          ]
        : [
            '👆 Drag: Arena circle strafing',
            '⚔️ Tap: 3-hit weapon combo slashes',
            '🛡️ Swipe: 0.33s precision shield parry guard',
            '🔄 Double-Tap: Tag-switch deck heroes'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '승리 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Nightmare multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '피버 콤보 및 스피드 보너스 추가 합산',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Fever combo and speed bonuses added',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 검투사 콜로세움' : 'Voxel Gladiator Colosseum'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '보스' : 'Boss', value: `${enemyHp}/200`, color: 'text-rose-400' },
          { label: isKo ? '피버' : 'Fever', value: `${crowdFever}%`, color: crowdFever > 80 ? 'text-amber-300 animate-pulse' : 'text-orange-400' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: 'text-cyan-300' },
          { label: isKo ? '영웅' : 'Hero', value: currentHero.title || 'Hero', color: 'text-purple-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Action Notification Banner */}
      {actionBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/80 border border-amber-400 text-amber-300 px-4 py-1 rounded-full text-xs font-black tracking-wider shadow-lg z-30 pointer-events-none animate-bounce">
          {actionBanner}
        </div>
      )}

      {/* Bottom Gesture Guide */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
          <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
            {isKo
              ? '드래그: 이동 | 탭: 연속 검술 | 스와이프: 패링 가드 | 더블탭: 영웅 교체 (버튼 없음)'
              : 'Drag: Move | Tap: Slash Combo | Swipe: Parry Guard | Double Tap: Tag Switch (No Buttons)'}
          </div>
        </div>
      )}

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_gladiator_colosseum"
          gameTitle={isKo ? '3D 복셀 검투사 콜로세움: 영광의 투기장' : '3D Voxel Gladiator Colosseum: Arena of Glory'}
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

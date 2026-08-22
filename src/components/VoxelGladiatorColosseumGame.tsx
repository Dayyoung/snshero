import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { OneThumbMeleeGestureAdapter } from '../lib/oneThumbMeleeGestureAdapter';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
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
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0f0a);
    scene.fog = new THREE.FogExp2(0x1a0f0a, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffeedd, 0.7);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffa500, 1.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Colosseum Sand Arena
    const floorGeo = new THREE.CylinderGeometry(18, 18, 1, 32);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x8a6240 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    scene.add(floor);

    // Arena Pillars
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x5a4230 })
      );
      pillar.position.set(Math.cos(angle) * 16, 4, Math.sin(angle) * 16);
      scene.add(pillar);
    }

    // Player Gladiator Mesh
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 1.0),
      new THREE.MeshLambertMaterial({ color: 0x00f5d4 })
    );
    pBody.position.y = 0.9;
    playerGroup.add(pBody);

    const pSword = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.8, 0.4),
      new THREE.MeshLambertMaterial({ color: 0xffe600 })
    );
    pSword.position.set(0.9, 0.9, 0.5);
    playerGroup.add(pSword);

    const pShield = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.2, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x00bbf9 })
    );
    pShield.position.set(-0.9, 0.9, 0.3);
    playerGroup.add(pShield);

    playerGroup.position.set(0, 0, 4);
    scene.add(playerGroup);

    stateRef.current.playerGroup = playerGroup;
    stateRef.current.pSword = pSword;
    stateRef.current.pShield = pShield;

    // Enemy Gladiator Boss Mesh
    const enemyGroup = new THREE.Group();
    const eBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.6, 1.5),
      new THREE.MeshLambertMaterial({ color: 0xef233c })
    );
    eBody.position.y = 1.3;
    enemyGroup.add(eBody);

    const eAxe = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.4, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x2b2d42 })
    );
    eAxe.position.set(1.4, 1.5, 0.6);
    enemyGroup.add(eAxe);

    enemyGroup.position.set(0, 0, -3);
    scene.add(enemyGroup);

    stateRef.current.enemyGroup = enemyGroup;
    stateRef.current.eAxe = eAxe;

    // Set up Melee Pure Gesture Controller
    const meleeAdapter = new OneThumbMeleeGestureAdapter(container, {
      onMove: (normX, normZ) => {
        const s = stateRef.current;
        if (s.isGameOver || s.isPaused) return;
        s.targetVelocity.x = normX * 0.3;
        s.targetVelocity.z = normZ * 0.35;
      },
      onComboSlash: (comboIdx) => {
        const s = stateRef.current;
        if (s.isAttacking || s.isGameOver || s.isPaused) return;
        s.isAttacking = true;
        s.attackTime = 14;
        s.combo = Math.min(10, s.combo + 1);
        setCombo(s.combo);

        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

        // Check damage
        const isFever = s.crowdFever >= 100;
        const heroPower = (currentHero.power || 20);
        const dmg = heroPower * (isFever ? 2.5 : 1.2) * (1 + s.combo * 0.1);
        s.enemyHp = Math.max(0, s.enemyHp - Math.round(dmg));
        s.crowdFever = Math.min(100, s.crowdFever + 15);
        s.score += Math.round(dmg * 10);

        setEnemyHp(s.enemyHp);
        setCrowdFever(s.crowdFever);
        setScore(s.score);

        const combos = ['⚡ 1단 찌르기', '⚔️ 2단 횡베기', '💥 3단 점프 일격'];
        setActionBanner(`${combos[(comboIdx - 1) % 3]} (-${Math.round(dmg)} HP)`);
        setTimeout(() => setActionBanner(''), 800);

        if (s.enemyHp <= 0) {
          finishGame(true);
        }
      },
      onParryGuard: () => {
        // Swipe to Guard & Parry
        const s = stateRef.current;
        if (s.isGameOver || s.isPaused) return;
        s.isGuarding = true;
        s.parryWindow = 20; // 0.33s tight parry window
        setActionBanner(isKo ? '🛡️ 방패 패링 가드 전개!' : '🛡️ Shield Parry Deployed!');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        setTimeout(() => {
          s.isGuarding = false;
          setActionBanner('');
        }, 600);
      },
      onEvasiveDodge: () => {
        // Double tap: Tag Switch or Dodge Roll
        const s = stateRef.current;
        if (s.isGameOver || s.isPaused) return;
        if (heroCards.length > 1) {
          const nextIdx = (s.heroIdx + 1) % heroCards.length;
          s.heroIdx = nextIdx;
          setActiveHeroIdx(nextIdx);
          setActionBanner(isKo ? `🔄 영웅 태그: ${heroCards[nextIdx].title}` : `🔄 Tag Hero: ${heroCards[nextIdx].title}`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          setTimeout(() => setActionBanner(''), 900);
        } else {
          // Dodge backwards
          s.playerPos.z = Math.min(8, s.playerPos.z + 3);
          setActionBanner(isKo ? '💨 회피 스텝' : '💨 Evasive Step');
          setTimeout(() => setActionBanner(''), 700);
        }
      },
      onChargeStrike: () => {
        // Long Press: Colosseum Finishing Blow
        const s = stateRef.current;
        if (s.isGameOver || s.isPaused) return;
        const dmg = Math.round((currentHero.power || 20) * 3.5);
        s.enemyHp = Math.max(0, s.enemyHp - dmg);
        s.crowdFever = 100;
        s.score += dmg * 15;
        setEnemyHp(s.enemyHp);
        setCrowdFever(100);
        setScore(s.score);
        setActionBanner(isKo ? `🔥 콜로세움 필살 참격! (-${dmg} HP)` : `🔥 Colosseum Ultimate Strike! (-${dmg} HP)`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        setTimeout(() => setActionBanner(''), 1200);

        if (s.enemyHp <= 0) finishGame(true);
      }
    });

    const finishGame = (victory: boolean) => {
      const s = stateRef.current;
      if (s.isGameOver) return;
      s.isGameOver = true;
      setIsGameOver(true);

      const durationSeconds = Math.round((Date.now() - s.startTime) / 1000);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'voxel_gladiator_colosseum',
        gameTitle: isKo ? '3D 복셀 검투사 콜로세움: 영광의 투기장' : '3D Voxel Gladiator Colosseum: Arena of Glory',
        durationSeconds,
        score: s.score,
        maxTargetScore: 4000,
        isVictory: victory,
        difficulty: 'NIGHTMARE',
        comboCount: s.combo,
        perfectClear: s.playerHp >= 80
      });

      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    };

    // 1s timer countdown
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isGameOver || s.isPaused) return;
      s.timeLeft -= 1;
      setTimeLeft(s.timeLeft);
      if (s.timeLeft <= 0) finishGame(false);
    }, 1000);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;

      if (s.isGameOver || s.isPaused) {
        renderer.render(scene, camera);
        return;
      }

      if (s.parryWindow > 0) s.parryWindow -= 1;

      // Move player
      s.playerPos.x = Math.max(-10, Math.min(10, s.playerPos.x + s.targetVelocity.x));
      s.playerPos.z = Math.max(-1, Math.min(10, s.playerPos.z + s.targetVelocity.z));
      s.targetVelocity.multiplyScalar(0.9);
      playerGroup.position.copy(s.playerPos);

      // Attack Animation
      if (s.isAttacking && pSword) {
        s.attackTime -= 1;
        pSword.rotation.x = -Math.sin(((14 - s.attackTime) / 14) * Math.PI) * 1.6;
        if (s.attackTime <= 0) {
          s.isAttacking = false;
          pSword.rotation.x = 0;
        }
      }

      // Guard Pose
      if (pShield) {
        if (s.isGuarding) {
          pShield.position.set(0, 0.9, 0.9);
        } else {
          pShield.position.set(-0.9, 0.9, 0.3);
        }
      }

      // Boss AI Logic
      s.enemyAttackCooldown -= 1;
      if (s.enemyAttackCooldown <= 0 && eAxe) {
        s.enemyAttackCooldown = 70;
        eAxe.rotation.x = -1.3;
        setTimeout(() => { if (eAxe) eAxe.rotation.x = 0; }, 300);

        if (s.isGuarding) {
          if (s.parryWindow > 0) {
            // Perfect Parry Counter!
            s.crowdFever = 100;
            s.score += 300;
            setCrowdFever(100);
            setScore(s.score);
            setActionBanner(isKo ? '✨ 퍼펙트 패링 카운터! (FEVER 100%)' : '✨ PERFECT PARRY COUNTER! (FEVER 100%)');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            setTimeout(() => setActionBanner(''), 1000);
          } else {
            // Blocked Partial
            s.playerHp = Math.max(0, s.playerHp - 4);
            setPlayerHp(s.playerHp);
          }
        } else {
          // Direct Hit
          s.playerHp = Math.max(0, s.playerHp - 18);
          setPlayerHp(s.playerHp);
          if (s.playerHp <= 0) {
            finishGame(false);
          }
        }
      }

      camera.position.set(s.playerPos.x * 0.3, 6, s.playerPos.z + 9);
      camera.lookAt(0, 1.2, 0);

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
    setPlayerHp(100);
    setEnemyHp(200);
    setCrowdFever(0);
    setCombo(1);
    setScore(0);
    setTimeLeft(90);

    const s = stateRef.current;
    s.playerPos.set(0, 0, 4);
    s.playerHp = 100;
    s.enemyHp = 200;
    s.crowdFever = 0;
    s.combo = 1;
    s.score = 0;
    s.timeLeft = 90;
    s.isGameOver = false;
    s.startTime = Date.now();
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 투기장 결투 룰' : 'STEP 1: ARENA DUEL RULES',
      title: isKo ? '콜로세움 보스 격파' : 'Defeat Colosseum Boss',
      description: isKo
        ? '90초 제한시간 내에 적 검투사 보스의 200 HP를 모두 소진시키세요. 방패 패링을 성공하면 피버 100% 모드가 발동되어 2.5배 데미지를 입힙니다.'
        : 'Deplete the 200 HP of the boss gladiator within 90s. Time your shield parry to activate 100% FEVER mode for 2.5x damage.',
      keyPoints: isKo
        ? [
            '보스 처치 시 투기장 챔피언 등극 및 SNS 보상 지급',
            '보스 도끼 공격 순간 패링 시 즉시 피버 100% 충전',
            '플레이어 HP 소진 시 패배'
          ]
        : [
            'Defeat boss for Arena Championship & SNS reward',
            'Parry incoming axe attack for instant 100% FEVER',
            'Defeated if player HP reaches 0'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 100% 퓨어 제스처' : 'STEP 2: PURE GESTURE CONTROLS',
      title: isKo ? '원핸드 모바일 검투 액션' : 'One-Thumb Gladiator Actions',
      description: isKo
        ? '화면 어디서든 자유롭게 한 손 제스처로 이동, 콤보 참격, 방패 패링, 영웅 태그를 조작합니다.'
        : 'One-thumb gestures anywhere on screen to move, slash, parry, and tag-switch heroes.',
      keyPoints: isKo
        ? [
            '👆 드래그: 투기장 360도 자유 이동 및 보스 선회',
            '⚔️ 탭: 3단 연속 무기 참격 콤보',
            '🛡️ 스와이프: 0.33초 퍼펙트 패링 가드 전개',
            '🔄 2x 탭: 덱 영웅 태그 스위칭'
          ]
        : [
            '👆 Drag: 360-degree arena circle strafing',
            '⚔️ Tap: 3-hit weapon combo slashes',
            '🛡️ Swipe: 0.33s precision shield parry guard',
            '🔄 Double-Tap: Tag-switch deck heroes'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED SNS REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '승리 즉시 분당 50P 표준 기반 정산과 나이트메어 난이도 1.6x 배율이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard ~50P/min payout scaled with 1.6x Nightmare multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '피버 콤보 및 스피드 보너스 추가 합산',
            '실시간 hero_sns_updated 이벤트 브로드캐스트'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Fever combo and speed bonuses added',
            'Real-time hero_sns_updated event broadcast'
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
        gameTitle={isKo ? '복셀 검투사 콜로세움' : 'Voxel Gladiator Colosseum'}
        score={score}
        timeLeft={timeLeft}
        hp={playerHp}
        maxHp={100}
        combo={combo}
        customMetricLabel={isKo ? '보스 HP' : 'Boss HP'}
        customMetricValue={`${enemyHp}/200`}
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

      {/* Fever & Hero Tag Banner */}
      <div className="absolute top-14 left-4 flex flex-col gap-1 z-30 pointer-events-none">
        <div className="bg-amber-400 border border-[#201d1d] text-[#201d1d] px-2.5 py-0.5 rounded-sm text-xs font-black shadow-xs">
          <span>🔥 FEVER: {crowdFever}%</span>
        </div>
        <div className="bg-[#fdfcfc] border border-[#201d1d]/30 text-[#201d1d] px-2 py-0.5 rounded-sm text-[10px] font-bold shadow-xs">
          <span>HERO: {currentHero.title}</span>
        </div>
      </div>

      {/* Bottom Hint */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center z-20 pointer-events-none">
          <div className="bg-[#fdfcfc]/90 border border-[#201d1d]/30 px-3 py-1 text-[11px] font-bold text-[#201d1d] rounded-sm shadow-xs text-center max-w-sm">
            {isKo
              ? '👆 화면 드래그(이동) / 탭(공격) / 스와이프(패링 가드) / 2x탭(영웅교체)'
              : '👆 Drag (Move) / Tap (Attack) / Swipe (Parry Guard) / 2x Tap (Tag Switch)'}
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

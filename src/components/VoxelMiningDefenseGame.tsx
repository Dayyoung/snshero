import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMiningDefenseGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMiningDefenseGame: React.FC<VoxelMiningDefenseGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_mining_defense') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [coreHp, setCoreHp] = useState<number>(100);
  const [phase, setPhase] = useState<'day' | 'night'>('day');
  const [wave, setWave] = useState<number>(1);
  const maxWaves = 3;
  const [stoneCount, setStoneCount] = useState<number>(12);
  const [ironCount, setIronCount] = useState<number>(6);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    coreHp: 100,
    phase: 'day' as 'day' | 'night',
    wave: 1,
    stone: 12,
    iron: 6,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    turrets: [] as THREE.Mesh[],
    monsters: [] as { mesh: THREE.Mesh; hp: number; speed: number }[],
    scene: null as THREE.Scene | null
  });

  const handleBuildTurret = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || s.stone < 4 || !s.scene) return;

    s.stone -= 4;
    setStoneCount(s.stone);

    const tMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 })
    );
    const angle = Math.random() * Math.PI * 2;
    const dist = 3.5;
    tMesh.position.set(Math.sin(angle) * dist, 0.9, Math.cos(angle) * dist);
    s.scene.add(tMesh);
    s.turrets.push(tMesh);

    s.score += 200;
    setScore(s.score);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  const handleMine = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.stone += 3;
    s.iron += 1;
    s.score += 80;
    setStoneCount(s.stone);
    setIronCount(s.iron);
    setScore(s.score);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(12, 16, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 1.4);
    dirLight.position.set(15, 30, 20);
    scene.add(dirLight);

    // Grid Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36),
      new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Hero Core Target
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.4),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2 })
    );
    core.position.y = 1.4;
    scene.add(core);

    let animId: number;
    let lastTime = performance.now();
    let spawnTimer = 0;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      core.rotation.y += dt * 1.5;

      // Spawn creeps
      spawnTimer += dt;
      if (spawnTimer > 1.8 && s.monsters.length < 8) {
        spawnTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 14;
        const mMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.9, 0.9),
          new THREE.MeshStandardMaterial({ color: 0x991b1b })
        );
        mMesh.position.set(Math.sin(angle) * dist, 0.45, Math.cos(angle) * dist);
        scene.add(mMesh);

        s.monsters.push({
          mesh: mMesh,
          hp: 2,
          speed: 2.2
        });
      }

      // Turret auto attack
      s.turrets.forEach(t => {
        s.monsters.forEach(m => {
          if (t.position.distanceTo(m.mesh.position) < 8.0) {
            m.hp -= dt * 2.5;
          }
        });
      });

      // Monster movement
      for (let i = s.monsters.length - 1; i >= 0; i--) {
        const m = s.monsters[i];
        const dir = new THREE.Vector3(0, 0.45, 0).sub(m.mesh.position).normalize();
        m.mesh.position.addScaledVector(dir, m.speed * dt);

        if (m.hp <= 0) {
          scene.remove(m.mesh);
          s.monsters.splice(i, 1);
          s.score += 120;
          setScore(s.score);
          continue;
        }

        if (m.mesh.position.length() < 1.6) {
          // Attack Core
          s.coreHp = Math.max(0, s.coreHp - 8);
          setCoreHp(s.coreHp);
          scene.remove(m.mesh);
          s.monsters.splice(i, 1);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

          if (s.coreHp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_mining_defense',
              gameTitle: '복셀 마이닝 디펜스',
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

      // Victory Condition (Wave clear on high score)
      if (s.score >= 1200 && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_mining_defense',
          gameTitle: '복셀 마이닝 디펜스',
          durationSeconds: duration,
          score: s.score + 1800,
          difficulty: 'NIGHTMARE',
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
    s.monsters.forEach(m => s.scene?.remove(m.mesh));
    s.turrets.forEach(t => s.scene?.remove(t));
    s.monsters = [];
    s.turrets = [];
    s.coreHp = 100;
    s.stone = 12;
    s.iron = 6;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setCoreHp(100);
    setStoneCount(12);
    setIronCount(6);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 코어 수호 & 자원 채굴' : 'STEP 1: DEFEND & MINE',
      title: isKo ? '마이닝 & 포탑 요새 구축' : 'Mine & Fortify Core',
      description: isKo
        ? '화면 탭으로 광물을 채굴하고, 자원을 소모하여 자동 방어 포탑을 건설해 몬스터를 막아내세요.'
        : 'Tap screen to mine stone/iron resources and build automated turrets to defend the core.',
      keyPoints: isKo
        ? [
            '영웅 코어 HP: 100% 사수',
            '돌 4개 수집 시 방어 포탑 자동 건설',
            '스코어 1,200P 도달 시 디펜스 완승'
          ]
        : [
            'Protect Core HP at 100%',
            'Build Turret with 4 Stone',
            'Reach 1,200P to achieve victory'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '탭 채굴 & 더블탭 포탑 건설' : 'Tap Mine & Double-Tap Turret',
      description: isKo
        ? '가상 버튼 없이 탭으로 자원 채굴, 더블탭으로 포탑 건설을 100% 제스처로 수행합니다.'
        : 'Tap anywhere to mine ores, and double-tap to instantly deploy defense turrets with zero buttons.',
      keyPoints: isKo
        ? [
            '⛏️ 탭: 광물 자원 채굴 (+3 돌/+1 철)',
            '🛡️ 2x 탭: 방어 포탑 건설 (돌 4 소모)',
            '⚡ 포탑 자동 사거리 요격'
          ]
        : [
            '⛏️ Tap: Mine ores (+3 Stone/+1 Iron)',
            '🛡️ Double-Tap: Deploy Turret (Cost 4)',
            '⚡ Automated turret firing range'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '디펜스 완승 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '코어 잔여 체력 및 포탑 구축 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Core HP and turret construction bonus',
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
        title={isKo ? '복셀 마이닝 디펜스' : 'Voxel Mining Defense'}
        language={language}
        hp={{ current: coreHp, max: 100 }}
        telemetries={[
          { label: isKo ? '돌' : 'Stone', value: `${stoneCount}`, color: 'text-neutral-300' },
          { label: isKo ? '철' : 'Iron', value: `${ironCount}`, color: 'text-sky-300' },
          { label: isKo ? '포탑' : 'Turret', value: `${stateRef.current.turrets.length}`, color: 'text-amber-300' },
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

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.preventDefault();
            handleMine();
          }}
          onDoubleClick={handleBuildTurret}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 탭: 광물 채굴 | 더블탭: 방어 포탑 건설 (돌 4소모, 버튼 없음)' : 'Tap: Mine Ores | Double Tap: Build Turret (Cost 4 Stone, No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_mining_defense"
          gameTitle={isKo ? '3D 복셀 마이닝 디펜스: 코어 결계 수호' : 'Voxel Mining Defense: Core Guard'}
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

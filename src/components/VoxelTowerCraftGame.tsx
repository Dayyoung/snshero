import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTowerCraftGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Tower {
  mesh: THREE.Group;
  gx: number;
  gz: number;
  type: 'flame' | 'ice' | 'tesla';
  range: number;
  damage: number;
  cooldown: number;
  timer: number;
}

interface EnemyMob {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  alive: boolean;
  pathIndex: number;
}

export const VoxelTowerCraftGame: React.FC<VoxelTowerCraftGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_tower_craft') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [coreHp, setCoreHp] = useState<number>(100);
  const [energy, setEnergy] = useState<number>(150);
  const [wave, setWave] = useState<number>(1);
  const maxWave = 3;
  const [selectedType, setSelectedType] = useState<'flame' | 'ice' | 'tesla'>('flame');
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    coreHp: 100,
    energy: 150,
    wave: 1,
    score: 0,
    selectedType: 'flame' as 'flame' | 'ice' | 'tesla',
    gridSize: 10,
    grid: Array(10).fill(null).map(() => Array(10).fill(0)),
    towers: [] as Tower[],
    enemies: [] as EnemyMob[],
    projectiles: [] as { mesh: THREE.Mesh; vx: number; vz: number; damage: number }[],
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const towerCosts = { flame: 40, ice: 50, tesla: 70 };

  const buildTower = (gx: number, gz: number) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;
    if (gx < 0 || gx >= s.gridSize || gz < 0 || gz >= s.gridSize) return;
    if (s.grid[gx][gz] !== 0) return;

    const cost = towerCosts[s.selectedType];
    if (s.energy < cost) return;

    s.energy -= cost;
    setEnergy(s.energy);
    s.grid[gx][gz] = 1;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const tGroup = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.2, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    base.position.y = 0.6;
    tGroup.add(base);

    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 1.0, 8),
      new THREE.MeshStandardMaterial({
        color: s.selectedType === 'flame' ? 0xf97316 : s.selectedType === 'ice' ? 0x06b6d4 : 0xa855f7
      })
    );
    turret.position.y = 1.6;
    tGroup.add(turret);

    const posX = (gx - s.gridSize / 2 + 0.5) * 2.2;
    const posZ = (gz - s.gridSize / 2 + 0.5) * 2.2;
    tGroup.position.set(posX, 0, posZ);
    s.scene.add(tGroup);

    s.towers.push({
      mesh: tGroup,
      gx,
      gz,
      type: s.selectedType,
      range: 8.0,
      damage: s.selectedType === 'flame' ? 25 : s.selectedType === 'ice' ? 15 : 45,
      cooldown: s.selectedType === 'flame' ? 0.6 : s.selectedType === 'ice' ? 1.0 : 1.2,
      timer: 0
    });
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
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(15, 30, 15);
    scene.add(dirLight);

    // Arena Grid Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(24, 10, 0x38bdf8, 0x334155);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // Spawn Initial Wave Enemies
    const spawnWave = (w: number) => {
      stateRef.current.enemies = [];
      const count = 4 + w * 3;
      for (let i = 0; i < count; i++) {
        const mob = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        mob.position.set(-10, 0.8, -10 - i * 4);
        scene.add(mob);

        stateRef.current.enemies.push({
          mesh: mob,
          x: -10,
          z: -10 - i * 4,
          hp: 40 + w * 20,
          maxHp: 40 + w * 20,
          speed: 4.5,
          alive: true,
          pathIndex: 0
        });
      }
    };
    spawnWave(1);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Update Towers Firing
      s.towers.forEach(t => {
        t.timer += dt;
        if (t.timer >= t.cooldown) {
          const target = s.enemies.find(e => e.alive && t.mesh.position.distanceTo(e.mesh.position) <= t.range);
          if (target) {
            t.timer = 0;
            target.hp -= t.damage;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (target.hp <= 0) {
              target.alive = false;
              scene.remove(target.mesh);
              s.energy += 25;
              s.score += 100;
              setEnergy(s.energy);
              setScore(s.score);
            }
          }
        }
      });

      // Update Enemies Movement along Path
      let aliveCount = 0;
      s.enemies.forEach(e => {
        if (!e.alive) return;
        aliveCount++;

        // Path waypoint movement towards Core (10, 0, 10)
        const targetPos = new THREE.Vector3(10, 0.8, 10);
        const dir = new THREE.Vector3().subVectors(targetPos, e.mesh.position).normalize();
        e.mesh.position.addScaledVector(dir, e.speed * dt);

        if (e.mesh.position.distanceTo(targetPos) < 2.0) {
          e.alive = false;
          scene.remove(e.mesh);
          s.coreHp = Math.max(0, s.coreHp - 20);
          setCoreHp(s.coreHp);

          if (s.coreHp <= 0 && !s.isGameOver) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_tower_craft',
              gameTitle: '복셀 타워 크래프트',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'HARD',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }
      });

      // Wave Progression Check
      if (aliveCount === 0 && !s.isGameOver) {
        if (s.wave < maxWave) {
          s.wave += 1;
          setWave(s.wave);
          spawnWave(s.wave);
        } else {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_tower_craft',
            gameTitle: '복셀 타워 크래프트',
            durationSeconds: duration,
            score: s.score + 2500,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
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
    s.coreHp = 100;
    s.energy = 150;
    s.wave = 1;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.towers.forEach(t => s.scene?.remove(t.mesh));
    s.towers = [];
    s.grid = Array(10).fill(null).map(() => Array(10).fill(0));
    setCoreHp(100);
    setEnergy(150);
    setWave(1);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 코어 크리스탈 방어' : 'STEP 1: CORE DEFENSE',
      title: isKo ? '3웨이브 몬스터 침공 전원 격퇴' : 'Defeat 3 Monster Waves',
      description: isKo
        ? '그리드 바닥에 방어 타워를 전략적으로 건설하여 코어 크리스탈을 몬스터로부터 수호하세요.'
        : 'Construct defense towers strategically across the grid to protect your core crystal.',
      keyPoints: isKo
        ? [
            '3웨이브 몬스터 전멸 시 승리',
            '에너지 자원 관리 및 타워 증설',
            '코어 HP 0% 도달 방어'
          ]
        : [
            'Clear 3 waves to win',
            'Manage energy for tower builds',
            'Prevent core HP dropping to 0%'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '바닥 탭 건설 & 스와이프 타워 교체' : 'Tap Build & Swipe Tower Type',
      description: isKo
        ? '가상 버튼 없이 그리드 바닥을 탭하여 타워를 즉시 배치하고, 화면을 스와이프해 타워 종류를 전환합니다.'
        : 'Tap any grid tile to build towers and swipe to switch tower types with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 타일 탭: 선택된 방어 타워 즉시 건설',
            '↔️ 좌우 스와이프: 화염 / 냉각 / 테슬라 순환',
            '⚡ 몬스터 처치 시 에너지 즉시 환급'
          ]
        : [
            '👆 Tap Tile: Build defense tower instantly',
            '↔️ Swipe L/R: Cycle Flame / Ice / Tesla',
            '⚡ Enemy kills refund energy'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '수호 승리 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 코어 HP 및 클리어 웨이브 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Core HP and clear wave bonuses',
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
        title={isKo ? '복셀 타워 크래프트' : 'Voxel Tower Craft'}
        language={language}
        hp={{ current: coreHp, max: 100 }}
        telemetries={[
          { label: isKo ? '웨이브' : 'Wave', value: `${wave}/${maxWave}`, color: 'text-purple-400 font-bold' },
          { label: isKo ? '에너지' : 'Energy', value: `${energy}⚡`, color: 'text-amber-300' },
          { label: isKo ? '타입' : 'Tower', value: selectedType.toUpperCase(), color: selectedType === 'flame' ? 'text-orange-400 font-bold' : selectedType === 'ice' ? 'text-cyan-400 font-bold' : 'text-purple-400 font-bold' }
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
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const dx = curX - startX;

              if (Math.abs(dx) > 30) {
                moved = true;
                const types: ('flame' | 'ice' | 'tesla')[] = ['flame', 'ice', 'tesla'];
                const nextIdx = (types.indexOf(stateRef.current.selectedType) + (dx > 0 ? 1 : 2)) % 3;
                stateRef.current.selectedType = types[nextIdx];
                setSelectedType(types[nextIdx]);
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Calculate Tile Coordinate & Build
                const normX = (startX / rect.width - 0.5) * 2;
                const normY = (startY / rect.height - 0.5) * 2;
                const gx = Math.floor((normX * 12 + 12) / 2.4);
                const gz = Math.floor((normY * 12 + 12) / 2.4);
                buildTower(gx, gz);
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
        <div className="px-3 py-1 bg-black/75 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono backdrop-blur-xs">
          {isKo ? '바닥 탭: 타워 건설 | 좌우 스와이프: 타워 타입 교체 (버튼 없음)' : 'Tap Tile: Build Tower | Swipe L/R: Switch Tower Type (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_tower_craft"
          gameTitle={isKo ? '3D 복셀 타워 크래프트: 코어 디펜스' : 'Voxel Tower Craft: Core Defense'}
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
export default VoxelTowerCraftGame;

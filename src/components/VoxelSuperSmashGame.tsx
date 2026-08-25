import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSuperSmashGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSuperSmashGame: React.FC<VoxelSuperSmashGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_super_smash') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerDamage, setPlayerDamage] = useState<number>(0);
  const [stocks, setStocks] = useState<number>(3);
  const [aliveEnemies, setAliveEnemies] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    posX: 0,
    posY: 1,
    posZ: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    steerX: 0,
    damage: 0,
    stocks: 3,
    aliveEnemies: 3,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    playerMesh: null as THREE.Group | null,
    opponents: [] as {
      group: THREE.Group;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      damage: number;
      alive: boolean;
    }[],
    scene: null as THREE.Scene | null
  });

  const performSmashAttack = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    s.opponents.forEach(op => {
      if (!op.alive) return;
      const dist = Math.hypot(op.x - s.posX, op.z - s.posZ);
      if (dist < 4.5) {
        op.damage += 25;
        const knockback = (op.damage / 40) * 16;
        const angle = Math.atan2(op.x - s.posX, op.z - s.posZ);
        op.vx += Math.sin(angle) * knockback;
        op.vy += knockback * 0.8;
        op.vz += Math.cos(angle) * knockback;

        s.score += 150;
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    });
  };

  const jump = () => {
    const s = gameStateRef.current;
    if (s.posY > 1.4 || s.isGameOver || s.isVictory || s.isPaused) return;
    s.vy = 16;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0933);
    gameStateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 15, 24);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffeedd, 0.9);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(10, 30, 20);
    scene.add(dirLight);

    // Floating Arena Platform
    const arena = new THREE.Mesh(
      new THREE.BoxGeometry(20, 2, 14),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
    );
    arena.position.y = -1.0;
    scene.add(arena);

    // Player Voxel Avatar
    const pGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    pBody.position.y = 0.9;
    pGroup.add(pBody);
    pGroup.position.set(0, 1, 0);
    scene.add(pGroup);
    gameStateRef.current.playerMesh = pGroup;

    // Spawn 3 Opponents
    gameStateRef.current.opponents = [];
    for (let i = 0; i < 3; i++) {
      const opGroup = new THREE.Group();
      const opBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      opBody.position.y = 0.9;
      opGroup.add(opBody);

      const ox = (i - 1) * 6;
      opGroup.position.set(ox, 1, -2);
      scene.add(opGroup);

      gameStateRef.current.opponents.push({
        group: opGroup,
        x: ox,
        y: 1,
        z: -2,
        vx: 0,
        vy: 0,
        vz: 0,
        damage: 0,
        alive: true
      });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Player Movement & Jump Physics
      s.posX += s.steerX * 12 * dt;
      s.vy -= 32 * dt;
      s.posY += s.vy * dt;

      if (s.posY <= 1.0 && Math.abs(s.posX) <= 10 && Math.abs(s.posZ) <= 7) {
        s.posY = 1.0;
        s.vy = 0;
      }

      if (pGroup) {
        pGroup.position.set(s.posX, s.posY, s.posZ);
      }

      // Opponents Physics & Knockout
      s.opponents.forEach(op => {
        if (!op.alive) return;

        op.vy -= 32 * dt;
        op.x += op.vx * dt;
        op.y += op.vy * dt;
        op.z += op.vz * dt;

        op.vx *= 0.95;
        op.vz *= 0.95;

        if (op.y <= 1.0 && Math.abs(op.x) <= 10 && Math.abs(op.z) <= 7) {
          op.y = 1.0;
          op.vy = 0;
        }

        op.group.position.set(op.x, op.y, op.z);

        // Check Ring-out Knockout
        if (Math.abs(op.x) > 16 || Math.abs(op.z) > 14 || op.y < -15) {
          op.alive = false;
          scene.remove(op.group);
          s.aliveEnemies -= 1;
          s.score += 500;
          setAliveEnemies(s.aliveEnemies);
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.aliveEnemies <= 0 && !s.isGameOver) {
            s.isVictory = true;
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_super_smash',
              gameTitle: '복셀 슈퍼 스매시',
              durationSeconds: duration,
              score: s.score + 2500,
              difficulty: 'NIGHTMARE',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }
      });

      // Player Fall Check
      if (s.posY < -15 && !s.isGameOver) {
        s.stocks -= 1;
        setStocks(s.stocks);
        if (s.stocks > 0) {
          s.posX = 0;
          s.posY = 6;
          s.vy = 0;
          s.damage = 0;
          setPlayerDamage(0);
        } else {
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_super_smash',
            gameTitle: '복셀 슈퍼 스매시',
            durationSeconds: duration,
            score: s.score,
            difficulty: 'NIGHTMARE',
            isVictory: false
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
    const s = gameStateRef.current;
    s.posX = 0;
    s.posY = 1;
    s.posZ = 0;
    s.damage = 0;
    s.stocks = 3;
    s.aliveEnemies = 3;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.opponents.forEach((op, i) => {
      op.alive = true;
      op.x = (i - 1) * 6;
      op.y = 1;
      op.z = -2;
      op.vx = 0;
      op.vy = 0;
      op.vz = 0;
      op.damage = 0;
      op.group.position.set(op.x, op.y, op.z);
      s.scene?.add(op.group);
    });
    setPlayerDamage(0);
    setStocks(3);
    setAliveEnemies(3);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 장외 넉아웃 대난투' : 'STEP 1: SMASH BATTLE',
      title: isKo ? '라이벌 3명 전원 장외 격퇴' : 'Knock Out 3 Rivals',
      description: isKo
        ? '공중 부유 플랫폼에서 라이벌들에게 데미지를 누적시키고 장외로 강타 넉아웃시키세요.'
        : 'Stack damage on rival heroes and smash them off the floating arena platform.',
      keyPoints: isKo
        ? [
            '적 3명 전원 장외 넉아웃 시 즉시 승리',
            '누적 데미지가 높을수록 장외 넉백 증가',
            '잔여 목숨 3개 내에 완료'
          ]
        : [
            'Knock out 3 rivals to win',
            'Higher % damage yields huge knockback',
            'Clear within 3 stock lives'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 이동 & 탭 스매시 타격' : 'Drag Move & Tap Smash',
      description: isKo
        ? '가상 버튼 없이 좌우 드래그로 이동하고, 탭하여 스매시 강타, 위로 스와이프로 2단 점프합니다.'
        : 'Drag left/right to move, tap to smash strike, and swipe up to double jump with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 플랫폼 이동',
            '💥 탭: 전방 스매시 강타 어택',
            '⬆️ 위로 스와이프 / 더블탭: 공중 2단 점프'
          ]
        : [
            '👆 Drag L/R: Move along platform',
            '💥 Tap: Smash strike attack',
            '⬆️ Swipe Up / Double Tap: Air jump'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '대난투 제패 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 목숨 및 넉아웃 콤보 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining stocks and combo bonuses',
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
        title={isKo ? '복셀 슈퍼 스매시' : 'Voxel Super Smash'}
        language={language}
        telemetries={[
          { label: isKo ? '목숨' : 'Stocks', value: `❤️x${stocks}`, color: stocks <= 1 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
          { label: isKo ? '생존' : 'Rivals', value: `${aliveEnemies}명`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-yellow-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          gameStateRef.current.isPaused = !isPaused;
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
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 8) {
                moved = true;
                gameStateRef.current.steerX = THREE.MathUtils.clamp(dx * 0.02, -1, 1);
              }
              if (dy < -20) {
                moved = true;
                jump();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              gameStateRef.current.steerX = 0;

              if (!moved) {
                // Tap: Smash Strike
                performSmashAttack();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={jump}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 이동 | 탭: 스매시 공격 | 위로/더블탭: 점프 (버튼 없음)' : 'Drag L/R: Move | Tap: Smash Strike | Up/Double Tap: Jump (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_super_smash"
          gameTitle={isKo ? '3D 복셀 슈퍼 스매시: 플랫폼 대난투' : 'Voxel Super Smash: Arena Brawl'}
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
export default VoxelSuperSmashGame;

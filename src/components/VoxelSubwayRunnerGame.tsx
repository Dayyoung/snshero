import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSubwayRunnerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ObstacleItem {
  mesh: THREE.Group;
  lane: number;
  z: number;
  type: 'train' | 'barrier' | 'coin';
  collected?: boolean;
}

export const VoxelSubwayRunnerGame: React.FC<VoxelSubwayRunnerGameProps> = ({
  deck: _deck,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_subway_runner') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [coins, setCoins] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const targetDistance = 1000;
  const [hasHoverboard, setHasHoverboard] = useState<boolean>(false);
  const [hoverboardTime, setHoverboardTime] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const lanes = [-3.5, 0, 3.5];

  const stateRef = useRef({
    laneIdx: 1,
    playerX: 0,
    playerY: 0.6,
    playerZ: 0,
    isJumping: false,
    jumpVel: 0,
    isSliding: false,
    slideTimer: 0,
    hasHoverboard: false,
    hoverboardTimer: 0,
    speed: 35,
    distance: 0,
    coins: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    obstacles: [] as ObstacleItem[],
    playerMesh: null as THREE.Group | null,
    scene: null as THREE.Scene | null
  });

  const changeLane = (dir: number) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.laneIdx = Math.max(0, Math.min(2, s.laneIdx + dir));
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const jump = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isJumping || s.isPaused) return;
    s.isJumping = true;
    s.jumpVel = 14;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const slide = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.isSliding = true;
    s.slideTimer = 0.6;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const activateHoverboard = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.hasHoverboard || s.isPaused) return;
    s.hasHoverboard = true;
    s.hoverboardTimer = 8.0;
    setHasHoverboard(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 30, 100);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, 4.5, 8);
    camera.lookAt(0, 1.2, -15);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // 3 Subway Track Lines
    const trackGeo = new THREE.PlaneGeometry(12, 1200);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, -500);
    scene.add(track);

    // Player Model
    const pGroup = new THREE.Group();
    const pBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
    );
    pBody.position.y = 0.75;
    pGroup.add(pBody);
    pGroup.position.set(0, 0, 0);
    scene.add(pGroup);
    stateRef.current.playerMesh = pGroup;

    // Generate Obstacles & Coins
    stateRef.current.obstacles = [];
    for (let i = 1; i <= 40; i++) {
      const oz = -i * 28;
      const oLane = Math.floor(Math.random() * 3);
      const isCoin = i % 3 === 0;

      const group = new THREE.Group();
      if (isCoin) {
        const coin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 })
        );
        coin.rotation.z = Math.PI / 2;
        coin.position.y = 1.0;
        group.add(coin);
      } else {
        const train = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 2.2, 6.0),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
        );
        train.position.y = 1.1;
        group.add(train);
      }

      group.position.set(lanes[oLane], 0, oz);
      scene.add(group);

      stateRef.current.obstacles.push({
        mesh: group,
        lane: oLane,
        z: oz,
        type: isCoin ? 'coin' : 'train',
        collected: false
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

      // Hoverboard timer
      if (s.hasHoverboard) {
        s.hoverboardTimer -= dt;
        setHoverboardTime(Math.ceil(s.hoverboardTimer));
        if (s.hoverboardTimer <= 0) {
          s.hasHoverboard = false;
          setHasHoverboard(false);
        }
      }

      // Forward movement
      s.playerZ -= s.speed * dt;
      s.distance = Math.min(targetDistance, Math.round(-s.playerZ));
      setDistance(s.distance);
      s.score = s.distance + s.coins * 50;
      setScore(s.score);

      // Lane Smooth movement
      const targetX = lanes[s.laneIdx];
      s.playerX += (targetX - s.playerX) * 12 * dt;

      // Jump & Slide Physics
      if (s.isJumping) {
        s.jumpVel -= 35 * dt;
        s.playerY += s.jumpVel * dt;
        if (s.playerY <= 0) {
          s.playerY = 0;
          s.isJumping = false;
        }
      }

      if (s.isSliding) {
        s.slideTimer -= dt;
        if (s.slideTimer <= 0) {
          s.isSliding = false;
        }
      }

      if (pGroup) {
        pGroup.position.set(s.playerX, s.playerY, s.playerZ);
        pGroup.scale.set(1.0, s.isSliding ? 0.5 : 1.0, 1.0);
      }

      // Collision Check
      s.obstacles.forEach(o => {
        if (!o.collected && Math.abs(s.playerZ - o.z) < 2.0 && s.laneIdx === o.lane) {
          if (o.type === 'coin') {
            o.collected = true;
            scene.remove(o.mesh);
            s.coins += 1;
            setCoins(s.coins);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          } else if (o.type === 'train') {
            if (s.hasHoverboard) {
              // Shield break
              s.hasHoverboard = false;
              setHasHoverboard(false);
              o.collected = true;
              scene.remove(o.mesh);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            } else if (!s.isGameOver && s.playerY < 1.8) {
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_subway_runner',
                gameTitle: '복셀 지하철 러너',
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

      // Camera follow
      camera.position.set(s.playerX * 0.4, 4.5, s.playerZ + 8);
      camera.lookAt(s.playerX * 0.4, 1.2, s.playerZ - 15);

      // Finish Check
      if (s.distance >= targetDistance && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_subway_runner',
          gameTitle: '복셀 지하철 러너',
          durationSeconds: duration,
          score: s.score + 2500,
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
    s.laneIdx = 1;
    s.playerX = 0;
    s.playerY = 0;
    s.playerZ = 0;
    s.isJumping = false;
    s.isSliding = false;
    s.hasHoverboard = false;
    s.coins = 0;
    s.distance = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.obstacles.forEach(o => {
      o.collected = false;
      s.scene?.add(o.mesh);
    });
    setCoins(0);
    setDistance(0);
    setScore(0);
    setHasHoverboard(false);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 서브웨이 1,000m 완주' : 'STEP 1: SUBWAY RUSH',
      title: isKo ? '기차 장애물 회피 & 코인 수집' : 'Dodge Trains & Collect Coins',
      description: isKo
        ? '3개 레일 위를 질주하며 진입하는 열차를 피하고 코인을 수집하여 1,000m 완주를 달성하세요.'
        : 'Dash across 3 subway rails, dodge trains and collect coins to reach 1,000m.',
      keyPoints: isKo
        ? [
            '1,000m 도달 시 즉시 승리',
            '코인 획득 시 추가 보너스 점수',
            '충돌 시 호버보드로 1회 무적 방어'
          ]
        : [
            'Reach 1,000m to win',
            'Collect coins for extra score',
            'Hoverboard provides 1-hit invulnerability'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '스와이프 레인 이동 & 점프/슬라이딩' : 'Swipe Lanes & Jump/Slide',
      description: isKo
        ? '가상 버튼 없이 좌우 스와이프로 차선 변경, 위/탭으로 점프, 아래로 슬라이딩합니다.'
        : 'Swipe left/right for lanes, swipe up/tap to jump, and swipe down to slide with zero buttons.',
      keyPoints: isKo
        ? [
            '↔️ 좌우 스와이프: 3개 차선 신속 전환',
            '⬆️ 위로 스와이프 / 탭: 장애물 점프 도약',
            '⬇️ 아래로 스와이프: 바닥 슬라이딩 회피'
          ]
        : [
            '↔️ Swipe Left/Right: Fast lane switch',
            '⬆️ Swipe Up / Tap: Jump obstacles',
            '⬇️ Swipe Down: Low slide dodge'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '질주 완주 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '수집 코인 및 질주 거리 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Coins and sprint distance bonuses',
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
        title={isKo ? '복셀 지하철 러너' : 'Voxel Subway Runner'}
        language={language}
        telemetries={[
          { label: isKo ? '거리' : 'Dist', value: `${distance}m/${targetDistance}m`, color: 'text-cyan-300' },
          { label: isKo ? '코인' : 'Coins', value: `${coins}개`, color: 'text-amber-300' },
          { label: isKo ? '보드' : 'Board', value: hasHoverboard ? `${hoverboardTime}s` : 'READY', color: hasHoverboard ? 'text-emerald-400 font-bold' : 'text-slate-400' }
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
            const startX = e.clientX;
            const startY = e.clientY;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const dx = moveEvt.clientX - startX;
              const dy = moveEvt.clientY - startY;

              if (Math.abs(dx) > 20) {
                moved = true;
                changeLane(dx > 0 ? 1 : -1);
                window.removeEventListener('pointermove', onMove);
              } else if (dy < -20) {
                moved = true;
                jump();
                window.removeEventListener('pointermove', onMove);
              } else if (dy > 20) {
                moved = true;
                slide();
                window.removeEventListener('pointermove', onMove);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Jump
                jump();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={activateHoverboard}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 스와이프: 차선변경 | 탭/위로: 점프 | 아래: 슬라이딩 | 더블탭: 호버보드 (버튼 없음)' : 'Swipe L/R: Lane | Tap/Up: Jump | Down: Slide | Double Tap: Hoverboard (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_subway_runner"
          gameTitle={isKo ? '3D 복셀 지하철 러너: 서브웨이 대탈출' : 'Voxel Subway Runner: Rail Rush'}
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
export default VoxelSubwayRunnerGame;

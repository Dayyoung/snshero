import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTerraQuakeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface TileBlock {
  mesh: THREE.Mesh;
  gridX: number;
  gridZ: number;
  height: number;
  isFalling: boolean;
  hasGem: boolean;
  gemMesh?: THREE.Mesh;
}

export const VoxelTerraQuakeGame: React.FC<VoxelTerraQuakeGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_terra_quake') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [gemsMined, setGemsMined] = useState<number>(0);
  const [survivalTime, setSurvivalTime] = useState<number>(0);
  const targetTime = 45;
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    playerX: 0,
    playerZ: 0,
    moveDir: new THREE.Vector2(0, 0),
    score: 0,
    gemsMined: 0,
    survivalTime: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    playerMesh: null as THREE.Group | null,
    tiles: [] as TileBlock[],
    scene: null as THREE.Scene | null
  });

  const performStomp = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Shatter adjacent gems and stabilize ground
    s.tiles.forEach(t => {
      const dist = Math.hypot(t.mesh.position.x - s.playerX, t.mesh.position.z - s.playerZ);
      if (dist < 3.5 && t.hasGem && t.gemMesh) {
        t.hasGem = false;
        s.scene?.remove(t.gemMesh);
        s.gemsMined += 1;
        s.score += 200;
        setGemsMined(s.gemsMined);
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1712);
    scene.fog = new THREE.FogExp2(0x0f1712, 0.025);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 16, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x84cc16, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa3e635, 1.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Build 7x7 Grid of Floating Terra Tiles
    const gridSize = 7;
    const tileSize = 2.0;
    const tileGeo = new THREE.BoxGeometry(tileSize * 0.9, 1.0, tileSize * 0.9);
    const tileMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.8 });
    const gemGeo = new THREE.OctahedronGeometry(0.4);
    const gemMat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.8 });

    const tiles: TileBlock[] = [];
    const offset = (gridSize - 1) * tileSize * 0.5;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const mesh = new THREE.Mesh(tileGeo, tileMat);
        const posX = x * tileSize - offset;
        const posZ = z * tileSize - offset;
        mesh.position.set(posX, 0, posZ);
        scene.add(mesh);

        const hasGem = Math.random() < 0.3;
        let gemMesh: THREE.Mesh | undefined;

        if (hasGem) {
          gemMesh = new THREE.Mesh(gemGeo, gemMat);
          gemMesh.position.set(posX, 0.9, posZ);
          scene.add(gemMesh);
        }

        tiles.push({
          mesh,
          gridX: x,
          gridZ: z,
          height: 0,
          isFalling: false,
          hasGem,
          gemMesh
        });
      }
    }
    stateRef.current.tiles = tiles;

    // Player Model
    const pGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x84cc16 }));
    pBody.position.y = 0.8;
    pGroup.add(pBody);
    pGroup.position.set(0, 0.5, 0);
    scene.add(pGroup);
    stateRef.current.playerMesh = pGroup;

    // Timer
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.survivalTime += 1;
      setSurvivalTime(s.survivalTime);
      s.score += 20;
      setScore(s.score);

      // Randomly collapse 1 tile every 3 seconds
      if (s.survivalTime % 3 === 0) {
        const unfallen = s.tiles.filter(t => !t.isFalling);
        if (unfallen.length > 0) {
          const victim = unfallen[Math.floor(Math.random() * unfallen.length)];
          victim.isFalling = true;
        }
      }

      if (s.survivalTime >= targetTime && !s.isGameOver) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_terra_quake',
          gameTitle: '복셀 테라 퀘이크',
          durationSeconds: duration,
          score: s.score + 2000,
          difficulty: 'HARD',
          isVictory: true
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
      const speed = 10;
      s.playerX += s.moveDir.x * speed * dt;
      s.playerZ += s.moveDir.y * speed * dt;
      s.playerX = THREE.MathUtils.clamp(s.playerX, -6, 6);
      s.playerZ = THREE.MathUtils.clamp(s.playerZ, -6, 6);

      if (pGroup) {
        pGroup.position.set(s.playerX, 0.5, s.playerZ);
      }

      // Tile Quake & Collapse Physics
      s.tiles.forEach(t => {
        if (t.isFalling) {
          t.mesh.position.y -= 12 * dt;
          if (t.gemMesh) t.gemMesh.position.y -= 12 * dt;

          // Check if player stands on falling tile
          if (Math.abs(s.playerX - t.mesh.position.x) < 0.9 && Math.abs(s.playerZ - t.mesh.position.z) < 0.9) {
            if (!s.isGameOver) {
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_terra_quake',
                gameTitle: '복셀 테라 퀘이크',
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
    s.playerX = 0;
    s.playerZ = 0;
    s.score = 0;
    s.gemsMined = 0;
    s.survivalTime = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.tiles.forEach(t => {
      t.isFalling = false;
      t.mesh.position.y = 0;
      if (t.gemMesh) {
        t.gemMesh.position.y = 0.9;
        t.hasGem = true;
        s.scene?.add(t.gemMesh);
      }
    });
    setScore(0);
    setGemsMined(0);
    setSurvivalTime(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 지반 붕괴 서바이벌' : 'STEP 1: TERRA SURVIVAL',
      title: isKo ? '45초 생존 & 대지 보석 채굴' : 'Survive 45s & Mine Gems',
      description: isKo
        ? '무너져 내리는 7x7 테라 지반 위에서 살아남고 보석을 채굴하여 45초 동안 생존하세요.'
        : 'Survive across collapsing 7x7 terra tiles and mine gems for 45s.',
      keyPoints: isKo
        ? [
            '45초 생존 성공 시 즉시 승리',
            '붕괴되는 타일 위에서 신속 대피',
            '보석 채굴 시 +200P 가산점'
          ]
        : [
            'Survive 45s to win',
            'Evacuate collapsing tiles immediately',
            '+200P for each gem mined'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 이동 & 탭 어스 스톰프' : 'Drag Move & Tap Stomp',
      description: isKo
        ? '가상 D-Pad 없이 화면 드래그로 안전한 지반을 찾아 이동하고, 탭하여 어스 스톰프로 보석을 채굴합니다.'
        : 'Drag anywhere to move across tiles and tap to terra stomp and mine gems with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 안전한 지반 360° 이동',
            '💥 탭: 어스 스톰프 광역 보석 채굴',
            '⚡ 붕괴 직전 지반 탈출 타이밍'
          ]
        : [
            '👆 Drag: Smooth 360° tile move',
            '💥 Tap: Terra stomp area mining',
            '⚡ Evacuate before tile plunges'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '서바이벌 성공 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '채굴 보석 및 생존 시간 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Gems and survival duration bonuses',
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
        title={isKo ? '복셀 테라 퀘이크' : 'Voxel Terra Quake'}
        language={language}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${survivalTime}s/${targetTime}s`, color: survivalTime >= targetTime ? 'text-emerald-400 font-bold' : 'text-lime-300' },
          { label: isKo ? '보석' : 'Gems', value: `${gemsMined}개`, color: 'text-amber-300' },
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
                // Tap: Terra Stomp
                performStomp();
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
        <div className="px-3 py-1 bg-black/75 border border-lime-500/30 rounded-full text-[10px] text-lime-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 지반 이동 | 탭: 어스 스톰프 채굴 (버튼 없음)' : 'Drag: Move on Tiles | Tap: Terra Stomp (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_terra_quake"
          gameTitle={isKo ? '3D 복셀 테라 퀘이크: 지반 붕괴 서바이벌' : 'Voxel Terra Quake: Ground Collapse'}
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
export default VoxelTerraQuakeGame;

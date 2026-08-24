import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMedievalSiegeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Boulder {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  alive: boolean;
}

interface CastleBlock {
  mesh: THREE.Mesh;
  alive: boolean;
}

export const VoxelMedievalSiegeGame: React.FC<VoxelMedievalSiegeGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_medieval_siege') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [angle, setAngle] = useState<number>(45);
  const [power, setPower] = useState<number>(75);
  const [shotsLeft, setShotsLeft] = useState<number>(8);
  const [castleHp, setCastleHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    angle: 45,
    power: 75,
    shotsLeft: 8,
    castleHp: 100,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    boulders: [] as Boulder[],
    castleBlocks: [] as CastleBlock[],
    armMesh: null as THREE.Mesh | null,
    scene: null as THREE.Scene | null
  });

  const launchBoulder = () => {
    const s = stateRef.current;
    if (s.shotsLeft <= 0 || s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    s.shotsLeft -= 1;
    setShotsLeft(s.shotsLeft);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const rad = (s.angle * Math.PI) / 180;
    const vTotal = (s.power / 100) * 35;
    const vx = 0;
    const vy = Math.sin(rad) * vTotal;
    const vz = -Math.cos(rad) * vTotal;

    const bGeo = new THREE.DodecahedronGeometry(0.8);
    const bMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3, emissive: 0xe11d48 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(0, 3, 22);
    s.scene.add(bMesh);

    s.boulders.push({
      mesh: bMesh,
      vx,
      vy,
      vz,
      alive: true
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 300);
    camera.position.set(-25, 20, 45);
    camera.lookAt(0, 8, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    const sun = new THREE.DirectionalLight(0xfffaed, 1.6);
    sun.position.set(30, 60, 40);
    sun.castShadow = !lowSpecMode;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x607d8b, 0.9));

    // Green Grass Terrain
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3f6212 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Trebuchet
    const trebuchetGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 8), new THREE.MeshLambertMaterial({ color: 0x5c3a21 }));
    frame.position.y = 0.5;
    trebuchetGroup.add(frame);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 10), new THREE.MeshLambertMaterial({ color: 0x854d0e }));
    arm.position.set(0, 3, 0);
    trebuchetGroup.add(arm);
    stateRef.current.armMesh = arm;

    trebuchetGroup.position.set(0, 0, 24);
    scene.add(trebuchetGroup);

    // Castle Wall Target (5x4 blocks)
    stateRef.current.castleBlocks = [];
    const blockGeo = new THREE.BoxGeometry(2.4, 1.8, 1.8);
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });

    for (let r = 0; r < 4; r++) {
      for (let c = -2; c <= 2; c++) {
        const b = new THREE.Mesh(blockGeo, blockMat);
        b.position.set(c * 2.6, 0.9 + r * 1.9, -15);
        scene.add(b);
        stateRef.current.castleBlocks.push({ mesh: b, alive: true });
      }
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Update Boulders
      for (let i = s.boulders.length - 1; i >= 0; i--) {
        const b = s.boulders[i];
        if (!b.alive) continue;

        b.vy -= 9.8 * 2.2 * dt;
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.y += b.vy * dt;
        b.mesh.position.z += b.vz * dt;

        // Ground hit
        if (b.mesh.position.y <= 0.4) {
          b.alive = false;
          scene.remove(b.mesh);
          s.boulders.splice(i, 1);
          continue;
        }

        // Castle hit
        for (const cb of s.castleBlocks) {
          if (cb.alive) {
            const dist = b.mesh.position.distanceTo(cb.mesh.position);
            if (dist < 2.0) {
              cb.alive = false;
              cb.mesh.position.y = -10;
              b.alive = false;
              scene.remove(b.mesh);
              s.boulders.splice(i, 1);

              s.score += 250;
              setScore(s.score);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

              const aliveCount = s.castleBlocks.filter(blk => blk.alive).length;
              s.castleHp = Math.round((aliveCount / s.castleBlocks.length) * 100);
              setCastleHp(s.castleHp);

              if (s.castleHp <= 0 && !s.isGameOver) {
                s.isVictory = true;
                s.isGameOver = true;
                setIsGameOver(true);
                const duration = (Date.now() - s.startTime) / 1000;
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'voxel_medieval_siege',
                  gameTitle: '복셀 중세 공성전',
                  durationSeconds: duration,
                  score: s.score + 2000,
                  difficulty: 'NIGHTMARE',
                  isVictory: true
                });
                setSettlementReceipt(receipt);
                onReward(receipt.totalSns);
              }
              break;
            }
          }
        }
      }

      // Check failure on 0 shots
      if (s.shotsLeft <= 0 && s.boulders.length === 0 && s.castleHp > 0 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_medieval_siege',
          gameTitle: '복셀 중세 공성전',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'NIGHTMARE',
          isVictory: false
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
    s.boulders.forEach(b => s.scene?.remove(b.mesh));
    s.boulders = [];
    s.castleBlocks.forEach((cb, idx) => {
      cb.alive = true;
      const r = Math.floor(idx / 5);
      const c = (idx % 5) - 2;
      cb.mesh.position.set(c * 2.6, 0.9 + r * 1.9, -15);
    });
    s.shotsLeft = 8;
    s.castleHp = 100;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setShotsLeft(8);
    setCastleHp(100);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 공성 투석 파괴' : 'STEP 1: SIEGE ARTILLERY',
      title: isKo ? '성벽 요새 완파 격파' : 'Demolish Castle Walls',
      description: isKo
        ? '거대 투석기의 각도와 장력을 조절하여 제한된 화염탄으로 철벽의 성벽을 완전히 파괴하세요.'
        : 'Adjust trebuchet launch angle and power to completely demolish the fortified castle wall.',
      keyPoints: isKo
        ? [
            '성벽 내구도: 100% ➔ 0% 격파',
            '화염탄 잔여 8발 내에 요새 완파',
            '벽돌 직격 시 폭발 파편 보너스'
          ]
        : [
            'Demolish wall HP from 100% to 0%',
            'Clear the fortress within 8 fire boulders',
            'Explosive shatter bonus on direct hits'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조준' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 각도/장력 & 탭 발사' : 'Drag Aim & Tap Fire',
      description: isKo
        ? '슬라이더 없이 화면 좌우 드래그로 각도, 상하 드래그로 장력을 조절하고 탭하여 발사합니다.'
        : 'Drag horizontally for angle, vertically for tension, and tap anywhere to fire with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 발사 각도 미세 조준',
            '🏹 상하 드래그: 투석 장력 파워 조절',
            '💥 탭: 대포화염탄 즉시 발사'
          ]
        : [
            '👆 Drag L/R: Fine-tune trajectory angle',
            '🏹 Drag U/D: Adjust catapult power',
            '💥 Tap: Release fire boulder instantly'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '성벽 함락 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Nightmare multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 화염탄 및 속전속결 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining boulders and speed bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#87ceeb] flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 중세 공성전' : 'Voxel Medieval Siege'}
        language={language}
        hp={{ current: castleHp, max: 100 }}
        telemetries={[
          { label: isKo ? '성벽' : 'Wall', value: `${castleHp}%`, color: castleHp < 30 ? 'text-rose-400 font-black animate-pulse' : 'text-amber-300' },
          { label: isKo ? '탄약' : 'Shots', value: `${shotsLeft}발`, color: shotsLeft <= 2 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
          { label: isKo ? '각도' : 'Angle', value: `${angle}°`, color: 'text-emerald-300' },
          { label: isKo ? '장력' : 'Power', value: `${power}%`, color: 'text-purple-300' }
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

              if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
                moved = true;
                const newAngle = THREE.MathUtils.clamp(stateRef.current.angle + dx * 0.05, 20, 75);
                const newPower = THREE.MathUtils.clamp(stateRef.current.power - dy * 0.1, 40, 100);
                stateRef.current.angle = Math.round(newAngle);
                stateRef.current.power = Math.round(newPower);
                setAngle(Math.round(newAngle));
                setPower(Math.round(newPower));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Launch Boulder
                launchBoulder();
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
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 각도 | 상하: 장력 파워 | 탭: 투석기 화염탄 발사 (버튼 없음)' : 'Drag L/R: Angle | Drag U/D: Power | Tap: Fire Boulder (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_medieval_siege"
          gameTitle={isKo ? '3D 복셀 중세 공성전: 성벽 요새 완파' : 'Voxel Medieval Siege: Castle Demolition'}
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
export default VoxelMedievalSiegeGame;

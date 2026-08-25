import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelSniperHunterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SniperTarget {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  type: 'target' | 'gas_can';
  alive: boolean;
}

export const VoxelSniperHunterGame: React.FC<VoxelSniperHunterGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_sniper_hunter') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [eliminatedCount, setEliminatedCount] = useState<number>(0);
  const totalTargets = 4;
  const [breathMeter, setBreathMeter] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [lastShotText, setLastShotText] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    aimX: 0,
    aimY: 0,
    sway: 0,
    isHoldingBreath: false,
    breath: 100,
    score: 0,
    eliminated: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    targets: [] as SniperTarget[],
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const handleShoot = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.camera) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), s.camera);

    let hit = false;
    for (const t of s.targets) {
      if (!t.alive) continue;
      const intersects = raycaster.intersectObjects(t.mesh.children, true);
      if (intersects.length > 0) {
        hit = true;
        t.alive = false;
        t.mesh.visible = false;

        if (t.type === 'gas_can') {
          s.score += 80;
          s.eliminated += 1;
          setLastShotText(isKo ? '💥 환경 트랩 폭발 암살! (+80P)' : '💥 Trap Explosion! (+80P)');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        } else {
          const isHead = intersects[0].point.y > t.pos.y + 1.1;
          const pts = isHead ? 60 : 35;
          s.score += pts;
          s.eliminated += 1;
          setLastShotText(isHead ? (isKo ? '🎯 시네마틱 헤드샷! (+60P)' : '🎯 Cinematic Headshot! (+60P)') : (isKo ? '🎯 표적 저격 완료 (+35P)' : '🎯 Target Down (+35P)'));
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        }

        setEliminatedCount(s.eliminated);
        setScore(s.score);

        if (s.eliminated >= totalTargets && !s.isGameOver) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_sniper_hunter',
            gameTitle: '복셀 스나이퍼 헌터',
            durationSeconds: duration,
            score: s.score + 2500,
            difficulty: 'NIGHTMARE',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
        break;
      }
    }

    if (!hit) {
      setLastShotText(isKo ? '빗나감 (Miss)' : 'Miss');
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }

    setTimeout(() => setLastShotText(null), 1200);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.Fog(0x020617, 30, 100);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 200);
    camera.position.set(0, 4, 15);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    moonLight.position.set(20, 30, -10);
    scene.add(moonLight);

    // Compound Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Spawn 4 Targets
    stateRef.current.targets = [];
    const targetConfigs = [
      { x: -6, y: 1.0, z: -25, type: 'target' as const },
      { x: 5, y: 1.0, z: -30, type: 'target' as const },
      { x: -10, y: 2.2, z: -35, type: 'target' as const },
      { x: 8, y: 0.6, z: -20, type: 'gas_can' as const }
    ];

    targetConfigs.forEach((cfg) => {
      const group = new THREE.Group();
      if (cfg.type === 'gas_can') {
        const can = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        can.position.y = 0.6;
        group.add(can);
      } else {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.4, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xd97706 })
        );
        body.position.y = 0.7;
        group.add(body);

        const head = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.5, 0.5),
          new THREE.MeshStandardMaterial({ color: 0xfef08a })
        );
        head.position.y = 1.6;
        group.add(head);
      }

      group.position.set(cfg.x, cfg.y, cfg.z);
      scene.add(group);

      stateRef.current.targets.push({
        mesh: group,
        pos: new THREE.Vector3(cfg.x, cfg.y, cfg.z),
        type: cfg.type,
        alive: true
      });
    });

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Breath Meter physics
      if (s.isHoldingBreath) {
        s.breath = Math.max(0, s.breath - 30 * dt);
        s.sway = 0.05;
      } else {
        s.breath = Math.min(100, s.breath + 40 * dt);
        s.sway = Math.sin(now * 0.003) * 0.2;
      }
      setBreathMeter(Math.round(s.breath));

      camera.rotation.order = 'YXZ';
      camera.rotation.y = s.aimX;
      camera.rotation.x = s.aimY + s.sway * 0.02;

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
    s.aimX = 0;
    s.aimY = 0;
    s.score = 0;
    s.eliminated = 0;
    s.breath = 100;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.targets.forEach(t => {
      t.alive = true;
      t.mesh.visible = true;
    });
    setEliminatedCount(0);
    setScore(0);
    setBreathMeter(100);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 원거리 암살 작전' : 'STEP 1: SNIPER MISSION',
      title: isKo ? '표적 4개 전원 저격 완승' : 'Eliminate 4 Targets',
      description: isKo
        ? '8배율 고배율 스코프로 전방 표적과 환경 폭발 트랩을 저격하여 4개를 무력화하세요.'
        : 'Use 8x sniper scope to eliminate 4 targets including explosive gas cans.',
      keyPoints: isKo
        ? [
            '표적 4개 제거 시 즉시 완승',
            '헤드샷 직격 시 +60P 가산점',
            '가스통 저격 시 광역 폭발 +80P'
          ]
        : [
            'Eliminate 4 targets to win',
            '+60P for precision headshots',
            '+80P for environmental gas explosions'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 조준 & 화면 홀드 숨참기' : 'Drag Aim & Hold Breath',
      description: isKo
        ? '가상 버튼 없이 화면 드래그로 조준, 화면을 길게 눌러 숨참기 흔들림 제어, 탭으로 격발합니다.'
        : 'Drag to aim, hold screen to hold breath for zero sway, and tap to fire with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 스코프 정밀 조준',
            '🫁 화면 홀드: 숨참기 (조준 흔들림 0% 고정)',
            '💥 탭: 시네마틱 저격 격발'
          ]
        : [
            '👆 Drag: Fine scope aiming',
            '🫁 Hold: Hold breath (Zero sway)',
            '💥 Tap: Fire sniper bullet'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '저격 완수 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '헤드샷 명중률 및 암살 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Headshot and trap bonuses',
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
        title={isKo ? '복셀 스나이퍼 헌터' : 'Voxel Sniper Hunter'}
        language={language}
        telemetries={[
          { label: isKo ? '제거' : 'Targets', value: `${eliminatedCount}/${totalTargets}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '호흡' : 'Breath', value: `${breathMeter}%`, color: breathMeter <= 20 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
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

      {/* Sniper Scope Vignette & Reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-72 h-72 rounded-full border-2 border-red-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] flex items-center justify-center">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <div className="absolute w-full h-[1px] bg-red-500/60" />
          <div className="absolute h-full w-[1px] bg-red-500/60" />
          <div className="absolute top-4 text-[10px] text-red-400 font-bold">8X SCOPE ZOOM</div>
        </div>
      </div>

      {/* Shot Result Banner */}
      {lastShotText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/90 px-4 py-1.5 rounded-sm border border-red-500 text-red-400 font-bold text-xs z-30 animate-bounce">
          {lastShotText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-20 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            let moved = false;
            stateRef.current.isHoldingBreath = true;

            const onMove = (moveEvt: PointerEvent) => {
              const dx = moveEvt.clientX - startX;
              const dy = moveEvt.clientY - startY;

              if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                moved = true;
                stateRef.current.aimX = THREE.MathUtils.clamp(stateRef.current.aimX - dx * 0.001, -0.6, 0.6);
                stateRef.current.aimY = THREE.MathUtils.clamp(stateRef.current.aimY - dy * 0.001, -0.3, 0.3);
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.isHoldingBreath = false;

              if (!moved) {
                // Tap: Shoot
                handleShoot();
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
        <div className="px-3 py-1 bg-black/75 border border-red-500/30 rounded-full text-[10px] text-red-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 조준 | 화면 홀드: 숨참기 (흔들림 0%) | 탭: 저격 사격 (버튼 없음)' : 'Drag: Aim | Hold: Breath Hold | Tap: Fire (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_sniper_hunter"
          gameTitle={isKo ? '3D 복셀 스나이퍼 헌터: 원거리 암살' : 'Voxel Sniper Hunter: Covert Ops'}
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
export default VoxelSniperHunterGame;

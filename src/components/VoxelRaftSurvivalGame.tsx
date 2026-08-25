import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelRaftSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelRaftSurvivalGame: React.FC<VoxelRaftSurvivalGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_raft_survival') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [planks, setPlanks] = useState<number>(0);
  const [raftSize, setRaftSize] = useState<number>(4);
  const targetRaftSize = 10;
  const [sharkHp, setSharkHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    planks: 0,
    raftSize: 4,
    sharkHp: 100,
    score: 0,
    isHookFlying: false,
    hookPos: new THREE.Vector3(),
    hookVelocity: new THREE.Vector3(),
    hookMesh: null as THREE.Mesh | null,
    debrisList: [] as { mesh: THREE.Mesh; x: number; z: number; collected: boolean }[],
    shark: null as THREE.Group | null,
    sharkAngle: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null
  });

  const throwHook = () => {
    const s = stateRef.current;
    if (s.isHookFlying || s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;
    s.isHookFlying = true;
    s.hookPos.set(0, 1.2, 0);
    s.hookVelocity.set((Math.random() - 0.5) * 8, 5, -28);

    if (s.hookMesh) {
      s.hookMesh.position.copy(s.hookPos);
      s.hookMesh.visible = true;
    }
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const expandRaft = () => {
    const s = stateRef.current;
    if (s.planks < 4 || s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    s.planks -= 4;
    s.raftSize += 1;
    s.score += 250;
    setPlanks(s.planks);
    setRaftSize(s.raftSize);
    setScore(s.score);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const plankGeo = new THREE.BoxGeometry(2, 0.4, 2);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
    s.scene.add(plank);

    if (s.raftSize >= targetRaftSize && !s.isGameOver) {
      s.isVictory = true;
      s.isGameOver = true;
      setIsGameOver(true);
      const duration = (Date.now() - s.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'voxel_raft_survival',
        gameTitle: '복셀 뗏목 서바이벌',
        durationSeconds: duration,
        score: s.score + 2000,
        difficulty: 'HARD',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2266aa);
    scene.fog = new THREE.FogExp2(0x2266aa, 0.015);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffeedd, 0.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Initial Raft Platform
    const baseRaft = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.4, 4),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
    );
    baseRaft.position.y = 0;
    scene.add(baseRaft);

    // Hook Mesh
    const hMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    hMesh.visible = false;
    scene.add(hMesh);
    stateRef.current.hookMesh = hMesh;

    // Spawn Floating Debris
    stateRef.current.debrisList = [];
    for (let i = 0; i < 15; i++) {
      const dMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.3, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xd97706 })
      );
      const dx = (Math.random() - 0.5) * 30;
      const dz = -10 - Math.random() * 25;
      dMesh.position.set(dx, 0.1, dz);
      scene.add(dMesh);

      stateRef.current.debrisList.push({
        mesh: dMesh,
        x: dx,
        z: dz,
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

      // Hook physics
      if (s.isHookFlying && hMesh) {
        s.hookVelocity.y -= 9.8 * dt;
        s.hookPos.addScaledVector(s.hookVelocity, dt);
        hMesh.position.copy(s.hookPos);

        // Check Debris Hook
        s.debrisList.forEach(d => {
          if (!d.collected && s.hookPos.distanceTo(d.mesh.position) < 2.0) {
            d.collected = true;
            scene.remove(d.mesh);
            s.planks += 2;
            s.score += 80;
            setPlanks(s.planks);
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
        });

        if (s.hookPos.y <= 0) {
          s.isHookFlying = false;
          hMesh.visible = false;
        }
      }

      // Debris drift
      s.debrisList.forEach(d => {
        if (!d.collected) {
          d.mesh.position.z += dt * 2.0;
          if (d.mesh.position.z > 12) {
            d.mesh.position.z = -35;
            d.mesh.position.x = (Math.random() - 0.5) * 30;
          }
        }
      });

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
    s.planks = 0;
    s.raftSize = 4;
    s.score = 0;
    s.isHookFlying = false;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.debrisList.forEach(d => {
      d.collected = false;
      s.scene?.add(d.mesh);
    });
    setPlanks(0);
    setRaftSize(4);
    setScore(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 뗏목 해상 요새화' : 'STEP 1: RAFT FORTIFICATION',
      title: isKo ? '부유 목재 인양 & 뗏목 10칸 확장' : 'Salvage Planks & Build 10 Raft',
      description: isKo
        ? '망망대해에 표류하는 목재에 갈고리를 던져 수집하고, 뗏목을 10칸 규모로 확장하세요.'
        : 'Cast hooks to salvage drifting planks and expand your ocean raft to 10 scale.',
      keyPoints: isKo
        ? [
            '뗏목 규모 10칸 달성 시 즉시 승리',
            '갈고리 적중 시 목재 +2개 획득',
            '목재 4개당 뗏목 1칸 확장'
          ]
        : [
            'Reach Raft size 10 to win',
            '+2 Planks on debris hook hit',
            '4 Planks to expand 1 raft unit'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '탭 갈고리 투척 & 더블탭 뗏목 확장' : 'Tap Hook & Double-Tap Build',
      description: isKo
        ? '가상 버튼 없이 화면 탭으로 갈고리를 던지고, 더블탭으로 즉시 뗏목을 확장합니다.'
        : 'Tap screen to launch hook, and double-tap to expand raft with zero buttons.',
      keyPoints: isKo
        ? [
            '🎣 화면 탭: 원거리 갈고리 투척',
            '🪵 더블탭: 뗏목 확장 빌드 (목재 4개 소모)',
            '⚡ 연속 수집 시 피버 인양'
          ]
        : [
            '🎣 Tap: Launch long-range hook',
            '🪵 Double-Tap: Expand raft (Cost 4)',
            '⚡ Rapid salvage multiplier'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '요새화 성공 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '최종 뗏목 규모 및 스피드 완공 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Raft scale and build speed bonuses',
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
        title={isKo ? '복셀 뗏목 서바이벌' : 'Voxel Raft Survival'}
        language={language}
        telemetries={[
          { label: isKo ? '뗏목' : 'Raft', value: `${raftSize}/${targetRaftSize}`, color: raftSize >= targetRaftSize ? 'text-emerald-400 font-bold animate-pulse' : 'text-amber-300' },
          { label: isKo ? '목재' : 'Planks', value: `${planks}개`, color: planks >= 4 ? 'text-cyan-300 font-bold' : 'text-slate-300' },
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
            e.preventDefault();
            throwHook();
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            if (planks >= 4) expandRaft();
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 탭: 갈고리 투척 | 더블탭: 뗏목 확장 (목재 4소모, 버튼 없음)' : 'Tap: Throw Hook | Double Tap: Expand Raft (Cost 4 Planks, No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_raft_survival"
          gameTitle={isKo ? '3D 복셀 뗏목 서바이벌: 대해원 표류' : 'Voxel Raft Survival: Ocean Fort'}
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

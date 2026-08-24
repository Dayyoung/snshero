import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelKarateBreakGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const TARGET_TIERS = [
  { nameKo: '삼나무 송판 (10단)', nameEn: 'Cedar Wood (x10)', color: 0xb45309, reqPower: 45, maxBlocks: 10, points: 150 },
  { nameKo: '붉은 점토 벽돌 (10단)', nameEn: 'Clay Bricks (x10)', color: 0xb91c1c, reqPower: 60, maxBlocks: 10, points: 250 },
  { nameKo: '단단한 화강암석 (10단)', nameEn: 'Granite (x10)', color: 0x64748b, reqPower: 75, maxBlocks: 10, points: 400 },
  { nameKo: '강철 모루 블록 (10단)', nameEn: 'Iron Anvil (x10)', color: 0x334155, reqPower: 88, maxBlocks: 10, points: 650 },
  { nameKo: '흑요석 크리스탈 (10단)', nameEn: 'Obsidian (x10)', color: 0x581c87, reqPower: 95, maxBlocks: 10, points: 1000 }
];

export const VoxelKarateBreakGame: React.FC<VoxelKarateBreakGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_karate_break') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTierIdx, setCurrentTierIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [gaugeVal, setGaugeVal] = useState<number>(0);
  const [isStriking, setIsStriking] = useState<boolean>(false);
  const [breakResultText, setBreakResultText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    tierIdx: 0,
    gauge: 0,
    gaugeSpeed: 2.2,
    gaugeDir: 1,
    isFocusActive: false,
    focusTime: 0,
    isStriking: false,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    blocks: [] as THREE.Mesh[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3 }[],
    karateMasterGroup: null as THREE.Group | null,
    armMesh: null as THREE.Mesh | null,
    scene: null as THREE.Scene | null
  });

  const currTier = TARGET_TIERS[currentTierIdx] || TARGET_TIERS[0];

  const handleKiFocus = () => {
    const s = stateRef.current;
    if (s.isStriking || s.isGameOver || s.isVictory || s.isPaused) return;
    s.isFocusActive = true;
    s.focusTime = 1.2;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleStrike = () => {
    const s = stateRef.current;
    if (s.isStriking || s.isGameOver || s.isVictory || s.isPaused) return;

    s.isStriking = true;
    setIsStriking(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const power = s.gauge;
    const tier = TARGET_TIERS[s.tierIdx];

    setTimeout(() => {
      if (power >= tier.reqPower) {
        // Break Success!
        const breakRatio = Math.min(1.0, power / 100);
        const count = Math.round(breakRatio * tier.maxBlocks);
        const gained = Math.round(tier.points * (count / tier.maxBlocks) * 1.5);
        s.score += gained;
        setScore(s.score);
        setBreakResultText(`💥 ${count}단 완전 격파 성공! (+${gained}P)`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        // Shatter animation
        s.blocks.forEach((b, idx) => {
          if (idx < count) {
            b.position.y = -10;
          }
        });

        if (s.tierIdx >= TARGET_TIERS.length - 1) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_karate_break',
            gameTitle: '복셀 무도 정권 격파',
            durationSeconds: duration,
            score: s.score + 1500,
            difficulty: 'NIGHTMARE',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        } else {
          setTimeout(() => {
            s.tierIdx += 1;
            setCurrentTierIdx(s.tierIdx);
            s.isStriking = false;
            setIsStriking(false);
            setBreakResultText('');
            s.gauge = 0;
            // Respawn next tier blocks
            respawnBlocks(s.tierIdx);
          }, 1400);
        }
      } else {
        // Break Failed!
        setBreakResultText('❌ 기력 부족! 격파 실패');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setTimeout(() => {
          s.isStriking = false;
          setIsStriking(false);
          setBreakResultText('');
        }, 1200);
      }
    }, 200);
  };

  const respawnBlocks = (tierIndex: number) => {
    const s = stateRef.current;
    if (!s.scene) return;
    s.blocks.forEach(b => s.scene?.remove(b));
    s.blocks = [];

    const tier = TARGET_TIERS[tierIndex];
    const bGeo = new THREE.BoxGeometry(1.0, 0.08, 0.6);
    const bMat = new THREE.MeshStandardMaterial({ color: tier.color, roughness: 0.5 });

    for (let i = 0; i < 10; i++) {
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(0, 0.84 + i * 0.09, 0);
      s.scene.add(bMesh);
      s.blocks.push(bMesh);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1917);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 5.5);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x441a03, 0.9);
    scene.add(hemiLight);

    const spot = new THREE.SpotLight(0xffedd5, 2.5);
    spot.position.set(0, 8, 4);
    scene.add(spot);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    // Wooden Stand Pedestal
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x451a03 })
    );
    stand.position.set(0, 0.4, 0);
    scene.add(stand);

    // Karate Master
    const masterGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    body.position.y = 0.7;
    masterGroup.add(body);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.65), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    belt.position.set(0, 0.6, 0);
    masterGroup.add(belt);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    arm.position.set(0.5, 1.2, 0.4);
    masterGroup.add(arm);
    stateRef.current.armMesh = arm;

    masterGroup.position.set(0, 0, 1.4);
    scene.add(masterGroup);
    stateRef.current.karateMasterGroup = masterGroup;

    // Initial blocks
    respawnBlocks(0);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Ki Power Gauge Oscillation
      if (!s.isStriking) {
        let speed = s.gaugeSpeed * (s.isFocusActive ? 0.35 : 1.0);
        s.gauge += s.gaugeDir * speed * 60 * dt;

        if (s.gauge >= 100) {
          s.gauge = 100;
          s.gaugeDir = -1;
        } else if (s.gauge <= 0) {
          s.gauge = 0;
          s.gaugeDir = 1;
        }
        setGaugeVal(Math.round(s.gauge));

        if (s.isFocusActive) {
          s.focusTime -= dt;
          if (s.focusTime <= 0) s.isFocusActive = false;
        }
      }

      // Arm animation
      if (s.armMesh) {
        if (s.isStriking) {
          s.armMesh.rotation.x = -Math.PI / 2;
        } else {
          s.armMesh.rotation.x = Math.sin(now * 0.005) * 0.2;
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
    s.tierIdx = 0;
    s.gauge = 0;
    s.score = 0;
    s.isStriking = false;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setCurrentTierIdx(0);
    setScore(0);
    setGaugeVal(0);
    setIsStriking(false);
    setBreakResultText('');
    setIsGameOver(false);
    setSettlementReceipt(null);
    respawnBlocks(0);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 무도 정권 격파' : 'Voxel Karate Break'}
        language={language}
        telemetries={[
          { label: isKo ? '단계' : 'Tier', value: `${currentTierIdx + 1}/5 (${isKo ? currTier.nameKo : currTier.nameEn})`, color: 'text-amber-300' },
          { label: isKo ? '기력' : 'Ki', value: `${gaugeVal}%`, color: gaugeVal >= currTier.reqPower ? 'text-emerald-400 font-black animate-pulse' : 'text-orange-300' },
          { label: isKo ? '요구' : 'Req', value: `${currTier.reqPower}%+`, color: 'text-cyan-300' },
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

      {/* Break Result Banner */}
      {breakResultText && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/85 border border-amber-400 text-amber-300 px-4 py-1 rounded-full text-xs font-black tracking-wider shadow-lg z-30 pointer-events-none animate-bounce">
          {breakResultText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const startY = e.clientY - rect.top;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curY = moveEvt.clientY - rect.top;
              if (Math.abs(curY - startY) > 20) {
                moved = true;
                handleKiFocus();
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Strike Chop!
                handleStrike();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={handleKiFocus}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 탭: 정권 격파 (CHOP!) | 드래그/더블탭: 단전호흡 기력집중 (버튼 없음)' : 'Tap: Strike Chop! | Drag/Double Tap: Ki Focus Slow (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_karate_break"
          gameTitle={isKo ? '3D 복셀 무도 정권 격파: 5단계 송판/벽돌 격파' : 'Voxel Karate Break: 5-Tier Board Breaking'}
          sportType="martial"
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

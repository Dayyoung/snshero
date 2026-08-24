import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelKrakenHunterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelKrakenHunterGame: React.FC<VoxelKrakenHunterGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_kraken_hunter') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [fishCaught, setFishCaught] = useState<number>(0);
  const targetMonsters = 2;
  const [lineTension, setLineTension] = useState<number>(30);
  const [monsterHp, setMonsterHp] = useState<number>(100);
  const [monsterDistance, setMonsterDistance] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    lineTension: 30,
    monsterHp: 100,
    monsterDist: 45,
    isReeling: false,
    shipAngle: 0,
    score: 0,
    fishCaught: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    shipGroup: null as THREE.Group | null,
    monsterGroup: null as THREE.Group | null
  });

  const handleHarpoonStrike = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;

    s.monsterHp = Math.max(0, s.monsterHp - 25);
    s.score += 250;
    setMonsterHp(s.monsterHp);
    setScore(s.score);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    if (s.monsterHp <= 0) {
      s.fishCaught += 1;
      setFishCaught(s.fishCaught);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      if (s.fishCaught >= targetMonsters) {
        s.isVictory = true;
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_kraken_hunter',
          gameTitle: '복셀 크라켄 헌터',
          durationSeconds: duration,
          score: s.score + 1500,
          difficulty: 'NIGHTMARE',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      } else {
        s.monsterHp = 100;
        s.monsterDist = 45;
        setMonsterHp(100);
        setMonsterDistance(45);
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.Fog(0x030712, 20, 80);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 5, -8);
    camera.lookAt(0, 1.5, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x0284c7, 0.6);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    moonLight.position.set(-10, 30, -20);
    scene.add(moonLight);

    // Ocean Water
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.1, metalness: 0.7 })
    );
    ocean.rotation.x = -Math.PI / 2;
    scene.add(ocean);

    // Fishing Ship (Player)
    const shipGroup = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1.2, 7),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    hull.position.y = 0.6;
    shipGroup.add(hull);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 2.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cabin.position.set(0, 1.9, -1.2);
    shipGroup.add(cabin);

    shipGroup.position.set(0, 0, 0);
    scene.add(shipGroup);
    stateRef.current.shipGroup = shipGroup;

    // Giant Kraken Sea Monster
    const monsterGroup = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0x881337 }));
    head.position.y = 1.5;
    monsterGroup.add(head);

    for (let t = 0; t < 6; t++) {
      const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 6, 8), new THREE.MeshStandardMaterial({ color: 0x9f1239 }));
      const angle = (t / 6) * Math.PI * 2;
      tentacle.position.set(Math.sin(angle) * 3, 1, Math.cos(angle) * 3);
      monsterGroup.add(tentacle);
    }

    monsterGroup.position.set(0, 0, 45);
    scene.add(monsterGroup);
    stateRef.current.monsterGroup = monsterGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Reeling Logic
      if (s.isReeling) {
        s.monsterDist = Math.max(10, s.monsterDist - dt * 8);
        s.lineTension = Math.min(100, s.lineTension + dt * 35);
      } else {
        s.monsterDist = Math.min(50, s.monsterDist + dt * 3);
        s.lineTension = Math.max(15, s.lineTension - dt * 25);
      }

      setMonsterDistance(Math.round(s.monsterDist));
      setLineTension(Math.round(s.lineTension));

      if (monsterGroup) {
        monsterGroup.position.set(Math.sin(now * 0.002) * 5, Math.sin(now * 0.005) * 0.8, s.monsterDist);
      }

      if (shipGroup) {
        shipGroup.rotation.y = s.shipAngle;
        shipGroup.position.y = Math.sin(now * 0.003) * 0.2;
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
    s.lineTension = 30;
    s.monsterHp = 100;
    s.monsterDist = 45;
    s.isReeling = false;
    s.shipAngle = 0;
    s.score = 0;
    s.fishCaught = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setScore(0);
    setFishCaught(0);
    setLineTension(30);
    setMonsterHp(100);
    setMonsterDistance(45);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 크라켄 헌터' : 'Voxel Kraken Hunter'}
        language={language}
        hp={{ current: monsterHp, max: 100 }}
        telemetries={[
          { label: isKo ? '포획' : 'Caught', value: `${fishCaught}/${targetMonsters}마리`, color: 'text-cyan-300' },
          { label: isKo ? '거리' : 'Dist', value: `${monsterDistance}m`, color: 'text-amber-300' },
          { label: isKo ? '장력' : 'Tension', value: `${lineTension}%`, color: lineTension > 80 ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-300' }
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
            stateRef.current.isReeling = true;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                stateRef.current.shipAngle += dx > 0 ? 0.03 : -0.03;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.isReeling = false;

              if (!moved) {
                // Tap: Harpoon Strike
                handleHarpoonStrike();
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
        <div className="px-3 py-1 bg-black/75 border border-sky-500/30 rounded-full text-[10px] text-sky-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 조준 | 탭: 작살 발사 | 화면 홀드: 릴링 당기기 (버튼 없음)' : 'Drag: Aim | Tap: Harpoon Strike | Hold: Reel In (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_kraken_hunter"
          gameTitle={isKo ? '3D 복셀 크라켄 헌터: 심해 거대 해수 포획' : 'Voxel Kraken Hunter: Deep Sea Monster Hunt'}
          sportType="fishing"
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

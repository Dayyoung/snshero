import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelFactoryCraftGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelFactoryCraftGame: React.FC<VoxelFactoryCraftGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_factory_craft') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [iron, setIron] = useState<number>(10);
  const [belts, setBelts] = useState<number>(0);
  const targetBelts = 6;
  const [chipsProduced, setChipsProduced] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    iron: 10,
    belts: 0,
    chipsProduced: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null
  });

  const buildConveyorBelt = () => {
    const s = gameStateRef.current;
    if (s.iron < 2 || s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;
    s.iron -= 2;
    s.belts += 1;
    s.chipsProduced += 5;
    s.score += 200;
    setIron(s.iron);
    setBelts(s.belts);
    setChipsProduced(s.chipsProduced);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Add Belt Mesh
    const bGeo = new THREE.BoxGeometry(2, 0.2, 2);
    const bMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set((s.belts - 3.5) * 2.4, 0.1, 0);
    s.scene.add(bMesh);

    if (s.belts >= targetBelts) {
      s.isVictory = true;
      s.isGameOver = true;
      setIsGameOver(true);
      const duration = (Date.now() - s.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'voxel_factory_craft',
        gameTitle: '복셀 팩토리 크래프트',
        durationSeconds: duration,
        score: s.score + 1000,
        difficulty: 'HARD',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  const manualMineOre = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.iron += 3;
    s.score += 50;
    setIron(s.iron);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);
    gameStateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 16, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Factory Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    // Smelter Machine at left
    const smelter = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), new THREE.MeshLambertMaterial({ color: 0xe53e3e }));
    smelter.position.set(-10, 2, 0);
    scene.add(smelter);

    // Assembler Machine at right
    const assembler = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), new THREE.MeshLambertMaterial({ color: 0x3182ce }));
    assembler.position.set(10, 2, 0);
    scene.add(assembler);

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (gameStateRef.current.isPaused || gameStateRef.current.isGameOver) return;
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
    s.iron = 10;
    s.belts = 0;
    s.chipsProduced = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setIron(10);
    setBelts(0);
    setChipsProduced(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 팩토리 크래프트' : 'Voxel Factory Craft'}
        language={language}
        telemetries={[
          { label: isKo ? '철광석' : 'Iron', value: `${iron}개`, color: 'text-cyan-300' },
          { label: isKo ? '벨트' : 'Belts', value: `${belts}/${targetBelts}개`, color: 'text-amber-300' },
          { label: isKo ? '칩셋생산' : 'Chips', value: `${chipsProduced}개`, color: 'text-emerald-300' }
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

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Mine Ore
                manualMineOre();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={buildConveyorBelt}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {isKo ? '탭: 철광석 수동 채굴 (+3) | 더블탭: 컨베이어 벨트 설치 (철광석 2소모) (버튼 없음)' : 'Tap: Mine Iron (+3) | Double Tap: Install Belt (Cost 2) (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_factory_craft"
          gameTitle={isKo ? '3D 복셀 팩토리 크래프트: 자동화 생산 라인' : 'Voxel Factory Craft: Automation'}
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

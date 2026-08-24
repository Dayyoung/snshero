import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBeatBlasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelBeatBlasterGame: React.FC<VoxelBeatBlasterGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_beat_blaster') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const targetScore = 3000;
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    score: 0,
    combo: 0,
    maxCombo: 0,
    cubes: [] as { mesh: THREE.Mesh; lane: number; z: number; hit: boolean }[],
    spawnTimer: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null
  });

  const hitLane = (lane: number) => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.scene) return;

    let hitSuccess = false;
    for (let i = 0; i < s.cubes.length; i++) {
      const c = s.cubes[i];
      if (c.lane === lane && !c.hit && Math.abs(c.z - 2) < 3.5) {
        c.hit = true;
        hitSuccess = true;
        s.scene.remove(c.mesh);
        s.cubes.splice(i, 1);
        s.combo += 1;
        s.maxCombo = Math.max(s.maxCombo, s.combo);
        s.score += 100 * Math.min(4, Math.floor(s.combo / 5) + 1);
        setCombo(s.combo);
        setMaxCombo(s.maxCombo);
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

        if (s.score >= targetScore) {
          s.isVictory = true;
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_beat_blaster',
            gameTitle: '복셀 비트 블래스터',
            durationSeconds: duration,
            score: s.score,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
        break;
      }
    }

    if (!hitSuccess) {
      s.combo = 0;
      setCombo(0);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050014);
    gameStateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 1, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xff00ff, 0.8);
    scene.add(ambient);

    // 4 Neon Rails
    const lanes = [-4.5, -1.5, 1.5, 4.5];
    const railMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    lanes.forEach(x => {
      const railGeo = new THREE.BoxGeometry(0.2, 0.1, 100);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, 0, -30);
      scene.add(rail);
    });

    // Hit Marker Line
    const targetLineGeo = new THREE.BoxGeometry(12, 0.1, 0.4);
    const targetLineMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const targetLine = new THREE.Mesh(targetLineGeo, targetLineMat);
    targetLine.position.set(0, 0.05, 2);
    scene.add(targetLine);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Spawn Cubes
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.45) {
        s.spawnTimer = 0;
        const lane = Math.floor(Math.random() * 4);
        const cubeGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
        const colors = [0xff0055, 0x00ffff, 0xffff00, 0x00ff66];
        const cubeMat = new THREE.MeshBasicMaterial({ color: colors[lane] });
        const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
        cubeMesh.position.set(lanes[lane], 0.8, -60);
        scene.add(cubeMesh);

        s.cubes.push({
          mesh: cubeMesh,
          lane,
          z: -60,
          hit: false
        });
      }

      // Update Cubes
      for (let i = s.cubes.length - 1; i >= 0; i--) {
        const c = s.cubes[i];
        c.z += dt * 38;
        c.mesh.position.z = c.z;
        c.mesh.rotation.x += dt * 3;
        c.mesh.rotation.y += dt * 3;

        if (c.z > 8) {
          if (!c.hit) {
            s.combo = 0;
            setCombo(0);
          }
          scene.remove(c.mesh);
          s.cubes.splice(i, 1);
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
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.cubes.forEach(c => s.scene?.remove(c.mesh));
    s.cubes = [];
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 비트 블래스터' : 'Voxel Beat Blaster'}
        language={language}
        telemetries={[
          { label: isKo ? '점수' : 'Score', value: `${score}/${targetScore}P`, color: 'text-amber-300' },
          { label: isKo ? '콤보' : 'Combo', value: `🔥 x${combo}`, color: 'text-cyan-300' },
          { label: isKo ? '최대콤보' : 'Max', value: `${maxCombo}`, color: 'text-fuchsia-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          gameStateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* 4-Zone Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 grid grid-cols-4 select-none touch-none"
          style={{ touchAction: 'none' }}
        >
          {[0, 1, 2, 3].map((laneIdx) => (
            <div
              key={laneIdx}
              className="w-full h-full active:bg-cyan-500/10 transition-colors border-r border-white/5 last:border-r-0 cursor-pointer"
              onPointerDown={(e) => {
                e.preventDefault();
                hitLane(laneIdx);
              }}
            />
          ))}
        </div>
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-fuchsia-500/30 rounded-full text-[10px] text-fuchsia-300 font-mono backdrop-blur-xs">
          {isKo ? '화면의 4개 레인(좌/중좌/중우/우)을 비트 타이밍에 맞춰 탭 (버튼 없음)' : 'Tap 4 screen columns on the beat (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_beat_blaster"
          gameTitle={isKo ? '3D 복셀 비트 블래스터: 네온 리듬 스트라이크' : 'Voxel Beat Blaster: Neon Rhythm Strike'}
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

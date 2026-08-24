import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBubblePopGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const BUBBLE_COLORS = [
  { name: 'Red', hex: 0xf43f5e, emissive: 0xe11d48 },
  { name: 'Blue', hex: 0x38bdf8, emissive: 0x0284c7 },
  { name: 'Green', hex: 0x22c55e, emissive: 0x16a34a },
  { name: 'Yellow', hex: 0xfacc15, emissive: 0xca8a04 },
  { name: 'Purple', hex: 0xa855f7, emissive: 0x7e22ce }
];

interface BubbleNode {
  mesh: THREE.Mesh;
  row: number;
  col: number;
  colorIdx: number;
  x: number;
  y: number;
}

export const VoxelBubblePopGame: React.FC<VoxelBubblePopGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_bubble_pop') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [shotsLeft, setShotsLeft] = useState<number>(25);
  const [combo, setCombo] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    cannonAngle: 0,
    currentColorIdx: 0,
    nextColorIdx: 1,
    isShooting: false,
    activeBullet: null as { mesh: THREE.Mesh; vel: THREE.Vector3; colorIdx: number } | null,
    grid: [] as (BubbleNode | null)[][],
    score: 0,
    shotsLeft: 25,
    combo: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    scene: null as THREE.Scene | null,
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 3, 15);
    camera.lookAt(0, 3.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfacc15, 1.8);
    dirLight.position.set(0, 15, 10);
    scene.add(dirLight);

    // Frame
    const frameGeo = new THREE.BoxGeometry(11, 14, 0.6);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 4.5, -0.6);
    scene.add(frame);

    // Build Initial Bubble Grid (Rows 0~4)
    const sphereGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const rows = 9;
    const cols = 8;
    stateRef.current.grid = [];

    for (let r = 0; r < rows; r++) {
      const rowArr: (BubbleNode | null)[] = [];
      const isOdd = r % 2 === 1;
      const curCols = isOdd ? cols - 1 : cols;
      const xOffset = isOdd ? 0.55 : 0;

      for (let c = 0; c < curCols; c++) {
        if (r < 5) {
          const colorIdx = Math.floor(Math.random() * BUBBLE_COLORS.length);
          const mat = new THREE.MeshStandardMaterial({
            color: BUBBLE_COLORS[colorIdx].hex,
            emissive: BUBBLE_COLORS[colorIdx].emissive,
            emissiveIntensity: 0.4,
            roughness: 0.2
          });
          const bMesh = new THREE.Mesh(sphereGeo, mat);
          const bx = (c - curCols / 2 + 0.5) * 1.1 + xOffset;
          const by = 9.5 - r * 0.95;
          bMesh.position.set(bx, by, 0);
          scene.add(bMesh);

          rowArr.push({ mesh: bMesh, row: r, col: c, colorIdx, x: bx, y: by });
        } else {
          rowArr.push(null);
        }
      }
      stateRef.current.grid.push(rowArr);
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Update Bullet Physics
      if (s.activeBullet) {
        s.activeBullet.mesh.position.addScaledVector(s.activeBullet.vel, dt);

        // Wall Bounce
        if (s.activeBullet.mesh.position.x < -4.8) {
          s.activeBullet.vel.x = Math.abs(s.activeBullet.vel.x);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        } else if (s.activeBullet.mesh.position.x > 4.8) {
          s.activeBullet.vel.x = -Math.abs(s.activeBullet.vel.x);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }

        // Ceiling Hit or Bubble Collision Check
        let hit = false;
        if (s.activeBullet.mesh.position.y > 10) {
          hit = true;
        } else {
          // Check collision with grid bubbles
          for (let r = 0; r < s.grid.length; r++) {
            for (let c = 0; c < s.grid[r].length; c++) {
              const node = s.grid[r][c];
              if (node) {
                const dist = s.activeBullet.mesh.position.distanceTo(node.mesh.position);
                if (dist < 0.95) {
                  hit = true;
                  break;
                }
              }
            }
            if (hit) break;
          }
        }

        if (hit) {
          // Snap & Pop Match
          s.score += 250;
          s.combo += 1;
          setScore(s.score);
          setCombo(s.combo);
          scene.remove(s.activeBullet.mesh);
          s.activeBullet = null;
          s.isShooting = false;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');

          // Check End of Game
          if (s.shotsLeft <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_bubble_pop',
              gameTitle: '복셀 버블 팝',
              durationSeconds: duration,
              score: s.score,
              difficulty: 'HARD',
              isVictory: s.score >= 2000
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
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

  const shootBubble = (targetX: number, targetY: number) => {
    const s = stateRef.current;
    if (s.isShooting || s.shotsLeft <= 0 || s.isGameOver || s.isPaused || !s.scene) return;

    s.isShooting = true;
    s.shotsLeft -= 1;
    setShotsLeft(s.shotsLeft);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const angle = Math.atan2(targetY - (-1.8), targetX - 0);
    const speed = 28;

    const sphereGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const colorIdx = Math.floor(Math.random() * BUBBLE_COLORS.length);
    const mat = new THREE.MeshStandardMaterial({
      color: BUBBLE_COLORS[colorIdx].hex,
      emissive: BUBBLE_COLORS[colorIdx].emissive,
      emissiveIntensity: 0.5,
      roughness: 0.2
    });
    const bulletMesh = new THREE.Mesh(sphereGeo, mat);
    bulletMesh.position.set(0, -1.8, 0);
    s.scene.add(bulletMesh);

    s.activeBullet = {
      mesh: bulletMesh,
      vel: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0),
      colorIdx
    };
  };

  const handleRestart = () => {
    const s = stateRef.current;
    s.score = 0;
    s.shotsLeft = 25;
    s.combo = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    setScore(0);
    setShotsLeft(25);
    setCombo(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        onPointerDown={(e) => {
          if (isPaused || showTutorial || isGameOver) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          shootBubble(normX * 5, normY * 6 + 3);
        }}
        className="flex-1 w-full h-full cursor-crosshair"
      />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 버블 팝' : 'Voxel Bubble Pop'}
        language={language}
        telemetries={[
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300' },
          { label: isKo ? '남은발수' : 'Shots', value: `${shotsLeft}발`, color: 'text-cyan-300' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: 'text-fuchsia-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono backdrop-blur-xs">
          {isKo ? '화면의 조준점을 원터치 탭하여 버블 대포 발사 (버튼 없음)' : 'Tap anywhere to shoot bubble cannon (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_bubble_pop"
          gameTitle={isKo ? '3D 복셀 버블 팝: 네온 버블 슈터' : 'Voxel Bubble Pop: Neon Bubble Shooter'}
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

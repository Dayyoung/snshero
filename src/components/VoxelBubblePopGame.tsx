import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Flame, Target, Dices } from 'lucide-react';
import { CardData } from '../types';

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

  const [score, setScore] = useState<number>(0);
  const [shotsLeft, setShotsLeft] = useState<number>(25);
  const [combo, setCombo] = useState<number>(0);
  const [nextColorIdx, setNextColorIdx] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

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
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 3, 15);
    camera.lookAt(0, 3.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Neon Arena Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfacc15, 1.8);
    dirLight.position.set(0, 15, 10);
    scene.add(dirLight);

    // Arena Backboard & Border Frame
    const frameGeo = new THREE.BoxGeometry(11, 14, 0.6);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 4.5, -0.6);
    scene.add(frame);

    // Cannon Base Mesh at bottom
    const cannonBaseGeo = new THREE.CylinderGeometry(0.8, 1.1, 0.6, 16);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
    const cannonBase = new THREE.Mesh(cannonBaseGeo, cannonMat);
    cannonBase.position.set(0, -1.8, 0);
    scene.add(cannonBase);

    // Initial Grid of Voxel Bubbles (8 rows, 9 cols)
    const rows = 8;
    const cols = 9;
    const bubbleRadius = 0.52;
    const grid: (BubbleNode | null)[][] = [];

    const sphereGeo = new THREE.DodecahedronGeometry(bubbleRadius, 1);

    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      const rowOffset = (r % 2 === 1) ? bubbleRadius : 0;
      const count = (r % 2 === 1) ? cols - 1 : cols;

      for (let c = 0; c < count; c++) {
        if (r < 5) {
          const colorIdx = Math.floor(Math.random() * BUBBLE_COLORS.length);
          const colorDef = BUBBLE_COLORS[colorIdx];

          const mat = new THREE.MeshStandardMaterial({
            color: colorDef.hex,
            emissive: colorDef.emissive,
            emissiveIntensity: 0.4,
            roughness: 0.1,
            metalness: 0.3
          });
          const bMesh = new THREE.Mesh(sphereGeo, mat);

          const x = (c - (count - 1) / 2) * (bubbleRadius * 2.1) + rowOffset * 0.5;
          const y = 8.5 - r * (bubbleRadius * 1.85);

          bMesh.position.set(x, y, 0);
          scene.add(bMesh);

          grid[r][c] = { mesh: bMesh, row: r, col: c, colorIdx, x, y };
        } else {
          grid[r][c] = null;
        }
      }
    }

    stateRef.current.grid = grid;
    const initColor = Math.floor(Math.random() * BUBBLE_COLORS.length);
    const nextColor = Math.floor(Math.random() * BUBBLE_COLORS.length);
    stateRef.current.currentColorIdx = initColor;
    stateRef.current.nextColorIdx = nextColor;
    setNextColorIdx(nextColor);

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = stateRef.current;
      if (state.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Active Bullet Movement
      if (state.activeBullet) {
        state.activeBullet.mesh.position.addScaledVector(state.activeBullet.vel, dt);

        // Wall Bounces
        if (state.activeBullet.mesh.position.x < -4.8) {
          state.activeBullet.mesh.position.x = -4.8;
          state.activeBullet.vel.x *= -1;
        } else if (state.activeBullet.mesh.position.x > 4.8) {
          state.activeBullet.mesh.position.x = 4.8;
          state.activeBullet.vel.x *= -1;
        }

        // Check Collision with Grid Bubbles or Top Wall
        const bulletPos = state.activeBullet.mesh.position;
        let collided = false;

        if (bulletPos.y >= 9.0) {
          collided = true;
        } else {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < (grid[r]?.length || 0); c++) {
              const node = grid[r][c];
              if (node) {
                const dist = bulletPos.distanceTo(node.mesh.position);
                if (dist < bubbleRadius * 1.8) {
                  collided = true;
                  break;
                }
              }
            }
            if (collided) break;
          }
        }

        if (collided) {
          // Snap bullet into nearest empty grid slot
          const targetR = Math.max(0, Math.min(rows - 1, Math.round((8.5 - bulletPos.y) / (bubbleRadius * 1.85))));
          const count = (targetR % 2 === 1) ? cols - 1 : cols;
          const targetC = Math.max(0, Math.min(count - 1, Math.round((bulletPos.x + 4.5) / (bubbleRadius * 2.1))));

          const colorDef = BUBBLE_COLORS[state.activeBullet.colorIdx];
          const mat = new THREE.MeshStandardMaterial({
            color: colorDef.hex,
            emissive: colorDef.emissive,
            emissiveIntensity: 0.4,
            roughness: 0.1,
            metalness: 0.3
          });
          const newMesh = new THREE.Mesh(sphereGeo, mat);
          const x = (targetC - (count - 1) / 2) * (bubbleRadius * 2.1);
          const y = 8.5 - targetR * (bubbleRadius * 1.85);
          newMesh.position.set(x, y, 0);
          scene.add(newMesh);

          grid[targetR][targetC] = {
            mesh: newMesh,
            row: targetR,
            col: targetC,
            colorIdx: state.activeBullet.colorIdx,
            x,
            y
          };

          // Find Matching Neighbors (Flood Fill)
          const matched: BubbleNode[] = [];
          const visited = new Set<string>();

          const flood = (r: number, c: number, colIdx: number) => {
            const key = `${r},${c}`;
            if (visited.has(key)) return;
            visited.add(key);

            const n = grid[r]?.[c];
            if (!n || n.colorIdx !== colIdx) return;
            matched.push(n);

            const neighbors = [
              [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
              [r - 1, c + (r % 2 === 1 ? 1 : -1)], [r + 1, c + (r % 2 === 1 ? 1 : -1)]
            ];
            neighbors.forEach(([nr, nc]) => {
              if (nr >= 0 && nr < rows && nc >= 0 && nc < (grid[nr]?.length || 0)) {
                flood(nr, nc, colIdx);
              }
            });
          };

          flood(targetR, targetC, state.activeBullet.colorIdx);

          // If 3 or more match -> Pop!
          if (matched.length >= 3) {
            matched.forEach(m => {
              scene.remove(m.mesh);
              grid[m.row][m.col] = null;
            });

            state.combo++;
            state.score += matched.length * 150 * state.combo;
            setScore(state.score);
            setCombo(state.combo);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          } else {
            state.combo = 0;
            setCombo(0);
          }

          // Cleanup bullet
          scene.remove(state.activeBullet.mesh);
          state.activeBullet = null;
          state.isShooting = false;

          // Next shot setup
          state.currentColorIdx = state.nextColorIdx;
          state.nextColorIdx = Math.floor(Math.random() * BUBBLE_COLORS.length);
          setNextColorIdx(state.nextColorIdx);

          state.shotsLeft--;
          setShotsLeft(state.shotsLeft);

          if (state.shotsLeft <= 0) {
            state.isGameOver = true;
            setIsGameOver(true);
            const reward = Math.min(260, Math.floor(state.score / 50));
            setRewardSns(reward);
            onReward(reward);
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
  }, [lowSpecMode, onReward, playSfx]);

  const shootBubble = (targetX: number, targetY: number) => {
    const state = stateRef.current;
    if (state.isShooting || state.isGameOver || state.shotsLeft <= 0) return;

    state.isShooting = true;

    const dx = targetX;
    const dy = targetY - (-1.8);
    const angle = Math.atan2(dy, dx);
    const speed = 22;

    const colorDef = BUBBLE_COLORS[state.currentColorIdx];
    const sphereGeo = new THREE.DodecahedronGeometry(0.52, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: colorDef.hex,
      emissive: colorDef.emissive,
      emissiveIntensity: 0.6,
      roughness: 0.1
    });
    const bulletMesh = new THREE.Mesh(sphereGeo, mat);
    bulletMesh.position.set(0, -1.8, 0);

    const container = mountRef.current;
    if (container) {
      // Add to scene through stateRef
      state.activeBullet = {
        mesh: bulletMesh,
        vel: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0),
        colorIdx: state.currentColorIdx
      };
      const scene = (bulletMesh as any);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      {/* 3D Viewport */}
      <div
        ref={mountRef}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          shootBubble(normX * 5, normY * 6 + 3);
        }}
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />

      {/* Header HUD */}
      <div className="relative z-10 w-full max-w-xl p-3 flex items-center justify-between pointer-events-auto bg-slate-900/85 backdrop-blur-sm border-b border-purple-500/40">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-purple-400 text-xs font-bold rounded-sm border border-purple-500/40"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy size={14} />
            <span>{score.toLocaleString()}P</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <Target size={14} />
            <span>{shotsLeft} SHOTS</span>
          </div>
          {combo > 1 && (
            <div className="flex items-center gap-1 text-rose-400 animate-bounce">
              <Sparkles size={14} />
              <span>{combo} COMBO</span>
            </div>
          )}
        </div>
      </div>

      {/* Touch Aim Guide Overlay */}
      <div className="relative z-10 mt-2 pointer-events-none text-center">
        <span className="px-3 py-1 bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-sm">
          {isKo ? '화면을 탭하여 버블 대포를 발사하세요!' : 'Tap anywhere on screen to shoot bubble cannon!'}
        </span>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-purple-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '버블 아레나 클리어!' : 'BUBBLE ARENA COMPLETE!'}
            </h2>
            <div className="w-full bg-slate-950 p-3 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최대 연속 콤보' : 'Max Combo'}</span>
                <span className="text-cyan-400 font-bold">{combo} COMBO</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKo ? '최종 획득 점수' : 'Final Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>{isKo ? 'SNS 보상 포인트' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-black text-sm rounded-sm tracking-wider shadow-lg"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

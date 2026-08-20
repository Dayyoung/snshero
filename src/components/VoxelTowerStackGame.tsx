import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Building, Trophy, Sparkles, Layers } from 'lucide-react';
import { CardData } from '../types';

interface VoxelTowerStackGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface StackBlock {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
}

export const VoxelTowerStackGame: React.FC<VoxelTowerStackGameProps> = ({
  deck: _deck,
  language: _language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [floorCount, setFloorCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const blockColors = [
    0xef4444, 0xf97316, 0xf59e0b, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899
  ];

  const stateRef = useRef({
    currentFloor: 0,
    stack: [] as StackBlock[],
    currentBlockMesh: null as THREE.Mesh | null,
    blockWidth: 8,
    blockDepth: 8,
    blockHeight: 1.2,
    blockX: 0,
    blockZ: 0,
    moveDir: 1,
    axis: 'x' as 'x' | 'z',
    combo: 0,
    maxCombo: 0,
    score: 0,
    isGameOver: false,
    speed: 0.16,
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const handlePlaceBlock = () => {
    const s = stateRef.current;
    if (s.isGameOver || !s.currentBlockMesh || !s.scene) return;

    const prevBlock = s.stack[s.stack.length - 1];
    let diff = 0;
    let newWidth = s.blockWidth;
    let newDepth = s.blockDepth;
    let newX = s.blockX;
    let newZ = s.blockZ;

    if (s.axis === 'x') {
      diff = s.blockX - prevBlock.x;
      if (Math.abs(diff) < 0.25) {
        // Perfect Snap!
        diff = 0;
        newX = prevBlock.x;
        s.combo += 1;
        s.score += 20 + s.combo * 5;
        if (s.combo > 2 && s.blockWidth < 8) newWidth = Math.min(8, newWidth + 0.5);
        if (playSfx) playSfx('/sounds/perfect.mp3');
      } else if (Math.abs(diff) >= s.blockWidth) {
        // Complete Miss -> Game Over
        gameOver();
        return;
      } else {
        // Slice block
        s.combo = 0;
        newWidth = s.blockWidth - Math.abs(diff);
        newX = prevBlock.x + (diff / 2);
        s.score += 10;
        if (playSfx) playSfx('/sounds/slice.mp3');
      }
    } else {
      diff = s.blockZ - prevBlock.z;
      if (Math.abs(diff) < 0.25) {
        // Perfect Snap!
        diff = 0;
        newZ = prevBlock.z;
        s.combo += 1;
        s.score += 20 + s.combo * 5;
        if (s.combo > 2 && s.blockDepth < 8) newDepth = Math.min(8, newDepth + 0.5);
        if (playSfx) playSfx('/sounds/perfect.mp3');
      } else if (Math.abs(diff) >= s.blockDepth) {
        // Complete Miss -> Game Over
        gameOver();
        return;
      } else {
        // Slice block
        s.combo = 0;
        newDepth = s.blockDepth - Math.abs(diff);
        newZ = prevBlock.z + (diff / 2);
        s.score += 10;
        if (playSfx) playSfx('/sounds/slice.mp3');
      }
    }

    s.maxCombo = Math.max(s.maxCombo, s.combo);
    setCombo(s.combo);
    setMaxCombo(s.maxCombo);
    setScore(s.score);

    // Place and resize current block
    s.currentBlockMesh.scale.set(newWidth / s.blockWidth, 1, newDepth / s.blockDepth);
    s.currentBlockMesh.position.set(newX, s.currentFloor * s.blockHeight, newZ);

    s.stack.push({
      mesh: s.currentBlockMesh,
      x: newX,
      y: s.currentFloor * s.blockHeight,
      z: newZ,
      width: newWidth,
      depth: newDepth
    });

    s.blockWidth = newWidth;
    s.blockDepth = newDepth;
    s.currentFloor += 1;
    setFloorCount(s.currentFloor);

    // Speed up slightly
    s.speed = Math.min(0.35, s.speed + 0.005);

    // Switch Axis & Spawn Next Block
    s.axis = s.axis === 'x' ? 'z' : 'x';
    spawnNextBlock(newX, newZ);
  };

  const spawnNextBlock = (lastX: number, lastZ: number) => {
    const s = stateRef.current;
    if (!s.scene) return;

    const col = blockColors[s.currentFloor % blockColors.length];
    const geo = new THREE.BoxGeometry(s.blockWidth, s.blockHeight, s.blockDepth);
    const mat = new THREE.MeshLambertMaterial({ color: col });
    const mesh = new THREE.Mesh(geo, mat);

    const spawnY = s.currentFloor * s.blockHeight;
    if (s.axis === 'x') {
      s.blockX = -14;
      s.blockZ = lastZ;
    } else {
      s.blockX = lastX;
      s.blockZ = -14;
    }

    mesh.position.set(s.blockX, spawnY, s.blockZ);
    s.scene.add(mesh);
    s.currentBlockMesh = mesh;
    s.moveDir = 1;
  };

  const gameOver = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);
    const finalSns = Math.min(260, Math.max(30, s.currentFloor * 8 + s.maxCombo * 10));
    setRewardSns(finalSns);
    onReward(finalSns);
    if (playSfx) playSfx('/sounds/gameover.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.012);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.3);
    sun.position.set(20, 60, 30);
    scene.add(sun);

    // Foundation Base Block
    const baseGeo = new THREE.BoxGeometry(8, 1.2, 8);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, 0, 0);
    scene.add(baseMesh);

    stateRef.current.stack = [{
      mesh: baseMesh,
      x: 0,
      y: 0,
      z: 0,
      width: 8,
      depth: 8
    }];

    stateRef.current.currentFloor = 1;
    spawnNextBlock(0, 0);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Move Floating Block
      if (s.currentBlockMesh) {
        if (s.axis === 'x') {
          s.blockX += s.moveDir * s.speed;
          if (s.blockX > 14) s.moveDir = -1;
          if (s.blockX < -14) s.moveDir = 1;
          s.currentBlockMesh.position.x = s.blockX;
        } else {
          s.blockZ += s.moveDir * s.speed;
          if (s.blockZ > 14) s.moveDir = -1;
          if (s.blockZ < -14) s.moveDir = 1;
          s.currentBlockMesh.position.z = s.blockZ;
        }
      }

      // Smooth Camera Ascend
      const targetCamY = s.currentFloor * s.blockHeight + 12;
      camera.position.y += (targetCamY - camera.position.y) * 0.08;
      camera.position.x = 22;
      camera.position.z = 22;
      camera.lookAt(0, s.currentFloor * s.blockHeight, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div
      onClick={handlePlaceBlock}
      className="relative w-full h-[100dvh] bg-[#0f172a] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onExit(); }}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
            <Building className="w-3.5 h-3.5" /> [No.75 마그니스 전담] 3D 타워 스택 마스터
          </div>
          <div className="text-[10px] text-slate-300">타이밍 블록 스택 & 초고층 빌딩 스카이라인 건설</div>
        </div>
        <div className="text-xs text-emerald-400 font-bold">
          {floorCount}층
        </div>
      </div>

      {/* Stats HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b]/90 text-xs border-b border-slate-700 z-20">
        <div>현재 높이: <strong className="text-amber-400">{floorCount}층</strong></div>
        {combo > 1 && (
          <div className="text-pink-400 font-bold animate-bounce flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            {combo}연속 퍼펙트 스냅! (크기 회복)
          </div>
        )}
        <div>점수: <strong className="text-cyan-400">{score}P</strong></div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="relative flex-1 w-full overflow-hidden" />

      {/* Tap Instruction Prompt */}
      <div className="p-3 bg-[#1e293b]/95 border-t border-slate-700 text-center text-xs font-bold text-slate-200 z-20">
        [화면 아무 곳이나 탭하여 블록을 쌓으세요]
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-amber-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-amber-400 mb-1">[타워 건설 완료!]</h2>
            <p className="text-xs text-slate-300 mb-4">초고층 복셀 빌딩 스카이라인 달성</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">최종 높이:</span>
                <span className="text-emerald-400 font-bold">{floorCount}층</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">최대 연속 퍼펙트:</span>
                <span className="text-pink-400 font-bold">{maxCombo}회</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1">
                <span className="text-amber-300 font-bold">확정 보상 SNS:</span>
                <span className="text-amber-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onExit(); }}
              className="w-full py-2.5 bg-amber-500 text-black font-bold text-xs rounded-sm active:bg-amber-400"
            >
              [보상 수령 및 복귀]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

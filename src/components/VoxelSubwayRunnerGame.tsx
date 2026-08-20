import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Zap, Trophy, Shield, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSubwayRunnerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ObstacleItem {
  mesh: THREE.Group;
  lane: number;
  z: number;
  type: 'train' | 'barrier' | 'coin';
  collected?: boolean;
}

export const VoxelSubwayRunnerGame: React.FC<VoxelSubwayRunnerGameProps> = ({
  deck: _deck,
  language: _language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [coins, setCoins] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [hasHoverboard, setHasHoverboard] = useState<boolean>(false);
  const [hoverboardTime, setHoverboardTime] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const lanes = [-3.5, 0, 3.5];

  const stateRef = useRef({
    laneIdx: 1, // 0: Left, 1: Center, 2: Right
    playerX: 0,
    playerY: 0.6,
    playerZ: 0,
    isJumping: false,
    jumpVel: 0,
    isSliding: false,
    slideTimer: 0,
    hasHoverboard: false,
    hoverboardTimer: 0,
    speed: 0.55,
    distance: 0,
    coins: 0,
    isGameOver: false,
    obstacles: [] as ObstacleItem[],
    touchStartX: 0,
    touchStartY: 0
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') changeLane(-1);
      else if (k === 'd' || k === 'arrowright') changeLane(1);
      else if (k === 'w' || k === 'arrowup' || k === ' ') jump();
      else if (k === 's' || k === 'arrowdown') slide();
      else if (k === 'e' || k === 'f') activateHoverboard();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const changeLane = (dir: number) => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.laneIdx = Math.max(0, Math.min(2, s.laneIdx + dir));
  };

  const jump = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isJumping) return;
    s.isJumping = true;
    s.jumpVel = 0.32;
    if (playSfx) playSfx('/sounds/jump.mp3');
  };

  const slide = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isSliding = true;
    s.slideTimer = 35;
    if (playSfx) playSfx('/sounds/slide.mp3');
  };

  const activateHoverboard = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.hasHoverboard) return;
    s.hasHoverboard = true;
    s.hoverboardTimer = 10;
    setHasHoverboard(true);
    setHoverboardTime(10);
    if (playSfx) playSfx('/sounds/powerup.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(10, 30, 20);
    scene.add(dirLight);

    // Subway Track Floor
    const trackGeo = new THREE.PlaneGeometry(16, 400);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.z = -100;
    scene.add(track);

    // 3 Rails
    const railMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    [-3.5, 0, 3.5].forEach(lx => {
      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 400), railMat);
      rail1.position.set(lx - 0.8, 0.05, -100);
      scene.add(rail1);
      const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 400), railMat);
      rail2.position.set(lx + 0.8, 0.05, -100);
      scene.add(rail2);
    });

    // Player Mesh
    const playerGroup = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.8), bodyMat);
    pBody.position.y = 0.7;
    playerGroup.add(pBody);

    const headMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
    const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), headMat);
    pHead.position.y = 1.7;
    playerGroup.add(pHead);

    const boardMat = new THREE.MeshLambertMaterial({ color: 0xec4899 });
    const hoverboardMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 2.2), boardMat);
    hoverboardMesh.position.y = 0.05;
    hoverboardMesh.visible = false;
    playerGroup.add(hoverboardMesh);

    scene.add(playerGroup);

    // Spawning Initial Obstacles
    const obstacles: ObstacleItem[] = [];
    const spawnZStart = -30;
    for (let i = 0; i < 20; i++) {
      const zPos = spawnZStart - i * 16;
      const lane = Math.floor(Math.random() * 3);
      const typeRand = Math.random();

      const oGroup = new THREE.Group();
      let type: 'train' | 'barrier' | 'coin' = 'coin';

      if (typeRand < 0.4) {
        // Subway Train
        type = 'train';
        const trainMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 3.2, 10),
          new THREE.MeshLambertMaterial({ color: 0xef4444 })
        );
        trainMesh.position.y = 1.6;
        oGroup.add(trainMesh);
      } else if (typeRand < 0.7) {
        // Barrier
        type = 'barrier';
        const barMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.6, 1.2, 0.6),
          new THREE.MeshLambertMaterial({ color: 0xf59e0b })
        );
        barMesh.position.y = 0.6;
        oGroup.add(barMesh);
      } else {
        // Gold Coin
        type = 'coin';
        const coinMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16),
          new THREE.MeshLambertMaterial({ color: 0xfacc15 })
        );
        coinMesh.rotation.z = Math.PI / 2;
        coinMesh.position.y = 1.2;
        oGroup.add(coinMesh);
      }

      oGroup.position.set(lanes[lane], 0, zPos);
      scene.add(oGroup);

      obstacles.push({
        mesh: oGroup,
        lane,
        z: zPos,
        type
      });
    }
    stateRef.current.obstacles = obstacles;

    // Second Timer for hoverboard
    const hbInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.hasHoverboard && s.hoverboardTimer > 0) {
        s.hoverboardTimer -= 1;
        setHoverboardTime(s.hoverboardTimer);
        if (s.hoverboardTimer <= 0) {
          s.hasHoverboard = false;
          setHasHoverboard(false);
        }
      }
    }, 1000);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Distance increment
      s.distance += s.speed;
      setDistance(Math.floor(s.distance));

      // Lane interpolation
      const targetX = lanes[s.laneIdx];
      s.playerX += (targetX - s.playerX) * 0.2;

      // Jump Physics
      if (s.isJumping) {
        s.playerY += s.jumpVel;
        s.jumpVel -= 0.018;
        if (s.playerY <= 0.6) {
          s.playerY = 0.6;
          s.isJumping = false;
        }
      }

      // Slide Timer
      if (s.isSliding) {
        s.slideTimer -= 1;
        pBody.scale.y = 0.5;
        pBody.position.y = 0.35;
        if (s.slideTimer <= 0) {
          s.isSliding = false;
          pBody.scale.y = 1.0;
          pBody.position.y = 0.7;
        }
      }

      hoverboardMesh.visible = s.hasHoverboard;

      playerGroup.position.set(s.playerX, s.playerY, 0);

      // Move & Recycle Obstacles
      for (const obs of s.obstacles) {
        obs.z += s.speed;
        obs.mesh.position.z = obs.z;

        // Collision Check
        if (Math.abs(obs.z - 0) < 1.4 && s.laneIdx === obs.lane) {
          if (obs.type === 'coin' && !obs.collected) {
            obs.collected = true;
            obs.mesh.visible = false;
            s.coins += 1;
            setCoins(s.coins);
            if (playSfx) playSfx('/sounds/coin.mp3');
          } else if (obs.type === 'barrier' || obs.type === 'train') {
            const hitBarrier = obs.type === 'barrier' && !s.isJumping;
            const hitTrain = obs.type === 'train';

            if (hitBarrier || hitTrain) {
              if (s.hasHoverboard) {
                // Shield saves player once
                s.hasHoverboard = false;
                s.hoverboardTimer = 0;
                setHasHoverboard(false);
                obs.z = 10; // push away
                if (playSfx) playSfx('/sounds/shield_break.mp3');
              } else {
                // Game Over
                s.isGameOver = true;
                setIsGameOver(true);
                const finalSns = Math.min(250, Math.max(30, Math.floor(s.distance / 15) + s.coins * 3));
                setRewardSns(finalSns);
                onReward(finalSns);
                if (playSfx) playSfx('/sounds/gameover.mp3');
              }
            }
          }
        }

        // Recycle passed obstacle
        if (obs.z > 15) {
          obs.z = -300 - Math.random() * 20;
          obs.lane = Math.floor(Math.random() * 3);
          obs.mesh.position.x = lanes[obs.lane];
          obs.collected = false;
          obs.mesh.visible = true;
        }
      }

      // Camera Follow
      camera.position.set(s.playerX * 0.4, 4.2, 8.5);
      camera.lookAt(s.playerX * 0.4, 1.8, -10);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      clearInterval(hbInterval);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  const handleTouchStart = (e: React.TouchEvent) => {
    stateRef.current.touchStartX = e.touches[0].clientX;
    stateRef.current.touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - stateRef.current.touchStartX;
    const dy = e.changedTouches[0].clientY - stateRef.current.touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) changeLane(1);
      else if (dx < -30) changeLane(-1);
    } else {
      if (dy < -30) jump();
      else if (dy > 30) slide();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[100dvh] bg-[#0f172a] font-mono text-[#fdfcfc] select-none flex flex-col overflow-hidden"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d] border-b border-[#201d1d]/30 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#fdfcfc]/10 text-white rounded-sm text-xs active:bg-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> [뒤로]
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-sky-400 flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5" /> [No.72 프레도 전담] 3D 서브웨이 러너
          </div>
          <div className="text-[10px] text-slate-300">3레인 무한 질주 & 호버보드 파쿠르 러너</div>
        </div>
        <div className="text-xs text-amber-300 font-bold">
          코인: {coins}
        </div>
      </div>

      {/* Stats HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b]/90 text-xs border-b border-slate-700 z-20">
        <div>이동 거리: <strong className="text-emerald-400">{distance}m</strong></div>
        {hasHoverboard ? (
          <div className="flex items-center gap-1 text-pink-400 font-bold animate-pulse">
            <Shield className="w-4 h-4" />
            호버보드 쉴드: {hoverboardTime}s
          </div>
        ) : (
          <button
            onClick={activateHoverboard}
            className="px-2.5 py-0.5 bg-pink-600 text-white rounded-sm text-[10px] font-bold active:bg-pink-500"
          >
            [호버보드 전개]
          </button>
        )}
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="relative flex-1 w-full overflow-hidden" />

      {/* Mobile Touch Helper Buttons */}
      <div className="p-3 bg-[#1e293b]/95 border-t border-slate-700 grid grid-cols-4 gap-2 z-20">
        <button
          onClick={() => changeLane(-1)}
          className="py-3 bg-slate-800 border border-slate-600 rounded-sm font-bold text-xs active:bg-slate-700"
        >
          ◀ 좌측
        </button>
        <button
          onClick={jump}
          className="py-3 bg-slate-800 border border-slate-600 rounded-sm font-bold text-xs active:bg-slate-700 text-sky-400"
        >
          ▲ 점프
        </button>
        <button
          onClick={slide}
          className="py-3 bg-slate-800 border border-slate-600 rounded-sm font-bold text-xs active:bg-slate-700 text-amber-400"
        >
          ▼ 슬라이딩
        </button>
        <button
          onClick={() => changeLane(1)}
          className="py-3 bg-slate-800 border border-slate-600 rounded-sm font-bold text-xs active:bg-slate-700"
        >
          우측 ▶
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[#201d1d] border border-sky-500/40 p-5 rounded-none text-center font-mono">
            <Trophy className="w-12 h-12 text-sky-400 mx-auto mb-2" />
            <h2 className="text-base font-bold text-sky-400 mb-1">[질주 종료!]</h2>
            <p className="text-xs text-slate-300 mb-4">지하철 파쿠르 질주 기록 달성</p>

            <div className="bg-slate-900/80 p-3 rounded-sm text-xs space-y-1 mb-4 text-left border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">최종 거리:</span>
                <span className="text-emerald-400 font-bold">{distance}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">획득 코인:</span>
                <span className="text-amber-400 font-bold">{coins}개</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1">
                <span className="text-amber-300 font-bold">확정 보상 SNS:</span>
                <span className="text-amber-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-2.5 bg-sky-500 text-black font-bold text-xs rounded-sm active:bg-sky-400"
            >
              [보상 수령 및 복귀]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

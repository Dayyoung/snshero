import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Coins, Sparkles, Bomb, Pickaxe } from 'lucide-react';
import { CardData } from '../types';

interface VoxelTreasureDiggerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface OreItem {
  mesh: THREE.Mesh;
  type: 'small_gold' | 'big_gold' | 'diamond' | 'rock';
  value: number;
  weight: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  isCollected: boolean;
}

export const VoxelTreasureDiggerGame: React.FC<VoxelTreasureDiggerGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [goldScore, setGoldScore] = useState<number>(0);
  const targetGold = 5000;
  const [tntCount, setTntCount] = useState<number>(2);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    hookAngle: 0,
    hookSpeed: 0.035,
    hookState: 'swinging' as 'swinging' | 'shooting' | 'retracting',
    hookLength: 1.0,
    hookTargetItem: null as OreItem | null,
    goldScore: 0,
    tntCount: 2,
    timeLeft: 60,
    ores: [] as OreItem[],
    isGameOver: false
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a110a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, -3.5, 14);
    camera.lookAt(0, -4.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x332211, 0.9);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xffeedd, 2.0);
    spotLight.position.set(0, 5, 8);
    scene.add(spotLight);

    // Miner Cart on top
    const cartGeo = new THREE.BoxGeometry(1.6, 0.8, 1.2);
    const cartMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const cart = new THREE.Mesh(cartGeo, cartMat);
    cart.position.set(0, 0.4, 0);
    scene.add(cart);

    // Hook Line & Claw
    const hookGroup = new THREE.Group();
    hookGroup.position.set(0, 0, 0);

    const lineGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.y = -0.5;

    const clawGeo = new THREE.BoxGeometry(0.5, 0.3, 0.4);
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
    const clawMesh = new THREE.Mesh(clawGeo, clawMat);
    clawMesh.position.y = -1.0;

    hookGroup.add(lineMesh, clawMesh);
    scene.add(hookGroup);

    // Generate Gold, Rocks & Diamonds
    const ores: OreItem[] = [];
    const oreTypes: ('small_gold' | 'big_gold' | 'diamond' | 'rock')[] = [
      'small_gold', 'small_gold', 'big_gold', 'diamond', 'rock', 'rock', 'small_gold', 'big_gold'
    ];

    oreTypes.forEach((type, i) => {
      let geo: THREE.BufferGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      let mat: THREE.Material = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.6, roughness: 0.2 });
      let val = 250;
      let weight = 1.0;
      let rad = 0.5;

      if (type === 'small_gold') {
        geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        val = 250;
        weight = 1.0;
        rad = 0.45;
      } else if (type === 'big_gold') {
        geo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
        val = 750;
        weight = 2.4;
        rad = 0.9;
      } else if (type === 'diamond') {
        geo = new THREE.OctahedronGeometry(0.5);
        mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.1 });
        val = 1000;
        weight = 0.6;
        rad = 0.4;
      } else if (type === 'rock') {
        geo = new THREE.DodecahedronGeometry(1.0);
        mat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 });
        val = 50;
        weight = 3.5;
        rad = 0.8;
      }

      const mesh = new THREE.Mesh(geo, mat);
      const angleSpread = ((i - (oreTypes.length / 2)) / (oreTypes.length / 2)) * 1.1;
      const dist = 3.5 + (i % 3) * 2.2;
      const x = Math.sin(angleSpread) * dist;
      const y = -Math.cos(angleSpread) * dist;

      mesh.position.set(x, y, 0);
      scene.add(mesh);

      ores.push({
        mesh,
        type,
        value: val,
        weight,
        x,
        y,
        z: 0,
        radius: rad,
        isCollected: false
      });
    });

    stateRef.current.ores = ores;

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (!stateRef.current.isGameOver) {
        // Hook FSM
        if (stateRef.current.hookState === 'swinging') {
          stateRef.current.hookAngle += stateRef.current.hookSpeed;
          if (stateRef.current.hookAngle > 1.2 || stateRef.current.hookAngle < -1.2) {
            stateRef.current.hookSpeed *= -1;
          }
          hookGroup.rotation.z = stateRef.current.hookAngle;
          stateRef.current.hookLength = 1.0;
        } else if (stateRef.current.hookState === 'shooting') {
          stateRef.current.hookLength += 0.2;
          const tipX = Math.sin(-stateRef.current.hookAngle) * stateRef.current.hookLength;
          const tipY = -Math.cos(-stateRef.current.hookAngle) * stateRef.current.hookLength;

          // Check collisions with ores
          for (let ore of stateRef.current.ores) {
            if (!ore.isCollected) {
              const d = Math.hypot(tipX - ore.x, tipY - ore.y);
              if (d < ore.radius + 0.3) {
                // Hooked!
                stateRef.current.hookTargetItem = ore;
                stateRef.current.hookState = 'retracting';
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                break;
              }
            }
          }

          if (stateRef.current.hookLength > 12) {
            stateRef.current.hookState = 'retracting';
          }
        } else if (stateRef.current.hookState === 'retracting') {
          const w = stateRef.current.hookTargetItem ? stateRef.current.hookTargetItem.weight : 0.5;
          const retractSpeed = Math.max(0.05, 0.22 / w);
          stateRef.current.hookLength -= retractSpeed;

          if (stateRef.current.hookTargetItem) {
            const tipX = Math.sin(-stateRef.current.hookAngle) * stateRef.current.hookLength;
            const tipY = -Math.cos(-stateRef.current.hookAngle) * stateRef.current.hookLength;
            stateRef.current.hookTargetItem.mesh.position.set(tipX, tipY, 0);
          }

          if (stateRef.current.hookLength <= 1.0) {
            // Reeled in completely
            if (stateRef.current.hookTargetItem) {
              const item = stateRef.current.hookTargetItem;
              item.isCollected = true;
              scene.remove(item.mesh);
              stateRef.current.goldScore += item.value;
              setGoldScore(stateRef.current.goldScore);
              stateRef.current.hookTargetItem = null;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

              if (stateRef.current.goldScore >= targetGold) {
                stateRef.current.isGameOver = true;
                setIsGameOver(true);
                const r = 260;
                setRewardSns(r);
                onReward(r);
              }
            }
            stateRef.current.hookState = 'swinging';
          }
        }

        // Scale hook visual length
        lineMesh.scale.y = stateRef.current.hookLength;
        lineMesh.position.y = -stateRef.current.hookLength / 2;
        clawMesh.position.y = -stateRef.current.hookLength;
      }

      renderer.render(scene, camera);
    };

    animate();

    const timer = setInterval(() => {
      if (stateRef.current.isGameOver) return;
      stateRef.current.timeLeft -= 1;
      setTimeLeft(stateRef.current.timeLeft);

      if (stateRef.current.timeLeft <= 0) {
        stateRef.current.isGameOver = true;
        setIsGameOver(true);
        const r = Math.min(260, 50 + Math.floor(stateRef.current.goldScore / 25));
        setRewardSns(r);
        onReward(r);
      }
    }, 1000);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, onReward, playSfx]);

  const handleShootHook = () => {
    if (stateRef.current.hookState === 'swinging' && !stateRef.current.isGameOver) {
      stateRef.current.hookState = 'shooting';
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handleUseTnt = () => {
    if (stateRef.current.tntCount > 0 && stateRef.current.hookTargetItem) {
      stateRef.current.tntCount -= 1;
      setTntCount(stateRef.current.tntCount);
      // Destroy hooked item instantly to reel in fast
      stateRef.current.hookTargetItem.mesh.visible = false;
      stateRef.current.hookTargetItem.isCollected = true;
      stateRef.current.hookTargetItem = null;
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-sm">
          <Coins size={16} className="text-amber-400" />
          <span className="text-xs text-amber-300 font-bold">
            ${goldScore} / ${targetGold}
          </span>
          <span className="text-[10px] text-slate-400">
            ⏳ {timeLeft}s
          </span>
        </div>
      </div>

      {/* Mobile Controls: Shoot Hook & TNT Bomb */}
      <div className="absolute bottom-6 left-4 right-4 flex items-center justify-center gap-3 z-10">
        <button
          onClick={handleShootHook}
          className="flex-1 max-w-xs py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-base uppercase rounded-sm border border-amber-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
        >
          <Pickaxe size={20} />
          <span>{isKo ? '갈고리 사출 (LAUNCH)' : 'LAUNCH CLAW'}</span>
        </button>
        <button
          onClick={handleUseTnt}
          className="py-4 px-5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase rounded-sm border border-red-400 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Bomb size={18} />
          <span>TNT x{tntCount}</span>
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest">
              {goldScore >= targetGold ? (isKo ? '🏆 황금 광산 정복!' : '🏆 GOLD RUSH CLEARED!') : (isKo ? '⏳ 시간 종료' : '⏳ TIME OVER')}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '채굴 총액' : 'Total Gold'}</span>
                <span className="font-bold text-amber-300">${goldScore}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                <span>{isKo ? '획득 SNS 보상' : 'Earned SNS'}</span>
                <span>+{rewardSns} SNS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all"
              >
                {isKo ? '보상 수령 및 복귀' : 'Claim & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

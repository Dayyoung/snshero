import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Zap, Sparkles, ArrowLeft, Trophy, Crosshair, Award, Flame, Utensils } from 'lucide-react';
import { CardData } from '../types';

interface VoxelPixelOvercookedGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelPixelOvercookedGame: React.FC<VoxelPixelOvercookedGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [heldItem, setHeldItem] = useState<string>('none');
  const [currentOrder, setCurrentOrder] = useState<string>('Burger');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posZ: 0,
    rotY: 0,
    score: 0,
    timeLeft: 60,
    heldItem: 'none' as 'none' | 'meat' | 'cooked_meat' | 'bread' | 'burger',
    currentOrder: 'Burger',
    keys: { w: false, s: false, a: false, d: false },
    stations: {
      meatDispenser: { x: -6, z: -4 },
      breadDispenser: { x: -6, z: 4 },
      pan: { x: 0, z: -6, cooking: false, timer: 0 },
      plate: { x: 6, z: 0, hasBread: false, hasMeat: false },
      delivery: { x: 0, z: 6 }
    },
    isGameOver: false,
    isVictory: false
  });

  const interactStation = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory) return;

    // Check Meat Dispenser
    if (Math.hypot(s.posX - s.stations.meatDispenser.x, s.posZ - s.stations.meatDispenser.z) < 2.5) {
      if (s.heldItem === 'none') {
        s.heldItem = 'meat';
        setHeldItem('생고기 (Meat)');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
      return;
    }

    // Check Bread Dispenser
    if (Math.hypot(s.posX - s.stations.breadDispenser.x, s.posZ - s.stations.breadDispenser.z) < 2.5) {
      if (s.heldItem === 'none') {
        s.heldItem = 'bread';
        setHeldItem('빵 (Bread)');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
      return;
    }

    // Check Pan
    if (Math.hypot(s.posX - s.stations.pan.x, s.posZ - s.stations.pan.z) < 2.5) {
      if (s.heldItem === 'meat' && !s.stations.pan.cooking) {
        s.heldItem = 'none';
        setHeldItem('none');
        s.stations.pan.cooking = true;
        s.stations.pan.timer = 3.0; // cook 3s
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      } else if (s.heldItem === 'none' && s.stations.pan.cooking && s.stations.pan.timer <= 0) {
        s.stations.pan.cooking = false;
        s.heldItem = 'cooked_meat';
        setHeldItem('구운 패티 (Cooked Meat)');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
      return;
    }

    // Check Plate assembly
    if (Math.hypot(s.posX - s.stations.plate.x, s.posZ - s.stations.plate.z) < 2.5) {
      if (s.heldItem === 'bread') {
        s.stations.plate.hasBread = true;
        s.heldItem = 'none';
        setHeldItem('none');
      } else if (s.heldItem === 'cooked_meat') {
        s.stations.plate.hasMeat = true;
        s.heldItem = 'none';
        setHeldItem('none');
      }

      if (s.stations.plate.hasBread && s.stations.plate.hasMeat && s.heldItem === 'none') {
        s.stations.plate.hasBread = false;
        s.stations.plate.hasMeat = false;
        s.heldItem = 'burger';
        setHeldItem('완성된 수제 버거 🍔');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      }
      return;
    }

    // Check Delivery table
    if (Math.hypot(s.posX - s.stations.delivery.x, s.posZ - s.stations.delivery.z) < 2.5) {
      if (s.heldItem === 'burger') {
        s.heldItem = 'none';
        setHeldItem('none');
        s.score += 50;
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

        if (s.score >= 150) {
          s.isVictory = true;
          setIsVictory(true);
          const reward = 60 + Math.floor(s.score / 10);
          setRewardSns(reward);
          onReward(reward);
        }
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffeedd);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(0, 16, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    // Kitchen Floor
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xeeccaa });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    // Station Counters
    const counterMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    const addStation = (x: number, z: number, color: number) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 2.5), new THREE.MeshLambertMaterial({ color }));
      c.position.set(x, 0.6, z);
      scene.add(c);
    };

    addStation(-6, -4, 0xcc4444); // Meat
    addStation(-6, 4, 0xddaa44);  // Bread
    addStation(0, -6, 0x444444);  // Pan
    addStation(6, 0, 0xffffff);   // Plate
    addStation(0, 6, 0x44aa44);   // Delivery

    // Chef Mesh
    const chef = new THREE.Group();
    const chefBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    chefBody.position.y = 0.7;
    chef.add(chefBody);

    const chefHat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    chefHat.position.y = 1.8;
    chef.add(chefHat);

    scene.add(chef);

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === ' ' || k === 'e') interactStation();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        // Timer
        s.timeLeft -= dt;
        setTimeLeft(Math.max(0, Math.ceil(s.timeLeft)));
        if (s.timeLeft <= 0) {
          s.isGameOver = true;
          setIsGameOver(true);
        }

        // Pan cooking timer
        if (s.stations.pan.cooking && s.stations.pan.timer > 0) {
          s.stations.pan.timer -= dt;
        }

        // Chef Movement
        const vx = (s.keys.d ? 1 : 0) - (s.keys.a ? 1 : 0);
        const vz = (s.keys.s ? 1 : 0) - (s.keys.w ? 1 : 0);
        s.posX += vx * 12 * dt;
        s.posZ += vz * 12 * dt;
        s.posX = Math.max(-7, Math.min(7, s.posX));
        s.posZ = Math.max(-7, Math.min(7, s.posZ));

        chef.position.set(s.posX, 0, s.posZ);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white select-none overflow-hidden flex flex-col font-sans">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Top HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Score & Time Left */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="text-yellow-400 font-bold text-xs">
            🪙 SCORE: {score}/150
          </div>

          <div className="text-rose-400 font-bold text-xs">
            ⏱️ {timeLeft}초
          </div>

          <div className="bg-amber-950 border border-amber-500/40 px-2 py-0.5 rounded text-amber-300 text-xs font-bold">
            손에 든 아이템: {heldItem}
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <button
            onPointerDown={() => (gameStateRef.current.keys.w = true)}
            onPointerUp={() => (gameStateRef.current.keys.w = false)}
            className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
          >
            ▲
          </button>
          <div className="flex gap-1">
            <button
              onPointerDown={() => (gameStateRef.current.keys.a = true)}
              onPointerUp={() => (gameStateRef.current.keys.a = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ◀
            </button>
            <button
              onPointerDown={() => (gameStateRef.current.keys.s = true)}
              onPointerUp={() => (gameStateRef.current.keys.s = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ▼
            </button>
            <button
              onPointerDown={() => (gameStateRef.current.keys.d = true)}
              onPointerUp={() => (gameStateRef.current.keys.d = false)}
              className="w-14 h-12 bg-slate-800/90 text-white rounded-xl border border-slate-600 font-bold flex items-center justify-center"
            >
              ▶
            </button>
          </div>
        </div>

        <button
          onClick={interactStation}
          className="w-20 h-20 bg-amber-600/90 text-white rounded-2xl border-2 border-amber-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl pointer-events-auto"
        >
          <Utensils size={24} />
          <span>상호작용 [E]</span>
        </button>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '최고의 셰프 VICTORY' : '영업 종료! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '모든 주문을 성공적으로 완벽 서빙하여 미슐랭 스타를 획득했습니다!'
                : '제한 시간이 종료되었습니다.'}
            </p>

            {isVictory && (
              <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-2xl">
                <span className="text-xs text-slate-400 block uppercase font-bold">REWARD</span>
                <span className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
                  <Sparkles size={20} /> +{rewardSns} SNS
                </span>
              </div>
            )}

            <button
              onClick={onExit}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              {language === 'ko' ? '확인 및 나가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

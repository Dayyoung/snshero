import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Flame, Compass } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSkateboardStreetGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSkateboardStreetGame: React.FC<VoxelSkateboardStreetGameProps> = ({
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
  const [distance, setDistance] = useState<number>(0);
  const [totalGoal] = useState<number>(2000);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [trickText, setTrickText] = useState<string>('');
  const [isGrinding, setIsGrinding] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    posX: 0,
    posY: 0.25,
    posZ: 0,
    targetX: 0,
    speed: 0.75,
    jumpVelY: 0,
    isInAir: false,
    isGrinding: false,
    boardFlipAngle: 0,
    combo: 1,
    score: 0,
    distance: 0,
    isGameOver: false,
    skaterMesh: null as THREE.Group | null,
    boardMesh: null as THREE.Group | null,
    rails: [] as { x: number; zStart: number; zEnd: number; height: number }[],
    obstacles: [] as { x: number; z: number; width: number; height: number; type: 'bin' | 'cone' | 'rail' }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0x38bdf8, 30, 110);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 3.5, 6.5);
    camera.lookAt(0, 1.0, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Sunlight & City Ambience
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // Concrete Skate Street Road (Grey asphalt + painted curb)
    const streetGeo = new THREE.PlaneGeometry(16, 2500);
    const streetMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const streetMesh = new THREE.Mesh(streetGeo, streetMat);
    streetMesh.rotation.x = -Math.PI / 2;
    streetMesh.position.set(0, 0, -1200);
    streetMesh.receiveShadow = !lowSpecMode;
    scene.add(streetMesh);

    // Curbs & Sidewalks
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    for (let side of [-8.2, 8.2]) {
      const curbGeo = new THREE.BoxGeometry(0.6, 0.3, 2500);
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(side, 0.15, -1200);
      scene.add(curb);
    }

    // Voxel Skater & Skateboard
    const skaterRoot = new THREE.Group();

    // Skateboard Deck
    const boardGroup = new THREE.Group();
    const deckGeo = new THREE.BoxGeometry(0.5, 0.05, 1.4);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.12;
    boardGroup.add(deck);

    // Grip Tape (Black top)
    const gripGeo = new THREE.BoxGeometry(0.46, 0.01, 1.36);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, 0.15, 0);
    boardGroup.add(grip);

    // 4 Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12);
    for (let x of [-0.22, 0.22]) {
      for (let z of [-0.45, 0.45]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.08, z);
        boardGroup.add(wheel);
      }
    }

    skaterRoot.add(boardGroup);
    stateRef.current.boardMesh = boardGroup;

    // Voxel Skater Character (Holding cool stance)
    const charGroup = new THREE.Group();
    // Shoes & Pants
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f });
    for (let x of [-0.15, 0.15]) {
      const legGeo = new THREE.BoxGeometry(0.18, 0.6, 0.2);
      const leg = new THREE.Mesh(legGeo, pantsMat);
      leg.position.set(x, 0.45, (x < 0 ? -0.2 : 0.2));
      charGroup.add(leg);
    }

    // Hoodie Torso
    const torsoGeo = new THREE.BoxGeometry(0.45, 0.65, 0.3);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 1.05, 0);
    charGroup.add(torso);

    // Head & Cap
    const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.5, 0);
    charGroup.add(head);

    const capGeo = new THREE.BoxGeometry(0.38, 0.12, 0.45);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x6366f1 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 1.68, -0.05);
    charGroup.add(cap);

    charGroup.rotation.y = Math.PI / 2.8; // Sideway skate stance
    skaterRoot.add(charGroup);

    skaterRoot.position.set(0, 0.25, 0);
    scene.add(skaterRoot);
    stateRef.current.skaterMesh = skaterRoot;

    // Procedural Skate Park Props (Grind Rails, Stair Sets, Cones, Trash Bins)
    const rails: { x: number; zStart: number; zEnd: number; height: number }[] = [];
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 });

    for (let z = -50; z > -2000; z -= 75) {
      // Grind Rail in center or sides
      const rx = (Math.random() - 0.5) * 6.0;
      const railLength = 18;
      const railGeo = new THREE.CylinderGeometry(0.06, 0.06, railLength, 8);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(rx, 0.6, z);
      scene.add(rail);

      // Support legs for rail
      for (let offset of [-railLength / 2 + 1, 0, railLength / 2 - 1]) {
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
        const leg = new THREE.Mesh(legGeo, railMat);
        leg.position.set(rx, 0.3, z + offset);
        scene.add(leg);
      }

      rails.push({ x: rx, zStart: z + railLength / 2, zEnd: z - railLength / 2, height: 0.6 });
    }
    stateRef.current.rails = rails;

    // Traffic Cones & Funboxes
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    for (let z = -30; z > -2000; z -= 40) {
      const cx = (Math.random() - 0.5) * 8.0;
      const coneGeo = new THREE.ConeGeometry(0.25, 0.6, 8);
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(cx, 0.3, z);
      scene.add(cone);
    }

    // Finish Line Arch at z = -2000
    const finishGeo = new THREE.BoxGeometry(14, 5, 0.8);
    const finishMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const finishArch = new THREE.Mesh(finishGeo, finishMat);
    finishArch.position.set(0, 2.5, -2000);
    scene.add(finishArch);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const state = stateRef.current;

      if (!state.isGameOver) {
        // Forward movement
        state.posZ -= state.speed * 60 * delta * 2.2;
        const currDist = Math.min(2000, Math.floor(-state.posZ));
        state.distance = currDist;
        setDistance(currDist);

        // Horizontal Carving / Steer
        state.posX += (state.targetX - state.posX) * 0.12;

        // Jump & Gravity Physics
        if (state.isInAir) {
          state.posY += state.jumpVelY * delta * 60;
          state.jumpVelY -= 0.015 * (delta * 60);

          // Board Flip Animation in Air
          if (state.boardMesh && state.boardFlipAngle > 0) {
            state.boardMesh.rotation.z += delta * 14.0;
            state.boardFlipAngle -= delta * 14.0;
          }

          // Check landing or Grind
          let landedOnRail = false;
          for (let rail of state.rails) {
            if (state.posZ <= rail.zStart && state.posZ >= rail.zEnd) {
              if (Math.abs(state.posX - rail.x) < 0.6 && Math.abs(state.posY - rail.height) < 0.3) {
                // Successfully locked into rail grind!
                landedOnRail = true;
                state.isGrinding = true;
                setIsGrinding(true);
                state.posY = rail.height + 0.15;
                state.isInAir = false;
                state.jumpVelY = 0;
                state.combo = Math.min(8, state.combo + 1);
                state.score += 25 * state.combo;
                setComboMultiplier(state.combo);
                setScore(state.score);
                setTrickText(isKo ? `⚡ 레일 50-50 그라인드! (x${state.combo})` : `⚡ 50-50 RAIL GRIND! (x${state.combo})`);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
                break;
              }
            }
          }

          if (!landedOnRail && state.posY <= 0.25) {
            // Landed back on ground
            state.posY = 0.25;
            state.isInAir = false;
            state.jumpVelY = 0;
            if (state.boardMesh) state.boardMesh.rotation.z = 0;
            state.isGrinding = false;
            setIsGrinding(false);
          }
        } else if (state.isGrinding) {
          // Verify still on rail
          let stillOnRail = false;
          for (let rail of state.rails) {
            if (state.posZ <= rail.zStart && state.posZ >= rail.zEnd) {
              if (Math.abs(state.posX - rail.x) < 0.8) {
                stillOnRail = true;
                state.score += 3 * state.combo;
                setScore(state.score);
                break;
              }
            }
          }
          if (!stillOnRail) {
            state.isGrinding = false;
            setIsGrinding(false);
            state.posY = 0.25;
          }
        }

        // Apply Skater Root
        if (skaterRoot) {
          skaterRoot.position.set(state.posX, state.posY, state.posZ);
          // Slight board tilt when carving
          const carveTilt = (state.targetX - state.posX) * 0.2;
          skaterRoot.rotation.z = THREE.MathUtils.lerp(skaterRoot.rotation.z, carveTilt, 0.1);
        }

        // Camera Follow
        camera.position.set(state.posX * 0.7, state.posY + 2.8, state.posZ + 6.0);
        camera.lookAt(state.posX, state.posY + 1.0, state.posZ - 12);

        // Check Goal Finish Line
        if (currDist >= 2000 && !state.isGameOver) {
          state.isGameOver = true;
          setIsGameOver(true);
          const earnedSns = Math.min(260, Math.max(45, Math.floor(state.score * 0.3 + 40)));
          setRewardSns(earnedSns);
          onReward(earnedSns);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize
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
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, isKo, playSfx]);

  // Touch Drag Carve
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isGameOver) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const normX = (clientX / window.innerWidth - 0.5) * 2;
    stateRef.current.targetX = normX * 6.5;
  };

  // Ollie Jump Action
  const handleOllie = () => {
    const state = stateRef.current;
    if (state.isInAir || isGameOver) return;
    state.isInAir = true;
    state.isGrinding = false;
    state.jumpVelY = 0.28;
    state.score += 50 * state.combo;
    setScore(state.score);
    setTrickText(isKo ? `🛹 올리 점프! (+${50 * state.combo}P)` : `🛹 OLLIE JUMP! (+${50 * state.combo}P)`);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
  };

  // Kickflip 360 Action (while in air)
  const handleKickflip = () => {
    const state = stateRef.current;
    if (!state.isInAir || isGameOver) return;
    state.boardFlipAngle = Math.PI * 2;
    state.combo = Math.min(8, state.combo + 1);
    state.score += 200 * state.combo;
    setComboMultiplier(state.combo);
    setScore(state.score);
    setTrickText(isKo ? `💫 킥플립 360 트릭! (+${200 * state.combo}P)` : `💫 KICKFLIP 360! (+${200 * state.combo}P)`);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none"
      onTouchMove={handleTouchMove}
      onMouseMove={handleTouchMove}
    >
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-sky-500/40 px-3 py-1.5 rounded-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs text-sky-300 font-bold">
            {isKo ? `점수: ${score}P` : `Score: ${score}`}
          </span>
          <span className="text-[10px] text-amber-400 font-bold">
            [x{comboMultiplier} COMBO]
          </span>
          <span className="text-[10px] text-slate-400">
            {distance}m / {totalGoal}m
          </span>
        </div>
      </div>

      {/* Grind Status Banner */}
      {isGrinding && (
        <div className="absolute top-14 left-4 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 px-2.5 py-1 rounded-sm text-xs font-black animate-pulse z-10 pointer-events-none">
          <Flame size={14} />
          <span>{isKo ? '🔥 50-50 레일 그라인드 중!!' : '🔥 50-50 RAIL GRINDING!'}</span>
        </div>
      )}

      {/* Trick Announcement Banner */}
      {trickText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-sky-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg z-10 pointer-events-none animate-bounce">
          {trickText}
        </div>
      )}

      {/* Mobile-First Controls */}
      <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center gap-2.5 z-10">
        <div className="w-full max-w-sm flex gap-2">
          <button
            onClick={handleOllie}
            className="flex-1 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 border border-sky-300 text-slate-950 font-black text-base rounded-sm active:scale-95 shadow-xl flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            <Zap size={20} />
            <span>{isKo ? '🛹 올리 점프 (OLLIE)' : '🛹 OLLIE JUMP'}</span>
          </button>
          <button
            onClick={handleKickflip}
            className="flex-1 py-4 bg-slate-900/90 border border-amber-400 text-amber-300 font-black text-base rounded-sm active:scale-95 shadow-xl flex items-center justify-center gap-1.5 uppercase cursor-pointer"
          >
            <Sparkles size={18} />
            <span>{isKo ? '💫 킥플립 360' : '💫 KICKFLIP'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-300 bg-slate-900/80 px-3 py-0.5 rounded-sm border border-slate-700">
          {isKo ? '좌우 드래그로 카빙하고 올리 점프로 레일에 올라타 그라인드 콤보를 만드세요!' : 'Drag to steer, pop Ollie jumps onto rails for epic grind combos!'}
        </p>
      </div>

      {/* Game Over Summary Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-sky-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-sky-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-sky-400 uppercase tracking-widest">
              {isKo ? '🏆 스케이트보드 완주!' : '🏆 STREET SKATE FINISHED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '최대 콤보 배수' : 'Max Multiplier'}</span>
                <span className="font-bold text-amber-300">x{comboMultiplier}</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '트릭 총점' : 'Total Score'}</span>
                <span className="font-bold text-indigo-300">{score} PTS</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                <span>{isKo ? '획득 SNS 보상' : 'Earned SNS'}</span>
                <span>+{rewardSns} SNS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all cursor-pointer"
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

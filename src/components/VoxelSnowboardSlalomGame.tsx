import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Flame, Snowflake, ShieldCheck } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSnowboardSlalomGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSnowboardSlalomGame: React.FC<VoxelSnowboardSlalomGameProps> = ({
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
  const [gatesPassed, setGatesPassed] = useState<number>(0);
  const [totalGates, setTotalGates] = useState<number>(25);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [trickText, setTrickText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    posX: 0,
    posY: 0.25,
    posZ: 0,
    targetX: 0,
    speed: 0.85,
    jumpVelY: 0,
    isInAir: false,
    carveAngle: 0,
    score: 0,
    distance: 0,
    gatesPassed: 0,
    isGameOver: false,
    riderMesh: null as THREE.Group | null,
    boardMesh: null as THREE.Group | null,
    gates: [] as { x: number; z: number; color: 'red' | 'blue'; passed: boolean; missed: boolean }[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe);
    scene.fog = new THREE.Fog(0xdbeafe, 40, 150);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 3.8, 7.0);
    camera.lookAt(0, 1.2, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Alpine Sunlight
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x93c5fd, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(30, 60, 30);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // Snow Powder Mountain Slope
    const slopeGeo = new THREE.PlaneGeometry(30, 2500);
    const slopeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const slopeMesh = new THREE.Mesh(slopeGeo, slopeMat);
    slopeMesh.rotation.x = -Math.PI / 2;
    slopeMesh.position.set(0, 0, -1200);
    slopeMesh.receiveShadow = !lowSpecMode;
    scene.add(slopeMesh);

    // Pine Trees along the slopes
    const treeGeo = new THREE.ConeGeometry(1.2, 3.5, 6);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x166534 });
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });

    for (let z = -20; z > -2200; z -= 35) {
      for (let side of [-11 - Math.random() * 4, 11 + Math.random() * 4]) {
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.5;
        treeGroup.add(trunk);

        const crown = new THREE.Mesh(treeGeo, treeMat);
        crown.position.y = 2.4;
        treeGroup.add(crown);

        treeGroup.position.set(side, 0, z);
        scene.add(treeGroup);
      }
    }

    // Voxel Snowboarder & Board
    const riderRoot = new THREE.Group();

    // Snowboard
    const boardGroup = new THREE.Group();
    const boardGeo = new THREE.BoxGeometry(0.55, 0.04, 1.6);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.1;
    boardGroup.add(board);

    // Bindings
    const bindMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
    for (let z of [-0.35, 0.35]) {
      const bindGeo = new THREE.BoxGeometry(0.4, 0.08, 0.2);
      const bind = new THREE.Mesh(bindGeo, bindMat);
      bind.position.set(0, 0.14, z);
      boardGroup.add(bind);
    }

    riderRoot.add(boardGroup);
    stateRef.current.boardMesh = boardGroup;

    // Voxel Rider (Ski Jacket & Goggles)
    const charGroup = new THREE.Group();
    // Winter Pants
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    for (let x of [-0.15, 0.15]) {
      const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.22);
      const leg = new THREE.Mesh(legGeo, pantsMat);
      leg.position.set(x, 0.45, (x < 0 ? -0.2 : 0.2));
      charGroup.add(leg);
    }

    // Jacket Torso (Bright Cyan / Orange)
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.35);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 1.05, 0);
    charGroup.add(torso);

    // Helmet & Snow Goggles
    const helmGeo = new THREE.BoxGeometry(0.38, 0.35, 0.38);
    const helmMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.set(0, 1.55, 0);
    charGroup.add(helm);

    const goggleGeo = new THREE.BoxGeometry(0.32, 0.12, 0.12);
    const goggleMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
    const goggle = new THREE.Mesh(goggleGeo, goggleMat);
    goggle.position.set(0, 1.55, -0.18);
    charGroup.add(goggle);

    charGroup.rotation.y = Math.PI / 2.6; // Snowboard stance
    riderRoot.add(charGroup);

    riderRoot.position.set(0, 0.25, 0);
    scene.add(riderRoot);
    stateRef.current.riderMesh = riderRoot;

    // Slalom Gates (Alternating Red and Blue paired poles)
    const gatesList: { x: number; z: number; color: 'red' | 'blue'; passed: boolean; missed: boolean }[] = [];
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });

    let gateCount = 0;
    for (let z = -80; z > -2000; z -= 80) {
      gateCount++;
      const isRed = gateCount % 2 === 1;
      const gx = isRed ? -3.5 - Math.random() * 2.0 : 3.5 + Math.random() * 2.0;
      const mat = isRed ? redMat : blueMat;

      // Left Pole
      const poleL = new THREE.Mesh(poleGeo, mat);
      poleL.position.set(gx - 1.8, 1.1, z);
      scene.add(poleL);

      // Right Pole
      const poleR = new THREE.Mesh(poleGeo, mat);
      poleR.position.set(gx + 1.8, 1.1, z);
      scene.add(poleR);

      // Gate Flag Banner connecting poles
      const bannerGeo = new THREE.PlaneGeometry(3.6, 0.5);
      const banner = new THREE.Mesh(bannerGeo, mat);
      banner.position.set(gx, 1.8, z);
      scene.add(banner);

      gatesList.push({ x: gx, z, color: isRed ? 'red' : 'blue', passed: false, missed: false });
    }
    stateRef.current.gates = gatesList;
    setTotalGates(gatesList.length);

    // Finish Arch at z = -2000
    const finishArch = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 0.8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
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
        setSpeedKmh(Math.floor(state.speed * 110));

        // Lateral Carving
        state.posX += (state.targetX - state.posX) * 0.14;

        // In Air Jump Physics
        if (state.isInAir) {
          state.posY += state.jumpVelY * delta * 60;
          state.jumpVelY -= 0.014 * (delta * 60);

          if (state.posY <= 0.25) {
            state.posY = 0.25;
            state.isInAir = false;
            state.jumpVelY = 0;
            if (state.boardMesh) state.boardMesh.rotation.z = 0;
          }
        }

        // Apply Rider Position & Carving Tilt
        if (riderRoot) {
          riderRoot.position.set(state.posX, state.posY, state.posZ);
          const tilt = (state.targetX - state.posX) * 0.25;
          riderRoot.rotation.z = THREE.MathUtils.lerp(riderRoot.rotation.z, tilt, 0.15);
        }

        // Check Slalom Gates
        state.gates.forEach(gate => {
          if (!gate.passed && !gate.missed && state.posZ <= gate.z) {
            if (Math.abs(state.posX - gate.x) < 2.0) {
              // Passed cleanly through gate!
              gate.passed = true;
              state.gatesPassed += 1;
              state.score += 100;
              state.speed = Math.min(1.2, state.speed + 0.04);
              setGatesPassed(state.gatesPassed);
              setScore(state.score);
              setTrickText(isKo ? `🎿 슬라롬 게이트 통과! (+100P & 가속)` : `🎿 SLALOM GATE PASSED! (+100P)`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            } else {
              gate.missed = true;
            }
          }
        });

        // Camera Follow
        camera.position.set(state.posX * 0.6, state.posY + 3.4, state.posZ + 6.5);
        camera.lookAt(state.posX, state.posY + 1.1, state.posZ - 12);

        // Finish Line Check
        if (currDist >= 2000 && !state.isGameOver) {
          state.isGameOver = true;
          setIsGameOver(true);
          const earnedSns = Math.min(260, Math.max(45, Math.floor(state.score * 0.28 + state.gatesPassed * 4)));
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
    stateRef.current.targetX = normX * 8.5;
  };

  // Jump Snow Kicker Action
  const handleJumpTrick = () => {
    const state = stateRef.current;
    if (state.isInAir || isGameOver) return;
    state.isInAir = true;
    state.jumpVelY = 0.3;
    state.score += 250;
    setScore(state.score);
    if (state.boardMesh) {
      state.boardMesh.rotation.z = Math.PI / 4; // Mute grab tilt
    }
    setTrickText(isKo ? '❄️ 뮬트 그랩 에어 트릭 (+250P)!!' : '❄️ MUTE GRAB AIR TRICK (+250P)!!');
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

        <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs text-cyan-300 font-bold">
            {isKo ? `점수: ${score}P` : `Score: ${score}`}
          </span>
          <span className="text-[10px] text-cyan-400 font-bold">
            [{gatesPassed}/{totalGates} GATES]
          </span>
          <span className="text-[10px] text-slate-400">
            {distance}m / {totalGoal}m
          </span>
        </div>
      </div>

      {/* Gate Pass & Trick Notification */}
      {trickText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-cyan-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg z-10 pointer-events-none animate-bounce">
          {trickText}
        </div>
      )}

      {/* Mobile-First Controls */}
      <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center gap-2.5 z-10">
        <div className="w-full max-w-sm flex gap-2">
          <button
            onClick={handleJumpTrick}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 border border-cyan-300 text-slate-950 font-black text-base rounded-sm active:scale-95 shadow-xl flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            <Snowflake size={20} />
            <span>{isKo ? '🏂 뮬트 그랩 점프 트릭' : '🏂 MUTE GRAB TRICK'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-300 bg-slate-900/80 px-3 py-0.5 rounded-sm border border-slate-700">
          {isKo ? '좌우 드래그로 설원을 카빙하며 레드/블루 슬라롬 게이트를 연속 통과하세요!' : 'Drag left/right to carve through Red and Blue slalom gates!'}
        </p>
      </div>

      {/* Game Over Summary Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-cyan-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-cyan-400 uppercase tracking-widest">
              {isKo ? '🏆 스노보드 슬라롬 완주!' : '🏆 SLALOM FINISHED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '통과한 게이트' : 'Gates Passed'}</span>
                <span className="font-bold text-cyan-300">{gatesPassed} / {totalGates}</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '슬라롬 총점' : 'Total Score'}</span>
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
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all cursor-pointer"
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

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSnowboardExtremeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSnowboardExtremeGame: React.FC<VoxelSnowboardExtremeGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState<number>(0);
  const [maxDistance] = useState<number>(1000);
  const [boost, setBoost] = useState<number>(100);
  const [trickScore, setTrickScore] = useState<number>(0);
  const [rank, setRank] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posY: 0,
    posZ: 0,
    speedZ: 30,
    rotY: 0,
    rotX: 0,
    airTime: 0,
    isAirborne: false,
    boost: 100,
    trickScore: 0,
    keys: { a: false, d: false, space: false, boost: false },
    trees: [] as { x: number; z: number; mesh: THREE.Mesh }[],
    aiRacers: [] as { x: number; z: number; speed: number; mesh: THREE.Group }[],
    isGameOver: false,
    isVictory: false
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xddeeff);
    scene.fog = new THREE.FogExp2(0xddeeff, 0.012);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Downhill Slope Mountain Terrain
    const slopeGeo = new THREE.PlaneGeometry(120, 1200, 32, 64);
    slopeGeo.rotateX(-Math.PI / 2);
    const slopeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const slope = new THREE.Mesh(slopeGeo, slopeMat);
    scene.add(slope);

    // Create Snowboarder Mesh
    const boarder = new THREE.Group();

    // Snowboard
    const boardGeo = new THREE.BoxGeometry(1.0, 0.1, 3.0);
    const boardMat = new THREE.MeshLambertMaterial({ color: 0xff3355 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.1;
    boarder.add(board);

    // Character Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2288ff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    boarder.add(body);

    // Character Head & Goggles
    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffcc88 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.0;
    boarder.add(head);

    const goggleGeo = new THREE.BoxGeometry(0.62, 0.2, 0.2);
    const goggleMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const goggle = new THREE.Mesh(goggleGeo, goggleMat);
    goggle.position.set(0, 2.0, -0.3);
    boarder.add(goggle);

    scene.add(boarder);

    // Spawn Pine Trees & Obstacles along slope
    const treeGeo = new THREE.ConeGeometry(1.5, 4, 6);
    const treeMat = new THREE.MeshLambertMaterial({ color: 0x116633 });
    for (let i = 0; i < 60; i++) {
      const tMesh = new THREE.Mesh(treeGeo, treeMat);
      const tx = (Math.random() - 0.5) * 80;
      const tz = -i * 18 - 20;
      tMesh.position.set(tx, 2, tz);
      scene.add(tMesh);
      gameStateRef.current.trees.push({ x: tx, z: tz, mesh: tMesh });
    }

    // Spawn 7 AI Racers
    for (let i = 0; i < 7; i++) {
      const aiGroup = new THREE.Group();
      const aiBoard = new THREE.Mesh(boardGeo, new THREE.MeshLambertMaterial({ color: 0x22aa55 }));
      aiGroup.add(aiBoard);
      const aiBody = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0xaa2288 }));
      aiBody.position.y = 1.0;
      aiGroup.add(aiBody);
      const aiX = (Math.random() - 0.5) * 40;
      const aiZ = -10 - i * 5;
      aiGroup.position.set(aiX, 0, aiZ);
      scene.add(aiGroup);
      gameStateRef.current.aiRacers.push({
        x: aiX,
        z: aiZ,
        speed: 26 + Math.random() * 8,
        mesh: aiGroup
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === ' ' || k === 'w' || k === 'arrowup') {
        // Jump
        const s = gameStateRef.current;
        if (!s.isAirborne) {
          s.isAirborne = true;
          s.airTime = 0.8;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
      }
      if (k === 'shift') gameStateRef.current.keys.boost = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
      if (k === 'shift') gameStateRef.current.keys.boost = false;
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
        // Carving Left / Right
        if (s.keys.a) s.posX -= 22 * dt;
        if (s.keys.d) s.posX += 22 * dt;
        s.posX = Math.max(-45, Math.min(45, s.posX));

        // Boost Management
        let curSpeed = s.speedZ;
        if (s.keys.boost && s.boost > 0) {
          curSpeed = 50;
          s.boost = Math.max(0, s.boost - 30 * dt);
          setBoost(Math.round(s.boost));
        } else {
          s.boost = Math.min(100, s.boost + 10 * dt);
          setBoost(Math.round(s.boost));
        }

        s.posZ -= curSpeed * dt;
        setDistance(Math.min(maxDistance, Math.floor(-s.posZ)));

        // Jump / Stunt Physics
        if (s.isAirborne) {
          s.airTime -= dt;
          s.posY = Math.sin((0.8 - s.airTime) / 0.8 * Math.PI) * 4;
          boarder.rotation.y += 8 * dt; // 360 spin
          s.trickScore += Math.floor(100 * dt);
          setTrickScore(s.trickScore);

          if (s.airTime <= 0) {
            s.isAirborne = false;
            s.posY = 0;
            boarder.rotation.y = 0;
            s.boost = Math.min(100, s.boost + 30);
          }
        }

        boarder.position.set(s.posX, s.posY, s.posZ);
        boarder.rotation.z = s.keys.a ? 0.3 : s.keys.d ? -0.3 : 0;

        // Camera Follow
        camera.position.set(s.posX, s.posY + 5, s.posZ + 10);
        camera.lookAt(s.posX, s.posY + 1, s.posZ - 10);

        // Infinite Slope Looping
        slope.position.z = s.posZ - 400;

        // Tree Obstacle Collision Check
        s.trees.forEach(tree => {
          if (Math.abs(tree.z - s.posZ) < 1.5 && Math.abs(tree.x - s.posX) < 1.8 && !s.isAirborne) {
            s.speedZ = 10;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
        });
        s.speedZ = Math.min(32, s.speedZ + 15 * dt);

        // Update AI Racers
        let currentRank = 1;
        s.aiRacers.forEach(ai => {
          ai.z -= ai.speed * dt;
          ai.mesh.position.set(ai.x, 0, ai.z);
          if (ai.z < s.posZ) {
            currentRank += 1;
          }
        });
        setRank(currentRank);

        // Finish Line Check (1000m)
        if (-s.posZ >= maxDistance) {
          s.isVictory = true;
          setIsVictory(true);
          const reward = 50 + (8 - currentRank) * 5 + Math.floor(s.trickScore / 50);
          setRewardSns(reward);
          onReward(reward);
        }
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
  }, [lowSpecMode, maxDistance, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white select-none overflow-hidden flex flex-col font-sans">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Top HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Distance & Rank */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-300">PROGRESS:</span>
            <div className="w-20 sm:w-28 h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${(distance / maxDistance) * 100}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">{distance}m</span>
          </div>

          <div className="bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded text-amber-300 text-xs font-bold">
            RANK #{rank}/8
          </div>

          <div className="text-yellow-400 text-xs font-bold">
            TRICK: {trickScore}
          </div>
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isVictory && (
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

              if (Math.abs(dx) > 10) {
                moved = true;
                gameStateRef.current.keys.a = dx < -10;
                gameStateRef.current.keys.d = dx > 10;
              }
              if (dy < -25) {
                moved = true;
                gameStateRef.current.keys.boost = true;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              gameStateRef.current.keys.a = false;
              gameStateRef.current.keys.d = false;
              gameStateRef.current.keys.boost = false;

              if (!moved) {
                // Tap: Jump Trick
                const s = gameStateRef.current;
                if (!s.isAirborne) {
                  s.isAirborne = true;
                  s.airTime = 0.8;
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                }
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={() => {
            gameStateRef.current.keys.boost = true;
            setTimeout(() => { gameStateRef.current.keys.boost = false; }, 1500);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-cyan-400/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '좌우 드래그: 조향 | 탭: 점프 트릭 | 더블탭/위로: 부스터 (버튼 없음)' : 'Drag L/R: Steer | Tap: Jump Trick | Double Tap/Up: Boost (No Buttons)'}
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-amber-400/20 text-yellow-400">
              <Trophy size={36} />
            </div>

            <h2 className="text-2xl font-black italic uppercase">FINISH! RANK #{rank}</h2>

            <p className="text-xs text-slate-300">
              {rank === 1
                ? '알프스 다운힐을 1위로 완주하고 챔피언 트로피를 차지했습니다!'
                : `${rank}위로 결승선을 통과했습니다! 멋진 다운힐 레이스였습니다.`}
            </p>

            <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 block uppercase font-bold">REWARD</span>
              <span className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
                <Sparkles size={20} /> +{rewardSns} SNS
              </span>
            </div>

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

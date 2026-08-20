import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Compass, Sparkles, Wind, Gauge, ShieldAlert } from 'lucide-react';
import { CardData } from '../types';

interface VoxelWingsuitSkydivingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelWingsuitSkydivingGame: React.FC<VoxelWingsuitSkydivingGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [distance, setDistance] = useState<number>(0);
  const [totalGoal] = useState<number>(3000);
  const [score, setScore] = useState<number>(0);
  const [speedKmh, setSpeedKmh] = useState<number>(180);
  const [ringsPassed, setRingsPassed] = useState<number>(0);
  const [proximityAlert, setProximityAlert] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);
  const [isParachuteOpen, setIsParachuteOpen] = useState<boolean>(false);

  const stateRef = useRef({
    posX: 0,
    posY: 20,
    posZ: 0,
    rotX: 0,
    rotZ: 0,
    targetX: 0,
    targetY: 20,
    speed: 0.8,
    score: 0,
    distance: 0,
    ringsPassed: 0,
    isGameOver: false,
    isParachute: false,
    rings: [] as { mesh: THREE.Group; passed: boolean; z: number; x: number; y: number }[],
    canyonObstacles: [] as { mesh: THREE.Mesh; x: number; z: number; width: number; height: number }[],
    clouds: [] as THREE.Mesh[]
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x70b5ff);
    scene.fog = new THREE.FogExp2(0x70b5ff, 0.008);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 800);
    camera.position.set(0, 22, 6);
    camera.lookAt(0, 20, -20);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Sunlight and Ambient Sky Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x556677, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // Voxel Wingsuit Glider Model
    const diverGroup = new THREE.Group();

    // Helmet & Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.25, -0.6);
    diverGroup.add(head);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.42, 0.15, 0.15);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.25, -0.85);
    diverGroup.add(visor);

    // Torso Suit
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.3, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    diverGroup.add(body);

    // Voxel Wingsuit Fabric Webbing (Left & Right)
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const leftWingGeo = new THREE.BoxGeometry(1.2, 0.05, 1.1);
    const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
    leftWing.position.set(-0.9, 0, 0.1);
    leftWing.rotation.z = -0.1;
    diverGroup.add(leftWing);

    const rightWingGeo = new THREE.BoxGeometry(1.2, 0.05, 1.1);
    const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
    rightWing.position.set(0.9, 0, 0.1);
    rightWing.rotation.z = 0.1;
    diverGroup.add(rightWing);

    // Parachute Backpack
    const packGeo = new THREE.BoxGeometry(0.5, 0.25, 0.6);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 0.25, 0.1);
    diverGroup.add(pack);

    // Deployed Parachute Canopy (hidden initially)
    const chuteCanopyGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 16, 1, false, 0, Math.PI);
    const chuteCanopyMat = new THREE.MeshStandardMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const chuteMesh = new THREE.Mesh(chuteCanopyGeo, chuteCanopyMat);
    chuteMesh.position.set(0, 4.0, 0.5);
    chuteMesh.rotation.x = Math.PI / 2;
    chuteMesh.visible = false;
    diverGroup.add(chuteMesh);

    diverGroup.position.set(0, 20, 0);
    scene.add(diverGroup);

    // Dynamic Canyon Cliffs & Mountain Walls
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.95 });
    const canyonGroup = new THREE.Group();
    scene.add(canyonGroup);

    const canyonBlocks: THREE.Mesh[] = [];
    for (let z = 0; z > -3500; z -= 30) {
      // Left cliff tower
      const leftH = 35 + Math.sin(z * 0.02) * 15;
      const leftGeo = new THREE.BoxGeometry(16, leftH, 28);
      const leftMesh = new THREE.Mesh(leftGeo, cliffMat);
      leftMesh.position.set(-18 - Math.random() * 4, leftH / 2 - 5, z);
      leftMesh.receiveShadow = !lowSpecMode;
      canyonGroup.add(leftMesh);
      canyonBlocks.push(leftMesh);

      // Right cliff tower
      const rightH = 35 + Math.cos(z * 0.02) * 15;
      const rightGeo = new THREE.BoxGeometry(16, rightH, 28);
      const rightMesh = new THREE.Mesh(rightGeo, cliffMat);
      rightMesh.position.set(18 + Math.random() * 4, rightH / 2 - 5, z);
      rightMesh.receiveShadow = !lowSpecMode;
      canyonGroup.add(rightMesh);
      canyonBlocks.push(rightMesh);
    }

    // Canyon Floor (River & Ground)
    const groundGeo = new THREE.PlaneGeometry(200, 4000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x224422, roughness: 0.9 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -5, -2000);
    scene.add(groundMesh);

    // River
    const riverGeo = new THREE.PlaneGeometry(16, 4000);
    const riverMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.rotation.x = -Math.PI / 2;
    riverMesh.position.set(0, -4.9, -2000);
    scene.add(riverMesh);

    // Air Scoring Rings (Glowing Torus rings along route)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });

    const ringsList: { mesh: THREE.Group; passed: boolean; z: number; x: number; y: number }[] = [];

    for (let z = -60; z > -3000; z -= 65) {
      const ringGroup = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(3.2, 0.35, 12, 24);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringGroup.add(ringMesh);

      // Random target position inside canyon gorge
      const rx = (Math.random() - 0.5) * 14;
      const ry = 10 + Math.random() * 16;
      ringGroup.position.set(rx, ry, z);

      scene.add(ringGroup);
      ringsList.push({ mesh: ringGroup, passed: false, z, x: rx, y: ry });
    }
    stateRef.current.rings = ringsList;

    // Finish Line Bullseye Landing Pad at z = -3000
    const padGroup = new THREE.Group();
    const padOuterGeo = new THREE.CylinderGeometry(10, 10, 0.4, 24);
    const padOuterMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const padOuter = new THREE.Mesh(padOuterGeo, padOuterMat);
    padGroup.add(padOuter);

    const padBullGeo = new THREE.CylinderGeometry(4, 4, 0.45, 24);
    const padBullMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const padBull = new THREE.Mesh(padBullGeo, padBullMat);
    padGroup.add(padBull);

    padGroup.position.set(0, -4.7, -3000);
    scene.add(padGroup);

    // Floating Clouds
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 40; i++) {
      const cloudGeo = new THREE.BoxGeometry(10 + Math.random() * 20, 4 + Math.random() * 4, 10 + Math.random() * 15);
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set((Math.random() - 0.5) * 120, 25 + Math.random() * 25, -Math.random() * 3200);
      scene.add(cloud);
    }

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const state = stateRef.current;

      if (!state.isGameOver) {
        // Move Forward
        const speedMultiplier = state.isParachute ? 0.35 : 1.0;
        state.posZ -= state.speed * 60 * speedMultiplier * delta * 2.2;
        const currDistance = Math.min(3000, Math.floor(-state.posZ));
        state.distance = currDistance;
        setDistance(currDistance);

        // Calculate Kmh
        const currentKmh = Math.floor(state.speed * 220 * speedMultiplier);
        setSpeedKmh(currentKmh);

        // Smooth steering towards target position
        state.posX += (state.targetX - state.posX) * 0.08;
        state.posY += (state.targetY - state.posY) * 0.08;

        // Diver Model Pose (Tilt & Bank)
        diverGroup.position.set(state.posX, state.posY, state.posZ);
        const bankAngle = -(state.targetX - state.posX) * 0.4;
        const pitchAngle = (state.targetY - state.posY) * 0.2;
        diverGroup.rotation.z = THREE.MathUtils.lerp(diverGroup.rotation.z, bankAngle, 0.1);
        diverGroup.rotation.x = THREE.MathUtils.lerp(diverGroup.rotation.x, pitchAngle, 0.1);

        // Camera Follow Behind
        camera.position.set(state.posX * 0.6, state.posY + (state.isParachute ? 4 : 2.5), state.posZ + 6);
        camera.lookAt(state.posX, state.posY, state.posZ - 20);

        // Check Air Rings Trigger
        state.rings.forEach(ring => {
          if (!ring.passed && Math.abs(state.posZ - ring.z) < 4.0) {
            const dist = Math.hypot(state.posX - ring.x, state.posY - ring.y);
            if (dist < 4.0) {
              ring.passed = true;
              state.ringsPassed += 1;
              state.score += 150;
              setRingsPassed(state.ringsPassed);
              setScore(state.score);
              setAnnouncement(isKo ? '⚡ 링 통과! (+150P)' : '⚡ RING CLEARED! (+150P)');

              // Flash ring golden
              (ring.mesh.children[0] as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            }
          }
        });

        // Check Proximity Cliff Bonus
        const cliffDist = Math.abs(Math.abs(state.posX) - 10);
        if (cliffDist < 2.5 && state.posZ > -2900) {
          state.score += 1;
          setScore(state.score);
          setProximityAlert(true);
        } else {
          setProximityAlert(false);
        }

        // Parachute Zone at Distance > 2800m
        if (currDistance >= 2800 && !state.isParachute) {
          state.isParachute = true;
          setIsParachuteOpen(true);
          chuteMesh.visible = true;
          setAnnouncement(isKo ? '🪂 낙하산 전개! 과녁에 착지하세요!' : '🪂 PARACHUTE DEPLOYED! LAND ON TARGET!');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        }

        // Touchdown at Distance 3000m
        if (currDistance >= 3000 && !state.isGameOver) {
          state.isGameOver = true;
          setIsGameOver(true);
          const landingDist = Math.hypot(state.posX, state.posY - (-4.7));
          const bonus = Math.max(0, Math.floor((10 - landingDist) * 50));
          const finalScore = state.score + bonus;
          state.score = finalScore;
          setScore(finalScore);

          const earnedSns = Math.min(260, Math.max(40, Math.floor(finalScore * 0.25)));
          setRewardSns(earnedSns);
          onReward(earnedSns);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize Handler
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

  // Touch Steering Controller
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isGameOver) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const normX = (clientX / window.innerWidth - 0.5) * 2;
    const normY = -(clientY / window.innerHeight - 0.5) * 2;

    stateRef.current.targetX = normX * 8.5;
    stateRef.current.targetY = 18 + normY * 8.0;
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
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold"
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
            [{ringsPassed} RINGS]
          </span>
          <span className="text-[10px] text-slate-400">
            {distance}m / {totalGoal}m
          </span>
        </div>
      </div>

      {/* Speed & Proximity Alerts */}
      <div className="absolute top-14 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-sm text-xs font-bold w-fit">
          <Gauge size={14} className="text-emerald-400" />
          <span>{speedKmh} km/h</span>
        </div>

        {proximityAlert && (
          <div className="flex items-center gap-1.5 bg-rose-600/90 text-white px-2.5 py-0.5 rounded-sm text-[11px] font-black animate-pulse w-fit">
            <ShieldAlert size={14} />
            <span>{isKo ? '⚠️ 절벽 초근접 보너스!!' : '⚠️ CLIFF PROXIMITY BONUS!'}</span>
          </div>
        )}
      </div>

      {/* Announcement Toast */}
      {announcement && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-sky-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg animate-bounce pointer-events-none z-10">
          {announcement}
        </div>
      )}

      {/* Mobile-First Touch Guidance */}
      <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center gap-2 z-10 pointer-events-none">
        <div className="bg-slate-900/85 border border-sky-500/40 text-slate-200 px-4 py-2 rounded-sm text-xs flex items-center gap-2">
          <Wind size={16} className="text-sky-400 animate-spin" />
          <span>
            {isParachuteOpen
              ? (isKo ? '🪂 드래그하여 중앙 황금 과녁에 착지하세요!' : '🪂 Drag to land on the center gold target!')
              : (isKo ? '화면을 상하좌우로 드래그하여 링을 통과하고 활공하세요!' : 'Drag screen to steer wingsuit and pass glowing rings!')}
          </span>
        </div>
      </div>

      {/* Game Over Summary Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-sky-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-sky-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-sky-400 uppercase tracking-widest">
              {isKo ? '🏆 3,000m 글라이딩 완주!' : '🏆 3,000M GLIDE COMPLETED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '통과한 링' : 'Rings Cleared'}</span>
                <span className="font-bold text-sky-300">{ringsPassed} 개</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최종 점수' : 'Total Score'}</span>
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

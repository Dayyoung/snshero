import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { ResponsiveCleanHUD } from './ResponsiveCleanHUD';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_skateboard_street') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [totalGoal] = useState<number>(2000);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [trickText, setTrickText] = useState<string>('');
  const [isGrinding, setIsGrinding] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

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
    isPaused: false,
    startTime: Date.now(),
    skaterMesh: null as THREE.Group | null,
    boardMesh: null as THREE.Group | null,
    rails: [] as { x: number; zStart: number; zEnd: number; height: number }[],
    obstacles: [] as { x: number; z: number; width: number; height: number; type: 'bin' | 'cone' | 'rail' }[]
  });

  useEffect(() => {
    stateRef.current.isPaused = isPaused || showTutorial;
  }, [isPaused, showTutorial]);

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
          const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_skateboard_street',
            gameTitle: isKo ? '3D 복셀 스트리트 스케이트보드: 그라인드 마스터' : 'Voxel Street Skateboard: Grind Master',
            durationSeconds,
            score: state.score,
            maxTargetScore: 6000,
            isVictory: true,
            difficulty: 'NORMAL',
            comboCount: state.combo,
            perfectClear: state.combo >= 6
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
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

  const handleRestart = () => {
    setIsGameOver(false);
    setSettlementReceipt(null);
    setScore(0);
    setDistance(0);
    setComboMultiplier(1);
    setTrickText('');
    setIsGrinding(false);

    const state = stateRef.current;
    state.posX = 0;
    state.posY = 0.25;
    state.posZ = 0;
    state.targetX = 0;
    state.jumpVelY = 0;
    state.isInAir = false;
    state.isGrinding = false;
    state.boardFlipAngle = 0;
    state.combo = 1;
    state.score = 0;
    state.distance = 0;
    state.isGameOver = false;
    state.startTime = Date.now();
  };

  // Touch Drag Carve
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isGameOver || isPaused || showTutorial) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const normX = (clientX / window.innerWidth - 0.5) * 2;
    stateRef.current.targetX = normX * 6.5;
  };

  // Ollie Jump Action
  const handleOllie = () => {
    const state = stateRef.current;
    if (state.isInAir || isGameOver || isPaused || showTutorial) return;
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
    if (!state.isInAir || isGameOver || isPaused || showTutorial) return;
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

      {/* Responsive Clean HUD */}
      <ResponsiveCleanHUD
        gameTitle={isKo ? '복셀 스케이트보드' : 'Voxel Skateboard'}
        score={score}
        customMetricLabel={isKo ? '거리' : 'Dist'}
        customMetricValue={`${distance}m/${totalGoal}m`}
        combo={comboMultiplier}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Grind Status Banner */}
      {isGrinding && (
        <div className="absolute top-14 left-4 flex items-center gap-1.5 bg-amber-400 border border-[#201d1d] text-[#201d1d] px-2.5 py-1 rounded-sm text-xs font-black animate-pulse z-10 pointer-events-none shadow-xs">
          <span>{isKo ? '🔥 50-50 레일 그라인드 중!!' : '🔥 50-50 RAIL GRINDING!'}</span>
        </div>
      )}

      {/* Trick Announcement Banner */}
      {trickText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-400 border border-[#201d1d] text-[#201d1d] px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-md z-10 pointer-events-none animate-bounce">
          {trickText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const clientX = moveEvt.clientX;
              const curY = moveEvt.clientY - rect.top;
              const normX = (clientX / window.innerWidth - 0.5) * 2;
              stateRef.current.targetX = normX * 6.5;

              if (Math.abs(clientX - (startX + rect.left)) > 15 || Math.abs(curY - startY) > 15) {
                moved = true;
                if (stateRef.current.isInAir) {
                  handleKickflip();
                  window.removeEventListener('pointermove', onMove);
                }
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Ollie jump or In-air Kickflip
                if (stateRef.current.isInAir) {
                  handleKickflip();
                } else {
                  handleOllie();
                }
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-[#201d1d]/85 border border-[#201d1d]/40 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 카빙 조향 | 탭: 올리 점프 | 공중에서 탭/스와이프: 킥플립 360 (버튼 없음)' : 'Drag: Carve Steer | Tap: Ollie | Air Tap/Swipe: Kickflip 360 (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_skateboard_street"
          gameTitle={isKo ? '3D 복셀 스트리트 스케이트보드: 그라인드 마스터' : 'Voxel Street Skateboard: Grind Master'}
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

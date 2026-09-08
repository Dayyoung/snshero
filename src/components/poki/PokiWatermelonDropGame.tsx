import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiWatermelonDropGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

const TARGET_SCORE = 800;
const BOX_WIDTH = 7.4;
const BOX_BOTTOM = -4.5;
const DROPPER_Y = 4.0;

interface FruitTier {
  name: string;
  emoji: string;
  radius: number;
  color: number;
  score: number;
}

const FRUIT_TIERS: FruitTier[] = [
  { name: '체리', emoji: '🍒', radius: 0.38, color: 0xef4444, score: 10 },
  { name: '딸기', emoji: '🍓', radius: 0.52, color: 0xf43f5e, score: 25 },
  { name: '포도', emoji: '🍇', radius: 0.72, color: 0xa855f7, score: 50 },
  { name: '오렌지', emoji: '🍊', radius: 0.98, color: 0xf97316, score: 90 },
  { name: '사과', emoji: '🍎', radius: 1.28, color: 0xdc2626, score: 150 },
  { name: '수박', emoji: '🍉', radius: 1.68, color: 0x16a34a, score: 300 },
];

interface PhysicsFruit {
  id: number;
  tier: number;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export default function PokiWatermelonDropGame({
  onBack,
  onClose,
  cardId = 101,
  onExit
}: PokiWatermelonDropGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleExit = onBack || onClose || (() => {});

  // Game States
  const [score, setScore] = useState<number>(0);
  const [nextTier, setNextTier] = useState<number>(0);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Runtime Refs
  const dropperXRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const matchActiveRef = useRef<boolean>(true);
  const fruitIdCounter = useRef<number>(1);

  // Three.js Scene References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    dropperMesh: THREE.Group;
    previewFruitMesh: THREE.Mesh;
    fruits: PhysicsFruit[];
    particlesGroup: THREE.Group;
    scoreRef: number;
    nextTierRef: number;
  } | null>(null);

  const triggerHaptic = (duration = 20) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(duration);
      }
    } catch {
      // Ignore
    }
  };

  // Sparkles & Juicy Pop Particles
  const spawnJuicyPop = useCallback((pos: THREE.Vector3, colorHex: number, count = 20) => {
    if (!threeRef.current) return;
    const { particlesGroup } = threeRef.current;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 4 + 1.0,
          (Math.random() - 0.5) * 3
        )
      );
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.2,
      transparent: true,
      opacity: 1,
    });
    const pSystem = new THREE.Points(geom, mat);
    particlesGroup.add(pSystem);

    let life = 0;
    const interval = setInterval(() => {
      life += 0.06;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + velocities[i].x * 0.02,
          posAttr.getY(i) + velocities[i].y * 0.02 - 0.04,
          posAttr.getZ(i) + velocities[i].z * 0.02
        );
      }
      posAttr.needsUpdate = true;
      mat.opacity = 1 - life;

      if (life >= 1) {
        clearInterval(interval);
        particlesGroup.remove(pSystem);
        geom.dispose();
        mat.dispose();
      }
    }, 30);
  }, []);

  // Victory Handler
  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    matchActiveRef.current = false;
    triggerHaptic(80);

    const durationSeconds = Math.max(15, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiwatermelondrop',
      gameTitle: 'Watermelon Drop 3D',
      isVictory: true,
      score: 800,
      maxTargetScore: 800,
      durationSeconds,
    });
    setRewardReceipt(receipt);
  }, [gameWon]);

  // Create 3D Fruit Mesh
  const createFruitMesh = (tier: number): THREE.Mesh => {
    const tierData = FRUIT_TIERS[tier];
    const geom = new THREE.SphereGeometry(tierData.radius, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: tierData.color,
      roughness: 0.2,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Small green leaf stem on top
    if (tier > 0) {
      const stemGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.y = tierData.radius + 0.08;
      mesh.add(stem);
    }

    return mesh;
  };

  // Drop Fruit Trigger
  const handleDropFruit = useCallback(() => {
    if (!threeRef.current || !matchActiveRef.current) return;
    triggerHaptic(30);

    const { scene, fruits, nextTierRef } = threeRef.current;
    const tier = nextTierRef;
    const tierData = FRUIT_TIERS[tier];

    const dropX = THREE.MathUtils.clamp(
      dropperXRef.current,
      -BOX_WIDTH / 2 + tierData.radius + 0.2,
      BOX_WIDTH / 2 - tierData.radius - 0.2
    );

    const mesh = createFruitMesh(tier);
    mesh.position.set(dropX, DROPPER_Y, 0);
    scene.add(mesh);

    fruits.push({
      id: fruitIdCounter.current++,
      tier,
      mesh,
      x: dropX,
      y: DROPPER_Y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -1.0,
      radius: tierData.radius,
      active: true,
    });

    // Randomize next tier (0, 1, or 2)
    const newNext = Math.floor(Math.random() * 3);
    threeRef.current.nextTierRef = newNext;
    setNextTier(newNext);

    // Update preview fruit
    const pMesh = threeRef.current.previewFruitMesh;
    pMesh.geometry.dispose();
    pMesh.geometry = new THREE.SphereGeometry(FRUIT_TIERS[newNext].radius, 16, 16);
    (pMesh.material as THREE.MeshStandardMaterial).color.setHex(FRUIT_TIERS[newNext].color);
  }, []);

  // Shake Box Action (Applies random upward/lateral pulse to all fruits)
  const handleShakeBox = () => {
    if (!threeRef.current || !matchActiveRef.current) return;
    triggerHaptic(50);
    threeRef.current.fruits.forEach((f) => {
      if (f.active) {
        f.vx += (Math.random() - 0.5) * 4.0;
        f.vy += Math.random() * 4.0 + 2.0;
      }
    });
  };

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a120e);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 14);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    dirLight.position.set(5, 12, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0x34d399, 1.8, 20);
    rimLight.position.set(-6, -2, 4);
    scene.add(rimLight);

    // 5. Transparent Glass Container Box
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    // Bottom Platform
    const botGeom = new THREE.BoxGeometry(BOX_WIDTH + 0.6, 0.4, 3.0);
    const botMesh = new THREE.Mesh(botGeom, frameMat);
    botMesh.position.set(0, BOX_BOTTOM - 0.2, 0);
    scene.add(botMesh);

    // Left Glass Wall
    const lWall = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 9.5), glassMat);
    lWall.rotation.y = Math.PI / 2;
    lWall.position.set(-BOX_WIDTH / 2, 0, 0);
    scene.add(lWall);

    // Right Glass Wall
    const rWall = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 9.5), glassMat);
    rWall.rotation.y = -Math.PI / 2;
    rWall.position.set(BOX_WIDTH / 2, 0, 0);
    scene.add(rWall);

    // Back Wall
    const bWall = new THREE.Mesh(new THREE.PlaneGeometry(BOX_WIDTH, 9.5), glassMat);
    bWall.position.set(0, 0, -1.5);
    scene.add(bWall);

    // 6. Hero Badge Billboard (Top Neon Sign)
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const badgeCtx = heroBadgeCanvas.getContext('2d')!;
    drawCardSprite(badgeCtx, cardId, 0, 0, 128, 128, { circleClip: true });
    const heroBadgeTexture = new THREE.CanvasTexture(heroBadgeCanvas);

    const signGeom = new THREE.BoxGeometry(3.5, 1.2, 0.3);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3 });
    const signMesh = new THREE.Mesh(signGeom, signMat);
    signMesh.position.set(0, 5.4, 0);
    scene.add(signMesh);

    const badgePlaneGeom = new THREE.PlaneGeometry(1.0, 1.0);
    const badgePlaneMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const badgePlane = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
    badgePlane.position.set(0, 5.4, 0.18);
    scene.add(badgePlane);

    // 7. Dropper Cloud & Preview Fruit
    const dropperMesh = new THREE.Group();
    const cloudGeom = new THREE.CapsuleGeometry(0.35, 0.8, 8, 16);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const cloud = new THREE.Mesh(cloudGeom, cloudMat);
    cloud.rotation.z = Math.PI / 2;
    dropperMesh.add(cloud);

    // Aim Laser Line downwards
    const aimLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, BOX_BOTTOM - DROPPER_Y, 0),
    ]);
    const aimLineMat = new THREE.LineDashedMaterial({
      color: 0x34d399,
      dashSize: 0.3,
      gapSize: 0.2,
    });
    const aimLine = new THREE.Line(aimLineGeom, aimLineMat);
    aimLine.computeLineDistances();
    dropperMesh.add(aimLine);

    // Preview Fruit
    const previewGeom = new THREE.SphereGeometry(FRUIT_TIERS[0].radius, 16, 16);
    const previewMat = new THREE.MeshStandardMaterial({
      color: FRUIT_TIERS[0].color,
      roughness: 0.2,
    });
    const previewFruitMesh = new THREE.Mesh(previewGeom, previewMat);
    previewFruitMesh.position.y = -0.5;
    dropperMesh.add(previewFruitMesh);

    dropperMesh.position.set(0, DROPPER_Y, 0);
    scene.add(dropperMesh);

    // 8. Particles Group
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      dropperMesh,
      previewFruitMesh,
      fruits: [],
      particlesGroup,
      scoreRef: 0,
      nextTierRef: 0,
    };

    // 9. Physics & Merge Loop
    let animFrameId: number;
    const clock = new THREE.Clock();

    const gameLoop = () => {
      animFrameId = requestAnimationFrame(gameLoop);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (threeRef.current && matchActiveRef.current) {
        const { fruits, dropperMesh, scene } = threeRef.current;

        // Smooth Dropper Position
        dropperMesh.position.x = THREE.MathUtils.lerp(dropperMesh.position.x, dropperXRef.current, 0.2);

        // Apply Gravity & Velocity to Fruits
        const gravity = 18.0;
        for (let i = 0; i < fruits.length; i++) {
          const f = fruits[i];
          if (!f.active) continue;

          f.vy -= gravity * delta;
          f.x += f.vx * delta;
          f.y += f.vy * delta;

          // Rolling / Damping friction
          f.vx *= 0.985;
          f.vy *= 0.995;

          // Bottom Floor Collision
          const minY = BOX_BOTTOM + f.radius;
          if (f.y <= minY) {
            f.y = minY;
            f.vy = -f.vy * 0.25;
            if (Math.abs(f.vy) < 0.2) f.vy = 0;
          }

          // Left & Right Wall Collision
          const minX = -BOX_WIDTH / 2 + f.radius;
          const maxX = BOX_WIDTH / 2 - f.radius;
          if (f.x <= minX) {
            f.x = minX;
            f.vx = -f.vx * 0.4;
          } else if (f.x >= maxX) {
            f.x = maxX;
            f.vx = -f.vx * 0.4;
          }

          f.mesh.position.set(f.x, f.y, 0);
        }

        // Fruit-to-Fruit Collision & Merge Resolution
        for (let i = 0; i < fruits.length; i++) {
          const f1 = fruits[i];
          if (!f1.active) continue;

          for (let j = i + 1; j < fruits.length; j++) {
            const f2 = fruits[j];
            if (!f2.active) continue;

            const dx = f2.x - f1.x;
            const dy = f2.y - f1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = f1.radius + f2.radius;

            if (dist < minDist && dist > 0.001) {
              // Check Merge Condition (Same tier, and not max tier)
              if (f1.tier === f2.tier && f1.tier < FRUIT_TIERS.length - 1) {
                // MERGE!
                f1.active = false;
                f2.active = false;
                scene.remove(f1.mesh);
                scene.remove(f2.mesh);

                const nextT = f1.tier + 1;
                const newTData = FRUIT_TIERS[nextT];
                const mergeX = (f1.x + f2.x) / 2;
                const mergeY = (f1.y + f2.y) / 2;

                const newMesh = createFruitMesh(nextT);
                newMesh.position.set(mergeX, mergeY, 0);
                scene.add(newMesh);

                fruits.push({
                  id: fruitIdCounter.current++,
                  tier: nextT,
                  mesh: newMesh,
                  x: mergeX,
                  y: mergeY,
                  vx: (f1.vx + f2.vx) * 0.3,
                  vy: 2.0, // slight jump on merge
                  radius: newTData.radius,
                  active: true,
                });

                // Add Score
                threeRef.current.scoreRef += newTData.score;
                const newScore = threeRef.current.scoreRef;
                setScore(newScore);

                triggerHaptic(40);
                spawnJuicyPop(new THREE.Vector3(mergeX, mergeY, 0), newTData.color, 25);

                if (newScore >= TARGET_SCORE || nextT === FRUIT_TIERS.length - 1) {
                  handleVictory();
                }
                break;
              } else {
                // Standard Elastic Sphere-Sphere Collision
                const overlap = (minDist - dist) / 2;
                const nx = dx / dist;
                const ny = dy / dist;

                f1.x -= nx * overlap;
                f1.y -= ny * overlap;
                f2.x += nx * overlap;
                f2.y += ny * overlap;

                // Tangential impulse
                const kx = f1.vx - f2.vx;
                const ky = f1.vy - f2.vy;
                const p = 2 * (nx * kx + ny * ky) / (f1.radius + f2.radius);

                f1.vx -= p * f2.radius * nx * 0.4;
                f1.vy -= p * f2.radius * ny * 0.4;
                f2.vx += p * f1.radius * nx * 0.4;
                f2.vy += p * f1.radius * ny * 0.4;
              }
            }
          }
        }

        threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
      }
    };
    gameLoop();

    // Resize Observer
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      heroBadgeTexture.dispose();
    };
  }, [cardId, handleVictory, spawnJuicyPop]);

  // Touch Pointer Handling (Screen-relative Drag Aiming)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    updateDropperX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateDropperX(e.clientX);
  };

  const updateDropperX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const normX = ((clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
    const worldX = normX * (BOX_WIDTH / 2 - 0.6);
    dropperXRef.current = THREE.MathUtils.clamp(worldX, -BOX_WIDTH / 2 + 0.6, BOX_WIDTH / 2 - 0.6);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0a120e] font-mono"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      {/* Three.js Canvas mounts here */}

      {/* Top Minimalist HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="WATERMELON DROP 3D"
        progress={Math.min(100, (score / TARGET_SCORE) * 100)}
        score={score}
        maxScore={TARGET_SCORE}
        onQuit={handleExit}
      />

      {/* Next Fruit Preview & Score Status Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-2xl backdrop-blur-md flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">NEXT:</span>
            <span className="text-xl">{FRUIT_TIERS[nextTier].emoji}</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400">
              {FRUIT_TIERS[nextTier].name}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-xs sm:text-sm font-bold text-amber-400">
            SCORE: {score}/{TARGET_SCORE}
          </div>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 font-bold tracking-tight">
          화면을 좌우로 드래그하여 조준하고 투하 버튼을 누르세요!
        </p>
      </div>

      {/* Action Controls (Mobile Pure Touch) */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex items-center gap-3">
        {/* Shake Box Button */}
        <button
          type="button"
          onClick={handleShakeBox}
          className="pointer-events-auto w-16 h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center backdrop-blur-md cursor-pointer"
        >
          <span className="text-xl">🔀</span>
          <span className="text-[9px]">SHAKE</span>
        </button>

        {/* 76px Big Drop Button */}
        <button
          type="button"
          onClick={handleDropFruit}
          className="pointer-events-auto h-[76px] px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base uppercase tracking-wider shadow-2xl shadow-emerald-600/40 active:scale-95 transition-all flex items-center gap-3 border border-emerald-300/60 cursor-pointer"
        >
          <span className="text-2xl animate-bounce">🍉</span>
          <span>DROP FRUIT!</span>
        </button>
      </div>

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          rewardReceipt={rewardReceipt}
          onBack={handleExit}
        />
      )}
    </div>
  );
}

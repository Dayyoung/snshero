import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiEvoWorldIoGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface EvolutionTier {
  name: string;
  icon: string;
  expReq: number;
  color: number;
  scale: number;
}

const EVO_TIERS: EvolutionTier[] = [
  { name: 'Fly', icon: '🪰', expReq: 120, color: 0x64748b, scale: 0.7 },
  { name: 'Butterfly', icon: '🦋', expReq: 280, color: 0xec4899, scale: 0.9 },
  { name: 'Mosquito', icon: '🦟', expReq: 500, color: 0xef4444, scale: 1.1 },
  { name: 'Falcon', icon: '🦅', expReq: 750, color: 0xd97706, scale: 1.4 },
  { name: 'Phoenix', icon: '🔥', expReq: 1000, color: 0xf97316, scale: 1.8 },
];

interface FoodNode {
  mesh: THREE.Mesh;
  type: 'dew' | 'berry' | 'flower';
  x: number;
  y: number;
  z: number;
  active: boolean;
}

export default function PokiEvoWorldIoGame({
  onBack,
  onClose,
  cardId = 97,
}: PokiEvoWorldIoGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleExit = onBack || onClose || (() => {});

  // Evolution & Survival States
  const [currentTierIdx, setCurrentTierIdx] = useState<number>(0);
  const [exp, setExp] = useState<number>(0);
  const [water, setWater] = useState<number>(100);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Joystick States
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });

  // Input & Physics Refs
  const inputRef = useRef({
    moveX: 0,
    moveY: 0,
    isBoost: false,
    isDive: false,
  });
  const startTimeRef = useRef<number>(Date.now());
  const matchActiveRef = useRef<boolean>(true);

  // Three.js Scene References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    bodyMesh: THREE.Mesh;
    wings: [THREE.Mesh, THREE.Mesh];
    badgeMesh: THREE.Mesh;
    foods: FoodNode[];
    predators: Array<{ mesh: THREE.Group; x: number; y: number; z: number; vx: number; vy: number }>;
    particlesGroup: THREE.Group;
    lakeSurface: THREE.Mesh;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    tierIdxRef: number;
    expRef: number;
    waterRef: number;
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

  // Sparkles & Evolution Particles Emitter
  const spawnEvoSparkles = useCallback((pos: THREE.Vector3, colorHex: number, count = 25) => {
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
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        )
      );
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.22,
      transparent: true,
      opacity: 1,
    });
    const pSystem = new THREE.Points(geom, mat);
    particlesGroup.add(pSystem);

    let life = 0;
    const interval = setInterval(() => {
      life += 0.05;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + velocities[i].x * 0.02,
          posAttr.getY(i) + velocities[i].y * 0.02,
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

  // Victory Trigger
  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    matchActiveRef.current = false;
    triggerHaptic(80);

    const durationSeconds = Math.max(15, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokievoworldio',
      gameTitle: 'EvoWorld io 3D',
      isVictory: true,
      score: 1000,
      maxTargetScore: 1000,
      durationSeconds,
    });
    setRewardReceipt(receipt);
  }, [gameWon]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c2340);
    scene.fog = new THREE.Fog(0x0c2340, 30, 80);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(15, 30, 20);
    scene.add(sunLight);

    // Cyan Bioluminescent Rim Light
    const rimLight = new THREE.PointLight(0x38bdf8, 2.0, 30);
    rimLight.position.set(-10, 0, 5);
    scene.add(rimLight);

    // 5. Bottom Lake (Water Surface at Y = -7.0)
    const lakeGeom = new THREE.PlaneGeometry(60, 60);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
    const lakeSurface = new THREE.Mesh(lakeGeom, lakeMat);
    lakeSurface.rotation.x = -Math.PI / 2;
    lakeSurface.position.y = -7.0;
    scene.add(lakeSurface);

    // 6. Floating Central Sanctuary Island & Hero Badge Monolith
    const islandGeom = new THREE.CylinderGeometry(4.5, 3.0, 1.8, 24);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const island = new THREE.Mesh(islandGeom, islandMat);
    island.position.set(0, -3.5, 0);
    scene.add(island);

    // Hero Badge Monolith
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const badgeCtx = heroBadgeCanvas.getContext('2d')!;
    drawCardSprite(badgeCtx, cardId, 0, 0, 128, 128, { circleClip: true });
    const heroBadgeTexture = new THREE.CanvasTexture(heroBadgeCanvas);

    const monolithGeom = new THREE.BoxGeometry(1.2, 2.6, 0.4);
    const monolithMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const monolith = new THREE.Mesh(monolithGeom, monolithMat);
    monolith.position.set(0, -1.8, 0);
    scene.add(monolith);

    const badgePlaneGeom = new THREE.PlaneGeometry(1.0, 1.0);
    const badgePlaneMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const monolithBadge = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
    monolithBadge.position.set(0, -1.5, 0.22);
    scene.add(monolithBadge);

    // 7. 3D Creature Assembly Group (Player)
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // Body Mesh
    const bodyGeom = new THREE.SphereGeometry(0.5, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: EVO_TIERS[0].color,
      roughness: 0.3,
      metalness: 0.3,
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    playerGroup.add(bodyMesh);

    // Wings (Pair of translucent fluttering planes)
    const wingGeom = new THREE.PlaneGeometry(0.7, 0.45);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const leftWing = new THREE.Mesh(wingGeom, wingMat);
    leftWing.position.set(-0.55, 0.2, 0);
    leftWing.rotation.x = Math.PI / 4;
    const rightWing = new THREE.Mesh(wingGeom, wingMat);
    rightWing.position.set(0.55, 0.2, 0);
    rightWing.rotation.x = Math.PI / 4;
    playerGroup.add(leftWing, rightWing);

    // Player Hero Badge Emblem
    const pBadgeGeom = new THREE.PlaneGeometry(0.4, 0.4);
    const pBadgeMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const pBadge = new THREE.Mesh(pBadgeGeom, pBadgeMat);
    pBadge.position.set(0, 0.35, 0.35);
    playerGroup.add(pBadge);

    // 8. 3D Floating Food Nodes (Dew drops, Berries, Flowers)
    const foods: FoodNode[] = [];
    const dewMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.5 });
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });

    for (let i = 0; i < 30; i++) {
      const type: 'dew' | 'berry' | 'flower' = i % 3 === 0 ? 'dew' : i % 3 === 1 ? 'berry' : 'flower';
      const mat = type === 'dew' ? dewMat : type === 'berry' ? berryMat : flowerMat;
      const fGeom = new THREE.SphereGeometry(type === 'flower' ? 0.35 : 0.25, 12, 12);
      const fMesh = new THREE.Mesh(fGeom, mat);

      const fx = (Math.random() - 0.5) * 26;
      const fy = -5.5 + Math.random() * 14;
      const fz = (Math.random() - 0.5) * 26;
      fMesh.position.set(fx, fy, fz);
      scene.add(fMesh);

      foods.push({
        mesh: fMesh,
        type,
        x: fx,
        y: fy,
        z: fz,
        active: true,
      });
    }

    // 9. AI Predator Creatures (2 High-level Red Dragon/Eagle Flyers)
    const predators: Array<{ mesh: THREE.Group; x: number; y: number; z: number; vx: number; vy: number }> = [];
    for (let i = 0; i < 2; i++) {
      const predGroup = new THREE.Group();
      const pBody = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 })
      );
      pBody.rotation.x = Math.PI / 2;
      predGroup.add(pBody);

      // Warning Aura Ring
      const auraRing = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.35, 16),
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
      );
      predGroup.add(auraRing);

      const px = i === 0 ? -10 : 10;
      const py = 4;
      const pz = (Math.random() - 0.5) * 16;
      predGroup.position.set(px, py, pz);
      scene.add(predGroup);

      predators.push({
        mesh: predGroup,
        x: px,
        y: py,
        z: pz,
        vx: i === 0 ? 2.5 : -2.5,
        vy: 1.0,
      });
    }

    // 10. Particles Group
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerGroup,
      bodyMesh,
      wings: [leftWing, rightWing],
      badgeMesh: pBadge,
      foods,
      predators,
      particlesGroup,
      lakeSurface,
      pos: new THREE.Vector3(0, 0, 0),
      vel: new THREE.Vector3(0, 0, 0),
      tierIdxRef: 0,
      expRef: 0,
      waterRef: 100,
    };

    // 11. Physics & Animation Loop
    let animFrameId: number;
    const clock = new THREE.Clock();
    let waterDrainAccum = 0;

    const gameLoop = () => {
      animFrameId = requestAnimationFrame(gameLoop);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (threeRef.current && matchActiveRef.current) {
        const input = inputRef.current;
        const { pos, vel, playerGroup, camera, wings, foods, predators, bodyMesh } = threeRef.current;

        // Water Depletion over time
        waterDrainAccum += delta;
        if (waterDrainAccum >= 1.0) {
          waterDrainAccum = 0;
          threeRef.current.waterRef = Math.max(0, threeRef.current.waterRef - 1.5);
          setWater(Math.floor(threeRef.current.waterRef));
        }

        // Flying Velocity Calculation
        const speed = input.isBoost ? 14.0 : 7.5;
        const targetVelX = input.moveX * speed;
        const targetVelY = -input.moveY * speed + (input.isDive ? -10 : 0);

        vel.x = THREE.MathUtils.lerp(vel.x, targetVelX, 0.15);
        vel.y = THREE.MathUtils.lerp(vel.y, targetVelY, 0.15);
        vel.z = THREE.MathUtils.lerp(vel.z, -3.0, 0.05); // Continuous forward flight

        pos.x += vel.x * delta;
        pos.y += vel.y * delta;
        pos.z += vel.z * delta;

        // Pitch & Boundary Clamps
        pos.x = THREE.MathUtils.clamp(pos.x, -14, 14);
        pos.y = THREE.MathUtils.clamp(pos.y, -6.8, 12);
        if (pos.z < -25) pos.z = 25; // Loop sky arena

        playerGroup.position.copy(pos);

        // Wing Fluttering
        const flutterRate = input.isBoost ? 30 : 15;
        const wingAngle = Math.sin(clock.getElapsedTime() * flutterRate) * 0.45;
        wings[0].rotation.z = wingAngle;
        wings[1].rotation.z = -wingAngle;

        // Banking & Tilt
        playerGroup.rotation.z = -vel.x * 0.04;
        playerGroup.rotation.x = -vel.y * 0.03;

        // Lake Water Refill (Drinking)
        if (pos.y <= -6.2) {
          threeRef.current.waterRef = 100;
          setWater(100);
          triggerHaptic(10);
        }

        // Food Consumption Check
        foods.forEach((f) => {
          if (!f.active) {
            // Respawn after while
            if (Math.random() < 0.01) {
              f.active = true;
              f.mesh.visible = true;
            }
            return;
          }

          const dist = pos.distanceTo(f.mesh.position);
          if (dist < 1.1) {
            f.active = false;
            f.mesh.visible = false;
            triggerHaptic(20);

            // Add EXP
            threeRef.current!.expRef += 35;
            const newExp = threeRef.current!.expRef;
            setExp(newExp);

            // Water bonus for dew
            if (f.type === 'dew') {
              threeRef.current!.waterRef = Math.min(100, threeRef.current!.waterRef + 15);
              setWater(Math.floor(threeRef.current!.waterRef));
            }

            spawnEvoSparkles(f.mesh.position, f.type === 'dew' ? 0x38bdf8 : 0xfacc15, 8);

            // Check Tier Upgrade
            const curTier = threeRef.current!.tierIdxRef;
            if (curTier < EVO_TIERS.length - 1 && newExp >= EVO_TIERS[curTier].expReq) {
              const nextTier = curTier + 1;
              threeRef.current!.tierIdxRef = nextTier;
              setCurrentTierIdx(nextTier);

              // Upgrade Mesh Scale & Color
              const tierData = EVO_TIERS[nextTier];
              playerGroup.scale.set(tierData.scale, tierData.scale, tierData.scale);
              (bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(tierData.color);

              triggerHaptic(60);
              spawnEvoSparkles(pos, tierData.color, 35);

              if (nextTier === EVO_TIERS.length - 1 || newExp >= 1000) {
                handleVictory();
              }
            }
          }
        });

        // Predator AI Movement & Avoidance
        predators.forEach((p) => {
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          if (Math.abs(p.x) > 13) p.vx *= -1;
          if (p.y > 10 || p.y < -3) p.vy *= -1;
          p.mesh.position.set(p.x, p.y, p.z);
          p.mesh.rotation.y = Math.atan2(p.vx, 0);

          // Danger Collision
          const distToPlayer = pos.distanceTo(p.mesh.position);
          if (distToPlayer < 1.5) {
            triggerHaptic(50);
            vel.x = -vel.x * 1.5;
            vel.y = -vel.y * 1.5;
            threeRef.current!.waterRef = Math.max(0, threeRef.current!.waterRef - 10);
            setWater(Math.floor(threeRef.current!.waterRef));
          }
        });

        // Camera Follow (Screen-relative smooth tracking)
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, pos.x * 0.4, 0.1);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, pos.y + 3.5, 0.1);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, pos.z + 10, 0.1);
        camera.lookAt(pos.x * 0.6, pos.y, pos.z - 6);

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
  }, [cardId, handleVictory, spawnEvoSparkles]);

  // Touch & Dynamic Floating Joystick
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameWon) return;
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth * 0.65) {
      setJoystickActive(true);
      setJoystickCenter({ x: touch.clientX, y: touch.clientY });
      setJoystickKnob({ x: touch.clientX, y: touch.clientY });
      inputRef.current.moveX = 0;
      inputRef.current.moveY = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickActive || gameWon) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickCenter.x;
    const dy = touch.clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;

    if (dist <= maxRadius) {
      setJoystickKnob({ x: touch.clientX, y: touch.clientY });
      inputRef.current.moveX = dx / maxRadius;
      inputRef.current.moveY = dy / maxRadius;
    } else {
      const angle = Math.atan2(dy, dx);
      setJoystickKnob({
        x: joystickCenter.x + Math.cos(angle) * maxRadius,
        y: joystickCenter.y + Math.sin(angle) * maxRadius,
      });
      inputRef.current.moveX = Math.cos(angle);
      inputRef.current.moveY = Math.sin(angle);
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    inputRef.current.moveX = 0;
    inputRef.current.moveY = 0;
  };

  const currentTier = EVO_TIERS[currentTierIdx];
  const targetExp = currentTier.expReq;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0c2340] font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js Canvas mounts here */}

      {/* Top Minimalist HUD */}
      <MinimalistMissionHUD
        gameTitle="EVOWORLD IO 3D"
        progress={Math.min(100, (exp / 1000) * 100)}
        score={exp}
        maxScore={1000}
        onQuit={handleExit}
      />

      {/* Evolution Tier & Survival Status Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-2xl backdrop-blur-md flex items-center gap-4">
          {/* Current Creature */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentTier.icon}</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 uppercase">
              {currentTier.name} (Tier {currentTierIdx + 1}/5)
            </span>
          </div>
          <span className="text-slate-600">|</span>
          {/* EXP Progress */}
          <div className="text-xs sm:text-sm font-bold text-emerald-400">
            EXP {exp}/{targetExp}
          </div>
          <span className="text-slate-600">|</span>
          {/* Water Hydration */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-400">
            <span>💧</span>
            <span>{water}%</span>
          </div>
        </div>
      </div>

      {/* Floating Joystick Visual Feedback */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
          style={{ left: joystickCenter.x, top: joystickCenter.y }}
        >
          <div className="w-[100px] h-[100px] rounded-full border-2 border-sky-400/60 bg-sky-950/40 backdrop-blur-xs flex items-center justify-center shadow-lg" />
          <div
            className="absolute w-12 h-12 rounded-full bg-sky-400/90 border border-white/80 shadow-md -translate-x-1/2 -translate-y-1/2"
            style={{
              left: joystickKnob.x - joystickCenter.x + 50,
              top: joystickKnob.y - joystickCenter.y + 50,
            }}
          />
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex items-center gap-3">
        {/* Dive / Drink Button */}
        <button
          type="button"
          onPointerDown={() => {
            triggerHaptic(20);
            inputRef.current.isDive = true;
          }}
          onPointerUp={() => { inputRef.current.isDive = false; }}
          onPointerLeave={() => { inputRef.current.isDive = false; }}
          className="pointer-events-auto w-16 h-16 rounded-2xl bg-sky-950/90 hover:bg-sky-900 text-sky-300 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center border border-sky-500/40 backdrop-blur-md cursor-pointer"
        >
          <span className="text-xl">💧</span>
          <span className="text-[9px]">DIVE</span>
        </button>

        {/* 76px Fly Boost Button */}
        <button
          type="button"
          onPointerDown={() => {
            triggerHaptic(30);
            inputRef.current.isBoost = true;
          }}
          onPointerUp={() => { inputRef.current.isBoost = false; }}
          onPointerLeave={() => { inputRef.current.isBoost = false; }}
          className="pointer-events-auto h-[76px] px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-base uppercase tracking-wider shadow-2xl shadow-amber-500/40 active:scale-95 transition-all flex items-center gap-3 border border-amber-300/60 cursor-pointer"
        >
          <span className="text-2xl animate-pulse">🔥</span>
          <span>FLY BOOST</span>
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

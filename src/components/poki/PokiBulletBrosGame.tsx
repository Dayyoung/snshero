import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBulletBrosGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface EnemyData {
  mesh: THREE.Group;
  x: number;
  y: number;
  alive: boolean;
  vx: number;
  vy: number;
  rotZ: number;
}

interface BulletData {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
  active: boolean;
}

interface ObstacleData {
  mesh: THREE.Mesh;
  box: THREE.Box3;
}

const STAGE_CONFIGS = [
  // Stage 1
  {
    enemies: [
      { x: 4.5, y: -1.5 },
      { x: 5.5, y: 2.2 },
    ],
    obstacles: [
      { x: 1.0, y: 0.0, w: 0.8, h: 4.0 },
    ],
  },
  // Stage 2
  {
    enemies: [
      { x: 3.5, y: -2.0 },
      { x: 6.0, y: 0.5 },
      { x: 4.0, y: 2.8 },
    ],
    obstacles: [
      { x: 0.5, y: 1.5, w: 4.0, h: 0.8 },
      { x: 2.5, y: -1.0, w: 0.8, h: 3.0 },
    ],
  },
  // Stage 3
  {
    enemies: [
      { x: 3.0, y: -2.2 },
      { x: 5.5, y: -0.5 },
      { x: 3.5, y: 1.8 },
      { x: 6.5, y: 2.8 },
    ],
    obstacles: [
      { x: 0.0, y: -0.5, w: 3.0, h: 0.8 },
      { x: 4.5, y: 1.0, w: 3.5, h: 0.8 },
      { x: 1.5, y: 2.2, w: 0.8, h: 2.5 },
    ],
  },
];

export default function PokiBulletBrosGame({
  onBack,
  onClose,
  cardId = 98,
}: PokiBulletBrosGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleExit = onBack || onClose || (() => {});

  // Game States
  const [stageIdx, setStageIdx] = useState<number>(0);
  const [bulletsLeft, setBulletsLeft] = useState<number>(5);
  const [totalKills, setTotalKills] = useState<number>(0);
  const [isBulletTime, setIsBulletTime] = useState<boolean>(false);
  const [aimAngle, setAimAngle] = useState<number>(0);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Runtime Refs
  const startTimeRef = useRef<number>(Date.now());
  const matchActiveRef = useRef<boolean>(true);
  const isAimingRef = useRef<boolean>(false);

  // Three.js Scene References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    aimLine: THREE.Line;
    bullets: BulletData[];
    enemies: EnemyData[];
    obstacles: ObstacleData[];
    particlesGroup: THREE.Group;
    stageGroup: THREE.Group;
    aimAngle: number;
    timeScale: number;
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

  // Sparkles & Ricochet Spikes Emitter
  const spawnHitParticles = useCallback((pos: THREE.Vector3, colorHex: number, count = 18) => {
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
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 3
        )
      );
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.18,
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
      gameId: 'pokibulletbros',
      gameTitle: 'Bullet Bros 3D',
      isVictory: true,
      score: 500,
      maxTargetScore: 500,
      durationSeconds,
    });
    setRewardReceipt(receipt);
  }, [gameWon]);

  // Player Figure Builder
  const createPlayerMesh = (badgeTexture: THREE.CanvasTexture | null): THREE.Group => {
    const group = new THREE.Group();

    // Body (Black Coat)
    const bodyGeom = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    // Head with Sunglasses
    const headGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.35;
    group.add(head);

    const glassGeom = new THREE.BoxGeometry(0.4, 0.12, 0.1);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const glasses = new THREE.Mesh(glassGeom, glassMat);
    glasses.position.set(0.12, 1.38, 0.22);
    group.add(glasses);

    // Dual Pistols
    const gunGeom = new THREE.BoxGeometry(0.6, 0.2, 0.12);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.8, roughness: 0.2 });
    const gun = new THREE.Mesh(gunGeom, gunMat);
    gun.position.set(0.5, 0.7, 0.25);
    group.add(gun);

    // Hero Badge on Chest
    if (badgeTexture) {
      const badgeGeom = new THREE.PlaneGeometry(0.45, 0.45);
      const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true });
      const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
      badgeMesh.position.set(0, 0.65, 0.4);
      group.add(badgeMesh);
    }

    return group;
  };

  // Enemy Figure Builder
  const createEnemyMesh = (): THREE.Group => {
    const group = new THREE.Group();

    // Body (Red Suit)
    const bodyGeom = new THREE.CylinderGeometry(0.35, 0.4, 1.1, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.55;
    group.add(body);

    // Head
    const headGeom = new THREE.SphereGeometry(0.28, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.25;
    group.add(head);

    // Sunglasses
    const glassGeom = new THREE.BoxGeometry(0.38, 0.1, 0.08);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const glasses = new THREE.Mesh(glassGeom, glassMat);
    glasses.position.set(-0.1, 1.28, 0.22);
    group.add(glasses);

    return group;
  };

  // Load Stage
  const loadStage = useCallback((sIdx: number) => {
    if (!threeRef.current) return;
    const { scene, stageGroup, obstacles, enemies } = threeRef.current;

    // Clear old stage objects
    obstacles.forEach((o) => stageGroup.remove(o.mesh));
    obstacles.length = 0;
    enemies.forEach((e) => stageGroup.remove(e.mesh));
    enemies.length = 0;

    const config = STAGE_CONFIGS[sIdx];

    // Build Obstacles
    config.obstacles.forEach((obs) => {
      const obsGeom = new THREE.BoxGeometry(obs.w, obs.h, 1.5);
      const obsMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.6,
        roughness: 0.3,
      });
      const obsMesh = new THREE.Mesh(obsGeom, obsMat);
      obsMesh.position.set(obs.x, obs.y, 0);
      stageGroup.add(obsMesh);

      const box = new THREE.Box3().setFromObject(obsMesh);
      obstacles.push({ mesh: obsMesh, box });
    });

    // Build Enemies
    config.enemies.forEach((eCfg) => {
      const eMesh = createEnemyMesh();
      eMesh.position.set(eCfg.x, eCfg.y, 0);
      stageGroup.add(eMesh);
      enemies.push({
        mesh: eMesh,
        x: eCfg.x,
        y: eCfg.y,
        alive: true,
        vx: 0,
        vy: 0,
        rotZ: 0,
      });
    });

    setBulletsLeft(5);
  }, []);

  // Shoot Bullet
  const fireBullet = useCallback(() => {
    if (!threeRef.current || bulletsLeft <= 0 || !matchActiveRef.current) return;
    triggerHaptic(40);

    const { playerGroup, bullets, scene, aimAngle } = threeRef.current;
    const pPos = playerGroup.position;

    // Create Golden Ricochet Bullet Mesh
    const bGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const bMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });
    const bMesh = new THREE.Mesh(bGeom, bMat);
    const startX = pPos.x + 0.6;
    const startY = pPos.y + 0.7;
    bMesh.position.set(startX, startY, 0);
    scene.add(bMesh);

    const speed = 26.0;
    const vx = Math.cos(aimAngle) * speed;
    const vy = Math.sin(aimAngle) * speed;

    bullets.push({
      mesh: bMesh,
      x: startX,
      y: startY,
      vx,
      vy,
      bounces: 0,
      active: true,
    });

    setBulletsLeft((prev) => prev - 1);
    spawnHitParticles(new THREE.Vector3(startX, startY, 0), 0xfacc15, 8);
  }, [bulletsLeft, spawnHitParticles]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a14);

    // 2. Camera (Side Ortho-Perspective View)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 16);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.position.set(5, 10, 12);
    scene.add(dirLight);

    const magentaLight = new THREE.PointLight(0xd946ef, 1.8, 25);
    magentaLight.position.set(-6, -4, 4);
    scene.add(magentaLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 1.8, 25);
    cyanLight.position.set(6, 4, 4);
    scene.add(cyanLight);

    // 5. Stage Bounds (Outer Walls for Ricochet)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.7, roughness: 0.2 });

    // Top Wall
    const topW = new THREE.Mesh(new THREE.BoxGeometry(20, 0.8, 2), wallMat);
    topW.position.set(0, 5.0, 0);
    scene.add(topW);

    // Bottom Floor
    const botW = new THREE.Mesh(new THREE.BoxGeometry(20, 0.8, 2), wallMat);
    botW.position.set(0, -5.0, 0);
    scene.add(botW);

    // Left Wall
    const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.8, 10.8, 2), wallMat);
    leftW.position.set(-9.5, 0, 0);
    scene.add(leftW);

    // Right Wall
    const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.8, 10.8, 2), wallMat);
    rightW.position.set(9.5, 0, 0);
    scene.add(rightW);

    // 6. Hero Badge Billboard
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const badgeCtx = heroBadgeCanvas.getContext('2d')!;
    drawCardSprite(badgeCtx, cardId, 0, 0, 128, 128, { circleClip: true });
    const heroBadgeTexture = new THREE.CanvasTexture(heroBadgeCanvas);

    const badgePlaneGeom = new THREE.PlaneGeometry(1.5, 1.5);
    const badgePlaneMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const badgePlane = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
    badgePlane.position.set(0, 4.4, 0.45);
    scene.add(badgePlane);

    // 7. Player Group (Standing on left side)
    const playerGroup = createPlayerMesh(heroBadgeTexture);
    playerGroup.position.set(-6.5, -3.2, 0);
    scene.add(playerGroup);

    // 8. Laser Aiming Guide Line
    const aimLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(5, 0, 0),
    ]);
    const aimLineMat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 0.3,
      gapSize: 0.15,
      linewidth: 2,
    });
    const aimLine = new THREE.Line(aimLineGeom, aimLineMat);
    aimLine.computeLineDistances();
    aimLine.position.set(-5.9, -2.5, 0.1);
    scene.add(aimLine);

    // 9. Stage Objects & Particles
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerGroup,
      aimLine,
      bullets: [],
      enemies: [],
      obstacles: [],
      particlesGroup,
      stageGroup,
      aimAngle: 0,
      timeScale: 1.0,
    };

    // Load Initial Stage 0
    loadStage(0);

    // 10. Animation & Physics Loop
    let animFrameId: number;
    const clock = new THREE.Clock();

    const gameLoop = () => {
      animFrameId = requestAnimationFrame(gameLoop);
      const deltaRaw = Math.min(clock.getDelta(), 0.05);

      if (threeRef.current && matchActiveRef.current) {
        const { bullets, enemies, obstacles, scene, playerGroup, aimLine } = threeRef.current;
        const delta = deltaRaw * threeRef.current.timeScale;

        // Update Aiming Laser Direction
        aimLine.rotation.z = threeRef.current.aimAngle;
        playerGroup.rotation.z = threeRef.current.aimAngle * 0.15;

        // Bullets Physics & Ricochet Collision
        for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
          const b = bullets[bIdx];
          if (!b.active) continue;

          b.x += b.vx * delta;
          b.y += b.vy * delta;
          b.mesh.position.set(b.x, b.y, 0);

          // Outer Bounds Bounce (Top, Bottom, Left, Right)
          if (b.y >= 4.4 && b.vy > 0) {
            b.vy = -b.vy;
            b.bounces += 1;
            spawnHitParticles(b.mesh.position, 0xfacc15, 6);
          }
          if (b.y <= -4.4 && b.vy < 0) {
            b.vy = -b.vy;
            b.bounces += 1;
            spawnHitParticles(b.mesh.position, 0xfacc15, 6);
          }
          if (b.x >= 8.9 && b.vx > 0) {
            b.vx = -b.vx;
            b.bounces += 1;
            spawnHitParticles(b.mesh.position, 0xfacc15, 6);
          }
          if (b.x <= -8.9 && b.vx < 0) {
            b.vx = -b.vx;
            b.bounces += 1;
            spawnHitParticles(b.mesh.position, 0xfacc15, 6);
          }

          // Obstacles Bounce Collision
          for (const obs of obstacles) {
            const minX = obs.mesh.position.x - (obs.mesh.geometry as THREE.BoxGeometry).parameters.width / 2;
            const maxX = obs.mesh.position.x + (obs.mesh.geometry as THREE.BoxGeometry).parameters.width / 2;
            const minY = obs.mesh.position.y - (obs.mesh.geometry as THREE.BoxGeometry).parameters.height / 2;
            const maxY = obs.mesh.position.y + (obs.mesh.geometry as THREE.BoxGeometry).parameters.height / 2;

            if (b.x >= minX && b.x <= maxX && b.y >= minY && b.y <= maxY) {
              // Determine collision side
              const distLeft = Math.abs(b.x - minX);
              const distRight = Math.abs(b.x - maxX);
              const distBot = Math.abs(b.y - minY);
              const distTop = Math.abs(b.y - maxY);
              const minDist = Math.min(distLeft, distRight, distBot, distTop);

              if (minDist === distLeft || minDist === distRight) b.vx = -b.vx;
              else b.vy = -b.vy;

              b.bounces += 1;
              spawnHitParticles(b.mesh.position, 0x38bdf8, 8);
              break;
            }
          }

          // Enemy Hit Collision
          for (const en of enemies) {
            if (!en.alive) continue;
            const dist = Math.hypot(b.x - en.x, b.y - en.y);
            if (dist < 0.85) {
              // Enemy Eliminated!
              en.alive = false;
              en.vx = b.vx * 0.2;
              en.vy = Math.abs(b.vy * 0.2) + 3.0;
              triggerHaptic(60);
              spawnHitParticles(en.mesh.position, 0xef4444, 25);

              setTotalKills((prev) => prev + 1);

              // Check if all enemies in stage cleared
              const allDead = enemies.every((e) => !e.alive);
              if (allDead) {
                setTimeout(() => {
                  setStageIdx((curStage) => {
                    if (curStage < STAGE_CONFIGS.length - 1) {
                      loadStage(curStage + 1);
                      return curStage + 1;
                    } else {
                      handleVictory();
                      return curStage;
                    }
                  });
                }, 800);
              }
              break;
            }
          }

          // Bullet Expiry after 4 bounces
          if (b.bounces >= 4) {
            b.active = false;
            scene.remove(b.mesh);
            bullets.splice(bIdx, 1);
          }
        }

        // Enemies Ragdoll Physics (When eliminated)
        enemies.forEach((en) => {
          if (!en.alive) {
            en.x += en.vx * delta;
            en.y += en.vy * delta;
            en.vy -= 12 * delta; // Gravity
            en.rotZ += delta * 4;
            en.mesh.position.set(en.x, en.y, 0);
            en.mesh.rotation.z = en.rotZ;
          }
        });

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
  }, [cardId, handleVictory, loadStage, spawnHitParticles]);

  // Touch Aiming & Firing
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameWon) return;
    isAimingRef.current = true;
    updateAimFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isAimingRef.current || gameWon) return;
    updateAimFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    if (!isAimingRef.current || gameWon) return;
    isAimingRef.current = false;
    fireBullet();
  };

  const updateAimFromPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !threeRef.current) return;

    // Player position on screen is roughly at X = 15%, Y = 70%
    const originX = rect.left + rect.width * 0.15;
    const originY = rect.top + rect.height * 0.70;

    const dx = clientX - originX;
    const dy = -(clientY - originY);
    const angle = Math.atan2(dy, dx);

    threeRef.current.aimAngle = angle;
    setAimAngle(angle);
  };

  // Toggle Bullet Time (Slow Motion)
  const toggleBulletTime = () => {
    triggerHaptic(30);
    setIsBulletTime((prev) => {
      const next = !prev;
      if (threeRef.current) {
        threeRef.current.timeScale = next ? 0.25 : 1.0;
      }
      return next;
    });
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0a0a14] font-mono"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Three.js Canvas mounts here */}

      {/* Top Minimalist HUD */}
      <MinimalistMissionHUD
        gameTitle="BULLET BROS 3D"
        progress={Math.min(100, ((stageIdx + 1) / STAGE_CONFIGS.length) * 100)}
        score={totalKills * 100}
        maxScore={500}
        onQuit={handleExit}
      />

      {/* Stage Status & Ammo Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-purple-500/40 shadow-2xl backdrop-blur-md flex items-center gap-4">
          <div className="text-xs sm:text-sm font-black text-purple-300 uppercase">
            STAGE {stageIdx + 1}/{STAGE_CONFIGS.length}
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-400">
            <span>🔫 BULLETS:</span>
            <span>{bulletsLeft}발</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-xs sm:text-sm font-bold text-rose-400">
            KILLS: {totalKills}
          </div>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 font-bold tracking-tight">
          화면을 드래그해 레이저를 조준하고 손을 떼어 도탄 사격하세요!
        </p>
      </div>

      {/* Action Controls */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex items-center gap-3">
        {/* Bullet Time (Slow-Mo) Button */}
        <button
          type="button"
          onClick={toggleBulletTime}
          className={`pointer-events-auto w-16 h-16 rounded-2xl border font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center backdrop-blur-md cursor-pointer ${
            isBulletTime
              ? 'bg-amber-500/90 border-amber-300 text-slate-950 animate-pulse'
              : 'bg-slate-900/90 border-purple-500/40 text-purple-300 hover:bg-slate-800'
          }`}
        >
          <span className="text-xl">⏱️</span>
          <span className="text-[9px]">SLOW-MO</span>
        </button>

        {/* 76px Big Shoot Button */}
        <button
          type="button"
          onClick={fireBullet}
          className="pointer-events-auto h-[76px] px-8 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-base uppercase tracking-wider shadow-2xl shadow-rose-600/40 active:scale-95 transition-all flex items-center gap-3 border border-amber-300/50 cursor-pointer"
        >
          <span className="text-2xl animate-spin">💥</span>
          <span>SHOOT NOW!</span>
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

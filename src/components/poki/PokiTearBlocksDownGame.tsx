import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Bomb, Flame, ShieldAlert, Sparkles, RefreshCw, Crosshair, Award } from 'lucide-react';

interface PokiTearBlocksDownGameProps {
  onBack: () => void;
  cardId?: number;
}

interface BlockPhysics {
  mesh: THREE.Mesh;
  type: 'wood' | 'stone' | 'tnt';
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Vector3;
  rotVel: THREE.Vector3;
  isSleeping: boolean;
  tntExploded?: boolean;
}

interface ZombiePhysics {
  group: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  alive: boolean;
}

interface Cannonball {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  alive: boolean;
}

const STAGE_CONFIGS = [
  {
    stageNum: 1,
    title: 'Stage 1: 우드 타워 (Wood Tower)',
    zombieCount: 2,
    balls: 4,
  },
  {
    stageNum: 2,
    title: 'Stage 2: TNT 연쇄 폭발 (TNT Chain)',
    zombieCount: 3,
    balls: 4,
  },
  {
    stageNum: 3,
    title: 'Stage 3: 메가 캐슬 요새 (Mega Castle)',
    zombieCount: 4,
    balls: 5,
  },
];

export const PokiTearBlocksDownGame: React.FC<PokiTearBlocksDownGameProps> = ({
  onBack,
  cardId = 58,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Gameplay UI states
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [cannonballsLeft, setCannonballsLeft] = useState(4);
  const [zombiesLeft, setZombiesLeft] = useState(2);
  const [score, setScore] = useState(0);
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [stageClearModal, setStageClearModal] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Aiming angles
  const [cannonYaw, setCannonYaw] = useState(0); // Left/Right
  const [cannonPitch, setCannonPitch] = useState(0.45); // Up/Down
  const isDraggingRef = useRef(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Stats refs
  const startTimeRef = useRef<number>(Date.now());
  const scoreRef = useRef<number>(0);
  const stageIdxRef = useRef<number>(0);
  const ballsLeftRef = useRef<number>(4);
  const zombiesLeftRef = useRef<number>(2);

  useEffect(() => {
    scoreRef.current = score;
    stageIdxRef.current = currentStageIdx;
    ballsLeftRef.current = cannonballsLeft;
    zombiesLeftRef.current = zombiesLeft;
  }, [score, currentStageIdx, cannonballsLeft, zombiesLeft]);

  // Three.js context refs
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cannonBase: THREE.Group;
    cannonBarrelPivot: THREE.Group;
    cannonBarrel: THREE.Mesh;
    aimLine: THREE.Line;
    blocks: BlockPhysics[];
    zombies: ZombiePhysics[];
    activeBalls: Cannonball[];
    explosionParticles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
    cameraShake: number;
  } | null>(null);

  // Helper: Card Badge Texture
  const createCardBadgeTexture = (id: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawCardSprite(ctx, id, 0, 0, 160, 200);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  };

  // Helper: Wood & TNT Textures
  const createTNTTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 90, 216, 76);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  };

  // Trigger Explosion Burst
  const triggerExplosion = useCallback((x: number, y: number, z: number, isMega = false) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) {
      navigator.vibrate(isMega ? [80, 40, 120, 50, 160] : [60, 30, 80]);
    }
    three.cameraShake = isMega ? 0.7 : 0.4;

    const count = isMega ? 90 : 50;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;

      const c = new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 0.95, 0.55);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * (isMega ? 14 : 9),
        3.0 + Math.random() * (isMega ? 10 : 6),
        (Math.random() - 0.5) * (isMega ? 14 : 9)
      ));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    if (three.explosionParticles) {
      three.scene.remove(three.explosionParticles);
    }
    three.explosionParticles = new THREE.Points(geo, mat);
    three.particleVels = vels;
    three.scene.add(three.explosionParticles);
  }, []);

  // Build Structure For Selected Stage
  const buildStageStructure = useCallback((stageIdx: number) => {
    const three = threeRef.current;
    if (!three) return;

    // Clean up old blocks
    for (const b of three.blocks) {
      three.scene.remove(b.mesh);
    }
    three.blocks = [];

    // Clean up old zombies
    for (const z of three.zombies) {
      three.scene.remove(z.group);
    }
    three.zombies = [];

    // Clean up old balls
    for (const ball of three.activeBalls) {
      three.scene.remove(ball.mesh);
    }
    three.activeBalls = [];

    const woodMat = new THREE.MeshLambertMaterial({ color: 0x92400e }); // Rich wood brown
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x64748b }); // Slate stone grey
    const tntMat = new THREE.MeshLambertMaterial({ map: createTNTTexture() });

    const createBlock = (type: 'wood' | 'stone' | 'tnt', x: number, y: number, z: number, w: number, h: number, d: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      let mat = woodMat;
      if (type === 'stone') mat = stoneMat;
      if (type === 'tnt') mat = tntMat;

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      three.scene.add(mesh);

      three.blocks.push({
        mesh,
        type,
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(0, 0, 0),
        rot: new THREE.Vector3(0, 0, 0),
        rotVel: new THREE.Vector3(0, 0, 0),
        isSleeping: false,
      });
    };

    const createZombie = (x: number, y: number, z: number) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);

      const skinMat = new THREE.MeshLambertMaterial({ color: 0x22c55e }); // Zombie green
      const shirtMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 }); // Blue shirt
      const pantsMat = new THREE.MeshLambertMaterial({ color: 0x475569 });

      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), shirtMat);
      body.position.y = 0.85;
      g.add(body);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), skinMat);
      head.position.y = 1.45;
      g.add(head);

      // Arms (outstretched zombie arms)
      const armGeo = new THREE.BoxGeometry(0.14, 0.14, 0.6);
      const lArm = new THREE.Mesh(armGeo, skinMat);
      lArm.position.set(-0.32, 0.95, -0.28);
      g.add(lArm);

      const rArm = new THREE.Mesh(armGeo, skinMat);
      rArm.position.set(0.32, 0.95, -0.28);
      g.add(rArm);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.2);
      const lLeg = new THREE.Mesh(legGeo, pantsMat);
      lLeg.position.set(-0.14, 0.28, 0);
      g.add(lLeg);

      const rLeg = new THREE.Mesh(legGeo, pantsMat);
      rLeg.position.set(0.14, 0.28, 0);
      g.add(rLeg);

      three.scene.add(g);
      three.zombies.push({
        group: g,
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(0, 0, 0),
        alive: true,
      });
    };

    const targetZ = -2.0;

    if (stageIdx === 0) {
      // Stage 1: 3-Layer Wood Tower with 2 Zombies
      // Base layer
      createBlock('stone', -1.2, 0.5, targetZ, 0.8, 1.0, 0.8);
      createBlock('stone', 1.2, 0.5, targetZ, 0.8, 1.0, 0.8);

      // Beam 1
      createBlock('wood', 0, 1.2, targetZ, 3.4, 0.4, 1.0);

      // Mid pillars
      createBlock('wood', -1.0, 2.0, targetZ, 0.6, 1.2, 0.6);
      createBlock('wood', 1.0, 2.0, targetZ, 0.6, 1.2, 0.6);

      // Beam 2
      createBlock('wood', 0, 2.8, targetZ, 2.8, 0.4, 1.0);

      // Top pillars
      createBlock('wood', -0.7, 3.6, targetZ, 0.5, 1.2, 0.5);
      createBlock('wood', 0.7, 3.6, targetZ, 0.5, 1.2, 0.5);

      // Roof
      createBlock('wood', 0, 4.4, targetZ, 2.2, 0.4, 0.9);

      // 2 Zombies
      createZombie(-0.7, 4.6, targetZ);
      createZombie(0.7, 4.6, targetZ);

      setZombiesLeft(2);
      setCannonballsLeft(4);
    } else if (stageIdx === 1) {
      // Stage 2: TNT Explosive Tower with 3 Zombies
      // Foundations
      createBlock('stone', -1.8, 0.5, targetZ, 0.8, 1.0, 0.8);
      createBlock('stone', 0, 0.5, targetZ, 0.8, 1.0, 0.8);
      createBlock('stone', 1.8, 0.5, targetZ, 0.8, 1.0, 0.8);

      // Beam 1
      createBlock('wood', 0, 1.2, targetZ, 4.6, 0.4, 1.2);

      // Mid layer with 2 TNT blocks!
      createBlock('wood', -1.8, 2.0, targetZ, 0.6, 1.2, 0.6);
      createBlock('tnt', -0.6, 2.0, targetZ, 0.9, 0.9, 0.9);
      createBlock('tnt', 0.6, 2.0, targetZ, 0.9, 0.9, 0.9);
      createBlock('wood', 1.8, 2.0, targetZ, 0.6, 1.2, 0.6);

      // Beam 2
      createBlock('wood', 0, 2.8, targetZ, 4.4, 0.4, 1.2);

      // Top pillars
      createBlock('wood', -1.2, 3.6, targetZ, 0.6, 1.2, 0.6);
      createBlock('wood', 0, 3.6, targetZ, 0.6, 1.2, 0.6);
      createBlock('wood', 1.2, 3.6, targetZ, 0.6, 1.2, 0.6);

      // Roof
      createBlock('stone', 0, 4.4, targetZ, 3.6, 0.4, 1.0);

      // 3 Zombies on roof
      createZombie(-1.2, 4.6, targetZ);
      createZombie(0, 4.6, targetZ);
      createZombie(1.2, 4.6, targetZ);

      setZombiesLeft(3);
      setCannonballsLeft(4);
    } else {
      // Stage 3: Mega Castle Fortress with 3 TNT and 4 Zombies
      // 4 Heavy Pillars
      createBlock('stone', -2.5, 0.6, targetZ, 1.0, 1.2, 1.0);
      createBlock('stone', -0.8, 0.6, targetZ, 0.9, 1.2, 0.9);
      createBlock('stone', 0.8, 0.6, targetZ, 0.9, 1.2, 0.9);
      createBlock('stone', 2.5, 0.6, targetZ, 1.0, 1.2, 1.0);

      // Slab 1
      createBlock('wood', 0, 1.4, targetZ, 6.2, 0.4, 1.4);

      // Mid TNT fortress core
      createBlock('tnt', -2.0, 2.2, targetZ, 0.9, 0.9, 0.9);
      createBlock('stone', -0.7, 2.2, targetZ, 0.7, 1.2, 0.7);
      createBlock('tnt', 0, 2.2, targetZ, 0.9, 0.9, 0.9);
      createBlock('stone', 0.7, 2.2, targetZ, 0.7, 1.2, 0.7);
      createBlock('tnt', 2.0, 2.2, targetZ, 0.9, 0.9, 0.9);

      // Slab 2
      createBlock('wood', 0, 3.0, targetZ, 5.8, 0.4, 1.4);

      // Top ramparts
      createBlock('stone', -2.2, 3.8, targetZ, 0.7, 1.2, 0.7);
      createBlock('wood', -0.8, 3.8, targetZ, 0.6, 1.2, 0.6);
      createBlock('wood', 0.8, 3.8, targetZ, 0.6, 1.2, 0.6);
      createBlock('stone', 2.2, 3.8, targetZ, 0.7, 1.2, 0.7);

      // Crown slab
      createBlock('stone', 0, 4.6, targetZ, 5.2, 0.4, 1.2);

      // 4 Zombies
      createZombie(-2.2, 4.8, targetZ);
      createZombie(-0.8, 4.8, targetZ);
      createZombie(0.8, 4.8, targetZ);
      createZombie(2.2, 4.8, targetZ);

      setZombiesLeft(4);
      setCannonballsLeft(5);
    }
  }, []);

  // Update 3D Aiming Line
  const updateAimLine = useCallback((yaw: number, pitch: number) => {
    const three = threeRef.current;
    if (!three) return;

    // Cannon Barrel Pivot update
    three.cannonBarrelPivot.rotation.y = yaw;
    three.cannonBarrel.rotation.x = -pitch;

    // Calculate trajectory points
    const points: THREE.Vector3[] = [];
    const speed = 22.0;
    const dir = new THREE.Vector3(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    );

    const startP = new THREE.Vector3(0, 1.4, 15.0);
    const vel = dir.clone().multiplyScalar(speed);
    const gravity = new THREE.Vector3(0, -9.8, 0);

    const timeStep = 0.04;
    const currentP = startP.clone();
    const currentV = vel.clone();

    for (let i = 0; i < 30; i++) {
      points.push(currentP.clone());
      currentP.addScaledVector(currentV, timeStep);
      currentV.addScaledVector(gravity, timeStep);
      if (currentP.y < 0) break;
    }

    three.aimLine.geometry.setFromPoints(points);
    three.aimLine.computeLineDistances();
  }, []);

  // Fire Cannonball!
  const handleFireCannon = () => {
    const three = threeRef.current;
    if (!three || ballsLeftRef.current <= 0 || gameOver || gameWon || stageClearModal) return;

    const newBalls = ballsLeftRef.current - 1;
    setCannonballsLeft(newBalls);

    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
    three.cameraShake = 0.35;

    // Muzzle position & direction
    const speed = 23.0;
    const dir = new THREE.Vector3(
      -Math.sin(cannonYaw) * Math.cos(cannonPitch),
      Math.sin(cannonPitch),
      -Math.cos(cannonYaw) * Math.cos(cannonPitch)
    );

    const startPos = new THREE.Vector3(0, 1.4, 15.0);

    // Create 3D Iron Cannonball
    const ballGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.9,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.copy(startPos);
    ballMesh.castShadow = true;
    three.scene.add(ballMesh);

    three.activeBalls.push({
      mesh: ballMesh,
      pos: startPos.clone(),
      vel: dir.multiplyScalar(speed),
      alive: true,
    });

    setEventBanner('포탄 발사! (FIRE!)');
    setTimeout(() => setEventBanner(null), 1000);
  };

  // Next Stage Handler
  const handleNextStage = () => {
    const nextIdx = currentStageIdx + 1;
    setCurrentStageIdx(nextIdx);
    setStageClearModal(false);
    buildStageStructure(nextIdx);
  };

  // Restart Handler
  const handleRestart = () => {
    setCurrentStageIdx(0);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setStageClearModal(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();
    buildStageStructure(0);
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate dark night testing range
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 20.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    sunLight.position.set(15, 25, 15);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const spotLight = new THREE.SpotLight(0xfef08a, 2.0, 40, Math.PI / 3, 0.5);
    spotLight.position.set(0, 12, -2);
    spotLight.target.position.set(0, 2, -2);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // Ground Platform
    const groundGeo = new THREE.PlaneGeometry(36, 48);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid markings
    const grid = new THREE.GridHelper(36, 18, 0x38bdf8, 0x334155);
    grid.position.y = 0.01;
    scene.add(grid);

    // 3D Player Cannon Mount
    const cannonBase = new THREE.Group();
    cannonBase.position.set(0, 0, 15.0);

    const basePlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.4, 16),
      new THREE.MeshLambertMaterial({ color: 0x475569 })
    );
    basePlatform.position.y = 0.2;
    cannonBase.add(basePlatform);

    // Cannon Barrel Pivot Group
    const cannonBarrelPivot = new THREE.Group();
    cannonBarrelPivot.position.set(0, 0.5, 0);

    const cannonBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.42, 2.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 })
    );
    cannonBarrel.rotation.x = -0.45; // Default pitch
    cannonBarrel.position.set(0, 0.6, -0.7);
    cannonBarrelPivot.add(cannonBarrel);

    // Card No.058 Hero Badge on Cannon Mount
    const badgeGeo = new THREE.PlaneGeometry(0.55, 0.7);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: createCardBadgeTexture(cardId),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 1.7, 0.6);
    cannonBase.add(badge);

    cannonBase.add(cannonBarrelPivot);
    scene.add(cannonBase);

    // 3D Aim Trajectory Line
    const aimGeo = new THREE.BufferGeometry();
    const aimMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.35,
      gapSize: 0.2,
      linewidth: 3,
    });
    const aimLine = new THREE.Line(aimGeo, aimMat);
    scene.add(aimLine);

    threeRef.current = {
      scene,
      camera,
      renderer,
      cannonBase,
      cannonBarrelPivot,
      cannonBarrel,
      aimLine,
      blocks: [],
      zombies: [],
      activeBalls: [],
      explosionParticles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
      cameraShake: 0,
    };

    updateAimLine(0, 0.45);
    buildStageStructure(0);

    // Main Animation & Physics Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Camera Shake decay
      if (three.cameraShake > 0) {
        three.camera.position.x = (Math.random() - 0.5) * three.cameraShake;
        three.camera.position.y = 4.5 + (Math.random() - 0.5) * three.cameraShake;
        three.cameraShake *= 0.88;
      } else {
        three.camera.position.set(0, 4.5, 20.0);
      }

      // Update Active Cannonballs
      for (let bi = three.activeBalls.length - 1; bi >= 0; bi--) {
        const ball = three.activeBalls[bi];
        if (!ball.alive) continue;

        // Apply gravity & step position
        ball.vel.y -= 9.8 * delta;
        ball.pos.addScaledVector(ball.vel, delta);
        ball.mesh.position.copy(ball.pos);

        // Ground bounce
        if (ball.pos.y <= 0.38) {
          ball.pos.y = 0.38;
          ball.vel.y *= -0.4;
          ball.vel.x *= 0.7;
          ball.vel.z *= 0.7;
          if (Math.abs(ball.vel.y) < 0.5) {
            ball.alive = false;
            three.scene.remove(ball.mesh);
            three.activeBalls.splice(bi, 1);
            continue;
          }
        }

        // Check Collision with Blocks
        for (const block of three.blocks) {
          const dist = ball.pos.distanceTo(block.pos);
          if (dist < 1.1) {
            // Transfer impulse to block
            const impulse = ball.vel.clone().multiplyScalar(0.65);
            block.vel.add(impulse);
            block.rotVel.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
            block.isSleeping = false;

            // Slow down ball
            ball.vel.multiplyScalar(0.4);

            // If TNT, trigger massive explosion!
            if (block.type === 'tnt' && !block.tntExploded) {
              block.tntExploded = true;
              triggerExplosion(block.pos.x, block.pos.y, block.pos.z, true);
              setScore((s) => s + 200);

              // Blast radius 4.5m affects all nearby blocks and zombies!
              for (const other of three.blocks) {
                const blastDist = other.pos.distanceTo(block.pos);
                if (blastDist < 4.8 && blastDist > 0.1) {
                  const blastDir = other.pos.clone().sub(block.pos).normalize();
                  const blastPower = Math.max(5, (4.8 - blastDist) * 7.5);
                  other.vel.add(blastDir.multiplyScalar(blastPower));
                  other.vel.y += 4.0;
                  other.isSleeping = false;
                }
              }

              for (const z of three.zombies) {
                const zDist = z.pos.distanceTo(block.pos);
                if (zDist < 5.2 && z.alive) {
                  const zDir = z.pos.clone().sub(block.pos).normalize();
                  z.vel.add(zDir.multiplyScalar(14.0));
                  z.vel.y += 8.0;
                }
              }
            }
          }
        }

        // Check Direct Collision with Zombies
        for (const z of three.zombies) {
          if (!z.alive) continue;
          const dist = ball.pos.distanceTo(z.pos);
          if (dist < 1.1) {
            // Ragdoll blast zombie
            z.vel.copy(ball.vel.clone().multiplyScalar(0.8));
            z.vel.y += 5.0;
          }
        }
      }

      // Update Blocks Physics
      for (const b of three.blocks) {
        if (b.isSleeping) continue;

        b.vel.y -= 9.8 * delta;
        b.pos.addScaledVector(b.vel, delta);
        b.rot.addScaledVector(b.rotVel, delta);

        // Ground clamp
        if (b.pos.y <= 0.4) {
          b.pos.y = 0.4;
          b.vel.y *= -0.25;
          b.vel.x *= 0.6;
          b.vel.z *= 0.6;
          b.rotVel.multiplyScalar(0.7);
          if (b.vel.length() < 0.2) {
            b.isSleeping = true;
          }
        }

        b.mesh.position.copy(b.pos);
        b.mesh.rotation.set(b.rot.x, b.rot.y, b.rot.z);
      }

      // Update Zombies Physics & Knockdown Detection
      let aliveCount = 0;
      for (const z of three.zombies) {
        if (!z.alive) continue;

        z.vel.y -= 9.8 * delta;
        z.pos.addScaledVector(z.vel, delta);
        z.group.position.copy(z.pos);

        // If fell below Y < 0.6 or launched far away, Zombie Eliminated!
        if (z.pos.y < 0.6 || Math.abs(z.pos.x) > 10 || Math.abs(z.pos.z - (-2)) > 8) {
          z.alive = false;
          triggerExplosion(z.pos.x, 0.8, z.pos.z, false);
          setScore((s) => s + 150);
          setEventBanner('좀비 격파! (+150)');
          setTimeout(() => setEventBanner(null), 1000);
        } else {
          aliveCount++;
        }
      }

      setZombiesLeft(aliveCount);

      // Check Stage Clear!
      if (aliveCount === 0 && !stageClearModal && !gameOver && !gameWon) {
        if (stageIdxRef.current < STAGE_CONFIGS.length - 1) {
          setStageClearModal(true);
        } else {
          // Grand Victory!
          setGameWon(true);
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const reward = calculateAndDepositMissionReward({
            gameId: 'poki-tear-blocks-down',
            gameTitle: 'Tear Blocks Down 3D',
            isVictory: true,
            score: scoreRef.current + 300,
            maxTargetScore: 1200,
            durationSeconds: duration,
          });
          setRewardResult(reward);
        }
      }

      // Check Out of Balls Failure
      if (ballsLeftRef.current <= 0 && three.activeBalls.length === 0 && aliveCount > 0 && !stageClearModal && !gameOver && !gameWon) {
        setTimeout(() => {
          if (zombiesLeftRef.current > 0 && !gameOver) {
            setGameOver(true);
            const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const reward = calculateAndDepositMissionReward({
              gameId: 'poki-tear-blocks-down',
              gameTitle: 'Tear Blocks Down 3D',
              isVictory: false,
              score: scoreRef.current,
              maxTargetScore: 1200,
              durationSeconds: duration,
            });
            setRewardResult(reward);
          }
        }, 1500);
      }

      // Explosion Particles
      if (three.explosionParticles && three.particleVels.length > 0) {
        const posAttr = three.explosionParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < three.particleVels.length; i++) {
          arr[i * 3] += three.particleVels[i].x * delta;
          arr[i * 3 + 1] += three.particleVels[i].y * delta;
          arr[i * 3 + 2] += three.particleVels[i].z * delta;
          three.particleVels[i].y -= 9.8 * delta;
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
      three.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
        threeRef.current.renderer.dispose();
        if (container.contains(threeRef.current.renderer.domElement)) {
          container.removeChild(threeRef.current.renderer.domElement);
        }
      }
    };
  }, [cardId, buildStageStructure, triggerExplosion, updateAimLine]);

  // Touch Drag Aiming Handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    lastTouchRef.current = { x: clientX, y: clientY };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || !lastTouchRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - lastTouchRef.current.x;
    const dy = clientY - lastTouchRef.current.y;
    lastTouchRef.current = { x: clientX, y: clientY };

    // Update yaw & pitch
    const newYaw = Math.max(-0.65, Math.min(0.65, cannonYaw + dx * 0.0035));
    const newPitch = Math.max(0.15, Math.min(0.85, cannonPitch - dy * 0.0035));

    setCannonYaw(newYaw);
    setCannonPitch(newPitch);
    updateAimLine(newYaw, newPitch);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const activeStage = STAGE_CONFIGS[currentStageIdx] || STAGE_CONFIGS[0];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle="TEAR BLOCKS DOWN 3D"
        onBack={onBack}
        score={score}
        targetScore={1000}
      />

      {/* Stage & Target Scoreboard Bar */}
      <div className="absolute top-14 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-5 py-2.5 rounded-none shadow-xl flex items-center gap-4 text-xs md:text-sm">
          {/* Stage Title */}
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Bomb className="w-4 h-4" />
            <span>{activeStage.title}</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Zombies Left */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">목표 좀비:</span>
            <span className="text-rose-400 font-black text-sm">
              {zombiesLeft} 마리
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Cannonballs Left */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">포탄:</span>
            <div className="flex gap-1">
              {Array.from({ length: activeStage.balls }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full inline-block border ${
                    i < cannonballsLeft
                      ? 'bg-amber-500 border-amber-300'
                      : 'bg-slate-800 border-slate-600 opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Banner */}
      {eventBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-amber-500 text-slate-950 font-black px-6 py-1.5 border-2 border-amber-200 text-sm md:text-base shadow-2xl uppercase">
            {eventBanner}
          </div>
        </div>
      )}

      {/* Touch Aim Guide Overlay */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none text-[11px] text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-sm">
        <span className="flex items-center gap-1 text-sky-400 font-semibold mb-0.5">
          <Crosshair className="w-3.5 h-3.5" /> 화면 드래그로 각도 조준
        </span>
        좌우 각도: {(cannonYaw * (180 / Math.PI)).toFixed(1)}° | 앙각: {(cannonPitch * (180 / Math.PI)).toFixed(1)}°
      </div>

      {/* Large 76px FIRE Button */}
      <div className="absolute bottom-8 right-6 z-20 pointer-events-auto">
        <button
          onClick={handleFireCannon}
          disabled={cannonballsLeft <= 0}
          className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl transition-transform active:scale-90 font-black ${
            cannonballsLeft > 0
              ? 'bg-gradient-to-tr from-amber-600 to-amber-500 border-yellow-200 text-slate-950 hover:brightness-110'
              : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'
          }`}
        >
          <Flame className="w-7 h-7 mb-0.5" />
          <span className="text-xs tracking-wider">발사</span>
        </button>
      </div>

      {/* Stage Clear Modal */}
      {stageClearModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-emerald-400 mb-1">
              {activeStage.title} 붕괴 완료!
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              모든 좀비를 추락 격파하고 다음 스테이지로 진출합니다!
            </p>
            <div className="bg-slate-950 border border-slate-800 p-3 mb-5 text-xs text-left space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>다음 스테이지:</span>
                <span className="text-yellow-400 font-bold">
                  {STAGE_CONFIGS[currentStageIdx + 1]?.title}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>타겟 좀비:</span>
                <span className="text-rose-400 font-bold">
                  {STAGE_CONFIGS[currentStageIdx + 1]?.zombieCount} 마리
                </span>
              </div>
            </div>
            <button
              onClick={handleNextStage}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase rounded-sm transition-all"
            >
              다음 스테이지 [▶]
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">포탄 소진 실패</h2>
            <p className="text-xs text-slate-300 mb-4">
              모든 포탄을 사용했으나 좀비가 타워에 남아있습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-sm flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> 재도전
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase rounded-sm"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {(gameWon || (gameOver && rewardResult)) && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          reward={rewardResult}
          onClose={onBack}
        />
      )}
    </div>
  );
};

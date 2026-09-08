import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRagdollChaosGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface Contraption {
  id: string;
  type: 'tnt' | 'bouncer' | 'buzzsaw' | 'tesla' | 'piston';
  mesh: THREE.Group | THREE.Mesh;
  pos: THREE.Vector3;
  radius: number;
  active: boolean;
  cooldown: number;
  extraMesh?: THREE.Mesh;
  originalY?: number;
}

export const PokiRagdollChaosGame: React.FC<PokiRagdollChaosGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 10;
  const containerRef = useRef<HTMLDivElement>(null);

  // HUD & Game States
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [hits, setHits] = useState<number>(0);
  const [maxVelocity, setMaxVelocity] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_ragdoll_chaos') !== 'true';
    } catch {
      return true;
    }
  });

  // Slingshot Aim State
  const [isAiming, setIsAiming] = useState<boolean>(false);

  // Ref tracking game state for requestAnimationFrame
  const gameStateRef = useRef({
    score: 0,
    combo: 1,
    hits: 0,
    maxVelocity: 0,
    isGameOver: false,
    isVictory: false,
    comboTimer: 0,
  });

  // Touch & Drag state
  const touchStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  // Physics & Ragdoll state
  const ragdollRef = useRef({
    pos: new THREE.Vector3(0, 6, 0),
    vel: new THREE.Vector3(0, 0, 0),
    rot: new THREE.Euler(0, 0, 0),
    angVel: new THREE.Vector3(0, 0, 0),
    limbAngles: {
      leftArm: 0,
      rightArm: 0,
      leftLeg: 0,
      rightLeg: 0,
      headTilt: 0,
    },
    isGrounded: false,
  });

  // Three.js scene refs
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    ragdollGroup: THREE.Group;
    torsoMesh: THREE.Mesh;
    headMesh: THREE.Mesh;
    leftArmMesh: THREE.Mesh;
    rightArmMesh: THREE.Mesh;
    leftLegMesh: THREE.Mesh;
    rightLegMesh: THREE.Mesh;
    contraptions: Contraption[];
    particles: Particle[];
    trajectoryDots: THREE.Mesh[];
    teslaBeam: THREE.Line | null;
    flashLight: THREE.PointLight;
  } | null>(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }, []);

  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // End Game and Settle Rewards
  const handleGameOver = useCallback((victory: boolean) => {
    if (gameStateRef.current.isGameOver) return;
    gameStateRef.current.isGameOver = true;
    setIsGameOver(true);
    setIsVictory(victory);

    const currentScore = gameStateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiragdollchaos',
      gameTitle: isKo ? '래그돌 카오스 3D' : 'Ragdoll Chaos 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: currentScore,
      maxTargetScore: 1500,
      isVictory: victory,
      difficulty: 'NORMAL',
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isKo, onReward, timeLeft]);

  // Back button confirmation & settlement
  const handleBackRequest = useCallback(() => {
    if (isGameOver || isVictory) {
      onExit();
      return;
    }
    setShowExitConfirm(true);
  }, [isGameOver, isVictory, onExit]);

  const confirmExitAndSettle = useCallback(() => {
    setShowExitConfirm(false);
    const currentScore = gameStateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiragdollchaos',
      gameTitle: isKo ? '래그돌 카오스 3D' : 'Ragdoll Chaos 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: currentScore,
      maxTargetScore: 1500,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    onExit();
  }, [isKo, onExit, onReward, timeLeft]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Direct actions
  const triggerTntSpawn = useCallback(() => {
    const rag = ragdollRef.current;
    rag.vel.y = 22;
    rag.vel.x += (Math.random() - 0.5) * 14;
    rag.vel.z += (Math.random() - 0.5) * 14;
    rag.angVel.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);

    gameStateRef.current.score += 150;
    gameStateRef.current.hits += 1;
    gameStateRef.current.combo = Math.min(gameStateRef.current.combo + 1, 8);
    gameStateRef.current.comboTimer = 3.0;
    setScore(gameStateRef.current.score);
    setCombo(gameStateRef.current.combo);
    setHits(gameStateRef.current.hits);

    triggerHaptic([30, 30, 50]);
    if (playSfx) playSfx('/sfx/explosion.mp3');

    // Spawn burst particles
    const sc = sceneRef.current;
    if (sc) {
      for (let i = 0; i < (lowSpecMode ? 12 : 24); i++) {
        const geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        const mat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xff4500 : 0xffd700,
          emissive: 0xff3300,
          emissiveIntensity: 0.8,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(rag.pos);
        sc.scene.add(mesh);
        sc.particles.push({
          mesh,
          vx: (Math.random() - 0.5) * 18,
          vy: Math.random() * 16 + 4,
          vz: (Math.random() - 0.5) * 18,
          life: 0,
          maxLife: 0.8,
        });
      }
      sc.flashLight.position.copy(rag.pos);
      sc.flashLight.intensity = 8;
    }
  }, [lowSpecMode, playerHeroId]);

  const triggerSuperSlap = useCallback(() => {
    const rag = ragdollRef.current;
    const slapAngle = Math.random() * Math.PI * 2;
    rag.vel.x += Math.cos(slapAngle) * 18;
    rag.vel.z += Math.sin(slapAngle) * 18;
    rag.vel.y = Math.max(rag.vel.y + 12, 14);
    rag.angVel.x += (Math.random() - 0.5) * 20;
    rag.angVel.z += (Math.random() - 0.5) * 20;

    gameStateRef.current.score += 80;
    gameStateRef.current.hits += 1;
    gameStateRef.current.combo = Math.min(gameStateRef.current.combo + 1, 8);
    gameStateRef.current.comboTimer = 2.5;
    setScore(gameStateRef.current.score);
    setCombo(gameStateRef.current.combo);
    setHits(gameStateRef.current.hits);

    triggerHaptic(35);
    if (playSfx) playSfx('/sfx/hit.mp3');
  }, [lowSpecMode, playerHeroId]);

  const resetRagdollPos = useCallback(() => {
    const rag = ragdollRef.current;
    rag.pos.set(0, 8, 0);
    rag.vel.set(0, 0, 0);
    rag.rot.set(0, 0, 0);
    rag.angVel.set(0, 0, 0);
    triggerHaptic(20);
  }, [lowSpecMode, playerHeroId]);

  // Main Three.js Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.022);

    // 2. Camera: Isometric 3/4 quarter view
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 20, 24);
    camera.lookAt(0, 2.5, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !lowSpecMode,
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1.0 : 1.5));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x334155, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    dirLight.position.set(12, 28, 16);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    const flashLight = new THREE.PointLight(0xff6600, 0, 18);
    flashLight.position.set(0, 6, 0);
    scene.add(flashLight);

    // 5. Floor & Arena Boundaries (28m x 22m)
    const floorGeo = new THREE.PlaneGeometry(30, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.7,
      metalness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // Grid on floor
    const grid = new THREE.GridHelper(30, 30, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.02;
    scene.add(grid);

    // Glowing boundary walls (Wireframe cage)
    const cageGeo = new THREE.BoxGeometry(28, 12, 22);
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    const cageLine = new THREE.LineSegments(
      cageEdges,
      new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35 })
    );
    cageLine.position.y = 6;
    scene.add(cageLine);

    // 6. Ragdoll Character Creation
    const ragdollGroup = new THREE.Group();

    // Card hero sprite texture for Torso
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 128;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#0f172a';
      bCtx.fillRect(0, 0, 128, 128);
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);

    // Torso (Main body)
    const torsoGeo = new THREE.BoxGeometry(1.2, 1.6, 0.7);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.4,
      metalness: 0.2,
      map: badgeTexture,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.castShadow = !lowSpecMode;
    ragdollGroup.add(torsoMesh);

    // Head
    const headCanvas = document.createElement('canvas');
    headCanvas.width = 128;
    headCanvas.height = 128;
    const hCtx = headCanvas.getContext('2d');
    if (hCtx) {
      hCtx.fillStyle = '#f59e0b';
      hCtx.fillRect(0, 0, 128, 128);
      // Dummy face with X_X shock eyes
      hCtx.fillStyle = '#000000';
      hCtx.font = 'bold 36px monospace';
      hCtx.textAlign = 'center';
      hCtx.fillText('X X', 64, 58);
      hCtx.beginPath();
      hCtx.arc(64, 86, 16, 0, Math.PI);
      hCtx.stroke();
    }
    const headTexture = new THREE.CanvasTexture(headCanvas);
    const headGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      map: headTexture,
      roughness: 0.3,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.35;
    headMesh.castShadow = !lowSpecMode;
    ragdollGroup.add(headMesh);

    // Limbs
    const limbMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.5,
    });

    const armGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.1, 12);
    const legGeo = new THREE.CylinderGeometry(0.22, 0.2, 1.3, 12);

    // Left Arm
    const leftArmMesh = new THREE.Mesh(armGeo, limbMat);
    leftArmMesh.position.set(-0.85, 0.2, 0);
    leftArmMesh.castShadow = !lowSpecMode;
    ragdollGroup.add(leftArmMesh);

    // Right Arm
    const rightArmMesh = new THREE.Mesh(armGeo, limbMat);
    rightArmMesh.position.set(0.85, 0.2, 0);
    rightArmMesh.castShadow = !lowSpecMode;
    ragdollGroup.add(rightArmMesh);

    // Left Leg
    const leftLegMesh = new THREE.Mesh(legGeo, limbMat);
    leftLegMesh.position.set(-0.4, -1.3, 0);
    leftLegMesh.castShadow = !lowSpecMode;
    ragdollGroup.add(leftLegMesh);

    // Right Leg
    const rightLegMesh = new THREE.Mesh(legGeo, limbMat);
    rightLegMesh.position.set(0.4, -1.3, 0);
    rightLegMesh.castShadow = !lowSpecMode;
    ragdollGroup.add(rightLegMesh);

    scene.add(ragdollGroup);

    // 7. Interactive Contraptions
    const contraptions: Contraption[] = [];

    // Helper: TNT Barrel
    const spawnTntMesh = (x: number, z: number, id: string) => {
      const group = new THREE.Group();
      const barrelGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 16);
      const barrelMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.4,
        metalness: 0.5,
      });
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.y = 0.9;
      barrel.castShadow = !lowSpecMode;
      group.add(barrel);

      // Yellow stripe
      const ringGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.35, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.9;
      group.add(ring);

      group.position.set(x, 0, z);
      scene.add(group);
      contraptions.push({
        id,
        type: 'tnt',
        mesh: group,
        pos: new THREE.Vector3(x, 0.9, z),
        radius: 1.6,
        active: true,
        cooldown: 0,
      });
    };

    // Helper: Super Bouncer
    const spawnBouncerMesh = (x: number, z: number, id: string) => {
      const group = new THREE.Group();
      const baseGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.4, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.2;
      group.add(base);

      const padGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x15803d,
        emissiveIntensity: 0.5,
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = 0.65;
      group.add(pad);

      group.position.set(x, 0, z);
      scene.add(group);
      contraptions.push({
        id,
        type: 'bouncer',
        mesh: group,
        pos: new THREE.Vector3(x, 0.65, z),
        radius: 1.5,
        active: true,
        cooldown: 0,
        extraMesh: pad,
        originalY: 0.65,
      });
    };

    // Helper: Buzzsaw
    const spawnBuzzsawMesh = (x: number, y: number, z: number, id: string) => {
      const sawGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.12, 16);
      const sawMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2,
      });
      const saw = new THREE.Mesh(sawGeo, sawMat);
      saw.rotation.x = Math.PI / 2;
      saw.position.set(x, y, z);
      saw.castShadow = !lowSpecMode;
      scene.add(saw);
      contraptions.push({
        id,
        type: 'buzzsaw',
        mesh: saw,
        pos: new THREE.Vector3(x, y, z),
        radius: 1.6,
        active: true,
        cooldown: 0,
      });
    };

    // Helper: Tesla Coil
    const spawnTeslaMesh = (x: number, z: number, id: string) => {
      const group = new THREE.Group();
      const towerGeo = new THREE.ConeGeometry(0.9, 3.2, 12);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.y = 1.6;
      group.add(tower);

      const orbGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const orbMat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        emissive: 0x3b82f6,
        emissiveIntensity: 1.0,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.y = 3.4;
      group.add(orb);

      group.position.set(x, 0, z);
      scene.add(group);
      contraptions.push({
        id,
        type: 'tesla',
        mesh: group,
        pos: new THREE.Vector3(x, 3.4, z),
        radius: 4.2, // Induction field radius
        active: true,
        cooldown: 0,
      });
    };

    // Spawn 12 Lab Contraptions
    spawnTntMesh(-7, -4, 'tnt_1');
    spawnTntMesh(7, -4, 'tnt_2');
    spawnTntMesh(0, 5, 'tnt_3');

    spawnBouncerMesh(-6, 3, 'bnc_1');
    spawnBouncerMesh(6, 3, 'bnc_2');
    spawnBouncerMesh(-10, -6, 'bnc_3');
    spawnBouncerMesh(10, -6, 'bnc_4');

    spawnBuzzsawMesh(-3.5, 3.5, -2, 'saw_1');
    spawnBuzzsawMesh(3.5, 3.5, -2, 'saw_2');
    spawnBuzzsawMesh(0, 5.5, -6, 'saw_3');

    spawnTeslaMesh(-9, 4, 'tesla_1');
    spawnTeslaMesh(9, 4, 'tesla_2');

    // 8. Slingshot Trajectory Dots
    const trajectoryDots: THREE.Mesh[] = [];
    const dotGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < 14; i++) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.visible = false;
      scene.add(dot);
      trajectoryDots.push(dot);
    }

    // Tesla zap line
    const teslaLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const teslaLineMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      linewidth: 3,
      transparent: true,
      opacity: 0,
    });
    const teslaBeam = new THREE.Line(teslaLineGeo, teslaLineMat);
    scene.add(teslaBeam);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      ragdollGroup,
      torsoMesh,
      headMesh,
      leftArmMesh,
      rightArmMesh,
      leftLegMesh,
      rightLegMesh,
      contraptions,
      particles: [],
      trajectoryDots,
      teslaBeam,
      flashLight,
    };

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    window.addEventListener('orientationchange', handleResize);

    // 10. Main Physics & Render Loop
    let lastTime = performance.now();
    let animId = 0;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const sc = sceneRef.current;
      if (!sc) return;

      const rag = ragdollRef.current;
      const gs = gameStateRef.current;

      // Decay combo timer
      if (gs.comboTimer > 0) {
        gs.comboTimer -= dt;
        if (gs.comboTimer <= 0) {
          gs.combo = 1;
          setCombo(1);
        }
      }

      // Flashlight decay
      if (sc.flashLight.intensity > 0) {
        sc.flashLight.intensity = Math.max(0, sc.flashLight.intensity - dt * 12);
      }

      // Physics Integration (Gravity + Velocity)
      if (!touchStateRef.current.isDragging) {
        rag.vel.y -= 22 * dt; // Gravity
        rag.vel.multiplyScalar(0.985); // Air Drag
        rag.angVel.multiplyScalar(0.97);

        rag.pos.addScaledVector(rag.vel, dt);

        // Rotation from angular velocity
        rag.rot.x += rag.angVel.x * dt;
        rag.rot.y += rag.angVel.y * dt;
        rag.rot.z += rag.angVel.z * dt;

        // Limbs ragdoll oscillation
        const speed = rag.vel.length();
        rag.limbAngles.leftArm = Math.sin(currentTime * 0.015) * Math.min(speed * 0.1, 1.2);
        rag.limbAngles.rightArm = -Math.sin(currentTime * 0.015) * Math.min(speed * 0.1, 1.2);
        rag.limbAngles.leftLeg = Math.cos(currentTime * 0.015) * Math.min(speed * 0.12, 1.4);
        rag.limbAngles.rightLeg = -Math.cos(currentTime * 0.015) * Math.min(speed * 0.12, 1.4);
        rag.limbAngles.headTilt = (rag.angVel.z * 0.15);

        // Update max velocity metric
        if (speed > gs.maxVelocity) {
          gs.maxVelocity = Math.round(speed * 10) / 10;
          setMaxVelocity(gs.maxVelocity);
        }

        // Boundary Floor Collision (Y = 1.0)
        if (rag.pos.y < 1.0) {
          rag.pos.y = 1.0;
          rag.vel.y = -rag.vel.y * 0.65;
          rag.vel.x *= 0.85;
          rag.vel.z *= 0.85;
          rag.isGrounded = true;

          if (Math.abs(rag.vel.y) > 4) {
            triggerHaptic(15);
            gs.score += Math.round(Math.abs(rag.vel.y) * 2 * gs.combo);
            setScore(gs.score);
          }
        } else {
          rag.isGrounded = false;
        }

        // Boundary Walls Collisions (X: -13 ~ +13, Z: -10 ~ +10)
        if (Math.abs(rag.pos.x) > 13) {
          rag.pos.x = Math.sign(rag.pos.x) * 13;
          rag.vel.x = -rag.vel.x * 0.75;
          rag.angVel.z = -rag.angVel.z * 0.8;
          triggerHaptic(12);
        }
        if (Math.abs(rag.pos.z) > 10) {
          rag.pos.z = Math.sign(rag.pos.z) * 10;
          rag.vel.z = -rag.vel.z * 0.75;
          rag.angVel.x = -rag.angVel.x * 0.8;
          triggerHaptic(12);
        }
        if (rag.pos.y > 14) {
          rag.pos.y = 14;
          rag.vel.y = -Math.abs(rag.vel.y) * 0.6;
        }

        // Interactive Contraptions Collisions
        sc.contraptions.forEach(c => {
          if (c.cooldown > 0) {
            c.cooldown -= dt;
            if (c.cooldown <= 0) c.active = true;
          }

          // Buzzsaw continuous spin
          if (c.type === 'buzzsaw') {
            c.mesh.rotation.z += dt * 18;
          }

          if (!c.active) return;

          const dist = rag.pos.distanceTo(c.pos);
          if (dist < c.radius) {
            // Collision trigger!
            c.active = false;
            c.cooldown = c.type === 'tnt' ? 3.5 : 0.6;

            gs.hits += 1;
            setHits(gs.hits);
            gs.combo = Math.min(gs.combo + 1, 8);
            gs.comboTimer = 3.0;
            setCombo(gs.combo);

            if (c.type === 'tnt') {
              // Huge explosive impulse
              const impulse = new THREE.Vector3().subVectors(rag.pos, c.pos).normalize();
              impulse.y = Math.max(impulse.y, 0.7);
              rag.vel.addScaledVector(impulse, 24);
              rag.angVel.set((Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25);

              gs.score += 250 * gs.combo;
              setScore(gs.score);
              triggerHaptic([35, 30, 45]);
              if (playSfx) playSfx('/sfx/explosion.mp3');

              // Fireball Flash
              sc.flashLight.position.copy(c.pos);
              sc.flashLight.intensity = 10;

              // Explosion particles
              for (let i = 0; i < (lowSpecMode ? 10 : 20); i++) {
                const pMesh = new THREE.Mesh(
                  new THREE.BoxGeometry(0.3, 0.3, 0.3),
                  new THREE.MeshStandardMaterial({
                    color: i % 2 === 0 ? 0xff4500 : 0xfacc15,
                    emissive: 0xff3300,
                  })
                );
                pMesh.position.copy(c.pos);
                sc.scene.add(pMesh);
                sc.particles.push({
                  mesh: pMesh,
                  vx: (Math.random() - 0.5) * 20,
                  vy: Math.random() * 15 + 3,
                  vz: (Math.random() - 0.5) * 20,
                  life: 0,
                  maxLife: 0.7,
                });
              }
            } else if (c.type === 'bouncer') {
              // High bounce
              rag.vel.y = Math.max(rag.vel.y, 0) + 18;
              rag.vel.x += (Math.random() - 0.5) * 8;
              rag.vel.z += (Math.random() - 0.5) * 8;
              gs.score += 100 * gs.combo;
              setScore(gs.score);
              triggerHaptic(20);
              if (playSfx) playSfx('/sfx/jump.mp3');
            } else if (c.type === 'buzzsaw') {
              // Slicing impact & sparks
              rag.vel.x = -rag.vel.x * 1.2 + (Math.random() - 0.5) * 10;
              rag.vel.y = Math.max(rag.vel.y, 8);
              rag.vel.z = -rag.vel.z * 1.2 + (Math.random() - 0.5) * 10;
              gs.score += 180 * gs.combo;
              setScore(gs.score);
              triggerHaptic(30);

              // Sparks
              for (let i = 0; i < (lowSpecMode ? 6 : 14); i++) {
                const sMesh = new THREE.Mesh(
                  new THREE.BoxGeometry(0.15, 0.15, 0.15),
                  new THREE.MeshBasicMaterial({ color: 0xfff000 })
                );
                sMesh.position.copy(rag.pos);
                sc.scene.add(sMesh);
                sc.particles.push({
                  mesh: sMesh,
                  vx: (Math.random() - 0.5) * 14,
                  vy: Math.random() * 10 + 2,
                  vz: (Math.random() - 0.5) * 14,
                  life: 0,
                  maxLife: 0.4,
                });
              }
            } else if (c.type === 'tesla') {
              // Electric shock
              rag.vel.y += 14;
              rag.angVel.y += 20;
              gs.score += 120 * gs.combo;
              setScore(gs.score);
              triggerHaptic([20, 20, 20]);

              // Tesla zap beam flash
              if (sc.teslaBeam) {
                const pts = [c.pos.clone(), rag.pos.clone()];
                sc.teslaBeam.geometry.setFromPoints(pts);
                (sc.teslaBeam.material as THREE.LineBasicMaterial).opacity = 1.0;
              }
            }
          }
        });

        // Check victory threshold
        if (gs.score >= 1500 && !gs.isGameOver) {
          handleGameOver(true);
        }
      }

      // Fade tesla beam
      if (sc.teslaBeam) {
        const mat = sc.teslaBeam.material as THREE.LineBasicMaterial;
        if (mat.opacity > 0) mat.opacity = Math.max(0, mat.opacity - dt * 4);
      }

      // Apply to Ragdoll 3D Group
      sc.ragdollGroup.position.copy(rag.pos);
      sc.ragdollGroup.rotation.copy(rag.rot);

      // Limb rotations
      sc.leftArmMesh.rotation.z = rag.limbAngles.leftArm + 0.3;
      sc.rightArmMesh.rotation.z = rag.limbAngles.rightArm - 0.3;
      sc.leftLegMesh.rotation.x = rag.limbAngles.leftLeg;
      sc.rightLegMesh.rotation.x = rag.limbAngles.rightLeg;
      sc.headMesh.rotation.z = rag.limbAngles.headTilt;

      // Update Particles
      for (let i = sc.particles.length - 1; i >= 0; i--) {
        const p = sc.particles[i];
        p.life += dt;
        p.vy -= 18 * dt; // particle gravity
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        const scale = 1 - p.life / p.maxLife;
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          sc.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          sc.particles.splice(i, 1);
        }
      }

      // Camera smooth follow (soft clamp)
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, rag.pos.x * 0.25, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, Math.max(16, rag.pos.y * 0.35 + 16), 0.08);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [lowSpecMode, playerHeroId]);

  // Touch & Drag Slingshot Handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameStateRef.current.isGameOver) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    touchStateRef.current.isDragging = true;
    touchStateRef.current.startX = clientX;
    touchStateRef.current.startY = clientY;
    touchStateRef.current.currentX = clientX;
    touchStateRef.current.currentY = clientY;
    setIsAiming(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStateRef.current.isDragging || !sceneRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    touchStateRef.current.currentX = clientX;
    touchStateRef.current.currentY = clientY;

    const dx = clientX - touchStateRef.current.startX;
    const dy = clientY - touchStateRef.current.startY;

    // Slingshot vector (Pull back -> launch opposite)
    // Three.js Screen: Screen Right = -X, Screen Left = +X (Camera looking from +Z to 0)
    // When pulling right (dx > 0), launch left (+X). When pulling down (dy > 0), launch forward/up.
    const launchVx = dx * 0.12;
    const launchVy = Math.max(-dy * 0.14, 2);
    const launchVz = -dy * 0.12;

    const rag = ragdollRef.current;
    const dots = sceneRef.current.trajectoryDots;

    // Simulate trajectory arc
    let simX = rag.pos.x;
    let simY = rag.pos.y;
    let simZ = rag.pos.z;
    let curVy = launchVy;

    dots.forEach((dot, idx) => {
      dot.visible = true;
      const step = 0.08;
      simX += launchVx * step;
      curVy -= 22 * step;
      simY += curVy * step;
      simZ += launchVz * step;
      dot.position.set(simX, Math.max(0.2, simY), simZ);
    });
  };

  const handleTouchEnd = () => {
    if (!touchStateRef.current.isDragging) return;
    touchStateRef.current.isDragging = false;
    setIsAiming(false);

    if (sceneRef.current) {
      sceneRef.current.trajectoryDots.forEach(d => (d.visible = false));
    }

    const dx = touchStateRef.current.currentX - touchStateRef.current.startX;
    const dy = touchStateRef.current.currentY - touchStateRef.current.startY;
    const dist = Math.hypot(dx, dy);

    const rag = ragdollRef.current;

    if (dist < 15) {
      // Tap on ragdoll: Direct slap/poke
      triggerSuperSlap();
      return;
    }

    // Slingshot Launch!
    const launchVx = dx * 0.14;
    const launchVy = Math.max(-dy * 0.16, 5);
    const launchVz = -dy * 0.14;

    rag.vel.set(launchVx, launchVy, launchVz);
    rag.angVel.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18);

    triggerHaptic(25);
    if (playSfx) playSfx('/sfx/whoosh.mp3');
  };

  // 60-Second Countdown Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(gameStateRef.current.score >= 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleGameOver, isGameOver, isVictory, showTutorial]);

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '실험실 슬링샷 발사' : 'Slingshot Launch',
      badge: isKo ? '조작' : 'Controls',
      description: isKo
        ? '화면을 드래그하여 뒤로 당기면 3D 궤적이 표시되고, 손을 놓으면 래그돌이 초강력 발사됩니다!'
        : 'Drag backwards to aim the 3D trajectory arc, then release to launch the ragdoll dummy!',
      keyPoints: isKo
        ? ['화면 터치 드래그로 조준', '손을 떼면 강력 발사', '공중 탭 시 추가 슬랩']
        : ['Drag to aim arc', 'Release to launch', 'Tap mid-air to slap'],
      iconType: 'GESTURES',
    },
    {
      title: isKo ? '연쇄 혼돈 실험 장치' : 'Chaos Contraptions',
      badge: isKo ? '장치' : 'Traps',
      description: isKo
        ? 'TNT 배럴, 점프 스프링, 회전 톱날, 테슬라 방전 타워와 연속 충돌하여 대량의 콤보 점수를 획득하세요!'
        : 'Chain collisions with TNT barrels, bouncers, buzzsaws, and Tesla coils to multiply your chaos score!',
      keyPoints: isKo
        ? ['TNT 폭발로 공중 부양', '스프링으로 연속 바운스', '톱날/테슬라로 콤보 극대화']
        : ['TNT huge blast', 'Spring super bounce', 'Buzzsaw & Tesla chains'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '모바일 액션 버튼 & 보상' : 'Action & Rewards',
      badge: isKo ? '보상' : 'Rewards',
      description: isKo
        ? '하단 [💣 TNT] 또는 [⚡ SLAP] 버튼을 눌러 언제든 래그돌을 날려버리고 1,500점 달성 시 승리 보상을 획득하세요.'
        : 'Tap [💣 TNT] or [⚡ SLAP] buttons anytime to fling the ragdoll and reach 1500 points to win!',
      keyPoints: isKo
        ? ['[TNT] 즉시 폭발 점프', '[SLAP] 메가 임팩트 펀치', '1,500점 달성 시 승리']
        : ['[TNT] Immediate blast', '[SLAP] Mega impact punch', 'Reach 1,500 pts to win'],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      {/* Three.js 3D Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle={isKo ? '래그돌 카오스 3D' : 'Ragdoll Chaos 3D'}
        onBack={handleBackRequest}
        score={score}
        maxScore={1500}
        timerSec={timeLeft}
        combo={combo}
        stats={[
          { label: isKo ? '충돌' : 'HITS', value: `${hits}` },
          { label: isKo ? '최고속도' : 'SPEED', value: `${maxVelocity}m/s` },
          { label: isKo ? '콤보' : 'COMBO', value: `x${combo}` },
        ]}
      />

      {/* Slingshot Visual Indicator */}
      {isAiming && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 text-xs font-mono font-bold px-4 py-1.5 rounded-full shadow-lg pointer-events-none animate-pulse">
          {isKo ? '🎯 슬링샷 조준 중! 손을 떼면 발사' : '🎯 AIMING SLINGSHOT! RELEASE TO LAUNCH'}
        </div>
      )}

      {/* Mobile Pure Touch Action Buttons (Bottom Bar) */}
      <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-between pointer-events-auto z-40 max-w-md mx-auto">
        {/* Reset Button */}
        <button
          onClick={e => {
            e.stopPropagation();
            resetRagdollPos();
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-600 text-slate-300 font-mono text-xs flex flex-col items-center justify-center active:scale-90 active:bg-slate-700 shadow-lg"
          title="Reset Position"
        >
          <span className="text-lg">🔄</span>
          <span className="scale-75 font-bold">RESET</span>
        </button>

        {/* Super Slap Button */}
        <button
          onClick={e => {
            e.stopPropagation();
            triggerSuperSlap();
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 border-2 border-sky-300 text-white font-mono text-xs flex flex-col items-center justify-center active:scale-90 shadow-xl"
          title="Super Slap"
        >
          <span className="text-2xl">⚡</span>
          <span className="font-extrabold tracking-wider mt-0.5">SLAP</span>
        </button>

        {/* TNT Spawn Button */}
        <button
          onClick={e => {
            e.stopPropagation();
            triggerTntSpawn();
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 border-2 border-amber-300 text-white font-mono text-xs flex flex-col items-center justify-center active:scale-90 shadow-xl"
          title="Spawn TNT"
        >
          <span className="text-2xl">💣</span>
          <span className="font-extrabold tracking-wider mt-0.5">TNT</span>
        </button>
      </div>

      {/* Exit & Settle Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 text-2xl font-bold">
              [?]
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '실험을 중단하시겠습니까?' : 'Exit Experiment?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '지금까지 달성한 파괴 점수와 장치 충돌 횟수에 비례하여 공정한 SNS 포인트가 안전하게 정산 지급됩니다.'
                : 'Your reward will be calculated and deposited based on your chaos score and hits.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmExitAndSettle}
                className="flex-1 py-2.5 px-3 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isKo ? '정산받고 나가기' : 'Settle & Exit'}
              </button>
              <button
                type="button"
                onClick={cancelExit}
                className="flex-1 py-2.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                {isKo ? '계속 플레이' : 'Keep Playing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory / Game Over Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          isOpen={true}
          receipt={settlementReceipt}
          onConfirm={onExit}
          isVictory={isVictory}
        />
      )}

      {/* First-time Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_ragdoll_chaos', 'true');
            } catch {
              // ignore
            }
          }}
        />
      )}
    </div>
  );
};

export default PokiRagdollChaosGame;

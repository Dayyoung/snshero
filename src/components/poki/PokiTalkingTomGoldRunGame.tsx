import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTalkingTomGoldRunGameProps {
  deck?: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  handleExit?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number | string;
  onReward?: (amount: number) => void;
}

interface ObstacleItem {
  mesh: THREE.Mesh | THREE.Group;
  lane: number;
  z: number;
  type: 'truck' | 'low_barricade' | 'high_sign';
  hitbox: { halfW: number; halfH: number; halfD: number; centerY: number };
  passed: boolean;
}

interface GoldItem {
  mesh: THREE.Mesh;
  lane: number;
  z: number;
  collected: boolean;
}

interface MagnetItem {
  mesh: THREE.Group;
  lane: number;
  z: number;
  collected: boolean;
}

export const PokiTalkingTomGoldRunGame: React.FC<PokiTalkingTomGoldRunGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onBack,
  onClose,
  cardId,
  onReward,
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const playerHeroId = (cardId ? Number(cardId) : deck[0]?.id) || 13;
  const containerRef = useRef<HTMLDivElement>(null);

  // HUD & Game States
  const [score, setScore] = useState<number>(0);
  const [goldCount, setGoldCount] = useState<number>(0);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [hasMagnet, setHasMagnet] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_tom_gold_run') !== 'true';
    } catch {
      return true;
    }
  });

  const gameStateRef = useRef({
    score: 0,
    gold: 0,
    distance: 0,
    magnetTimer: 0,
    isGameOver: false,
    isVictory: false,
    speed: 22.0,
    nextSpawnZ: -35.0,
  });

  const playerRef = useRef({
    lane: 1, // 0: Left (-3.4), 1: Center (0), 2: Right (+3.4)
    targetX: 0,
    posX: 0,
    posY: 0.9,
    posZ: 0,
    velY: 0,
    isGrounded: true,
    isSliding: false,
    slideTimer: 0,
    rollAngle: 0,
  });

  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    isSwiping: false,
  });

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    torsoMesh: THREE.Mesh;
    headMesh: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    obstacles: ObstacleItem[];
    golds: GoldItem[];
    magnets: MagnetItem[];
    roadTiles: THREE.Mesh[];
  } | null>(null);

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }, []);

  // End Game and Settle Rewards
  const handleGameOver = useCallback((victory: boolean) => {
    if (gameStateRef.current.isGameOver) return;
    gameStateRef.current.isGameOver = true;
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = gameStateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokitalkingtomgoldrun',
      gameTitle: isKo ? '토킹톰 골드런 3D' : 'Talking Tom Gold Run 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: finalScore,
      maxTargetScore: 1200,
      isVictory: victory,
      difficulty: 'NORMAL',
    });

    setSettlementReceipt(receipt);
    if (onReward) { onReward(receipt.totalSns); }
  }, [isKo, onReward, timeLeft]);

  // Back button confirmation & settlement
  const handleBackRequest = useCallback(() => {
    if (isGameOver || isVictory) {
      handleExit();
      return;
    }
    setShowExitConfirm(true);
  }, [isGameOver, isVictory, handleExit]);

  const confirmExitAndSettle = useCallback(() => {
    setShowExitConfirm(false);
    const finalScore = gameStateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokitalkingtomgoldrun',
      gameTitle: isKo ? '토킹톰 골드런 3D' : 'Talking Tom Gold Run 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: finalScore,
      maxTargetScore: 1200,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    if (onReward) { onReward(receipt.totalSns); }
    handleExit();
  }, [isKo, handleExit, onReward, timeLeft]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Lane Change Actions (Screen Relative: Left = Lane - 1, Right = Lane + 1)
  const moveLeft = useCallback(() => {
    const pl = playerRef.current;
    if (pl.lane > 0) {
      pl.lane -= 1;
      pl.targetX = (pl.lane - 1) * 3.4;
      triggerHaptic(15);
      if (playSfx) playSfx('/sfx/whoosh.mp3');
    }
  }, [playSfx, triggerHaptic]);

  const moveRight = useCallback(() => {
    const pl = playerRef.current;
    if (pl.lane < 2) {
      pl.lane += 1;
      pl.targetX = (pl.lane - 1) * 3.4;
      triggerHaptic(15);
      if (playSfx) playSfx('/sfx/whoosh.mp3');
    }
  }, [playSfx, triggerHaptic]);

  const doJump = useCallback(() => {
    const pl = playerRef.current;
    if (pl.isGrounded) {
      pl.velY = 16.8;
      pl.isGrounded = false;
      pl.isSliding = false;
      triggerHaptic(20);
      if (playSfx) playSfx('/sfx/jump.mp3');
    }
  }, [playSfx, triggerHaptic]);

  const doSlide = useCallback(() => {
    const pl = playerRef.current;
    if (!pl.isGrounded) {
      // Fast drop down from mid-air
      pl.velY = -22.0;
    }
    pl.isSliding = true;
    pl.slideTimer = 0.85;
    triggerHaptic(15);
    if (playSfx) playSfx('/sfx/slide.mp3');
  }, [playSfx, triggerHaptic]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.014);

    // 2. Camera: 3rd Person Behind-the-Back Runner View
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 160);
    camera.position.set(0, 4.8, 8.5);
    camera.lookAt(0, 1.8, -14);

    // 3. WebGL Renderer
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // 5. 3-Lane Asphalt Road Highway
    const roadTiles: THREE.Mesh[] = [];
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
    });
    for (let r = 0; r < 4; r++) {
      const roadGeo = new THREE.PlaneGeometry(12, 60);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(0, 0, -r * 60);
      roadMesh.receiveShadow = !lowSpecMode;
      scene.add(roadMesh);
      roadTiles.push(roadMesh);

      // Lane Divider Dashes
      for (let d = -28; d < 28; d += 6) {
        const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const dash1 = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3.2), dashMat);
        dash1.rotation.x = -Math.PI / 2;
        dash1.position.set(-1.7, 0.02, -r * 60 + d);
        scene.add(dash1);

        const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3.2), dashMat);
        dash2.rotation.x = -Math.PI / 2;
        dash2.position.set(1.7, 0.02, -r * 60 + d);
        scene.add(dash2);
      }
    }

    // 6. 3D Talking Tom Cat Avatar
    const playerGroup = new THREE.Group();

    // Torso with Hero badge
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 128;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#475569';
      bCtx.fillRect(0, 0, 128, 128);
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);

    const torsoGeo = new THREE.BoxGeometry(1.1, 1.2, 0.6);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Grey Tom Fur
      map: badgeTexture,
      roughness: 0.5,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 0.6;
    torsoMesh.castShadow = !lowSpecMode;
    playerGroup.add(torsoMesh);

    // Head with Cat Ears
    const headCanvas = document.createElement('canvas');
    headCanvas.width = 128;
    headCanvas.height = 128;
    const hCtx = headCanvas.getContext('2d');
    if (hCtx) {
      hCtx.fillStyle = '#94a3b8';
      hCtx.fillRect(0, 0, 128, 128);
      // Green Cat Eyes
      hCtx.fillStyle = '#22c55e';
      hCtx.beginPath();
      hCtx.arc(42, 50, 14, 0, Math.PI * 2);
      hCtx.arc(86, 50, 14, 0, Math.PI * 2);
      hCtx.fill();
      hCtx.fillStyle = '#000000';
      hCtx.fillRect(39, 44, 6, 12);
      hCtx.fillRect(83, 44, 6, 12);
      // Pink Nose
      hCtx.fillStyle = '#f472b6';
      hCtx.beginPath();
      hCtx.arc(64, 72, 8, 0, Math.PI * 2);
      hCtx.fill();
    }
    const headTexture = new THREE.CanvasTexture(headCanvas);
    const headGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      map: headTexture,
      roughness: 0.4,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.45;
    headMesh.castShadow = !lowSpecMode;
    playerGroup.add(headMesh);

    // Left & Right Cat Ears
    const earGeo = new THREE.ConeGeometry(0.25, 0.45, 8);
    const earMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.35, 1.95, 0);
    playerGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.35, 1.95, 0);
    playerGroup.add(rightEar);

    // Limbs
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const armGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.9, 10);
    const legGeo = new THREE.CylinderGeometry(0.22, 0.2, 1.0, 10);

    const leftArm = new THREE.Mesh(armGeo, limbMat);
    leftArm.position.set(-0.75, 0.5, 0);
    playerGroup.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, limbMat);
    rightArm.position.set(0.75, 0.5, 0);
    playerGroup.add(rightArm);

    const leftLeg = new THREE.Mesh(legGeo, limbMat);
    leftLeg.position.set(-0.32, -0.4, 0);
    playerGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, limbMat);
    rightLeg.position.set(0.32, -0.4, 0);
    playerGroup.add(rightLeg);

    scene.add(playerGroup);

    // 7. Obstacle & Item Pools
    const obstacles: ObstacleItem[] = [];
    const golds: GoldItem[] = [];
    const magnets: MagnetItem[] = [];

    // Helper: Spawn Delivery Truck (High blocker)
    const spawnTruck = (lane: number, z: number) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 2.8, 6.0),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
      );
      body.position.y = 1.4;
      body.castShadow = !lowSpecMode;
      group.add(body);

      // Windshield
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.0, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 })
      );
      glass.position.set(0, 2.0, 3.01);
      group.add(glass);

      group.position.set((lane - 1) * 3.4, 0, z);
      scene.add(group);
      obstacles.push({
        mesh: group,
        lane,
        z,
        type: 'truck',
        hitbox: { halfW: 1.3, halfH: 1.4, halfD: 3.0, centerY: 1.4 },
        passed: false,
      });
    };

    // Helper: Spawn Low Barricade (Jumpable)
    const spawnBarricade = (lane: number, z: number) => {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.9, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
      );
      bar.position.set((lane - 1) * 3.4, 0.45, z);
      bar.castShadow = !lowSpecMode;
      scene.add(bar);
      obstacles.push({
        mesh: bar,
        lane,
        z,
        type: 'low_barricade',
        hitbox: { halfW: 1.4, halfH: 0.45, halfD: 0.25, centerY: 0.45 },
        passed: false,
      });
    };

    // Helper: Spawn High Sign (Slidable)
    const spawnHighSign = (lane: number, z: number) => {
      const group = new THREE.Group();
      // Poles
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      p1.position.set(-1.4, 1.5, 0);
      group.add(p1);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      p2.position.set(1.4, 1.5, 0);
      group.add(p2);

      // Sign board hanging high
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.2, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      board.position.set(0, 2.4, 0);
      group.add(board);

      group.position.set((lane - 1) * 3.4, 0, z);
      scene.add(group);
      obstacles.push({
        mesh: group,
        lane,
        z,
        type: 'high_sign',
        hitbox: { halfW: 1.4, halfH: 0.6, halfD: 0.2, centerY: 2.4 },
        passed: false,
      });
    };

    // Helper: Spawn Gold Ingot
    const spawnGold = (lane: number, z: number) => {
      const gMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.35, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0xca8a04,
          emissiveIntensity: 0.5,
        })
      );
      gMesh.position.set((lane - 1) * 3.4, 0.5, z);
      scene.add(gMesh);
      golds.push({ mesh: gMesh, lane, z, collected: false });
    };

    // Helper: Spawn Magnet Powerup
    const spawnMagnet = (lane: number, z: number) => {
      const mGroup = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.18, 12, 24, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 })
      );
      ring.rotation.z = Math.PI;
      ring.position.y = 0.8;
      mGroup.add(ring);
      mGroup.position.set((lane - 1) * 3.4, 0, z);
      scene.add(mGroup);
      magnets.push({ mesh: mGroup, lane, z, collected: false });
    };

    // Initial Spawns ahead (Starting after safe zone Z < -30)
    for (let i = 0; i < 8; i++) {
      const zPos = -35 - i * 18;
      const obsLane = Math.floor(Math.random() * 3);
      const rType = Math.random();
      if (rType < 0.4) spawnTruck(obsLane, zPos);
      else if (rType < 0.7) spawnBarricade(obsLane, zPos);
      else spawnHighSign(obsLane, zPos);

      // Gold trail on free lane
      const freeLane = (obsLane + 1) % 3;
      for (let g = 0; g < 4; g++) {
        spawnGold(freeLane, zPos - g * 2.5);
      }

      if (i === 4) {
        spawnMagnet((obsLane + 2) % 3, zPos - 4);
      }
    }

    sceneRef.current = {
      scene,
      camera,
      renderer,
      playerGroup,
      torsoMesh,
      headMesh,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      obstacles,
      golds,
      magnets,
      roadTiles,
    };

    // 8. Resize Handler
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

    // 9. Keyboard Listeners (A/D/Left/Right/Space/W/S/Down)
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') moveLeft();
      else if (k === 'd' || k === 'arrowright') moveRight();
      else if (k === 'w' || k === 'arrowup' || k === ' ' || k === 'spacebar') doJump();
      else if (k === 's' || k === 'arrowdown') doSlide();
    };
    window.addEventListener('keydown', handleKeyDown);

    // 10. Main Animation & Physics Loop
    let lastTime = performance.now();
    let animId = 0;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const sc = sceneRef.current;
      if (!sc) return;

      const pl = playerRef.current;
      const gs = gameStateRef.current;

      if (!gs.isGameOver) {
        // Run forward: decrease Z (towards -Z)
        pl.posZ -= gs.speed * dt;
        gs.distance = Math.round(Math.abs(pl.posZ));
        setDistanceMeters(gs.distance);

        // Smooth Lane Switching
        pl.posX = THREE.MathUtils.lerp(pl.posX, pl.targetX, 0.28);
        const laneDistX = pl.targetX - pl.posX;
        pl.rollAngle = THREE.MathUtils.lerp(pl.rollAngle, -laneDistX * 0.12, 0.2);

        // Gravity & Jump Physics
        if (!pl.isGrounded) {
          pl.velY -= 38 * dt;
          pl.posY += pl.velY * dt;
          if (pl.posY <= 0.9) {
            pl.posY = 0.9;
            pl.velY = 0;
            pl.isGrounded = true;
          }
        }

        // Slide Timer
        if (pl.isSliding) {
          pl.slideTimer -= dt;
          if (pl.slideTimer <= 0) {
            pl.isSliding = false;
          }
        }

        // Magnet Powerup Timer
        if (gs.magnetTimer > 0) {
          gs.magnetTimer -= dt;
          if (gs.magnetTimer <= 0) {
            setHasMagnet(false);
          }
        }

        // Move Road Tiles Infinitely
        sc.roadTiles.forEach(tile => {
          if (tile.position.z > pl.posZ + 30) {
            tile.position.z -= 240;
          }
        });

        // Dynamic Spawner: Keep generating obstacles ahead
        if (pl.posZ - 80 < gs.nextSpawnZ) {
          const zPos = gs.nextSpawnZ;
          const obsLane = Math.floor(Math.random() * 3);
          const rType = Math.random();
          if (rType < 0.45) spawnTruck(obsLane, zPos);
          else if (rType < 0.75) spawnBarricade(obsLane, zPos);
          else spawnHighSign(obsLane, zPos);

          // Spawn Golds
          const goldLane = (obsLane + 1) % 3;
          for (let g = 0; g < 4; g++) {
            spawnGold(goldLane, zPos - g * 2.6);
          }

          if (Math.random() < 0.2) {
            spawnMagnet((obsLane + 2) % 3, zPos - 3.5);
          }

          gs.nextSpawnZ -= 20.0;
        }

        // Gold Collection & Magnet Attraction
        sc.golds.forEach(gd => {
          if (gd.collected) return;
          gd.mesh.rotation.y += dt * 4.0;

          // Magnet suction
          if (gs.magnetTimer > 0 && Math.abs(gd.mesh.position.z - pl.posZ) < 18) {
            gd.mesh.position.x = THREE.MathUtils.lerp(gd.mesh.position.x, pl.posX, 0.18);
            gd.mesh.position.y = THREE.MathUtils.lerp(gd.mesh.position.y, pl.posY, 0.18);
            gd.mesh.position.z = THREE.MathUtils.lerp(gd.mesh.position.z, pl.posZ, 0.22);
          }

          // Player Pickup
          const distXZ = Math.hypot(gd.mesh.position.x - pl.posX, gd.mesh.position.z - pl.posZ);
          const distY = Math.abs(gd.mesh.position.y - pl.posY);
          if (distXZ < 1.4 && distY < 1.4) {
            gd.collected = true;
            gd.mesh.visible = false;
            gs.gold += 1;
            gs.score += 25;
            setGoldCount(gs.gold);
            setScore(gs.score);
            triggerHaptic(12);
            if (playSfx) playSfx('/sfx/coin.mp3');
          }
        });

        // Magnet Pickup
        sc.magnets.forEach(mg => {
          if (mg.collected) return;
          mg.mesh.rotation.y += dt * 3.0;
          const dist = mg.mesh.position.distanceTo(new THREE.Vector3(pl.posX, pl.posY, pl.posZ));
          if (dist < 1.6) {
            mg.collected = true;
            mg.mesh.visible = false;
            gs.magnetTimer = 6.0;
            setHasMagnet(true);
            gs.score += 100;
            setScore(gs.score);
            triggerHaptic([30, 30]);
            if (playSfx) playSfx('/sfx/upgrade.mp3');
          }
        });

        // Obstacle Collision Detection
        sc.obstacles.forEach(ob => {
          if (ob.passed) return;

          const dz = Math.abs(ob.z - pl.posZ);
          if (dz < ob.hitbox.halfD + 0.4) {
            const dx = Math.abs(ob.mesh.position.x - pl.posX);
            if (dx < ob.hitbox.halfW + 0.3) {
              // Lane match! Check vertical collision based on type
              if (ob.type === 'truck') {
                // Cannot jump over truck!
                triggerHaptic([60, 60, 100]);
                if (playSfx) playSfx('/sfx/hit.mp3');
                handleGameOver(false);
              } else if (ob.type === 'low_barricade') {
                // Must jump over! (player Y > 1.6)
                if (pl.posY < 1.6) {
                  triggerHaptic([60, 60, 100]);
                  if (playSfx) playSfx('/sfx/hit.mp3');
                  handleGameOver(false);
                }
              } else if (ob.type === 'high_sign') {
                // Must slide under! (isSliding required or ducked)
                if (!pl.isSliding && pl.posY > 1.2) {
                  triggerHaptic([60, 60, 100]);
                  if (playSfx) playSfx('/sfx/hit.mp3');
                  handleGameOver(false);
                }
              }
            }
          }

          if (pl.posZ < ob.z - 5.0) {
            ob.passed = true;
          }
        });
      }

      // Avatar Transform & Pose
      sc.playerGroup.position.set(pl.posX, pl.posY, pl.posZ);
      sc.playerGroup.rotation.z = pl.rollAngle;

      if (pl.isSliding) {
        // Slide pose: squashed & tilted
        sc.playerGroup.scale.set(1.2, 0.5, 1.2);
        sc.torsoMesh.position.y = 0.3;
        sc.headMesh.position.y = 0.8;
      } else {
        sc.playerGroup.scale.set(1.0, 1.0, 1.0);
        sc.torsoMesh.position.y = 0.6;
        sc.headMesh.position.y = 1.45;

        // Running cycle
        if (pl.isGrounded) {
          const runCycle = currentTime * 0.018;
          sc.leftLeg.rotation.x = Math.sin(runCycle) * 0.75;
          sc.rightLeg.rotation.x = -Math.sin(runCycle) * 0.75;
          sc.leftArm.rotation.x = -Math.sin(runCycle) * 0.7;
          sc.rightArm.rotation.x = Math.sin(runCycle) * 0.7;
        } else {
          // Jump arms up
          sc.leftArm.rotation.x = THREE.MathUtils.lerp(sc.leftArm.rotation.x, -2.5, 0.25);
          sc.rightArm.rotation.x = THREE.MathUtils.lerp(sc.rightArm.rotation.x, -2.5, 0.25);
          sc.leftLeg.rotation.x = 0.5;
          sc.rightLeg.rotation.x = -0.5;
        }
      }

      // Camera Smooth Follow
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pl.posX * 0.45, 0.12);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, pl.posY + 4.2, 0.15);
      camera.position.z = pl.posZ + 8.5;
      camera.lookAt(pl.posX * 0.3, pl.posY + 1.2, pl.posZ - 12);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [doJump, doSlide, handleGameOver, lowSpecMode, moveLeft, moveRight, playerHeroId, playSfx, triggerHaptic]);

  // Touch Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStateRef.current.startX = e.touches[0].clientX;
      touchStateRef.current.startY = e.touches[0].clientY;
      touchStateRef.current.isSwiping = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStateRef.current.isSwiping) return;
    touchStateRef.current.isSwiping = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStateRef.current.startX;
    const dy = endY - touchStateRef.current.startY;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 30) {
      if (absX > absY) {
        // Horizontal Swipe (Screen Relative: dx < 0 => Left, dx > 0 => Right)
        if (dx < 0) moveLeft();
        else moveRight();
      } else {
        // Vertical Swipe (dy < 0 => Up Jump, dy > 0 => Down Slide)
        if (dy < 0) doJump();
        else doSlide();
      }
    }
  };

  // 60s Countdown Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleGameOver, isGameOver, isVictory, showTutorial]);

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '3차선 고속도로 질주' : '3-Lane Highway Run',
      badge: isKo ? '조작' : 'Controls',
      description: isKo
        ? '화면을 좌우로 스와이프하거나 하단 [◀]/[▶] 버튼을 눌러 차선을 변경하세요!'
        : 'Swipe left/right or tap [◀]/[▶] buttons to switch between the 3 lanes!',
      keyPoints: isKo
        ? ['좌우 스와이프: 차선 변경', '하단 버튼으로도 간편 조작', '연속 회피 콤보']
        : ['Swipe left/right to move', 'Tap buttons on bottom', 'Chain dodge combos'],
      iconType: 'GESTURES',
    },
    {
      title: isKo ? '점프 & 슬라이딩 회피' : 'Jump & Slide',
      badge: isKo ? '회피' : 'Dodge',
      description: isKo
        ? '위로 스와이프하여 바리케이드를 점프로 넘고, 아래로 스와이프하여 높은 표지판 밑을 슬라이딩하세요!'
        : 'Swipe up to jump over barricades, and swipe down to slide under high signs!',
      keyPoints: isKo
        ? ['상단 스와이프: 점프', '하단 스와이프: 슬라이드', '트럭은 차선 변경으로 회피']
        : ['Swipe up to jump', 'Swipe down to slide', 'Dodge trucks sideways'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '황금 금괴 & 자석 파워업' : 'Gold & Magnet',
      badge: isKo ? '아이템' : 'Items',
      description: isKo
        ? '반짝이는 금괴를 모으고, 자석을 획득하여 모든 차선의 금괴를 한 번에 끌어당기세요!'
        : 'Collect shining gold bars and grab the magnet to pull all gold from all lanes!',
      keyPoints: isKo
        ? ['금괴 수집 (+25점)', '골드 자석 6초간 자동 수거', '60초 생존 시 승리']
        : ['Gold bars (+25 pts)', 'Magnet pulls gold for 6s', 'Survive 60s to win'],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js 3D Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle={isKo ? '토킹톰 골드런 3D' : 'Talking Tom Gold Run 3D'}
        onBack={handleBackRequest}
        score={score}
        maxScore={1200}
        timerSec={timeLeft}
        stats={[
          { label: isKo ? '금괴' : 'GOLD', value: `🪙${goldCount}` },
          { label: isKo ? '거리' : 'DIST', value: `${distanceMeters}m` },
          { label: isKo ? '자석' : 'MAGNET', value: hasMagnet ? '🧲 ON' : 'OFF' },
        ]}
      />

      {/* Bottom Dual Thumb Action Buttons */}
      <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-between pointer-events-auto z-40 max-w-md mx-auto">
        {/* Left Side: Lane Steer Buttons */}
        <div className="flex gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              moveLeft();
            }}
            className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-500 text-white font-black text-xl flex items-center justify-center active:scale-90 shadow-xl"
            title="Move Left"
          >
            ◀
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              moveRight();
            }}
            className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-500 text-white font-black text-xl flex items-center justify-center active:scale-90 shadow-xl"
            title="Move Right"
          >
            ▶
          </button>
        </div>

        {/* Right Side: Jump & Slide Buttons */}
        <div className="flex gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              doSlide();
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 border-2 border-indigo-300 text-white font-mono text-xs flex flex-col items-center justify-center active:scale-90 shadow-xl"
            title="Slide"
          >
            <span className="text-lg">▼</span>
            <span className="font-extrabold text-[10px]">ROLL</span>
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              doJump();
            }}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-amber-200 text-slate-950 font-mono text-xs flex flex-col items-center justify-center active:scale-90 shadow-2xl"
            title="Jump"
          >
            <span className="text-2xl font-black">▲</span>
            <span className="font-extrabold text-[11px]">JUMP</span>
          </button>
        </div>
      </div>

      {/* Exit & Settle Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 text-2xl font-bold">
              [?]
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '달리기를 중단하시겠습니까?' : 'Exit Gold Run?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '현재까지 질주한 거리와 수집한 금괴에 비례하여 공정한 SNS 포인트가 안전하게 정산 지급됩니다.'
                : 'Your reward will be calculated and deposited based on your distance and gold bars collected.'}
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
          onConfirm={handleExit}
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
              localStorage.setItem('hero_tutorial_tom_gold_run', 'true');
            } catch {
              // ignore
            }
          }}
        />
      )}
    </div>
  );
};

export default PokiTalkingTomGoldRunGame;

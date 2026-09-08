import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRainbowObbyGameProps {
  deck?: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  handleExit?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number | string;
  onReward?: (amount: number) => void;

  onExit?: () => void;
}

interface Platform {
  mesh: THREE.Mesh;
  box: THREE.Box3;
  type: 'static' | 'bouncer' | 'vanishing' | 'checkpoint' | 'goal';
  color: number;
  vanishTimer?: number;
  isVanished?: boolean;
  checkpointId?: number;
}

interface StarItem {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  collected: boolean;
}

interface LaserBar {
  group: THREE.Group;
  barMesh: THREE.Mesh;
  center: THREE.Vector3;
  rotSpeed: number;
}

export const PokiRainbowObbyGame: React.FC<PokiRainbowObbyGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onBack,
  onClose,
  cardId,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const playerHeroId = (cardId ? Number(cardId) : deck[0]?.id) || 11;
  const containerRef = useRef<HTMLDivElement>(null);

  // HUD & Game States
  const [score, setScore] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [starsCount, setStarsCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Dynamic Floating Joystick state
  const [joystickActive, setJoystickActive] = useState<boolean>(false);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_rainbow_obby') !== 'true';
    } catch {
      return true;
    }
  });

  const gameStateRef = useRef({
    score: 0,
    stars: 0,
    progress: 0,
    isGameOver: false,
    isVictory: false,
    respawnPos: new THREE.Vector3(0, 1.5, 0),
    isRespawning: false,
  });

  const playerRef = useRef({
    pos: new THREE.Vector3(0, 1.5, 0),
    vel: new THREE.Vector3(0, 0, 0),
    isGrounded: false,
    jumpRequested: false,
    moveInput: { x: 0, z: 0 },
    facingAngle: Math.PI, // Facing -Z
    jumpCooldown: 0,
  });

  const touchControlRef = useRef({
    touchId: null as number | null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
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
    platforms: Platform[];
    stars: StarItem[];
    laserBars: LaserBar[];
    goalRing: THREE.Mesh;
    checkpointFlags: { mesh: THREE.Mesh; id: number; passed: boolean }[];
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

  const handleGameOver = useCallback((victory: boolean) => {
    if (gameStateRef.current.isGameOver) return;
    gameStateRef.current.isGameOver = true;
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = gameStateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokirainbowobby',
      gameTitle: isKo ? '레인보우 오비 3D' : 'Rainbow Obby 3D',
      durationSeconds: Math.max(1, 90 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
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
      gameId: 'pokirainbowobby',
      gameTitle: isKo ? '레인보우 오비 3D' : 'Rainbow Obby 3D',
      durationSeconds: Math.max(1, 90 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    
    if (onReward) { onReward(receipt.totalSns); }
    handleExit();
  
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hero-return-to-missions"));}, [isKo, handleExit, onReward, timeLeft]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Jump Action
  const handleJump = useCallback(() => {
    const pl = playerRef.current;
    if (pl.isGrounded && pl.jumpCooldown <= 0) {
      pl.vel.y = 15.5;
      pl.isGrounded = false;
      pl.jumpCooldown = 0.25;
      triggerHaptic(20);
      if (playSfx) playSfx('/sfx/jump.mp3');
    }
  }, [lowSpecMode, playerHeroId]);

  // Three.js Scene Setup & Main Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Sky
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.FogExp2(0x38bdf8, 0.012);

    // 2. Camera (3rd Person following camera)
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 7, 12);

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
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(20, 45, 20);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 150;
      dirLight.shadow.camera.left = -40;
      dirLight.shadow.camera.right = 40;
      dirLight.shadow.camera.top = 40;
      dirLight.shadow.camera.bottom = -40;
    }
    scene.add(dirLight);

    // 5. Fluffy 3D Background Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.1,
    });
    for (let c = 0; c < (lowSpecMode ? 8 : 16); c++) {
      const cloudGroup = new THREE.Group();
      const parts = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < parts; p++) {
        const cMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(3 + Math.random() * 2.5, 1),
          cloudMat
        );
        cMesh.position.set((p - 1) * 3, Math.sin(p) * 1.5, 0);
        cloudGroup.add(cMesh);
      }
      cloudGroup.position.set(
        (Math.random() - 0.5) * 140,
        -10 + Math.random() * 25,
        -Math.random() * 160
      );
      scene.add(cloudGroup);
    }

    // 6. 3D Roblox Style Player Avatar
    const playerGroup = new THREE.Group();

    // Torso with Hero badge
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 128;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#0284c7';
      bCtx.fillRect(0, 0, 128, 128);
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);

    const torsoGeo = new THREE.BoxGeometry(1.2, 1.4, 0.7);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.3,
      map: badgeTexture,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.castShadow = !lowSpecMode;
    playerGroup.add(torsoMesh);

    // Head (Yellow Classic Noob)
    const headCanvas = document.createElement('canvas');
    headCanvas.width = 128;
    headCanvas.height = 128;
    const hCtx = headCanvas.getContext('2d');
    if (hCtx) {
      hCtx.fillStyle = '#facc15';
      hCtx.fillRect(0, 0, 128, 128);
      // Eyes
      hCtx.fillStyle = '#1e293b';
      hCtx.fillRect(36, 44, 14, 18);
      hCtx.fillRect(78, 44, 14, 18);
      // Smile
      hCtx.fillRect(40, 80, 48, 8);
      hCtx.fillRect(36, 76, 8, 8);
      hCtx.fillRect(84, 76, 8, 8);
    }
    const headTexture = new THREE.CanvasTexture(headCanvas);
    const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      map: headTexture,
      roughness: 0.2,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.15;
    headMesh.castShadow = !lowSpecMode;
    playerGroup.add(headMesh);

    // Limbs
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const armGeo = new THREE.BoxGeometry(0.45, 1.1, 0.45);
    const legGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);

    const leftArm = new THREE.Mesh(armGeo, limbMat);
    leftArm.position.set(-0.85, 0.1, 0);
    leftArm.castShadow = !lowSpecMode;
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, limbMat);
    rightArm.position.set(0.85, 0.1, 0);
    rightArm.castShadow = !lowSpecMode;
    playerGroup.add(rightArm);

    const leftLeg = new THREE.Mesh(legGeo, limbMat);
    leftLeg.position.set(-0.35, -1.2, 0);
    leftLeg.castShadow = !lowSpecMode;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, limbMat);
    rightLeg.position.set(0.35, -1.2, 0);
    rightLeg.castShadow = !lowSpecMode;
    playerGroup.add(rightLeg);

    scene.add(playerGroup);

    // 7. Track & Obstacle Platforms
    const platforms: Platform[] = [];
    const stars: StarItem[] = [];
    const laserBars: LaserBar[] = [];
    const checkpointFlags: { mesh: THREE.Mesh; id: number; passed: boolean }[] = [];

    const rainbowColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0xa855f7];

    // Helper: Add Platform
    const addPlat = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: number,
      type: 'static' | 'bouncer' | 'vanishing' | 'checkpoint' | 'goal' = 'static',
      checkpointId?: number
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.1,
        emissive: type === 'bouncer' ? 0x15803d : 0x000000,
        emissiveIntensity: type === 'bouncer' ? 0.4 : 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      platforms.push({ mesh, box, type, color, checkpointId });

      // Add a rotating gold star on some platforms
      if (type === 'static' && Math.random() < 0.65 && z < -10 && z > -130) {
        const starGeo = new THREE.OctahedronGeometry(0.45, 0);
        const starMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xeab308,
          emissiveIntensity: 0.6,
          metalness: 0.8,
        });
        const starMesh = new THREE.Mesh(starGeo, starMat);
        starMesh.position.set(x, y + h / 2 + 0.8, z);
        scene.add(starMesh);
        stars.push({ mesh: starMesh, pos: starMesh.position, collected: false });
      }

      return mesh;
    };

    // --- START PLATFORM (AGENTS.md 절대원칙: 18m x 14m 광폭 안전 플랫폼) ---
    addPlat(0, -0.5, -2, 16, 1.0, 18, 0x334155, 'static');

    // ZONE 1: Rainbow Discs (Z: -16 to -38)
    for (let i = 0; i < 7; i++) {
      const col = rainbowColors[i % rainbowColors.length];
      const posX = Math.sin(i * 1.3) * 3.5;
      const posZ = -16 - i * 3.2;
      const posY = i * 0.4;
      addPlat(posX, posY - 0.25, posZ, 3.2, 0.5, 3.2, col, 'static');
    }

    // CHECKPOINT 1 (Z: -42)
    addPlat(0, 2.5, -42, 8, 0.8, 8, 0x10b981, 'checkpoint', 1);
    // Flag pole
    const pole1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    pole1.position.set(3, 4.5, -42);
    scene.add(pole1);
    const flag1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.8, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    flag1.position.set(3.7, 6.0, -42);
    scene.add(flag1);
    checkpointFlags.push({ mesh: flag1, id: 1, passed: false });

    // ZONE 2: Spinning Laser Bars (Z: -48 to -68)
    for (let i = 0; i < 4; i++) {
      const posZ = -48 - i * 5.2;
      const col = rainbowColors[(i + 2) % rainbowColors.length];
      // Bridge base platform
      addPlat(0, 2.5, posZ, 4.0, 0.6, 4.0, col, 'static');

      // Rotating Laser Bar
      const lGroup = new THREE.Group();
      lGroup.position.set(0, 3.4, posZ);
      const barGeo = new THREE.BoxGeometry(6.5, 0.25, 0.25);
      const barMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0044,
        emissiveIntensity: 0.8,
      });
      const barMesh = new THREE.Mesh(barGeo, barMat);
      lGroup.add(barMesh);
      scene.add(lGroup);
      laserBars.push({
        group: lGroup,
        barMesh,
        center: lGroup.position,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * 1.6,
      });
    }

    // CHECKPOINT 2 (Z: -73)
    addPlat(0, 2.5, -73, 8, 0.8, 8, 0x10b981, 'checkpoint', 2);
    const pole2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    pole2.position.set(3, 4.5, -73);
    scene.add(pole2);
    const flag2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.8, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    flag2.position.set(3.7, 6.0, -73);
    scene.add(flag2);
    checkpointFlags.push({ mesh: flag2, id: 2, passed: false });

    // ZONE 3: Vanishing Blocks & Rainbow Slopes (Z: -78 to -102)
    for (let i = 0; i < 6; i++) {
      const col = rainbowColors[(i + 4) % rainbowColors.length];
      const posX = ((i % 3) - 1) * 3.2;
      const posZ = -78 - i * 4.0;
      addPlat(posX, 2.5, posZ, 2.8, 0.5, 2.8, col, 'vanishing');
    }

    // ZONE 4: Super Bounce Pads (Z: -107 to -124)
    addPlat(-2.5, 2.5, -107, 3.5, 0.6, 3.5, 0x22c55e, 'bouncer');
    addPlat(2.5, 5.0, -114, 3.5, 0.6, 3.5, 0x22c55e, 'bouncer');
    addPlat(0, 8.0, -122, 3.5, 0.6, 3.5, 0x22c55e, 'bouncer');

    // ZONE 5: Victory Goal Platform & Portal (Z: -132)
    addPlat(0, 10.0, -134, 12, 1.0, 12, 0xfacc15, 'goal');

    // Rotating Rainbow Victory Ring Portal
    const ringGeo = new THREE.TorusGeometry(3.2, 0.45, 16, 40);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.8,
    });
    const goalRing = new THREE.Mesh(ringGeo, ringMat);
    goalRing.position.set(0, 14.5, -134);
    scene.add(goalRing);

    // Golden Trophy Cup
    const trophy = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 0.6, 1.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 })
    );
    trophy.position.set(0, 11.5, -134);
    scene.add(trophy);

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
      platforms,
      stars,
      laserBars,
      goalRing,
      checkpointFlags,
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

    // 9. Keyboard Listeners (Screen-Relative Direction 100% Aligned)
    const keyMap = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false, a: false, d: false, ' ': false };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keyMap.hasOwnProperty(e.key) || keyMap.hasOwnProperty(e.key.toLowerCase())) {
        keyMap[e.key.toLowerCase() as keyof typeof keyMap] = true;
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        handleJump();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keyMap.hasOwnProperty(e.key) || keyMap.hasOwnProperty(e.key.toLowerCase())) {
        keyMap[e.key.toLowerCase() as keyof typeof keyMap] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 10. Animation & Physics Loop
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

      if (pl.jumpCooldown > 0) pl.jumpCooldown -= dt;

      // Rotate Stars & Laser Bars
      sc.stars.forEach(st => {
        if (!st.collected) {
          st.mesh.rotation.y += dt * 3.5;
          st.mesh.rotation.x = Math.sin(currentTime * 0.003) * 0.4;
        }
      });
      sc.laserBars.forEach(lb => {
        lb.group.rotation.y += dt * lb.rotSpeed;
      });
      sc.goalRing.rotation.z += dt * 1.5;
      sc.goalRing.rotation.y += dt * 0.8;

      if (!gs.isGameOver && !gs.isRespawning) {
        // Compute Movement Input: Screen-Relative Standard
        // Screen Right = +X, Screen Left = -X, Screen Forward = -Z, Screen Backward = +Z
        let inputX = 0;
        let inputZ = 0;

        if (keyMap['a'] || keyMap['ArrowLeft']) inputX -= 1;
        if (keyMap['d'] || keyMap['ArrowRight']) inputX += 1;
        if (keyMap['w'] || keyMap['ArrowUp']) inputZ -= 1;
        if (keyMap['s'] || keyMap['ArrowDown']) inputZ += 1;

        // Add Touch Joystick Input
        inputX += pl.moveInput.x;
        inputZ += pl.moveInput.z;

        const inputLen = Math.hypot(inputX, inputZ);
        if (inputLen > 0.05) {
          const moveSpeed = 10.5;
          const normX = (inputX / Math.max(1, inputLen)) * moveSpeed;
          const normZ = (inputZ / Math.max(1, inputLen)) * moveSpeed;

          pl.vel.x = THREE.MathUtils.lerp(pl.vel.x, normX, 0.25);
          pl.vel.z = THREE.MathUtils.lerp(pl.vel.z, normZ, 0.25);

          // Rotate Avatar toward movement direction
          pl.facingAngle = Math.atan2(normX, normZ);
        } else {
          pl.vel.x = THREE.MathUtils.lerp(pl.vel.x, 0, 0.22);
          pl.vel.z = THREE.MathUtils.lerp(pl.vel.z, 0, 0.22);
        }

        // Apply Gravity
        pl.vel.y -= 32 * dt;

        // Next position candidate
        const nextPos = pl.pos.clone().addScaledVector(pl.vel, dt);

        // Platform Collision Detection
        let groundedThisFrame = false;
        const playerRadius = 0.6;
        const playerBottom = nextPos.y - 1.2;

        sc.platforms.forEach(p => {
          if (p.isVanished) return;

          const meshPos = p.mesh.position;
          const geoParams = (p.mesh.geometry as THREE.BoxGeometry).parameters;
          const halfW = geoParams.width / 2;
          const halfH = geoParams.height / 2;
          const halfD = geoParams.depth / 2;

          const minX = meshPos.x - halfW - playerRadius * 0.6;
          const maxX = meshPos.x + halfW + playerRadius * 0.6;
          const minZ = meshPos.z - halfD - playerRadius * 0.6;
          const maxZ = meshPos.z + halfD + playerRadius * 0.6;
          const topY = meshPos.y + halfH;

          // Check landing on top of platform
          if (
            nextPos.x >= minX &&
            nextPos.x <= maxX &&
            nextPos.z >= minZ &&
            nextPos.z <= maxZ
          ) {
            if (playerBottom <= topY && playerBottom >= topY - 1.2 && pl.vel.y <= 0) {
              nextPos.y = topY + 1.2;
              pl.vel.y = 0;
              groundedThisFrame = true;

              // Handle Special Platform Types
              if (p.type === 'bouncer') {
                pl.vel.y = 22.5; // Super high launch
                triggerHaptic([30, 20, 40]);
                if (playSfx) playSfx('/sfx/jump.mp3');
              } else if (p.type === 'vanishing') {
                if (!p.vanishTimer) {
                  p.vanishTimer = 0.8;
                }
              } else if (p.type === 'checkpoint' && p.checkpointId) {
                // Update Respawn Position
                gs.respawnPos.set(meshPos.x, topY + 1.5, meshPos.z);
                const flag = sc.checkpointFlags.find(f => f.id === p.checkpointId);
                if (flag && !flag.passed) {
                  flag.passed = true;
                  (flag.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x22c55e);
                  gs.score += 150;
                  setScore(gs.score);
                  triggerHaptic(30);
                  if (playSfx) playSfx('/sfx/checkpoint.mp3');
                }
              } else if (p.type === 'goal') {
                // Victory reached!
                gs.score += 500;
                setScore(gs.score);
                handleGameOver(true);
              }
            }
          }

          // Handle vanishing logic
          if (p.vanishTimer !== undefined && p.vanishTimer > 0) {
            p.vanishTimer -= dt;
            (p.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0.2, p.vanishTimer / 0.8);
            (p.mesh.material as THREE.MeshStandardMaterial).transparent = true;
            if (p.vanishTimer <= 0) {
              p.isVanished = true;
              p.mesh.visible = false;
              // Respawn block after 2.5s
              setTimeout(() => {
                p.isVanished = false;
                p.mesh.visible = true;
                p.vanishTimer = undefined;
                (p.mesh.material as THREE.MeshStandardMaterial).opacity = 1.0;
                (p.mesh.material as THREE.MeshStandardMaterial).transparent = false;
              }, 2500);
            }
          }
        });

        pl.isGrounded = groundedThisFrame;
        pl.pos.copy(nextPos);

        // Star Collect Detection
        sc.stars.forEach(st => {
          if (!st.collected && pl.pos.distanceTo(st.pos) < 1.4) {
            st.collected = true;
            st.mesh.visible = false;
            gs.stars += 1;
            gs.score += 80;
            setStarsCount(gs.stars);
            setScore(gs.score);
            triggerHaptic(15);
            if (playSfx) playSfx('/sfx/coin.mp3');
          }
        });

        // Laser Bar Collision
        sc.laserBars.forEach(lb => {
          const distXZ = Math.hypot(pl.pos.x - lb.center.x, pl.pos.z - lb.center.z);
          if (distXZ < 3.2 && Math.abs(pl.pos.y - lb.center.y) < 1.2) {
            // Knockback hit!
            pl.vel.y = 8;
            pl.vel.x += (Math.random() - 0.5) * 12;
            pl.vel.z += 8;
            triggerHaptic([30, 30]);
            if (playSfx) playSfx('/sfx/hit.mp3');
          }
        });

        // Check Abyss Fall (Fall below Y < -12) -> Respawn
        if (pl.pos.y < -12) {
          gs.isRespawning = true;
          triggerHaptic([50, 50]);
          setTimeout(() => {
            pl.pos.copy(gs.respawnPos);
            pl.vel.set(0, 0, 0);
            gs.isRespawning = false;
          }, 350);
        }

        // Calculate Progress (% of 134m track)
        const currentProgress = Math.min(100, Math.max(0, Math.round(((-pl.pos.z) / 134) * 100)));
        if (currentProgress !== gs.progress) {
          gs.progress = currentProgress;
          setProgressPct(currentProgress);
        }

        // Avatar Limbs Animation
        const groundSpeed = Math.hypot(pl.vel.x, pl.vel.z);
        if (pl.isGrounded && groundSpeed > 0.5) {
          const walkCycle = currentTime * 0.012;
          sc.leftLeg.rotation.x = Math.sin(walkCycle) * 0.65;
          sc.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.65;
          sc.leftArm.rotation.x = -Math.sin(walkCycle) * 0.55;
          sc.rightArm.rotation.x = Math.sin(walkCycle) * 0.55;
        } else if (!pl.isGrounded) {
          // Jump pose
          sc.leftArm.rotation.x = THREE.MathUtils.lerp(sc.leftArm.rotation.x, -2.4, 0.2);
          sc.rightArm.rotation.x = THREE.MathUtils.lerp(sc.rightArm.rotation.x, -2.4, 0.2);
          sc.leftLeg.rotation.x = THREE.MathUtils.lerp(sc.leftLeg.rotation.x, 0.5, 0.2);
          sc.rightLeg.rotation.x = THREE.MathUtils.lerp(sc.rightLeg.rotation.x, -0.5, 0.2);
        } else {
          sc.leftLeg.rotation.x = 0;
          sc.rightLeg.rotation.x = 0;
          sc.leftArm.rotation.x = 0;
          sc.rightArm.rotation.x = 0;
        }
      }

      // Update Player Group Transform
      sc.playerGroup.position.copy(pl.pos);
      sc.playerGroup.rotation.y = pl.facingAngle;

      // Smooth Camera Follow
      const targetCamX = pl.pos.x * 0.3;
      const targetCamY = pl.pos.y + 6.5;
      const targetCamZ = pl.pos.z + 11.5;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.1);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.1);
      camera.lookAt(pl.pos.x, pl.pos.y + 1.2, pl.pos.z - 3);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [lowSpecMode, playerHeroId]);

  // Touch Screen Dynamic Joystick Event Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only capture touches on left 65% of screen for joystick
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX < window.innerWidth * 0.65 && touchControlRef.current.touchId === null) {
        touchControlRef.current.touchId = touch.identifier;
        touchControlRef.current.startX = touch.clientX;
        touchControlRef.current.startY = touch.clientY;
        touchControlRef.current.currentX = touch.clientX;
        touchControlRef.current.currentY = touch.clientY;

        setJoystickPos({ x: touch.clientX, y: touch.clientY });
        setKnobPos({ x: touch.clientX, y: touch.clientY });
        setJoystickActive(true);
        break;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchControlRef.current.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchControlRef.current.touchId) {
        touchControlRef.current.currentX = touch.clientX;
        touchControlRef.current.currentY = touch.clientY;

        const dx = touch.clientX - touchControlRef.current.startX;
        const dy = touch.clientY - touchControlRef.current.startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 48;

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const knobX = touchControlRef.current.startX + Math.cos(angle) * clampedDist;
        const knobY = touchControlRef.current.startY + Math.sin(angle) * clampedDist;

        setKnobPos({ x: knobX, y: knobY });

        // Update player moveInput (Screen Relative: dx > 0 => +X right, dy < 0 => -Z forward)
        const moveRatio = clampedDist / maxDist;
        playerRef.current.moveInput.x = Math.cos(angle) * moveRatio;
        playerRef.current.moveInput.z = Math.sin(angle) * moveRatio;
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchControlRef.current.touchId) {
        touchControlRef.current.touchId = null;
        setJoystickActive(false);
        playerRef.current.moveInput.x = 0;
        playerRef.current.moveInput.z = 0;
        break;
      }
    }
  };

  // 90s Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(gameStateRef.current.progress >= 70);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleGameOver, isGameOver, isVictory, showTutorial]);

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '무지개 오비 질주' : 'Rainbow Obby Dash',
      badge: isKo ? '조작' : 'Controls',
      description: isKo
        ? '좌측 화면을 터치하여 나타나는 플로팅 조이스틱으로 360° 이동하고, 우측 점프 버튼으로 무지개 발판을 건너세요!'
        : 'Use the dynamic floating joystick on the left to move, and tap the jump button on the right to leap across rainbow platforms!',
      keyPoints: isKo
        ? ['좌측 화면 터치: 360° 이동', '우측 대형 버튼: 점프', '키보드 WASD / Spacebar 지원']
        : ['Left touch: 360° move', 'Right button: Jump', 'WASD / Spacebar support'],
      iconType: 'GESTURES',
    },
    {
      title: isKo ? '함정 회피 & 체크포인트' : 'Traps & Checkpoints',
      badge: isKo ? '장애물' : 'Hazards',
      description: isKo
        ? '회전 레이저 바와 사라지는 발판을 조심하세요. 체크포인트를 통과하면 낙하 시 즉시 그 자리에서 부활합니다!'
        : 'Watch out for spinning laser bars and vanishing blocks. Pass checkpoints to instantly respawn safely!',
      keyPoints: isKo
        ? ['회전 레이저 바 점프 회피', '사라지는 블록 주의', '깃발 통과 시 자동 저장']
        : ['Jump over spinning lasers', 'Watch vanishing blocks', 'Automatic checkpoint save'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '황금 승리 포털' : 'Victory Portal',
      badge: isKo ? '승리' : 'Victory',
      description: isKo
        ? '140m 트랙 정상의 회전하는 무지개 링 포털에 도달하면 승리하며 푸짐한 SNS 포인트를 획득합니다.'
        : 'Reach the giant rotating rainbow portal at the peak to achieve victory and claim SNS rewards!',
      keyPoints: isKo
        ? ['무지개 별 수집 (+80점)', '정상 포털 도달 시 승리', '완주 시 최대 보상 지급']
        : ['Collect stars (+80 pts)', 'Reach summit portal', 'Earn max rewards on clear'],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-sky-400 flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js 3D Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle={isKo ? '레인보우 오비 3D' : 'Rainbow Obby 3D'}
        onBack={handleBackRequest}
        score={score}
        maxScore={1000}
        timerSec={timeLeft}
        stats={[
          { label: isKo ? '진행도' : 'PROGRESS', value: `${progressPct}%` },
          { label: isKo ? '무지개별' : 'STARS', value: `★${starsCount}` },
        ]}
      />

      {/* Dynamic Floating Touch Joystick Visual */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${joystickPos.x}px`, top: `${joystickPos.y}px` }}
        >
          {/* Base Ring */}
          <div className="w-24 h-24 rounded-full border-2 border-white/60 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg" />
          {/* Moving Knob */}
          <div
            className="absolute w-12 h-12 rounded-full bg-white/90 shadow-md border border-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(${knobPos.x - joystickPos.x - 24}px, ${knobPos.y - joystickPos.y - 24}px)`,
            }}
          />
        </div>
      )}

      {/* Mobile Pure Touch: 80px Jumbo Jump Button */}
      <div className="absolute bottom-8 right-8 z-40 pointer-events-auto">
        <button
          onClick={e => {
            e.stopPropagation();
            handleJump();
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-white/90 text-slate-950 font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-2xl transition-transform"
          title="Jump"
        >
          <span className="text-2xl leading-none">▲</span>
          <span className="text-[11px] font-extrabold tracking-wide mt-0.5">JUMP</span>
        </button>
      </div>

      {/* Progress Bar (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 max-w-[70vw] bg-slate-900/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/30 z-30 pointer-events-none flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold text-white whitespace-nowrap">OBBY</span>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 rounded-full transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono font-bold text-yellow-300">{progressPct}%</span>
      </div>

      {/* Exit & Settle Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 text-2xl font-bold">
              [?]
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '오비 도전을 중단하시겠습니까?' : 'Exit Rainbow Obby?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '현재까지 도달한 진행도와 수집한 무지개 별에 비례하여 공정한 SNS 포인트가 안전하게 정산 지급됩니다.'
                : 'Your reward will be calculated and deposited based on your progress and stars collected.'}
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
              localStorage.setItem('hero_tutorial_rainbow_obby', 'true');
            } catch {
              // ignore
            }
          }}
        />
      )}
    </div>
  );
};

export default PokiRainbowObbyGame;

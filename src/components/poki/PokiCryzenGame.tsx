import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiCryzenGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;

  onBack?: () => void;
  onClose?: () => void;
}

interface MercenaryBot {
  id: number;
  name: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  color: number;
  shootTimer: number;
  moveTimer: number;
  targetX: number;
  targetZ: number;
  group?: THREE.Group;
  isAlive: boolean;
  respawnTimer: number;
}

export const PokiCryzenGame: React.FC<PokiCryzenGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
  onBack,
  onClose
}) => {
  const handleExit = onExit || onBack || onClose || (() => {});
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 8;
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // States
  const [score, setScore] = useState<number>(0);
  const [ammo, setAmmo] = useState<number>(30);
  const maxAmmo = 30;
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [kills, setKills] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [killFeed, setKillFeed] = useState<string | null>(null);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_cryzen') !== 'true';
    } catch {
      return true;
    }
  });

  // Dynamic Floating Joystick State (Left Screen)
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number } | null>(null);

  // Core Game State Ref
  const stateRef = useRef({
    isRunning: true,
    player: {
      x: 0,
      y: 1.0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      pitch: 0,
      speed: 6.0,
      isGrounded: true,
      hp: 100,
      ammo: 30,
      isFiring: false,
      lastFireTime: 0,
      group: null as THREE.Group | null,
      muzzleLight: null as THREE.PointLight | null,
      gunMesh: null as THREE.Mesh | null,
    },
    input: {
      moveX: 0,
      moveZ: 0,
    },
    aimTouchId: null as number | null,
    aimLastX: 0,
    aimLastY: 0,
    bots: [] as MercenaryBot[],
    tracers: [] as Array<{
      line: THREE.Line;
      life: number;
    }>,
    particles: [] as Array<{
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
    }>,
    score: 0,
    kills: 0,
  });

  // Touch tracking for left joystick
  const moveTouchRef = useRef<{
    touchId: number | null;
    startX: number;
    startY: number;
  }>({
    touchId: null,
    startX: 0,
    startY: 0,
  });

  // Keyboard controls
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyR') {
        triggerReload();
      } else if (e.code === 'Space') {
        triggerJump();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Timer Countdown
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerVictory();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial]);

  // Settlement and quit handlers
  const handleQuitWithSettlement = useCallback(() => {
    stateRef.current.isRunning = false;
    setShowExitConfirm(true);
  }, []);

  const confirmExitAndSettle = useCallback(() => {
    setShowExitConfirm(false);
    const finalScore = stateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicryzen',
      gameTitle: isKo ? '크라이젠 3D 택티컬 아레나' : 'Cryzen.io 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    
    onReward(receipt.totalSns);
  
    if (typeof handleExit === "function") handleExit();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hero-return-to-missions"));}, [isKo, onReward, timeLeft]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
    stateRef.current.isRunning = true;
  }, []);

  const triggerGameOver = useCallback(() => {
    if (isGameOver || isVictory) return;
    stateRef.current.isRunning = false;
    setIsGameOver(true);
    if (playSfx) playSfx('/sounds/game_over.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 150]);

    const finalScore = stateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicryzen',
      gameTitle: isKo ? '크라이젠 3D 택티컬 아레나' : 'Cryzen.io 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isGameOver, isKo, isVictory, onReward, playSfx, timeLeft]);

  const triggerVictory = useCallback(() => {
    if (isGameOver || isVictory) return;
    stateRef.current.isRunning = false;
    setIsVictory(true);
    if (playSfx) playSfx('/sounds/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([60, 60, 120]);

    const finalScore = stateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicryzen',
      gameTitle: isKo ? '크라이젠 3D 택티컬 아레나' : 'Cryzen.io 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: Math.max(1000, finalScore),
      maxTargetScore: 1000,
      isVictory: true,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isGameOver, isKo, isVictory, onReward, playSfx, timeLeft]);

  // Jump Action
  const triggerJump = useCallback(() => {
    const p = stateRef.current.player;
    if (p.isGrounded) {
      p.vy = 8.5;
      p.isGrounded = false;
      if (playSfx) playSfx('/sounds/jump.mp3');
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, [playSfx]);

  // Reload Action
  const triggerReload = useCallback(() => {
    if (isReloading || ammo === maxAmmo) return;
    setIsReloading(true);
    if (playSfx) playSfx('/sounds/reload.mp3');
    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      stateRef.current.player.ammo = maxAmmo;
      setAmmo(maxAmmo);
      setIsReloading(false);
    }, 1200);
  }, [ammo, isReloading, playSfx]);

  // Touch handlers for screen split (Left = Movement Joystick, Right = Aiming)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const halfWidth = window.innerWidth / 2;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.action-button')) continue;

      if (touch.clientX < halfWidth) {
        // Left side -> Joystick
        if (moveTouchRef.current.touchId === null) {
          moveTouchRef.current.touchId = touch.identifier;
          moveTouchRef.current.startX = touch.clientX;
          moveTouchRef.current.startY = touch.clientY;
          setJoystickCenter({ x: touch.clientX, y: touch.clientY });
          setJoystickKnob({ x: touch.clientX, y: touch.clientY });
        }
      } else {
        // Right side -> Aim
        if (stateRef.current.aimTouchId === null) {
          stateRef.current.aimTouchId = touch.identifier;
          stateRef.current.aimLastX = touch.clientX;
          stateRef.current.aimLastY = touch.clientY;
        }
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchRef.current.touchId) {
        const dx = touch.clientX - moveTouchRef.current.startX;
        const dy = touch.clientY - moveTouchRef.current.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 45;

        let knobX = touch.clientX;
        let knobY = touch.clientY;
        if (dist > maxRadius) {
          knobX = moveTouchRef.current.startX + (dx / dist) * maxRadius;
          knobY = moveTouchRef.current.startY + (dy / dist) * maxRadius;
        }
        setJoystickKnob({ x: knobX, y: knobY });

        if (dist > 6) {
          stateRef.current.input.moveX = dx / dist;
          stateRef.current.input.moveZ = dy / dist;
        } else {
          stateRef.current.input.moveX = 0;
          stateRef.current.input.moveZ = 0;
        }
      } else if (touch.identifier === stateRef.current.aimTouchId) {
        const dX = touch.clientX - stateRef.current.aimLastX;
        const dY = touch.clientY - stateRef.current.aimLastY;
        stateRef.current.aimLastX = touch.clientX;
        stateRef.current.aimLastY = touch.clientY;

        // Rotate yaw & pitch
        stateRef.current.player.yaw -= dX * 0.006;
        stateRef.current.player.pitch = Math.max(-0.45, Math.min(0.35, stateRef.current.player.pitch + dY * 0.005));
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchRef.current.touchId) {
        moveTouchRef.current.touchId = null;
        setJoystickCenter(null);
        setJoystickKnob(null);
        stateRef.current.input.moveX = 0;
        stateRef.current.input.moveZ = 0;
      } else if (touch.identifier === stateRef.current.aimTouchId) {
        stateRef.current.aimTouchId = null;
      }
    }
  }, []);

  // Fire Action
  const triggerShoot = useCallback(() => {
    const s = stateRef.current;
    if (s.player.ammo <= 0) {
      triggerReload();
      return;
    }
    s.player.ammo -= 1;
    setAmmo(s.player.ammo);
    if (navigator.vibrate) navigator.vibrate(25);
    if (playSfx) playSfx('/sounds/shoot.mp3');

    // Flash Muzzle Light
    if (s.player.muzzleLight) {
      s.player.muzzleLight.intensity = 3.5;
      setTimeout(() => {
        if (s.player.muzzleLight) s.player.muzzleLight.intensity = 0;
      }, 50);
    }

    // Raycast hit detection against bots
    const px = s.player.x;
    const pz = s.player.z;
    const forwardX = -Math.sin(s.player.yaw);
    const forwardZ = -Math.cos(s.player.yaw);

    let hitBot: MercenaryBot | null = null;
    let closestDist = 45;

    s.bots.forEach((b) => {
      if (!b.isAlive) return;
      const toBotX = b.x - px;
      const toBotZ = b.z - pz;
      const dist = Math.sqrt(toBotX * toBotX + toBotZ * toBotZ);

      // Dot product to check if bot is in front of crosshair
      const dot = (toBotX * forwardX + toBotZ * forwardZ) / dist;
      if (dot > 0.94 && dist < closestDist) {
        closestDist = dist;
        hitBot = b;
      }
    });

    if (hitBot) {
      hitBot.hp -= 35;
      if (playSfx) playSfx('/sounds/hit.mp3');

      if (hitBot.hp <= 0) {
        hitBot.isAlive = false;
        hitBot.respawnTimer = 5.0;
        if (hitBot.group) hitBot.group.visible = false;
        s.kills += 1;
        s.score += 250;
        setKills(s.kills);
        setScore(s.score);
        setKillFeed(`${hitBot.name} 처치! (+250)`);
        setTimeout(() => setKillFeed(null), 2500);

        if (playSfx) playSfx('/sounds/crit.mp3');
        if (navigator.vibrate) navigator.vibrate([40, 30, 80]);

        if (s.score >= 1000) {
          triggerVictory();
        }
      }
    }
  }, [playSfx, triggerReload, triggerVictory]);

  // --- Three.js 3D Initialization ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Dark Tactical Navy
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    // 2. Camera (Third-Person Tactical Shoulder View)
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.4, 250);
    camera.position.set(0, 3, 5);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(20, 35, 15);
    scene.add(dirLight);

    // 5. Tactical Floor Ground
    const groundGeo = new THREE.PlaneGeometry(75, 75);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    scene.add(groundMesh);

    // Tactical Grid
    const grid = new THREE.GridHelper(75, 50, 0x0ea5e9, 0x334155);
    grid.position.y = 0.02;
    scene.add(grid);

    // 6. Spawn Military Bunkers, Shipping Containers & Covers
    const containerGeo = new THREE.BoxGeometry(4.5, 3.0, 9.0);
    const containerColors = [0x0284c7, 0xd97706, 0xdc2626, 0x475569];

    for (let c = 0; c < 8; c++) {
      const cMat = new THREE.MeshStandardMaterial({
        color: containerColors[c % containerColors.length],
        roughness: 0.5,
        metalness: 0.3,
      });
      const cMesh = new THREE.Mesh(containerGeo, cMat);
      const angle = (c / 8) * Math.PI * 2 + 0.3;
      const dist = 14 + (c % 2) * 8;
      cMesh.position.set(Math.cos(angle) * dist, 1.5, Math.sin(angle) * dist);
      cMesh.rotation.y = angle;
      scene.add(cMesh);
    }

    // Sandbag Walls
    const sandbagGeo = new THREE.BoxGeometry(3.5, 1.2, 0.9);
    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 });
    for (let s = 0; s < 10; s++) {
      const sMesh = new THREE.Mesh(sandbagGeo, sandbagMat);
      const sAng = (s / 10) * Math.PI * 2 + 0.1;
      const sDist = 8 + (s % 3) * 6;
      sMesh.position.set(Math.cos(sAng) * sDist, 0.6, Math.sin(sAng) * sDist);
      sMesh.rotation.y = sAng + Math.PI / 2;
      scene.add(sMesh);
    }

    // 7. Player 3D Tactical Mercenary Avatar
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    stateRef.current.player.group = playerGroup;

    // Head with Helmet
    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.9;
    playerGroup.add(headMesh);

    // Goggles
    const goggleGeo = new THREE.BoxGeometry(0.7, 0.2, 0.2);
    const goggleMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.5 });
    const goggleMesh = new THREE.Mesh(goggleGeo, goggleMat);
    goggleMesh.position.set(0, 0, -0.42);
    headMesh.add(goggleMesh);

    // Card Hero Sprite Badge
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 128;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#0f172a';
      bCtx.beginPath();
      bCtx.arc(64, 64, 60, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.lineWidth = 6;
      bCtx.strokeStyle = '#0ea5e9';
      bCtx.stroke();
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTexture, transparent: true }));
    badgeSprite.position.set(0, 3.2, 0);
    badgeSprite.scale.set(1.8, 1.8, 1);
    playerGroup.add(badgeSprite);

    // Tactical Body Vest
    const bodyGeo = new THREE.BoxGeometry(0.9, 1.1, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.95;
    playerGroup.add(bodyMesh);

    // AKM Assault Rifle
    const gunGeo = new THREE.BoxGeometry(0.18, 0.25, 1.4);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const gunMesh = new THREE.Mesh(gunGeo, gunMat);
    gunMesh.position.set(0.45, 1.1, -0.7);
    playerGroup.add(gunMesh);
    stateRef.current.player.gunMesh = gunMesh;

    // Muzzle Light Flash
    const muzzleLight = new THREE.PointLight(0xf59e0b, 0, 10);
    muzzleLight.position.set(0.45, 1.1, -1.5);
    playerGroup.add(muzzleLight);
    stateRef.current.player.muzzleLight = muzzleLight;

    // 8. Spawn 5 Enemy Mercenary Bots
    const botNames = ['섀도우 01', '고스트 02', '스펙터 03', '레이븐 04', '바이퍼 05'];
    const bots: MercenaryBot[] = [];

    botNames.forEach((bName, idx) => {
      const bGroup = new THREE.Group();
      const bAng = (idx / 5) * Math.PI * 2 + 0.5;
      const bDist = 18 + Math.random() * 8;
      const bx = Math.cos(bAng) * bDist;
      const bz = Math.sin(bAng) * bDist;
      bGroup.position.set(bx, 0, bz);
      scene.add(bGroup);

      // Bot Head & Helmet (Crimson / Red theme)
      const bHead = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: 0x991b1b }));
      bHead.position.y = 1.9;
      bGroup.add(bHead);

      // Bot Body
      const bBody = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x7f1d1d }));
      bBody.position.y = 0.95;
      bGroup.add(bBody);

      // Bot Gun
      const bGun = new THREE.Mesh(gunGeo, gunMat);
      bGun.position.set(0.4, 1.1, -0.6);
      bGroup.add(bGun);

      bots.push({
        id: idx + 1,
        name: bName,
        x: bx,
        z: bz,
        hp: 100,
        maxHp: 100,
        color: 0xef4444,
        shootTimer: Math.random() * 2,
        moveTimer: 0,
        targetX: bx,
        targetZ: bz,
        group: bGroup,
        isAlive: true,
        respawnTimer: 0,
      });
    });
    stateRef.current.bots = bots;

    // 9. Main Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!stateRef.current.isRunning) {
        renderer.render(scene, camera);
        return;
      }

      // Keyboard Controls
      const keys = keysRef.current;
      let kx = 0;
      let kz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) kz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) kz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) kx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) kx += 1;

      const p = stateRef.current.player;
      let moveDirX = stateRef.current.input.moveX;
      let moveDirZ = stateRef.current.input.moveZ;

      if (kx !== 0 || kz !== 0) {
        const kLen = Math.sqrt(kx * kx + kz * kz);
        moveDirX = kx / kLen;
        moveDirZ = kz / kLen;
      }

      // Translate local movement to world based on yaw
      if (Math.abs(moveDirX) > 0.05 || Math.abs(moveDirZ) > 0.05) {
        // Forward: (-sin, -cos), Right: (cos, -sin)
        // moveDirZ < 0 is forward, moveDirX > 0 is right
        const worldMoveX = moveDirX * Math.cos(p.yaw) + moveDirZ * Math.sin(p.yaw);
        const worldMoveZ = -moveDirX * Math.sin(p.yaw) + moveDirZ * Math.cos(p.yaw);
        p.x += worldMoveX * p.speed * dt;
        p.z += worldMoveZ * p.speed * dt;
      }

      // Physics (Gravity & Jump)
      p.vy -= 22 * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.isGrounded = true;
      }

      // Clamp arena
      p.x = Math.max(-34, Math.min(34, p.x));
      p.z = Math.max(-34, Math.min(34, p.z));

      // Update Player Mesh Position & Rotation
      if (p.group) {
        p.group.position.set(p.x, p.y, p.z);
        p.group.rotation.y = p.yaw;
      }

      // Tactical Third-Person Shoulder Camera Positioning
      const camDist = 3.8;
      const camHeight = 2.2 + p.pitch * 2.5;
      const camX = p.x + Math.sin(p.yaw) * camDist;
      const camZ = p.z + Math.cos(p.yaw) * camDist;
      camera.position.set(camX, p.y + camHeight, camZ);

      const lookTargetX = p.x - Math.sin(p.yaw) * 15;
      const lookTargetY = p.y + 1.5 - p.pitch * 10;
      const lookTargetZ = p.z - Math.cos(p.yaw) * 15;
      camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

      // --- Bot AI & Combat ---
      stateRef.current.bots.forEach((bot) => {
        if (!bot.isAlive) {
          bot.respawnTimer -= dt;
          if (bot.respawnTimer <= 0) {
            bot.isAlive = true;
            bot.hp = bot.maxHp;
            const respAng = Math.random() * Math.PI * 2;
            bot.x = Math.cos(respAng) * 22;
            bot.z = Math.sin(respAng) * 22;
            if (bot.group) {
              bot.group.position.set(bot.x, 0, bot.z);
              bot.group.visible = true;
            }
          }
          return;
        }

        // Steer toward or flank player
        const dx = p.x - bot.x;
        const dz = p.z - bot.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 8) {
          bot.x += (dx / dist) * 3.2 * dt;
          bot.z += (dz / dist) * 3.2 * dt;
        }

        if (bot.group) {
          bot.group.position.set(bot.x, 0, bot.z);
          bot.group.rotation.y = Math.atan2(-dx, -dz);
        }

        // Bot Shoot at Player
        bot.shootTimer += dt;
        if (bot.shootTimer > 2.2 && dist < 25) {
          bot.shootTimer = 0;
          // 40% hit chance if not behind cover
          if (Math.random() < 0.4) {
            p.hp = Math.max(0, p.hp - 12);
            setPlayerHp(p.hp);
            if (playSfx) playSfx('/sounds/hit.mp3');
            if (navigator.vibrate) navigator.vibrate([60, 40, 60]);

            if (p.hp <= 0) {
              triggerGameOver();
            }
          }
        }
      });

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // ResizeObserver & Orientation Sync
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      scene.clear();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, playerHeroId, playSfx, triggerGameOver]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'FPS-3D',
      title: isKo ? '3D 택티컬 전술 슈터' : '3D Tactical FPS Arena',
      description: isKo
        ? '적 용병 봇들을 제압하고 군사 기지 아레나의 최후의 생존자가 되세요!'
        : 'Eliminate rival mercenaries and survive in the tactical military base!',
      keyPoints: isKo
        ? ['엄폐물을 활용하여 적의 총격을 회피', '정확한 조준 사격으로 헤드샷 제압']
        : ['Use cover to avoid enemy fire', 'Land precise shots for quick kills'],
    },
    {
      badge: 'CONTROLS',
      title: isKo ? '모바일 에임 & 조이스틱' : 'Mobile Aim & Joystick',
      description: isKo
        ? '화면 좌측 터치로 이동 조이스틱 생성, 우측 화면을 스와이프하여 자유롭게 에임을 조준하세요!'
        : 'Touch left side to move with joystick, swipe right side to aim crosshair!',
      keyPoints: isKo
        ? ['좌측 플로팅 조이스틱 360° 이동', '우측 스와이프 조준 + 우측 대형 사격 버튼']
        : ['Left dynamic joystick movement', 'Right swipe aiming + big fire button'],
    },
    {
      badge: 'AMMO',
      title: isKo ? '탄약 관리 & 재장전' : 'Ammo & Tactical Reload',
      description: isKo
        ? '탄창 30발을 모두 소모하면 [🔄 재장전] 버튼을 눌러 신속하게 탄약을 보충하세요!'
        : 'Reload quickly when ammo runs low to keep the firepower sustained!',
      keyPoints: isKo
        ? ['탄약 0 도달 시 재장전 필수', '1000점 달성 시 승리']
        : ['Reload when magazine empties', 'Reach 1000 score for victory'],
    },
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Center Tactical Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <div className="relative w-7 h-7 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <div className="absolute top-0 w-0.5 h-2 bg-cyan-300/80" />
          <div className="absolute bottom-0 w-0.5 h-2 bg-cyan-300/80" />
          <div className="absolute left-0 w-2 h-0.5 bg-cyan-300/80" />
          <div className="absolute right-0 w-2 h-0.5 bg-cyan-300/80" />
        </div>
      </div>

      {/* Dynamic Floating Touch Joystick (Left Screen) */}
      {joystickCenter && joystickKnob && (
        <div
          className="absolute pointer-events-none z-30 transition-opacity duration-75"
          style={{
            left: joystickCenter.x,
            top: joystickCenter.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-cyan-400/60 bg-cyan-950/40 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-cyan-400/80" />
          </div>
          <div
            className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-200 border-2 border-white shadow-lg flex items-center justify-center"
            style={{
              left: `calc(50% + ${joystickKnob.x - joystickCenter.x}px)`,
              top: `calc(50% + ${joystickKnob.y - joystickCenter.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-cyan-950/60" />
          </div>
        </div>
      )}

      {/* Top HUD: MinimalistMissionHUD with Quit Settlement */}
      <div className="relative z-20 pointer-events-auto">
        <MinimalistMissionHUD
          missionTitle={isKo ? '크라이젠 3D 택티컬' : 'Cryzen.io 3D'}
          currentScore={score}
          targetScore={1000}
          onExit={handleQuitWithSettlement}
          onShowRules={() => setShowTutorial(true)}
          stats={[
            { label: isKo ? '체력' : 'HP', value: `${playerHp}%` },
            { label: isKo ? '탄약' : 'Ammo', value: `${ammo}/${maxAmmo}` },
            { label: isKo ? '처치' : 'Kills', value: `${kills}명` },
            { label: isKo ? '남은시간' : 'Time', value: `${timeLeft}s` },
          ]}
        />
      </div>

      {/* Kill Feed Notification */}
      {killFeed && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
          <div className="px-4 py-1.5 bg-rose-600/90 text-white font-black text-xs sm:text-sm rounded-full shadow-lg border border-rose-400 flex items-center gap-1.5">
            <span>🎯</span>
            <span>{killFeed}</span>
          </div>
        </div>
      )}

      {/* Mobile Pure Touch Right Action Buttons */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex flex-col items-end gap-3">
        {/* Reload & Jump Mini Row */}
        <div className="flex items-center gap-2">
          {/* Reload Button */}
          <button
            type="button"
            onClick={triggerReload}
            disabled={isReloading || ammo === maxAmmo}
            className={`action-button w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
              isReloading
                ? 'bg-amber-600/80 border-amber-300 text-black animate-spin'
                : 'bg-slate-800/90 hover:bg-slate-700 border-cyan-400/80 text-white shadow-md active:scale-95'
            }`}
          >
            <span className="text-lg">🔄</span>
            <span className="text-[9px] font-bold">{isKo ? '장전' : 'RLD'}</span>
          </button>

          {/* Jump Button */}
          <button
            type="button"
            onClick={triggerJump}
            className="action-button w-14 h-14 rounded-full bg-slate-800/90 hover:bg-slate-700 border-2 border-cyan-400/80 text-white flex flex-col items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
          >
            <span className="text-lg">▲</span>
            <span className="text-[9px] font-bold">{isKo ? '점프' : 'JUMP'}</span>
          </button>
        </div>

        {/* Main 80px [🔫 FIRE] Button */}
        <button
          type="button"
          aria-label="Fire Weapon"
          className="action-button w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 border-4 border-amber-200 text-white shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerShoot();
          }}
          onClick={triggerShoot}
        >
          <span className="text-2xl sm:text-3xl leading-none">🔫</span>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-tighter mt-1">
            {isKo ? '사격 FIRE' : 'FIRE'}
          </span>
        </button>
      </div>

      {/* Exit & Settle Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-cyan-500/80 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 text-2xl font-bold">
              [?]
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '게임을 중단하시겠습니까?' : 'Exit Game?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '지금까지 기록한 적 용병 처치 수와 점수에 비례한 SNS 포인트 보상이 안전하게 정산됩니다.'
                : 'Your reward will be calculated and deposited based on your kills and score.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmExitAndSettle}
                className="flex-1 py-2.5 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
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

      {/* Game Over Modal */}
      {isGameOver && !settlementReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/60 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-2xl font-bold">
              ✕
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '전투 중 전사!' : 'Killed in Action!'}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {isKo ? `최종 처치: ${kills}명 | 점수: ${score}` : `Kills: ${kills} | Score: ${score}`}
            </p>
            <button
              type="button"
              onClick={confirmExitAndSettle}
              className="w-full py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isKo ? '보상 수령 및 복귀' : 'Claim Reward & Exit'}
            </button>
          </div>
        </div>
      )}

      {/* Victory / Settlement Receipt Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={true}
          receipt={settlementReceipt}
          onClose={onExit}
          isKo={isKo}
        />
      )}

      {/* Tutorial Modal */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          try {
            localStorage.setItem('hero_tutorial_cryzen', 'true');
          } catch {}
        }}
        title={isKo ? '크라이젠 3D 가이드' : 'Cryzen.io 3D Guide'}
        steps={tutorialSteps}
        storageKey="hero_tutorial_cryzen"
      />
    </div>
  );
};

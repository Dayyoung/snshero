import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiVectariaGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface VoxelBlock {
  id: number;
  x: number;
  y: number;
  z: number;
  type: 'grass' | 'wood' | 'stone' | 'iron' | 'gold' | 'diamond' | 'crystal';
  hp: number;
  maxHp: number;
  color: number;
  mesh?: THREE.Mesh;
  respawnTime?: number;
}

interface VoxelMonster {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  color: number;
  speed: number;
  attackTimer: number;
  group?: THREE.Group;
  isAlive: boolean;
  respawnTime: number;
}

export const PokiVectariaGame: React.FC<PokiVectariaGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 7;
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // HUD & Game States
  const [score, setScore] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [minedCount, setMinedCount] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(65);
  const [activeTool, setActiveTool] = useState<'pickaxe' | 'sword' | 'potion'>('pickaxe');
  const [potionCooldown, setPotionCooldown] = useState<number>(0);
  const [actionFeed, setActionFeed] = useState<string | null>(null);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_vectaria') !== 'true';
    } catch {
      return true;
    }
  });

  // Dynamic Floating Joystick
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number } | null>(null);

  // Core Game State
  const stateRef = useRef({
    isRunning: true,
    player: {
      x: 0,
      y: 1.0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      angle: 0,
      speed: 5.5,
      isGrounded: true,
      hp: 100,
      isSwinging: false,
      swingProgress: 0,
      group: null as THREE.Group | null,
      rightArm: null as THREE.Group | null,
      leftArm: null as THREE.Group | null,
      rightLeg: null as THREE.Group | null,
      leftLeg: null as THREE.Group | null,
      weaponMesh: null as THREE.Mesh | null,
    },
    input: {
      moveX: 0,
      moveZ: 0,
    },
    blocks: [] as VoxelBlock[],
    monsters: [] as VoxelMonster[],
    particles: [] as Array<{
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
    }>,
    score: 0,
    minedCount: 0,
    kills: 0,
    activeTool: 'pickaxe' as 'pickaxe' | 'sword' | 'potion',
  });

  // Touch tracking for joystick
  const touchTrackingRef = useRef<{
    touchId: number | null;
    startX: number;
    startY: number;
  }>({
    touchId: null,
    startX: 0,
    startY: 0,
  });

  // Keyboard controls (WASD, Space, 1, 2, 3)
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Digit1') {
        stateRef.current.activeTool = 'pickaxe';
        setActiveTool('pickaxe');
      } else if (e.code === 'Digit2') {
        stateRef.current.activeTool = 'sword';
        setActiveTool('sword');
      } else if (e.code === 'Digit3') {
        usePotion();
      } else if (e.code === 'Space') {
        triggerJump();
      } else if (e.code === 'KeyE' || e.code === 'KeyF') {
        triggerAction();
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
      setPotionCooldown((cd) => Math.max(0, cd - 1));
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
      gameId: 'pokivectaria',
      gameTitle: isKo ? '벡타리아 3D 복셀 서바이벌' : 'Vectaria.io 3D',
      durationSeconds: Math.max(1, 65 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isKo, onReward, timeLeft]);

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
      gameId: 'pokivectaria',
      gameTitle: isKo ? '벡타리아 3D 복셀 서바이벌' : 'Vectaria.io 3D',
      durationSeconds: Math.max(1, 65 - timeLeft),
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
      gameId: 'pokivectaria',
      gameTitle: isKo ? '벡타리아 3D 복셀 서바이벌' : 'Vectaria.io 3D',
      durationSeconds: Math.max(1, 65 - timeLeft),
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

  // Use Potion Action
  const usePotion = useCallback(() => {
    if (potionCooldown > 0) return;
    const p = stateRef.current.player;
    if (p.hp >= 100) return;
    p.hp = Math.min(100, p.hp + 40);
    setPlayerHp(p.hp);
    setPotionCooldown(6);
    if (playSfx) playSfx('/sounds/powerup.mp3');
    if (navigator.vibrate) navigator.vibrate([30, 20, 40]);
    setActionFeed(isKo ? '체력 40 회복!' : '+40 HP Restored!');
    setTimeout(() => setActionFeed(null), 2000);
  }, [isKo, playSfx, potionCooldown]);

  // Touch Handlers for Floating Joystick
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchTrackingRef.current.touchId !== null) return;
    const touch = e.changedTouches[0];
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.action-button')) return;

    touchTrackingRef.current.touchId = touch.identifier;
    touchTrackingRef.current.startX = touch.clientX;
    touchTrackingRef.current.startY = touch.clientY;

    setJoystickCenter({ x: touch.clientX, y: touch.clientY });
    setJoystickKnob({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchTrackingRef.current.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchTrackingRef.current.touchId) {
        const dx = touch.clientX - touchTrackingRef.current.startX;
        const dy = touch.clientY - touchTrackingRef.current.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 45;

        let knobX = touch.clientX;
        let knobY = touch.clientY;
        if (dist > maxRadius) {
          knobX = touchTrackingRef.current.startX + (dx / dist) * maxRadius;
          knobY = touchTrackingRef.current.startY + (dy / dist) * maxRadius;
        }
        setJoystickKnob({ x: knobX, y: knobY });

        if (dist > 6) {
          stateRef.current.input.moveX = dx / dist;
          stateRef.current.input.moveZ = dy / dist;
          stateRef.current.player.angle = Math.atan2(dx, dy);
        } else {
          stateRef.current.input.moveX = 0;
          stateRef.current.input.moveZ = 0;
        }
        break;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchTrackingRef.current.touchId) {
        touchTrackingRef.current.touchId = null;
        setJoystickCenter(null);
        setJoystickKnob(null);
        stateRef.current.input.moveX = 0;
        stateRef.current.input.moveZ = 0;
        break;
      }
    }
  }, []);

  // Mine or Attack Trigger
  const triggerAction = useCallback(() => {
    const s = stateRef.current;
    s.player.isSwinging = true;
    s.player.swingProgress = 0;
    if (navigator.vibrate) navigator.vibrate(25);

    const px = s.player.x;
    const py = s.player.y;
    const pz = s.player.z;
    const reach = 3.5;

    // 1. If sword is active or monsters are nearby, prioritize attacking monster
    let targetMonster: VoxelMonster | null = null;
    let nearestMonsterDist = reach;
    s.monsters.forEach((m) => {
      if (!m.isAlive) return;
      const mDist = Math.sqrt((m.x - px) ** 2 + (m.z - pz) ** 2);
      if (mDist < nearestMonsterDist) {
        nearestMonsterDist = mDist;
        targetMonster = m;
      }
    });

    if (targetMonster) {
      const damage = s.activeTool === 'sword' ? 45 : 20;
      targetMonster.hp -= damage;
      if (playSfx) playSfx('/sounds/hit.mp3');

      // Knockback monster
      targetMonster.x += Math.sin(s.player.angle) * 1.5;
      targetMonster.z += Math.cos(s.player.angle) * 1.5;

      if (targetMonster.hp <= 0) {
        targetMonster.isAlive = false;
        targetMonster.respawnTime = 6;
        if (targetMonster.group) targetMonster.group.visible = false;
        s.kills += 1;
        s.score += 250;
        setKills(s.kills);
        setScore(s.score);
        setActionFeed(isKo ? `${targetMonster.name} 처치! (+250)` : `${targetMonster.name} Defeated! (+250)`);
        setTimeout(() => setActionFeed(null), 2500);
        if (playSfx) playSfx('/sounds/crit.mp3');
        if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
      }
      return;
    }

    // 2. Mine Nearest Voxel Block
    let targetBlock: VoxelBlock | null = null;
    let nearestBlockDist = reach;
    s.blocks.forEach((b) => {
      if (b.hp <= 0) return;
      const bDist = Math.sqrt((b.x - px) ** 2 + (b.z - pz) ** 2);
      if (bDist < nearestBlockDist) {
        nearestBlockDist = bDist;
        targetBlock = b;
      }
    });

    if (targetBlock) {
      const toolMultiplier = s.activeTool === 'pickaxe' ? 2 : 1;
      targetBlock.hp -= 25 * toolMultiplier;
      if (playSfx) playSfx('/sounds/tap.mp3');

      if (targetBlock.hp <= 0) {
        // Block Mined!
        if (targetBlock.mesh) targetBlock.mesh.visible = false;
        targetBlock.respawnTime = 7.0;
        s.minedCount += 1;
        const blockPoints = targetBlock.type === 'diamond' ? 150 : targetBlock.type === 'gold' ? 80 : 40;
        s.score += blockPoints;
        setMinedCount(s.minedCount);
        setScore(s.score);

        const blockName =
          targetBlock.type === 'diamond'
            ? isKo
              ? '다이아몬드'
              : 'Diamond'
            : targetBlock.type === 'gold'
            ? isKo
              ? '금'
              : 'Gold'
            : targetBlock.type === 'wood'
            ? isKo
              ? '나무'
              : 'Wood'
            : isKo
            ? '광석'
            : 'Ore';

        setActionFeed(`${blockName} 채굴 성공! (+${blockPoints})`);
        setTimeout(() => setActionFeed(null), 2000);
        if (playSfx) playSfx('/sounds/coin.mp3');
        if (navigator.vibrate) navigator.vibrate([20, 20, 40]);

        if (s.score >= 1000) {
          triggerVictory();
        }
      }
    }
  }, [isKo, playSfx, triggerVictory]);

  // --- Three.js 3D Engine Initialization ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc); // Sky Blue
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.015);

    // 2. Camera (Third-Person Follow)
    const camera = new THREE.PerspectiveCamera(56, width / height, 0.5, 300);
    camera.position.set(0, 10, 14);
    camera.lookAt(0, 1.5, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.1);
    sunLight.position.set(25, 45, 20);
    scene.add(sunLight);

    // 5. Voxel Terrain Ground
    const groundGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80, // Grass green
      roughness: 0.9,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    scene.add(groundMesh);

    // Ground Grid Line
    const grid = new THREE.GridHelper(80, 40, 0x15803d, 0x22c55e);
    grid.position.y = 0.02;
    scene.add(grid);

    // 6. Spawn Voxel Blocks (Trees, Ores, Crystals)
    const blocks: VoxelBlock[] = [];
    const blockBoxGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);

    const blockConfigs = [
      { type: 'diamond', color: 0x0ea5e9, hp: 60, count: 12 },
      { type: 'gold', color: 0xf59e0b, hp: 50, count: 14 },
      { type: 'iron', color: 0xf97316, hp: 40, count: 16 },
      { type: 'wood', color: 0x78350f, hp: 30, count: 16 },
      { type: 'stone', color: 0x64748b, hp: 35, count: 18 },
    ];

    let blockIdCounter = 1;
    blockConfigs.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const bMat = new THREE.MeshStandardMaterial({
          color: cfg.color,
          roughness: 0.6,
          metalness: cfg.type === 'diamond' || cfg.type === 'gold' ? 0.4 : 0.1,
        });
        const bMesh = new THREE.Mesh(blockBoxGeo, bMat);

        // Distribute within arena (excluding center spawn)
        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * 28;
        const bx = Math.round(Math.cos(angle) * dist);
        const bz = Math.round(Math.sin(angle) * dist);
        const by = 0.8;

        bMesh.position.set(bx, by, bz);
        scene.add(bMesh);

        blocks.push({
          id: blockIdCounter++,
          x: bx,
          y: by,
          z: bz,
          type: cfg.type as any,
          hp: cfg.hp,
          maxHp: cfg.hp,
          color: cfg.color,
          mesh: bMesh,
        });
      }
    });
    stateRef.current.blocks = blocks;

    // Center Giant Ancient Crystal Obelisk (Goal Object)
    const crystalGeo = new THREE.OctahedronGeometry(2.4, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.set(0, 4.0, 0);
    scene.add(crystalMesh);

    // 7. Player 3D Voxel Steve Avatar
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    stateRef.current.player.group = playerGroup;

    // Head
    const headGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.6 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.9;
    playerGroup.add(headMesh);

    // Hair
    const hairGeo = new THREE.BoxGeometry(1.05, 0.35, 1.05);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 0.45, 0);
    headMesh.add(hairMesh);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.18, 0.12, 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(0.24, 0.05, 0.52);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(-0.24, 0.05, 0.52);
    headMesh.add(lEye);
    headMesh.add(rEye);

    // Card Hero Sprite Badge above player head
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
      bCtx.strokeStyle = '#38bdf8';
      bCtx.stroke();
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTexture, transparent: true }));
    badgeSprite.position.set(0, 3.2, 0);
    badgeSprite.scale.set(1.8, 1.8, 1);
    playerGroup.add(badgeSprite);

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.9, 1.1, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.6 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.95;
    playerGroup.add(bodyMesh);

    // Right Arm (Weapon Wielding)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.65, 1.4, 0);
    const armGeo = new THREE.BoxGeometry(0.38, 1.0, 0.38);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa });
    const rightArmMesh = new THREE.Mesh(armGeo, armMat);
    rightArmMesh.position.y = -0.45;
    rightArmGroup.add(rightArmMesh);

    // Tool Mesh (Pickaxe / Sword attached to right arm)
    const toolGeo = new THREE.BoxGeometry(0.18, 0.9, 0.18);
    const toolMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5 });
    const toolMesh = new THREE.Mesh(toolGeo, toolMat);
    toolMesh.position.set(0, -0.7, 0.4);
    toolMesh.rotation.x = Math.PI / 4;
    rightArmGroup.add(toolMesh);
    playerGroup.add(rightArmGroup);
    stateRef.current.player.rightArm = rightArmGroup;
    stateRef.current.player.weaponMesh = toolMesh;

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.65, 1.4, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.y = -0.45;
    leftArmGroup.add(leftArmMesh);
    playerGroup.add(leftArmGroup);
    stateRef.current.player.leftArm = leftArmGroup;

    // Legs
    const legGeo = new THREE.BoxGeometry(0.4, 0.95, 0.4);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.24, 0.45, 0);
    const rLegMesh = new THREE.Mesh(legGeo, legMat);
    rLegMesh.position.y = -0.45;
    rightLegGroup.add(rLegMesh);
    playerGroup.add(rightLegGroup);
    stateRef.current.player.rightLeg = rightLegGroup;

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.24, 0.45, 0);
    const lLegMesh = new THREE.Mesh(legGeo, legMat);
    lLegMesh.position.y = -0.45;
    leftLegGroup.add(lLegMesh);
    playerGroup.add(leftLegGroup);
    stateRef.current.player.leftLeg = leftLegGroup;

    // 8. Spawn 4 Voxel Hostile Monsters / Rival Bots
    const monsterNames = ['크리퍼 복셀', '네더 고렘', '좀비 헌터', '스켈레톤 워리어'];
    const monsterColors = [0x22c55e, 0xef4444, 0x15803d, 0x94a3b8];
    const monsters: VoxelMonster[] = [];

    monsterNames.forEach((mName, idx) => {
      const mGroup = new THREE.Group();
      const mAngle = (idx / 4) * Math.PI * 2 + 0.4;
      const mDist = 18 + Math.random() * 8;
      const mx = Math.cos(mAngle) * mDist;
      const mz = Math.sin(mAngle) * mDist;
      mGroup.position.set(mx, 0, mz);
      scene.add(mGroup);

      // Monster Body
      const mBodyGeo = new THREE.BoxGeometry(1.0, 1.6, 0.8);
      const mBodyMat = new THREE.MeshStandardMaterial({ color: monsterColors[idx], roughness: 0.5 });
      const mBody = new THREE.Mesh(mBodyGeo, mBodyMat);
      mBody.position.y = 1.0;
      mGroup.add(mBody);

      // Monster Head
      const mHeadGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
      const mHead = new THREE.Mesh(mHeadGeo, mBodyMat);
      mHead.position.y = 2.2;
      mGroup.add(mHead);

      monsters.push({
        id: idx + 1,
        name: mName,
        x: mx,
        y: 0,
        z: mz,
        hp: 100,
        maxHp: 100,
        color: monsterColors[idx],
        speed: 3.2,
        attackTimer: 0,
        group: mGroup,
        isAlive: true,
        respawnTime: 0,
      });
    });
    stateRef.current.monsters = monsters;

    // 9. Main Animation Loop
    let lastTime = performance.now();
    let walkCycle = 0;

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!stateRef.current.isRunning) {
        renderer.render(scene, camera);
        return;
      }

      // Rotate ancient crystal
      crystalMesh.rotation.y += 1.0 * dt;
      crystalMesh.position.y = 4.0 + Math.sin(time * 0.003) * 0.3;

      // Handle Keyboard Movement
      const keys = keysRef.current;
      let kx = 0;
      let kz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) kz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) kz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) kx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) kx += 1;

      if (kx !== 0 || kz !== 0) {
        const kLen = Math.sqrt(kx * kx + kz * kz);
        stateRef.current.input.moveX = kx / kLen;
        stateRef.current.input.moveZ = kz / kLen;
        stateRef.current.player.angle = Math.atan2(kx, kz);
      }

      const p = stateRef.current.player;
      const inp = stateRef.current.input;
      const isMoving = Math.abs(inp.moveX) > 0.05 || Math.abs(inp.moveZ) > 0.05;

      // Move player
      if (isMoving) {
        p.x += inp.moveX * p.speed * dt;
        p.z += inp.moveZ * p.speed * dt;
        walkCycle += 12 * dt;
      } else {
        walkCycle = 0;
      }

      // Vertical Physics (Gravity & Jump)
      p.vy -= 22 * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.isGrounded = true;
      }

      // Arena boundary clamp
      const arenaLimit = 36;
      p.x = Math.max(-arenaLimit, Math.min(arenaLimit, p.x));
      p.z = Math.max(-arenaLimit, Math.min(arenaLimit, p.z));

      // Player Group Mesh Position & Rotation
      if (p.group) {
        p.group.position.set(p.x, p.y, p.z);
        if (isMoving) {
          p.group.rotation.y = p.angle;
        }

        // Arm & Leg Swing Walking Animation
        if (p.leftLeg && p.rightLeg && p.leftArm) {
          p.leftLeg.rotation.x = Math.sin(walkCycle) * 0.6;
          p.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.6;
          p.leftArm.rotation.x = -Math.sin(walkCycle) * 0.5;
        }

        // Right Arm Tool Swing
        if (p.rightArm) {
          if (p.isSwinging) {
            p.swingProgress += 16 * dt;
            p.rightArm.rotation.x = -Math.sin(p.swingProgress) * 1.5;
            if (p.swingProgress >= Math.PI) {
              p.isSwinging = false;
              p.rightArm.rotation.x = 0;
            }
          } else if (isMoving) {
            p.rightArm.rotation.x = Math.sin(walkCycle) * 0.5;
          } else {
            p.rightArm.rotation.x = 0;
          }
        }
      }

      // Smooth Camera Follow
      camera.position.x += (p.x - camera.position.x) * 0.08;
      camera.position.y += (p.y + 11 - camera.position.y) * 0.08;
      camera.position.z += (p.z + 14 - camera.position.z) * 0.08;
      camera.lookAt(p.x, p.y + 1.2, p.z);

      // --- Block Respawn Logic ---
      stateRef.current.blocks.forEach((b) => {
        if (b.hp <= 0 && b.respawnTime !== undefined) {
          b.respawnTime -= dt;
          if (b.respawnTime <= 0) {
            b.hp = b.maxHp;
            if (b.mesh) b.mesh.visible = true;
          }
        }
      });

      // --- Monster AI & Movement ---
      stateRef.current.monsters.forEach((m) => {
        if (!m.isAlive) {
          m.respawnTime -= dt;
          if (m.respawnTime <= 0) {
            m.isAlive = true;
            m.hp = m.maxHp;
            const respAng = Math.random() * Math.PI * 2;
            m.x = Math.cos(respAng) * 24;
            m.z = Math.sin(respAng) * 24;
            if (m.group) {
              m.group.position.set(m.x, 0, m.z);
              m.group.visible = true;
            }
          }
          return;
        }

        // Steer toward player
        const dx = p.x - m.x;
        const dz = p.z - m.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 1.6) {
          m.x += (dx / dist) * m.speed * dt;
          m.z += (dz / dist) * m.speed * dt;
          if (m.group) {
            m.group.position.set(m.x, 0, m.z);
            m.group.rotation.y = Math.atan2(dx, dz);
          }
        } else {
          // Monster attacks player!
          m.attackTimer += dt;
          if (m.attackTimer > 1.2) {
            m.attackTimer = 0;
            p.hp = Math.max(0, p.hp - 15);
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
      badge: 'VOXEL-3D',
      title: isKo ? '3D 복셀 서바이벌 & 채굴' : '3D Voxel Survival & Mining',
      description: isKo
        ? '마인크래프트풍 3D 오픈 아레나에서 다이아몬드, 금, 철, 목재를 채굴하여 점수를 획득하세요!'
        : 'Mine diamonds, gold, iron and wood in a 3D Minecraft-style open arena!',
      keyPoints: isKo
        ? ['광석에 접근하여 채굴 액션 실행', '고급 광석일수록 높은 점수 획득']
        : ['Approach ores to start mining', 'Rarer ores grant higher scores'],
    },
    {
      badge: 'COMBAT',
      title: isKo ? '몬스터 소탕 & 전투' : 'Monster Extermination',
      description: isKo
        ? '접근하는 복셀 몬스터들을 검으로 공격하여 격파하세요! 처치 시 대량의 다이아몬드 보너스를 얻습니다.'
        : 'Slash approaching voxel monsters with your sword! Defeating them grants massive bonus gems!',
      keyPoints: isKo
        ? ['2번 무기 검으로 적 공격', '체력 저하 시 3번 치유 물약 사용']
        : ['Switch to sword for combat', 'Use healing potion when low on HP'],
    },
    {
      badge: 'TOUCH',
      title: isKo ? '모바일 퓨어 터치 조작' : 'Pure Touch Controls',
      description: isKo
        ? '화면을 터치하면 나타나는 다이나믹 플로팅 조이스틱으로 이동하고, 우측 [⛏️ 채굴/공격] 대형 버튼으로 즉각 액션을 수행하세요!'
        : 'Use the dynamic floating joystick to walk and press [⛏️ MINE/ATTACK] to interact!',
      keyPoints: isKo
        ? ['원하는 화면 지점 터치로 360° 조향', '우측 80px 메인 버튼 및 점프 지원']
        : ['Dynamic floating joystick anywhere', '80px main action button & jump'],
    },
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-sky-300 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Dynamic Floating Touch Joystick Ring & Knob */}
      {joystickCenter && joystickKnob && (
        <div
          className="absolute pointer-events-none z-30 transition-opacity duration-75"
          style={{
            left: joystickCenter.x,
            top: joystickCenter.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-sky-400/60 bg-sky-950/40 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-sky-400/80" />
          </div>
          <div
            className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-200 border-2 border-white shadow-lg flex items-center justify-center"
            style={{
              left: `calc(50% + ${joystickKnob.x - joystickCenter.x}px)`,
              top: `calc(50% + ${joystickKnob.y - joystickCenter.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-sky-950/60" />
          </div>
        </div>
      )}

      {/* Top HUD: MinimalistMissionHUD with Quit Settlement */}
      <div className="relative z-20 pointer-events-auto">
        <MinimalistMissionHUD
          missionTitle={isKo ? '벡타리아 3D 서바이벌' : 'Vectaria.io 3D'}
          currentScore={score}
          targetScore={1000}
          onExit={handleQuitWithSettlement}
          onShowRules={() => setShowTutorial(true)}
          stats={[
            { label: isKo ? '체력' : 'HP', value: `${playerHp}%` },
            { label: isKo ? '채굴' : 'Mined', value: `${minedCount}개` },
            { label: isKo ? '처치' : 'Kills', value: `${kills}명` },
            { label: isKo ? '남은시간' : 'Time', value: `${timeLeft}s` },
          ]}
        />
      </div>

      {/* Action Notification Feed */}
      {actionFeed && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
          <div className="px-4 py-1.5 bg-sky-500/90 text-white font-black text-xs sm:text-sm rounded-full shadow-lg border border-sky-300 flex items-center gap-1.5">
            <span>⛏️</span>
            <span>{actionFeed}</span>
          </div>
        </div>
      )}

      {/* Bottom Tool Hotbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            stateRef.current.activeTool = 'pickaxe';
            setActiveTool('pickaxe');
          }}
          className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTool === 'pickaxe'
              ? 'bg-sky-600 text-white border border-sky-400 shadow-md scale-105'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span>⛏️</span>
          <span className="hidden sm:inline">{isKo ? '곡괭이' : 'Pickaxe'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stateRef.current.activeTool = 'sword';
            setActiveTool('sword');
          }}
          className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTool === 'sword'
              ? 'bg-rose-600 text-white border border-rose-400 shadow-md scale-105'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span>⚔️</span>
          <span className="hidden sm:inline">{isKo ? '검' : 'Sword'}</span>
        </button>

        <button
          type="button"
          onClick={usePotion}
          disabled={potionCooldown > 0 || playerHp >= 100}
          className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            potionCooldown > 0
              ? 'bg-slate-800/50 text-slate-600 border border-transparent cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-400 shadow-md'
          }`}
        >
          <span>🧪</span>
          <span className="hidden sm:inline">{isKo ? '치유' : 'Heal'}</span>
          {potionCooldown > 0 && <span className="text-[10px] text-amber-300">({potionCooldown}s)</span>}
        </button>
      </div>

      {/* Mobile Pure Touch 80px [⛏️ MINE/ATTACK] & Jump Buttons */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex flex-col items-end gap-3">
        {/* Jump Button */}
        <button
          type="button"
          aria-label="Jump"
          className="action-button w-16 h-16 rounded-full bg-slate-800/90 hover:bg-slate-700 border-2 border-sky-400/80 text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerJump();
          }}
          onClick={triggerJump}
        >
          <span className="text-xl">▲</span>
          <span className="text-[10px] font-bold mt-0.5">{isKo ? '점프' : 'JUMP'}</span>
        </button>

        {/* Main Action Button (Mine / Attack) */}
        <button
          type="button"
          aria-label="Mine or Attack"
          className="action-button w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 border-4 border-cyan-200 text-white shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerAction();
          }}
          onClick={triggerAction}
        >
          <span className="text-2xl sm:text-3xl leading-none">
            {activeTool === 'sword' ? '⚔️' : '⛏️'}
          </span>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-tighter mt-1">
            {activeTool === 'sword'
              ? isKo
                ? '공격 ATTACK'
                : 'ATTACK'
              : isKo
              ? '채굴 MINE'
              : 'MINE'}
          </span>
        </button>
      </div>

      {/* Exit & Settle Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 text-2xl font-bold">
              [?]
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '게임을 중단하시겠습니까?' : 'Exit Game?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '지금까지 채굴한 자원과 소탕한 몬스터 수에 비례한 SNS 포인트 보상이 안전하게 정산됩니다.'
                : 'Your reward will be calculated and deposited based on mined resources and kills.'}
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

      {/* Game Over Settlement Modal */}
      {isGameOver && !settlementReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/60 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-2xl font-bold">
              ✕
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '체력 소진으로 쓰러짐!' : 'Player Knocked Out!'}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {isKo ? `채굴량: ${minedCount}개 | 처치 수: ${kills}` : `Mined: ${minedCount} | Kills: ${kills}`}
            </p>
            <button
              type="button"
              onClick={confirmExitAndSettle}
              className="w-full py-2.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
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

      {/* How to Play Tutorial Modal */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          try {
            localStorage.setItem('hero_tutorial_vectaria', 'true');
          } catch {}
        }}
        title={isKo ? '벡타리아 3D 가이드' : 'Vectaria.io 3D Guide'}
        steps={tutorialSteps}
        storageKey="hero_tutorial_vectaria"
      />
    </div>
  );
};

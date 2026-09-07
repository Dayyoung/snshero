import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiSnakeVsWormsGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Point3D {
  x: number;
  z: number;
}

interface FoodItem {
  id: number;
  x: number;
  z: number;
  type: 'donut' | 'pizza' | 'energy';
  points: number;
  color: number;
  mesh?: THREE.Mesh;
}

interface BotSnake {
  id: number;
  name: string;
  colorHex: string;
  colorThree: number;
  x: number;
  z: number;
  angle: number;
  targetAngle: number;
  speed: number;
  length: number;
  history: Point3D[];
  isAlive: boolean;
  respawnTimer: number;
  headMesh?: THREE.Group;
  segmentMeshes: THREE.Mesh[];
}

export const PokiSnakeVsWormsGame: React.FC<PokiSnakeVsWormsGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 6;
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [wormLength, setWormLength] = useState<number>(12);
  const [kills, setKills] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [myRank, setMyRank] = useState<number>(5);
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; score: number; color: string; isPlayer: boolean }>>([]);
  const [killFeed, setKillFeed] = useState<string | null>(null);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_snake_vs_worms') !== 'true';
    } catch {
      return true;
    }
  });

  // Dynamic Floating Joystick State
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number } | null>(null);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);

  // Core Game State Refs
  const stateRef = useRef({
    isRunning: true,
    player: {
      x: 0,
      z: 0,
      angle: 0,
      targetAngle: 0,
      speed: 4.2,
      boostSpeed: 7.2,
      isBoosting: false,
      length: 12,
      history: [] as Point3D[],
      headMesh: null as THREE.Group | null,
      segmentMeshes: [] as THREE.Mesh[],
    },
    foods: [] as FoodItem[],
    bots: [] as BotSnake[],
    particles: [] as Array<{
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
    }>,
    score: 0,
    kills: 0,
    lastBoostDrain: 0,
  });

  // Touch tracking for floating joystick
  const touchTrackingRef = useRef<{
    touchId: number | null;
    startX: number;
    startY: number;
  }>({
    touchId: null,
    startX: 0,
    startY: 0,
  });

  // Keyboard support (WASD / Arrows / Space)
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') {
        stateRef.current.player.isBoosting = true;
        setIsBoosting(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === 'Space') {
        stateRef.current.player.isBoosting = false;
        setIsBoosting(false);
      }
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
      gameId: 'pokisnakevsworms',
      gameTitle: isKo ? '스네이크 vs 웜스 3D' : 'Snake vs Worms 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
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
      gameId: 'pokisnakevsworms',
      gameTitle: isKo ? '스네이크 vs 웜스 3D' : 'Snake vs Worms 3D',
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
      gameId: 'pokisnakevsworms',
      gameTitle: isKo ? '스네이크 vs 웜스 3D' : 'Snake vs Worms 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: Math.max(1000, finalScore),
      maxTargetScore: 1000,
      isVictory: true,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isGameOver, isKo, isVictory, onReward, playSfx, timeLeft]);

  // Touch handlers for dynamic floating joystick
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchTrackingRef.current.touchId !== null) return;
    const touch = e.changedTouches[0];
    // Ignore if touch started on boost button
    const target = e.target as HTMLElement;
    if (target.closest('.boost-button') || target.closest('button')) return;

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
        const maxRadius = 46;

        let knobX = touch.clientX;
        let knobY = touch.clientY;

        if (dist > maxRadius) {
          knobX = touchTrackingRef.current.startX + (dx / dist) * maxRadius;
          knobY = touchTrackingRef.current.startY + (dy / dist) * maxRadius;
        }

        setJoystickKnob({ x: knobX, y: knobY });

        if (dist > 6) {
          // Angle in radians (XZ plane: dx corresponds to X, dy corresponds to Z)
          const angle = Math.atan2(dy, dx);
          stateRef.current.player.targetAngle = angle;
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
        break;
      }
    }
  }, []);

  // Boost Button handlers with 0ms delay and haptic
  const startBoost = useCallback(() => {
    stateRef.current.player.isBoosting = true;
    setIsBoosting(true);
    if (navigator.vibrate) navigator.vibrate(20);
    if (playSfx) playSfx('/sounds/whoosh.mp3');
  }, [playSfx]);

  const stopBoost = useCallback(() => {
    stateRef.current.player.isBoosting = false;
    setIsBoosting(false);
  }, []);

  // --- Three.js 3D Engine Initialization ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);

    // 2. Camera (Perspective top-down angled follow)
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.5, 300);
    camera.position.set(0, 38, 26);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);

    // 5. Arena Floor & Boundary Ring
    const arenaRadius = 65;
    const floorGeo = new THREE.CircleGeometry(arenaRadius, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.05;
    scene.add(floorMesh);

    // Grid on floor
    const gridHelper = new THREE.GridHelper(arenaRadius * 2, 40, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Outer Boundary Wall Tube
    const wallGeo = new THREE.TorusGeometry(arenaRadius, 0.8, 12, 64);
    const wallMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: false });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.rotation.x = Math.PI / 2;
    wallMesh.position.y = 0.5;
    scene.add(wallMesh);

    // 6. Player Snake 3D Creation
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    stateRef.current.player.headMesh = playerGroup;

    // Player Head Sphere (Emerald Green)
    const headGeo = new THREE.SphereGeometry(1.25, 20, 20);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x065f46,
      roughness: 0.3,
      metalness: 0.2,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    playerGroup.add(headMesh);

    // Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.18, 10, 10);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEye.position.set(0.6, 0.55, 0.7);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0.68, 0.58, 0.85);
    playerGroup.add(leftEye);
    playerGroup.add(leftPupil);

    const rightEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEye.position.set(-0.6, 0.55, 0.7);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(-0.68, 0.58, 0.85);
    playerGroup.add(rightEye);
    playerGroup.add(rightPupil);

    // Tongue (flicking)
    const tongueGeo = new THREE.ConeGeometry(0.18, 0.9, 8);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    tongueMesh.rotation.x = Math.PI / 2;
    tongueMesh.position.set(0, 0, 1.5);
    playerGroup.add(tongueMesh);

    // Card Hero Sprite Badge above player head
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 128;
    cardCanvas.height = 128;
    const bCtx = cardCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#0f172a';
      bCtx.beginPath();
      bCtx.arc(64, 64, 60, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.lineWidth = 6;
      bCtx.strokeStyle = '#10b981';
      bCtx.stroke();
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(cardCanvas);
    const badgeMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
    const badgeSprite = new THREE.Sprite(badgeMat);
    badgeSprite.scale.set(2.8, 2.8, 1);
    badgeSprite.position.set(0, 2.8, 0);
    playerGroup.add(badgeSprite);

    // Segment Pool for Player
    const segmentGeo = new THREE.SphereGeometry(0.95, 14, 14);
    const segmentMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      roughness: 0.4,
    });
    const playerSegments: THREE.Mesh[] = [];
    for (let i = 0; i < 90; i++) {
      const seg = new THREE.Mesh(segmentGeo, segmentMat);
      seg.visible = false;
      scene.add(seg);
      playerSegments.push(seg);
    }
    stateRef.current.player.segmentMeshes = playerSegments;

    // Initial player history
    const initialHist: Point3D[] = [];
    for (let i = 0; i < 200; i++) {
      initialHist.push({ x: 0, z: -i * 0.7 });
    }
    stateRef.current.player.history = initialHist;

    // 7. Spawn 3D Food Items (110 items)
    const foods: FoodItem[] = [];
    const foodGeoDonut = new THREE.TorusGeometry(0.55, 0.25, 10, 18);
    const foodGeoPizza = new THREE.ConeGeometry(0.65, 0.25, 4);
    const foodGeoEnergy = new THREE.IcosahedronGeometry(0.55, 1);

    const foodColors = [0xf59e0b, 0xec4899, 0x3b82f6, 0x10b981, 0x8b5cf6, 0xf43f5e];

    for (let i = 0; i < 110; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * (arenaRadius - 5);
      const fx = Math.cos(angle) * rad;
      const fz = Math.sin(angle) * rad;

      const typeRandom = Math.random();
      let type: 'donut' | 'pizza' | 'energy' = 'donut';
      let geo: THREE.BufferGeometry = foodGeoDonut;
      let points = 15;

      if (typeRandom < 0.4) {
        type = 'donut';
        geo = foodGeoDonut;
        points = 15;
      } else if (typeRandom < 0.75) {
        type = 'pizza';
        geo = foodGeoPizza;
        points = 25;
      } else {
        type = 'energy';
        geo = foodGeoEnergy;
        points = 35;
      }

      const color = foodColors[Math.floor(Math.random() * foodColors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.3,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(fx, 0.6, fz);
      if (type === 'donut') mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);

      foods.push({
        id: i,
        x: fx,
        z: fz,
        type,
        points,
        color,
        mesh,
      });
    }
    stateRef.current.foods = foods;

    // 8. Spawn AI Bots (7 Bots)
    const botTemplates = [
      { name: '골든 렉스', colorHex: '#f59e0b', colorThree: 0xf59e0b },
      { name: '바이퍼 독사', colorHex: '#8b5cf6', colorThree: 0x8b5cf6 },
      { name: '심해 크라켄', colorHex: '#06b6d4', colorThree: 0x06b6d4 },
      { name: '화염 살라맨더', colorHex: '#ef4444', colorThree: 0xef4444 },
      { name: '밀림 아나콘다', colorHex: '#22c55e', colorThree: 0x22c55e },
      { name: '사이버 네온', colorHex: '#ec4899', colorThree: 0xec4899 },
      { name: '빙하 스노우', colorHex: '#38bdf8', colorThree: 0x38bdf8 },
    ];

    const bots: BotSnake[] = [];
    botTemplates.forEach((tmpl, idx) => {
      const bAngle = (idx / botTemplates.length) * Math.PI * 2;
      const bDist = 20 + Math.random() * 25;
      const bx = Math.cos(bAngle) * bDist;
      const bz = Math.sin(bAngle) * bDist;

      const botGroup = new THREE.Group();
      botGroup.position.set(bx, 0, bz);
      scene.add(botGroup);

      // Bot Head
      const bHeadGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const bHeadMat = new THREE.MeshStandardMaterial({
        color: tmpl.colorThree,
        roughness: 0.4,
      });
      const bHeadMesh = new THREE.Mesh(bHeadGeo, bHeadMat);
      botGroup.add(bHeadMesh);

      // Bot Eyes
      const bEyeLeft = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      bEyeLeft.position.set(0.55, 0.5, 0.65);
      const bPupilLeft = new THREE.Mesh(pupilGeo, pupilMat);
      bPupilLeft.position.set(0.62, 0.53, 0.8);
      botGroup.add(bEyeLeft);
      botGroup.add(bPupilLeft);

      const bEyeRight = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      bEyeRight.position.set(-0.55, 0.5, 0.65);
      const bPupilRight = new THREE.Mesh(pupilGeo, pupilMat);
      bPupilRight.position.set(-0.62, 0.53, 0.8);
      botGroup.add(bEyeRight);
      botGroup.add(bPupilRight);

      // Bot Segment pool
      const bSegments: THREE.Mesh[] = [];
      const bSegMat = new THREE.MeshStandardMaterial({
        color: tmpl.colorThree,
        roughness: 0.5,
      });
      for (let s = 0; s < 45; s++) {
        const seg = new THREE.Mesh(segmentGeo, bSegMat);
        seg.visible = false;
        scene.add(seg);
        bSegments.push(seg);
      }

      // Initial bot history
      const bHist: Point3D[] = [];
      for (let h = 0; h < 100; h++) {
        bHist.push({ x: bx, z: bz - h * 0.7 });
      }

      bots.push({
        id: idx + 1,
        name: tmpl.name,
        colorHex: tmpl.colorHex,
        colorThree: tmpl.colorThree,
        x: bx,
        z: bz,
        angle: Math.random() * Math.PI * 2,
        targetAngle: Math.random() * Math.PI * 2,
        speed: 3.6 + Math.random() * 0.6,
        length: 10 + Math.floor(Math.random() * 6),
        history: bHist,
        isAlive: true,
        respawnTimer: 0,
        headMesh: botGroup,
        segmentMeshes: bSegments,
      });
    });
    stateRef.current.bots = bots;

    // Helper: Spawn explosion particle burst
    const spawnExplosionParticles = (px: number, pz: number, colorThree: number, count = 18) => {
      const pGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({ color: colorThree });
      for (let i = 0; i < count; i++) {
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(px, 0.6, pz);
        scene.add(pMesh);
        const theta = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        stateRef.current.particles.push({
          mesh: pMesh,
          vx: Math.cos(theta) * speed,
          vy: 3 + Math.random() * 6,
          vz: Math.sin(theta) * speed,
          life: 0.75,
        });
      }
    };

    // Helper: Spawn food drop when a snake dies
    const spawnDroppedFoods = (points: Point3D[]) => {
      const step = Math.max(1, Math.floor(points.length / 10));
      for (let i = 0; i < points.length; i += step) {
        const pt = points[i];
        const color = foodColors[Math.floor(Math.random() * foodColors.length)];
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        });
        const mesh = new THREE.Mesh(foodGeoEnergy, mat);
        mesh.position.set(pt.x + (Math.random() - 0.5) * 1.5, 0.6, pt.z + (Math.random() - 0.5) * 1.5);
        scene.add(mesh);
        stateRef.current.foods.push({
          id: Math.floor(Math.random() * 100000),
          x: mesh.position.x,
          z: mesh.position.z,
          type: 'energy',
          points: 40,
          color,
          mesh,
        });
      }
    };

    // 9. Main Game Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!stateRef.current.isRunning) {
        renderer.render(scene, camera);
        return;
      }

      // --- Keyboard Controls Update ---
      const keys = keysRef.current;
      let keyTurn = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) keyTurn -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) keyTurn += 1;
      if (keyTurn !== 0) {
        stateRef.current.player.angle += keyTurn * 3.5 * dt;
        stateRef.current.player.targetAngle = stateRef.current.player.angle;
      } else if (touchTrackingRef.current.touchId !== null) {
        // Smoothly interpolate angle toward joystick target angle
        let diff = stateRef.current.player.targetAngle - stateRef.current.player.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        stateRef.current.player.angle += diff * Math.min(1, 10 * dt);
      }

      const player = stateRef.current.player;
      const currentSpeed = player.isBoosting && player.length > 6 ? player.boostSpeed : player.speed;

      // Boost drain & particle trail
      if (player.isBoosting && player.length > 6) {
        if (time - stateRef.current.lastBoostDrain > 300) {
          stateRef.current.lastBoostDrain = time;
          player.length = Math.max(6, player.length - 1);
          setWormLength(player.length);
        }
        // Boost Spark Particle
        const sparkGeo = new THREE.SphereGeometry(0.2, 6, 6);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
        const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
        sparkMesh.position.set(player.x - Math.cos(player.angle) * 1.5, 0.4, player.z - Math.sin(player.angle) * 1.5);
        scene.add(sparkMesh);
        stateRef.current.particles.push({
          mesh: sparkMesh,
          vx: (Math.random() - 0.5) * 3,
          vy: 1 + Math.random() * 3,
          vz: (Math.random() - 0.5) * 3,
          life: 0.35,
        });
      }

      // Move player forward
      player.x += Math.cos(player.angle) * currentSpeed * dt;
      player.z += Math.sin(player.angle) * currentSpeed * dt;

      // Arena boundary clamp / bounce
      const playerDist = Math.sqrt(player.x * player.x + player.z * player.z);
      if (playerDist > arenaRadius - 1.5) {
        const normX = player.x / playerDist;
        const normZ = player.z / playerDist;
        player.x = normX * (arenaRadius - 1.5);
        player.z = normZ * (arenaRadius - 1.5);
        player.angle = Math.atan2(-normZ, -normX);
        player.targetAngle = player.angle;
      }

      // Record Player History
      player.history.unshift({ x: player.x, z: player.z });
      const maxHistoryNeeded = (player.length + 5) * 6;
      if (player.history.length > maxHistoryNeeded) {
        player.history.pop();
      }

      // Update Player Head Mesh
      if (player.headMesh) {
        player.headMesh.position.set(player.x, 0.6, player.z);
        player.headMesh.rotation.y = -player.angle + Math.PI / 2;
        // Tongue flick
        tongueMesh.position.z = 1.4 + Math.sin(time * 0.02) * 0.25;
      }

      // Update Player Segments (spacing = 4 history steps)
      const segSpacing = 4;
      for (let i = 0; i < player.segmentMeshes.length; i++) {
        const segMesh = player.segmentMeshes[i];
        if (i < player.length) {
          const histIdx = (i + 1) * segSpacing;
          if (histIdx < player.history.length) {
            const pt = player.history[histIdx];
            segMesh.position.set(pt.x, 0.6, pt.z);
            segMesh.visible = true;
          } else {
            segMesh.visible = false;
          }
        } else {
          segMesh.visible = false;
        }
      }

      // Camera smoothly follows player head
      camera.position.x += (player.x - camera.position.x) * 0.08;
      camera.position.z += (player.z + 24 - camera.position.z) * 0.08;
      camera.lookAt(player.x, 0.6, player.z);

      // --- Update Food Items & Eating Detection ---
      const foods = stateRef.current.foods;
      for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        if (!f.mesh) continue;

        // Floating bounce animation
        f.mesh.position.y = 0.6 + Math.sin(time * 0.004 + f.id) * 0.18;
        f.mesh.rotation.y += 1.5 * dt;

        // Player eats food
        const dx = player.x - f.x;
        const dz = player.z - f.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 1.8) {
          // Eat!
          stateRef.current.score += f.points;
          player.length = Math.min(85, player.length + 1);
          setScore(stateRef.current.score);
          setWormLength(player.length);

          if (playSfx) playSfx('/sounds/coin.mp3');
          if (navigator.vibrate) navigator.vibrate(15);

          // Sparkle particles
          spawnExplosionParticles(f.x, f.z, f.color, 6);

          // Respaw in new spot
          const newAng = Math.random() * Math.PI * 2;
          const newRad = Math.random() * (arenaRadius - 6);
          f.x = Math.cos(newAng) * newRad;
          f.z = Math.sin(newAng) * newRad;
          f.mesh.position.set(f.x, 0.6, f.z);
        }
      }

      // --- Update AI Bots ---
      const bots = stateRef.current.bots;
      bots.forEach((bot) => {
        if (!bot.isAlive) {
          bot.respawnTimer -= dt;
          if (bot.respawnTimer <= 0) {
            // Respawn Bot
            bot.isAlive = true;
            const respAng = Math.random() * Math.PI * 2;
            const respRad = 20 + Math.random() * 30;
            bot.x = Math.cos(respAng) * respRad;
            bot.z = Math.sin(respAng) * respRad;
            bot.angle = Math.random() * Math.PI * 2;
            bot.length = 10 + Math.floor(Math.random() * 5);
            bot.history = [];
            for (let h = 0; h < 100; h++) {
              bot.history.push({ x: bot.x, z: bot.z - h * 0.7 });
            }
            if (bot.headMesh) bot.headMesh.visible = true;
          }
          return;
        }

        // Bot AI: Steer toward nearby food or avoid player
        let desiredAngle = bot.targetAngle;

        // Find nearest food
        let nearestFoodDist = 30;
        let targetFood: FoodItem | null = null;
        for (let fi = 0; fi < Math.min(25, foods.length); fi++) {
          const food = foods[(bot.id * 15 + fi) % foods.length];
          const fdx = food.x - bot.x;
          const fdz = food.z - bot.z;
          const fdist = Math.sqrt(fdx * fdx + fdz * fdz);
          if (fdist < nearestFoodDist) {
            nearestFoodDist = fdist;
            targetFood = food;
          }
        }

        if (targetFood) {
          desiredAngle = Math.atan2(targetFood.z - bot.z, targetFood.x - bot.x);
        }

        // Avoid outer boundary
        const bDist = Math.sqrt(bot.x * bot.x + bot.z * bot.z);
        if (bDist > arenaRadius - 6) {
          desiredAngle = Math.atan2(-bot.z, -bot.x);
        }

        // Smoothly turn bot
        let bDiff = desiredAngle - bot.angle;
        while (bDiff > Math.PI) bDiff -= Math.PI * 2;
        while (bDiff < -Math.PI) bDiff += Math.PI * 2;
        bot.angle += bDiff * Math.min(1, 4 * dt);

        // Move Bot
        bot.x += Math.cos(bot.angle) * bot.speed * dt;
        bot.z += Math.sin(bot.angle) * bot.speed * dt;

        // Boundary Clamp
        if (bDist > arenaRadius - 2) {
          const nx = bot.x / bDist;
          const nz = bot.z / bDist;
          bot.x = nx * (arenaRadius - 2);
          bot.z = nz * (arenaRadius - 2);
        }

        // Update Bot History
        bot.history.unshift({ x: bot.x, z: bot.z });
        if (bot.history.length > (bot.length + 5) * 6) {
          bot.history.pop();
        }

        // Update Bot Head Mesh
        if (bot.headMesh) {
          bot.headMesh.position.set(bot.x, 0.6, bot.z);
          bot.headMesh.rotation.y = -bot.angle + Math.PI / 2;
        }

        // Update Bot Segments
        for (let s = 0; s < bot.segmentMeshes.length; s++) {
          const segMesh = bot.segmentMeshes[s];
          if (s < bot.length) {
            const histIdx = (s + 1) * segSpacing;
            if (histIdx < bot.history.length) {
              const pt = bot.history[histIdx];
              segMesh.position.set(pt.x, 0.6, pt.z);
              segMesh.visible = true;
            } else {
              segMesh.visible = false;
            }
          } else {
            segMesh.visible = false;
          }
        }

        // Bot eats food
        for (let fi = 0; fi < foods.length; fi++) {
          const food = foods[fi];
          const fdx = bot.x - food.x;
          const fdz = bot.z - food.z;
          if (Math.sqrt(fdx * fdx + fdz * fdz) < 1.6) {
            bot.length = Math.min(40, bot.length + 1);
            const newAng = Math.random() * Math.PI * 2;
            const newRad = Math.random() * (arenaRadius - 6);
            food.x = Math.cos(newAng) * newRad;
            food.z = Math.sin(newAng) * newRad;
            if (food.mesh) food.mesh.position.set(food.x, 0.6, food.z);
            break;
          }
        }

        // --- Collision Check 1: Player Head hits Bot Body -> Player Dies ---
        for (let s = 0; s < bot.length; s++) {
          const histIdx = (s + 1) * segSpacing;
          if (histIdx < bot.history.length) {
            const segPt = bot.history[histIdx];
            const cdx = player.x - segPt.x;
            const cdz = player.z - segPt.z;
            if (Math.sqrt(cdx * cdx + cdz * cdz) < 1.35) {
              // Player crashes into bot body!
              spawnExplosionParticles(player.x, player.z, 0x10b981, 24);
              triggerGameOver();
              return;
            }
          }
        }

        // --- Collision Check 2: Bot Head hits Player Body -> Bot Dies! ---
        for (let s = 2; s < player.length; s++) {
          const histIdx = (s + 1) * segSpacing;
          if (histIdx < player.history.length) {
            const segPt = player.history[histIdx];
            const bdx = bot.x - segPt.x;
            const bdz = bot.z - segPt.z;
            if (Math.sqrt(bdx * bdx + bdz * bdz) < 1.35) {
              // Bot dies!
              bot.isAlive = false;
              bot.respawnTimer = 4.0;
              if (bot.headMesh) bot.headMesh.visible = false;
              bot.segmentMeshes.forEach((sm) => (sm.visible = false));

              // Spawn particles & drops
              spawnExplosionParticles(bot.x, bot.z, bot.colorThree, 20);
              spawnDroppedFoods(bot.history.slice(0, (bot.length + 1) * segSpacing));

              // Player kill rewarded!
              stateRef.current.kills += 1;
              stateRef.current.score += 250;
              setKills(stateRef.current.kills);
              setScore(stateRef.current.score);

              setKillFeed(`${bot.name} 처치! (+250)`);
              setTimeout(() => setKillFeed(null), 2500);

              if (playSfx) playSfx('/sounds/crit.mp3');
              if (navigator.vibrate) navigator.vibrate([40, 30, 70]);
              break;
            }
          }
        }
      });

      // --- Update Particle FX ---
      for (let pIdx = stateRef.current.particles.length - 1; pIdx >= 0; pIdx--) {
        const p = stateRef.current.particles[pIdx];
        p.life -= dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 9.8 * dt; // gravity
        p.mesh.scale.multiplyScalar(0.95);

        if (p.life <= 0 || p.mesh.position.y < 0) {
          scene.remove(p.mesh);
          stateRef.current.particles.splice(pIdx, 1);
        }
      }

      // --- Leaderboard & Rank Update (every 0.5s) ---
      if (Math.floor(time / 500) !== Math.floor((time - dt * 1000) / 500)) {
        const allContestants = [
          { name: '플레이어 (나)', score: stateRef.current.score + player.length * 15, color: '#10b981', isPlayer: true },
          ...bots.map((b) => ({
            name: b.name,
            score: b.length * 20 + 50,
            color: b.colorHex,
            isPlayer: false,
          })),
        ].sort((a, b) => b.score - a.score);

        setLeaderboard(allContestants.slice(0, 5));
        const myIndex = allContestants.findIndex((c) => c.isPlayer);
        setMyRank(myIndex + 1);

        // Instant victory if top 1 and high score
        if (myIndex === 0 && stateRef.current.score >= 1200) {
          triggerVictory();
        }
      }

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // 10. Perfect Fullscreen ResizeObserver & Orientation Sync
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

      // Cleanup Three.js
      scene.clear();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, playerHeroId, playSfx, triggerGameOver, triggerVictory]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'IO-3D',
      title: isKo ? '스네이크 vs 웜스 3D' : 'Snake vs Worms 3D',
      description: isKo
        ? '3D 아레나에서 피자, 도넛, 발광 오브를 먹고 지렁이의 길이를 무한히 키우세요!'
        : 'Devour pizzas, donuts and glowing orbs in the 3D arena to grow your worm!',
      keyPoints: isKo
        ? ['다양한 음식 오브를 먹고 길이 성장', '경기장 외곽 벽 충돌 주의']
        : ['Eat food orbs to grow longer', 'Avoid arena boundary collision'],
    },
    {
      badge: 'KILL',
      title: isKo ? '헤드 충돌 킬 시스템' : 'Head Collision Kills',
      description: isKo
        ? '적 지렁이의 머리가 내 몸통에 닿으면 적이 폭발하며 대량의 먹이를 분출합니다. 반대로 내 머리가 적 몸에 닿으면 즉시 사망하니 조심하세요!'
        : "Trap rivals so their heads crash into your body! Beware: don't hit other worms' bodies with your head!",
      keyPoints: isKo
        ? ['적의 이동 경로를 몸통으로 차단', '처치 시 대량의 보너스 먹이 오브 획득']
        : ['Cut off enemies with your body', 'Devour glowing dropped orbs'],
    },
    {
      badge: 'BOOST',
      title: isKo ? '부스트 & 모바일 조작' : 'Boost & Mobile Controls',
      description: isKo
        ? '화면을 터치하면 나타나는 다이나믹 플로팅 조이스틱으로 조향하고, 우측 [⚡ 가속 BOOST] 버튼으로 급가속하여 적을 포위하세요!'
        : 'Use the dynamic floating joystick to steer and hold [⚡ BOOST] to accelerate and circle rivals!',
      keyPoints: isKo
        ? ['원하는 화면 지점 터치로 플로팅 조이스틱 생성', '우측 대형 80px 버튼 홀드로 부스트 가속']
        : ['Touch anywhere for dynamic joystick', 'Hold 80px button for rapid boost'],
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
          {/* Outer Ring */}
          <div className="w-24 h-24 rounded-full border-2 border-emerald-400/60 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
          </div>
          {/* Inner Knob */}
          <div
            className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 border-2 border-white shadow-lg flex items-center justify-center"
            style={{
              left: `calc(50% + ${joystickKnob.x - joystickCenter.x}px)`,
              top: `calc(50% + ${joystickKnob.y - joystickCenter.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-emerald-950/60" />
          </div>
        </div>
      )}

      {/* Top HUD: MinimalistMissionHUD with Quit Settlement */}
      <div className="relative z-20 pointer-events-auto">
        <MinimalistMissionHUD
          missionTitle={isKo ? '스네이크 vs 웜스 3D' : 'Snake vs Worms 3D'}
          currentScore={score}
          targetScore={1000}
          onExit={handleQuitWithSettlement}
          onShowRules={() => setShowTutorial(true)}
          stats={[
            { label: isKo ? '길이' : 'Length', value: `${wormLength}m` },
            { label: isKo ? '처치' : 'Kills', value: `${kills}` },
            { label: isKo ? '순위' : 'Rank', value: `#${myRank}` },
            { label: isKo ? '남은시간' : 'Time', value: `${timeLeft}s` },
          ]}
        />
      </div>

      {/* Kill Feed Notification */}
      {killFeed && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
          <div className="px-4 py-1.5 bg-amber-500/90 text-black font-black text-sm rounded-full shadow-lg border border-amber-300 flex items-center gap-1.5">
            <span>⚡</span>
            <span>{killFeed}</span>
          </div>
        </div>
      )}

      {/* Realtime Live Leaderboard (Top Right) */}
      <div className="absolute top-16 right-3 z-10 pointer-events-none hidden sm:block">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-md p-2.5 w-44 text-xs shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1.5 flex justify-between">
            <span>{isKo ? '순위표' : 'Leaderboard'}</span>
            <span>{isKo ? '점수' : 'Score'}</span>
          </div>
          <div className="space-y-1">
            {leaderboard.map((item, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center px-1.5 py-0.5 rounded text-[11px] ${
                  item.isPlayer ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-slate-500 w-3">{idx + 1}</span>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Pure Touch 80px [⚡ BOOST] Action Button */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
        <button
          type="button"
          aria-label="Boost Speed"
          className={`boost-button w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-75 select-none touch-manipulation cursor-pointer ${
            isBoosting
              ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 border-yellow-100 text-black scale-95 shadow-[0_0_24px_rgba(245,158,11,0.7)]'
              : 'bg-emerald-600/80 hover:bg-emerald-500 border-emerald-300/80 text-white shadow-xl active:scale-95'
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startBoost();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            stopBoost();
          }}
          onMouseDown={startBoost}
          onMouseUp={stopBoost}
          onMouseLeave={stopBoost}
        >
          <span className="text-2xl sm:text-3xl leading-none">⚡</span>
          <span className="text-[11px] font-black uppercase tracking-tighter mt-0.5">
            {isKo ? '가속 BOOST' : 'BOOST'}
          </span>
        </button>
      </div>

      {/* Exit & Settle Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 text-2xl font-bold">
              [?]
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '게임을 중단하시겠습니까?' : 'Exit Game?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '지금까지 성장시킨 지렁이의 길이와 처치 수에 비례한 SNS 포인트 보상이 안전하게 정산됩니다.'
                : 'Your reward will be calculated and deposited based on your worm length and kills.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmExitAndSettle}
                className="flex-1 py-2.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
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
              {isKo ? '지렁이 충돌 사망!' : 'Worm Crashed!'}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {isKo ? `최종 길이: ${wormLength}m | 처치 수: ${kills}` : `Final Length: ${wormLength}m | Kills: ${kills}`}
            </p>
            <button
              type="button"
              onClick={confirmExitAndSettle}
              className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
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
            localStorage.setItem('hero_tutorial_snake_vs_worms', 'true');
          } catch {}
        }}
        title={isKo ? '스네이크 vs 웜스 3D 가이드' : 'Snake vs Worms 3D Guide'}
        steps={tutorialSteps}
        storageKey="hero_tutorial_snake_vs_worms"
      />
    </div>
  );
};

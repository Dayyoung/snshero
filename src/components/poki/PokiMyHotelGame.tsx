import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMyHotelGameProps {
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

interface RoomData {
  id: number;
  center: THREE.Vector3;
  bedPos: THREE.Vector3;
  cashPos: THREE.Vector3;
  isUnlocked: boolean;
  unlockCost: number;
  isOccupied: boolean;
  isDirty: boolean;
  stayTimer: number;
  cleanProgress: number;
  roomGroup: THREE.Group;
  sheetMesh: THREE.Mesh;
  unlockTextGroup?: THREE.Group;
  cashStacks: { mesh: THREE.Mesh; value: number }[];
}

interface GuestData {
  id: number;
  group: THREE.Group;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  state: 'queue' | 'walking_to_room' | 'staying' | 'leaving';
  assignedRoomId: number | null;
  speed: number;
}

interface ParticleItem {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiMyHotelGame: React.FC<PokiMyHotelGameProps> = ({
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
  const playerHeroId = (cardId ? Number(cardId) : deck[0]?.id) || 12;
  const containerRef = useRef<HTMLDivElement>(null);

  // HUD & Game States
  const [cash, setCash] = useState<number>(60);
  const [servedGuests, setServedGuests] = useState<number>(0);
  const [cleanedRooms, setCleanedRooms] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(75);
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
      return localStorage.getItem('hero_tutorial_my_hotel') !== 'true';
    } catch {
      return true;
    }
  });

  const gameStateRef = useRef({
    cash: 60,
    servedGuests: 0,
    cleanedRooms: 0,
    isGameOver: false,
    isVictory: false,
    boostTimer: 0,
    guestSpawnTimer: 1.5,
  });

  const playerRef = useRef({
    pos: new THREE.Vector3(0, 0.8, 3),
    vel: new THREE.Vector3(0, 0, 0),
    moveInput: { x: 0, z: 0 },
    facingAngle: 0,
    baseSpeed: 7.2,
    isCleaning: false,
  });

  const touchControlRef = useRef({
    touchId: null as number | null,
    startX: 0,
    startY: 0,
  });

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    rooms: RoomData[];
    guests: GuestData[];
    particles: ParticleItem[];
    checkinZoneMesh: THREE.Mesh;
    coffeeMesh: THREE.Mesh;
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

    const finalCash = gameStateRef.current.cash;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimyhotel',
      gameTitle: isKo ? '마이 퍼펙트 호텔 3D' : 'My Perfect Hotel 3D',
      durationSeconds: Math.max(1, 75 - timeLeft),
      score: finalCash,
      maxTargetScore: 500,
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
    const finalCash = gameStateRef.current.cash;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimyhotel',
      gameTitle: isKo ? '마이 퍼펙트 호텔 3D' : 'My Perfect Hotel 3D',
      durationSeconds: Math.max(1, 75 - timeLeft),
      score: finalCash,
      maxTargetScore: 500,
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

  // Rush Boost
  const handleRushBoost = useCallback(() => {
    gameStateRef.current.boostTimer = 4.0;
    triggerHaptic([20, 20]);
    if (playSfx) playSfx('/sfx/boost.mp3');
  }, [lowSpecMode, playerHeroId]);

  // Main Three.js Engine Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181412);
    scene.fog = new THREE.FogExp2(0x181412, 0.015);

    // 2. Camera: Isometric 3D Quarter View
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 150);
    camera.position.set(0, 24, 22);
    camera.lookAt(0, 1.2, 0);

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
    const ambientLight = new THREE.AmbientLight(0xffedd5, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(16, 28, 16);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // 5. Hotel Lobby Floor & Carpet
    const floorGeo = new THREE.PlaneGeometry(28, 22);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723, // Warm wood parquet
      roughness: 0.5,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // Red Velvet Carpet Runner down center
    const carpetGeo = new THREE.PlaneGeometry(4.2, 18);
    const carpetMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.02, 1);
    carpet.receiveShadow = !lowSpecMode;
    scene.add(carpet);

    // Low Cutaway Hotel Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.7 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(28, 4, 0.6), wallMat);
    backWall.position.set(0, 2, -10.5);
    scene.add(backWall);

    // 6. Reception Check-in Desk
    const deskGroup = new THREE.Group();
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 1.3, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.3 })
    );
    counter.position.y = 0.65;
    counter.castShadow = !lowSpecMode;
    deskGroup.add(counter);

    // Marble top
    const marbleTop = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 0.15, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.2 })
    );
    marbleTop.position.y = 1.35;
    deskGroup.add(marbleTop);

    // Bellboy Golden Bell
    const bell = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 })
    );
    bell.position.set(0, 1.5, 0);
    deskGroup.add(bell);

    deskGroup.position.set(0, 0, 5.5);
    scene.add(deskGroup);

    // Check-in Interaction Zone Ring
    const zoneGeo = new THREE.RingGeometry(1.2, 1.6, 24);
    const zoneMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const checkinZoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    checkinZoneMesh.rotation.x = -Math.PI / 2;
    checkinZoneMesh.position.set(0, 0.03, 3.8);
    scene.add(checkinZoneMesh);

    // Coffee Rush Station
    const coffeeGroup = new THREE.Group();
    const coffeeTable = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    coffeeTable.position.y = 0.4;
    coffeeGroup.add(coffeeTable);
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xf97316 })
    );
    cup.position.y = 0.95;
    coffeeGroup.add(cup);
    coffeeGroup.position.set(0, 0, 0);
    scene.add(coffeeGroup);

    // 7. Hotel Rooms (Room 1, 2, 3, 4)
    const rooms: RoomData[] = [];

    const createRoom = (
      id: number,
      centerX: number,
      centerZ: number,
      isUnlocked: boolean,
      unlockCost: number
    ) => {
      const roomGroup = new THREE.Group();

      // Room Tile Floor Border
      const rFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 7),
        new THREE.MeshStandardMaterial({
          color: isUnlocked ? 0x292524 : 0x1c1917,
          roughness: 0.6,
        })
      );
      rFloor.rotation.x = -Math.PI / 2;
      rFloor.position.y = 0.01;
      roomGroup.add(rFloor);

      // Luxury Bed
      const bedGroup = new THREE.Group();
      // Wooden Bed Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.5, 4.0),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 })
      );
      frame.position.y = 0.25;
      frame.castShadow = !lowSpecMode;
      bedGroup.add(frame);

      // Mattress & Blanket Sheet
      const sheet = new THREE.Mesh(
        new THREE.BoxGeometry(2.9, 0.4, 3.7),
        new THREE.MeshStandardMaterial({
          color: 0x0284c7, // Clean blue sheet
          roughness: 0.5,
        })
      );
      sheet.position.y = 0.6;
      bedGroup.add(sheet);

      // Pillows (2)
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.7), pillowMat);
      p1.position.set(-0.7, 0.85, -1.3);
      bedGroup.add(p1);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.7), pillowMat);
      p2.position.set(0.7, 0.85, -1.3);
      bedGroup.add(p2);

      bedGroup.position.set(0, 0, 0);
      roomGroup.add(bedGroup);

      // Side Table & Lamp
      const nightstand = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.7, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x451a03 })
      );
      nightstand.position.set(-2.2, 0.35, -1.3);
      roomGroup.add(nightstand);
      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 0.5, 12),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.5 })
      );
      lamp.position.set(-2.2, 0.95, -1.3);
      roomGroup.add(lamp);

      roomGroup.position.set(centerX, 0, centerZ);
      scene.add(roomGroup);

      const bedWorldPos = new THREE.Vector3(centerX, 0.8, centerZ);
      const cashWorldPos = new THREE.Vector3(centerX + 2.0, 0.2, centerZ);

      rooms.push({
        id,
        center: new THREE.Vector3(centerX, 0, centerZ),
        bedPos: bedWorldPos,
        cashPos: cashWorldPos,
        isUnlocked,
        unlockCost,
        isOccupied: false,
        isDirty: false,
        stayTimer: 0,
        cleanProgress: 100,
        roomGroup,
        sheetMesh: sheet,
        cashStacks: [],
      });
    };

    // Room 1 & 2 (Initial Unlocked)
    createRoom(1, -7.5, -2.5, true, 0);
    createRoom(2, 7.5, -2.5, true, 0);

    // Room 3 & 4 (Locked Expansions)
    createRoom(3, -7.5, -7.5, false, 120);
    createRoom(4, 7.5, -7.5, false, 250);

    // 8. Player Avatar (Hotel Manager)
    const playerGroup = new THREE.Group();

    // Torso with Hero badge
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

    const torsoGeo = new THREE.BoxGeometry(0.9, 1.1, 0.5);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Navy Suit
      map: badgeTexture,
      roughness: 0.4,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 0.55;
    torsoMesh.castShadow = !lowSpecMode;
    playerGroup.add(torsoMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.3 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.45;
    headMesh.castShadow = !lowSpecMode;
    playerGroup.add(headMesh);

    // Limbs
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
    const armGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const legGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);

    const leftArm = new THREE.Mesh(armGeo, limbMat);
    leftArm.position.set(-0.65, 0.5, 0);
    playerGroup.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, limbMat);
    rightArm.position.set(0.65, 0.5, 0);
    playerGroup.add(rightArm);

    const leftLeg = new THREE.Mesh(legGeo, limbMat);
    leftLeg.position.set(-0.25, -0.4, 0);
    playerGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, limbMat);
    rightLeg.position.set(0.25, -0.4, 0);
    playerGroup.add(rightLeg);

    playerGroup.position.copy(playerRef.current.pos);
    scene.add(playerGroup);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      playerGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      rooms,
      guests: [],
      particles: [],
      checkinZoneMesh,
      coffeeMesh: cup,
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

    // 10. Keyboard Listeners
    const keyMap = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false, a: false, d: false };
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keyMap.hasOwnProperty(k) || keyMap.hasOwnProperty(e.key)) {
        keyMap[k as keyof typeof keyMap] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keyMap.hasOwnProperty(k) || keyMap.hasOwnProperty(e.key)) {
        keyMap[k as keyof typeof keyMap] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 11. Helper: Spawn Guest
    const spawnGuest = () => {
      const gGroup = new THREE.Group();
      const gBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.0, 0.45),
        new THREE.MeshStandardMaterial({
          color: Math.random() < 0.5 ? 0xef4444 : 0x10b981,
        })
      );
      gBody.position.y = 0.5;
      gGroup.add(gBody);

      const gHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfde047 })
      );
      gHead.position.y = 1.35;
      gGroup.add(gHead);

      // Suitcase
      const bag = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.5, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      bag.position.set(0.65, 0.3, 0);
      gGroup.add(bag);

      const spawnPos = new THREE.Vector3(0, 0, 11);
      gGroup.position.copy(spawnPos);
      scene.add(gGroup);

      const sc = sceneRef.current;
      if (sc) {
        const queueIdx = sc.guests.filter(g => g.state === 'queue').length;
        const targetPos = new THREE.Vector3(0, 0, 7.5 + queueIdx * 1.5);
        sc.guests.push({
          id: Date.now() + Math.random(),
          group: gGroup,
          pos: spawnPos,
          targetPos,
          state: 'queue',
          assignedRoomId: null,
          speed: 4.5,
        });
      }
    };

    // Helper: Spawn Cash Stack
    const spawnCash = (pos: THREE.Vector3, room: RoomData) => {
      const cGeo = new THREE.BoxGeometry(0.8, 0.3, 0.5);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e, // Cash Green
        roughness: 0.3,
      });
      const cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set(pos.x, 0.15, pos.z);
      scene.add(cMesh);
      room.cashStacks.push({ mesh: cMesh, value: 40 });
    };

    // Helper: Spawn Sparkles
    const spawnSparkles = (pos: THREE.Vector3) => {
      const sc = sceneRef.current;
      if (!sc) return;
      for (let i = 0; i < (lowSpecMode ? 6 : 14); i++) {
        const sp = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.15, 0),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        sp.position.copy(pos);
        sc.scene.add(sp);
        sc.particles.push({
          mesh: sp,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 5 + 2,
          vz: (Math.random() - 0.5) * 6,
          life: 0,
          maxLife: 0.5,
        });
      }
    };

    // 12. Main Animation Loop
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

      // Guest Spawning
      gs.guestSpawnTimer -= dt;
      if (gs.guestSpawnTimer <= 0 && sc.guests.filter(g => g.state === 'queue').length < 4) {
        spawnGuest();
        gs.guestSpawnTimer = 3.5;
      }

      // Boost Timer
      let currentSpeed = pl.baseSpeed;
      if (gs.boostTimer > 0) {
        gs.boostTimer -= dt;
        currentSpeed *= 1.7;
      }

      // Checkin Zone Ring Pulse
      sc.checkinZoneMesh.rotation.z += dt * 2.0;

      // Player Movement: Screen-Relative Standard
      // Screen Right = +X, Screen Left = -X, Screen Forward = -Z, Screen Backward = +Z
      let moveX = 0;
      let moveZ = 0;

      if (keyMap['a'] || keyMap['ArrowLeft']) moveX -= 1;
      if (keyMap['d'] || keyMap['ArrowRight']) moveX += 1;
      if (keyMap['w'] || keyMap['ArrowUp']) moveZ -= 1;
      if (keyMap['s'] || keyMap['ArrowDown']) moveZ += 1;

      moveX += pl.moveInput.x;
      moveZ += pl.moveInput.z;

      const moveLen = Math.hypot(moveX, moveZ);
      if (moveLen > 0.05) {
        const normX = (moveX / Math.max(1, moveLen)) * currentSpeed;
        const normZ = (moveZ / Math.max(1, moveLen)) * currentSpeed;

        pl.vel.x = THREE.MathUtils.lerp(pl.vel.x, normX, 0.3);
        pl.vel.z = THREE.MathUtils.lerp(pl.vel.z, normZ, 0.3);

        pl.facingAngle = Math.atan2(normX, normZ);
      } else {
        pl.vel.x = THREE.MathUtils.lerp(pl.vel.x, 0, 0.25);
        pl.vel.z = THREE.MathUtils.lerp(pl.vel.z, 0, 0.25);
      }

      pl.pos.x = THREE.MathUtils.clamp(pl.pos.x + pl.vel.x * dt, -12.5, 12.5);
      pl.pos.z = THREE.MathUtils.clamp(pl.pos.z + pl.vel.z * dt, -9.5, 9.5);

      // Player Avatar Transform
      sc.playerGroup.position.set(pl.pos.x, 0, pl.pos.z);
      sc.playerGroup.rotation.y = pl.facingAngle;

      // Limbs Walk Animation
      const isMoving = Math.hypot(pl.vel.x, pl.vel.z) > 0.5;
      if (isMoving) {
        const walkCycle = currentTime * 0.015 * (gs.boostTimer > 0 ? 1.5 : 1.0);
        sc.leftLeg.rotation.x = Math.sin(walkCycle) * 0.6;
        sc.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.6;
        sc.leftArm.rotation.x = -Math.sin(walkCycle) * 0.5;
        sc.rightArm.rotation.x = Math.sin(walkCycle) * 0.5;
      } else {
        sc.leftLeg.rotation.x = 0;
        sc.rightLeg.rotation.x = 0;
        sc.leftArm.rotation.x = 0;
        sc.rightArm.rotation.x = 0;
      }

      // Coffee Bar Zone Collision -> Speed Boost
      if (pl.pos.distanceTo(new THREE.Vector3(0, 0, 0)) < 1.8 && gs.boostTimer <= 0) {
        handleRushBoost();
      }

      // Checkin Reception Desk Interaction
      const distToCheckin = pl.pos.distanceTo(new THREE.Vector3(0, 0, 4.0));
      if (distToCheckin < 2.2) {
        const queueGuest = sc.guests.find(g => g.state === 'queue');
        if (queueGuest) {
          // Find available clean room
          const availableRoom = sc.rooms.find(r => r.isUnlocked && !r.isOccupied && !r.isDirty);
          if (availableRoom) {
            availableRoom.isOccupied = true;
            availableRoom.stayTimer = 4.5;
            queueGuest.assignedRoomId = availableRoom.id;
            queueGuest.state = 'walking_to_room';
            queueGuest.targetPos = availableRoom.bedPos.clone();

            gs.servedGuests += 1;
            setServedGuests(gs.servedGuests);
            triggerHaptic(25);
            if (playSfx) playSfx('/sfx/bell.mp3');

            // Re-order remaining queue
            const remaining = sc.guests.filter(g => g.state === 'queue' && g.id !== queueGuest.id);
            remaining.forEach((g, idx) => {
              g.targetPos.set(0, 0, 7.5 + idx * 1.5);
            });
          }
        }
      }

      // Rooms Logic (Stay, Dirty, Clean, Cash Pickup, Unlock)
      sc.rooms.forEach(r => {
        // Locked Room Unlock Interaction
        if (!r.isUnlocked) {
          const distToRoom = pl.pos.distanceTo(r.center);
          if (distToRoom < 3.2 && gs.cash >= r.unlockCost) {
            gs.cash -= r.unlockCost;
            r.isUnlocked = true;
            setCash(gs.cash);
            triggerHaptic([40, 20, 50]);
            if (playSfx) playSfx('/sfx/upgrade.mp3');
            spawnSparkles(r.center);

            // Turn on room floor color
            (r.roomGroup.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
              color: 0x334155,
              roughness: 0.5,
            });
          }
          return;
        }

        // Room Occupied & Stay Countdown
        if (r.isOccupied && r.stayTimer > 0) {
          r.stayTimer -= dt;
          if (r.stayTimer <= 0) {
            // Guest checkout!
            r.isOccupied = false;
            r.isDirty = true;
            r.cleanProgress = 0;
            (r.sheetMesh.material as THREE.MeshStandardMaterial).color.setHex(0x71717a); // Dirty grey sheet

            // Drop Cash Stack
            spawnCash(r.cashPos, r);
            triggerHaptic(15);

            // Find guest in this room and set to leave
            const guestInRoom = sc.guests.find(g => g.assignedRoomId === r.id);
            if (guestInRoom) {
              guestInRoom.state = 'leaving';
              guestInRoom.targetPos.set(0, 0, 12);
            }
          }
        }

        // Cleaning Interaction
        if (r.isDirty && !r.isOccupied) {
          const distToBed = pl.pos.distanceTo(r.bedPos);
          if (distToBed < 2.5) {
            r.cleanProgress += dt * 90; // Clean in ~1.1s
            if (Math.random() < 0.3) spawnSparkles(r.bedPos);

            if (r.cleanProgress >= 100) {
              r.isDirty = false;
              (r.sheetMesh.material as THREE.MeshStandardMaterial).color.setHex(0x0284c7); // Fresh blue sheet
              gs.cleanedRooms += 1;
              gs.cash += 25; // Cleaning bonus
              setCash(gs.cash);
              setCleanedRooms(gs.cleanedRooms);
              triggerHaptic([20, 30]);
              if (playSfx) playSfx('/sfx/clean.mp3');
            }
          }
        }

        // Cash Stacks Pickup
        for (let i = r.cashStacks.length - 1; i >= 0; i--) {
          const cs = r.cashStacks[i];
          if (pl.pos.distanceTo(cs.mesh.position) < 2.0) {
            gs.cash += cs.value;
            setCash(gs.cash);
            sc.scene.remove(cs.mesh);
            cs.mesh.geometry.dispose();
            r.cashStacks.splice(i, 1);
            triggerHaptic(15);
            if (playSfx) playSfx('/sfx/coin.mp3');

            // Victory check ($500 goal)
            if (gs.cash >= 500 && !gs.isGameOver) {
              handleGameOver(true);
            }
          }
        }
      });

      // Guests Movement Update
      for (let i = sc.guests.length - 1; i >= 0; i--) {
        const g = sc.guests[i];
        const dir = new THREE.Vector3().subVectors(g.targetPos, g.pos);
        const dist = dir.length();

        if (dist > 0.1) {
          dir.normalize();
          g.pos.addScaledVector(dir, g.speed * dt);
          g.group.position.copy(g.pos);
          g.group.rotation.y = Math.atan2(dir.x, dir.z);
        } else if (g.state === 'leaving') {
          // Exited hotel -> remove
          sc.scene.remove(g.group);
          sc.guests.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = sc.particles.length - 1; i >= 0; i--) {
        const p = sc.particles[i];
        p.life += dt;
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
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX < window.innerWidth * 0.65 && touchControlRef.current.touchId === null) {
        touchControlRef.current.touchId = touch.identifier;
        touchControlRef.current.startX = touch.clientX;
        touchControlRef.current.startY = touch.clientY;

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
        const dx = touch.clientX - touchControlRef.current.startX;
        const dy = touch.clientY - touchControlRef.current.startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 45;

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const knobX = touchControlRef.current.startX + Math.cos(angle) * clampedDist;
        const knobY = touchControlRef.current.startY + Math.sin(angle) * clampedDist;

        setKnobPos({ x: knobX, y: knobY });

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

  // 75s Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(gameStateRef.current.cash >= 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleGameOver, isGameOver, isVictory, showTutorial]);

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '호텔 로비 체크인' : 'Reception Check-in',
      badge: isKo ? '체크인' : 'Check-in',
      description: isKo
        ? '체크인 데스크 앞에 서서 대기 중인 손님들을 맞이하고 빈 방으로 안내하세요!'
        : 'Stand at the reception desk to check in waiting guests and guide them to clean rooms!',
      keyPoints: isKo
        ? ['좌측 조이스틱으로 이동', '데스크 앞에 서면 자동 체크인', '손님이 방으로 이동']
        : ['Move with joystick', 'Stand near desk to check in', 'Guests walk to rooms'],
      iconType: 'GESTURES',
    },
    {
      title: isKo ? '침대 청소 & 현금 수거' : 'Room Cleaning & Cash',
      badge: isKo ? '경영' : 'Manage',
      description: isKo
        ? '손님이 퇴실하면 침대 옆에 현금 뭉치가 떨어집니다. 현금을 줍고 더러워진 침대를 청소하세요!'
        : 'Guests drop cash stacks upon checkout. Collect the cash and clean the dirty bed sheets!',
      keyPoints: isKo
        ? ['초록 지폐 뭉치 밟아 수거', '침대 옆에 서서 청소 게이지 채우기', '청소 시 추가 보너스']
        : ['Walk over cash to collect', 'Stand near bed to clean', 'Earn bonus cash'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '호텔 객실 확장 & 부스트' : 'Expand & Rush',
      badge: isKo ? '확장' : 'Expand',
      description: isKo
        ? '모은 현금으로 잠긴 3호실, 4호실을 해금하고, 하단 [⚡ RUSH] 버튼으로 빠르게 호텔을 질주하세요!'
        : 'Unlock Room 3 & 4 with cash, and tap [⚡ RUSH] button to sprint across the lobby!',
      keyPoints: isKo
        ? ['Room 3($120), Room 4($250) 해금', '[⚡ RUSH] 버튼으로 이동속도 가속', '$500 달성 시 승리']
        : ['Unlock Room 3 & 4', 'Tap [⚡ RUSH] to sprint', 'Reach $500 to win!'],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-stone-900 flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js 3D Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle={isKo ? '마이 퍼펙트 호텔 3D' : 'My Perfect Hotel 3D'}
        onBack={handleBackRequest}
        score={cash}
        maxScore={500}
        timerSec={timeLeft}
        stats={[
          { label: isKo ? '호텔수익' : 'CASH', value: `$${cash}` },
          { label: isKo ? '체크인' : 'GUESTS', value: `${servedGuests}명` },
          { label: isKo ? '청소완료' : 'CLEANED', value: `${cleanedRooms}실` },
        ]}
      />

      {/* Dynamic Floating Touch Joystick Visual */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${joystickPos.x}px`, top: `${joystickPos.y}px` }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-white/60 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg" />
          <div
            className="absolute w-12 h-12 rounded-full bg-white/90 shadow-md border border-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(${knobPos.x - joystickPos.x - 24}px, ${knobPos.y - joystickPos.y - 24}px)`,
            }}
          />
        </div>
      )}

      {/* Mobile Pure Touch: 80px Jumbo Rush Button */}
      <div className="absolute bottom-8 right-8 z-40 pointer-events-auto">
        <button
          onClick={e => {
            e.stopPropagation();
            handleRushBoost();
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 border-2 border-white/90 text-white font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-2xl transition-transform"
          title="Sprint Rush"
        >
          <span className="text-2xl leading-none">⚡</span>
          <span className="text-[11px] font-extrabold tracking-wide mt-0.5">RUSH</span>
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
              {isKo ? '호텔 운영을 중단하시겠습니까?' : 'Exit Hotel Management?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '현재까지 벌어들인 호텔 수익($)과 손님 체크인 실적에 비례하여 공정한 SNS 포인트가 안전하게 정산 지급됩니다.'
                : 'Your reward will be calculated and deposited based on your hotel cash and guests served.'}
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
              localStorage.setItem('hero_tutorial_my_hotel', 'true');
            } catch {
              // ignore
            }
          }}
        />
      )}
    </div>
  );
};

export default PokiMyHotelGame;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiHideAndPaintGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ZoneColor {
  id: string;
  nameKo: string;
  nameEn: string;
  colorHex: string;
  colorThree: number;
}

const COLOR_ZONES: ZoneColor[] = [
  { id: 'blue', nameKo: '코발트 블루', nameEn: 'Cobalt Blue', colorHex: '#2563eb', colorThree: 0x2563eb },
  { id: 'red', nameKo: '크림슨 레드', nameEn: 'Crimson Red', colorHex: '#dc2626', colorThree: 0xdc2626 },
  { id: 'green', nameKo: '에메랄드 그린', nameEn: 'Emerald Green', colorHex: '#16a34a', colorThree: 0x16a34a },
  { id: 'yellow', nameKo: '앰버 옐로우', nameEn: 'Amber Yellow', colorHex: '#d97706', colorThree: 0xd97706 },
  { id: 'purple', nameKo: '네온 바이올렛', nameEn: 'Neon Purple', colorHex: '#9333ea', colorThree: 0x9333ea },
];

export const PokiHideAndPaintGame: React.FC<PokiHideAndPaintGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 2;
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [stage, setStage] = useState<number>(1);
  const totalStages = 3;
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [lives, setLives] = useState<number>(3);
  const [camouflagePct, setCamouflagePct] = useState<number>(0);
  const [hunterAlertPct, setHunterAlertPct] = useState<number>(0);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_hide_and_paint_v2') !== 'true';
    } catch {
      return true;
    }
  });

  // Three.js instances and refs
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    playerGroup: THREE.Group | null;
    playerBodyMesh: THREE.Mesh | null;
    hunterGroups: THREE.Group[];
    visionCones: THREE.Mesh[];
    bulletMeshes: THREE.Mesh[];
  }>({
    renderer: null,
    scene: null,
    camera: null,
    playerGroup: null,
    playerBodyMesh: null,
    hunterGroups: [],
    visionCones: [],
    bulletMeshes: [],
  });

  // Gameplay physics state
  const stateRef = useRef({
    player: {
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      speed: 0.12,
      currentColor: 0xffffff,
      targetColor: 0xffffff,
      isFrozen: false,
      invulnerableTimer: 0,
    },
    hunters: [] as Array<{
      x: number;
      z: number;
      angle: number;
      targetAngle: number;
      speed: number;
      patrolTimer: number;
      alert: number;
      shootCooldown: number;
    }>,
    bullets: [] as Array<{
      x: number;
      z: number;
      vx: number;
      vz: number;
      life: number;
    }>,
    touch: {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    },
    keys: {
      up: false,
      down: false,
      left: false,
      right: false,
    },
    closestZone: COLOR_ZONES[0],
    camouflage: 0,
    maxHunterAlert: 0,
  });

  // 1. Initialize Stage
  const initStage = useCallback((stageNum: number) => {
    const s = stateRef.current;
    s.player.x = 0;
    s.player.z = 0;
    s.player.vx = 0;
    s.player.vz = 0;
    s.player.currentColor = 0xffffff;
    s.player.targetColor = 0xffffff;
    s.player.isFrozen = false;
    s.player.invulnerableTimer = 0;
    setIsFrozen(false);

    // Setup Hunters
    const hunterCount = stageNum === 1 ? 1 : (stageNum === 2 ? 1 : 2);
    s.hunters = [];
    for (let i = 0; i < hunterCount; i++) {
      const angle = (i * Math.PI) + Math.PI / 4;
      const dist = 7;
      s.hunters.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        angle: angle + Math.PI,
        targetAngle: angle + Math.PI,
        speed: 0.05 + stageNum * 0.015,
        patrolTimer: 0,
        alert: 0,
        shootCooldown: 0,
      });
    }

    s.bullets = [];
    setTimeLeft(35 + stageNum * 5);
  }, []);

  // 2. Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Deep slate
    scene.fog = new THREE.FogExp2(0x0f172a, 0.025);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 15, 13);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = !lowSpecMode;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Room Geometry (Size: 22 x 22, Height: 4)
    const roomSize = 22;
    const halfSize = roomSize / 2;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // Floor Grid Line Accent
    const gridHelper = new THREE.GridHelper(roomSize, 22, 0x334155, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 4 Wall Zones (North: Blue, East: Red, South: Green, West: Yellow, Center Corners: Purple)
    const wallHeight = 3.5;
    const wallThick = 0.8;

    const createWallSection = (w: number, d: number, x: number, z: number, color: number) => {
      const wallGeo = new THREE.BoxGeometry(w, wallHeight, d);
      const wallMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.2,
      });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(x, wallHeight / 2, z);
      wall.castShadow = !lowSpecMode;
      wall.receiveShadow = !lowSpecMode;
      scene.add(wall);
      return wall;
    };

    // North Wall (Blue)
    createWallSection(roomSize, wallThick, 0, -halfSize, 0x2563eb);
    // East Wall (Red)
    createWallSection(wallThick, roomSize, halfSize, 0, 0xdc2626);
    // South Wall (Green)
    createWallSection(roomSize, wallThick, 0, halfSize, 0x16a34a);
    // West Wall (Yellow)
    createWallSection(wallThick, roomSize, -halfSize, 0, 0xd97706);

    // Interior Furniture & Props for Hiding
    const createProp = (geo: THREE.BufferGeometry, color: number, x: number, z: number, rotY = 0) => {
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = rotY;
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);
    };

    // Blue Zone Props (North)
    createProp(new THREE.BoxGeometry(4, 2, 1.5), 0x1e40af, -4, -8); // Blue Sofa
    createProp(new THREE.BoxGeometry(2, 3, 1), 0x3b82f6, 5, -8.5); // Blue Bookcase

    // Red Zone Props (East)
    createProp(new THREE.BoxGeometry(2, 2, 2), 0xb91c1c, 8, -4); // Red Crate
    createProp(new THREE.BoxGeometry(2.5, 1.5, 2.5), 0xef4444, 8, 4); // Red Platform

    // Green Zone Props (South)
    createProp(new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16), 0x15803d, -5, 8); // Green Planter
    createProp(new THREE.BoxGeometry(3, 1.8, 1.8), 0x22c55e, 4, 7.5); // Green Bench

    // Yellow Zone Props (West)
    createProp(new THREE.BoxGeometry(2, 2.8, 2), 0xb45309, -8, -3); // Yellow Locker
    createProp(new THREE.BoxGeometry(2.5, 1.2, 3.5), 0xf59e0b, -7.5, 5); // Yellow Counter

    // Center Purple Pillars (Purple Zone)
    createProp(new THREE.BoxGeometry(1.8, 3.5, 1.8), 0x7e22ce, -3.5, -3.5);
    createProp(new THREE.BoxGeometry(1.8, 3.5, 1.8), 0x9333ea, 3.5, 3.5);

    // Player 3D Group (Chameleon Mannequin)
    const playerGroup = new THREE.Group();
    // Body
    const pBodyGeo = new THREE.CapsuleGeometry(0.5, 0.8, 8, 16);
    const pBodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
    });
    const playerBodyMesh = new THREE.Mesh(pBodyGeo, pBodyMat);
    playerBodyMesh.position.y = 0.9;
    playerBodyMesh.castShadow = !lowSpecMode;
    playerGroup.add(playerBodyMesh);

    // Head
    const pHeadGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const pHead = new THREE.Mesh(pHeadGeo, pBodyMat);
    pHead.position.y = 1.7;
    pHead.castShadow = !lowSpecMode;
    playerGroup.add(pHead);

    // Card Hero Badge Canvas Sprite
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 128;
    heroCanvas.height = 128;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      heroCtx.fillStyle = '#0f172a';
      heroCtx.beginPath();
      heroCtx.arc(64, 64, 60, 0, Math.PI * 2);
      heroCtx.fill();
      heroCtx.lineWidth = 6;
      heroCtx.strokeStyle = '#38bdf8';
      heroCtx.stroke();
      drawCardSprite(heroCtx, playerHeroId, 16, 16, 96, 96);
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    const heroSpriteMat = new THREE.SpriteMaterial({ map: heroTexture });
    const heroSprite = new THREE.Sprite(heroSpriteMat);
    heroSprite.position.set(0, 2.5, 0);
    heroSprite.scale.set(1.2, 1.2, 1.2);
    playerGroup.add(heroSprite);

    scene.add(playerGroup);

    // Hunters Setup
    const hunterGroups: THREE.Group[] = [];
    const visionCones: THREE.Mesh[] = [];

    const createHunterMesh = () => {
      const hGroup = new THREE.Group();
      // Body (Black Seeker Armor)
      const hBodyMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.3, metalness: 0.8 });
      const hBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 1.0, 8, 16), hBodyMat);
      hBody.position.y = 1.1;
      hBody.castShadow = !lowSpecMode;
      hGroup.add(hBody);

      // Visor (Glowing Red Eye)
      const visorMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.3), visorMat);
      visor.position.set(0, 1.8, 0.4);
      hGroup.add(visor);

      // Paint Gun
      const gunMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
      const gun = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.9), gunMat);
      gun.position.set(0.6, 1.1, 0.5);
      hGroup.add(gun);

      // Vision Spotlight Cone (Semi-transparent)
      const coneGeo = new THREE.ConeGeometry(3.5, 8, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.x = Math.PI / 2;
      cone.position.set(0, 1.0, 4.0);
      hGroup.add(cone);
      visionCones.push(cone);

      scene.add(hGroup);
      hunterGroups.push(hGroup);
      return hGroup;
    };

    // Pre-create 2 hunter instances
    createHunterMesh();
    createHunterMesh();

    threeRef.current = {
      renderer,
      scene,
      camera,
      playerGroup,
      playerBodyMesh,
      hunterGroups,
      visionCones,
      bulletMeshes: [],
    };

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    initStage(1);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, playerHeroId, initStage]);

  // 3. Paint Chameleon Action (Color Morphing to Closest Zone)
  const handlePaint = useCallback(() => {
    if (isGameOver || isVictory) return;
    const s = stateRef.current;
    s.player.targetColor = s.closestZone.colorThree;
    playSfx?.('sounds/paint.mp3');
  }, [isGameOver, isVictory, playSfx]);

  // 4. Freeze Action Toggle
  const handleToggleFreeze = useCallback(() => {
    if (isGameOver || isVictory) return;
    const s = stateRef.current;
    s.player.isFrozen = !s.player.isFrozen;
    setIsFrozen(s.player.isFrozen);
    playSfx?.('sounds/click.mp3');
  }, [isGameOver, isVictory, playSfx]);

  // 5. Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const { renderer, scene, camera, playerGroup, playerBodyMesh, hunterGroups, visionCones } = threeRef.current;
      const s = stateRef.current;

      if (renderer && scene && camera && playerGroup && !isGameOver && !isVictory) {
        // Player Movement Logic
        let moveX = 0;
        let moveZ = 0;

        if (!s.player.isFrozen) {
          if (s.keys.up) moveZ -= 1;
          if (s.keys.down) moveZ += 1;
          if (s.keys.left) moveX -= 1;
          if (s.keys.right) moveX += 1;

          if (s.touch.active) {
            const dx = s.touch.currentX - s.touch.startX;
            const dy = s.touch.currentY - s.touch.startY;
            const dist = Math.hypot(dx, dy);
            if (dist > 10) {
              moveX = dx / Math.max(dist, 50);
              moveZ = dy / Math.max(dist, 50);
            }
          }

          // Apply velocity with smooth damping
          s.player.vx = THREE.MathUtils.lerp(s.player.vx, moveX * s.player.speed, 0.2);
          s.player.vz = THREE.MathUtils.lerp(s.player.vz, moveZ * s.player.speed, 0.2);
          s.player.x += s.player.vx;
          s.player.z += s.player.vz;

          // Boundary clamp (Room walls)
          const limit = 9.8;
          s.player.x = THREE.MathUtils.clamp(s.player.x, -limit, limit);
          s.player.z = THREE.MathUtils.clamp(s.player.z, -limit, limit);

          if (Math.hypot(moveX, moveZ) > 0.1) {
            const heading = Math.atan2(moveX, moveZ);
            playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, heading, 0.2);
          }
        } else {
          s.player.vx = 0;
          s.player.vz = 0;
        }

        playerGroup.position.x = s.player.x;
        playerGroup.position.z = s.player.z;

        // Smooth Color Interpolation for Player Chameleon
        if (s.player.currentColor !== s.player.targetColor && playerBodyMesh) {
          const curC = new THREE.Color(s.player.currentColor);
          const tgtC = new THREE.Color(s.player.targetColor);
          curC.lerp(tgtC, 0.1);
          s.player.currentColor = curC.getHex();
          (playerBodyMesh.material as THREE.MeshStandardMaterial).color.copy(curC);
        }

        // Determine Closest Color Zone
        const px = s.player.x;
        const pz = s.player.z;
        let bestZone = COLOR_ZONES[0];

        if (pz < -4) {
          bestZone = COLOR_ZONES[0]; // Blue
        } else if (px > 4) {
          bestZone = COLOR_ZONES[1]; // Red
        } else if (pz > 4) {
          bestZone = COLOR_ZONES[2]; // Green
        } else if (px < -4) {
          bestZone = COLOR_ZONES[3]; // Yellow
        } else {
          bestZone = COLOR_ZONES[4]; // Purple
        }
        s.closestZone = bestZone;

        // Calculate Camouflage %
        const isColorMatch = (s.player.currentColor === bestZone.colorThree);
        const isStill = s.player.isFrozen || (Math.hypot(s.player.vx, s.player.vz) < 0.01);
        let camou = 0;
        if (isColorMatch && isStill) {
          camou = 100;
        } else if (isColorMatch && !isStill) {
          camou = 45; // Matching color but moving
        } else if (!isColorMatch && isStill) {
          camou = 15; // Still but mismatched color
        } else {
          camou = 0;
        }
        s.camouflage = camou;
        setCamouflagePct(camou);

        // Update Hunters AI
        let maxAlert = 0;
        s.hunters.forEach((h, idx) => {
          const hGroup = hunterGroups[idx];
          const cone = visionCones[idx];
          if (!hGroup || !cone) return;

          // Patrol Movement (Wander or Seek)
          h.patrolTimer -= dt;
          if (h.patrolTimer <= 0) {
            h.patrolTimer = 2.5 + Math.random() * 2.0;
            h.targetAngle = (Math.random() * Math.PI * 2);
          }

          // Smooth turning towards target angle
          let diffAngle = h.targetAngle - h.angle;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
          h.angle += diffAngle * 0.05;

          // Forward motion
          h.x += Math.sin(h.angle) * h.speed;
          h.z += Math.cos(h.angle) * h.speed;

          // Bounce off boundary
          const hLimit = 9.0;
          if (h.x < -hLimit || h.x > hLimit) {
            h.angle = -h.angle;
            h.x = THREE.MathUtils.clamp(h.x, -hLimit, hLimit);
          }
          if (h.z < -hLimit || h.z > hLimit) {
            h.angle = Math.PI - h.angle;
            h.z = THREE.MathUtils.clamp(h.z, -hLimit, hLimit);
          }

          hGroup.position.set(h.x, 0, h.z);
          hGroup.rotation.y = h.angle;

          // Vision Cone Check to Player
          const toPlayerX = s.player.x - h.x;
          const toPlayerZ = s.player.z - h.z;
          const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

          const hunterForwardX = Math.sin(h.angle);
          const hunterForwardZ = Math.cos(h.angle);
          const dot = (toPlayerX * hunterForwardX + toPlayerZ * hunterForwardZ) / Math.max(distToPlayer, 0.001);

          // Within 8 units and in front FOV (> 0.65 cos angle ~ 49 deg)
          const inVisionCone = distToPlayer < 8.0 && dot > 0.65;

          if (inVisionCone) {
            if (s.camouflage < 80) {
              // Spotted!
              h.alert = Math.min(100, h.alert + dt * 120);
              h.targetAngle = Math.atan2(toPlayerX, toPlayerZ); // Turn to face player
              (cone.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
              (cone.material as THREE.MeshBasicMaterial).opacity = 0.45;
            } else {
              // Camouflaged! Hunter loses interest
              h.alert = Math.max(0, h.alert - dt * 50);
              (cone.material as THREE.MeshBasicMaterial).color.setHex(0x22c55e);
              (cone.material as THREE.MeshBasicMaterial).opacity = 0.2;
            }
          } else {
            h.alert = Math.max(0, h.alert - dt * 35);
            (cone.material as THREE.MeshBasicMaterial).color.setHex(0xfef08a);
            (cone.material as THREE.MeshBasicMaterial).opacity = 0.22;
          }

          if (h.alert > maxAlert) maxAlert = h.alert;

          // Shoot Paint Projectile when Alert = 100
          h.shootCooldown -= dt;
          if (h.alert >= 95 && h.shootCooldown <= 0) {
            h.shootCooldown = 1.2;
            playSfx?.('sounds/laser.mp3');
            // Spawn bullet
            const bSpeed = 0.35;
            s.bullets.push({
              x: h.x,
              z: h.z,
              vx: (toPlayerX / distToPlayer) * bSpeed,
              vz: (toPlayerZ / distToPlayer) * bSpeed,
              life: 40,
            });
          }
        });

        // Hide inactive hunters if stage has fewer
        hunterGroups.forEach((hg, idx) => {
          hg.visible = idx < s.hunters.length;
        });

        s.maxHunterAlert = maxAlert;
        setHunterAlertPct(Math.round(maxAlert));

        // Update Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx;
          b.z += b.vz;
          b.life -= 1;

          // Check hit player
          const hitDist = Math.hypot(b.x - s.player.x, b.z - s.player.z);
          if (hitDist < 0.8 && s.player.invulnerableTimer <= 0) {
            s.player.invulnerableTimer = 1.5;
            playSfx?.('sounds/hit.mp3');
            setLives((prev) => {
              const next = prev - 1;
              if (next <= 0) {
                setIsGameOver(true);
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'pokihideandpaint',
                  gameTitle: 'Hide and Paint 3D',
                  durationSeconds: 35,
                  score: score + (stage - 1) * 20,
                  maxTargetScore: 150,
                  isVictory: false,
                  difficulty: 'NORMAL',
                });
                setSettlementReceipt(receipt);
                onReward(receipt.totalSns);
              }
              return Math.max(0, next);
            });
            s.bullets.splice(i, 1);
            continue;
          }

          if (b.life <= 0) {
            s.bullets.splice(i, 1);
          }
        }

        // Invulnerable Flash
        if (s.player.invulnerableTimer > 0) {
          s.player.invulnerableTimer -= dt;
          playerGroup.visible = Math.floor(currentTime / 80) % 2 === 0;
        } else {
          playerGroup.visible = true;
        }

        // Camera Smooth Follow
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, s.player.x * 0.4, 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, s.player.z * 0.4 + 13, 0.05);
        camera.lookAt(s.player.x * 0.3, 0, s.player.z * 0.3);

        renderer.render(scene, camera);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, playSfx, score, stage, onReward]);

  // 6. Round Timer Countdown
  useEffect(() => {
    if (isGameOver || isVictory) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Round Clear!
          if (stage < totalStages) {
            setStage((s) => s + 1);
            setScore((sc) => sc + 50);
            initStage(stage + 1);
            playSfx?.('sounds/victory.mp3');
            return 35 + (stage + 1) * 5;
          } else {
            // Full Victory!
            setIsVictory(true);
            const receipt = calculateAndDepositMissionReward({
              gameId: 'pokihideandpaint',
              gameTitle: 'Hide and Paint 3D',
              durationSeconds: 35,
              score: score + 100,
              maxTargetScore: 150,
              isVictory: true,
              difficulty: 'NORMAL',
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
            playSfx?.('sounds/victory.mp3');
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isVictory, stage, totalStages, score, initStage, playSfx, onReward]);

  // 7. Keyboard & Touch Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if (e.key === 'f' || e.key === 'F' || e.key === ' ') {
        e.preventDefault();
        handlePaint();
      }
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleToggleFreeze();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePaint, handleToggleFreeze]);

  // Touch Handlers for Mobile Pure Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    s.touch.active = true;
    s.touch.startX = touch.clientX;
    s.touch.startY = touch.clientY;
    s.touch.currentX = touch.clientX;
    s.touch.currentY = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    if (s.touch.active) {
      s.touch.currentX = touch.clientX;
      s.touch.currentY = touch.clientY;
    }
  };

  const handleTouchEnd = () => {
    const s = stateRef.current;
    s.touch.active = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'COLOR',
      title: isKo ? '🎨 숨바꼭질 & 페인트 위장' : '🎨 Hide and Paint',
      description: isKo
        ? '새하얀 카멜레온이 되어 방 안의 색상 구역으로 이동하세요! 주변 벽/가구 색상에 맞춰 몸을 칠하고 숨어야 합니다.'
        : 'Become a chameleon and move to different colored zones! Paint your body to match the walls and hide.',
      keyPoints: isKo
        ? ['색상 구역(블루, 레드, 그린, 옐로우, 퍼플)으로 이동', '벽/가구 근처에서 완벽 밀착']
        : ['Move to colored wall zones', 'Stick close to props'],
    },
    {
      badge: 'ACTION',
      title: isKo ? '🗿 [PAINT] & [FREEZE]' : '🗿 [PAINT] & [FREEZE]',
      description: isKo
        ? '벽 근처에서 [PAINT]를 눌러 색상을 바꾸고, [FREEZE]로 굳어서 위장도 100%를 만드세요. 움직이거나 색이 다르면 들킵니다!'
        : 'Tap [PAINT] to blend with surroundings, and tap [FREEZE] to lock your camouflage at 100%. Moving will blow your cover!',
      keyPoints: isKo
        ? ['[PAINT]로 주변 색상 염색', '[FREEZE]로 정지 시 위장도 100%']
        : ['Tap [PAINT] to morph color', 'Tap [FREEZE] to hide at 100%'],
    },
    {
      badge: 'SURVIVE',
      title: isKo ? '🚨 사냥꾼의 시야 회피' : '🚨 Dodge Hunter Vision',
      description: isKo
        ? '순찰하는 사냥꾼의 노란색 시야 원뿔을 피하거나, 완벽한 위장으로 속이세요. 제한 시간 동안 생존하면 승리!'
        : 'Evade the hunter vision cone or fool them with 100% camouflage. Survive until time expires to win!',
      keyPoints: isKo
        ? ['사냥꾼 시야 콘 주의', '시간 종료까지 생존 시 승리']
        : ['Avoid or fool vision cones', 'Survive the timer to win'],
    },
  ];

  return (
    <div
      className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Minimalist Mission HUD with Global Back & Abandon Settlement */}
      <MinimalistMissionHUD
        gameTitle="HIDE & PAINT 3D"
        score={score}
        targetScore={150}
        language={language}
        onExit={() => {
          const currentProgress = (stage - 1) * 35 + (35 - timeLeft);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokihideandpaint',
            gameTitle: 'Hide and Paint 3D',
            durationSeconds: 35 - timeLeft,
            score: currentProgress,
            maxTargetScore: 150,
            isVictory: false,
            difficulty: 'NORMAL',
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          onExit();
        }}
      />

      {/* Top Status Panel: Timer, Stage, Lives, Camouflage, Alert */}
      <div className="absolute top-16 left-4 right-4 flex flex-col gap-2 pointer-events-none z-10">
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/80 backdrop-blur-sm">
            <span className="text-emerald-400 font-bold">ROUND {stage}/{totalStages}</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-300 font-bold">{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/80 backdrop-blur-sm">
            <span className="text-slate-400 text-xs">HP</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < lives ? 'bg-rose-500' : 'bg-slate-700'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Camouflage & Hunter Alert Bar */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Camouflage */}
          <div className="bg-slate-900/85 p-2 rounded-sm border border-slate-700/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <span>🎨</span> {isKo ? '위장도' : 'CAMOU'}
              </span>
              <span className={`font-bold ${camouflagePct >= 80 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {camouflagePct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  camouflagePct >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${camouflagePct}%` }}
              />
            </div>
          </div>

          {/* Hunter Alert */}
          <div className="bg-slate-900/85 p-2 rounded-sm border border-slate-700/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <span>🚨</span> {isKo ? '경계도' : 'ALERT'}
              </span>
              <span className={`font-bold ${hunterAlertPct > 50 ? 'text-rose-400' : 'text-slate-400'}`}>
                {hunterAlertPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  hunterAlertPct > 70 ? 'bg-rose-500' : hunterAlertPct > 30 ? 'bg-amber-500' : 'bg-slate-600'
                }`}
                style={{ width: `${hunterAlertPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Pure Gesture Guide & Action Touch Controls */}
      <div className="absolute bottom-6 left-4 right-4 flex items-end justify-between pointer-events-none z-20">
        {/* Left: Drag Joystick Hint */}
        <div className="bg-slate-900/80 px-3 py-2 rounded-sm border border-slate-700/80 text-[11px] text-slate-300 backdrop-blur-sm">
          <div className="text-slate-400 font-bold mb-0.5">{isKo ? '🕹️ 이동 제스처' : '🕹️ MOVE'}</div>
          <div>{isKo ? '화면을 터치 & 드래그하세요' : 'Drag screen to move'}</div>
        </div>

        {/* Right: Interactive Action Buttons */}
        <div className="flex gap-2.5 pointer-events-auto">
          {/* Paint Button */}
          <button
            type="button"
            onClick={handlePaint}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-sm bg-indigo-600 active:bg-indigo-700 text-white font-bold border-2 border-indigo-400/80 shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-xl">🎨</span>
            <span className="text-[10px] tracking-wider mt-0.5">PAINT</span>
          </button>

          {/* Freeze Button */}
          <button
            type="button"
            onClick={handleToggleFreeze}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-sm font-bold border-2 shadow-lg active:scale-95 transition-transform ${
              isFrozen
                ? 'bg-amber-500 border-amber-300 text-slate-950 animate-pulse'
                : 'bg-slate-800 active:bg-slate-700 border-slate-600 text-white'
            }`}
          >
            <span className="text-xl">🗿</span>
            <span className="text-[10px] tracking-wider mt-0.5">{isFrozen ? 'FROZEN' : 'FREEZE'}</span>
          </button>
        </div>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isVictory}
          receipt={settlementReceipt}
          language={language}
          onConfirm={() => {
            setIsVictory(false);
            onExit();
          }}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 max-w-sm w-full rounded-sm text-center">
            <div className="text-3xl mb-2">💥</div>
            <h2 className="text-xl font-bold text-rose-500 mb-2">
              {isKo ? '사냥꾼에게 발각되었습니다!' : 'Busted by Hunter!'}
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              {isKo
                ? '위장도가 낮거나 움직이다가 페인트 탄환에 맞았습니다.'
                : 'You were spotted and hit by paint bullets.'}
            </p>
            {settlementReceipt && (
              <div className="bg-slate-800/80 p-3 rounded-sm border border-slate-700 mb-4 text-xs text-slate-300">
                <div className="text-slate-400 mb-1">{isKo ? '생존 진행 보상' : 'Survival Reward'}</div>
                <div className="text-base font-bold text-amber-400">
                  +{settlementReceipt.rewardAmount} SNS
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onExit}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-sm border border-slate-600 text-sm"
            >
              {isKo ? '미션 목록으로' : 'Back to Missions'}
            </button>
          </div>
        </div>
      )}

      {/* Universal Tutorial Modal */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        steps={tutorialSteps}
        language={language}
        onClose={() => {
          setShowTutorial(false);
          try {
            localStorage.setItem('hero_tutorial_hide_and_paint_v2', 'true');
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
};

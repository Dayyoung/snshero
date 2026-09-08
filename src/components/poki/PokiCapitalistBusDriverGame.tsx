import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCapitalistBusDriverGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

const LANES = [-3.2, 0, 3.2];
const TARGET_PASSENGERS = 20;
const TARGET_REVENUE = 500;

interface TrafficCar {
  mesh: THREE.Group;
  lane: number;
  z: number;
  speed: number;
}

interface BusStop {
  mesh: THREE.Group;
  z: number;
  passengers: number;
  visited: boolean;
}

export default function PokiCapitalistBusDriverGame({
  onBack,
  onClose,
  cardId = 96,
  onExit
}: PokiCapitalistBusDriverGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleExit = onBack || onClose || (() => {});

  // Game States
  const [passengers, setPassengers] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(3);
  const [speedKmh, setSpeedKmh] = useState<number>(50);
  const [alertText, setAlertText] = useState<string | null>(null);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Input & Runtime Refs
  const inputRef = useRef({
    currentLane: 1, // 0: Left, 1: Center, 2: Right
    targetX: 0,
    isGas: false,
    isBrake: false,
    speed: 16, // m/s (~58 km/h)
  });
  const startTimeRef = useRef<number>(Date.now());
  const matchActiveRef = useRef<boolean>(true);

  // Three.js Scene References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    busGroup: THREE.Group;
    wheels: THREE.Mesh[];
    trafficCars: TrafficCar[];
    busStops: BusStop[];
    roadSegments: THREE.Group[];
    particlesGroup: THREE.Group;
    roadLength: number;
    heartsRef: number;
    passengersRef: number;
    revenueRef: number;
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

  // Sparkles & Coins Emitter
  const spawnCollectParticles = useCallback((pos: THREE.Vector3, colorHex: number) => {
    if (!threeRef.current) return;
    const { particlesGroup } = threeRef.current;
    const count = 20;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y + 1.2;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 4 + 1.5,
          (Math.random() - 0.5) * 4
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
      life += 0.05;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + velocities[i].x * 0.02,
          posAttr.getY(i) + velocities[i].y * 0.02 - 0.04,
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
      gameId: 'pokicapitalistbusdriver',
      gameTitle: 'Capitalist Bus Driver 3D',
      isVictory: true,
      score: 500,
      maxTargetScore: 500,
      durationSeconds,
    });
    setRewardReceipt(receipt);
  }, [gameWon]);

  // Traffic Car Mesh Builder
  const createTrafficCarMesh = (colorHex: number): THREE.Group => {
    const group = new THREE.Group();
    // Body
    const bodyGeom = new THREE.BoxGeometry(1.8, 0.75, 3.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.4 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeom = new THREE.BoxGeometry(1.5, 0.65, 2.0);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
    const cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(0, 1.15, -0.2);
    group.add(cabin);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tailGeom = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const t1 = new THREE.Mesh(tailGeom, tailMat);
    t1.position.set(-0.65, 0.6, 1.92);
    const t2 = new THREE.Mesh(tailGeom, tailMat);
    t2.position.set(0.65, 0.6, 1.92);
    group.add(t1, t2);

    return group;
  };

  // Bus Stop Shelter Builder
  const createBusStopMesh = (passengersCount: number): THREE.Group => {
    const group = new THREE.Group();
    // Shelter Base & Roof
    const roofGeom = new THREE.BoxGeometry(2.5, 0.1, 4.0);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, 2.8, 0);
    group.add(roof);

    // Pillars
    const pillarGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const p1 = new THREE.Mesh(pillarGeom, pillarMat);
    p1.position.set(-1.0, 1.4, -1.8);
    const p2 = new THREE.Mesh(pillarGeom, pillarMat);
    p2.position.set(-1.0, 1.4, 1.8);
    group.add(p1, p2);

    // Bus Stop Sign
    const signGeom = new THREE.BoxGeometry(0.8, 0.6, 0.08);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const sign = new THREE.Mesh(signGeom, signMat);
    sign.position.set(-1.0, 3.2, 0);
    group.add(sign);

    // Waiting Passenger Figures
    for (let i = 0; i < Math.min(passengersCount, 4); i++) {
      const pFig = new THREE.Group();
      const pBodyGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 12);
      const pBodyMat = new THREE.MeshStandardMaterial({ color: [0xef4444, 0x3b82f6, 0x10b981, 0xa855f7][i % 4] });
      const pBody = new THREE.Mesh(pBodyGeom, pBodyMat);
      pBody.position.y = 0.4;
      pFig.add(pBody);

      const pHeadGeom = new THREE.SphereGeometry(0.15, 12, 12);
      const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
      const pHead = new THREE.Mesh(pHeadGeom, pHeadMat);
      pHead.position.y = 0.95;
      pFig.add(pHead);

      pFig.position.set(-0.4, 0, (i - 1.5) * 0.7);
      group.add(pFig);
    }

    return group;
  };

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3f7); // Coastal sky blue
    scene.fog = new THREE.Fog(0xbfe3f7, 40, 120);

    // 2. Camera (Chase View)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 5.5, 11);
    camera.lookAt(0, 1.5, -6);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.5);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 5. Road Segments Pool (Infinite Scrolling Road)
    const segmentLength = 80;
    const numSegments = 3;
    const roadSegments: THREE.Group[] = [];

    const createRoadSegment = (segZ: number) => {
      const segGroup = new THREE.Group();

      // Main Asphalt Road (3 Lanes, W = 11.0)
      const roadGeom = new THREE.PlaneGeometry(11.0, segmentLength);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const roadMesh = new THREE.Mesh(roadGeom, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.receiveShadow = true;
      segGroup.add(roadMesh);

      // White Dashed Lane Dividers
      const dashGeom = new THREE.PlaneGeometry(0.18, 3.5);
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      for (let z = -segmentLength / 2 + 2; z < segmentLength / 2; z += 7) {
        // Left divider
        const d1 = new THREE.Mesh(dashGeom, dashMat);
        d1.rotation.x = -Math.PI / 2;
        d1.position.set(-1.6, 0.01, z);
        segGroup.add(d1);

        // Right divider
        const d2 = new THREE.Mesh(dashGeom, dashMat);
        d2.rotation.x = -Math.PI / 2;
        d2.position.set(1.6, 0.01, z);
        segGroup.add(d2);
      }

      // Yellow Solid Sideline Boundaries
      const lineGeom = new THREE.PlaneGeometry(0.22, segmentLength);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const leftLine = new THREE.Mesh(lineGeom, lineMat);
      leftLine.rotation.x = -Math.PI / 2;
      leftLine.position.set(-5.3, 0.01, 0);
      const rightLine = new THREE.Mesh(lineGeom, lineMat);
      rightLine.rotation.x = -Math.PI / 2;
      rightLine.position.set(5.3, 0.01, 0);
      segGroup.add(leftLine, rightLine);

      // Left Side: Blue Ocean Water
      const oceanGeom = new THREE.PlaneGeometry(50, segmentLength);
      const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.2, metalness: 0.3 });
      const ocean = new THREE.Mesh(oceanGeom, oceanMat);
      ocean.rotation.x = -Math.PI / 2;
      ocean.position.set(-31, -0.4, 0);
      segGroup.add(ocean);

      // Right Side: Sandy Sidewalk & Palm Trees
      const sandGeom = new THREE.PlaneGeometry(25, segmentLength);
      const sandMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
      const sand = new THREE.Mesh(sandGeom, sandMat);
      sand.rotation.x = -Math.PI / 2;
      sand.position.set(18, -0.05, 0);
      segGroup.add(sand);

      // Palm Trees on Right
      for (let tz = -segmentLength / 2 + 8; tz < segmentLength / 2; tz += 18) {
        const palm = new THREE.Group();
        const trunkGeom = new THREE.CylinderGeometry(0.2, 0.35, 5, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 2.5;
        trunk.rotation.z = -0.08;
        palm.add(trunk);

        const leavesGeom = new THREE.ConeGeometry(2.2, 2.5, 7);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
        const leaves = new THREE.Mesh(leavesGeom, leavesMat);
        leaves.position.y = 5.2;
        palm.add(leaves);

        palm.position.set(8.5, 0, tz);
        segGroup.add(palm);
      }

      segGroup.position.z = segZ;
      scene.add(segGroup);
      return segGroup;
    };

    for (let i = 0; i < numSegments; i++) {
      roadSegments.push(createRoadSegment(-i * segmentLength));
    }

    // 6. Start Arch & Hero Badge
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const badgeCtx = heroBadgeCanvas.getContext('2d')!;
    drawCardSprite(badgeCtx, cardId, 0, 0, 128, 128, { circleClip: true });
    const heroBadgeTexture = new THREE.CanvasTexture(heroBadgeCanvas);

    const archGroup = new THREE.Group();
    const archBarGeom = new THREE.BoxGeometry(13.0, 1.2, 0.8);
    const archBarMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 });
    const archBar = new THREE.Mesh(archBarGeom, archBarMat);
    archBar.position.y = 5.8;
    archGroup.add(archBar);

    const archPillarGeom = new THREE.CylinderGeometry(0.4, 0.4, 6.0, 16);
    const pLeft = new THREE.Mesh(archPillarGeom, archBarMat);
    pLeft.position.set(-6.0, 3.0, 0);
    const pRight = new THREE.Mesh(archPillarGeom, archBarMat);
    pRight.position.set(6.0, 3.0, 0);
    archGroup.add(pLeft, pRight);

    const badgePlaneGeom = new THREE.PlaneGeometry(1.6, 1.6);
    const badgePlaneMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const badgePlane = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
    badgePlane.position.set(0, 5.8, 0.42);
    archGroup.add(badgePlane);
    archGroup.position.set(0, 0, -5);
    scene.add(archGroup);

    // 7. 3D Tour Bus Model Assembly
    const busGroup = new THREE.Group();
    const wheels: THREE.Mesh[] = [];

    // Bus Main Body (Yellow/Orange)
    const busBodyGeom = new THREE.BoxGeometry(2.3, 1.9, 5.4);
    const busBodyMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.3, roughness: 0.3 });
    const busBody = new THREE.Mesh(busBodyGeom, busBodyMat);
    busBody.position.y = 1.35;
    busBody.castShadow = true;
    busGroup.add(busBody);

    // Roof Air-con Unit
    const roofGeom = new THREE.BoxGeometry(1.4, 0.3, 2.2);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const roofUnit = new THREE.Mesh(roofGeom, roofMat);
    roofUnit.position.set(0, 2.45, -0.4);
    busGroup.add(roofUnit);

    // Front Windshield (Glass)
    const frontGlassGeom = new THREE.PlaneGeometry(2.1, 1.1);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.9 });
    const frontGlass = new THREE.Mesh(frontGlassGeom, glassMat);
    frontGlass.position.set(0, 1.6, -2.71);
    busGroup.add(frontGlass);

    // Side Windows
    const sideGlassGeom = new THREE.PlaneGeometry(4.4, 0.75);
    const leftSideGlass = new THREE.Mesh(sideGlassGeom, glassMat);
    leftSideGlass.rotation.y = -Math.PI / 2;
    leftSideGlass.position.set(-1.16, 1.6, -0.1);
    const rightSideGlass = new THREE.Mesh(sideGlassGeom, glassMat);
    rightSideGlass.rotation.y = Math.PI / 2;
    rightSideGlass.position.set(1.16, 1.6, -0.1);
    busGroup.add(leftSideGlass, rightSideGlass);

    // Side Decal: Hero Badge on Both Sides
    const sideBadgeGeom = new THREE.PlaneGeometry(0.8, 0.8);
    const sideBadgeMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const leftBadge = new THREE.Mesh(sideBadgeGeom, sideBadgeMat);
    leftBadge.rotation.y = -Math.PI / 2;
    leftBadge.position.set(-1.16, 0.8, 1.2);
    const rightBadge = new THREE.Mesh(sideBadgeGeom, sideBadgeMat);
    rightBadge.rotation.y = Math.PI / 2;
    rightBadge.position.set(1.16, 0.8, 1.2);
    busGroup.add(leftBadge, rightBadge);

    // Headlights (Dual Front Beams)
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headGeom = new THREE.BoxGeometry(0.35, 0.2, 0.08);
    const h1 = new THREE.Mesh(headGeom, headMat);
    h1.position.set(-0.8, 0.75, -2.71);
    const h2 = new THREE.Mesh(headGeom, headMat);
    h2.position.set(0.8, 0.75, -2.71);
    busGroup.add(h1, h2);

    // 6 Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 20);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const wheelPositions = [
      [-1.15, 0.42, -1.6],
      [1.15, 0.42, -1.6],
      [-1.15, 0.42, 1.1],
      [1.15, 0.42, 1.1],
      [-1.15, 0.42, 1.9],
      [1.15, 0.42, 1.9],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      busGroup.add(wheel);
      wheels.push(wheel);
    });

    busGroup.position.set(LANES[1], 0, 0);
    scene.add(busGroup);

    // 8. Traffic Cars & Bus Stops
    const trafficCars: TrafficCar[] = [];
    const trafficColors = [0xef4444, 0x3b82f6, 0x10b981, 0xa855f7, 0xe2e8f0];
    for (let i = 0; i < 5; i++) {
      const laneIdx = i % 3;
      const tMesh = createTrafficCarMesh(trafficColors[i]);
      const initialZ = -30 - i * 28;
      tMesh.position.set(LANES[laneIdx], 0, initialZ);
      scene.add(tMesh);
      trafficCars.push({
        mesh: tMesh,
        lane: laneIdx,
        z: initialZ,
        speed: 10 + Math.random() * 4,
      });
    }

    const busStops: BusStop[] = [];
    for (let i = 0; i < 3; i++) {
      const bStopMesh = createBusStopMesh(5 + i * 2);
      const bStopZ = -60 - i * 75;
      bStopMesh.position.set(6.8, 0, bStopZ);
      scene.add(bStopMesh);
      busStops.push({
        mesh: bStopMesh,
        z: bStopZ,
        passengers: 6 + i * 2,
        visited: false,
      });
    }

    // 9. Particles Group
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      busGroup,
      wheels,
      trafficCars,
      busStops,
      roadSegments,
      particlesGroup,
      roadLength: segmentLength * numSegments,
      heartsRef: 3,
      passengersRef: 0,
      revenueRef: 0,
    };

    // 10. Main Animation Loop
    let animFrameId: number;
    const clock = new THREE.Clock();

    const gameLoop = () => {
      animFrameId = requestAnimationFrame(gameLoop);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (threeRef.current && matchActiveRef.current) {
        const input = inputRef.current;
        const { busGroup, camera, wheels, trafficCars, busStops, roadSegments, roadLength } = threeRef.current;

        // Acceleration & Braking Physics
        if (input.isGas) {
          input.speed = Math.min(28, input.speed + 14 * delta);
        } else if (input.isBrake) {
          input.speed = Math.max(5, input.speed - 22 * delta);
        } else {
          // Coasting Speed
          input.speed = THREE.MathUtils.lerp(input.speed, 16, 0.03);
        }

        setSpeedKmh(Math.floor(input.speed * 3.6));

        // Forward Bus Movement (-Z)
        busGroup.position.z -= input.speed * delta;

        // Smooth Lane Steer (Screen-relative)
        input.targetX = LANES[input.currentLane];
        busGroup.position.x = THREE.MathUtils.lerp(busGroup.position.x, input.targetX, 0.15);

        // Bus Tilt during steer
        const steerDiff = input.targetX - busGroup.position.x;
        busGroup.rotation.y = steerDiff * 0.08;
        busGroup.rotation.z = -steerDiff * 0.04;

        // Wheel Rotation
        wheels.forEach((w) => {
          w.rotation.x += input.speed * delta * 2.4;
        });

        // Infinite Road Segment Recycling
        roadSegments.forEach((seg) => {
          if (seg.position.z - busGroup.position.z > segmentLength) {
            seg.position.z -= roadLength;
          }
        });

        // Traffic Car AI & Collision Update
        trafficCars.forEach((tc) => {
          tc.z -= tc.speed * delta;
          // Recycle traffic car when behind bus
          if (tc.z - busGroup.position.z > 20) {
            tc.lane = Math.floor(Math.random() * 3);
            tc.z = busGroup.position.z - 80 - Math.random() * 40;
            tc.speed = 10 + Math.random() * 5;
            tc.mesh.position.set(LANES[tc.lane], 0, tc.z);
          } else {
            tc.mesh.position.z = tc.z;
          }

          // Collision Check with Player Bus
          const dz = Math.abs(tc.z - busGroup.position.z);
          const dx = Math.abs(tc.mesh.position.x - busGroup.position.x);
          if (dz < 4.2 && dx < 1.9) {
            // Crash!
            triggerHaptic(60);
            threeRef.current!.heartsRef -= 1;
            const newHearts = threeRef.current!.heartsRef;
            setHearts(newHearts);
            setAlertText('⚠️ CRASH! 안전 운전하세요!');
            setTimeout(() => setAlertText(null), 1500);

            // Push traffic car forward
            tc.z -= 15;
            tc.mesh.position.z = tc.z;
            input.speed = 8;

            if (newHearts <= 0) {
              handleVictory();
            }
          }
        });

        // Bus Stop Pickup Check
        busStops.forEach((bStop) => {
          const distZ = Math.abs(bStop.z - busGroup.position.z);
          if (distZ < 6.0 && !bStop.visited) {
            bStop.visited = true;
            triggerHaptic(40);

            const addedPax = bStop.passengers;
            const addedRev = addedPax * 25;
            threeRef.current!.passengersRef += addedPax;
            threeRef.current!.revenueRef += addedRev;

            const totalPax = threeRef.current!.passengersRef;
            const totalRev = threeRef.current!.revenueRef;
            setPassengers(totalPax);
            setRevenue(totalRev);
            setAlertText(`🚏 승객 +${addedPax}명 탑승! (+$${addedRev})`);
            setTimeout(() => setAlertText(null), 1800);

            spawnCollectParticles(new THREE.Vector3(busGroup.position.x + 1.2, 1.0, busGroup.position.z), 0xfacc15);

            if (totalPax >= TARGET_PASSENGERS || totalRev >= TARGET_REVENUE) {
              handleVictory();
            }
          }

          // Recycle bus stop ahead
          if (bStop.z - busGroup.position.z > 30) {
            bStop.z = busGroup.position.z - 110 - Math.random() * 30;
            bStop.mesh.position.z = bStop.z;
            bStop.visited = false;
          }
        });

        // Camera Smooth Follow
        camera.position.z = busGroup.position.z + 10;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, busGroup.position.x * 0.4, 0.1);
        camera.lookAt(busGroup.position.x * 0.6, 1.8, busGroup.position.z - 8);

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
  }, [cardId, handleVictory, spawnCollectParticles]);

  // Touch Swipe & Tap for Lane Change (Screen-relative)
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameWon) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameWon) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;

    if (Math.abs(dx) > 30) {
      if (dx > 0) {
        // Swipe Right
        changeLane(1);
      } else {
        // Swipe Left
        changeLane(-1);
      }
    } else if (t.clientX < window.innerWidth * 0.5) {
      // Left Tap
      changeLane(-1);
    } else {
      // Right Tap
      changeLane(1);
    }
  };

  const changeLane = (dir: -1 | 1) => {
    triggerHaptic(20);
    const nextLane = THREE.MathUtils.clamp(inputRef.current.currentLane + dir, 0, 2);
    inputRef.current.currentLane = nextLane;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#bfe3f7] font-mono"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js Canvas mounts here */}

      {/* Top Minimalist HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="CAPITALIST BUS DRIVER 3D"
        progress={Math.min(100, (passengers / TARGET_PASSENGERS) * 100)}
        score={revenue}
        maxScore={TARGET_REVENUE}
        onQuit={handleExit}
      />

      {/* Top Center Status Panel */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-2xl backdrop-blur-md flex items-center gap-4">
          {/* Passengers */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-400">
            <span>👥</span>
            <span>{passengers}/{TARGET_PASSENGERS}명</span>
          </div>
          <span className="text-slate-600">|</span>
          {/* Revenue */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-400">
            <span>💵</span>
            <span>${revenue}</span>
          </div>
          <span className="text-slate-600">|</span>
          {/* Speed */}
          <div className="text-xs sm:text-sm font-black text-sky-300 font-mono">
            {speedKmh} km/h
          </div>
          <span className="text-slate-600">|</span>
          {/* Hearts */}
          <div className="flex items-center gap-1 text-xs">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < hearts ? 'text-rose-500' : 'text-slate-600'}>❤️</span>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Toast Banner */}
      {alertText && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm sm:text-base tracking-wider shadow-xl border-2 border-white">
            {alertText}
          </div>
        </div>
      )}

      {/* Driving Controls (Mobile Pure Pedal Buttons) */}
      <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none flex items-center justify-between">
        {/* Left Brake Pedal */}
        <button
          type="button"
          onPointerDown={() => {
            triggerHaptic(20);
            inputRef.current.isBrake = true;
          }}
          onPointerUp={() => { inputRef.current.isBrake = false; }}
          onPointerLeave={() => { inputRef.current.isBrake = false; }}
          className="pointer-events-auto h-[68px] px-6 rounded-2xl bg-rose-600/90 hover:bg-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2 border border-rose-400/50 backdrop-blur-md cursor-pointer"
        >
          <span className="text-xl">🛑</span>
          <span>BRAKE</span>
        </button>

        {/* Lane Change Steer Guidance */}
        <div className="text-[10px] text-slate-300 font-bold bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-xs">
          ← 화면 좌우 탭/스와이프 차선 변경 →
        </div>

        {/* Right 76px Big Gas Pedal */}
        <button
          type="button"
          onPointerDown={() => {
            triggerHaptic(20);
            inputRef.current.isGas = true;
          }}
          onPointerUp={() => { inputRef.current.isGas = false; }}
          onPointerLeave={() => { inputRef.current.isGas = false; }}
          className="pointer-events-auto h-[76px] px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base uppercase tracking-wider shadow-2xl shadow-amber-500/40 active:scale-95 transition-all flex items-center gap-3 border border-yellow-300/60 cursor-pointer"
        >
          <span className="text-2xl">🚀</span>
          <span>GAS ACCEL</span>
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

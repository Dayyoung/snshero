import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Zap, ShieldAlert, Sparkles, RefreshCw, Trophy, Gauge, Flame, Shield } from 'lucide-react';

interface PokiRealCityBikesGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface TrafficVehicle {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  speed: number;
  lane: number;
  width: number;
  length: number;
  nearMissed: boolean;
}

interface StuntRamp {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
}

const TARGET_DISTANCE = 1500; // 1500 meters
const ROAD_WIDTH = 14;
const LANE_WIDTH = 3.5;

export default function PokiRealCityBikesGame({
  onClose,
  onBack,
  cardId = 65,
  onExit
}: PokiRealCityBikesGameProps) {
  const handleExit = onBack || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Gameplay state
  const [distance, setDistance] = useState(0);
  const [nearMissCount, setNearMissCount] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(120);
  const [nitroGauge, setNitroGauge] = useState(80);
  const [isNitro, setIsNitro] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Steering drag
  const targetXRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const isBrakingRef = useRef<boolean>(false);
  const isNitroRef = useRef<boolean>(false);

  // Tracking refs
  const startTimeRef = useRef<number>(Date.now());
  const distRef = useRef<number>(0);
  const nearMissRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    distRef.current = distance;
    nearMissRef.current = nearMissCount;
    livesRef.current = lives;
    scoreRef.current = score;
    isNitroRef.current = isNitro;
  }, [distance, nearMissCount, lives, score, isNitro]);

  // Three.js Context
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    bikeGroup: THREE.Group;
    frontWheel: THREE.Mesh;
    rearWheel: THREE.Mesh;
    exhaustFlame: THREE.Mesh;
    roadSegments: THREE.Mesh[];
    trafficCars: TrafficVehicle[];
    ramps: StuntRamp[];
    buildings: THREE.Mesh[];
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
    bikePos: THREE.Vector3;
    bikeVelY: number;
    isAirborne: boolean;
    invincibleTimer: number;
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

  // Helper: Road Asphalt Texture
  const createRoadTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = '#1e293b'; // Dark asphalt
    ctx.fillRect(0, 0, 512, 512);

    // 4 Lanes - 3 dashed white lines
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 8;
    ctx.setLineDash([40, 40]);

    for (let i = 1; i < 4; i++) {
      const x = (512 / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Yellow outer lane solid lines
    ctx.setLineDash([]);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(12, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(500, 0);
    ctx.lineTo(500, 512);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    return tex;
  };

  // Trigger Near Miss Sparks
  const triggerSparks = useCallback((x: number, y: number, z: number, isGold = true) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) navigator.vibrate(isGold ? [40, 20, 60] : [70, 30, 90]);

    const count = 35;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];
    const baseColor = isGold ? new THREE.Color(0xfacc15) : new THREE.Color(0xef4444);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = y + Math.random() * 0.4;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;

      col[i * 3] = baseColor.r;
      col[i * 3 + 1] = baseColor.g;
      col[i * 3 + 2] = baseColor.b;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        2.0 + Math.random() * 4,
        (Math.random() - 0.5) * 6
      ));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    if (three.particles) {
      three.scene.remove(three.particles);
    }
    three.particles = new THREE.Points(geo, mat);
    three.particleVels = vels;
    three.scene.add(three.particles);
  }, []);

  // Helper: Create 3D Traffic Car Model
  const createTrafficCar = (colorHex: number, lane: number, zPos: number) => {
    const group = new THREE.Group();
    const xPos = (lane - 1.5) * LANE_WIDTH;
    group.position.set(xPos, 0, zPos);

    const carMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, metalness: 0.5 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x020617 });

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 4.2), carMat);
    chassis.position.y = 0.55;
    group.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 2.2), glassMat);
    cabin.position.set(0, 1.15, -0.2);
    group.add(cabin);

    // 4 Wheels
    const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8);
    const wPositions = [
      [-1.0, 0.35, 1.3],
      [1.0, 0.35, 1.3],
      [-1.0, 0.35, -1.3],
      [1.0, 0.35, -1.3],
    ];
    for (const [wx, wy, wz] of wPositions) {
      const wheel = new THREE.Mesh(wGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      group.add(wheel);
    }

    return {
      mesh: group,
      pos: new THREE.Vector3(xPos, 0, zPos),
      speed: 16 + Math.random() * 10,
      lane,
      width: 2.0,
      length: 4.2,
      nearMissed: false,
    };
  };

  // Restart Handler
  const handleRestart = () => {
    setDistance(0);
    setNearMissCount(0);
    setSpeedKmh(120);
    setNitroGauge(80);
    setIsNitro(false);
    setLives(3);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();
    targetXRef.current = 0;

    if (threeRef.current) {
      threeRef.current.bikePos.set(0, 0, 0);
      threeRef.current.bikeGroup.position.set(0, 0, 0);
      threeRef.current.invincibleTimer = 0;
      // Respawn traffic cars
      for (let i = 0; i < threeRef.current.trafficCars.length; i++) {
        const car = threeRef.current.trafficCars[i];
        car.pos.z = 40 + i * 35;
        car.lane = Math.floor(Math.random() * 4);
        car.pos.x = (car.lane - 1.5) * LANE_WIDTH;
        car.mesh.position.copy(car.pos);
        car.nearMissed = false;
      }
    }
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Midnight metropolis sky
    scene.fog = new THREE.FogExp2(0x060913, 0.01);

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 180);
    camera.position.set(0, 2.8, -5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // City Highway Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    sunLight.position.set(10, 25, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 2 Tiling Road Segments for Seamless Infinite Highway
    const roadTex = createRoadTexture();
    const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 120);

    const roadSegments: THREE.Mesh[] = [];
    for (let i = 0; i < 2; i++) {
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0, i * 120 + 50);
      road.receiveShadow = true;
      scene.add(road);
      roadSegments.push(road);
    }

    // Skyscrapers alongside highway
    const buildings: THREE.Mesh[] = [];
    const bColors = [0x1e293b, 0x0f172a, 0x1e1b4b, 0x334155];
    for (let i = 0; i < 16; i++) {
      const h = 18 + Math.random() * 25;
      const bMat = new THREE.MeshLambertMaterial({ color: bColors[i % 4] });
      const bMeshL = new THREE.Mesh(new THREE.BoxGeometry(14, h, 14), bMat);
      bMeshL.position.set(-18, h / 2, i * 20);
      scene.add(bMeshL);
      buildings.push(bMeshL);

      const bMeshR = new THREE.Mesh(new THREE.BoxGeometry(14, h, 14), bMat);
      bMeshR.position.set(18, h / 2, i * 20);
      scene.add(bMeshR);
      buildings.push(bMeshR);
    }

    // 3D Superbike Model
    const bikeGroup = new THREE.Group();
    bikeGroup.position.set(0, 0, 0);

    const bikeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Neon cyan
      roughness: 0.15,
      metalness: 0.85,
    });
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x020617 });

    // Chassis Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 2.0), bikeMat);
    frame.position.y = 0.65;
    bikeGroup.add(frame);

    // Handlebars
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.1), new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
    bar.position.set(0, 1.05, 0.45);
    bikeGroup.add(bar);

    // Front Wheel
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.22, 12);
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.42, 0.95);
    bikeGroup.add(frontWheel);

    // Rear Wheel
    const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, 0.42, -0.95);
    bikeGroup.add(rearWheel);

    // Rider Helmet & Body
    const rider = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    rider.position.set(0, 1.35, 0);
    bikeGroup.add(rider);

    // Nitro Exhaust Blue Flame (Hidden by default)
    const flameGeo = new THREE.ConeGeometry(0.25, 1.4, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const exhaustFlame = new THREE.Mesh(flameGeo, flameMat);
    exhaustFlame.rotation.x = -Math.PI / 2;
    exhaustFlame.position.set(0, 0.5, -1.8);
    exhaustFlame.visible = false;
    bikeGroup.add(exhaustFlame);

    // Card Badge above Rider
    const badgeGeo = new THREE.PlaneGeometry(0.65, 0.82);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: createCardBadgeTexture(cardId),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 2.05, 0);
    bikeGroup.add(badge);

    scene.add(bikeGroup);

    // Spawn Initial Traffic Cars
    const trafficCars: TrafficVehicle[] = [];
    const carColors = [0xdc2626, 0xeab308, 0x16a34a, 0x9333ea, 0xf8fafc];
    for (let i = 0; i < 5; i++) {
      const c = createTrafficCar(carColors[i % carColors.length], i % 4, 45 + i * 32);
      scene.add(c.mesh);
      trafficCars.push(c);
    }

    // Stunt Ramp at Z = 120m
    const rampMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const rampGeo = new THREE.BoxGeometry(LANE_WIDTH * 0.9, 0.8, 4.0);
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.rotation.x = Math.atan2(0.8, 4.0);
    rampMesh.position.set(-LANE_WIDTH / 2, 0.4, 120);
    scene.add(rampMesh);

    threeRef.current = {
      scene,
      camera,
      renderer,
      bikeGroup,
      frontWheel,
      rearWheel,
      exhaustFlame,
      roadSegments,
      trafficCars,
      ramps: [{ mesh: rampMesh, pos: new THREE.Vector3(-LANE_WIDTH / 2, 0.4, 120) }],
      buildings,
      particles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
      bikePos: new THREE.Vector3(0, 0, 0),
      bikeVelY: 0,
      isAirborne: false,
      invincibleTimer: 0,
      cameraShake: 0,
    };

    // Main Game Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Speed calculation (Base: 28m/s ~ 100km/h, Nitro: 55m/s ~ 200km/h, Brake: 18m/s)
      let currentSpeed = 30.0;
      if (isNitroRef.current) {
        currentSpeed = 55.0;
        three.exhaustFlame.visible = true;
        three.exhaustFlame.scale.set(1.0 + Math.random() * 0.3, 1.0 + Math.random() * 0.5, 1.0);
      } else {
        three.exhaustFlame.visible = false;
        if (isBrakingRef.current) {
          currentSpeed = 16.0;
        }
      }

      setSpeedKmh(Math.round(currentSpeed * 3.6));

      // Distance increment
      const forwardMove = currentSpeed * delta;
      three.bikePos.z += forwardMove;
      setDistance(Math.min(TARGET_DISTANCE, Math.round(three.bikePos.z)));

      // Smooth Steering Lerp to targetX
      const curX = three.bikePos.x;
      const tX = targetXRef.current;
      const dX = tX - curX;
      three.bikePos.x += dX * delta * 7.5;
      three.bikePos.x = THREE.MathUtils.clamp(three.bikePos.x, -ROAD_WIDTH / 2 + 1.2, ROAD_WIDTH / 2 - 1.2);

      // Banking Tilt angle based on dX
      const targetRoll = THREE.MathUtils.clamp(-dX * 0.25, -0.4, 0.4);
      three.bikeGroup.rotation.z += (targetRoll - three.bikeGroup.rotation.z) * 0.15;

      // Wheel Spin rotation
      three.frontWheel.rotation.x += forwardMove * 2.5;
      three.rearWheel.rotation.x += forwardMove * 2.5;

      // Airborne Jump Physics
      if (three.isAirborne) {
        three.bikePos.y += three.bikeVelY * delta;
        three.bikeVelY -= 18.0 * delta; // Gravity

        if (three.bikePos.y <= 0) {
          three.bikePos.y = 0;
          three.isAirborne = false;
          three.cameraShake = 0.35;
          triggerSparks(three.bikePos.x, 0.2, three.bikePos.z, true);
        }
      }

      three.bikeGroup.position.copy(three.bikePos);

      // Invincibility Blink
      if (three.invincibleTimer > 0) {
        three.invincibleTimer -= delta;
        three.bikeGroup.visible = Math.floor(three.invincibleTimer * 10) % 2 === 0;
      } else {
        three.bikeGroup.visible = true;
      }

      // Infinite Tiling Road update
      for (const road of three.roadSegments) {
        if (road.position.z < three.bikePos.z - 60) {
          road.position.z += 240;
        }
      }

      // Infinite Buildings update
      for (const b of three.buildings) {
        if (b.position.z < three.bikePos.z - 30) {
          b.position.z += 160;
        }
      }

      // Ramp Jump Detection
      for (const r of three.ramps) {
        if (Math.abs(three.bikePos.z - r.pos.z) < 2.0 && Math.abs(three.bikePos.x - r.pos.x) < 1.8 && !three.isAirborne) {
          three.isAirborne = true;
          three.bikeVelY = 12.0; // Huge stunt jump!
          setScore((s) => s + 200);
          setEventBanner('🚀 스턴트 램프 공중 도약! (+200)');
          setTimeout(() => setEventBanner(null), 1200);
        }
        // Respawn ramp forward
        if (r.pos.z < three.bikePos.z - 20) {
          r.pos.z = three.bikePos.z + 180 + Math.random() * 80;
          r.pos.x = ((Math.floor(Math.random() * 4)) - 1.5) * LANE_WIDTH;
          r.mesh.position.copy(r.pos);
        }
      }

      // Update Traffic Cars
      for (const car of three.trafficCars) {
        car.pos.z += car.speed * delta;
        car.mesh.position.copy(car.pos);

        // Distance to player bike
        const dz = car.pos.z - three.bikePos.z;
        const dx = car.pos.x - three.bikePos.x;

        // Near Miss Detection: Passed vehicle within 1.4m X offset
        if (!car.nearMissed && dz < 1.0 && dz > -2.0 && Math.abs(dx) < 2.4 && Math.abs(dx) > 1.1) {
          car.nearMissed = true;
          triggerSparks(three.bikePos.x, 1.0, three.bikePos.z, true);

          const newNear = nearMissRef.current + 1;
          setNearMissCount(newNear);
          setScore((s) => s + 150);
          setEventBanner(`🔥 아슬아슬 칼치기! (${newNear}/5)`);
          setTimeout(() => setEventBanner(null), 1000);

          // Victory check on 5 Near Misses
          if (newNear >= 5 && !gameWon) {
            handleVictory();
          }
        }

        // Direct Crash Collision: Within 1.0m X and 2.2m Z
        if (Math.abs(dz) < 2.2 && Math.abs(dx) < 1.1 && !three.isAirborne && three.invincibleTimer <= 0) {
          // CRASH!
          three.invincibleTimer = 2.0;
          three.cameraShake = 0.7;
          triggerSparks(three.bikePos.x, 1.0, three.bikePos.z, false);

          const newLives = livesRef.current - 1;
          setLives(newLives);
          setEventBanner('⚠️ 차량 추돌 사고! (CRASH)');
          setTimeout(() => setEventBanner(null), 1200);

          if (newLives <= 0) {
            setGameOver(true);
            const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const reward = calculateAndDepositMissionReward({
              gameId: 'poki-real-city-bikes',
              gameTitle: 'Real City Bikes 3D',
              isVictory: false,
              score: scoreRef.current,
              maxTargetScore: 1000,
              durationSeconds: dur,
            });
            setRewardResult(reward);
          }
        }

        // Respawn car forward
        if (car.pos.z < three.bikePos.z - 30) {
          car.pos.z = three.bikePos.z + 120 + Math.random() * 80;
          car.lane = Math.floor(Math.random() * 4);
          car.pos.x = (car.lane - 1.5) * LANE_WIDTH;
          car.speed = 16 + Math.random() * 12;
          car.nearMissed = false;
        }
      }

      // Check Target Distance Victory
      if (three.bikePos.z >= TARGET_DISTANCE && !gameOver && !gameWon) {
        handleVictory();
      }

      // Camera Follows Bike
      const targetCamZ = three.bikePos.z - 5.5;
      const targetCamY = 2.8 + three.bikePos.y * 0.5;
      three.camera.position.z = targetCamZ;
      three.camera.position.y = targetCamY;
      three.camera.position.x = three.bikePos.x * 0.4;

      // Camera Shake
      if (three.cameraShake > 0) {
        three.camera.position.x += (Math.random() - 0.5) * three.cameraShake;
        three.camera.position.y += (Math.random() - 0.5) * three.cameraShake;
        three.cameraShake *= 0.88;
      }
      three.camera.lookAt(three.bikePos.x * 0.6, 1.2 + three.bikePos.y * 0.5, three.bikePos.z + 8.0);

      // Particles Physics
      if (three.particles && three.particleVels.length > 0) {
        const posA = three.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posA.array as Float32Array;
        for (let i = 0; i < three.particleVels.length; i++) {
          arr[i * 3] += three.particleVels[i].x * delta;
          arr[i * 3 + 1] += three.particleVels[i].y * delta;
          arr[i * 3 + 2] += three.particleVels[i].z * delta;
          three.particleVels[i].y -= 9.8 * delta;
        }
        posA.needsUpdate = true;
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
  }, [cardId, triggerSparks]);

  // Victory Handler
  const handleVictory = () => {
    setGameWon(true);
    triggerSparks(0, 2, distRef.current, true);
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const reward = calculateAndDepositMissionReward({
      gameId: 'poki-real-city-bikes',
      gameTitle: 'Real City Bikes 3D',
      isVictory: true,
      score: scoreRef.current + 500,
      maxTargetScore: 1000,
      durationSeconds: dur,
    });
    setRewardResult(reward);
  };

  // Touch Drag Steering
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const clientX = e.touches[0].clientX;
    const dx = clientX - touchStartXRef.current;
    targetXRef.current = THREE.MathUtils.clamp(targetXRef.current + dx * 0.04, -5.5, 5.5);
    touchStartXRef.current = clientX;
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle="REAL CITY BIKES 3D"
        onBack={handleExit}
        score={distance}
        targetScore={TARGET_DISTANCE}
      />

      {/* Distance, Speed & Near Miss Status Header */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        {/* Lives & Near Miss Badge */}
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3.5 py-2 flex items-center gap-3 shadow-xl">
          {/* Lives */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 mr-0.5">생명:</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <Shield
                key={i}
                className={`w-4 h-4 ${
                  i < lives ? 'text-sky-400 fill-sky-400' : 'text-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Near Misses */}
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
            <Sparkles className="w-4 h-4" /> 칼치기: {nearMissCount} / 5
          </div>
        </div>

        {/* Speedometer & Distance */}
        <div className="bg-slate-900/90 border border-sky-500/80 backdrop-blur-md px-4 py-2 text-right shadow-xl">
          <div className="text-[10px] text-slate-400">시속 (Speed)</div>
          <div className="text-base font-black text-sky-300 flex items-center gap-1">
            <Gauge className="w-4 h-4" /> {speedKmh} km/h
          </div>
        </div>
      </div>

      {/* Event Banner */}
      {eventBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-amber-500 text-slate-950 font-black px-6 py-1.5 border-2 border-yellow-200 text-sm md:text-base shadow-2xl uppercase">
            {eventBanner}
          </div>
        </div>
      )}

      {/* Bottom Steering Guide Tag */}
      <div className="absolute bottom-8 left-6 z-20 pointer-events-none bg-slate-900/80 border border-slate-700 px-3.5 py-2 rounded-sm text-center">
        <span className="text-[11px] text-sky-400 font-semibold block mb-0.5">
          ◀ 화면 터치 슬라이드 조향 ▶
        </span>
        <span className="text-[10px] text-slate-400">좌우로 드래그하여 차선을 변경하세요</span>
      </div>

      {/* Right Pure Touch NITRO & BRAKE Buttons */}
      <div className="absolute bottom-8 right-6 z-20 flex items-end gap-3 pointer-events-auto">
        {/* Brake Button (64px) */}
        <button
          onTouchStart={() => (isBrakingRef.current = true)}
          onTouchEnd={() => (isBrakingRef.current = false)}
          onMouseDown={() => (isBrakingRef.current = true)}
          onMouseUp={() => (isBrakingRef.current = false)}
          className="w-16 h-16 rounded-full bg-slate-800/90 border-2 border-slate-600 text-slate-300 flex flex-col items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <ShieldAlert className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">감속</span>
        </button>

        {/* Primary NITRO Button (76px) */}
        <button
          onTouchStart={() => setIsNitro(true)}
          onTouchEnd={() => setIsNitro(false)}
          onMouseDown={() => setIsNitro(true)}
          onMouseUp={() => setIsNitro(false)}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 border-2 border-yellow-200 text-slate-950 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform font-black animate-pulse"
        >
          <Flame className="w-7 h-7 mb-0.5" />
          <span className="text-xs tracking-wider">니트로</span>
        </button>
      </div>

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">바이크 파손</h2>
            <p className="text-xs text-slate-300 mb-4">
              차량과의 연쇄 추돌로 인해 주행을 완주하지 못했습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-sm flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> 재도전
              </button>
              <button
                onClick={handleExit}
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
          onClose={handleExit}
        />
      )}
    </div>
  );
}

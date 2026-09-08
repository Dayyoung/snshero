import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Flame, ShieldAlert, Sparkles, Zap, Heart, RotateCcw } from 'lucide-react';

interface PokiDinoSimulatorGameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

interface PreyEntity {
  group: THREE.Group;
  type: 'herbivore' | 'raptor';
  hp: number;
  maxHp: number;
  vx: number;
  vz: number;
  state: 'idle' | 'flee' | 'chase' | 'stunned';
  stunTimer: number;
  scale: number;
}

interface MeatDrop {
  mesh: THREE.Mesh;
  rotY: number;
}

export const PokiDinoSimulatorGame: React.FC<PokiDinoSimulatorGameProps> = ({
  onBack,
  cardId = 57,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI States
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(100);
  const [rage, setRage] = useState(30);
  const [huntCount, setHuntCount] = useState(0);
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Joystick state
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickBase, setJoystickBase] = useState({ x: 0, y: 0 });
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const inputDirRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs for tracking
  const startTimeRef = useRef<number>(Date.now());
  const scoreRef = useRef<number>(0);
  const hpRef = useRef<number>(100);
  const rageRef = useRef<number>(30);

  useEffect(() => {
    scoreRef.current = score;
    hpRef.current = hp;
    rageRef.current = rage;
  }, [score, hp, rage]);

  // Three.js Context
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    dinoGroup: THREE.Group;
    dinoJaw: THREE.Mesh;
    dinoTail: THREE.Group;
    dinoLeftLeg: THREE.Group;
    dinoRightLeg: THREE.Group;
    roarShockwave: THREE.Mesh;
    entities: PreyEntity[];
    meats: MeatDrop[];
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
    isBiting: boolean;
    biteTimer: number;
    isSwiping: boolean;
    swipeTimer: number;
    isRoaring: boolean;
    roarTimer: number;
    walkCycle: number;
    cameraFollowPos: THREE.Vector3;
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

  // Helper: Prehistoric Ground Texture
  const createGroundTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = '#3a2d1d';
    ctx.fillRect(0, 0, 512, 512);

    // Patches of primitive dark green moss
    ctx.fillStyle = '#223c1c';
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const rad = 25 + Math.random() * 60;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dirt pebble details
    ctx.fillStyle = '#5c4832';
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  };

  // Trigger Meat Sparkle Particles
  const triggerBiteSparkles = useCallback((x: number, y: number, z: number) => {
    const three = threeRef.current;
    if (!three) return;

    const count = 35;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 1] = y + Math.random() * 1.0;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.8;

      col[i * 3] = 0.9;
      col[i * 3 + 1] = 0.15;
      col[i * 3 + 2] = 0.15;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        2.5 + Math.random() * 4,
        (Math.random() - 0.5) * 4
      ));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    if (three.particles) {
      three.scene.remove(three.particles);
    }
    three.particles = new THREE.Points(geo, mat);
    three.particleVels = vels;
    three.scene.add(three.particles);
  }, []);

  // Drop Meat
  const spawnMeat = (x: number, z: number) => {
    const three = threeRef.current;
    if (!three) return;

    const meatGeo = new THREE.DodecahedronGeometry(0.45);
    const meatMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x450a0a,
      emissiveIntensity: 0.5,
    });
    const meatMesh = new THREE.Mesh(meatGeo, meatMat);
    meatMesh.position.set(x, 0.45, z);
    three.scene.add(meatMesh);
    three.meats.push({ mesh: meatMesh, rotY: 0 });
  };

  // Perform Bite Attack
  const handleBite = () => {
    const three = threeRef.current;
    if (!three || three.isBiting || gameOver || gameWon) return;

    three.isBiting = true;
    three.biteTimer = 0;
    three.cameraShake = 0.3;

    if (navigator.vibrate) navigator.vibrate([40, 20, 60]);

    // Attack Hitbox in front of T-Rex
    const tPos = three.dinoGroup.position;
    const tRot = three.dinoGroup.rotation.y;
    const attackReach = 2.8;
    const attackX = tPos.x - Math.sin(tRot) * attackReach;
    const attackZ = tPos.z - Math.cos(tRot) * attackReach;

    let hitSomething = false;

    // Check preys
    for (let i = three.entities.length - 1; i >= 0; i--) {
      const ent = three.entities[i];
      const dist = Math.hypot(ent.group.position.x - attackX, ent.group.position.z - attackZ);
      if (dist < 2.2) {
        hitSomething = true;
        ent.hp -= 40;
        ent.state = 'stunned';
        ent.stunTimer = 1.0;
        triggerBiteSparkles(ent.group.position.x, 1.2, ent.group.position.z);

        if (ent.hp <= 0) {
          // Hunted!
          spawnMeat(ent.group.position.x, ent.group.position.z);
          three.scene.remove(ent.group);
          three.entities.splice(i, 1);

          const gain = ent.type === 'herbivore' ? 120 : 220;
          const newScore = scoreRef.current + gain;
          setScore(newScore);
          setHuntCount((c) => c + 1);
          setEventBanner(ent.type === 'herbivore' ? '초식공룡 사냥 성공! (+120)' : '위험한 랩터 제압! (+220)');
          setTimeout(() => setEventBanner(null), 1500);

          setRage((r) => Math.min(100, r + 25));

          // Check 1000 score victory
          if (newScore >= 1000) {
            handleVictory(newScore);
          }
        }
      }
    }

    if (!hitSomething) {
      setRage((r) => Math.min(100, r + 5));
    }
  };

  // Perform Tail Swipe
  const handleTailSwipe = () => {
    const three = threeRef.current;
    if (!three || three.isSwiping || gameOver || gameWon) return;

    three.isSwiping = true;
    three.swipeTimer = 0;
    three.cameraShake = 0.45;

    if (navigator.vibrate) navigator.vibrate([60, 30, 90]);

    const tPos = three.dinoGroup.position;
    // 360 degree knockback around T-Rex (radius 3.5m)
    for (const ent of three.entities) {
      const dist = Math.hypot(ent.group.position.x - tPos.x, ent.group.position.z - tPos.z);
      if (dist < 4.0) {
        ent.hp -= 25;
        ent.state = 'stunned';
        ent.stunTimer = 1.5;

        // Knockback vector
        const angle = Math.atan2(ent.group.position.x - tPos.x, ent.group.position.z - tPos.z);
        ent.group.position.x += Math.sin(angle) * 2.5;
        ent.group.position.z += Math.cos(angle) * 2.5;

        triggerBiteSparkles(ent.group.position.x, 1.0, ent.group.position.z);
      }
    }

    setEventBanner('강력한 꼬리치기 넉백!');
    setTimeout(() => setEventBanner(null), 1200);
  };

  // Perform Roar
  const handleRoar = () => {
    const three = threeRef.current;
    if (!three || rageRef.current < 100 || three.isRoaring || gameOver || gameWon) return;

    three.isRoaring = true;
    three.roarTimer = 0;
    three.cameraShake = 0.8;
    setRage(0);

    if (navigator.vibrate) navigator.vibrate([100, 50, 150, 50, 200]);

    three.roarShockwave.visible = true;
    three.roarShockwave.scale.set(0.1, 0.1, 0.1);
    three.roarShockwave.position.copy(three.dinoGroup.position);
    three.roarShockwave.position.y = 0.2;

    // Stun all enemies on map!
    for (const ent of three.entities) {
      ent.state = 'stunned';
      ent.stunTimer = 3.5;
    }

    setEventBanner('👑 티라노의 제왕 포효! (전원 공포 마비)');
    setTimeout(() => setEventBanner(null), 2000);
  };

  // Handle Victory
  const handleVictory = (finalScore: number) => {
    setGameWon(true);
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const reward = calculateAndDepositMissionReward({
      gameId: 'poki-dino-simulator',
      gameTitle: 'Dino Simulator 3D',
      isVictory: true,
      score: finalScore,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardResult(reward);
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Prehistoric Sunset Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2d1b0e); // Dark primordial sunset
    scene.fog = new THREE.FogExp2(0x2d1b0e, 0.018);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 120);
    camera.position.set(0, 5.5, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Primordial Lighting
    const ambientLight = new THREE.AmbientLight(0xfed7aa, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xf97316, 1.4);
    sunLight.position.set(20, 30, -20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Volcanic Glow Point Light in distance
    const volcanoLight = new THREE.PointLight(0xef4444, 3.5, 70);
    volcanoLight.position.set(0, 15, -45);
    scene.add(volcanoLight);

    // 60x60m Prehistoric Ground
    const groundGeo = new THREE.PlaneGeometry(70, 70);
    const groundMat = new THREE.MeshLambertMaterial({ map: createGroundTexture() });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Distant Volcano Cone
    const volcanoGeo = new THREE.ConeGeometry(24, 28, 16, 1, true);
    const volcanoMat = new THREE.MeshLambertMaterial({ color: 0x1c1917 });
    const volcano = new THREE.Mesh(volcanoGeo, volcanoMat);
    volcano.position.set(0, 10, -50);
    scene.add(volcano);

    const lavaCaldera = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, 16),
      new THREE.MeshBasicMaterial({ color: 0xff3b00 })
    );
    lavaCaldera.rotation.x = -Math.PI / 2;
    lavaCaldera.position.set(0, 23.8, -50);
    scene.add(lavaCaldera);

    // Central Oasis Lake (Safe recovery zone)
    const oasisGeo = new THREE.CircleGeometry(6.5, 32);
    const oasisMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const oasis = new THREE.Mesh(oasisGeo, oasisMat);
    oasis.rotation.x = -Math.PI / 2;
    oasis.position.set(0, 0.02, -5);
    scene.add(oasis);

    // Primordial Trees & Ferns
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x1b4332 });
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 14 + Math.random() * 16;
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;

      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 6, 8), trunkMat);
      trunk.position.y = 3;
      tree.add(trunk);

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.8, 5, 8), leavesMat);
      canopy.position.y = 7;
      tree.add(canopy);

      scene.add(tree);
    }

    // Giant Dinosaur Fossil Rib Arch
    const boneMat = new THREE.MeshLambertMaterial({ color: 0xf5ebe0 });
    const ribArch = new THREE.Group();
    ribArch.position.set(12, 0, 5);
    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.22, 8, 16, Math.PI), boneMat);
      rib.rotation.z = Math.PI;
      rib.position.z = i * 1.2;
      ribArch.add(rib);
    }
    scene.add(ribArch);

    // Roar Shockwave Ring
    const shockGeo = new THREE.RingGeometry(0.8, 1.2, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const roarShockwave = new THREE.Mesh(shockGeo, shockMat);
    roarShockwave.rotation.x = -Math.PI / 2;
    roarShockwave.visible = false;
    scene.add(roarShockwave);

    // 3D T-Rex Player Model
    const dinoGroup = new THREE.Group();
    dinoGroup.position.set(0, 0, 18); // Safe South spawn 18m

    const tRexSkinMat = new THREE.MeshLambertMaterial({ color: 0x2d4a22 }); // Dark emerald moss
    const tRexUnderMat = new THREE.MeshLambertMaterial({ color: 0xa3a368 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Torso & Hips
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 2.4), tRexSkinMat);
    body.position.set(0, 2.0, 0);
    dinoGroup.add(body);

    const belly = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 2.0), tRexUnderMat);
    belly.position.set(0, 1.6, 0);
    dinoGroup.add(belly);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 1.0), tRexSkinMat);
    neck.position.set(0, 2.7, -1.3);
    neck.rotation.x = -0.3;
    dinoGroup.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.9, 1.6), tRexSkinMat);
    head.position.set(0, 3.2, -2.1);
    dinoGroup.add(head);

    // Eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
    leftEye.position.set(-0.5, 3.4, -2.3);
    dinoGroup.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
    rightEye.position.set(0.5, 3.4, -2.3);
    dinoGroup.add(rightEye);

    // Lower Jaw (Animated during BITE)
    const jawGeo = new THREE.BoxGeometry(0.85, 0.35, 1.3);
    const dinoJaw = new THREE.Mesh(jawGeo, tRexUnderMat);
    dinoJaw.position.set(0, 2.65, -2.2);
    dinoGroup.add(dinoJaw);

    // Card No.057 Hero Badge above T-Rex
    const badgeGeo = new THREE.PlaneGeometry(0.8, 1.0);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: createCardBadgeTexture(cardId),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 4.4, -1.8);
    dinoGroup.add(badge);

    // Tail Group (Multi-segment)
    const dinoTail = new THREE.Group();
    dinoTail.position.set(0, 2.1, 1.2);
    const tailSeg1 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 2.4, 8), tRexSkinMat);
    tailSeg1.rotation.x = Math.PI / 2;
    tailSeg1.position.z = 1.1;
    dinoTail.add(tailSeg1);
    dinoGroup.add(dinoTail);

    // Strong Legs
    const legGeo = new THREE.BoxGeometry(0.45, 1.4, 0.6);
    const footGeo = new THREE.BoxGeometry(0.55, 0.25, 0.9);

    const dinoLeftLeg = new THREE.Group();
    dinoLeftLeg.position.set(-0.85, 1.2, 0.2);
    const lLegMesh = new THREE.Mesh(legGeo, tRexSkinMat);
    const lFootMesh = new THREE.Mesh(footGeo, tRexSkinMat);
    lFootMesh.position.set(0, -0.65, 0.2);
    dinoLeftLeg.add(lLegMesh);
    dinoLeftLeg.add(lFootMesh);
    dinoGroup.add(dinoLeftLeg);

    const dinoRightLeg = new THREE.Group();
    dinoRightLeg.position.set(0.85, 1.2, 0.2);
    const rLegMesh = new THREE.Mesh(legGeo, tRexSkinMat);
    const rFootMesh = new THREE.Mesh(footGeo, tRexSkinMat);
    rFootMesh.position.set(0, -0.65, 0.2);
    dinoRightLeg.add(rLegMesh);
    dinoRightLeg.add(rFootMesh);
    dinoGroup.add(dinoRightLeg);

    scene.add(dinoGroup);

    // Prehistoric Entities (5 Herbivores + 3 Raptors)
    const entities: PreyEntity[] = [];

    const herbMat = new THREE.MeshLambertMaterial({ color: 0x475569 }); // Slate Gallimimus
    const raptorMat = new THREE.MeshLambertMaterial({ color: 0xd97706 }); // Amber fast raptor

    const spawnEntity = (type: 'herbivore' | 'raptor', x: number, z: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);

      if (type === 'herbivore') {
        // Gallimimus
        const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.4), herbMat);
        hBody.position.y = 1.2;
        g.add(hBody);

        const hNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 8), herbMat);
        hNeck.position.set(0, 2.0, -0.6);
        hNeck.rotation.x = -0.2;
        g.add(hNeck);

        const hHead = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), herbMat);
        hHead.position.set(0, 2.7, -0.8);
        g.add(hHead);

        entities.push({
          group: g,
          type: 'herbivore',
          hp: 60,
          maxHp: 60,
          vx: (Math.random() - 0.5) * 2,
          vz: (Math.random() - 0.5) * 2,
          state: 'idle',
          stunTimer: 0,
          scale: 1.0,
        });
      } else {
        // Raptor
        const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 1.2), raptorMat);
        rBody.position.y = 0.9;
        g.add(rBody);

        const rHead = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.7), raptorMat);
        rHead.position.set(0, 1.5, -0.7);
        g.add(rHead);

        entities.push({
          group: g,
          type: 'raptor',
          hp: 80,
          maxHp: 80,
          vx: 0,
          vz: 0,
          state: 'idle',
          stunTimer: 0,
          scale: 0.9,
        });
      }

      scene.add(g);
    };

    // Spawn 5 Herbivores around map
    for (let i = 0; i < 5; i++) {
      spawnEntity('herbivore', (Math.random() - 0.5) * 36, (Math.random() - 0.5) * 30);
    }

    // Spawn 3 Raptors patrolling outer borders
    spawnEntity('raptor', -18, -12);
    spawnEntity('raptor', 18, -10);
    spawnEntity('raptor', 0, -22);

    threeRef.current = {
      scene,
      camera,
      renderer,
      dinoGroup,
      dinoJaw,
      dinoTail,
      dinoLeftLeg,
      dinoRightLeg,
      roarShockwave,
      entities,
      meats: [],
      particles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
      isBiting: false,
      biteTimer: 0,
      isSwiping: false,
      swipeTimer: 0,
      isRoaring: false,
      roarTimer: 0,
      walkCycle: 0,
      cameraFollowPos: new THREE.Vector3(0, 5.5, 26),
      cameraShake: 0,
    };

    // Main Game Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Dino Input Movement
      const inp = inputDirRef.current;
      const isMoving = Math.hypot(inp.x, inp.y) > 0.1;
      const speed = 7.5;

      if (isMoving && !three.isSwiping) {
        // Screen-relative movement direction (inp.x = right, -inp.y = forward)
        const moveX = inp.x * speed * delta;
        const moveZ = inp.y * speed * delta;

        three.dinoGroup.position.x += moveX;
        three.dinoGroup.position.z += moveZ;

        // Keep inside 60x60 boundary
        three.dinoGroup.position.x = Math.max(-28, Math.min(28, three.dinoGroup.position.x));
        three.dinoGroup.position.z = Math.max(-28, Math.min(28, three.dinoGroup.position.z));

        // Face movement angle
        const targetRot = Math.atan2(-inp.x, -inp.y);
        three.dinoGroup.rotation.y = targetRot;

        // Walk cycle leg swings
        three.walkCycle += delta * 8.5;
        three.dinoLeftLeg.rotation.x = Math.sin(three.walkCycle) * 0.45;
        three.dinoRightLeg.rotation.x = -Math.sin(three.walkCycle) * 0.45;
        three.dinoTail.rotation.y = Math.sin(three.walkCycle * 0.7) * 0.25;
      } else {
        three.dinoLeftLeg.rotation.x *= 0.8;
        three.dinoRightLeg.rotation.x *= 0.8;
        three.dinoTail.rotation.y *= 0.9;
      }

      // Oasis Lake Regeneration
      const lakeDist = Math.hypot(three.dinoGroup.position.x - 0, three.dinoGroup.position.z - (-5));
      if (lakeDist < 6.5) {
        setHp((h) => Math.min(100, h + delta * 8));
      }

      // Bite Animation
      if (three.isBiting) {
        three.biteTimer += delta * 12;
        three.dinoJaw.position.y = 2.65 - Math.sin(three.biteTimer) * 0.45;
        if (three.biteTimer >= Math.PI) {
          three.isBiting = false;
          three.dinoJaw.position.y = 2.65;
        }
      }

      // Tail Swipe 360 Spin
      if (three.isSwiping) {
        three.swipeTimer += delta * 9;
        three.dinoGroup.rotation.y += delta * 18;
        three.dinoTail.rotation.y = 0.8;
        if (three.swipeTimer >= Math.PI * 2) {
          three.isSwiping = false;
        }
      }

      // Roar Shockwave Expand
      if (three.isRoaring) {
        three.roarTimer += delta * 2.5;
        const s = three.roarTimer * 18;
        three.roarShockwave.scale.set(s, s, s);
        if (three.roarTimer >= 1.0) {
          three.isRoaring = false;
          three.roarShockwave.visible = false;
        }
      }

      // Update Meat Pickups
      const tPos = three.dinoGroup.position;
      for (let i = three.meats.length - 1; i >= 0; i--) {
        const m = three.meats[i];
        m.rotY += delta * 3;
        m.mesh.rotation.y = m.rotY;

        const dist = Math.hypot(tPos.x - m.mesh.position.x, tPos.z - m.mesh.position.z);
        if (dist < 2.0) {
          // Eat Meat
          three.scene.remove(m.mesh);
          three.meats.splice(i, 1);
          setHp((h) => Math.min(100, h + 25));
          setScore((s) => s + 50);
          if (navigator.vibrate) navigator.vibrate(50);
        }
      }

      // Update Prehistoric AI Entities
      for (const ent of three.entities) {
        // Stun cooldown
        if (ent.stunTimer > 0) {
          ent.stunTimer -= delta;
          ent.group.position.y = Math.sin(ent.stunTimer * 20) * 0.1;
          continue;
        }

        const ePos = ent.group.position;
        const distToPlayer = Math.hypot(tPos.x - ePos.x, tPos.z - ePos.z);

        if (ent.type === 'herbivore') {
          // Flee if T-Rex gets close (< 8m)
          if (distToPlayer < 8.0) {
            ent.state = 'flee';
            const fleeAngle = Math.atan2(ePos.x - tPos.x, ePos.z - tPos.z);
            ent.vx = Math.sin(fleeAngle) * 5.0;
            ent.vz = Math.cos(fleeAngle) * 5.0;
            ent.group.rotation.y = fleeAngle;
          } else {
            ent.state = 'idle';
            if (Math.random() < 0.02) {
              ent.vx = (Math.random() - 0.5) * 1.5;
              ent.vz = (Math.random() - 0.5) * 1.5;
              ent.group.rotation.y = Math.atan2(ent.vx, ent.vz);
            }
          }
        } else {
          // Raptor AI: Chase and attack if within 12m
          if (distToPlayer < 12.0) {
            ent.state = 'chase';
            const chaseAngle = Math.atan2(tPos.x - ePos.x, tPos.z - ePos.z);
            ent.vx = Math.sin(chaseAngle) * 4.5;
            ent.vz = Math.cos(chaseAngle) * 4.5;
            ent.group.rotation.y = chaseAngle;

            // Attack T-Rex if in range
            if (distToPlayer < 1.8) {
              // Claw attack!
              setHp((h) => {
                const nh = h - delta * 12;
                if (nh <= 0) {
                  setGameOver(true);
                  const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
                  const reward = calculateAndDepositMissionReward({
                    gameId: 'poki-dino-simulator',
                    gameTitle: 'Dino Simulator 3D',
                    isVictory: false,
                    score: scoreRef.current,
                    maxTargetScore: 1000,
                    durationSeconds: dur,
                  });
                  setRewardResult(reward);
                }
                return Math.max(0, nh);
              });
              if (navigator.vibrate) navigator.vibrate(30);
            }
          } else {
            ent.state = 'idle';
          }
        }

        ePos.x += ent.vx * delta;
        ePos.z += ent.vz * delta;

        // Keep inside bounds
        ePos.x = Math.max(-28, Math.min(28, ePos.x));
        ePos.z = Math.max(-28, Math.min(28, ePos.z));
      }

      // Camera Follow TPS Lerp
      three.cameraFollowPos.set(
        tPos.x,
        tPos.y + 6.0,
        tPos.z + 10.5
      );
      three.camera.position.lerp(three.cameraFollowPos, 0.08);

      // Camera Shake
      if (three.cameraShake > 0) {
        three.camera.position.x += (Math.random() - 0.5) * three.cameraShake;
        three.camera.position.y += (Math.random() - 0.5) * three.cameraShake;
        three.cameraShake *= 0.88;
      }

      three.camera.lookAt(tPos.x, tPos.y + 2.0, tPos.z - 2.0);

      // Sparkles / Meat particle physics
      if (three.particles && three.particleVels.length > 0) {
        const posAttr = three.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < three.particleVels.length; i++) {
          arr[i * 3] += three.particleVels[i].x * delta;
          arr[i * 3 + 1] += three.particleVels[i].y * delta;
          arr[i * 3 + 2] += three.particleVels[i].z * delta;
          three.particleVels[i].y -= 9.8 * delta;
        }
        posAttr.needsUpdate = true;
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
  }, [cardId]);

  // Floating Joystick Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle if touch is on left half
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth * 0.55) {
      setJoystickActive(true);
      setJoystickBase({ x: touch.clientX, y: touch.clientY });
      setJoystickPos({ x: touch.clientX, y: touch.clientY });
      inputDirRef.current = { x: 0, y: 0 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.clientX < window.innerWidth * 0.6) {
        const dx = touch.clientX - joystickBase.x;
        const dy = touch.clientY - joystickBase.y;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 50;

        if (dist > maxRadius) {
          setJoystickPos({
            x: joystickBase.x + (dx / dist) * maxRadius,
            y: joystickBase.y + (dy / dist) * maxRadius,
          });
        } else {
          setJoystickPos({ x: touch.clientX, y: touch.clientY });
        }

        inputDirRef.current = {
          x: Math.max(-1, Math.min(1, dx / maxRadius)),
          y: Math.max(-1, Math.min(1, dy / maxRadius)),
        };
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    inputDirRef.current = { x: 0, y: 0 };
  };

  const handleRestart = () => {
    setScore(0);
    setHp(100);
    setRage(30);
    setHuntCount(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();

    if (threeRef.current) {
      threeRef.current.dinoGroup.position.set(0, 0, 18);
      threeRef.current.dinoGroup.rotation.set(0, 0, 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-stone-950 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle="DINO SIMULATOR 3D"
        onBack={onBack}
        score={score}
        targetScore={1000}
      />

      {/* T-Rex Status HUD Bars */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="bg-stone-900/90 border border-stone-700/80 backdrop-blur-md p-2.5 rounded-none shadow-xl flex flex-col gap-1.5 min-w-[180px]">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <div className="flex-1 bg-stone-950 h-3 border border-stone-700 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-600 to-emerald-500 h-full transition-all duration-150"
                style={{ width: `${hp}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-stone-200">{Math.round(hp)} HP</span>
          </div>

          {/* Rage / Roar Bar */}
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <div className="flex-1 bg-stone-950 h-2.5 border border-stone-700 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all duration-150"
                style={{ width: `${rage}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-amber-400">{Math.round(rage)}%</span>
          </div>
        </div>

        {/* Hunt Count Badge */}
        <div className="bg-stone-900/90 border border-amber-600/70 backdrop-blur-md px-3.5 py-2 text-right">
          <div className="text-[10px] text-stone-400">사냥한 공룡</div>
          <div className="text-base font-black text-amber-400">{huntCount} 마리</div>
        </div>
      </div>

      {/* Dynamic Event Banner */}
      {eventBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-emerald-600 text-stone-950 font-black px-5 py-1.5 border-2 border-emerald-300 text-sm md:text-base shadow-2xl">
            {eventBanner}
          </div>
        </div>
      )}

      {/* Floating Joystick Visualizer */}
      {joystickActive && (
        <div
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: joystickBase.x, top: joystickBase.y }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-amber-500/50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-amber-500 shadow-lg"
              style={{
                transform: `translate(${joystickPos.x - joystickBase.x}px, ${joystickPos.y - joystickBase.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Right Pure Touch Action Controls */}
      <div className="absolute bottom-8 right-6 z-20 flex items-end gap-3 pointer-events-auto">
        {/* Roar Button */}
        <button
          onClick={handleRoar}
          disabled={rage < 100}
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl transition-transform active:scale-95 ${
            rage >= 100
              ? 'bg-amber-500 border-yellow-200 text-stone-950 font-black animate-pulse'
              : 'bg-stone-900/80 border-stone-700 text-stone-500 opacity-60'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">포효</span>
        </button>

        {/* Tail Swipe Button */}
        <button
          onClick={handleTailSwipe}
          className="w-16 h-16 rounded-full bg-stone-800/90 border-2 border-emerald-500/80 text-emerald-400 flex flex-col items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <RotateCcw className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">꼬리치기</span>
        </button>

        {/* Primary Bite Button (76px) */}
        <button
          onClick={handleBite}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-700 to-rose-500 border-2 border-rose-300 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform font-black"
        >
          <Sparkles className="w-6 h-6 mb-0.5" />
          <span className="text-xs tracking-wider">물어뜯기</span>
        </button>
      </div>

      {/* Central Oasis Guide Tag */}
      <div className="absolute bottom-2 left-6 z-10 text-[11px] text-stone-400 pointer-events-none">
        💡 푸른 오아시스 호수에 머무르면 T-Rex 체력이 재생됩니다.
      </div>

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">T-Rex 탈진</h2>
            <p className="text-xs text-stone-300 mb-4">
              라이벌 포식자들의 습격으로 선사시대 생존에 실패했습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs uppercase rounded-sm"
              >
                다시 생존 도전
              </button>
              <button
                onClick={onBack}
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
          onClose={onBack}
        />
      )}
    </div>
  );
};

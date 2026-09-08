import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Crosshair, RotateCcw, Shield, Zap, Sparkles, Skull } from 'lucide-react';

interface PokiGunsGunsGunsGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

type WeaponType = 'RIFLE' | 'SHOTGUN';

interface EnemyData {
  id: number;
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  hpBarMesh: THREE.Mesh;
  shootCooldown: number;
  isDead: boolean;
  baseX: number;
  baseZ: number;
  patrolAngle: number;
}

interface BulletData {
  mesh: THREE.Mesh;
  origin: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  isEnemy: boolean;
  damage: number;
}

interface BarrelData {
  mesh: THREE.Group;
  hp: number;
  x: number;
  z: number;
  exploded: boolean;
}

export const PokiGunsGunsGunsGame: React.FC<PokiGunsGunsGunsGameProps> = ({
  onBack,
  onExit,
  cardId = 23,
  deck,
  lowSpecMode = false,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => {});
  const playerHeroId = deck?.[0]?.id || cardId || 23;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI State
  const [kills, setKills] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo, setMaxAmmo] = useState(30);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('RIFLE');
  const [isReloading, setIsReloading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Time & Score tracking
  const startTimeRef = useRef<number>(Date.now());
  const killsRef = useRef<number>(0);

  // Dynamic Floating Joystick State
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickTouchIdRef = useRef<number | null>(null);
  const aimTouchIdRef = useRef<number | null>(null);

  // Player & Game Internal State Ref
  const internalStateRef = useRef<{
    playerPos: THREE.Vector3;
    playerAngle: number;
    moveDir: { x: number; z: number };
    hp: number;
    ammo: { RIFLE: number; SHOTGUN: number };
    weapon: WeaponType;
    isFiring: boolean;
    lastFireTime: number;
    isReloading: boolean;
    bullets: BulletData[];
    enemies: EnemyData[];
    barrels: BarrelData[];
    covers: { minX: number; maxX: number; minZ: number; maxZ: number }[];
    flashLight: THREE.PointLight | null;
  }>({
    playerPos: new THREE.Vector3(-11, 0, 0), // Spawn at western safe bunker
    playerAngle: 0,
    moveDir: { x: 0, z: 0 },
    hp: 100,
    ammo: { RIFLE: 30, SHOTGUN: 8 },
    weapon: 'RIFLE',
    isFiring: false,
    lastFireTime: 0,
    isReloading: false,
    bullets: [],
    enemies: [],
    barrels: [],
    covers: [],
    flashLight: null,
  });

  // Three.js Scene References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerMesh: THREE.Group;
    muzzleFlash: THREE.Mesh;
    bulletGeo: THREE.BufferGeometry;
    bulletMat: THREE.Material;
    enemyBulletMat: THREE.Material;
    animFrameId: number;
  } | null>(null);

  // Weapon Switcher
  const handleSwitchWeapon = useCallback(() => {
    const s = internalStateRef.current;
    if (s.isReloading) return;
    const nextW: WeaponType = s.weapon === 'RIFLE' ? 'SHOTGUN' : 'RIFLE';
    s.weapon = nextW;
    setCurrentWeapon(nextW);
    setAmmo(s.ammo[nextW]);
    setMaxAmmo(nextW === 'RIFLE' ? 30 : 8);
    if (navigator.vibrate) navigator.vibrate(20);
  }, []);

  // Reload Logic
  const handleReload = useCallback(() => {
    const s = internalStateRef.current;
    const max = s.weapon === 'RIFLE' ? 30 : 8;
    if (s.isReloading || s.ammo[s.weapon] >= max) return;

    s.isReloading = true;
    setIsReloading(true);
    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      s.ammo[s.weapon] = max;
      s.isReloading = false;
      setIsReloading(false);
      setAmmo(max);
      if (navigator.vibrate) navigator.vibrate([20, 20]);
    }, 1200);
  }, []);

  // Fire Weapon Logic
  const triggerFire = useCallback(() => {
    const s = internalStateRef.current;
    const three = threeRef.current;
    if (!three || s.hp <= 0 || s.isReloading) return;

    const now = performance.now();
    const cooldown = s.weapon === 'RIFLE' ? 140 : 650;
    if (now - s.lastFireTime < cooldown) return;

    if (s.ammo[s.weapon] <= 0) {
      handleReload();
      return;
    }

    s.lastFireTime = now;
    s.ammo[s.weapon]--;
    setAmmo(s.ammo[s.weapon]);

    if (navigator.vibrate) {
      navigator.vibrate(s.weapon === 'SHOTGUN' ? 45 : 20);
    }

    // Muzzle flash visual
    three.muzzleFlash.visible = true;
    if (s.flashLight) s.flashLight.intensity = 3;
    setTimeout(() => {
      if (threeRef.current) threeRef.current.muzzleFlash.visible = false;
      if (internalStateRef.current.flashLight) internalStateRef.current.flashLight.intensity = 0;
    }, 50);

    // Spawn Bullets
    const spawnPos = s.playerPos.clone().add(new THREE.Vector3(0, 0.8, 0));
    const forward = new THREE.Vector3(
      Math.sin(s.playerAngle),
      0,
      Math.cos(s.playerAngle)
    ).normalize();
    spawnPos.add(forward.clone().multiplyScalar(1.0));

    if (s.weapon === 'RIFLE') {
      // 1 precise rifle round
      const bulletMesh = new THREE.Mesh(three.bulletGeo, three.bulletMat);
      bulletMesh.position.copy(spawnPos);
      bulletMesh.rotation.y = s.playerAngle;
      three.scene.add(bulletMesh);

      s.bullets.push({
        mesh: bulletMesh,
        origin: spawnPos.clone(),
        velocity: forward.clone().multiplyScalar(45),
        life: 0.8,
        isEnemy: false,
        damage: 28,
      });
    } else {
      // 5 shotgun pellets spread
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = s.playerAngle + (i * Math.PI) / 22;
        const dir = new THREE.Vector3(Math.sin(spreadAngle), 0, Math.cos(spreadAngle)).normalize();

        const bulletMesh = new THREE.Mesh(three.bulletGeo, three.bulletMat);
        bulletMesh.position.copy(spawnPos);
        bulletMesh.rotation.y = spreadAngle;
        three.scene.add(bulletMesh);

        s.bullets.push({
          mesh: bulletMesh,
          origin: spawnPos.clone(),
          velocity: dir.multiplyScalar(38),
          life: 0.5,
          isEnemy: false,
          damage: 18,
        });
      }
    }
  }, [handleReload]);

  // Give up / quit with standardized reward
  const handleGiveUp = useCallback(() => {
    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_gunsgunsguns',
      gameTitle: 'Guns Guns Guns 3D',
      durationSeconds: duration,
      score: killsRef.current * 200,
      maxTargetScore: 1000,
      isVictory: false,
    });
    setRewardResult(receipt);
    setGameOver(true);
  }, []);

  // Initialize Three.js Scene and World
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b); // Dark military tactical atmosphere
    scene.fog = new THREE.FogExp2(0x1e293b, 0.018);

    // 2. Camera (Quarter-view tracking)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(-11, 18, 14);
    camera.lookAt(-11, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lowSpecMode,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (!lowSpecMode) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    dirLight.position.set(10, 25, 15);
    if (!lowSpecMode) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 50;
      dirLight.shadow.camera.left = -20;
      dirLight.shadow.camera.right = 20;
      dirLight.shadow.camera.top = 20;
      dirLight.shadow.camera.bottom = -20;
    }
    scene.add(dirLight);

    const flashLight = new THREE.PointLight(0xfef08a, 0, 8);
    flashLight.position.set(-11, 1, 0);
    scene.add(flashLight);
    internalStateRef.current.flashLight = flashLight;

    // 5. Tactical Ground Arena (34m x 28m)
    const groundGeo = new THREE.PlaneGeometry(34, 28);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Concrete slate
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = !lowSpecMode;
    scene.add(ground);

    // Yellow Hazard Stripes at Spawn Area (Western Safe Zone)
    const spawnZoneGeo = new THREE.PlaneGeometry(6, 8);
    const spawnZoneMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
    });
    const spawnZone = new THREE.Mesh(spawnZoneGeo, spawnZoneMat);
    spawnZone.rotation.x = -Math.PI / 2;
    spawnZone.position.set(-11, 0.01, 0);
    spawnZone.receiveShadow = !lowSpecMode;
    scene.add(spawnZone);

    // Outer Perimeter Barriers
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const createWall = (w: number, h: number, d: number, x: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);
    };
    createWall(34, 2.5, 0.8, 0, -14); // North
    createWall(34, 2.5, 0.8, 0, 14);  // South
    createWall(0.8, 2.5, 28, -17, 0); // West
    createWall(0.8, 2.5, 28, 17, 0);  // East

    // 6. Tactical Covers & Containers
    const covers: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
    const containerMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 }); // Camo Green
    const containerMat2 = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 }); // Navy Blue
    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });   // Desert Sandbag

    const addBoxCover = (w: number, h: number, d: number, x: number, z: number, mat: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);
      covers.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    };

    // Spawn Safe Covers (protecting player from direct spawn-kill)
    addBoxCover(2.2, 2.2, 5.0, -8, -3, containerMat1);
    addBoxCover(1.2, 1.2, 4.0, -7.5, 3.5, sandbagMat);

    // Midfield & Enemy Side Covers
    addBoxCover(6.0, 2.2, 2.2, 0, 4.5, containerMat2);
    addBoxCover(2.2, 2.2, 5.0, 2.5, -5.5, containerMat1);
    addBoxCover(1.2, 1.2, 3.5, 4.5, 0, sandbagMat);
    addBoxCover(4.5, 2.2, 2.0, 9.5, -4, containerMat2);
    internalStateRef.current.covers = covers;

    // 7. Explosive Red TNT Barrels
    const barrels: BarrelData[] = [];
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const barrelCapMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });

    const addBarrel = (x: number, z: number) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.3, 12), barrelMat);
      body.castShadow = !lowSpecMode;
      group.add(body);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.08, 12), barrelCapMat);
      cap.position.y = 0.65;
      group.add(cap);

      group.position.set(x, 0.65, z);
      scene.add(group);
      barrels.push({ mesh: group, hp: 30, x, z, exploded: false });
    };
    addBarrel(1.5, -1.8);
    addBarrel(7.0, 3.5);
    internalStateRef.current.barrels = barrels;

    // 8. Player Mesh Construction
    const playerMesh = new THREE.Group();
    // Body & Tactical Armor
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), pBodyMat);
    pBody.position.y = 0.7;
    pBody.castShadow = !lowSpecMode;
    playerMesh.add(pBody);

    // Head & Helmet
    const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
    const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), pHeadMat);
    pHead.position.y = 1.3;
    playerMesh.add(pHead);

    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.44), helmetMat);
    helmet.position.y = 1.45;
    playerMesh.add(helmet);

    // Cyan Tactical Visor
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.12), visorMat);
    visor.position.set(0, 1.32, 0.2);
    playerMesh.add(visor);

    // Gun Model (M4A1 Style)
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const gunMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.75), gunMat);
    gunMesh.position.set(0.32, 0.75, 0.4);
    playerMesh.add(gunMesh);

    // Muzzle Flash Sprite/Mesh
    const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), muzzleMat);
    muzzleFlash.position.set(0.32, 0.75, 0.85);
    muzzleFlash.visible = false;
    playerMesh.add(muzzleFlash);

    // Hero No.023 Badge on Top
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 64;
    badgeCanvas.height = 64;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, playerHeroId, 0, 0, 64, 64);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
    const badgeSprite = new THREE.Sprite(badgeMat);
    badgeSprite.scale.set(0.65, 0.65, 0.65);
    badgeSprite.position.set(0, 1.9, 0);
    playerMesh.add(badgeSprite);

    playerMesh.position.copy(internalStateRef.current.playerPos);
    scene.add(playerMesh);

    // 9. Enemy Soldiers (5 AI Squad)
    const enemies: EnemyData[] = [];
    const enemySpawns = [
      { x: 3.5, z: -3.5, hp: 60 },
      { x: 6.5, z: -1.0, hp: 70 },
      { x: 9.5, z: 2.5, hp: 80 },
      { x: 5.5, z: 6.0, hp: 65 },
      { x: 11.0, z: -5.5, hp: 90 },
    ];

    const enemyBodyMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 }); // Red Terror Mercenary
    const beretMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

    enemySpawns.forEach((spawn, idx) => {
      const eGroup = new THREE.Group();

      const eBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.42), enemyBodyMat);
      eBody.position.y = 0.7;
      eBody.castShadow = !lowSpecMode;
      eGroup.add(eBody);

      const eHead = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), pHeadMat);
      eHead.position.y = 1.3;
      eGroup.add(eHead);

      const beret = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.12, 8), beretMat);
      beret.position.set(0, 1.5, 0);
      beret.rotation.z = 0.2;
      eGroup.add(beret);

      const eGun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.7), gunMat);
      eGun.position.set(0.3, 0.75, 0.38);
      eGroup.add(eGun);

      // 3D HP Bar
      const hpBgGeo = new THREE.BoxGeometry(0.8, 0.08, 0.05);
      const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
      hpBg.position.set(0, 1.85, 0);
      eGroup.add(hpBg);

      const hpGeo = new THREE.BoxGeometry(0.78, 0.06, 0.06);
      const hpMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const hpMesh = new THREE.Mesh(hpGeo, hpMat);
      hpMesh.position.set(0, 1.85, 0.01);
      eGroup.add(hpMesh);

      eGroup.position.set(spawn.x, 0, spawn.z);
      scene.add(eGroup);

      enemies.push({
        id: idx + 1,
        mesh: eGroup,
        hp: spawn.hp,
        maxHp: spawn.hp,
        hpBarMesh: hpMesh,
        shootCooldown: 1.0 + Math.random() * 1.5,
        isDead: false,
        baseX: spawn.x,
        baseZ: spawn.z,
        patrolAngle: Math.random() * Math.PI * 2,
      });
    });
    internalStateRef.current.enemies = enemies;

    // 10. Bullets geometry and shared materials
    const bulletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6);
    bulletGeo.rotateX(Math.PI / 2);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Gold tracer
    const enemyBulletMat = new THREE.MeshBasicMaterial({ color: 0xf87171 }); // Red tracer

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerMesh,
      muzzleFlash,
      bulletGeo,
      bulletMat,
      enemyBulletMat,
      animFrameId: 0,
    };

    // 11. Main Game Simulation Loop
    let lastClockTime = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const delta = Math.min((now - lastClockTime) / 1000, 0.1);
      lastClockTime = now;

      const s = internalStateRef.current;
      const three = threeRef.current;

      if (three && s.hp > 0 && !gameOver && !gameWon) {
        // A. Move Player
        const speed = 7.5;
        const newX = s.playerPos.x + s.moveDir.x * speed * delta;
        const newZ = s.playerPos.z + s.moveDir.z * speed * delta;

        // Collision detection against bounds & covers
        let blockedX = false;
        let blockedZ = false;

        if (newX < -15.5 || newX > 15.5) blockedX = true;
        if (newZ < -12.5 || newZ > 12.5) blockedZ = true;

        for (const c of s.covers) {
          const r = 0.5; // player radius
          if (newX + r > c.minX && newX - r < c.maxX && s.playerPos.z + r > c.minZ && s.playerPos.z - r < c.maxZ) {
            blockedX = true;
          }
          if (s.playerPos.x + r > c.minX && s.playerPos.x - r < c.maxX && newZ + r > c.minZ && newZ - r < c.maxZ) {
            blockedZ = true;
          }
        }

        if (!blockedX) s.playerPos.x = newX;
        if (!blockedZ) s.playerPos.z = newZ;

        three.playerMesh.position.copy(s.playerPos);
        three.playerMesh.rotation.y = s.playerAngle;

        // Flashlight follows player
        if (s.flashLight) {
          s.flashLight.position.set(s.playerPos.x, 1, s.playerPos.z);
        }

        // Camera Smooth Tracking (Screen-relative, looking from south-west)
        const targetCamX = s.playerPos.x * 0.4;
        const targetCamZ = s.playerPos.z * 0.4 + 13;
        three.camera.position.x += (targetCamX - three.camera.position.x) * 0.08;
        three.camera.position.z += (targetCamZ - three.camera.position.z) * 0.08;
        three.camera.lookAt(s.playerPos.x, 0.8, s.playerPos.z);

        // B. Enemy AI (Patrol, Aim, Shoot)
        s.enemies.forEach((enemy) => {
          if (enemy.isDead) return;

          // Patrol back and forth
          enemy.patrolAngle += delta * 1.2;
          const patrolX = enemy.baseX + Math.sin(enemy.patrolAngle) * 1.5;
          enemy.mesh.position.x = patrolX;

          // Look at Player
          const dx = s.playerPos.x - enemy.mesh.position.x;
          const dz = s.playerPos.z - enemy.mesh.position.z;
          const dist = Math.hypot(dx, dz);
          const angle = Math.atan2(dx, dz);
          enemy.mesh.rotation.y = angle;

          // Shoot at Player if in sight
          enemy.shootCooldown -= delta;
          if (dist < 18 && enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 1.4 + Math.random() * 1.2;

            // Spawn enemy bullet
            const eBullet = new THREE.Mesh(three.bulletGeo, three.enemyBulletMat);
            const spawnP = enemy.mesh.position.clone().add(new THREE.Vector3(0, 0.75, 0));
            eBullet.position.copy(spawnP);
            eBullet.rotation.y = angle;
            three.scene.add(eBullet);

            const dir = new THREE.Vector3(dx, 0, dz).normalize();
            s.bullets.push({
              mesh: eBullet,
              origin: spawnP,
              velocity: dir.multiplyScalar(22),
              life: 1.2,
              isEnemy: true,
              damage: 14,
            });
          }
        });

        // C. Update Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.mesh.position.addScaledVector(b.velocity, delta);
          b.life -= delta;

          let hit = false;

          // Bullet vs Covers
          for (const c of s.covers) {
            const bx = b.mesh.position.x;
            const bz = b.mesh.position.z;
            if (bx >= c.minX && bx <= c.maxX && bz >= c.minZ && bz <= c.maxZ) {
              hit = true;
              break;
            }
          }

          // Bullet vs Explosive Barrels
          if (!hit) {
            for (const barrel of s.barrels) {
              if (barrel.exploded) continue;
              const d = b.mesh.position.distanceTo(barrel.mesh.position);
              if (d < 0.7) {
                hit = true;
                barrel.hp -= b.damage;
                if (barrel.hp <= 0) {
                  // Explode Barrel!
                  barrel.exploded = true;
                  scene.remove(barrel.mesh);
                  if (navigator.vibrate) navigator.vibrate([80, 50, 80]);

                  // Splash damage to enemies & player within 6m
                  const bPos = new THREE.Vector3(barrel.x, 0, barrel.z);
                  s.enemies.forEach((enemy) => {
                    if (!enemy.isDead && enemy.mesh.position.distanceTo(bPos) < 6) {
                      enemy.hp -= 85;
                      if (enemy.hp <= 0) {
                        enemy.isDead = true;
                        scene.remove(enemy.mesh);
                        killsRef.current++;
                        setKills(killsRef.current);
                      } else {
                        enemy.hpBarMesh.scale.x = enemy.hp / enemy.maxHp;
                      }
                    }
                  });

                  if (s.playerPos.distanceTo(bPos) < 6) {
                    s.hp = Math.max(0, s.hp - 40);
                    setPlayerHp(s.hp);
                  }
                }
                break;
              }
            }
          }

          // Player Bullet vs Enemies
          if (!hit && !b.isEnemy) {
            for (const enemy of s.enemies) {
              if (enemy.isDead) continue;
              const d = b.mesh.position.distanceTo(enemy.mesh.position);
              if (d < 0.8) {
                hit = true;
                enemy.hp -= b.damage;
                if (navigator.vibrate) navigator.vibrate(15);

                if (enemy.hp <= 0) {
                  enemy.isDead = true;
                  scene.remove(enemy.mesh);
                  killsRef.current++;
                  setKills(killsRef.current);

                  // Check Victory
                  if (killsRef.current >= s.enemies.length) {
                    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
                    const receipt = calculateAndDepositMissionReward({
                      gameId: 'poki_gunsgunsguns',
                      gameTitle: 'Guns Guns Guns 3D',
                      durationSeconds: duration,
                      score: 1000,
                      maxTargetScore: 1000,
                      isVictory: true,
                    });
                    setRewardResult(receipt);
                    setGameWon(true);
                  }
                } else {
                  enemy.hpBarMesh.scale.x = enemy.hp / enemy.maxHp;
                }
                break;
              }
            }
          }

          // Enemy Bullet vs Player
          if (!hit && b.isEnemy) {
            const d = b.mesh.position.distanceTo(s.playerPos);
            if (d < 0.75) {
              hit = true;
              s.hp = Math.max(0, s.hp - b.damage);
              setPlayerHp(s.hp);
              if (navigator.vibrate) navigator.vibrate(50);

              if (s.hp <= 0) {
                handleGiveUp();
              }
            }
          }

          if (hit || b.life <= 0) {
            scene.remove(b.mesh);
            s.bullets.splice(i, 1);
          }
        }

        // Auto Fire if holding fire button
        if (s.isFiring && s.weapon === 'RIFLE') {
          triggerFire();
        }

        three.renderer.render(three.scene, three.camera);
        three.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    threeRef.current.animFrameId = requestAnimationFrame(renderLoop);

    // Responsive Resize
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animFrameId);
        threeRef.current.renderer.dispose();
      }
    };
  }, [lowSpecMode, playerHeroId]);

  // Touch Screen Joystick Tracking (Left Half)
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX < window.innerWidth * 0.55 && joystickTouchIdRef.current === null) {
        // Left side touch -> Joystick center
        joystickTouchIdRef.current = touch.identifier;
        setJoystickCenter({ x: touch.clientX, y: touch.clientY });
        setJoystickPos({ x: touch.clientX, y: touch.clientY });
        setJoystickActive(true);
      } else if (touch.clientX >= window.innerWidth * 0.55 && aimTouchIdRef.current === null) {
        // Right side touch -> Aim rotation
        aimTouchIdRef.current = touch.identifier;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;

        let clampX = dx;
        let clampY = dy;
        if (dist > maxRadius) {
          clampX = (dx / dist) * maxRadius;
          clampY = (dy / dist) * maxRadius;
        }

        setJoystickPos({ x: joystickCenter.x + clampX, y: joystickCenter.y + clampY });

        // Update movement vector (Screen relative: right = +X, up = -Z)
        const normX = clampX / maxRadius;
        const normY = clampY / maxRadius;
        internalStateRef.current.moveDir = { x: normX, z: normY };

        // Turn player towards move direction
        if (Math.abs(normX) > 0.1 || Math.abs(normY) > 0.1) {
          internalStateRef.current.playerAngle = Math.atan2(normX, normY);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickActive(false);
        internalStateRef.current.moveDir = { x: 0, z: 0 };
      }
      if (touch.identifier === aimTouchIdRef.current) {
        aimTouchIdRef.current = null;
      }
    }
  };

  // Keyboard controls for testing / desktop
  useEffect(() => {
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      updateKeyMove();
      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        triggerFire();
      } else if (e.key.toLowerCase() === 'r') {
        handleReload();
      } else if (e.key.toLowerCase() === 'q') {
        handleSwitchWeapon();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
      updateKeyMove();
    };

    const updateKeyMove = () => {
      let x = 0;
      let z = 0;
      if (keys['w'] || keys['arrowup']) z -= 1;
      if (keys['s'] || keys['arrowdown']) z += 1;
      if (keys['a'] || keys['arrowleft']) x -= 1;
      if (keys['d'] || keys['arrowright']) x += 1;

      const len = Math.hypot(x, z);
      if (len > 0) {
        x /= len;
        z /= len;
        internalStateRef.current.playerAngle = Math.atan2(x, z);
      }
      internalStateRef.current.moveDir = { x, z };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleReload, handleSwitchWeapon, triggerFire]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="No.023 Guns Guns Guns 3D"
        score={kills * 200}
        scoreLabel="처치 점수"
        targetLabel="적 분대 섬멸"
        targetProgress={`${kills} / 5 KILLS`}
        onGiveUp={handleGiveUp}
      />

      {/* Tactical Status Floating Overlay */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* HP Bar */}
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <div className="w-24 h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                playerHp > 50 ? 'bg-emerald-500' : playerHp > 25 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${playerHp}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-200">{playerHp} HP</span>
        </div>

        {/* Ammo & Weapon Badge */}
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-2">
          <Crosshair className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-extrabold text-amber-300">
            {currentWeapon === 'RIFLE' ? 'M4A1 RIFLE' : 'SPAS-12 SHOTGUN'}
          </span>
          <span className="text-xs font-black text-white">
            {isReloading ? 'RELOADING...' : `${ammo} / ${maxAmmo}`}
          </span>
        </div>
      </div>

      {/* Dynamic Floating Touch Joystick Visual */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: joystickCenter.x, top: joystickCenter.y }}
        >
          {/* Outer Ring */}
          <div className="w-24 h-24 rounded-full border-2 border-cyan-400/50 bg-cyan-950/30 backdrop-blur-sm relative flex items-center justify-center">
            {/* Inner Knob */}
            <div
              className="w-10 h-10 rounded-full bg-cyan-400/80 shadow-lg absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${joystickPos.x - joystickCenter.x}px)`,
                top: `calc(50% + ${joystickPos.y - joystickCenter.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Right Mobile Action Buttons */}
      <div className="absolute bottom-6 right-5 flex flex-col items-end space-y-3 pointer-events-auto">
        {/* Weapon Swap & Reload Top Row */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSwitchWeapon}
            className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-600 text-amber-400 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="무기 교체"
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">교체</span>
          </button>
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-600 text-cyan-400 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="재장전"
          >
            <RotateCcw className={`w-5 h-5 ${isReloading ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-bold mt-0.5">장전</span>
          </button>
        </div>

        {/* 80px Large Fire Button */}
        <button
          onPointerDown={() => {
            internalStateRef.current.isFiring = true;
            triggerFire();
          }}
          onPointerUp={() => {
            internalStateRef.current.isFiring = false;
          }}
          onPointerLeave={() => {
            internalStateRef.current.isFiring = false;
          }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 border-2 border-rose-400 shadow-2xl flex flex-col items-center justify-center active:scale-90 active:from-rose-700 active:to-amber-600 transition-all"
        >
          <Crosshair className="w-8 h-8 text-white animate-pulse" />
          <span className="text-[11px] font-black text-white mt-1">FIRE</span>
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="건즈 건즈 건즈 3D (Guns Guns Guns 3D)"
          category="3D 택티컬 전술 슈팅 아레나"
          guideSteps={[
            {
              title: '360° 전술 기동 (Floating Joystick)',
              desc: '화면 좌측을 터치하고 드래그하여 컨테이너와 모래주머니 뒤로 전술 이동하세요.',
              iconType: 'GESTURES',
            },
            {
              title: '무기 스왑 & 사격 (Fire & Weapon)',
              desc: '우측 80px [FIRE] 버튼으로 적을 조준 사격하세요. [교체] 버튼으로 M4A1 돌격소총과 SPAS-12 산탄총을 전환할 수 있습니다.',
              iconType: 'GOAL',
            },
            {
              title: '폭발 배럴 & 분대 소탕 보상',
              desc: '붉은 TNT 배럴을 사격하면 주변 적에게 대폭발 피해를 줍니다! 5명의 적을 모두 소탕하고 최대 50 SNS 보상을 획득하세요.',
              iconType: 'REWARDS',
            },
          ]}
          onStart={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Defeat Modal */}
      {(gameWon || gameOver) && (
        <VictoryRewardModal
          isOpen={gameWon || gameOver}
          reward={rewardResult}
          onClose={handleExit}
        />
      )}
    </div>
  );
};

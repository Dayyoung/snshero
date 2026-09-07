import React, { useState, useEffect, useRef, useId } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiRepulsGameProps {
  onBack: () => void;
  cardId?: number;
}

type WeaponType = 'RIFLE' | 'SHOTGUN' | 'RAILGUN';

interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number; // ms cooldown
  pellets: number;
  spread: number;
  color: number;
  bulletSpeed: number;
  label: string;
}

const WEAPONS: Record<WeaponType, WeaponConfig> = {
  RIFLE: {
    name: 'Plasma Rifle',
    damage: 22,
    fireRate: 160,
    pellets: 1,
    spread: 0.02,
    color: 0x00ffff,
    bulletSpeed: 75,
    label: '⚡ RIFLE',
  },
  SHOTGUN: {
    name: 'Pulse Shotgun',
    damage: 15,
    fireRate: 650,
    pellets: 6,
    spread: 0.12,
    color: 0xffaa00,
    bulletSpeed: 60,
    label: '💥 SHOTGUN',
  },
  RAILGUN: {
    name: 'Vortex Railgun',
    damage: 95,
    fireRate: 1100,
    pellets: 1,
    spread: 0.005,
    color: 0xbf55ec,
    bulletSpeed: 120,
    label: '🔮 RAILGUN',
  },
};

interface Bullet {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  damage: number;
  isPlayer: boolean;
}

interface Bot {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  hp: number;
  maxHp: number;
  shootCooldown: number;
  targetPos: THREE.Vector3;
  stateTimer: number;
  hpBarMesh: THREE.Sprite;
}

export const PokiRepulsGame: React.FC<PokiRepulsGameProps> = ({ onBack, cardId = 48 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Progress State
  const [frags, setFrags] = useState(0);
  const targetFrags = 12;
  const [playerHp, setPlayerHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(50);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('RIFLE');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [hitmarker, setHitmarker] = useState(false);
  const [killBanner, setKillBanner] = useState<string | null>(null);

  // JoyStick & Touch state
  const touchStateRef = useRef({
    joystickActive: false,
    joystickOrigin: { x: 0, y: 0 },
    joystickCurrent: { x: 0, y: 0 },
    joystickVector: { x: 0, y: 0 }, // -1 ~ 1
    aimTouchId: null as number | null,
    aimLastPos: { x: 0, y: 0 },
    isFiring: false,
  });

  const [joystickUI, setJoystickUI] = useState<{
    visible: boolean;
    ox: number;
    oy: number;
    cx: number;
    cy: number;
  }>({ visible: false, ox: 0, oy: 0, cx: 0, cy: 0 });

  // Game Engine Refs
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    playerPos: new THREE.Vector3(0, 1.0, 22),
    playerVel: new THREE.Vector3(0, 0, 0),
    playerYaw: 0,
    playerPitch: 0.1,
    isGrounded: true,
    playerMesh: null as THREE.Group | null,
    gunMesh: null as THREE.Group | null,
    bullets: [] as Bullet[],
    bots: [] as Bot[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    jumpPads: [] as THREE.Vector3[],
    lastPlayerShootTime: 0,
    lastFrameTime: performance.now(),
    frags: 0,
    playerHp: 100,
    playerShield: 50,
    currentWeapon: 'RIFLE' as WeaponType,
    isDestroyed: false,
    startTime: Date.now(),
  });

  // Hero Card Sprite Badge
  useEffect(() => {
    const canvas = heroBadgeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, cardId, 0, 0, 48, 48);
  }, [cardId]);

  // Main Three.js Initialization & Game Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const game = gameRef.current;
    game.isDestroyed = false;
    game.frags = 0;
    game.playerHp = 100;
    game.playerShield = 50;
    game.playerPos.set(0, 1.0, 22);
    game.playerVel.set(0, 0, 0);
    game.playerYaw = 0;
    game.playerPitch = 0.05;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    game.scene = scene;
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.015);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
    game.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    game.renderer = renderer;

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.5);
    dirLight.position.set(20, 40, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const redRimLight = new THREE.DirectionalLight(0xff0055, 1.0);
    redRimLight.position.set(-25, 20, -25);
    scene.add(redRimLight);

    // 3. Environment: Cyber Colosseum Map (60m x 60m)
    // Floor
    const floorGeo = new THREE.PlaneGeometry(64, 64, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a1020,
      roughness: 0.4,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Floor Overlay
    const gridHelper = new THREE.GridHelper(64, 32, 0x00ffff, 0x112244);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Outer Neon Barrier Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0b1c3d,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x003366,
      emissiveIntensity: 0.4,
    });
    const wallGeoH = new THREE.BoxGeometry(64, 6, 1.5);
    const wallGeoV = new THREE.BoxGeometry(1.5, 6, 64);

    const wallN = new THREE.Mesh(wallGeoH, wallMat);
    wallN.position.set(0, 3, -32);
    wallN.receiveShadow = true;
    scene.add(wallN);

    const wallS = new THREE.Mesh(wallGeoH, wallMat);
    wallS.position.set(0, 3, 32);
    wallS.receiveShadow = true;
    scene.add(wallS);

    const wallW = new THREE.Mesh(wallGeoV, wallMat);
    wallW.position.set(-32, 3, 0);
    wallW.receiveShadow = true;
    scene.add(wallW);

    const wallE = new THREE.Mesh(wallGeoV, wallMat);
    wallE.position.set(32, 3, 0);
    wallE.receiveShadow = true;
    scene.add(wallE);

    // Glowing Neon Rim Top on Walls
    const neonRimGeo = new THREE.BoxGeometry(64, 0.4, 0.4);
    const neonRimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const rimN = new THREE.Mesh(neonRimGeo, neonRimMat);
    rimN.position.set(0, 6, -32);
    scene.add(rimN);
    const rimS = new THREE.Mesh(neonRimGeo, neonRimMat);
    rimS.position.set(0, 6, 32);
    scene.add(rimS);

    // Central Core Tower
    const coreGeo = new THREE.CylinderGeometry(3.5, 4.5, 12, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x07152b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.25,
    });
    const coreTower = new THREE.Mesh(coreGeo, coreMat);
    coreTower.position.set(0, 6, 0);
    coreTower.castShadow = true;
    coreTower.receiveShadow = true;
    scene.add(coreTower);

    // Core Ring
    const ringGeo = new THREE.TorusGeometry(5, 0.25, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const coreRing = new THREE.Mesh(ringGeo, ringMat);
    coreRing.rotation.x = Math.PI / 2;
    coreRing.position.set(0, 5, 0);
    scene.add(coreRing);

    // 4 Quad Cover Pillars & Barricades
    const barricadePositions = [
      { x: -14, z: -14 },
      { x: 14, z: -14 },
      { x: -14, z: 14 },
      { x: 14, z: 14 },
      { x: -18, z: 0 },
      { x: 18, z: 0 },
      { x: 0, z: -18 },
    ];
    barricadePositions.forEach((pos) => {
      const bGeo = new THREE.BoxGeometry(4, 3, 2);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x152238,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x0f2b48,
        emissiveIntensity: 0.3,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(pos.x, 1.5, pos.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      scene.add(bMesh);

      const bStripe = new THREE.Mesh(
        new THREE.BoxGeometry(4.05, 0.2, 0.2),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      bStripe.position.set(pos.x, 2.5, pos.z + 1.01);
      scene.add(bStripe);
    });

    // 2 Jump Pads
    game.jumpPads = [new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)];
    game.jumpPads.forEach((pos) => {
      const padGroup = new THREE.Group();
      const baseMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(2.0, 2.2, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.8, roughness: 0.2 })
      );
      const glowMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.35, 16),
        new THREE.MeshBasicMaterial({ color: 0xff00ff })
      );
      padGroup.add(baseMesh);
      padGroup.add(glowMesh);
      padGroup.position.copy(pos);
      padGroup.position.y = 0.15;
      scene.add(padGroup);
    });

    // 4. Player Cyber Soldier 3D Model
    const playerGroup = new THREE.Group();
    // Body
    const bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0x0077ff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x002266,
      })
    );
    bodyMesh.position.y = 1.0;
    bodyMesh.castShadow = true;
    playerGroup.add(bodyMesh);

    // Head Visor
    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x0a1428, metalness: 0.9, roughness: 0.1 })
    );
    headMesh.position.y = 1.8;
    headMesh.castShadow = true;
    playerGroup.add(headMesh);

    const visorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.15, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    visorMesh.position.set(0, 1.8, -0.22);
    playerGroup.add(visorMesh);

    // Gun
    const gunGroup = new THREE.Group();
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 })
    );
    const gunMuzzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    gunMuzzle.rotation.x = Math.PI / 2;
    gunMuzzle.position.z = -0.55;
    gunGroup.add(gunBody);
    gunGroup.add(gunMuzzle);
    gunGroup.position.set(0.45, 1.1, -0.4);
    playerGroup.add(gunGroup);

    playerGroup.position.copy(game.playerPos);
    scene.add(playerGroup);
    game.playerMesh = playerGroup;
    game.gunMesh = gunGroup;

    // Helper: Create Bot HP Canvas Sprite
    const createHpBarSprite = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 12;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ff0044';
      ctx.fillRect(0, 0, 64, 12);
      const texture = new THREE.CanvasTexture(c);
      const mat = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.4, 0.25, 1);
      sprite.position.y = 2.4;
      return sprite;
    };

    // 5. Bot Creation Helper
    const createBot = (x: number, z: number): Bot => {
      const botGroup = new THREE.Group();
      // Red Armor
      const bBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 0.5),
        new THREE.MeshStandardMaterial({
          color: 0xee1133,
          metalness: 0.7,
          roughness: 0.3,
          emissive: 0x550011,
        })
      );
      bBody.position.y = 1.0;
      bBody.castShadow = true;
      botGroup.add(bBody);

      const bHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x22050b, metalness: 0.8, roughness: 0.2 })
      );
      bHead.position.y = 1.8;
      botGroup.add(bHead);

      const bVisor = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.14, 0.22),
        new THREE.MeshBasicMaterial({ color: 0xff0044 })
      );
      bVisor.position.set(0, 1.8, -0.22);
      botGroup.add(bVisor);

      // Bot Gun
      const bGun = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9 })
      );
      bGun.position.set(0.42, 1.05, -0.35);
      botGroup.add(bGun);

      const hpSprite = createHpBarSprite();
      botGroup.add(hpSprite);

      botGroup.position.set(x, 1.0, z);
      scene.add(botGroup);

      return {
        mesh: botGroup,
        pos: new THREE.Vector3(x, 1.0, z),
        vel: new THREE.Vector3(0, 0, 0),
        hp: 60,
        maxHp: 60,
        shootCooldown: 800 + Math.random() * 800,
        targetPos: new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          1.0,
          (Math.random() - 0.5) * 40
        ),
        stateTimer: 0,
        hpBarMesh: hpSprite,
      };
    };

    // Initial 4 Bots
    const botInitialCoords = [
      { x: -18, z: -18 },
      { x: 18, z: -18 },
      { x: -18, z: 8 },
      { x: 18, z: 8 },
    ];
    botInitialCoords.forEach((coord) => {
      game.bots.push(createBot(coord.x, coord.z));
    });

    // 6. Spawn Shoot Bullet Helper
    const shootBullet = (
      origin: THREE.Vector3,
      dir: THREE.Vector3,
      isPlayer: boolean,
      weaponCfg: WeaponConfig
    ) => {
      const geo = new THREE.SphereGeometry(0.14, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: isPlayer ? weaponCfg.color : 0xff2244,
      });
      const bMesh = new THREE.Mesh(geo, mat);
      bMesh.position.copy(origin);
      scene.add(bMesh);

      game.bullets.push({
        mesh: bMesh,
        vel: dir.clone().multiplyScalar(isPlayer ? weaponCfg.bulletSpeed : 32),
        life: 2.2,
        damage: isPlayer ? weaponCfg.damage : 14,
        isPlayer,
      });

      // Muzzle Light Spark
      const sparkGeo = new THREE.SphereGeometry(0.25, 6, 6);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: isPlayer ? weaponCfg.color : 0xff4444,
      });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.copy(origin);
      scene.add(spark);
      setTimeout(() => scene.remove(spark), 45);
    };

    // 7. Particle Explosion Helper
    const spawnExplosion = (pos: THREE.Vector3, colorHex: number, count = 12) => {
      for (let i = 0; i < count; i++) {
        const pGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
        const pMat = new THREE.MeshBasicMaterial({ color: colorHex });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        const v = new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          Math.random() * 8 + 2,
          (Math.random() - 0.5) * 12
        );
        game.particles.push({ mesh: pMesh, vel: v, life: 0.8 });
      }
    };

    // 8. Player Shoot Trigger
    const triggerPlayerFire = () => {
      const now = performance.now();
      const wCfg = WEAPONS[game.currentWeapon];
      if (now - game.lastPlayerShootTime < wCfg.fireRate) return;
      game.lastPlayerShootTime = now;

      // Haptic
      if (navigator.vibrate) navigator.vibrate(15);

      // Gun world pos & direction
      const forward = new THREE.Vector3(
        -Math.sin(game.playerYaw) * Math.cos(game.playerPitch),
        Math.sin(game.playerPitch),
        -Math.cos(game.playerYaw) * Math.cos(game.playerPitch)
      ).normalize();

      const gunPos = game.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));

      for (let i = 0; i < wCfg.pellets; i++) {
        const spreadDir = forward.clone();
        if (wCfg.spread > 0) {
          spreadDir.x += (Math.random() - 0.5) * wCfg.spread;
          spreadDir.y += (Math.random() - 0.5) * wCfg.spread;
          spreadDir.z += (Math.random() - 0.5) * wCfg.spread;
          spreadDir.normalize();
        }
        shootBullet(gunPos, spreadDir, true, wCfg);
      }
    };

    // 9. Resize Listener
    const handleResize = () => {
      if (!game.camera || !game.renderer) return;
      game.camera.aspect = window.innerWidth / window.innerHeight;
      game.camera.updateProjectionMatrix();
      game.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 10. Main Animation Frame Loop
    const animate = (time: number) => {
      if (game.isDestroyed) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min((time - game.lastFrameTime) / 1000, 0.05);
      game.lastFrameTime = time;

      // Core Ring Spin
      coreRing.rotation.z += delta * 0.5;

      // Player Movement Logic (Screen-Relative)
      const joy = touchStateRef.current.joystickVector;
      const moveSpeed = 16.0;

      // Camera-relative forward & right vectors
      const forwardX = -Math.sin(game.playerYaw);
      const forwardZ = -Math.cos(game.playerYaw);
      const rightX = Math.cos(game.playerYaw);
      const rightZ = -Math.sin(game.playerYaw);

      // joy.x: right/left, joy.y: forward/back
      const targetMoveX = (rightX * joy.x - forwardX * joy.y) * moveSpeed;
      const targetMoveZ = (rightZ * joy.x - forwardZ * joy.y) * moveSpeed;

      game.playerPos.x += targetMoveX * delta;
      game.playerPos.z += targetMoveZ * delta;

      // Arena Bound Clamping (-28 ~ +28)
      game.playerPos.x = Math.max(-28, Math.min(28, game.playerPos.x));
      game.playerPos.z = Math.max(-28, Math.min(28, game.playerPos.z));

      // Gravity & Jump Physics
      game.playerVel.y -= 28.0 * delta; // Gravity
      game.playerPos.y += game.playerVel.y * delta;
      if (game.playerPos.y <= 1.0) {
        game.playerPos.y = 1.0;
        game.playerVel.y = 0;
        game.isGrounded = true;
      }

      // Jump Pad Collision
      game.jumpPads.forEach((pad) => {
        const dist = new THREE.Vector2(game.playerPos.x - pad.x, game.playerPos.z - pad.z).length();
        if (dist < 2.0 && game.playerPos.y <= 1.2) {
          game.playerVel.y = 17.0; // Mega launch
          game.isGrounded = false;
          if (navigator.vibrate) navigator.vibrate(25);
        }
      });

      // Update Player Mesh Position & Rotation
      if (game.playerMesh) {
        game.playerMesh.position.copy(game.playerPos);
        game.playerMesh.rotation.y = game.playerYaw;
      }

      // Continuous Firing when Fire held
      if (touchStateRef.current.isFiring) {
        triggerPlayerFire();
      }

      // Camera Follow 3rd Person Shoulder View
      const camDist = 3.8;
      const camHeight = 1.8;
      const camX = game.playerPos.x + Math.sin(game.playerYaw) * camDist;
      const camZ = game.playerPos.z + Math.cos(game.playerYaw) * camDist;
      const camY = game.playerPos.y + camHeight + Math.sin(game.playerPitch) * camDist;

      camera.position.set(camX, camY, camZ);
      const lookTarget = game.playerPos.clone().add(
        new THREE.Vector3(
          -Math.sin(game.playerYaw) * 10,
          Math.sin(game.playerPitch) * 10 + 1.2,
          -Math.cos(game.playerYaw) * 10
        )
      );
      camera.lookAt(lookTarget);

      // Update Bullets
      for (let i = game.bullets.length - 1; i >= 0; i--) {
        const b = game.bullets[i];
        b.mesh.position.addScaledVector(b.vel, delta);
        b.life -= delta;

        let hit = false;

        // Player bullet hit Bots
        if (b.isPlayer) {
          for (let j = game.bots.length - 1; j >= 0; j--) {
            const bot = game.bots[j];
            const d = b.mesh.position.distanceTo(bot.pos.clone().add(new THREE.Vector3(0, 1, 0)));
            if (d < 1.1) {
              bot.hp -= b.damage;
              hit = true;
              setHitmarker(true);
              setTimeout(() => setHitmarker(false), 90);
              spawnExplosion(b.mesh.position, 0x00f0ff, 6);

              // Update HP Bar
              const pct = Math.max(0, bot.hp / bot.maxHp);
              bot.hpBarMesh.scale.x = 1.4 * pct;

              if (bot.hp <= 0) {
                // Kill Bot!
                spawnExplosion(bot.pos, 0xff0055, 20);
                scene.remove(bot.mesh);
                game.bots.splice(j, 1);

                game.frags += 1;
                setFrags(game.frags);
                setKillBanner(`🎯 ELIMINATED CYBER BOT! (+1 FRAG)`);
                setTimeout(() => setKillBanner(null), 1200);

                if (navigator.vibrate) navigator.vibrate([30, 40, 30]);

                // Respawn bot after 2 sec
                setTimeout(() => {
                  if (!game.isDestroyed) {
                    const spawnX = (Math.random() - 0.5) * 44;
                    const spawnZ = (Math.random() - 0.5) * 44;
                    game.bots.push(createBot(spawnX, spawnZ));
                  }
                }, 2000);

                // Win check
                if (game.frags >= targetFrags && !gameWon) {
                  setGameWon(true);
                  const result = calculateAndDepositMissionReward({
                    gameId: 'poki_repuls_io',
                    gameTitle: 'Repuls.io 3D',
                    isVictory: true,
                    score: Math.max(20, game.frags * 10),
                    maxTargetScore: 120,
                    durationSeconds: Math.floor((Date.now() - game.startTime) / 1000),
                  });
                  setRewardResult(result);
                }
              }
              break;
            }
          }
        } else {
          // Bot bullet hit Player
          const d = b.mesh.position.distanceTo(game.playerPos.clone().add(new THREE.Vector3(0, 1, 0)));
          if (d < 1.0) {
            hit = true;
            spawnExplosion(b.mesh.position, 0xff0044, 8);
            if (navigator.vibrate) navigator.vibrate(30);

            // Shield damage first
            if (game.playerShield > 0) {
              game.playerShield = Math.max(0, game.playerShield - b.damage);
              setPlayerShield(game.playerShield);
            } else {
              game.playerHp = Math.max(0, game.playerHp - b.damage);
              setPlayerHp(game.playerHp);
              if (game.playerHp <= 0 && !gameOver) {
                setGameOver(true);
                const result = calculateAndDepositMissionReward({
                  gameId: 'poki_repuls_io',
                  gameTitle: 'Repuls.io 3D',
                  isVictory: false,
                  score: Math.max(10, game.frags * 10),
                  maxTargetScore: 120,
                  durationSeconds: Math.floor((Date.now() - game.startTime) / 1000),
                });
                setRewardResult(result);
              }
            }
          }
        }

        // Out of bounds / wall / floor hit
        if (
          hit ||
          b.life <= 0 ||
          b.mesh.position.y <= 0 ||
          Math.abs(b.mesh.position.x) > 31 ||
          Math.abs(b.mesh.position.z) > 31
        ) {
          scene.remove(b.mesh);
          game.bullets.splice(i, 1);
        }
      }

      // Update AI Bots
      game.bots.forEach((bot) => {
        bot.stateTimer += delta;
        if (bot.stateTimer > 3.0) {
          bot.stateTimer = 0;
          bot.targetPos.set(
            (Math.random() - 0.5) * 44,
            1.0,
            (Math.random() - 0.5) * 44
          );
        }

        const toPlayer = game.playerPos.clone().sub(bot.pos);
        const distToPlayer = toPlayer.length();

        // Face player if close, else face movement target
        if (distToPlayer < 24) {
          const targetYaw = Math.atan2(-toPlayer.x, -toPlayer.z);
          bot.mesh.rotation.y = targetYaw;

          // Bot Shoot cooldown
          bot.shootCooldown -= delta * 1000;
          if (bot.shootCooldown <= 0) {
            bot.shootCooldown = 1200 + Math.random() * 800;
            const shootDir = toPlayer.clone().normalize();
            shootDir.x += (Math.random() - 0.5) * 0.1;
            shootDir.y += (Math.random() - 0.5) * 0.05;
            shootDir.z += (Math.random() - 0.5) * 0.1;
            shootDir.normalize();

            shootBullet(
              bot.pos.clone().add(new THREE.Vector3(0, 1.2, 0)),
              shootDir,
              false,
              WEAPONS.RIFLE
            );
          }
        } else {
          // Patrol move
          const toTarget = bot.targetPos.clone().sub(bot.pos);
          if (toTarget.length() > 1.5) {
            const dir = toTarget.normalize();
            bot.pos.x += dir.x * 5.5 * delta;
            bot.pos.z += dir.z * 5.5 * delta;
            bot.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);
          }
        }
        bot.mesh.position.copy(bot.pos);
      });

      // Update Explosion Particles
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.mesh.position.addScaledVector(p.vel, delta);
        p.vel.y -= 15 * delta;
        p.life -= delta;
        p.mesh.scale.multiplyScalar(0.96);
        if (p.life <= 0) {
          scene.remove(p.mesh);
          game.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      game.isDestroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gameWon, gameOver]);

  // Touch Controls Event Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      // Left half screen = Dynamic Joystick
      if (t.clientX < window.innerWidth * 0.5 && !touchStateRef.current.joystickActive) {
        touchStateRef.current.joystickActive = true;
        touchStateRef.current.joystickOrigin = { x: t.clientX, y: t.clientY };
        touchStateRef.current.joystickCurrent = { x: t.clientX, y: t.clientY };
        touchStateRef.current.joystickVector = { x: 0, y: 0 };
        setJoystickUI({
          visible: true,
          ox: t.clientX,
          oy: t.clientY,
          cx: t.clientX,
          cy: t.clientY,
        });
      }
      // Right half screen = Aim / Look Rotation
      else if (t.clientX >= window.innerWidth * 0.5 && touchStateRef.current.aimTouchId === null) {
        touchStateRef.current.aimTouchId = t.identifier;
        touchStateRef.current.aimLastPos = { x: t.clientX, y: t.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      // Joystick drag
      if (touchStateRef.current.joystickActive && t.clientX < window.innerWidth * 0.55) {
        const ox = touchStateRef.current.joystickOrigin.x;
        const oy = touchStateRef.current.joystickOrigin.y;
        const dx = t.clientX - ox;
        const dy = t.clientY - oy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 46;
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const cx = ox + Math.cos(angle) * clampedDist;
        const cy = oy + Math.sin(angle) * clampedDist;

        touchStateRef.current.joystickCurrent = { x: cx, y: cy };
        touchStateRef.current.joystickVector = {
          x: clampedDist > 6 ? (dx / maxRadius) : 0,
          y: clampedDist > 6 ? (dy / maxRadius) : 0,
        };

        setJoystickUI((prev) => ({ ...prev, cx, cy }));
      }
      // Aim Look drag
      if (t.identifier === touchStateRef.current.aimTouchId) {
        const last = touchStateRef.current.aimLastPos;
        const deltaX = t.clientX - last.x;
        const deltaY = t.clientY - last.y;
        touchStateRef.current.aimLastPos = { x: t.clientX, y: t.clientY };

        const rotSpeed = 0.0055;
        gameRef.current.playerYaw -= deltaX * rotSpeed;
        gameRef.current.playerPitch = Math.max(
          -0.3,
          Math.min(0.35, gameRef.current.playerPitch - deltaY * rotSpeed)
        );
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      // End Joystick
      if (touchStateRef.current.joystickActive && t.clientX < window.innerWidth * 0.55) {
        touchStateRef.current.joystickActive = false;
        touchStateRef.current.joystickVector = { x: 0, y: 0 };
        setJoystickUI((prev) => ({ ...prev, visible: false }));
      }
      // End Aim
      if (t.identifier === touchStateRef.current.aimTouchId) {
        touchStateRef.current.aimTouchId = null;
      }
    }
  };

  // Jump Trigger
  const handleJump = () => {
    if (gameRef.current.isGrounded) {
      gameRef.current.playerVel.y = 11.5;
      gameRef.current.isGrounded = false;
      if (navigator.vibrate) navigator.vibrate(20);
    }
  };

  // Weapon Swap Trigger
  const handleWeaponSwap = () => {
    const weaponOrder: WeaponType[] = ['RIFLE', 'SHOTGUN', 'RAILGUN'];
    const curIdx = weaponOrder.indexOf(currentWeapon);
    const nextW = weaponOrder[(curIdx + 1) % weaponOrder.length];
    setCurrentWeapon(nextW);
    gameRef.current.currentWeapon = nextW;
    if (navigator.vibrate) navigator.vibrate(25);
  };

  const hudUniqueId = useId();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-black font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Minimalist Top HUD */}
      <MinimalistMissionHUD
        key={hudUniqueId}
        title="REPULS.IO 3D"
        progress={`${frags} / ${targetFrags} FRAGS`}
        onGiveUp={() => {
          const res = calculateAndDepositMissionReward({
            gameId: 'poki_repuls_io',
            gameTitle: 'Repuls.io 3D',
            isVictory: false,
            score: Math.max(10, frags * 10),
            maxTargetScore: 120,
            durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
          });
          setRewardResult(res);
        }}
      />

      {/* Hero Badge & Player Vitals */}
      <div className="absolute top-14 left-3 z-20 flex items-center gap-2 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded-sm border border-cyan-500/30">
        <canvas
          ref={heroBadgeCanvasRef}
          width={48}
          height={48}
          className="w-8 h-8 rounded border border-cyan-400/50 bg-black/40"
        />
        <div className="text-xs">
          <div className="text-cyan-400 font-bold flex items-center gap-1.5">
            <span>HP {playerHp}</span>
            <span className="text-blue-400">SHIELD {playerShield}</span>
          </div>
          <div className="w-24 h-1.5 bg-gray-800 rounded-none overflow-hidden mt-0.5 flex">
            <div className="bg-red-500 h-full" style={{ width: `${playerHp}%` }} />
            <div className="bg-blue-400 h-full" style={{ width: `${playerShield * 2}%` }} />
          </div>
        </div>
      </div>

      {/* Target Frag Tracker */}
      <div className="absolute top-14 right-3 z-20 pointer-events-none bg-black/60 px-3 py-1.5 rounded-sm border border-cyan-500/30 text-right">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider">ARENA TARGET</div>
        <div className="text-sm font-black text-yellow-400 tracking-wider">
          {frags} / {targetFrags} KILLS
        </div>
      </div>

      {/* Crosshair & Hitmarker */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00ffff]" />
          <div className="absolute w-6 h-[1.5px] bg-cyan-400/40" />
          <div className="absolute h-6 w-[1.5px] bg-cyan-400/40" />
          {hitmarker && (
            <div className="absolute text-red-500 font-black text-xl animate-ping select-none">
              ✕
            </div>
          )}
        </div>
      </div>

      {/* Kill Banner */}
      {killBanner && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-red-600/80 text-white font-black px-4 py-1 rounded-sm border border-red-400 text-xs tracking-widest shadow-lg animate-pulse">
          {killBanner}
        </div>
      )}

      {/* Dynamic Floating Touch Joystick Ring */}
      {joystickUI.visible && (
        <div
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40 bg-cyan-950/20"
          style={{
            left: joystickUI.ox,
            top: joystickUI.oy,
            width: 92,
            height: 92,
          }}
        >
          <div
            className="absolute rounded-full bg-cyan-400/80 shadow-[0_0_12px_#00f0ff] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: joystickUI.cx - joystickUI.ox + 46,
              top: joystickUI.cy - joystickUI.oy + 46,
              width: 36,
              height: 36,
            }}
          />
        </div>
      )}

      {/* Mobile Pure Touch Action Buttons */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Weapon Swap Button */}
        <button
          onClick={handleWeaponSwap}
          className="px-3.5 py-1.5 bg-gray-900/85 active:bg-gray-800 border border-cyan-500/50 rounded-sm text-cyan-300 font-bold text-xs tracking-wider shadow-md flex items-center gap-1.5"
        >
          <span>{WEAPONS[currentWeapon].label}</span>
          <span className="text-[10px] text-gray-400">[SWAP]</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Jump Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              handleJump();
            }}
            onClick={handleJump}
            className="w-16 h-16 rounded-full bg-blue-600/80 active:bg-blue-500 border-2 border-blue-300 text-white font-black text-sm flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span>JUMP</span>
            <span className="text-[9px] text-blue-200">PAD</span>
          </button>

          {/* Primary FIRE Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              touchStateRef.current.isFiring = true;
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              touchStateRef.current.isFiring = false;
            }}
            onMouseDown={() => {
              touchStateRef.current.isFiring = true;
            }}
            onMouseUp={() => {
              touchStateRef.current.isFiring = false;
            }}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 active:from-red-500 active:to-amber-400 border-2 border-amber-300 text-white font-black text-lg flex flex-col items-center justify-center shadow-[0_0_18px_rgba(255,80,0,0.5)] active:scale-95 transition-transform"
          >
            <span>FIRE</span>
            <span className="text-[10px] text-amber-200">HOLD</span>
          </button>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full bg-gray-900 border border-cyan-500/60 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-xl font-black text-cyan-400 tracking-wider mb-2">
              REPULS.IO 3D ARENA
            </div>
            <div className="text-xs text-gray-300 space-y-2 mb-5 leading-relaxed text-left">
              <p>• 🕹️ <b className="text-white">화면 좌측</b>: 360° 플로팅 조이스틱 이동</p>
              <p>• 👁️ <b className="text-white">화면 우측</b>: 드래그하여 카메라 조준 (에임)</p>
              <p>• 💥 <b className="text-amber-400">대형 [FIRE]</b>: 연속 사격 (홀드)</p>
              <p>• 🚀 <b className="text-blue-400">[JUMP] & 보라색 점프 패드</b>: 공중 도약</p>
              <p>• 🎯 <b className="text-yellow-400">목표</b>: 사이버 봇 12킬 달성 시 승리!</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-cyan-600 active:bg-cyan-500 text-white font-bold text-sm tracking-wider rounded-sm border border-cyan-400 shadow-md"
            >
              [ BATTLE START ]
            </button>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {gameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          rewardResult={rewardResult}
          onClaim={() => onBack()}
        />
      )}

      {/* Defeat / Game Over Modal */}
      {gameOver && rewardResult && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-4">
          <div className="max-w-sm w-full bg-gray-950 border border-red-500 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-2xl font-black text-red-500 mb-1">ARENA DEFEAT</div>
            <div className="text-xs text-gray-400 mb-4">전투 불능 상태가 되었습니다.</div>
            <div className="bg-black/60 p-3 rounded border border-gray-800 text-xs text-left mb-4 space-y-1">
              <div>처치 수: <span className="text-yellow-400 font-bold">{frags} Frags</span></div>
              <div>획득 보상: <span className="text-cyan-400 font-bold">+{rewardResult.depositedReward} SNS</span></div>
            </div>
            <button
              onClick={onBack}
              className="w-full py-2.5 bg-red-600 active:bg-red-500 text-white font-bold text-sm rounded-sm border border-red-400"
            >
              [ 나가기 ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokiRepulsGame;

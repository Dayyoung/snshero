import React, { useState, useEffect, useRef, useId } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiYouMonsterGameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

interface Building {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  size: { w: number; h: number; d: number };
  hp: number;
  maxHp: number;
  isCollapsed: boolean;
}

interface ArmyUnit {
  group: THREE.Group;
  pos: THREE.Vector3;
  type: 'tank' | 'copter';
  vel: THREE.Vector3;
  shootCooldown: number;
}

export const PokiYouMonsterGame: React.FC<PokiYouMonsterGameProps> = ({
  onBack,
  cardId = 54,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Rampage State
  const targetScore = 1500;
  const [rampageScore, setRampageScore] = useState(0);
  const [monsterScale, setMonsterScale] = useState(1.0);
  const [monsterHp, setMonsterHp] = useState(100);

  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [smashEffect, setSmashEffect] = useState(false);

  // Joystick & Touch State
  const touchStateRef = useRef({
    joystickActive: false,
    joystickOrigin: { x: 0, y: 0 },
    joystickCurrent: { x: 0, y: 0 },
    joystickVector: { x: 0, y: 0 },
  });

  const [joystickUI, setJoystickUI] = useState<{
    visible: boolean;
    ox: number;
    oy: number;
    cx: number;
    cy: number;
  }>({ visible: false, ox: 0, oy: 0, cx: 0, cy: 0 });

  // Engine Refs
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    monsterGroup: null as THREE.Group | null,
    monsterRightArm: null as THREE.Group | null,
    monsterTail: null as THREE.Group | null,
    breathBeam: null as THREE.Mesh | null,
    buildings: [] as Building[],
    army: [] as ArmyUnit[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    monsterPos: new THREE.Vector3(0, 0, 20),
    monsterYaw: Math.PI,
    monsterScale: 1.0,
    score: 0,
    hp: 100,
    isAttacking: false,
    attackTimer: 0,
    attackType: '' as 'smash' | 'tail' | 'breath' | '',
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

  // Main Three.js Initialization & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const game = gameRef.current;
    game.isDestroyed = false;
    game.score = 0;
    game.hp = 100;
    game.monsterScale = 1.0;
    game.monsterPos.set(0, 0, 20);
    game.monsterYaw = Math.PI;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    game.scene = scene;
    scene.background = new THREE.Color(0x12151e);
    scene.fog = new THREE.FogExp2(0x12151e, 0.018);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 150);
    camera.position.set(0, 14, 34);
    camera.lookAt(0, 2, 16);
    game.camera = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    game.renderer = renderer;

    // 3. Lighting (Moonlight & City Lights)
    const ambientLight = new THREE.AmbientLight(0xffe0cc, 0.65);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x7099ff, 1.4);
    moonLight.position.set(20, 40, 20);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    scene.add(moonLight);

    const redRampageLight = new THREE.DirectionalLight(0xff2200, 0.8);
    redRampageLight.position.set(-20, 20, -20);
    scene.add(redRampageLight);

    // 4. City Ground & Road Network (60m x 60m)
    const groundGeo = new THREE.PlaneGeometry(64, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f232b,
      roughness: 0.7,
      metalness: 0.2,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Road Markings Grid
    const grid = new THREE.GridHelper(64, 16, 0xffbb00, 0x333a48);
    grid.position.y = 0.02;
    scene.add(grid);

    // 5. 16 Destructible Skyscrapers (4x4 Blocks)
    game.buildings = [];
    const bColors = [0x2c3545, 0x384256, 0x1e2638, 0x475569];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const bx = (c - 1.5) * 12;
        const bz = (r - 1.5) * 12 - 4; // pushed slightly forward
        const bw = 4.5;
        const bd = 4.5;
        const bh = 7 + ((r * 4 + c) % 3) * 3; // 7, 10, 13m height

        const bGeo = new THREE.BoxGeometry(bw, bh, bd);
        const bMat = new THREE.MeshStandardMaterial({
          color: bColors[(r + c) % bColors.length],
          roughness: 0.4,
          metalness: 0.5,
        });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.set(bx, bh / 2, bz);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        scene.add(bMesh);

        // Windows illuminated pattern (yellow stripes)
        for (let w = 1; w < Math.floor(bh) - 1; w += 2) {
          const wStripe = new THREE.Mesh(
            new THREE.BoxGeometry(bw + 0.05, 0.4, bd + 0.05),
            new THREE.MeshBasicMaterial({ color: 0xffea75 })
          );
          wStripe.position.set(bx, w, bz);
          scene.add(wStripe);
        }

        game.buildings.push({
          mesh: bMesh,
          pos: new THREE.Vector3(bx, 0, bz),
          size: { w: bw, h: bh, d: bd },
          hp: 60,
          maxHp: 60,
          isCollapsed: false,
        });
      }
    }

    // 6. 3D Giant Kaiju Monster Model
    const monsterGroup = new THREE.Group();
    const kaijuMat = new THREE.MeshStandardMaterial({
      color: 0x184232,
      roughness: 0.5,
      metalness: 0.3,
    });
    const spikeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Kaiju Torso Body
    const bodyGeo = new THREE.BoxGeometry(1.8, 2.8, 1.6);
    const bodyMesh = new THREE.Mesh(bodyGeo, kaijuMat);
    bodyMesh.position.y = 2.2;
    bodyMesh.castShadow = true;
    monsterGroup.add(bodyMesh);

    // Kaiju Head & Jaws
    const headGeo = new THREE.BoxGeometry(1.2, 1.1, 1.6);
    const headMesh = new THREE.Mesh(headGeo, kaijuMat);
    headMesh.position.set(0, 3.8, 0.6);
    headMesh.castShadow = true;
    monsterGroup.add(headMesh);

    // Glowing Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), eyeMat);
    eyeL.position.set(-0.55, 3.9, 1.25);
    monsterGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), eyeMat);
    eyeR.position.set(0.55, 3.9, 1.25);
    monsterGroup.add(eyeR);

    // Neon Dorsal Spikes (Back Spikes)
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 4), spikeMat);
      spike.rotation.x = -Math.PI / 3;
      spike.position.set(0, 1.8 + i * 0.7, -0.9);
      monsterGroup.add(spike);
    }

    // Arms
    const armGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
    const leftArm = new THREE.Mesh(armGeo, kaijuMat);
    leftArm.position.set(-1.1, 2.5, 0.4);
    leftArm.rotation.x = Math.PI / 6;
    monsterGroup.add(leftArm);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(1.1, 2.8, 0.4);
    const rightArm = new THREE.Mesh(armGeo, kaijuMat);
    rightArm.position.set(0, -0.6, 0);
    rightArmGroup.add(rightArm);
    monsterGroup.add(rightArmGroup);
    game.monsterRightArm = rightArmGroup;

    // Legs
    const legGeo = new THREE.BoxGeometry(0.65, 1.6, 0.8);
    const leftLeg = new THREE.Mesh(legGeo, kaijuMat);
    leftLeg.position.set(-0.7, 0.8, -0.1);
    leftLeg.castShadow = true;
    monsterGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, kaijuMat);
    rightLeg.position.set(0.7, 0.8, -0.1);
    rightLeg.castShadow = true;
    monsterGroup.add(rightLeg);

    // Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 1.2, -0.8);
    const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 2.8, 8), kaijuMat);
    tailMesh.rotation.x = Math.PI / 2.8;
    tailMesh.position.set(0, -0.3, -1.2);
    tailGroup.add(tailMesh);
    monsterGroup.add(tailGroup);
    game.monsterTail = tailGroup;

    // Atomic Breath Beam (Hidden initially)
    const beamGeo = new THREE.CylinderGeometry(0.5, 0.8, 16, 16);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85 });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.rotation.x = Math.PI / 2;
    beamMesh.position.set(0, 3.8, 8.8);
    beamMesh.visible = false;
    monsterGroup.add(beamMesh);
    game.breathBeam = beamMesh;

    monsterGroup.position.copy(game.monsterPos);
    monsterGroup.rotation.y = game.monsterYaw;
    scene.add(monsterGroup);
    game.monsterGroup = monsterGroup;

    // 7. Spawn Army Defense Units (Tanks & Copters)
    game.army = [];
    // 3 Tanks
    for (let i = 0; i < 3; i++) {
      const tGroup = new THREE.Group();
      const tBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.8, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x3d4a34, roughness: 0.6 })
      );
      tBody.position.y = 0.4;
      tGroup.add(tBody);
      const tTurret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8),
        new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
      );
      tTurret.rotation.x = Math.PI / 2;
      tTurret.position.set(0, 0.7, 0.8);
      tGroup.add(tTurret);

      const tx = (i - 1) * 14;
      const tz = 12 + Math.random() * 8;
      tGroup.position.set(tx, 0, tz);
      scene.add(tGroup);

      game.army.push({
        group: tGroup,
        pos: new THREE.Vector3(tx, 0, tz),
        type: 'tank',
        vel: new THREE.Vector3((Math.random() - 0.5) * 3, 0, 0),
        shootCooldown: 1500 + Math.random() * 1000,
      });
    }

    // 2 Helicopters
    for (let i = 0; i < 2; i++) {
      const cGroup = new THREE.Group();
      const cBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.9, 2.4),
        new THREE.MeshStandardMaterial({ color: 0x223344 })
      );
      cGroup.add(cBody);
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.05, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      blade.position.y = 0.65;
      cGroup.add(blade);

      const cx = (i === 0 ? -12 : 12);
      const cz = 6;
      cGroup.position.set(cx, 6.5, cz);
      scene.add(cGroup);

      game.army.push({
        group: cGroup,
        pos: new THREE.Vector3(cx, 6.5, cz),
        type: 'copter',
        vel: new THREE.Vector3(0, 0, 0),
        shootCooldown: 800 + Math.random() * 800,
      });
    }

    // 8. Particle Debris Spawner
    const spawnDebris = (pos: THREE.Vector3, colorHex: number, count = 18) => {
      for (let i = 0; i < count; i++) {
        const pGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        const pMat = new THREE.MeshBasicMaterial({ color: colorHex });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        const v = new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          Math.random() * 8 + 2,
          (Math.random() - 0.5) * 10
        );
        game.particles.push({ mesh: pMesh, vel: v, life: 0.9 });
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

    // 10. Main Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      if (game.isDestroyed) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Monster Movement (Screen-relative via Joystick)
      const joy = touchStateRef.current.joystickVector;
      const speed = 9.0;

      if (joy.x !== 0 || joy.y !== 0) {
        // Calculate move angle
        const targetYaw = Math.atan2(joy.x, -joy.y);
        game.monsterYaw = THREE.MathUtils.lerp(game.monsterYaw, targetYaw, delta * 10);

        game.monsterPos.x += joy.x * speed * delta;
        game.monsterPos.z += joy.y * speed * delta;

        // Arena boundary clamp (-26 ~ 26)
        game.monsterPos.x = Math.max(-26, Math.min(26, game.monsterPos.x));
        game.monsterPos.z = Math.max(-26, Math.min(26, game.monsterPos.z));
      }

      // Update Monster Mesh Transform
      if (monsterGroup) {
        monsterGroup.position.copy(game.monsterPos);
        monsterGroup.rotation.y = game.monsterYaw;
        monsterGroup.scale.set(game.monsterScale, game.monsterScale, game.monsterScale);

        // Idle stomping gait
        if (joy.x !== 0 || joy.y !== 0) {
          monsterGroup.position.y = Math.abs(Math.sin(time * 0.008)) * 0.3;
        }
      }

      // Camera Follows Kaiju
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, game.monsterPos.x, delta * 4);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, game.monsterPos.z + 18, delta * 4);
      camera.lookAt(game.monsterPos.x, 2, game.monsterPos.z - 2);

      // Attack Animation & Logic Tick
      if (game.isAttacking) {
        game.attackTimer -= delta;

        if (game.attackType === 'smash' && game.monsterRightArm) {
          game.monsterRightArm.rotation.x = -Math.sin(game.attackTimer * 14) * 1.6;
        } else if (game.attackType === 'tail' && game.monsterTail) {
          game.monsterTail.rotation.y = Math.sin(game.attackTimer * 20) * 2.2;
        } else if (game.attackType === 'breath' && game.breathBeam) {
          game.breathBeam.visible = true;
        }

        if (game.attackTimer <= 0) {
          game.isAttacking = false;
          game.attackType = '';
          if (game.breathBeam) game.breathBeam.visible = false;
          if (game.monsterRightArm) game.monsterRightArm.rotation.x = 0;
          if (game.monsterTail) game.monsterTail.rotation.y = 0;
        }
      }

      // Update Army Units (Tanks & Copters)
      for (let i = game.army.length - 1; i >= 0; i--) {
        const unit = game.army[i];
        if (unit.type === 'tank') {
          unit.pos.x += unit.vel.x * delta;
          if (Math.abs(unit.pos.x) > 24) unit.vel.x *= -1;
          unit.group.position.copy(unit.pos);
        } else {
          // Copter spin blades & circle monster
          unit.group.children[1].rotation.y += delta * 25;
          unit.pos.x = game.monsterPos.x + Math.sin(time * 0.0015 + i * 3) * 12;
          unit.pos.z = game.monsterPos.z + Math.cos(time * 0.0015 + i * 3) * 12;
          unit.group.position.copy(unit.pos);
        }

        // Army shoots at Kaiju
        unit.shootCooldown -= delta * 1000;
        if (unit.shootCooldown <= 0) {
          unit.shootCooldown = 1500 + Math.random() * 1000;
          // Small bullet flash
          spawnDebris(unit.pos, 0xffaa00, 4);
        }

        // Check if monster stomps army unit
        const d = unit.pos.distanceTo(game.monsterPos);
        if (d < 3.2 * game.monsterScale) {
          spawnDebris(unit.pos, 0xff2200, 24);
          scene.remove(unit.group);
          game.army.splice(i, 1);
          game.score += 100;
          setRampageScore(game.score);
          if (navigator.vibrate) navigator.vibrate([30, 50]);
        }
      }

      // Update Particles
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.mesh.position.addScaledVector(p.vel, delta);
        p.vel.y -= 14 * delta;
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
  }, []);

  // Touch Handlers for Dynamic Floating Joystick
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0];
    if (t.clientX < window.innerWidth * 0.55 && !touchStateRef.current.joystickActive) {
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
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStateRef.current.joystickActive) return;
    const t = e.changedTouches[0];
    const ox = touchStateRef.current.joystickOrigin.x;
    const oy = touchStateRef.current.joystickOrigin.y;
    const dx = t.clientX - ox;
    const dy = t.clientY - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = 48;
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);

    const cx = ox + Math.cos(angle) * clampedDist;
    const cy = oy + Math.sin(angle) * clampedDist;

    touchStateRef.current.joystickCurrent = { x: cx, y: cy };
    touchStateRef.current.joystickVector = {
      x: clampedDist > 6 ? (dx / maxR) : 0,
      y: clampedDist > 6 ? (dy / maxR) : 0,
    };

    setJoystickUI((prev) => ({ ...prev, cx, cy }));
  };

  const handleTouchEnd = () => {
    if (touchStateRef.current.joystickActive) {
      touchStateRef.current.joystickActive = false;
      touchStateRef.current.joystickVector = { x: 0, y: 0 };
      setJoystickUI((prev) => ({ ...prev, visible: false }));
    }
  };

  // Perform Attack on Buildings
  const executeAttack = (type: 'smash' | 'tail' | 'breath') => {
    const game = gameRef.current;
    if (game.isAttacking) return;
    game.isAttacking = true;
    game.attackType = type;
    game.attackTimer = type === 'breath' ? 0.8 : 0.45;

    if (navigator.vibrate) navigator.vibrate(type === 'breath' ? [40, 60, 80] : 30);

    // Screen Shake effect
    setSmashEffect(true);
    setTimeout(() => setSmashEffect(false), 200);

    // Attack Hit Detection on Buildings
    const hitRadius = type === 'tail' ? 5.5 * game.monsterScale : 4.2 * game.monsterScale;
    const dmg = type === 'smash' ? 35 : type === 'tail' ? 25 : 50;

    game.buildings.forEach((b) => {
      if (b.isCollapsed) return;

      let hit = false;
      if (type === 'breath') {
        // Ray check forward
        const toB = b.pos.clone().sub(game.monsterPos);
        const forward = new THREE.Vector3(
          Math.sin(game.monsterYaw),
          0,
          Math.cos(game.monsterYaw)
        );
        const dot = toB.clone().normalize().dot(forward);
        if (dot > 0.8 && toB.length() < 18) hit = true;
      } else {
        // Radius check
        const d = b.pos.distanceTo(game.monsterPos);
        if (d < hitRadius) hit = true;
      }

      if (hit) {
        b.hp -= dmg;
        // Spawn debris at building
        if (game.scene) {
          const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
          const pMat = new THREE.MeshBasicMaterial({ color: 0x554433 });
          for (let i = 0; i < 10; i++) {
            const p = new THREE.Mesh(pGeo, pMat);
            p.position.set(b.pos.x, 3 + Math.random() * 3, b.pos.z);
            game.scene.add(p);
            game.particles.push({
              mesh: p,
              vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 6 + 2, (Math.random() - 0.5) * 6),
              life: 0.8,
            });
          }
        }

        if (b.hp <= 0) {
          b.isCollapsed = true;
          b.mesh.scale.set(1.0, 0.15, 1.0);
          b.mesh.position.y = 0.2;
          game.score += 150;
          setRampageScore(game.score);

          // Growth Check
          if (game.score >= 1000 && game.monsterScale < 2.0) {
            game.monsterScale = 2.0;
            setMonsterScale(2.0);
          } else if (game.score >= 500 && game.monsterScale < 1.5) {
            game.monsterScale = 1.5;
            setMonsterScale(1.5);
          }

          // Win condition check
          if (game.score >= targetScore && !gameWon) {
            setGameWon(true);
            const result = calculateAndDepositMissionReward({
              gameId: 'poki_you_monster',
              gameTitle: 'You Monster! 3D',
              isVictory: true,
              score: 1500,
              maxTargetScore: 1500,
              durationSeconds: Math.floor((Date.now() - game.startTime) / 1000),
            });
            setRewardResult(result);
          }
        }
      }
    });
  };

  const hudUniqueId = useId();

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#12151e] font-mono text-white ${
        smashEffect ? 'translate-y-1' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Minimalist Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        key={hudUniqueId}
        title="YOU MONSTER! 3D"
        progress={`${rampageScore} / ${targetScore} PTS`}
        onGiveUp={() => {
          const res = calculateAndDepositMissionReward({
            gameId: 'poki_you_monster',
            gameTitle: 'You Monster! 3D',
            isVictory: false,
            score: rampageScore,
            maxTargetScore: 1500,
            durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
          });
          setRewardResult(res);
        }}
      />

      {/* Hero Badge & Monster Growth */}
      <div className="absolute top-14 left-3 z-20 flex items-center gap-2 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded-sm border border-emerald-500/30">
        <canvas
          ref={heroBadgeCanvasRef}
          width={48}
          height={48}
          className="w-8 h-8 rounded border border-emerald-400/50 bg-black/40"
        />
        <div className="text-xs">
          <div className="text-emerald-400 font-bold">KAIJU RAMPAGE</div>
          <div className="text-[10px] text-gray-300">
            크기: <span className="text-cyan-400 font-bold">{monsterScale}x SCALE</span>
          </div>
        </div>
      </div>

      {/* Rampage Target */}
      <div className="absolute top-14 right-3 z-20 pointer-events-none bg-black/60 px-3 py-1.5 rounded-sm border border-red-500/30 text-right">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider">RAMPAGE TARGET</div>
        <div className="text-sm font-black text-amber-400 tracking-wider">
          {rampageScore} / {targetScore} PTS
        </div>
      </div>

      {/* Dynamic Floating Touch Joystick */}
      {joystickUI.visible && (
        <div
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/40 bg-emerald-950/20"
          style={{
            left: joystickUI.ox,
            top: joystickUI.oy,
            width: 96,
            height: 96,
          }}
        >
          <div
            className="absolute rounded-full bg-emerald-400/80 shadow-[0_0_12px_#10b981] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: joystickUI.cx - joystickUI.ox + 48,
              top: joystickUI.cy - joystickUI.oy + 48,
              width: 38,
              height: 38,
            }}
          />
        </div>
      )}

      {/* Mobile Pure Touch Action Buttons */}
      <div className="absolute bottom-6 right-4 z-20 flex items-end gap-2.5 pointer-events-auto">
        {/* Atomic Breath Button */}
        <button
          onClick={() => executeAttack('breath')}
          className="w-16 h-16 rounded-full bg-cyan-600/85 active:bg-cyan-500 border-2 border-cyan-300 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_0_14px_rgba(0,240,255,0.4)] active:scale-95"
        >
          <span>🔥</span>
          <span className="text-[9px] text-cyan-100">BREATH</span>
        </button>

        {/* Tail Swipe Button */}
        <button
          onClick={() => executeAttack('tail')}
          className="w-16 h-16 rounded-full bg-emerald-600/85 active:bg-emerald-500 border-2 border-emerald-300 text-white font-black text-xs flex flex-col items-center justify-center shadow-lg active:scale-95"
        >
          <span>🦖</span>
          <span className="text-[9px] text-emerald-100">TAIL</span>
        </button>

        {/* Primary Smash Button */}
        <button
          onClick={() => executeAttack('smash')}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 active:from-red-500 active:to-amber-400 border-2 border-amber-300 text-white font-black text-base flex flex-col items-center justify-center shadow-[0_0_18px_rgba(255,50,0,0.5)] active:scale-95"
        >
          <span>💥 SMASH</span>
          <span className="text-[9px] text-amber-200">POUND</span>
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full bg-gray-900 border border-emerald-500/60 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-xl font-black text-emerald-400 tracking-wider mb-2">
              YOU MONSTER! 3D
            </div>
            <div className="text-xs text-gray-300 space-y-2 mb-5 leading-relaxed text-left">
              <p>• 🕹️ <b className="text-white">화면 좌측</b>: 360° 플로팅 조이스틱으로 괴수 조종</p>
              <p>• 💥 <b className="text-amber-400">[SMASH]</b>: 전방 빌딩 & 전차 강타 분쇄</p>
              <p>• 🦖 <b className="text-emerald-400">[TAIL]</b>: 360도 회전 꼬리치기 광역 파괴</p>
              <p>• 🔥 <b className="text-cyan-400">[BREATH]</b>: 초고열 아토믹 브레스 관통 광선!</p>
              <p>• 🏆 <b className="text-yellow-400">목표</b>: 람페이지 1,500점 달성 시 도시 정복 승리!</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-emerald-600 active:bg-emerald-500 text-white font-bold text-sm tracking-wider rounded-sm border border-emerald-400 shadow-md"
            >
              [ 도시 침공 시작 ]
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
    </div>
  );
};

export default PokiYouMonsterGame;

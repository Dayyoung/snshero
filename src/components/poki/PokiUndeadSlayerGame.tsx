import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiUndeadSlayerGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

const TARGET_KILLS = 25;
const ARENA_SIZE = 18;

interface UndeadMonster {
  mesh: THREE.Group;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  alive: boolean;
  type: 'skeleton' | 'zombie' | 'boss';
}

export default function PokiUndeadSlayerGame({
  onBack,
  onClose,
  cardId = 100,
  onExit
}: PokiUndeadSlayerGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleExit = onBack || onClose || (() => {});

  // Game States
  const [kills, setKills] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [combo, setCombo] = useState<number>(0);
  const [whirlwindCooldown, setWhirlwindCooldown] = useState<number>(0);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Joystick States
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });

  // Input & Physics Refs
  const inputRef = useRef({
    moveX: 0,
    moveZ: 0,
    isSlashing: false,
    isWhirlwinding: false,
    slashAngle: 0,
  });
  const startTimeRef = useRef<number>(Date.now());
  const matchActiveRef = useRef<boolean>(true);

  // Three.js Scene References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    bladeMesh: THREE.Mesh;
    slashArcMesh: THREE.Mesh;
    monsters: UndeadMonster[];
    particlesGroup: THREE.Group;
    playerPos: THREE.Vector3;
    playerHpRef: number;
    killsRef: number;
    comboRef: number;
    slashTimer: number;
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

  // Sparkles & Slash Particles Emitter
  const spawnHitEffect = useCallback((pos: THREE.Vector3, colorHex: number, count = 16) => {
    if (!threeRef.current) return;
    const { particlesGroup } = threeRef.current;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y + 0.8;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 4 + 1.0,
          (Math.random() - 0.5) * 5
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
      life += 0.06;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + velocities[i].x * 0.02,
          posAttr.getY(i) + velocities[i].y * 0.02 - 0.03,
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

  // Victory Handler
  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    matchActiveRef.current = false;
    triggerHaptic(80);

    const durationSeconds = Math.max(15, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiundeadslayer',
      gameTitle: 'Undead Slayer 3D',
      isVictory: true,
      score: 500,
      maxTargetScore: 500,
      durationSeconds,
    });
    setRewardReceipt(receipt);
  }, [gameWon]);

  // Monster Mesh Builder
  const createMonsterMesh = (type: 'skeleton' | 'zombie' | 'boss'): THREE.Group => {
    const group = new THREE.Group();
    const isBoss = type === 'boss';
    const isZombie = type === 'zombie';

    const skinColor = isBoss ? 0x7f1d1d : isZombie ? 0x15803d : 0xe2e8f0;
    const scale = isBoss ? 1.6 : 1.0;

    // Body
    const bodyGeom = new THREE.CylinderGeometry(0.32 * scale, 0.38 * scale, 1.1 * scale, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.6 * scale;
    body.castShadow = true;
    group.add(body);

    // Skull/Head
    const headGeom = new THREE.SphereGeometry(0.26 * scale, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.4 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.3 * scale;
    group.add(head);

    // Glowing Red Eyes
    const eyeGeom = new THREE.SphereGeometry(0.06 * scale, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.1 * scale, 1.35 * scale, 0.22 * scale);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.1 * scale, 1.35 * scale, 0.22 * scale);
    group.add(eyeL, eyeR);

    // Weapon (Bone Club or Axe)
    const weapGeom = new THREE.BoxGeometry(0.12 * scale, 0.8 * scale, 0.12 * scale);
    const weapMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const weap = new THREE.Mesh(weapGeom, weapMat);
    weap.position.set(0.45 * scale, 0.7 * scale, 0.2 * scale);
    group.add(weap);

    return group;
  };

  // Trigger Slash Attack
  const handleSlash = useCallback(() => {
    if (!threeRef.current || !matchActiveRef.current) return;
    triggerHaptic(30);

    inputRef.current.isSlashing = true;
    threeRef.current.slashTimer = 0.25;

    const { playerPos, monsters, slashArcMesh, playerGroup } = threeRef.current;
    slashArcMesh.visible = true;

    // Check hit monsters in front 180 degrees within 2.8m
    let hitCount = 0;
    const playerFacing = playerGroup.rotation.y;

    monsters.forEach((m) => {
      if (!m.alive) return;
      const dx = m.x - playerPos.x;
      const dz = m.z - playerPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 3.2) {
        // Hit!
        hitCount++;
        m.hp -= 40;
        // Knockback
        m.x += (dx / dist) * 1.5;
        m.z += (dz / dist) * 1.5;

        spawnHitEffect(new THREE.Vector3(m.x, 0.5, m.z), 0x38bdf8, 12);

        if (m.hp <= 0) {
          m.alive = false;
          m.mesh.visible = false;
          threeRef.current!.killsRef += 1;
          const newKills = threeRef.current!.killsRef;
          setKills(newKills);

          if (newKills >= TARGET_KILLS) {
            handleVictory();
          }
        }
      }
    });

    if (hitCount > 0) {
      threeRef.current.comboRef += hitCount;
      setCombo(threeRef.current.comboRef);
    }
  }, [handleVictory, spawnHitEffect]);

  // Trigger Whirlwind Special Skill
  const handleWhirlwind = useCallback(() => {
    if (!threeRef.current || whirlwindCooldown > 0 || !matchActiveRef.current) return;
    triggerHaptic(60);

    inputRef.current.isWhirlwinding = true;
    setWhirlwindCooldown(5); // 5 sec cooldown

    const { playerPos, monsters } = threeRef.current;
    spawnHitEffect(playerPos, 0xfacc15, 35);

    // 360 degree radial hit within 4.5m
    let killsAdded = 0;
    monsters.forEach((m) => {
      if (!m.alive) return;
      const dist = Math.hypot(m.x - playerPos.x, m.z - playerPos.z);
      if (dist < 4.8) {
        m.hp -= 90;
        m.x += ((m.x - playerPos.x) / (dist || 1)) * 3.0;
        m.z += ((m.z - playerPos.z) / (dist || 1)) * 3.0;

        spawnHitEffect(new THREE.Vector3(m.x, 0.5, m.z), 0xf59e0b, 15);

        if (m.hp <= 0) {
          m.alive = false;
          m.mesh.visible = false;
          killsAdded++;
        }
      }
    });

    if (killsAdded > 0) {
      threeRef.current.killsRef += killsAdded;
      const totalK = threeRef.current.killsRef;
      setKills(totalK);
      if (totalK >= TARGET_KILLS) {
        handleVictory();
      }
    }

    setTimeout(() => {
      inputRef.current.isWhirlwinding = false;
    }, 500);
  }, [handleVictory, spawnHitEffect, whirlwindCooldown]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0508);
    scene.fog = new THREE.Fog(0x0a0508, 20, 50);

    // 2. Camera (Quarter-view Dynamic Camera)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 16, 14);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xa5b4fc, 1.2);
    moonLight.position.set(10, 25, 10);
    moonLight.castShadow = true;
    scene.add(moonLight);

    // 4 Corner Flaming Torches
    const torchColors = [0xf97316, 0xef4444, 0xf97316, 0xef4444];
    const torchPositions = [
      [-ARENA_SIZE / 2, -ARENA_SIZE / 2],
      [ARENA_SIZE / 2, -ARENA_SIZE / 2],
      [-ARENA_SIZE / 2, ARENA_SIZE / 2],
      [ARENA_SIZE / 2, ARENA_SIZE / 2],
    ];

    torchPositions.forEach(([tx, tz], i) => {
      const tPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 3.5, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      tPillar.position.set(tx, 1.75, tz);
      scene.add(tPillar);

      const tLight = new THREE.PointLight(torchColors[i], 1.8, 15);
      tLight.position.set(tx, 3.6, tz);
      scene.add(tLight);
    });

    // 5. Arena Ground (Dark Stone Slabs)
    const floorGeom = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Outer Stone Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
    const wallH = 2.0;
    const wTop = new THREE.Mesh(new THREE.BoxGeometry(ARENA_SIZE, wallH, 1.0), wallMat);
    wTop.position.set(0, wallH / 2, -ARENA_SIZE / 2);
    const wBot = new THREE.Mesh(new THREE.BoxGeometry(ARENA_SIZE, wallH, 1.0), wallMat);
    wBot.position.set(0, wallH / 2, ARENA_SIZE / 2);
    const wLeft = new THREE.Mesh(new THREE.BoxGeometry(1.0, wallH, ARENA_SIZE), wallMat);
    wLeft.position.set(-ARENA_SIZE / 2, wallH / 2, 0);
    const wRight = new THREE.Mesh(new THREE.BoxGeometry(1.0, wallH, ARENA_SIZE), wallMat);
    wRight.position.set(ARENA_SIZE / 2, wallH / 2, 0);
    scene.add(wTop, wBot, wLeft, wRight);

    // 6. Central Sanctuary Altar & Hero Badge Monolith
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const badgeCtx = heroBadgeCanvas.getContext('2d')!;
    drawCardSprite(badgeCtx, cardId, 0, 0, 128, 128, { circleClip: true });
    const heroBadgeTexture = new THREE.CanvasTexture(heroBadgeCanvas);

    const altarGeom = new THREE.CylinderGeometry(2.2, 2.6, 0.4, 16);
    const altarMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.5, metalness: 0.5 });
    const altar = new THREE.Mesh(altarGeom, altarMat);
    altar.position.set(0, 0.2, 0);
    scene.add(altar);

    const badgePlaneGeom = new THREE.PlaneGeometry(1.5, 1.5);
    const badgePlaneMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const badgePlane = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
    badgePlane.rotation.x = -Math.PI / 2;
    badgePlane.position.set(0, 0.42, 0);
    scene.add(badgePlane);

    // 7. Player (Undead Slayer) Entity
    const playerGroup = new THREE.Group();

    // Body
    const pBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.32, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 })
    );
    pBody.position.y = 0.65;
    playerGroup.add(pBody);

    // Head with Scarf
    const pHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffdbac })
    );
    pHead.position.y = 1.35;
    playerGroup.add(pHead);

    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.08, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 })
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.22;
    playerGroup.add(scarf);

    // Crescent Blade (Giant Guan Dao / Greatsword)
    const bladeGeom = new THREE.BoxGeometry(0.12, 1.8, 0.28);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.1 });
    const bladeMesh = new THREE.Mesh(bladeGeom, bladeMat);
    bladeMesh.position.set(0.55, 0.9, 0.3);
    bladeMesh.rotation.z = -Math.PI / 6;
    playerGroup.add(bladeMesh);

    // Blue Slash Arc Mesh (Shown on attack)
    const arcGeom = new THREE.RingGeometry(1.8, 2.8, 24, 1, -Math.PI / 3, (Math.PI * 2) / 3);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const slashArcMesh = new THREE.Mesh(arcGeom, arcMat);
    slashArcMesh.rotation.x = -Math.PI / 2;
    slashArcMesh.position.y = 0.8;
    slashArcMesh.visible = false;
    playerGroup.add(slashArcMesh);

    // Foot Ring Indicator
    const ringGeom = new THREE.RingGeometry(0.7, 0.85, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const fRing = new THREE.Mesh(ringGeom, ringMat);
    fRing.rotation.x = -Math.PI / 2;
    fRing.position.y = 0.02;
    playerGroup.add(fRing);

    playerGroup.position.set(0, 0, 4);
    scene.add(playerGroup);

    // 8. Monsters Pool (Initial 6 Undead)
    const monsters: UndeadMonster[] = [];
    const spawnMonster = (type: 'skeleton' | 'zombie' | 'boss', mx: number, mz: number) => {
      const mMesh = createMonsterMesh(type);
      mMesh.position.set(mx, 0, mz);
      scene.add(mMesh);
      monsters.push({
        mesh: mMesh,
        x: mx,
        z: mz,
        hp: type === 'boss' ? 150 : 60,
        maxHp: type === 'boss' ? 150 : 60,
        speed: type === 'skeleton' ? 2.8 : 2.0,
        alive: true,
        type,
      });
    };

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const dist = 6 + Math.random() * 2;
      spawnMonster(i % 2 === 0 ? 'skeleton' : 'zombie', Math.cos(angle) * dist, Math.sin(angle) * dist);
    }

    // 9. Particles Group
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerGroup,
      bladeMesh,
      slashArcMesh,
      monsters,
      particlesGroup,
      playerPos: new THREE.Vector3(0, 0, 4),
      playerHpRef: 100,
      killsRef: 0,
      comboRef: 0,
      slashTimer: 0,
    };

    // 10. Animation & AI Battle Loop
    let animFrameId: number;
    const clock = new THREE.Clock();
    let monsterSpawnTimer = 0;

    const gameLoop = () => {
      animFrameId = requestAnimationFrame(gameLoop);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (threeRef.current && matchActiveRef.current) {
        const input = inputRef.current;
        const { playerPos, playerGroup, camera, monsters, slashArcMesh } = threeRef.current;

        // Player Movement (Screen-relative)
        const speed = input.isWhirlwinding ? 6.5 : 5.0;
        playerPos.x += input.moveX * speed * delta;
        playerPos.z += input.moveZ * speed * delta;

        playerPos.x = THREE.MathUtils.clamp(playerPos.x, -ARENA_SIZE / 2 + 1.2, ARENA_SIZE / 2 - 1.2);
        playerPos.z = THREE.MathUtils.clamp(playerPos.z, -ARENA_SIZE / 2 + 1.2, ARENA_SIZE / 2 - 1.2);
        playerGroup.position.copy(playerPos);

        // Player Rotation Facing
        if (Math.hypot(input.moveX, input.moveZ) > 0.1) {
          playerGroup.rotation.y = Math.atan2(input.moveX, input.moveZ);
        }

        // Whirlwind Spin Animation
        if (input.isWhirlwinding) {
          playerGroup.rotation.y += delta * 25;
        }

        // Slash Arc Visibility Timer
        if (threeRef.current.slashTimer > 0) {
          threeRef.current.slashTimer -= delta;
          if (threeRef.current.slashTimer <= 0) {
            slashArcMesh.visible = false;
            input.isSlashing = false;
          }
        }

        // Monster Respawn Loop
        monsterSpawnTimer += delta;
        if (monsterSpawnTimer >= 2.0) {
          monsterSpawnTimer = 0;
          const deadMonster = monsters.find((m) => !m.alive);
          if (deadMonster) {
            deadMonster.alive = true;
            deadMonster.mesh.visible = true;
            deadMonster.hp = deadMonster.maxHp;
            const sAngle = Math.random() * Math.PI * 2;
            deadMonster.x = Math.cos(sAngle) * 7.5;
            deadMonster.z = Math.sin(sAngle) * 7.5;
            deadMonster.mesh.position.set(deadMonster.x, 0, deadMonster.z);
          }
        }

        // Monster AI Chase & Attack
        monsters.forEach((m) => {
          if (!m.alive) return;

          const dx = playerPos.x - m.x;
          const dz = playerPos.z - m.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.8) {
            m.x += (dx / dist) * m.speed * delta;
            m.z += (dz / dist) * m.speed * delta;
            m.mesh.position.set(m.x, 0, m.z);
            m.mesh.rotation.y = Math.atan2(dx, dz);
          } else {
            // Attack Player!
            threeRef.current!.playerHpRef = Math.max(0, threeRef.current!.playerHpRef - 4 * delta);
            setPlayerHp(Math.floor(threeRef.current!.playerHpRef));
          }
        });

        // Camera Smooth Follow
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerPos.x * 0.4, 0.1);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, playerPos.z + 13, 0.1);
        camera.lookAt(playerPos.x * 0.5, 0.5, playerPos.z);

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
  }, [cardId]);

  // Whirlwind Cooldown Timer
  useEffect(() => {
    if (whirlwindCooldown <= 0) return;
    const t = setInterval(() => {
      setWhirlwindCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [whirlwindCooldown]);

  // Touch & Joystick Controls (Mobile Pure Touch)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameWon) return;
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth * 0.65) {
      setJoystickActive(true);
      setJoystickCenter({ x: touch.clientX, y: touch.clientY });
      setJoystickKnob({ x: touch.clientX, y: touch.clientY });
      inputRef.current.moveX = 0;
      inputRef.current.moveZ = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickActive || gameWon) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickCenter.x;
    const dy = touch.clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;

    if (dist <= maxRadius) {
      setJoystickKnob({ x: touch.clientX, y: touch.clientY });
      inputRef.current.moveX = dx / maxRadius;
      inputRef.current.moveZ = dy / maxRadius;
    } else {
      const angle = Math.atan2(dy, dx);
      setJoystickKnob({
        x: joystickCenter.x + Math.cos(angle) * maxRadius,
        y: joystickCenter.y + Math.sin(angle) * maxRadius,
      });
      inputRef.current.moveX = Math.cos(angle);
      inputRef.current.moveZ = Math.sin(angle);
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    inputRef.current.moveX = 0;
    inputRef.current.moveZ = 0;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0a0508] font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js Canvas mounts here */}

      {/* Top Minimalist HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="UNDEAD SLAYER 3D"
        progress={Math.min(100, (kills / TARGET_KILLS) * 100)}
        score={kills * 20}
        maxScore={TARGET_KILLS * 20}
        onQuit={handleExit}
      />

      {/* Top Center Status Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-rose-500/40 shadow-2xl backdrop-blur-md flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-rose-400">
            <span>💀 KILLS:</span>
            <span>{kills}/{TARGET_KILLS}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400">
            <span>❤️ HP:</span>
            <span>{playerHp}%</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-xs sm:text-sm font-bold text-amber-400">
            COMBO x{combo}
          </div>
        </div>
      </div>

      {/* Floating Joystick Visual Feedback */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
          style={{ left: joystickCenter.x, top: joystickCenter.y }}
        >
          <div className="w-[100px] h-[100px] rounded-full border-2 border-rose-500/60 bg-rose-950/40 backdrop-blur-xs flex items-center justify-center shadow-lg" />
          <div
            className="absolute w-12 h-12 rounded-full bg-rose-500/90 border border-white/80 shadow-md -translate-x-1/2 -translate-y-1/2"
            style={{
              left: joystickKnob.x - joystickCenter.x + 50,
              top: joystickKnob.y - joystickCenter.y + 50,
            }}
          />
        </div>
      )}

      {/* Combat Buttons (Mobile Pure Touch) */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex items-center gap-3">
        {/* Whirlwind Skill Button */}
        <button
          type="button"
          onClick={handleWhirlwind}
          disabled={whirlwindCooldown > 0}
          className={`pointer-events-auto w-16 h-16 rounded-2xl border font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center backdrop-blur-md cursor-pointer ${
            whirlwindCooldown > 0
              ? 'bg-slate-900/60 border-slate-700 text-slate-500'
              : 'bg-amber-500/90 border-amber-300 text-slate-950 shadow-amber-500/30 animate-pulse'
          }`}
        >
          <span className="text-xl">🌪️</span>
          <span className="text-[8px]">{whirlwindCooldown > 0 ? `${whirlwindCooldown}s` : 'SPIN'}</span>
        </button>

        {/* 76px Big Blade Slash Button */}
        <button
          type="button"
          onClick={handleSlash}
          className="pointer-events-auto h-[76px] px-8 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-base uppercase tracking-wider shadow-2xl shadow-rose-600/50 active:scale-95 transition-all flex items-center gap-3 border border-rose-400/60 cursor-pointer"
        >
          <span className="text-2xl animate-spin">⚔️</span>
          <span>BLADE SLASH</span>
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Flame, Snowflake, Zap, ShieldAlert, Sparkles, RefreshCw, Trophy, Heart } from 'lucide-react';

interface PokiMagicBattlegroundGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;
}

type SpellType = 'fire' | 'ice' | 'lightning';

interface SpellProjectile {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  type: SpellType;
  isPlayer: boolean;
  alive: boolean;
  life: number;
}

interface MageEntity {
  group: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  hp: number;
  maxHp: number;
  isPlayer: boolean;
  color: number;
  alive: boolean;
  frozenTimer: number;
  aiCooldown: number;
  staff: THREE.Mesh;
}

export default function PokiMagicBattlegroundGame({
  onClose,
  onBack,
  cardId = 61,
}: PokiMagicBattlegroundGameProps) {
  const handleExit = onBack || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI state
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMana, setPlayerMana] = useState(100);
  const [aliveCount, setAliveCount] = useState(4);
  const [score, setScore] = useState(0);
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Floating Joystick
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickBase, setJoystickBase] = useState({ x: 0, y: 0 });
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const inputDirRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tracking refs
  const startTimeRef = useRef<number>(Date.now());
  const playerHpRef = useRef<number>(100);
  const playerManaRef = useRef<number>(100);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    playerHpRef.current = playerHp;
    playerManaRef.current = playerMana;
    scoreRef.current = score;
  }, [playerHp, playerMana, score]);

  // Three.js Context
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mages: MageEntity[];
    projectiles: SpellProjectile[];
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
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

  // Helper: Magic Circle Arena Texture
  const createArenaTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = '#1e1b4b'; // Deep mystic indigo
    ctx.fillRect(0, 0, 512, 512);

    // Glowing Arcane Rings
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 256, 100, 0, Math.PI * 2);
    ctx.stroke();

    // Arcane Star
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.moveTo(256, 256);
      ctx.lineTo(256 + Math.cos(a) * 240, 256 + Math.sin(a) * 240);
    }
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  };

  // Trigger Magic Sparks
  const triggerMagicBurst = useCallback((x: number, y: number, z: number, colorHex: number, count = 35) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) navigator.vibrate([40, 20, 60]);

    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];
    const baseColor = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;

      col[i * 3] = baseColor.r;
      col[i * 3 + 1] = baseColor.g;
      col[i * 3 + 2] = baseColor.b;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        2.0 + Math.random() * 5,
        (Math.random() - 0.5) * 8
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

  // Player Cast Spell Handler
  const handleCastSpell = (type: SpellType) => {
    const three = threeRef.current;
    if (!three || gameOver || gameWon) return;

    const manaCost = type === 'fire' ? 25 : type === 'ice' ? 20 : 15;
    if (playerManaRef.current < manaCost) {
      setEventBanner('마나가 부족합니다!');
      setTimeout(() => setEventBanner(null), 800);
      return;
    }

    setPlayerMana((m) => Math.max(0, m - manaCost));

    const player = three.mages[0];
    if (!player || !player.alive) return;

    // Cast direction (Player facing angle or forward -Z)
    const rot = player.group.rotation.y;
    const dir = new THREE.Vector3(-Math.sin(rot), 0, -Math.cos(rot)).normalize();
    const spawnP = player.pos.clone().add(dir.clone().multiplyScalar(1.2));
    spawnP.y = 1.2;

    const speed = type === 'lightning' ? 24.0 : 16.0;
    const vel = dir.multiplyScalar(speed);

    // Create 3D Projectile Mesh
    let sGeo: THREE.BufferGeometry = new THREE.SphereGeometry(0.35, 12, 12);
    let colorHex = 0xef4444;

    if (type === 'ice') {
      sGeo = new THREE.ConeGeometry(0.25, 0.9, 8);
      colorHex = 0x38bdf8;
    } else if (type === 'lightning') {
      sGeo = new THREE.OctahedronGeometry(0.28, 0);
      colorHex = 0xfacc15;
    }

    const sMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.8,
    });
    const sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.copy(spawnP);
    if (type === 'ice') {
      sMesh.rotation.x = Math.PI / 2;
    }
    three.scene.add(sMesh);

    three.projectiles.push({
      mesh: sMesh,
      pos: spawnP,
      vel,
      type,
      isPlayer: true,
      alive: true,
      life: 2.5,
    });

    if (navigator.vibrate) navigator.vibrate(30);
  };

  // Restart Handler
  const handleRestart = () => {
    setPlayerHp(100);
    setPlayerMana(100);
    setAliveCount(4);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();

    if (threeRef.current) {
      // Reset mages
      threeRef.current.mages[0].pos.set(0, 0, 8);
      threeRef.current.mages[0].group.position.set(0, 0, 8);
      threeRef.current.mages[0].hp = 100;
      threeRef.current.mages[0].alive = true;
      threeRef.current.mages[0].group.visible = true;

      // Reset AI mages
      const spawns = [
        new THREE.Vector3(0, 0, -8),
        new THREE.Vector3(-8, 0, 0),
        new THREE.Vector3(8, 0, 0),
      ];
      for (let i = 1; i < 4; i++) {
        const m = threeRef.current.mages[i];
        m.pos.copy(spawns[i - 1]);
        m.group.position.copy(spawns[i - 1]);
        m.hp = 80;
        m.alive = true;
        m.frozenTimer = 0;
        m.group.visible = true;
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
    scene.background = new THREE.Color(0x0f0b29); // Cosmic mystic purple
    scene.fog = new THREE.FogExp2(0x0f0b29, 0.018);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 16, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Mystic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const magicSun = new THREE.DirectionalLight(0xc084fc, 1.4);
    magicSun.position.set(10, 25, 10);
    magicSun.castShadow = true;
    scene.add(magicSun);

    // 4 Corner Levitating Crystals
    const crystalGeo = new THREE.OctahedronGeometry(1.0, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const crystals: THREE.Mesh[] = [];
    const crystalAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (const a of crystalAngles) {
      const c = new THREE.Mesh(crystalGeo, crystalMat);
      c.position.set(Math.cos(a) * 16, 3, Math.sin(a) * 16);
      scene.add(c);
      crystals.push(c);
    }

    // Circular Floating Arena (Radius = 14m)
    const arenaGeo = new THREE.CylinderGeometry(14, 13, 1.8, 48);
    const arenaMat = new THREE.MeshStandardMaterial({
      map: createArenaTexture(),
      roughness: 0.4,
      metalness: 0.3,
    });
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.y = -0.9;
    arena.receiveShadow = true;
    scene.add(arena);

    // Glowing edge boundary ring
    const edgeGeo = new THREE.TorusGeometry(14, 0.2, 8, 48);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const edgeRing = new THREE.Mesh(edgeGeo, edgeMat);
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.05;
    scene.add(edgeRing);

    // Helper: Create 3D Mage Model
    const createMage = (colorHex: number, isPlayer: boolean, spawnP: THREE.Vector3) => {
      const group = new THREE.Group();
      group.position.copy(spawnP);

      const robeMat = new THREE.MeshLambertMaterial({ color: colorHex });
      const skinMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });

      // Robe (Cone)
      const robe = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.4, 12), robeMat);
      robe.position.y = 0.7;
      group.add(robe);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), skinMat);
      head.position.y = 1.5;
      group.add(head);

      // Wizard Hat
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 12), robeMat);
      hatBrim.position.y = 1.7;
      group.add(hatBrim);

      const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.75, 12), robeMat);
      hatCone.position.y = 2.05;
      hatCone.rotation.x = -0.15;
      group.add(hatCone);

      // Staff
      const staffMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8), staffMat);
      staff.position.set(0.45, 0.8, -0.3);
      group.add(staff);

      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 8),
        new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.8 })
      );
      orb.position.y = 0.85;
      staff.add(orb);

      // Card Badge for Player
      if (isPlayer) {
        const badgeGeo = new THREE.PlaneGeometry(0.65, 0.82);
        const badgeMat = new THREE.MeshBasicMaterial({
          map: createCardBadgeTexture(cardId),
          transparent: true,
          side: THREE.DoubleSide,
        });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0, 2.7, 0);
        group.add(badge);
      }

      scene.add(group);

      return {
        group,
        pos: spawnP.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        hp: isPlayer ? 100 : 80,
        maxHp: isPlayer ? 100 : 80,
        isPlayer,
        color: colorHex,
        alive: true,
        frozenTimer: 0,
        aiCooldown: 1.0 + Math.random(),
        staff,
      };
    };

    // 4 Mages: 1 Player + 3 AI Rivals
    const mages: MageEntity[] = [];
    mages.push(createMage(0x2563eb, true, new THREE.Vector3(0, 0, 8))); // Player (South Safe spawn)
    mages.push(createMage(0xdc2626, false, new THREE.Vector3(0, 0, -8))); // Pyromancer (North)
    mages.push(createMage(0x7c3aed, false, new THREE.Vector3(-8, 0, 0))); // Warlock (West)
    mages.push(createMage(0x059669, false, new THREE.Vector3(8, 0, 0))); // Druid (East)

    threeRef.current = {
      scene,
      camera,
      renderer,
      mages,
      projectiles: [],
      particles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
      cameraShake: 0,
    };

    // Main Game Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Rotate crystals
      for (const c of crystals) {
        c.rotation.y += delta * 1.5;
        c.position.y = 3 + Math.sin(three.clock.getElapsedTime() * 2) * 0.4;
      }

      // Natural Mana Regeneration
      setPlayerMana((m) => Math.min(100, m + delta * 12));

      // Player Movement
      const player = three.mages[0];
      const inp = inputDirRef.current;
      const isMoving = Math.hypot(inp.x, inp.y) > 0.1;

      if (player.alive && player.frozenTimer <= 0) {
        if (isMoving) {
          const speed = 7.5;
          player.vel.x = inp.x * speed;
          player.vel.z = inp.y * speed;

          const targetRot = Math.atan2(-inp.x, -inp.y);
          player.group.rotation.y = targetRot;
        } else {
          player.vel.x *= 0.85;
          player.vel.z *= 0.85;
        }
      }

      // Update AI Mages
      for (let i = 1; i < three.mages.length; i++) {
        const m = three.mages[i];
        if (!m.alive) continue;

        if (m.frozenTimer > 0) {
          m.frozenTimer -= delta;
          m.group.scale.set(1.1, 0.9, 1.1); // Frozen pose
          continue;
        } else {
          m.group.scale.set(1, 1, 1);
        }

        m.aiCooldown -= delta;

        // AI Patrol / Aim towards nearest target
        const target = player.alive ? player : three.mages[(i % 3) + 1];
        const dist = m.pos.distanceTo(target.pos);

        // Keep inside arena safely
        const distFromCenter = Math.hypot(m.pos.x, m.pos.z);
        if (distFromCenter > 11.5) {
          // Move back to center
          const angleToCenter = Math.atan2(-m.pos.x, -m.pos.z);
          m.vel.x = Math.sin(angleToCenter) * 4.5;
          m.vel.z = Math.cos(angleToCenter) * 4.5;
          m.group.rotation.y = angleToCenter;
        } else {
          // Wander & circle target
          const angleToTarget = Math.atan2(target.pos.x - m.pos.x, target.pos.z - m.pos.z);
          m.group.rotation.y = angleToTarget;

          if (dist > 8.0) {
            m.vel.x = Math.sin(angleToTarget) * 4.0;
            m.vel.z = Math.cos(angleToTarget) * 4.0;
          } else {
            m.vel.x *= 0.9;
            m.vel.z *= 0.9;
          }
        }

        // AI Cast Spell
        if (m.aiCooldown <= 0 && dist < 12.0) {
          m.aiCooldown = 2.0 + Math.random() * 1.5;

          const rot = m.group.rotation.y;
          const dir = new THREE.Vector3(-Math.sin(rot), 0, -Math.cos(rot)).normalize();
          const spawnP = m.pos.clone().add(dir.clone().multiplyScalar(1.2));
          spawnP.y = 1.2;

          const sMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 10, 10),
            new THREE.MeshStandardMaterial({ color: m.color, emissive: m.color, emissiveIntensity: 0.6 })
          );
          sMesh.position.copy(spawnP);
          three.scene.add(sMesh);

          three.projectiles.push({
            mesh: sMesh,
            pos: spawnP,
            vel: dir.multiplyScalar(15.0),
            type: 'fire',
            isPlayer: false,
            alive: true,
            life: 2.5,
          });
        }
      }

      // Update All Mages Physics & Ring-Out
      let currentAlive = 0;
      for (const m of three.mages) {
        if (!m.alive) continue;

        // Apply velocity
        m.pos.x += m.vel.x * delta;
        m.pos.z += m.vel.z * delta;

        // Friction
        m.vel.x *= 0.92;
        m.vel.z *= 0.92;

        // Check Ring-Out (Arena Radius = 14m)
        const distFromCenter = Math.hypot(m.pos.x, m.pos.z);
        if (distFromCenter > 14.2) {
          // Falling into abyss!
          m.pos.y -= 14.0 * delta;
          if (m.pos.y < -6.0) {
            // Eliminated!
            m.alive = false;
            m.group.visible = false;
            triggerMagicBurst(m.pos.x, 0, m.pos.z, m.color, 45);

            if (m.isPlayer) {
              setGameOver(true);
              const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
              const reward = calculateAndDepositMissionReward({
                gameId: 'poki-magic-battleground',
                gameTitle: 'Magic Battleground 3D',
                isVictory: false,
                score: scoreRef.current,
                maxTargetScore: 1000,
                durationSeconds: dur,
              });
              setRewardResult(reward);
            } else {
              setScore((s) => s + 300);
              setEventBanner('라이벌 마법사 링아웃 격파! (+300)');
              setTimeout(() => setEventBanner(null), 1200);
            }
          }
        } else {
          m.pos.y = 0; // Stay grounded on arena floor
        }

        m.group.position.copy(m.pos);
        if (m.alive) currentAlive++;
      }

      setAliveCount(currentAlive);

      // Check Victory Condition (Player is only survivor)
      if (player.alive && currentAlive === 1 && !gameOver && !gameWon) {
        setGameWon(true);
        triggerMagicBurst(0, 3, 0, 0xfacc15, 80);
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const reward = calculateAndDepositMissionReward({
          gameId: 'poki-magic-battleground',
          gameTitle: 'Magic Battleground 3D',
          isVictory: true,
          score: scoreRef.current + 400,
          maxTargetScore: 1000,
          durationSeconds: dur,
        });
        setRewardResult(reward);
      }

      // Update Projectiles
      for (let pi = three.projectiles.length - 1; pi >= 0; pi--) {
        const proj = three.projectiles[pi];
        proj.life -= delta;
        if (proj.life <= 0 || !proj.alive) {
          three.scene.remove(proj.mesh);
          three.projectiles.splice(pi, 1);
          continue;
        }

        proj.pos.addScaledVector(proj.vel, delta);
        proj.mesh.position.copy(proj.pos);

        // Check Collision with Mages
        for (const target of three.mages) {
          if (!target.alive || target.isPlayer === proj.isPlayer) continue;

          const dist = Math.hypot(proj.pos.x - target.pos.x, proj.pos.z - target.pos.z);
          if (dist < 1.1) {
            // HIT!
            proj.alive = false;
            three.scene.remove(proj.mesh);
            three.projectiles.splice(pi, 1);

            triggerMagicBurst(target.pos.x, 1.2, target.pos.z, target.color);

            // Apply Damage & Knockback / CC
            if (proj.type === 'fire') {
              target.hp -= 35;
              // Strong Knockback in projectile direction
              const knockDir = proj.vel.clone().normalize();
              target.vel.add(knockDir.multiplyScalar(14.0));
            } else if (proj.type === 'ice') {
              target.hp -= 20;
              target.frozenTimer = 2.0; // 2 seconds CC
              const knockDir = proj.vel.clone().normalize();
              target.vel.add(knockDir.multiplyScalar(5.0));
            } else if (proj.type === 'lightning') {
              target.hp -= 28;
              const knockDir = proj.vel.clone().normalize();
              target.vel.add(knockDir.multiplyScalar(8.0));
            }

            if (target.isPlayer) {
              setPlayerHp(Math.max(0, target.hp));
              if (target.hp <= 0) {
                target.alive = false;
                setGameOver(true);
                const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const reward = calculateAndDepositMissionReward({
                  gameId: 'poki-magic-battleground',
                  gameTitle: 'Magic Battleground 3D',
                  isVictory: false,
                  score: scoreRef.current,
                  maxTargetScore: 1000,
                  durationSeconds: dur,
                });
                setRewardResult(reward);
              }
            } else {
              setScore((s) => s + 50);
            }
            break;
          }
        }
      }

      // Sparkles physics
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
  }, [cardId, triggerMagicBurst]);

  // Floating Joystick Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
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
        gameTitle="MAGIC BATTLEGROUND 3D"
        onBack={handleExit}
        score={score}
        targetScore={1000}
      />

      {/* HP, Mana & Survivor Count Bar */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        {/* HP & Mana Gauges */}
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-2.5 shadow-xl flex flex-col gap-1.5 min-w-[170px]">
          {/* Health */}
          <div className="flex items-center gap-1.5 text-xs">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <div className="flex-1 bg-slate-950 h-2.5 border border-slate-700 overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-150"
                style={{ width: `${playerHp}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-200">{playerHp} HP</span>
          </div>

          {/* Mana */}
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex-1 bg-slate-950 h-2.5 border border-slate-700 overflow-hidden">
              <div
                className="bg-sky-500 h-full transition-all duration-150"
                style={{ width: `${playerMana}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-sky-300">{Math.round(playerMana)}%</span>
          </div>
        </div>

        {/* Survivor Count */}
        <div className="bg-slate-900/90 border border-indigo-500/80 backdrop-blur-md px-4 py-2 text-right shadow-xl">
          <div className="text-[10px] text-slate-400">생존 마법사</div>
          <div className="text-base font-black text-indigo-400">{aliveCount} / 4</div>
        </div>
      </div>

      {/* Event Banner */}
      {eventBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-indigo-600 text-white font-black px-6 py-1.5 border-2 border-indigo-300 text-sm md:text-base shadow-2xl uppercase">
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
          <div className="w-24 h-24 rounded-full border-2 border-indigo-500/50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-indigo-500 shadow-lg"
              style={{
                transform: `translate(${joystickPos.x - joystickBase.x}px, ${joystickPos.y - joystickBase.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Right Pure Touch Spell Casting Buttons */}
      <div className="absolute bottom-8 right-6 z-20 flex items-end gap-3 pointer-events-auto">
        {/* Thunder Bolt (64px) */}
        <button
          onClick={() => handleCastSpell('lightning')}
          disabled={playerMana < 15}
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-xl active:scale-95 transition-transform ${
            playerMana >= 15
              ? 'bg-amber-600/90 border-yellow-300 text-white font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">전격</span>
        </button>

        {/* Ice Spear (64px) */}
        <button
          onClick={() => handleCastSpell('ice')}
          disabled={playerMana < 20}
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-xl active:scale-95 transition-transform ${
            playerMana >= 20
              ? 'bg-sky-600/90 border-sky-300 text-white font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40'
          }`}
        >
          <Snowflake className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">빙결</span>
        </button>

        {/* Primary Fireball (76px) */}
        <button
          onClick={() => handleCastSpell('fire')}
          disabled={playerMana < 25}
          className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl active:scale-90 transition-transform font-black ${
            playerMana >= 25
              ? 'bg-gradient-to-tr from-rose-600 to-rose-500 border-rose-200 text-white hover:brightness-110'
              : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40'
          }`}
        >
          <Flame className="w-6 h-6 mb-0.5" />
          <span className="text-xs tracking-wider">화염구</span>
        </button>
      </div>

      {/* Arena Guide Tip */}
      <div className="absolute bottom-3 left-6 z-10 text-[11px] text-slate-400 pointer-events-none">
        💡 적 마법사를 경기장 밖 낭떠러지로 날려버리면(Ring Out) 즉시 승리합니다!
      </div>

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">배틀로얄 탈락</h2>
            <p className="text-xs text-slate-300 mb-4">
              경기장 밖으로 추락하거나 체력을 모두 소진하여 패배했습니다.
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

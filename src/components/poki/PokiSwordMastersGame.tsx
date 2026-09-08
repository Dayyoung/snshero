import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { ShieldAlert, Sparkles, RefreshCw, Trophy, Heart, Swords, Wind, Zap } from 'lucide-react';

interface PokiSwordMastersGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface MobEntity {
  group: THREE.Group;
  pos: THREE.Vector3;
  hp: number;
  maxHp: number;
  speed: number;
  isBoss: boolean;
  alive: boolean;
  attackCooldown: number;
  type: 'slime' | 'goblin' | 'boss';
}

export default function PokiSwordMastersGame({
  onClose,
  onBack,
  cardId = 63,
  onExit
}: PokiSwordMastersGameProps) {
  const handleExit = onBack || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI state
  const [playerHp, setPlayerHp] = useState(150);
  const [stormGauge, setStormGauge] = useState(40);
  const [killCount, setKillCount] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [bossHp, setBossHp] = useState(500);
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

  // Dash cooldown
  const [dashReady, setDashReady] = useState(true);

  // Tracking refs
  const startTimeRef = useRef<number>(Date.now());
  const playerHpRef = useRef<number>(150);
  const stormGaugeRef = useRef<number>(40);
  const killCountRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    playerHpRef.current = playerHp;
    stormGaugeRef.current = stormGauge;
    killCountRef.current = killCount;
    scoreRef.current = score;
  }, [playerHp, stormGauge, killCount, score]);

  // Three.js Context
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    playerSwordPivot: THREE.Group;
    swordTrail: THREE.Mesh;
    mobs: MobEntity[];
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
    isSlashing: boolean;
    slashTimer: number;
    isSpinning: boolean;
    spinTimer: number;
    isDashing: boolean;
    dashTimer: number;
    cameraFollowPos: THREE.Vector3;
    cameraShake: number;
  } | null>(null);

  // Helper: Ground Grass Texture
  const createGrassTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#166534';
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 15 + Math.random() * 30, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  };

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

  // Trigger Sparks & Slash Impact
  const triggerSlashSparks = useCallback((x: number, y: number, z: number, isGold = false) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) navigator.vibrate([40, 20, 60]);

    const count = 35;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];
    const baseColor = isGold ? new THREE.Color(0xfacc15) : new THREE.Color(0x38bdf8);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;

      col[i * 3] = baseColor.r;
      col[i * 3 + 1] = baseColor.g;
      col[i * 3 + 2] = baseColor.b;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        2.0 + Math.random() * 5,
        (Math.random() - 0.5) * 7
      ));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.24,
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

  // Basic Slash Attack (180 deg)
  const handleSlash = () => {
    const three = threeRef.current;
    if (!three || three.isSlashing || three.isSpinning || gameOver || gameWon) return;

    three.isSlashing = true;
    three.slashTimer = 0;
    three.cameraShake = 0.25;

    if (navigator.vibrate) navigator.vibrate(35);

    // Hitbox check in front of player (3.5m radius arc)
    const pPos = three.playerGroup.position;
    const pRot = three.playerGroup.rotation.y;
    const attackDir = new THREE.Vector3(-Math.sin(pRot), 0, -Math.cos(pRot)).normalize();

    for (let i = three.mobs.length - 1; i >= 0; i--) {
      const mob = three.mobs[i];
      if (!mob.alive) continue;

      const dist = mob.pos.distanceTo(pPos);
      if (dist < (mob.isBoss ? 4.5 : 3.2)) {
        // Angle check
        const toMob = mob.pos.clone().sub(pPos).normalize();
        const dot = attackDir.dot(toMob);

        if (dot > -0.2) {
          // HIT!
          mob.hp -= 40;
          triggerSlashSparks(mob.pos.x, 1.2, mob.pos.z, false);

          // Knockback
          mob.pos.add(attackDir.clone().multiplyScalar(1.5));

          setStormGauge((g) => Math.min(100, g + 15));

          if (mob.hp <= 0) {
            handleMobDefeated(mob, i);
          }
        }
      }
    }
  };

  // Dash Thrust Attack
  const handleDash = () => {
    const three = threeRef.current;
    if (!three || !dashReady || three.isDashing || gameOver || gameWon) return;

    setDashReady(false);
    setTimeout(() => setDashReady(true), 2000);

    three.isDashing = true;
    three.dashTimer = 0;
    three.cameraShake = 0.35;

    if (navigator.vibrate) navigator.vibrate([40, 20, 50]);

    const pPos = three.playerGroup.position;
    const pRot = three.playerGroup.rotation.y;
    const dashDir = new THREE.Vector3(-Math.sin(pRot), 0, -Math.cos(pRot)).normalize();

    // Instant dash forward 6m
    pPos.add(dashDir.clone().multiplyScalar(5.5));
    pPos.x = THREE.MathUtils.clamp(pPos.x, -22, 22);
    pPos.z = THREE.MathUtils.clamp(pPos.z, -22, 22);

    // Pierce through all mobs in dash path
    for (let i = three.mobs.length - 1; i >= 0; i--) {
      const mob = three.mobs[i];
      if (!mob.alive) continue;

      const dist = mob.pos.distanceTo(pPos);
      if (dist < 3.8) {
        mob.hp -= 50;
        triggerSlashSparks(mob.pos.x, 1.2, mob.pos.z, true);
        if (mob.hp <= 0) {
          handleMobDefeated(mob, i);
        }
      }
    }

    setEventBanner('돌진 찌르기! (DASH THRUST)');
    setTimeout(() => setEventBanner(null), 1000);
  };

  // Sword Storm (Whirlwind) Attack
  const handleSwordStorm = () => {
    const three = threeRef.current;
    if (!three || stormGaugeRef.current < 100 || three.isSpinning || gameOver || gameWon) return;

    setStormGauge(0);
    three.isSpinning = true;
    three.spinTimer = 0;
    three.cameraShake = 0.6;

    if (navigator.vibrate) navigator.vibrate([80, 40, 100, 50, 150]);

    const pPos = three.playerGroup.position;
    // Hit all mobs within 5.5m radius 360 degrees
    for (let i = three.mobs.length - 1; i >= 0; i--) {
      const mob = three.mobs[i];
      if (!mob.alive) continue;

      const dist = mob.pos.distanceTo(pPos);
      if (dist < (mob.isBoss ? 6.5 : 5.2)) {
        mob.hp -= 90;
        triggerSlashSparks(mob.pos.x, 1.5, mob.pos.z, true);

        // Radial knockback
        const pushDir = mob.pos.clone().sub(pPos).normalize();
        mob.pos.add(pushDir.multiplyScalar(3.0));

        if (mob.hp <= 0) {
          handleMobDefeated(mob, i);
        }
      }
    }

    setEventBanner('🌪️ 전설의 검풍 회전베기! (SWORD STORM)');
    setTimeout(() => setEventBanner(null), 1500);
  };

  // Mob Defeated Handler
  const handleMobDefeated = (mob: MobEntity, index: number) => {
    const three = threeRef.current;
    if (!three) return;

    mob.alive = false;
    three.scene.remove(mob.group);
    three.mobs.splice(index, 1);

    if (mob.isBoss) {
      // BOSS DEFEATED! FINAL VICTORY!
      setGameWon(true);
      triggerSlashSparks(mob.pos.x, 2.0, mob.pos.z, true);
      const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const reward = calculateAndDepositMissionReward({
        gameId: 'poki-sword-masters',
        gameTitle: 'Sword Masters 3D',
        isVictory: true,
        score: scoreRef.current + 500,
        maxTargetScore: 1000,
        durationSeconds: dur,
      });
      setRewardResult(reward);
      return;
    }

    const newKills = killCountRef.current + 1;
    const newScore = scoreRef.current + 100;
    setKillCount(newKills);
    setScore(newScore);

    // Spawn replacement mob
    spawnRandomMob();

    // Check if 10 kills reached -> SPAWN GOLEM BOSS!
    if (newKills === 10 && !bossActive) {
      setBossActive(true);
      setEventBanner('⚠️ 거대 보스 [골렘 로드] 강림! ⚠️');
      spawnBossGolem();
      setTimeout(() => setEventBanner(null), 2500);
    }
  };

  // Helper: Spawn Normal Mob
  const spawnRandomMob = () => {
    const three = threeRef.current;
    if (!three) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = 14 + Math.random() * 8;
    const spawnP = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

    const isSlime = Math.random() < 0.5;
    const g = new THREE.Group();
    g.position.copy(spawnP);

    if (isSlime) {
      // Green Slime
      const sMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8, 1),
        new THREE.MeshLambertMaterial({ color: 0x22c55e })
      );
      sMesh.position.y = 0.6;
      g.add(sMesh);
    } else {
      // Red Goblin
      const gMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.3, 0.7),
        new THREE.MeshLambertMaterial({ color: 0xdc2626 })
      );
      gMesh.position.y = 0.8;
      g.add(gMesh);
    }

    three.scene.add(g);
    three.mobs.push({
      group: g,
      pos: spawnP,
      hp: 50,
      maxHp: 50,
      speed: 3.5,
      isBoss: false,
      alive: true,
      attackCooldown: 1.0,
      type: isSlime ? 'slime' : 'goblin',
    });
  };

  // Helper: Spawn Boss Golem
  const spawnBossGolem = () => {
    const three = threeRef.current;
    if (!three) return;

    const g = new THREE.Group();
    const spawnP = new THREE.Vector3(0, 0, -16);
    g.position.copy(spawnP);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
      metalness: 0.2,
    });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Huge Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.6, 2.4), stoneMat);
    torso.position.y = 3.2;
    g.add(torso);

    // Glowing Core
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), runeMat);
    core.position.set(0, 3.2, 1.25);
    g.add(core);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), stoneMat);
    head.position.y = 5.4;
    g.add(head);

    // Giant Arms
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.0, 1.2), stoneMat);
    lArm.position.set(-2.4, 3.0, 0);
    g.add(lArm);

    const rArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.0, 1.2), stoneMat);
    rArm.position.set(2.4, 3.0, 0);
    g.add(rArm);

    three.scene.add(g);
    three.mobs.push({
      group: g,
      pos: spawnP,
      hp: 500,
      maxHp: 500,
      speed: 2.2,
      isBoss: true,
      alive: true,
      attackCooldown: 1.5,
      type: 'boss',
    });
  };

  // Restart Handler
  const handleRestart = () => {
    setPlayerHp(150);
    setStormGauge(40);
    setKillCount(0);
    setBossActive(false);
    setBossHp(500);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();

    if (threeRef.current) {
      // Clear mobs
      for (const m of threeRef.current.mobs) {
        threeRef.current.scene.remove(m.group);
      }
      threeRef.current.mobs = [];

      // Reset player position
      threeRef.current.playerGroup.position.set(0, 0, 14);

      // Spawn initial 6 mobs
      for (let i = 0; i < 6; i++) {
        spawnRandomMob();
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
    scene.background = new THREE.Color(0x0f172a); // Slate fantasy dusk
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(0, 8.5, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Warm Fantasy Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.25);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 50x50m Fantasy Arena Ground
    const groundGeo = new THREE.PlaneGeometry(54, 54);
    const groundMat = new THREE.MeshLambertMaterial({ map: createGrassTexture() });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 8 Ancient Temple Ruins Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.8, 1.0, 5.5, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const d = 18;
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(Math.cos(a) * d, 2.75, Math.sin(a) * d);
      pillar.castShadow = true;
      scene.add(pillar);
    }

    // 3D Player Sword Master Model
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 14); // South safe spawn 14m

    const armorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.3 });
    const capeMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 });

    // Torso Armor
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.2, 0.5), armorMat);
    pBody.position.y = 1.2;
    playerGroup.add(pBody);

    // Helmet
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), armorMat);
    pHead.position.y = 2.05;
    playerGroup.add(pHead);

    // Cape
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.4), capeMat);
    cape.position.set(0, 1.1, 0.28);
    playerGroup.add(cape);

    // Sword Pivot Group
    const playerSwordPivot = new THREE.Group();
    playerSwordPivot.position.set(0.65, 1.2, 0);

    // Giant Greatsword Mesh
    const bladeGeo = new THREE.BoxGeometry(0.22, 2.4, 0.08);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, 1.1, 0);
    playerSwordPivot.add(blade);

    // Golden Hilt & Crossguard
    const hiltGeo = new THREE.BoxGeometry(0.8, 0.15, 0.15);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.y = -0.1;
    playerSwordPivot.add(hilt);

    playerGroup.add(playerSwordPivot);

    // Card Badge above Sword Master
    const badgeGeo = new THREE.PlaneGeometry(0.7, 0.88);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: createCardBadgeTexture(cardId),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 2.8, 0);
    playerGroup.add(badge);

    // Arcane Sword Trail Mesh
    const trailGeo = new THREE.RingGeometry(1.8, 3.2, 32, 1, 0, Math.PI);
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const swordTrail = new THREE.Mesh(trailGeo, trailMat);
    swordTrail.rotation.x = Math.PI / 2;
    swordTrail.position.y = 1.0;
    playerGroup.add(swordTrail);

    scene.add(playerGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerGroup,
      playerSwordPivot,
      swordTrail,
      mobs: [],
      particles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
      isSlashing: false,
      slashTimer: 0,
      isSpinning: false,
      spinTimer: 0,
      isDashing: false,
      dashTimer: 0,
      cameraFollowPos: new THREE.Vector3(0, 8.5, 22),
      cameraShake: 0,
    };

    // Spawn 6 initial mobs
    for (let i = 0; i < 6; i++) {
      spawnRandomMob();
    }

    // Main Game Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Player Movement
      const inp = inputDirRef.current;
      const isMoving = Math.hypot(inp.x, inp.y) > 0.1;
      const pPos = three.playerGroup.position;

      if (isMoving && !three.isSpinning) {
        const speed = 7.5;
        pPos.x += inp.x * speed * delta;
        pPos.z += inp.y * speed * delta;

        pPos.x = THREE.MathUtils.clamp(pPos.x, -24, 24);
        pPos.z = THREE.MathUtils.clamp(pPos.z, -24, 24);

        three.playerGroup.rotation.y = Math.atan2(-inp.x, -inp.y);
      }

      // Sword Slash Animation
      if (three.isSlashing) {
        three.slashTimer += delta * 14;
        three.playerSwordPivot.rotation.z = Math.sin(three.slashTimer) * 1.8;
        three.swordTrail.material.opacity = Math.sin(three.slashTimer) * 0.7;

        if (three.slashTimer >= Math.PI) {
          three.isSlashing = false;
          three.playerSwordPivot.rotation.z = 0;
          three.swordTrail.material.opacity = 0;
        }
      }

      // Sword Storm Whirlwind Animation
      if (three.isSpinning) {
        three.spinTimer += delta * 16;
        three.playerGroup.rotation.y += delta * 24;
        three.playerSwordPivot.rotation.x = Math.PI / 2;
        three.swordTrail.material.opacity = 0.85;

        if (three.spinTimer >= Math.PI * 4) {
          three.isSpinning = false;
          three.playerSwordPivot.rotation.x = 0;
          three.swordTrail.material.opacity = 0;
        }
      }

      // Update Mobs
      for (const mob of three.mobs) {
        if (!mob.alive) continue;

        // Move towards player
        const dist = mob.pos.distanceTo(pPos);
        const dir = pPos.clone().sub(mob.pos).normalize();

        if (dist > (mob.isBoss ? 2.8 : 1.4)) {
          mob.pos.add(dir.multiplyScalar(mob.speed * delta));
        }

        mob.group.position.copy(mob.pos);
        mob.group.rotation.y = Math.atan2(dir.x, dir.z);

        // Attack player if close
        mob.attackCooldown -= delta;
        if (dist < (mob.isBoss ? 3.2 : 1.8) && mob.attackCooldown <= 0) {
          mob.attackCooldown = 1.2;
          const dmg = mob.isBoss ? 25 : 12;

          setPlayerHp((h) => {
            const nh = Math.max(0, h - dmg);
            if (nh <= 0) {
              setGameOver(true);
              const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
              const reward = calculateAndDepositMissionReward({
                gameId: 'poki-sword-masters',
                gameTitle: 'Sword Masters 3D',
                isVictory: false,
                score: scoreRef.current,
                maxTargetScore: 1000,
                durationSeconds: dur,
              });
              setRewardResult(reward);
            }
            return nh;
          });

          if (navigator.vibrate) navigator.vibrate(40);
        }

        // Update Boss HP UI
        if (mob.isBoss) {
          setBossHp(Math.max(0, mob.hp));
        }
      }

      // Camera Follow Player
      three.cameraFollowPos.set(pPos.x, pPos.y + 9.5, pPos.z + 14.5);
      three.camera.position.lerp(three.cameraFollowPos, 0.08);

      // Camera Shake
      if (three.cameraShake > 0) {
        three.camera.position.x += (Math.random() - 0.5) * three.cameraShake;
        three.camera.position.y += (Math.random() - 0.5) * three.cameraShake;
        three.cameraShake *= 0.88;
      }
      three.camera.lookAt(pPos.x, pPos.y + 1.2, pPos.z);

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
  }, [cardId, spawnRandomMob, triggerSlashSparks]);

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
        gameTitle="SWORD MASTERS 3D"
        onBack={handleExit}
        score={score}
        targetScore={1000}
      />

      {/* Health & Storm Gauge Bar */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        {/* Player Status */}
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-2.5 shadow-xl flex flex-col gap-1.5 min-w-[170px]">
          {/* Health Bar */}
          <div className="flex items-center gap-1.5 text-xs">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <div className="flex-1 bg-slate-950 h-2.5 border border-slate-700 overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-150"
                style={{ width: `${(playerHp / 150) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-200">{playerHp} HP</span>
          </div>

          {/* Storm Gauge Bar */}
          <div className="flex items-center gap-1.5 text-xs">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex-1 bg-slate-950 h-2.5 border border-slate-700 overflow-hidden">
              <div
                className="bg-sky-400 h-full transition-all duration-150"
                style={{ width: `${stormGauge}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-sky-300">{Math.round(stormGauge)}%</span>
          </div>
        </div>

        {/* Kill Count or Boss HP */}
        {bossActive ? (
          <div className="bg-slate-900/95 border-2 border-rose-500 px-4 py-2 min-w-[180px] shadow-2xl">
            <div className="text-[10px] text-rose-400 font-bold flex items-center justify-between mb-1">
              <span>보스: 골렘 로드</span>
              <span>{bossHp} / 500</span>
            </div>
            <div className="bg-slate-950 h-2.5 border border-slate-700 overflow-hidden">
              <div
                className="bg-rose-600 h-full transition-all duration-150"
                style={{ width: `${(bossHp / 500) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-amber-500/80 backdrop-blur-md px-4 py-2 text-right shadow-xl">
            <div className="text-[10px] text-slate-400">토벌한 몬스터</div>
            <div className="text-base font-black text-amber-400">{killCount} / 10</div>
          </div>
        )}
      </div>

      {/* Event Banner */}
      {eventBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-amber-500 text-slate-950 font-black px-6 py-1.5 border-2 border-yellow-200 text-sm md:text-base shadow-2xl uppercase">
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
          <div className="w-24 h-24 rounded-full border-2 border-sky-500/50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-sky-500 shadow-lg"
              style={{
                transform: `translate(${joystickPos.x - joystickBase.x}px, ${joystickPos.y - joystickBase.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Right Pure Touch Sword Skills Controls */}
      <div className="absolute bottom-8 right-6 z-20 flex items-end gap-3 pointer-events-auto">
        {/* Storm Whirlwind Button (64px) */}
        <button
          onClick={handleSwordStorm}
          disabled={stormGauge < 100}
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-xl active:scale-95 transition-transform ${
            stormGauge >= 100
              ? 'bg-sky-500 border-yellow-300 text-slate-950 font-black animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40'
          }`}
        >
          <Wind className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">검풍</span>
        </button>

        {/* Dash Thrust Button (64px) */}
        <button
          onClick={handleDash}
          disabled={!dashReady}
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-xl active:scale-95 transition-transform ${
            dashReady
              ? 'bg-indigo-600/90 border-indigo-400 text-white font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">돌진</span>
        </button>

        {/* Primary Slash Button (76px) */}
        <button
          onClick={handleSlash}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 border-2 border-yellow-200 text-slate-950 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform font-black"
        >
          <Swords className="w-7 h-7 mb-0.5" />
          <span className="text-xs tracking-wider">검격</span>
        </button>
      </div>

      {/* Guide Tip */}
      <div className="absolute bottom-3 left-6 z-10 text-[11px] text-slate-400 pointer-events-none">
        💡 몬스터 10마리를 토벌하면 거대 보스 [골렘 로드]가 강림합니다!
      </div>

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">검사 전사</h2>
            <p className="text-xs text-slate-300 mb-4">
              몬스터 무리의 협공에 쓰러져 토벌에 실패했습니다.
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

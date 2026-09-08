import React, { useState, useEffect, useRef, useId } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiKarateFighterGameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

type ActionState = 'idle' | 'punch' | 'kick' | 'block' | 'hit' | 'special';

interface Fighter {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  rightArm: THREE.Group;
  rightLeg: THREE.Group;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  ki: number;
  action: ActionState;
  actionTimer: number;
  isStunned: boolean;
  stunTimer: number;
}

export const PokiKarateFighterGame: React.FC<PokiKarateFighterGameProps> = ({
  onBack,
  cardId = 52,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Match States
  const [round, setRound] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [playerKi, setPlayerKi] = useState(20);
  const [combatText, setCombatText] = useState<string | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  // Engine Refs
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    player: null as Fighter | null,
    enemy: null as Fighter | null,
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    kiBlasts: [] as { mesh: THREE.Mesh; vel: number; life: number; isPlayer: boolean }[],
    aiCooldown: 1200,
    startTime: Date.now(),
    isDestroyed: false,
    moveDir: 0, // -1: left, 1: right
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

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    game.scene = scene;
    scene.background = new THREE.Color(0x1a120b);
    scene.fog = new THREE.FogExp2(0x1a120b, 0.025);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.9, 7.5);
    camera.lookAt(0, 1.4, 0);
    game.camera = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    game.renderer = renderer;

    // 3. Lighting (Dojo Lanterns & Warm Ambience)
    const ambientLight = new THREE.AmbientLight(0xffecd2, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff3db, 1.4);
    mainLight.position.set(4, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xff6622, 0.8);
    rimLight.position.set(-5, 4, -3);
    scene.add(rimLight);

    // 4. Dojo Environment (Tatami Floor & Traditional Wall)
    // Tatami Floor (16m x 16m)
    const tatamiGeo = new THREE.PlaneGeometry(16, 16);
    const tatamiMat = new THREE.MeshStandardMaterial({
      color: 0x5a5438,
      roughness: 0.8,
      metalness: 0.1,
    });
    const tatamiMesh = new THREE.Mesh(tatamiGeo, tatamiMat);
    tatamiMesh.rotation.x = -Math.PI / 2;
    tatamiMesh.position.y = 0;
    tatamiMesh.receiveShadow = true;
    scene.add(tatamiMesh);

    // Dojo Tatami Mat Edges
    const matBorderGeo = new THREE.BoxGeometry(9.6, 0.04, 9.6);
    const matBorderMat = new THREE.MeshStandardMaterial({ color: 0x8c3a16, roughness: 0.5 });
    const matBorder = new THREE.Mesh(matBorderGeo, matBorderMat);
    matBorder.position.set(0, 0.02, 0);
    scene.add(matBorder);

    // Back Wall (Shoji Japanese Paper Screen Wall)
    const wallGeo = new THREE.BoxGeometry(16, 6, 0.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x241710,
      roughness: 0.6,
      metalness: 0.1,
    });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 3, -5.5);
    scene.add(wallMesh);

    // Red Hanging Lanterns (4 units)
    for (let i = 0; i < 4; i++) {
      const lx = (i - 1.5) * 3.5;
      const lanternGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.6, 12);
      const lanternMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(lx, 3.8, -4.5);
      scene.add(lantern);

      const pLight = new THREE.PointLight(0xff4400, 0.8, 8);
      pLight.position.set(lx, 3.6, -4.2);
      scene.add(pLight);
    }

    // 5. Create 3D Fighter Helper
    const createFighterMesh = (isPlayer: boolean): Fighter => {
      const group = new THREE.Group();

      const giColor = isPlayer ? 0xf5f5f5 : 0x1f1f24;
      const beltColor = isPlayer ? 0x111111 : 0xb91c1c;

      const giMat = new THREE.MeshStandardMaterial({ color: giColor, roughness: 0.6 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfd3, roughness: 0.5 });
      const beltMat = new THREE.MeshStandardMaterial({ color: beltColor, roughness: 0.3 });

      // Torso (Gi)
      const bodyGeo = new THREE.BoxGeometry(0.68, 0.85, 0.4);
      const bodyMesh = new THREE.Mesh(bodyGeo, giMat);
      bodyMesh.position.y = 1.15;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Belt
      const beltGeo = new THREE.BoxGeometry(0.72, 0.14, 0.44);
      const beltMesh = new THREE.Mesh(beltGeo, beltMat);
      beltMesh.position.y = 0.8;
      group.add(beltMesh);

      // Head
      const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headMesh.position.y = 1.82;
      headMesh.castShadow = true;
      group.add(headMesh);

      // Headband
      const bandGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.08, 16);
      const bandMesh = new THREE.Mesh(bandGeo, beltMat);
      bandMesh.position.y = 1.88;
      group.add(bandMesh);

      // Right Arm (Punches)
      const rightArm = new THREE.Group();
      rightArm.position.set(isPlayer ? 0.38 : -0.38, 1.35, 0);
      const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
      const armMesh = new THREE.Mesh(armGeo, giMat);
      armMesh.position.y = -0.22;
      rightArm.add(armMesh);
      const fistGeo = new THREE.SphereGeometry(0.12, 10, 10);
      const fistMesh = new THREE.Mesh(fistGeo, skinMat);
      fistMesh.position.y = -0.52;
      rightArm.add(fistMesh);
      group.add(rightArm);

      // Left Arm (Guard)
      const leftArm = new THREE.Group();
      leftArm.position.set(isPlayer ? -0.38 : 0.38, 1.35, 0);
      const lArmMesh = new THREE.Mesh(armGeo, giMat);
      lArmMesh.position.set(0, -0.15, 0.2);
      lArmMesh.rotation.x = Math.PI / 3;
      leftArm.add(lArmMesh);
      group.add(leftArm);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
      const leftLeg = new THREE.Mesh(legGeo, giMat);
      leftLeg.position.set(isPlayer ? -0.18 : 0.18, 0.35, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(isPlayer ? 0.18 : -0.18, 0.7, 0);
      const rLegMesh = new THREE.Mesh(legGeo, giMat);
      rLegMesh.position.y = -0.35;
      rLegMesh.castShadow = true;
      rightLeg.add(rLegMesh);
      group.add(rightLeg);

      const initX = isPlayer ? -2.2 : 2.2;
      group.position.set(initX, 0, 0);
      // Face each other
      group.rotation.y = isPlayer ? Math.PI / 2 : -Math.PI / 2;
      scene.add(group);

      return {
        group,
        bodyMesh,
        rightArm,
        rightLeg,
        x: initX,
        y: 0,
        hp: 100,
        maxHp: 100,
        ki: isPlayer ? 20 : 0,
        action: 'idle',
        actionTimer: 0,
        isStunned: false,
        stunTimer: 0,
      };
    };

    game.player = createFighterMesh(true);
    game.enemy = createFighterMesh(false);

    // 6. Particle & Shockwave Helper
    const spawnImpact = (pos: THREE.Vector3, isParry = false) => {
      // Ring shockwave
      const ringGeo = new THREE.RingGeometry(0.2, 0.45, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isParry ? 0x00f0ff : 0xffaa00,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.rotation.y = Math.PI / 2;
      scene.add(ring);

      setTimeout(() => scene.remove(ring), 150);

      // Sparks
      for (let i = 0; i < 10; i++) {
        const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const pMat = new THREE.MeshBasicMaterial({
          color: isParry ? 0x00ffff : 0xff4400,
        });
        const p = new THREE.Mesh(pGeo, pMat);
        p.position.copy(pos);
        scene.add(p);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 1,
          (Math.random() - 0.5) * 4
        );
        game.particles.push({ mesh: p, vel, life: 0.45 });
      }
    };

    // 7. Ki Blast Projectile Helper
    const spawnKiBlast = (startPos: THREE.Vector3, isPlayer: boolean) => {
      const geo = new THREE.SphereGeometry(0.35, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0xffd700 : 0xbf55ec });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(startPos);
      scene.add(mesh);

      game.kiBlasts.push({
        mesh,
        vel: isPlayer ? 14 : -14,
        life: 1.2,
        isPlayer,
      });
    };

    // 8. Resize Listener
    const handleResize = () => {
      if (!game.camera || !game.renderer) return;
      game.camera.aspect = window.innerWidth / window.innerHeight;
      game.camera.updateProjectionMatrix();
      game.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 9. Main Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      if (game.isDestroyed) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const p = game.player;
      const e = game.enemy;
      if (!p || !e) return;

      // Player Movement Left / Right
      if (game.moveDir !== 0 && !p.isStunned && p.action === 'idle') {
        p.x += game.moveDir * 4.5 * delta;
        p.x = Math.max(-4.2, Math.min(e.x - 1.2, p.x));
      }

      // AI Logic Tick
      if (!e.isStunned && !gameOver && !gameWon) {
        game.aiCooldown -= delta * 1000;
        const dist = Math.abs(e.x - p.x);

        // Follow & distance control
        if (dist > 2.0 && e.action === 'idle') {
          e.x -= 2.8 * delta;
        } else if (dist < 1.4 && e.action === 'idle') {
          e.x += 1.8 * delta;
        }
        e.x = Math.max(p.x + 1.2, Math.min(4.2, e.x));

        if (game.aiCooldown <= 0) {
          game.aiCooldown = 1100 + Math.random() * 800;
          if (dist <= 2.2) {
            // Random Attack
            const isKick = Math.random() > 0.55;
            e.action = isKick ? 'kick' : 'punch';
            e.actionTimer = isKick ? 0.35 : 0.22;
          }
        }
      }

      // Update Player & Enemy Action Timers
      [p, e].forEach((fighter) => {
        if (fighter.isStunned) {
          fighter.stunTimer -= delta;
          if (fighter.stunTimer <= 0) {
            fighter.isStunned = false;
            fighter.action = 'idle';
          }
        } else if (fighter.actionTimer > 0) {
          fighter.actionTimer -= delta;
          if (fighter.actionTimer <= 0) {
            fighter.action = 'idle';
          }
        }
      });

      // Animate Limbs based on Action
      // 1) Player Limbs
      if (p.action === 'punch') {
        p.rightArm.rotation.z = -Math.PI / 2;
        p.rightArm.position.x = 0.65;
      } else if (p.action === 'kick') {
        p.rightLeg.rotation.z = -Math.PI / 2.2;
        p.rightLeg.position.x = 0.55;
      } else if (p.action === 'block') {
        p.rightArm.rotation.z = -Math.PI / 4;
        p.rightArm.position.x = 0.2;
      } else {
        // Idle bob
        p.rightArm.rotation.z = Math.sin(time * 0.006) * 0.15;
        p.rightArm.position.x = 0.38;
        p.rightLeg.rotation.z = 0;
        p.rightLeg.position.x = 0.18;
      }

      // 2) Enemy Limbs
      if (e.action === 'punch') {
        e.rightArm.rotation.z = Math.PI / 2;
        e.rightArm.position.x = -0.65;
      } else if (e.action === 'kick') {
        e.rightLeg.rotation.z = Math.PI / 2.2;
        e.rightLeg.position.x = -0.55;
      } else if (e.action === 'block') {
        e.rightArm.rotation.z = Math.PI / 4;
        e.rightArm.position.x = -0.2;
      } else {
        e.rightArm.rotation.z = -Math.sin(time * 0.006) * 0.15;
        e.rightArm.position.x = -0.38;
        e.rightLeg.rotation.z = 0;
        e.rightLeg.position.x = -0.18;
      }

      // Sync Groups X
      p.group.position.x = p.x;
      p.group.position.y = Math.abs(Math.sin(time * 0.008)) * 0.06;
      e.group.position.x = e.x;
      e.group.position.y = Math.abs(Math.cos(time * 0.008)) * 0.06;

      // Dynamic Camera centering & zoom
      const midX = (p.x + e.x) / 2;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, midX, delta * 5);

      // Hit Detection: Player Attacks Enemy
      const distBetween = Math.abs(e.x - p.x);
      if (distBetween < 2.0) {
        if (p.action === 'punch' && p.actionTimer > 0.15 && e.action !== 'hit') {
          p.actionTimer = 0.05; // single hit
          const dmg = 14;
          if (e.action === 'block') {
            spawnImpact(new THREE.Vector3(e.x, 1.4, 0), true);
            setCombatText('🛡️ BLOCKED!');
          } else {
            e.hp = Math.max(0, e.hp - dmg);
            setEnemyHp(e.hp);
            e.action = 'hit';
            e.actionTimer = 0.25;
            e.x += 0.4;
            p.ki = Math.min(100, p.ki + 18);
            setPlayerKi(p.ki);
            spawnImpact(new THREE.Vector3(e.x, 1.4, 0), false);
            setCombatText('💥 PUNCH! (-14)');
            if (navigator.vibrate) navigator.vibrate(25);
          }
        } else if (p.action === 'kick' && p.actionTimer > 0.25 && e.action !== 'hit') {
          p.actionTimer = 0.08;
          const dmg = 26;
          if (e.action === 'block') {
            spawnImpact(new THREE.Vector3(e.x, 1.2, 0), true);
            setCombatText('🛡️ BLOCKED!');
          } else {
            e.hp = Math.max(0, e.hp - dmg);
            setEnemyHp(e.hp);
            e.action = 'hit';
            e.actionTimer = 0.35;
            e.x += 0.8;
            p.ki = Math.min(100, p.ki + 28);
            setPlayerKi(p.ki);
            spawnImpact(new THREE.Vector3(e.x, 1.2, 0), false);
            setCombatText('🥋 ROUNDHOUSE KICK! (-26)');
            if (navigator.vibrate) navigator.vibrate(40);
          }
        }
      }

      // Hit Detection: Enemy Attacks Player
      if (distBetween < 2.0) {
        if (e.action === 'punch' && e.actionTimer > 0.15 && p.action !== 'hit') {
          e.actionTimer = 0.05;
          if (p.action === 'block') {
            // PARRY SUCCESS!
            spawnImpact(new THREE.Vector3(p.x + 0.6, 1.4, 0), true);
            e.isStunned = true;
            e.stunTimer = 1.0;
            e.action = 'hit';
            e.x += 0.6;
            setCombatText('⚡ PARRY COUNTER! ENEMY STUNNED!');
            if (navigator.vibrate) navigator.vibrate([20, 40, 60]);
          } else {
            p.hp = Math.max(0, p.hp - 16);
            setPlayerHp(p.hp);
            p.action = 'hit';
            p.actionTimer = 0.25;
            p.x -= 0.5;
            spawnImpact(new THREE.Vector3(p.x, 1.4, 0), false);
            setCombatText('⚠️ ENEMY PUNCH! (-16)');
            if (navigator.vibrate) navigator.vibrate(30);
          }
        } else if (e.action === 'kick' && e.actionTimer > 0.25 && p.action !== 'hit') {
          e.actionTimer = 0.08;
          if (p.action === 'block') {
            spawnImpact(new THREE.Vector3(p.x + 0.6, 1.2, 0), true);
            e.isStunned = true;
            e.stunTimer = 1.0;
            e.x += 0.8;
            setCombatText('⚡ PARRY COUNTER! ENEMY STUNNED!');
            if (navigator.vibrate) navigator.vibrate([20, 40, 60]);
          } else {
            p.hp = Math.max(0, p.hp - 24);
            setPlayerHp(p.hp);
            p.action = 'hit';
            p.actionTimer = 0.35;
            p.x -= 0.8;
            spawnImpact(new THREE.Vector3(p.x, 1.2, 0), false);
            setCombatText('⚠️ ENEMY KICK! (-24)');
            if (navigator.vibrate) navigator.vibrate(45);
          }
        }
      }

      // Check KO Win / Loss
      if (e.hp <= 0 && !gameWon) {
        setGameWon(true);
        setCombatText('🏆 KNOCKOUT! VICTORY!');
        const result = calculateAndDepositMissionReward({
          gameId: 'poki_karate_fighter',
          gameTitle: 'Karate Fighter 3D',
          isVictory: true,
          score: 100,
          maxTargetScore: 100,
          durationSeconds: Math.floor((Date.now() - game.startTime) / 1000),
        });
        setRewardResult(result);
      } else if (p.hp <= 0 && !gameOver) {
        setGameOver(true);
        setCombatText('💀 DEFEAT! KO!');
        const result = calculateAndDepositMissionReward({
          gameId: 'poki_karate_fighter',
          gameTitle: 'Karate Fighter 3D',
          isVictory: false,
          score: Math.max(15, 100 - e.hp),
          maxTargetScore: 100,
          durationSeconds: Math.floor((Date.now() - game.startTime) / 1000),
        });
        setRewardResult(result);
      }

      // Update Particles
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const pt = game.particles[i];
        pt.mesh.position.addScaledVector(pt.vel, delta);
        pt.vel.y -= 12 * delta;
        pt.life -= delta;
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
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

  // Action Button Handlers
  const handlePunch = () => {
    const p = gameRef.current.player;
    if (!p || p.isStunned || p.action !== 'idle') return;
    p.action = 'punch';
    p.actionTimer = 0.22;
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleKick = () => {
    const p = gameRef.current.player;
    if (!p || p.isStunned || p.action !== 'idle') return;
    p.action = 'kick';
    p.actionTimer = 0.35;
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleBlock = () => {
    const p = gameRef.current.player;
    if (!p || p.isStunned || p.action !== 'idle') return;
    p.action = 'block';
    p.actionTimer = 0.45;
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleSpecial = () => {
    const p = gameRef.current.player;
    const e = gameRef.current.enemy;
    if (!p || !e || p.isStunned || p.ki < 100) return;

    p.ki = 0;
    setPlayerKi(0);
    p.action = 'special';
    p.actionTimer = 0.6;

    setCombatText('⚡ HADOKEN KI BURST! (-50)');
    if (navigator.vibrate) navigator.vibrate([40, 60, 80]);

    // Hit enemy hard
    setTimeout(() => {
      if (e) {
        e.hp = Math.max(0, e.hp - 50);
        setEnemyHp(e.hp);
        e.action = 'hit';
        e.actionTimer = 0.5;
        e.x += 1.4;
      }
    }, 200);
  };

  const hudUniqueId = useId();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#1a120b] font-mono text-white"
    >
      {/* Minimalist Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        key={hudUniqueId}
        title="KARATE FIGHTER 3D"
        progress={`ROUND ${round} / 2`}
        onGiveUp={() => {
          const res = calculateAndDepositMissionReward({
            gameId: 'poki_karate_fighter',
            gameTitle: 'Karate Fighter 3D',
            isVictory: false,
            score: Math.max(15, 100 - enemyHp),
            maxTargetScore: 100,
            durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
          });
          setRewardResult(res);
        }}
      />

      {/* Hero Badge & Fighter Health Bars */}
      <div className="absolute top-14 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Player Health */}
        <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1.5 rounded-sm border border-cyan-500/40">
          <canvas
            ref={heroBadgeCanvasRef}
            width={48}
            height={48}
            className="w-8 h-8 rounded border border-cyan-400/50 bg-black/40"
          />
          <div>
            <div className="text-xs font-bold text-cyan-300">YOU (KARATEKA)</div>
            <div className="w-28 h-2.5 bg-gray-800 rounded-none overflow-hidden mt-0.5 border border-gray-700">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${playerHp}%` }}
              />
            </div>
            {/* Ki Gauge */}
            <div className="w-28 h-1.5 bg-gray-900 rounded-none overflow-hidden mt-1 border border-gray-800">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${playerKi}%` }}
              />
            </div>
          </div>
        </div>

        {/* VS Badge */}
        <div className="text-xs font-black text-amber-400 px-2 py-1 bg-black/60 border border-amber-500/40 rounded">
          VS
        </div>

        {/* Rival Health */}
        <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1.5 rounded-sm border border-red-500/40 text-right">
          <div>
            <div className="text-xs font-bold text-red-400">RIVAL (BLACK BELT)</div>
            <div className="w-28 h-2.5 bg-gray-800 rounded-none overflow-hidden mt-0.5 border border-gray-700 ml-auto">
              <div
                className="h-full bg-red-500 transition-all duration-150"
                style={{ width: `${enemyHp}%` }}
              />
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-red-950/80 border border-red-500 flex items-center justify-center font-bold text-xs text-red-300">
            🥋
          </div>
        </div>
      </div>

      {/* Combat Impact Banner */}
      {combatText && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-black/75 px-4 py-1.5 rounded border border-amber-400 text-xs font-black text-amber-300 tracking-wider shadow-lg animate-bounce">
          {combatText}
        </div>
      )}

      {/* Left Dash Controls */}
      <div className="absolute bottom-6 left-4 z-20 flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={() => (gameRef.current.moveDir = -1)}
          onTouchEnd={() => (gameRef.current.moveDir = 0)}
          onMouseDown={() => (gameRef.current.moveDir = -1)}
          onMouseUp={() => (gameRef.current.moveDir = 0)}
          className="w-14 h-14 rounded-full bg-gray-900/80 active:bg-gray-800 border-2 border-gray-600 text-white font-black text-lg flex items-center justify-center shadow-lg active:scale-95"
        >
          ◀
        </button>
        <button
          onTouchStart={() => (gameRef.current.moveDir = 1)}
          onTouchEnd={() => (gameRef.current.moveDir = 0)}
          onMouseDown={() => (gameRef.current.moveDir = 1)}
          onMouseUp={() => (gameRef.current.moveDir = 0)}
          className="w-14 h-14 rounded-full bg-gray-900/80 active:bg-gray-800 border-2 border-gray-600 text-white font-black text-lg flex items-center justify-center shadow-lg active:scale-95"
        >
          ▶
        </button>
      </div>

      {/* Right Martial Combat Action Buttons */}
      <div className="absolute bottom-6 right-4 z-20 flex items-end gap-2.5 pointer-events-auto">
        {/* Special Ki Button */}
        {playerKi >= 100 && (
          <button
            onClick={handleSpecial}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white text-black font-black text-xs flex flex-col items-center justify-center shadow-[0_0_16px_#ffd700] animate-pulse active:scale-95"
          >
            <span>⚡ KI</span>
            <span className="text-[9px]">BURST</span>
          </button>
        )}

        {/* Block / Parry Button */}
        <button
          onTouchStart={handleBlock}
          onClick={handleBlock}
          className="w-14 h-14 rounded-full bg-blue-700/85 active:bg-blue-600 border-2 border-blue-400 text-white font-bold text-xs flex flex-col items-center justify-center shadow-md active:scale-95"
        >
          <span>🛡️</span>
          <span className="text-[9px]">방어</span>
        </button>

        {/* Kick Button */}
        <button
          onTouchStart={handleKick}
          onClick={handleKick}
          className="w-16 h-16 rounded-full bg-emerald-600/85 active:bg-emerald-500 border-2 border-emerald-400 text-white font-black text-sm flex flex-col items-center justify-center shadow-md active:scale-95"
        >
          <span>🥋 킥</span>
          <span className="text-[9px] text-emerald-200">-26</span>
        </button>

        {/* Primary Punch Button */}
        <button
          onTouchStart={handlePunch}
          onClick={handlePunch}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 active:from-red-500 active:to-rose-400 border-2 border-rose-300 text-white font-black text-base flex flex-col items-center justify-center shadow-[0_0_16px_rgba(255,50,50,0.4)] active:scale-95"
        >
          <span>👊 펀치</span>
          <span className="text-[10px] text-rose-200">-14</span>
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full bg-stone-900 border border-amber-500/60 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-xl font-black text-amber-400 tracking-wider mb-2">
              KARATE FIGHTER 3D
            </div>
            <div className="text-xs text-gray-300 space-y-2 mb-5 leading-relaxed text-left">
              <p>• 👊 <b className="text-rose-400">[펀치]</b>: 빠른 연속 정권 공격</p>
              <p>• 🥋 <b className="text-emerald-400">[킥]</b>: 강력한 회전 돌려차기 넉백</p>
              <p>• 🛡️ <b className="text-cyan-400">[방어]</b>: 적 공격 순간 방어 시 <b className="text-yellow-300">패링 스턴!</b></p>
              <p>• ⚡ <b className="text-yellow-400">[KI BURST]</b>: 기 게이지 100% 시 승룡 기합파 발동!</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-amber-600 active:bg-amber-500 text-white font-bold text-sm tracking-wider rounded-sm border border-amber-400 shadow-md"
            >
              [ 대전 시작 ]
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

      {/* Defeat Modal */}
      {gameOver && rewardResult && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-4">
          <div className="max-w-sm w-full bg-stone-950 border border-red-500 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-2xl font-black text-red-500 mb-1">KNOCKOUT</div>
            <div className="text-xs text-gray-400 mb-4">라이벌 무술가에게 패배했습니다.</div>
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

export default PokiKarateFighterGame;

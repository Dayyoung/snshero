import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Flame, ShieldAlert, Sparkles, Crosshair, RefreshCw, Zap, Award } from 'lucide-react';

interface PokiTankStarsGameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

type WeaponType = 'standard' | 'cluster' | 'nuke';

interface WeaponConfig {
  type: WeaponType;
  name: string;
  iconText: string;
  damage: number;
  blastRadius: number;
  color: number;
  ammo: number;
}

const WEAPONS: Record<WeaponType, WeaponConfig> = {
  standard: {
    type: 'standard',
    name: '고폭탄',
    iconText: '💣',
    damage: 35,
    blastRadius: 2.2,
    color: 0xf59e0b,
    ammo: Infinity,
  },
  cluster: {
    type: 'cluster',
    name: '클러스터',
    iconText: '💥',
    damage: 20,
    blastRadius: 3.5,
    color: 0x38bdf8,
    ammo: 3,
  },
  nuke: {
    type: 'nuke',
    name: '전술핵',
    iconText: '☢️',
    damage: 60,
    blastRadius: 5.5,
    color: 0xef4444,
    ammo: 1,
  },
};

interface Shell {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  type: WeaponType;
  isPlayer: boolean;
  alive: boolean;
  clusterSplit?: boolean;
}

export const PokiTankStarsGame: React.FC<PokiTankStarsGameProps> = ({
  onBack,
  cardId = 60,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Gameplay state
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('standard');
  const [ammoCounts, setAmmoCounts] = useState<{ cluster: number; nuke: number }>({ cluster: 3, nuke: 1 });
  const [aimAngle, setAimAngle] = useState(45); // Degrees (15 ~ 80)
  const [aimPower, setAimPower] = useState(75); // Percent (30 ~ 100)
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Tracking refs
  const startTimeRef = useRef<number>(Date.now());
  const playerHpRef = useRef<number>(100);
  const enemyHpRef = useRef<number>(100);
  const turnRef = useRef<'player' | 'enemy'>('player');
  const enemyPrevPowerRef = useRef<number>(75);

  useEffect(() => {
    playerHpRef.current = playerHp;
    enemyHpRef.current = enemyHp;
    turnRef.current = turn;
  }, [playerHp, enemyHp, turn]);

  // Three.js Context
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerTankGroup: THREE.Group;
    playerBarrelPivot: THREE.Group;
    enemyTankGroup: THREE.Group;
    enemyBarrelPivot: THREE.Group;
    aimLine: THREE.Line;
    activeShells: Shell[];
    explosionParticles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
    cameraTargetPos: THREE.Vector3;
    cameraShake: number;
  } | null>(null);

  // Helper: Prehistoric/Cyber Terrain Height (Valley in middle, hills at sides)
  const getGroundY = (x: number): number => {
    // Left Hill: X = -18 -> Y = 2.4
    // Middle Valley: X = 0 -> Y = 0.4
    // Right Hill: X = 18 -> Y = 2.4
    return 0.4 + Math.cos((x / 18) * Math.PI - Math.PI) * 1.0 + 1.0;
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

  // Trigger Explosion
  const triggerExplosion = useCallback((x: number, y: number, z: number, blastRadius: number, colorHex: number) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) {
      navigator.vibrate(blastRadius > 4 ? [100, 50, 150, 50, 200] : [60, 30, 90]);
    }
    three.cameraShake = blastRadius * 0.15;

    const count = Math.floor(blastRadius * 20);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    const baseColor = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;

      const c = baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.2);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * blastRadius * 3.5,
        2.0 + Math.random() * blastRadius * 3.0,
        (Math.random() - 0.5) * blastRadius * 3.5
      ));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    if (three.explosionParticles) {
      three.scene.remove(three.explosionParticles);
    }
    three.explosionParticles = new THREE.Points(geo, mat);
    three.particleVels = vels;
    three.scene.add(three.explosionParticles);
  }, []);

  // Update Aiming Line
  const updateAimLine = useCallback((angleDeg: number, powerPct: number) => {
    const three = threeRef.current;
    if (!three) return;

    const rad = (angleDeg * Math.PI) / 180;
    three.playerBarrelPivot.rotation.z = rad;

    const speed = (powerPct / 100) * 26.0;
    const startP = new THREE.Vector3(-18 + Math.cos(rad) * 2.2, getGroundY(-18) + 1.2 + Math.sin(rad) * 2.2, 0);
    const vel = new THREE.Vector3(Math.cos(rad) * speed, Math.sin(rad) * speed, 0);

    const points: THREE.Vector3[] = [];
    const timeStep = 0.04;
    const currentP = startP.clone();
    const currentV = vel.clone();

    for (let i = 0; i < 25; i++) {
      points.push(currentP.clone());
      currentP.addScaledVector(currentV, timeStep);
      currentV.y -= 9.8 * timeStep;
      if (currentP.y < getGroundY(currentP.x)) break;
    }

    three.aimLine.geometry.setFromPoints(points);
    three.aimLine.computeLineDistances();
  }, []);

  // Player Fire Action
  const handlePlayerFire = () => {
    const three = threeRef.current;
    if (!three || turnRef.current !== 'player' || gameOver || gameWon) return;

    const wConfig = WEAPONS[selectedWeapon];

    // Deduct ammo if special weapon
    if (selectedWeapon === 'cluster') {
      if (ammoCounts.cluster <= 0) return;
      setAmmoCounts((a) => ({ ...a, cluster: a.cluster - 1 }));
    } else if (selectedWeapon === 'nuke') {
      if (ammoCounts.nuke <= 0) return;
      setAmmoCounts((a) => ({ ...a, nuke: a.nuke - 1 }));
    }

    setTurn('enemy');
    three.aimLine.visible = false;

    const rad = (aimAngle * Math.PI) / 180;
    const speed = (aimPower / 100) * 26.0;
    const startP = new THREE.Vector3(-18 + Math.cos(rad) * 2.2, getGroundY(-18) + 1.2 + Math.sin(rad) * 2.2, 0);
    const vel = new THREE.Vector3(Math.cos(rad) * speed, Math.sin(rad) * speed, 0);

    // Create 3D Shell Mesh
    const sGeo = selectedWeapon === 'nuke' ? new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8) : new THREE.SphereGeometry(0.32, 12, 12);
    const sMat = new THREE.MeshStandardMaterial({ color: wConfig.color, emissive: wConfig.color, emissiveIntensity: 0.5 });
    const sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.copy(startP);
    three.scene.add(sMesh);

    three.activeShells.push({
      mesh: sMesh,
      pos: startP.clone(),
      vel,
      type: selectedWeapon,
      isPlayer: true,
      alive: true,
    });

    if (navigator.vibrate) navigator.vibrate([40, 20, 60]);
    setEventBanner(`${wConfig.name} 발사!`);
    setTimeout(() => setEventBanner(null), 1200);
  };

  // AI Enemy Turn Execution
  const executeEnemyTurn = useCallback(() => {
    const three = threeRef.current;
    if (!three || gameOver || gameWon) return;

    setEventBanner('적 전차 조준 중...');

    // Enemy AI calculation: targets X = -18 from X = 18 (distance ~ 36m)
    // Adjust power slightly based on random variance
    const angleDeg = 135; // 45 deg shooting to left
    const optimalPower = 74 + (Math.random() - 0.5) * 8; // Intelligent AI
    enemyPrevPowerRef.current = optimalPower;

    const rad = (angleDeg * Math.PI) / 180;
    three.enemyBarrelPivot.rotation.z = rad;

    setTimeout(() => {
      if (!threeRef.current || gameOver || gameWon) return;

      const speed = (optimalPower / 100) * 26.0;
      const startP = new THREE.Vector3(18 + Math.cos(rad) * 2.2, getGroundY(18) + 1.2 + Math.sin(rad) * 2.2, 0);
      const vel = new THREE.Vector3(Math.cos(rad) * speed, Math.sin(rad) * speed, 0);

      const sGeo = new THREE.SphereGeometry(0.32, 12, 12);
      const sMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.5 });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.copy(startP);
      three.scene.add(sMesh);

      three.activeShells.push({
        mesh: sMesh,
        pos: startP.clone(),
        vel,
        type: 'standard',
        isPlayer: false,
        alive: true,
      });

      setEventBanner('적 전차 발사!');
      setTimeout(() => setEventBanner(null), 1200);
    }, 1500);
  }, [gameOver, gameWon]);

  // Restart Handler
  const handleRestart = () => {
    setPlayerHp(100);
    setEnemyHp(100);
    setTurn('player');
    setSelectedWeapon('standard');
    setAmmoCounts({ cluster: 3, nuke: 1 });
    setAimAngle(45);
    setAimPower(75);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();

    if (threeRef.current) {
      threeRef.current.aimLine.visible = true;
      updateAimLine(45, 75);
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
    scene.background = new THREE.Color(0xe2e8f0); // Deep space dark cyber blue
    scene.fog = new THREE.FogExp2(0xe2e8f0, 0.015);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 120);
    camera.position.set(0, 8.5, 26.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    sunLight.position.set(10, 30, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Build 3D Terrain Ribbons (Curved Mesh)
    const terrainGeo = new THREE.PlaneGeometry(60, 20, 60, 20);
    const posAttr = terrainGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      // Curve Y based on getGroundY
      const groundH = getGroundY(vx);
      posAttr.setZ(i, (vy / 20) * 12); // Extrude Z
      posAttr.setY(i, groundH + (vy / 20) * 0.5);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Terrain Wireframe Grid on top
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true, transparent: true, opacity: 0.3 });
    const wireMesh = new THREE.Mesh(terrainGeo, wireMat);
    wireMesh.position.y += 0.02;
    scene.add(wireMesh);

    // Helper: Create Tank Model
    const createTank = (isPlayer: boolean) => {
      const tankGroup = new THREE.Group();
      const bodyColor = isPlayer ? 0x2563eb : 0xdc2626;
      const trackColor = 0x0f172a;

      const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
      const trackMat = new THREE.MeshLambertMaterial({ color: trackColor });

      // Dual Tracks
      const trackGeo = new THREE.BoxGeometry(3.0, 0.6, 0.6);
      const leftTrack = new THREE.Mesh(trackGeo, trackMat);
      leftTrack.position.set(0, 0.3, 0.9);
      tankGroup.add(leftTrack);

      const rightTrack = new THREE.Mesh(trackGeo, trackMat);
      rightTrack.position.set(0, 0.3, -0.9);
      tankGroup.add(rightTrack);

      // Chassis Body
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.4), bodyMat);
      chassis.position.set(0, 0.65, 0);
      tankGroup.add(chassis);

      // Turret
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.6, 16), bodyMat);
      turret.position.set(0, 1.2, 0);
      tankGroup.add(turret);

      // Barrel Pivot Group
      const barrelPivot = new THREE.Group();
      barrelPivot.position.set(0, 1.2, 0);

      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 2.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
      );
      barrel.rotation.z = Math.PI / 2;
      barrel.position.x = 1.1;
      barrelPivot.add(barrel);

      tankGroup.add(barrelPivot);

      // Card Badge for Player
      if (isPlayer) {
        const badgeGeo = new THREE.PlaneGeometry(0.8, 1.0);
        const badgeMat = new THREE.MeshBasicMaterial({
          map: createCardBadgeTexture(cardId),
          transparent: true,
          side: THREE.DoubleSide,
        });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0, 2.4, 0);
        tankGroup.add(badge);
      }

      return { tankGroup, barrelPivot };
    };

    // Player Tank (Left Hill: X = -18, Y = getGroundY(-18))
    const pTank = createTank(true);
    pTank.tankGroup.position.set(-18, getGroundY(-18), 0);
    pTank.barrelPivot.rotation.z = (45 * Math.PI) / 180;
    scene.add(pTank.tankGroup);

    // Enemy Tank (Right Hill: X = 18, Y = getGroundY(18))
    const eTank = createTank(false);
    eTank.tankGroup.position.set(18, getGroundY(18), 0);
    eTank.tankGroup.rotation.y = Math.PI; // Face left
    eTank.barrelPivot.rotation.z = (45 * Math.PI) / 180;
    scene.add(eTank.tankGroup);

    // Aim Line
    const aimGeo = new THREE.BufferGeometry();
    const aimMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.4,
      gapSize: 0.2,
      linewidth: 3,
    });
    const aimLine = new THREE.Line(aimGeo, aimMat);
    scene.add(aimLine);

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerTankGroup: pTank.tankGroup,
      playerBarrelPivot: pTank.barrelPivot,
      enemyTankGroup: eTank.tankGroup,
      enemyBarrelPivot: eTank.barrelPivot,
      aimLine,
      activeShells: [],
      explosionParticles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
      cameraTargetPos: new THREE.Vector3(0, 8.5, 26.0),
      cameraShake: 0,
    };

    updateAimLine(45, 75);

    // Main Game & Ballistics Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Camera Shake
      if (three.cameraShake > 0) {
        three.camera.position.x = three.cameraTargetPos.x + (Math.random() - 0.5) * three.cameraShake;
        three.camera.position.y = three.cameraTargetPos.y + (Math.random() - 0.5) * three.cameraShake;
        three.cameraShake *= 0.88;
      } else {
        three.camera.position.lerp(three.cameraTargetPos, 0.05);
      }
      three.camera.lookAt(0, 3.5, 0);

      // Update Shells
      for (let si = three.activeShells.length - 1; si >= 0; si--) {
        const sh = three.activeShells[si];
        if (!sh.alive) continue;

        // Gravity
        sh.vel.y -= 9.8 * delta;
        sh.pos.addScaledVector(sh.vel, delta);
        sh.mesh.position.copy(sh.pos);

        // Dynamic Camera tracking of Shell
        three.cameraTargetPos.x = THREE.MathUtils.clamp(sh.pos.x * 0.7, -10, 10);
        three.cameraTargetPos.y = Math.max(8.5, sh.pos.y + 4.0);

        // Cluster Bomb Apex Split Check
        if (sh.type === 'cluster' && !sh.clusterSplit && sh.vel.y < 1.0) {
          sh.clusterSplit = true;
          // Spawn 2 extra cluster sub-shells!
          const sub1Mat = (sh.mesh.material as THREE.Material).clone();
          const sub1 = new THREE.Mesh(sh.mesh.geometry, sub1Mat);
          sub1.position.copy(sh.pos);
          three.scene.add(sub1);
          three.activeShells.push({
            mesh: sub1,
            pos: sh.pos.clone(),
            vel: sh.vel.clone().add(new THREE.Vector3(2.5, 1.5, 0)),
            type: 'standard',
            isPlayer: sh.isPlayer,
            alive: true,
          });

          const sub2Mat = (sh.mesh.material as THREE.Material).clone();
          const sub2 = new THREE.Mesh(sh.mesh.geometry, sub2Mat);
          sub2.position.copy(sh.pos);
          three.scene.add(sub2);
          three.activeShells.push({
            mesh: sub2,
            pos: sh.pos.clone(),
            vel: sh.vel.clone().add(new THREE.Vector3(-2.5, 1.5, 0)),
            type: 'standard',
            isPlayer: sh.isPlayer,
            alive: true,
          });
        }

        const floorY = getGroundY(sh.pos.x);
        const wConfig = WEAPONS[sh.type] || WEAPONS.standard;

        // Ground Impact or Out of Bounds
        if (sh.pos.y <= floorY || sh.pos.x < -32 || sh.pos.x > 32) {
          sh.alive = false;
          three.scene.remove(sh.mesh);
          three.activeShells.splice(si, 1);

          triggerExplosion(sh.pos.x, floorY + 0.3, 0, wConfig.blastRadius, wConfig.color);

          // Check Splash Damage to Tanks
          const targetPos = sh.isPlayer ? three.enemyTankGroup.position : three.playerTankGroup.position;
          const distToTarget = Math.hypot(sh.pos.x - targetPos.x, sh.pos.y - targetPos.y);

          if (distToTarget <= wConfig.blastRadius + 1.2) {
            // HIT!
            const falloff = Math.max(0.4, 1.0 - distToTarget / (wConfig.blastRadius + 1.2));
            const dmg = Math.round(wConfig.damage * falloff);

            if (sh.isPlayer) {
              const newHp = Math.max(0, enemyHpRef.current - dmg);
              setEnemyHp(newHp);
              setEventBanner(`적 전차 명중! (-${dmg} HP)`);

              if (newHp <= 0) {
                // VICTORY!
                setGameWon(true);
                const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const reward = calculateAndDepositMissionReward({
                  gameId: 'poki-tank-stars',
                  gameTitle: 'Tank Stars 3D',
                  isVictory: true,
                  score: 1000,
                  maxTargetScore: 1000,
                  durationSeconds: dur,
                });
                setRewardResult(reward);
                return;
              }
            } else {
              const newHp = Math.max(0, playerHpRef.current - dmg);
              setPlayerHp(newHp);
              setEventBanner(`플레이어 피격! (-${dmg} HP)`);

              if (newHp <= 0) {
                // GAME OVER
                setGameOver(true);
                const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const reward = calculateAndDepositMissionReward({
                  gameId: 'poki-tank-stars',
                  gameTitle: 'Tank Stars 3D',
                  isVictory: false,
                  score: Math.max(100, 1000 - enemyHpRef.current * 8),
                  maxTargetScore: 1000,
                  durationSeconds: dur,
                });
                setRewardResult(reward);
                return;
              }
            }
          } else {
            setEventBanner('빗나갔습니다!');
          }

          // Reset camera target
          three.cameraTargetPos.set(0, 8.5, 26.0);

          // If no shells remaining, trigger next turn
          if (three.activeShells.length === 0) {
            setTimeout(() => {
              if (sh.isPlayer) {
                executeEnemyTurn();
              } else {
                setTurn('player');
                three.aimLine.visible = true;
              }
            }, 1200);
          }
        }
      }

      // Explosion particles
      if (three.explosionParticles && three.particleVels.length > 0) {
        const posAttr = three.explosionParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
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
  }, [cardId, executeEnemyTurn, triggerExplosion, updateAimLine]);

  // Adjust Aim Angle
  const handleAngleChange = (newAngle: number) => {
    setAimAngle(newAngle);
    updateAimLine(newAngle, aimPower);
  };

  // Adjust Aim Power
  const handlePowerChange = (newPower: number) => {
    setAimPower(newPower);
    updateAimLine(aimAngle, newPower);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#e2e8f0] font-mono text-white"
    >
      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle="TANK STARS 3D"
        onBack={onBack}
        score={100 - enemyHp}
        targetScore={100}
      />

      {/* Dual Tank Health Status Bar */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        {/* Player Tank HP (Blue) */}
        <div className="bg-slate-900/90 border border-sky-500/80 backdrop-blur-md p-2.5 rounded-none shadow-xl min-w-[160px]">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-sky-400 font-bold">플레이어 (KOR)</span>
            <span className="font-extrabold text-sky-300">{playerHp} HP</span>
          </div>
          <div className="bg-slate-950 h-3 border border-slate-700 overflow-hidden">
            <div
              className="bg-sky-500 h-full transition-all duration-300"
              style={{ width: `${playerHp}%` }}
            />
          </div>
        </div>

        {/* Turn Status Banner */}
        <div className="bg-slate-900/95 border border-slate-700 px-4 py-1.5 shadow-2xl">
          <span
            className={`text-xs font-black uppercase tracking-wider ${
              turn === 'player' ? 'text-emerald-400 animate-pulse' : 'text-rose-400'
            }`}
          >
            {turn === 'player' ? '내 턴 (사격 가능)' : '적 턴 (사격 중)'}
          </span>
        </div>

        {/* Enemy Tank HP (Red) */}
        <div className="bg-slate-900/90 border border-rose-500/80 backdrop-blur-md p-2.5 rounded-none shadow-xl min-w-[160px]">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-rose-400 font-bold">적 AI 전차</span>
            <span className="font-extrabold text-rose-300">{enemyHp} HP</span>
          </div>
          <div className="bg-slate-950 h-3 border border-slate-700 overflow-hidden">
            <div
              className="bg-rose-600 h-full transition-all duration-300"
              style={{ width: `${enemyHp}%` }}
            />
          </div>
        </div>
      </div>

      {/* Event Banner */}
      {eventBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-amber-500 text-slate-950 font-black px-6 py-1.5 border-2 border-amber-200 text-sm md:text-base shadow-2xl uppercase">
            {eventBanner}
          </div>
        </div>
      )}

      {/* Bottom Controls: Aiming Sliders & Weapon Select & FIRE */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col md:flex-row items-end justify-between gap-4 pointer-events-auto">
        {/* Left: Angle & Power Sliders */}
        <div className="bg-slate-900/90 border border-slate-700 p-3 shadow-2xl flex flex-col gap-2 min-w-[220px]">
          {/* Angle Slider */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>주포 앙각 (Angle):</span>
              <span className="text-sky-400 font-bold">{aimAngle}°</span>
            </div>
            <input
              type="range"
              min="15"
              max="80"
              value={aimAngle}
              disabled={turn !== 'player'}
              onChange={(e) => handleAngleChange(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-2"
            />
          </div>

          {/* Power Slider */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>발사 파워 (Power):</span>
              <span className="text-amber-400 font-bold">{aimPower}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={aimPower}
              disabled={turn !== 'player'}
              onChange={(e) => handlePowerChange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2"
            />
          </div>
        </div>

        {/* Center: Weapon Cards */}
        <div className="flex gap-2">
          {(['standard', 'cluster', 'nuke'] as WeaponType[]).map((wKey) => {
            const w = WEAPONS[wKey];
            const isSelected = selectedWeapon === wKey;
            const ammo = wKey === 'standard' ? '∞' : ammoCounts[wKey];
            const isAvailable = wKey === 'standard' || ammoCounts[wKey] > 0;

            return (
              <button
                key={wKey}
                onClick={() => setSelectedWeapon(wKey)}
                disabled={!isAvailable || turn !== 'player'}
                className={`px-3.5 py-2.5 rounded-sm border-2 flex flex-col items-center min-w-[80px] transition-transform active:scale-95 ${
                  isSelected
                    ? 'bg-slate-800 border-sky-400 shadow-lg'
                    : isAvailable
                    ? 'bg-slate-900/80 border-slate-700 text-slate-400'
                    : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40'
                }`}
              >
                <span className="text-lg mb-0.5">{w.iconText}</span>
                <span className="text-[11px] font-bold text-white">{w.name}</span>
                <span className="text-[10px] text-amber-400 font-semibold">{ammo}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Large 76px FIRE Button */}
        <div>
          <button
            onClick={handlePlayerFire}
            disabled={turn !== 'player'}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl transition-transform active:scale-90 font-black ${
              turn === 'player'
                ? 'bg-gradient-to-tr from-amber-600 to-amber-500 border-yellow-200 text-slate-950 hover:brightness-110'
                : 'bg-slate-800 border-slate-700 text-slate-500 opacity-40'
            }`}
          >
            <Flame className="w-7 h-7 mb-0.5" />
            <span className="text-xs tracking-wider">포격</span>
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">전차 파괴 패배</h2>
            <p className="text-xs text-slate-300 mb-4">
              적의 정밀 포격에 피격되어 아군 전차가 파괴되었습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-sm flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> 재도전
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

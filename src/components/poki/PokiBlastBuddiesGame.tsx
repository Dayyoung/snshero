import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Bomb, Flame, Zap, ShieldAlert, Sparkles, RefreshCw, Trophy, Heart } from 'lucide-react';

interface PokiBlastBuddiesGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface BuddyEntity {
  group: THREE.Group;
  pos: THREE.Vector3;
  gridX: number;
  gridY: number;
  isPlayer: boolean;
  color: number;
  alive: boolean;
  bombRange: number;
  maxBombs: number;
  activeBombs: number;
  speed: number;
  aiCooldown: number;
}

interface ActiveBomb {
  mesh: THREE.Mesh;
  gx: number;
  gy: number;
  range: number;
  timer: number;
  ownerId: number;
}

interface ExplosionBeam {
  mesh: THREE.Mesh;
  timer: number;
}

interface PowerUpItem {
  mesh: THREE.Mesh;
  gx: number;
  gy: number;
  type: 'range' | 'bomb' | 'speed';
}

const GRID_SIZE = 11;
const TILE_SIZE = 2.0;

export default function PokiBlastBuddiesGame({
  onClose,
  onBack,
  cardId = 62,
  onExit
}: PokiBlastBuddiesGameProps) {
  const handleExit = onBack || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI state
  const [aliveCount, setAliveCount] = useState(4);
  const [score, setScore] = useState(0);
  const [bombRange, setBombRange] = useState(1);
  const [maxBombs, setMaxBombs] = useState(1);
  const [speedLevel, setSpeedLevel] = useState(1);
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
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Three.js Context
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    gridMap: number[][]; // 0: empty, 1: solid pillar, 2: destructible crate
    crateMeshes: Map<string, THREE.Mesh>;
    buddies: BuddyEntity[];
    bombs: ActiveBomb[];
    explosions: ExplosionBeam[];
    items: PowerUpItem[];
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // Helper: Grid coordinate to World Position
  const gridToWorld = (gx: number, gy: number): { x: number; z: number } => {
    const half = (GRID_SIZE - 1) / 2;
    return {
      x: (gx - half) * TILE_SIZE,
      z: (gy - half) * TILE_SIZE,
    };
  };

  const worldToGrid = (wx: number, wz: number): { gx: number; gy: number } => {
    const half = (GRID_SIZE - 1) / 2;
    return {
      gx: Math.round(wx / TILE_SIZE + half),
      gy: Math.round(wz / TILE_SIZE + half),
    };
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

  // Trigger Sparks
  const triggerSparks = useCallback((x: number, y: number, z: number, colorHex = 0xf59e0b) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) navigator.vibrate([40, 20, 60]);

    const count = 30;
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

  // Drop Bomb Action
  const handleDropBomb = () => {
    const three = threeRef.current;
    if (!three || gameOver || gameWon) return;

    const player = three.buddies[0];
    if (!player || !player.alive || player.activeBombs >= player.maxBombs) return;

    const { gx, gy } = worldToGrid(player.pos.x, player.pos.z);
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return;

    // Check if bomb already on this tile
    const alreadyHasBomb = three.bombs.some((b) => b.gx === gx && b.gy === gy);
    if (alreadyHasBomb) return;

    player.activeBombs++;

    const { x, z } = gridToWorld(gx, gy);
    const bombGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const bombMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const bombMesh = new THREE.Mesh(bombGeo, bombMat);
    bombMesh.position.set(x, 0.65, z);
    three.scene.add(bombMesh);

    three.bombs.push({
      mesh: bombMesh,
      gx,
      gy,
      range: player.bombRange,
      timer: 2.5,
      ownerId: 0,
    });

    if (navigator.vibrate) navigator.vibrate(30);
  };

  // Explode Bomb
  const explodeBomb = useCallback((bomb: ActiveBomb) => {
    const three = threeRef.current;
    if (!three) return;

    const owner = three.buddies[bomb.ownerId];
    if (owner) owner.activeBombs = Math.max(0, owner.activeBombs - 1);

    const { x, z } = gridToWorld(bomb.gx, bomb.gy);
    triggerSparks(x, 0.8, z, 0xef4444);

    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff3b00, transparent: true, opacity: 0.85 });

    const createFireBeam = (tgx: number, tgy: number) => {
      const wPos = gridToWorld(tgx, tgy);
      const beamGeo = new THREE.BoxGeometry(TILE_SIZE * 0.9, 1.4, TILE_SIZE * 0.9);
      const beamMesh = new THREE.Mesh(beamGeo, fireMat);
      beamMesh.position.set(wPos.x, 0.7, wPos.z);
      three.scene.add(beamMesh);
      three.explosions.push({ mesh: beamMesh, timer: 0.45 });

      // Check Buddy Hit
      for (const b of three.buddies) {
        if (!b.alive) continue;
        const bG = worldToGrid(b.pos.x, b.pos.z);
        if (bG.gx === tgx && bG.gy === tgy) {
          // BUDDY ELIMINATED!
          b.alive = false;
          b.group.visible = false;
          triggerSparks(b.pos.x, 1.0, b.pos.z, b.color);

          if (b.isPlayer) {
            setGameOver(true);
            const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const reward = calculateAndDepositMissionReward({
              gameId: 'poki-blast-buddies',
              gameTitle: 'Blast Buddies 3D',
              isVictory: false,
              score: scoreRef.current,
              maxTargetScore: 1000,
              durationSeconds: dur,
            });
            setRewardResult(reward);
          } else {
            setScore((s) => s + 300);
            setEventBanner('라이벌 버디 폭파! (+300)');
            setTimeout(() => setEventBanner(null), 1200);
          }
        }
      }

      // Check Crate Hit & Destroy
      if (three.gridMap[tgx]?.[tgy] === 2) {
        three.gridMap[tgx][tgy] = 0;
        const key = `${tgx}_${tgy}`;
        const cMesh = three.crateMeshes.get(key);
        if (cMesh) {
          three.scene.remove(cMesh);
          three.crateMeshes.delete(key);
        }

        // 45% chance to drop power-up item!
        if (Math.random() < 0.45) {
          const types: ('range' | 'bomb' | 'speed')[] = ['range', 'bomb', 'speed'];
          const pType = types[Math.floor(Math.random() * types.length)];
          const itemColor = pType === 'range' ? 0xef4444 : pType === 'bomb' ? 0x38bdf8 : 0x22c55e;

          const itemMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.7, 0.7),
            new THREE.MeshStandardMaterial({ color: itemColor, emissive: itemColor, emissiveIntensity: 0.5 })
          );
          itemMesh.position.set(wPos.x, 0.5, wPos.z);
          three.scene.add(itemMesh);
          three.items.push({ mesh: itemMesh, gx: tgx, gy: tgy, type: pType });
        }
      }
    };

    // Center explosion
    createFireBeam(bomb.gx, bomb.gy);

    // Crossfire 4 directions (Left, Right, Up, Down)
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (const d of dirs) {
      for (let step = 1; step <= bomb.range; step++) {
        const nx = bomb.gx + d.dx * step;
        const ny = bomb.gy + d.dy * step;

        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) break;

        // Solid Pillar stops blast
        if (three.gridMap[nx][ny] === 1) break;

        createFireBeam(nx, ny);

        // Crate stops blast after destroying it
        if (three.gridMap[nx][ny] === 2) break;
      }
    }
  }, [triggerSparks]);

  // Restart Handler
  const handleRestart = () => {
    setAliveCount(4);
    setScore(0);
    setBombRange(1);
    setMaxBombs(1);
    setSpeedLevel(1);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();

    if (threeRef.current) {
      const three = threeRef.current;
      // Reset map crates
      for (const [_, mesh] of three.crateMeshes) {
        three.scene.remove(mesh);
      }
      three.crateMeshes.clear();

      for (const it of three.items) {
        three.scene.remove(it.mesh);
      }
      three.items = [];

      for (const b of three.bombs) {
        three.scene.remove(b.mesh);
      }
      three.bombs = [];

      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          if (three.gridMap[x][y] === 2) three.gridMap[x][y] = 0;
        }
      }

      // Re-spawn crates
      const crateGeo = new THREE.BoxGeometry(TILE_SIZE * 0.9, 1.4, TILE_SIZE * 0.9);
      const crateMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          if (three.gridMap[x][y] === 0) {
            // Leave corners safe
            if ((x <= 1 && y <= 1) || (x >= GRID_SIZE - 2 && y >= GRID_SIZE - 2) || (x <= 1 && y >= GRID_SIZE - 2) || (x >= GRID_SIZE - 2 && y <= 1)) {
              continue;
            }
            if (Math.random() < 0.65) {
              three.gridMap[x][y] = 2;
              const wPos = gridToWorld(x, y);
              const cMesh = new THREE.Mesh(crateGeo, crateMat);
              cMesh.position.set(wPos.x, 0.7, wPos.z);
              three.scene.add(cMesh);
              three.crateMeshes.set(`${x}_${y}`, cMesh);
            }
          }
        }
      }

      // Reset buddies
      const spawns = [
        { gx: 0, gy: 0 },
        { gx: GRID_SIZE - 1, gy: GRID_SIZE - 1 },
        { gx: 0, gy: GRID_SIZE - 1 },
        { gx: GRID_SIZE - 1, gy: 0 },
      ];

      for (let i = 0; i < 4; i++) {
        const b = three.buddies[i];
        const wP = gridToWorld(spawns[i].gx, spawns[i].gy);
        b.pos.set(wP.x, 0, wP.z);
        b.group.position.set(wP.x, 0, wP.z);
        b.alive = true;
        b.group.visible = true;
        b.activeBombs = 0;
        b.bombRange = 1;
        b.maxBombs = 1;
        b.speed = 6.0;
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
    scene.background = new THREE.Color(0x0c1222); // Cyber dark blue
    scene.fog = new THREE.FogExp2(0x0c1222, 0.015);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 21, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    sunLight.position.set(12, 28, 16);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Arena Floor (Checkerboard Tile)
    const floorMat1 = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const floorMat2 = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const wP = gridToWorld(x, y);
        const tileGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.98, TILE_SIZE * 0.98);
        const tile = new THREE.Mesh(tileGeo, (x + y) % 2 === 0 ? floorMat1 : floorMat2);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(wP.x, 0.01, wP.z);
        tile.receiveShadow = true;
        scene.add(tile);
      }
    }

    // Grid Map Data (0: Empty, 1: Indestructible Pillar, 2: Destructible Crate)
    const gridMap: number[][] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      gridMap[x] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        gridMap[x][y] = 0;
      }
    }

    // Place Indestructible Pillars at odd coordinates (1,3,5,7,9)
    const pillarGeo = new THREE.BoxGeometry(TILE_SIZE * 0.95, 1.8, TILE_SIZE * 0.95);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.6 });

    for (let x = 1; x < GRID_SIZE; x += 2) {
      for (let y = 1; y < GRID_SIZE; y += 2) {
        gridMap[x][y] = 1;
        const wP = gridToWorld(x, y);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(wP.x, 0.9, wP.z);
        pillar.castShadow = true;
        scene.add(pillar);
      }
    }

    // Place Destructible Crates (25 Crates)
    const crateMeshes = new Map<string, THREE.Mesh>();
    const crateGeo = new THREE.BoxGeometry(TILE_SIZE * 0.9, 1.4, TILE_SIZE * 0.9);
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xb45309 }); // Warm wood brown

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (gridMap[x][y] === 0) {
          // Leave 4 corners safe (2x2 area)
          if ((x <= 1 && y <= 1) || (x >= GRID_SIZE - 2 && y >= GRID_SIZE - 2) || (x <= 1 && y >= GRID_SIZE - 2) || (x >= GRID_SIZE - 2 && y <= 1)) {
            continue;
          }
          if (Math.random() < 0.65) {
            gridMap[x][y] = 2;
            const wP = gridToWorld(x, y);
            const cMesh = new THREE.Mesh(crateGeo, crateMat);
            cMesh.position.set(wP.x, 0.7, wP.z);
            cMesh.castShadow = true;
            scene.add(cMesh);
            crateMeshes.set(`${x}_${y}`, cMesh);
          }
        }
      }
    }

    // Helper: Create 3D Buddy Character
    const createBuddy = (colorHex: number, isPlayer: boolean, gx: number, gy: number) => {
      const g = new THREE.Group();
      const wP = gridToWorld(gx, gy);
      g.position.set(wP.x, 0, wP.z);

      const suitMat = new THREE.MeshLambertMaterial({ color: colorHex });
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

      // Body (Capsule / Rounded Cube)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), suitMat);
      body.position.y = 0.65;
      g.add(body);

      // Visor Glasses
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.2), visorMat);
      visor.position.set(0, 0.8, -0.42);
      g.add(visor);

      // Card Badge for Player
      if (isPlayer) {
        const badgeGeo = new THREE.PlaneGeometry(0.65, 0.82);
        const badgeMat = new THREE.MeshBasicMaterial({
          map: createCardBadgeTexture(cardId),
          transparent: true,
          side: THREE.DoubleSide,
        });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0, 1.7, 0);
        g.add(badge);
      }

      scene.add(g);

      return {
        group: g,
        pos: new THREE.Vector3(wP.x, 0, wP.z),
        gridX: gx,
        gridY: gy,
        isPlayer,
        color: colorHex,
        alive: true,
        bombRange: 1,
        maxBombs: 1,
        activeBombs: 0,
        speed: 6.0,
        aiCooldown: 1.0 + Math.random(),
      };
    };

    // 4 Buddies
    const buddies: BuddyEntity[] = [];
    buddies.push(createBuddy(0x2563eb, true, 0, 0)); // Player (South-West)
    buddies.push(createBuddy(0xdc2626, false, GRID_SIZE - 1, GRID_SIZE - 1)); // Rival 1 (North-East)
    buddies.push(createBuddy(0xeab308, false, 0, GRID_SIZE - 1)); // Rival 2 (North-West)
    buddies.push(createBuddy(0x9333ea, false, GRID_SIZE - 1, 0)); // Rival 3 (South-East)

    threeRef.current = {
      scene,
      camera,
      renderer,
      gridMap,
      crateMeshes,
      buddies,
      bombs: [],
      explosions: [],
      items: [],
      particles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
    };

    // Main Game Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Player Movement
      const player = three.buddies[0];
      const inp = inputDirRef.current;
      const isMoving = Math.hypot(inp.x, inp.y) > 0.1;

      if (player.alive && isMoving) {
        const nextX = player.pos.x + inp.x * player.speed * delta;
        const nextZ = player.pos.z + inp.y * player.speed * delta;

        // Collision with map boundaries & blocks
        const nG = worldToGrid(nextX, nextZ);
        const canMoveX = nG.gx >= 0 && nG.gx < GRID_SIZE && three.gridMap[nG.gx]?.[worldToGrid(player.pos.x, player.pos.z).gy] === 0;
        const canMoveZ = nG.gy >= 0 && nG.gy < GRID_SIZE && three.gridMap[worldToGrid(player.pos.x, player.pos.z).gx]?.[nG.gy] === 0;

        if (canMoveX) player.pos.x = nextX;
        if (canMoveZ) player.pos.z = nextZ;

        player.group.rotation.y = Math.atan2(-inp.x, -inp.y);
      }
      player.group.position.copy(player.pos);

      // Check Item Pickups
      const pGrid = worldToGrid(player.pos.x, player.pos.z);
      for (let ii = three.items.length - 1; ii >= 0; ii--) {
        const it = three.items[ii];
        it.mesh.rotation.y += delta * 3;

        if (it.gx === pGrid.gx && it.gy === pGrid.gy) {
          // Collected item!
          three.scene.remove(it.mesh);
          three.items.splice(ii, 1);
          triggerSparks(player.pos.x, 0.8, player.pos.z, 0xfacc15);

          if (it.type === 'range') {
            player.bombRange++;
            setBombRange(player.bombRange);
            setEventBanner('화력 강화! (RANGE +1)');
          } else if (it.type === 'bomb') {
            player.maxBombs++;
            setMaxBombs(player.maxBombs);
            setEventBanner('폭탄 개수 증가! (BOMB +1)');
          } else if (it.type === 'speed') {
            player.speed *= 1.15;
            setSpeedLevel((sl) => sl + 1);
            setEventBanner('이동 속도 증가! (SPEED UP)');
          }
          setScore((s) => s + 50);
          setTimeout(() => setEventBanner(null), 1000);
        }
      }

      // Update AI Buddies
      for (let i = 1; i < 4; i++) {
        const ai = three.buddies[i];
        if (!ai.alive) continue;

        ai.aiCooldown -= delta;

        // Simple wandering and random bomb dropping
        const aiGrid = worldToGrid(ai.pos.x, ai.pos.z);
        if (ai.aiCooldown <= 0) {
          ai.aiCooldown = 2.5 + Math.random() * 2.0;

          // Drop bomb if near crates or player
          if (ai.activeBombs < ai.maxBombs && Math.random() < 0.6) {
            ai.activeBombs++;
            const { x, z } = gridToWorld(aiGrid.gx, aiGrid.gy);
            const bGeo = new THREE.SphereGeometry(0.65, 12, 12);
            const bMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
            const bMesh = new THREE.Mesh(bGeo, bMat);
            bMesh.position.set(x, 0.65, z);
            three.scene.add(bMesh);

            three.bombs.push({
              mesh: bMesh,
              gx: aiGrid.gx,
              gy: aiGrid.gy,
              range: ai.bombRange,
              timer: 2.5,
              ownerId: i,
            });
          }
        }

        // Random walk towards empty adjacent tile
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        const targetX = ai.pos.x + d.dx * ai.speed * delta * 0.4;
        const targetZ = ai.pos.z + d.dy * ai.speed * delta * 0.4;

        const checkG = worldToGrid(targetX, targetZ);
        if (checkG.gx >= 0 && checkG.gx < GRID_SIZE && checkG.gy >= 0 && checkG.gy < GRID_SIZE && three.gridMap[checkG.gx]?.[checkG.gy] === 0) {
          ai.pos.x = targetX;
          ai.pos.z = targetZ;
        }
        ai.group.position.copy(ai.pos);
      }

      // Update Bombs
      for (let bi = three.bombs.length - 1; bi >= 0; bi--) {
        const b = three.bombs[bi];
        b.timer -= delta;

        // Pulsing bounce before explosion
        const scale = 1.0 + Math.sin((2.5 - b.timer) * 12) * 0.15;
        b.mesh.scale.set(scale, scale, scale);

        if (b.timer <= 0) {
          three.scene.remove(b.mesh);
          three.bombs.splice(bi, 1);
          explodeBomb(b);
        }
      }

      // Update Explosions
      for (let ei = three.explosions.length - 1; ei >= 0; ei--) {
        const ex = three.explosions[ei];
        ex.timer -= delta;
        if (ex.timer <= 0) {
          three.scene.remove(ex.mesh);
          three.explosions.splice(ei, 1);
        }
      }

      // Count Living Buddies
      let living = 0;
      for (const b of three.buddies) {
        if (b.alive) living++;
      }
      setAliveCount(living);

      // Victory Check
      if (player.alive && living === 1 && !gameOver && !gameWon) {
        setGameWon(true);
        triggerSparks(player.pos.x, 1.5, player.pos.z, 0xfacc15);
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const reward = calculateAndDepositMissionReward({
          gameId: 'poki-blast-buddies',
          gameTitle: 'Blast Buddies 3D',
          isVictory: true,
          score: scoreRef.current + 400,
          maxTargetScore: 1000,
          durationSeconds: dur,
        });
        setRewardResult(reward);
      }

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
  }, [cardId, explodeBomb, triggerSparks]);

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
        gameTitle="BLAST BUDDIES 3D"
        onBack={handleExit}
        score={score}
        targetScore={1000}
      />

      {/* Survivor Count & Stats Bar */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        {/* Powerups Stats */}
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3.5 py-2 flex items-center gap-3 shadow-xl text-xs">
          <div className="flex items-center gap-1 text-rose-400 font-bold">
            <Flame className="w-3.5 h-3.5" /> 화력: {bombRange}
          </div>
          <div className="flex items-center gap-1 text-sky-400 font-bold">
            <Bomb className="w-3.5 h-3.5" /> 폭탄: {maxBombs}
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Zap className="w-3.5 h-3.5" /> 속도: {speedLevel}
          </div>
        </div>

        {/* Survivor Count */}
        <div className="bg-slate-900/90 border border-amber-500/80 backdrop-blur-md px-4 py-2 text-right shadow-xl">
          <div className="text-[10px] text-slate-400">생존 버디</div>
          <div className="text-base font-black text-amber-400">{aliveCount} / 4</div>
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

      {/* Right Pure Touch BOMB Button */}
      <div className="absolute bottom-8 right-6 z-20 pointer-events-auto">
        <button
          onClick={handleDropBomb}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-amber-400 text-amber-400 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform font-black"
        >
          <Bomb className="w-7 h-7 mb-0.5 fill-amber-400" />
          <span className="text-xs tracking-wider">폭탄</span>
        </button>
      </div>

      {/* Guide Tip */}
      <div className="absolute bottom-3 left-6 z-10 text-[11px] text-slate-400 pointer-events-none">
        💡 폭탄을 설치해 상자를 부수고 아이템을 모아 적들을 폭파하세요!
      </div>

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">폭탄 폭사 패배</h2>
            <p className="text-xs text-slate-300 mb-4">
              폭탄 화염에 휩싸여 버디가 폭파되었습니다.
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

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiShenzhenMahjongGameProps {
  onBack: () => void;
  cardId?: number;
}

interface TileDefinition {
  type: string;
  name: string;
  symbol: string;
  subSymbol: string;
  color: string;
}

const TILE_DEFS: TileDefinition[] = [
  { type: 'dragon_red', name: '紅中', symbol: '中', subSymbol: 'RED', color: '#dc2626' },
  { type: 'dragon_green', name: '發財', symbol: '發', subSymbol: 'GRN', color: '#16a34a' },
  { type: 'dragon_white', name: '白板', symbol: '□', subSymbol: 'WHT', color: '#2563eb' },
  { type: 'bamboo_1', name: '一索', symbol: '🎋', subSymbol: '1 BAM', color: '#059669' },
  { type: 'bamboo_8', name: '八索', symbol: '🀐', subSymbol: '8 BAM', color: '#047857' },
  { type: 'coin_1', name: '一筒', symbol: '🪙', subSymbol: '1 DOT', color: '#d97706' },
  { type: 'char_9', name: '九萬', symbol: '九萬', subSymbol: '9 WAN', color: '#b91c1c' },
  { type: 'flower_plum', name: '梅花', symbol: '🌸', subSymbol: 'PLUM', color: '#db2777' },
];

interface TileInstance {
  id: number;
  type: string;
  name: string;
  mesh: THREE.Mesh;
  origPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  layer: number;
  gridX: number;
  gridZ: number;
  isCleared: boolean;
  isSelected: boolean;
  isHinted: boolean;
}

export const PokiShenzhenMahjongGame: React.FC<PokiShenzhenMahjongGameProps> = ({
  onBack,
  cardId = 49,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Progress State
  const totalPairs = 16; // 32 tiles = 16 pairs
  const [pairsCleared, setPairsCleared] = useState(0);
  const [timeLeft, setTimeLeft] = useState(150);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [shufflesLeft, setShufflesLeft] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  // Interaction State Refs
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    tiles: [] as TileInstance[],
    selectedTile: null as TileInstance | null,
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    isDestroyed: false,
    startTime: Date.now(),
    pairsCleared: 0,
    // Orbit camera controls
    camOrbit: {
      theta: Math.PI * 0.25, // angle around Y
      phi: Math.PI * 0.32,   // elevation
      radius: 24,
      target: new THREE.Vector3(0, 0.5, 0),
    },
    touchDrag: {
      isDragging: false,
      startX: 0,
      startY: 0,
      hasMoved: false,
    },
  });

  // Hero Card Sprite Badge
  useEffect(() => {
    const canvas = heroBadgeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, cardId, 0, 0, 48, 48);
  }, [cardId]);

  // Timer Tick
  useEffect(() => {
    if (gameWon || gameOver || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          const result = calculateAndDepositMissionReward({
            gameId: 'poki_shenzhen_mahjong',
            gameTitle: 'Shenzhen Mahjong 3D',
            isVictory: false,
            score: Math.max(10, gameRef.current.pairsCleared * 10),
            maxTargetScore: 160,
            durationSeconds: 150,
          });
          setRewardResult(result);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Texture Generator for Mahjong Face
  const createTileFaceTexture = (def: TileDefinition): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 340;
    const ctx = canvas.getContext('2d')!;

    // Ivory Tile Face Background
    ctx.fillStyle = '#faf8f2';
    ctx.fillRect(0, 0, 256, 340);

    // Inner Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 232, 316);

    // Golden Corner Accents
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 216, 300);

    // Main Symbol
    ctx.fillStyle = def.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (def.symbol === '□') {
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 14;
      ctx.strokeRect(60, 80, 136, 160);
    } else {
      ctx.font = 'bold 96px "JetBrains Mono", "Songti SC", "SimSun", serif';
      ctx.fillText(def.symbol, 128, 150);
    }

    // Sub Title / Romanization
    ctx.fillStyle = '#665544';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(def.name, 128, 255);

    ctx.fillStyle = '#998877';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(def.subSymbol, 128, 285);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    return texture;
  };

  // Check if tile is free (no tile on top, and free on either left or right)
  const isTileFree = (tile: TileInstance, allTiles: TileInstance[]): boolean => {
    if (tile.isCleared) return false;

    // Check layer above
    const higherTiles = allTiles.filter(
      (t) => !t.isCleared && t.layer > tile.layer && Math.abs(t.gridX - tile.gridX) < 1.3 && Math.abs(t.gridZ - tile.gridZ) < 1.3
    );
    if (higherTiles.length > 0) return false;

    // Check same layer left & right
    let blockedLeft = false;
    let blockedRight = false;

    for (const t of allTiles) {
      if (t.isCleared || t.id === tile.id || t.layer !== tile.layer) continue;
      if (Math.abs(t.gridZ - tile.gridZ) < 0.7) {
        if (t.gridX < tile.gridX && Math.abs(t.gridX - tile.gridX) < 1.5) {
          blockedLeft = true;
        }
        if (t.gridX > tile.gridX && Math.abs(t.gridX - tile.gridX) < 1.5) {
          blockedRight = true;
        }
      }
    }

    return !blockedLeft || !blockedRight;
  };

  // Main Three.js Setup & Animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const game = gameRef.current;
    game.isDestroyed = false;
    game.pairsCleared = 0;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    game.scene = scene;
    scene.background = new THREE.Color(0x14100c);
    scene.fog = new THREE.FogExp2(0x14100c, 0.02);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    game.camera = camera;

    // Position camera using orbit coordinates
    const updateCameraPos = () => {
      const o = game.camOrbit;
      const x = o.radius * Math.sin(o.phi) * Math.sin(o.theta);
      const y = o.radius * Math.cos(o.phi);
      const z = o.radius * Math.sin(o.phi) * Math.cos(o.theta);
      camera.position.set(x, y, z);
      camera.lookAt(o.target);
    };
    updateCameraPos();

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    game.renderer = renderer;

    // 3. Lighting (Warm Oriental Table Lamp)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.8);
    scene.add(ambientLight);

    const topLamp = new THREE.PointLight(0xffeedd, 1.8, 40);
    topLamp.position.set(0, 16, 0);
    topLamp.castShadow = true;
    topLamp.shadow.mapSize.width = 1024;
    topLamp.shadow.mapSize.height = 1024;
    scene.add(topLamp);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 0.8);
    rimLight.position.set(-10, 15, -15);
    scene.add(rimLight);

    // 4. Mahogany Wood Table
    const tableGeo = new THREE.BoxGeometry(26, 1.2, 20);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x3d1c06,
      roughness: 0.4,
      metalness: 0.2,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.y = -0.6;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Green Felt Inset Pad
    const feltGeo = new THREE.PlaneGeometry(22, 16);
    const feltMat = new THREE.MeshStandardMaterial({
      color: 0x1b4329,
      roughness: 0.8,
      metalness: 0.05,
    });
    const feltMesh = new THREE.Mesh(feltGeo, feltMat);
    feltMesh.rotation.x = -Math.PI / 2;
    feltMesh.position.y = 0.01;
    feltMesh.receiveShadow = true;
    scene.add(feltMesh);

    // Golden Edge Trim
    const trimGeo = new THREE.BoxGeometry(22.4, 0.1, 16.4);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.y = 0.02;
    scene.add(trimMesh);

    // 5. Generate 32 Mahjong Tiles (16 pairs)
    // 8 types * 4 cards = 32 tiles
    const tileDeck: TileDefinition[] = [];
    TILE_DEFS.forEach((def) => {
      for (let i = 0; i < 4; i++) {
        tileDeck.push(def);
      }
    });

    // Shuffle Deck
    for (let i = tileDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileDeck[i], tileDeck[j]] = [tileDeck[j], tileDeck[i]];
    }

    // Pyramid Layout Layout Slot Definitions (32 slots)
    // Tile dimensions: Width 1.4, Thickness 0.6, Height 1.9
    interface Slot {
      gx: number;
      gz: number;
      layer: number;
    }
    const slots: Slot[] = [];

    // Layer 0 (Bottom): 4 rows x 6 cols = 24 tiles
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        slots.push({
          gx: (c - 2.5) * 1.55,
          gz: (r - 1.5) * 2.05,
          layer: 0,
        });
      }
    }

    // Layer 1 (Middle): 2 rows x 3 cols = 6 tiles
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        slots.push({
          gx: (c - 1) * 1.55,
          gz: (r - 0.5) * 2.05,
          layer: 1,
        });
      }
    }

    // Layer 2 (Top Pyramid Peak): 1 row x 2 cols = 2 tiles
    slots.push({ gx: -0.77, gz: 0, layer: 2 });
    slots.push({ gx: 0.77, gz: 0, layer: 2 });

    const tileGeo = new THREE.BoxGeometry(1.4, 0.55, 1.9);
    const jadeMaterial = new THREE.MeshStandardMaterial({
      color: 0x054428,
      roughness: 0.2,
      metalness: 0.3,
    });
    const ivorySideMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f2e8,
      roughness: 0.3,
      metalness: 0.1,
    });

    game.tiles = [];

    slots.forEach((slot, idx) => {
      const def = tileDeck[idx];
      const faceTex = createTileFaceTexture(def);
      const faceMat = new THREE.MeshStandardMaterial({
        map: faceTex,
        roughness: 0.25,
        metalness: 0.1,
      });

      // Box materials: [right, left, top(+Y face), bottom(-Y jade), front, back]
      const mats = [
        ivorySideMaterial,
        ivorySideMaterial,
        faceMat,
        jadeMaterial,
        ivorySideMaterial,
        ivorySideMaterial,
      ];

      const tMesh = new THREE.Mesh(tileGeo, mats);
      tMesh.castShadow = true;
      tMesh.receiveShadow = true;

      const posX = slot.gx;
      const posY = 0.28 + slot.layer * 0.58;
      const posZ = slot.gz;

      tMesh.position.set(posX, posY, posZ);
      scene.add(tMesh);

      // Store in game state
      game.tiles.push({
        id: idx,
        type: def.type,
        name: def.name,
        mesh: tMesh,
        origPos: new THREE.Vector3(posX, posY, posZ),
        targetPos: new THREE.Vector3(posX, posY, posZ),
        targetRot: new THREE.Euler(0, 0, 0),
        layer: slot.layer,
        gridX: slot.gx,
        gridZ: slot.gz,
        isCleared: false,
        isSelected: false,
        isHinted: false,
      });
    });

    // 6. Particle Explosion Helper
    const spawnGoldSparks = (pos: THREE.Vector3, count = 18) => {
      for (let i = 0; i < count; i++) {
        const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const pMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.4 ? 0xffd700 : 0xff3366,
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        const v = new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 3,
          (Math.random() - 0.5) * 8
        );
        game.particles.push({ mesh: pMesh, vel: v, life: 0.7 });
      }
    };

    // 7. Raycaster for Tile Tapping
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleTileSelection = (clickedTile: TileInstance) => {
      // Check if tile is free
      const free = isTileFree(clickedTile, game.tiles);
      if (!free) {
        // Blocked tile: shake feedback
        if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
        clickedTile.mesh.position.x += 0.15;
        setTimeout(() => {
          clickedTile.mesh.position.copy(clickedTile.origPos);
        }, 120);
        return;
      }

      // If clicked tile is already selected, deselect it
      if (clickedTile.isSelected) {
        clickedTile.isSelected = false;
        clickedTile.targetPos.copy(clickedTile.origPos);
        game.selectedTile = null;
        if (navigator.vibrate) navigator.vibrate(10);
        return;
      }

      // Haptic on select
      if (navigator.vibrate) navigator.vibrate(20);

      // If no tile currently selected: select this one
      if (!game.selectedTile) {
        clickedTile.isSelected = true;
        clickedTile.targetPos.y = clickedTile.origPos.y + 0.4;
        game.selectedTile = clickedTile;
      } else {
        // Second tile selected!
        const firstTile = game.selectedTile;

        if (firstTile.type === clickedTile.type && firstTile.id !== clickedTile.id) {
          // MATCH FOUND!
          firstTile.isSelected = false;
          clickedTile.isSelected = false;
          firstTile.isCleared = true;
          clickedTile.isCleared = true;
          game.selectedTile = null;

          if (navigator.vibrate) navigator.vibrate([30, 40, 50]);

          // Move towards center and disappear
          const centerPos = firstTile.mesh.position
            .clone()
            .add(clickedTile.mesh.position)
            .multiplyScalar(0.5);
          centerPos.y += 0.8;

          firstTile.targetPos.copy(centerPos);
          clickedTile.targetPos.copy(centerPos);

          setTimeout(() => {
            spawnGoldSparks(centerPos, 22);
            scene.remove(firstTile.mesh);
            scene.remove(clickedTile.mesh);

            game.pairsCleared += 1;
            setPairsCleared(game.pairsCleared);

            // Check Win condition
            if (game.pairsCleared >= totalPairs) {
              setGameWon(true);
              const result = calculateAndDepositMissionReward({
                gameId: 'poki_shenzhen_mahjong',
                gameTitle: 'Shenzhen Mahjong 3D',
                isVictory: true,
                score: 160,
                maxTargetScore: 160,
                durationSeconds: Math.floor((Date.now() - game.startTime) / 1000),
              });
              setRewardResult(result);
            }
          }, 320);
        } else {
          // MISMATCH: Shake both and deselect
          if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
          firstTile.isSelected = false;
          clickedTile.isSelected = false;
          firstTile.targetPos.copy(firstTile.origPos);
          clickedTile.targetPos.copy(clickedTile.origPos);
          game.selectedTile = null;
        }
      }
    };

    // 8. Touch & Pointer Handling
    const domElem = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      game.touchDrag.isDragging = true;
      game.touchDrag.startX = e.clientX;
      game.touchDrag.startY = e.clientY;
      game.touchDrag.hasMoved = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!game.touchDrag.isDragging) return;
      const dx = e.clientX - game.touchDrag.startX;
      const dy = e.clientY - game.touchDrag.startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        game.touchDrag.hasMoved = true;
      }

      // Orbit camera rotation
      game.camOrbit.theta -= dx * 0.006;
      game.camOrbit.phi = Math.max(0.15, Math.min(Math.PI * 0.46, game.camOrbit.phi - dy * 0.006));
      updateCameraPos();

      game.touchDrag.startX = e.clientX;
      game.touchDrag.startY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      game.touchDrag.isDragging = false;

      // If it was a tap without dragging, raycast to find tile
      if (!game.touchDrag.hasMoved) {
        const rect = domElem.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const meshes = game.tiles.filter((t) => !t.isCleared).map((t) => t.mesh);
        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object;
          const matchedTile = game.tiles.find((t) => t.mesh === hitMesh);
          if (matchedTile) {
            handleTileSelection(matchedTile);
          }
        }
      }
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointermove', onPointerMove);
    domElem.addEventListener('pointerup', onPointerUp);

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

      // Tile smooth movement & highlight
      game.tiles.forEach((t) => {
        if (t.isCleared) return;
        t.mesh.position.lerp(t.targetPos, delta * 12);

        // Selection lift & gentle bob
        if (t.isSelected) {
          t.mesh.position.y = t.origPos.y + 0.45 + Math.sin(time * 0.008) * 0.05;
        }
      });

      // Update particle sparks
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.mesh.position.addScaledVector(p.vel, delta);
        p.vel.y -= 12 * delta;
        p.life -= delta;
        p.mesh.scale.multiplyScalar(0.95);
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
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointermove', onPointerMove);
      domElem.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Hint Feature: Find a pair of free tiles and pulse them
  const handleUseHint = () => {
    if (hintsLeft <= 0) return;
    const game = gameRef.current;
    const activeTiles = game.tiles.filter((t) => !t.isCleared);
    const freeTiles = activeTiles.filter((t) => isTileFree(t, game.tiles));

    // Find matching pair
    let matchPair: [TileInstance, TileInstance] | null = null;
    for (let i = 0; i < freeTiles.length; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        if (freeTiles[i].type === freeTiles[j].type) {
          matchPair = [freeTiles[i], freeTiles[j]];
          break;
        }
      }
      if (matchPair) break;
    }

    if (matchPair) {
      setHintsLeft((prev) => prev - 1);
      const [t1, t2] = matchPair;
      t1.targetPos.y = t1.origPos.y + 0.35;
      t2.targetPos.y = t2.origPos.y + 0.35;

      if (navigator.vibrate) navigator.vibrate([25, 40, 25]);

      setTimeout(() => {
        if (!t1.isSelected && !t1.isCleared) t1.targetPos.copy(t1.origPos);
        if (!t2.isSelected && !t2.isCleared) t2.targetPos.copy(t2.origPos);
      }, 2500);
    }
  };

  // Shuffle Feature: Swap remaining types among uncleared tiles
  const handleShuffle = () => {
    if (shufflesLeft <= 0) return;
    const game = gameRef.current;
    const activeTiles = game.tiles.filter((t) => !t.isCleared);
    if (activeTiles.length < 2) return;

    setShufflesLeft((prev) => prev - 1);
    if (navigator.vibrate) navigator.vibrate(35);

    // Extract active types
    const types = activeTiles.map((t) => ({ type: t.type, name: t.name }));
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    // Reassign and refresh textures
    activeTiles.forEach((tile, idx) => {
      tile.type = types[idx].type;
      tile.name = types[idx].name;
      const def = TILE_DEFS.find((d) => d.type === tile.type);
      if (def) {
        const newTex = createTileFaceTexture(def);
        const mats = tile.mesh.material as THREE.Material[];
        if (Array.isArray(mats) && mats[2]) {
          (mats[2] as THREE.MeshStandardMaterial).map = newTex;
          (mats[2] as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      }
      // Shuffle hop animation
      tile.targetPos.y = tile.origPos.y + 0.6;
      setTimeout(() => {
        tile.targetPos.copy(tile.origPos);
      }, 200);
    });
  };

  // Reset Camera View
  const handleResetCamera = () => {
    const game = gameRef.current;
    game.camOrbit.theta = Math.PI * 0.25;
    game.camOrbit.phi = Math.PI * 0.32;
    if (game.camera) {
      const o = game.camOrbit;
      const x = o.radius * Math.sin(o.phi) * Math.sin(o.theta);
      const y = o.radius * Math.cos(o.phi);
      const z = o.radius * Math.sin(o.phi) * Math.cos(o.theta);
      game.camera.position.set(x, y, z);
      game.camera.lookAt(o.target);
    }
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const hudUniqueId = useId();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#14100c] font-mono text-white"
    >
      {/* Minimalist Top HUD */}
      <MinimalistMissionHUD
        key={hudUniqueId}
        title="SHENZHEN MAHJONG 3D"
        progress={`${pairsCleared} / ${totalPairs} PAIRS`}
        onGiveUp={() => {
          const res = calculateAndDepositMissionReward({
            gameId: 'poki_shenzhen_mahjong',
            gameTitle: 'Shenzhen Mahjong 3D',
            isVictory: false,
            score: Math.max(10, pairsCleared * 10),
            maxTargetScore: 160,
            durationSeconds: 150 - timeLeft,
          });
          setRewardResult(res);
        }}
      />

      {/* Hero Badge & Progress Info */}
      <div className="absolute top-14 left-3 z-20 flex items-center gap-2 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded-sm border border-amber-500/30">
        <canvas
          ref={heroBadgeCanvasRef}
          width={48}
          height={48}
          className="w-8 h-8 rounded border border-amber-400/50 bg-black/40"
        />
        <div className="text-xs">
          <div className="text-amber-400 font-bold">SHENZHEN MASTER</div>
          <div className="text-[10px] text-gray-300">
            남은 패: <span className="text-yellow-400 font-bold">{(totalPairs - pairsCleared) * 2}개</span>
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="absolute top-14 right-3 z-20 pointer-events-none bg-black/60 px-3 py-1.5 rounded-sm border border-amber-500/30 text-right">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider">TIME LEFT</div>
        <div className={`text-base font-black tracking-wider ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Touch Guide Indicator */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center bg-black/40 px-3 py-1 rounded border border-white/10 text-[10px] text-gray-300">
        👆 타일 터치 선택 | 🔄 화면 드래그로 3D 시점 회전
      </div>

      {/* Mobile Pure Touch Action Buttons */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-auto">
        {/* Hint Button */}
        <button
          onClick={handleUseHint}
          disabled={hintsLeft <= 0}
          className="px-4 py-2.5 rounded-sm bg-amber-600 active:bg-amber-500 disabled:bg-gray-800 disabled:text-gray-500 border border-amber-400 font-bold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <span>💡 힌트</span>
          <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-yellow-300 font-bold">
            {hintsLeft}
          </span>
        </button>

        {/* Shuffle Button */}
        <button
          onClick={handleShuffle}
          disabled={shufflesLeft <= 0}
          className="px-4 py-2.5 rounded-sm bg-emerald-700 active:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-500 border border-emerald-400 font-bold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <span>🔀 셔플</span>
          <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-bold">
            {shufflesLeft}
          </span>
        </button>

        {/* Reset Camera View Button */}
        <button
          onClick={handleResetCamera}
          className="px-3.5 py-2.5 rounded-sm bg-gray-900 active:bg-gray-800 border border-gray-600 font-bold text-xs text-gray-200 shadow-lg active:scale-95 transition-transform"
        >
          🔄 시점 리셋
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full bg-stone-900 border border-amber-500/60 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-xl font-black text-amber-400 tracking-wider mb-2">
              SHENZHEN MAHJONG 3D
            </div>
            <div className="text-xs text-gray-300 space-y-2 mb-5 leading-relaxed text-left">
              <p>• 🀄 <b className="text-white">마작 솔리테어</b>: 동일한 문양의 타일 2개를 찾아 제거하세요.</p>
              <p>• 🔓 <b className="text-amber-300">자유 타일</b>: 좌우 중 한쪽이 비어있고 위에 얹힌 패가 없어야 선택 가능합니다.</p>
              <p>• 🔄 <b className="text-cyan-400">3D 시점 드래그</b>: 화면 빈 곳을 드래그해 테이블을 360° 회전하여 숨은 패를 찾으세요.</p>
              <p>• 💡 <b className="text-yellow-400">보조 도구</b>: 막힐 땐 하단의 [힌트] 및 [셔플]을 활용하세요.</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-amber-600 active:bg-amber-500 text-white font-bold text-sm tracking-wider rounded-sm border border-amber-400 shadow-md"
            >
              [ 게임 시작 ]
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

      {/* Time Over / Defeat Modal */}
      {gameOver && rewardResult && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-4">
          <div className="max-w-sm w-full bg-stone-950 border border-red-500 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-2xl font-black text-red-500 mb-1">TIME OVER</div>
            <div className="text-xs text-gray-400 mb-4">제한 시간이 초과되었습니다.</div>
            <div className="bg-black/60 p-3 rounded border border-gray-800 text-xs text-left mb-4 space-y-1">
              <div>완료한 쌍: <span className="text-amber-400 font-bold">{pairsCleared} / {totalPairs} PAIRS</span></div>
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

export default PokiShenzhenMahjongGame;

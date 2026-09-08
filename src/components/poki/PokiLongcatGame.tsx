import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { RotateCcw, Undo2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface PokiLongcatGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

interface Pos {
  r: number;
  c: number;
}

interface LevelConfig {
  rows: number;
  cols: number;
  start: Pos;
  walls: Pos[];
  name: string;
}

const LEVELS: LevelConfig[] = [
  {
    name: '스테이지 1: 기초 훈련',
    rows: 5,
    cols: 5,
    start: { r: 0, c: 0 },
    walls: [{ r: 1, c: 1 }, { r: 3, c: 3 }],
  },
  {
    name: '스테이지 2: 기역자 꺾기',
    rows: 5,
    cols: 6,
    start: { r: 2, c: 0 },
    walls: [{ r: 0, c: 3 }, { r: 4, c: 2 }, { r: 2, c: 4 }],
  },
  {
    name: '스테이지 3: 마스터의 미로',
    rows: 6,
    cols: 6,
    start: { r: 0, c: 0 },
    walls: [{ r: 1, c: 2 }, { r: 2, c: 4 }, { r: 4, c: 1 }, { r: 3, c: 3 }],
  },
];

export const PokiLongcatGame: React.FC<PokiLongcatGameProps> = ({
  onBack,
  onExit,
  cardId = 22,
  deck,
  lowSpecMode = false,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => {});
  const playerHeroId = deck?.[0]?.id || cardId || 22;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI State
  const [levelIdx, setLevelIdx] = useState(0);
  const [filledPct, setFilledPct] = useState(0);
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [stageCleared, setStageCleared] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  // Time tracking
  const startTimeRef = useRef<number>(Date.now());

  // Game Puzzle Logic State Ref
  const puzzleStateRef = useRef<{
    levelIdx: number;
    rows: number;
    cols: number;
    start: Pos;
    walls: Pos[];
    body: Pos[]; // order from start [0] to head [last]
    history: Pos[][]; // snapshot of body states for undo
    totalEmptyCells: number;
    isClearing: boolean;
    isSliding: boolean;
  }>({
    levelIdx: 0,
    rows: 5,
    cols: 5,
    start: { r: 0, c: 0 },
    walls: [],
    body: [{ r: 0, c: 0 }],
    history: [],
    totalEmptyCells: 23,
    isClearing: false,
    isSliding: false,
  });

  // Three.js Scene Refs
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    tileMeshes: Map<string, THREE.Mesh>;
    wallMeshes: THREE.Mesh[];
    catHeadGroup: THREE.Group;
    catBodyMeshes: THREE.Mesh[];
    catTailMesh: THREE.Mesh | null;
    particles: THREE.Points | null;
    particleVelocities: THREE.Vector3[];
    boardGroup: THREE.Group;
    animFrameId: number;
  } | null>(null);

  // Touch Swipe tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Convert grid row/col to 3D world coords (X, Z) centered at (0, 0)
  const gridToWorld = useCallback((r: number, c: number, rows: number, cols: number) => {
    const spacing = 1.05;
    const x = (c - (cols - 1) / 2) * spacing;
    const z = (r - (rows - 1) / 2) * spacing;
    return { x, z };
  }, []);

  // Update Three.js visuals when body changes
  const update3DVisuals = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;

    const state = puzzleStateRef.current;
    const { rows, cols, body, walls } = state;

    // 1. Update Tile Highlights
    const bodySet = new Set(body.map((p) => `${p.r},${p.c}`));
    three.tileMeshes.forEach((mesh, key) => {
      const isFilled = bodySet.has(key);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isFilled) {
        mat.color.setHex(0xfbbf24); // Warm Golden Glow
        mat.roughness = 0.2;
        mesh.position.y = 0.08; // slight elevation
      } else {
        mat.color.setHex(0xf1f5f9); // Crisp Cream Slate
        mat.roughness = 0.5;
        mesh.position.y = 0;
      }
    });

    // 2. Remove old body segment meshes
    three.catBodyMeshes.forEach((m) => {
      three.boardGroup.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    three.catBodyMeshes = [];

    // 3. Create new body segment meshes (from index 0 up to second-to-last)
    const bodyGeo = new THREE.BoxGeometry(0.78, 0.55, 0.78);
    for (let i = 0; i < body.length - 1; i++) {
      const pos = body[i];
      const { x, z } = gridToWorld(pos.r, pos.c, rows, cols);

      // Color gradation from warm orange to bright yellow
      const ratio = i / Math.max(1, body.length - 1);
      const color = new THREE.Color().setHSL(0.08 + ratio * 0.05, 0.95, 0.55);

      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.1,
      });

      const segmentMesh = new THREE.Mesh(bodyGeo.clone(), bodyMat);
      segmentMesh.position.set(x, 0.35, z);
      segmentMesh.castShadow = !lowSpecMode;
      segmentMesh.receiveShadow = !lowSpecMode;

      three.boardGroup.add(segmentMesh);
      three.catBodyMeshes.push(segmentMesh);
    }

    // 4. Update Cat Head Position
    const headPos = body[body.length - 1];
    if (headPos) {
      const { x, z } = gridToWorld(headPos.r, headPos.c, rows, cols);
      three.catHeadGroup.position.set(x, 0.45, z);

      // Rotate head towards movement direction
      if (body.length >= 2) {
        const prevPos = body[body.length - 2];
        const dr = headPos.r - prevPos.r;
        const dc = headPos.c - prevPos.c;
        if (dc > 0) three.catHeadGroup.rotation.y = Math.PI / 2; // Right (+X)
        else if (dc < 0) three.catHeadGroup.rotation.y = -Math.PI / 2; // Left (-X)
        else if (dr > 0) three.catHeadGroup.rotation.y = 0; // Down (+Z)
        else if (dr < 0) three.catHeadGroup.rotation.y = Math.PI; // Up (-Z)
      }
    }

    // 5. Update Tail position at starting segment
    const startPos = body[0];
    if (startPos && three.catTailMesh) {
      const { x, z } = gridToWorld(startPos.r, startPos.c, rows, cols);
      three.catTailMesh.position.set(x, 0.3, z);
    }
  }, [gridToWorld, lowSpecMode]);

  // Trigger win fireworks particle burst
  const triggerClearCelebration = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 100, 50, 150]);
    }

    // Spawn 50 celebratory star particles
    const pCount = 50;
    const posArr = new Float32Array(pCount * 3);
    const colArr = new Float32Array(pCount * 3);
    const velocities: THREE.Vector3[] = [];

    const headPos = three.catHeadGroup.position;
    for (let i = 0; i < pCount; i++) {
      posArr[i * 3] = headPos.x + (Math.random() - 0.5) * 0.5;
      posArr[i * 3 + 1] = headPos.y + 0.5;
      posArr[i * 3 + 2] = headPos.z + (Math.random() - 0.5) * 0.5;

      const color = new THREE.Color().setHSL(Math.random(), 0.9, 0.6);
      colArr[i * 3] = color.r;
      colArr[i * 3 + 1] = color.g;
      colArr[i * 3 + 2] = color.b;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 3,
          (Math.random() - 0.5) * 6
        )
      );
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    if (three.particles) {
      three.scene.remove(three.particles);
      three.particles.geometry.dispose();
    }

    three.particles = new THREE.Points(pGeo, pMat);
    three.particleVelocities = velocities;
    three.scene.add(three.particles);
  }, []);

  // Initialize a puzzle level
  const initLevel = useCallback(
    (lvlIdx: number) => {
      const lvl = LEVELS[lvlIdx];
      const totalCells = lvl.rows * lvl.cols;
      const emptyCount = totalCells - lvl.walls.length;

      puzzleStateRef.current = {
        levelIdx: lvlIdx,
        rows: lvl.rows,
        cols: lvl.cols,
        start: { ...lvl.start },
        walls: lvl.walls.map((w) => ({ ...w })),
        body: [{ ...lvl.start }],
        history: [],
        totalEmptyCells: emptyCount,
        isClearing: false,
        isSliding: false,
      };

      setLevelIdx(lvlIdx);
      setFilledPct(Math.round((1 / emptyCount) * 100));
      setStageCleared(false);
      setCanUndo(false);

      // Rebuild 3D board
      const three = threeRef.current;
      if (!three) return;

      // Clear existing board meshes
      while (three.boardGroup.children.length > 0) {
        const obj = three.boardGroup.children[0];
        three.boardGroup.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
      three.tileMeshes.clear();
      three.wallMeshes = [];
      three.catBodyMeshes = [];

      // Recreate grid floor & tiles
      const tileGeo = new THREE.BoxGeometry(0.96, 0.16, 0.96);
      for (let r = 0; r < lvl.rows; r++) {
        for (let c = 0; c < lvl.cols; c++) {
          const { x, z } = gridToWorld(r, c, lvl.rows, lvl.cols);
          const isWall = lvl.walls.some((w) => w.r === r && w.c === c);

          if (isWall) {
            // 3D Wall Obstacle Block
            const wallGeo = new THREE.BoxGeometry(0.92, 0.75, 0.92);
            const wallMat = new THREE.MeshStandardMaterial({
              color: 0x334155, // Slate navy wall
              roughness: 0.6,
              metalness: 0.2,
            });
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);
            wallMesh.position.set(x, 0.45, z);
            wallMesh.castShadow = !lowSpecMode;
            wallMesh.receiveShadow = !lowSpecMode;
            three.boardGroup.add(wallMesh);
            three.wallMeshes.push(wallMesh);

            // Wall Top Cap Accent
            const capGeo = new THREE.BoxGeometry(0.75, 0.08, 0.75);
            const capMat = new THREE.MeshStandardMaterial({
              color: 0x64748b,
              roughness: 0.4,
            });
            const capMesh = new THREE.Mesh(capGeo, capMat);
            capMesh.position.set(x, 0.85, z);
            three.boardGroup.add(capMesh);
          } else {
            // Interactive Walkable Tile
            const tileMat = new THREE.MeshStandardMaterial({
              color: 0xf1f5f9,
              roughness: 0.5,
              metalness: 0.05,
            });
            const tileMesh = new THREE.Mesh(tileGeo.clone(), tileMat);
            tileMesh.position.set(x, 0, z);
            tileMesh.receiveShadow = !lowSpecMode;
            three.boardGroup.add(tileMesh);
            three.tileMeshes.set(`${r},${c}`, tileMesh);
          }
        }
      }

      // Re-add Cat Head & Tail to boardGroup
      three.boardGroup.add(three.catHeadGroup);

      // Tail mesh
      if (!three.catTailMesh) {
        const tailGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.45, 8);
        const tailMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.4,
        });
        const tailMesh = new THREE.Mesh(tailGeo, tailMat);
        tailMesh.rotation.z = Math.PI / 4;
        three.catTailMesh = tailMesh;
      }
      three.boardGroup.add(three.catTailMesh);

      // Camera adjust for grid dimensions
      const maxDim = Math.max(lvl.rows, lvl.cols);
      three.camera.position.set(0, maxDim * 1.8 + 2.5, maxDim * 1.5 + 2.0);
      three.camera.lookAt(0, 0, 0);

      update3DVisuals();
    },
    [gridToWorld, lowSpecMode, update3DVisuals]
  );

  // Slide Cat in direction (dr, dc)
  const moveCat = useCallback(
    (dr: number, dc: number) => {
      const state = puzzleStateRef.current;
      if (state.isClearing || state.isSliding) return;
      if (dr === 0 && dc === 0) return;

      const currentHead = state.body[state.body.length - 1];
      let nextR = currentHead.r + dr;
      let nextC = currentHead.c + dc;

      // Check if immediate first step is blocked
      const isOutOfBounds = (r: number, c: number) =>
        r < 0 || r >= state.rows || c < 0 || c >= state.cols;
      const isWall = (r: number, c: number) =>
        state.walls.some((w) => w.r === r && w.c === c);
      const isBody = (r: number, c: number) =>
        state.body.some((p) => p.r === r && p.c === c);

      if (isOutOfBounds(nextR, nextC) || isWall(nextR, nextC) || isBody(nextR, nextC)) {
        // Can't move in this direction
        return;
      }

      // Save history for undo
      state.history.push([...state.body.map((p) => ({ ...p }))]);
      setCanUndo(true);

      if (navigator.vibrate) {
        navigator.vibrate(25);
      }

      // Slide continuously until blocked
      const newSegments: Pos[] = [];
      let curR = currentHead.r;
      let curC = currentHead.c;

      while (true) {
        const testR = curR + dr;
        const testC = curC + dc;

        if (
          isOutOfBounds(testR, testC) ||
          isWall(testR, testC) ||
          isBody(testR, testC) ||
          newSegments.some((p) => p.r === testR && p.c === testC)
        ) {
          break;
        }

        curR = testR;
        curC = testC;
        newSegments.push({ r: curR, c: curC });
      }

      if (newSegments.length > 0) {
        state.body = [...state.body, ...newSegments];
        const newPct = Math.min(
          100,
          Math.round((state.body.length / state.totalEmptyCells) * 100)
        );
        setFilledPct(newPct);
        setScore((prev) => prev + newSegments.length * 20);

        update3DVisuals();

        // Check level win condition
        if (state.body.length >= state.totalEmptyCells) {
          state.isClearing = true;
          setStageCleared(true);
          triggerClearCelebration();

          setTimeout(() => {
            if (state.levelIdx + 1 < LEVELS.length) {
              initLevel(state.levelIdx + 1);
            } else {
              // Complete Victory of all 3 levels
              const duration = Math.max(
                10,
                Math.floor((Date.now() - startTimeRef.current) / 1000)
              );
              const receipt = calculateAndDepositMissionReward({
                gameId: 'poki_longcat',
                gameTitle: 'Longcat 3D',
                durationSeconds: duration,
                score: 1000,
                maxTargetScore: 1000,
                isVictory: true,
              });
              setRewardResult(receipt);
              setGameWon(true);
            }
          }, 1600);
        }
      }
    },
    [initLevel, triggerClearCelebration, update3DVisuals]
  );

  // Undo previous step
  const handleUndo = useCallback(() => {
    const state = puzzleStateRef.current;
    if (state.isClearing || state.history.length === 0) return;

    const prevBody = state.history.pop();
    if (prevBody) {
      state.body = prevBody;
      const newPct = Math.round((state.body.length / state.totalEmptyCells) * 100);
      setFilledPct(newPct);
      setCanUndo(state.history.length > 0);
      update3DVisuals();

      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    }
  }, [update3DVisuals]);

  // Reset current level
  const handleReset = useCallback(() => {
    const state = puzzleStateRef.current;
    if (state.isClearing) return;
    initLevel(state.levelIdx);
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, [initLevel]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        moveCat(-1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        moveCat(1, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveCat(0, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveCat(0, 1);
      } else if (e.key === 'z' || e.key === 'Z') {
        handleUndo();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, handleUndo, moveCat]);

  // Touch Swipe Handlers for Full Mobile Screen
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    touchStartRef.current = null;

    if (Math.max(absX, absY) < 25) return; // ignore minor taps

    if (absX > absY) {
      if (dx > 0) moveCat(0, 1); // Right
      else moveCat(0, -1); // Left
    } else {
      if (dy > 0) moveCat(1, 0); // Down
      else moveCat(-1, 0); // Up
    }
  };

  // Setup Three.js Scene and Render Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5); // Warm cream aesthetic

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 12, 10);
    camera.lookAt(0, 0, 0);

    // 3. Renderer setup
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

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.25);
    dirLight.position.set(8, 16, 10);
    if (!lowSpecMode) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.bias = -0.001;
    }
    scene.add(dirLight);

    // Board Group
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // 5. Construct Cute 3D Longcat Head Group
    const catHeadGroup = new THREE.Group();

    // Main head rounded cube
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Bright Orange Cat
      roughness: 0.3,
      metalness: 0.1,
    });
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.68, 0.82), headMat);
    catHeadGroup.add(headMesh);

    // Cute Cat Ears
    const earGeo = new THREE.ConeGeometry(0.18, 0.32, 4);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 });
    const earInnerMat = new THREE.MeshStandardMaterial({ color: 0xfda4af });

    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.26, 0.45, 0.1);
    leftEar.rotation.z = 0.18;
    catHeadGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.26, 0.45, 0.1);
    rightEar.rotation.z = -0.18;
    catHeadGroup.add(rightEar);

    // Cat Cartoon Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-0.2, 0.12, 0.42);
    const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    leftPupil.position.set(-0.2, 0.12, 0.48);
    catHeadGroup.add(leftEyeWhite);
    catHeadGroup.add(leftPupil);

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.2, 0.12, 0.42);
    const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    rightPupil.position.set(0.2, 0.12, 0.48);
    catHeadGroup.add(rightEyeWhite);
    catHeadGroup.add(rightPupil);

    // Cute Pink Nose & Snout
    const noseGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const noseMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.02, 0.44);
    catHeadGroup.add(nose);

    // No.22 Hero Badge sprite on top
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
    badgeSprite.scale.set(0.5, 0.5, 0.5);
    badgeSprite.position.set(0, 0.72, 0);
    catHeadGroup.add(badgeSprite);

    // Save Three Ref
    threeRef.current = {
      scene,
      camera,
      renderer,
      tileMeshes: new Map(),
      wallMeshes: [],
      catHeadGroup,
      catBodyMeshes: [],
      catTailMesh: null,
      particles: null,
      particleVelocities: [],
      boardGroup,
      animFrameId: 0,
    };

    // Initialize first level
    initLevel(0);

    // Animation Loop
    let clock = new THREE.Clock();
    const renderLoop = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Cat breathing bobbing
      if (threeRef.current) {
        const { catHeadGroup, catTailMesh, particles, particleVelocities, renderer, scene, camera } =
          threeRef.current;

        catHeadGroup.position.y = 0.45 + Math.sin(elapsed * 4) * 0.04;
        if (catTailMesh) {
          catTailMesh.rotation.z = Math.PI / 4 + Math.sin(elapsed * 5) * 0.15;
        }

        // Particle fireworks animation
        if (particles && particleVelocities.length > 0) {
          const posAttr = particles.geometry.getAttribute(
            'position'
          ) as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < particleVelocities.length; i++) {
            const vel = particleVelocities[i];
            posArr[i * 3] += vel.x * delta;
            posArr[i * 3 + 1] += vel.y * delta;
            posArr[i * 3 + 2] += vel.z * delta;
            vel.y -= 9.8 * delta; // Gravity
          }
          posAttr.needsUpdate = true;
          (particles.material as THREE.PointsMaterial).opacity = Math.max(
            0,
            (particles.material as THREE.PointsMaterial).opacity - delta * 0.5
          );
        }

        renderer.render(scene, camera);
        threeRef.current.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    threeRef.current.animFrameId = requestAnimationFrame(renderLoop);

    // Responsive Resize Listener
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
  }, [initLevel, lowSpecMode, playerHeroId]);

  // Give up / quit handler with standardized reward
  const handleGiveUp = () => {
    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_longcat',
      gameTitle: 'Longcat 3D',
      durationSeconds: duration,
      score: score,
      maxTargetScore: 1000,
      isVictory: false,
    });
    setRewardResult(receipt);
    setGameWon(true);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5] font-mono"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="No.022 Longcat 3D"
        score={score}
        scoreLabel="점수"
        targetLabel="빈칸 채우기"
        targetProgress={`${filledPct}%`}
        onGiveUp={handleGiveUp}
      />

      {/* Stage Badge & Floating Instruction */}
      <div className="absolute top-16 left-0 right-0 pointer-events-none flex flex-col items-center justify-center space-y-1">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1 border border-slate-200 shadow-sm rounded-full text-xs font-bold text-slate-800 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>{LEVELS[levelIdx].name}</span>
          <span className="text-slate-400">|</span>
          <span className="text-orange-600 font-extrabold">{filledPct}%</span>
        </div>
        {stageCleared && (
          <div className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-black animate-bounce flex items-center space-x-1 shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span>퍼펙트 클리어! 다음 스테이지로 이동</span>
          </div>
        )}
      </div>

      {/* Mobile Pure Touch Bottom Controls */}
      <div className="absolute bottom-6 left-0 right-0 px-4 pointer-events-auto flex items-end justify-between max-w-md mx-auto">
        {/* Left Utility: Undo & Reset */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shadow-md active:scale-95 transition-all ${
              canUndo
                ? 'bg-white/95 border-slate-300 text-slate-800'
                : 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="한 수 되돌리기"
          >
            <Undo2 className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">되돌리기</span>
          </button>
          <button
            onClick={handleReset}
            className="w-14 h-14 rounded-2xl bg-white/95 border border-slate-300 text-slate-800 flex flex-col items-center justify-center shadow-md active:scale-95 transition-all"
            title="현재 레벨 리셋"
          >
            <RotateCcw className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] font-bold mt-0.5">다시하기</span>
          </button>
        </div>

        {/* Center/Right: Large 4-Way D-Pad for One-Handed Play */}
        <div className="relative w-36 h-36 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl p-2 flex items-center justify-center">
          {/* UP */}
          <button
            onClick={() => moveCat(-1, 0)}
            className="absolute top-1.5 w-11 h-11 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md active:bg-orange-500 active:scale-90 transition-transform"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          {/* DOWN */}
          <button
            onClick={() => moveCat(1, 0)}
            className="absolute bottom-1.5 w-11 h-11 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md active:bg-orange-500 active:scale-90 transition-transform"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          {/* LEFT */}
          <button
            onClick={() => moveCat(0, -1)}
            className="absolute left-1.5 w-11 h-11 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md active:bg-orange-500 active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {/* RIGHT */}
          <button
            onClick={() => moveCat(0, 1)}
            className="absolute right-1.5 w-11 h-11 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md active:bg-orange-500 active:scale-90 transition-transform"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          {/* Center icon */}
          <div className="w-6 h-6 rounded-full bg-orange-400/20 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-orange-600">🐱</span>
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="롱캣 3D (Longcat 3D)"
          category="3D 공간 채우기 두뇌 퍼즐"
          guideSteps={[
            {
              title: '고양이 늘리기 (Swipe & D-Pad)',
              desc: '상/하/좌/우로 스와이프하거나 D-패드를 누르면 고양이가 벽이나 몸에 부딪힐 때까지 끝까지 쭉 늘어납니다.',
              iconType: 'GESTURES',
            },
            {
              title: '100% 빈칸 채우기 (Goal)',
              desc: '그리드의 모든 빈 타일을 100% 빈틈없이 채우면 스테이지 클리어! 총 3개 스테이지를 모두 해결해 보세요.',
              iconType: 'GOAL',
            },
            {
              title: '실수했을 땐 되돌리기 & 보상',
              desc: '막혔을 때는 [되돌리기]나 [다시하기] 버튼으로 즉시 해결 경로를 다시 찾고, 최대 50 SNS 보상을 획득하세요!',
              iconType: 'REWARDS',
            },
          ]}
          onStart={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardResult}
          onClose={handleExit}
        />
      )}
    </div>
  );
};

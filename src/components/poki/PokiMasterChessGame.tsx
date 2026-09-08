import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { RotateCcw, Undo2, Crown, Sparkles } from 'lucide-react';

interface PokiMasterChessGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

type PieceType = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  mesh?: THREE.Group;
}

type Board = (ChessPiece | null)[][];

interface Pos {
  r: number;
  c: number;
}

export const PokiMasterChessGame: React.FC<PokiMasterChessGameProps> = ({
  onBack,
  onExit,
  cardId = 27,
  deck,
  lowSpecMode = false,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => {});
  const playerHeroId = deck?.[0]?.id || cardId || 27;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI State
  const [captured, setCaptured] = useState(0);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [statusMsg, setStatusMsg] = useState('당신의 차례입니다 (White)');
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [canUndo, setCanUndo] = useState(false);

  // Time & Score tracking
  const startTimeRef = useRef<number>(Date.now());
  const capturedRef = useRef<number>(0);

  // Internal Logic State
  const gameStateRef = useRef<{
    board: Board;
    selected: Pos | null;
    validMoves: Pos[];
    history: { board: Board; captured: number }[];
    turn: PieceColor;
    isAiMoving: boolean;
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
  }>({
    board: [],
    selected: null,
    validMoves: [],
    history: [],
    turn: 'w',
    isAiMoving: false,
    particles: null,
    particleVels: [],
  });

  // Three.js References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    boardGroup: THREE.Group;
    piecesGroup: THREE.Group;
    indicatorsGroup: THREE.Group;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    animFrameId: number;
  } | null>(null);

  // Coordinate conversion: (r, c) -> World (x, z)
  const gridToWorld = useCallback((r: number, c: number) => {
    const spacing = 1.05;
    const x = (c - 3.5) * spacing;
    const z = (r - 3.5) * spacing;
    return { x, z };
  }, []);

  // Compute Valid Chess Moves
  const getValidMoves = useCallback((r: number, c: number, board: Board): Pos[] => {
    const p = board[r][c];
    if (!p) return [];
    const moves: Pos[] = [];

    const addMove = (nr: number, nc: number, onlyCapture = false, onlyEmpty = false) => {
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) return false;
      const target = board[nr][nc];
      if (onlyCapture) {
        if (target && target.color !== p.color) {
          moves.push({ r: nr, c: nc });
        }
        return false;
      }
      if (onlyEmpty) {
        if (!target) {
          moves.push({ r: nr, c: nc });
          return true;
        }
        return false;
      }
      if (!target) {
        moves.push({ r: nr, c: nc });
        return true;
      }
      if (target.color !== p.color) {
        moves.push({ r: nr, c: nc });
      }
      return false; // Path blocked
    };

    if (p.type === 'P') {
      const dir = p.color === 'w' ? -1 : 1;
      if (addMove(r + dir, c, false, true)) {
        if ((p.color === 'w' && r === 6) || (p.color === 'b' && r === 1)) {
          addMove(r + dir * 2, c, false, true);
        }
      }
      addMove(r + dir, c - 1, true);
      addMove(r + dir, c + 1, true);
    } else if (p.type === 'N') {
      const deltas = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      deltas.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if (p.type === 'B' || p.type === 'R' || p.type === 'Q') {
      const dirs: [number, number][] = [];
      if (p.type === 'B' || p.type === 'Q') {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (p.type === 'R' || p.type === 'Q') {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (addMove(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    } else if (p.type === 'K') {
      const deltas = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      deltas.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    }

    return moves;
  }, []);

  // Spawn 3D Capture Sparks
  const spawnCaptureSparks = useCallback((x: number, y: number, z: number) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) navigator.vibrate([40, 20, 60]);

    const count = 35;
    const posArr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      posArr[i * 3] = x + (Math.random() - 0.5) * 0.3;
      posArr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.3;
      posArr[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;

      const col = new THREE.Color().setHSL(0.12 + Math.random() * 0.1, 0.9, 0.6);
      colArr[i * 3] = col.r;
      colArr[i * 3 + 1] = col.g;
      colArr[i * 3 + 2] = col.b;

      vels.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 6
        )
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 1,
    });

    if (gameStateRef.current.particles) {
      three.scene.remove(gameStateRef.current.particles);
      gameStateRef.current.particles.geometry.dispose();
    }

    const pMesh = new THREE.Points(geo, mat);
    gameStateRef.current.particles = pMesh;
    gameStateRef.current.particleVels = vels;
    three.scene.add(pMesh);
  }, []);

  // Finish Game & Deposit Standardized Reward
  const finishGame = useCallback((isVictory: boolean) => {
    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const scoreVal = Math.min(1000, capturedRef.current * 180 + (isVictory ? 400 : 0));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_master_chess',
      gameTitle: 'Master Chess 3D',
      durationSeconds: duration,
      score: scoreVal,
      maxTargetScore: 1000,
      isVictory,
    });
    setRewardResult(receipt);
    if (isVictory) setGameWon(true);
    else setGameOver(true);
  }, []);

  // Build 3D Piece Mesh
  const createPieceMesh = useCallback(
    (type: PieceType, color: PieceColor) => {
      const group = new THREE.Group();
      const isWhite = color === 'w';

      const mat = new THREE.MeshStandardMaterial({
        color: isWhite ? 0xfef3c7 : 0x1e293b,
        roughness: isWhite ? 0.3 : 0.4,
        metalness: isWhite ? 0.15 : 0.25,
      });

      // Pedestal Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.16, 16), mat);
      base.position.y = 0.08;
      base.castShadow = !lowSpecMode;
      group.add(base);

      if (type === 'P') {
        // Pawn
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.5, 12), mat);
        body.position.y = 0.4;
        group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), mat);
        head.position.y = 0.72;
        group.add(head);
      } else if (type === 'R') {
        // Rook
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.7, 12), mat);
        body.position.y = 0.5;
        group.add(body);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.2, 8), mat);
        crown.position.y = 0.92;
        group.add(crown);
      } else if (type === 'N') {
        // Knight
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.65, 12), mat);
        body.position.y = 0.48;
        group.add(body);
        const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.45), mat);
        horseHead.position.set(0, 0.85, 0.08);
        horseHead.rotation.x = -0.3;
        group.add(horseHead);
      } else if (type === 'B') {
        // Bishop
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.75, 12), mat);
        body.position.y = 0.52;
        group.add(body);
        const mitre = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), mat);
        mitre.scale.set(1, 1.4, 1);
        mitre.position.y = 0.95;
        group.add(mitre);
      } else if (type === 'Q') {
        // Queen
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 14), mat);
        body.position.y = 0.6;
        group.add(body);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.22, 12), mat);
        crown.position.y = 1.1;
        group.add(crown);
      } else if (type === 'K') {
        // King
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.0, 14), mat);
        body.position.y = 0.65;
        group.add(body);

        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), mat);
        crossV.position.y = 1.25;
        group.add(crossV);

        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.08), mat);
        crossH.position.y = 1.25;
        group.add(crossH);

        // White King Hero Badge
        if (isWhite) {
          const badgeCanvas = document.createElement('canvas');
          badgeCanvas.width = 64;
          badgeCanvas.height = 64;
          const heroCtx = badgeCanvas.getContext('2d');
          if (heroCtx) {
            drawCardSprite(heroCtx, playerHeroId, 0, 0, 64, 64);
          }
          const badgeTex = new THREE.CanvasTexture(badgeCanvas);
          const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, transparent: true }));
          badgeSprite.scale.set(0.65, 0.65, 0.65);
          badgeSprite.position.set(0, 1.65, 0);
          group.add(badgeSprite);
        }
      }

      return group;
    },
    [lowSpecMode, playerHeroId]
  );

  // Refresh 3D Pieces onto Board
  const sync3DPieces = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;

    // Clear old meshes
    while (three.piecesGroup.children.length > 0) {
      const obj = three.piecesGroup.children[0];
      three.piecesGroup.remove(obj);
    }

    const board = gameStateRef.current.board;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const mesh = createPieceMesh(piece.type, piece.color);
          const { x, z } = gridToWorld(r, c);
          mesh.position.set(x, 0, z);
          three.piecesGroup.add(mesh);
          piece.mesh = mesh;
        }
      }
    }
  }, [createPieceMesh, gridToWorld]);

  // Update Move Indicators
  const updateIndicators = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;

    while (three.indicatorsGroup.children.length > 0) {
      three.indicatorsGroup.remove(three.indicatorsGroup.children[0]);
    }

    const s = gameStateRef.current;
    const ringGeo = new THREE.RingGeometry(0.2, 0.38, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });

    s.validMoves.forEach((pos) => {
      const { x, z } = gridToWorld(pos.r, pos.c);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.09, z);
      three.indicatorsGroup.add(ring);
    });
  }, [gridToWorld]);

  // Initialize Board
  const initBoard = useCallback(() => {
    const b: Board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    const backRow: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    for (let c = 0; c < 8; c++) {
      b[0][c] = { type: backRow[c], color: 'b' };
      b[1][c] = { type: 'P', color: 'b' };
      b[6][c] = { type: 'P', color: 'w' };
      b[7][c] = { type: backRow[c], color: 'w' };
    }

    gameStateRef.current.board = b;
    gameStateRef.current.selected = null;
    gameStateRef.current.validMoves = [];
    gameStateRef.current.history = [];
    gameStateRef.current.turn = 'w';
    gameStateRef.current.isAiMoving = false;

    setTurn('w');
    setStatusMsg('당신의 차례입니다 (White)');
    setCaptured(0);
    capturedRef.current = 0;
    setCanUndo(false);

    sync3DPieces();
    updateIndicators();
  }, [sync3DPieces, updateIndicators]);

  // Move Piece Logic
  const movePiece = useCallback(
    (from: Pos, to: Pos) => {
      const s = gameStateRef.current;
      const piece = s.board[from.r][from.c];
      if (!piece) return;

      // Save History for Undo
      const cloneBoard: Board = s.board.map((row) =>
        row.map((cell) => (cell ? { ...cell, mesh: undefined } : null))
      );
      s.history.push({ board: cloneBoard, captured: capturedRef.current });
      setCanUndo(true);

      const target = s.board[to.r][to.c];
      if (target) {
        // Capture!
        const { x, z } = gridToWorld(to.r, to.c);
        spawnCaptureSparks(x, 0.8, z);

        if (piece.color === 'w') {
          capturedRef.current++;
          setCaptured(capturedRef.current);
        }

        // Win check if Black King captured or 5 captured
        if (target.type === 'K' && target.color === 'b') {
          s.board[to.r][to.c] = piece;
          s.board[from.r][from.c] = null;
          sync3DPieces();
          finishGame(true);
          return;
        }
        if (target.type === 'K' && target.color === 'w') {
          s.board[to.r][to.c] = piece;
          s.board[from.r][from.c] = null;
          sync3DPieces();
          finishGame(false);
          return;
        }
      }

      s.board[to.r][to.c] = piece;
      s.board[from.r][from.c] = null;

      // Pawn promotion to Queen
      if (piece.type === 'P') {
        if ((piece.color === 'w' && to.r === 0) || (piece.color === 'b' && to.r === 7)) {
          piece.type = 'Q';
        }
      }

      s.selected = null;
      s.validMoves = [];
      sync3DPieces();
      updateIndicators();

      if (navigator.vibrate) navigator.vibrate(25);

      // Check win condition by captured count
      if (capturedRef.current >= 5) {
        finishGame(true);
        return;
      }

      // Switch Turn
      if (piece.color === 'w') {
        s.turn = 'b';
        setTurn('b');
        setStatusMsg('AI 체스 마스터 생각 중... (Black)');

        // Trigger Smart AI Move after delay
        setTimeout(makeAiMove, 800);
      } else {
        s.turn = 'w';
        setTurn('w');
        setStatusMsg('당신의 차례입니다 (White)');
      }
    },
    [finishGame, gridToWorld, spawnCaptureSparks, sync3DPieces, updateIndicators]
  );

  // AI Master Engine
  const makeAiMove = useCallback(() => {
    const s = gameStateRef.current;
    if (gameOver || gameWon || s.turn !== 'b') return;

    // Collect all valid moves for Black
    const allMoves: { from: Pos; to: Pos; score: number }[] = [];
    const values: Record<PieceType, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 99 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = s.board[r][c];
        if (p && p.color === 'b') {
          const moves = getValidMoves(r, c, s.board);
          moves.forEach((to) => {
            const target = s.board[to.r][to.c];
            let moveScore = 0;
            if (target) {
              moveScore = values[target.type] * 10;
            }
            // Encourage advancing forward towards center
            moveScore += (7 - Math.abs(to.c - 3.5)) * 0.5 + to.r * 0.4;
            allMoves.push({ from: { r, c }, to, score: moveScore });
          });
        }
      }
    }

    if (allMoves.length > 0) {
      allMoves.sort((a, b) => b.score - a.score);
      // Pick best or second-best move
      const chosen = allMoves[0];
      movePiece(chosen.from, chosen.to);
    } else {
      // Stalemate / Win
      finishGame(true);
    }
  }, [finishGame, getValidMoves, movePiece, gameOver, gameWon]);

  // Undo Action
  const handleUndo = useCallback(() => {
    const s = gameStateRef.current;
    if (s.turn !== 'w' || s.history.length === 0 || gameOver || gameWon) return;

    const prev = s.history.pop();
    if (prev) {
      s.board = prev.board;
      capturedRef.current = prev.captured;
      setCaptured(prev.captured);
      s.selected = null;
      s.validMoves = [];
      setCanUndo(s.history.length > 0);
      sync3DPieces();
      updateIndicators();
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, [sync3DPieces, updateIndicators, gameOver, gameWon]);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5); // Slate Luxury Dark Room
    scene.fog = new THREE.FogExp2(0xfbf3d5, 0.015);

    // 2. Camera (Isometric Top-Down 3D Perspective)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 11.5, 9.5);
    camera.lookAt(0, 0, -0.4);

    // 3. Renderer
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

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    dirLight.position.set(8, 20, 10);
    if (!lowSpecMode) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // 5. 8x8 3D Marble Chessboard
    const boardGroup = new THREE.Group();
    const tileGeo = new THREE.BoxGeometry(0.98, 0.16, 0.98);
    const whiteTileMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const blackTileMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isWhite = (r + c) % 2 === 0;
        const mesh = new THREE.Mesh(tileGeo, isWhite ? whiteTileMat : blackTileMat);
        const { x, z } = gridToWorld(r, c);
        mesh.position.set(x, 0, z);
        mesh.receiveShadow = !lowSpecMode;
        mesh.userData = { r, c, isTile: true };
        boardGroup.add(mesh);
      }
    }

    // Walnut Outer Bevel Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.22, 9.2), frameMat);
    frame.position.y = -0.06;
    frame.receiveShadow = !lowSpecMode;
    boardGroup.add(frame);

    scene.add(boardGroup);

    // Groups for Pieces and Move Indicators
    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);

    const indicatorsGroup = new THREE.Group();
    scene.add(indicatorsGroup);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    threeRef.current = {
      scene,
      camera,
      renderer,
      boardGroup,
      piecesGroup,
      indicatorsGroup,
      raycaster,
      mouse,
      animFrameId: 0,
    };

    initBoard();

    // Render loop
    let lastTime = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const s = gameStateRef.current;
      const three = threeRef.current;

      if (three) {
        // Particle update
        if (s.particles && s.particleVels.length > 0) {
          const posAttr = s.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < s.particleVels.length; i++) {
            const v = s.particleVels[i];
            posArr[i * 3] += v.x * dt;
            posArr[i * 3 + 1] += v.y * dt;
            posArr[i * 3 + 2] += v.z * dt;
            v.y -= 10 * dt;
          }
          posAttr.needsUpdate = true;
          (s.particles.material as THREE.PointsMaterial).opacity = Math.max(
            0,
            (s.particles.material as THREE.PointsMaterial).opacity - dt * 1.2
          );
        }

        three.renderer.render(three.scene, three.camera);
        three.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    threeRef.current.animFrameId = requestAnimationFrame(renderLoop);

    // Resize Handler
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
  }, [gridToWorld, initBoard, lowSpecMode]);

  // Touch Pointer Interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    const container = containerRef.current;
    const three = threeRef.current;
    if (!container || !three || gameStateRef.current.turn !== 'w' || gameOver || gameWon) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    three.raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), three.camera);
    const intersects = three.raycaster.intersectObjects(three.boardGroup.children, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const { r, c, isTile } = hit.userData;

      if (isTile && r !== undefined && c !== undefined) {
        const s = gameStateRef.current;

        // Check if clicked cell is among valid moves for current selection
        const isMoveTarget = s.validMoves.some((m) => m.r === r && m.c === c);
        if (s.selected && isMoveTarget) {
          movePiece(s.selected, { r, c });
          return;
        }

        // Otherwise select piece if White piece on this cell
        const piece = s.board[r][c];
        if (piece && piece.color === 'w') {
          s.selected = { r, c };
          s.validMoves = getValidMoves(r, c, s.board);
          updateIndicators();

          // Float selected piece
          if (piece.mesh) {
            piece.mesh.position.y = 0.35;
          }
          if (navigator.vibrate) navigator.vibrate(15);
        } else {
          // Deselect
          if (s.selected) {
            const oldP = s.board[s.selected.r][s.selected.c];
            if (oldP && oldP.mesh) oldP.mesh.position.y = 0;
          }
          s.selected = null;
          s.validMoves = [];
          updateIndicators();
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5] font-mono text-white"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="No.027 Master Chess 3D"
        score={captured * 180}
        scoreLabel="포획 점수"
        targetLabel="체스 승리"
        targetProgress={`${captured} / 5 CAPTURES`}
        onGiveUp={() => finishGame(false)}
      />

      {/* Status Overlay */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Turn Status */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/40 flex items-center space-x-2 shadow-lg">
          <Crown className={`w-4 h-4 ${turn === 'w' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="text-xs font-bold text-amber-200">{statusMsg}</span>
        </div>

        {/* Captured Count */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-2 shadow-lg">
          <span className="text-xs font-black text-white">포획: {captured}개</span>
        </div>
      </div>

      {/* Mobile Pure Touch Bottom Controls */}
      <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-auto flex items-center justify-between max-w-sm mx-auto">
        <button
          onClick={handleUndo}
          disabled={!canUndo || turn !== 'w'}
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shadow-xl active:scale-95 transition-all ${
            canUndo && turn === 'w'
              ? 'bg-slate-800/90 border-slate-600 text-amber-400'
              : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="한 수 물리기"
        >
          <Undo2 className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">물리기</span>
        </button>

        <div className="text-center pointer-events-none">
          <span className="text-[11px] font-semibold text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700 shadow-md">
            타일을 터치해 기물 이동
          </span>
        </div>

        <button
          onClick={initBoard}
          className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-600 text-rose-400 flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all"
          title="체스판 다시 시작"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">다시하기</span>
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="마스터 체스 3D (Master Chess 3D)"
          category="3D 클래식 체스 보드 게임"
          guideSteps={[
            {
              title: '3D 기물 터치 선택 (Touch to Select)',
              desc: '체스판 위의 백색 기물을 터치하면 이동 가능한 경로가 초록색 링으로 표시됩니다.',
              iconType: 'GESTURES',
            },
            {
              title: '체스 전략 & 포획 (Capture & Checkmate)',
              desc: '이동할 타일을 터치하여 적 기물을 포획하세요. 상대 킹을 포획하거나 5개 이상 기물을 잡으면 승리합니다.',
              iconType: 'GOAL',
            },
            {
              title: '체스 마스터 보상 (Rewards)',
              desc: '지능적인 AI 체스 마스터와의 두뇌 싸움에서 승리하고 트로피와 최대 50 SNS 보상을 쟁취하세요!',
              iconType: 'REWARDS',
            },
          ]}
          onStart={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Defeat Modal */}
      {(gameWon || gameOver) && (
        <VictoryRewardModal
          isOpen={gameWon || gameOver}
          reward={rewardResult}
          onClose={handleExit}
        />
      )}
    </div>
  );
};

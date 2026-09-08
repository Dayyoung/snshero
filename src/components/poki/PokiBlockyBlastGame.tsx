import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiBlockyBlastGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;

  onBack?: () => void;
  onClose?: () => void;
}

interface PieceTemplate {
  id: number;
  shape: number[][]; // 2D matrix
  color: number;
  colorHex: string;
}

const PIECE_TEMPLATES: PieceTemplate[] = [
  { id: 1, shape: [[1]], color: 0x38bdf8, colorHex: '#38bdf8' }, // 1x1
  { id: 2, shape: [[1, 1]], color: 0x34d399, colorHex: '#34d399' }, // 1x2
  { id: 3, shape: [[1, 1, 1]], color: 0xfbbf24, colorHex: '#fbbf24' }, // 1x3
  { id: 4, shape: [[1, 1, 1, 1]], color: 0xf87171, colorHex: '#f87171' }, // 1x4
  { id: 5, shape: [[1], [1]], color: 0x34d399, colorHex: '#34d399' }, // 2x1
  { id: 6, shape: [[1], [1], [1]], color: 0xfbbf24, colorHex: '#fbbf24' }, // 3x1
  { id: 7, shape: [[1, 1], [1, 1]], color: 0xa78bfa, colorHex: '#a78bfa' }, // 2x2
  { id: 8, shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 0xf43f5e, colorHex: '#f43f5e' }, // 3x3
  { id: 9, shape: [[1, 0], [1, 0], [1, 1]], color: 0xf97316, colorHex: '#f97316' }, // L-shape
  { id: 10, shape: [[0, 1], [0, 1], [1, 1]], color: 0x06b6d4, colorHex: '#06b6d4' }, // J-shape
  { id: 11, shape: [[1, 1, 1], [0, 1, 0]], color: 0xec4899, colorHex: '#ec4899' }, // T-shape
];

export const PokiBlockyBlastGame: React.FC<PokiBlockyBlastGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
  onBack,
  onClose
}) => {
  const handleExit = onExit || onBack || onClose || (() => {});
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 9;
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // HUD & Game States
  const [score, setScore] = useState<number>(0);
  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(75);
  const [comboFeed, setComboFeed] = useState<string | null>(null);

  const [availablePieces, setAvailablePieces] = useState<PieceTemplate[]>([]);
  const [holdPiece, setHoldPiece] = useState<PieceTemplate | null>(null);
  const [activeDragIdx, setActiveDragIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_blocky_blast') !== 'true';
    } catch {
      return true;
    }
  });

  // Core 8x8 Grid State
  const stateRef = useRef({
    isRunning: true,
    grid: Array(8).fill(0).map(() => Array(8).fill(0)), // 0 = empty, color = filled
    gridMeshes: Array(8).fill(null).map(() => Array(8).fill(null as THREE.Mesh | null)),
    slotMeshes: Array(8).fill(null).map(() => Array(8).fill(null as THREE.Mesh | null)),
    particles: [] as Array<{
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
    }>,
    score: 0,
    linesCleared: 0,
    combo: 0,
    boardScene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
  });

  // Timer Countdown
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerVictory();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial]);

  // Generate 3 random pieces
  const generateNewPieces = useCallback(() => {
    const newPieces: PieceTemplate[] = [];
    for (let i = 0; i < 3; i++) {
      const tmpl = PIECE_TEMPLATES[Math.floor(Math.random() * PIECE_TEMPLATES.length)];
      newPieces.push({ ...tmpl, id: Math.random() });
    }
    setAvailablePieces(newPieces);
  }, []);

  useEffect(() => {
    generateNewPieces();
  }, [generateNewPieces]);

  // Settlement and quit handlers
  const handleQuitWithSettlement = useCallback(() => {
    stateRef.current.isRunning = false;
    setShowExitConfirm(true);
  }, []);

  const confirmExitAndSettle = useCallback(() => {
    setShowExitConfirm(false);
    const finalScore = stateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiblockyblast',
      gameTitle: isKo ? '블록키 블라스트 3D 퍼즐' : 'Blocky Blast Puzzle 3D',
      durationSeconds: Math.max(1, 75 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    
    onReward(receipt.totalSns);
  
    if (typeof handleExit === "function") handleExit();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hero-return-to-missions"));}, [isKo, onReward, timeLeft]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
    stateRef.current.isRunning = true;
  }, []);

  const triggerGameOver = useCallback(() => {
    if (isGameOver || isVictory) return;
    stateRef.current.isRunning = false;
    setIsGameOver(true);
    if (playSfx) playSfx('/sounds/game_over.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 150]);

    const finalScore = stateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiblockyblast',
      gameTitle: isKo ? '블록키 블라스트 3D 퍼즐' : 'Blocky Blast Puzzle 3D',
      durationSeconds: Math.max(1, 75 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isGameOver, isKo, isVictory, onReward, playSfx, timeLeft]);

  const triggerVictory = useCallback(() => {
    if (isGameOver || isVictory) return;
    stateRef.current.isRunning = false;
    setIsVictory(true);
    if (playSfx) playSfx('/sounds/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([60, 60, 120]);

    const finalScore = stateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiblockyblast',
      gameTitle: isKo ? '블록키 블라스트 3D 퍼즐' : 'Blocky Blast Puzzle 3D',
      durationSeconds: Math.max(1, 75 - timeLeft),
      score: Math.max(1000, finalScore),
      maxTargetScore: 1000,
      isVictory: true,
      difficulty: 'NORMAL',
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  }, [isGameOver, isKo, isVictory, onReward, playSfx, timeLeft]);

  // Particle burst helper
  const spawnBlockBlastParticles = useCallback((wx: number, wz: number, color: number) => {
    const scene = stateRef.current.boardScene;
    if (!scene) return;
    const pGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const pMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2 });

    for (let i = 0; i < 8; i++) {
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(wx + (Math.random() - 0.5) * 0.8, 0.6, wz + (Math.random() - 0.5) * 0.8);
      scene.add(pMesh);
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      stateRef.current.particles.push({
        mesh: pMesh,
        vx: Math.cos(angle) * speed,
        vy: 4 + Math.random() * 6,
        vz: Math.sin(angle) * speed,
        life: 0.65,
      });
    }
  }, []);

  // Check lines and clear
  const checkLinesAndClear = useCallback(() => {
    const grid = stateRef.current.grid;
    const gridMeshes = stateRef.current.gridMeshes;
    const scene = stateRef.current.boardScene;
    if (!scene) return;

    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Check Rows
    for (let r = 0; r < 8; r++) {
      if (grid[r].every((val) => val !== 0)) {
        rowsToClear.push(r);
      }
    }

    // Check Cols
    for (let c = 0; c < 8; c++) {
      let full = true;
      for (let r = 0; r < 8; r++) {
        if (grid[r][c] === 0) {
          full = false;
          break;
        }
      }
      if (full) colsToClear.push(c);
    }

    const totalCleared = rowsToClear.length + colsToClear.length;
    if (totalCleared > 0) {
      // Blast Cells
      const clearedSet = new Set<string>();
      rowsToClear.forEach((r) => {
        for (let c = 0; c < 8; c++) clearedSet.add(`${r},${c}`);
      });
      colsToClear.forEach((c) => {
        for (let r = 0; r < 8; r++) clearedSet.add(`${r},${c}`);
      });

      clearedSet.forEach((key) => {
        const [rStr, cStr] = key.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        const color = grid[r][c];
        grid[r][c] = 0;

        const mesh = gridMeshes[r][c];
        if (mesh) {
          const wx = (c - 3.5) * 1.5;
          const wz = (r - 3.5) * 1.5;
          spawnBlockBlastParticles(wx, wz, color);
          scene.remove(mesh);
          gridMeshes[r][c] = null;
        }
      });

      const newCombo = stateRef.current.combo + 1;
      stateRef.current.combo = newCombo;
      setCombo(newCombo);

      const earnedPoints = totalCleared * 150 + (newCombo > 1 ? newCombo * 100 : 0);
      stateRef.current.score += earnedPoints;
      stateRef.current.linesCleared += totalCleared;
      setScore(stateRef.current.score);
      setLinesCleared(stateRef.current.linesCleared);

      if (newCombo > 1) {
        setComboFeed(`COMBO x${newCombo}! (+${earnedPoints})`);
      } else {
        setComboFeed(totalCleared > 1 ? `MULTI BLAST x${totalCleared}! (+${earnedPoints})` : `LINE BLAST! (+${earnedPoints})`);
      }
      setTimeout(() => setComboFeed(null), 2000);

      if (playSfx) playSfx('/sounds/crit.mp3');
      if (navigator.vibrate) navigator.vibrate([30, 20, 60]);

      if (stateRef.current.score >= 1000) {
        triggerVictory();
      }
    } else {
      stateRef.current.combo = 0;
      setCombo(0);
    }
  }, [playSfx, spawnBlockBlastParticles, triggerVictory]);

  // Place Piece on Board
  const canPlacePiece = useCallback((shape: number[][], startR: number, startC: number): boolean => {
    const grid = stateRef.current.grid;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          const gr = startR + r;
          const gc = startC + c;
          if (gr < 0 || gr >= 8 || gc < 0 || gc >= 8) return false;
          if (grid[gr][gc] !== 0) return false;
        }
      }
    }
    return true;
  }, []);

  const placePieceOnBoard = useCallback(
    (piece: PieceTemplate, startR: number, startC: number) => {
      const grid = stateRef.current.grid;
      const gridMeshes = stateRef.current.gridMeshes;
      const scene = stateRef.current.boardScene;
      if (!scene) return;

      const cubeGeo = new THREE.BoxGeometry(1.35, 0.9, 1.35);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: piece.color,
        roughness: 0.25,
        metalness: 0.3,
      });

      let placedBlocksCount = 0;
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c] === 1) {
            const gr = startR + r;
            const gc = startC + c;
            grid[gr][gc] = piece.color;

            const wx = (gc - 3.5) * 1.5;
            const wz = (gr - 3.5) * 1.5;
            const mesh = new THREE.Mesh(cubeGeo, cubeMat);
            mesh.position.set(wx, 0.5, wz);
            scene.add(mesh);
            gridMeshes[gr][gc] = mesh;
            placedBlocksCount++;
          }
        }
      }

      stateRef.current.score += placedBlocksCount * 10;
      setScore(stateRef.current.score);
      if (playSfx) playSfx('/sounds/tap.mp3');
      if (navigator.vibrate) navigator.vibrate(20);

      checkLinesAndClear();
    },
    [checkLinesAndClear, playSfx]
  );

  // Check if any piece can be placed
  const checkAnyPieceCanBePlaced = useCallback(
    (pieces: PieceTemplate[]) => {
      for (const p of pieces) {
        for (let r = 0; r <= 8 - p.shape.length; r++) {
          for (let c = 0; c <= 8 - p.shape[0].length; c++) {
            if (canPlacePiece(p.shape, r, c)) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [canPlacePiece]
  );

  // Handle Drag Start
  const handlePieceDragStart = (idx: number, e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    setActiveDragIdx(idx);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    // Y-Offset 70px above finger so finger doesn't block block vision!
    setDragPos({ x: clientX, y: clientY - 70 });
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // Screen Touch Drag Move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeDragIdx === null) return;
    const touch = e.touches[0];
    setDragPos({ x: touch.clientX, y: touch.clientY - 70 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeDragIdx === null) return;
    setDragPos({ x: e.clientX, y: e.clientY - 60 });
  };

  // Drop Piece
  const handleDropPiece = () => {
    if (activeDragIdx === null || !dragPos) {
      setActiveDragIdx(null);
      setDragPos(null);
      return;
    }

    const container = containerRef.current;
    const piece = availablePieces[activeDragIdx];
    if (!container || !piece) {
      setActiveDragIdx(null);
      setDragPos(null);
      return;
    }

    // Convert screen drag position to 8x8 Board Grid (Row, Col)
    const rect = container.getBoundingClientRect();
    const normX = ((dragPos.x - rect.left) / rect.width) * 2 - 1;
    const normY = -((dragPos.y - rect.top) / rect.height) * 2 + 1;

    // Board in 3D center spans around normX [-0.6 ~ +0.6], normY [-0.45 ~ +0.55]
    const boardLeft = rect.left + rect.width * 0.15;
    const boardRight = rect.left + rect.width * 0.85;
    const boardTop = rect.top + rect.height * 0.15;
    const boardBottom = rect.top + rect.height * 0.65;

    if (
      dragPos.x >= boardLeft &&
      dragPos.x <= boardRight &&
      dragPos.y >= boardTop &&
      dragPos.y <= boardBottom
    ) {
      const colFraction = (dragPos.x - boardLeft) / (boardRight - boardLeft);
      const rowFraction = (dragPos.y - boardTop) / (boardBottom - boardTop);

      const targetC = Math.floor(colFraction * 8);
      const targetR = Math.floor(rowFraction * 8);

      // Adjust offset so center of piece aligns with target cell
      const startC = targetC - Math.floor(piece.shape[0].length / 2);
      const startR = targetR - Math.floor(piece.shape.length / 2);

      if (canPlacePiece(piece.shape, startR, startC)) {
        placePieceOnBoard(piece, startR, startC);

        // Remove placed piece
        const nextPieces = [...availablePieces];
        nextPieces.splice(activeDragIdx, 1);
        if (nextPieces.length === 0) {
          generateNewPieces();
        } else {
          setAvailablePieces(nextPieces);
          if (!checkAnyPieceCanBePlaced(nextPieces) && (!holdPiece || !checkAnyPieceCanBePlaced([holdPiece]))) {
            triggerGameOver();
          }
        }
      }
    }

    setActiveDragIdx(null);
    setDragPos(null);
  };

  // Hold Slot Swap
  const handleHoldSwap = () => {
    if (activeDragIdx !== null) return;
    if (availablePieces.length === 0) return;

    if (holdPiece === null) {
      // Store first piece
      setHoldPiece(availablePieces[0]);
      const nextPieces = availablePieces.slice(1);
      setAvailablePieces(nextPieces);
      if (nextPieces.length === 0) generateNewPieces();
    } else {
      // Swap first piece with hold
      const temp = holdPiece;
      setHoldPiece(availablePieces[0]);
      const nextPieces = [temp, ...availablePieces.slice(1)];
      setAvailablePieces(nextPieces);
    }
    if (navigator.vibrate) navigator.vibrate(25);
    if (playSfx) playSfx('/sounds/powerup.mp3');
  };

  // --- Three.js 3D Engine Setup ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3f7);
    stateRef.current.boardScene = scene;

    // 2. Camera (Angled Top-down 3D View)
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.5, 100);
    camera.position.set(0, 15.5, 12.5);
    camera.lookAt(0, -0.5, 0);
    stateRef.current.camera = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(10, 25, 15);
    scene.add(dirLight);

    // 5. 8x8 Board Slate Plate & 64 Slots
    const plateGeo = new THREE.BoxGeometry(13.5, 0.6, 13.5);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.2 });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(0, -0.3, 0);
    scene.add(plateMesh);

    // Board Rim
    const rimGeo = new THREE.BoxGeometry(14.0, 0.8, 14.0);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, -0.2, 0);
    scene.add(rimMesh);

    // 64 Slots
    const slotGeo = new THREE.BoxGeometry(1.4, 0.1, 1.4);
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const slot = new THREE.Mesh(slotGeo, slotMat);
        const wx = (c - 3.5) * 1.5;
        const wz = (r - 3.5) * 1.5;
        slot.position.set(wx, 0.05, wz);
        scene.add(slot);
        stateRef.current.slotMeshes[r][c] = slot;
      }
    }

    // Center Badge
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 128;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#0f172a';
      bCtx.beginPath();
      bCtx.arc(64, 64, 60, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.lineWidth = 6;
      bCtx.strokeStyle = '#38bdf8';
      bCtx.stroke();
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTexture, transparent: true, opacity: 0.3 }));
    badgeSprite.position.set(0, 0.1, 0);
    badgeSprite.scale.set(6, 6, 1);
    badgeSprite.rotation.x = -Math.PI / 2;
    scene.add(badgeSprite);

    // 6. Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Update Particle FX
      const particles = stateRef.current.particles;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 18.0 * dt; // gravity
        p.mesh.scale.multiplyScalar(0.96);

        if (p.life <= 0 || p.mesh.position.y < -2) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // ResizeObserver
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      scene.clear();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, playerHeroId]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'PUZZLE-3D',
      title: isKo ? '3D 복셀 블록키 블라스트' : '3D Voxel Blocky Blast',
      description: isKo
        ? '하단의 3D 블록 조각들을 8x8 보드로 드래그하여 가로/세로 한 줄을 완성하세요!'
        : 'Drag 3D block pieces onto the 8x8 board to complete full horizontal or vertical lines!',
      keyPoints: isKo
        ? ['가로/세로 8칸이 꽉 차면 화려한 폭파(Blast)', '동시 클리어 시 강력한 콤보 보너스']
        : ['Full lines blast into particles', 'Clear multiple lines for combo bonus'],
    },
    {
      badge: 'HOLD',
      title: isKo ? '보관(HOLD) 슬롯 활용' : 'Use the HOLD Slot',
      description: isKo
        ? '놓기 힘든 큰 조각은 우측 [📦 HOLD] 버튼을 눌러 보관해두고 위기 상황을 탈출하세요!'
        : 'Store awkward shapes in the HOLD slot to prevent getting stuck!',
      keyPoints: isKo
        ? ['까다로운 조각 1개 임시 저장', '1000점 달성 시 승리']
        : ['Store 1 difficult piece', 'Reach 1000 score for victory'],
    },
    {
      badge: 'FINGER-OFFSET',
      title: isKo ? '손가락 가림 방지 편의성' : 'Finger-Offset Touch',
      description: isKo
        ? '모바일 터치 시 손가락 위쪽으로 블록이 떠올라 드래그되므로 보드의 칸을 정확히 확인하고 배치할 수 있습니다.'
        : 'Blocks hover slightly above your finger for unobstructed view and precise drops!',
      keyPoints: isKo
        ? ['손가락에 가려지지 않는 스마트 터치', '초록색 하이라이트 칸에 즉각 안착']
        : ['No finger blockage', 'Precise visual ghost highlight'],
    },
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#bfe3f7] font-mono text-white"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDropPiece}
      onMouseMove={handleMouseMove}
      onMouseUp={handleDropPiece}
    >
      {/* Three.js Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top HUD: MinimalistMissionHUD */}
      <div className="relative z-20 pointer-events-auto">
        <MinimalistMissionHUD
          missionTitle={isKo ? '블록키 블라스트 3D' : 'Blocky Blast 3D'}
          currentScore={score}
          targetScore={1000}
          onExit={handleQuitWithSettlement}
          onShowRules={() => setShowTutorial(true)}
          stats={[
            { label: isKo ? '라인' : 'Lines', value: `${linesCleared}줄` },
            { label: isKo ? '콤보' : 'Combo', value: combo > 1 ? `x${combo}` : '-' },
            { label: isKo ? '남은시간' : 'Time', value: `${timeLeft}s` },
          ]}
        />
      </div>

      {/* Combo / Blast Feed Notification */}
      {comboFeed && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
          <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs sm:text-sm rounded-full shadow-lg border border-amber-300 flex items-center gap-1.5">
            <span>💥</span>
            <span>{comboFeed}</span>
          </div>
        </div>
      )}

      {/* Hold Slot Button (Top Right) */}
      <div className="absolute top-16 right-4 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={handleHoldSwap}
          className="flex flex-col items-center bg-slate-900/85 hover:bg-slate-800 border-2 border-sky-400/80 rounded-lg p-2.5 shadow-xl active:scale-95 transition-transform cursor-pointer"
        >
          <span className="text-[10px] font-bold text-sky-300 uppercase">📦 HOLD</span>
          <div className="w-10 h-10 flex items-center justify-center mt-1">
            {holdPiece ? (
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${holdPiece.shape[0].length}, minmax(0, 1fr))`,
                }}
              >
                {holdPiece.shape.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="w-2.5 h-2.5 rounded-xs"
                      style={{
                        backgroundColor: cell ? holdPiece.colorHex : 'transparent',
                      }}
                    />
                  ))
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-mono">[EMPTY]</span>
            )}
          </div>
        </button>
      </div>

      {/* Bottom 3 Available Pieces Tray */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center justify-center gap-4 sm:gap-6 bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/80 shadow-2xl">
        {availablePieces.map((p, idx) => (
          <div
            key={p.id}
            onTouchStart={(e) => handlePieceDragStart(idx, e)}
            onMouseDown={(e) => handlePieceDragStart(idx, e)}
            className={`w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl cursor-grab active:cursor-grabbing transition-all active:scale-95 ${
              activeDragIdx === idx ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${p.shape[0].length}, minmax(0, 1fr))`,
              }}
            >
              {p.shape.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs shadow-sm"
                    style={{
                      backgroundColor: cell ? p.colorHex : 'transparent',
                      border: cell ? '1px solid rgba(255,255,255,0.4)' : 'none',
                    }}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Dragged Piece Preview (with Smart Finger-Offset) */}
      {activeDragIdx !== null && dragPos && availablePieces[activeDragIdx] && (
        <div
          className="fixed pointer-events-none z-50 transition-transform duration-75"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%) scale(1.15)',
          }}
        >
          <div
            className="grid gap-1.5 p-2 bg-slate-900/60 rounded-lg backdrop-blur-xs border border-white/30 shadow-2xl"
            style={{
              gridTemplateColumns: `repeat(${availablePieces[activeDragIdx].shape[0].length}, minmax(0, 1fr))`,
            }}
          >
            {availablePieces[activeDragIdx].shape.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="w-7 h-7 rounded-sm shadow-md"
                  style={{
                    backgroundColor: cell ? availablePieces[activeDragIdx].colorHex : 'transparent',
                    border: cell ? '2px solid rgba(255,255,255,0.8)' : 'none',
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Exit & Settle Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 text-2xl font-bold">
              [?]
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '게임을 중단하시겠습니까?' : 'Exit Game?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '지금까지 획득한 점수와 폭파한 라인 수에 비례한 SNS 포인트 보상이 안전하게 정산됩니다.'
                : 'Your reward will be calculated and deposited based on your score and lines cleared.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmExitAndSettle}
                className="flex-1 py-2.5 px-3 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isKo ? '정산받고 나가기' : 'Settle & Exit'}
              </button>
              <button
                type="button"
                onClick={cancelExit}
                className="flex-1 py-2.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                {isKo ? '계속 플레이' : 'Keep Playing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && !settlementReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/60 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-2xl font-bold">
              ✕
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '더 이상 놓을 자리가 없음!' : 'No More Moves!'}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {isKo ? `최종 점수: ${score}점 | 클리어 라인: ${linesCleared}줄` : `Score: ${score} | Lines: ${linesCleared}`}
            </p>
            <button
              type="button"
              onClick={confirmExitAndSettle}
              className="w-full py-2.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isKo ? '보상 수령 및 복귀' : 'Claim Reward & Exit'}
            </button>
          </div>
        </div>
      )}

      {/* Victory / Settlement Receipt Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={true}
          receipt={settlementReceipt}
          onClose={onExit}
          isKo={isKo}
        />
      )}

      {/* Tutorial Modal */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          try {
            localStorage.setItem('hero_tutorial_blocky_blast', 'true');
          } catch {}
        }}
        title={isKo ? '블록키 블라스트 3D 가이드' : 'Blocky Blast 3D Guide'}
        steps={tutorialSteps}
        storageKey="hero_tutorial_blocky_blast"
      />
    </div>
  );
};

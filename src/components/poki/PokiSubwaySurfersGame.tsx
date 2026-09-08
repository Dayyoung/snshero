import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Trophy, Coins } from 'lucide-react';

interface PokiSubwaySurfersGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

type ObstacleType = 'TRAIN' | 'LOW_BARRIER' | 'HIGH_BARRIER';

interface ObstacleData {
  mesh: THREE.Group;
  lane: number;
  z: number;
  type: ObstacleType;
  passed: boolean;
}

interface CoinData {
  mesh: THREE.Mesh;
  lane: number;
  z: number;
  collected: boolean;
}

const LANE_X = [-2.2, 0, 2.2];

export const PokiSubwaySurfersGame: React.FC<PokiSubwaySurfersGameProps> = ({
  onBack,
  onExit,
  cardId = 26,
  deck,
  lowSpecMode = false,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => {});
  const playerHeroId = deck?.[0]?.id || cardId || 26;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI State
  const [distance, setDistance] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [hasMagnet, setHasMagnet] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Time & Score tracking
  const startTimeRef = useRef<number>(Date.now());
  const distanceRef = useRef<number>(0);
  const coinsRef = useRef<number>(0);

  // Touch Swipe tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Internal Logic State
  const gameStateRef = useRef<{
    lane: number; // 0, 1, 2
    x: number;
    y: number;
    vy: number;
    isJumping: boolean;
    isRolling: boolean;
    rollTimer: number;
    speed: number;
    distance: number;
    magnetTimer: number;
    obstacles: ObstacleData[];
    coins: CoinData[];
    guardZ: number;
    trackMeshes: THREE.Group[];
  }>({
    lane: 1, // Start center
    x: 0,
    y: 0,
    vy: 0,
    isJumping: false,
    isRolling: false,
    rollTimer: 0,
    speed: 20, // 20m/s
    distance: 0,
    magnetTimer: 0,
    obstacles: [],
    coins: [],
    guardZ: 6.5,
    trackMeshes: [],
  });

  // Three.js References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    playerBody: THREE.Mesh;
    guardGroup: THREE.Group;
    dogGroup: THREE.Group;
    animFrameId: number;
  } | null>(null);

  // Action: Change Lane
  const changeLane = useCallback((dir: number) => {
    const s = gameStateRef.current;
    if (gameOver || gameWon) return;

    const nextLane = Math.max(0, Math.min(2, s.lane + dir));
    if (nextLane !== s.lane) {
      s.lane = nextLane;
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }, []);

  // Action: Jump
  const handleJump = useCallback(() => {
    const s = gameStateRef.current;
    if (gameOver || gameWon || s.isJumping) return;

    s.isJumping = true;
    s.vy = 12.5; // Jump velocity
    s.isRolling = false;
    s.rollTimer = 0;
    if (navigator.vibrate) navigator.vibrate(25);
  }, []);

  // Action: Slide / Roll
  const handleRoll = useCallback(() => {
    const s = gameStateRef.current;
    if (gameOver || gameWon) return;

    s.isRolling = true;
    s.rollTimer = 0.85; // 0.85s rolling
    if (s.isJumping) {
      // Fast drop downward
      s.vy = -18;
    }
    if (navigator.vibrate) navigator.vibrate(20);
  }, []);

  // Finish Game / Give Up
  const finishGame = useCallback((isVictory: boolean) => {
    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const finalScore = Math.min(1000, Math.floor(distanceRef.current * 1.5 + coinsRef.current * 20));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_subway_surfers',
      gameTitle: 'Subway Surfers 3D',
      durationSeconds: duration,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory,
    });
    setRewardResult(receipt);
    if (isVictory) setGameWon(true);
    else setGameOver(true);
  }, []);

  // Three.js Scene Setup & Simulation
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8); // Sunny Sky Blue
    scene.fog = new THREE.Fog(0x38bdf8, 30, 95);

    // 2. Camera (Chase-cam behind surfer)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 120);
    camera.position.set(0, 3.8, 6.2);
    camera.lookAt(0, 1.4, -10);

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

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.35);
    sunLight.position.set(20, 35, 15);
    if (!lowSpecMode) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 100;
      sunLight.shadow.camera.left = -15;
      sunLight.shadow.camera.right = 15;
      sunLight.shadow.camera.top = 15;
      sunLight.shadow.camera.bottom = -15;
    }
    scene.add(sunLight);

    // 5. Build Railway Tracks (3 Pieces of 60m segments looping)
    const trackGroup = new THREE.Group();
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    const createTrackSegment = (startZ: number) => {
      const segGroup = new THREE.Group();
      // Ground Ballast
      const ballast = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 60), ballastMat);
      ballast.rotation.x = -Math.PI / 2;
      ballast.position.set(0, 0, -30);
      ballast.receiveShadow = !lowSpecMode;
      segGroup.add(ballast);

      // Sleepers & Rails for 3 Lanes
      for (let z = 0; z > -60; z -= 1.8) {
        const sleeper = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.12, 0.35), sleeperMat);
        sleeper.position.set(0, 0.06, z);
        sleeper.receiveShadow = !lowSpecMode;
        segGroup.add(sleeper);
      }

      // 6 Rails (2 per lane)
      LANE_X.forEach((lx) => {
        [-0.55, 0.55].forEach((rx) => {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 60), railMat);
          rail.position.set(lx + rx, 0.14, -30);
          segGroup.add(rail);
        });
      });

      // Side Tunnel Walls & Graffiti
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 60), wallMat);
      leftWall.position.set(-4.6, 2.5, -30);
      segGroup.add(leftWall);

      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 60), wallMat);
      rightWall.position.set(4.6, 2.5, -30);
      segGroup.add(rightWall);

      segGroup.position.z = startZ;
      return segGroup;
    };

    const track1 = createTrackSegment(0);
    const track2 = createTrackSegment(-60);
    const track3 = createTrackSegment(-120);
    trackGroup.add(track1);
    trackGroup.add(track2);
    trackGroup.add(track3);
    scene.add(trackGroup);
    gameStateRef.current.trackMeshes = [track1, track2, track3];

    // 6. Build Player Surfer (Jake)
    const playerGroup = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }); // Red Hoodie
    const pPantsMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }); // Blue Jeans

    // Body
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.4), pMat);
    pBody.position.y = 0.9;
    pBody.castShadow = !lowSpecMode;
    playerGroup.add(pBody);

    // Head & Cap
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    pHead.position.y = 1.6;
    playerGroup.add(pHead);

    const pCap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 8), pMat);
    pCap.position.set(0, 1.78, 0.08);
    playerGroup.add(pCap);

    // Legs
    const pLegs = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.35), pPantsMat);
    pLegs.position.y = 0.35;
    playerGroup.add(pLegs);

    // Hero No.026 Badge on Top
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 64;
    badgeCanvas.height = 64;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, playerHeroId, 0, 0, 64, 64);
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, transparent: true }));
    badgeSprite.scale.set(0.65, 0.65, 0.65);
    badgeSprite.position.set(0, 2.3, 0);
    playerGroup.add(badgeSprite);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);

    // 7. Chasing Inspector & Bulldog
    const guardGroup = new THREE.Group();
    const gBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a })
    );
    gBody.position.y = 0.95;
    guardGroup.add(gBody);
    guardGroup.position.set(-0.8, 0, 6.5);
    scene.add(guardGroup);

    const dogGroup = new THREE.Group();
    const dBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.45, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x78350f })
    );
    dBody.position.y = 0.3;
    dogGroup.add(dBody);
    dogGroup.position.set(0.8, 0, 7.0);
    scene.add(dogGroup);

    // 8. Obstacles & Coins Factory
    const trainMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const trainStripeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.15 });

    const createTrainMesh = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 8.5), trainMat);
      body.position.y = 1.35;
      body.castShadow = !lowSpecMode;
      g.add(body);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.35, 8.52), trainStripeMat);
      stripe.position.y = 1.1;
      g.add(stripe);

      const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      light.position.set(0, 1.8, 4.3);
      g.add(light);
      return g;
    };

    const createLowBarrier = () => {
      const g = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 0.25), barrierMat);
      bar.position.y = 0.45;
      bar.castShadow = !lowSpecMode;
      g.add(bar);
      return g;
    };

    const createHighBarrier = () => {
      const g = new THREE.Group();
      // Upper sign bar with gap below
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), railMat);
      postL.position.set(-0.9, 1.4, 0);
      g.add(postL);

      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), railMat);
      postR.position.set(0.9, 1.4, 0);
      g.add(postR);

      const sign = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 0.25), barrierMat);
      sign.position.y = 2.2;
      sign.castShadow = !lowSpecMode;
      g.add(sign);
      return g;
    };

    // Pre-generate Initial Track Obstacles (Starting safe 25m: first obstacle at Z = -28)
    const obstacles: ObstacleData[] = [];
    const coins: CoinData[] = [];

    let curZ = -28;
    for (let i = 0; i < 28; i++) {
      const lane = Math.floor(Math.random() * 3);
      const rand = Math.random();
      let type: ObstacleType = 'TRAIN';
      let mesh: THREE.Group;

      if (rand < 0.45) {
        type = 'TRAIN';
        mesh = createTrainMesh();
      } else if (rand < 0.75) {
        type = 'LOW_BARRIER';
        mesh = createLowBarrier();
      } else {
        type = 'HIGH_BARRIER';
        mesh = createHighBarrier();
      }

      mesh.position.set(LANE_X[lane], 0, curZ);
      scene.add(mesh);
      obstacles.push({ mesh, lane, z: curZ, type, passed: false });

      // Add coins around obstacle
      const freeLane = (lane + 1) % 3;
      for (let c = 0; c < 4; c++) {
        const cMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12), coinMat);
        cMesh.rotation.x = Math.PI / 2;
        const cz = curZ + c * 2.2;
        cMesh.position.set(LANE_X[freeLane], 0.7, cz);
        scene.add(cMesh);
        coins.push({ mesh: cMesh, lane: freeLane, z: cz, collected: false });
      }

      curZ -= type === 'TRAIN' ? 24 : 16;
    }
    gameStateRef.current.obstacles = obstacles;
    gameStateRef.current.coins = coins;

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerGroup,
      playerBody: pBody,
      guardGroup,
      dogGroup,
      animFrameId: 0,
    };

    // 9. Main Game Simulation Loop
    let lastTime = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const s = gameStateRef.current;
      const three = threeRef.current;

      if (three && !gameOver && !gameWon) {
        // --- Distance & Track Loop ---
        const moveDist = s.speed * dt;
        s.distance += moveDist;
        distanceRef.current = Math.floor(s.distance);
        setDistance(distanceRef.current);

        // Win check (600m completed)
        if (s.distance >= 600) {
          finishGame(true);
          return;
        }

        // Loop railway track pieces
        s.trackMeshes.forEach((seg) => {
          seg.position.z += moveDist;
          if (seg.position.z > 60) {
            seg.position.z -= 180;
          }
        });

        // --- Player Lane & Jump Physics ---
        const targetX = LANE_X[s.lane];
        s.x += (targetX - s.x) * 12 * dt;

        if (s.isJumping) {
          s.y += s.vy * dt;
          s.vy -= 30 * dt; // Gravity
          if (s.y <= 0) {
            s.y = 0;
            s.vy = 0;
            s.isJumping = false;
          }
        }

        // Rolling countdown
        if (s.isRolling) {
          s.rollTimer -= dt;
          if (s.rollTimer <= 0) {
            s.isRolling = false;
          }
        }

        // Magnet timer
        if (s.magnetTimer > 0) {
          s.magnetTimer -= dt;
          if (s.magnetTimer <= 0) setHasMagnet(false);
        }

        // Update Player Transform
        three.playerGroup.position.set(s.x, s.y, 0);
        // Bank tilt when changing lane
        three.playerGroup.rotation.z = (targetX - s.x) * -0.15;
        // Roll scale
        if (s.isRolling) {
          three.playerBody.scale.set(1.1, 0.45, 1.1);
          three.playerBody.position.y = 0.3;
        } else {
          three.playerBody.scale.set(1, 1, 1);
          three.playerBody.position.y = 0.9;
        }

        // --- Update Obstacles & Collision ---
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.mesh.position.z += moveDist;
          obs.z = obs.mesh.position.z;

          // Collision Check with Player (Z ~ 0)
          const zDepth = obs.type === 'TRAIN' ? 4.5 : 0.6;
          if (Math.abs(obs.z) < zDepth && obs.lane === s.lane) {
            let hit = false;
            if (obs.type === 'TRAIN') {
              hit = true; // Train hits at any height
            } else if (obs.type === 'LOW_BARRIER') {
              if (s.y < 0.85) hit = true; // Not jumped
            } else if (obs.type === 'HIGH_BARRIER') {
              if (!s.isRolling && s.y >= 0.8) hit = true; // Not rolled
            }

            if (hit) {
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              finishGame(false);
              return;
            }
          }

          // Recycle Obstacle to front
          if (obs.z > 20) {
            obs.z = -160 + (Math.random() - 0.5) * 20;
            obs.lane = Math.floor(Math.random() * 3);
            obs.mesh.position.set(LANE_X[obs.lane], 0, obs.z);
          }
        }

        // --- Update Coins & Magnet Collection ---
        for (let i = s.coins.length - 1; i >= 0; i--) {
          const coin = s.coins[i];
          coin.mesh.position.z += moveDist;
          coin.mesh.rotation.z += dt * 5; // Spin

          // Magnet Attraction
          if (s.magnetTimer > 0 && Math.abs(coin.mesh.position.z) < 12) {
            coin.mesh.position.x += (s.x - coin.mesh.position.x) * 8 * dt;
            coin.mesh.position.y += (s.y + 0.7 - coin.mesh.position.y) * 8 * dt;
          }

          // Collection Check
          if (!coin.collected && Math.abs(coin.mesh.position.z) < 1.2) {
            const dist = Math.hypot(coin.mesh.position.x - s.x, coin.mesh.position.y - (s.y + 0.7));
            if (dist < 1.2) {
              coin.collected = true;
              coin.mesh.visible = false;
              coinsRef.current++;
              setCoinCount(coinsRef.current);
              if (navigator.vibrate) navigator.vibrate(12);
            }
          }

          // Recycle Coin to front
          if (coin.mesh.position.z > 20) {
            coin.mesh.position.z = -150 - Math.random() * 20;
            coin.mesh.position.x = LANE_X[Math.floor(Math.random() * 3)];
            coin.collected = false;
            coin.mesh.visible = true;
          }
        }

        three.renderer.render(three.scene, three.camera);
        three.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    threeRef.current.animFrameId = requestAnimationFrame(renderLoop);

    // Responsive Resize
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
  }, [lowSpecMode, playerHeroId]);

  // Touch Swipe Handlers (4-way pure touch gestures)
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

    if (Math.max(absX, absY) < 25) return; // ignore micro taps

    if (absX > absY) {
      if (dx > 0) changeLane(1); // Swipe Right
      else changeLane(-1); // Swipe Left
    } else {
      if (dy < 0) handleJump(); // Swipe Up -> Jump
      else handleRoll(); // Swipe Down -> Roll
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        changeLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        changeLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        handleJump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleRoll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeLane, handleJump, handleRoll]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-sky-400 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="No.026 Subway Surfers 3D"
        score={Math.floor(distance * 1.5 + coinCount * 20)}
        scoreLabel="질주 점수"
        targetLabel="완주 목표"
        targetProgress={`${distance} / 600m`}
        onGiveUp={() => finishGame(false)}
      />

      {/* Distance & Coins Top Overlay */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Coins Count */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 flex items-center space-x-2 shadow-lg">
          <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="text-xs font-black text-amber-300">{coinCount} COINS</span>
        </div>

        {/* Distance Badge */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-400/40 flex items-center space-x-2 shadow-lg">
          <Trophy className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-extrabold text-sky-200">{distance}m / 600m</span>
        </div>
      </div>

      {/* Mobile Pure Touch Bottom Controls */}
      <div className="absolute bottom-6 left-0 right-0 px-5 pointer-events-auto flex items-end justify-between max-w-md mx-auto">
        {/* Left Side: Left/Right Lane Steer */}
        <div className="flex space-x-3">
          <button
            onClick={() => changeLane(-1)}
            className="w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-300 text-slate-900 flex items-center justify-center shadow-xl active:scale-90 active:bg-sky-500 active:text-white transition-all"
            title="왼쪽 레인"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>
          <button
            onClick={() => changeLane(1)}
            className="w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-300 text-slate-900 flex items-center justify-center shadow-xl active:scale-90 active:bg-sky-500 active:text-white transition-all"
            title="오른쪽 레인"
          >
            <ArrowRight className="w-8 h-8" />
          </button>
        </div>

        {/* Right Side: Jump & Roll Action */}
        <div className="flex items-end space-x-3">
          <button
            onClick={handleRoll}
            className="w-16 h-16 rounded-2xl bg-amber-500/95 border border-amber-400 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 active:bg-amber-600 transition-transform"
            title="구르기 슬라이드"
          >
            <ArrowDown className="w-6 h-6" />
            <span className="text-[10px] font-black mt-0.5">구르기</span>
          </button>
          <button
            onClick={handleJump}
            className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 border-2 border-sky-300 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 active:from-sky-600 active:to-indigo-700 transition-all"
            title="점프"
          >
            <ArrowUp className="w-8 h-8" />
            <span className="text-[11px] font-black mt-0.5">점프</span>
          </button>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="서브웨이 서퍼스 3D (Subway Surfers 3D)"
          category="3D 엔드리스 지하철 러너"
          guideSteps={[
            {
              title: '3레인 좌우 이동 (Swipe or Buttons)',
              desc: '화면을 좌우로 스와이프하거나 하단 방향 버튼으로 레인을 바꿔 마주 달려오는 전동차를 회피하세요.',
              iconType: 'GESTURES',
            },
            {
              title: '점프 & 슬라이드 (Jump & Roll)',
              desc: '낮은 공사 바리케이드는 [점프]로 뛰어넘고, 높은 고가 표지판은 [구르기]로 슬라이딩해 통과하세요!',
              iconType: 'GOAL',
            },
            {
              title: '600m 질주 & 보상 (Rewards)',
              desc: '600m를 무사히 완주하거나 코인을 쓸어 담아 최고 기록을 세우고 최대 50 SNS 보상을 획득하세요!',
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

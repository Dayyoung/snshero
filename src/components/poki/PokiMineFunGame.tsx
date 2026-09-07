import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiMineFunGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface VoxelBlock {
  mesh: THREE.Mesh;
  type: 'grass' | 'stone' | 'wood' | 'lava' | 'slime' | 'moving';
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  moveRange?: number;
  moveSpeed?: number;
  initialX?: number;
}

interface VoxelCoin {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export const PokiMineFunGame: React.FC<PokiMineFunGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 3;
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [checkpointZ, setCheckpointZ] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_minefun_v2') !== 'true';
    } catch {
      return true;
    }
  });

  const totalCourseLength = 120;

  // Three.js References
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    playerGroup: THREE.Group | null;
    portalMesh: THREE.Mesh | null;
    blocks: VoxelBlock[];
    coins: VoxelCoin[];
  }>({
    renderer: null,
    scene: null,
    camera: null,
    playerGroup: null,
    portalMesh: null,
    blocks: [],
    coins: [],
  });

  // Gameplay State
  const stateRef = useRef({
    player: {
      x: 0,
      y: 2,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      isGrounded: false,
      invulnerableTimer: 0,
      lastCheckpoint: { x: 0, y: 2, z: 0 },
    },
    touch: {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    },
    keys: {
      up: false,
      down: false,
      left: false,
      right: false,
      jump: false,
    },
    score: 0,
    coins: 0,
    timeAlive: 0,
  });

  // 1. Jump Action
  const handleJump = useCallback(() => {
    const s = stateRef.current;
    if (s.player.isGrounded && !isGameOver && !isVictory) {
      s.player.vy = 12.8;
      s.player.isGrounded = false;
      playSfx?.('sounds/jump.mp3');
    }
  }, [isGameOver, isVictory, playSfx]);

  // 2. Three.js Scene Setup & Voxel Track Generation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Sky
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8); // Vibrant Voxel Sky Blue
    scene.fog = new THREE.FogExp2(0x38bdf8, 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 5, -7);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.3);
    sunLight.position.set(25, 45, 20);
    sunLight.castShadow = !lowSpecMode;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Materials Palette
    const mats = {
      grass: new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8 }), // Light grass
      dirt: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }), // Dirt
      stone: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 }), // Stone
      wood: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }), // Wood Planks
      lava: new THREE.MeshBasicMaterial({ color: 0xef4444 }), // Glowing Lava
      slime: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2, metalness: 0.4 }), // Bouncy Slime
      goldCoin: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.8 }),
      portal: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1, metalness: 0.9, wireframe: false }),
    };

    const blocks: VoxelBlock[] = [];
    const coins: VoxelCoin[] = [];

    // Helper: Add Voxel Block Platform
    const addBlock = (
      type: 'grass' | 'stone' | 'wood' | 'lava' | 'slime' | 'moving',
      x: number,
      y: number,
      z: number,
      w = 2,
      h = 1,
      d = 2,
      moveRange = 0,
      moveSpeed = 0
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mats[type]);
      mesh.position.set(x, y - h / 2, z);
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);

      // If grass block, add dirt underside for authentic voxel style
      if (type === 'grass' && h >= 1) {
        const dirtGeo = new THREE.BoxGeometry(w, h * 0.7, d);
        const dirtMesh = new THREE.Mesh(dirtGeo, mats.dirt);
        dirtMesh.position.set(0, -h * 0.5, 0);
        mesh.add(dirtMesh);
      }

      blocks.push({ mesh, type, x, y, z, w, h, d, moveRange, moveSpeed, initialX: x });
    };

    // Helper: Add Coin
    const addCoin = (x: number, y: number, z: number) => {
      const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 12);
      const mesh = new THREE.Mesh(coinGeo, mats.goldCoin);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(x, y + 0.6, z);
      mesh.castShadow = !lowSpecMode;
      scene.add(mesh);
      coins.push({ mesh, x, y: y + 0.6, z, collected: false });
    };

    // --- Build Course Obby Track ---
    // Start Area (z: -4 ~ 4)
    addBlock('grass', 0, 0, 0, 6, 2, 8);

    // Section 1: Stepping Grass Blocks (z: 8 ~ 24)
    addBlock('grass', -1.5, 0.5, 8, 2, 1, 2);
    addCoin(-1.5, 0.5, 8);
    addBlock('grass', 1.5, 1.0, 13, 2, 1, 2);
    addCoin(1.5, 1.0, 13);
    addBlock('wood', -1.0, 1.5, 18, 2, 1, 2);
    addBlock('grass', 0, 2.0, 24, 3, 1, 3);
    addCoin(0, 2.0, 24);

    // Checkpoint 1 (z = 30)
    addBlock('stone', 0, 2.0, 30, 4, 1, 4);

    // Section 2: Moving Platform over the Void (z: 36 ~ 46)
    addBlock('moving', 0, 2.0, 37, 2.5, 0.8, 2.5, 4.0, 2.0);
    addCoin(0, 2.0, 37);
    addBlock('moving', 0, 2.5, 45, 2.5, 0.8, 2.5, 4.0, -2.5);

    // Section 3: Slime Super Jumper Pad over Lava Gap (z: 52 ~ 68)
    addBlock('stone', 0, 3.0, 52, 3, 1, 3);
    // Slime Pad
    addBlock('slime', 0, 3.2, 56, 2.5, 0.5, 2.5);
    // Lava Pit Far Below
    addBlock('lava', 0, -2.0, 64, 14, 1, 14);
    // Landing Platform
    addBlock('grass', 0, 4.0, 72, 4, 1, 4);
    addCoin(0, 4.0, 72);

    // Checkpoint 2 (z = 78)
    addBlock('stone', 0, 4.5, 78, 4, 1, 4);

    // Section 4: Stairway to Heaven (z: 84 ~ 105)
    addBlock('wood', -2, 5.5, 84, 2, 1, 2);
    addCoin(-2, 5.5, 84);
    addBlock('wood', 2, 6.8, 90, 2, 1, 2);
    addCoin(2, 6.8, 90);
    addBlock('stone', 0, 8.0, 96, 2, 1, 2);
    addBlock('slime', 0, 8.2, 102, 2.5, 0.5, 2.5);

    // Goal Platform & Portal (z: 114 ~ 122)
    addBlock('grass', 0, 10.0, 116, 8, 2, 8);

    // 3D Goal Portal Ring
    const portalGeo = new THREE.TorusGeometry(2.5, 0.4, 16, 32);
    const portalMesh = new THREE.Mesh(portalGeo, mats.portal);
    portalMesh.position.set(0, 13.0, 118);
    scene.add(portalMesh);

    // Player 3D Voxel Mesh (Steve-like Voxel Avatar)
    const playerGroup = new THREE.Group();

    // Body
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }); // Cyan shirt
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), pBodyMat);
    pBody.position.y = 1.0;
    pBody.castShadow = !lowSpecMode;
    playerGroup.add(pBody);

    // Legs
    const pLegMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 }); // Dark blue pants
    const pLegL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.45), pLegMat);
    pLegL.position.set(-0.2, 0.4, 0);
    pLegL.castShadow = !lowSpecMode;
    playerGroup.add(pLegL);

    const pLegR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.45), pLegMat);
    pLegR.position.set(0.2, 0.4, 0);
    pLegR.castShadow = !lowSpecMode;
    playerGroup.add(pLegR);

    // Head
    const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 }); // Skin
    const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), pHeadMat);
    pHead.position.y = 1.75;
    pHead.castShadow = !lowSpecMode;
    playerGroup.add(pHead);

    // Card Hero No.03 Badge
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
      bCtx.strokeStyle = '#f59e0b';
      bCtx.stroke();
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeSpriteMat = new THREE.SpriteMaterial({ map: badgeTexture });
    const badgeSprite = new THREE.Sprite(badgeSpriteMat);
    badgeSprite.position.set(0, 2.6, 0);
    badgeSprite.scale.set(1.2, 1.2, 1.2);
    playerGroup.add(badgeSprite);

    scene.add(playerGroup);

    threeRef.current = {
      renderer,
      scene,
      camera,
      playerGroup,
      portalMesh,
      blocks,
      coins,
    };

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, playerHeroId]);

  // 3. Physics & Animation Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.08);
      lastTime = currentTime;

      const { renderer, scene, camera, playerGroup, portalMesh, blocks, coins } = threeRef.current;
      const s = stateRef.current;

      if (renderer && scene && camera && playerGroup && !isGameOver && !isVictory) {
        s.timeAlive += dt;

        // Rotate Portal & Coins
        if (portalMesh) portalMesh.rotation.z += 0.03;
        coins.forEach((c) => {
          if (!c.collected) {
            c.mesh.rotation.z += 0.05;
          }
        });

        // Update Moving Platforms
        blocks.forEach((b) => {
          if (b.type === 'moving' && b.moveRange && b.moveSpeed && b.initialX !== undefined) {
            b.x = b.initialX + Math.sin(s.timeAlive * b.moveSpeed) * b.moveRange;
            b.mesh.position.x = b.x;
          }
        });

        // Player Controls Input
        let moveX = 0;
        let moveZ = 0;

        if (s.keys.up) moveZ += 1;
        if (s.keys.down) moveZ -= 1;
        if (s.keys.left) moveX -= 1;
        if (s.keys.right) moveX += 1;

        if (s.touch.active) {
          const dx = s.touch.currentX - s.touch.startX;
          const dy = s.touch.currentY - s.touch.startY;
          const dist = Math.hypot(dx, dy);
          if (dist > 10) {
            moveX = dx / Math.max(dist, 50);
            moveZ = -dy / Math.max(dist, 50);
          }
        }

        const moveSpeed = 6.8;
        s.player.vx = THREE.MathUtils.lerp(s.player.vx, moveX * moveSpeed, 0.2);
        s.player.vz = THREE.MathUtils.lerp(s.player.vz, moveZ * moveSpeed, 0.2);

        // Apply Gravity
        const gravity = -28.0;
        s.player.vy += gravity * dt;

        // Proposed Next Positions
        const nextX = s.player.x + s.player.vx * dt;
        const nextY = s.player.y + s.player.vy * dt;
        const nextZ = s.player.z + s.player.vz * dt;

        s.player.x = nextX;
        s.player.z = nextZ;

        // Collision Check with Voxel Platforms
        s.player.isGrounded = false;
        const playerRadius = 0.4;
        const playerBottom = nextY;

        for (const b of blocks) {
          const minX = b.x - b.w / 2 - playerRadius;
          const maxX = b.x + b.w / 2 + playerRadius;
          const minZ = b.z - b.d / 2 - playerRadius;
          const maxZ = b.z + b.d / 2 + playerRadius;

          if (s.player.x >= minX && s.player.x <= maxX && s.player.z >= minZ && s.player.z <= maxZ) {
            const blockTop = b.y;

            // Landing on top
            if (s.player.y >= blockTop - 0.2 && playerBottom <= blockTop + 0.3 && s.player.vy <= 0) {
              s.player.y = blockTop;
              s.player.vy = 0;
              s.player.isGrounded = true;

              // Slime Pad Super Jump
              if (b.type === 'slime') {
                s.player.vy = 22.0;
                s.player.isGrounded = false;
                playSfx?.('sounds/boost.mp3');
              }

              // Lava Hazard
              if (b.type === 'lava' && s.player.invulnerableTimer <= 0) {
                s.player.invulnerableTimer = 1.5;
                s.player.vy = 8.0;
                playSfx?.('sounds/hit.mp3');
                setLives((prev) => {
                  const next = prev - 1;
                  if (next <= 0) {
                    setIsGameOver(true);
                    const receipt = calculateAndDepositMissionReward({
                      gameId: 'pokiminefun',
                      gameTitle: 'MineFun.io 3D Obby',
                      durationSeconds: Math.round(s.timeAlive),
                      score: s.score,
                      maxTargetScore: 1000,
                      isVictory: false,
                      difficulty: 'NORMAL',
                    });
                    setSettlementReceipt(receipt);
                    onReward(receipt.totalSns);
                  }
                  return Math.max(0, next);
                });
              }

              // Moving Platform Carry
              if (b.type === 'moving' && b.moveSpeed && b.moveRange) {
                s.player.x += Math.cos(s.timeAlive * b.moveSpeed) * b.moveRange * b.moveSpeed * dt;
              }
              break;
            }
          }
        }

        if (!s.player.isGrounded) {
          s.player.y += s.player.vy * dt;
        }

        // Collect Coins
        coins.forEach((c) => {
          if (!c.collected) {
            const dist = Math.hypot(s.player.x - c.x, s.player.y - c.y, s.player.z - c.z);
            if (dist < 1.2) {
              c.collected = true;
              c.mesh.visible = false;
              s.coins += 1;
              s.score += 50;
              setCoinsCollected(s.coins);
              setScore(s.score);
              playSfx?.('sounds/coin.mp3');
            }
          }
        });

        // Checkpoint Trigger
        if (s.player.z >= 30 && s.player.lastCheckpoint.z < 30) {
          s.player.lastCheckpoint = { x: 0, y: 3.5, z: 30 };
          setCheckpointZ(30);
          playSfx?.('sounds/powerup.mp3');
        }
        if (s.player.z >= 78 && s.player.lastCheckpoint.z < 78) {
          s.player.lastCheckpoint = { x: 0, y: 5.5, z: 78 };
          setCheckpointZ(78);
          playSfx?.('sounds/powerup.mp3');
        }

        // Void Fall Hazard
        if (s.player.y < -12) {
          playSfx?.('sounds/hit.mp3');
          setLives((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              setIsGameOver(true);
              const receipt = calculateAndDepositMissionReward({
                gameId: 'pokiminefun',
                gameTitle: 'MineFun.io 3D Obby',
                durationSeconds: Math.round(s.timeAlive),
                score: s.score + Math.round(s.player.z * 5),
                maxTargetScore: 1000,
                isVictory: false,
                difficulty: 'NORMAL',
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            } else {
              // Respawn at Checkpoint
              s.player.x = s.player.lastCheckpoint.x;
              s.player.y = s.player.lastCheckpoint.y;
              s.player.z = s.player.lastCheckpoint.z;
              s.player.vx = 0;
              s.player.vy = 0;
              s.player.vz = 0;
            }
            return Math.max(0, next);
          });
        }

        // Goal Portal Victory Trigger
        if (s.player.z >= 116 && s.player.y >= 9.5) {
          setIsVictory(true);
          playSfx?.('sounds/victory.mp3');
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokiminefun',
            gameTitle: 'MineFun.io 3D Obby',
            durationSeconds: Math.round(s.timeAlive),
            score: s.score + 500,
            maxTargetScore: 1000,
            isVictory: true,
            difficulty: 'NORMAL',
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          return;
        }

        // Update Mesh & Tracking
        playerGroup.position.set(s.player.x, s.player.y, s.player.z);

        if (Math.hypot(moveX, moveZ) > 0.1) {
          const targetHeading = Math.atan2(moveX, moveZ);
          playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, targetHeading, 0.2);
        }

        // Invulnerable Flash
        if (s.player.invulnerableTimer > 0) {
          s.player.invulnerableTimer -= dt;
          playerGroup.visible = Math.floor(currentTime / 80) % 2 === 0;
        } else {
          playerGroup.visible = true;
        }

        // Camera Smooth Follow
        const camTargetX = s.player.x * 0.6;
        const camTargetY = s.player.y + 4.2;
        const camTargetZ = s.player.z - 7.5;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, 0.15);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, 0.15);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.15);
        camera.lookAt(s.player.x, s.player.y + 1.2, s.player.z + 4.0);

        setDistance(Math.min(totalCourseLength, Math.max(0, Math.round(s.player.z))));
        renderer.render(scene, camera);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, playSfx, onReward]);

  // 4. Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleJump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump]);

  // Touch Handlers for Mobile Pure Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    s.touch.active = true;
    s.touch.startX = touch.clientX;
    s.touch.startY = touch.clientY;
    s.touch.currentX = touch.clientX;
    s.touch.currentY = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    if (s.touch.active) {
      s.touch.currentX = touch.clientX;
      s.touch.currentY = touch.clientY;
    }
  };

  const handleTouchEnd = () => {
    const s = stateRef.current;
    s.touch.active = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'OBBY',
      title: isKo ? '🧱 3D 복셀 파쿠르 오비' : '🧱 3D Voxel Parkour Obby',
      description: isKo
        ? '마인크래프트 스타일의 3D 복셀 블록 위를 정밀하게 점프하며 고공 오비 코스를 정복하세요!'
        : 'Jump across 3D floating voxel blocks in a Minecraft-style parkour obby challenge!',
      keyPoints: isKo
        ? ['발판 사이의 간격을 조절하며 점프', '낙사하지 않도록 주의']
        : ['Control jump timing between blocks', 'Watch out for the void'],
    },
    {
      badge: 'ACTION',
      title: isKo ? '🚀 슬라임 패드 & 특수 블록' : '🚀 Slime Pads & Hazards',
      description: isKo
        ? '연두색 슬라임 패드를 밟으면 초고공 슈퍼점프가 발동됩니다. 붉은 용암 블록은 밟으면 피해를 입으니 피하세요!'
        : 'Step on green slime pads for a massive super jump. Avoid red lava hazard blocks!',
      keyPoints: isKo
        ? ['슬라임 패드로 넓은 협곡 도약', '황금 복셀 코인 수집']
        : ['Use slime pads to clear gaps', 'Collect golden voxel coins'],
    },
    {
      badge: 'GOAL',
      title: isKo ? '🌀 체크포인트 & 결승 포털' : '🌀 Checkpoints & Portal',
      description: isKo
        ? '중간 체크포인트를 통과하면 낙사 시 해당 위치에서 부활합니다. 결승 다이아몬드 포털에 도달하여 승리하세요!'
        : 'Pass checkpoints to save your progress. Reach the final diamond portal to clear!',
      keyPoints: isKo
        ? ['체크포인트 깃발 활성화', '결승 포털 도착 시 대량 SNS 보상']
        : ['Activate save checkpoints', 'Reach final portal for rewards'],
    },
  ];

  return (
    <div
      className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Minimalist Mission HUD */}
      <MinimalistMissionHUD
        gameTitle="MINEFUN.IO 3D OBBY"
        score={score}
        targetScore={1000}
        language={language}
        onExit={() => {
          const s = stateRef.current;
          const currentProgress = s.score + Math.round(s.player.z * 4);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokiminefun',
            gameTitle: 'MineFun.io 3D Obby',
            durationSeconds: Math.round(s.timeAlive),
            score: currentProgress,
            maxTargetScore: 1000,
            isVictory: false,
            difficulty: 'NORMAL',
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          onExit();
        }}
      />

      {/* Top Status HUD */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between text-xs sm:text-sm text-slate-200 pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/80 backdrop-blur-sm">
          <span className="text-emerald-400 font-bold">{distance}m / {totalCourseLength}m</span>
          <span className="text-slate-400">|</span>
          <span className="text-amber-400 font-bold">🪙 {coinsCollected}</span>
          {checkpointZ > 0 && (
            <>
              <span className="text-slate-400">|</span>
              <span className="text-cyan-400 font-bold">🚩 {checkpointZ}m</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/80 backdrop-blur-sm">
          <span className="text-slate-400 text-xs">HP</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-sm ${i < lives ? 'bg-rose-500' : 'bg-slate-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Pure Gesture Guide & Jump Touch Control */}
      <div className="absolute bottom-6 left-4 right-4 flex items-end justify-between pointer-events-none z-20">
        {/* Left: Drag Joystick Hint */}
        <div className="bg-slate-900/80 px-3 py-2 rounded-sm border border-slate-700/80 text-[11px] text-slate-300 backdrop-blur-sm">
          <div className="text-slate-400 font-bold mb-0.5">{isKo ? '🕹️ 이동 제스처' : '🕹️ MOVE'}</div>
          <div>{isKo ? '화면을 터치 & 드래그하세요' : 'Drag screen to steer'}</div>
        </div>

        {/* Right: Big Jump Action Button */}
        <button
          type="button"
          onClick={handleJump}
          className="pointer-events-auto flex flex-col items-center justify-center w-20 h-20 rounded-sm bg-emerald-500 active:bg-emerald-600 text-slate-950 font-black border-2 border-emerald-300 shadow-2xl active:scale-95 transition-transform"
        >
          <span className="text-2xl">🚀</span>
          <span className="text-xs tracking-wider mt-0.5">JUMP</span>
        </button>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isVictory}
          receipt={settlementReceipt}
          language={language}
          onConfirm={() => {
            setIsVictory(false);
            onExit();
          }}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 max-w-sm w-full rounded-sm text-center">
            <div className="text-3xl mb-2">💥</div>
            <h2 className="text-xl font-bold text-rose-500 mb-2">
              {isKo ? '오비에서 낙사했습니다!' : 'Fallen off the Obby!'}
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              {isKo
                ? `도달 거리: ${distance}m / ${totalCourseLength}m`
                : `Reached: ${distance}m / ${totalCourseLength}m`}
            </p>
            {settlementReceipt && (
              <div className="bg-slate-800/80 p-3 rounded-sm border border-slate-700 mb-4 text-xs text-slate-300">
                <div className="text-slate-400 mb-1">{isKo ? '파쿠르 진행 보상' : 'Parkour Reward'}</div>
                <div className="text-base font-bold text-amber-400">
                  +{settlementReceipt.totalSns} SNS
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onExit}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-sm border border-slate-600 text-sm"
            >
              {isKo ? '미션 목록으로' : 'Back to Missions'}
            </button>
          </div>
        </div>
      )}

      {/* Universal Tutorial Modal */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        steps={tutorialSteps}
        language={language}
        onClose={() => {
          setShowTutorial(false);
          try {
            localStorage.setItem('hero_tutorial_minefun_v2', 'true');
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
};

export default PokiMineFunGame;

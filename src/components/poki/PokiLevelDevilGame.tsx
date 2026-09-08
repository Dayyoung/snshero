import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiLevelDevilGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;

  onBack?: () => void;
  onClose?: () => void;
}

interface BlockData {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  w: number;
  h: number;
  isCrumbling?: boolean;
  isTriggered?: boolean;
  fallTimer?: number;
  fallSpeed?: number;
}

interface SpikeData {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  targetY: number;
  initialY: number;
  triggerX: number;
  isPopped: boolean;
}

export const PokiLevelDevilGame: React.FC<PokiLevelDevilGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
  onBack,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 5;
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [stage, setStage] = useState<number>(1);
  const totalStages = 4;
  const [deaths, setDeaths] = useState<number>(0);
  const [isControlsInverted, setIsControlsInverted] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // Mobile Touch Steer Visual Indicator (-1 ~ +1)
  const [touchSteerVal, setTouchSteerVal] = useState<number>(0);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_leveldevil_v2') !== 'true';
    } catch {
      return true;
    }
  });

  // Three.js References
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    playerGroup: THREE.Group | null;
    playerMesh: THREE.Mesh | null;
    doorGroup: THREE.Group | null;
    blocks: BlockData[];
    spikes: SpikeData[];
  }>({
    renderer: null,
    scene: null,
    camera: null,
    playerGroup: null,
    playerMesh: null,
    doorGroup: null,
    blocks: [],
    spikes: [],
  });

  // Gameplay Physics State
  const stateRef = useRef({
    player: {
      x: -12,
      y: 1.5,
      vx: 0,
      vy: 0,
      isGrounded: false,
      isDead: false,
      deathTimer: 0,
    },
    door: {
      x: 12,
      y: 1.5,
      targetX: 12,
      targetY: 1.5,
      hasEscaped: false,
      escapeCount: 0,
    },
    keys: {
      left: false,
      right: false,
    },
    touch: {
      active: false,
      startX: 0,
      currentX: 0,
    },
    blocks: [] as BlockData[],
    spikes: [] as SpikeData[],
    stageConfig: {
      inverted: false,
      titleKo: '',
      titleEn: '',
    },
    timeAlive: 0,
  });

  // Sound Synthesizer
  const playTone = useCallback((freq: number, dur: number, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // ignore
    }
  }, []);

  // 1. Jump Action
  const handleJump = useCallback(() => {
    const s = stateRef.current;
    if (s.player.isGrounded && !s.player.isDead && !isGameOver && !isVictory) {
      s.player.vy = 12.5;
      s.player.isGrounded = false;
      playTone(480, 0.1, 'square');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  }, [isGameOver, isVictory, playTone]);

  // 2. Kill and Respawn Player
  const killPlayer = useCallback(() => {
    const s = stateRef.current;
    if (s.player.isDead) return;

    s.player.isDead = true;
    s.player.deathTimer = 0.5; // 0.5s rapid respawn
    playTone(180, 0.4, 'sawtooth');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setDeaths((prev) => prev + 1);
  }, [playTone]);

  // 3. Setup Stage Blocks and Traps
  const setupStage = useCallback((stageNum: number) => {
    const { scene } = threeRef.current;
    const s = stateRef.current;
    if (!scene) return;

    // Clear old stage blocks and spikes
    s.blocks.forEach((b) => scene.remove(b.mesh));
    s.spikes.forEach((sp) => scene.remove(sp.mesh));
    s.blocks = [];
    s.spikes = [];

    // Reset Player
    s.player.x = -12;
    s.player.y = 1.8;
    s.player.vx = 0;
    s.player.vy = 0;
    s.player.isGrounded = false;
    s.player.isDead = false;

    // Reset Door
    s.door.x = 12;
    s.door.y = 1.5;
    s.door.targetX = 12;
    s.door.targetY = 1.5;
    s.door.hasEscaped = false;
    s.door.escapeCount = 0;

    const blockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.2 });
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, emissive: 0x991b1b });

    const addBlock = (x: number, y: number, w: number, h: number, isCrumbling = false) => {
      const geo = new THREE.BoxGeometry(w, h, 2.0);
      const mesh = new THREE.Mesh(geo, blockMat);
      mesh.position.set(x, y, 0);
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);
      s.blocks.push({ mesh, x, y, w, h, isCrumbling, isTriggered: false, fallTimer: 0, fallSpeed: 0 });
    };

    const addSpike = (x: number, y: number, triggerX: number, hidden = false) => {
      const geo = new THREE.ConeGeometry(0.4, 0.8, 4);
      const mesh = new THREE.Mesh(geo, spikeMat);
      mesh.position.set(x, hidden ? y - 1.2 : y, 0);
      mesh.castShadow = !lowSpecMode;
      scene.add(mesh);
      s.spikes.push({
        mesh,
        x,
        y,
        targetY: y,
        initialY: hidden ? y - 1.2 : y,
        triggerX,
        isPopped: !hidden,
      });
    };

    // Stage Specific Designs
    if (stageNum === 1) {
      // Stage 1: Warmup & The Escaping Door
      s.stageConfig.inverted = false;
      setIsControlsInverted(false);

      // Start Island
      addBlock(-12, 0, 5, 1.2);
      // Mid Island
      addBlock(-4, 0.5, 4, 1.2);
      // Gap with Hidden Spike
      addSpike(-2, 0.4, -3.5, true); // Pops up when approaching
      // Pre-Goal Island
      addBlock(4, 0.5, 5, 1.2);
      // Goal Island
      addBlock(12, 0, 5, 1.2);
    } else if (stageNum === 2) {
      // Stage 2: Crumbling Floor & Falling Roof
      s.stageConfig.inverted = false;
      setIsControlsInverted(false);

      addBlock(-12, 0, 4, 1.2);
      // Crumbling steps
      addBlock(-6, 0.5, 2.5, 1.0, true);
      addBlock(-1, 0.5, 2.5, 1.0, true);
      addBlock(4, 0.5, 2.5, 1.0, true);
      // Goal Island
      addBlock(12, 0, 4, 1.2);
      // Spikes below the crumble
      addSpike(-6, -3.0, -99);
      addSpike(-1, -3.0, -99);
      addSpike(4, -3.0, -99);
    } else if (stageNum === 3) {
      // Stage 3: INVERTED CONTROLS (Left is Right, Right is Left!)
      s.stageConfig.inverted = true;
      setIsControlsInverted(true);

      addBlock(-12, 0, 4, 1.2);
      addBlock(-5, 0, 3, 1.2);
      addSpike(-1, 0.4, -3.0, true);
      addBlock(2, 0, 3, 1.2);
      addBlock(8, 0, 3, 1.2);
      addBlock(13, 0, 4, 1.2);
    } else {
      // Stage 4: THE DEVIL'S GAUNTLET (Full Troll Madness)
      s.stageConfig.inverted = false;
      setIsControlsInverted(false);

      addBlock(-12, 0, 4, 1.2);
      addBlock(-6, 1.0, 2.5, 1.0, true);
      addSpike(-3.5, 0.4, -5.0, true);
      addBlock(0, 1.5, 3.0, 1.0);
      addBlock(6, 2.0, 2.5, 1.0, true);
      addSpike(8.5, 1.4, 7.0, true);
      addBlock(12, 0.5, 5, 1.2);
    }
  }, [lowSpecMode]);

  // 4. Three.js Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialW = container.clientWidth || window.innerWidth;
    const initialH = container.clientHeight || window.innerHeight;

    // Scene & Dark Atmospheric Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3dbfc); // Deep demon slate
    scene.fog = new THREE.FogExp2(0xe3dbfc, 0.02);

    // Camera: 2.5D/3D Angled Perspective View
    const camera = new THREE.PerspectiveCamera(48, initialW / initialH, 0.1, 1000);
    camera.position.set(0, 3.5, 23);
    camera.lookAt(0, 1.0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(initialW, initialH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff1f2, 1.2);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // Player 3D Devil Cubie Group
    const playerGroup = new THREE.Group();
    const pBodyMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Bright Devil Yellow
      roughness: 0.3,
      metalness: 0.1,
    });
    const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), pBodyMat);
    playerMesh.castShadow = !lowSpecMode;
    playerGroup.add(playerMesh);

    // Devil Eyes & Horns
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.1), eyeMat);
    eyeL.position.set(-0.22, 0.1, 0.46);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.1), eyeMat);
    eyeR.position.set(0.22, 0.1, 0.46);
    playerGroup.add(eyeL, eyeR);

    // Little Devil Horns
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const hornGeo = new THREE.ConeGeometry(0.15, 0.35, 4);
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.3, 0.55, 0);
    hornL.rotation.z = 0.3;
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.3, 0.55, 0);
    hornR.rotation.z = -0.3;
    playerGroup.add(hornL, hornR);

    // Hero No.05 Card Sprite Badge
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
      bCtx.strokeStyle = '#facc15';
      bCtx.stroke();
      drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTexture }));
    badgeSprite.position.set(0, 1.4, 0);
    badgeSprite.scale.set(0.9, 0.9, 0.9);
    playerGroup.add(badgeSprite);

    scene.add(playerGroup);

    // Exit Door Group
    const doorGroup = new THREE.Group();
    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.3), frameMat);
    doorGroup.add(frame);
    // Door Portal Interior
    const portalMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.0), portalMat);
    portal.position.z = 0.16;
    doorGroup.add(portal);

    doorGroup.position.set(12, 1.5, 0);
    scene.add(doorGroup);

    threeRef.current = {
      renderer,
      scene,
      camera,
      playerGroup,
      playerMesh,
      doorGroup,
      blocks: [],
      spikes: [],
    };

    // Mobile Viewport Synchronization
    const updateSize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    };

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', () => setTimeout(updateSize, 100));

    setupStage(1);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, playerHeroId, setupStage]);

  // 5. Physics & Animation Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.08);
      lastTime = currentTime;

      const { renderer, scene, camera, playerGroup, playerMesh, doorGroup } = threeRef.current;
      const s = stateRef.current;

      if (renderer && scene && camera && playerGroup && !isGameOver && !isVictory) {
        s.timeAlive += dt;

        // Death & Rapid Respawn Handle
        if (s.player.isDead) {
          s.player.deathTimer -= dt;
          playerGroup.visible = Math.floor(currentTime / 60) % 2 === 0;

          if (s.player.deathTimer <= 0) {
            // Respawn
            s.player.isDead = false;
            s.player.x = -12;
            s.player.y = 1.8;
            s.player.vx = 0;
            s.player.vy = 0;
            playerGroup.visible = true;

            // Reset crumbling blocks
            s.blocks.forEach((b) => {
              b.isTriggered = false;
              b.fallSpeed = 0;
              b.mesh.position.y = b.y;
            });
            // Reset pop spikes
            s.spikes.forEach((sp) => {
              sp.isPopped = false;
              sp.mesh.position.y = sp.initialY;
            });
            // Reset door
            s.door.x = 12;
            s.door.y = 1.5;
            s.door.targetX = 12;
            s.door.targetY = 1.5;
            s.door.hasEscaped = false;
            s.door.escapeCount = 0;
          }
        } else {
          // Controls Input
          let moveDir = 0;
          if (s.keys.left) moveDir -= 1;
          if (s.keys.right) moveDir += 1;

          if (s.touch.active) {
            const diffX = s.touch.currentX - s.touch.startX;
            if (Math.abs(diffX) > 10) {
              moveDir = diffX > 0 ? 1 : -1;
            }
          }

          // Inverted Controls Stage Check
          if (s.stageConfig.inverted) {
            moveDir = -moveDir;
          }

          const moveSpeed = 6.2;
          s.player.vx = THREE.MathUtils.lerp(s.player.vx, moveDir * moveSpeed, 0.2);

          // Gravity
          const gravity = -30.0;
          s.player.vy += gravity * dt;

          const nextX = s.player.x + s.player.vx * dt;
          const nextY = s.player.y + s.player.vy * dt;

          s.player.x = nextX;
          s.player.isGrounded = false;

          // Block Collisions
          const pHalfW = 0.45;
          const pHalfH = 0.45;

          for (const b of s.blocks) {
            // Crumbling drop
            if (b.isTriggered) {
              b.fallSpeed = (b.fallSpeed || 0) + 20 * dt;
              b.mesh.position.y -= b.fallSpeed * dt;
            }

            const currentBlockY = b.mesh.position.y;
            const bMinX = b.x - b.w / 2;
            const bMaxX = b.x + b.w / 2;
            const bTop = currentBlockY + b.h / 2;

            if (s.player.x + pHalfW >= bMinX && s.player.x - pHalfW <= bMaxX) {
              if (s.player.y - pHalfH >= bTop - 0.2 && nextY - pHalfH <= bTop + 0.3 && s.player.vy <= 0) {
                s.player.y = bTop + pHalfH;
                s.player.vy = 0;
                s.player.isGrounded = true;

                if (b.isCrumbling && !b.isTriggered) {
                  b.isTriggered = true;
                  playTone(320, 0.15, 'triangle');
                }
                break;
              }
            }
          }

          if (!s.player.isGrounded) {
            s.player.y += s.player.vy * dt;
          }

          // Trigger Hidden Pop-up Spikes
          s.spikes.forEach((sp) => {
            if (!sp.isPopped && Math.abs(s.player.x - sp.triggerX) < 1.8) {
              sp.isPopped = true;
              playTone(600, 0.1, 'sawtooth');
            }

            if (sp.isPopped) {
              sp.mesh.position.y = THREE.MathUtils.lerp(sp.mesh.position.y, sp.targetY, 0.25);
            }

            // Spike Collision
            const dist = Math.hypot(s.player.x - sp.x, s.player.y - sp.mesh.position.y);
            if (dist < 0.65) {
              killPlayer();
            }
          });

          // Void Fall
          if (s.player.y < -8) {
            killPlayer();
          }

          // The Troll Escaping Door Gimmick!
          const distToDoor = Math.hypot(s.player.x - s.door.x, s.player.y - s.door.y);
          if (stage === 1 && distToDoor < 3.2 && !s.door.hasEscaped) {
            // Door leaps upward!
            s.door.hasEscaped = true;
            s.door.targetY = 4.5;
            playTone(800, 0.2, 'square');
          } else if (stage === 3 && distToDoor < 3.0 && s.door.escapeCount < 1) {
            // Door dodges to the left
            s.door.escapeCount++;
            s.door.targetX = 2.0;
            s.door.targetY = 1.5;
            playTone(850, 0.2, 'square');
          } else if (stage === 4 && distToDoor < 3.0 && s.door.escapeCount < 2) {
            s.door.escapeCount++;
            if (s.door.escapeCount === 1) {
              s.door.targetX = 0;
              s.door.targetY = 3.0;
            } else {
              s.door.targetX = 12;
              s.door.targetY = 2.0;
            }
            playTone(900, 0.2, 'square');
          }

          // Smooth Door Movement
          s.door.x = THREE.MathUtils.lerp(s.door.x, s.door.targetX, 0.12);
          s.door.y = THREE.MathUtils.lerp(s.door.y, s.door.targetY, 0.12);
          if (doorGroup) {
            doorGroup.position.set(s.door.x, s.door.y, 0);
          }

          // Reach Door -> Stage Clear!
          if (distToDoor < 1.0) {
            playTone(990, 0.4, 'sine');
            if (stage < totalStages) {
              setStage((st) => st + 1);
              setScore((sc) => sc + 250);
              setupStage(stage + 1);
            } else {
              // Full Victory!
              setIsVictory(true);
              const receipt = calculateAndDepositMissionReward({
                gameId: 'pokileveldevil',
                gameTitle: 'Level Devil 3D',
                durationSeconds: Math.round(s.timeAlive),
                score: score + 500,
                maxTargetScore: 1000,
                isVictory: true,
                difficulty: 'HARD',
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }

          // Squish and Stretch Animation
          if (playerMesh) {
            const stretchY = 1.0 + (s.player.vy > 0 ? 0.2 : s.player.isGrounded ? -0.1 : 0);
            playerMesh.scale.set(1.0 / Math.sqrt(stretchY), stretchY, 1.0);
          }

          playerGroup.position.set(s.player.x, s.player.y, 0);
        }

        // Camera Soft Follow
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, s.player.x * 0.4, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, Math.max(2.0, s.player.y * 0.3 + 2.5), 0.08);
        camera.lookAt(camera.position.x, camera.position.y - 1.0, 0);

        renderer.render(scene, camera);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, playTone, killPlayer, stage, totalStages, score, setupStage, onReward]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleJump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
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

  // Mobile Touch Steer Zone Handlers
  const handleSteerTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    s.touch.active = true;
    s.touch.startX = touch.clientX;
    s.touch.currentX = touch.clientX;
  };

  const handleSteerTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    if (s.touch.active) {
      s.touch.currentX = touch.clientX;
      const diffX = s.touch.currentX - s.touch.startX;
      const clamped = Math.max(-50, Math.min(50, diffX));
      setTouchSteerVal(clamped / 50);

      if (diffX < -10) {
        s.keys.left = true;
        s.keys.right = false;
      } else if (diffX > 10) {
        s.keys.right = true;
        s.keys.left = false;
      } else {
        s.keys.left = false;
        s.keys.right = false;
      }
    }
  };

  const handleSteerTouchEnd = () => {
    const s = stateRef.current;
    s.touch.active = false;
    s.keys.left = false;
    s.keys.right = false;
    setTouchSteerVal(0);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'TROLL',
      title: isKo ? '😈 방심은 금물! 트롤 플랫포머' : '😈 Beware the Troll Platformer',
      description: isKo
        ? '목표는 단순합니다. 레벨 끝에 있는 출구 문에 도달하세요! 하지만 모든 발판과 가시를 의심해야 합니다.'
        : 'The goal is simple: Reach the exit door! But trust nothing—floors crumble and spikes pop out!',
      keyPoints: isKo
        ? ['무너지는 발판 빠르게 통과', '기습 솟구치는 붉은 가시 조심']
        : ['Cross crumbling blocks quickly', 'Watch for sudden popping spikes'],
    },
    {
      badge: 'INVERT',
      title: isKo ? '🔄 반전 조작 & 도망치는 문' : '🔄 Inverted Controls & Escaping Door',
      description: isKo
        ? '문 앞에 도착하면 문이 위나 옆으로 도망칠 수 있습니다! 스테이지 3에서는 좌우 조작이 반대로 뒤바뀝니다.'
        : 'The door may jump away when approached! Stage 3 inverts your left/right controls!',
      keyPoints: isKo
        ? ['문이 도망치면 끈질기게 추적', '반전 조작 시 침착하게 반대로 이동']
        : ['Chase down the fleeing door', 'Adapt to inverted steering'],
    },
    {
      badge: 'RESPAWN',
      title: isKo ? '⚡ 0초 즉시 부활 시스템' : '⚡ Instant Respawn',
      description: isKo
        ? '함정에 걸려 죽어도 0.5초 만에 즉각 부활합니다! 함정의 위치를 학습하며 끝까지 탈출하세요.'
        : 'Death respawns you in 0.5s! Learn the trap triggers and conquer all 4 stages!',
      keyPoints: isKo
        ? ['죽음을 두려워 말고 도전', '4개 스테이지 클리어 시 승리']
        : ['No penalty for deaths', 'Clear all 4 stages to win'],
    },
  ];

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#e3dbfc] overflow-hidden font-mono select-none touch-none">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Minimalist Mission HUD */}
      <MinimalistMissionHUD
        gameTitle="LEVEL DEVIL 3D"
        score={score}
        targetScore={1000}
        language={language}
        onExit={() => {
          const s = stateRef.current;
          const currentProgress = (stage - 1) * 250 + Math.max(0, 100 - deaths * 10);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokileveldevil',
            gameTitle: 'Level Devil 3D',
            durationSeconds: Math.round(s.timeAlive),
            score: currentProgress,
            maxTargetScore: 1000,
            isVictory: false,
            difficulty: 'HARD',
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          onExit();
        }}
      />

      {/* Top Status Panel: Stage, Deaths, Inverted Indicator */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between text-xs sm:text-sm text-slate-200 pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-slate-900/85 px-3 py-1.5 rounded-sm border border-slate-700/80 backdrop-blur-md shadow-md">
          <span className="text-amber-400 font-bold">LEVEL {stage}/{totalStages}</span>
          <span className="text-slate-400">|</span>
          <span className="text-rose-400 font-bold">💀 {deaths} DEATHS</span>
        </div>

        {isControlsInverted && (
          <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/80 px-3 py-1.5 rounded-sm text-rose-300 font-bold text-xs animate-pulse shadow-md">
            <span>⚠️</span>
            <span>{isKo ? '조작 반전! [LEFT ↔ RIGHT]' : 'CONTROLS INVERTED!'}</span>
          </div>
        )}
      </div>

      {/* 100% Mobile Touch Controls */}
      <div className="absolute inset-0 pointer-events-none z-20 flex">
        {/* Left 50% Touch Steer Pad */}
        <div
          className="w-1/2 h-full pointer-events-auto flex items-end p-6"
          onTouchStart={handleSteerTouchStart}
          onTouchMove={handleSteerTouchMove}
          onTouchEnd={handleSteerTouchEnd}
        >
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-sm p-3 flex flex-col items-center gap-2 shadow-xl">
            <div className="text-[10px] text-slate-400 font-bold tracking-wider">
              {isKo ? '◀ 좌우 슬라이드 이동 ▶' : '◀ SLIDE TO MOVE ▶'}
            </div>
            <div className="w-28 h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
              <div
                className="absolute top-0 bottom-0 w-6 bg-amber-400 rounded-full transition-all duration-75"
                style={{
                  left: `${50 + touchSteerVal * 40}%`,
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right 50% Giant Jump Action Button */}
        <div className="w-1/2 h-full pointer-events-none flex flex-col justify-end items-end p-6">
          <button
            type="button"
            onClick={handleJump}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleJump();
            }}
            className="pointer-events-auto w-24 h-24 rounded-sm bg-amber-500 active:bg-amber-600 text-slate-950 font-black border-2 border-amber-300 shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer"
          >
            <span className="text-3xl">🦘</span>
            <span className="text-xs tracking-wider mt-1 font-mono">JUMP</span>
          </button>
        </div>
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

      {/* Universal Tutorial Modal */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        steps={tutorialSteps}
        language={language}
        onClose={() => {
          setShowTutorial(false);
          try {
            localStorage.setItem('hero_tutorial_leveldevil_v2', 'true');
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
};

export default PokiLevelDevilGame;

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMonkeyTagGameProps {
  deck?: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  handleExit?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number | string;
  onReward?: (amount: number) => void;

  onExit?: () => void;
}

interface Platform {
  mesh: THREE.Mesh;
  box: THREE.Box3;
  topY: number;
}

interface JumpPad {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
}

interface BananaItem {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  collected: boolean;
}

interface MonkeyEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  group: THREE.Group;
  torsoMesh: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  facingAngle: number;
  isTagger: boolean;
  isGrounded: boolean;
  color: number;
  tagImmunityTimer: number;
}

export const PokiMonkeyTagGame: React.FC<PokiMonkeyTagGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onBack,
  onClose,
  cardId,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const playerHeroId = (cardId ? Number(cardId) : deck[0]?.id) || 14;
  const containerRef = useRef<HTMLDivElement>(null);

  // HUD & Game States
  const [score, setScore] = useState<number>(0);
  const [isPlayerTagger, setIsPlayerTagger] = useState<boolean>(false);
  const [tagCount, setTagCount] = useState<number>(0);
  const [survivalSec, setSurvivalSec] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Dynamic Floating Joystick state
  const [joystickActive, setJoystickActive] = useState<boolean>(false);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_monkey_tag') !== 'true';
    } catch {
      return true;
    }
  });

  const gameStateRef = useRef({
    score: 0,
    tags: 0,
    survival: 0,
    isGameOver: false,
    isVictory: false,
    speedBoostTimer: 0,
  });

  const playerControlRef = useRef({
    moveInput: { x: 0, z: 0 },
    jumpRequested: false,
  });

  const touchControlRef = useRef({
    touchId: null as number | null,
    startX: 0,
    startY: 0,
  });

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    monkeys: MonkeyEntity[];
    platforms: Platform[];
    jumpPads: JumpPad[];
    bananas: BananaItem[];
  } | null>(null);

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }, []);

  // End Game and Settle Rewards
  const handleGameOver = useCallback((victory: boolean) => {
    if (gameStateRef.current.isGameOver) return;
    gameStateRef.current.isGameOver = true;
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = gameStateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimonkeytag',
      gameTitle: isKo ? '몽키 태그 3D' : 'Monkey Tag 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
    });

    setSettlementReceipt(receipt);
    if (onReward) { onReward(receipt.totalSns); }
  }, [isKo, onReward, timeLeft]);

  // Back button confirmation & settlement
  const handleBackRequest = useCallback(() => {
    if (isGameOver || isVictory) {
      handleExit();
      return;
    }
    setShowExitConfirm(true);
  }, [isGameOver, isVictory, handleExit]);

  const confirmExitAndSettle = useCallback(() => {
    setShowExitConfirm(false);
    const finalScore = gameStateRef.current.score;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimonkeytag',
      gameTitle: isKo ? '몽키 태그 3D' : 'Monkey Tag 3D',
      durationSeconds: Math.max(1, 60 - timeLeft),
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: false,
      difficulty: 'NORMAL',
    });
    
    if (onReward) { onReward(receipt.totalSns); }
    handleExit();
  
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hero-return-to-missions"));}, [isKo, handleExit, onReward, timeLeft]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Jump Action
  const doJump = useCallback(() => {
    playerControlRef.current.jumpRequested = true;
    triggerHaptic(20);
    if (playSfx) playSfx('/sfx/jump.mp3');
  }, [lowSpecMode, playerHeroId]);

  // Tag / Swipe Action
  const doTagSwipe = useCallback(() => {
    const sc = sceneRef.current;
    if (!sc) return;
    const player = sc.monkeys.find(m => m.isPlayer);
    if (!player || !player.isTagger) return;

    // Find closest bot
    let closestBot: MonkeyEntity | null = null;
    let minDist = 3.5;
    sc.monkeys.forEach(bot => {
      if (!bot.isPlayer && !bot.isTagger && bot.tagImmunityTimer <= 0) {
        const d = player.pos.distanceTo(bot.pos);
        if (d < minDist) {
          minDist = d;
          closestBot = bot;
        }
      }
    });

    if (closestBot) {
      // Successful tag!
      player.isTagger = false;
      player.tagImmunityTimer = 2.5;
      (closestBot as MonkeyEntity).isTagger = true;
      (closestBot as MonkeyEntity).tagImmunityTimer = 2.5;

      // Update materials
      (player.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0x854d0e);
      ((closestBot as MonkeyEntity).torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0xef4444);

      gameStateRef.current.tags += 1;
      gameStateRef.current.score += 250;
      setTagCount(gameStateRef.current.tags);
      setScore(gameStateRef.current.score);
      setIsPlayerTagger(false);

      triggerHaptic([40, 30, 60]);
      if (playSfx) playSfx('/sfx/hit.mp3');
    }
  }, [lowSpecMode, playerHeroId]);

  // Main Three.js Engine Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc7f2d6);
    scene.fog = new THREE.FogExp2(0xc7f2d6, 0.015);

    // 2. Camera: 3rd Person High Angle Quarter View
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 150);
    camera.position.set(0, 18, 20);
    camera.lookAt(0, 2, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !lowSpecMode,
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1.0 : 1.5));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xdcfce7, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.7);
    dirLight.position.set(16, 32, 16);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // 5. Jungle Ground Floor (32m x 28m)
    const floorGeo = new THREE.PlaneGeometry(32, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // Deep Jungle Grass
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // Perimeter Wooden Fence Posts
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    for (let x = -15; x <= 15; x += 3) {
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.2, 8), fenceMat);
      p1.position.set(x, 1.1, -13.5);
      scene.add(p1);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.2, 8), fenceMat);
      p2.position.set(x, 1.1, 13.5);
      scene.add(p2);
    }
    for (let z = -13; z <= 13; z += 3) {
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.2, 8), fenceMat);
      p1.position.set(-15.5, 1.1, z);
      scene.add(p1);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.2, 8), fenceMat);
      p2.position.set(15.5, 1.1, z);
      scene.add(p2);
    }

    // 6. Jungle Platforms (Central Tree Tower & Floating Decks)
    const platforms: Platform[] = [];
    const jumpPads: JumpPad[] = [];
    const bananas: BananaItem[] = [];

    const addPlat = (x: number, y: number, z: number, w: number, h: number, d: number, color = 0x854d0e) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      platforms.push({ mesh, box, topY: y + h / 2 });
    };

    // Central Giant Tree & Tower (2nd floor deck)
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.2, 5.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 })
    );
    trunk.position.set(0, 2.75, 0);
    scene.add(trunk);
    // Central 2nd Floor Deck (8m x 8m at Y = 4.2)
    addPlat(0, 4.2, 0, 8.5, 0.6, 8.5, 0xa16207);

    // 4 Corner Wooden Platforms (Y = 2.8)
    addPlat(-9.5, 2.8, -8, 5.5, 0.5, 5.5, 0x854d0e);
    addPlat(9.5, 2.8, -8, 5.5, 0.5, 5.5, 0x854d0e);
    addPlat(-9.5, 2.8, 8, 5.5, 0.5, 5.5, 0x854d0e);
    addPlat(9.5, 2.8, 8, 5.5, 0.5, 5.5, 0x854d0e);

    // 4 Super Jump Pads (Green Bouncers)
    const spawnJumpPad = (x: number, z: number) => {
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.4, 0.35, 16),
        new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x15803d,
          emissiveIntensity: 0.5,
        })
      );
      pad.position.set(x, 0.18, z);
      scene.add(pad);
      jumpPads.push({ mesh: pad, pos: pad.position });
    };
    spawnJumpPad(-5.5, -4.5);
    spawnJumpPad(5.5, -4.5);
    spawnJumpPad(-5.5, 4.5);
    spawnJumpPad(5.5, 4.5);

    // 15 Golden Bananas
    const spawnBanana = (x: number, y: number, z: number) => {
      const bMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.12, 8, 16, Math.PI * 0.7),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xeab308,
          emissiveIntensity: 0.6,
          roughness: 0.2,
        })
      );
      bMesh.rotation.z = Math.PI * 0.25;
      bMesh.position.set(x, y, z);
      scene.add(bMesh);
      bananas.push({ mesh: bMesh, pos: bMesh.position, collected: false });
    };
    // Bananas on central tower & ground
    spawnBanana(0, 5.5, 0);
    spawnBanana(-2.5, 5.5, -2.5);
    spawnBanana(2.5, 5.5, -2.5);
    spawnBanana(-2.5, 5.5, 2.5);
    spawnBanana(2.5, 5.5, 2.5);
    spawnBanana(-9.5, 4.0, -8);
    spawnBanana(9.5, 4.0, -8);
    spawnBanana(-9.5, 4.0, 8);
    spawnBanana(9.5, 4.0, 8);
    spawnBanana(0, 0.8, -9);
    spawnBanana(0, 0.8, 9);
    spawnBanana(-12, 0.8, 0);
    spawnBanana(12, 0.8, 0);
    spawnBanana(-6, 0.8, -10);
    spawnBanana(6, 0.8, 10);

    // 7. 3D Monkey Character Creation Helper
    const monkeys: MonkeyEntity[] = [];

    const createMonkey = (
      id: string,
      name: string,
      isPlayer: boolean,
      isTagger: boolean,
      startX: number,
      startZ: number,
      color: number
    ): MonkeyEntity => {
      const group = new THREE.Group();

      // Torso with Hero badge
      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.width = 128;
      badgeCanvas.height = 128;
      const bCtx = badgeCanvas.getContext('2d');
      if (bCtx && isPlayer) {
        bCtx.fillStyle = '#854d0e';
        bCtx.fillRect(0, 0, 128, 128);
        drawCardSprite(bCtx, playerHeroId, 16, 16, 96, 96);
      }
      const badgeTexture = isPlayer ? new THREE.CanvasTexture(badgeCanvas) : null;

      const torsoGeo = new THREE.BoxGeometry(0.95, 1.1, 0.6);
      const torsoMat = new THREE.MeshStandardMaterial({
        color: isTagger ? 0xef4444 : color,
        roughness: 0.5,
        map: badgeTexture || undefined,
        emissive: isTagger ? 0x991b1b : 0x000000,
        emissiveIntensity: isTagger ? 0.6 : 0,
      });
      const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
      torsoMesh.position.y = 0.55;
      torsoMesh.castShadow = !lowSpecMode;
      group.add(torsoMesh);

      // Head
      const headGeo = new THREE.SphereGeometry(0.48, 14, 14);
      const headMat = new THREE.MeshStandardMaterial({ color: isTagger ? 0xf87171 : color, roughness: 0.4 });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 1.45;
      headMesh.castShadow = !lowSpecMode;
      group.add(headMesh);

      // Monkey Ears
      const earMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
      const leftEar = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), earMat);
      leftEar.position.set(-0.52, 1.5, 0);
      group.add(leftEar);
      const rightEar = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), earMat);
      rightEar.position.set(0.52, 1.5, 0);
      group.add(rightEar);

      // Long Gorilla Arms
      const limbMat = new THREE.MeshStandardMaterial({ color: isTagger ? 0xdc2626 : color });
      const armGeo = new THREE.CylinderGeometry(0.18, 0.16, 1.25, 10);
      const legGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.9, 10);

      const leftArm = new THREE.Mesh(armGeo, limbMat);
      leftArm.position.set(-0.75, 0.5, 0);
      group.add(leftArm);
      const rightArm = new THREE.Mesh(armGeo, limbMat);
      rightArm.position.set(0.75, 0.5, 0);
      group.add(rightArm);

      const leftLeg = new THREE.Mesh(legGeo, limbMat);
      leftLeg.position.set(-0.3, -0.4, 0);
      group.add(leftLeg);
      const rightLeg = new THREE.Mesh(legGeo, limbMat);
      rightLeg.position.set(0.3, -0.4, 0);
      group.add(rightLeg);

      // Monkey Tail
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.06, 1.2, 8),
        limbMat
      );
      tail.rotation.x = Math.PI * 0.35;
      tail.position.set(0, 0.2, 0.55);
      group.add(tail);

      const spawnPos = new THREE.Vector3(startX, 0.9, startZ);
      group.position.copy(spawnPos);
      scene.add(group);

      return {
        id,
        name,
        isPlayer,
        group,
        torsoMesh,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        pos: spawnPos,
        vel: new THREE.Vector3(0, 0, 0),
        facingAngle: 0,
        isTagger,
        isGrounded: true,
        color,
        tagImmunityTimer: 0,
      };
    };

    // 1 Player (Survivor start) + 3 Bots (Kong is initial Tagger)
    monkeys.push(createMonkey('player', 'You', true, false, 0, 8, 0x854d0e));
    monkeys.push(createMonkey('bot_1', 'Kong', false, true, 0, -8, 0x9333ea)); // Initial Lava Tagger
    monkeys.push(createMonkey('bot_2', 'Cheetah', false, false, -10, 0, 0xeab308));
    monkeys.push(createMonkey('bot_3', 'Bono', false, false, 10, 0, 0x64748b));

    sceneRef.current = {
      scene,
      camera,
      renderer,
      monkeys,
      platforms,
      jumpPads,
      bananas,
    };

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    window.addEventListener('orientationchange', handleResize);

    // 9. Keyboard Listeners
    const keyMap = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false, a: false, d: false };
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keyMap.hasOwnProperty(k) || keyMap.hasOwnProperty(e.key)) {
        keyMap[k as keyof typeof keyMap] = true;
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        doJump();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keyMap.hasOwnProperty(k) || keyMap.hasOwnProperty(e.key)) {
        keyMap[k as keyof typeof keyMap] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 10. Main Animation & Physics Loop
    let lastTime = performance.now();
    let animId = 0;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const sc = sceneRef.current;
      if (!sc) return;

      const gs = gameStateRef.current;
      const player = sc.monkeys.find(m => m.isPlayer);
      if (!player) return;

      // Speed boost timer
      if (gs.speedBoostTimer > 0) gs.speedBoostTimer -= dt;

      // Rotate Bananas
      sc.bananas.forEach(b => {
        if (!b.collected) {
          b.mesh.rotation.y += dt * 3.5;
        }
      });

      // Update Survival Sec & Score
      if (!gs.isGameOver) {
        if (!player.isTagger) {
          gs.survival += dt;
          gs.score += Math.round(dt * 20);
          setSurvivalSec(Math.round(gs.survival));
          setScore(gs.score);
        }
      }

      // Process All Monkeys Physics & AI
      sc.monkeys.forEach(m => {
        if (m.tagImmunityTimer > 0) m.tagImmunityTimer -= dt;

        let inputX = 0;
        let inputZ = 0;
        let jump = false;

        if (m.isPlayer) {
          // Keyboard Input (Screen Relative: A -> -X, D -> +X, W -> -Z, S -> +Z)
          if (keyMap['a'] || keyMap['ArrowLeft']) inputX -= 1;
          if (keyMap['d'] || keyMap['ArrowRight']) inputX += 1;
          if (keyMap['w'] || keyMap['ArrowUp']) inputZ -= 1;
          if (keyMap['s'] || keyMap['ArrowDown']) inputZ += 1;

          // Touch Joystick Input
          inputX += playerControlRef.current.moveInput.x;
          inputZ += playerControlRef.current.moveInput.z;

          if (playerControlRef.current.jumpRequested) {
            jump = true;
            playerControlRef.current.jumpRequested = false;
          }
        } else {
          // --- AI Logic for Bots ---
          const tagger = sc.monkeys.find(other => other.isTagger);

          if (m.isTagger) {
            // Chase closest survivor
            let target: MonkeyEntity | null = null;
            let minDist = 999;
            sc.monkeys.forEach(targetCand => {
              if (targetCand.id !== m.id && targetCand.tagImmunityTimer <= 0) {
                const d = m.pos.distanceTo(targetCand.pos);
                if (d < minDist) {
                  minDist = d;
                  target = targetCand;
                }
              }
            });

            if (target) {
              const diff = new THREE.Vector3().subVectors((target as MonkeyEntity).pos, m.pos);
              inputX = Math.sign(diff.x);
              inputZ = Math.sign(diff.z);
              if (diff.y > 1.5 && m.isGrounded) jump = true;
            }
          } else {
            // Flee from Tagger
            if (tagger) {
              const away = new THREE.Vector3().subVectors(m.pos, tagger.pos);
              const distToTagger = away.length();
              if (distToTagger < 12) {
                inputX = Math.sign(away.x);
                inputZ = Math.sign(away.z);
                if (Math.random() < 0.04 && m.isGrounded) jump = true;
              } else {
                // Wander / Collect banana
                inputX = Math.sin(currentTime * 0.002 + m.pos.x);
                inputZ = Math.cos(currentTime * 0.002 + m.pos.z);
              }
            }
          }
        }

        // Apply Speed
        const speedMultiplier = (m.isPlayer && gs.speedBoostTimer > 0) ? 1.6 : 1.0;
        const currentSpeed = (m.isTagger ? 8.2 : 7.0) * speedMultiplier;

        const inputLen = Math.hypot(inputX, inputZ);
        if (inputLen > 0.05) {
          const normX = (inputX / Math.max(1, inputLen)) * currentSpeed;
          const normZ = (inputZ / Math.max(1, inputLen)) * currentSpeed;
          m.vel.x = THREE.MathUtils.lerp(m.vel.x, normX, 0.25);
          m.vel.z = THREE.MathUtils.lerp(m.vel.z, normZ, 0.25);
          m.facingAngle = Math.atan2(normX, normZ);
        } else {
          m.vel.x = THREE.MathUtils.lerp(m.vel.x, 0, 0.2);
          m.vel.z = THREE.MathUtils.lerp(m.vel.z, 0, 0.2);
        }

        // Jump
        if (jump && m.isGrounded) {
          m.vel.y = 15.0;
          m.isGrounded = false;
        }

        // Gravity
        m.vel.y -= 32 * dt;

        // Next Pos Candidate
        const nextPos = m.pos.clone().addScaledVector(m.vel, dt);

        // Platform Collision Detection
        let grounded = false;
        if (nextPos.y <= 0.9) {
          nextPos.y = 0.9;
          m.vel.y = 0;
          grounded = true;
        }

        sc.platforms.forEach(p => {
          const meshPos = p.mesh.position;
          const geo = (p.mesh.geometry as THREE.BoxGeometry).parameters;
          const minX = meshPos.x - geo.width / 2 - 0.4;
          const maxX = meshPos.x + geo.width / 2 + 0.4;
          const minZ = meshPos.z - geo.depth / 2 - 0.4;
          const maxZ = meshPos.z + geo.depth / 2 + 0.4;

          if (nextPos.x >= minX && nextPos.x <= maxX && nextPos.z >= minZ && nextPos.z <= maxZ) {
            if (nextPos.y - 0.9 <= p.topY && nextPos.y - 0.9 >= p.topY - 1.2 && m.vel.y <= 0) {
              nextPos.y = p.topY + 0.9;
              m.vel.y = 0;
              grounded = true;
            }
          }
        });

        // Jump Pad Collision
        sc.jumpPads.forEach(jp => {
          if (Math.hypot(nextPos.x - jp.pos.x, nextPos.z - jp.pos.z) < 1.4 && Math.abs(nextPos.y - jp.pos.y) < 1.2) {
            m.vel.y = 20.5; // Super high launch to 2nd floor
            grounded = false;
            if (m.isPlayer) {
              triggerHaptic([25, 25]);
              if (playSfx) playSfx('/sfx/jump.mp3');
            }
          }
        });

        m.isGrounded = grounded;

        // Arena Boundaries Clamp (-15 ~ 15, -13 ~ 13)
        nextPos.x = THREE.MathUtils.clamp(nextPos.x, -14.5, 14.5);
        nextPos.z = THREE.MathUtils.clamp(nextPos.z, -12.5, 12.5);

        m.pos.copy(nextPos);

        // Banana Collection (Player only)
        if (m.isPlayer) {
          sc.bananas.forEach(b => {
            if (!b.collected && m.pos.distanceTo(b.pos) < 1.4) {
              b.collected = true;
              b.mesh.visible = false;
              gs.speedBoostTimer = 4.0;
              gs.score += 40;
              setScore(gs.score);
              triggerHaptic(15);
              if (playSfx) playSfx('/sfx/coin.mp3');
            }
          });
        }

        // Update Monkey Visual Mesh
        m.group.position.copy(m.pos);
        m.group.rotation.y = m.facingAngle;

        // Walk & Swing Animation
        const speed = Math.hypot(m.vel.x, m.vel.z);
        if (m.isGrounded && speed > 0.5) {
          const cycle = currentTime * 0.015;
          m.leftLeg.rotation.x = Math.sin(cycle) * 0.6;
          m.rightLeg.rotation.x = -Math.sin(cycle) * 0.6;
          m.leftArm.rotation.x = -Math.sin(cycle) * 0.7;
          m.rightArm.rotation.x = Math.sin(cycle) * 0.7;
        } else if (!m.isGrounded) {
          m.leftArm.rotation.x = -2.2;
          m.rightArm.rotation.x = -2.2;
        } else {
          m.leftLeg.rotation.x = 0;
          m.rightLeg.rotation.x = 0;
          m.leftArm.rotation.x = 0;
          m.rightArm.rotation.x = 0;
        }
      });

      // --- Tag Detection Inter-Monkeys ---
      const tagger = sc.monkeys.find(m => m.isTagger);
      if (tagger && tagger.tagImmunityTimer <= 0) {
        sc.monkeys.forEach(victim => {
          if (victim.id !== tagger.id && !victim.isTagger && victim.tagImmunityTimer <= 0) {
            if (tagger.pos.distanceTo(victim.pos) < 1.8) {
              // TAG!
              tagger.isTagger = false;
              tagger.tagImmunityTimer = 2.5;
              victim.isTagger = true;
              victim.tagImmunityTimer = 2.5;

              // Update Colors
              (tagger.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(tagger.color);
              (tagger.torsoMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
              (victim.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0xef4444);
              (victim.torsoMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x991b1b);

              if (tagger.isPlayer) {
                gs.tags += 1;
                gs.score += 200;
                setTagCount(gs.tags);
                setScore(gs.score);
                triggerHaptic([50, 40, 60]);
                if (playSfx) playSfx('/sfx/hit.mp3');
              } else if (victim.isPlayer) {
                // Player got tagged!
                triggerHaptic([60, 40, 80]);
                if (playSfx) playSfx('/sfx/hit.mp3');
              }

              setIsPlayerTagger(player.isTagger);
            }
          }
        });
      }

      // Smooth Camera Follow
      const targetCamX = player.pos.x * 0.35;
      const targetCamY = player.pos.y + 14;
      const targetCamZ = player.pos.z + 18;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.1);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.1);
      camera.lookAt(player.pos.x, player.pos.y + 1.2, player.pos.z);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [lowSpecMode, playerHeroId]);

  // Touch Screen Dynamic Joystick Event Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX < window.innerWidth * 0.65 && touchControlRef.current.touchId === null) {
        touchControlRef.current.touchId = touch.identifier;
        touchControlRef.current.startX = touch.clientX;
        touchControlRef.current.startY = touch.clientY;

        setJoystickPos({ x: touch.clientX, y: touch.clientY });
        setKnobPos({ x: touch.clientX, y: touch.clientY });
        setJoystickActive(true);
        break;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchControlRef.current.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchControlRef.current.touchId) {
        const dx = touch.clientX - touchControlRef.current.startX;
        const dy = touch.clientY - touchControlRef.current.startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 45;

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const knobX = touchControlRef.current.startX + Math.cos(angle) * clampedDist;
        const knobY = touchControlRef.current.startY + Math.sin(angle) * clampedDist;

        setKnobPos({ x: knobX, y: knobY });

        // Update player moveInput (Screen Relative: dx > 0 => +X right, dy < 0 => -Z forward)
        const moveRatio = clampedDist / maxDist;
        playerControlRef.current.moveInput.x = Math.cos(angle) * moveRatio;
        playerControlRef.current.moveInput.z = Math.sin(angle) * moveRatio;
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchControlRef.current.touchId) {
        touchControlRef.current.touchId = null;
        setJoystickActive(false);
        playerControlRef.current.moveInput.x = 0;
        playerControlRef.current.moveInput.z = 0;
        break;
      }
    }
  };

  // 60s Countdown Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleGameOver, isGameOver, isVictory, showTutorial]);

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '정글 아레나 원숭이 술래잡기' : 'Jungle Arena Tag',
      badge: isKo ? '역할' : 'Roles',
      description: isKo
        ? '감염된 붉은 용암 술래(Tagger)의 추격을 피해 정글 타워와 점프 패드를 넘나들며 생존하세요!'
        : 'Flee from the infected red Lava Tagger across jungle towers and jump pads to survive!',
      keyPoints: isKo
        ? ['[🏃 생존자]: 술래를 피해 생존 시간 누적', '[🔥 술래]: 다른 원숭이를 터치해 태그', '바나나 수집 시 1.6배 가속']
        : ['[Survivor]: Flee from tagger', '[Tagger]: Tag other monkeys', 'Collect bananas for 1.6x speed'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '조이스틱 & 점프 파쿠르' : 'Joystick & Jump Parkour',
      badge: isKo ? '조작' : 'Controls',
      description: isKo
        ? '좌측 플로팅 조이스틱으로 360° 질주하고, 우측 대형 점프 버튼으로 2층 타워로 도약하세요!'
        : 'Use the floating joystick to sprint in 360°, and tap jump to leap onto the 2nd floor deck!',
      keyPoints: isKo
        ? ['좌측 화면 터치: 360° 이동', '우측 대형 버튼: 점프', '초록 점프 패드: 수퍼 점프']
        : ['Left touch: 360° move', 'Right button: Jump', 'Green pads: Super bounce'],
      iconType: 'GESTURES',
    },
    {
      title: isKo ? '태그 스매시 & 보상' : 'Tag Smash & Rewards',
      badge: isKo ? '보상' : 'Rewards',
      description: isKo
        ? '술래가 되었을 땐 우측 [🏷️ TAG] 버튼을 눌러 근접 원숭이를 태그하고 대량의 보너스를 획득하세요!'
        : 'When you are the tagger, tap [🏷️ TAG] button to infect nearby monkeys for huge score bonuses!',
      keyPoints: isKo
        ? ['태그 성공 시 +200점', '생존 시간 비례 점수 상승', '60초 생존 시 승리']
        : ['+200 pts per tag', 'Score increases per survival sec', 'Survive 60s to win'],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#c7f2d6] flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js 3D Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle={isKo ? '몽키 태그 3D' : 'Monkey Tag 3D'}
        onBack={handleBackRequest}
        score={score}
        maxScore={1000}
        timerSec={timeLeft}
        stats={[
          {
            label: isKo ? '상태' : 'ROLE',
            value: isPlayerTagger ? (isKo ? '🔥 술래' : '🔥 TAGGER') : (isKo ? '🏃 생존' : '🏃 RUNNER'),
          },
          { label: isKo ? '태그' : 'TAGS', value: `${tagCount}회` },
          { label: isKo ? '생존' : 'ALIVE', value: `${survivalSec}s` },
        ]}
      />

      {/* Dynamic Floating Touch Joystick Visual */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${joystickPos.x}px`, top: `${joystickPos.y}px` }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-white/60 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg" />
          <div
            className="absolute w-12 h-12 rounded-full bg-white/90 shadow-md border border-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(${knobPos.x - joystickPos.x - 24}px, ${knobPos.y - joystickPos.y - 24}px)`,
            }}
          />
        </div>
      )}

      {/* Right Side Action Buttons */}
      <div className="absolute bottom-8 right-8 z-40 pointer-events-auto flex items-end gap-3">
        {/* Tag Button (Active when player is Tagger) */}
        {isPlayerTagger && (
          <button
            onClick={e => {
              e.stopPropagation();
              doTagSwipe();
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 border-2 border-white text-white font-mono text-xs flex flex-col items-center justify-center active:scale-90 shadow-xl animate-bounce"
            title="Tag Monkey"
          >
            <span className="text-xl">🏷️</span>
            <span className="text-[10px] font-extrabold">TAG!</span>
          </button>
        )}

        {/* 80px Jumbo Jump Button */}
        <button
          onClick={e => {
            e.stopPropagation();
            doJump();
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white/90 text-white font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-2xl transition-transform"
          title="Jump"
        >
          <span className="text-2xl leading-none">▲</span>
          <span className="text-[11px] font-extrabold tracking-wide mt-0.5">JUMP</span>
        </button>
      </div>

      {/* Exit & Settle Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-lg max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 text-2xl font-bold">
              [?]
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isKo ? '술래잡기를 중단하시겠습니까?' : 'Exit Monkey Tag?'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isKo
                ? '현재까지 생존한 시간과 태그 실적에 비례하여 공정한 SNS 포인트가 안전하게 정산 지급됩니다.'
                : 'Your reward will be calculated and deposited based on your survival time and tags.'}
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

      {/* Victory / Game Over Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          isOpen={true}
          receipt={settlementReceipt}
          onConfirm={handleExit}
          isVictory={isVictory}
        />
      )}

      {/* First-time Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_monkey_tag', 'true');
            } catch {
              // ignore
            }
          }}
        />
      )}
    </div>
  );
};

export default PokiMonkeyTagGame;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiPaperIoGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Point {
  x: number;
  z: number;
}

interface Character {
  id: number;
  name: string;
  colorHex: string;
  colorThree: number;
  gridId: number;
  x: number;
  z: number;
  angle: number;
  targetAngle: number;
  speed: number;
  trail: Point[];
  isAlive: boolean;
  territoryCount: number;
  mesh?: THREE.Group;
  trailMesh?: THREE.Line;
}

export const PokiPaperIoGame: React.FC<PokiPaperIoGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 4;
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [territoryPct, setTerritoryPct] = useState<number>(5);
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; pct: number; color: string; isPlayer: boolean }>>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // Floating Virtual Joystick Visual Feedback State
  const [joystickData, setJoystickData] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_paperio2_v2') !== 'true';
    } catch {
      return true;
    }
  });

  const arenaSize = 36;
  const gridResolution = 90;
  const targetConquerPct = 20;

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    floorMesh: THREE.Mesh | null;
    floorCanvas: HTMLCanvasElement | null;
    floorCtx: CanvasRenderingContext2D | null;
    floorTexture: THREE.CanvasTexture | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    floorMesh: null,
    floorCanvas: null,
    floorCtx: null,
    floorTexture: null,
  });

  const stateRef = useRef({
    grid: new Uint8Array(gridResolution * gridResolution),
    characters: [] as Character[],
    touch: {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    },
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
    },
    timeAlive: 0,
    kills: 0,
  });

  const worldToGrid = useCallback((x: number, z: number) => {
    const half = arenaSize / 2;
    const gx = Math.floor(((x + half) / arenaSize) * gridResolution);
    const gz = Math.floor(((z + half) / arenaSize) * gridResolution);
    return {
      gx: Math.max(0, Math.min(gridResolution - 1, gx)),
      gz: Math.max(0, Math.min(gridResolution - 1, gz)),
    };
  }, [arenaSize, gridResolution]);

  const initTerritory = useCallback(() => {
    const s = stateRef.current;
    s.grid.fill(0);

    const claimCircle = (cx: number, cz: number, radiusCells: number, ownerId: number) => {
      for (let z = -radiusCells; z <= radiusCells; z++) {
        for (let x = -radiusCells; x <= radiusCells; x++) {
          if (x * x + z * z <= radiusCells * radiusCells) {
            const gx = cx + x;
            const gz = cz + z;
            if (gx >= 0 && gx < gridResolution && gz >= 0 && gz < gridResolution) {
              s.grid[gz * gridResolution + gx] = ownerId;
            }
          }
        }
      }
    };

    const chars: Character[] = [
      {
        id: 1,
        name: isKo ? '나 (히어로)' : 'You (Hero)',
        colorHex: '#0284c7',
        colorThree: 0x0284c7,
        gridId: 1,
        x: 0,
        z: -6,
        angle: 0,
        targetAngle: 0,
        speed: 5.5,
        trail: [],
        isAlive: true,
        territoryCount: 0,
      },
      {
        id: 2,
        name: 'CrimsonBot',
        colorHex: '#ef4444',
        colorThree: 0xef4444,
        gridId: 2,
        x: -9,
        z: 8,
        angle: Math.PI / 2,
        targetAngle: Math.PI / 2,
        speed: 4.8,
        trail: [],
        isAlive: true,
        territoryCount: 0,
      },
      {
        id: 3,
        name: 'EmeraldBot',
        colorHex: '#22c55e',
        colorThree: 0x22c55e,
        gridId: 3,
        x: 9,
        z: 8,
        angle: -Math.PI / 2,
        targetAngle: -Math.PI / 2,
        speed: 4.9,
        trail: [],
        isAlive: true,
        territoryCount: 0,
      },
      {
        id: 4,
        name: 'AmberBot',
        colorHex: '#f59e0b',
        colorThree: 0xf59e0b,
        gridId: 4,
        x: 0,
        z: 11,
        angle: -Math.PI / 2,
        targetAngle: -Math.PI / 2,
        speed: 4.6,
        trail: [],
        isAlive: true,
        territoryCount: 0,
      },
    ];

    chars.forEach((c) => {
      const g = worldToGrid(c.x, c.z);
      claimCircle(g.gx, g.gz, 4, c.gridId);
    });

    s.characters = chars;
  }, [isKo, worldToGrid, gridResolution]);

  const captureTerritory = useCallback((char: Character) => {
    const s = stateRef.current;
    if (char.trail.length < 3) {
      char.trail = [];
      return;
    }

    const poly: Array<{ gx: number; gz: number }> = char.trail.map((p) => worldToGrid(p.x, p.z));
    char.trail = [];

    let minGx = gridResolution;
    let maxGx = 0;
    let minGz = gridResolution;
    let maxGz = 0;

    poly.forEach((p) => {
      if (p.gx < minGx) minGx = p.gx;
      if (p.gx > maxGx) maxGx = p.gx;
      if (p.gz < minGz) minGz = p.gz;
      if (p.gz > maxGz) maxGz = p.gz;
    });

    minGx = Math.max(0, minGx - 2);
    maxGx = Math.min(gridResolution - 1, maxGx + 2);
    minGz = Math.max(0, minGz - 2);
    maxGz = Math.min(gridResolution - 1, maxGz + 2);

    const isPointInPoly = (px: number, pz: number) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].gx, zi = poly[i].gz;
        const xj = poly[j].gx, zj = poly[j].gz;
        const intersect = (zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    for (let gz = minGz; gz <= maxGz; gz++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        const idx = gz * gridResolution + gx;
        if (s.grid[idx] !== char.gridId && isPointInPoly(gx, gz)) {
          s.grid[idx] = char.gridId;
        }
      }
    }

    poly.forEach((p) => {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const gx = p.gx + dx;
          const gz = p.gz + dy;
          if (gx >= 0 && gx < gridResolution && gz >= 0 && gz < gridResolution) {
            s.grid[gz * gridResolution + gx] = char.gridId;
          }
        }
      }
    });

    if (char.gridId === 1) {
      playSfx?.('sounds/conquer.mp3');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    }
  }, [worldToGrid, gridResolution, playSfx]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialW = container.clientWidth || window.innerWidth;
    const initialH = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(50, initialW / initialH, 0.1, 1000);
    camera.position.set(0, 24, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(initialW, initialH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.1);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.minFilter = THREE.LinearFilter;
    floorTexture.magFilter = THREE.LinearFilter;

    const floorGeo = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.7,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !lowSpecMode;
    scene.add(floorMesh);

    const wallThick = 0.8;
    const wallHeight = 1.5;
    const half = arenaSize / 2;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });

    const createWall = (w: number, d: number, x: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), wallMat);
      mesh.position.set(x, wallHeight / 2, z);
      scene.add(mesh);
    };
    createWall(arenaSize + wallThick * 2, wallThick, 0, -half);
    createWall(arenaSize + wallThick * 2, wallThick, 0, half);
    createWall(wallThick, arenaSize, -half, 0);
    createWall(wallThick, arenaSize, half, 0);

    initTerritory();

    stateRef.current.characters.forEach((char) => {
      const charGroup = new THREE.Group();

      const bodyGeo = new THREE.BoxGeometry(1.0, 0.7, 1.0);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: char.colorThree,
        roughness: 0.3,
        metalness: 0.2,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.35;
      body.castShadow = !lowSpecMode;
      charGroup.add(body);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.1), eyeMat);
      eyeL.position.set(-0.25, 0.45, 0.5);
      const pupL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.11), pupilMat);
      pupL.position.set(-0.25, 0.45, 0.51);

      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.1), eyeMat);
      eyeR.position.set(0.25, 0.45, 0.5);
      const pupR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.11), pupilMat);
      pupR.position.set(0.25, 0.45, 0.51);

      charGroup.add(eyeL, pupL, eyeR, pupR);

      if (char.gridId === 1) {
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
        const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTexture }));
        badgeSprite.position.set(0, 1.8, 0);
        badgeSprite.scale.set(1.1, 1.1, 1.1);
        charGroup.add(badgeSprite);
      }

      scene.add(charGroup);
      char.mesh = charGroup;
    });

    threeRef.current = {
      renderer,
      scene,
      camera,
      floorMesh,
      floorCanvas,
      floorCtx,
      floorTexture,
    };

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

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, playerHeroId, initTerritory]);

  // Main Render Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.08);
      lastTime = currentTime;

      const { renderer, scene, camera, floorCtx, floorCanvas, floorTexture } = threeRef.current;
      const s = stateRef.current;

      if (renderer && scene && camera && !isGameOver && !isVictory) {
        s.timeAlive += dt;

        const player = s.characters[0];
        if (player && player.isAlive) {
          let steerX = 0;
          let steerZ = 0;

          if (s.keys.up) steerZ -= 1;
          if (s.keys.down) steerZ += 1;
          if (s.keys.left) steerX -= 1;
          if (s.keys.right) steerX += 1;

          if (s.touch.active) {
            const dx = s.touch.currentX - s.touch.startX;
            const dy = s.touch.currentY - s.touch.startY;
            const dist = Math.hypot(dx, dy);
            if (dist > 8) {
              steerX = dx;
              steerZ = dy;
            }
          }

          if (Math.hypot(steerX, steerZ) > 0.1) {
            player.targetAngle = Math.atan2(steerX, steerZ);
          }

          let diff = player.targetAngle - player.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          player.angle += diff * 0.15;
        }

        s.characters.slice(1).forEach((bot) => {
          if (!bot.isAlive) return;

          const botGrid = worldToGrid(bot.x, bot.z);
          const owner = s.grid[botGrid.gz * gridResolution + botGrid.gx];

          if (owner !== bot.gridId && bot.trail.length > 18) {
            const diffX = -bot.x;
            const diffZ = -bot.z;
            bot.targetAngle = Math.atan2(diffX, diffZ) + (Math.random() - 0.5) * 0.4;
          } else if (Math.random() < 0.03) {
            bot.targetAngle += (Math.random() - 0.5) * 1.5;
          }

          let diff = bot.targetAngle - bot.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          bot.angle += diff * 0.1;
        });

        const half = arenaSize / 2 - 0.6;
        s.characters.forEach((char) => {
          if (!char.isAlive) return;

          char.x += Math.sin(char.angle) * char.speed * dt;
          char.z += Math.cos(char.angle) * char.speed * dt;

          if (char.x < -half || char.x > half) {
            char.x = THREE.MathUtils.clamp(char.x, -half, half);
            char.angle = -char.angle;
            char.targetAngle = char.angle;
          }
          if (char.z < -half || char.z > half) {
            char.z = THREE.MathUtils.clamp(char.z, -half, half);
            char.angle = Math.PI - char.angle;
            char.targetAngle = char.angle;
          }

          if (char.mesh) {
            char.mesh.position.set(char.x, 0, char.z);
            char.mesh.rotation.y = char.angle;
          }

          const g = worldToGrid(char.x, char.z);
          const currentCellOwner = s.grid[g.gz * gridResolution + g.gx];

          if (currentCellOwner === char.gridId) {
            if (char.trail.length > 0) {
              captureTerritory(char);
            }
          } else {
            const lastP = char.trail[char.trail.length - 1];
            if (!lastP || Math.hypot(char.x - lastP.x, char.z - lastP.z) > 0.45) {
              char.trail.push({ x: char.x, z: char.z });
            }
          }
        });

        s.characters.forEach((killer) => {
          if (!killer.isAlive) return;

          s.characters.forEach((victim) => {
            if (!victim.isAlive || victim.trail.length < 2) return;

            const headX = killer.x;
            const headZ = killer.z;

            const maxCheckIdx = killer === victim ? victim.trail.length - 6 : victim.trail.length;

            for (let i = 0; i < maxCheckIdx; i++) {
              const tp = victim.trail[i];
              if (Math.hypot(headX - tp.x, headZ - tp.z) < 0.6) {
                victim.isAlive = false;
                victim.trail = [];
                if (victim.mesh) victim.mesh.visible = false;

                for (let idx = 0; idx < s.grid.length; idx++) {
                  if (s.grid[idx] === victim.gridId) s.grid[idx] = 0;
                }

                if (killer.gridId === 1) {
                  playSfx?.('sounds/laser.mp3');
                  s.kills += 1;
                  setKills(s.kills);
                  setScore((prev) => prev + 250);
                }

                if (victim.gridId === 1) {
                  playSfx?.('sounds/hit.mp3');
                  setIsGameOver(true);
                  const currentScore = Math.round(s.kills * 250 + s.characters[0].territoryCount * 2);
                  const receipt = calculateAndDepositMissionReward({
                    gameId: 'pokipaperio2',
                    gameTitle: 'Paper.io 2 3D',
                    durationSeconds: Math.round(s.timeAlive),
                    score: currentScore,
                    maxTargetScore: 1000,
                    isVictory: false,
                    difficulty: 'NORMAL',
                  });
                  setSettlementReceipt(receipt);
                  onReward(receipt.totalSns);
                }
                break;
              }
            }
          });
        });

        if (floorCtx && floorCanvas && floorTexture) {
          floorCtx.fillStyle = '#1e293b';
          floorCtx.fillRect(0, 0, 512, 512);

          const cellW = 512 / gridResolution;
          const cellH = 512 / gridResolution;

          const counts = [0, 0, 0, 0, 0];
          for (let gz = 0; gz < gridResolution; gz++) {
            for (let gx = 0; gx < gridResolution; gx++) {
              const owner = s.grid[gz * gridResolution + gx];
              counts[owner]++;

              if (owner > 0) {
                const c = s.characters.find((ch) => ch.gridId === owner);
                if (c) {
                  floorCtx.fillStyle = c.colorHex;
                  floorCtx.fillRect(gx * cellW, gz * cellH, cellW + 0.5, cellH + 0.5);
                }
              }
            }
          }

          s.characters.forEach((char) => {
            if (!char.isAlive || char.trail.length < 2) return;
            floorCtx.strokeStyle = char.colorHex;
            floorCtx.lineWidth = 3.5;
            floorCtx.lineCap = 'round';
            floorCtx.lineJoin = 'round';
            floorCtx.beginPath();

            char.trail.forEach((p, idx) => {
              const canvasX = ((p.x + arenaSize / 2) / arenaSize) * 512;
              const canvasY = ((p.z + arenaSize / 2) / arenaSize) * 512;
              if (idx === 0) floorCtx.moveTo(canvasX, canvasY);
              else floorCtx.lineTo(canvasX, canvasY);
            });
            floorCtx.stroke();
          });

          floorTexture.needsUpdate = true;

          const totalCells = gridResolution * gridResolution;
          const playerCells = counts[1];
          const curPct = Math.round((playerCells / totalCells) * 100);
          setTerritoryPct(curPct);
          s.characters[0].territoryCount = playerCells;

          const leaderData = s.characters
            .map((c) => ({
              name: c.name,
              pct: Math.round((counts[c.gridId] / totalCells) * 100),
              color: c.colorHex,
              isPlayer: c.gridId === 1,
            }))
            .sort((a, b) => b.pct - a.pct);
          setLeaderboard(leaderData);

          if (curPct >= targetConquerPct && !isVictory) {
            setIsVictory(true);
            playSfx?.('sounds/victory.mp3');
            const receipt = calculateAndDepositMissionReward({
              gameId: 'pokipaperio2',
              gameTitle: 'Paper.io 2 3D',
              durationSeconds: Math.round(s.timeAlive),
              score: 500 + curPct * 20 + s.kills * 200,
              maxTargetScore: 1000,
              isVictory: true,
              difficulty: 'NORMAL',
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }

        const p = s.characters[0];
        if (p && p.mesh) {
          camera.position.x = THREE.MathUtils.lerp(camera.position.x, p.x * 0.4, 0.1);
          camera.position.z = THREE.MathUtils.lerp(camera.position.z, p.z * 0.4 + 18, 0.1);
          camera.lookAt(p.x * 0.2, 0, p.z * 0.2);
        }

        renderer.render(scene, camera);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, playSfx, captureTerritory, worldToGrid, arenaSize, gridResolution, targetConquerPct, onReward]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
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
  }, []);

  // Floating Virtual Joystick Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const s = stateRef.current;
    s.touch.active = true;
    s.touch.startX = touch.clientX;
    s.touch.startY = touch.clientY;
    s.touch.currentX = touch.clientX;
    s.touch.currentY = touch.clientY;

    setJoystickData({
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const s = stateRef.current;
    if (s.touch.active) {
      const touch = e.touches[0];
      s.touch.currentX = touch.clientX;
      s.touch.currentY = touch.clientY;

      setJoystickData((prev) => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
      }));
    }
  };

  const handleTouchEnd = () => {
    const s = stateRef.current;
    s.touch.active = false;
    setJoystickData((prev) => ({ ...prev, active: false }));
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'EXPAND',
      title: isKo ? '🎨 영토 정복 & 루프 닫기' : '🎨 Conquer Land & Close Loops',
      description: isKo
        ? '안전지대 밖으로 나가 선(꼬리)을 그린 뒤 다시 자신의 영토로 돌아오면 둘러싸인 면적이 모두 내 땅이 됩니다!'
        : 'Leave your base to draw a trail, then return to your zone to capture everything enclosed!',
      keyPoints: isKo
        ? ['자신의 영토 밖으로 나가 꼬리 그리기', '다시 안전지대로 복귀 시 즉시 점령']
        : ['Draw trail outside base', 'Return to safe zone to conquer'],
    },
    {
      badge: 'COMBAT',
      title: isKo ? '⚔️ 적의 꼬리 자르기' : '⚔️ Cut Enemy Trails',
      description: isKo
        ? '적이 영토 밖에서 그리고 있는 꼬리를 들이받으면 적을 즉시 처치할 수 있습니다. 반대로 내 꼬리가 밟히면 탈락합니다!'
        : 'Crash into an enemy trail to eliminate them instantly. But guard your own tail at all costs!',
      keyPoints: isKo
        ? ['적 꼬리를 공격하여 킬 획득', '내 꼬리가 노출되었을 때 조심']
        : ['Attack exposed enemy trails', 'Protect your own ribbon trail'],
    },
    {
      badge: 'VICTORY',
      title: isKo ? '👑 맵 20% 점유 시 승리' : '👑 Reach 20% Territory to Win',
      description: isKo
        ? '영토를 점진적으로 넓혀 맵 점유율 20%를 달성하면 영광의 우승과 대량의 SNS 보상을 획득합니다!'
        : 'Expand strategically to control 20% of the entire map to claim victory and SNS rewards!',
      keyPoints: isKo
        ? ['리더보드 1위 달성', '20% 점유율 도달 시 승리']
        : ['Climb the live leaderboard', 'Hit 20% conquer rate to win'],
    },
  ];

  // Joystick Math
  const jDx = joystickData.currentX - joystickData.startX;
  const jDy = joystickData.currentY - joystickData.startY;
  const jDist = Math.hypot(jDx, jDy);
  const maxRadius = 38;
  const knobX = jDist > 0 ? (jDx / Math.max(jDist, 1)) * Math.min(jDist, maxRadius) : 0;
  const knobY = jDist > 0 ? (jDy / Math.max(jDist, 1)) * Math.min(jDist, maxRadius) : 0;

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Minimalist Mission HUD */}
      <MinimalistMissionHUD
        gameTitle="PAPER.IO 2 3D"
        score={score}
        targetScore={1000}
        language={language}
        onExit={() => {
          const s = stateRef.current;
          const currentProgress = territoryPct * 15 + s.kills * 100;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokipaperio2',
            gameTitle: 'Paper.io 2 3D',
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

      {/* Top Status & Territory Progress Bar */}
      <div className="absolute top-16 left-4 right-4 flex flex-col gap-2 pointer-events-none z-10">
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200">
          <div className="flex items-center gap-2 bg-slate-900/85 px-3 py-1.5 rounded-sm border border-slate-700/80 backdrop-blur-md shadow-md">
            <span className="text-cyan-400 font-bold">
              👑 {territoryPct}% / {targetConquerPct}%
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-rose-400 font-bold">⚔️ {kills} KILLS</span>
          </div>

          <div className="bg-slate-900/85 px-2.5 py-1 rounded-sm border border-slate-700/80 backdrop-blur-md shadow-md flex items-center gap-2 text-[11px]">
            {leaderboard.slice(0, 3).map((l, i) => (
              <span
                key={i}
                className={`flex items-center gap-1 font-bold ${l.isPlayer ? 'text-cyan-300 underline' : 'text-slate-400'}`}
              >
                <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <span>{l.pct}%</span>
              </span>
            ))}
          </div>
        </div>

        <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/80">
          <div
            className="h-full bg-cyan-500 transition-all duration-200"
            style={{ width: `${Math.min(100, (territoryPct / targetConquerPct) * 100)}%` }}
          />
        </div>
      </div>

      {/* Dynamic Floating Touch Joystick Visual Feedback */}
      {joystickData.active && (
        <div
          className="pointer-events-none fixed z-30"
          style={{
            left: `${joystickData.startX}px`,
            top: `${joystickData.startY}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-cyan-400/60 bg-cyan-950/40 backdrop-blur-xs flex items-center justify-center shadow-2xl relative">
            <div
              className="w-10 h-10 rounded-full bg-cyan-400 border border-white/80 shadow-lg absolute"
              style={{
                transform: `translate(${knobX}px, ${knobY}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile Pure Gesture Guide Hint */}
      <div className="absolute bottom-6 left-4 pointer-events-none z-20">
        <div className="bg-slate-900/85 px-3 py-2 rounded-sm border border-slate-700/80 text-[11px] text-slate-300 backdrop-blur-md shadow-md">
          <div className="text-slate-400 font-bold mb-0.5">{isKo ? '🕹️ 360° 터치 조향' : '🕹️ TOUCH STEER'}</div>
          <div>{isKo ? '화면 어디든 터치 & 드래그하세요' : 'Touch & drag anywhere to steer'}</div>
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

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 max-w-sm w-full rounded-sm text-center font-mono">
            <div className="text-3xl mb-2">💥</div>
            <h2 className="text-xl font-bold text-rose-500 mb-2">
              {isKo ? '꼬리가 밟혀 탈락했습니다!' : 'Your Tail Was Cut!'}
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              {isKo
                ? `최종 점유율: ${territoryPct}% | 처치: ${kills}명`
                : `Final Territory: ${territoryPct}% | Kills: ${kills}`}
            </p>
            {settlementReceipt && (
              <div className="bg-slate-800/80 p-3 rounded-sm border border-slate-700 mb-4 text-xs text-slate-300">
                <div className="text-slate-400 mb-1">{isKo ? '영토 쟁탈전 보상' : 'Conquest Reward'}</div>
                <div className="text-base font-bold text-amber-400">
                  +{settlementReceipt.totalSns} SNS
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onExit}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-sm border border-slate-600 text-sm cursor-pointer"
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
            localStorage.setItem('hero_tutorial_paperio2_v2', 'true');
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
};

export default PokiPaperIoGame;

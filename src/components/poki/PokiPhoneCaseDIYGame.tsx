import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPhoneCaseDIYGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

type DIYStage = 'clean' | 'paint' | 'dry' | 'decorate';

interface PaletteColor {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

const PALETTE: PaletteColor[] = [
  { name: 'Rose', hex: '#f43f5e', rgb: [244, 63, 94] },
  { name: 'Sky', hex: '#0ea5e9', rgb: [14, 165, 233] },
  { name: 'Mint', hex: '#10b981', rgb: [16, 185, 129] },
  { name: 'Purple', hex: '#a855f7', rgb: [168, 85, 247] },
  { name: 'Amber', hex: '#f59e0b', rgb: [245, 158, 11] },
];

interface CharmOption {
  id: string;
  label: string;
  icon: string;
  color: number;
  type: 'heart' | 'star' | 'lightning' | 'diamond' | 'badge';
}

const CHARMS: CharmOption[] = [
  { id: 'heart', label: 'Heart', icon: '💖', color: 0xff3366, type: 'heart' },
  { id: 'star', label: 'Star', icon: '⭐', color: 0xffd700, type: 'star' },
  { id: 'lightning', label: 'Flash', icon: '⚡', color: 0x00f0ff, type: 'lightning' },
  { id: 'diamond', label: 'Gem', icon: '💎', color: 0x60a5fa, type: 'diamond' },
  { id: 'badge', label: 'Hero', icon: '🎴', color: 0xffffff, type: 'badge' },
];

interface PlacedCharm {
  x: number;
  y: number;
  charm: CharmOption;
  mesh?: THREE.Group;
}

export default function PokiPhoneCaseDIYGame({
  onBack,
  onClose,
  cardId = 94,
}: PokiPhoneCaseDIYGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleExit = onBack || onClose || (() => {});

  // DIY Stages
  const [currentStage, setCurrentStage] = useState<DIYStage>('clean');
  const [selectedColor, setSelectedColor] = useState<number>(0);
  const [selectedCharm, setSelectedCharm] = useState<number>(0);
  const [placedCharms, setPlacedCharms] = useState<PlacedCharm[]>([]);

  // Stage Progresses
  const [cleanProgress, setCleanProgress] = useState<number>(0);
  const [paintCoverage, setPaintCoverage] = useState<number>(0);
  const [dryProgress, setDryProgress] = useState<number>(0);

  // Rewards & Game Status
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const scoreRef = useRef<number>(100);

  // Three.js References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    phoneGroup: THREE.Group;
    caseMesh: THREE.Mesh;
    caseMaterial: THREE.MeshStandardMaterial;
    canvasTexture: THREE.CanvasTexture;
    paintCanvas: HTMLCanvasElement;
    paintCtx: CanvasRenderingContext2D;
    heroBadgeCanvas: HTMLCanvasElement;
    heroBadgeTexture: THREE.CanvasTexture | null;
    charmsGroup: THREE.Group;
    particlesGroup: THREE.Group;
    turntable: THREE.Mesh;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    isDraggingPhone: boolean;
    lastPointerX: number;
    lastPointerY: number;
    targetRotationY: number;
    targetRotationX: number;
    showcaseRotation: boolean;
  } | null>(null);

  // Dynamic Canvas Texture Paint Update
  const updateTexture = useCallback(() => {
    if (threeRef.current?.canvasTexture) {
      threeRef.current.canvasTexture.needsUpdate = true;
    }
  }, []);

  // Vibrate helper
  const triggerHaptic = (duration = 20) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(duration);
      }
    } catch {
      // Ignore audio/haptic errors
    }
  };

  // 3D Particle Emitter
  const spawnSparkles = useCallback((worldPos: THREE.Vector3, colorHex: number, count = 12) => {
    if (!threeRef.current) return;
    const { particlesGroup } = threeRef.current;

    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = worldPos.x;
      positions[i * 3 + 1] = worldPos.y;
      positions[i * 3 + 2] = worldPos.z + 0.1;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 2.5,
          Math.random() * 2 + 0.5
        )
      );
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.12,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    const pSystem = new THREE.Points(geom, mat);
    particlesGroup.add(pSystem);

    let life = 0;
    const animId = setInterval(() => {
      life += 0.05;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + velocities[i].x * 0.03,
          posAttr.getY(i) + velocities[i].y * 0.03,
          posAttr.getZ(i) + velocities[i].z * 0.03
        );
      }
      posAttr.needsUpdate = true;
      mat.opacity = 1 - life;

      if (life >= 1) {
        clearInterval(animId);
        particlesGroup.remove(pSystem);
        geom.dispose();
        mat.dispose();
      }
    }, 30);
  }, []);

  // 3D Charm Geometry Builder
  const createCharmMesh = (charm: CharmOption, badgeTexture: THREE.CanvasTexture | null): THREE.Group => {
    const group = new THREE.Group();
    const charmMat = new THREE.MeshStandardMaterial({
      color: charm.color,
      roughness: 0.2,
      metalness: 0.5,
    });

    if (charm.type === 'heart') {
      const heartShape = new THREE.Shape();
      heartShape.moveTo(0, 0);
      heartShape.bezierCurveTo(0, 0.2, -0.25, 0.4, -0.5, 0.4);
      heartShape.bezierCurveTo(-0.8, 0.4, -0.8, 0, -0.8, 0);
      heartShape.bezierCurveTo(-0.8, -0.3, -0.4, -0.6, 0, -0.9);
      heartShape.bezierCurveTo(0.4, -0.6, 0.8, -0.3, 0.8, 0);
      heartShape.bezierCurveTo(0.8, 0, 0.8, 0.4, 0.5, 0.4);
      heartShape.bezierCurveTo(0.25, 0.4, 0, 0.2, 0, 0);

      const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
      const geom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
      geom.center();
      const mesh = new THREE.Mesh(geom, charmMat);
      mesh.scale.set(0.35, 0.35, 0.35);
      group.add(mesh);
    } else if (charm.type === 'star') {
      const starShape = new THREE.Shape();
      const points = 5;
      const outerR = 0.5;
      const innerR = 0.22;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) starShape.moveTo(px, py);
        else starShape.lineTo(px, py);
      }
      starShape.closePath();
      const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
      const geom = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
      geom.center();
      const mesh = new THREE.Mesh(geom, charmMat);
      mesh.scale.set(0.4, 0.4, 0.4);
      group.add(mesh);
    } else if (charm.type === 'lightning') {
      const boltShape = new THREE.Shape();
      boltShape.moveTo(-0.1, 0.5);
      boltShape.lineTo(0.2, 0.1);
      boltShape.lineTo(0.0, 0.1);
      boltShape.lineTo(0.2, -0.5);
      boltShape.lineTo(-0.2, -0.1);
      boltShape.lineTo(-0.0, -0.1);
      boltShape.closePath();
      const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
      const geom = new THREE.ExtrudeGeometry(boltShape, extrudeSettings);
      geom.center();
      const mesh = new THREE.Mesh(geom, charmMat);
      mesh.scale.set(0.5, 0.5, 0.5);
      group.add(mesh);
    } else if (charm.type === 'diamond') {
      const geom = new THREE.OctahedronGeometry(0.3, 0);
      const mesh = new THREE.Mesh(geom, charmMat);
      mesh.scale.set(0.9, 1.2, 0.5);
      group.add(mesh);
    } else {
      // Hero Badge Pendant
      const ringGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.2,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      group.add(ringMesh);

      if (badgeTexture) {
        const badgePlaneGeom = new THREE.PlaneGeometry(0.55, 0.55);
        const badgePlaneMat = new THREE.MeshBasicMaterial({
          map: badgeTexture,
          transparent: true,
        });
        const badgePlane = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
        badgePlane.position.z = 0.045;
        group.add(badgePlane);
      }
    }

    return group;
  };

  // Perform Final Victory
  const triggerVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    triggerHaptic(80);

    if (threeRef.current) {
      threeRef.current.showcaseRotation = true;
      spawnSparkles(new THREE.Vector3(0, 0, 1), 0xffd700, 30);
    }

    const durationSeconds = Math.max(10, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiphonecasediy',
      gameTitle: 'Phone CASE DIY 3D',
      isVictory: true,
      score: 500,
      maxTargetScore: 500,
      durationSeconds,
    });
    setRewardReceipt(receipt);
  }, [gameWon, spawnSparkles]);

  // Stage Action Handlers
  const handleAutoClean = () => {
    triggerHaptic(30);
    setCleanProgress(100);
    if (threeRef.current) {
      const { paintCtx, paintCanvas } = threeRef.current;
      // Clear stains to pristine white/cream base
      paintCtx.fillStyle = '#f8fafc';
      paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
      updateTexture();
      spawnSparkles(new THREE.Vector3(0, 0, 0.5), 0x38bdf8, 16);
    }
    setTimeout(() => {
      setCurrentStage('paint');
    }, 400);
  };

  const handleAutoPaint = () => {
    triggerHaptic(30);
    setPaintCoverage(100);
    if (threeRef.current) {
      const { paintCtx, paintCanvas } = threeRef.current;
      const color = PALETTE[selectedColor];
      // Create stylish multi-gradient coat
      const grad = paintCtx.createLinearGradient(0, 0, paintCanvas.width, paintCanvas.height);
      grad.addColorStop(0, color.hex);
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, PALETTE[(selectedColor + 1) % PALETTE.length].hex);
      paintCtx.fillStyle = grad;
      paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
      updateTexture();
      spawnSparkles(new THREE.Vector3(0, 0, 0.5), 0xf43f5e, 18);
    }
    setTimeout(() => {
      setCurrentStage('dry');
    }, 400);
  };

  const handleInstantDry = () => {
    triggerHaptic(30);
    setDryProgress(100);
    if (threeRef.current) {
      const { caseMaterial } = threeRef.current;
      // Switch to glossy resin finish
      caseMaterial.roughness = 0.05;
      caseMaterial.metalness = 0.25;
      caseMaterial.needsUpdate = true;
      spawnSparkles(new THREE.Vector3(0, 0, 0.5), 0xf59e0b, 20);
    }
    setTimeout(() => {
      setCurrentStage('decorate');
    }, 400);
  };

  const handlePlaceCharmAt = (normX: number, normY: number) => {
    if (!threeRef.current || currentStage !== 'decorate' || gameWon) return;
    triggerHaptic(40);

    const charm = CHARMS[selectedCharm];
    const newCharmData: PlacedCharm = {
      x: normX,
      y: normY,
      charm,
    };

    // Calculate 3D local coordinate on phone case:
    // Case bounds: x in [-1.15, 1.15], y in [-2.35, 2.35], z = 0.14
    const localX = (normX - 0.5) * 2.3;
    const localY = (0.5 - normY) * 4.7;
    const localZ = 0.14;

    const charmMesh = createCharmMesh(charm, threeRef.current.heroBadgeTexture);
    charmMesh.position.set(localX, localY, localZ);
    threeRef.current.charmsGroup.add(charmMesh);
    newCharmData.mesh = charmMesh;

    setPlacedCharms((prev) => {
      const next = [...prev, newCharmData];
      if (next.length >= 3) {
        scoreRef.current = 500;
      }
      return next;
    });

    const worldPos = new THREE.Vector3();
    charmMesh.getWorldPosition(worldPos);
    spawnSparkles(worldPos, charm.color, 16);
  };

  // Main Three.js Initialization & Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0c14);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.position.set(5, 8, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0xa855f7, 2.0, 15);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    const keyLight = new THREE.PointLight(0x38bdf8, 1.5, 12);
    keyLight.position.set(3, -4, 4);
    scene.add(keyLight);

    // 5. Studio Turntable Base
    const turntableGeom = new THREE.CylinderGeometry(3.6, 3.8, 0.35, 48);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b2e,
      roughness: 0.4,
      metalness: 0.6,
    });
    const turntable = new THREE.Mesh(turntableGeom, turntableMat);
    turntable.position.set(0, -3.0, 0);
    turntable.receiveShadow = true;
    scene.add(turntable);

    // Turntable Accent Ring
    const ringGeom = new THREE.TorusGeometry(3.62, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(0, -2.85, 0);
    scene.add(ringMesh);

    // 6. Dynamic Paint Canvas for Phone Case Texture
    const paintCanvas = document.createElement('canvas');
    paintCanvas.width = 512;
    paintCanvas.height = 1024;
    const paintCtx = paintCanvas.getContext('2d')!;

    // Initial Dirty/Unclean Case Texture
    paintCtx.fillStyle = '#cbd5e1';
    paintCtx.fillRect(0, 0, 512, 1024);
    // Draw initial stains & smudges
    paintCtx.fillStyle = 'rgba(100, 116, 139, 0.45)';
    paintCtx.beginPath();
    paintCtx.arc(150, 300, 90, 0, Math.PI * 2);
    paintCtx.arc(380, 550, 110, 0, Math.PI * 2);
    paintCtx.arc(220, 800, 80, 0, Math.PI * 2);
    paintCtx.fill();
    paintCtx.fillStyle = 'rgba(71, 85, 105, 0.35)';
    paintCtx.font = 'bold 36px monospace';
    paintCtx.textAlign = 'center';
    paintCtx.fillText('DIRTY CASE - TAP TO CLEAN', 256, 512);

    const canvasTexture = new THREE.CanvasTexture(paintCanvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    // 7. Hero Badge Canvas & Texture
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const badgeCtx = heroBadgeCanvas.getContext('2d')!;
    drawCardSprite(badgeCtx, cardId, 0, 0, 128, 128, { circleClip: true });
    const heroBadgeTexture = new THREE.CanvasTexture(heroBadgeCanvas);
    heroBadgeTexture.colorSpace = THREE.SRGBColorSpace;

    // 8. 3D Smartphone Assembly Group
    const phoneGroup = new THREE.Group();
    scene.add(phoneGroup);

    // (A) Smartphone Metallic Chassis
    const chassisGeom = new THREE.BoxGeometry(2.4, 4.8, 0.22);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.15,
    });
    const chassis = new THREE.Mesh(chassisGeom, chassisMat);
    chassis.castShadow = true;
    phoneGroup.add(chassis);

    // (B) Front Display Screen (Black Gloss)
    const screenGeom = new THREE.PlaneGeometry(2.32, 4.72);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.05,
      metalness: 0.8,
    });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.z = -0.115;
    screen.rotation.y = Math.PI;
    phoneGroup.add(screen);

    // Front Camera Dynamic Island
    const notchGeom = new THREE.CapsuleGeometry(0.08, 0.28, 8, 16);
    const notchMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const notch = new THREE.Mesh(notchGeom, notchMat);
    notch.rotation.z = Math.PI / 2;
    notch.position.set(0, 2.15, -0.12);
    phoneGroup.add(notch);

    // (C) Back Camera Island (Triple Camera)
    const camBumpGeom = new THREE.BoxGeometry(0.85, 0.9, 0.08);
    const camBumpMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
    });
    const camBump = new THREE.Mesh(camBumpGeom, camBumpMat);
    camBump.position.set(-0.65, 1.8, 0.13);
    phoneGroup.add(camBump);

    // Triple Camera Lenses
    const lensGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
    });
    const lensPositions = [
      [-0.8, 2.0, 0.17],
      [-0.8, 1.6, 0.17],
      [-0.5, 1.8, 0.17],
    ];
    lensPositions.forEach(([lx, ly, lz]) => {
      const lens = new THREE.Mesh(lensGeom, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(lx, ly, lz);
      phoneGroup.add(lens);
    });

    // (D) Main Phone Case Mesh (Back Coating Surface)
    const caseGeom = new THREE.BoxGeometry(2.46, 4.86, 0.24);
    const caseMaterial = new THREE.MeshStandardMaterial({
      map: canvasTexture,
      roughness: 0.5,
      metalness: 0.05,
    });
    const caseMesh = new THREE.Mesh(caseGeom, caseMaterial);
    caseMesh.position.set(0, 0, 0.01);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    phoneGroup.add(caseMesh);

    // (E) Charms Group (Attached on Case Surface)
    const charmsGroup = new THREE.Group();
    phoneGroup.add(charmsGroup);

    // (F) Particles Group
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    // Raycaster & Mouse setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    threeRef.current = {
      scene,
      camera,
      renderer,
      phoneGroup,
      caseMesh,
      caseMaterial,
      canvasTexture,
      paintCanvas,
      paintCtx,
      heroBadgeCanvas,
      heroBadgeTexture,
      charmsGroup,
      particlesGroup,
      turntable,
      raycaster,
      mouse,
      isDraggingPhone: false,
      lastPointerX: 0,
      lastPointerY: 0,
      targetRotationY: 0,
      targetRotationX: 0,
      showcaseRotation: false,
    };

    // 9. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (threeRef.current) {
        const { phoneGroup, showcaseRotation, turntable } = threeRef.current;

        if (showcaseRotation) {
          phoneGroup.rotation.y += delta * 1.5;
          turntable.rotation.y += delta * 1.5;
          phoneGroup.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.15;
        } else {
          // Smooth Interpolation to target rotations
          phoneGroup.rotation.y = THREE.MathUtils.lerp(
            phoneGroup.rotation.y,
            threeRef.current.targetRotationY,
            0.12
          );
          phoneGroup.rotation.x = THREE.MathUtils.lerp(
            phoneGroup.rotation.x,
            threeRef.current.targetRotationX,
            0.12
          );
          turntable.rotation.y = phoneGroup.rotation.y * 0.5;
        }

        threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
      }
    };
    animate();

    // 10. Resize Observer
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      canvasTexture.dispose();
      heroBadgeTexture?.dispose();
    };
  }, [cardId]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!threeRef.current || gameWon) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    threeRef.current.isDraggingPhone = true;
    threeRef.current.lastPointerX = e.clientX;
    threeRef.current.lastPointerY = e.clientY;

    // Check Raycast hit on Case
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    threeRef.current.mouse.set(normX, normY);
    threeRef.current.raycaster.setFromCamera(threeRef.current.mouse, threeRef.current.camera);

    const intersects = threeRef.current.raycaster.intersectObject(threeRef.current.caseMesh);
    if (intersects.length > 0 && intersects[0].uv) {
      const uv = intersects[0].uv;
      handleSurfaceAction(uv.x, uv.y, intersects[0].point);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!threeRef.current || !threeRef.current.isDraggingPhone || gameWon) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = e.clientX - threeRef.current.lastPointerX;
    const dy = e.clientY - threeRef.current.lastPointerY;
    threeRef.current.lastPointerX = e.clientX;
    threeRef.current.lastPointerY = e.clientY;

    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    threeRef.current.mouse.set(normX, normY);
    threeRef.current.raycaster.setFromCamera(threeRef.current.mouse, threeRef.current.camera);

    const intersects = threeRef.current.raycaster.intersectObject(threeRef.current.caseMesh);
    if (intersects.length > 0 && intersects[0].uv) {
      // Direct drag on case surface: perform paint/clean/dry!
      const uv = intersects[0].uv;
      handleSurfaceAction(uv.x, uv.y, intersects[0].point);
    } else {
      // Dragging on empty space: Orbit Rotate Phone Case (Screen-relative)
      threeRef.current.targetRotationY += dx * 0.01;
      threeRef.current.targetRotationX = THREE.MathUtils.clamp(
        threeRef.current.targetRotationX + dy * 0.01,
        -0.6,
        0.6
      );
    }
  };

  const handlePointerUp = () => {
    if (threeRef.current) {
      threeRef.current.isDraggingPhone = false;
    }
  };

  // Surface Action (Clean / Paint / Dry / Decorate)
  const handleSurfaceAction = (uvX: number, uvY: number, worldPoint: THREE.Vector3) => {
    if (!threeRef.current) return;
    const { paintCanvas, paintCtx } = threeRef.current;
    const px = Math.floor(uvX * paintCanvas.width);
    const py = Math.floor((1 - uvY) * paintCanvas.height);

    if (currentStage === 'clean') {
      // Wipe away stains
      paintCtx.save();
      paintCtx.globalCompositeOperation = 'destination-out';
      paintCtx.beginPath();
      paintCtx.arc(px, py, 45, 0, Math.PI * 2);
      paintCtx.fill();
      paintCtx.restore();

      // Spray soapy clean foam
      paintCtx.save();
      paintCtx.fillStyle = 'rgba(248, 250, 252, 0.85)';
      paintCtx.beginPath();
      paintCtx.arc(px, py, 35, 0, Math.PI * 2);
      paintCtx.fill();
      paintCtx.restore();

      updateTexture();
      spawnSparkles(worldPoint, 0x38bdf8, 4);

      setCleanProgress((prev) => {
        const next = Math.min(100, prev + 5);
        if (next >= 100) {
          setTimeout(() => setCurrentStage('paint'), 350);
        }
        return next;
      });
    } else if (currentStage === 'paint') {
      // Spray Acrylic Color
      const color = PALETTE[selectedColor];
      const grad = paintCtx.createRadialGradient(px, py, 5, px, py, 45);
      grad.addColorStop(0, color.hex);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      paintCtx.fillStyle = grad;
      paintCtx.beginPath();
      paintCtx.arc(px, py, 45, 0, Math.PI * 2);
      paintCtx.fill();

      updateTexture();
      spawnSparkles(worldPoint, new THREE.Color(color.hex).getHex(), 4);

      setPaintCoverage((prev) => {
        const next = Math.min(100, prev + 4);
        if (next >= 85) {
          setTimeout(() => setCurrentStage('dry'), 400);
        }
        return next;
      });
    } else if (currentStage === 'dry') {
      // Warm Air Drying & Gloss Polish
      setDryProgress((prev) => {
        const next = Math.min(100, prev + 6);
        if (threeRef.current) {
          threeRef.current.caseMaterial.roughness = Math.max(0.05, 0.5 - (next / 100) * 0.45);
          threeRef.current.caseMaterial.needsUpdate = true;
        }
        spawnSparkles(worldPoint, 0xf59e0b, 5);
        if (next >= 100) {
          setTimeout(() => setCurrentStage('decorate'), 350);
        }
        return next;
      });
    } else if (currentStage === 'decorate') {
      // Place 3D Charm
      handlePlaceCharmAt(uvX, uvY);
    }
  };

  // Calculate HUD Metrics
  const currentProgressPct =
    currentStage === 'clean'
      ? cleanProgress
      : currentStage === 'paint'
      ? paintCoverage
      : currentStage === 'dry'
      ? dryProgress
      : Math.min(100, (placedCharms.length / 3) * 100);

  const stageLabels: Record<DIYStage, string> = {
    clean: '1/4 [🧼 CLEAN & PREP]',
    paint: '2/4 [🎨 ACRYLIC SPRAY]',
    dry: '3/4 [💨 BLOW DRY]',
    decorate: '4/4 [✨ CHARM & DECOR]',
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0e0c14] font-mono"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Three.js Canvas mounts here */}

      {/* Top Minimalist HUD */}
      <MinimalistMissionHUD
        gameTitle="PHONE CASE DIY 3D"
        progress={currentProgressPct}
        score={scoreRef.current}
        maxScore={500}
        onQuit={handleExit}
      />

      {/* Top Center Stage Status Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-black tracking-wider uppercase shadow-lg shadow-purple-950/40 backdrop-blur-md flex items-center gap-2">
          <span>{stageLabels[currentStage]}</span>
          <span className="text-amber-400 font-bold">{Math.floor(currentProgressPct)}%</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 font-bold tracking-tight text-center drop-shadow">
          {currentStage === 'clean' && '화면을 문질러 얼룩을 세척하거나 원터치 버튼을 누르세요'}
          {currentStage === 'paint' && '원하는 색상을 골라 케이스에 스프레이를 도색하세요'}
          {currentStage === 'dry' && '따뜻한 헤어드라이어로 도료를 광택 코팅 건조하세요'}
          {currentStage === 'decorate' && '케이스 표면을 탭하여 귀여운 3D 참과 배지를 부착하세요'}
        </p>
      </div>

      {/* Stage-specific Floating Controls */}
      <div className="absolute bottom-6 left-0 right-0 px-4 z-20 pointer-events-none flex flex-col items-center gap-3">
        {/* Step 2: Color Palette Selector */}
        {currentStage === 'paint' && (
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl animate-fade-in">
            {PALETTE.map((col, idx) => (
              <button
                key={col.name}
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setSelectedColor(idx);
                }}
                className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-md ${
                  selectedColor === idx
                    ? 'scale-110 ring-4 ring-white/80 ring-offset-2 ring-offset-slate-950 shadow-purple-500/40'
                    : 'opacity-70 hover:opacity-100 active:scale-95'
                }`}
                style={{ backgroundColor: col.hex }}
              >
                {selectedColor === idx && <span className="text-white text-xs font-black">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Charm Selector */}
        {currentStage === 'decorate' && (
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl animate-fade-in">
            {CHARMS.map((ch, idx) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setSelectedCharm(idx);
                }}
                className={`w-11 h-11 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer shadow-md ${
                  selectedCharm === idx
                    ? 'bg-purple-600/50 border-2 border-purple-400 scale-110 shadow-purple-500/50'
                    : 'bg-slate-800/80 border border-slate-700 opacity-70 hover:opacity-100 active:scale-95'
                }`}
              >
                <span className="text-base">{ch.icon}</span>
                <span className="text-[8px] text-white font-bold">{ch.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Big Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-3">
          {currentStage === 'clean' && (
            <button
              type="button"
              onClick={handleAutoClean}
              className="h-[76px] px-8 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-sky-600/30 border border-sky-400/40 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              <span className="text-2xl">🧼</span>
              <span>AUTO CLEAN (100%)</span>
            </button>
          )}

          {currentStage === 'paint' && (
            <button
              type="button"
              onClick={handleAutoPaint}
              className="h-[76px] px-8 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-rose-600/30 border border-rose-400/40 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              <span className="text-2xl">🎨</span>
              <span>AUTO COAT (100%)</span>
            </button>
          )}

          {currentStage === 'dry' && (
            <button
              type="button"
              onClick={handleInstantDry}
              className="h-[76px] px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-amber-600/30 border border-amber-400/40 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              <span className="text-2xl">💨</span>
              <span>INSTANT DRY (100%)</span>
            </button>
          )}

          {currentStage === 'decorate' && (
            <button
              type="button"
              onClick={triggerVictory}
              className="h-[76px] px-8 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-purple-600/30 border border-purple-400/40 active:scale-95 transition-all flex items-center gap-3 cursor-pointer animate-pulse"
            >
              <span className="text-2xl">✨</span>
              <span>FINISH DIY! ({placedCharms.length}/3)</span>
            </button>
          )}
        </div>
      </div>

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          rewardReceipt={rewardReceipt}
          onBack={handleExit}
        />
      )}
    </div>
  );
}

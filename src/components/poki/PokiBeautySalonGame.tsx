import React, { useState, useEffect, useRef, useId } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBeautySalonGameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

type StepType = 'cleanse' | 'hair' | 'makeup' | 'dress';

interface HairOption {
  id: number;
  name: string;
}

const HAIR_OPTIONS: HairOption[] = [
  { id: 0, name: '우아한 웨이브' },
  { id: 1, name: '발랄 포니테일' },
  { id: 2, name: '시크 단발컷' },
];

const HAIR_COLORS = [
  { name: '골드 블론드', hex: 0xf5b041 },
  { name: '로즈 핑크', hex: 0xff69b4 },
  { name: '미드나잇 블랙', hex: 0x1f1f2e },
  { name: '실버 바이올렛', hex: 0xba68c8 },
];

const LIP_COLORS = [
  { name: '루비 레드', hex: 0xd32f2f },
  { name: '코랄 핑크', hex: 0xff7043 },
  { name: '글램 와인', hex: 0x880e4f },
  { name: '체리 블라썸', hex: 0xf06292 },
];

const DRESS_OPTIONS = [
  { id: 0, name: '골드 이브닝', color: 0xd4af37, emissive: 0x443300 },
  { id: 1, name: '로즈 프릴', color: 0xf06292, emissive: 0x440022 },
  { id: 2, name: '사이버 글램', color: 0x00e5ff, emissive: 0x003344 },
];

export const PokiBeautySalonGame: React.FC<PokiBeautySalonGameProps> = ({
  onBack,
  cardId = 50,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Step & Styling States
  const [currentStep, setCurrentStep] = useState<StepType>('cleanse');
  const [cleanliness, setCleanliness] = useState(0);
  const [selectedHairStyle, setSelectedHairStyle] = useState(0);
  const [selectedHairColor, setSelectedHairColor] = useState(HAIR_COLORS[0].hex);
  const [selectedLipColor, setSelectedLipColor] = useState(LIP_COLORS[0].hex);
  const [selectedDress, setSelectedDress] = useState(0);

  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [flashEffect, setFlashEffect] = useState(false);

  // 3D Scene Reference
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    avatarGroup: null as THREE.Group | null,
    hairGroup: null as THREE.Group | null,
    lipsMesh: null as THREE.Mesh | null,
    dressMesh: null as THREE.Mesh | null,
    tiaraMesh: null as THREE.Mesh | null,
    dirtMeshes: [] as THREE.Mesh[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    avatarRotationY: 0,
    isDestroyed: false,
    startTime: Date.now(),
    dragState: {
      isDragging: false,
      lastX: 0,
      lastY: 0,
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

  // Main Three.js Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const game = gameRef.current;
    game.isDestroyed = false;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    game.scene = scene;
    scene.background = new THREE.Color(0x1a0f18);
    scene.fog = new THREE.FogExp2(0x1a0f18, 0.03);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);
    camera.lookAt(0, 1.25, 0);
    game.camera = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    game.renderer = renderer;

    // 3. Lighting (Vanity Glam Lights)
    const ambientLight = new THREE.AmbientLight(0xffe6f0, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff0f5, 1.6);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const pinkRimLight = new THREE.DirectionalLight(0xff69b4, 1.2);
    pinkRimLight.position.set(-3, 2, -2);
    scene.add(pinkRimLight);

    // 4. Room & Vanity Mirror Environment
    // Rose Gold Marble Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x331a26,
      roughness: 0.3,
      metalness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    scene.add(floor);

    // Vanity Arch Mirror Frame
    const mirrorFrameGeo = new THREE.TorusGeometry(1.6, 0.08, 16, 32, Math.PI);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, goldMat);
    mirrorFrame.position.set(0, 1.8, -0.8);
    scene.add(mirrorFrame);

    // Mirror Bulbs along the arch (8 light bulbs)
    for (let i = 0; i <= 8; i++) {
      const angle = (i / 8) * Math.PI;
      const bx = Math.cos(angle) * 1.6;
      const by = Math.sin(angle) * 1.6;
      const bulbGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff3cc });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(bx, 1.8 + by, -0.75);
      scene.add(bulb);
    }

    // 5. 3D Model Avatar
    const avatar = new THREE.Group();
    avatar.position.set(0, 0, 0);

    // Skin Material
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfd3,
      roughness: 0.55,
      metalness: 0.05,
    });

    // Head
    const headGeo = new THREE.SphereGeometry(0.52, 24, 24);
    headGeo.scale(1.0, 1.15, 0.95);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 1.45;
    headMesh.castShadow = true;
    avatar.add(headMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.35, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.95;
    avatar.add(neckMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x221122 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), eyeMat);
    eyeL.position.set(-0.16, 1.5, 0.44);
    avatar.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), eyeMat);
    eyeR.position.set(0.16, 1.5, 0.44);
    avatar.add(eyeR);

    // Cheeks / Blush
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xff6688,
      transparent: true,
      opacity: 0.45,
    });
    const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), blushMat);
    blushL.position.set(-0.25, 1.38, 0.45);
    blushL.rotation.y = -0.3;
    avatar.add(blushL);
    const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), blushMat);
    blushR.position.set(0.25, 1.38, 0.45);
    blushR.rotation.y = 0.3;
    avatar.add(blushR);

    // Lips
    const lipsGeo = new THREE.BoxGeometry(0.15, 0.06, 0.06);
    const lipsMat = new THREE.MeshStandardMaterial({
      color: LIP_COLORS[0].hex,
      roughness: 0.2,
      metalness: 0.3,
    });
    const lipsMesh = new THREE.Mesh(lipsGeo, lipsMat);
    lipsMesh.position.set(0, 1.28, 0.48);
    avatar.add(lipsMesh);
    game.lipsMesh = lipsMesh;

    // Body & Dress
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.48, 1.1, 16);
    const dressMat = new THREE.MeshStandardMaterial({
      color: DRESS_OPTIONS[0].color,
      roughness: 0.3,
      metalness: 0.4,
      emissive: DRESS_OPTIONS[0].emissive,
      emissiveIntensity: 0.2,
    });
    const dressMesh = new THREE.Mesh(bodyGeo, dressMat);
    dressMesh.position.y = 0.35;
    dressMesh.castShadow = true;
    avatar.add(dressMesh);
    game.dressMesh = dressMesh;

    // Hair Container
    const hairGroup = new THREE.Group();
    avatar.add(hairGroup);
    game.hairGroup = hairGroup;

    // Dirt spots for step 1 (Cleansing)
    const dirtMat = new THREE.MeshBasicMaterial({ color: 0x664433, transparent: true, opacity: 0.85 });
    const dirtPositions = [
      { x: -0.12, y: 1.62, z: 0.44 },
      { x: 0.14, y: 1.58, z: 0.43 },
      { x: -0.22, y: 1.32, z: 0.42 },
      { x: 0.2, y: 1.34, z: 0.41 },
      { x: 0.02, y: 1.42, z: 0.47 },
    ];
    game.dirtMeshes = [];
    dirtPositions.forEach((dp) => {
      const dMesh = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), dirtMat);
      dMesh.position.set(dp.x, dp.y, dp.z);
      avatar.add(dMesh);
      game.dirtMeshes.push(dMesh);
    });

    // Tiara (Crown) - Hidden initially, shown at finish
    const tiaraGeo = new THREE.TorusGeometry(0.32, 0.03, 8, 16, Math.PI);
    const tiaraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
    const tiaraMesh = new THREE.Mesh(tiaraGeo, tiaraMat);
    tiaraMesh.rotation.x = -Math.PI / 2;
    tiaraMesh.position.set(0, 2.05, 0.1);
    tiaraMesh.visible = false;
    avatar.add(tiaraMesh);
    game.tiaraMesh = tiaraMesh;

    scene.add(avatar);
    game.avatarGroup = avatar;

    // Build Initial Hair Style 0
    buildHairMesh(selectedHairStyle, selectedHairColor);

    // 6. Resize Listener
    const handleResize = () => {
      if (!game.camera || !game.renderer) return;
      game.camera.aspect = window.innerWidth / window.innerHeight;
      game.camera.updateProjectionMatrix();
      game.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 7. Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      if (game.isDestroyed) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Model gentle idle breathing
      if (avatar) {
        avatar.position.y = Math.sin(time * 0.002) * 0.02;
        avatar.rotation.y = THREE.MathUtils.lerp(avatar.rotation.y, game.avatarRotationY, delta * 8);
      }

      // Update Particles (Soap Bubbles / Confetti)
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.mesh.position.addScaledVector(p.vel, delta);
        p.life -= delta;
        p.mesh.scale.multiplyScalar(0.96);
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Helper: Build 3D Hair Mesh
  const buildHairMesh = (styleId: number, colorHex: number) => {
    const hairGroup = gameRef.current.hairGroup;
    if (!hairGroup) return;

    // Clear old hair meshes
    while (hairGroup.children.length > 0) {
      hairGroup.remove(hairGroup.children[0]);
    }

    const hairMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.25,
    });

    if (styleId === 0) {
      // 1. Elegant Waves Long Hair
      const topGeo = new THREE.SphereGeometry(0.56, 16, 16);
      topGeo.scale(1.02, 1.1, 1.05);
      const topMesh = new THREE.Mesh(topGeo, hairMat);
      topMesh.position.set(0, 1.55, -0.05);
      hairGroup.add(topMesh);

      // Back strands
      const backGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.1, 12);
      const backMesh = new THREE.Mesh(backGeo, hairMat);
      backMesh.position.set(0, 1.0, -0.32);
      backMesh.rotation.x = -0.15;
      hairGroup.add(backMesh);

      // Side curls
      const curlL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), hairMat);
      curlL.position.set(-0.45, 1.1, 0.15);
      hairGroup.add(curlL);
      const curlR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), hairMat);
      curlR.position.set(0.45, 1.1, 0.15);
      hairGroup.add(curlR);
    } else if (styleId === 1) {
      // 2. High Ponytail
      const topGeo = new THREE.SphereGeometry(0.55, 16, 16);
      const topMesh = new THREE.Mesh(topGeo, hairMat);
      topMesh.position.set(0, 1.55, -0.05);
      hairGroup.add(topMesh);

      // High tail
      const tailGeo = new THREE.CylinderGeometry(0.14, 0.28, 0.8, 12);
      const tailMesh = new THREE.Mesh(tailGeo, hairMat);
      tailMesh.position.set(0, 1.75, -0.45);
      tailMesh.rotation.x = -0.6;
      hairGroup.add(tailMesh);
    } else {
      // 3. Chic Short Bob
      const bobGeo = new THREE.SphereGeometry(0.57, 16, 16);
      bobGeo.scale(1.05, 1.05, 1.08);
      const bobMesh = new THREE.Mesh(bobGeo, hairMat);
      bobMesh.position.set(0, 1.52, 0.0);
      hairGroup.add(bobMesh);
    }
  };

  // Spawn Bubble / Confetti Particles Helper
  const spawnParticles = (pos: THREE.Vector3, isConfetti = false, count = 8) => {
    const scene = gameRef.current.scene;
    if (!scene) return;

    for (let i = 0; i < count; i++) {
      const pGeo = isConfetti
        ? new THREE.PlaneGeometry(0.1, 0.1)
        : new THREE.SphereGeometry(0.06, 8, 8);
      const colors = [0xff69b4, 0x00ffff, 0xffd700, 0xffffff];
      const pMat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(pos);
      scene.add(pMesh);

      const v = new THREE.Vector3(
        (Math.random() - 0.5) * (isConfetti ? 4 : 1.5),
        Math.random() * (isConfetti ? 4 : 1.5) + 0.5,
        (Math.random() - 0.5) * (isConfetti ? 4 : 1.5)
      );
      gameRef.current.particles.push({ mesh: pMesh, vel: v, life: isConfetti ? 1.4 : 0.6 });
    }
  };

  // Touch Drag on 3D Canvas (Cleanse rubbing & Model 360 Turn)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    gameRef.current.dragState.isDragging = true;
    gameRef.current.dragState.lastX = t.clientX;
    gameRef.current.dragState.lastY = t.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = gameRef.current.dragState;
    if (!state.isDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - state.lastX;
    const dy = t.clientY - state.lastY;
    state.lastX = t.clientX;
    state.lastY = t.clientY;

    if (currentStep === 'cleanse') {
      // Cleanse Rubbing Logic
      setCleanliness((prev) => {
        const next = Math.min(100, prev + Math.floor(Math.abs(dx) + Math.abs(dy)) * 0.15);
        // Hide dirt spots progressively
        const dirtCount = gameRef.current.dirtMeshes.length;
        const toHide = Math.floor((next / 100) * dirtCount);
        for (let i = 0; i < toHide; i++) {
          if (gameRef.current.dirtMeshes[i]) {
            gameRef.current.dirtMeshes[i].visible = false;
          }
        }
        return next;
      });

      // Spawn soap bubble particles around face
      if (Math.random() > 0.5) {
        spawnParticles(new THREE.Vector3(0, 1.45, 0.45), false, 3);
        if (navigator.vibrate) navigator.vibrate(10);
      }
    } else {
      // Model 360 Rotation Drag
      gameRef.current.avatarRotationY += dx * 0.015;
    }
  };

  const handleTouchEnd = () => {
    gameRef.current.dragState.isDragging = false;
  };

  // Step Switchers
  const handleSelectHairStyle = (id: number) => {
    setSelectedHairStyle(id);
    buildHairMesh(id, selectedHairColor);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleSelectHairColor = (hex: number) => {
    setSelectedHairColor(hex);
    buildHairMesh(selectedHairStyle, hex);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleSelectLipColor = (hex: number) => {
    setSelectedLipColor(hex);
    if (gameRef.current.lipsMesh) {
      (gameRef.current.lipsMesh.material as THREE.MeshStandardMaterial).color.setHex(hex);
    }
    spawnParticles(new THREE.Vector3(0, 1.28, 0.48), false, 4);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleSelectDress = (id: number) => {
    setSelectedDress(id);
    const dCfg = DRESS_OPTIONS[id];
    if (gameRef.current.dressMesh) {
      const mat = gameRef.current.dressMesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(dCfg.color);
      mat.emissive.setHex(dCfg.emissive);
    }
    spawnParticles(new THREE.Vector3(0, 0.5, 0.4), false, 6);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  // Next Step / Finish Trigger
  const handleNextStep = () => {
    if (navigator.vibrate) navigator.vibrate(25);
    if (currentStep === 'cleanse') {
      setCurrentStep('hair');
    } else if (currentStep === 'hair') {
      setCurrentStep('makeup');
    } else if (currentStep === 'makeup') {
      setCurrentStep('dress');
    } else {
      // Final Runway Photoshoot!
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 200);

      // Show Tiara Crown
      if (gameRef.current.tiaraMesh) {
        gameRef.current.tiaraMesh.visible = true;
      }

      // Confetti celebration
      spawnParticles(new THREE.Vector3(0, 1.8, 0), true, 40);
      if (navigator.vibrate) navigator.vibrate([40, 60, 80]);

      setTimeout(() => {
        setGameWon(true);
        const result = calculateAndDepositMissionReward({
          gameId: 'poki_beauty_salon',
          gameTitle: 'Beauty Salon 3D',
          isVictory: true,
          score: 100,
          maxTargetScore: 100,
          durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
        });
        setRewardResult(result);
      }, 1000);
    }
  };

  const stepProgress = {
    cleanse: { index: 1, name: '1. 스파 & 클렌징' },
    hair: { index: 2, name: '2. 헤어 스타일링' },
    makeup: { index: 3, name: '3. 글램 메이크업' },
    dress: { index: 4, name: '4. 런웨이 드레스업' },
  }[currentStep];

  const hudUniqueId = useId();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#1a0f18] font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Minimalist Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        key={hudUniqueId}
        title="BEAUTY SALON 3D"
        progress={`${stepProgress.name} (${stepProgress.index}/4)`}
        onGiveUp={() => {
          const res = calculateAndDepositMissionReward({
            gameId: 'poki_beauty_salon',
            gameTitle: 'Beauty Salon 3D',
            isVictory: false,
            score: stepProgress.index * 25,
            maxTargetScore: 100,
            durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
          });
          setRewardResult(res);
        }}
      />

      {/* Hero Badge & Salon Status */}
      <div className="absolute top-14 left-3 z-20 flex items-center gap-2 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded-sm border border-pink-500/30">
        <canvas
          ref={heroBadgeCanvasRef}
          width={48}
          height={48}
          className="w-8 h-8 rounded border border-pink-400/50 bg-black/40"
        />
        <div className="text-xs">
          <div className="text-pink-300 font-bold">GLAM STYLIST</div>
          <div className="text-[10px] text-gray-300">
            {currentStep === 'cleanse' ? `클렌징: ${Math.floor(cleanliness)}%` : '모델 회전: 드래그'}
          </div>
        </div>
      </div>

      {/* Camera Flash Overlay */}
      {flashEffect && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none animate-out fade-out duration-300" />
      )}

      {/* Step Instruction Guide */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center bg-black/50 px-4 py-1.5 rounded border border-pink-500/20 text-xs text-pink-200">
        {currentStep === 'cleanse' && '🧼 화면을 문질러 피부 트러블을 깨끗하게 닦아내세요!'}
        {currentStep === 'hair' && '💇 원하는 헤어스타일과 헤어 컬러를 선택하세요.'}
        {currentStep === 'makeup' && '💄 립스틱 컬러를 선택해 입술을 생기있게 물들이세요.'}
        {currentStep === 'dress' && '👗 럭셔리 드레스를 입히고 모델을 회전해보세요.'}
      </div>

      {/* Bottom Interactive Control Panel */}
      <div className="absolute bottom-6 left-3 right-3 z-20 bg-gray-950/85 backdrop-blur-md border border-pink-500/40 rounded-sm p-3 shadow-2xl flex flex-col gap-2.5 pointer-events-auto">
        {/* Step-specific options */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          {currentStep === 'cleanse' && (
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 bg-gray-800 h-3 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="bg-gradient-to-r from-pink-500 to-rose-400 h-full transition-all duration-150"
                  style={{ width: `${cleanliness}%` }}
                />
              </div>
              <span className="text-xs font-bold text-pink-300">{Math.floor(cleanliness)}%</span>
            </div>
          )}

          {currentStep === 'hair' && (
            <div className="flex flex-col gap-2 w-full">
              {/* Hair Style Buttons */}
              <div className="flex gap-2">
                {HAIR_OPTIONS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSelectHairStyle(h.id)}
                    className={`flex-1 py-1.5 px-2 rounded-sm text-xs font-bold border transition-colors ${
                      selectedHairStyle === h.id
                        ? 'bg-pink-600 border-pink-300 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
              {/* Hair Color Circles */}
              <div className="flex items-center justify-around">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleSelectHairColor(c.hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      selectedHairColor === c.hex ? 'scale-125 border-white shadow-lg' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, '0')}` }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {currentStep === 'makeup' && (
            <div className="flex items-center justify-around w-full py-1">
              {LIP_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleSelectLipColor(c.hex)}
                  className={`flex flex-col items-center gap-1 p-1 rounded transition-transform ${
                    selectedLipColor === c.hex ? 'scale-110' : 'opacity-70'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, '0')}` }}
                  />
                  <span className="text-[9px] text-gray-300">{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 'dress' && (
            <div className="flex gap-2 w-full">
              {DRESS_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleSelectDress(d.id)}
                  className={`flex-1 py-2 px-2 rounded-sm text-xs font-bold border transition-colors ${
                    selectedDress === d.id
                      ? 'bg-pink-600 border-pink-300 text-white shadow-md'
                      : 'bg-gray-800 border-gray-700 text-gray-300'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNextStep}
          disabled={currentStep === 'cleanse' && cleanliness < 95}
          className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 active:from-pink-500 active:to-rose-400 disabled:opacity-50 text-white font-bold text-sm tracking-wider rounded-sm border border-pink-400 shadow-lg flex items-center justify-center gap-2"
        >
          {currentStep === 'dress' ? (
            <>
              <span>📸</span>
              <span>[ 런웨이 화보 촬영하기 ]</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>[ 다음 스타일링 단계로 ]</span>
            </>
          )}
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full bg-gray-900 border border-pink-500/60 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-xl font-black text-pink-400 tracking-wider mb-2">
              BEAUTY SALON 3D
            </div>
            <div className="text-xs text-gray-300 space-y-2 mb-5 leading-relaxed text-left">
              <p>• 🧴 <b className="text-white">1단계 스파</b>: 화면을 문질러 피부를 깨끗하게 클렌징하세요.</p>
              <p>• 💇 <b className="text-pink-300">2단계 헤어</b>: 3종 스타일과 4종 염색 컬러를 매치하세요.</p>
              <p>• 💄 <b className="text-rose-400">3단계 메이크업</b>: 입술을 글램 컬러로 물들이세요.</p>
              <p>• 👗 <b className="text-cyan-300">4단계 드레스업</b>: 럭셔리 드레스를 입히고 360° 화보를 촬영하세요!</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-pink-600 active:bg-pink-500 text-white font-bold text-sm tracking-wider rounded-sm border border-pink-400 shadow-md"
            >
              [ 살롱 오픈하기 ]
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
    </div>
  );
};

export default PokiBeautySalonGame;

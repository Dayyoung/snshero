import React, { useState, useEffect, useRef, useId } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSuperDressGameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

type CategoryType = 'hair' | 'gown' | 'acc' | 'shoes';

interface ItemConfig {
  id: number;
  name: string;
  category: CategoryType;
  color: number;
  label: string;
}

const FASHION_ITEMS: Record<CategoryType, ItemConfig[]> = {
  hair: [
    { id: 0, category: 'hair', name: '골든 웨이브 롱', color: 0xf5b041, label: '✨ 골든 웨이브' },
    { id: 1, category: 'hair', name: '실버 플래티넘 밥', color: 0xd5d8dc, label: '❄️ 실버 보브' },
    { id: 2, category: 'hair', name: '로맨틱 로즈 번', color: 0xf06292, label: '🌸 로즈 번' },
  ],
  gown: [
    { id: 0, category: 'gown', name: '로열 벨벳 루비', color: 0x990011, label: '💃 벨벳 루비' },
    { id: 1, category: 'gown', name: '오로라 에메랄드', color: 0x056644, label: '👗 에메랄드' },
    { id: 2, category: 'gown', name: '미드나잇 사파이어', color: 0x102a5c, label: '✨ 사파이어' },
  ],
  acc: [
    { id: 0, category: 'acc', name: '다이아몬드 티아라', color: 0x00f0ff, label: '👑 티아라' },
    { id: 1, category: 'acc', name: '골드 클러치 백', color: 0xd4af37, label: '👜 골드 클러치' },
    { id: 2, category: 'acc', name: '진주 드롭 목걸이', color: 0xffffff, label: '📿 진주 목걸이' },
  ],
  shoes: [
    { id: 0, category: 'shoes', name: '크리스탈 힐', color: 0xccf0ff, label: '👠 크리스탈' },
    { id: 1, category: 'shoes', name: '글래머 골드 스트랩', color: 0xd4af37, label: '👡 골드 스트랩' },
    { id: 2, category: 'shoes', name: '레드 카펫 펌프스', color: 0xcc1122, label: '👠 레드 펌프스' },
  ],
};

export const PokiSuperDressGame: React.FC<PokiSuperDressGameProps> = ({
  onBack,
  cardId = 51,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Selection States
  const [activeCategory, setActiveCategory] = useState<CategoryType>('hair');
  const [selectedIndices, setSelectedIndices] = useState<Record<CategoryType, number>>({
    hair: 0,
    gown: 0,
    acc: 0,
    shoes: 0,
  });

  const [fashionScore, setFashionScore] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [flashCount, setFlashCount] = useState(0);

  // Three.js Refs
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    modelGroup: null as THREE.Group | null,
    hairGroup: null as THREE.Group | null,
    gownGroup: null as THREE.Group | null,
    accGroup: null as THREE.Group | null,
    shoesGroup: null as THREE.Group | null,
    spotlights: [] as THREE.SpotLight[],
    flashes: [] as THREE.PointLight[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    modelRotationY: 0,
    isFinaleMode: false,
    isDestroyed: false,
    startTime: Date.now(),
    dragState: {
      isDragging: false,
      lastX: 0,
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

  // Main Three.js Initialization & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const game = gameRef.current;
    game.isDestroyed = false;
    game.isFinaleMode = false;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    game.scene = scene;
    scene.background = new THREE.Color(0xfcdad7);
    scene.fog = new THREE.FogExp2(0xfcdad7, 0.03);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.3, 4.4);
    camera.lookAt(0, 1.15, 0);
    game.camera = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    game.renderer = renderer;

    // 3. Lighting (Runway Show Glamour)
    const ambientLight = new THREE.AmbientLight(0xfff0fa, 0.85);
    scene.add(ambientLight);

    const spot1 = new THREE.SpotLight(0xfff5e6, 2.2, 20, Math.PI / 6, 0.3);
    spot1.position.set(-3, 5, 4);
    spot1.target.position.set(0, 1.2, 0);
    scene.add(spot1);
    scene.add(spot1.target);

    const spot2 = new THREE.SpotLight(0xffd700, 1.8, 20, Math.PI / 6, 0.3);
    spot2.position.set(3, 5, 4);
    spot2.target.position.set(0, 1.2, 0);
    scene.add(spot2);
    scene.add(spot2.target);

    game.spotlights = [spot1, spot2];

    // Paparazzi Flash Lights in Background
    game.flashes = [];
    for (let i = 0; i < 4; i++) {
      const fl = new THREE.PointLight(0xffffff, 0, 15);
      fl.position.set((i - 1.5) * 3, 2 + Math.random() * 2, -2.5);
      scene.add(fl);
      game.flashes.push(fl);
    }

    // 4. Runway Stage Environment
    // Glossy Dark Floor
    const stageGeo = new THREE.BoxGeometry(10, 0.8, 16);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x110e1c,
      roughness: 0.15,
      metalness: 0.8,
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.set(0, -0.4, 0);
    stageMesh.receiveShadow = true;
    scene.add(stageMesh);

    // Red Carpet Strip (Width 2.4, Length 16)
    const carpetGeo = new THREE.PlaneGeometry(2.4, 16);
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x99001a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const carpetMesh = new THREE.Mesh(carpetGeo, carpetMat);
    carpetMesh.rotation.x = -Math.PI / 2;
    carpetMesh.position.set(0, 0.01, 0);
    carpetMesh.receiveShadow = true;
    scene.add(carpetMesh);

    // Golden LED Runway Rails
    const railGeo = new THREE.BoxGeometry(0.12, 0.05, 16);
    const railMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-1.25, 0.03, 0);
    scene.add(railL);
    const railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(1.25, 0.03, 0);
    scene.add(railR);

    // 5. 3D Supermodel Avatar
    const modelGroup = new THREE.Group();
    modelGroup.position.set(0, 0, 0);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfd3,
      roughness: 0.55,
      metalness: 0.05,
    });

    // Head
    const headGeo = new THREE.SphereGeometry(0.48, 24, 24);
    headGeo.scale(1.0, 1.15, 0.95);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 1.62;
    headMesh.castShadow = true;
    modelGroup.add(headMesh);

    // Facial features: Eyes & Lips
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a24 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), eyeMat);
    eyeL.position.set(-0.15, 1.66, 0.42);
    modelGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), eyeMat);
    eyeR.position.set(0.15, 1.66, 0.42);
    modelGroup.add(eyeR);

    const lipsMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.2 });
    const lips = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.05), lipsMat);
    lips.position.set(0, 1.48, 0.45);
    modelGroup.add(lips);

    // Torso Base
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.7, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
    torsoMesh.position.y = 1.05;
    modelGroup.add(torsoMesh);

    // Dynamic Groups for 4 categories
    const hairGroup = new THREE.Group();
    const gownGroup = new THREE.Group();
    const accGroup = new THREE.Group();
    const shoesGroup = new THREE.Group();

    modelGroup.add(hairGroup);
    modelGroup.add(gownGroup);
    modelGroup.add(accGroup);
    modelGroup.add(shoesGroup);

    scene.add(modelGroup);
    game.modelGroup = modelGroup;
    game.hairGroup = hairGroup;
    game.gownGroup = gownGroup;
    game.accGroup = accGroup;
    game.shoesGroup = shoesGroup;

    // Build initial items
    buildHair(selectedIndices.hair);
    buildGown(selectedIndices.gown);
    buildAcc(selectedIndices.acc);
    buildShoes(selectedIndices.shoes);

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

      // Spotlight sway
      spot1.position.x = -3 + Math.sin(time * 0.001) * 0.8;
      spot2.position.x = 3 + Math.cos(time * 0.0012) * 0.8;

      // Paparazzi Flash Flashes
      game.flashes.forEach((fl) => {
        if (Math.random() < 0.02 || game.isFinaleMode) {
          fl.intensity = 2.5;
        } else {
          fl.intensity = Math.max(0, fl.intensity - delta * 15);
        }
      });

      // Model Rotation & Idle
      if (modelGroup) {
        if (game.isFinaleMode) {
          // Automatic graceful 360 degree spin
          game.modelRotationY += delta * 1.5;
        }
        modelGroup.rotation.y = THREE.MathUtils.lerp(
          modelGroup.rotation.y,
          game.modelRotationY,
          delta * 8
        );
        modelGroup.position.y = Math.sin(time * 0.003) * 0.02;
      }

      // Update Confetti Particles
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.mesh.position.addScaledVector(p.vel, delta);
        p.vel.y -= 4 * delta; // gentle gravity
        p.mesh.rotation.x += delta * 3;
        p.mesh.rotation.y += delta * 2;
        p.life -= delta;
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

  // 3D Item Builders
  const buildHair = (index: number) => {
    const group = gameRef.current.hairGroup;
    if (!group) return;
    while (group.children.length > 0) group.remove(group.children[0]);

    const item = FASHION_ITEMS.hair[index];
    const mat = new THREE.MeshStandardMaterial({
      color: item.color,
      roughness: 0.35,
      metalness: 0.2,
    });

    if (index === 0) {
      // Golden Waves Long Hair
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 16), mat);
      top.scale.set(1.02, 1.1, 1.05);
      top.position.set(0, 1.7, -0.05);
      group.add(top);

      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.2, 12), mat);
      back.position.set(0, 1.15, -0.28);
      back.rotation.x = -0.15;
      group.add(back);

      const waveL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.0, 8), mat);
      waveL.position.set(-0.42, 1.2, 0.12);
      group.add(waveL);
      const waveR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.0, 8), mat);
      waveR.position.set(0.42, 1.2, 0.12);
      group.add(waveR);
    } else if (index === 1) {
      // Platinum Bob Cut
      const bob = new THREE.Mesh(new THREE.SphereGeometry(0.53, 16, 16), mat);
      bob.scale.set(1.06, 1.05, 1.08);
      bob.position.set(0, 1.68, 0.0);
      group.add(bob);
    } else {
      // Rose Pink High Bun
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.51, 16, 16), mat);
      top.position.set(0, 1.7, -0.02);
      group.add(top);

      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), mat);
      bun.position.set(0, 2.15, -0.15);
      group.add(bun);
    }
  };

  const buildGown = (index: number) => {
    const group = gameRef.current.gownGroup;
    if (!group) return;
    while (group.children.length > 0) group.remove(group.children[0]);

    const item = FASHION_ITEMS.gown[index];
    const mat = new THREE.MeshStandardMaterial({
      color: item.color,
      roughness: 0.25,
      metalness: 0.45,
    });

    if (index === 0) {
      // Velvet Ruby Mermaid Dress
      const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.75, 16), mat);
      bodice.position.y = 0.98;
      group.add(bodice);

      const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.1, 16), mat);
      skirt.position.y = 0.45;
      group.add(skirt);
    } else if (index === 1) {
      // Aurora Emerald Ballgown
      const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.75, 16), mat);
      bodice.position.y = 0.98;
      group.add(bodice);

      const ball = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.15, 20), mat);
      ball.position.y = 0.42;
      group.add(ball);
    } else {
      // Midnight Sapphire Slit Dress
      const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.75, 16), mat);
      bodice.position.y = 0.98;
      group.add(bodice);

      const slit = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.1, 16), mat);
      slit.position.y = 0.45;
      group.add(slit);
    }
  };

  const buildAcc = (index: number) => {
    const group = gameRef.current.accGroup;
    if (!group) return;
    while (group.children.length > 0) group.remove(group.children[0]);

    if (index === 0) {
      // Diamond Tiara
      const tiaraGeo = new THREE.TorusGeometry(0.3, 0.035, 8, 16, Math.PI);
      const tiaraMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1 });
      const tiara = new THREE.Mesh(tiaraGeo, tiaraMat);
      tiara.rotation.x = -Math.PI / 2;
      tiara.position.set(0, 2.12, 0.05);
      group.add(tiara);
    } else if (index === 1) {
      // Gold Clutch Bag
      const clutchGeo = new THREE.BoxGeometry(0.28, 0.18, 0.08);
      const clutchMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
      const clutch = new THREE.Mesh(clutchGeo, clutchMat);
      clutch.position.set(0.48, 0.75, 0.1);
      clutch.rotation.z = -0.2;
      group.add(clutch);
    } else {
      // Pearl Necklace
      const pearlGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
      const pearlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.3 });
      const pearl = new THREE.Mesh(pearlGeo, pearlMat);
      pearl.rotation.x = Math.PI / 2;
      pearl.position.set(0, 1.32, 0.08);
      group.add(pearl);
    }
  };

  const buildShoes = (index: number) => {
    const group = gameRef.current.shoesGroup;
    if (!group) return;
    while (group.children.length > 0) group.remove(group.children[0]);

    const item = FASHION_ITEMS.shoes[index];
    const shoeMat = new THREE.MeshStandardMaterial({
      color: item.color,
      roughness: 0.2,
      metalness: 0.5,
    });

    const shoeGeo = new THREE.BoxGeometry(0.14, 0.08, 0.28);
    const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
    shoeL.position.set(-0.16, 0.04, 0.05);
    group.add(shoeL);

    const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
    shoeR.position.set(0.16, 0.04, 0.05);
    group.add(shoeR);
  };

  // Sparkle / Confetti Helper
  const spawnSparkles = (count = 14) => {
    const scene = gameRef.current.scene;
    if (!scene) return;

    for (let i = 0; i < count; i++) {
      const pGeo = new THREE.PlaneGeometry(0.1, 0.1);
      const colors = [0xffd700, 0xff69b4, 0x00ffff, 0xffffff];
      const pMat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        side: THREE.DoubleSide,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(
        (Math.random() - 0.5) * 2,
        1.2 + (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1
      );
      scene.add(pMesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      );
      gameRef.current.particles.push({ mesh: pMesh, vel, life: 1.2 });
    }
  };

  // Touch Swipe for 360 Runway Rotation
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    gameRef.current.dragState.isDragging = true;
    gameRef.current.dragState.lastX = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!gameRef.current.dragState.isDragging) return;
    const dx = e.touches[0].clientX - gameRef.current.dragState.lastX;
    gameRef.current.dragState.lastX = e.touches[0].clientX;
    gameRef.current.modelRotationY += dx * 0.015;
  };

  const handleTouchEnd = () => {
    gameRef.current.dragState.isDragging = false;
  };

  // Item Selection Handler
  const handleSelectItem = (cat: CategoryType, index: number) => {
    setSelectedIndices((prev) => ({ ...prev, [cat]: index }));

    if (cat === 'hair') buildHair(index);
    else if (cat === 'gown') buildGown(index);
    else if (cat === 'acc') buildAcc(index);
    else if (cat === 'shoes') buildShoes(index);

    spawnSparkles(10);
    if (navigator.vibrate) navigator.vibrate(18);
  };

  // Runway Fashion Show Finale Trigger
  const handleRunwayShow = () => {
    gameRef.current.isFinaleMode = true;

    // Trigger series of 3 camera flashes
    let count = 0;
    const flashInterval = setInterval(() => {
      count++;
      setFlashCount(count);
      if (navigator.vibrate) navigator.vibrate(35);
      if (count >= 3) {
        clearInterval(flashInterval);
        setTimeout(() => setFlashCount(0), 200);
      }
    }, 280);

    // Huge confetti blast
    spawnSparkles(50);

    setTimeout(() => {
      setGameWon(true);
      const result = calculateAndDepositMissionReward({
        gameId: 'poki_super_dress',
        gameTitle: 'Super Dress 3D',
        isVictory: true,
        score: 100,
        maxTargetScore: 100,
        durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
      });
      setRewardResult(result);
    }, 1800);
  };

  const hudUniqueId = useId();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fcdad7] font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Minimalist Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        key={hudUniqueId}
        title="SUPER DRESS 3D"
        progress={`FASHION SCORE: ${fashionScore}/100`}
        onGiveUp={() => {
          const res = calculateAndDepositMissionReward({
            gameId: 'poki_super_dress',
            gameTitle: 'Super Dress 3D',
            isVictory: false,
            score: 75,
            maxTargetScore: 100,
            durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
          });
          setRewardResult(res);
        }}
      />

      {/* Hero Badge & Model Status */}
      <div className="absolute top-14 left-3 z-20 flex items-center gap-2 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded-sm border border-amber-500/30">
        <canvas
          ref={heroBadgeCanvasRef}
          width={48}
          height={48}
          className="w-8 h-8 rounded border border-amber-400/50 bg-black/40"
        />
        <div className="text-xs">
          <div className="text-amber-400 font-bold">HAUTE COUTURE</div>
          <div className="text-[10px] text-gray-300">런웨이 회전: 화면 스와이프</div>
        </div>
      </div>

      {/* Paparazzi Flash Overlay */}
      {flashCount > 0 && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none animate-ping duration-150" />
      )}

      {/* 3D Runway Drag Guide */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center bg-black/50 px-3 py-1 rounded border border-amber-500/20 text-[10px] text-amber-200">
        👆 화면 스와이프로 360° 런웨이 모델 회전
      </div>

      {/* Bottom Interactive Fashion Studio Panel */}
      <div className="absolute bottom-6 left-3 right-3 z-20 bg-gray-950/85 backdrop-blur-md border border-amber-500/40 rounded-sm p-3 shadow-2xl flex flex-col gap-2.5 pointer-events-auto">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
          {(['hair', 'gown', 'acc', 'shoes'] as CategoryType[]).map((cat) => {
            const labels: Record<CategoryType, string> = {
              hair: '💇 헤어',
              gown: '👗 드레스',
              acc: '👑 액세서리',
              shoes: '👠 슈즈',
            };
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-1.5 rounded-sm text-xs font-bold transition-colors ${
                  activeCategory === cat
                    ? 'bg-amber-600 text-white border border-amber-400'
                    : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                }`}
              >
                {labels[cat]}
              </button>
            );
          })}
        </div>

        {/* Item Selection Cards */}
        <div className="flex items-center gap-2">
          {FASHION_ITEMS[activeCategory].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectItem(activeCategory, item.id)}
              className={`flex-1 py-2 px-1.5 rounded-sm text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                selectedIndices[activeCategory] === item.id
                  ? 'bg-amber-600/30 border-amber-400 text-amber-300 shadow-md scale-102'
                  : 'bg-gray-900 border-gray-800 text-gray-300'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full border border-white/40"
                style={{ backgroundColor: `#${item.color.toString(16).padStart(6, '0')}` }}
              />
              <span className="text-[11px] truncate w-full text-center">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Runway Show Action Button */}
        <button
          onClick={handleRunwayShow}
          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 active:from-amber-500 active:to-yellow-400 text-white font-black text-sm tracking-wider rounded-sm border border-yellow-300 shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-transform"
        >
          <span>📸</span>
          <span>[ 런웨이 패션쇼 피날레 시작 ]</span>
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full bg-gray-900 border border-amber-500/60 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-xl font-black text-amber-400 tracking-wider mb-2">
              SUPER DRESS 3D
            </div>
            <div className="text-xs text-gray-300 space-y-2 mb-5 leading-relaxed text-left">
              <p>• 👗 <b className="text-white">오뜨 꾸뛰르 살롱</b>: 헤어, 럭셔리 드레스, 티아라, 슈즈를 코디하세요.</p>
              <p>• 🔄 <b className="text-amber-300">360° 런웨이 턴</b>: 화면을 스와이프해 풀 핏을 확인하세요.</p>
              <p>• 📸 <b className="text-yellow-400">패션쇼 피날레</b>: 코디를 완성하고 런웨이 쇼를 개최해 승리하세요!</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-amber-600 active:bg-amber-500 text-white font-bold text-sm tracking-wider rounded-sm border border-amber-400 shadow-md"
            >
              [ 패션쇼 입장 ]
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

export default PokiSuperDressGame;

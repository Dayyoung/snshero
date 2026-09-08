import React, { useState, useEffect, useRef, useId } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPlanetDestructionGameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

type WeaponType = 'meteor' | 'laser' | 'nuke' | 'blackhole';

interface WeaponConfig {
  type: WeaponType;
  name: string;
  icon: string;
  damage: number;
  color: number;
  description: string;
}

const WEAPONS: WeaponConfig[] = [
  { type: 'meteor', name: '운석 폭격', icon: '☄️', damage: 8, color: 0xff4500, description: '불타는 소행성 직격' },
  { type: 'laser', name: '궤도 레이저', icon: '⚡', damage: 6, color: 0x00f0ff, description: '초고열 이온 광선' },
  { type: 'nuke', name: '핵미사일', icon: '🚀', damage: 12, color: 0xffaa00, description: '원자 폭발 충격파' },
  { type: 'blackhole', name: '블랙홀', icon: '🕳️', damage: 16, color: 0xbf55ec, description: '중력 지각 붕괴' },
];

export const PokiPlanetDestructionGame: React.FC<PokiPlanetDestructionGameProps> = ({
  onBack,
  cardId = 53,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('meteor');
  const [destructionPct, setDestructionPct] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  // Engine Refs
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    planetGroup: null as THREE.Group | null,
    planetMesh: null as THREE.Mesh | null,
    cloudsMesh: null as THREE.Mesh | null,
    coreMesh: null as THREE.Mesh | null,
    craters: [] as THREE.Mesh[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    incomingProjectiles: [] as { mesh: THREE.Mesh; target: THREE.Vector3; vel: THREE.Vector3; wType: WeaponType }[],
    destruction: 0,
    isDestroyed: false,
    isSupernova: false,
    startTime: Date.now(),
    dragState: {
      isDragging: false,
      lastX: 0,
      lastY: 0,
      hasMoved: false,
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

  // Main Three.js Setup & Animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const game = gameRef.current;
    game.isDestroyed = false;
    game.isSupernova = false;
    game.destruction = 0;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    game.scene = scene;
    scene.background = new THREE.Color(0xe3dbfc);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8.5);
    game.camera = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    game.renderer = renderer;

    // 3. Lighting (Sun Light & Nebula Glow)
    const ambientLight = new THREE.AmbientLight(0x223355, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.position.set(10, 6, 8);
    scene.add(sunLight);

    const cosmicRimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    cosmicRimLight.position.set(-8, -4, -6);
    scene.add(cosmicRimLight);

    // 4. Background Starfield (800 stars)
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 60;
      starPositions[i + 1] = (Math.random() - 0.5) * 60;
      starPositions[i + 2] = (Math.random() - 0.5) * 60 - 10;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 5. 3D Planet Group (Radius 2.3)
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);
    game.planetGroup = planetGroup;

    // Internal Magma Core (Visible as planet crumbles)
    const coreGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    planetGroup.add(coreMesh);
    game.coreMesh = coreMesh;

    // Outer Crust Planet Body
    const planetGeo = new THREE.SphereGeometry(2.3, 36, 36);

    // Generate Earth-like Canvas Texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 1024;
    pCanvas.height = 512;
    const pCtx = pCanvas.getContext('2d')!;
    // Deep Blue Oceans
    pCtx.fillStyle = '#0f3871';
    pCtx.fillRect(0, 0, 1024, 512);
    // Green / Brown Continents
    pCtx.fillStyle = '#1e7b34';
    for (let i = 0; i < 8; i++) {
      pCtx.beginPath();
      const cx = 120 + i * 115;
      const cy = 256 + Math.sin(i) * 120;
      pCtx.ellipse(cx, cy, 80 + Math.random() * 40, 60 + Math.random() * 50, 0, 0, Math.PI * 2);
      pCtx.fill();
    }
    const planetTex = new THREE.CanvasTexture(pCanvas);

    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.6,
      metalness: 0.1,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);
    game.planetMesh = planetMesh;

    // Cloud Layer
    const cloudsGeo = new THREE.SphereGeometry(2.35, 32, 32);
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 512;
    cCanvas.height = 256;
    const cCtx = cCanvas.getContext('2d')!;
    cCtx.fillStyle = 'rgba(0,0,0,0)';
    cCtx.fillRect(0, 0, 512, 256);
    cCtx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 15; i++) {
      cCtx.beginPath();
      cCtx.arc(Math.random() * 512, Math.random() * 256, 25 + Math.random() * 35, 0, Math.PI * 2);
      cCtx.fill();
    }
    const cloudTex = new THREE.CanvasTexture(cCanvas);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.55,
      roughness: 1.0,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudMat);
    planetGroup.add(cloudsMesh);
    game.cloudsMesh = cloudsMesh;

    // Atmosphere Glow Rim
    const atmoGeo = new THREE.SphereGeometry(2.55, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 6. Particle Spawner Helper
    const spawnExplosion = (pos: THREE.Vector3, colorHex: number, count = 20) => {
      for (let i = 0; i < count; i++) {
        const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const pMat = new THREE.MeshBasicMaterial({ color: colorHex });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        const v = new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ).add(pos.clone().normalize().multiplyScalar(4));

        game.particles.push({ mesh: pMesh, vel: v, life: 0.8 });
      }
    };

    // 7. Raycasting & Weapon Fire Impact
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const triggerImpactAtPoint = (worldPoint: THREE.Vector3, wType: WeaponType) => {
      const cfg = WEAPONS.find((w) => w.type === wType) || WEAPONS[0];

      // Haptic
      if (navigator.vibrate) navigator.vibrate(30);

      // Create Crater on Planet
      const craterGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.15, 12);
      const craterMat = new THREE.MeshBasicMaterial({
        color: wType === 'laser' ? 0x00ffff : wType === 'blackhole' ? 0x220533 : 0x221105,
      });
      const crater = new THREE.Mesh(craterGeo, craterMat);

      // Position relative to planetGroup
      const localPos = planetGroup.worldToLocal(worldPoint.clone());
      crater.position.copy(localPos);
      crater.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), localPos.clone().normalize());

      planetGroup.add(crater);
      game.craters.push(crater);

      // Explosive Particles
      spawnExplosion(worldPoint, cfg.color, 24);

      // Update Destruction
      game.destruction = Math.min(100, game.destruction + cfg.damage);
      setDestructionPct(game.destruction);

      // Supernova check
      if (game.destruction >= 100 && !game.isSupernova) {
        game.isSupernova = true;
        triggerSupernova();
      }
    };

    // Supernova Shatter Finale
    const triggerSupernova = () => {
      if (navigator.vibrate) navigator.vibrate([60, 80, 100, 120]);

      // Remove crust & clouds
      if (planetMesh) planetMesh.visible = false;
      if (cloudsMesh) cloudsMesh.visible = false;

      // Explode 40 debris rocks outward
      for (let i = 0; i < 40; i++) {
        const dGeo = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3);
        const dMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0x552211 : 0xff3300,
          roughness: 0.8,
        });
        const dMesh = new THREE.Mesh(dGeo, dMat);
        dMesh.position.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        );
        scene.add(dMesh);

        const v = dMesh.position.clone().normalize().multiplyScalar(6 + Math.random() * 8);
        game.particles.push({ mesh: dMesh, vel: v, life: 3.0 });
      }

      setTimeout(() => {
        setGameWon(true);
        const result = calculateAndDepositMissionReward({
          gameId: 'poki_planet_destruction',
          gameTitle: 'Planet Destruction 3D',
          isVictory: true,
          score: 100,
          maxTargetScore: 100,
          durationSeconds: Math.floor((Date.now() - game.startTime) / 1000),
        });
        setRewardResult(result);
      }, 1500);
    };

    // 8. Pointer Handling (Tap = Attack, Drag = Rotate Planet)
    const domElem = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      game.dragState.isDragging = true;
      game.dragState.lastX = e.clientX;
      game.dragState.lastY = e.clientY;
      game.dragState.hasMoved = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!game.dragState.isDragging) return;
      const dx = e.clientX - game.dragState.lastX;
      const dy = e.clientY - game.dragState.lastY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        game.dragState.hasMoved = true;
      }

      // Rotate Planet Group
      planetGroup.rotation.y += dx * 0.008;
      planetGroup.rotation.x += dy * 0.008;

      game.dragState.lastX = e.clientX;
      game.dragState.lastY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      game.dragState.isDragging = false;

      // If tap without drag: launch weapon attack at planet
      if (!game.dragState.hasMoved && !game.isSupernova) {
        const rect = domElem.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(planetMesh);

        if (intersects.length > 0) {
          const hitPoint = intersects[0].point;
          triggerImpactAtPoint(hitPoint, selectedWeapon);
        }
      }
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointermove', onPointerMove);
    domElem.addEventListener('pointerup', onPointerUp);

    // 9. Resize Listener
    const handleResize = () => {
      if (!game.camera || !game.renderer) return;
      game.camera.aspect = window.innerWidth / window.innerHeight;
      game.camera.updateProjectionMatrix();
      game.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 10. Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      if (game.isDestroyed) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Auto idle planet spin
      if (planetGroup && !game.dragState.isDragging) {
        planetGroup.rotation.y += delta * 0.12;
      }

      // Clouds faster drift
      if (cloudsMesh) {
        cloudsMesh.rotation.y += delta * 0.04;
      }

      // Pulse Magma Core as destruction rises
      if (coreMesh) {
        const scale = 1.0 + (game.destruction / 100) * 0.4 + Math.sin(time * 0.008) * 0.05;
        coreMesh.scale.set(scale, scale, scale);
      }

      // Update Particles
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
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointermove', onPointerMove);
      domElem.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const hudUniqueId = useId();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#e3dbfc] font-mono text-white"
    >
      {/* Minimalist Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        key={hudUniqueId}
        title="PLANET DESTRUCTION 3D"
        progress={`파괴율: ${destructionPct}% / 100%`}
        onGiveUp={() => {
          const res = calculateAndDepositMissionReward({
            gameId: 'poki_planet_destruction',
            gameTitle: 'Planet Destruction 3D',
            isVictory: false,
            score: destructionPct,
            maxTargetScore: 100,
            durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
          });
          setRewardResult(res);
        }}
      />

      {/* Hero Badge & Cosmic Destruction Status */}
      <div className="absolute top-14 left-3 z-20 flex items-center gap-2 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded-sm border border-cyan-500/30">
        <canvas
          ref={heroBadgeCanvasRef}
          width={48}
          height={48}
          className="w-8 h-8 rounded border border-cyan-400/50 bg-black/40"
        />
        <div className="text-xs">
          <div className="text-cyan-400 font-bold">SOLAR SMASH</div>
          <div className="text-[10px] text-gray-300">행성 회전: 드래그 | 타격: 탭</div>
        </div>
      </div>

      {/* Destruction Percentage Bar */}
      <div className="absolute top-14 right-3 z-20 pointer-events-none bg-black/60 px-3 py-1.5 rounded-sm border border-red-500/30 text-right">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider">PLANET CORE</div>
        <div className="text-base font-black text-red-400 tracking-wider">
          {destructionPct}% DESTROYED
        </div>
      </div>

      {/* Guide Indicator */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center bg-black/50 px-3 py-1 rounded border border-white/10 text-[10px] text-gray-300">
        🎯 행성 표면을 탭하여 무기를 투하하세요!
      </div>

      {/* Bottom Weapon Selection Dock */}
      <div className="absolute bottom-6 left-3 right-3 z-20 bg-gray-950/85 backdrop-blur-md border border-red-500/40 rounded-sm p-2 shadow-2xl flex items-center justify-between gap-2 pointer-events-auto">
        {WEAPONS.map((w) => (
          <button
            key={w.type}
            onClick={() => {
              setSelectedWeapon(w.type);
              if (navigator.vibrate) navigator.vibrate(15);
            }}
            className={`flex-1 py-2 px-1 rounded-sm text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
              selectedWeapon === w.type
                ? 'bg-red-600/30 border-red-400 text-red-300 shadow-md scale-102'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="text-lg">{w.icon}</span>
            <span className="text-[10px] truncate w-full text-center">{w.name}</span>
            <span className="text-[9px] text-yellow-400 font-normal">+{w.damage}%</span>
          </button>
        ))}
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full bg-gray-900 border border-red-500/60 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-xl font-black text-red-400 tracking-wider mb-2">
              PLANET DESTRUCTION 3D
            </div>
            <div className="text-xs text-gray-300 space-y-2 mb-5 leading-relaxed text-left">
              <p>• 🌍 <b className="text-white">행성 회전</b>: 화면을 드래그해 행성을 360° 회전하세요.</p>
              <p>• ☄️ <b className="text-amber-400">무기 선택</b>: 운석, 이온 레이저, 핵미사일, 블랙홀을 선택하세요.</p>
              <p>• 🎯 <b className="text-cyan-300">정밀 폭격</b>: 표면을 탭하여 지표면을 파괴하세요.</p>
              <p>• 💥 <b className="text-red-400">슈퍼노바</b>: 파괴율 100% 달성 시 행성이 산산조각 폭발하며 승리합니다!</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-red-600 active:bg-red-500 text-white font-bold text-sm tracking-wider rounded-sm border border-red-400 shadow-md"
            >
              [ 궤도 폭격 개시 ]
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

export default PokiPlanetDestructionGame;

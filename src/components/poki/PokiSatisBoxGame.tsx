import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSatisBoxGameProps {
  onBack: () => void;
  cardId?: number;
}

interface SatisItem3D {
  id: number;
  name: string;
  mesh: THREE.Group;
  slotPos: THREE.Vector3;
  restPos: THREE.Vector3;
  isPlaced: boolean;
  isDragging: boolean;
}

interface StageTheme {
  title: string;
  boxColor: number;
  items: { name: string; type: string; color: number }[];
}

const STAGES: StageTheme[] = [
  {
    title: '1. 문구류 필통 박스',
    boxColor: 0x4a6b82,
    items: [
      { name: '블루 펜', type: 'pen', color: 0x2563eb },
      { name: '노란 연필', type: 'pencil', color: 0xeab308 },
      { name: '형광펜', type: 'highlighter', color: 0x22c55e },
      { name: '화이트 지우개', type: 'eraser', color: 0xf8fafc },
      { name: '아크릴 자', type: 'ruler', color: 0x38bdf8 },
    ],
  },
  {
    title: '2. 뷰티 코스메틱 트레이',
    boxColor: 0x8a4b66,
    items: [
      { name: '레드 립스틱', type: 'lipstick', color: 0xd32f2f },
      { name: '크리스탈 향수', type: 'perfume', color: 0xe0e7ff },
      { name: '핑크 매니큐어', type: 'nailpolish', color: 0xf43f5e },
      { name: '파우더 팩트', type: 'powder', color: 0xd4af37 },
      { name: '메이크업 브러시', type: 'brush', color: 0x854d0e },
    ],
  },
  {
    title: '3. 벤토 정갈한 도시락',
    boxColor: 0x2d5a27,
    items: [
      { name: '삼각 오니기리', type: 'onigiri', color: 0xffffff },
      { name: '연어초밥', type: 'sushi', color: 0xf97316 },
      { name: '계란말이', type: 'tamago', color: 0xfacc15 },
      { name: '브로콜리', type: 'broccoli', color: 0x15803d },
      { name: '방울토마토', type: 'tomato', color: 0xef4444 },
    ],
  },
];

export const PokiSatisBoxGame: React.FC<PokiSatisBoxGameProps> = ({
  onBack,
  cardId = 55,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stage & Progress States
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [placedInStage, setPlacedInStage] = useState(0);
  const [totalPlaced, setTotalPlaced] = useState(0);
  const [satisfiedBanner, setSatisfiedBanner] = useState<string | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  // Engine State
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    boxMesh: null as THREE.Mesh | null,
    slotIndicators: [] as THREE.Mesh[],
    items: [] as SatisItem3D[],
    draggedItem: null as SatisItem3D | null,
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    dragPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.7),
    planeIntersect: new THREE.Vector3(),
    currentStage: 0,
    startTime: Date.now(),
    isDestroyed: false,
  });

  // Hero Card Sprite Badge
  useEffect(() => {
    const canvas = heroBadgeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, cardId, 0, 0, 48, 48);
  }, [cardId]);

  // Stage Builder Helper
  const loadStage = useCallback((stageIndex: number) => {
    const game = gameRef.current;
    const scene = game.scene;
    if (!scene) return;

    game.currentStage = stageIndex;
    setCurrentStageIdx(stageIndex);
    setPlacedInStage(0);

    // Clear old items & slots
    game.items.forEach((item) => scene.remove(item.mesh));
    game.slotIndicators.forEach((s) => scene.remove(s));
    game.items = [];
    game.slotIndicators = [];

    const theme = STAGES[stageIndex];

    // Update Box Color
    if (game.boxMesh) {
      (game.boxMesh.material as THREE.MeshStandardMaterial).color.setHex(theme.boxColor);
    }

    // 5 Slots in Box (Z = -0.6 ~ -2.4)
    const slotXPositions = [-2.6, -1.3, 0, 1.3, 2.6];
    const slotZ = -1.4;

    slotXPositions.forEach((sx, idx) => {
      // Slot Indicator outline
      const sGeo = new THREE.BoxGeometry(1.1, 0.05, 3.2);
      const sMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(sx, 0.05, slotZ);
      scene.add(sMesh);
      game.slotIndicators.push(sMesh);

      // Create Item Mesh
      const itemCfg = theme.items[idx];
      const itemGroup = new THREE.Group();

      const mat = new THREE.MeshStandardMaterial({
        color: itemCfg.color,
        roughness: 0.3,
        metalness: 0.2,
      });

      if (itemCfg.type === 'pen' || itemCfg.type === 'pencil' || itemCfg.type === 'highlighter') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 12), mat);
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        itemGroup.add(body);
      } else if (itemCfg.type === 'eraser') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 1.4), mat);
        body.castShadow = true;
        itemGroup.add(body);
      } else if (itemCfg.type === 'ruler') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 2.8), mat);
        body.castShadow = true;
        itemGroup.add(body);
      } else if (itemCfg.type === 'lipstick' || itemCfg.type === 'perfume' || itemCfg.type === 'nailpolish') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.65), mat);
        body.castShadow = true;
        itemGroup.add(body);
      } else if (itemCfg.type === 'powder') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 16), mat);
        body.castShadow = true;
        itemGroup.add(body);
      } else if (itemCfg.type === 'brush') {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), mat);
        handle.rotation.x = Math.PI / 2;
        handle.castShadow = true;
        itemGroup.add(handle);
      } else if (itemCfg.type === 'onigiri') {
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 3), mat);
        body.rotation.y = Math.PI / 6;
        body.castShadow = true;
        itemGroup.add(body);
      } else if (itemCfg.type === 'sushi' || itemCfg.type === 'tamago') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 1.3), mat);
        body.castShadow = true;
        itemGroup.add(body);
      } else {
        // broccoli / tomato
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), mat);
        body.castShadow = true;
        itemGroup.add(body);
      }

      // Initial Unorganized Rest Position (in lower tray Z: 2.2 ~ 3.4)
      const rx = (Math.random() - 0.5) * 5.5;
      const rz = 2.2 + Math.random() * 1.5;
      itemGroup.position.set(rx, 0.25, rz);
      itemGroup.rotation.y = (Math.random() - 0.5) * 1.2;
      scene.add(itemGroup);

      game.items.push({
        id: idx,
        name: itemCfg.name,
        mesh: itemGroup,
        slotPos: new THREE.Vector3(sx, 0.2, slotZ),
        restPos: new THREE.Vector3(rx, 0.25, rz),
        isPlaced: false,
        isDragging: false,
      });
    });
  }, []);

  // Main Three.js Initialization & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const game = gameRef.current;
    game.isDestroyed = false;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    game.scene = scene;
    scene.background = new THREE.Color(0xf6ede2);

    const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 11, 4.2);
    camera.lookAt(0, -0.2, 0.2);
    game.camera = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    game.renderer = renderer;

    // 3. Lighting (Warm Natural Sunlight)
    const ambientLight = new THREE.AmbientLight(0xfff7ee, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    sunLight.position.set(5, 14, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 4. Desk Table (Warm Wood Desktop)
    const tableGeo = new THREE.PlaneGeometry(16, 16);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xdfc9af,
      roughness: 0.6,
      metalness: 0.1,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.rotation.x = -Math.PI / 2;
    tableMesh.position.y = -0.05;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // 5. Organizer Box Outer Rim
    const boxGeo = new THREE.BoxGeometry(7.2, 0.4, 4.2);
    const boxMat = new THREE.MeshStandardMaterial({
      color: STAGES[0].boxColor,
      roughness: 0.4,
      metalness: 0.2,
    });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.set(0, 0.15, -1.4);
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);
    game.boxMesh = boxMesh;

    // Lower Messy Tray Mat
    const trayGeo = new THREE.PlaneGeometry(7.2, 3.2);
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0xcbb296,
      roughness: 0.8,
    });
    const trayMesh = new THREE.Mesh(trayGeo, trayMat);
    trayMesh.rotation.x = -Math.PI / 2;
    trayMesh.position.set(0, 0.01, 2.9);
    trayMesh.receiveShadow = true;
    scene.add(trayMesh);

    // Load Initial Stage 0
    loadStage(0);

    // 6. Particle Spawner
    const spawnSparkles = (pos: THREE.Vector3) => {
      for (let i = 0; i < 16; i++) {
        const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? 0xffd700 : 0xffffff });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        const v = new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 4
        );
        game.particles.push({ mesh: pMesh, vel: v, life: 0.6 });
      }
    };

    // 7. Touch & Drag Event Handlers
    const domElem = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      const rect = domElem.getBoundingClientRect();
      game.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      game.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      game.raycaster.setFromCamera(game.mouse, camera);

      // Check intersection with unplaced items
      const candidateMeshes = game.items.filter((it) => !it.isPlaced).map((it) => it.mesh);
      const intersects = game.raycaster.intersectObjects(candidateMeshes, true);

      if (intersects.length > 0) {
        // Find top-level group
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !candidateMeshes.includes(hitObj as THREE.Group)) {
          hitObj = hitObj.parent;
        }

        if (hitObj) {
          const item = game.items.find((it) => it.mesh === hitObj);
          if (item) {
            game.draggedItem = item;
            item.isDragging = true;
            item.mesh.position.y = 0.8; // lift up
            if (navigator.vibrate) navigator.vibrate(15);
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!game.draggedItem) return;

      const rect = domElem.getBoundingClientRect();
      game.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      game.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      game.raycaster.setFromCamera(game.mouse, camera);
      if (game.raycaster.ray.intersectPlane(game.dragPlane, game.planeIntersect)) {
        game.draggedItem.mesh.position.x = game.planeIntersect.x;
        game.draggedItem.mesh.position.z = game.planeIntersect.z;
      }
    };

    const onPointerUp = () => {
      if (!game.draggedItem) return;
      const item = game.draggedItem;
      item.isDragging = false;
      game.draggedItem = null;

      // Magnetic Snapping check: Distance to correct slotPos
      const dist = new THREE.Vector2(
        item.mesh.position.x - item.slotPos.x,
        item.mesh.position.z - item.slotPos.z
      ).length();

      if (dist < 1.1) {
        // PERFECT SNAP!
        item.isPlaced = true;
        item.mesh.position.copy(item.slotPos);
        item.mesh.rotation.set(0, 0, 0);

        spawnSparkles(item.slotPos);
        if (navigator.vibrate) navigator.vibrate([25, 35]);

        setSatisfiedBanner(`✨ SATISFYING SNAP! (+1)`);
        setTimeout(() => setSatisfiedBanner(null), 900);

        setPlacedInStage((prev) => {
          const next = prev + 1;
          setTotalPlaced((t) => t + 1);

          // Check Stage Completion (5 items)
          if (next >= 5) {
            setTimeout(() => {
              if (game.currentStage < STAGES.length - 1) {
                // Next Stage
                loadStage(game.currentStage + 1);
              } else {
                // Victory!
                setGameWon(true);
                const result = calculateAndDepositMissionReward({
                  gameId: 'poki_satis_box',
                  gameTitle: 'SatisBox Mini Games 3D',
                  isVictory: true,
                  score: 150,
                  maxTargetScore: 150,
                  durationSeconds: Math.floor((Date.now() - game.startTime) / 1000),
                });
                setRewardResult(result);
              }
            }, 800);
          }
          return next;
        });
      } else {
        // Return to rest position
        item.mesh.position.copy(item.restPos);
        if (navigator.vibrate) navigator.vibrate(10);
      }
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointermove', onPointerMove);
    domElem.addEventListener('pointerup', onPointerUp);

    // 8. Resize Listener
    const handleResize = () => {
      if (!game.camera || !game.renderer) return;
      game.camera.aspect = window.innerWidth / window.innerHeight;
      game.camera.updateProjectionMatrix();
      game.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 9. Main Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      if (game.isDestroyed) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

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
  }, [gameWon, gameOver, loadStage]);

  const hudUniqueId = useId();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#f6ede2] font-mono text-zinc-900"
    >
      {/* Minimalist Top HUD */}
      <MinimalistMissionHUD
        key={hudUniqueId}
        title="SATISBOX 3D"
        progress={`${STAGES[currentStageIdx]?.title} (${placedInStage}/5)`}
        onGiveUp={() => {
          const res = calculateAndDepositMissionReward({
            gameId: 'poki_satis_box',
            gameTitle: 'SatisBox Mini Games 3D',
            isVictory: false,
            score: totalPlaced * 10,
            maxTargetScore: 150,
            durationSeconds: Math.floor((Date.now() - gameRef.current.startTime) / 1000),
          });
          setRewardResult(res);
        }}
      />

      {/* Hero Badge & Progress Card */}
      <div className="absolute top-14 left-3 z-20 flex items-center gap-2 pointer-events-none bg-white/80 backdrop-blur px-2.5 py-1.5 rounded-sm border border-amber-900/20 shadow-sm">
        <canvas
          ref={heroBadgeCanvasRef}
          width={48}
          height={48}
          className="w-8 h-8 rounded border border-amber-800/30 bg-amber-50"
        />
        <div className="text-xs">
          <div className="text-amber-950 font-bold">ORGANIZER ASMR</div>
          <div className="text-[10px] text-amber-800">
            스테이지 {currentStageIdx + 1} / 3
          </div>
        </div>
      </div>

      {/* Snapping Satisfying Banner */}
      {satisfiedBanner && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-emerald-600 text-white font-black px-4 py-1.5 rounded shadow-lg text-xs tracking-wider animate-bounce">
          {satisfiedBanner}
        </div>
      )}

      {/* Guide Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center bg-black/60 px-4 py-1.5 rounded-full text-xs text-white shadow-md">
        👆 하단의 물건을 드래그하여 상단 박스 슬롯에 칼각 정리하세요!
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
          <div className="max-w-sm w-full bg-white border border-amber-800/30 p-5 rounded-sm shadow-2xl text-center">
            <div className="text-xl font-black text-amber-900 tracking-wider mb-2">
              SATISBOX MINI GAMES 3D
            </div>
            <div className="text-xs text-stone-700 space-y-2 mb-5 leading-relaxed text-left">
              <p>• 📦 <b className="text-stone-900">정리정돈의 미학</b>: 어지러운 물건을 상단 트레이 슬롯에 드래그하세요.</p>
              <p>• 🧲 <b className="text-amber-700">마그네틱 스냅</b>: 알맞은 위치 근처에 놓으면 찰칵! 스냅됩니다.</p>
              <p>• ✨ <b className="text-emerald-700">3개 테마 박스</b>: 문구류, 화장품, 벤토 도시락을 모두 정리해 평화를 되찾으세요!</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-amber-800 active:bg-amber-700 text-white font-bold text-sm tracking-wider rounded-sm shadow-md"
            >
              [ 정리정돈 시작 ]
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

export default PokiSatisBoxGame;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { RotateCcw, Sparkles, CheckCircle2, Trophy } from 'lucide-react';

interface PokiPerfectShapeGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

type ShapeType = 'CIRCLE' | 'TRIANGLE' | 'SQUARE' | 'STAR';

interface RoundConfig {
  type: ShapeType;
  name: string;
  desc: string;
}

const ROUNDS: RoundConfig[] = [
  { type: 'CIRCLE', name: '라운드 1: 완벽한 원 (Circle)', desc: '중심을 기준으로 매끄러운 원을 그려보세요.' },
  { type: 'TRIANGLE', name: '라운드 2: 정삼각형 (Triangle)', desc: '세 변의 길이가 같은 균형 잡힌 삼각형을 그리세요.' },
  { type: 'SQUARE', name: '라운드 3: 정사각형 (Square)', desc: '네 각이 직각인 반듯한 사각형을 완성하세요.' },
  { type: 'STAR', name: '라운드 4: 황금 오각별 (Golden Star)', desc: '다섯 개의 뾰족한 끝을 가진 별을 그려보세요!' },
];

export const PokiPerfectShapeGame: React.FC<PokiPerfectShapeGameProps> = ({
  onBack,
  onExit,
  cardId = 28,
  deck,
  lowSpecMode = false,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => {});
  const playerHeroId = deck?.[0]?.id || cardId || 28;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI State
  const [roundIdx, setRoundIdx] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [avgScore, setAvgScore] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Time & Score tracking
  const startTimeRef = useRef<number>(Date.now());
  const roundScoresRef = useRef<number[]>([]);

  // Internal Logic State
  const gameStateRef = useRef<{
    round: number;
    isDrawing: boolean;
    drawnPoints: { x: number; z: number }[];
    strokeMeshes: THREE.Mesh[];
    guideMesh: THREE.Line | null;
    targetPoints: { x: number; z: number }[];
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    isEvaluating: boolean;
  }>({
    round: 0,
    isDrawing: false,
    drawnPoints: [],
    strokeMeshes: [],
    guideMesh: null,
    targetPoints: [],
    particles: null,
    particleVels: [],
    isEvaluating: false,
  });

  // Three.js References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    strokeGroup: THREE.Group;
    brushTip: THREE.Mesh;
    workbenchGroup: THREE.Group;
    raycaster: THREE.Raycaster;
    plane: THREE.Plane;
    animFrameId: number;
  } | null>(null);

  // Confetti Particle Explosion
  const spawnConfetti = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 80, 50, 120]);
    }

    const count = 50;
    const posArr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 3;
      posArr[i * 3 + 1] = 0.5;
      posArr[i * 3 + 2] = (Math.random() - 0.5) * 3;

      const col = new THREE.Color().setHSL(Math.random(), 0.9, 0.6);
      colArr[i * 3] = col.r;
      colArr[i * 3 + 1] = col.g;
      colArr[i * 3 + 2] = col.b;

      vels.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 7,
          Math.random() * 6 + 3,
          (Math.random() - 0.5) * 7
        )
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 1,
    });

    if (gameStateRef.current.particles) {
      three.scene.remove(gameStateRef.current.particles);
      gameStateRef.current.particles.geometry.dispose();
    }

    const pMesh = new THREE.Points(geo, mat);
    gameStateRef.current.particles = pMesh;
    gameStateRef.current.particleVels = vels;
    three.scene.add(pMesh);
  }, []);

  // Distance from point P to line segment AB
  const distToSegment = (px: number, pz: number, ax: number, az: number, bx: number, bz: number) => {
    const l2 = (bx - ax) * (bx - ax) + (bz - az) * (bz - az);
    if (l2 === 0) return Math.hypot(px - ax, pz - az);
    let t = ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * (bx - ax)), pz - (az + t * (bz - az)));
  };

  // Generate 3D Target Guide Wireframe & Key Points
  const buildTargetGuide = useCallback((type: ShapeType) => {
    const points: THREE.Vector3[] = [];
    const targetKeyPoints: { x: number; z: number }[] = [];

    if (type === 'CIRCLE') {
      const r = 2.4;
      const segs = 64;
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        points.push(new THREE.Vector3(x, 0.22, z));
      }
    } else if (type === 'TRIANGLE') {
      const r = 2.6;
      for (let i = 0; i < 3; i++) {
        const theta = (i / 3) * Math.PI * 2 - Math.PI / 2;
        targetKeyPoints.push({ x: Math.cos(theta) * r, z: Math.sin(theta) * r });
      }
      targetKeyPoints.forEach((p) => points.push(new THREE.Vector3(p.x, 0.22, p.z)));
      points.push(new THREE.Vector3(targetKeyPoints[0].x, 0.22, targetKeyPoints[0].z)); // close loop
    } else if (type === 'SQUARE') {
      const half = 1.9;
      targetKeyPoints.push(
        { x: -half, z: -half },
        { x: half, z: -half },
        { x: half, z: half },
        { x: -half, z: half }
      );
      targetKeyPoints.forEach((p) => points.push(new THREE.Vector3(p.x, 0.22, p.z)));
      points.push(new THREE.Vector3(targetKeyPoints[0].x, 0.22, targetKeyPoints[0].z));
    } else if (type === 'STAR') {
      const rOuter = 2.5;
      const rInner = 1.15;
      for (let i = 0; i < 10; i++) {
        const theta = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? rOuter : rInner;
        targetKeyPoints.push({ x: Math.cos(theta) * r, z: Math.sin(theta) * r });
      }
      targetKeyPoints.forEach((p) => points.push(new THREE.Vector3(p.x, 0.22, p.z)));
      points.push(new THREE.Vector3(targetKeyPoints[0].x, 0.22, targetKeyPoints[0].z));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);

    return { line, targetKeyPoints };
  }, []);

  // Clear current drawing
  const clearDrawing = useCallback(() => {
    const s = gameStateRef.current;
    const three = threeRef.current;
    if (s.isEvaluating) return;

    s.drawnPoints = [];
    s.isDrawing = false;
    setAccuracy(null);
    setBanner(null);

    if (three) {
      while (three.strokeGroup.children.length > 0) {
        three.strokeGroup.remove(three.strokeGroup.children[0]);
      }
      three.brushTip.visible = false;
    }
  }, []);

  // Initialize a round
  const initRound = useCallback(
    (idx: number) => {
      const s = gameStateRef.current;
      s.round = idx;
      s.isEvaluating = false;
      setRoundIdx(idx);
      clearDrawing();

      const three = threeRef.current;
      if (!three) return;

      if (s.guideMesh) {
        three.scene.remove(s.guideMesh);
        s.guideMesh.geometry.dispose();
      }

      const { line, targetKeyPoints } = buildTargetGuide(ROUNDS[idx].type);
      three.scene.add(line);
      s.guideMesh = line;
      s.targetPoints = targetKeyPoints;
    },
    [buildTargetGuide, clearDrawing]
  );

  // Evaluate Drawing Accuracy
  const evaluateDrawing = useCallback(() => {
    const s = gameStateRef.current;
    if (s.drawnPoints.length < 15 || s.isEvaluating) return;

    s.isEvaluating = true;
    const pts = s.drawnPoints;
    const type = ROUNDS[s.round].type;
    let totalDev = 0;

    if (type === 'CIRCLE') {
      const targetR = 2.4;
      pts.forEach((p) => {
        const d = Math.hypot(p.x, p.z);
        totalDev += Math.abs(d - targetR);
      });
    } else {
      // Distance to nearest polygon segment
      const keys = s.targetPoints;
      pts.forEach((p) => {
        let minDist = Infinity;
        for (let i = 0; i < keys.length; i++) {
          const next = (i + 1) % keys.length;
          const d = distToSegment(p.x, p.z, keys[i].x, keys[i].z, keys[next].x, keys[next].z);
          if (d < minDist) minDist = d;
        }
        totalDev += minDist;
      });
    }

    const avgDev = totalDev / pts.length;
    // Accuracy percentage calculation
    const score = Math.max(0, Math.min(100, Math.round(100 - avgDev * 42)));
    setAccuracy(score);
    roundScoresRef.current.push(score);

    const curAvg = Math.round(
      roundScoresRef.current.reduce((a, b) => a + b, 0) / roundScoresRef.current.length
    );
    setAvgScore(curAvg);

    if (score >= 80) {
      setBanner(`PERFECT! ${score}% 🌟`);
      spawnConfetti();
    } else if (score >= 60) {
      setBanner(`GREAT! ${score}% 👍`);
      if (navigator.vibrate) navigator.vibrate(40);
    } else {
      setBanner(`NICE TRY! ${score}%`);
      if (navigator.vibrate) navigator.vibrate(20);
    }

    setTimeout(() => {
      if (s.round + 1 < ROUNDS.length) {
        initRound(s.round + 1);
      } else {
        // Tournament Finished
        const isVic = curAvg >= 75;
        const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
        const receipt = calculateAndDepositMissionReward({
          gameId: 'poki_perfect_shape',
          gameTitle: 'Perfect Shape 3D',
          durationSeconds: duration,
          score: curAvg * 10,
          maxTargetScore: 1000,
          isVictory: isVic,
        });
        setRewardResult(receipt);
        if (isVic) setGameWon(true);
        else setGameOver(true);
      }
    }, 1700);
  }, [initRound, spawnConfetti]);

  // Give Up Handler
  const handleGiveUp = useCallback(() => {
    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const finalScore = avgScore * 10;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_perfect_shape',
      gameTitle: 'Perfect Shape 3D',
      durationSeconds: duration,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: false,
    });
    setRewardResult(receipt);
    setGameOver(true);
  }, [avgScore]);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16); // Deep Cyber Atelier Night
    scene.fog = new THREE.FogExp2(0x090d16, 0.02);

    // 2. Camera (Top-down Isometric View)
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 9.2, 5.8);
    camera.lookAt(0, 0, 0);

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

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    dirLight.position.set(8, 18, 10);
    if (!lowSpecMode) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    const spotLight = new THREE.SpotLight(0x38bdf8, 2.5, 20, Math.PI / 4, 0.3);
    spotLight.position.set(0, 10, 0);
    scene.add(spotLight);

    // 5. Workbench Atelier Canvas (Cylinder Platform)
    const workbenchGroup = new THREE.Group();
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.2,
    });
    const table = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.4, 48), tableMat);
    table.position.y = 0;
    table.receiveShadow = !lowSpecMode;
    workbenchGroup.add(table);

    // Platform Golden Rim
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.08, 16, 48), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.2;
    workbenchGroup.add(rim);

    // Hero No.028 Badge on Wall/Corner
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 64;
    badgeCanvas.height = 64;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, playerHeroId, 0, 0, 64, 64);
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, transparent: true }));
    badgeSprite.scale.set(0.7, 0.7, 0.7);
    badgeSprite.position.set(0, 0.25, -3.8);
    workbenchGroup.add(badgeSprite);

    scene.add(workbenchGroup);

    // 6. Group for 3D User Neon Strokes
    const strokeGroup = new THREE.Group();
    scene.add(strokeGroup);

    // 7. Glowing Brush Tip
    const brushTipMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const brushTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), brushTipMat);
    brushTip.position.y = 0.24;
    brushTip.visible = false;
    scene.add(brushTip);

    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.22); // Horizontal drawing plane

    threeRef.current = {
      scene,
      camera,
      renderer,
      strokeGroup,
      brushTip,
      workbenchGroup,
      raycaster,
      plane,
      animFrameId: 0,
    };

    initRound(0);

    // 8. Main Render Loop
    let lastTime = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const s = gameStateRef.current;
      const three = threeRef.current;

      if (three) {
        // Update Particles
        if (s.particles && s.particleVels.length > 0) {
          const posAttr = s.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < s.particleVels.length; i++) {
            const v = s.particleVels[i];
            posArr[i * 3] += v.x * dt;
            posArr[i * 3 + 1] += v.y * dt;
            posArr[i * 3 + 2] += v.z * dt;
            v.y -= 11 * dt; // gravity
          }
          posAttr.needsUpdate = true;
          (s.particles.material as THREE.PointsMaterial).opacity = Math.max(
            0,
            (s.particles.material as THREE.PointsMaterial).opacity - dt * 1.1
          );
        }

        three.renderer.render(three.scene, three.camera);
        three.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    threeRef.current.animFrameId = requestAnimationFrame(renderLoop);

    // Resize Handler
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
  }, [initRound, lowSpecMode, playerHeroId]);

  // Touch Drawing Event Handlers
  const addStrokePoint = (x: number, z: number) => {
    const s = gameStateRef.current;
    const three = threeRef.current;
    if (!three || s.isEvaluating) return;

    const lastP = s.drawnPoints[s.drawnPoints.length - 1];
    if (lastP) {
      const dist = Math.hypot(x - lastP.x, z - lastP.z);
      if (dist < 0.12) return; // ignore jitter

      // Draw 3D Tube Segment between lastP and current
      const segLen = dist;
      const segGeo = new THREE.CylinderGeometry(0.08, 0.08, segLen, 8);
      const segMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const segMesh = new THREE.Mesh(segGeo, segMat);

      // Midpoint & Rotation
      const midX = (lastP.x + x) / 2;
      const midZ = (lastP.z + z) / 2;
      segMesh.position.set(midX, 0.23, midZ);

      segMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(x - lastP.x, 0, z - lastP.z).normalize()
      );
      segMesh.castShadow = !lowSpecMode;

      three.strokeGroup.add(segMesh);
      s.strokeMeshes.push(segMesh);
    }

    s.drawnPoints.push({ x, z });
    three.brushTip.position.set(x, 0.24, z);
    three.brushTip.visible = true;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const container = containerRef.current;
    const three = threeRef.current;
    if (!container || !three || gameStateRef.current.isEvaluating || gameOver || gameWon) return;

    clearDrawing();
    gameStateRef.current.isDrawing = true;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    three.raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), three.camera);
    const intersectPt = new THREE.Vector3();
    if (three.raycaster.ray.intersectPlane(three.plane, intersectPt)) {
      addStrokePoint(intersectPt.x, intersectPt.z);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = containerRef.current;
    const three = threeRef.current;
    if (!container || !three || !gameStateRef.current.isDrawing) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    three.raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), three.camera);
    const intersectPt = new THREE.Vector3();
    if (three.raycaster.ray.intersectPlane(three.plane, intersectPt)) {
      addStrokePoint(intersectPt.x, intersectPt.z);
    }
  };

  const handlePointerUp = () => {
    const s = gameStateRef.current;
    if (!s.isDrawing) return;
    s.isDrawing = false;
    evaluateDrawing();
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="No.028 Perfect Shape 3D"
        score={avgScore * 10}
        scoreLabel="정확도 점수"
        targetLabel="마스터 조각"
        targetProgress={`${roundIdx + 1} / 4 ROUND`}
        onGiveUp={handleGiveUp}
      />

      {/* Round & Accuracy Overlay */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Round Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-sky-500/40 flex items-center space-x-2 shadow-lg">
          <Trophy className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-sky-200">{ROUNDS[roundIdx].name}</span>
        </div>

        {/* Avg Score Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/40 flex items-center space-x-2 shadow-lg">
          <span className="text-xs font-black text-amber-300">
            평균 정확도: {avgScore}%
          </span>
        </div>
      </div>

      {/* Accuracy Evaluation Banner */}
      {banner && (
        <div className="absolute top-28 left-0 right-0 pointer-events-none flex justify-center">
          <div className="bg-gradient-to-r from-amber-500 to-sky-500 text-white px-8 py-3 rounded-2xl text-lg font-black shadow-2xl animate-bounce flex items-center space-x-2">
            <Sparkles className="w-6 h-6" />
            <span>{banner}</span>
          </div>
        </div>
      )}

      {/* Mobile Pure Touch Bottom Controls */}
      <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-auto flex items-center justify-between max-w-sm mx-auto">
        <button
          onClick={clearDrawing}
          className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-600 text-rose-400 flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all"
          title="지우고 다시 그리기"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">다시그리기</span>
        </button>

        <div className="text-center pointer-events-none">
          <span className="text-[11px] font-semibold text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700 shadow-md">
            가이드라인을 따라 한 번에 그리세요
          </span>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 text-emerald-400 flex flex-col items-center justify-center pointer-events-none">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">{accuracy !== null ? `${accuracy}%` : '-'}</span>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="퍼펙트 셰이프 3D (Perfect Shape 3D)"
          category="3D 정밀 윤곽선 드로잉 스킬 퍼즐"
          guideSteps={[
            {
              title: '3D 가이드라인 터치 드로잉 (Touch & Draw)',
              desc: '화면의 네온 가이드라인을 따라 손가락으로 한 번에 완벽한 3D 윤곽선을 그려내세요.',
              iconType: 'GESTURES',
            },
            {
              title: '정밀 정확도 평가 (Accuracy Scoring)',
              desc: '그리기를 마치면 목표 형상과의 오차를 정밀하게 분석하여 0~100%의 정확도 점수가 매겨집니다.',
              iconType: 'GOAL',
            },
            {
              title: '조각 마스터 보상 (Rewards)',
              desc: '4개 라운드의 평균 정확도 75% 이상을 달성하여 조각 마스터 트로피와 최대 50 SNS 보상을 쟁취하세요!',
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

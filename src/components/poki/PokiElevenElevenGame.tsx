import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiElevenElevenGameProps {
  onBack: () => void;

  onExit?: () => void;
  onClose?: () => void;
}

const GRID_SIZE = 11;
const TARGET_SCORE = 600;

interface ShapeDef {
  id: number;
  name: string;
  coords: Array<{ r: number; c: number }>;
  color: number;
}

const SHAPES: ShapeDef[] = [
  // 1x1 단일 큐브
  { id: 1, name: '1x1', coords: [{ r: 0, c: 0 }], color: 0xef4444 },
  // 2x2 정사각
  { id: 2, name: '2x2', coords: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }], color: 0x3b82f6 },
  // 3x1 가로바
  { id: 3, name: '3x1', coords: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }], color: 0x10b981 },
  // 1x3 세로바
  { id: 4, name: '1x3', coords: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }], color: 0xf59e0b },
  // L자 코너
  { id: 5, name: 'L-Corner', coords: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }], color: 0xa855f7 },
];

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiElevenElevenGame: React.FC<PokiElevenElevenGameProps> = ({
  onBack,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [currentScore, setCurrentScore] = useState(0);
  const [selectedShapeIdx, setSelectedShapeIdx] = useState<number>(0);
  const [availableShapes, setAvailableShapes] = useState<Array<ShapeDef | null>>([
    SHAPES[0],
    SHAPES[1],
    SHAPES[2],
  ]);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [toastText, setToastText] = useState('');

  const startTimeRef = useRef<number>(Date.now());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);

  // 11x11 3D 셀 및 큐브 메시 맵
  const boardCells = useRef<Array<Array<THREE.Mesh | null>>>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const placedCubes = useRef<Array<Array<THREE.Mesh | null>>>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );

  const particlesRef = useRef<Particle[]>([]);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // 햅틱 진동
  const triggerHaptic = (duration = 40) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const showToast = (text: string) => {
    setToastText(text);
    setTimeout(() => {
      setToastText((prev) => (prev === text ? '' : prev));
    }, 1800);
  };

  // 파티클 생성
  const spawnExplosion = (pos: THREE.Vector3, color: number) => {
    if (!sceneRef.current) return;
    const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    for (let i = 0; i < 15; i++) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const p: Particle = {
        mesh,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 6 + 2,
        vz: (Math.random() - 0.5) * 6,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
      };
      sceneRef.current.add(mesh);
      particlesRef.current.push(p);
    }
  };

  // 라인 클리어 검사 및 처리
  const checkAndClearLines = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const fullRows: number[] = [];
    const fullCols: number[] = [];

    // 가로줄 검사
    for (let r = 0; r < GRID_SIZE; r++) {
      let isFull = true;
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!placedCubes.current[r][c]) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullRows.push(r);
    }

    // 세로줄 검사
    for (let c = 0; c < GRID_SIZE; c++) {
      let isFull = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (!placedCubes.current[r][c]) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(c);
    }

    const totalLines = fullRows.length + fullCols.length;
    if (totalLines > 0) {
      triggerHaptic(90);
      const cellsToClear = new Set<string>();

      fullRows.forEach((r) => {
        for (let c = 0; c < GRID_SIZE; c++) cellsToClear.add(`${r},${c}`);
      });
      fullCols.forEach((c) => {
        for (let r = 0; r < GRID_SIZE; r++) cellsToClear.add(`${r},${c}`);
      });

      cellsToClear.forEach((key) => {
        const [rStr, cStr] = key.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        const cube = placedCubes.current[r][c];
        if (cube) {
          spawnExplosion(cube.position, 0x38bdf8);
          scene.remove(cube);
          cube.geometry.dispose();
          placedCubes.current[r][c] = null;
        }
      });

      const bonus = totalLines > 1 ? 150 * (totalLines - 1) : 0;
      const points = totalLines * 110 + bonus;
      showToast(totalLines > 1 ? `🔥 MULTI CLEAR! x${totalLines} (+${points}점)` : `✨ LINE CLEAR! (+${points}점)`);

      setCurrentScore((prev) => {
        const next = prev + points;
        if (next >= TARGET_SCORE && !gameWon) {
          setGameWon(true);
          triggerHaptic(150);
          setTimeout(() => {
            const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const receipt = calculateAndDepositMissionReward({
              gameId: 'poki-108',
              gameTitle: '11-11 3D',
              isVictory: true,
              score: next,
              maxTargetScore: TARGET_SCORE,
              durationSeconds: dur,
            });
            setRewardReceipt(receipt);
          }, 800);
        }
        return next;
      });
    }
  }, [gameWon]);

  // 블록 배치 로직
  const tryPlaceShapeAt = useCallback((targetR: number, targetC: number) => {
    const shape = availableShapes[selectedShapeIdx];
    const scene = sceneRef.current;
    if (!shape || !scene || gameWon) return;

    // 배치 가능 여부 검사
    for (const coord of shape.coords) {
      const r = targetR + coord.r;
      const c = targetC + coord.c;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || placedCubes.current[r][c] !== null) {
        showToast('❌ 여기에 블록을 놓을 수 없습니다.');
        triggerHaptic(20);
        return;
      }
    }

    // 3D 큐브 배치
    const cubeGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    shape.coords.forEach((coord) => {
      const r = targetR + coord.r;
      const c = targetC + coord.c;

      const cubeMat = new THREE.MeshStandardMaterial({
        color: shape.color,
        roughness: 0.2,
        metalness: 0.3,
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      // 그리드 중심 (0,0) 기준 오프셋
      const posX = (c - 5) * 0.54;
      const posY = (5 - r) * 0.54;
      cube.position.set(posX, posY, 0.25);
      scene.add(cube);
      placedCubes.current[r][c] = cube;
    });

    triggerHaptic(40);
    const placePoints = shape.coords.length * 10;
    setCurrentScore((s) => s + placePoints);

    // 해당 블록 슬롯 비우기
    setAvailableShapes((prev) => {
      const next = [...prev];
      next[selectedShapeIdx] = null;
      // 모두 비었으면 새로 3개 리필
      if (next.every((s) => s === null)) {
        return [
          SHAPES[Math.floor(Math.random() * SHAPES.length)],
          SHAPES[Math.floor(Math.random() * SHAPES.length)],
          SHAPES[Math.floor(Math.random() * SHAPES.length)],
        ];
      }
      return next;
    });

    // 다음 유효한 슬롯 선택
    setTimeout(() => {
      setSelectedShapeIdx((curr) => {
        if (availableShapes[curr] === null) {
          const valid = availableShapes.findIndex((s) => s !== null);
          return valid !== -1 ? valid : 0;
        }
        return curr;
      });
    }, 50);

    // 라인 클리어 검사
    checkAndClearLines();
  }, [availableShapes, selectedShapeIdx, gameWon, checkAndClearLines]);

  // 원클릭 스마트 퀵배치
  const handleQuickPlace = useCallback(() => {
    const shape = availableShapes[selectedShapeIdx];
    if (!shape) return;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let fits = true;
        for (const coord of shape.coords) {
          const checkR = r + coord.r;
          const checkC = c + coord.c;
          if (
            checkR < 0 ||
            checkR >= GRID_SIZE ||
            checkC < 0 ||
            checkC >= GRID_SIZE ||
            placedCubes.current[checkR][checkC] !== null
          ) {
            fits = false;
            break;
          }
        }
        if (fits) {
          tryPlaceShapeAt(r, c);
          return;
        }
      }
    }
    showToast('⚠️ 보드에 이 블록을 놓을 자리가 없습니다.');
  }, [availableShapes, selectedShapeIdx, tryPlaceShapeAt]);

  // Three.js 초기화
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬 & 카메라
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0d18);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 9.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    dirLight.position.set(5, 8, 10);
    scene.add(dirLight);

    // 상단 No.108 공식 카드 영웅 배지 홀로그램 전광판
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#1e1b4b';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#818cf8';
      bctx.lineWidth = 12;
      bctx.strokeRect(6, 6, 244, 244);
      drawCardSprite(bctx, 108, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    badgeMesh.position.set(0, 3.8, -2.5);
    scene.add(badgeMesh);

    // ==========================================
    // 11x11 입체 3D 보드 매트릭스 타일 생성
    // ==========================================
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    const cellGeo = new THREE.BoxGeometry(0.5, 0.5, 0.08);
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.1,
    });

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = new THREE.Mesh(cellGeo, cellMat);
        const posX = (c - 5) * 0.54;
        const posY = (5 - r) * 0.54;
        cell.position.set(posX, posY, 0);
        cell.userData = { r, c };
        boardGroup.add(cell);
        boardCells.current[r][c] = cell;
      }
    }

    // 리사이즈 옵저버
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(container);

    // 렌더 루프
    let lastTime = performance.now();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // 파티클 업데이트
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        p.vy -= 12 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          if (Array.isArray(p.mesh.material)) {
            p.mesh.material.forEach((m) => m.dispose());
          } else {
            p.mesh.material.dispose();
          }
          parts.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 보드 셀 터치 클릭 레이캐스팅
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameWon) return;
    const container = mountRef.current;
    if (!container || !cameraRef.current) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // 타일 셀 클릭 검사
    const flatCells = boardCells.current.flat().filter(Boolean) as THREE.Mesh[];
    const intersects = raycaster.current.intersectObjects(flatCells);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const { r, c } = hit.userData;
      if (r !== undefined && c !== undefined) {
        tryPlaceShapeAt(r, c);
      }
    }
  };

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki-108',
      gameTitle: '11-11 3D',
      isVictory: false,
      score: currentScore,
      maxTargetScore: TARGET_SCORE,
      durationSeconds: dur,
    });
    // 정산 후 추가 팝업 없이 즉시 미션리스트로 이동
    const exitFn = (typeof handleExit === "function" ? handleExit : (onBack || onExit || onClose || (() => {})));
    exitFn();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hero-return-to-missions"));
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0c0d18]"
      onPointerDown={handlePointerDown}
    >
      {/* 3D 뷰포트 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="11-11 3D"
        missionTarget={`목표 점수: ${currentScore}/${TARGET_SCORE} PTS`}
        currentScore={currentScore}
        onBack={onBack}
        onForfeit={handleForfeit}
      />

      {/* 상단 토스트 피드백 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {toastText ? (
          <div className="bg-amber-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/50">
            {toastText}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs text-indigo-300 border border-indigo-500/30 font-mono">
            🧱 보드의 원하는 타일을 터치해 블록을 배치하고 라인을 완성하세요!
          </div>
        )}
      </div>

      {/* 하단 블록 선택 덱 */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center items-center gap-3 px-4 z-20 pointer-events-auto">
        {availableShapes.map((shape, idx) => (
          <button
            key={idx}
            disabled={!shape}
            onClick={(e) => {
              e.stopPropagation();
              if (shape) {
                setSelectedShapeIdx(idx);
                triggerHaptic(30);
              }
            }}
            className={`w-20 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all shadow-lg ${
              !shape
                ? 'opacity-20 border-slate-800 bg-black/40'
                : selectedShapeIdx === idx
                ? 'border-yellow-400 bg-indigo-900/90 scale-105 shadow-yellow-500/30'
                : 'border-slate-700 bg-slate-900/80 active:scale-95'
            }`}
          >
            {shape ? (
              <>
                <span className="text-xs font-mono font-bold text-white">{shape.name}</span>
                <span
                  className="w-4 h-4 rounded-sm mt-1"
                  style={{ backgroundColor: `#${shape.color.toString(16).padStart(6, '0')}` }}
                />
              </>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">EMPTY</span>
            )}
          </button>
        ))}
      </div>

      {/* 최하단 모바일 퓨어 터치 컨트롤 바 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-20 pointer-events-auto">
        {/* 리롤 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic(40);
            setAvailableShapes([
              SHAPES[Math.floor(Math.random() * SHAPES.length)],
              SHAPES[Math.floor(Math.random() * SHAPES.length)],
              SHAPES[Math.floor(Math.random() * SHAPES.length)],
            ]);
            showToast('🔄 새로운 블록으로 교체했습니다!');
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 active:bg-slate-700 text-white font-mono text-xs border border-white/20 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🔄</span>
          <span className="text-[10px]">REROLL</span>
        </button>

        {/* 대형 퀵배치 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuickPlace();
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-indigo-500 to-blue-700 active:from-indigo-600 active:to-blue-800 text-white font-black text-sm border-2 border-indigo-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">🧱</span>
          <span className="tracking-wider text-xs font-mono font-bold">PLACE!</span>
        </button>

        {/* 가이드 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            showToast('💡 11칸 가로/세로를 꽉 채우면 라인이 클리어됩니다!');
            triggerHaptic(20);
          }}
          className="w-16 h-16 rounded-full bg-indigo-800/80 active:bg-indigo-700 text-white font-mono text-xs border border-indigo-400/40 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">❓</span>
          <span className="text-[10px]">GUIDE</span>
        </button>
      </div>

      {/* 승리 및 정산 모달 */}
      {rewardReceipt && (
        <VictoryRewardModal
          receipt={rewardReceipt}
          onClose={onBack}
        />
      )}
    </div>
  );
};

export default PokiElevenElevenGame;

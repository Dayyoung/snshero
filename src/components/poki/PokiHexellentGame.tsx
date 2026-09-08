import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHexellentGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface HexTile3D {
  q: number;
  r: number;
  colorIdx: number;
  mesh: THREE.Mesh;
  targetY: number;
  currentY: number;
  popping: boolean;
  scale: number;
}

const HEX_RADIUS = 0.65;
const HEX_SPACING = HEX_RADIUS * 1.75;
const TARGET_SCORE = 1500;

const PALETTE = [
  { color: 0xef4444, name: '루비 레드', emissive: 0x991b1b },
  { color: 0x3b82f6, name: '사파이어 블루', emissive: 0x1e40af },
  { color: 0x10b981, name: '에메랄드 그린', emissive: 0x065f46 },
  { color: 0xf59e0b, name: '앰버 골드', emissive: 0x92400e },
  { color: 0x8b5cf6, name: '아메시스트 바이올렛', emissive: 0x5b21b6 },
];

export default function PokiHexellentGame({
  onBack,
  onClose,
  cardId = 91,
  onExit
}: PokiHexellentGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onClose || (() => {});

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory'>('ready');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Three.js 인스턴스 레프
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    boardGroup: THREE.Group;
    tiles: Map<string, HexTile3D>;
    sparks: THREE.Points;
    sparkGeo: THREE.BufferGeometry;
    confetti: THREE.Points;
    confettiGeo: THREE.BufferGeometry;
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // 제어 및 점수 레프
  const controlRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    tiltX: 0,
    tiltY: 0,
    targetTiltX: 0,
    targetTiltY: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
  });

  const triggerHaptic = useCallback((ms: number = 30) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // 무시
    }
  }, []);

  // 승리 처리
  const handleVictory = useCallback(() => {
    setGameState('victory');
    triggerHaptic([100, 50, 150]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokihexellent',
      gameTitle: 'Hexellent 3D',
      isVictory: true,
      score: controlRef.current.score,
      maxTargetScore: TARGET_SCORE,
      durationSeconds: 35,
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  // 스파클 파티클 생성
  const spawnSparklesAt = useCallback((x: number, y: number, z: number, colorHex: number) => {
    if (!threeRef.current) return;
    const { sparks, sparkGeo } = threeRef.current;
    const pos = sparkGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 1.4;
      pos[i * 3 + 1] = y + Math.random() * 0.8;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 1.4;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    (sparks.material as THREE.PointsMaterial).color.setHex(colorHex);
    (sparks.material as THREE.PointsMaterial).opacity = 1.0;
  }, []);

  // Three.js 씬 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc5e8eb); // 세련된 사이버 딥 블루 스페이스

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 10.5, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    mainLight.position.set(10, 20, 10);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.8);
    rimLight.position.set(-10, 12, -10);
    scene.add(rimLight);

    // No.091 공식 카드 영웅 배지 텍스처
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 256;
    heroCanvas.height = 256;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, cardId, 18, 18, 220, 220, { circleClip: true });
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.needsUpdate = true;

    // --- 3D 허니컴 보드 그룹 ---
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // 보드 베이스 플랫폼
    const baseGeo = new THREE.CylinderGeometry(5.2, 5.5, 0.6, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.35;
    boardGroup.add(baseMesh);

    // 보드 상단 No.091 공식 영웅 배지 간판
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.0, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8 })
    );
    signBoard.position.set(0, 0.5, -4.8);

    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.85),
      new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true })
    );
    badgeMesh.position.set(0, 0, 0.07);
    signBoard.add(badgeMesh);
    boardGroup.add(signBoard);

    // --- 반경 3 육각 허니컴 그리드 (37개 타일) ---
    const tiles = new Map<string, HexTile3D>();
    const hexGeo = new THREE.CylinderGeometry(HEX_RADIUS, HEX_RADIUS, 0.4, 6); // 6각 프리즘 메쉬

    const radius = 3;
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) {
        const colorIdx = Math.floor(Math.random() * PALETTE.length);
        const colData = PALETTE[colorIdx];

        const mat = new THREE.MeshStandardMaterial({
          color: colData.color,
          metalness: 0.5,
          roughness: 0.25,
          emissive: colData.emissive,
          emissiveIntensity: 0.2,
        });

        const mesh = new THREE.Mesh(hexGeo, mat);

        // 축 좌표계 ➔ 3D 직교 좌표계 변환
        const posX = HEX_SPACING * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
        const posZ = HEX_SPACING * ((3 / 2) * r);

        mesh.position.set(posX, 0.2, posZ);
        mesh.userData = { q, r };
        boardGroup.add(mesh);

        const key = `${q},${r}`;
        tiles.set(key, {
          q,
          r,
          colorIdx,
          mesh,
          targetY: 0.2,
          currentY: 0.2,
          popping: false,
          scale: 1,
        });
      }
    }

    // --- 파티클 시스템 (스파클 & 콘페티) ---
    // 1) 스파클
    const sparkCount = 60;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) sparkPos[i] = 0;
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0 });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // 2) 콘페티
    const confettiCount = 80;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPos = new Float32Array(confettiCount * 3);
    for (let i = 0; i < confettiCount; i++) {
      confettiPos[i * 3] = (Math.random() - 0.5) * 12;
      confettiPos[i * 3 + 1] = Math.random() * 8 + 1;
      confettiPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPos, 3));
    const confettiMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.35, transparent: true, opacity: 0 });
    const confetti = new THREE.Points(confettiGeo, confettiMat);
    scene.add(confetti);

    const clock = new THREE.Clock();

    threeRef.current = {
      scene,
      camera,
      renderer,
      boardGroup,
      tiles,
      sparks,
      sparkGeo,
      confetti,
      confettiGeo,
      animId: 0,
      clock,
    };

    // 리사이즈
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 애니메이션 루프
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const ctrl = controlRef.current;

      // 보드 틸트 보간 (Screen-relative 완벽 일치)
      ctrl.tiltX = THREE.MathUtils.lerp(ctrl.tiltX, ctrl.targetTiltX, delta * 6);
      ctrl.tiltY = THREE.MathUtils.lerp(ctrl.tiltY, ctrl.targetTiltY, delta * 6);
      boardGroup.rotation.y = ctrl.tiltX;
      boardGroup.rotation.x = ctrl.tiltY;

      // 타일 낙하 및 팝업 애니메이션
      tiles.forEach((t) => {
        if (t.popping) {
          t.scale = Math.max(0, t.scale - delta * 5);
          t.mesh.scale.set(t.scale, t.scale, t.scale);
          t.currentY += delta * 4;
          t.mesh.position.y = t.currentY;
        } else {
          // 리필 낙하 스냅
          t.currentY = THREE.MathUtils.lerp(t.currentY, t.targetY, delta * 10);
          t.scale = THREE.MathUtils.lerp(t.scale, 1, delta * 8);
          t.mesh.position.y = t.currentY;
          t.mesh.scale.set(t.scale, t.scale, t.scale);
        }
      });

      // 콤보 타이머
      if (ctrl.comboTimer > 0) {
        ctrl.comboTimer -= delta;
        if (ctrl.comboTimer <= 0) {
          ctrl.combo = 0;
          setCombo(0);
        }
      }

      // 스파클 감쇠
      if ((sparkMat as THREE.PointsMaterial).opacity > 0) {
        (sparkMat as THREE.PointsMaterial).opacity -= delta * 2;
      }

      // 승리 시 콘페티 낙하 & 360도 보드 회전
      if (ctrl.score >= TARGET_SCORE) {
        ctrl.targetTiltX += delta * 0.4;
        (confettiMat as THREE.PointsMaterial).opacity = 0.9;
        const pos = confettiGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < confettiCount; i++) {
          pos[i * 3 + 1] -= delta * 2.5;
          if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 8;
        }
        confettiGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
      threeRef.current!.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
        renderer.dispose();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cardId]);

  // 육각 인접 이웃 좌표 (6방향)
  const getHexNeighbors = (q: number, r: number) => {
    return [
      { q: q + 1, r: r },
      { q: q + 1, r: r - 1 },
      { q: q, r: r - 1 },
      { q: q - 1, r: r },
      { q: q - 1, r: r + 1 },
      { q: q, r: r + 1 },
    ];
  };

  // 클러스터 폭파 (BFS 탐색)
  const popClusterAt = (startQ: number, startR: number) => {
    if (!threeRef.current || gameState !== 'playing') return;
    const { tiles } = threeRef.current;
    const startKey = `${startQ},${startR}`;
    const startTile = tiles.get(startKey);
    if (!startTile || startTile.popping) return;

    const targetColor = startTile.colorIdx;
    const queue = [{ q: startQ, r: startR }];
    const visited = new Set<string>([startKey]);
    const cluster: HexTile3D[] = [startTile];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const neighbors = getHexNeighbors(cur.q, cur.r);
      for (const n of neighbors) {
        const nKey = `${n.q},${n.r}`;
        if (!visited.has(nKey) && tiles.has(nKey)) {
          visited.add(nKey);
          const neighborTile = tiles.get(nKey)!;
          if (neighborTile.colorIdx === targetColor && !neighborTile.popping) {
            cluster.push(neighborTile);
            queue.push(n);
          }
        }
      }
    }

    // 최소 2개 이상일 때 폭파
    if (cluster.length >= 2) {
      controlRef.current.combo += 1;
      controlRef.current.comboTimer = 2.0;
      setCombo(controlRef.current.combo);

      const pointsEarned = cluster.length * 40 * controlRef.current.combo;
      controlRef.current.score += pointsEarned;
      setScore(controlRef.current.score);

      setComboBanner(`💥 HEX BLAST! +${pointsEarned} (${cluster.length} Blocks, COMBO x${controlRef.current.combo})`);
      triggerHaptic([40, 20, 40]);

      // 스파클 분출
      spawnSparklesAt(startTile.mesh.position.x, 0.5, startTile.mesh.position.z, PALETTE[targetColor].color);

      // 클러스터 팝 애니메이션 & 리필
      cluster.forEach((tile) => {
        tile.popping = true;
      });

      setTimeout(() => {
        cluster.forEach((tile) => {
          tile.popping = false;
          tile.scale = 0.2;
          tile.currentY = 4.5 + Math.random() * 2; // 상공에서 리필 낙하
          tile.colorIdx = Math.floor(Math.random() * PALETTE.length);

          const colData = PALETTE[tile.colorIdx];
          const mat = tile.mesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(colData.color);
          mat.emissive.setHex(colData.emissive);
        });

        setTimeout(() => setComboBanner(null), 1200);

        // 승리 검사
        if (controlRef.current.score >= TARGET_SCORE) {
          handleVictory();
        }
      }, 200);
    } else {
      triggerHaptic(20);
    }
  };

  // 3D 터치 레이캐스팅 탭
  const handlePointerDown = (e: React.PointerEvent) => {
    controlRef.current.isDragging = true;
    controlRef.current.prevX = e.clientX;
    controlRef.current.prevY = e.clientY;

    if (!threeRef.current || !mountRef.current || gameState !== 'playing') return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, threeRef.current.camera);

    const intersects = raycaster.intersectObjects(threeRef.current.boardGroup.children, true);
    if (intersects.length > 0) {
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== threeRef.current.boardGroup) {
          if (cur.userData?.q !== undefined && cur.userData?.r !== undefined) {
            popClusterAt(cur.userData.q, cur.userData.r);
            return;
          }
          cur = cur.parent;
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!controlRef.current.isDragging) return;
    const dx = e.clientX - controlRef.current.prevX;
    const dy = e.clientY - controlRef.current.prevY;
    controlRef.current.prevX = e.clientX;
    controlRef.current.prevY = e.clientY;

    // 화면 기준 보드 틸트 (Screen-relative 완벽 일치)
    controlRef.current.targetTiltX = THREE.MathUtils.clamp(
      controlRef.current.targetTiltX + dx * 0.003,
      -0.3,
      0.3
    );
    controlRef.current.targetTiltY = THREE.MathUtils.clamp(
      controlRef.current.targetTiltY + dy * 0.002,
      -0.25,
      0.25
    );
  };

  const handlePointerUp = () => {
    controlRef.current.isDragging = false;
  };

  // 최대 클러스터 자동 폭파 ([💥 MEGA BLAST])
  const handleMegaBlast = () => {
    if (!threeRef.current || gameState !== 'playing') return;
    const { tiles } = threeRef.current;

    let bestCluster: { q: number; r: number; count: number } | null = null;
    const checked = new Set<string>();

    tiles.forEach((startTile) => {
      const key = `${startTile.q},${startTile.r}`;
      if (checked.has(key) || startTile.popping) return;

      const queue = [{ q: startTile.q, r: startTile.r }];
      const visited = new Set<string>([key]);
      let count = 0;

      while (queue.length > 0) {
        const cur = queue.shift()!;
        count++;
        const neighbors = getHexNeighbors(cur.q, cur.r);
        for (const n of neighbors) {
          const nKey = `${n.q},${n.r}`;
          if (!visited.has(nKey) && tiles.has(nKey)) {
            visited.add(nKey);
            checked.add(nKey);
            const nt = tiles.get(nKey)!;
            if (nt.colorIdx === startTile.colorIdx && !nt.popping) {
              queue.push(n);
            }
          }
        }
      }

      if (count >= 2 && (!bestCluster || count > bestCluster.count)) {
        bestCluster = { q: startTile.q, r: startTile.r, count };
      }
    });

    if (bestCluster) {
      popClusterAt(bestCluster.q, bestCluster.r);
    }
  };

  // 보드 셔플 ([🎲 SHUFFLE])
  const handleShuffle = () => {
    if (!threeRef.current || gameState !== 'playing') return;
    const { tiles } = threeRef.current;

    tiles.forEach((t) => {
      t.colorIdx = Math.floor(Math.random() * PALETTE.length);
      t.scale = 0.4;
      t.currentY = 1.2;
      const colData = PALETTE[t.colorIdx];
      const mat = t.mesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(colData.color);
      mat.emissive.setHex(colData.emissive);
    });

    triggerHaptic(50);
  };

  // 게임 시작
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCombo(0);
    controlRef.current.score = 0;
    controlRef.current.combo = 0;
    setRewardReceipt(null);
    triggerHaptic(50);
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#c5e8eb] text-white font-mono flex flex-col"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Three.js 3D 뷰포트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 상단 미니멀 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="HEXELLENT 3D"
        onQuit={handleExit}
        progressPercent={Math.min(100, Math.round((score / TARGET_SCORE) * 100))}
        customScore={score}
        scoreLabel="SCORE"
        rewardPreview={35}
      />

      {/* 콤보 배너 */}
      {comboBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-cyan-500 text-black px-4 py-1.5 rounded-sm font-black text-xs tracking-wider shadow-lg border border-cyan-300">
            {comboBanner}
          </div>
        </div>
      )}

      {/* 게임 상태 바 (점수 및 콤보) */}
      {gameState === 'playing' && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* 점수 게이지 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm flex items-center gap-2">
            <div>
              <div className="text-[9px] text-slate-400">TARGET: {TARGET_SCORE}</div>
              <div className="text-base font-black text-amber-400 leading-none">{score} PTS</div>
            </div>
          </div>

          {/* 콤보 카운트 */}
          {combo > 1 && (
            <div className="bg-purple-900/80 backdrop-blur-sm border border-purple-500/60 px-3 py-1.5 rounded-sm text-purple-300 font-bold text-xs">
              COMBO x{combo} 🔥
            </div>
          )}
        </div>
      )}

      {/* 게임 시작 대기 오버레이 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-1">
              [POKI POPULAR 110: NO.091]
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              HEXELLENT 3D
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              3D 허니컴 보드에서 인접한 같은 색상의 육각 블록을 터치해 팡팡 터뜨리세요! 연속 콤보를 노려 1,500점을 달성하세요.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 p-3 mb-6 rounded-sm text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span>[✦] 공식 배지:</span> No.091 허니컴 보드 상단 간판 각인
              </div>
              <div className="flex items-center gap-2">
                <span>[💎 클러스터 폭파]</span> 같은 색 블록 2개 이상 모인 곳을 탭
              </div>
              <div className="flex items-center gap-2">
                <span>[🔄 연쇄 콤보]</span> 연속으로 터뜨릴수록 점수 배율 폭증
              </div>
              <div className="flex items-center gap-2">
                <span>[💥 MEGA BLAST]</span> 가장 큰 블록 뭉치를 한 번에 자동 폭파
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-black text-lg rounded-sm tracking-wider uppercase shadow-lg transition-transform active:scale-95"
            >
              START BLAST 💎
            </button>
          </div>
        </div>
      )}

      {/* 승리 모달 */}
      {gameState === 'victory' && (
        <VictoryRewardModal
          isOpen={true}
          onClose={handleExit}
          receipt={rewardReceipt}
          title="HEXELLENT MASTER!"
          subtitle="목표 점수 1,500점을 완벽하게 돌파했습니다!"
        />
      )}

      {/* 하단 모바일 퓨어 터치 액션 버튼 */}
      {gameState === 'playing' && (
        <div className="mt-auto z-20 pb-6 px-4 flex items-center justify-between pointer-events-auto max-w-md w-full mx-auto">
          <button
            onClick={handleShuffle}
            className="flex-1 py-3.5 bg-slate-900 active:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-sm flex items-center justify-center gap-1.5 shadow-lg"
          >
            <span className="text-base">🎲</span>
            <span>SHUFFLE</span>
          </button>

          <button
            onClick={handleMegaBlast}
            className="flex-2 py-3.5 bg-cyan-500 active:bg-cyan-600 border border-cyan-300 text-black font-black text-sm rounded-sm flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 ml-3"
          >
            <span className="text-xl">💥</span>
            <span>MEGA BLAST (HINT)</span>
          </button>
        </div>
      )}
    </div>
  );
}

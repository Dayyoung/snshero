import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBubbleStormGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;
}

const BUBBLE_COLORS = [
  0xef4444, // Red
  0x3b82f6, // Blue
  0x10b981, // Green
  0xf59e0b, // Yellow
  0xa855f7, // Purple
];

interface BubbleNode {
  row: number;
  col: number;
  x: number;
  y: number;
  color: number;
  active: boolean;
  mesh: THREE.Mesh;
}

export const PokiBubbleStormGame: React.FC<PokiBubbleStormGameProps> = ({
  onBack,
  onExit,
  cardId = 45,
  lowSpecMode = false,
  playSfx
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [poppedCount, setPoppedCount] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(25);
  const [score, setScore] = useState(0);
  const [currentBubbleColor, setCurrentBubbleColor] = useState(BUBBLE_COLORS[0]);
  const [nextBubbleColor, setNextBubbleColor] = useState(BUBBLE_COLORS[1]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // 3D 씬 레퍼런스
  const gameLoopRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animId: 0,
    isGameOver: false,
    isGameWon: false,
    scoreVal: 0,
    poppedVal: 0,
    shotsVal: 25,

    // 그리드 설정
    rows: 7,
    cols: 8,
    bubbleRadius: 0.85,
    gridStartX: -5.95,
    gridStartY: 10.5,
    grid: [] as BubbleNode[],

    // 캐논 포탑
    cannonGroup: null as THREE.Group | null,
    cannonBarrel: null as THREE.Mesh | null,
    loadedMesh: null as THREE.Mesh | null,
    nextMesh: null as THREE.Mesh | null,
    aimAngle: -Math.PI / 2, // 기본 위쪽
    currentColor: BUBBLE_COLORS[0],
    nextColor: BUBBLE_COLORS[1],

    // 비행 버블
    flyingBubble: null as {
      mesh: THREE.Mesh;
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      color: number;
    } | null,

    // 조준선 라인
    aimLine: null as THREE.Line | null,

    // 파티클
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],

    arenaWidth: 14.5,
    ceilingY: 11.5,
    cannonY: -2.0,
  });

  const handleExit = onExit || onBack;

  // 영웅 카드 배지 렌더링
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawCardSprite(ctx, cardId, 0, 0, 40, 40);
      }
    }
  }, [cardId]);

  // 햅틱 진동 피드백
  const triggerHaptic = useCallback((pattern: number | number[] = 25) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore
      }
    }
  }, []);

  // 보상 정산
  const handleClaimReward = useCallback((isVictory: boolean, currentScore: number) => {
    const finalScore = Math.max(20, Math.floor(currentScore));
    const result = calculateAndDepositMissionReward({
      gameId: 'poki_bubble_storm',
      gameTitle: 'Bubble Storm 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: 30,
    });
    setRewardResult(result);
  }, []);

  // 버블 구체 생성 헬퍼
  const createBubbleMesh = (color: number, radius = 0.85): THREE.Mesh => {
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = !lowSpecMode;
    return mesh;
  };

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d1a);
    scene.fog = new THREE.FogExp2(0x0a0d1a, 0.02);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 20.5);
    camera.lookAt(0, 4.5, 0);
    gameLoopRef.current.camera = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowSpecMode,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameLoopRef.current.renderer = renderer;

    // 3. 네온 돔 조명
    const ambientLight = new THREE.AmbientLight(0xdde8ff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(10, 25, 20);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // 4. 네온 경기장 벽면 & 천장
    const arenaW = 14.5;
    const arenaH = 15.0;
    gameLoopRef.current.arenaWidth = arenaW;

    // 좌우 네온 반사 가이드 벽
    const wallGeo = new THREE.BoxGeometry(0.3, arenaH, 2.0);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, roughness: 0.3 });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-arenaW / 2, 4.5, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(arenaW / 2, 4.5, 0);
    scene.add(rightWall);

    // 천장 바
    const ceilGeo = new THREE.BoxGeometry(arenaW, 0.4, 2.0);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x6d28d9 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.position.set(0, 11.5, 0);
    scene.add(ceiling);

    // 5. 상단 6행 8열 버블 그리드 초기화
    const g = gameLoopRef.current;
    g.grid = [];
    const rad = g.bubbleRadius;

    for (let r = 0; r < g.rows; r++) {
      const isOdd = r % 2 === 1;
      const colsInRow = isOdd ? g.cols - 1 : g.cols;
      const xOffset = isOdd ? rad : 0;

      for (let c = 0; c < colsInRow; c++) {
        // 처음 4행만 버블 채우기
        const active = r < 4;
        const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
        const bMesh = createBubbleMesh(color, rad);

        const posX = g.gridStartX + xOffset + c * (rad * 2.0);
        const posY = g.gridStartY - r * (rad * 1.73);

        bMesh.position.set(posX, posY, 0);
        bMesh.visible = active;
        scene.add(bMesh);

        g.grid.push({
          row: r,
          col: c,
          x: posX,
          y: posY,
          color,
          active,
          mesh: bMesh,
        });
      }
    }

    // 6. 하단 캐논 포탑 & 로드 버블
    const cannonGroup = new THREE.Group();
    cannonGroup.position.set(0, g.cannonY, 0);

    // 포탑 베이스 (원반)
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.6, 24);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.rotation.x = Math.PI / 2;
    cannonGroup.add(base);

    // 회전 포신
    const barrelGeo = new THREE.CylinderGeometry(0.55, 0.75, 2.2, 16);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.9, roughness: 0.2 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.y = 1.0;
    cannonGroup.add(barrel);
    g.cannonBarrel = barrel;

    // 장전 버블 (현재)
    const initLoadedColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const loadedMesh = createBubbleMesh(initLoadedColor, rad);
    loadedMesh.position.set(0, 0, 0.4);
    cannonGroup.add(loadedMesh);
    g.loadedMesh = loadedMesh;
    g.currentColor = initLoadedColor;
    setCurrentBubbleColor(initLoadedColor);

    // 대기 버블 (다음)
    const initNextColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const nextMesh = createBubbleMesh(initNextColor, rad * 0.75);
    nextMesh.position.set(-2.2, -0.4, 0);
    cannonGroup.add(nextMesh);
    g.nextMesh = nextMesh;
    g.nextColor = initNextColor;
    setNextBubbleColor(initNextColor);

    scene.add(cannonGroup);
    g.cannonGroup = cannonGroup;

    // 7. 레이저 조준선 궤적 라인
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x00ffff,
      dashSize: 0.4,
      gapSize: 0.3,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, g.cannonY, 0),
      new THREE.Vector3(0, 8, 0),
    ]);
    const aimLine = new THREE.Line(lineGeo, lineMat);
    aimLine.computeLineDistances();
    scene.add(aimLine);
    g.aimLine = aimLine;

    // 8. 리사이즈 핸들러
    const handleResize = () => {
      if (!container || !gameLoopRef.current.renderer || !gameLoopRef.current.camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      gameLoopRef.current.camera.aspect = w / h;
      gameLoopRef.current.camera.updateProjectionMatrix();
      gameLoopRef.current.renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 9. 메인 루프
    let lastTime = performance.now();

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const gl = gameLoopRef.current;

      if (!gl.isGameOver && !gl.isGameWon) {
        // --- 조준선 & 포탑 회전 갱신 ---
        if (gl.cannonBarrel && gl.aimLine) {
          const rotZ = gl.aimAngle + Math.PI / 2;
          gl.cannonBarrel.rotation.z = rotZ;

          // 조준 궤적 레이 (벽면 1회 반사 계산)
          const startX = 0;
          const startY = gl.cannonY + 1.2;
          const dirX = Math.cos(gl.aimAngle);
          const dirY = -Math.sin(gl.aimAngle);

          const halfW = gl.arenaWidth / 2 - gl.bubbleRadius;
          const points: THREE.Vector3[] = [new THREE.Vector3(startX, startY, 0)];

          // 벽면 충돌 지점 계산
          if (dirX !== 0) {
            const targetWallX = dirX > 0 ? halfW : -halfW;
            const tWall = (targetWallX - startX) / dirX;
            const hitY = startY + dirY * tWall;

            if (hitY < gl.ceilingY && hitY > startY) {
              // 벽 충돌 후 반사
              points.push(new THREE.Vector3(targetWallX, hitY, 0));
              const bouncedDirX = -dirX;
              const remainY = gl.ceilingY - hitY;
              points.push(new THREE.Vector3(targetWallX + (bouncedDirX * remainY) / dirY, gl.ceilingY, 0));
            } else {
              points.push(new THREE.Vector3(startX + (dirX * (gl.ceilingY - startY)) / dirY, gl.ceilingY, 0));
            }
          } else {
            points.push(new THREE.Vector3(0, gl.ceilingY, 0));
          }

          gl.aimLine.geometry.setFromPoints(points);
          gl.aimLine.computeLineDistances();
        }

        // --- 비행 버블 업데이트 & 충돌 판정 ---
        if (gl.flyingBubble) {
          const fb = gl.flyingBubble;
          fb.pos.addScaledVector(fb.vel, dt);

          // 벽면 반사
          const halfW = gl.arenaWidth / 2 - gl.bubbleRadius;
          if (fb.pos.x > halfW) {
            fb.pos.x = halfW;
            fb.vel.x *= -1;
            triggerHaptic(15);
          } else if (fb.pos.x < -halfW) {
            fb.pos.x = -halfW;
            fb.vel.x *= -1;
            triggerHaptic(15);
          }

          fb.mesh.position.copy(fb.pos);

          // 천장 도달 또는 기존 버블과 충돌 체크
          let hit = false;
          if (fb.pos.y >= gl.ceilingY - gl.bubbleRadius) {
            hit = true;
          } else {
            for (const b of gl.grid) {
              if (b.active) {
                const dist = fb.pos.distanceTo(new THREE.Vector3(b.x, b.y, 0));
                if (dist < gl.bubbleRadius * 1.85) {
                  hit = true;
                  break;
                }
              }
            }
          }

          if (hit) {
            // 가장 가까운 빈 그리드 셀에 스냅
            let nearestCell: BubbleNode | null = null;
            let minDist = Infinity;

            gl.grid.forEach((node) => {
              if (!node.active) {
                const d = fb.pos.distanceTo(new THREE.Vector3(node.x, node.y, 0));
                if (d < minDist) {
                  minDist = d;
                  nearestCell = node;
                }
              }
            });

            if (nearestCell) {
              const target = nearestCell as BubbleNode;
              target.active = true;
              target.color = fb.color;
              target.mesh.material = new THREE.MeshStandardMaterial({
                color: fb.color,
                roughness: 0.15,
                metalness: 0.2,
                transparent: true,
                opacity: 0.9,
              });
              target.mesh.visible = true;

              // BFS 3매치 판정
              const matched = findConnectedMatches(gl.grid, target);

              if (matched.length >= 3) {
                // 매치 폭발!
                matched.forEach((m) => {
                  m.active = false;
                  m.mesh.visible = false;

                  // 파티클
                  for (let k = 0; k < 8; k++) {
                    const pGeo = new THREE.SphereGeometry(0.16, 6, 6);
                    const pMat = new THREE.MeshBasicMaterial({ color: m.color });
                    const pMesh = new THREE.Mesh(pGeo, pMat);
                    pMesh.position.set(m.x, m.y, 0);
                    scene.add(pMesh);

                    const pVel = new THREE.Vector3(
                      (Math.random() - 0.5) * 8,
                      (Math.random() - 0.5) * 8,
                      (Math.random() - 0.5) * 8
                    );
                    gl.particles.push({ mesh: pMesh, vel: pVel, life: 0.5 });
                  }
                });

                gl.poppedVal += matched.length;
                setPoppedCount(gl.poppedVal);
                gl.scoreVal += matched.length * 15;
                setScore(gl.scoreVal);

                triggerHaptic([40, 60, 90]);
                if (playSfx) playSfx('explosion');

                // 고립된 버블 낙하
                dropFloatingBubbles(gl.grid, scene, gl.particles);

                // 승리 체크: 30개 이상 터뜨렸거나 보드 클리어
                const remaining = gl.grid.filter((b) => b.active).length;
                if (gl.poppedVal >= 30 || remaining === 0) {
                  gl.isGameWon = true;
                  setGameWon(true);
                  triggerHaptic([50, 100, 150, 250]);
                  handleClaimReward(true, gl.scoreVal + 100);
                  return;
                }
              } else {
                triggerHaptic(20);
                if (playSfx) playSfx('hit');
              }
            }

            // 비행 버블 제거 & 다음 버블 로드
            scene.remove(fb.mesh);
            gl.flyingBubble = null;

            // 남은 탄환 감소
            gl.shotsVal -= 1;
            setShotsLeft(gl.shotsVal);

            if (gl.shotsVal <= 0 && !gl.isGameWon) {
              gl.isGameOver = true;
              setGameOver(true);
              triggerHaptic([60, 100, 150]);
              handleClaimReward(false, gl.scoreVal);
              return;
            }

            // 새 버블 준비
            gl.currentColor = gl.nextColor;
            gl.nextColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];

            if (gl.loadedMesh) {
              (gl.loadedMesh.material as THREE.MeshStandardMaterial).color.setHex(gl.currentColor);
            }
            if (gl.nextMesh) {
              (gl.nextMesh.material as THREE.MeshStandardMaterial).color.setHex(gl.nextColor);
            }

            setCurrentBubbleColor(gl.currentColor);
            setNextBubbleColor(gl.nextColor);
          }
        }

        // --- 파티클 업데이트 ---
        for (let i = gl.particles.length - 1; i >= 0; i--) {
          const pt = gl.particles[i];
          pt.life -= dt;
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.vel.y -= 15 * dt; // 중력
          if (pt.life <= 0) {
            scene.remove(pt.mesh);
            gl.particles.splice(i, 1);
          }
        }
      }

      if (gl.renderer && gl.scene && gl.camera) {
        gl.renderer.render(gl.scene, gl.camera);
      }
    };

    gameLoopRef.current.animId = requestAnimationFrame(animate);

    // 클린업
    return () => {
      cancelAnimationFrame(gameLoopRef.current.animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, handleClaimReward, playSfx, triggerHaptic]);

  // BFS 동일 색상 매칭 탐색 헬퍼
  const findConnectedMatches = (grid: BubbleNode[], startNode: BubbleNode): BubbleNode[] => {
    const targetColor = startNode.color;
    const matches: BubbleNode[] = [];
    const visited = new Set<string>();
    const queue: BubbleNode[] = [startNode];
    visited.add(`${startNode.row},${startNode.col}`);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      matches.push(curr);

      // 인접 6방향 이웃 찾기
      const neighbors = getNeighbors(grid, curr);
      for (const n of neighbors) {
        const key = `${n.row},${n.col}`;
        if (!visited.has(key) && n.active && n.color === targetColor) {
          visited.add(key);
          queue.push(n);
        }
      }
    }

    return matches;
  };

  // 육각형 그리드 이웃 구하기
  const getNeighbors = (grid: BubbleNode[], node: BubbleNode): BubbleNode[] => {
    const isOdd = node.row % 2 === 1;
    const offsets = isOdd
      ? [
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, 1],
        ]
      : [
          [-1, -1],
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
        ];

    const res: BubbleNode[] = [];
    offsets.forEach(([dr, dc]) => {
      const nr = node.row + dr;
      const nc = node.col + dc;
      const found = grid.find((b) => b.row === nr && b.col === nc);
      if (found) res.push(found);
    });
    return res;
  };

  // 고립된 버블 낙하
  const dropFloatingBubbles = (
    grid: BubbleNode[],
    scene: THREE.Scene,
    particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[]
  ) => {
    // 천장(row 0)과 연결된 모든 버블 탐색
    const connected = new Set<string>();
    const queue: BubbleNode[] = grid.filter((b) => b.row === 0 && b.active);
    queue.forEach((b) => connected.add(`${b.row},${b.col}`));

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = getNeighbors(grid, curr);
      for (const n of neighbors) {
        const key = `${n.row},${n.col}`;
        if (!connected.has(key) && n.active) {
          connected.add(key);
          queue.push(n);
        }
      }
    }

    // 연결되지 않은 active 버블은 모두 낙하
    grid.forEach((b) => {
      if (b.active && !connected.has(`${b.row},${b.col}`)) {
        b.active = false;
        b.mesh.visible = false;

        // 낙하 파티클
        const pGeo = new THREE.SphereGeometry(0.55, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: b.color });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(b.x, b.y, 0);
        scene.add(pMesh);

        particles.push({
          mesh: pMesh,
          vel: new THREE.Vector3((Math.random() - 0.5) * 4, -4 - Math.random() * 6, (Math.random() - 0.5) * 4),
          life: 1.0,
        });
      }
    });
  };

  // 발사 액션
  const handleFire = useCallback(() => {
    const gl = gameLoopRef.current;
    if (gl.flyingBubble || gl.isGameOver || gl.isGameWon || !gl.scene) return;

    const flyMesh = createBubbleMesh(gl.currentColor, gl.bubbleRadius);
    flyMesh.position.set(0, gl.cannonY + 1.2, 0);
    gl.scene.add(flyMesh);

    const speed = 26.0;
    const vx = Math.cos(gl.aimAngle) * speed;
    const vy = -Math.sin(gl.aimAngle) * speed;

    gl.flyingBubble = {
      mesh: flyMesh,
      pos: new THREE.Vector3(0, gl.cannonY + 1.2, 0),
      vel: new THREE.Vector3(vx, vy, 0),
      color: gl.currentColor,
    };

    triggerHaptic(30);
    if (playSfx) playSfx('dash');
  }, [playSfx, triggerHaptic]);

  // 버블 스왑 액션
  const handleSwap = useCallback(() => {
    const gl = gameLoopRef.current;
    if (gl.flyingBubble || gl.isGameOver || gl.isGameWon) return;

    const tmp = gl.currentColor;
    gl.currentColor = gl.nextColor;
    gl.nextColor = tmp;

    if (gl.loadedMesh) {
      (gl.loadedMesh.material as THREE.MeshStandardMaterial).color.setHex(gl.currentColor);
    }
    if (gl.nextMesh) {
      (gl.nextMesh.material as THREE.MeshStandardMaterial).color.setHex(gl.nextColor);
    }

    setCurrentBubbleColor(gl.currentColor);
    setNextBubbleColor(gl.nextColor);
    triggerHaptic(20);
  }, [triggerHaptic]);

  // 화면 터치 조준 핸들러
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    // 화면 하단 중앙 기준 터치 위치 각도 계산
    const dx = touch.clientX - cw / 2;
    const dy = touch.clientY - (ch - 110);

    let angle = Math.atan2(dy, dx);
    // 각도 제한 (-160도 ~ -20도)
    angle = Math.max(-Math.PI * 0.88, Math.min(-Math.PI * 0.12, angle));
    gameLoopRef.current.aimAngle = angle;
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleFire}
    >
      {/* 3D 렌더러 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 HUD */}
      <MinimalistMissionHUD
        gameTitle="Bubble Storm 3D"
        score={score}
        targetScore={100}
        onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 상단 미션 대시보드 */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3">
          {/* 터뜨린 버블 수 */}
          <div className="bg-slate-900/90 border border-purple-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-purple-400 font-bold block">POPPED BUBBLES</span>
            <span className="text-base text-yellow-300 font-black">{poppedCount} / 30 💥</span>
          </div>

          {/* 남은 발사 기회 */}
          <div className="bg-slate-900/90 border border-blue-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-blue-400 font-bold block">SHOTS LEFT</span>
            <span className={`text-base font-black ${shotsLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-blue-300'}`}>
              {shotsLeft} 🎯
            </span>
          </div>
        </div>

        {/* 영웅 배지 */}
        <div className="w-12 h-14 bg-slate-900/90 border border-amber-500/40 rounded-sm overflow-hidden flex flex-col items-center justify-center p-0.5">
          <canvas ref={heroCanvasRef} width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-[9px] text-amber-300 font-black leading-none mt-0.5">No.{cardId}</span>
        </div>
      </div>

      {/* 하단 모바일 컨트롤 바 */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-auto">
        {/* 스왑 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSwap();
          }}
          className="w-16 h-16 rounded-full bg-slate-800/90 active:bg-slate-700 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-slate-600 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-lg">🔄</span>
          <span>SWAP</span>
        </button>

        {/* 조준 안내 메시지 */}
        <div className="text-[11px] text-slate-400 pointer-events-none bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/50">
          <span>🎯 화면 드래그 조준 & 떼서 발사</span>
        </div>

        {/* 발사 버튼 (76px) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFire();
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 active:from-purple-400 active:to-pink-300 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-pink-300/80 shadow-xl active:scale-95 transition-transform"
        >
          <span className="text-2xl">🚀</span>
          <span>FIRE</span>
        </button>
      </div>

      {/* 중도 포기 확인 모달 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">슈팅을 중단할까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              현재까지 터뜨린 버블 수와 점수에 비례한 SNS 포인트가 정산됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmQuit(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-sm border border-slate-600"
              >
                계속하기
              </button>
              <button
                onClick={() => {
                  setShowConfirmQuit(false);
                  handleClaimReward(false, score);
                  handleExit();
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-sm"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="Bubble Storm 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '30개 버블 팝 & 보드 클리어',
              desc: '같은 색상의 3D 버블을 3개 이상 연결하여 연쇄 폭발을 일으키고 보드를 비우세요!',
            },
            {
              iconType: 'GESTURES',
              title: '벽면 반사 & 고립 버블 낙하',
              desc: '화면 드래그로 조준하고 좌우 벽면 반사를 노리세요. 천장에서 끊어진 버블은 우수수 떨어집니다.',
            },
            {
              iconType: 'REWARDS',
              title: '스톰 클리어 SNS 보상',
              desc: '30개 이상 터뜨려 승리 시 최대 50 SNS 포인트를 영구 획득합니다.',
            },
          ]}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* 승리 및 정산 모달 */}
      {(gameWon || gameOver) && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          isVictory={gameWon}
          score={score}
          reward={rewardResult}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

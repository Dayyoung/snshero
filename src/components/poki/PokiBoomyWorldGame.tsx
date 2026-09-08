import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBoomyWorldGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface Bomb {
  r: number;
  c: number;
  mesh: THREE.Mesh;
  fuseMesh: THREE.Mesh;
  timer: number;
  range: number;
}

interface Monster {
  r: number;
  c: number;
  mesh: THREE.Group;
  dir: { r: number; c: number };
  moveProgress: number;
  alive: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

const GRID_SIZE = 11;
const CELL_SIZE = 2.0;

export default function PokiBoomyWorldGame({
  onBack,
  onClose,
  cardId = 82,
  onExit
}: PokiBoomyWorldGameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'victory'>('ready');
  const [monstersDefeated, setMonstersDefeated] = useState<number>(0);
  const [totalMonstersCount] = useState<number>(5);
  const [activeBombsCount, setActiveBombsCount] = useState<number>(0);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 3D 내부 참조 Ref
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 맵 그리드 (0: 빈칸, 1: 파괴불가 벽, 2: 파괴가능 상자)
    grid: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)) as number[][],
    crateMeshes: new Map<string, THREE.Mesh>(),

    // 플레이어 봄버맨
    playerGroup: null as THREE.Group | null,
    playerPos: new THREE.Vector3(0, 0.5, 0),
    playerVelocity: new THREE.Vector3(),
    playerRotY: 0,
    legs: [] as THREE.Mesh[],

    // 폭탄 & 몬스터 & 화염
    bombs: [] as Bomb[],
    monsters: [] as Monster[],
    particles: [] as Particle[],
    flameMeshes: [] as THREE.Mesh[],
    particleGeo: new THREE.SphereGeometry(0.08, 6, 6),

    // 조이스틱
    joystickActive: false,
    touchStart: { x: 0, y: 0 },
    touchCurrent: { x: 0, y: 0 },
    moveDir: { x: 0, z: 0 },

    // 통계
    monstersKilled: 0,
    startTime: Date.now(),
  });

  // 셀 좌표 <-> 3D 월드 좌표 변환
  const cellToWorld = (r: number, c: number) => {
    const half = (GRID_SIZE - 1) / 2;
    return new THREE.Vector3((c - half) * CELL_SIZE, 0, (r - half) * CELL_SIZE);
  };

  const worldToCell = (x: number, z: number) => {
    const half = (GRID_SIZE - 1) / 2;
    const c = Math.round(x / CELL_SIZE + half);
    const r = Math.round(z / CELL_SIZE + half);
    return {
      r: Math.max(0, Math.min(GRID_SIZE - 1, r)),
      c: Math.max(0, Math.min(GRID_SIZE - 1, c)),
    };
  };

  // 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (touch.clientX < rect.width * 0.55) {
      stateRef.current.joystickActive = true;
      stateRef.current.touchStart = { x: touch.clientX, y: touch.clientY };
      stateRef.current.touchCurrent = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!stateRef.current.joystickActive) return;
    const touch = e.touches[0];
    stateRef.current.touchCurrent = { x: touch.clientX, y: touch.clientY };
    const dx = touch.clientX - stateRef.current.touchStart.x;
    const dy = touch.clientY - stateRef.current.touchStart.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 50;
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const norm = dist > 5 ? clampedDist / maxRadius : 0;
    stateRef.current.moveDir = {
      x: Math.cos(angle) * norm,
      z: Math.sin(angle) * norm,
    };
  };

  const handleTouchEnd = () => {
    stateRef.current.joystickActive = false;
    stateRef.current.moveDir = { x: 0, z: 0 };
  };

  // 파티클 생성
  const spawnParticles = (pos: THREE.Vector3, colorHex: number, count: number, speed: number = 3) => {
    const scene = stateRef.current.scene;
    if (!scene) return;
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(stateRef.current.particleGeo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      stateRef.current.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() * 0.8 + 0.2) * speed,
        vz: (Math.random() - 0.5) * speed,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
  };

  // 폭탄 설치 (BOMB)
  const placeBomb = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    if (s.bombs.length >= 3 || !s.scene) return;

    const cell = worldToCell(s.playerPos.x, s.playerPos.z);
    // 이미 해당 칸에 폭탄이 있는지 확인
    if (s.bombs.some((b) => b.r === cell.r && b.c === cell.c)) return;

    const wPos = cellToWorld(cell.r, cell.c);
    wPos.y = 0.4;

    // 3D 구형 폭탄 생성
    const bombGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const bombMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.6, roughness: 0.3 });
    const bombMesh = new THREE.Mesh(bombGeo, bombMat);
    bombMesh.position.copy(wPos);

    // 도화선 불꽃
    const fuseGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
    const fuseMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const fuseMesh = new THREE.Mesh(fuseGeo, fuseMat);
    fuseMesh.position.set(0, 0.42, 0);
    bombMesh.add(fuseMesh);

    s.scene.add(bombMesh);

    s.bombs.push({
      r: cell.r,
      c: cell.c,
      mesh: bombMesh,
      fuseMesh,
      timer: 2.2,
      range: 2,
    });

    setActiveBombsCount(s.bombs.length);
    if (navigator.vibrate) navigator.vibrate(25);
  };

  // 즉시 기폭 (DETONATE)
  const detonateFirstBomb = () => {
    const s = stateRef.current;
    if (s.bombs.length > 0) {
      explodeBomb(s.bombs[0]);
    }
  };

  // 폭탄 폭발 처리
  const explodeBomb = (bomb: Bomb) => {
    const s = stateRef.current;
    const idx = s.bombs.indexOf(bomb);
    if (idx !== -1) {
      if (s.scene) s.scene.remove(bomb.mesh);
      s.bombs.splice(idx, 1);
      setActiveBombsCount(s.bombs.length);
    }

    const centerPos = cellToWorld(bomb.r, bomb.c);
    centerPos.y = 0.5;
    spawnParticles(centerPos, 0xf97316, 25, 4.5);
    spawnParticles(centerPos, 0xfacc15, 20, 3.5);

    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

    // 4방향 십자 화염 전파
    const dirs = [
      { r: 0, c: 0 },
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 },
    ];

    const affectedCells: { r: number; c: number }[] = [];

    // 중심 셀 추가
    affectedCells.push({ r: bomb.r, c: bomb.c });

    // 4방향으로 range만큼 뻗어나감
    for (const d of dirs.slice(1)) {
      for (let dist = 1; dist <= bomb.range; dist++) {
        const nr = bomb.r + d.r * dist;
        const nc = bomb.c + d.c * dist;

        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) break;

        // 파괴 불가 벽에 막힘
        if (s.grid[nr][nc] === 1) break;

        affectedCells.push({ r: nr, c: nc });

        // 파괴 가능 상자 파괴 후 멈춤
        if (s.grid[nr][nc] === 2) {
          s.grid[nr][nc] = 0;
          const key = `${nr}_${nc}`;
          const crateMesh = s.crateMeshes.get(key);
          if (crateMesh && s.scene) {
            s.scene.remove(crateMesh);
            s.crateMeshes.delete(key);
            spawnParticles(crateMesh.position, 0x92400e, 15, 3);
          }
          break;
        }
      }
    }

    // 3D 화염 비주얼 생성
    affectedCells.forEach((cell) => {
      const pos = cellToWorld(cell.r, cell.c);
      pos.y = 0.4;
      spawnParticles(pos, 0xf97316, 8, 2);

      // 화염에 닿은 다른 폭탄 연쇄 기폭
      const chainBomb = s.bombs.find((b) => b.r === cell.r && b.c === cell.c);
      if (chainBomb) {
        setTimeout(() => explodeBomb(chainBomb), 80);
      }

      // 화염에 닿은 몬스터 처치
      s.monsters.forEach((m) => {
        if (m.alive && m.r === cell.r && m.c === cell.c) {
          m.alive = false;
          if (s.scene) s.scene.remove(m.mesh);
          s.monstersKilled += 1;
          setMonstersDefeated(s.monstersKilled);
          spawnParticles(pos, 0xa855f7, 20, 3.5);

          if (s.monstersKilled >= totalMonstersCount) {
            setTimeout(() => handleVictory(), 1000);
          }
        }
      });

      // 플레이어 피격 판정
      const pCell = worldToCell(s.playerPos.x, s.playerPos.z);
      if (pCell.r === cell.r && pCell.c === cell.c) {
        handleGameOver();
      }
    });
  };

  // 승리 처리
  const handleVictory = () => {
    setGameState('victory');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'boomy-world',
      gameTitle: '부미 월드 3D (Boomy World)',
      isVictory: true,
      score: 1000,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 게임오버 처리
  const handleGameOver = () => {
    setGameState('gameover');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'boomy-world',
      gameTitle: '부미 월드 3D (Boomy World)',
      isVictory: false,
      score: s.monstersKilled * 180,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 중도 포기 정산
  const confirmExit = () => {
    setShowExitModal(false);
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    calculateAndDepositMissionReward({
      gameId: 'boomy-world',
      gameTitle: '부미 월드 3D (Boomy World)',
      isVictory: false,
      score: s.monstersKilled * 150,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    handleExit();
  };

  // 재시작
  const restartGame = () => {
    const s = stateRef.current;
    s.monstersKilled = 0;
    s.bombs = [];
    s.startTime = Date.now();
    setMonstersDefeated(0);
    setActiveBombsCount(0);
    setRewardReceipt(null);
    setGameState('playing');
  };

  // Three.js 환경 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5);
    scene.fog = new THREE.FogExp2(0xfbf3d5, 0.02);
    stateRef.current.scene = scene;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3D 바닥
    const floorGeo = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 맵 중앙 바닥 No.082 공식 영웅 배지 엠블럼
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const badgeCtx = badgeCanvas.getContext('2d');
    if (badgeCtx) {
      drawCardSprite(badgeCtx, cardId, 0, 0, 256, 256);
      const badgeTex = new THREE.CanvasTexture(badgeCanvas);
      const badgePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 3.5),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, opacity: 0.85 })
      );
      badgePlane.rotation.x = -Math.PI / 2;
      badgePlane.position.set(0, 0.02, 0);
      scene.add(badgePlane);
    }

    // --- 맵 그리드 생성 (외벽, 단단한 기둥, 파괴가능 상자) ---
    const grid: number[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        // 외벽
        if (r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1) {
          grid[r][c] = 1;
          const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, 1.2, CELL_SIZE), wallMat);
          const pos = cellToWorld(r, c);
          pos.y = 0.6;
          wallMesh.position.copy(pos);
          scene.add(wallMesh);
        } else if (r % 2 === 0 && c % 2 === 0) {
          // 파괴 불가 석조 기둥
          grid[r][c] = 1;
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE * 0.9, 1.2, CELL_SIZE * 0.9), wallMat);
          const pos = cellToWorld(r, c);
          pos.y = 0.6;
          pillar.position.copy(pos);
          scene.add(pillar);
        } else if (Math.random() < 0.45 && (r > 2 || c > 2)) {
          // 파괴 가능 상자 (플레이어 시작지점 (1,1) 주변 제외)
          grid[r][c] = 2;
          const crate = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE * 0.85, 1.0, CELL_SIZE * 0.85), crateMat);
          const pos = cellToWorld(r, c);
          pos.y = 0.5;
          crate.position.copy(pos);
          scene.add(crate);
          stateRef.current.crateMeshes.set(`${r}_${c}`, crate);
        }
      }
    }
    stateRef.current.grid = grid;

    // --- 플레이어 봄버맨 생성 ---
    const startPos = cellToWorld(1, 1);
    startPos.y = 0.5;
    stateRef.current.playerPos.copy(startPos);

    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
    pBody.position.y = 0.35;
    playerGroup.add(pBody);

    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    pHead.position.y = 0.95;
    playerGroup.add(pHead);

    const pLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x1e1b4b }));
    pLegL.position.set(-0.16, -0.1, 0);
    playerGroup.add(pLegL);
    const pLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x1e1b4b }));
    pLegR.position.set(0.16, -0.1, 0);
    playerGroup.add(pLegR);
    stateRef.current.legs = [pLegL, pLegR];

    // 백팩 No.082 공식 영웅 배지
    if (badgeCtx) {
      const badgeTex = new THREE.CanvasTexture(badgeCanvas);
      const backpack = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.32),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })
      );
      backpack.position.set(0, 0.45, -0.28);
      backpack.rotation.y = Math.PI;
      playerGroup.add(backpack);
    }

    playerGroup.position.copy(startPos);
    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;

    // --- 5마리 몬스터 생성 ---
    const monsterCoords = [
      { r: 9, c: 9 },
      { r: 9, c: 3 },
      { r: 3, c: 9 },
      { r: 7, c: 5 },
      { r: 5, c: 7 },
    ];

    const monsters: Monster[] = [];
    monsterCoords.forEach((coord) => {
      const mGroup = new THREE.Group();
      const mMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.38),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3 })
      );
      mMesh.position.y = 0.4;
      mGroup.add(mMesh);

      // 눈 2개
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
      eyeL.position.set(-0.14, 0.5, 0.32);
      mGroup.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
      eyeR.position.set(0.14, 0.5, 0.32);
      mGroup.add(eyeR);

      const mPos = cellToWorld(coord.r, coord.c);
      mPos.y = 0.4;
      mGroup.position.copy(mPos);
      scene.add(mGroup);

      monsters.push({
        r: coord.r,
        c: coord.c,
        mesh: mGroup,
        dir: { r: 0, c: -1 },
        moveProgress: 0,
        alive: true,
      });
    });
    stateRef.current.monsters = monsters;

    // 리사이즈
    const handleResize = () => {
      if (!container || !stateRef.current.renderer || !stateRef.current.camera) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      stateRef.current.camera.aspect = nw / nh;
      stateRef.current.camera.updateProjectionMatrix();
      stateRef.current.renderer.setSize(nw, nh, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 애니메이션 루프
    const animate = () => {
      stateRef.current.animFrame = requestAnimationFrame(animate);
      const dt = Math.min(stateRef.current.clock.getDelta(), 0.1);
      const s = stateRef.current;
      const time = s.clock.getElapsedTime();

      // 플레이어 이동
      if (gameState === 'playing') {
        const isMoving = s.moveDir.x !== 0 || s.moveDir.z !== 0;
        if (isMoving) {
          const speed = 4.8;
          const nextX = s.playerPos.x + s.moveDir.x * speed * dt;
          const nextZ = s.playerPos.z + s.moveDir.z * speed * dt;

          // 충돌 판정 (벽/상자)
          const targetCell = worldToCell(nextX, nextZ);
          if (s.grid[targetCell.r]?.[targetCell.c] === 0) {
            s.playerPos.x = nextX;
            s.playerPos.z = nextZ;
          }

          s.playerRotY = Math.atan2(s.moveDir.x, s.moveDir.z);

          if (s.legs.length === 2) {
            s.legs[0].rotation.x = Math.sin(time * 16) * 0.6;
            s.legs[1].rotation.x = -Math.sin(time * 16) * 0.6;
          }
        } else if (s.legs.length === 2) {
          s.legs[0].rotation.x = 0;
          s.legs[1].rotation.x = 0;
        }

        if (s.playerGroup) {
          s.playerGroup.position.copy(s.playerPos);
          s.playerGroup.rotation.y = s.playerRotY;
        }
      }

      // 폭탄 타이머 & 펄스 애니메이션
      for (let i = s.bombs.length - 1; i >= 0; i--) {
        const b = s.bombs[i];
        b.timer -= dt;

        // 펄스 스케일
        const pulse = 1 + Math.sin(time * 15) * 0.08;
        b.mesh.scale.set(pulse, pulse, pulse);

        if (b.timer <= 0) {
          explodeBomb(b);
        }
      }

      // 몬스터 AI 방황 이동
      s.monsters.forEach((m) => {
        if (!m.alive) return;
        m.moveProgress += dt * 1.5;

        // 바운스 애니메이션
        m.mesh.position.y = 0.4 + Math.abs(Math.sin(time * 8)) * 0.25;

        if (m.moveProgress >= 1.0) {
          m.moveProgress = 0;
          // 다음 셀로 이동
          const dirs = [
            { r: -1, c: 0 },
            { r: 1, c: 0 },
            { r: 0, c: -1 },
            { r: 0, c: 1 },
          ];
          const validDirs = dirs.filter(
            (d) => s.grid[m.r + d.r]?.[m.c + d.c] === 0
          );
          if (validDirs.length > 0) {
            m.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            m.r += m.dir.r;
            m.c += m.dir.c;
            const wPos = cellToWorld(m.r, m.c);
            m.mesh.position.x = wPos.x;
            m.mesh.position.z = wPos.z;
          }
        }

        // 플레이어 접촉 충돌 판정
        if (gameState === 'playing') {
          const distToPlayer = s.playerPos.distanceTo(m.mesh.position);
          if (distToPlayer < 0.9) {
            handleGameOver();
          }
        }
      });

      // 파티클 업데이트
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 4.0 * dt;
        const scale = Math.max(0.01, 1 - p.life / p.maxLife);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          s.particles.splice(i, 1);
        }
      }

      // 카메라 스무스 추적
      const targetCamX = s.playerPos.x * 0.2;
      const targetCamZ = s.playerPos.z * 0.2 + 12;
      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;
      camera.lookAt(s.playerPos.x * 0.1, 0, s.playerPos.z * 0.1);

      renderer.render(scene, camera);
    };

    stateRef.current.animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(stateRef.current.animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cardId, gameState]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5] font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="BOOMY WORLD 3D"
        scoreDisplay={`MONSTERS: ${monstersDefeated}/${totalMonstersCount} | BOMBS: ${activeBombsCount}/3`}
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 조이스틱 피드백 */}
      {stateRef.current.joystickActive && (
        <div
          className="absolute w-28 h-28 rounded-full border-2 border-amber-400/40 bg-amber-500/10 pointer-events-none -translate-x-1/2 -translate-y-1/2 z-20"
          style={{
            left: stateRef.current.touchStart.x,
            top: stateRef.current.touchStart.y,
          }}
        >
          <div
            className="absolute w-12 h-12 rounded-full bg-amber-400/80 shadow-lg -translate-x-1/2 -translate-y-1/2"
            style={{
              left: 56 + stateRef.current.moveDir.x * 40,
              top: 56 + stateRef.current.moveDir.z * 40,
            }}
          />
        </div>
      )}

      {/* 우측 하단 퓨어 모바일 액션 버튼 군 */}
      {gameState === 'playing' && (
        <div className="absolute right-4 bottom-6 flex gap-3 items-center pointer-events-auto z-20 select-none">
          {/* 즉시 기폭 버튼 (DETONATE) */}
          <button
            onClick={detonateFirstBomb}
            disabled={activeBombsCount === 0}
            className="w-16 h-16 rounded-full bg-gradient-to-b from-rose-500 to-red-600 text-white font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 border-rose-300 disabled:opacity-50"
          >
            <span>DETONATE</span>
            <span className="text-[8px]">즉시기폭</span>
          </button>

          {/* 76px 폭탄 설치 대형 버튼 (BOMB) */}
          <button
            onClick={placeBomb}
            disabled={activeBombsCount >= 3}
            className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-amber-400 to-yellow-500 text-black font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white disabled:opacity-50"
          >
            <span>BOMB!</span>
            <span className="text-[9px] font-bold">폭탄설치</span>
          </button>
        </div>
      )}

      {/* 시작(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-amber-400 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-amber-400 mb-2">BOOMY WORLD 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              3D 봄버 아레나에서 연쇄 폭발을 일으키세요!
              <br />
              <span className="text-amber-300">좌측 터치 조이스틱</span>으로 이동,
              <br />
              <span className="text-yellow-400 font-bold">[BOMB!]</span>으로 폭탄을 설치하여
              <br />
              십자 화염으로 <span className="text-purple-400 font-bold">5마리 몬스터</span>를 모두 소탕하세요!
            </p>
            <button
              onClick={() => setGameState('playing')}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ 폭발 배틀 시작! ]
            </button>
          </div>
        </div>
      )}

      {/* 게임오버 모달 */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-red-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-red-500 mb-2">BLOWN AWAY!</h2>
            <p className="text-xs text-slate-300 mb-4">
              몬스터나 화염에 휩쓸렸습니다!
              <br />
              처치한 몬스터: {monstersDefeated} / {totalMonstersCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={restartGame}
                className="flex-1 py-3 bg-amber-500 text-black font-black text-sm rounded-sm active:scale-95"
              >
                [ 다시 도전 ]
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-sm rounded-sm active:scale-95 border border-slate-700"
              >
                [ 나가기 ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승리 보상 모달 */}
      {gameState === 'victory' && rewardReceipt && (
        <VictoryRewardModal
          isOpen={true}
          receipt={rewardReceipt}
          onClose={handleExit}
        />
      )}

      {/* 중도 포기 확인 모달 */}
      {showExitModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-40">
          <div className="bg-slate-900 border border-slate-700 p-5 max-w-xs w-full text-center rounded-sm">
            <h3 className="text-lg font-bold text-white mb-2">배틀을 중단할까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지 소탕한 몬스터 수에 따라 SNS 보상이 안전하게 정산됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmExit}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-sm active:scale-95"
              >
                포기하기
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2 bg-slate-700 text-slate-200 font-bold text-xs rounded-sm active:scale-95"
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PokiBoomyWorldGame };

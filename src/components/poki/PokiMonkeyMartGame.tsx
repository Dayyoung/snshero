import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { DollarSign, ShoppingBag, Zap, UserPlus, RotateCcw, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

interface PokiMonkeyMartGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;
}

interface Customer {
  id: number;
  mesh: THREE.Group;
  type: 'panda' | 'cat' | 'penguin' | 'fox';
  state: 'entering' | 'shopping' | 'queuing' | 'paying' | 'exiting';
  targetShelf: 'banana' | 'corn';
  x: number;
  z: number;
  speed: number;
  itemCarried: 'banana' | 'corn' | null;
  waitTime: number;
}

interface CashDrop {
  id: number;
  mesh: THREE.Mesh;
  x: number;
  z: number;
  val: number;
}

interface ItemBox {
  mesh: THREE.Mesh;
  type: 'banana' | 'corn';
}

export default function PokiMonkeyMartGame({ onClose, onBack, cardId = 68 }: PokiMonkeyMartGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 경제 및 목표 상태
  const [cash, setCash] = useState(0);
  const [itemsSold, setItemsSold] = useState(0);
  const [hasHelper, setHasHelper] = useState(false);
  const [dashCd, setDashCd] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 플로팅 가상 조이스틱 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });

  const inputRef = useRef({
    moveX: 0,
    moveZ: 0,
    dashActive: false,
    dashTime: 0,
  });

  const stateRef = useRef({
    playerX: 0,
    playerZ: 5,
    playerRot: 0,
    stackItems: [] as ('banana' | 'corn')[],
    maxStack: 8,
    bananaStock: 8,
    cornStock: 8,
    bananaShelfCount: 4,
    cornShelfCount: 4,
    cash: 0,
    totalSold: 0,
    hasHelper: false,
    helperX: -4,
    helperZ: -8,
    helperCarrying: null as 'banana' | 'corn' | null,
    customers: [] as Customer[],
    cashDrops: [] as CashDrop[],
    nextId: 1,
    startTime: Date.now(),
    ended: false,
    playerMesh: null as THREE.Group | null,
    stackMeshes: [] as THREE.Mesh[],
    helperMesh: null as THREE.Group | null,
    shelfBananaBoxes: [] as THREE.Mesh[],
    shelfCornBoxes: [] as THREE.Mesh[],
  });

  // 효과음
  const playSound = useCallback((type: 'harvest' | 'shelf' | 'cash' | 'register' | 'dash' | 'hire' | 'win') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'harvest') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'shelf') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'cash') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.06);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'register') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(987, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'dash') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'hire') {
        [440, 554, 659].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.2, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.2);
        });
      } else if (type === 'win') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.25, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.35);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.35);
        });
      }
    } catch {
      // AudioContext 미지원 안전 무시
    }
  }, [isMuted]);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬 및 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0fdf4); // 싱그러운 민트 베이지

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 200);
    camera.position.set(0, 24, 22);
    camera.lookAt(0, 0, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.1);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // 마트 바닥 (34x34m 타일 바닥)
    const floorGeo = new THREE.PlaneGeometry(32, 34);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    // 바닥 체크 타일 그리드
    const grid = new THREE.GridHelper(32, 16, 0x81c784, 0xe0e0e0);
    grid.position.y = 0.02;
    scene.add(grid);

    // 마트 벽체 (후면, 좌우 벽)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xc8e6c9, roughness: 0.6 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(32, 6, 0.8), wallMat);
    backWall.position.set(0, 3, -17);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 34), wallMat);
    leftWall.position.set(-16, 3, 0);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 34), wallMat);
    rightWall.position.set(16, 3, 0);
    scene.add(backWall);
    scene.add(leftWall);
    scene.add(rightWall);

    // 1. 바나나 농장 구역 (좌상단 x: -10, z: -11)
    const bananaZone = new THREE.Group();
    bananaZone.position.set(-10, 0, -11);

    // 야자수 나무
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 4.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    trunk.castShadow = true;

    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x43a047 });
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.5, 2.0, 7), leavesMat);
    leaves.position.y = 4.8;
    bananaZone.add(trunk);
    bananaZone.add(leaves);

    // 바나나 생산 베이스 원형 존
    const bCircle = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 24),
      new THREE.MeshBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.35 })
    );
    bCircle.rotateX(-Math.PI / 2);
    bCircle.position.y = 0.04;
    bananaZone.add(bCircle);
    scene.add(bananaZone);

    // 2. 옥수수 농장 구역 (우상단 x: 10, z: -11)
    const cornZone = new THREE.Group();
    cornZone.position.set(10, 0, -11);

    const cPatch = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.1, 5),
      new THREE.MeshStandardMaterial({ color: 0x795548 })
    );
    cPatch.position.y = 0.05;
    cornZone.add(cPatch);

    // 옥수수 줄기 4개
    for (let cx = -1.5; cx <= 1.5; cx += 1.5) {
      for (let cz = -1.5; cz <= 1.5; cz += 1.5) {
        const stalk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 2.2, 5),
          new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
        );
        stalk.position.set(cx, 1.1, cz);
        const ear = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.6, 0.3),
          new THREE.MeshStandardMaterial({ color: 0xffca28 })
        );
        ear.position.set(cx, 1.5, cz);
        cornZone.add(stalk);
        cornZone.add(ear);
      }
    }
    scene.add(cornZone);

    // 3. 상품 진열대 (Shelves)
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });

    // 바나나 진열대 (x: -8, z: -1)
    const bShelfGroup = new THREE.Group();
    bShelfGroup.position.set(-8, 0, -1);
    const bShelf = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 1.8), shelfMat);
    bShelf.position.y = 1.1;
    bShelf.castShadow = true;
    bShelfGroup.add(bShelf);

    // 바나나 진열 박스들
    const bBoxes: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.3 })
      );
      box.position.set(-1.2 + (i % 3) * 1.2, 2.35, 0);
      bShelfGroup.add(box);
      bBoxes.push(box);
    }
    scene.add(bShelfGroup);
    stateRef.current.shelfBananaBoxes = bBoxes;

    // 옥수수 진열대 (x: 8, z: -1)
    const cShelfGroup = new THREE.Group();
    cShelfGroup.position.set(8, 0, -1);
    const cShelf = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 1.8), shelfMat);
    cShelf.position.y = 1.1;
    cShelf.castShadow = true;
    cShelfGroup.add(cShelf);

    const cBoxes: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xff9800, roughness: 0.3 })
      );
      box.position.set(-1.2 + (i % 3) * 1.2, 2.35, 0);
      cShelfGroup.add(box);
      cBoxes.push(box);
    }
    scene.add(cShelfGroup);
    stateRef.current.shelfCornBoxes = cBoxes;

    // 4. 계산대 (Cashier Counter - x: 0, z: 8)
    const counterGroup = new THREE.Group();
    counterGroup.position.set(0, 0, 8);
    const counterDesk = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 1.8, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.4 })
    );
    counterDesk.position.y = 0.9;
    counterDesk.castShadow = true;
    counterGroup.add(counterDesk);

    // 금전 등록기 (POS)
    const posMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x263238 })
    );
    posMesh.position.set(0, 2.1, 0);
    counterGroup.add(posMesh);

    // 계산대 대기 서클 존
    const cashZone = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 20),
      new THREE.MeshBasicMaterial({ color: 0x4caf50, transparent: true, opacity: 0.3 })
    );
    cashZone.rotateX(-Math.PI / 2);
    cashZone.position.y = 0.04;
    counterGroup.add(cashZone);

    scene.add(counterGroup);

    // 5. 플레이어 몽키 매니저 생성
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 5);

    // 원숭이 몸체 (브라운)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.7 });
    const monkeyBody = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.2, 8), bodyMat);
    monkeyBody.position.y = 0.9;
    monkeyBody.castShadow = true;
    playerGroup.add(monkeyBody);

    // 원숭이 머리
    const monkeyHead = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), bodyMat);
    monkeyHead.position.y = 1.85;
    monkeyHead.castShadow = true;
    playerGroup.add(monkeyHead);

    // 원숭이 귀 2개
    const earGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const lEar = new THREE.Mesh(earGeo, bodyMat);
    lEar.position.set(-0.55, 1.95, 0);
    const rEar = new THREE.Mesh(earGeo, bodyMat);
    rEar.position.set(0.55, 1.95, 0);
    playerGroup.add(lEar);
    playerGroup.add(rEar);

    // 붉은 매니저 캡 모자 & No.068 영웅 카드 배지
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: 0xd32f2f })
    );
    cap.position.y = 2.4;
    playerGroup.add(cap);

    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 68, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), bMat);
    badge.position.set(0, 2.7, 0.05);
    playerGroup.add(badge);

    scene.add(playerGroup);
    stateRef.current.playerMesh = playerGroup;

    // 6. 도우미 알바 원숭이 모델 (초기 비활성)
    const helperGroup = new THREE.Group();
    const helperBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
    );
    helperBody.position.y = 0.8;
    const helperHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
    );
    helperHead.position.y = 1.55;
    const helperCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1976d2 })
    );
    helperCap.position.y = 1.95;
    helperGroup.add(helperBody);
    helperGroup.add(helperHead);
    helperGroup.add(helperCap);
    helperGroup.position.set(-4, 0, -8);
    helperGroup.visible = false;
    scene.add(helperGroup);
    stateRef.current.helperMesh = helperGroup;

    // 손님 동물 생성 헬퍼
    const createCustomer = (id: number): Customer => {
      const types: ('panda' | 'cat' | 'penguin' | 'fox')[] = ['panda', 'cat', 'penguin', 'fox'];
      const type = types[Math.floor(Math.random() * types.length)];

      const cGroup = new THREE.Group();
      let color = 0xffffff;
      if (type === 'panda') color = 0x212121;
      else if (type === 'cat') color = 0xffb74d;
      else if (type === 'penguin') color = 0x37474f;
      else if (type === 'fox') color = 0xe65100;

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 1.1, 8),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.8;
      body.castShadow = true;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 10, 10),
        new THREE.MeshStandardMaterial({ color: type === 'panda' ? 0xffffff : color })
      );
      head.position.y = 1.6;
      head.castShadow = true;
      cGroup.add(body);
      cGroup.add(head);

      cGroup.position.set(0, 0, 16);
      scene.add(cGroup);

      return {
        id,
        mesh: cGroup,
        type,
        state: 'entering',
        targetShelf: Math.random() > 0.5 ? 'banana' : 'corn',
        x: (Math.random() - 0.5) * 4,
        z: 16,
        speed: 3.2 + Math.random() * 0.8,
        itemCarried: null,
        waitTime: 0,
      };
    };

    // 초기 손님 3명 스폰
    for (let i = 0; i < 3; i++) {
      const c = createCustomer(stateRef.current.nextId++);
      c.z += i * 5;
      c.mesh.position.z = c.z;
      stateRef.current.customers.push(c);
    }

    // 창 크기 조절
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
    };
    window.addEventListener('resize', handleResize);

    // 애니메이션 루프
    let lastTime = performance.now();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      const input = inputRef.current;

      if (state.ended) {
        renderer.render(scene, camera);
        return;
      }

      // 대시(질주) 업데이트
      let currentSpeed = 7.0;
      if (input.dashActive) {
        currentSpeed = 12.5;
        input.dashTime -= dt;
        if (input.dashTime <= 0) {
          input.dashActive = false;
        }
      }
      setDashCd(Math.max(0, input.dashTime));

      // 플레이어 이동 (Screen-relative 완벽 일치)
      if (input.moveX !== 0 || input.moveZ !== 0) {
        state.playerX += input.moveX * currentSpeed * dt;
        state.playerZ += input.moveZ * currentSpeed * dt;

        // 마트 경계 충돌 제한
        state.playerX = Math.max(-14, Math.min(14, state.playerX));
        state.playerZ = Math.max(-14, Math.min(14, state.playerZ));

        // 플레이어 바라보는 방향 회전
        state.playerRot = Math.atan2(input.moveX, input.moveZ);
      }

      // 플레이어 3D 메쉬 동기화
      if (state.playerMesh) {
        state.playerMesh.position.set(state.playerX, 0, state.playerZ);
        state.playerMesh.rotation.y = THREE.MathUtils.lerp(state.playerMesh.rotation.y, state.playerRot, 0.2);
      }

      // 1. 바나나 수확 인터랙션 (거리 < 3.2m)
      const distToBananaTree = Math.hypot(state.playerX - (-10), state.playerZ - (-11));
      if (distToBananaTree < 3.2 && state.stackItems.length < state.maxStack) {
        state.stackItems.push('banana');
        playSound('harvest');
        if (navigator.vibrate) navigator.vibrate(15);
      }

      // 2. 옥수수 수확 인터랙션 (거리 < 3.2m)
      const distToCornField = Math.hypot(state.playerX - 10, state.playerZ - (-11));
      if (distToCornField < 3.2 && state.stackItems.length < state.maxStack) {
        state.stackItems.push('corn');
        playSound('harvest');
        if (navigator.vibrate) navigator.vibrate(15);
      }

      // 3. 바나나 진열대 인터랙션 (거리 < 2.8m)
      const distToBShelf = Math.hypot(state.playerX - (-8), state.playerZ - (-1));
      if (distToBShelf < 2.8 && state.bananaShelfCount < 6) {
        const bIdx = state.stackItems.indexOf('banana');
        if (bIdx !== -1) {
          state.stackItems.splice(bIdx, 1);
          state.bananaShelfCount++;
          playSound('shelf');
          if (navigator.vibrate) navigator.vibrate(15);
        }
      }

      // 4. 옥수수 진열대 인터랙션 (거리 < 2.8m)
      const distToCShelf = Math.hypot(state.playerX - 8, state.playerZ - (-1));
      if (distToCShelf < 2.8 && state.cornShelfCount < 6) {
        const cIdx = state.stackItems.indexOf('corn');
        if (cIdx !== -1) {
          state.stackItems.splice(cIdx, 1);
          state.cornShelfCount++;
          playSound('shelf');
          if (navigator.vibrate) navigator.vibrate(15);
        }
      }

      // 진열대 박스 표시 동기화
      state.shelfBananaBoxes.forEach((b, idx) => {
        b.visible = idx < state.bananaShelfCount;
      });
      state.shelfCornBoxes.forEach((b, idx) => {
        b.visible = idx < state.cornShelfCount;
      });

      // 플레이어 등 뒤 상품 스택 메쉬 동기화
      // 기존 스택 메쉬 제거 후 새로 생성 (최대 8개)
      state.stackMeshes.forEach((m) => scene.remove(m));
      state.stackMeshes = [];

      state.stackItems.forEach((type, idx) => {
        const boxGeo = new THREE.BoxGeometry(0.7, 0.4, 0.5);
        const boxMat = new THREE.MeshStandardMaterial({
          color: type === 'banana' ? 0xffd600 : 0xff9800,
          roughness: 0.3,
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        const sway = Math.sin(now * 0.008 + idx) * 0.06;
        boxMesh.position.set(state.playerX + sway, 2.6 + idx * 0.45, state.playerZ);
        boxMesh.rotation.y = state.playerRot;
        scene.add(boxMesh);
        state.stackMeshes.push(boxMesh);
      });

      // 5. 계산대 인터랙션 (거리 < 2.5m)
      const distToCounter = Math.hypot(state.playerX - 0, state.playerZ - 8);
      const isPlayerAtCounter = distToCounter < 2.5;

      // 손님 AI 로직
      state.customers.forEach((c) => {
        if (c.state === 'entering') {
          // 진열대로 이동
          const targetX = c.targetShelf === 'banana' ? -8 : 8;
          const targetZ = 1.2;
          const dx = targetX - c.x;
          const dz = targetZ - c.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.5) {
            c.x += (dx / dist) * c.speed * dt;
            c.z += (dz / dist) * c.speed * dt;
          } else {
            c.state = 'shopping';
            c.waitTime = 1.0;
          }
        } else if (c.state === 'shopping') {
          c.waitTime -= dt;
          if (c.waitTime <= 0) {
            if (c.targetShelf === 'banana' && state.bananaShelfCount > 0) {
              state.bananaShelfCount--;
              c.itemCarried = 'banana';
              c.state = 'queuing';
            } else if (c.targetShelf === 'corn' && state.cornShelfCount > 0) {
              state.cornShelfCount--;
              c.itemCarried = 'corn';
              c.state = 'queuing';
            }
          }
        } else if (c.state === 'queuing') {
          // 계산대로 줄서기
          const targetX = 0;
          const targetZ = 9.8;
          const dx = targetX - c.x;
          const dz = targetZ - c.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.5) {
            c.x += (dx / dist) * c.speed * dt;
            c.z += (dz / dist) * c.speed * dt;
          } else {
            c.state = 'paying';
            c.waitTime = 1.2;
          }
        } else if (c.state === 'paying') {
          // 플레이어가 계산대에 서면 즉시 계산 완료!
          if (isPlayerAtCounter) {
            c.waitTime -= dt * 2.5;
          } else {
            c.waitTime -= dt * 0.4;
          }

          if (c.waitTime <= 0) {
            c.state = 'exiting';
            c.itemCarried = null;
            state.totalSold++;
            setItemsSold(state.totalSold);
            playSound('register');

            // 지폐 드랍 ($25)
            const billGeo = new THREE.BoxGeometry(0.6, 0.15, 0.4);
            const billMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
            const billMesh = new THREE.Mesh(billGeo, billMat);
            const dropX = (Math.random() - 0.5) * 2;
            const dropZ = 7.5 + Math.random() * 1.5;
            billMesh.position.set(dropX, 0.2, dropZ);
            scene.add(billMesh);
            state.cashDrops.push({
              id: state.nextId++,
              mesh: billMesh,
              x: dropX,
              z: dropZ,
              val: 25,
            });
          }
        } else if (c.state === 'exiting') {
          // 출구로 퇴장
          const dx = 0 - c.x;
          const dz = 18 - c.z;
          const dist = Math.hypot(dx, dz);
          c.x += (dx / dist) * c.speed * dt;
          c.z += (dz / dist) * c.speed * dt;
          if (c.z >= 17) {
            // 퇴장 완료 후 재스폰
            c.state = 'entering';
            c.targetShelf = Math.random() > 0.5 ? 'banana' : 'corn';
            c.x = (Math.random() - 0.5) * 4;
            c.z = 17;
          }
        }

        // 손님 3D 메쉬 위치 동기화
        c.mesh.position.set(c.x, 0, c.z);
      });

      // 지폐 수금 판정 (플레이어가 지나가면 획득)
      for (let i = state.cashDrops.length - 1; i >= 0; i--) {
        const drop = state.cashDrops[i];
        const dist = Math.hypot(state.playerX - drop.x, state.playerZ - drop.z);
        if (dist < 2.0) {
          state.cash += drop.val;
          setCash(state.cash);
          scene.remove(drop.mesh);
          state.cashDrops.splice(i, 1);
          playSound('cash');
          if (navigator.vibrate) navigator.vibrate(25);
        }
      }

      // 도우미 알바 원숭이 AI
      if (state.hasHelper && state.helperMesh) {
        state.helperMesh.visible = true;
        // 바나나 농장과 바나나 진열대 왕복
        if (!state.helperCarrying) {
          // 농장으로 이동
          const dx = -10 - state.helperX;
          const dz = -11 - state.helperZ;
          const d = Math.hypot(dx, dz);
          if (d > 0.8) {
            state.helperX += (dx / d) * 4.5 * dt;
            state.helperZ += (dz / d) * 4.5 * dt;
          } else {
            state.helperCarrying = 'banana';
          }
        } else {
          // 진열대로 이동
          const dx = -8 - state.helperX;
          const dz = -1 - state.helperZ;
          const d = Math.hypot(dx, dz);
          if (d > 0.8) {
            state.helperX += (dx / d) * 4.5 * dt;
            state.helperZ += (dz / d) * 4.5 * dt;
          } else {
            if (state.bananaShelfCount < 6) {
              state.bananaShelfCount++;
            }
            state.helperCarrying = null;
          }
        }
        state.helperMesh.position.set(state.helperX, 0, state.helperZ);
      }

      // 승리 목표 판정 ($500 획득 & 30개 판매)
      if (state.cash >= 500 && state.totalSold >= 30 && !state.ended) {
        state.ended = true;
        setIsGameWon(true);
        playSound('win');
        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const res = calculateAndDepositMissionReward({
          gameId: 'monkey-mart',
          gameTitle: '몽키 마트 3D (Monkey Mart)',
          isVictory: true,
          score: state.cash + state.totalSold * 10,
          maxTargetScore: 800,
          durationSeconds: duration,
        });
        setRewardResult(res);
      }

      // 카메라 부드러운 트래킹
      const targetCamX = state.playerX * 0.4;
      const targetCamZ = state.playerZ * 0.4 + 20;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.1);
      camera.lookAt(targetCamX, 0, 2);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cardId, playSound]);

  // 플로팅 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // 우측 상단이나 하단 버튼 영역이 아닌 경우만 조이스틱 활성화
    if (x < window.innerWidth * 0.7) {
      setJoystickActive(true);
      setJoystickCenter({ x, y });
      setJoystickKnob({ x: 0, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    const dx = currentX - joystickCenter.x;
    const dy = currentY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const maxR = 48;

    if (dist > 0) {
      const clampedDist = Math.min(dist, maxR);
      const nx = (dx / dist) * clampedDist;
      const ny = (dy / dist) * clampedDist;
      setJoystickKnob({ x: nx, y: ny });

      // Screen-relative 방향 매핑: 오른쪽 -> +X, 위(전방) -> -Z
      inputRef.current.moveX = nx / maxR;
      inputRef.current.moveZ = ny / maxR;
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setJoystickKnob({ x: 0, y: 0 });
    inputRef.current.moveX = 0;
    inputRef.current.moveZ = 0;
  };

  // 대시 발동
  const handleDash = () => {
    if (dashCd <= 0) {
      inputRef.current.dashActive = true;
      inputRef.current.dashTime = 3.0;
      playSound('dash');
      if (navigator.vibrate) navigator.vibrate(40);
    }
  };

  // 알바 고용 ($100)
  const handleHire = () => {
    if (!hasHelper && cash >= 100) {
      setCash((c) => c - 100);
      stateRef.current.cash -= 100;
      stateRef.current.hasHelper = true;
      setHasHelper(true);
      playSound('hire');
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        title="MONKEY MART 3D"
        onQuit={handleExit}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 bg-black/40 text-white rounded border border-white/20 active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        }
      />

      {/* 상단 경영 지표 (현금, 판매량, 목표) */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* 보유 현금 */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-emerald-500/40 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div>
            <div className="text-xl font-black text-emerald-300 leading-none">${cash}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">목표: $500</div>
          </div>
        </div>

        {/* 판매 수량 */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-amber-500/40 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-xl font-black text-amber-300 leading-none">{itemsSold} / 30</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">상품 판매</div>
          </div>
        </div>
      </div>

      {/* 다이나믹 플로팅 가상 조이스틱 링 & 놉 */}
      {joystickActive && (
        <div
          className="pointer-events-none absolute z-20 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 bg-black/30 backdrop-blur-xs flex items-center justify-center"
          style={{ left: joystickCenter.x, top: joystickCenter.y }}
        >
          <div
            className="w-10 h-10 rounded-full bg-emerald-500/80 border-2 border-white shadow-lg"
            style={{ transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)` }}
          />
        </div>
      )}

      {/* 하단 우측 액션 버튼군 (대시 64px, 알바 고용 64px) */}
      <div className="absolute bottom-6 right-4 z-20 flex items-center gap-3 pointer-events-none">
        {/* 알바 직원 고용 버튼 (64px) */}
        {!hasHelper && (
          <button
            onClick={handleHire}
            disabled={cash < 100}
            className={`pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-xs active:scale-95 shadow-lg ${
              cash >= 100
                ? 'bg-blue-600/90 border-blue-300 text-white shadow-blue-500/30 active:bg-blue-500'
                : 'bg-zinc-800/80 border-zinc-600 text-zinc-500 opacity-60'
            }`}
          >
            <UserPlus className="w-6 h-6 mb-0.5" />
            <span className="text-[9px]">고용 $100</span>
          </button>
        )}

        {/* 대시 질주 버튼 (64px) */}
        <button
          onClick={handleDash}
          disabled={dashCd > 0}
          className={`pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex flex-col items-center justify-center font-bold active:scale-90 shadow-xl ${
            dashCd <= 0
              ? 'bg-amber-500 border-amber-300 text-white shadow-amber-500/40 active:bg-amber-400'
              : 'bg-zinc-800 border-zinc-600 text-zinc-500 opacity-60'
          }`}
        >
          <Zap className="w-7 h-7" />
          <span className="text-[10px] mt-0.5">{dashCd <= 0 ? 'DASH' : `${dashCd.toFixed(1)}s`}</span>
        </button>
      </div>

      {/* 승리 보상 모달 */}
      {isGameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={isGameWon}
          onClose={handleExit}
          reward={rewardResult}
          gameTitle="몽키 마트 3D (Monkey Mart)"
        />
      )}
    </div>
  );
}

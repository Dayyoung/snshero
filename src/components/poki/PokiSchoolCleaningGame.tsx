import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSchoolCleaningGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface Trash3D {
  id: number;
  name: string;
  mesh: THREE.Group;
  cleaned: boolean;
  type: 'can' | 'paper' | 'milk' | 'banana' | 'snack';
}

interface Desk3D {
  id: number;
  group: THREE.Group;
  aligned: boolean;
  origX: number;
  origZ: number;
  origRotY: number;
  targetX: number;
  targetZ: number;
  targetRotY: number;
}

interface FloorStain3D {
  id: number;
  mesh: THREE.Mesh;
  cleaned: boolean;
}

export default function PokiSchoolCleaningGame({
  onBack,
  onClose,
  cardId = 87,
}: PokiSchoolCleaningGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onClose || (() => {});

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'cleaning' | 'victory'>('ready');
  const [cleanProgress, setCleanProgress] = useState(0); // 0 ~ 100%
  const [cleanedCount, setCleanedCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(10);
  const [statusMessage, setStatusMessage] = useState<string>('교실을 터치하여 청소하세요!');
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Three.js 인스턴스 레프
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    desks: Desk3D[];
    trashItems: Trash3D[];
    stains: FloorStain3D[];
    blackboardMat: THREE.MeshStandardMaterial;
    blackboardCleanTexture: THREE.CanvasTexture;
    blackboardDirtyTexture: THREE.CanvasTexture;
    isBoardClean: boolean;
    confetti: THREE.Points;
    confettiGeo: THREE.BufferGeometry;
    sparkles: THREE.Points;
    sparkleGeo: THREE.BufferGeometry;
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // 상호작용 및 드래그 제어 레프
  const controlRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    orbitTheta: Math.PI / 4, // 45도 쿼터뷰
    orbitPhi: Math.PI / 3.8, // 약 48도 내려다보기
    targetTheta: Math.PI / 4,
    targetPhi: Math.PI / 3.8,
    radius: 14,
    cleanedTasks: 0,
    totalTaskCount: 10, // 쓰레기 5개 + 책상 3개 + 칠판 1개 + 바닥 얼룩 1개(총 10단계)
    isBoardCleaned: false,
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

  // 청소 진척도 계산 및 승리 처리
  const evaluateProgress = useCallback(() => {
    const { cleanedTasks, totalTaskCount } = controlRef.current;
    const pct = Math.round((cleanedTasks / totalTaskCount) * 100);
    setCleanProgress(pct);
    setCleanedCount(cleanedTasks);

    if (cleanedTasks >= totalTaskCount) {
      setGameState('victory');
      triggerHaptic([100, 50, 150]);

      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokischoolcleaning',
        gameTitle: 'School Classroom Cleaning 3D',
        isVictory: true,
        score: 100,
        maxTargetScore: 100,
        durationSeconds: 35,
      });
      setRewardReceipt(receipt);
    }
  }, [triggerHaptic]);

  // Three.js 씬 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // 따뜻하고 밝은 교실 낮 햇살

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 조명 (따스한 햇살 창문광 + 앰비언트)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(15, 20, 12);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.6);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    // No.087 공식 카드 영웅 배지 텍스처
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 256;
    heroCanvas.height = 256;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, cardId, 18, 18, 220, 220, { circleClip: true });
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.needsUpdate = true;

    // --- 교실 건축 룸 (Room Architecture) ---
    const ROOM_W = 14;
    const ROOM_L = 12;
    const ROOM_H = 4.5;

    // 원목 마루 바닥 (Wood Floor)
    const floorGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_L);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373, // 따스한 오크 원목
      roughness: 0.4,
      metalness: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    // 정면 벽 (칠판이 붙는 곳 Z = -ROOM_L/2)
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_H),
      new THREE.MeshStandardMaterial({ color: 0xfefae0, roughness: 0.9 })
    );
    backWall.position.set(0, ROOM_H / 2, -ROOM_L / 2);
    scene.add(backWall);

    // 좌측 창문 벽 (X = -ROOM_W/2)
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_L, ROOM_H),
      new THREE.MeshStandardMaterial({ color: 0xfaedcd, roughness: 0.9 })
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
    scene.add(leftWall);

    // 3개 대형 창문 (햇살 프레임)
    for (let w = -3.5; w <= 3.5; w += 3.5) {
      const windowFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2.2, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      windowFrame.position.set(-ROOM_W / 2 + 0.06, 2.3, w);
      scene.add(windowFrame);

      const windowGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 2.0),
        new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.6 })
      );
      windowGlass.rotation.y = Math.PI / 2;
      windowGlass.position.set(-ROOM_W / 2 + 0.1, 2.3, w);
      scene.add(windowGlass);
    }

    // 전면 칠판 (Blackboard): 낙서 텍스처 & 깨끗한 텍스처
    const makeBoardCanvas = (isDirty: boolean) => {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 512;
      bCanvas.height = 256;
      const ctx = bCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e392a'; // 다크 딥 그린 분필 칠판
        ctx.fillRect(0, 0, 512, 256);
        ctx.strokeStyle = '#8d5b4c'; // 우드 프레임 테두리
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, 498, 242);

        if (isDirty) {
          ctx.font = 'bold 26px monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fillText('E = mc^2 ??', 40, 70);
          ctx.fillText('오늘의 청소 당번: SNS HERO!', 40, 120);
          ctx.fillText('Clean the classroom! 🧹', 40, 170);
          ctx.strokeStyle = 'rgba(255, 255, 100, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(320, 50);
          ctx.lineTo(470, 180);
          ctx.stroke();
        } else {
          ctx.font = 'bold 30px monospace';
          ctx.fillStyle = '#fef08a';
          ctx.fillText('✨ CLEAN & SHINY ✨', 90, 120);
          ctx.font = '20px monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText('100% PERFECT CLASSROOM!', 100, 165);
        }
      }
      return new THREE.CanvasTexture(bCanvas);
    };

    const blackboardDirtyTexture = makeBoardCanvas(true);
    const blackboardCleanTexture = makeBoardCanvas(false);
    const blackboardMat = new THREE.MeshStandardMaterial({
      map: blackboardDirtyTexture,
      roughness: 0.5,
    });

    const blackboard = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.8), blackboardMat);
    blackboard.position.set(0, 2.3, -ROOM_L / 2 + 0.05);
    blackboard.userData = { type: 'blackboard' };
    scene.add(blackboard);

    // 칠판 위 No.087 공식 영웅 배지 액자
    const badgeFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 })
    );
    badgeFrame.position.set(0, 3.9, -ROOM_L / 2 + 0.04);
    scene.add(badgeFrame);

    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.2),
      new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true })
    );
    badgeMesh.position.set(0, 3.9, -ROOM_L / 2 + 0.09);
    scene.add(badgeMesh);

    // 교탁 (Teacher Desk)
    const teacherDesk = new THREE.Group();
    teacherDesk.position.set(3.0, 0, -4.2);
    const tdTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.1, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.5 })
    );
    tdTop.position.y = 1.1;
    teacherDesk.add(tdTop);

    const tdBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.05, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.6 })
    );
    tdBase.position.y = 0.525;
    teacherDesk.add(tdBase);
    scene.add(teacherDesk);

    // 교실 코너 쓰레기통 (Trash Can)
    const trashCanGroup = new THREE.Group();
    trashCanGroup.position.set(-5.5, 0, -4.5);

    const canBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.4, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.3 })
    );
    canBody.position.y = 0.6;
    trashCanGroup.add(canBody);

    const canLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.53, 0.53, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6 })
    );
    canLid.position.y = 1.25;
    trashCanGroup.add(canLid);
    scene.add(trashCanGroup);

    // --- 6개 학생 책상 & 의자 세트 (3개는 삐뚤빼뚤 정렬 대상) ---
    const desks: Desk3D[] = [];
    const deskGrid = [
      { col: -2.2, row: -1.8, misaligned: true, angle: 0.28, offX: -0.3, offZ: 0.2 },
      { col: 2.2, row: -1.8, misaligned: false, angle: 0, offX: 0, offZ: 0 },
      { col: -2.2, row: 0.6, misaligned: false, angle: 0, offX: 0, offZ: 0 },
      { col: 2.2, row: 0.6, misaligned: true, angle: -0.35, offX: 0.4, offZ: -0.2 },
      { col: -2.2, row: 3.0, misaligned: true, angle: 0.4, offX: -0.2, offZ: 0.3 },
      { col: 2.2, row: 3.0, misaligned: false, angle: 0, offX: 0, offZ: 0 },
    ];

    deskGrid.forEach((item, idx) => {
      const deskGroup = new THREE.Group();

      // 책상 상판
      const topMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.08, 1.0),
        new THREE.MeshStandardMaterial({ color: 0xbc6c25, roughness: 0.4 })
      );
      topMesh.position.y = 0.85;
      deskGroup.add(topMesh);

      // 책상 다리 (철제 블랙)
      const legMat = new THREE.MeshStandardMaterial({ color: 0x262626, metalness: 0.8 });
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8);
      [
        [-0.7, -0.4],
        [0.7, -0.4],
        [-0.7, 0.4],
        [0.7, 0.4],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.425, lz);
        deskGroup.add(leg);
      });

      // 학생 의자
      const chairSeat = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.06, 0.7),
        new THREE.MeshStandardMaterial({ color: 0xdda15e, roughness: 0.5 })
      );
      chairSeat.position.set(0, 0.5, 0.8);
      deskGroup.add(chairSeat);

      const chairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.5, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xdda15e, roughness: 0.5 })
      );
      chairBack.position.set(0, 0.8, 1.12);
      deskGroup.add(chairBack);

      const chairLegGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
      [
        [-0.3, 0.5],
        [0.3, 0.5],
        [-0.3, 1.1],
        [0.3, 1.1],
      ].forEach(([cx, cz]) => {
        const cl = new THREE.Mesh(chairLegGeo, legMat);
        cl.position.set(cx, 0.25, cz);
        deskGroup.add(cl);
      });

      // 비뚤어진 상태 설정
      const targetX = item.col;
      const targetZ = item.row;
      const origX = item.col + item.offX;
      const origZ = item.row + item.offZ;
      const origRotY = item.angle;

      deskGroup.position.set(origX, 0, origZ);
      deskGroup.rotation.y = origRotY;
      deskGroup.userData = { type: 'desk', id: idx + 1 };

      scene.add(deskGroup);

      desks.push({
        id: idx + 1,
        group: deskGroup,
        aligned: !item.misaligned,
        origX,
        origZ,
        origRotY,
        targetX,
        targetZ,
        targetRotY: 0,
      });
    });

    // --- 바닥 쓰레기 5종 (Trash Items) ---
    const trashItems: Trash3D[] = [];
    const trashConfigs = [
      { id: 1, name: '음료수 캔', type: 'can' as const, x: -1.5, z: -0.4 },
      { id: 2, name: '구겨진 시험지', type: 'paper' as const, x: 1.0, z: 1.8 },
      { id: 3, name: '우유팩', type: 'milk' as const, x: -3.5, z: 2.2 },
      { id: 4, name: '바나나 껍질', type: 'banana' as const, x: 0.4, z: -2.8 },
      { id: 5, name: '과자 봉지', type: 'snack' as const, x: 3.5, z: 3.2 },
    ];

    trashConfigs.forEach((cfg) => {
      const g = new THREE.Group();
      g.position.set(cfg.x, 0.08, cfg.z);

      if (cfg.type === 'can') {
        const can = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12),
          new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 })
        );
        can.rotation.z = Math.PI / 2;
        g.add(can);
      } else if (cfg.type === 'paper') {
        const paper = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.15, 0),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
        );
        g.add(paper);
      } else if (cfg.type === 'milk') {
        const milk = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.3, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 })
        );
        milk.rotation.y = 0.5;
        g.add(milk);
      } else if (cfg.type === 'banana') {
        const banana = new THREE.Mesh(
          new THREE.TorusGeometry(0.18, 0.06, 6, 12, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
        );
        banana.rotation.x = Math.PI / 2;
        g.add(banana);
      } else {
        const snack = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.04, 0.22),
          new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.5, roughness: 0.3 })
        );
        snack.rotation.y = -0.6;
        g.add(snack);
      }

      // 히트박스 영역 확장용 반투명 구체
      const hitSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      g.add(hitSphere);

      g.userData = { type: 'trash', id: cfg.id, name: cfg.name };
      scene.add(g);

      trashItems.push({
        id: cfg.id,
        name: cfg.name,
        mesh: g,
        cleaned: false,
        type: cfg.type,
      });
    });

    // --- 바닥 얼룩 (Floor Stains) ---
    const stains: FloorStain3D[] = [];
    const stainPos = [
      { id: 1, x: 0, z: 0.2 },
    ];
    stainPos.forEach((sp) => {
      const stainMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.65, 16),
        new THREE.MeshBasicMaterial({ color: 0x78350f, transparent: true, opacity: 0.45 })
      );
      stainMesh.rotation.x = -Math.PI / 2;
      stainMesh.position.set(sp.x, 0.015, sp.z);
      stainMesh.userData = { type: 'stain', id: sp.id };
      scene.add(stainMesh);

      stains.push({
        id: sp.id,
        mesh: stainMesh,
        cleaned: false,
      });
    });

    // --- 반짝이 스파클 & 승리 축하 콘페티 파티클 ---
    // 1) 스파클
    const sparkleCount = 40;
    const sparkleGeo = new THREE.BufferGeometry();
    const sparklePos = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount * 3; i++) {
      sparklePos[i] = 0;
    }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
    const sparkleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.4,
      transparent: true,
      opacity: 0,
    });
    const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
    scene.add(sparkles);

    // 2) 콘페티
    const confettiCount = 60;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPos = new Float32Array(confettiCount * 3);
    const confettiVel = new Float32Array(confettiCount * 3);
    for (let i = 0; i < confettiCount; i++) {
      confettiPos[i * 3] = (Math.random() - 0.5) * 10;
      confettiPos[i * 3 + 1] = Math.random() * 4 + 1;
      confettiPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      confettiVel[i * 3] = (Math.random() - 0.5) * 2;
      confettiVel[i * 3 + 1] = -Math.random() * 2 - 0.5;
      confettiVel[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPos, 3));
    const confettiMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.35,
      transparent: true,
      opacity: 0,
    });
    const confetti = new THREE.Points(confettiGeo, confettiMat);
    scene.add(confetti);

    const clock = new THREE.Clock();

    threeRef.current = {
      scene,
      camera,
      renderer,
      desks,
      trashItems,
      stains,
      blackboardMat,
      blackboardCleanTexture,
      blackboardDirtyTexture,
      isBoardClean: false,
      confetti,
      confettiGeo,
      sparkles,
      sparkleGeo,
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

      // 카메라 궤도 회전 보간
      ctrl.orbitTheta = THREE.MathUtils.lerp(ctrl.orbitTheta, ctrl.targetTheta, delta * 6);
      ctrl.orbitPhi = THREE.MathUtils.lerp(ctrl.orbitPhi, ctrl.targetPhi, delta * 6);

      // 구면 좌표계 카메라 배치
      camera.position.x = ctrl.radius * Math.sin(ctrl.orbitPhi) * Math.cos(ctrl.orbitTheta);
      camera.position.y = ctrl.radius * Math.cos(ctrl.orbitPhi);
      camera.position.z = ctrl.radius * Math.sin(ctrl.orbitPhi) * Math.sin(ctrl.orbitTheta);
      camera.lookAt(0, 1.2, 0);

      // 책상 정렬 애니메이션 보간
      desks.forEach((d) => {
        if (d.aligned) {
          d.group.position.x = THREE.MathUtils.lerp(d.group.position.x, d.targetX, delta * 8);
          d.group.position.z = THREE.MathUtils.lerp(d.group.position.z, d.targetZ, delta * 8);
          d.group.rotation.y = THREE.MathUtils.lerp(d.group.rotation.y, d.targetRotY, delta * 8);
        }
      });

      // 쓰레기 청소 시 쓰레기통으로 비행 애니메이션
      trashItems.forEach((t) => {
        if (t.cleaned && t.mesh.scale.x > 0.01) {
          t.mesh.position.x = THREE.MathUtils.lerp(t.mesh.position.x, -5.5, delta * 8);
          t.mesh.position.z = THREE.MathUtils.lerp(t.mesh.position.z, -4.5, delta * 8);
          t.mesh.position.y += delta * 3;
          t.mesh.scale.multiplyScalar(0.88);
          if (t.mesh.scale.x <= 0.02) {
            t.mesh.visible = false;
          }
        }
      });

      // 스파클 감쇠
      if ((sparkleMat as THREE.PointsMaterial).opacity > 0) {
        (sparkleMat as THREE.PointsMaterial).opacity -= delta * 1.5;
      }

      // 승리 시 콘페티 낙하 & 360도 교실 회전
      if (ctrl.cleanedTasks >= ctrl.totalTaskCount) {
        ctrl.targetTheta += delta * 0.4; // 부드러운 쇼케이스 자동 회전
        (confettiMat as THREE.PointsMaterial).opacity = 0.9;
        const pos = confettiGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < confettiCount; i++) {
          pos[i * 3 + 1] += confettiVel[i * 3 + 1] * delta;
          if (pos[i * 3 + 1] < 0.1) {
            pos[i * 3 + 1] = 4.5;
          }
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

  // 스파클 발생 헬퍼
  const spawnSparkleAt = (x: number, y: number, z: number) => {
    if (!threeRef.current) return;
    const { sparkles, sparkleGeo } = threeRef.current;
    const pos = sparkleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 1.2;
      pos[i * 3 + 1] = y + Math.random() * 0.8;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 1.2;
    }
    sparkleGeo.attributes.position.needsUpdate = true;
    (sparkles.material as THREE.PointsMaterial).opacity = 1.0;
  };

  // 쓰레기 청소 액션
  const cleanTrash = (trashId: number) => {
    if (!threeRef.current) return;
    const item = threeRef.current.trashItems.find((t) => t.id === trashId);
    if (item && !item.cleaned) {
      item.cleaned = true;
      controlRef.current.cleanedTasks += 1;
      spawnSparkleAt(item.mesh.position.x, 0.5, item.mesh.position.z);
      triggerHaptic(40);
      setStatusMessage(`✨ ${item.name}을(를) 수거했습니다!`);
      evaluateProgress();
    }
  };

  // 책상 정렬 액션
  const alignDesk = (deskId: number) => {
    if (!threeRef.current) return;
    const desk = threeRef.current.desks.find((d) => d.id === deskId);
    if (desk && !desk.aligned) {
      desk.aligned = true;
      controlRef.current.cleanedTasks += 1;
      spawnSparkleAt(desk.group.position.x, 0.9, desk.group.position.z);
      triggerHaptic(50);
      setStatusMessage(`📐 ${deskId}번 책상을 반듯하게 정렬했습니다!`);
      evaluateProgress();
    }
  };

  // 칠판 지우기 액션
  const cleanBlackboard = () => {
    if (!threeRef.current || controlRef.current.isBoardCleaned) return;
    controlRef.current.isBoardCleaned = true;
    controlRef.current.cleanedTasks += 1;
    threeRef.current.blackboardMat.map = threeRef.current.blackboardCleanTexture;
    threeRef.current.blackboardMat.needsUpdate = true;
    spawnSparkleAt(0, 2.3, -5.9);
    triggerHaptic(60);
    setStatusMessage('✨ 칠판 분필 낙서를 말끔히 지웠습니다!');
    evaluateProgress();
  };

  // 바닥 얼룩 닦기 액션
  const cleanStain = (stainId: number) => {
    if (!threeRef.current) return;
    const stain = threeRef.current.stains.find((s) => s.id === stainId);
    if (stain && !stain.cleaned) {
      stain.cleaned = true;
      stain.mesh.visible = false;
      controlRef.current.cleanedTasks += 1;
      spawnSparkleAt(stain.mesh.position.x, 0.2, stain.mesh.position.z);
      triggerHaptic(50);
      setStatusMessage('🧽 대걸레로 바닥 얼룩을 깨끗하게 닦았습니다!');
      evaluateProgress();
    }
  };

  // 다음 미완료 작업 원터치 자동 청소 ([🧹 AUTO CLEAN])
  const handleAutoCleanNext = () => {
    if (!threeRef.current) return;

    // 1. 쓰레기 우선
    const nextTrash = threeRef.current.trashItems.find((t) => !t.cleaned);
    if (nextTrash) {
      cleanTrash(nextTrash.id);
      return;
    }

    // 2. 비뚤어진 책상
    const nextDesk = threeRef.current.desks.find((d) => !d.aligned);
    if (nextDesk) {
      alignDesk(nextDesk.id);
      return;
    }

    // 3. 칠판
    if (!controlRef.current.isBoardCleaned) {
      cleanBlackboard();
      return;
    }

    // 4. 바닥 얼룩
    const nextStain = threeRef.current.stains.find((s) => !s.cleaned);
    if (nextStain) {
      cleanStain(nextStain.id);
      return;
    }
  };

  // 3D 터치 레이캐스팅 클릭
  const handlePointerDown = (e: React.PointerEvent) => {
    controlRef.current.isDragging = true;
    controlRef.current.prevX = e.clientX;
    controlRef.current.prevY = e.clientY;

    if (!threeRef.current || !mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, threeRef.current.camera);

    const intersects = raycaster.intersectObjects(threeRef.current.scene.children, true);
    if (intersects.length > 0) {
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== threeRef.current.scene) {
          if (cur.userData?.type === 'trash') {
            cleanTrash(cur.userData.id);
            return;
          }
          if (cur.userData?.type === 'desk') {
            alignDesk(cur.userData.id);
            return;
          }
          if (cur.userData?.type === 'blackboard') {
            cleanBlackboard();
            return;
          }
          if (cur.userData?.type === 'stain') {
            cleanStain(cur.userData.id);
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

    // 화면 기준 궤도 회전 (Screen-relative 완벽 일치)
    controlRef.current.targetTheta -= dx * 0.007;
    controlRef.current.targetPhi = THREE.MathUtils.clamp(
      controlRef.current.targetPhi + dy * 0.006,
      Math.PI / 8,
      Math.PI / 2.3
    );
  };

  const handlePointerUp = () => {
    controlRef.current.isDragging = false;
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 text-slate-100 font-mono flex flex-col"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Three.js 3D 뷰포트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미니멀 HUD */}
      <MinimalistMissionHUD
        gameTitle="SCHOOL CLEANING 3D"
        onQuit={handleExit}
        progressPercent={cleanProgress}
        customScore={cleanedCount}
        scoreLabel="TASKS"
        rewardPreview={35}
      />

      {/* 상태 알림 토스트 배너 */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-center pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-amber-400/50 px-4 py-2 rounded-sm text-center shadow-lg max-w-sm">
          <div className="text-[11px] text-amber-300 font-bold tracking-wide">{statusMessage}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            화면을 드래그해 교실을 둘러보고 터치하여 청소하세요 ({cleanedCount}/{totalTasks})
          </div>
        </div>
      </div>

      {/* 게임 시작 안내 오버레이 (최초) */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-xs text-emerald-400 font-bold tracking-widest uppercase mb-1">
              [POKI POPULAR 110: NO.087]
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              SCHOOL CLEANING 3D
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              지저분해진 3D 교실을 깨끗하게 정리정돈하세요! 바닥의 쓰레기를 줍고, 삐뚤어진 책상을 정렬하며, 칠판과 바닥을 반짝이게 닦아주세요.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 p-3 mb-6 rounded-sm text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <span>[✦] 공식 배지:</span> No.087 교실 전면 황금 액자 장착
              </div>
              <div className="flex items-center gap-2">
                <span>[🥤] 바닥 쓰레기:</span> 캔, 종이, 우유팩 터치 수거 (5개)
              </div>
              <div className="flex items-center gap-2">
                <span>[📐] 어질러진 책상:</span> 삐뚤어진 책상 터치 정렬 (3개)
              </div>
              <div className="flex items-center gap-2">
                <span>[✨] 칠판 & 얼룩:</span> 분필 낙서 및 바닥 얼룩 터치 세척 (2개)
              </div>
            </div>

            <button
              onClick={() => {
                setGameState('cleaning');
                triggerHaptic(50);
              }}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-black text-lg rounded-sm tracking-wider uppercase shadow-lg transition-transform active:scale-95"
            >
              START CLEANING 🧹
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
          title="CLASSROOM 100% CLEAN!"
          subtitle="교실이 완벽하게 깨끗하고 쾌적해졌습니다!"
        />
      )}

      {/* 하단 모바일 터치 컨트롤 바 */}
      {gameState === 'cleaning' && (
        <div className="mt-auto z-30 pb-6 px-4 flex items-center justify-between pointer-events-auto">
          {/* 좌측: 청소 퀘스트 가이드 버튼 */}
          <button
            onClick={() => {
              triggerHaptic(20);
              setStatusMessage('쓰레기 5개, 책상 3개, 칠판, 바닥 얼룩을 모두 완료하세요!');
            }}
            className="bg-slate-900/90 active:bg-slate-800 border border-slate-700 px-3.5 py-3 rounded-sm text-xs font-bold text-slate-200 flex items-center gap-2 shadow-lg"
          >
            <span>📋</span>
            <span>QUEST ({cleanedCount}/{totalTasks})</span>
          </button>

          {/* 우측: 76px [🧹 AUTO CLEAN] 대형 원터치 청소 버튼 */}
          <button
            onClick={handleAutoCleanNext}
            className="h-16 px-6 bg-emerald-500 active:bg-emerald-600 border border-emerald-300 text-black font-black text-sm rounded-sm flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95"
          >
            <span className="text-xl">🧹</span>
            <span>AUTO CLEAN</span>
          </button>
        </div>
      )}
    </div>
  );
}

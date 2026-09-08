import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiScaryTeacher3DGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface PrankObject {
  id: number;
  name: string;
  room: string;
  x: number;
  z: number;
  completed: boolean;
  mesh: THREE.Group;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export default function PokiScaryTeacher3DGame({
  onBack,
  onClose,
  cardId = 80,
  onExit
}: PokiScaryTeacher3DGameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'caught' | 'victory'>('ready');
  const [pranksCompleted, setPranksCompleted] = useState<number>(0);
  const [alertLevel, setAlertLevel] = useState<number>(0);
  const [isHiding, setIsHiding] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [nearbyPrank, setNearbyPrank] = useState<PrankObject | null>(null);
  const [canHide, setCanHide] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // 3D 내부 참조 Ref
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 플레이어 (닉)
    playerGroup: null as THREE.Group | null,
    playerPos: new THREE.Vector3(0, 0.5, 9),
    playerVelocity: new THREE.Vector3(),
    playerRotY: 0,
    isHiding: false,
    isRunning: false,
    legs: [] as THREE.Mesh[],

    // 미스 티 (Miss T)
    teacherGroup: null as THREE.Group | null,
    teacherPos: new THREE.Vector3(-6, 0.7, -4),
    teacherVelocity: new THREE.Vector3(),
    teacherRotY: 0,
    visionCone: null as THREE.Mesh | null,
    visionMaterial: null as THREE.MeshBasicMaterial | null,
    alertMeter: 0, // 0~100
    isChasing: false,
    patrolIndex: 0,
    patrolPoints: [
      new THREE.Vector3(-7, 0.7, -5), // 주방
      new THREE.Vector3(0, 0.7, -2),  // 중앙 홀
      new THREE.Vector3(7, 0.7, -5),  // 거실
      new THREE.Vector3(5, 0.7, 4),   // 서재
      new THREE.Vector3(-3, 0.7, 3),  // 복도
    ],

    // 장난 스팟 & 옷장
    pranks: [] as PrankObject[],
    closetPositions: [new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0)],
    particles: [] as Particle[],
    particleGeo: new THREE.SphereGeometry(0.08, 6, 6),

    // 조이스틱
    joystickActive: false,
    touchStart: { x: 0, y: 0 },
    touchCurrent: { x: 0, y: 0 },
    moveDir: { x: 0, z: 0 },

    // 통계
    pranksDone: 0,
    startTime: Date.now(),
  });

  // 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing' || stateRef.current.isHiding) return;
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
  const spawnParticles = (pos: THREE.Vector3, colorHex: number, count: number, speed: number = 2) => {
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

  // 장난 실행 (PRANK!)
  const triggerPrank = () => {
    if (gameState !== 'playing' || stateRef.current.isHiding) return;
    const s = stateRef.current;
    if (!nearbyPrank || nearbyPrank.completed) return;

    nearbyPrank.completed = true;
    s.pranksDone += 1;
    setPranksCompleted(s.pranksDone);

    // 파티클 및 햅틱
    const worldPos = new THREE.Vector3();
    nearbyPrank.mesh.getWorldPosition(worldPos);
    spawnParticles(worldPos.add(new THREE.Vector3(0, 0.8, 0)), 0xfacc15, 25, 3.5);

    if (navigator.vibrate) navigator.vibrate([40, 50, 40, 80]);

    setAlertMessage(`[${nearbyPrank.name}] 장난 대성공!`);
    setTimeout(() => setAlertMessage(null), 2000);

    // 3개 모두 완료 시 탈출 게이트 오픈 안내
    if (s.pranksDone >= 3) {
      setAlertMessage('모든 장난 완료! 현관 정문으로 탈출하세요!');
    }
  };

  // 은신 토글 (HIDE)
  const toggleHide = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    if (s.isHiding) {
      // 은신 해제
      s.isHiding = false;
      setIsHiding(false);
      if (s.playerGroup) s.playerGroup.visible = true;
      if (navigator.vibrate) navigator.vibrate(20);
    } else if (canHide) {
      // 은신
      s.isHiding = true;
      setIsHiding(true);
      if (s.playerGroup) s.playerGroup.visible = false;
      if (navigator.vibrate) navigator.vibrate([30, 40]);
      setAlertMessage('옷장 속에 숨었습니다! (완전 은신)');
      setTimeout(() => setAlertMessage(null), 1500);
    }
  };

  // 달리기 / 살금살금 모드 토글 (SNEAK / RUN)
  const toggleRun = () => {
    const s = stateRef.current;
    s.isRunning = !s.isRunning;
    setIsRunning(s.isRunning);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // 체포(Caught) 처리
  const handleCaught = () => {
    setGameState('caught');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'scary-teacher-3d',
      gameTitle: '무서운 선생님 3D (Scary Teacher 3D)',
      isVictory: false,
      score: s.pranksDone * 250,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 탈출 승리(Victory) 처리
  const handleVictory = () => {
    setGameState('victory');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'scary-teacher-3d',
      gameTitle: '무서운 선생님 3D (Scary Teacher 3D)',
      isVictory: true,
      score: 1000,
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
      gameId: 'scary-teacher-3d',
      gameTitle: '무서운 선생님 3D (Scary Teacher 3D)',
      isVictory: false,
      score: s.pranksDone * 200,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    handleExit();
  };

  // 재도전
  const restartGame = () => {
    const s = stateRef.current;
    s.pranksDone = 0;
    s.alertMeter = 0;
    s.isChasing = false;
    s.isHiding = false;
    s.isRunning = false;
    s.playerPos.set(0, 0.5, 9);
    s.playerVelocity.set(0, 0, 0);
    s.teacherPos.set(-6, 0.7, -4);
    s.teacherVelocity.set(0, 0, 0);
    s.patrolIndex = 0;
    s.startTime = Date.now();

    s.pranks.forEach((p) => (p.completed = false));
    setPranksCompleted(0);
    setAlertLevel(0);
    setIsHiding(false);
    setIsRunning(false);
    setRewardReceipt(null);
    if (s.playerGroup) s.playerGroup.visible = true;
    setGameState('playing');
  };

  // Three.js 환경 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);
    stateRef.current.scene = scene;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
    camera.position.set(0, 9, 14);
    camera.lookAt(0, 0.5, 4);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(10, 18, 12);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3D 대저택 바닥 (30x24m 타일/카펫)
    const floorGeo = new THREE.PlaneGeometry(28, 22);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 중앙 로비 럭셔리 레드 카펫 & No.080 공식 영웅 배지
    const carpetCanvas = document.createElement('canvas');
    carpetCanvas.width = 256;
    carpetCanvas.height = 256;
    const carpetCtx = carpetCanvas.getContext('2d');
    if (carpetCtx) {
      drawCardSprite(carpetCtx, cardId, 0, 0, 256, 256);
      const carpetTex = new THREE.CanvasTexture(carpetCanvas);
      const carpetMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({ map: carpetTex, transparent: true, opacity: 0.9 })
      );
      carpetMesh.rotation.x = -Math.PI / 2;
      carpetMesh.position.set(0, 0.02, 0);
      scene.add(carpetMesh);
    }

    // 외벽 벽체 (대저택 방 구조)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    // 북쪽 벽
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(28, 2.5, 0.5), wallMat);
    northWall.position.set(0, 1.25, -11);
    scene.add(northWall);
    // 남쪽 벽 (중앙 현관 문 틈 4m 제외)
    const southWallL = new THREE.Mesh(new THREE.BoxGeometry(11, 2.5, 0.5), wallMat);
    southWallL.position.set(-8.5, 1.25, 11);
    scene.add(southWallL);
    const southWallR = new THREE.Mesh(new THREE.BoxGeometry(11, 2.5, 0.5), wallMat);
    southWallR.position.set(8.5, 1.25, 11);
    scene.add(southWallR);
    // 동서 외벽
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.5, 22), wallMat);
    eastWall.position.set(14, 1.25, 0);
    scene.add(eastWall);
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.5, 22), wallMat);
    westWall.position.set(-14, 1.25, 0);
    scene.add(westWall);

    // 탈출 골든 게이트 마커 (남쪽 z=10.5, x=0)
    const gateGeo = new THREE.BoxGeometry(4, 0.1, 1.5);
    const gateMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.6 });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, 0.05, 10.5);
    scene.add(gateMesh);

    // 은신용 대형 옷장 2기
    stateRef.current.closetPositions.forEach((pos) => {
      const closet = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 2.2, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      closet.position.set(pos.x, 1.1, pos.z);
      scene.add(closet);
    });

    // --- 3종 장난 스팟 오브젝트 생성 ---
    const pranks: PrankObject[] = [];

    // 장난 1: 주방 칠리 시리얼 (x=-9, z=-5)
    const p1Group = new THREE.Group();
    const table1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.4), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    table1.position.y = 0.4;
    p1Group.add(table1);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    bowl.position.set(0, 0.9, 0);
    p1Group.add(bowl);
    p1Group.position.set(-9, 0, -5);
    scene.add(p1Group);
    pranks.push({ id: 1, name: '시리얼에 매운 칠리 소스 붓기', room: '주방', x: -9, z: -5, completed: false, mesh: p1Group });

    // 장난 2: 거실 소파 방귀쿠션 (x=9, z=-5)
    const p2Group = new THREE.Group();
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.5), new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
    sofa.position.y = 0.4;
    p2Group.add(sofa);
    const cushion = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    cushion.position.set(0, 0.9, 0);
    p2Group.add(cushion);
    p2Group.position.set(9, 0, -5);
    scene.add(p2Group);
    pranks.push({ id: 2, name: '소파에 대형 방귀 쿠션 장착', room: '거실', x: 9, z: -5, completed: false, mesh: p2Group });

    // 장난 3: 서재 TV 고장내기 (x=8, z=4)
    const p3Group = new THREE.Group();
    const tvStand = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.7, 0.8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    tvStand.position.y = 0.35;
    p3Group.add(tvStand);
    const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    tvScreen.position.set(0, 1.3, 0);
    p3Group.add(tvScreen);
    p3Group.position.set(8, 0, 4);
    scene.add(p3Group);
    pranks.push({ id: 3, name: '미스 티 TV 화면 페인트 낙서', room: '서재', x: 8, z: 4, completed: false, mesh: p3Group });

    stateRef.current.pranks = pranks;

    // --- 플레이어 스틱맨 (닉) 모델링 ---
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x0284c7 })); // 블루 후드티
    pBody.position.y = 0.4;
    playerGroup.add(pBody);

    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    pHead.position.y = 1.0;
    playerGroup.add(pHead);

    const pLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    pLegL.position.set(-0.16, -0.1, 0);
    playerGroup.add(pLegL);
    const pLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    pLegR.position.set(0.16, -0.1, 0);
    playerGroup.add(pLegR);
    stateRef.current.legs = [pLegL, pLegR];

    // 백팩 (No.080 공식 영웅 배지)
    if (carpetCtx) {
      const badgeTex = new THREE.CanvasTexture(carpetCanvas);
      const backpack = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.3),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })
      );
      backpack.position.set(0, 0.45, -0.28);
      backpack.rotation.y = Math.PI;
      playerGroup.add(backpack);
    }

    playerGroup.position.copy(stateRef.current.playerPos);
    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;

    // --- 미스 티 (Miss T) 모델링 ---
    const teacherGroup = new THREE.Group();
    // 거대한 핑크 드레스 바디
    const tBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.75, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.4 })
    );
    tBody.position.y = 0.6;
    teacherGroup.add(tBody);

    // 머리 & 보라색 롤러 파마
    const tHead = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
    tHead.position.y = 1.4;
    teacherGroup.add(tHead);

    const hairGeo = new THREE.TorusGeometry(0.38, 0.14, 8, 16);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x9333ea });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.rotation.x = Math.PI / 2;
    hair.position.y = 1.5;
    teacherGroup.add(hair);

    // 돋보기 안경
    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.12, 0.15),
      new THREE.MeshBasicMaterial({ color: 0x18181b })
    );
    glasses.position.set(0, 1.42, 0.32);
    teacherGroup.add(glasses);

    // 8m 70도 부채꼴 시야각 (Vision Cone) 메쉬
    const coneGeo = new THREE.ConeGeometry(5.5, 8.0, 16, 1, false, -Math.PI / 5, (Math.PI * 2) / 5);
    coneGeo.rotateX(Math.PI / 2);
    const visionMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const visionCone = new THREE.Mesh(coneGeo, visionMat);
    visionCone.position.set(0, 0.2, 4.0);
    teacherGroup.add(visionCone);
    stateRef.current.visionCone = visionCone;
    stateRef.current.visionMaterial = visionMat;

    teacherGroup.position.copy(stateRef.current.teacherPos);
    scene.add(teacherGroup);
    stateRef.current.teacherGroup = teacherGroup;

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
      if (gameState === 'playing' && !s.isHiding) {
        const isMoving = s.moveDir.x !== 0 || s.moveDir.z !== 0;
        if (isMoving) {
          const speed = s.isRunning ? 6.5 : 3.8;
          s.playerPos.x += s.moveDir.x * speed * dt;
          s.playerPos.z += s.moveDir.z * speed * dt;

          const targetAngle = Math.atan2(s.moveDir.x, s.moveDir.z);
          s.playerRotY = targetAngle;

          // 보행 애니메이션
          if (s.legs.length === 2) {
            s.legs[0].rotation.x = Math.sin(time * (s.isRunning ? 18 : 12)) * 0.6;
            s.legs[1].rotation.x = -Math.sin(time * (s.isRunning ? 18 : 12)) * 0.6;
          }

          // 뛰면 소음 발생 -> alertMeter 서서히 상승
          if (s.isRunning) {
            s.alertMeter = Math.min(100, s.alertMeter + 10 * dt);
          }
        } else if (s.legs.length === 2) {
          s.legs[0].rotation.x = 0;
          s.legs[1].rotation.x = 0;
        }

        // 이동 경계 제한 (x: -13~13, z: -10~10)
        s.playerPos.x = Math.max(-13, Math.min(13, s.playerPos.x));
        s.playerPos.z = Math.max(-10, Math.min(10, s.playerPos.z));

        if (s.playerGroup) {
          s.playerGroup.position.copy(s.playerPos);
          s.playerGroup.rotation.y = s.playerRotY;
        }

        // 탈출 판정 (3개 장난 완료 후 현관 도달)
        if (s.pranksDone >= 3 && s.playerPos.z >= 9.8 && Math.abs(s.playerPos.x) < 2.5) {
          handleVictory();
        }
      }

      // 근처 장난 스팟 감지
      let foundNearPrank: PrankObject | null = null;
      for (const prank of s.pranks) {
        if (!prank.completed) {
          const dist = s.playerPos.distanceTo(new THREE.Vector3(prank.x, 0.5, prank.z));
          if (dist < 2.5) {
            foundNearPrank = prank;
            break;
          }
        }
      }
      setNearbyPrank(foundNearPrank);

      // 근처 옷장 감지
      let nearCloset = false;
      for (const closetPos of s.closetPositions) {
        if (s.playerPos.distanceTo(closetPos) < 2.2) {
          nearCloset = true;
          break;
        }
      }
      setCanHide(nearCloset);

      // --- 미스 티 AI 순찰 & 추격 로직 ---
      if (gameState === 'playing') {
        const toPlayer = s.playerPos.clone().sub(s.teacherPos);
        const distToPlayer = toPlayer.length();

        // 시야각 체크 (전방 벡터와 플레이어 벡터 사이 각도)
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.teacherRotY);
        const dot = toPlayer.clone().normalize().dot(forward);
        const inSight = !s.isHiding && distToPlayer < 8.0 && dot > 0.65;

        if (inSight) {
          s.alertMeter = Math.min(100, s.alertMeter + 45 * dt);
          if (s.alertMeter >= 60) s.isChasing = true;
        } else {
          s.alertMeter = Math.max(0, s.alertMeter - 12 * dt);
          if (s.alertMeter <= 10) s.isChasing = false;
        }
        setAlertLevel(Math.floor(s.alertMeter));

        // 시야각 비주얼 색상 변경 (경보 시 붉은색)
        if (s.visionMaterial) {
          if (s.isChasing) {
            s.visionMaterial.color.setHex(0xef4444);
            s.visionMaterial.opacity = 0.4;
          } else {
            s.visionMaterial.color.setHex(0xfef08a);
            s.visionMaterial.opacity = 0.2;
          }
        }

        // 이동 목표 지점 설정 (추격 vs 순찰)
        let targetPos = s.patrolPoints[s.patrolIndex];
        if (s.isChasing && !s.isHiding) {
          targetPos = s.playerPos;
        }

        const moveVec = targetPos.clone().sub(s.teacherPos);
        const distToTarget = moveVec.length();

        if (distToTarget > 0.5) {
          const teacherSpeed = s.isChasing ? 5.2 : 2.5;
          const moveDir = moveVec.clone().normalize();
          s.teacherPos.x += moveDir.x * teacherSpeed * dt;
          s.teacherPos.z += moveDir.z * teacherSpeed * dt;

          s.teacherRotY = Math.atan2(moveDir.x, moveDir.z);
        } else if (!s.isChasing) {
          // 다음 순찰 포인트로 전환
          s.patrolIndex = (s.patrolIndex + 1) % s.patrolPoints.length;
        }

        if (s.teacherGroup) {
          s.teacherGroup.position.copy(s.teacherPos);
          s.teacherGroup.rotation.y = s.teacherRotY;
        }

        // 플레이어 체포 판정
        if (!s.isHiding && distToPlayer < 1.3) {
          handleCaught();
        }
      }

      // 파티클
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

      // 스무스 카메라 추적
      const targetCamX = s.playerPos.x * 0.4;
      const targetCamZ = s.playerPos.z + 8.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;
      camera.position.y = 8.5;
      camera.lookAt(s.playerPos.x, 0.6, s.playerPos.z);

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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="SCARY TEACHER 3D"
        scoreDisplay={`PRANKS: ${pranksCompleted}/3 | ALERT: ${alertLevel}%`}
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 경보 게이지 바 & 알림 배너 */}
      <div className="absolute top-16 left-4 right-4 flex flex-col items-center pointer-events-none z-10 gap-1.5">
        <div className="w-full max-w-sm bg-black/60 backdrop-blur-md p-1.5 border border-slate-700 rounded-sm">
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className={alertLevel > 50 ? 'text-red-400 animate-pulse' : 'text-slate-300'}>
              MISS T SIGHT / ALERT
            </span>
            <span className={alertLevel > 50 ? 'text-red-400' : 'text-slate-400'}>{alertLevel}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                alertLevel > 50 ? 'bg-red-500' : 'bg-yellow-400'
              }`}
              style={{ width: `${alertLevel}%` }}
            />
          </div>
        </div>

        {alertMessage && (
          <div className="bg-amber-400 text-black font-black px-4 py-1 rounded-full text-xs shadow-xl animate-bounce">
            {alertMessage}
          </div>
        )}
      </div>

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
        <div className="absolute right-4 bottom-6 flex flex-col items-end gap-3 pointer-events-auto z-20 select-none">
          <div className="flex gap-2.5 items-center">
            {/* 은신 버튼 (HIDE) */}
            <button
              onClick={toggleHide}
              disabled={!canHide && !isHiding}
              className={`w-16 h-16 rounded-full font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 ${
                isHiding
                  ? 'bg-emerald-500 text-black border-emerald-200 animate-pulse'
                  : canHide
                  ? 'bg-gradient-to-b from-indigo-500 to-purple-600 text-white border-indigo-200'
                  : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
              }`}
            >
              <span>{isHiding ? 'EXIT' : 'HIDE'}</span>
              <span className="text-[9px]">{isHiding ? '나오기' : '옷장숨기'}</span>
            </button>

            {/* 달리기 / 살금살금 모드 토글 */}
            <button
              onClick={toggleRun}
              className={`w-16 h-16 rounded-full font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 ${
                isRunning
                  ? 'bg-gradient-to-b from-rose-500 to-red-600 text-white border-rose-300 animate-pulse'
                  : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200 border-slate-600'
              }`}
            >
              <span>{isRunning ? 'RUN' : 'SNEAK'}</span>
              <span className="text-[9px]">{isRunning ? '전력질주' : '살금살금'}</span>
            </button>
          </div>

          {/* 76px 장난 실행 대형 버튼 */}
          <button
            onClick={triggerPrank}
            disabled={!nearbyPrank}
            className={`w-[76px] h-[76px] rounded-full text-black font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white ${
              nearbyPrank
                ? 'bg-gradient-to-b from-amber-300 to-yellow-500 animate-bounce'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-400 border-slate-600 opacity-70'
            }`}
          >
            <span>PRANK!</span>
            <span className="text-[9px] font-bold">{nearbyPrank ? '장난치기' : '접근필요'}</span>
          </button>
        </div>
      )}

      {/* 시작(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-pink-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-pink-400 mb-2">SCARY TEACHER 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              무서운 미스 티의 대저택에 잠입했습니다!
              <br />
              <span className="text-yellow-400">주방, 거실, 서재</span>에 3종 장난을 설치하고,
              <br />
              미스 티의 시야를 피해 <span className="text-indigo-300 font-bold">[HIDE]</span> 옷장에 숨으세요!
              <br />
              모든 장난을 마치고 <span className="text-emerald-400 font-bold">현관 정문</span>으로 탈출하세요!
            </p>
            <button
              onClick={() => setGameState('playing')}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ 잠입 시작하기! ]
            </button>
          </div>
        </div>
      )}

      {/* 체포(Caught) 모달 */}
      {gameState === 'caught' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-red-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-red-500 mb-2">CAUGHT!</h2>
            <p className="text-xs text-slate-300 mb-4">
              미스 티에게 현장에서 발각되었습니다!
              <br />
              완료한 장난: {pranksCompleted} / 3
            </p>
            <div className="flex gap-2">
              <button
                onClick={restartGame}
                className="flex-1 py-3 bg-amber-500 text-black font-black text-sm rounded-sm active:scale-95"
              >
                [ 다시 잠입 ]
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
            <h3 className="text-lg font-bold text-white mb-2">잠입을 포기할까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지 완료한 장난에 따라 SNS 보상이 안전하게 정산됩니다.
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

export { PokiScaryTeacher3DGame };

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDogsLifeGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface BoneSpot {
  id: number;
  x: number;
  z: number;
  dug: boolean;
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

export default function PokiDogsLifeGame({
  onBack,
  onClose,
  cardId = 78,
}: PokiDogsLifeGameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory'>('ready');
  const [bonesDug, setBonesDug] = useState(0);
  const [happinessScore, setHappinessScore] = useState(0);
  const [nearbyDigSpot, setNearbyDigSpot] = useState<number | null>(null);
  const [barkMessage, setBarkMessage] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 내부 3D 상태 Ref
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 강아지
    dogGroup: null as THREE.Group | null,
    dogPos: new THREE.Vector3(0, 0.4, 0),
    dogVelocity: new THREE.Vector3(),
    dogRotY: 0,
    tailMesh: null as THREE.Mesh | null,
    legs: [] as THREE.Mesh[],
    isDigging: false,
    digTimer: 0,
    isSprinting: false,
    sniffActive: false,
    sniffTimer: 0,

    // 장난감 공
    toyBall: null as THREE.Mesh | null,
    ballPos: new THREE.Vector3(2, 0.3, 3),
    ballVelocity: new THREE.Vector3(),

    // 뼈다귀 스팟
    spots: [] as BoneSpot[],
    particles: [] as Particle[],
    particleGeo: new THREE.SphereGeometry(0.08, 6, 6),

    // 조이스틱
    joystickActive: false,
    touchStart: { x: 0, y: 0 },
    touchCurrent: { x: 0, y: 0 },
    moveDir: { x: 0, z: 0 },

    // 통계
    bonesCount: 0,
    happiness: 0,
    barksCount: 0,
    startTime: Date.now(),
  });

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

  // 땅 파기 (DIG)
  const triggerDig = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    if (s.isDigging) return;

    s.isDigging = true;
    s.digTimer = 1.0;
    if (navigator.vibrate) navigator.vibrate(60);

    // 근처 뼈다귀 스팟 체크
    let foundSpot: BoneSpot | null = null;
    for (const spot of s.spots) {
      if (!spot.dug) {
        const dist = s.dogPos.distanceTo(new THREE.Vector3(spot.x, 0.4, spot.z));
        if (dist < 2.5) {
          foundSpot = spot;
          break;
        }
      }
    }

    // 흙 파기 파티클
    spawnParticles(s.dogPos.clone().add(new THREE.Vector3(0, 0.2, 0.4)), 0x854d0e, 15, 3);

    if (foundSpot) {
      foundSpot.dug = true;
      s.bonesCount += 1;
      s.happiness += 20;
      setBonesDug(s.bonesCount);
      setHappinessScore(s.happiness);

      // 뼈다귀 팝업 애니메이션
      foundSpot.mesh.position.y += 0.8;
      spawnParticles(foundSpot.mesh.position, 0xfacc15, 25, 4);

      if (navigator.vibrate) navigator.vibrate([40, 60, 40, 80]);

      // 5개 모두 발굴 완료 체크
      if (s.bonesCount >= 5) {
        setTimeout(() => {
          handleVictory();
        }, 1200);
      }
    }
  };

  // 짖기 (BARK)
  const triggerBark = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    s.barksCount += 1;
    s.happiness += 5;
    setHappinessScore(s.happiness);

    setBarkText("멍멍! (Woof!)");
    setTimeout(() => setBarkMessage(null), 1200);

    if (navigator.vibrate) navigator.vibrate(30);

    // 음파 파티클 방출
    spawnParticles(s.dogPos.clone().add(new THREE.Vector3(0, 0.8, 0.5)), 0x38bdf8, 12, 3);

    // 장난감 공 튀기기 상호작용
    const distToBall = s.dogPos.distanceTo(s.ballPos);
    if (distToBall < 3.5) {
      const dir = s.ballPos.clone().sub(s.dogPos).normalize();
      s.ballVelocity.add(dir.multiplyScalar(6));
      s.ballVelocity.y = 3;
      spawnParticles(s.ballPos.clone(), 0xf43f5e, 10, 2);
    }
  };

  const setBarkText = (text: string) => {
    setBarkMessage(text);
  };

  // 냄새 추적 (SNIFF)
  const triggerSniff = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    s.sniffActive = true;
    s.sniffTimer = 3.0;

    if (navigator.vibrate) navigator.vibrate(25);

    // 가장 가까운 미발굴 뼈다귀 찾기
    let nearest: BoneSpot | null = null;
    let minDist = 999;
    for (const spot of s.spots) {
      if (!spot.dug) {
        const dist = s.dogPos.distanceTo(new THREE.Vector3(spot.x, 0.4, spot.z));
        if (dist < minDist) {
          minDist = dist;
          nearest = spot;
        }
      }
    }

    if (nearest) {
      // 냄새 가이드 파티클 라인
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const p = new THREE.Vector3().lerpVectors(s.dogPos, new THREE.Vector3(nearest.x, 0.5, nearest.z), t);
        spawnParticles(p, 0xfacc15, 2, 0.5);
      }
    }
  };

  // 전력 질주 (SPRINT)
  const toggleSprint = () => {
    stateRef.current.isSprinting = !stateRef.current.isSprinting;
    if (navigator.vibrate) navigator.vibrate(20);
  };

  // 승리 처리
  const handleVictory = () => {
    setGameState('victory');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'dogs-life',
      gameTitle: '도그스 라이프 3D (Dog\'s Life)',
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
      gameId: 'dogs-life',
      gameTitle: '도그스 라이프 3D (Dog\'s Life)',
      isVictory: false,
      score: s.bonesCount * 180 + s.happiness * 2,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    handleExit();
  };

  // Three.js 환경 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa7f3d0); // 따뜻한 연녹색 정원 하늘
    scene.fog = new THREE.FogExp2(0xa7f3d0, 0.02);
    stateRef.current.scene = scene;

    // 카메라
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 7, 10);
    camera.lookAt(0, 0.5, 0);
    stateRef.current.camera = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    sunLight.position.set(12, 20, 15);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 3D 바닥 지형 (32x32m 원목 거실 + 잔디 정원)
    // 거실 바닥
    const floorGeo = new THREE.PlaneGeometry(16, 28);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.5 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(-8, 0, 0);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 정원 잔디 바닥
    const grassGeo = new THREE.PlaneGeometry(16, 28);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8 });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.position.set(8, 0, 0);
    grassMesh.receiveShadow = true;
    scene.add(grassMesh);

    // 거실 카펫 & No.078 카드 영웅 배지
    const carpetCanvas = document.createElement('canvas');
    carpetCanvas.width = 256;
    carpetCanvas.height = 256;
    const carpetCtx = carpetCanvas.getContext('2d');
    if (carpetCtx) {
      drawCardSprite(carpetCtx, cardId, 0, 0, 256, 256);
      const carpetTex = new THREE.CanvasTexture(carpetCanvas);
      const carpetMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 5),
        new THREE.MeshBasicMaterial({ map: carpetTex, transparent: true, opacity: 0.9 })
      );
      carpetMesh.rotation.x = -Math.PI / 2;
      carpetMesh.position.set(-6, 0.02, 0);
      scene.add(carpetMesh);
    }

    // 울타리 데코
    for (let z = -14; z <= 14; z += 3.5) {
      const fence = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1.2, 3),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
      );
      fence.position.set(16, 0.6, z);
      scene.add(fence);
    }

    // 소파 가구
    const sofaGroup = new THREE.Group();
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 1.8), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    sofaBase.position.y = 0.4;
    sofaGroup.add(sofaBase);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 0.5), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
    sofaBack.position.set(0, 1.0, -0.65);
    sofaGroup.add(sofaBack);
    sofaGroup.position.set(-11, 0, -5);
    scene.add(sofaGroup);

    // 장난감 공 (물리 인터랙션 가능)
    const ballGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
    const toyBall = new THREE.Mesh(ballGeo, ballMat);
    toyBall.position.copy(stateRef.current.ballPos);
    toyBall.castShadow = true;
    scene.add(toyBall);
    stateRef.current.toyBall = toyBall;

    // --- 5개 뼈다귀 숨은 스팟 생성 ---
    const spotCoords = [
      { id: 1, x: -10, z: 5 },  // 거실 구석
      { id: 2, x: -5, z: -8 },  // 소파 옆
      { id: 3, x: 4, z: -6 },   // 잔디 입구
      { id: 4, x: 11, z: 3 },   // 정원 화단
      { id: 5, x: 8, z: 9 },    // 울타리 근처
    ];

    const spots: BoneSpot[] = [];
    spotCoords.forEach((coord) => {
      const spotGroup = new THREE.Group();

      // 흙더미 베이스
      const mound = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 1.0, 0.25, 12),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      mound.position.y = 0.12;
      spotGroup.add(mound);

      // 황금 뼈다귀 (발굴 시 튀어나옴)
      const boneGroup = new THREE.Group();
      const boneShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.4, roughness: 0.3 })
      );
      boneShaft.rotation.z = Math.PI / 2;
      boneGroup.add(boneShaft);

      const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });
      const h1 = new THREE.Mesh(headGeo, headMat);
      h1.position.set(-0.4, 0.1, 0);
      boneGroup.add(h1);
      const h2 = new THREE.Mesh(headGeo, headMat);
      h2.position.set(-0.4, -0.1, 0);
      boneGroup.add(h2);
      const h3 = new THREE.Mesh(headGeo, headMat);
      h3.position.set(0.4, 0.1, 0);
      boneGroup.add(h3);
      const h4 = new THREE.Mesh(headGeo, headMat);
      h4.position.set(0.4, -0.1, 0);
      boneGroup.add(h4);

      boneGroup.position.y = 0.3;
      spotGroup.add(boneGroup);

      spotGroup.position.set(coord.x, 0, coord.z);
      scene.add(spotGroup);

      spots.push({
        id: coord.id,
        x: coord.x,
        z: coord.z,
        dug: false,
        mesh: spotGroup,
      });
    });
    stateRef.current.spots = spots;

    // --- 3D 강아지 캐릭터 모델링 ---
    const dogGroup = new THREE.Group();

    // 몸통 (골든 브라운)
    const dogBodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.2), dogBodyMat);
    dogBody.position.y = 0.45;
    dogBody.castShadow = true;
    dogGroup.add(dogBody);

    // 머리
    const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), dogBodyMat);
    dogHead.position.set(0, 0.75, 0.6);
    dogGroup.add(dogHead);

    // 주둥이 & 코
    const snout = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
    );
    snout.position.set(0, 0.68, 0.95);
    dogGroup.add(snout);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x18181b })
    );
    nose.position.set(0, 0.75, 1.13);
    dogGroup.add(nose);

    // 쫑긋 귀 2개
    const earMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), earMat);
    leftEar.position.set(-0.2, 1.1, 0.55);
    leftEar.rotation.z = 0.2;
    dogGroup.add(leftEar);

    const rightEar = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), earMat);
    rightEar.position.set(0.2, 1.1, 0.55);
    rightEar.rotation.z = -0.2;
    dogGroup.add(rightEar);

    // 꼬리 (위로 올라가 흔들림)
    const tail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    tail.position.set(0, 0.7, -0.65);
    tail.rotation.x = -0.6;
    dogGroup.add(tail);
    stateRef.current.tailMesh = tail;

    // 4개 다리
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.5, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const legFL = new THREE.Mesh(legGeo, legMat);
    legFL.position.set(-0.25, 0.15, 0.4);
    dogGroup.add(legFL);
    const legFR = new THREE.Mesh(legGeo, legMat);
    legFR.position.set(0.25, 0.15, 0.4);
    dogGroup.add(legFR);
    const legBL = new THREE.Mesh(legGeo, legMat);
    legBL.position.set(-0.25, 0.15, -0.4);
    dogGroup.add(legBL);
    const legBR = new THREE.Mesh(legGeo, legMat);
    legBR.position.set(0.25, 0.15, -0.4);
    dogGroup.add(legBR);
    stateRef.current.legs = [legFL, legFR, legBL, legBR];

    // 목걸이 펜던트 (No.078 카드 영웅 배지)
    if (carpetCtx) {
      const badgeTex = new THREE.CanvasTexture(carpetCanvas);
      const pendant = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 0.25),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })
      );
      pendant.position.set(0, 0.52, 0.65);
      dogGroup.add(pendant);
    }

    dogGroup.position.copy(stateRef.current.dogPos);
    scene.add(dogGroup);
    stateRef.current.dogGroup = dogGroup;

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

      // 땅파기 타이머
      if (s.isDigging) {
        s.digTimer -= dt;
        if (s.digTimer <= 0) s.isDigging = false;
      }

      // 냄새 타이머
      if (s.sniffActive) {
        s.sniffTimer -= dt;
        if (s.sniffTimer <= 0) s.sniffActive = false;
      }

      // 강아지 이동
      const isMoving = s.moveDir.x !== 0 || s.moveDir.z !== 0;
      if (isMoving && !s.isDigging) {
        const speed = s.isSprinting ? 8.5 : 5.0;
        s.dogPos.x += s.moveDir.x * speed * dt;
        s.dogPos.z += s.moveDir.z * speed * dt;

        // 회전
        const targetAngle = Math.atan2(s.moveDir.x, s.moveDir.z);
        s.dogRotY = targetAngle;

        // 4개 다리 보행 애니메이션
        const walkFreq = s.isSprinting ? 22 : 14;
        if (s.legs.length === 4) {
          s.legs[0].rotation.x = Math.sin(time * walkFreq) * 0.5;
          s.legs[1].rotation.x = -Math.sin(time * walkFreq) * 0.5;
          s.legs[2].rotation.x = -Math.sin(time * walkFreq) * 0.5;
          s.legs[3].rotation.x = Math.sin(time * walkFreq) * 0.5;
        }

        // 흙먼지 파티클
        if (Math.random() < 0.2) {
          spawnParticles(s.dogPos.clone().add(new THREE.Vector3(0, 0.1, -0.4)), 0xa3a3a3, 1, 0.8);
        }
      } else if (s.legs.length === 4) {
        // 정지 시 다리 원위치
        s.legs.forEach((leg) => (leg.rotation.x = 0));
      }

      // 꼬리 흔들기 (항상 기분 좋음)
      if (s.tailMesh) {
        const wagSpeed = s.isSprinting ? 25 : 12;
        s.tailMesh.rotation.y = Math.sin(time * wagSpeed) * 0.6;
      }

      // 맵 경계 제한 (X: -15~15, Z: -13~13)
      s.dogPos.x = Math.max(-15, Math.min(15, s.dogPos.x));
      s.dogPos.z = Math.max(-13, Math.min(13, s.dogPos.z));

      if (s.dogGroup) {
        s.dogGroup.position.copy(s.dogPos);
        s.dogGroup.rotation.y = s.dogRotY;
      }

      // 근처 뼈다귀 스팟 감지
      let foundNear: number | null = null;
      for (const spot of s.spots) {
        if (!spot.dug) {
          const dist = s.dogPos.distanceTo(new THREE.Vector3(spot.x, 0.4, spot.z));
          if (dist < 2.5) {
            foundNear = spot.id;
            break;
          }
        }
      }
      setNearbyDigSpot(foundNear);

      // 장난감 공 물리 업데이트
      if (s.toyBall) {
        s.ballPos.add(s.ballVelocity.clone().multiplyScalar(dt));
        s.ballVelocity.x *= 0.94;
        s.ballVelocity.z *= 0.94;
        s.ballVelocity.y -= 9.8 * dt;

        if (s.ballPos.y <= 0.35) {
          s.ballPos.y = 0.35;
          if (Math.abs(s.ballVelocity.y) > 0.5) {
            s.ballVelocity.y = -s.ballVelocity.y * 0.6; // 탄성 바운스
          } else {
            s.ballVelocity.y = 0;
          }
        }

        s.toyBall.position.copy(s.ballPos);
        s.toyBall.rotation.x += s.ballVelocity.z * dt * 2;
        s.toyBall.rotation.z -= s.ballVelocity.x * dt * 2;
      }

      // 파티클 업데이트
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 4.0 * dt; // 중력
        const scale = Math.max(0.01, 1 - p.life / p.maxLife);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          s.particles.splice(i, 1);
        }
      }

      // 3.5D 스무스 카메라 추적
      const targetCamX = s.dogPos.x * 0.5;
      const targetCamZ = s.dogPos.z + 8.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;
      camera.position.y = 6.5;
      camera.lookAt(s.dogPos.x, 0.6, s.dogPos.z);

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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 통합 HUD */}
      <MinimalistMissionHUD
        title="DOG'S LIFE 3D"
        scoreDisplay={`BONES: ${bonesDug}/5 | JOY: ${happinessScore}`}
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 강아지 짖기 텍스트 말풍선 */}
      {barkMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-black px-4 py-1.5 rounded-full text-sm shadow-xl animate-bounce z-20 border-2 border-white pointer-events-none">
          {barkMessage}
        </div>
      )}

      {/* 조이스틱 시각 피드백 */}
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
            {/* 냄새 맡기 (SNIFF) */}
            <button
              onClick={triggerSniff}
              className="w-16 h-16 rounded-full bg-gradient-to-b from-sky-400 to-blue-500 text-white font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 border-sky-200"
            >
              <span>SNIFF</span>
              <span className="text-[9px]">냄새추적</span>
            </button>

            {/* 짖기 (BARK) */}
            <button
              onClick={triggerBark}
              className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 text-black font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 border-yellow-200"
            >
              <span>BARK</span>
              <span className="text-[9px]">멍멍!</span>
            </button>
          </div>

          <div className="flex gap-2.5 items-center">
            {/* 전력 질주 (SPRINT) */}
            <button
              onClick={toggleSprint}
              className={`w-16 h-16 rounded-full font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 ${
                stateRef.current.isSprinting
                  ? 'bg-gradient-to-b from-rose-500 to-red-600 text-white border-rose-300 animate-pulse'
                  : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200 border-slate-600'
              }`}
            >
              <span>SPRINT</span>
              <span className="text-[9px]">{stateRef.current.isSprinting ? 'ON' : 'OFF'}</span>
            </button>

            {/* 76px 땅 파기 (DIG) 대형 버튼 */}
            <button
              onClick={triggerDig}
              className={`w-[76px] h-[76px] rounded-full text-black font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white ${
                nearbyDigSpot !== null
                  ? 'bg-gradient-to-b from-yellow-300 to-amber-500 animate-bounce'
                  : 'bg-gradient-to-b from-amber-500 to-yellow-600 opacity-90'
              }`}
            >
              <span>DIG!</span>
              <span className="text-[10px] font-bold">{nearbyDigSpot !== null ? '발굴하기' : '땅파기'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 시작(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-amber-400 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-amber-400 mb-2">DOG'S LIFE 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              귀여운 장난꾸러기 반려견이 되어 집과 마당을 탐험하세요!
              <br />
              <span className="text-amber-300">좌측 터치 드래그</span>로 자유롭게 이동,
              <br />
              <span className="text-sky-300 font-bold">[SNIFF]</span>로 냄새를 맡고
              <br />
              <span className="text-yellow-400 font-bold">[DIG!]</span>로 숨겨진 5개의 황금 뼈다귀를 모두 찾아내세요!
            </p>
            <button
              onClick={() => setGameState('playing')}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ 산책 시작하기! ]
            </button>
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
            <h3 className="text-lg font-bold text-white mb-2">산책을 마칠까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지 찾은 뼈다귀와 행복 지수에 따라 SNS 보상이 정산됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmExit}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-sm active:scale-95"
              >
                마치기
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

export { PokiDogsLifeGame };
